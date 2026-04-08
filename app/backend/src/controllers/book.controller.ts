import type { Request, Response } from 'express';
import knex from '../db/database.ts';
import type { User } from '../types/express.d.ts';

export const getGroupBooks = async (req: Request, res: Response) => {
    const { groupId } = req.params;

    try {
        const books = await knex('group_books')
            .where('group_id', groupId)
            .whereNull('deleted_at');

        res.json({ books });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch group books.' });
    }
};

export const addGroupBook = async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { book_id } = req.body;
    const user = req.user as User;

    try {
        const existing = await knex('group_books')
                            .where({ group_id: groupId, book_id })
                            .whereNull('deleted_at')
                            .first();

        if (existing) {
            return res.status(409).json({ error: 'Book already exists in this group.' });
        }

        await knex('group_books').insert({ group_id: groupId, book_id, user_id: user.id });

        res.status(201).json({ message: 'Book added to group.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to add book to group.' });
    }
};

export const updateGroupBook = async (req: Request, res: Response) => {
    const { group_id, book_id } = req.params;
    const updates = req.body;
    const user = req.user as User;

    try {
        const book = await knex('group_books')
            .where({ group_id: group_id, id: book_id })
            .whereNull('deleted_at')
            .first();

        if (!book) {
            return res.status(404).json({ error: 'Book not found in this group.' });
        }

        const is_admin = await checkIsGroupAdmin(user.id, group_id);

        if (!is_admin && book.user_id !== user.id) {
            return res.status(403).json({ error: 'Forbidden. You can only update books you added.' });
        }

        await knex('group_books').where({ group_id: group_id, id: book_id }).update(updates);

        res.json({ message: 'Book updated.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to update book.' });
    }
};

export const deleteGroupBook = async (req: Request, res: Response) => {
    const { group_id, book_id } = req.params;
    const user = req.user as User;

    try {
        const book = await knex('group_books')
            .where({ group_id: group_id, id: book_id })
            .whereNull('deleted_at')
            .first();

        if (!book) {
            return res.status(404).json({ error: 'Book not found in this group.' });
        }

        const is_admin = await checkIsGroupAdmin(user.id, group_id);

        if (!is_admin && book.added_by !== user.id) {
            return res.status(403).json({ error: 'Forbidden. You can only remove books you added.' });
        }

        await knex('group_books')
            .where({ group_id: group_id, id: book_id, user_id: user.id })
            .update({ deleted_at: knex.fn.now() });

        res.json({ message: 'Book removed from group.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to remove book from group.' });
    }
};

async function checkIsGroupAdmin(userId: number, groupId: string): Promise<boolean> {
    const result = await knex('user_groups')
                        .join('role_permissions', 'user_groups.role_permission_id', 'role_permissions.id')
                        .join('roles', 'role_permissions.role_id', 'roles.id')
                        .where('user_groups.user_id', userId)
                        .where('user_groups.group_id', groupId)
                        .whereRaw('LOWER(roles.name) LIKE ?', ['%administrator%'])
                        .first();
    return !!result;
}