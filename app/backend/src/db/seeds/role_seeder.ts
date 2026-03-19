import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("roles").truncate();

    // Inserts seed entries
    await knex("roles").insert([
        { name: "Administrator" },
        { name: "General" }
    ]);
};
