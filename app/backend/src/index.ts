import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import knex from "./db/database.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

// Run migrations and seeds before starting
console.log('Running migrations...');
await knex.migrate.latest();
console.log('Running seeds...');
await knex.seed.run();
console.log('Database ready.');

app.listen(PORT, () => console.log(`STEFAN WAS HERE ON PORT ${PORT}`));