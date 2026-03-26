import type { Request, Response } from 'express';
import knex from '../db/database.js';
import { openLibraryApi } from '../api/open_library.api.js';
import type { User } from "../types/express.js";
// Update the normalize helper to handle ParsedQs:
import type { ParsedQs } from 'qs';

function normalize(param: string | string[] | ParsedQs | ParsedQs[] | undefined): string {
    if (Array.isArray(param)) return typeof param[0] === 'string' ? param[0] : "";
    if (typeof param === 'object' && param !== null) return "";
    return param ?? "";
}

export const getGroups = async (req: Request, res: Response) => {
    const rawUserId = req.headers['x-user-id'];
    const userId = (rawUserId && rawUserId !== 'null' && rawUserId !== 'undefined') ? Number(rawUserId) : null;

    try {
        const groups = await knex('groups').whereNull('deleted_at').select('*');

        const memberCounts = await knex('user_groups')
            .groupBy('group_id')
            .select('group_id')
            .count('* as count');

        const bookCounts = await knex('group_books')
            .whereNull('deleted_at')
            .groupBy('group_id')
            .select('group_id')
            .count('* as count');

        let memberships: any[] = [];
        if (userId && !isNaN(userId)) {
            // Robust join with LEFT JOIN to handle broken role_permission entries
            memberships = await knex('user_groups')
                .leftJoin('role_permissions', 'user_groups.role_permission_id', 'role_permissions.id')
                .leftJoin('roles', 'role_permissions.role_id', 'roles.id')
                .where('user_groups.user_id', userId)
                .select('user_groups.group_id', 'roles.name as roleName');
        }

        const membershipMap = new Map(memberships.map(m => [m.group_id, m.roleName || 'member']));

        const enrichedGroups = groups.map(g => {
            const memberCount = memberCounts.find(mc => mc.group_id === g.id)?.count || 0;
            const bookCount = bookCounts.find(bc => bc.group_id === g.id)?.count || 0;
            const isJoined = membershipMap.has(g.id);
            let role = membershipMap.get(g.id) || null;

            if (role) {
                role = role.toLowerCase();
                if (role.includes('admin')) role = 'admin';
                else if (role.includes('member')) role = 'member';
            }

            return {
                ...g,
                memberCount: Number(memberCount),
                bookCount: Number(bookCount),
                isJoined,
                currentUserRole: role
            };
        });

        res.json({ groups: enrichedGroups });
    } catch (err: any) {
        console.error('Failed to fetch groups:', err);
        res.status(500).json({ error: 'Failed to fetch groups.' });
    }
};

export const getGroup = async (req: Request, res: Response) => {
    const id = normalize(req.params.groupId || req.params.id);

    try {
        const group = await knex('groups').where({ id }).whereNull('deleted_at').first();

        if (!group) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        const members = await knex('user_groups')
            .join('users', 'user_groups.user_id', 'users.id')
            .leftJoin('role_permissions', 'user_groups.role_permission_id', 'role_permissions.id')
            .leftJoin('roles', 'role_permissions.role_id', 'roles.id')
            .where('user_groups.group_id', id)
            .select('users.id', 'users.username', 'roles.name as role');

        const normalizedMembers = members.map(m => ({
            ...m,
            role: m.role || 'member'
        }));

        res.json({ group, members: normalizedMembers });
    } catch (err: any) {
        console.error('Failed to fetch group:', err);
        res.status(500).json({ error: 'Failed to fetch group.' });
    }
};

// ... existing code ...
export const createGroup = async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const user = req.user as User;

    try {
        const admin_role_permission = await rolePermission('admin');

        if (!admin_role_permission) {
            console.error('CRITICAL: admin role or "Manage groups" permission not found in database.');
            return res.status(500).json({ error: 'System configuration error: admin role not found.' });
        }

        const result = await knex.transaction(async (trx) => {
            const [groupId] = await trx('groups').insert({ name, description });

            await trx('user_groups').insert({
                group_id: groupId,
                user_id: user.id,
                role_permission_id: admin_role_permission.id
            });

            return groupId;
        });

        res.status(201).json({ message: 'Group created.', id: result });
    } catch (err: any) {
        console.error('Failed to create group:', err);
        res.status(500).json({ error: 'Failed to create group.' });
    }
};
// ... existing code ...

export const updateGroup = async (req: Request, res: Response) => {
    const id = normalize(req.params.groupId || req.params.id);
    const { name, description } = req.body;

    try {
        const group = await knex('groups').where({ id }).whereNull('deleted_at').first();

        if (!group) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        await knex('groups').where({ id }).update({ name, description });

        res.json({ message: 'Group updated.' });
    } catch (err: any) {
        console.error('Failed to update group:', err);
        res.status(500).json({ error: 'Failed to update group.' });
    }
};

