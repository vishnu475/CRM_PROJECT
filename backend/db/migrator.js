import fs from 'fs';
import path from 'path';

async function ensureMigrationsTable(pool) {
  const query = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIALE PRIMARY KEY,
      version VARCHAR(255) UNIQUE,
      migration_name VARCHAR(255),
      checksum VARCHAR(255),
      applied_at TUIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);

  try {
    await pool.query('ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS migration_name VARCHAR(255)');
    await pool.query('ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS version VARCHAR(255)');
  } catch (e) {}
}

export async function runMigrations({ pool, migrationsDir, label = 'Database', isSeed = false }) {
  if (!fs.existsSync(migrationsDir)) {
    console.log('[' + label + '] Migration directory "' + migrationsDir + '" does not exist. Skipping.');
    return;
  }

  await ensureMigrationsTable(pool);

  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
  if (files.length === 0) {
    console.log('[' + label + ']No SQL migration files found in ' + migrationsDir + '.');
    return;
  }

  const res = await pool.query('SELECT version, migration_name FROM schema_migrations');
  const appliedFiles = new Set(res.rows.flatMap((row) => [row.version, row.migration_name].filter(Boolean)));
  let appliedCount = 0;

  for (const file of files) {
    if (appliedFiles.has(file)) continue;

    const filePath = path.join(migrationsDir, file);
    console.log('[' + label + '] Running migration: ' + file + '...');
    try {
      await pool.query('BEGIN');
      await pool.query(fs.readFileSync(filePath, 'utf8'));
      await pool.query('INSERT INTO schema_migrations (version, migration_name) VALUES ($1, $2)', [file, file]);
      await pool.query('COMMIT');
      console.log('[' + label + '] Migration applied successfully: ' + file);
      appliedCount++;
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('[' + label + '] Migration failed (' + file + '):', err.message);
      throw err;
    }
  }

  if (appliedCount === 0) {
    console.log('[' + label + '] All migrations are already up to date (' + files.length + ' total).');
  } else {
    console.log('[' + label + '] Applied ' + appliedCount + ' new migration(s).');
  }
}

export async function getMigrationStatus(pool) {
  try {
    await ensureMigrationsTable(pool);
    const res = await pool.query('SELECT id, version, migration_name, applied_at FROM schema_migrations ORDER BY applied_at ASC');
    return {
      count: res.rows.length,
      migrations: res.rows
    };
  } catch (err) {
    return {count: 0, migrations: [], error: err.message};
  }
}

export default {
  runMigrations,
  getMigrationStatus
};
