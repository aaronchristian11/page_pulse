import type { Request, Response } from 'express';
import knex from '../db/database.ts';
import type { User } from '../types/express.d.ts';

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

const rolePermission = async (role: string) => {
    return await knex('role_permissions')
                .join('roles', 'role_permissions.role_id', 'roles.id')
                .join('permissions', 'role_permissions.permission_id', 'permissions.id')
                .where('roles.name', role)
                .where('permissions.name', 'manage groups')
                .select('role_permissions.id')
                .first();
}