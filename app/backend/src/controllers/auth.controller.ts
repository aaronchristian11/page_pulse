import type { Request, Response } from 'express';
import type { User } from '../types/express.d.ts';
import knex from '../db/database.ts';
import bcrypt from 'bcryptjs';

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await knex('users').where({ username }).whereNull('deleted_at').first() as User;
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
};

export const register = async (req: Request, res: Response) => {
    const { username, first_name, last_name, email, password, phone_number } = req.body;
    if (!username || !first_name || !last_name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    try {
        const hashed = await bcrypt.hash(password, 10);
        const [id] = await knex('users').insert({ username, first_name, last_name, email, password: hashed, phone_number });
        const role = await knex('roles').whereLike('name', '%member%').first();
        const permission = await knex('permissions').whereLike('name', '%manage shelf%').first();
        await knex('user_role_permissions').insert({ user_id: id, role_id: role.id, permission_id: permission.id })
        const user = await knex('users').where({ id }).first();
        const { password: _, ...safeUser } = user;
        res.status(201).json({ user: safeUser });
    } catch (err: any) {
        if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already exists' });
        res.status(500).json({ error: err.message });
    }
};