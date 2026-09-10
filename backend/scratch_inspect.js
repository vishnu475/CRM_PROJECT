import { hrmsPool } from './db/pool.js';

async function run() {
  try {
    const constraints = await hrmsPool.query(`
      SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'employees'
    `);
    console.log('Employees constraints:', constraints.rows);

    const empCodeCount = await hrmsPool.query(`SELECT count(DISTINCT emp_code), count(*) FROM employees`);
    console.log('Employee codes count:', empCodeCount.rows[0]);

    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
run();
