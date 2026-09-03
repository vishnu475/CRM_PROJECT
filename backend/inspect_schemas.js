import { pool } from './db/pool.js';

async function inspect() {
  for (const tbl of ['loans', 'expense_claims', 'employee_bank_details', 'attendance_records', 'leave_requests', 'statutory_rules', 'employees']) {
    const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [tbl]);
    console.log(`\n=== ${tbl} ===`);
    console.log(res.rows.map(r => `${r.column_name}: ${r.data_type}`).join(', '));
  }
  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
