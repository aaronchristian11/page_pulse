import type { Request, Response } from 'express';
import knex from '../db/database.ts';
import type { User } from '../types/express.d.ts';

export const getGroups = async (req: Request, res: Response) => {
    try {
        const groups = await knex('groups').whereNull('deleted_at');
        res.json({ groups });
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

        const members = await knex('user_groups')
            .join('users', 'user_groups.user_id', 'users.id')
            .where('user_groups.group_id', id)
            .select('users.id', 'users.username', 'user_groups.role');

        const books = await knex('group_books')
            .where('group_id', id)
            .whereNull('deleted_at');

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

        // User creating the group is admin of the group
        const role_permission = await rolePermission('administrator');
        await knex('user_groups').insert({ group_id: id, user_id: user.id, role_permission_id: role_permission.id });

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
    const { groupId } = req.params;
    const { user_id } = req.body;
    const user = req.user as User;

    try {
        const group = await knex('groups').where({ id: groupId }).whereNull('deleted_at').first();

        if (!group) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        const existing = await knex('user_groups').where({ group_id: groupId, user_id: user.id }).first();

        if (existing) {
            return res.status(409).json({ error: 'User is already a member of this group.' });
        }

        const role_permission = await rolePermission('member');

        // Regular members get manage group permission but can only add books to the group
        await knex('user_groups').insert({ group_id: groupId, user_id: user.id, role_permission_id: role_permission.id });

        res.json({ message: 'Joined group.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to join group.' });
    }
};

export const getGroupMembers = async (req: Request, res: Response) => {
    const { groupId } = req.params;

    try {
        const members = await knex('user_groups')
            .join('users', 'user_groups.user_id', 'users.id')
            .where('user_groups.group_id', groupId)
            .select('users.id', 'users.username', 'user_groups.role');

        res.json({ members });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch members.' });
    }
};

export const updateMember = async (req: Request, res: Response) => {
    const { groupId, userId } = req.params;
    const { role } = req.body;

    try {
        const member = await knex('user_groups').where({ group_id: groupId, user_id: userId }).first();

        if (!member) {
            return res.status(404).json({ error: 'Member not found.' });
        }

        await knex('user_groups').where({ group_id: groupId, user_id: userId }).update({ role });

        res.json({ message: 'Member updated.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to update member.' });
    }
};

export const removeMember = async (req: Request, res: Response) => {
    const { groupId, userId } = req.params;

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
    const { groupId } = req.params;

    try {
        const books = await knex('group_books')
            .where('group_id', groupId)
            .whereNull('deleted_at');

        res.json({ books });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch group books.' });
    }
};

export const addGroupBook = async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { book_id } = req.body;
    const user = req.user as User;

    try {
        const existing = await knex('group_books')
                            .where({ group_id: groupId, book_id })
                            .whereNull('deleted_at')
                            .first();

        if (existing) {
            return res.status(409).json({ error: 'Book already exists in this group.' });
        }

        await knex('group_books').insert({ group_id: groupId, book_id, user_id: user.id });

        res.status(201).json({ message: 'Book added to group.' });
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
            .where({ group_id: group_id, id: book_id })
            .whereNull('deleted_at')
            .first();

        if (!book) {
            return res.status(404).json({ error: 'Book not found in this group.' });
        }

        const is_admin = checkIsGroupAdmin(user.id, group_id);

        if (!is_admin && book.user_id !== user.id) {
            return res.status(403).json({ error: 'Forbidden. You can only update books you added.' });
        }

        await knex('group_books').where({ group_id: group_id, id: book_id }).update(updates);

        res.json({ message: 'Book updated.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to update book.' });
    }
};

export const deleteGroupBook = async (req: Request, res: Response) => {
    const { group_id, book_id } = req.params;
    const user = req.user as User;

    try {
        const book = await knex('group_books')
            .where({ group_id: group_id, id: book_id })
            .whereNull('deleted_at')
            .first();

        if (!book) {
            return res.status(404).json({ error: 'Book not found in this group.' });
        }

        const is_admin = checkIsGroupAdmin(user.id, group_id);

        if (!is_admin && book.added_by !== user.id) {
            return res.status(403).json({ error: 'Forbidden. You can only remove books you added.' });
        }

        await knex('group_books')
            .where({ group_id: group_id, id: book_id, user_id: user.id })
            .update({ deleted_at: knex.fn.now() });

        res.json({ message: 'Book removed from group.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to remove book from group.' });
    }
};

const rolePermission = async (role: string) => {
    return await knex('role_permissions')
                .join('roles', 'role_permissions.role_id', 'roles.id')
                .join('permissions', 'role_permissions.permission_id', 'permissions.id')
                .where('roles.name', role)
                .where('permissions.name', 'manage groups')
                .select('role_permissions.id')
                .first();
}

async function checkIsGroupAdmin(userId: number, groupId: string): Promise<boolean> {
    const result = await knex('user_groups')
                        .join('role_permissions', 'user_groups.role_permission_id', 'role_permissions.id')
                        .join('roles', 'role_permissions.role_id', 'roles.id')
                        .where('user_groups.user_id', userId)
                        .where('user_groups.group_id', groupId)
                        .whereRaw('LOWER(roles.name) LIKE ?', ['%administrator%'])
                        .first();
    return !!result;
}
