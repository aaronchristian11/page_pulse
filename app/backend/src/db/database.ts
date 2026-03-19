import knex from 'knex';

const db = knex({
    client: 'sqlite3',
    connection: {
        filename: process.env.DB_PATH || './data/pagepulse.db'
    },
    useNullAsDefault: true,
});

export default db;