const pg = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const pool = new pg.Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/crm'
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'db/migrations/crm/016_vendor_enhancements.sql'), 'utf-8');
    await pool.query(sql);
    console.log('✅ Migration 016 applied successfully to crm database!');
    
    const res = await pool.query('SELECT * FROM vendors');
    console.log(`Vendors in DB: ${res.rows.length}`);
    console.log(res.rows);
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

applyMigration();
