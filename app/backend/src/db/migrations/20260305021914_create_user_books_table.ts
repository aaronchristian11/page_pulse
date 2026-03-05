import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('user_books', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.foreign('user_id').references('users.id');
        table.integer('book_id').nullable();
        table.string('book_isbn').notNullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('user_books');
}