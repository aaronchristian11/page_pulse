import type { Request, Response } from 'express';
import knex from '../db/database.ts';

export const getUserProfile = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const user = await knex('users')
            .where({ id: userId })
            .whereNull('deleted_at')
            .select('id', 'username', 'first_name', 'last_name', 'email', 'created_at')
            .first();

        if (!user) return res.status(404).json({ error: 'User not found.' });

        const shelfCount = await knex('user_books')
            .where({ user_id: userId })
            .count('id as count')
            .first();

        const ratedCount = await knex('user_books')
            .where({ user_id: userId })
            .whereNotNull('rating')
            .count('id as count')
            .first();

        res.json({
            user: {
                ...user,
                shelf_count: Number(shelfCount?.count ?? 0),
                rated_count: Number(ratedCount?.count ?? 0),
            }
        });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
};