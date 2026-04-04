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

const rolePermission = async (role: string) => {
    return await knex('role_permissions')
                .join('roles', 'role_permissions.role_id', 'roles.id')
                .join('permissions', 'role_permissions.permission_id', 'permissions.id')
                .where('roles.name', role)
                .where('permissions.name', 'manage groups')
                .select('role_permissions.id')
                .first();
}