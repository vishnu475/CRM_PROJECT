import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Production-grade Database Migration Runner with Schema Tracking.
 * Guarantees idempotent, transactional, and deterministic migration execution.
 */

export async function ensureMigrationTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(100) UNIQUE NOT NULL,
      migration_name VARCHAR(255) NOT NULL,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function computeChecksum(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export async function runMigrations({ pool, migrationsDir, label = 'DB', isSeed = false }) {
  if (!fs.existsSync(migrationsDir)) {
    console.log(`[${label}] Migrations directory not found: ${migrationsDir}`);
    return { total: 0, applied: 0, skipped: 0, newApplied: 0 };
  }

  await ensureMigrationTable(pool);

  // Fetch already applied migrations
  const appliedRes = await pool.query(`SELECT version, checksum FROM schema_migrations`);
  const appliedMap = new Map(appliedRes.rows.map(r => [r.version, r.checksum]));

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  let newApplied = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    const checksum = computeChecksum(sql);
    const version = isSeed ? `seed_${file}` : file;

    if (appliedMap.has(version)) {
      skipped++;
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO schema_migrations (version, migration_name, checksum)
         VALUES ($1, $2, $3)`,
        [version, file, checksum]
      );
      await client.query('COMMIT');
      newApplied++;
      console.log(`  ✅ [${label}] Applied migration: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ❌ [${label}] Migration failed in ${file}:`, err.message);
      throw new Error(`[${label}] Migration failed in ${file}: ${err.message}`);
    } finally {
      client.release();
    }
  }

  if (newApplied > 0) {
    console.log(`🎉 [${label}] Migrations complete: ${newApplied} newly applied, ${skipped} already up-to-date.`);
  } else {
    console.log(`ℹ️  [${label}] All ${skipped} migrations are up to date.`);
  }

  return { total: files.length, applied: skipped + newApplied, skipped, newApplied };
}

export async function getMigrationStatus(pool) {
  try {
    await ensureMigrationTable(pool);
    const res = await pool.query(
      `SELECT version, migration_name, checksum, applied_at 
       FROM schema_migrations 
       ORDER BY applied_at ASC`
    );
    return {
      healthy: true,
      count: res.rows.length,
      migrations: res.rows
    };
  } catch (err) {
    return {
      healthy: false,
      count: 0,
      error: err.message
    };
  }
}
