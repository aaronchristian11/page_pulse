import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('user_role_permissions', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.foreign('user_id').references('users.id');
        table.integer('role_id').notNullable();
        table.foreign('role_id').references('roles.id');
        table.integer('permission_id').notNullable();
        table.foreign('permission_id').references('permissions.id');
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('user_role_permissions');
}

