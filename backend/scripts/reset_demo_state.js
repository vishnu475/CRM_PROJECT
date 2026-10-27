import { hrmsPool as pool } from '../db/pool.js';

async function reset() {
  await pool.query(`
    UPDATE testing_requests 
    SET status = 'READY_FOR_TESTING', completion_percentage = 75.00, total_tasks = 20, completed_tasks = 15, pending_tasks = 5
    WHERE id = 'TR-PRJ001-ATT'
  `);
  console.log('✅ TR-PRJ001-ATT reset to READY_FOR_TESTING (Pulsing Indicator active)');
  process.exit(0);
}

reset();
