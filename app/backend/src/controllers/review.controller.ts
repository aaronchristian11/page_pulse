import type { Request, Response } from 'express';
import type {User} from "../types/express.d.ts";
import knex from "../db/database";

export const upsertReview = async (req: Request, res: Response) => {
    const me = req.user as User;
    const { book_key, rating, review_text, group_id } = req.body;

    if (!book_key) return res.status(400).json({ error: 'book_key is required.' });
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    try {
        const book = await knex('books').where({ key: book_key }).first();
        if (!book) return res.status(404).json({ error: 'Book not found.' });

        const reviewData: Record<string, any> = {
            user_id: me.id,
            book_id: book.id,
            group_id: group_id ?? null,
            rating,
            review_text: review_text ?? null,
        };

        // Upsert: insert or update if same user+book+group combo
        const existing = await knex('reviews')
            .where({ user_id: me.id, book_id: book.id, group_id: group_id ?? null })
            .first();

        if (existing) {
            await knex('reviews')
                .where({ id: existing.id })
                .update({ rating, review_text: review_text ?? null, updated_at: knex.fn.now() });
            return res.json({ message: 'Review updated.' });
        }

        await knex('reviews').insert(reviewData);
        res.status(201).json({ message: 'Review submitted.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to submit review.' });
    }
};

export const getBookReviews = async (req: Request, res: Response) => {
    const { book_key } = req.params;
    const { group_id } = req.query;

    try {
        const book = await knex('books').where({ key: book_key }).first();
        if (!book) return res.json({ reviews: [] });

        const query = knex('reviews')
            .join('users', 'reviews.user_id', 'users.id')
            .where('reviews.book_id', book.id)
            .select(
                'reviews.id',
                'reviews.rating',
                'reviews.review_text',
                'reviews.created_at',
                'reviews.updated_at',
                'users.username',
                'users.first_name',
                'users.last_name'
            )
            .orderBy('reviews.created_at', 'desc');

        if (group_id) {
            query.where('reviews.group_id', group_id);
        } else {
            query.whereNull('reviews.group_id');
        }

        const reviews = await query;
        res.json({ reviews });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
};

export const deleteReview = async (req: Request, res: Response) => {
    const me = req.user as User;
    const { reviewId } = req.params;

    try {
        const review = await knex('reviews').where({ id: reviewId, user_id: me.id }).first();
        if (!review) return res.status(404).json({ error: 'Review not found.' });

        await knex('reviews').where({ id: reviewId }).delete();
        res.json({ message: 'Review deleted.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to delete review.' });
    }
};

export const getUserReviews = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const reviews = await knex('reviews')
            .join('books', 'reviews.book_id', 'books.id')
            .where('reviews.user_id', userId)
            .select(
                'reviews.id',
                'reviews.rating',
                'reviews.review_text',
                'reviews.group_id',
                'reviews.created_at',
                'books.key as book_key'
            )
            .orderBy('reviews.created_at', 'desc');

        res.json({ reviews });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch user reviews.' });
    }
};