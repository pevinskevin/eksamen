import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const db = new Client();

// Connect once when the file is loaded
db.connect();

console.log(db.database);

export default db;
