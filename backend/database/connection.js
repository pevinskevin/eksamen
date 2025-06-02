import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const db = new Pool();

export default db;
