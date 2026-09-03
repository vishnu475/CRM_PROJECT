import { pool } from './db/pool.js';

async function addManagerCommentColumn() {
  console.log('Adding manager_comment column to PostgreSQL leave_requests table...');
  try {
    await pool.query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS manager_comment TEXT;`);
    console.log('✅ Successfully added manager_comment column to leave_requests table.');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await pool.end();
  }
}

addManagerCommentColumn();
