import { Request, Response } from 'express';
import knex from '../db/database';
import bcrypt from 'bcryptjs';

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await knex('users').where({ username }).whereNull('deleted_at').first();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
};

export const register = async (req: Request, res: Response) => {
    const { username, first_name, last_name, password, phone_number } = req.body;
    if (!username || !first_name || !last_name || !password) return res.status(400).json({ error: 'All fields required' });

    try {
        const hashed = await bcrypt.hash(password, 10);
        const [id] = await knex('users').insert({ username, first_name, last_name, password: hashed, phone_number });
        const user = await knex('users').where({ id }).first();
        const { password: _, ...safeUser } = user;
        res.status(201).json({ user: safeUser });
    } catch (err: any) {
        if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already exists' });
        res.status(500).json({ error: err.message });
    }
};