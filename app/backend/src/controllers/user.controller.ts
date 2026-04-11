import type { Request, Response } from 'express';
import type { User } from '../types/express.d.ts';
import knex from "../db/database";

export const lookupUser = async (req: Request, res: Response) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username is required.' });

    try {
        const user = await knex('users')
            .where({ username })
            .whereNull('deleted_at')
            .select('id', 'username')
            .first();

        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({ user });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to look up user.' });
    }
}

export const userProfile = async (req: Request, res: Response) => {
    const user = req.user as User;

    try {
        const userDetails = await knex('users')
            .where({ id: user.id })
            .whereNull('deleted_at')
            .select('id', 'username', 'first_name', 'last_name', 'email', 'created_at')
            .first();

        if (!userDetails) return res.status(404).json({ error: 'User not found.' });

        const [shelfCount, ratedCount, followerCount, followingCount] = await Promise.all([
            knex('user_books')
                .where({ user_id: user.id })
                .count('id as count')
                .first(),
            knex('user_books')
                .where({ user_id: user.id })
                .whereNotNull('rating')
                .count('id as count')
                .first(),
            knex('follows')
                .where({ following_id: user.id })
                .count('follower_id as count')
                .first(),
            knex('follows')
                .where({ follower_id: user.id })
                .count('following_id as count')
                .first(),
        ]);

        res.json({
            user: {
                ...userDetails,
                shelf_count:    Number(shelfCount?.count    ?? 0),
                rated_count:    Number(ratedCount?.count    ?? 0),
                follower_count: Number(followerCount?.count ?? 0),
                following_count: Number(followingCount?.count ?? 0),
            }
        });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
};