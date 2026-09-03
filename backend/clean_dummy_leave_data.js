import { pool } from './db/pool.js';

async function cleanDummyLeaveData() {
  console.log('Resetting and seeding clean PostgreSQL leave_requests table...');
  try {
    // Delete all old dummy and test leave records
    await pool.query(`TRUNCATE TABLE leave_requests RESTART IDENTITY`);
    console.log('✅ Truncated leave_requests table cleanly.');

    // Seed 2 clean real leave requests
    await pool.query(`
      INSERT INTO leave_requests (id, employee_id, employee_name, leave_type, from_date, to_date, start_date, end_date, days, total_days, reason, status, manager_name)
      VALUES 
        ('LV-EMP-005-101', 'EMP-005', 'Vishnu Vardhan', 'Casual Leave', '2026-08-27', '2026-08-27', '2026-08-27', '2026-08-27', 1, 1, 'Personal Emergency Work', 'APPROVED', 'HR Admin'),
        ('LV-EMP-008-102', 'EMP-008', 'Ramesh', 'Sick Leave', '2026-08-28', '2026-08-28', '2026-08-28', '2026-08-28', 1, 1, 'Medical Health Checkup', 'PENDING', 'HR Admin')
    `);
    console.log('✅ Seeded 2 clean real leave requests for Vishnu and Ramesh.');

    const result = await pool.query('SELECT * FROM leave_requests ORDER BY created_at DESC');
    console.table(result.rows);
  } catch (err) {
    console.error('Error cleaning leave records:', err);
  } finally {
    await pool.end();
  }
}

cleanDummyLeaveData();
