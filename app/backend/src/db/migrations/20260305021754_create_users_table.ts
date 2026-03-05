import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('first_name').notNullable();
        table.string('last_name').notNullable();
        table.string('username').notNullable();
        table.string('password').notNullable();
        table.string('phone_number').nullable();
        table.string('address_id').nullable();
        table.foreign('address_id').references('addresses.id').onDelete('CASCADE').onUpdate('CASCADE');
        table.timestamps(true, true);
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('users');
}

