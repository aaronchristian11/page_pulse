const knex = require('knex')({
    client: 'better-sqlite3',
    connection: {
        filename: process.env.DB_PATH || './data/pagepulse.db'
    },
    useNullAsDefault: true,
    pool: {
        afterCreate: (conn, done) => {
            conn.pragma('journal_mode = WAL');
            conn.pragma('foreign_keys = ON');
            done(null, conn);
        }
    }
});

module.exports = knex;