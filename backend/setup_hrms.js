import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ensureDatabaseAndMigrate() {
  console.log('--- PostgreSQL HRMS Database Initialization (Friend 2) ---');
  const user = process.env.DB_USER || 'postgres';
  const host = process.env.DB_HOST || 'localhost';
  const password = process.env.DB_PASSWORD || 'postgres';
  const port = Number(process.env.DB_PORT) || 5432;
  const dbName = process.env.DB_NAME || 'HRMS';

  // 1. Ensure DB exists
  const sysClient = new pg.Client({
    user, host, password, port, database: 'postgres'
  });

  try {
    await sysClient.connect();
    console.log('Connected to default postgres system DB.');

    const checkDb = await sysClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (checkDb.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating database now...`);
      await sysClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully!`);
    } else {
      console.log(`ℹ️ Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('❌ Failed connecting to default postgres DB:', err.message);
    throw err;
  } finally {
    await sysClient.end();
  }

  // 2. Connect to HRMS DB and run migrations
  const pool = new pg.Pool({ user, host, password, port, database: dbName });

  try {
    const res = await pool.query('SELECT current_database(), current_user, version()');
    console.log(`✅ Connected to database "${res.rows[0].current_database}" as user "${res.rows[0].current_user}"`);

    const migrationsDir = path.join(__dirname, 'db', 'migrations');
    const migrationFiles = [
      '001_initial_schema.sql',
      '002_enterprise_complete_schema.sql',
      '003_automatic_database_triggers.sql',
      '004_db_first_complete.sql',
      '005_master_prompt_complete_schema.sql',
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf8');
        try {
          await pool.query(sql);
          console.log(`  ✅ Migration executed: ${file}`);
        } catch (err) {
          console.warn(`  ⚠️ Migration notice [${file}]: ${err.message}`);
        }
      }
    }

    // Run HRMS-specific seed data (accounts, bank accounts, expenses, journal entries)
    const hrmsSeeds = ['hrms/001_hrms_seed.sql'];
    for (const file of hrmsSeeds) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf8');
        try {
          await pool.query(sql);
          console.log(`  ✅ HRMS Seed executed: ${file}`);
        } catch (err) {
          console.warn(`  ⚠️ HRMS Seed notice [${file}]: ${err.message}`);
        }
      }
    }

    const empCount = await pool.query('SELECT COUNT(*) FROM employees');
    console.log(`🎉 HRMS Database Ready! Total employees: ${empCount.rows[0].count}`);

  } catch (err) {
    console.error('❌ Error executing database migrations:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureDatabaseAndMigrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
