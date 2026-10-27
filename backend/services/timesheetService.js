import { hrmsPool as pool } from '../db/pool.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Parses time string (e.g. "09:00", "09:30", "09:00 AM", "02:30 PM") into minutes from midnight (0-1439).
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  
  // Format: "HH:MM AM/PM" or "H:MM AM/PM"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Format: "HH:MM" (24-hour)
  const h24Match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (h24Match) {
    const hours = parseInt(h24Match[1], 10);
    const minutes = parseInt(h24Match[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes;
    }
  }

  return null;
}

/**
 * Formats minutes from midnight into 24h "HH:MM" string.
 */
export function formatMinutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Formats duration in minutes to readable "Xh Ym" string.
 */
export function formatDurationHours(durationMinutes) {
  if (!durationMinutes || durationMinutes <= 0) return '0h';
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * Check if two time intervals overlap.
 */
export function isOverlapping(startA, endA, startB, endB) {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Helper to record audit log.
 */
export async function logTimesheetAudit(timesheetId, userId, action, metadata = {}) {
  try {
    const id = `TSAUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await pool.query(
      `INSERT INTO timesheet_audit_logs (id, timesheet_id, user_id, action, metadata, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [id, timesheetId, userId, action, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.warn('[Timesheet Audit Log Error]', err.message);
  }
}

export class TimesheetService {
  /**
   * 1. ADMIN: Assign Timesheet (Single day or date range)
   */
  static async assignTimesheet(data, adminUser) {
    const {
      employee_id,
      start_date,
      end_date,
      expected_hours_per_day = 8.0,
      proof_required = true,
      allow_multiple_entries = true,
      require_description = true,
      instructions = ''
    } = data;

    if (!employee_id) throw new Error('Employee is required.');
    if (!start_date) throw new Error('Start date is required.');

    // Verify employee exists
    const empCheck = await pool.query(
      `SELECT id, emp_code, name, department, designation FROM employees WHERE id = $1 OR emp_code = $1`,
      [employee_id]
    );
    if (empCheck.rowCount === 0) {
      throw new Error(`Employee ${employee_id} not found.`);
    }
    const emp = empCheck.rows[0];
    const canonicalEmpCode = emp.emp_code || emp.id;

    const startDateObj = new Date(start_date);
    const endDateObj = end_date ? new Date(end_date) : new Date(start_date);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new Error('Invalid date provided.');
    }
    if (endDateObj < startDateObj) {
      throw new Error('End date cannot be earlier than start date.');
    }

    const assignmentId = `TSA-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const assignedBy = adminUser?.empCode || adminUser?.id || 'ADMIN';

    // Insert assignment record
    await pool.query(
      `INSERT INTO timesheet_assignments (
        id, employee_id, start_date, end_date, expected_hours_per_day,
        proof_required, allow_multiple_entries, require_description, instructions,
        assigned_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [
        assignmentId,
        canonicalEmpCode,
        start_date,
        end_date || start_date,
        Number(expected_hours_per_day),
        Boolean(proof_required),
        Boolean(allow_multiple_entries),
        Boolean(require_description),
        instructions || '',
        assignedBy
      ]
    );

    // Generate daily timesheet records for the entire range
    const createdTimesheets = [];
    const curr = new Date(startDateObj);

    while (curr <= endDateObj) {
      const dateStr = curr.toISOString().split('T')[0];
      const tsId = `TS-${canonicalEmpCode}-${dateStr}`;

      // Insert or update existing DRAFT timesheet
      const upsertRes = await pool.query(
        `INSERT INTO timesheets (
          id, assignment_id, employee_id, date, expected_hours, total_hours, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 0.0, 'DRAFT', NOW(), NOW())
        ON CONFLICT (employee_id, date) DO UPDATE SET
          assignment_id = EXCLUDED.assignment_id,
          expected_hours = EXCLUDED.expected_hours,
          updated_at = NOW()
        WHERE timesheets.status = 'DRAFT'
        RETURNING *`,
        [tsId, assignmentId, canonicalEmpCode, dateStr, Number(expected_hours_per_day)]
      );

      if (upsertRes.rowCount > 0) {
        createdTimesheets.push(upsertRes.rows[0]);
        await logTimesheetAudit(upsertRes.rows[0].id, assignedBy, 'TIMESHEET_ASSIGNED', {
          assignment_id: assignmentId,
          date: dateStr,
          expected_hours: expected_hours_per_day
        });
      }

      // Next day
      curr.setDate(curr.getDate() + 1);
    }

    return {
      success: true,
      message: `Assigned timesheets for ${emp.name} (${canonicalEmpCode}) across ${createdTimesheets.length} day(s).`,
      assignment_id: assignmentId,
      employee: {
        id: canonicalEmpCode,
        name: emp.name,
        department: emp.department
      },
      timesheets_count: createdTimesheets.length
    };
  }

  /**
   * 2. ADMIN: List all employee timesheets with search & filters
   */
  static async getAdminTimesheets(filters = {}) {
    const {
      date,
      startDate,
      endDate,
      employeeId,
      department,
      status,
      search
    } = filters;

    let query = `
      SELECT
        ts.id,
        ts.assignment_id,
        ts.employee_id,
        COALESCE(e.name, ts.employee_name, ts.employee_id) AS employee_name,
        COALESCE(e.emp_code, ts.employee_id) AS emp_code,
        e.department,
        e.designation,
        ts.date::text AS date,
        ts.expected_hours,
        ts.total_hours,
        COALESCE(ts.total_minutes, 0) AS total_minutes,
        ts.status,
        ts.submitted_at,
        ts.approved_by,
        ts.approved_at,
        ts.rejected_by,
        ts.rejected_at,
        ts.rejection_reason,
        ts.created_at,
        ts.updated_at,
        ta.proof_required,
        ta.allow_multiple_entries,
        ta.require_description,
        ta.instructions,
        COUNT(DISTINCT te.id) AS entries_count,
        COUNT(DISTINCT tp.id) AS proofs_count
      FROM timesheets ts
      LEFT JOIN employees e ON (e.id = ts.employee_id OR e.emp_code = ts.employee_id)
      LEFT JOIN timesheet_assignments ta ON ta.id = ts.assignment_id
      LEFT JOIN timesheet_entries te ON te.timesheet_id = ts.id
      LEFT JOIN timesheet_proofs tp ON tp.timesheet_entry_id = te.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      params.push(date);
      query += ` AND ts.date = $${params.length}`;
    }
    if (startDate) {
      params.push(startDate);
      query += ` AND ts.date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND ts.date <= $${params.length}`;
    }
    if (employeeId) {
      params.push(employeeId);
      query += ` AND (ts.employee_id = $${params.length} OR e.emp_code = $${params.length} OR e.id = $${params.length})`;
    }
    if (department) {
      params.push(department);
      query += ` AND e.department = $${params.length}`;
    }
    if (status && status !== 'ALL') {
      params.push(status.toUpperCase());
      query += ` AND UPPER(ts.status) = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.name ILIKE $${params.length} OR ts.employee_id ILIKE $${params.length} OR e.department ILIKE $${params.length})`;
    }

    query += `
      GROUP BY ts.id, e.name, e.emp_code, e.department, e.designation, ta.proof_required, ta.allow_multiple_entries, ta.require_description, ta.instructions
      ORDER BY ts.date DESC, ts.submitted_at DESC NULLS LAST, ts.created_at DESC
    `;

    const res = await pool.query(query, params);
    return res.rows.map(row => {
      const mins = parseInt(row.total_minutes || '0', 10);
      return {
        ...row,
        expected_hours: Number(row.expected_hours || 8.0),
        total_hours: Number(row.total_hours || 0.0),
        total_minutes: mins,
        duration_formatted: formatDurationHours(mins),
        entries_count: parseInt(row.entries_count || '0', 10),
        proofs_count: parseInt(row.proofs_count || '0', 10)
      };
    });
  }

  /**
   * 3. GET Single Timesheet Detail with Entries, Proofs, and Rules
   */
  static async getTimesheetDetail(id, userContext, isAdmin = false) {
    if (!id) throw new Error('Timesheet ID is required.');

    const tsRes = await pool.query(
      `SELECT
        ts.id,
        ts.assignment_id,
        ts.employee_id,
        COALESCE(e.name, ts.employee_name, ts.employee_id) AS employee_name,
        COALESCE(e.emp_code, ts.employee_id) AS emp_code,
        e.department,
        e.designation,
        ts.date::text AS date,
        ts.expected_hours,
        ts.total_hours,
        COALESCE(ts.total_minutes, 0) AS total_minutes,
        ts.status,
        ts.submitted_at,
        ts.approved_by,
        ts.approved_at,
        ts.rejected_by,
        ts.rejected_at,
        ts.rejection_reason,
        ts.created_at,
        ts.updated_at,
        ta.proof_required,
        ta.allow_multiple_entries,
        ta.require_description,
        ta.instructions
      FROM timesheets ts
      LEFT JOIN employees e ON (e.id = ts.employee_id OR e.emp_code = ts.employee_id)
      LEFT JOIN timesheet_assignments ta ON ta.id = ts.assignment_id
      WHERE ts.id = $1`,
      [id]
    );

    if (tsRes.rowCount === 0) {
      throw new Error(`Timesheet ${id} not found.`);
    }

    const timesheet = tsRes.rows[0];

    // Authorization ownership check for employees
    if (!isAdmin) {
      const userEmpId = userContext?.empCode || userContext?.id;
      if (timesheet.employee_id !== userEmpId && timesheet.emp_code !== userEmpId) {
        throw new Error('Access denied: You do not own this timesheet.');
      }
    }

    // Get entries
    const entriesRes = await pool.query(
      `SELECT
        te.id,
        te.timesheet_id,
        te.start_time,
        te.end_time,
        te.duration_minutes,
        te.work_title,
        te.work_description,
        te.created_at,
        te.updated_at,
        tp.id AS proof_id,
        tp.file_name AS proof_file_name,
        tp.mime_type AS proof_mime_type,
        tp.file_size AS proof_file_size,
        tp.file_hash AS proof_file_hash,
        tp.storage_reference AS proof_storage_reference,
        tp.uploaded_by AS proof_uploaded_by,
        tp.uploaded_at AS proof_uploaded_at
      FROM timesheet_entries te
      LEFT JOIN timesheet_proofs tp ON tp.timesheet_entry_id = te.id
      WHERE te.timesheet_id = $1
      ORDER BY te.start_time ASC, te.created_at ASC`,
      [id]
    );

    const entries = entriesRes.rows.map(row => {
      const proof = row.proof_id ? {
        id: row.proof_id,
        timesheet_entry_id: row.id,
        file_name: row.proof_file_name,
        mime_type: row.proof_mime_type,
        file_size: row.proof_file_size,
        file_hash: row.proof_file_hash,
        storage_reference: row.proof_storage_reference,
        uploaded_by: row.proof_uploaded_by,
        uploaded_at: row.proof_uploaded_at
      } : null;

      return {
        id: row.id,
        timesheet_id: row.timesheet_id,
        start_time: row.start_time,
        end_time: row.end_time,
        duration_minutes: row.duration_minutes,
        duration_formatted: formatDurationHours(row.duration_minutes),
        work_title: row.work_title,
        work_description: row.work_description,
        created_at: row.created_at,
        updated_at: row.updated_at,
        proof
      };
    });

    return {
      ...timesheet,
      expected_hours: Number(timesheet.expected_hours || 8.0),
      total_hours: Number(timesheet.total_hours || 0.0),
      total_minutes: parseInt(timesheet.total_minutes || '0', 10),
      duration_formatted: formatDurationHours(parseInt(timesheet.total_minutes || '0', 10)),
      proof_required: timesheet.proof_required ?? true,
      allow_multiple_entries: timesheet.allow_multiple_entries ?? true,
      require_description: timesheet.require_description ?? true,
      entries
    };
  }

  /**
   * 4. EMPLOYEE: Get My Timesheets (list/calendar)
   */
  static async getMyTimesheets(userContext, filters = {}) {
    const userEmpId = userContext?.empCode || userContext?.id;
    if (!userEmpId) throw new Error('Unauthenticated employee user.');

    const { date, month, status } = filters;
    let query = `
      SELECT
        ts.id,
        ts.assignment_id,
        ts.employee_id,
        COALESCE(e.name, ts.employee_name, ts.employee_id) AS employee_name,
        COALESCE(e.emp_code, ts.employee_id) AS emp_code,
        ts.date::text AS date,
        ts.expected_hours,
        ts.total_hours,
        ts.status,
        ts.submitted_at,
        ts.approved_by,
        ts.approved_at,
        ts.rejected_by,
        ts.rejected_at,
        ts.rejection_reason,
        ts.created_at,
        ts.updated_at,
        ta.proof_required,
        ta.allow_multiple_entries,
        ta.require_description,
        ta.instructions,
        COUNT(DISTINCT te.id) AS entries_count,
        COUNT(DISTINCT tp.id) AS proofs_count
      FROM timesheets ts
      LEFT JOIN employees e ON (e.id = ts.employee_id OR e.emp_code = ts.employee_id)
      LEFT JOIN timesheet_assignments ta ON ta.id = ts.assignment_id
      LEFT JOIN timesheet_entries te ON te.timesheet_id = ts.id
      LEFT JOIN timesheet_proofs tp ON tp.timesheet_entry_id = te.id
      WHERE (ts.employee_id = $1 OR e.emp_code = $1 OR e.id = $1)
    `;
    const params = [userEmpId];

    if (date) {
      params.push(date);
      query += ` AND ts.date = $${params.length}`;
    }
    if (month) {
      params.push(`${month}%`);
      query += ` AND ts.date::text LIKE $${params.length}`;
    }
    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND ts.status = $${params.length}`;
    }

    query += `
      GROUP BY ts.id, e.name, e.emp_code, ta.proof_required, ta.allow_multiple_entries, ta.require_description, ta.instructions
      ORDER BY ts.date DESC, ts.created_at DESC
    `;

    const res = await pool.query(query, params);
    return res.rows.map(row => ({
      ...row,
      expected_hours: Number(row.expected_hours || 8.0),
      total_hours: Number(row.total_hours || 0.0),
      entries_count: parseInt(row.entries_count || '0', 10),
      proofs_count: parseInt(row.proofs_count || '0', 10)
    }));
  }

  /**
   * 4A. EMPLOYEE: Get Current Open/Draft Timesheet
   * Returns ONLY DRAFT or OPEN timesheets for authenticated employee.
   * Never returns SUBMITTED, APPROVED, REJECTED, or COMPLETED.
   * If none exists, returns null.
   */
  static async getCurrentTimesheet(userContext, targetDate = null) {
    const userEmpId = userContext?.empCode || userContext?.id;
    if (!userEmpId) throw new Error('Unauthenticated employee user.');

    let query = `
      SELECT
        ts.id,
        ts.assignment_id,
        ts.employee_id,
        COALESCE(e.name, ts.employee_name, ts.employee_id) AS employee_name,
        COALESCE(e.emp_code, ts.employee_id) AS emp_code,
        e.department,
        e.designation,
        ts.date::text AS date,
        ts.expected_hours,
        ts.total_hours,
        COALESCE(ts.total_minutes, 0) AS total_minutes,
        ts.status,
        ts.submitted_at,
        ts.created_at,
        ts.updated_at,
        ta.proof_required,
        ta.allow_multiple_entries,
        ta.require_description,
        ta.instructions
      FROM timesheets ts
      LEFT JOIN employees e ON (e.id = ts.employee_id OR e.emp_code = ts.employee_id)
      LEFT JOIN timesheet_assignments ta ON ta.id = ts.assignment_id
      WHERE (ts.employee_id = $1 OR e.emp_code = $1 OR e.id = $1)
        AND ts.status IN ('DRAFT', 'OPEN')
    `;
    const params = [userEmpId];

    if (targetDate) {
      params.push(targetDate);
      query += ` AND ts.date = $${params.length}`;
    }

    query += ` ORDER BY ts.date DESC, ts.created_at DESC LIMIT 1`;

    const res = await pool.query(query, params);
    if (res.rowCount === 0) {
      return null;
    }

    const timesheet = res.rows[0];

    const entriesRes = await pool.query(
      `SELECT
        te.id,
        te.timesheet_id,
        te.start_time,
        te.end_time,
        te.duration_minutes,
        te.work_title,
        te.work_description,
        te.created_at,
        te.updated_at,
        tp.id AS proof_id,
        tp.file_name AS proof_file_name,
        tp.mime_type AS proof_mime_type,
        tp.file_size AS proof_file_size,
        tp.file_hash AS proof_file_hash,
        tp.storage_reference AS proof_storage_reference,
        tp.uploaded_by AS proof_uploaded_by,
        tp.uploaded_at AS proof_uploaded_at
      FROM timesheet_entries te
      LEFT JOIN timesheet_proofs tp ON tp.timesheet_entry_id = te.id
      WHERE te.timesheet_id = $1
      ORDER BY te.start_time ASC, te.created_at ASC`,
      [timesheet.id]
    );

    const entries = entriesRes.rows.map(row => ({
      id: row.id,
      timesheet_id: row.timesheet_id,
      start_time: row.start_time,
      end_time: row.end_time,
      duration_minutes: row.duration_minutes,
      duration_formatted: formatDurationHours(row.duration_minutes),
      work_title: row.work_title,
      work_description: row.work_description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      proof: row.proof_id ? {
        id: row.proof_id,
        timesheet_entry_id: row.id,
        file_name: row.proof_file_name,
        mime_type: row.proof_mime_type,
        file_size: row.proof_file_size,
        file_hash: row.proof_file_hash,
        storage_reference: row.proof_storage_reference,
        uploaded_by: row.proof_uploaded_by,
        uploaded_at: row.proof_uploaded_at
      } : null
    }));

    const mins = parseInt(timesheet.total_minutes || '0', 10);
    return {
      ...timesheet,
      expected_hours: Number(timesheet.expected_hours || 8.0),
      total_hours: Number(timesheet.total_hours || 0.0),
      total_minutes: mins,
      duration_formatted: formatDurationHours(mins),
      proof_required: timesheet.proof_required ?? true,
      allow_multiple_entries: timesheet.allow_multiple_entries ?? true,
      require_description: timesheet.require_description ?? true,
      entries
    };
  }

  /**
   * 4B. EMPLOYEE: Get or Create DRAFT Timesheet for a date
   */
  static async getOrCreateDraftTimesheet(date, userContext, expectedHours = 8.0) {
    const userEmpId = userContext?.empCode || userContext?.id;
    if (!userEmpId) throw new Error('Unauthenticated employee user.');

    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }

    const empCheck = await pool.query(
      `SELECT id, emp_code, name, department, designation FROM employees WHERE id = $1 OR emp_code = $1`,
      [userEmpId]
    );
    const canonicalEmpId = empCheck.rows[0]?.emp_code || empCheck.rows[0]?.id || userEmpId;
    const empName = empCheck.rows[0]?.name || userContext?.name || userEmpId;

    const existingRes = await pool.query(
      `SELECT * FROM timesheets WHERE employee_id = $1 AND date = $2`,
      [canonicalEmpId, date]
    );

    if (existingRes.rowCount > 0) {
      const existing = existingRes.rows[0];
      if (existing.status === 'SUBMITTED' || existing.status === 'APPROVED') {
        throw new Error(`Timesheet for ${date} has already been submitted and is saved in History.`);
      }
      return await this.getTimesheetDetail(existing.id, userContext, false);
    }

    const tsId = `TS-${canonicalEmpId}-${date}`;
    await pool.query(
      `INSERT INTO timesheets (
        id, employee_id, employee_name, date, expected_hours, total_hours, total_minutes, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 0.0, 0, 'DRAFT', NOW(), NOW())
      ON CONFLICT (employee_id, date) DO NOTHING`,
      [tsId, canonicalEmpId, empName, date, expectedHours]
    );

    await logTimesheetAudit(tsId, canonicalEmpId, 'DRAFT_TIMESHEET_CREATED', { date });
    return await this.getTimesheetDetail(tsId, userContext, false);
  }

  /**
   * 4C. EMPLOYEE: Save Draft
   */
  static async saveDraftTimesheet(timesheetId, data, userContext) {
    const userEmpId = userContext?.empCode || userContext?.id;
    const tsRes = await pool.query(`SELECT * FROM timesheets WHERE id = $1`, [timesheetId]);
    if (tsRes.rowCount === 0) throw new Error('Timesheet not found.');
    const ts = tsRes.rows[0];

    if (userEmpId && ts.employee_id !== userEmpId) throw new Error('Unauthorized.');
    if (ts.status === 'SUBMITTED' || ts.status === 'APPROVED') {
      throw new Error('Timesheet has already been submitted and cannot be modified.');
    }

    await this._recalculateTotalHours(timesheetId);
    const updated = await pool.query(
      `UPDATE timesheets SET status = 'DRAFT', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [timesheetId]
    );

    await logTimesheetAudit(timesheetId, userEmpId, 'TIMESHEET_DRAFT_SAVED');
    return { success: true, message: 'Draft saved successfully.', timesheet: updated.rows[0] };
  }

  /**
   * 4D. EMPLOYEE: Timesheet History
   * Returns only submitted / historical timesheets (status != 'DRAFT')
   */
  static async getEmployeeHistory(userContext, filters = {}) {
    const userEmpId = userContext?.empCode || userContext?.id;
    if (!userEmpId) throw new Error('Unauthenticated employee user.');

    const { date, month, status } = filters;
    let query = `
      SELECT
        ts.id,
        ts.assignment_id,
        ts.employee_id,
        COALESCE(e.name, ts.employee_name, ts.employee_id) AS employee_name,
        COALESCE(e.emp_code, ts.employee_id) AS emp_code,
        ts.date::text AS date,
        ts.expected_hours,
        ts.total_hours,
        COALESCE(ts.total_minutes, 0) AS total_minutes,
        ts.status,
        ts.submitted_at,
        ts.approved_by,
        ts.approved_at,
        ts.rejected_by,
        ts.rejected_at,
        ts.rejection_reason,
        ts.created_at,
        ts.updated_at,
        COUNT(DISTINCT te.id) AS entries_count,
        COUNT(DISTINCT tp.id) AS proofs_count
      FROM timesheets ts
      LEFT JOIN employees e ON (e.id = ts.employee_id OR e.emp_code = ts.employee_id)
      LEFT JOIN timesheet_entries te ON te.timesheet_id = ts.id
      LEFT JOIN timesheet_proofs tp ON tp.timesheet_entry_id = te.id
      WHERE (ts.employee_id = $1 OR e.emp_code = $1 OR e.id = $1)
        AND UPPER(ts.status) IN ('SUBMITTED', 'APPROVED', 'REJECTED')
    `;
    const params = [userEmpId];

    if (date) {
      params.push(date);
      query += ` AND ts.date = $${params.length}`;
    }
    if (month) {
      params.push(`${month}%`);
      query += ` AND ts.date::text LIKE $${params.length}`;
    }
    if (status && status !== 'ALL') {
      params.push(status.toUpperCase());
      query += ` AND UPPER(ts.status) = $${params.length}`;
    }

    query += `
      GROUP BY ts.id, e.name, e.emp_code
      ORDER BY ts.date DESC, ts.submitted_at DESC NULLS LAST
    `;

    const res = await pool.query(query, params);
    return res.rows.map(row => {
      const mins = parseInt(row.total_minutes || '0', 10);
      return {
        ...row,
        expected_hours: Number(row.expected_hours || 8.0),
        total_hours: Number(row.total_hours || 0.0),
        total_minutes: mins,
        duration_formatted: formatDurationHours(mins),
        entries_count: parseInt(row.entries_count || '0', 10),
        proofs_count: parseInt(row.proofs_count || '0', 10)
      };
    });
  }

  /**
   * 5. WORK ENTRY: Add Entry with Backend Time Calculation & Overlap Validation
   */
  static async addWorkEntry(timesheetId, entryData, userContext) {
    const { start_time, end_time, work_title, work_description = '' } = entryData;
    const userEmpId = userContext?.empCode || userContext?.id;

    if (!work_title || !work_title.trim()) {
      throw new Error('Work title is required.');
    }
    if (!start_time || !end_time) {
      throw new Error('Start time and end time are required.');
    }

    const startMinutes = parseTimeToMinutes(start_time);
    const endMinutes = parseTimeToMinutes(end_time);

    if (startMinutes === null || endMinutes === null) {
      throw new Error('Invalid time format. Please provide HH:MM.');
    }
    if (endMinutes <= startMinutes) {
      throw new Error('End time must be after start time.');
    }

    const durationMinutes = endMinutes - startMinutes;

    // Check timesheet ownership and status
    const tsRes = await pool.query(
      `SELECT ts.*, ta.allow_multiple_entries, ta.require_description
       FROM timesheets ts
       LEFT JOIN timesheet_assignments ta ON ta.id = ts.assignment_id
       WHERE ts.id = $1`,
      [timesheetId]
    );

    if (tsRes.rowCount === 0) throw new Error('Timesheet not found.');
    const ts = tsRes.rows[0];

    if (userEmpId && ts.employee_id !== userEmpId) {
      throw new Error('Unauthorized: You do not own this timesheet.');
    }

    // Submitted or approved timesheets are immutable
    if (ts.status === 'SUBMITTED' || ts.status === 'APPROVED') {
      throw new Error('Timesheet has already been submitted and is locked. Submitted timesheets are immutable.');
    }

    // Check existing entries for overlap
    const existingEntriesRes = await pool.query(
      `SELECT id, start_time, end_time FROM timesheet_entries WHERE timesheet_id = $1`,
      [timesheetId]
    );

    if (ts.allow_multiple_entries === false && existingEntriesRes.rowCount >= 1) {
      throw new Error('Multiple entries are not allowed for this timesheet.');
    }

    for (const ex of existingEntriesRes.rows) {
      const exStart = parseTimeToMinutes(ex.start_time);
      const exEnd = parseTimeToMinutes(ex.end_time);
      if (isOverlapping(startMinutes, endMinutes, exStart, exEnd)) {
        throw new Error('Work entries cannot overlap.');
      }
    }

    const entryId = `TSE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const formattedStart = formatMinutesToTime(startMinutes);
    const formattedEnd = formatMinutesToTime(endMinutes);

    await pool.query(
      `INSERT INTO timesheet_entries (
        id, timesheet_id, start_time, end_time, duration_minutes, work_title, work_description, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        entryId,
        timesheetId,
        formattedStart,
        formattedEnd,
        durationMinutes,
        work_title.trim(),
        work_description.trim()
      ]
    );

    // Recalculate timesheet total_hours
    await this._recalculateTotalHours(timesheetId);

    await logTimesheetAudit(timesheetId, userEmpId, 'ENTRY_CREATED', {
      entry_id: entryId,
      work_title: work_title.trim(),
      duration_minutes: durationMinutes
    });

    return {
      id: entryId,
      timesheet_id: timesheetId,
      start_time: formattedStart,
      end_time: formattedEnd,
      duration_minutes: durationMinutes,
      duration_formatted: formatDurationHours(durationMinutes),
      work_title: work_title.trim(),
      work_description: work_description.trim(),
      proof: null
    };
  }

  /**
   * 6. WORK ENTRY: Update Entry (debounced auto-save or edit)
   */
  static async updateWorkEntry(timesheetId, entryId, updateData, userContext) {
    const userEmpId = userContext?.empCode || userContext?.id;

    // Check timesheet
    const tsRes = await pool.query(
      `SELECT ts.*, ta.require_description
       FROM timesheets ts
       LEFT JOIN timesheet_assignments ta ON ta.id = ts.assignment_id
       WHERE ts.id = $1`,
      [timesheetId]
    );
    if (tsRes.rowCount === 0) throw new Error('Timesheet not found.');
    const ts = tsRes.rows[0];

    const isAdmin = userContext?.role === 'Admin' || userContext?.role === 'Executive' || userContext?.role === 'Super Admin';
    if (!isAdmin && userEmpId && ts.employee_id !== userEmpId) {
      throw new Error('Unauthorized.');
    }
    // Submitted or approved timesheets are immutable for employees
    if (!isAdmin && (ts.status === 'SUBMITTED' || ts.status === 'APPROVED')) {
      throw new Error('Timesheet has already been submitted and is locked. Submitted timesheets are immutable.');
    }

    const currentEntryRes = await pool.query(
      `SELECT * FROM timesheet_entries WHERE id = $1 AND timesheet_id = $2`,
      [entryId, timesheetId]
    );
    if (currentEntryRes.rowCount === 0) throw new Error('Entry not found.');
    const currentEntry = currentEntryRes.rows[0];

    const start_time = updateData.start_time !== undefined ? updateData.start_time : currentEntry.start_time;
    const end_time = updateData.end_time !== undefined ? updateData.end_time : currentEntry.end_time;
    const work_title = updateData.work_title !== undefined ? updateData.work_title : currentEntry.work_title;
    const work_description = updateData.work_description !== undefined ? updateData.work_description : currentEntry.work_description;

    const startMinutes = parseTimeToMinutes(start_time);
    const endMinutes = parseTimeToMinutes(end_time);

    if (startMinutes === null || endMinutes === null) {
      throw new Error('Invalid time format.');
    }
    if (endMinutes <= startMinutes) {
      throw new Error('End time must be after start time.');
    }

    const durationMinutes = endMinutes - startMinutes;

    // Check overlap excluding this entry
    const otherEntries = await pool.query(
      `SELECT id, start_time, end_time FROM timesheet_entries WHERE timesheet_id = $1 AND id != $2`,
      [timesheetId, entryId]
    );
    for (const ex of otherEntries.rows) {
      const exStart = parseTimeToMinutes(ex.start_time);
      const exEnd = parseTimeToMinutes(ex.end_time);
      if (isOverlapping(startMinutes, endMinutes, exStart, exEnd)) {
        throw new Error('Work entries cannot overlap.');
      }
    }

    const formattedStart = formatMinutesToTime(startMinutes);
    const formattedEnd = formatMinutesToTime(endMinutes);

    await pool.query(
      `UPDATE timesheet_entries
       SET start_time = $1, end_time = $2, duration_minutes = $3, work_title = $4, work_description = $5, updated_at = NOW()
       WHERE id = $6 AND timesheet_id = $7`,
      [
        formattedStart,
        formattedEnd,
        durationMinutes,
        work_title.trim(),
        work_description.trim(),
        entryId,
        timesheetId
      ]
    );

    await this._recalculateTotalHours(timesheetId);

    await logTimesheetAudit(timesheetId, userEmpId, 'ENTRY_UPDATED', {
      entry_id: entryId,
      work_title: work_title.trim(),
      duration_minutes: durationMinutes
    });

    return {
      id: entryId,
      timesheet_id: timesheetId,
      start_time: formattedStart,
      end_time: formattedEnd,
      duration_minutes: durationMinutes,
      duration_formatted: formatDurationHours(durationMinutes),
      work_title: work_title.trim(),
      work_description: work_description.trim()
    };
  }

  /**
   * 7. WORK ENTRY: Delete Entry and attached PDF
   */
  static async deleteWorkEntry(timesheetId, entryId, userContext) {
    const userEmpId = userContext?.empCode || userContext?.id;

    const tsRes = await pool.query(`SELECT * FROM timesheets WHERE id = $1`, [timesheetId]);
    if (tsRes.rowCount === 0) throw new Error('Timesheet not found.');
    const ts = tsRes.rows[0];

    const isAdmin = userContext?.role === 'Admin' || userContext?.role === 'Executive' || userContext?.role === 'Super Admin';
    if (!isAdmin && userEmpId && ts.employee_id !== userEmpId) throw new Error('Unauthorized.');
    if (!isAdmin && (ts.status === 'SUBMITTED' || ts.status === 'APPROVED')) {
      throw new Error('Timesheet has already been submitted and is locked. Submitted timesheets are immutable.');
    }

    // Delete associated proof file from disk
    const proofRes = await pool.query(
      `SELECT storage_reference FROM timesheet_proofs WHERE timesheet_entry_id = $1`,
      [entryId]
    );
    if (proofRes.rowCount > 0) {
      const storageRef = proofRes.rows[0].storage_reference;
      try {
        const fullPath = path.join(process.cwd(), storageRef.replace(/^\//, ''));
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (e) {
        console.warn('Could not remove file on delete:', e.message);
      }
    }

    await pool.query(`DELETE FROM timesheet_entries WHERE id = $1 AND timesheet_id = $2`, [entryId, timesheetId]);
    await this._recalculateTotalHours(timesheetId);

    await logTimesheetAudit(timesheetId, userEmpId, 'ENTRY_DELETED', { entry_id: entryId });

    return { success: true, message: 'Work entry removed.' };
  }

  /**
   * 8. PDF PROOF: Upload or Replace PDF proof for entry
   */
  static async uploadProof(timesheetId, entryId, file, userContext) {
    if (!file) throw new Error('PDF file is required.');
    const userEmpId = userContext?.empCode || userContext?.id;

    // Validate MIME and extension
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
    if (!isPdfMime || !isPdfExt) {
      // Remove temporary upload file
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new Error('Only PDF files are allowed.');
    }

    // Max 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new Error('Maximum file size is 10 MB.');
    }

    // Check timesheet & entry
    const tsRes = await pool.query(`SELECT * FROM timesheets WHERE id = $1`, [timesheetId]);
    if (tsRes.rowCount === 0) throw new Error('Timesheet not found.');
    const ts = tsRes.rows[0];

    if (userEmpId && ts.employee_id !== userEmpId) throw new Error('Unauthorized.');
    if (ts.status === 'SUBMITTED' || ts.status === 'APPROVED') {
      throw new Error('Timesheet has already been submitted and is locked. Submitted timesheets are immutable.');
    }

    const entryRes = await pool.query(
      `SELECT * FROM timesheet_entries WHERE id = $1 AND timesheet_id = $2`,
      [entryId, timesheetId]
    );
    if (entryRes.rowCount === 0) throw new Error('Entry not found.');

    // Calculate hash
    const fileBuffer = fs.readFileSync(file.path);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const storageReference = `/uploads/timesheets/${path.basename(file.path)}`;

    // Check if entry already has a proof
    const existingProof = await pool.query(
      `SELECT * FROM timesheet_proofs WHERE timesheet_entry_id = $1`,
      [entryId]
    );

    let proofRecord;
    let auditAction = 'PDF_UPLOADED';

    if (existingProof.rowCount > 0) {
      auditAction = 'PDF_REPLACED';
      const oldRef = existingProof.rows[0].storage_reference;
      try {
        const oldFullPath = path.join(process.cwd(), oldRef.replace(/^\//, ''));
        if (fs.existsSync(oldFullPath) && oldFullPath !== file.path) {
          fs.unlinkSync(oldFullPath);
        }
      } catch (e) {}

      const updateRes = await pool.query(
        `UPDATE timesheet_proofs
         SET file_name = $1, mime_type = $2, file_size = $3, file_hash = $4, storage_reference = $5,
             uploaded_by = $6, uploaded_at = NOW(), file_data = $7
         WHERE timesheet_entry_id = $8
         RETURNING *`,
        [
          file.originalname,
          file.mimetype,
          file.size,
          hash,
          storageReference,
          userEmpId || 'EMPLOYEE',
          fileBuffer,
          entryId
        ]
      );
      proofRecord = updateRes.rows[0];
    } else {
      const proofId = `TSP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const insertRes = await pool.query(
        `INSERT INTO timesheet_proofs (
          id, timesheet_entry_id, file_name, mime_type, file_size, file_hash,
          storage_reference, file_data, uploaded_by, uploaded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *`,
        [
          proofId,
          entryId,
          file.originalname,
          file.mimetype,
          file.size,
          hash,
          storageReference,
          fileBuffer,
          userEmpId || 'EMPLOYEE'
        ]
      );
      proofRecord = insertRes.rows[0];
    }

    await logTimesheetAudit(timesheetId, userEmpId, auditAction, {
      entry_id: entryId,
      file_name: file.originalname,
      file_size: file.size,
      file_hash: hash
    });

    return {
      id: proofRecord.id,
      timesheet_entry_id: entryId,
      file_name: proofRecord.file_name,
      mime_type: proofRecord.mime_type,
      file_size: proofRecord.file_size,
      file_hash: proofRecord.file_hash,
      storage_reference: proofRecord.storage_reference,
      uploaded_by: proofRecord.uploaded_by,
      uploaded_at: proofRecord.uploaded_at
    };
  }

  /**
   * 9. PDF PROOF: Delete proof from entry
   */
  static async deleteProof(timesheetId, entryId, userContext) {
    const userEmpId = userContext?.empCode || userContext?.id;

    const tsRes = await pool.query(`SELECT * FROM timesheets WHERE id = $1`, [timesheetId]);
    if (tsRes.rowCount === 0) throw new Error('Timesheet not found.');
    const ts = tsRes.rows[0];

    if (userEmpId && ts.employee_id !== userEmpId) throw new Error('Unauthorized.');
    if (ts.status === 'SUBMITTED' || ts.status === 'APPROVED') {
      throw new Error('Timesheet is read-only.');
    }

    const proofRes = await pool.query(
      `SELECT * FROM timesheet_proofs WHERE timesheet_entry_id = $1`,
      [entryId]
    );
    if (proofRes.rowCount > 0) {
      const storageRef = proofRes.rows[0].storage_reference;
      try {
        const fullPath = path.join(process.cwd(), storageRef.replace(/^\//, ''));
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (e) {}

      await pool.query(`DELETE FROM timesheet_proofs WHERE timesheet_entry_id = $1`, [entryId]);
      await logTimesheetAudit(timesheetId, userEmpId, 'PDF_REMOVED', { entry_id: entryId });
    }

    return { success: true, message: 'PDF proof removed.' };
  }

  /**
   * 10. SUBMIT TIMESHEET: Safe transaction with all 12 validation rules
   */
  static async submitTimesheet(timesheetId, userContext) {
    const userEmpId = userContext?.empCode || userContext?.id;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Timesheet exists
      const tsRes = await client.query(
        `SELECT ts.*, ta.proof_required, ta.require_description
         FROM timesheets ts
         LEFT JOIN timesheet_assignments ta ON ta.id = ts.assignment_id
         WHERE ts.id = $1 FOR UPDATE OF ts`,
        [timesheetId]
      );
      if (tsRes.rowCount === 0) throw new Error('Timesheet does not exist.');
      const ts = tsRes.rows[0];

      // 2. Ownership check
      if (userEmpId && ts.employee_id !== userEmpId) {
        throw new Error('You do not own this timesheet.');
      }

      // 12. Status check (Must be DRAFT or REJECTED)
      if (ts.status === 'SUBMITTED') {
        throw new Error('Timesheet is already submitted.');
      }
      if (ts.status === 'APPROVED') {
        throw new Error('Timesheet is already approved.');
      }

      // Fetch entries with proofs
      const entriesRes = await client.query(
        `SELECT te.*, tp.id AS proof_id, tp.file_name AS proof_name
         FROM timesheet_entries te
         LEFT JOIN timesheet_proofs tp ON tp.timesheet_entry_id = te.id
         WHERE te.timesheet_id = $1
         ORDER BY te.start_time ASC`,
        [timesheetId]
      );

      // 3. At least one work entry exists
      if (entriesRes.rowCount === 0) {
        throw new Error('At least one work entry is required to submit a timesheet.');
      }

      const entries = entriesRes.rows;
      let totalMinutes = 0;
      const proofRequired = ts.proof_required ?? true;
      const requireDescription = ts.require_description ?? true;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        // 4 & 5. Start and End time exist
        if (!entry.start_time || !entry.end_time) {
          throw new Error(`Entry #${i + 1} has missing start or end time.`);
        }

        const startM = parseTimeToMinutes(entry.start_time);
        const endM = parseTimeToMinutes(entry.end_time);

        // 6. End > Start
        if (startM === null || endM === null || endM <= startM) {
          throw new Error(`Entry #${i + 1} (${entry.work_title}): End time must be after start time.`);
        }

        // 7. No overlapping entries
        for (let j = i + 1; j < entries.length; j++) {
          const nextEntry = entries[j];
          const nextStartM = parseTimeToMinutes(nextEntry.start_time);
          const nextEndM = parseTimeToMinutes(nextEntry.end_time);
          if (isOverlapping(startM, endM, nextStartM, nextEndM)) {
            throw new Error(`Work entries overlap between "${entry.work_title}" and "${nextEntry.work_title}".`);
          }
        }

        // 8. Work title exists
        if (!entry.work_title || !entry.work_title.trim()) {
          throw new Error(`Entry #${i + 1} is missing a work title.`);
        }

        // 9. Description exists if required
        if (requireDescription && (!entry.work_description || !entry.work_description.trim())) {
          throw new Error(`Entry "${entry.work_title}" requires a work description.`);
        }

        // 10. PDF proof exists if required
        if (proofRequired && !entry.proof_id) {
          throw new Error(`Entry "${entry.work_title}" requires supporting PDF proof.`);
        }

        totalMinutes += (endM - startM);
      }

      // 11. Total hours calculation
      const calculatedHours = Number((totalMinutes / 60).toFixed(2));

      // Update timesheet to SUBMITTED
      const updateRes = await client.query(
        `UPDATE timesheets
         SET status = 'SUBMITTED',
             submitted_at = NOW(),
             total_hours = $1,
             total_minutes = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [calculatedHours, totalMinutes, timesheetId]
      );

      await client.query('COMMIT');

      await logTimesheetAudit(timesheetId, userEmpId, 'TIMESHEET_SUBMITTED', {
        total_hours: calculatedHours,
        entries_count: entries.length
      });

      return {
        success: true,
        message: 'Timesheet submitted successfully.',
        timesheet: updateRes.rows[0]
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 11. ADMIN: Approve Timesheet
   */
  static async approveTimesheet(timesheetId, adminUser) {
    const adminId = adminUser?.empCode || adminUser?.id || 'ADMIN';

    const tsRes = await pool.query(`SELECT * FROM timesheets WHERE id = $1`, [timesheetId]);
    if (tsRes.rowCount === 0) throw new Error('Timesheet not found.');
    const ts = tsRes.rows[0];

    if (ts.status === 'APPROVED') {
      throw new Error('Timesheet is already approved.');
    }

    const updateRes = await pool.query(
      `UPDATE timesheets
       SET status = 'APPROVED',
           approved_by = $1,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [adminId, timesheetId]
    );

    await logTimesheetAudit(timesheetId, adminId, 'TIMESHEET_APPROVED', {
      approved_by: adminId
    });

    return {
      success: true,
      message: 'Timesheet approved successfully.',
      timesheet: updateRes.rows[0]
    };
  }

  /**
   * 12. ADMIN: Reject Timesheet with mandatory reason
   */
  static async rejectTimesheet(timesheetId, rejectionReason, adminUser) {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('Rejection reason is required.');
    }
    const adminId = adminUser?.empCode || adminUser?.id || 'ADMIN';

    const tsRes = await pool.query(`SELECT * FROM timesheets WHERE id = $1`, [timesheetId]);
    if (tsRes.rowCount === 0) throw new Error('Timesheet not found.');

    const updateRes = await pool.query(
      `UPDATE timesheets
       SET status = 'REJECTED',
           rejected_by = $1,
           rejected_at = NOW(),
           rejection_reason = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [adminId, rejectionReason.trim(), timesheetId]
    );

    await logTimesheetAudit(timesheetId, adminId, 'TIMESHEET_REJECTED', {
      rejected_by: adminId,
      reason: rejectionReason.trim()
    });

    return {
      success: true,
      message: 'Timesheet rejected.',
      timesheet: updateRes.rows[0]
    };
  }

  /**
   * 12B. EMPLOYEE: Assign Re-work / Unlock Timesheet for Editing
   */
  static async reworkTimesheet(timesheetId, userContext) {
    const userEmpId = userContext?.empCode || userContext?.id;

    const tsRes = await pool.query(`SELECT * FROM timesheets WHERE id = $1`, [timesheetId]);
    if (tsRes.rowCount === 0) throw new Error('Timesheet not found.');
    const ts = tsRes.rows[0];

    const updateRes = await pool.query(
      `UPDATE timesheets
       SET status = 'DRAFT',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [timesheetId]
    );

    await logTimesheetAudit(timesheetId, userEmpId, 'TIMESHEET_REWORK_ASSIGNED', {
      previous_status: ts.status
    });

    return {
      success: true,
      message: 'Timesheet unlocked for rework and editing.',
      timesheet: updateRes.rows[0]
    };
  }

  /**
   * 13. REPORTS: Summary KPI metrics
   */
  static async getReportsSummary(filters = {}) {
    const { month, employeeId, status } = filters;
    let query = `
      SELECT
        COUNT(ts.id) AS total_assigned,
        COUNT(CASE WHEN ts.status = 'SUBMITTED' THEN 1 END) AS submitted,
        COUNT(CASE WHEN ts.status = 'APPROVED' THEN 1 END) AS approved,
        COUNT(CASE WHEN ts.status = 'REJECTED' THEN 1 END) AS rejected,
        COUNT(CASE WHEN ts.status = 'DRAFT' THEN 1 END) AS pending,
        COALESCE(SUM(ts.total_hours), 0.0) AS total_hours,
        COALESCE(AVG(NULLIF(ts.total_hours, 0)), 0.0) AS avg_daily_hours,
        COUNT(CASE WHEN ts.expected_hours > 0 AND (ts.total_hours = 0 OR ts.status = 'DRAFT') THEN 1 END) AS missing_timesheets
      FROM timesheets ts
      LEFT JOIN employees e ON (e.id = ts.employee_id OR e.emp_code = ts.employee_id)
      WHERE 1=1
    `;
    const params = [];

    if (month) {
      params.push(`${month}%`);
      query += ` AND ts.date::text LIKE $${params.length}`;
    }
    if (employeeId) {
      params.push(employeeId);
      query += ` AND (ts.employee_id = $${params.length} OR e.emp_code = $${params.length})`;
    }
    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND ts.status = $${params.length}`;
    }

    const res = await pool.query(query, params);
    const r = res.rows[0];

    return {
      totalAssigned: parseInt(r.total_assigned || '0', 10),
      submitted: parseInt(r.submitted || '0', 10),
      approved: parseInt(r.approved || '0', 10),
      rejected: parseInt(r.rejected || '0', 10),
      pending: parseInt(r.pending || '0', 10),
      totalHours: Number(Number(r.total_hours || 0).toFixed(2)),
      averageDailyHours: Number(Number(r.avg_daily_hours || 0).toFixed(2)),
      missingTimesheets: parseInt(r.missing_timesheets || '0', 10)
    };
  }

  /**
   * 14. REPORTS: Employee-wise breakdown
   */
  static async getEmployeeReports(filters = {}) {
    const { month, department, employeeId } = filters;
    let query = `
      SELECT
        COALESCE(e.emp_code, ts.employee_id) AS employee_id,
        COALESCE(e.name, ts.employee_name, ts.employee_id) AS employee_name,
        COALESCE(e.department, 'Engineering') AS department,
        COALESCE(e.designation, 'Team Member') AS designation,
        COUNT(ts.id) AS working_days,
        COUNT(CASE WHEN ts.status = 'SUBMITTED' THEN 1 END) AS submitted,
        COUNT(CASE WHEN ts.status = 'APPROVED' THEN 1 END) AS approved,
        COUNT(CASE WHEN ts.status = 'REJECTED' THEN 1 END) AS rejected,
        COUNT(CASE WHEN ts.status = 'DRAFT' THEN 1 END) AS pending,
        COALESCE(SUM(ts.total_hours), 0.0) AS total_hours
      FROM timesheets ts
      LEFT JOIN employees e ON (e.id = ts.employee_id OR e.emp_code = ts.employee_id)
      WHERE 1=1
    `;
    const params = [];

    if (month) {
      params.push(`${month}%`);
      query += ` AND ts.date::text LIKE $${params.length}`;
    }
    if (department) {
      params.push(department);
      query += ` AND e.department = $${params.length}`;
    }
    if (employeeId) {
      params.push(employeeId);
      query += ` AND (ts.employee_id = $${params.length} OR e.emp_code = $${params.length})`;
    }

    query += `
      GROUP BY COALESCE(e.emp_code, ts.employee_id), e.name, ts.employee_name, ts.employee_id, e.department, e.designation
      ORDER BY total_hours DESC, employee_name ASC
    `;

    const res = await pool.query(query, params);
    return res.rows.map(row => ({
      employee_id: row.employee_id,
      employee_name: row.employee_name,
      department: row.department,
      designation: row.designation,
      working_days: parseInt(row.working_days || '0', 10),
      submitted: parseInt(row.submitted || '0', 10),
      approved: parseInt(row.approved || '0', 10),
      rejected: parseInt(row.rejected || '0', 10),
      pending: parseInt(row.pending || '0', 10),
      total_hours: Number(Number(row.total_hours || 0).toFixed(2))
    }));
  }

  /**
   * 15. ADMIN: Complete Cascade Delete of Timesheet
   * Completely removes timesheet, entries, proof files from disk, proof records, and audit logs.
   */
  static async adminDeleteTimesheet(timesheetId, adminUser) {
    const adminId = adminUser?.empCode || adminUser?.id || 'ADMIN';

    // 1. Check timesheet existence
    const tsRes = await pool.query(`SELECT id, employee_id, date FROM timesheets WHERE id = $1`, [timesheetId]);
    if (tsRes.rowCount === 0) {
      throw new Error(`Timesheet ${timesheetId} not found.`);
    }
    const ts = tsRes.rows[0];

    // 2. Find and delete all physical proof files from disk
    const proofsRes = await pool.query(
      `SELECT id, storage_reference, file_name 
       FROM timesheet_proofs 
       WHERE timesheet_entry_id IN (SELECT id FROM timesheet_entries WHERE timesheet_id = $1)`,
      [timesheetId]
    );

    for (const proof of proofsRes.rows) {
      if (proof.storage_reference) {
        try {
          const filePath = path.join(process.cwd(), proof.storage_reference.replace(/^\//, ''));
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileErr) {
          console.warn(`[Admin Delete] Could not unlink file ${proof.storage_reference}:`, fileErr.message);
        }
      }
    }

    // 3. Cascade delete within database transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete proofs
      await client.query(
        `DELETE FROM timesheet_proofs 
         WHERE timesheet_entry_id IN (SELECT id FROM timesheet_entries WHERE timesheet_id = $1)`,
        [timesheetId]
      );

      // Delete entries
      await client.query(`DELETE FROM timesheet_entries WHERE timesheet_id = $1`, [timesheetId]);

      // Delete audit logs
      await client.query(`DELETE FROM timesheet_audit_logs WHERE timesheet_id = $1`, [timesheetId]);

      // Delete timesheet itself
      await client.query(`DELETE FROM timesheets WHERE id = $1`, [timesheetId]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return {
      success: true,
      message: `Timesheet ${timesheetId} and all associated entries, files, and audit records completely deleted from data flow.`
    };
  }

  /**
   * 16. ADMIN: Full Control Edit of Timesheet
   * Allows admin to modify status, expected hours, date, and rejection reason/notes.
   */
  static async adminUpdateTimesheet(timesheetId, updateData, adminUser) {
    const adminId = adminUser?.empCode || adminUser?.id || 'ADMIN';

    const tsRes = await pool.query(`SELECT * FROM timesheets WHERE id = $1`, [timesheetId]);
    if (tsRes.rowCount === 0) {
      throw new Error(`Timesheet ${timesheetId} not found.`);
    }
    const current = tsRes.rows[0];

    const targetStatus = updateData.status !== undefined ? String(updateData.status).toUpperCase() : current.status;
    const targetExpectedHours = updateData.expected_hours !== undefined ? parseFloat(updateData.expected_hours) : current.expected_hours;
    const targetDate = updateData.date !== undefined ? updateData.date : current.date;
    const rejectionReason = updateData.rejection_reason !== undefined ? updateData.rejection_reason : current.rejection_reason;

    let approvedBy = current.approved_by;
    let approvedAt = current.approved_at;
    let rejectedBy = current.rejected_by;
    let rejectedAt = current.rejected_at;

    if (targetStatus === 'APPROVED') {
      approvedBy = adminId;
      approvedAt = new Date();
      rejectedBy = null;
      rejectedAt = null;
    } else if (targetStatus === 'REJECTED') {
      rejectedBy = adminId;
      rejectedAt = new Date();
      approvedBy = null;
      approvedAt = null;
    } else if (targetStatus === 'DRAFT' || targetStatus === 'OPEN') {
      approvedBy = null;
      approvedAt = null;
      rejectedBy = null;
      rejectedAt = null;
    }

    await pool.query(
      `UPDATE timesheets
       SET date = $1,
           expected_hours = $2,
           status = $3,
           approved_by = $4,
           approved_at = $5,
           rejected_by = $6,
           rejected_at = $7,
           rejection_reason = $8,
           updated_at = NOW()
       WHERE id = $9`,
      [
        targetDate,
        targetExpectedHours,
        targetStatus,
        approvedBy,
        approvedAt,
        rejectedBy,
        rejectedAt,
        rejectionReason,
        timesheetId
      ]
    );

    await this._recalculateTotalHours(timesheetId);

    await logTimesheetAudit(timesheetId, adminId, 'ADMIN_TIMESHEET_UPDATED', {
      updated_by: adminId,
      status: targetStatus,
      expected_hours: targetExpectedHours,
      date: targetDate
    });

    return await this.getTimesheetDetail(timesheetId, adminUser, true);
  }

  /**
   * Internal helper: recalculate total_hours on timesheet
   */
  static async _recalculateTotalHours(timesheetId) {
    const res = await pool.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) AS total_minutes FROM timesheet_entries WHERE timesheet_id = $1`,
      [timesheetId]
    );
    const totalMinutes = parseInt(res.rows[0].total_minutes || '0', 10);
    const totalHours = Number((totalMinutes / 60).toFixed(2));

    await pool.query(
      `UPDATE timesheets SET total_hours = $1, total_minutes = $2, updated_at = NOW() WHERE id = $3`,
      [totalHours, totalMinutes, timesheetId]
    );
    return { totalHours, totalMinutes };
  }
}

