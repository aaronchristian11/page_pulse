import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('notifications', (table) => {
        table.increments('id').primary();
        table.integer('recipient_id').notNullable().references('id').inTable('users');
        table.integer('actor_id').notNullable().references('id').inTable('users');
        table.string('type').notNullable().defaultTo('follow');
        table.boolean('is_read').notNullable().defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());

        table.unique(['recipient_id', 'actor_id', 'type']);
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('notifications');
}

