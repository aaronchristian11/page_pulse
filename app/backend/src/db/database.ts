import knex from 'knex';

const db = knex({
    client: 'sqlite3',
    connection: {
        filename: process.env.DB_PATH || './data/pagepulse.db'
    },
    useNullAsDefault: true,
    migrations: {
        directory: new URL('./migrations', import.meta.url).pathname,
    },
    seeds: {
        directory: new URL('./seeds', import.meta.url).pathname,
    }
});

export default db;