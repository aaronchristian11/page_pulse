import type { Request, Response, NextFunction } from 'express';
import type { User } from '../types/express.d.ts';
import knex from '../db/database.ts';

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }

    const user = await knex('users').where({ id: userId }).whereNull('deleted_at').first() as User;

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }

    req.user = user as User;
    next();
};

export const hasPermission = (permission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const userPermission = await knex('user_role_permissions')
                                    .join('role_permissions', 'user_role_permissions.role_permission_id', 'role_permissions.id')
                                    .join('roles', 'role_permissions.role_id', 'roles.id')
                                    .join('permissions', 'role_permissions.permission_id', 'permissions.id')
                                    .where('user_role_permissions.user_id', user.id)
                                    .whereLike('permissions.name', `%${permission}%`)
                                    .first();

        if (!userPermission) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        next();
    };
};

export const isGroupAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    const { group_id } = req.params;

    if (!group_id || !user?.id) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        const admin_check = await knex('user_groups')
            .join('role_permissions', 'user_groups.role_permission_id', 'role_permissions.id')
            .join('roles', 'role_permissions.role_id', 'roles.id')
            .where('user_groups.user_id', user.id)
            .where('user_groups.group_id', group_id)
            .whereLike('roles.name', 'administrator')
            .first();

        if (!admin_check) {
            return res.status(403).json({ error: 'Forbidden. You must be a group admin.' });
        }

        next();
    } catch (err) {
        return res.status(500).json({ error: 'Authorization check failed.' });
    }
};

/*
Commenting this cross-user check for now
export const isSameUser = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'];
    const { userId: paramUserId } = req.params;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (String(userId) !== String(paramUserId)) {
        return res.status(403).json({ error: 'Forbidden. You can only modify your own shelf.' });
    }

    next();
};*/
