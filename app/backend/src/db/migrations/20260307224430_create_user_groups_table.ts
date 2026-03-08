import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('user_groups', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.foreign('user_id').references('users.id');
        table.integer('group_id').notNullable();
        table.foreign('group_id').references('groups.id');
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('user_groups');
}

