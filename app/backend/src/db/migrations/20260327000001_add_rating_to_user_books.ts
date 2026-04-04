import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('user_books', (table) => {
        table.integer('rating').nullable().defaultTo(null);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('user_books', (table) => {
        table.dropColumn('rating');
    });
}