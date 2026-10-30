import express from 'express';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2

const router = express.Router();

/**
 * Helper: Insert into activity_logs
 */
async function logActivity(client, { module, entity, entityId, action, oldValue, newValue, performedBy }) {
  await client.query(
    `INSERT INTO activity_logs (module, entity, entity_id, action, old_value, new_value, performed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [module, entity, entityId, action, oldValue || null, newValue || null, performedBy || 'system']
  );
}

// ────────────────────────────────────────────────────────────
// OFFICIAL HOLIDAYS MASTER CATALOG (India DoPT & Company Holidays)
// ────────────────────────────────────────────────────────────
const OFFICIAL_HOLIDAYS_CATALOG = [
  // 2025
  { id: 'HOL-2025-01', title: "New Year's Day", date: '2025-01-01', description: 'Celebration of the first day of the Gregorian year', is_mandatory: false, type: 'Restricted' },
  { id: 'HOL-2025-02', title: 'Republic Day', date: '2025-01-26', description: 'National holiday marking the adoption of the Constitution of India', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2025-03', title: 'Holi', date: '2025-03-14', description: 'Festival of colors and arrival of spring', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2025-04', title: 'Id-ul-Fitr', date: '2025-03-31', description: 'Islamic festival marking the culmination of Ramadan fasting', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2025-05', title: 'Good Friday', date: '2025-04-18', description: 'Christian holiday commemorating the crucifixion of Jesus Christ', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2025-06', title: 'May Day / Labor Day', date: '2025-05-01', description: 'International workers day and company holiday', is_mandatory: true, type: 'Company' },
  { id: 'HOL-2025-07', title: 'Independence Day', date: '2025-08-15', description: 'National holiday commemorating Indian Independence from British rule in 1947', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2025-08', title: "Mahatma Gandhi's Birthday / Dussehra", date: '2025-10-02', description: 'National holiday commemorating Mahatma Gandhi Jayanti and Dussehra (Vijayadashami)', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2025-10', title: 'Diwali (Deepavali)', date: '2025-10-20', description: 'Hindu festival of lights celebrating prosperity and victory of light over darkness', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2025-11', title: 'Christmas Day', date: '2025-12-25', description: 'Celebration of the birth of Jesus Christ', is_mandatory: true, type: 'Gazetted' },

  // 2026 (Official Central Government Gazetted & Company Holidays)
  { id: 'HOL-2026-01', title: "New Year's Day", date: '2026-01-01', description: 'Celebration of the first day of the new Gregorian calendar year', is_mandatory: false, type: 'Restricted' },
  { id: 'HOL-2026-02', title: 'Makar Sankranti / Pongal', date: '2026-01-14', description: 'Traditional solar harvest festival observed across India', is_mandatory: false, type: 'Restricted' },
  { id: 'HOL-2026-03', title: 'Republic Day', date: '2026-01-26', description: 'National holiday marking the formal enactment of the Constitution of India in 1950', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-04', title: 'Maha Shivratri', date: '2026-02-15', description: 'Great night of Lord Shiva observed in solemn prayer and fasting', is_mandatory: false, type: 'Restricted' },
  { id: 'HOL-2026-05', title: 'Holi', date: '2026-03-04', description: 'National festival of colors, brotherhood, and joy celebrating spring harvest', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-06', title: 'Id-ul-Fitr (Ramzan Id)', date: '2026-03-21', description: 'Major Islamic festival marking the end of the holy month of Ramadan', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-07', title: 'Ram Navami', date: '2026-03-26', description: 'Spring Hindu festival celebrating the birth of Lord Rama', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-08', title: 'Mahavir Jayanti', date: '2026-03-31', description: 'Birth anniversary of Bhagwan Mahavira, 24th Tirthankara of Jainism', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-09', title: 'Good Friday', date: '2026-04-03', description: 'Christian solemn observance of the passion and crucifixion of Jesus Christ', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-10', title: 'Buddha Purnima / May Day', date: '2026-05-01', description: 'Birth anniversary of Gautama Buddha and International Workers Rights Day', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-12', title: 'Id-ul-Zuha (Bakrid)', date: '2026-05-27', description: 'Feast of the Sacrifice honoring Ibrahim readiness to sacrifice his son', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-13', title: 'Muharram', date: '2026-06-26', description: 'Sacred first month of the Islamic calendar and day of Ashura remembrance', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-14', title: 'Independence Day', date: '2026-08-15', description: 'National holiday commemorating 79 years of Indian Independence (1947)', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-15', title: 'Milad-un-Nabi (Id-e-Milad)', date: '2026-08-26', description: 'Observance of the birthday of the Prophet Muhammad', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-16', title: 'Raksha Bandhan', date: '2026-08-28', description: 'Traditional celebration of the bond between brothers and sisters', is_mandatory: false, type: 'Restricted' },
  { id: 'HOL-2026-17', title: 'Janmashtami (Vaishnava)', date: '2026-09-04', description: 'Celebration of the birth of Lord Krishna with devotional singing and fasting', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-18', title: "Mahatma Gandhi's Birthday (Gandhi Jayanti)", date: '2026-10-02', description: 'National holiday honoring Mahatma Gandhi apostle of non-violence and Father of the Nation', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-19', title: 'Company Annual Foundation Day', date: '2026-10-15', description: 'Corporate celebration of organization inception and employee milestone recognition', is_mandatory: true, type: 'Company' },
  { id: 'HOL-2026-20', title: 'Dussehra (Vijayadashami)', date: '2026-10-20', description: 'National festival celebrating the triumph of good over evil (Lord Rama over Ravana)', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-21', title: 'Diwali (Deepavali)', date: '2026-11-08', description: 'Festival of lights commemorating spiritual victory of righteousness and prosperity', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-22', title: "Guru Nanak's Birthday", date: '2026-11-24', description: 'Gurpurab celebrating the birth anniversary of Guru Nanak Dev Ji, founder of Sikhism', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2026-23', title: 'Christmas Day', date: '2026-12-25', description: 'Celebration of the birth of Jesus Christ observed globally with peace and joy', is_mandatory: true, type: 'Gazetted' },

  // 2027
  { id: 'HOL-2027-01', title: "New Year's Day", date: '2027-01-01', description: 'Celebration of the first day of the Gregorian year 2027', is_mandatory: false, type: 'Restricted' },
  { id: 'HOL-2027-02', title: 'Republic Day', date: '2027-01-26', description: 'National holiday marking the adoption of the Constitution of India', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2027-03', title: 'Id-ul-Fitr', date: '2027-03-10', description: 'Islamic festival marking the end of Ramadan', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2027-04', title: 'Holi', date: '2027-03-22', description: 'National festival of colors and spring joy', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2027-05', title: 'Good Friday', date: '2027-03-26', description: 'Christian observance of the crucifixion of Jesus Christ', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2027-06', title: 'May Day / Labor Day', date: '2027-05-01', description: 'International workers day and company holiday', is_mandatory: true, type: 'Company' },
  { id: 'HOL-2027-07', title: 'Independence Day', date: '2027-08-15', description: 'National holiday commemorating 80 years of Indian Independence', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2027-08', title: "Mahatma Gandhi's Birthday (Gandhi Jayanti)", date: '2027-10-02', description: 'National holiday commemorating Mahatma Gandhi', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2027-09', title: 'Dussehra (Vijayadashami)', date: '2027-10-10', description: 'Celebration of the victory of good over evil', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2027-10', title: 'Diwali (Deepavali)', date: '2027-10-29', description: 'Festival of lights celebrating prosperity and righteousness', is_mandatory: true, type: 'Gazetted' },
  { id: 'HOL-2027-11', title: 'Christmas Day', date: '2027-12-25', description: 'Celebration of the birth of Jesus Christ', is_mandatory: true, type: 'Gazetted' }
];

function getOfficialHolidaysByYear(year, type) {
  const y = parseInt(year, 10) || 2026;
  let list = OFFICIAL_HOLIDAYS_CATALOG.filter(h => h.date.startsWith(`${y}-`));
  if (type && type !== 'All') {
    if (type === 'Gazetted') {
      list = list.filter(h => h.type === 'Gazetted' || h.is_mandatory === true);
    } else if (type === 'Optional' || type === 'Restricted') {
      list = list.filter(h => h.type === 'Restricted' || h.is_mandatory === false);
    } else if (type === 'Company') {
      list = list.filter(h => h.type === 'Company');
    }
  }
  return list;
}

// ────────────────────────────────────────────────────────────
// GET /api/leave/holidays — Fetch official public & company holidays
// ────────────────────────────────────────────────────────────
router.get('/holidays', async (req, res) => {
  const { year, type } = req.query;
  const targetYear = parseInt(year, 10) || 2026;

  try {
    // 1. Check if PostgreSQL holidays table exists and has records for the requested year
    const checkRes = await pool.query(
      `SELECT id, title as name, TO_CHAR(date, 'YYYY-MM-DD') as date, description, is_mandatory,
              CASE 
                WHEN description ILIKE '%company%' THEN 'Company'
                WHEN is_mandatory THEN 'Gazetted' 
                ELSE 'Restricted' 
              END as type
       FROM holidays 
       WHERE EXTRACT(YEAR FROM date) = $1
       ORDER BY date ASC`,
      [targetYear]
    );

    if (checkRes.rows.length > 0) {
      let filtered = checkRes.rows;
      if (type && type !== 'All') {
        if (type === 'Gazetted') {
          filtered = filtered.filter(h => h.type === 'Gazetted' || h.is_mandatory);
        } else if (type === 'Optional' || type === 'Restricted') {
          filtered = filtered.filter(h => h.type === 'Restricted' || !h.is_mandatory);
        } else if (type === 'Company') {
          filtered = filtered.filter(h => h.type === 'Company');
        }
      }
      return res.json({
        success: true,
        data: filtered,
        source: 'database',
        year: targetYear,
        total: filtered.length
      });
    }

    // 2. If table is empty for this year, auto-seed with verified official records
    const catalog = getOfficialHolidaysByYear(targetYear);
    for (const item of catalog) {
      await pool.query(
        `INSERT INTO holidays (id, title, date, description, is_mandatory)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (date) DO UPDATE 
         SET title = EXCLUDED.title, description = EXCLUDED.description, is_mandatory = EXCLUDED.is_mandatory`,
        [item.id, item.title, item.date, item.description, item.is_mandatory]
      );
    }

    const seededRes = await pool.query(
      `SELECT id, title as name, TO_CHAR(date, 'YYYY-MM-DD') as date, description, is_mandatory,
              CASE 
                WHEN description ILIKE '%company%' THEN 'Company'
                WHEN is_mandatory THEN 'Gazetted' 
                ELSE 'Restricted' 
              END as type
       FROM holidays 
       WHERE EXTRACT(YEAR FROM date) = $1
       ORDER BY date ASC`,
      [targetYear]
    );

    let finalRows = seededRes.rows.length > 0 ? seededRes.rows : catalog;
    if (type && type !== 'All') {
      if (type === 'Gazetted') {
        finalRows = finalRows.filter(h => h.type === 'Gazetted' || h.is_mandatory);
      } else if (type === 'Optional' || type === 'Restricted') {
        finalRows = finalRows.filter(h => h.type === 'Restricted' || !h.is_mandatory);
      } else if (type === 'Company') {
        finalRows = finalRows.filter(h => h.type === 'Company');
      }
    }

    return res.json({
      success: true,
      data: finalRows,
      source: 'database_seeded',
      year: targetYear,
      total: finalRows.length
    });
  } catch (err) {
    // 3. Graceful degradation: If DB has an issue, return catalog in-memory dataset
    console.warn('⚠️ [Leave API] Error querying holidays table, serving official catalog fallback:', err.message);
    const fallbackList = getOfficialHolidaysByYear(targetYear, type);
    return res.json({
      success: true,
      data: fallbackList,
      source: 'fallback_catalog',
      year: targetYear,
      total: fallbackList.length,
      note: 'Returned verified official catalog dataset'
    });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/leave/holidays — Add custom or company holiday with duplicate protection
// ────────────────────────────────────────────────────────────
router.post('/holidays', async (req, res) => {
  const { title, date, description, isMandatory } = req.body;
  if (!title || !date) {
    return res.status(400).json({ success: false, message: 'Holiday title and date are required.' });
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ success: false, message: 'Holiday date must be in YYYY-MM-DD format.' });
  }

  try {
    const holidayId = `HOL-CUSTOM-${Date.now()}`;
    const insertRes = await pool.query(
      `INSERT INTO holidays (id, title, date, description, is_mandatory)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (date) DO UPDATE
       SET title = EXCLUDED.title, description = EXCLUDED.description, is_mandatory = EXCLUDED.is_mandatory
       RETURNING id, title as name, TO_CHAR(date, 'YYYY-MM-DD') as date, description, is_mandatory`,
      [holidayId, title, date, description || null, isMandatory !== false]
    );

    return res.status(201).json({
      success: true,
      data: insertRes.rows[0],
      message: 'Holiday recorded successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/leave/types — Fetch all leave types
// ────────────────────────────────────────────────────────────
router.get('/types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leave_types WHERE is_active = TRUE ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/leave/balance — Fetch leave balance for employee
// ────────────────────────────────────────────────────────────
router.get('/balance', async (req, res) => {
  const { employeeId } = req.query;
  const currentYear = new Date().getFullYear();
  try {
    const result = await pool.query(
      `SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2 ORDER BY leave_type_name`,
      [employeeId || 'EMP-001', currentYear]
    );
    // If no balance rows, auto-create defaults
    if (result.rows.length === 0 && employeeId) {
      await pool.query(`
        INSERT INTO leave_balances (employee_id, leave_type_name, year, total_allocated, used, pending, available)
        VALUES
          ($1, 'Casual Leave', $2, 12, 0, 0, 12),
          ($1, 'Sick Leave', $2, 10, 0, 0, 10),
          ($1, 'Privilege Leave', $2, 15, 0, 0, 15)
        ON CONFLICT (employee_id, leave_type_name, year) DO NOTHING
      `, [employeeId, currentYear]);
      const created = await pool.query(
        `SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2`, [employeeId, currentYear]
      );
      return res.json({ success: true, data: created.rows });
    }
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/leave/requests — Fetch all leave requests
// ────────────────────────────────────────────────────────────
router.get('/requests', async (req, res) => {
  const { employeeId, status } = req.query;
  try {
    let query = `SELECT lr.*, e.name as employee_name, e.department, e.designation 
                 FROM leave_requests lr
                 LEFT JOIN employees e ON lr.employee_id = e.id
                 WHERE 1=1`;
    const params = [];
    if (employeeId) { params.push(employeeId); query += ` AND lr.employee_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND lr.status = $${params.length}`; }
    query += ' ORDER BY lr.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/leave — Apply for Leave (SQL Transaction)
// ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { employeeId, employeeName, leaveType, fromDate, toDate, days, reason, managerName } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check balance availability
    const currentYear = new Date().getFullYear();
    const balRes = await client.query(
      `SELECT * FROM leave_balances WHERE employee_id = $1 AND (leave_type_name ILIKE $2 || '%' OR leave_type_name = $2) AND year = $3`,
      [employeeId, leaveType, currentYear]
    );
    if (balRes.rows.length > 0) {
      const balance = balRes.rows[0];
      if (balance.available < days) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Insufficient ${leaveType} balance. Available: ${balance.available} days.` });
      }
    }

    const leaveReqId = `LV-${Date.now()}`;
    const leaveTypeId = leaveType.toLowerCase().includes('sick') ? 'lt-sl' :
                        leaveType.toLowerCase().includes('privilege') ? 'lt-pl' : 'lt-cl';
    // Insert leave request
    const reqResult = await client.query(`
      INSERT INTO leave_requests 
        (id, employee_id, employee_name, leave_type, leave_type_id, from_date, to_date, days, start_date, end_date, total_days, reason, status, manager_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $6, $7, $9, $10, 'PENDING', $11)
      RETURNING *
    `, [leaveReqId, employeeId, employeeName || employeeId, leaveType, leaveTypeId, fromDate, toDate, days, Number(days), reason, managerName || 'HR Manager']);

    // Update pending count in leave_balance
    await client.query(`
      UPDATE leave_balances SET pending = pending + $1
      WHERE employee_id = $2 AND (leave_type_name ILIKE $3 || '%' OR leave_type_name = $3) AND year = $4
    `, [days, employeeId, leaveType, currentYear]);

    // Activity log
    await logActivity(client, {
      module: 'leave',
      entity: 'leave_request',
      entityId: reqResult.rows[0].id,
      action: 'leave_applied',
      newValue: `${leaveType}: ${fromDate} to ${toDate} (${days} days)`,
      performedBy: employeeName || employeeId
    });

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: reqResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// Helper function to approve leave request
async function approveLeaveHandler(req, res) {
  const { id } = req.params;
  const { approvedBy, comments } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get leave request details
    const reqRes = await client.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
    if (reqRes.rows.length === 0) throw new Error('Leave request not found');
    const leaveReq = reqRes.rows[0];
    const currentStatus = (leaveReq.status || '').toUpperCase();
    if (currentStatus !== 'PENDING') throw new Error(`Cannot approve — status is already ${leaveReq.status}`);

    // Update status to APPROVED
    const updated = await client.query(
      `UPDATE leave_requests SET status = 'APPROVED', manager_name = $1, manager_comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [approvedBy || 'HR Manager', comments || 'Approved', id]
    );

    // Deduct from leave balance + clear pending
    const currentYear = new Date().getFullYear();
    await client.query(`
      UPDATE leave_balances 
      SET used = used + $1, pending = GREATEST(0, pending - $1), available = GREATEST(0, available - $1)
      WHERE employee_id = $2 AND leave_type_name = $3 AND year = $4
    `, [leaveReq.days, leaveReq.employee_id, leaveReq.leave_type, currentYear]);

    // Automatically update attendance records for leave date range
    const startDate = leaveReq.from_date || leaveReq.start_date;
    const endDate = leaveReq.to_date || leaveReq.end_date || startDate;
    if (startDate && endDate) {
      await client.query(`
        INSERT INTO attendance_records (id, employee_id, date, status, check_in, check_out, worked_hours, work_hours)
        SELECT 
          'ATT-' || $1 || '-' || d::date,
          $1,
          d::date,
          'On Leave',
          'OFF',
          'OFF',
          0,
          0
        FROM generate_series($2::date, $3::date, '1 day'::interval) d
        ON CONFLICT (employee_id, date) DO UPDATE 
        SET status = 'On Leave', check_in = 'OFF', check_out = 'OFF', worked_hours = 0, work_hours = 0
      `, [leaveReq.employee_id, startDate, endDate]);
    }

    // Insert approval record
    await client.query(`
      INSERT INTO leave_approvals (leave_request_id, action, actioned_by, comments)
      VALUES ($1, 'APPROVED', $2, $3)
    `, [id, approvedBy || 'HR Manager', comments || null]);

    // Activity log
    await logActivity(client, {
      module: 'leave',
      entity: 'leave_request',
      entityId: id,
      action: 'leave_approved',
      oldValue: 'PENDING',
      newValue: 'APPROVED',
      performedBy: approvedBy || 'HR Manager'
    });

    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0], message: 'Leave approved, balance deducted, and attendance updated.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
}

// ────────────────────────────────────────────────────────────
// PATCH /api/leave/requests/:id/approve & /api/leave/:id/approve — Approve Leave
// ────────────────────────────────────────────────────────────
router.patch('/requests/:id/approve', approveLeaveHandler);
router.patch('/:id/approve', approveLeaveHandler);

// ────────────────────────────────────────────────────────────
// PATCH /api/leave/requests/:id/reject — Reject Leave (SQL Transaction)
// ────────────────────────────────────────────────────────────
router.patch('/requests/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { rejectedBy, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reqRes = await client.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
    if (reqRes.rows.length === 0) throw new Error('Leave request not found');
    const leaveReq = reqRes.rows[0];
    const currentStatus = (leaveReq.status || '').toUpperCase();
    if (currentStatus !== 'PENDING') throw new Error(`Cannot reject — status is already ${leaveReq.status}`);

    const updated = await client.query(
      `UPDATE leave_requests SET status = 'REJECTED', manager_name = $1, manager_comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [rejectedBy || 'HR Manager', reason || 'Rejected', id]
    );

    // Restore pending count
    const currentYear = new Date().getFullYear();
    await client.query(`
      UPDATE leave_balances 
      SET pending = GREATEST(0, pending - $1)
      WHERE employee_id = $2 AND leave_type_name = $3 AND year = $4
    `, [leaveReq.days, leaveReq.employee_id, leaveReq.leave_type, currentYear]);

    await client.query(`
      INSERT INTO leave_approvals (leave_request_id, action, actioned_by, comments)
      VALUES ($1, 'REJECTED', $2, $3)
    `, [id, rejectedBy || 'HR Manager', reason || null]);

    await logActivity(client, {
      module: 'leave',
      entity: 'leave_request',
      entityId: id,
      action: 'leave_rejected',
      oldValue: 'PENDING',
      newValue: 'REJECTED',
      performedBy: rejectedBy || 'HR Manager'
    });

    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0], message: 'Leave request rejected.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ────────────────────────────────────────────────────────────
