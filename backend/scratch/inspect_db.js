import { pool } from '../db/pool.js';

async function inspect() {
  try {
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('Tables in DB:', tables.rows.map(r => r.table_name).join(', '));
    for (const t of ['tasks', 'employees', 'departments', 'performance_reviews', 'notifications', 'ess_notifications', 'activity_logs', 'projects']) {
      const cols = await pool.query("SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position", [t]);
      console.log(`\n=== Table: ${t} (${cols.rows.length} columns) ===`);
      console.log(cols.rows.map(c => `  ${c.column_name}: ${c.data_type} [nullable: ${c.is_nullable}, default: ${c.column_default}]`).join('\n'));
    }
  } catch (e) {
    console.error('Inspect error:', e);
  } finally {
    await pool.end();
  }
}
inspect();
