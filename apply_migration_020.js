import { hrmsPool as pool } from './backend/db/pool.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🚀 Executing Migration 020: Project-Centric QA System...');
  try {
    const sqlPath = path.join(__dirname, 'backend', 'db', 'migrations', '020_project_centric_qa_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Migration 020 applied successfully to HRMS PostgreSQL database!');

    // Verification queries
    const prj = await pool.query('SELECT id, name, status, project_manager FROM projects WHERE id = $1', ['PRJ-001']);
    console.log('📦 Project PRJ-001:', prj.rows[0]);

    const req = await pool.query('SELECT id, project_id, project_name, module_name, developer_employee_name, tester_employee_name, completion_percentage, status, testing_url FROM testing_requests WHERE id = $1', ['TR-PRJ001-ATT']);
    console.log('📋 Testing Request:', req.rows[0]);

    const tc = await pool.query('SELECT count(*) FROM test_cases WHERE testing_request_id = $1', ['TR-PRJ001-ATT']);
    console.log('🧪 Test Cases count:', tc.rows[0].count);

    const bugs = await pool.query('SELECT bug_id, title, severity, status FROM bugs WHERE testing_request_id = $1', ['TR-PRJ001-ATT']);
    console.log('🐛 Bugs:', bugs.rows);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing Migration 020:', err);
    process.exit(1);
  }
}

runMigration();
