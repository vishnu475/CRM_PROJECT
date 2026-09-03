import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensures the CRM PostgreSQL database exists and runs all CRM migrations.
 * This is called automatically on server boot from index.js.
 */
export async function ensureCRMDatabaseAndMigrate() {
  console.log('--- PostgreSQL CRM Database Initialization (Friend 1) ---');

  const user     = process.env.CRM_DB_USER     || 'postgres';
  const host     = process.env.CRM_DB_HOST     || 'localhost';
  const password = process.env.CRM_DB_PASSWORD || 'postgres';
  const port     = Number(process.env.CRM_DB_PORT) || 5432;
  const dbName   = process.env.CRM_DB_NAME     || 'crm';

  // 1. Connect to default 'postgres' database to ensure CRM DB exists
  const sysClient = new pg.Client({ user, host, password, port, database: 'postgres' });

  try {
    await sysClient.connect();
    console.log('[CRM] Connected to system postgres DB.');

    const checkDb = await sysClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDb.rowCount === 0) {
      console.log(`[CRM] Database "${dbName}" does not exist — creating now...`);
      await sysClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ [CRM] Database "${dbName}" created.`);
    } else {
      console.log(`ℹ️  [CRM] Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('[CRM] ❌ Failed to connect to system postgres DB:', err.message);
    throw err;
  } finally {
    await sysClient.end();
  }

  // 2. Connect to CRM DB and run migrations
  const crmClient = new pg.Pool({ user, host, password, port, database: dbName });

  try {
    const res = await crmClient.query('SELECT current_database(), current_user');
    console.log(`✅ [CRM] Connected to "${res.rows[0].current_database}" as "${res.rows[0].current_user}"`);

    const migrationsDir = path.join(__dirname, 'db', 'migrations', 'crm');
    const migrationFiles = [
      '001_crm_schema.sql',
      '002_crm_seed.sql',  // Seed initial data into crm DB
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf8');
        try {
          await crmClient.query(sql);
          console.log(`  ✅ [CRM] Migration executed: ${file}`);
        } catch (err) {
          console.warn(`  ⚠️  [CRM] Migration notice [${file}]: ${err.message}`);
        }
      }
    }

    const productCount = await crmClient.query('SELECT COUNT(*) FROM products');
    console.log(`🎉 [CRM] CRM Database Ready! Products seeded: ${productCount.rows[0].count}`);

  } catch (err) {
    console.error('[CRM] ❌ Error running CRM migrations:', err.message);
    throw err;
  } finally {
    await crmClient.end();
  }
}

// Allow running standalone: node setup_crm.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureCRMDatabaseAndMigrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
