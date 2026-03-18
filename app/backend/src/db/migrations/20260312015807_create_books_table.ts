import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('books', (table) => {
        table.increments('id').primary();
        table.string('key').unique().notNullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropIfExists('books');
}

