import type { Request, Response } from 'express';
import { openLibraryApi } from '../api/open_library.api.ts';
import { bookCache } from '../cache/book.cache.ts';
import knex from '../db/database.ts';
import { AppError } from '../exceptions/AppError.ts';

export const getShelfBooks = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const user_books = await knex('user_books')
            .join('books', 'user_books.book_id', 'books.id')
            .where('user_books.user_id', userId)
            .select('books.id' , 'books.key', 'user_books.rating');

        const books = await Promise.all(
            user_books.map(async (user_book: any) => {
                const work = await bookCache.getOrFetch(user_book.key, () =>
                    openLibraryApi.getWork(user_book.key)
                );
                return { ...work, rating: user_book.rating ?? null };
            })
        );

        res.json({ books });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to get books.' });
    }
};

export const addBookToShelf = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { book_key } = req.body;

    try {
        await knex.transaction(async (trx) => {
            await trx('books').insert({ key: book_key }).onConflict('key').ignore();
            const book = await trx('books').where({ key: book_key }).first();

            const existing = await trx('user_books').where({ user_id: userId, book_id: book.id }).first();
            if (existing) {
                throw new AppError('Book already exists on the shelf.', 409);
            }

            await trx('user_books').insert({ user_id: userId, book_id: book.id });
        });

        // Pre-warm cache for this book key if not already cached
        if (!bookCache.has(`work:${book_key}`)) {
            openLibraryApi.getWork(book_key)
                .then((data) => bookCache.set(`work:${book_key}`, data))
                .catch(() => { /* non-fatal */ });
        }

        res.json({ message: 'The book has been added to the shelf.' });
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to add book to shelf.' });
    }
};

export const removeBookFromShelf = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { book_key } = req.body;

    try {
        await knex.transaction(async (trx) => {
            const book = await trx('books').where({ key: book_key }).first();

            if (!book) {
                throw new AppError('Book does not exist.', 404);
            }

            const userBook = await trx('user_books').where({ user_id: userId, book_id: book.id }).first();

            if (!userBook) {
                throw new AppError('Book does not exist in your shelf.', 404);
            }

            await trx('user_books').where({ user_id: userId, book_id: book.id }).delete();
        });

        res.json({ message: 'The book has been removed from the shelf.' });
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to remove book from shelf.' });
    }
};

export const rateBook = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { book_key, rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    try {
        const book = await knex('books').where({ key: book_key }).first();

        if (!book) {
            return res.status(404).json({ error: 'Book not found.' });
        }

        const updated = await knex('user_books')
            .where({ user_id: userId, book_id: book.id })
            .update({ rating });

        if (!updated) {
            return res.status(404).json({ error: 'Book is not on your shelf.' });
        }

        res.json({ message: 'Rating saved.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to save rating.' });
    }
};