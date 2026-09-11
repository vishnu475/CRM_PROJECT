import { hrmsPool } from '../db/pool.js';

async function resetTaskData() {
  const client = await hrmsPool.connect();
  try {
    await client.query('BEGIN');

    console.log('--- Cleaning task transactional tables ---');
    
    const delAct = await client.query('DELETE FROM task_activities');
    console.log(`Deleted ${delAct.rowCount} rows from task_activities`);

    const delCom = await client.query('DELETE FROM task_comments');
    console.log(`Deleted ${delCom.rowCount} rows from task_comments`);

    const delAtt = await client.query('DELETE FROM task_attachments');
    console.log(`Deleted ${delAtt.rowCount} rows from task_attachments`);

    const delTasks = await client.query('DELETE FROM tasks');
    console.log(`Deleted ${delTasks.rowCount} rows from tasks`);

    await client.query('COMMIT');

    console.log('--- Verifying counts ---');
    const cTasks = await client.query('SELECT count(*) FROM tasks');
    const cAct = await client.query('SELECT count(*) FROM task_activities');
    const cCom = await client.query('SELECT count(*) FROM task_comments');
    const cAtt = await client.query('SELECT count(*) FROM task_attachments');

    console.log(`tasks count: ${cTasks.rows[0].count}`);
    console.log(`task_activities count: ${cAct.rows[0].count}`);
    console.log(`task_comments count: ${cCom.rows[0].count}`);
    console.log(`task_attachments count: ${cAtt.rows[0].count}`);

    // Verify non-task tables are completely intact
    const cEmp = await client.query('SELECT count(*) FROM employees');
    const cDep = await client.query('SELECT count(*) FROM departments');
    const cUsers = await client.query('SELECT count(*) FROM users');
    console.log(`Employees preserved count: ${cEmp.rows[0].count}`);
    console.log(`Departments preserved count: ${cDep.rows[0].count}`);
    console.log(`Users preserved count: ${cUsers.rows[0].count}`);

    console.log('✅ Task data successfully and cleanly reset!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error resetting task data:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

resetTaskData();
