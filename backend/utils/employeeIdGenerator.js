import { hrmsPool } from '../db/pool.js';

/**
 * Calculates the next sequential Employee ID based strictly on MAX(existing employee IDs) + 1
 * in the database employees table.
 *
 * Example:
 * If existing employee numbers are 1, 2, 3, 4, 5, 6, 8, 9, 10:
 * MAX is 10, so next ID is 11 (EMP-011). Missing ID 7 is never reused.
 *
 * Calling this for preview does NOT increment or mutate sequence counters.
 */
export async function getNextEmployeeSequence(client_or_pool = hrmsPool, forUpdate = false) {
  if (forUpdate) {
    try {
      await client_or_pool.query(`
        INSERT INTO number_sequences (id, prefix, current_value, padding, description, updated_at)
        VALUES ('seq-emp', 'EMP-', 0, 3, 'Employee Code Sequence', NOW())
        ON CONFLICT (id) DO NOTHING
      `);
      await client_or_pool.query(`SELECT current_value FROM number_sequences WHERE id = 'seq-emp' FOR UPDATE`);
    } catch (e) {
      // Ignore if locking is not supported or read-only
    }
  }

  // Query maximum numerical value among all existing employees in the employees table
  const res = await client_or_pool.query(`
    SELECT COALESCE(MAX(
      COALESCE(NULLIF(regexp_replace(COALESCE(emp_code, id), '[^0-9]', '', 'g'), ''), '0')::bigint
    ), 0) AS max_id
    FROM employees
  `);

  const maxId = parseInt(res.rows[0]?.max_id || 0, 10);
  const nextNumber = maxId + 1;

  // Format codes with minimum 3-digit padding (or larger if number exceeds 999)
  const padLength = Math.max(3, String(maxId).length);
  const lastEmpCode = maxId > 0 ? `EMP-${String(maxId).padStart(padLength, '0')}` : 'EMP-000';

  const nextPadLength = Math.max(3, String(nextNumber).length);
  const nextEmpCode = `EMP-${String(nextNumber).padStart(nextPadLength, '0')}`;

  return {
    lastNumber: maxId,
    nextNumber,
    lastEmpCode,
    nextEmpCode
  };
}

/**
 * Atomically updates the number_sequences tracking table when an employee is actually saved.
 */
export async function syncEmployeeSequence(client_or_pool, currentMaxNumber) {
  if (!currentMaxNumber || isNaN(currentMaxNumber)) return;
  await client_or_pool.query(`
    INSERT INTO number_sequences (id, prefix, current_value, padding, description, updated_at)
    VALUES ('seq-emp', 'EMP-', $1, 3, 'Employee Code Sequence', NOW())
    ON CONFLICT (id) DO UPDATE SET current_value = $1, prefix = 'EMP-', updated_at = NOW()
  `, [currentMaxNumber]);
}

