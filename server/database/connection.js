import dotenv from 'dotenv/config';
import { Client } from 'pg';
const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
});

await client
    .connect()
    .then(() => {
        console.log('Connected successfully!');
        return client.end();
    })
    .catch((err) => console.error('Connection error:', err));