// PATCH /api/leave/requests/:id/cancel & /api/leave/:id/cancel — Cancel Leave
// ────────────────────────────────────────────────────────────
async function cancelLeaveHandler(req, res) {
  const { id } = req.params;
  const { cancelledBy, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reqRes = await client.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
    if (reqRes.rows.length === 0) throw new Error('Leave request not found');
    const leaveReq = reqRes.rows[0];

    const updated = await client.query(
      `UPDATE leave_requests SET status = 'CANCELLED', manager_name = $1, manager_comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [cancelledBy || 'HR Manager', reason || 'Cancelled', id]
    );

    // If was APPROVED, restore used balance and available balance
    const currentYear = new Date().getFullYear();
    const prevStatus = (leaveReq.status || '').toUpperCase();
    if (prevStatus === 'APPROVED') {
      await client.query(`
        UPDATE leave_balances 
        SET used = GREATEST(0, used - $1), available = available + $1
        WHERE employee_id = $2 AND leave_type_name = $3 AND year = $4
      `, [leaveReq.days, leaveReq.employee_id, leaveReq.leave_type, currentYear]);

      // Remove 'On Leave' attendance records for date range
      const startDate = leaveReq.from_date || leaveReq.start_date;
      const endDate = leaveReq.to_date || leaveReq.end_date || startDate;
      if (startDate && endDate) {
        await client.query(`
          DELETE FROM attendance_records 
          WHERE employee_id = $1 AND date >= $2 AND date <= $3 AND status = 'On Leave'
        `, [leaveReq.employee_id, startDate, endDate]);
      }
    } else if (prevStatus === 'PENDING') {
      await client.query(`
        UPDATE leave_balances 
        SET pending = GREATEST(0, pending - $1)
        WHERE employee_id = $2 AND leave_type_name = $3 AND year = $4
      `, [leaveReq.days, leaveReq.employee_id, leaveReq.leave_type, currentYear]);
    }

    await logActivity(client, {
      module: 'leave',
      entity: 'leave_request',
      entityId: id,
      action: 'leave_cancelled',
      oldValue: leaveReq.status,
      newValue: 'CANCELLED',
      performedBy: cancelledBy || 'HR Manager'
    });

    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0], message: 'Leave request cancelled successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
}

router.patch('/requests/:id/cancel', cancelLeaveHandler);
router.patch('/:id/cancel', cancelLeaveHandler);

export default router;
