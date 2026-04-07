import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('reviews', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable().references('users.id').onDelete('CASCADE').onUpdate('CASCADE');
        table.integer('book_id').notNullable().references('books.id').onDelete('CASCADE').onUpdate('CASCADE');
        table.integer('group_id').nullable().references('groups.id').onDelete('CASCADE').onUpdate('CASCADE');
        table.integer('rating').notNullable().checkBetween([1, 5]);
        table.text('review_text').nullable();
        table.timestamps(true, true);
        table.unique(['user_id', 'book_id', 'group_id']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('reviews');
}

