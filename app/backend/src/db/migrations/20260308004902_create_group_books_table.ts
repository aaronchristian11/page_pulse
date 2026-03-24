import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('group_books', (table) => {
        table.increments('id').primary();
        table.integer('group_id').notNullable().references('groups.id');
        table.string('book_id').notNullable().references('books.id');
        table.string('user_id').notNullable().references('users.id');
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('group_books');
}

