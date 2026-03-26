import type { Request, Response } from 'express';
import {openLibraryApi} from '../api/open_library.api.js';
import knex from '../db/database.js';
import {AppError} from "../exceptions/AppError.js";

export const getShelfBooks = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const user_books = await knex('user_books')
            .join('books', 'user_books.book_id', 'books.id')
            .where('user_books.user_id', userId)
            .select('books.key');
        const books = await Promise.all(
            user_books.map((user_book: any) => openLibraryApi.getWork(user_book.key))
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
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to add book to shelf.' });
    }
};