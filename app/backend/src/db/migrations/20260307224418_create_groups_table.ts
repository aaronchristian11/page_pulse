import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('groups', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('description').nullable();
        table.timestamps(true, true);
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('groups');
}

