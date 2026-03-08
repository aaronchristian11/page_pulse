import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("user_role_permissions").del();

    // Inserts seed entries
    await knex("user_role_permissions").insert([
        { user_id: 1, role_id: 2, permission_id: 3 },
        { user_id: 2, role_id: 2, permission_id: 3 },
    ]);
}
