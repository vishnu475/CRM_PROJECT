import { pool } from './db/pool.js';

async function seedPermanentAttendance() {
  const todayStr = '2026-08-24';
  console.log(`Seeding permanent PostgreSQL attendance records for ${todayStr}...`);

  // Upsert Ramesh (EMP-008)
  await pool.query(
    `INSERT INTO attendance_records (id, employee_id, date, status, check_in, check_out, worked_hours, overtime_hours)
     VALUES ('ATT-EMP-008-2026-08-24', 'EMP-008', $1::date, 'Present', '12:10 PM', '-', 0.0, 0.0)
     ON CONFLICT (employee_id, date) DO UPDATE 
     SET check_in = '12:10 PM', check_out = '-', status = 'Present', updated_at = CURRENT_TIMESTAMP`,
    [todayStr]
  );

  // Upsert Ashok (EMP-006)
  await pool.query(
    `INSERT INTO attendance_records (id, employee_id, date, status, check_in, check_out, worked_hours, overtime_hours)
     VALUES ('ATT-EMP-006-2026-08-24', 'EMP-006', $1::date, 'Late In', '12:07 PM', '11:28 AM', 8.5, 0.5)
     ON CONFLICT (employee_id, date) DO UPDATE 
     SET check_in = '12:07 PM', check_out = '11:28 AM', status = 'Late In', updated_at = CURRENT_TIMESTAMP`,
    [todayStr]
  );

  console.log('✅ Permanent PostgreSQL Attendance Records Seeded:');
  const res = await pool.query(`SELECT id, employee_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, check_in, check_out, status FROM attendance_records WHERE date = $1::date`, [todayStr]);
  console.table(res.rows);

  await pool.end();
}

seedPermanentAttendance().catch(console.error);
