import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

// ============================================================
// HRMS Pool — Friend 2 (Employees, Payroll, Attendance, Leave)
// ============================================================
export const hrmsPool = new Pool({
  user:     process.env.DB_USER     || 'postgres',
  host:     process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME     || 'HRMS',
  password: process.env.DB_PASSWORD || 'postgres',
  port:     Number(process.env.DB_PORT) || 5432,
});

hrmsPool.connect((err, client, release) => {
  if (err) {
    console.error('❌ HRMS Database connection error:', err.stack);
  } else {
    console.log(`✅ [HRMS DB] Connected to "${process.env.DB_NAME || 'HRMS'}" on port ${process.env.DB_PORT || 5432}`);
    release();
  }
});

// ============================================================
// CRM Pool — Friend 1 (Leads, Customers, Opportunities, Sales)
// ============================================================
export const crmPool = new Pool({
  user:     process.env.CRM_DB_USER     || 'postgres',
  host:     process.env.CRM_DB_HOST     || 'localhost',
  database: process.env.CRM_DB_NAME     || 'crm',
  password: process.env.CRM_DB_PASSWORD || 'postgres',
  port:     Number(process.env.CRM_DB_PORT) || 5432,
});

crmPool.connect((err, client, release) => {
  if (err) {
    console.error('❌ CRM Database connection error:', err.stack);
  } else {
    console.log(`✅ [CRM DB]  Connected to "${process.env.CRM_DB_NAME || 'crm'}" on port ${process.env.CRM_DB_PORT || 5432}`);
    release();
  }
});

// Legacy alias — kept so any file still importing `pool` doesn't crash immediately.
// All new code should import hrmsPool or crmPool explicitly.
export const pool = hrmsPool;
