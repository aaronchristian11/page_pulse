import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('user_books', (table) => {
        table.string('reading_status').nullable().defaultTo(null);
        // values: 'reading' | 'upcoming' | 'completed' | 'dropped'
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('user_books', (table) => {
        table.dropColumn('reading_status');
    });
}
