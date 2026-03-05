import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("permissions").del();

    // Inserts seed entries
    await knex("permissions").insert([
        { name: "Manage Users" }
    ]);
};
