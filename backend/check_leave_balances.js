import { hrmsPool } from './db/pool.js';

async function main() {
  const res = await hrmsPool.query(`
    SELECT c.conname, pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c 
    JOIN pg_class t ON c.conrelid = t.oid 
    WHERE t.relname = 'leave_balances';
  `);
  console.log('CONSTRAINTS:', res.rows);

  const cols = await hrmsPool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'shift_rosters';
  `);
  console.log('COLUMNS:', cols.rows);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
