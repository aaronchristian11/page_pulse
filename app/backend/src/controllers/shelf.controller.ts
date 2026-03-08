import type { Request, Response } from 'express';
import knex from '../db/database.ts';

export const getShelfBooks = async (req: Request, res: Response) => {
    const user_id = req.params.userId;

    try {
        const books = await knex('user_books').where('user_id', user_id);
        res.json({ books });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to get books.' });
    }
};

export const addBookToShelf = async (req: Request, res: Response) => {
    const { user_id, book_id } = req.body;

    try {
        await knex('user_books').insert({ user_id, book_id });

        res.json({ message: 'The book has been added to the shelf.' })
    } catch (err: any) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'Book already exists on the shelf.' });
        }
        res.status(500).json({ error: 'Failed to add book to shelf.' });
    }
};

export const removeBookFromShelf = async (req: Request, res: Response) => {
    const { user_id, book_id } = req.body;

    try {
        const book = await knex('user_books').where({ user_id, book_id }).first();

        if (!book) {
            return res.status(404).json({ error: 'Book does not exist in your shelf.' });
        }

        await knex('user_books').where({ user_id, book_id }).delete();

        res.json({ message: 'The book has been removed from the shelf.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to remove book from shelf.' });
    }
};
