import type { Request, Response } from 'express';
import knex from '../db/database.ts';
import type { User } from "../types/express.d.ts";

const getGroupMembersQuery = (group_id: string | number) =>
    knex('user_groups')
        .join('users', 'user_groups.user_id', 'users.id')
        .join('role_permissions', 'user_groups.role_permission_id', 'role_permissions.id')
        .join('roles', 'role_permissions.role_id', 'roles.id')
        .where('user_groups.group_id', group_id)
        .select('users.id', 'users.username', 'roles.name as role');

const getGroupBooksQuery = (group_id: string | number) =>
    knex('group_books')
        .join('books', 'group_books.book_id', 'books.id')
        .join('users', 'group_books.user_id', 'users.id')
        .where('group_books.group_id', group_id)
        .whereNull('group_books.deleted_at')
        .select('group_books.id', 'books.key', 'users.id as user_id', 'users.first_name', 'users.last_name');

export const getGroups = async (req: Request, res: Response) => {
    try {
        const groups = await knex('groups').whereNull('deleted_at');

        const enriched = await Promise.all(groups.map(async (group) => {
            const members = await getGroupMembersQuery(group.id);
            const books = await getGroupBooksQuery(group.id);
            return { ...group, members, books };
        }));

        res.json({ groups: enriched });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch groups.' });
    }
};

export const getGroup = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const group = await knex('groups').where({ id }).whereNull('deleted_at').first();

        if (!group) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        const members = await getGroupMembersQuery(id);
        const books = await getGroupBooksQuery(id);

        res.json({ group, members, books });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch group.' });
    }
};

export const createGroup = async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const user = req.user as User;

    try {
        const [id] = await knex('groups').insert({ name, description });

        const role_permission = await getRolePermission('administrator');
        await knex('user_groups').insert({
            group_id: id,
            user_id: user.id,
            role_permission_id: role_permission.id
        });

        res.status(201).json({ message: 'Group created.', id });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to create group.' });
    }
};

export const updateGroup = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        const group = await knex('groups').where({ id }).whereNull('deleted_at').first();

        if (!group) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        await knex('groups').where({ id }).update({ name, description });

        res.json({ message: 'Group updated.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to update group.' });
    }
};

export const deleteGroup = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const group = await knex('groups').where({ id }).whereNull('deleted_at').first();

        if (!group) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        await knex('groups').where({ id }).update({ deleted_at: knex.fn.now() });
        await knex('user_groups').where('group_id', id).delete();

        res.json({ message: 'Group deleted.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to delete group.' });
    }
};

export const joinGroup = async (req: Request, res: Response) => {
    const { group_id } = req.params;
    const newUser = req.body.user;
    const user = (newUser ?? req.user) as User;

    try {
        const group = await knex('groups').where({ id: group_id }).whereNull('deleted_at').first();

        if (!group) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        const existing = await knex('user_groups').where({ group_id, user_id: user.id }).first();

        if (existing) {
            return res.status(409).json({ error: 'User is already a member of this group.' });
        }

        const role_permission = await getRolePermission('member');
        await knex('user_groups').insert({
            group_id,
            user_id: user.id,
            role_permission_id: role_permission.id
        });
        const books = await getGroupBooksQuery(group_id);
        const members = await getGroupMembersQuery(group_id);

        res.json({ message: 'Joined group.', books, members });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to join group.' });
    }
};

export const getGroupMembers = async (req: Request, res: Response) => {
    const { group_id } = req.params;

    try {
        const members = await getGroupMembersQuery(group_id);
        res.json({ members });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch members.' });
    }
};

export const updateMember = async (req: Request, res: Response) => {
    const { group_id, userId } = req.params;
    const { role_permission_id } = req.body;

    try {
        const member = await knex('user_groups').where({ group_id, user_id: userId }).first();

        if (!member) {
            return res.status(404).json({ error: 'Member not found.' });
        }

        await knex('user_groups').where({ group_id, user_id: userId }).update({ role_permission_id });

        const members = await getGroupMembersQuery(group_id);
        res.json({ message: 'Member updated.', members });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to update member.' });
    }
};