export const deleteGroup = async (req: Request, res: Response) => {
    const id = normalize(req.params.groupId || req.params.id);

    try {
        const group = await knex('groups').where({ id }).whereNull('deleted_at').first();

        if (!group) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        await knex('groups').where({ id }).update({ deleted_at: knex.fn.now() });
        await knex('user_groups').where('group_id', id).delete();

        res.json({ message: 'Group deleted.' });
    } catch (err: any) {
        console.error('Failed to delete group:', err);
        res.status(500).json({ error: 'Failed to delete group.' });
    }
};

export const joinGroup = async (req: Request, res: Response) => {
    const groupId = normalize(req.params.groupId);
    const user = req.user as User;

    try {
        const group = await knex('groups').where({ id: groupId }).whereNull('deleted_at').first();

        if (!group) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        const existing = await knex('user_groups')
            .where({ group_id: groupId, user_id: user.id })
            .first();

        if (existing) {
            return res.status(409).json({ error: 'User is already a member of this group.' });
        }

        const role_permission = await rolePermission('member');

        if (!role_permission) {
            console.error('CRITICAL: member role or "Manage groups" permission not found in database.');
            return res.status(500).json({ error: 'System configuration error: member role not found.' });
        }

        // Regular members get manage group permission but can only add books to the group
        await knex('user_groups').insert({
            group_id: groupId,
            user_id: user.id,
            role_permission_id: role_permission.id
        });

        res.json({ message: 'Joined group.' });
    } catch (err: any) {
        console.error('Failed to join group:', err);
        res.status(500).json({ error: 'Failed to join group.' });
    }
};

export const getGroupMembers = async (req: Request, res: Response) => {
    const groupId = normalize(req.params.groupId);

    try {
        const members = await knex('user_groups')
            .join('users', 'user_groups.user_id', 'users.id')
            .leftJoin('role_permissions', 'user_groups.role_permission_id', 'role_permissions.id')
            .leftJoin('roles', 'role_permissions.role_id', 'roles.id')
            .where('user_groups.group_id', groupId)
            .select('users.id', 'users.username', 'roles.name as role');

        const normalizedMembers = members.map(m => ({
            ...m,
            role: m.role || 'member'
        }));

        res.json({ members: normalizedMembers });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch members.' });
    }
};

export const updateMember = async (req: Request, res: Response) => {
    const groupId = normalize(req.params.groupId);
    const userId = normalize(req.params.userId);
    const { role } = req.body;

    try {
        const role_permission = await rolePermission(role);

        if (!role_permission) {
            return res.status(400).json({ error: 'Invalid role.' });
        }

        await knex('user_groups')
            .where({ group_id: groupId, user_id: userId })
            .update({ role_permission_id: role_permission.id });

        res.json({ message: 'Member updated.' });
    } catch (err: any) {
        console.error('Failed to update member:', err);
        res.status(500).json({ error: 'Failed to update member.' });
    }
};

export const removeMember = async (req: Request, res: Response) => {
    const groupId = normalize(req.params.groupId);
    const userId = normalize(req.params.userId);

    try {
        const member = await knex('user_groups').where({ group_id: groupId, user_id: userId }).first();

        if (!member) {
            return res.status(404).json({ error: 'Member not found.' });
        }

        await knex('user_groups').where({ group_id: groupId, user_id: userId }).delete();

        res.json({ message: 'Member removed.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to remove member.' });
    }
};

export const getGroupBooks = async (req: Request, res: Response) => {
    const groupId = normalize(req.params.groupId);

    try {
        const entries = await knex('group_books')
            .join('users', 'group_books.user_id', 'users.id')
            .where('group_books.group_id', groupId)
            .whereNull('group_books.deleted_at')
            .select(
                'group_books.id',
                'group_books.book_id',
                'group_books.user_id',
                'users.username',
                'group_books.note',
                'group_books.created_at'
            );

        // Fetch book details from OpenLibrary for each book
        const mappedBooks = await Promise.all(
            entries.map(async (entry: any) => {
                try {
                    const work = await openLibraryApi.getWork(entry.book_id);
                    return {
                        id: entry.id,
                        groupId: groupId,
                        book: {
                            id: entry.book_id,
                            title: work.title,
                            author: typeof work.authors?.[0] === 'string' 
                                ? work.authors[0] 
                                : work.authors?.[0]?.name || work.authors?.[0]?.author?.name || 'Unknown Author',
                            cover_i: work.covers?.[0] || null,
                            first_publish_year: work.first_publish_date ? parseInt(work.first_publish_date) : null
                        },
                        addedBy: entry.username,
                        addedAt: entry.created_at,
                        note: entry.note
                    };
                } catch (e) {
                    // Fallback if OpenLibrary fails
                    return {
                        id: entry.id,
                        groupId: groupId,
                        book: {
                            id: entry.book_id,
                            title: 'Unknown Title',
                            author: 'Unknown Author',
                            cover_i: null,
                            first_publish_year: null
                        },
                        addedBy: entry.username,
                        addedAt: entry.created_at,
                        note: entry.note
                    };
                }
            })
        );

        res.json({ books: mappedBooks });
    } catch (err: any) {
        console.error('Failed to fetch group books:', err);
        res.status(500).json({ error: 'Failed to fetch group books.' });
    }
};

