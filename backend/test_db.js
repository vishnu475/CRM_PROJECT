import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'HRMS',
  password: process.env.DB_PASSWORD || 'postgres',
  port: Number(process.env.DB_PORT) || 5432,
});

async function runSchemaAndTestTriggers() {
  try {
    const res = await pool.query('SELECT current_database(), current_user, version()');
    console.log('✅ SUCCESS: Connected to PostgreSQL DB:', res.rows[0]);

    // Run schema 1
    const schemaPath1 = path.join(__dirname, 'db', 'migrations', '001_initial_schema.sql');
    if (fs.existsSync(schemaPath1)) {
      const sql1 = fs.readFileSync(schemaPath1, 'utf8');
      await pool.query(sql1);
    }

    // Run schema 2
    const schemaPath2 = path.join(__dirname, 'db', 'migrations', '002_enterprise_complete_schema.sql');
    if (fs.existsSync(schemaPath2)) {
      const sql2 = fs.readFileSync(schemaPath2, 'utf8');
      await pool.query(sql2);
    }

    // Run schema 3 (Triggers)
    const schemaPath3 = path.join(__dirname, 'db', 'migrations', '003_automatic_database_triggers.sql');
    if (fs.existsSync(schemaPath3)) {
      const sql3 = fs.readFileSync(schemaPath3, 'utf8');
      await pool.query(sql3);
      console.log('⚡ Automatic Triggers (003_automatic_database_triggers.sql) executed successfully!');
    }

    // Verify Triggers in PostgreSQL
    const triggersRes = await pool.query(`
      SELECT trigger_name, event_manipulation, event_object_table 
      FROM information_schema.triggers 
      WHERE event_object_table = 'employees'
    `);
    console.log('⚡ Active Employees Triggers:', triggersRes.rows.map(t => t.trigger_name).join(', '));

    await pool.end();
    console.log('🎉 AUTOMATIC CASCADE DATABASE TRIGGERS INSTALLED & OPERATIONAL!');
    process.exit(0);
  } catch (err) {
    console.error('❌ DB ERROR:', err.message);
    await pool.end();
    process.exit(1);
  }
}

runSchemaAndTestTriggers();
