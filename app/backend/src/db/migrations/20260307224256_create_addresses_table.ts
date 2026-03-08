import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('addresses', (table) => {
        table.increments('id').primary();
        table.string('address line 1').notNullable();
        table.string('address line 2').nullable();
        table.string('city').notNullable();
        table.string('province').notNullable();
        table.string('postal_code').notNullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('addresses');
}