export const addGroupBook = async (req: Request, res: Response) => {
    const groupId = normalize(req.params.groupId);
    const { book_id, note } = req.body;
    const user = req.user as User;

    try {
        // Check membership
        const isMember = await knex('user_groups')
            .where({ group_id: groupId, user_id: user.id })
            .first();

        if (!isMember) {
            return res.status(403).json({ error: 'Only group members can add books.' });
        }

        const existing = await knex('group_books')
            .where({ group_id: groupId, book_id })
            .whereNull('deleted_at')
            .first();

        if (existing) {
            return res.status(409).json({ error: 'Book already exists in this group.' });
        }

        await knex('group_books').insert({
            group_id: groupId,
            book_id,
            user_id: user.id,
            note: note || ''
        });

        res.status(201).json({ message: 'Book added to group.' });
    } catch (err: any) {
        console.error('Failed to add book to group:', err);
        res.status(500).json({ error: 'Failed to add book to group.' });
    }
};

export const updateGroupBook = async (req: Request, res: Response) => {
    const groupId = normalize(req.params.groupId || req.params.group_id);
    const bookId = normalize(req.params.bookId || req.params.book_id);
    const { note } = req.body;
    const user = req.user as User;

    try {
        const book = await knex('group_books')
            .where({ group_id: groupId, id: bookId })
            .whereNull('deleted_at')
            .first();

        if (!book) {
            return res.status(404).json({ error: 'Book not found in this group.' });
        }

        const is_admin = await checkIsGroupAdmin(user.id, groupId);

        if (!is_admin && book.user_id !== user.id) {
            return res.status(403).json({ error: 'Forbidden. You can only update books you added.' });
        }

        await knex('group_books').where({ group_id: groupId, id: bookId }).update({ note });

        res.json({ message: 'Book updated.' });
    } catch (err: any) {
        console.error('Failed to update book:', err);
        res.status(500).json({ error: 'Failed to update book.' });
    }
};

export const deleteGroupBook = async (req: Request, res: Response) => {
    const groupId = normalize(req.params.group_id);
    const bookId = normalize(req.params.book_id);
    const user = req.user as User;

    try {
        const book = await knex('group_books')
            .where({ group_id: groupId, id: bookId })
            .whereNull('deleted_at')
            .first();

        if (!book) {
            return res.status(404).json({ error: 'Book not found in this group.' });
        }

        const is_admin = await checkIsGroupAdmin(user.id, groupId);

        if (!is_admin && book.user_id !== user.id) {
            return res.status(403).json({ error: 'Forbidden. You can only remove books you added.' });
        }

        await knex('group_books')
            .where({ group_id: groupId, id: bookId })
            .update({ deleted_at: knex.fn.now() });

        res.json({ message: 'Book removed from group.' });
    } catch (err: any) {
        console.error('Failed to remove book from group:', err);
        res.status(500).json({ error: 'Failed to remove book from group.' });
    }
};

const rolePermission = async (role: string) => {
    let result = await knex('role_permissions')
        .join('roles', 'role_permissions.role_id', 'roles.id')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .whereRaw('LOWER(roles.name) = LOWER(?)', [role])
        .where('permissions.name', 'Manage groups')
        .select('role_permissions.id')
        .first();

    // Fallback for Administrator vs admin
    if (!result && role.toLowerCase() === 'admin') {
        result = await knex('role_permissions')
            .join('roles', 'role_permissions.role_id', 'roles.id')
            .join('permissions', 'role_permissions.permission_id', 'permissions.id')
            .whereRaw('LOWER(roles.name) = ?', ['administrator'])
            .where('permissions.name', 'Manage groups')
            .select('role_permissions.id')
            .first();
    }
    return result;
};

async function checkIsGroupAdmin(userId: number, groupId: string): Promise<boolean> {
    const result = await knex('user_groups')
        .leftJoin('role_permissions', 'user_groups.role_permission_id', 'role_permissions.id')
        .leftJoin('roles', 'role_permissions.role_id', 'roles.id')
        .where('user_groups.user_id', userId)
        .where('user_groups.group_id', groupId)
        .where((builder) => {
            builder.whereRaw('LOWER(roles.name) LIKE ?', ['%admin%'])
                   .orWhereRaw('LOWER(roles.name) LIKE ?', ['%administrator%']);
        })
        .first();
    return !!result;
}