export const removeMember = async (req: Request, res: Response) => {
    const { group_id, user_id } = req.params;

    try {
        const member = await knex('user_groups').where({ group_id, user_id }).first();

        if (!member) {
            return res.status(404).json({ error: 'Member not found.' });
        }

        await knex('user_groups').where({ group_id, user_id }).delete();

        const members = await getGroupMembersQuery(group_id);

        res.json({ message: 'Member removed.', members });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to remove member.' });
    }
};

export const getGroupBooks = async (req: Request, res: Response) => {
    const { group_id } = req.params;

    try {
        const books = await getGroupBooksQuery(group_id);
        res.json({ books });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch group books.' });
    }
};

export const addGroupBook = async (req: Request, res: Response) => {
    const { group_id } = req.params;
    const { book_id } = req.body;
    const user = req.user as User;

    if (!book_id) {
        return res.status(400).json({ error: 'book_id is required.' });
    }

    try {
        await knex('books').insert({ key: book_id }).onConflict('key').ignore();
        const book = await knex('books').where('key', book_id).first();

        const existing = await knex('group_books')
            .where({ group_id, book_id: book.id })
            .whereNull('deleted_at')
            .first();

        if (existing) {
            return res.status(409).json({ error: 'Book already exists in this group.' });
        }

        await knex('group_books').insert({ group_id, book_id: book.id, user_id: user.id });

        const books = await getGroupBooksQuery(group_id);
        res.status(201).json({ message: 'Book added to group.', books });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to add book to group.' });
    }
};

export const updateGroupBook = async (req: Request, res: Response) => {
    const { group_id, book_id } = req.params;
    const updates = req.body;
    const user = req.user as User;

    try {
        const book = await knex('group_books')
            .where({ group_id, id: book_id })
            .whereNull('deleted_at')
            .first();

        if (!book) {
            return res.status(404).json({ error: 'Book not found in this group.' });
        }

        const is_admin = await checkIsGroupAdmin(user.id, group_id);

        if (!is_admin && book.user_id !== user.id) {
            return res.status(403).json({ error: 'Forbidden. You can only update books you added.' });
        }

        await knex('group_books').where({ group_id, id: book_id }).update(updates);

        const books = await getGroupBooksQuery(group_id);
        res.json({ message: 'Book updated.', books });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to update book.' });
    }
};

export const deleteGroupBook = async (req: Request, res: Response) => {
    const { group_id, book_id } = req.params;
    const user = req.user as User;

    try {
        const book = await knex('group_books')
            .where({ group_id, id: book_id })
            .whereNull('deleted_at')
            .first();

        if (!book) {
            return res.status(404).json({ error: 'Book not found in this group.' });
        }

        const is_admin = await checkIsGroupAdmin(user.id, group_id);

        if (!is_admin && book.user_id !== user.id) {
            return res.status(403).json({ error: 'Forbidden. You can only remove books you added.' });
        }

        await knex('group_books')
            .where({ group_id, id: book_id })
            .update({ deleted_at: knex.fn.now() });

        const books = await getGroupBooksQuery(group_id);
        res.json({ message: 'Book removed from group.', books });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to remove book from group.' });
    }
};

const getRolePermission = async (role: string) => {
    return await knex('role_permissions')
        .join('roles', 'role_permissions.role_id', 'roles.id')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .whereRaw('LOWER(roles.name) LIKE ?', [`%${role}%`])
        .whereRaw('LOWER(permissions.name) LIKE ?', ['%manage groups%'])
        .select('role_permissions.id')
        .first();
};

async function checkIsGroupAdmin(userId: number, group_id: string): Promise<boolean> {
    const result = await knex('user_groups')
        .join('role_permissions', 'user_groups.role_permission_id', 'role_permissions.id')
        .join('roles', 'role_permissions.role_id', 'roles.id')
        .where('user_groups.user_id', userId)
        .where('user_groups.group_id', group_id)
        .whereRaw('LOWER(roles.name) LIKE ?', ['%administrator%'])
        .first();
    return !!result;
}