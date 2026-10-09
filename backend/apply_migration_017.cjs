const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    user: process.env.CRM_DB_USER || 'postgres',
    host: process.env.CRM_DB_HOST || 'localhost',
    password: process.env.CRM_DB_PASSWORD || 'postgres',
    port: Number(process.env.CRM_DB_PORT) || 5432,
    database: process.env.CRM_DB_NAME || 'crm',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL CRM Database.');

    const sqlPath = path.join(__dirname, 'db', 'migrations', 'crm', '017_inventory_stock_movements.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('✅ Migration 017_inventory_stock_movements.sql applied successfully!');

    const res = await client.query('SELECT id, name, sku, stock, cost_price, reorder_level, warehouse_location FROM products');
    console.log(`\nProducts Table (${res.rows.length} records):`);
    console.table(res.rows);

    const movements = await client.query('SELECT id, product_name, movement_type, quantity, previous_stock, new_stock, reason FROM stock_movements');
    console.log(`\nStock Movements Table (${movements.rows.length} records):`);
    console.table(movements.rows);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
