import type { Knex } from "knex";
import bcrypt from "bcryptjs";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("users").truncate();

    // Inserts seed entries
    await knex("users").insert([
        {
            username: 'alice',
            first_name: 'Alice',
            last_name: 'Smith',
            email: 'alice.smith@example.com',
            password: await bcrypt.hash('alice123', 10),
            phone_number: '647-000-0002',
            address_id: null,
        },
        {
            username: 'bob',
            first_name: 'Bob',
            last_name: 'Jones',
            email: 'bob.jones@example.com',
            password: await bcrypt.hash('bob123', 10),
            phone_number: null,
            address_id: null,
        },
    ]);
}
