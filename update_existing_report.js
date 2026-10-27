import { hrmsPool as pool } from './backend/db/pool.js';

async function update() {
  const bugs = await pool.query('SELECT bug_id, title, description, severity, status FROM bugs WHERE bug_id = $1', ['BUG-103']);
  const bugList = bugs.rows.map(b => ({
    bugId: b.bug_id,
    title: b.title,
    description: b.description,
    severity: b.severity,
    status: b.status
  }));

  await pool.query(
    'UPDATE testing_reports SET defects_and_failures = $1, final_verdict = $2 WHERE id = $3',
    [JSON.stringify(bugList), 'FAILED', 'REP-MOD-REC-332542']
  );

  await pool.query(
    'UPDATE testing_documents SET final_verdict = $1 WHERE testing_report_id = $2',
    ['FAILED', 'REP-MOD-REC-332542']
  );

  console.log('Successfully updated REP-MOD-REC-332542 with BUG-103 and verdict FAILED!');
  await pool.end();
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
