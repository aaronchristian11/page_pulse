import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('follows', (table) => {
        table.increments('id').primary();
        table.integer('follower_id').notNullable().references('users.id').onDelete('CASCADE').onUpdate('CASCADE');
        table.integer('following_id').notNullable().references('users.id').onDelete('CASCADE').onUpdate('CASCADE');
        table.timestamps(true, true);
        table.timestamp('deleted_at').nullable();
        table.unique(['follower_id', 'following_id']);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('follows');
}

