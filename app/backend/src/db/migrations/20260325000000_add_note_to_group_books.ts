import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    const hasNote = await knex.schema.hasColumn('group_books', 'note');
    if (!hasNote) {
        await knex.schema.alterTable('group_books', (table) => {
            table.text('note').nullable();
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('group_books', (table) => {
        table.dropColumn('note');
    });
}
