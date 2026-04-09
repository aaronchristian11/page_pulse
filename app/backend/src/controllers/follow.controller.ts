import type { Request, Response } from 'express';
import type {User} from "../types/express.d.ts";
import knex from "../db/database";
import {bookCache} from "../cache/book.cache";
import {openLibraryApi} from "../api/open_library.api";

export const followUser = async (req: Request, res: Response) => {
    const me = req.user as User;
    const { userId } = req.params;

    if (String(me.id) === String(userId)) {
        return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    try {
        const target = await knex('users').where({ id: userId }).whereNull('deleted_at').first();
        if (!target) return res.status(404).json({ error: 'User not found.' });

        await knex('follows')
            .insert({ follower_id: me.id, following_id: userId })
            .onConflict(['follower_id', 'following_id'])
            .ignore();

        res.json({ message: `Now following ${target.username}.` });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to follow user.' });
    }
};

export const unfollowUser = async (req: Request, res: Response) => {
    const me = req.user as User;
    const { userId } = req.params;

    try {
        await knex('follows')
            .where({ follower_id: me.id, following_id: userId })
            .delete();

        res.json({ message: 'Unfollowed.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to unfollow user.' });
    }
};

export const getFollowing = async (req: Request, res: Response) => {
    const me = req.user as User;

    try {
        const following = await knex('follows')
            .join('users', 'follows.following_id', 'users.id')
            .where('follows.follower_id', me.id)
            .whereNull('users.deleted_at')
            .select('users.id', 'users.username', 'users.first_name', 'users.last_name');

        res.json({ following });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch following list.' });
    }
};

export const getFollowers = async (req: Request, res: Response) => {
    const me = req.user as User;

    try {
        const followers = await knex('follows')
            .join('users', 'follows.follower_id', 'users.id')
            .where('follows.following_id', me.id)
            .whereNull('users.deleted_at')
            .select('users.id', 'users.username', 'users.first_name', 'users.last_name');

        res.json({ followers });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch followers.' });
    }
};

export const getFollowedUserShelf = async (req: Request, res: Response) => {
    const me = req.user as User;
    const { userId } = req.params;

    try {
        const relationship = await knex('follows')
            .where({ follower_id: me.id, following_id: userId })
            .first();

        if (!relationship) {
            return res.status(403).json({ error: 'You must follow this user to see their shelf.' });
        }

        const userBooks = await knex('user_books')
            .join('books', 'user_books.book_id', 'books.id')
            .where('user_books.user_id', userId)
            .select('books.key', 'user_books.rating');

        res.json({ books: userBooks });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch shelf.' });
    }
};

export const getFriendRecommendations = async (req: Request, res: Response) => {
    const me = req.user as User;

    try {
        // Get IDs of users I follow
        const followingRows = await knex('follows')
            .where({ follower_id: me.id })
            .select('following_id');

        const followingIds = followingRows.map((r: any) => r.following_id);

        if (!followingIds.length) {
            return res.json({ recommendations: [] });
        }

        // Get books on my shelf
        const myBooks = await knex('user_books')
            .where({ user_id: me.id })
            .select('book_id');
        const myBookIds = myBooks.map((b: any) => b.book_id);

        // Highly-rated (>= 4) books from people I follow that aren't on my shelf
        const query = knex('user_books')
            .join('books', 'user_books.book_id', 'books.id')
            .join('users', 'user_books.user_id', 'users.id')
            .whereIn('user_books.user_id', followingIds)
            .where('user_books.rating', '>=', 4)
            .select(
                'books.key',
                'books.id',
                'user_books.rating',
                'users.username as recommended_by'
            )
            .orderBy('user_books.rating', 'desc')
            .limit(20);

        if (myBookIds.length) {
            query.whereNotIn('user_books.book_id', myBookIds);
        }

        const rows = await query;

        const recommendations = await Promise.all(
            rows.map(async (entry) => {
                const work = await bookCache.getOrFetch(entry.key, () =>
                    openLibraryApi.getWork(entry.key)
                );
                return { ...entry, ...work };
            })
        );

        res.json({ recommendations });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch friend recommendations.' });
    }
};