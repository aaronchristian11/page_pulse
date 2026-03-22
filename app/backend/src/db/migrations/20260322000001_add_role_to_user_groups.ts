import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('user_groups', (table) => {
        table.string('role').notNullable().defaultTo('member');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('user_groups', (table) => {
        table.dropColumn('role');
    });
}