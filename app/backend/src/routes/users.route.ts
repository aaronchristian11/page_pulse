import { Router } from 'express';
import knex from '../db/database.js';

const router = Router();

router.get('/lookup', async (req, res) => {
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
});

export default router;