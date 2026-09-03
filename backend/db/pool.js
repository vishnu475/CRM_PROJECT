import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'HRMS',
  password: process.env.DB_PASSWORD || 'postgres',
  port: Number(process.env.DB_PORT) || 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error (PostgreSQL HRMS):', err.stack);
  } else {
    console.log(`✅ PostgreSQL Connected Successfully to DB "${process.env.DB_NAME || 'HRMS'}" on port ${process.env.DB_PORT || 5432}`);
    release();
  }
});
