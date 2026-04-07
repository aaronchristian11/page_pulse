import type { Request, Response } from 'express';
import {User} from "../types/express";
import knex from "../db/database";

export const sendRecommendation = async (req: Request, res: Response) => {
    const me = req.user as User;
    const { book_key, recipient_id, group_id, message } = req.body;

    if (!book_key) return res.status(400).json({ error: 'book_key is required.' });
    if (!recipient_id && !group_id) {
        return res.status(400).json({ error: 'Either recipient_id or group_id is required.' });
    }

    try {
        // Ensure book exists in books table
        await knex('books').insert({ key: book_key }).onConflict('key').ignore();
        const book = await knex('books').where({ key: book_key }).first();

        if (recipient_id) {
            // Direct recommendation to a friend
            if (String(recipient_id) === String(me.id)) {
                return res.status(400).json({ error: 'You cannot recommend a book to yourself.' });
            }

            const target = await knex('users').where({ id: recipient_id }).whereNull('deleted_at').first();
            if (!target) return res.status(404).json({ error: 'Recipient not found.' });

            await knex('recommendations').insert({
                sender_id: me.id,
                recipient_id,
                group_id: null,
                book_id: book.id,
                message: message ?? null,
            });

            return res.status(201).json({ message: `Recommendation sent to ${target.username}.` });
        }

        if (group_id) {
            // Group recommendation — send one notification per member (except sender)
            const membership = await knex('user_groups')
                .where({ group_id, user_id: me.id })
                .first();

            if (!membership) {
                return res.status(403).json({ error: 'You are not a member of this group.' });
            }

            const members = await knex('user_groups')
                .where('group_id', group_id)
                .whereNot('user_id', me.id)
                .select('user_id');

            const rows = members.map((m: any) => ({
                sender_id: me.id,
                recipient_id: m.user_id,
                group_id,
                book_id: book.id,
                message: message ?? null,
            }));

            if (rows.length) await knex('recommendations').insert(rows);

            return res.status(201).json({ message: 'Recommendation sent to group.' });
        }
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to send recommendation.' });
    }
};

export const getInbox = async (req: Request, res: Response) => {
    const me = req.user as User;

    try {
        const inbox = await knex('recommendations')
            .join('users as sender', 'recommendations.sender_id', 'sender.id')
            .join('books', 'recommendations.book_id', 'books.id')
            .where('recommendations.recipient_id', me.id)
            .select(
                'recommendations.id',
                'recommendations.message',
                'recommendations.is_read',
                'recommendations.group_id',
                'recommendations.created_at',
                'sender.username as sender_username',
                'sender.first_name as sender_first_name',
                'sender.last_name as sender_last_name',
                'books.key as book_key'
            )
            .orderBy('recommendations.created_at', 'desc');

        res.json({ inbox });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch inbox.' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    const me = req.user as User;
    const { id } = req.params;

    try {
        const updated = await knex('recommendations')
            .where({ id, recipient_id: me.id })
            .update({ is_read: true });

        if (!updated) return res.status(404).json({ error: 'Recommendation not found.' });

        res.json({ message: 'Marked as read.' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to mark as read.' });
    }
};

export const getUnreadCount = async (req: Request, res: Response) => {
    const me = req.user as User;

    try {
        const result = await knex('recommendations')
            .where({ recipient_id: me.id, is_read: false })
            .count('id as count')
            .first();

        res.json({ unread: Number(result?.count ?? 0) });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch unread count.' });
    }
};