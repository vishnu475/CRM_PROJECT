import { crmPool } from '../db/pool.js';

async function main() {
  const projCols = await crmPool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects'");
  console.log('CRM projects columns:', projCols.rows);

  const sample = await crmPool.query("SELECT * FROM projects LIMIT 5");
  console.log('CRM projects sample:', sample.rows);

  process.exit(0);
}

main().catch(console.error);
