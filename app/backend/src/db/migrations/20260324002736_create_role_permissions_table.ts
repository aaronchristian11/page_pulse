import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('role_permissions', (table) => {
        table.increments('id').primary();
        table.integer('role_id').notNullable().references('roles.id');
        table.integer('permission_id').notNullable().references('permissions.id');
        table.unique(['role_id', 'permission_id']);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('role_permissions');
}

