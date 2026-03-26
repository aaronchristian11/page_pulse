import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('user_role_permissions', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.foreign('user_id').references('users.id');
        table.integer('role_permission_id').notNullable().references('role_permissions.id')
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('user_role_permissions');
}

