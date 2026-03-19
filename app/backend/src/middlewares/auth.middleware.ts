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
            .join('roles', 'user_role_permissions.role_id', 'roles.id')
            .join('permissions', 'user_role_permissions.permission_id', 'permissions.id')
            .where('user_role_permissions.user_id', user.id)
            .whereLike('permissions.name', `%${permission}%`)
            .first();

        if (!userPermission) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        next();
    };
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
