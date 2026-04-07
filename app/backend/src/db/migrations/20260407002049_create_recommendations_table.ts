import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('recommendations', (table) => {
        table.increments('id').primary();
        table.integer('sender_id').notNullable().references('users.id').onDelete('CASCADE');
        table.integer('recipient_id').nullable().references('users.id').onDelete('CASCADE');
        table.integer('group_id').nullable().references('groups.id').onDelete('CASCADE');
        table.integer('book_id').notNullable().references('books.id').onDelete('CASCADE');
        table.text('message').nullable();
        table.boolean('is_read').defaultTo(false);
        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('recommendations');
}

