import express from 'express';
import { hrmsPool as pool } from '../db/pool.js';

const router = express.Router();

// ============================================================
// 1. GET /api/interns — List all interns with multi-filter & search
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { search, department, internshipType, mentor, status, duration } = req.query;

    let queryStr = `
      SELECT 
        i.id,
        COALESCE(i.intern_code, i.intern_id, i.id) AS intern_code,
        COALESCE(i.intern_id, i.intern_code, i.id) AS intern_id,
        i.name,
        i.email,
        i.phone,
        i.dob,
        i.gender,
        i.address,
        i.emergency_contact,
        COALESCE(i.profile_photo, i.avatar) AS profile_photo,
        COALESCE(i.profile_photo, i.avatar) AS avatar,
        i.college,
        i.degree,
        COALESCE(i.branch_specialization, i.branch) AS branch_specialization,
        COALESCE(i.branch_specialization, i.branch) AS branch,
        i.graduation_year,
        i.roll_number,
        i.cgpa_percentage,
        i.resume_url,
        i.internship_type,
        i.department,
        i.designation,
        i.start_date,
        i.end_date,
        i.duration,
        i.work_mode,
        i.location,
        i.stipend,
        i.reporting_manager_id,
        i.reporting_manager_name,
        i.mentor_id,
        i.mentor_name,
        i.status,
        i.company_email,
        i.system_access,
        i.attendance_access,
        i.assigned_device,
        i.id_card_issued,
        i.joining_checklist,
        i.documents,
        i.converted_employee_id,
        COALESCE(i.conversion_date, i.converted_at) AS conversion_date,
        i.created_at,
        i.updated_at,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'Completed') AS completed_tasks_count,
        COUNT(DISTINCT t.id) AS total_tasks_count,
        e.recommendation AS evaluation_recommendation,
        c.certificate_id
      FROM interns i
      LEFT JOIN intern_tasks t ON t.intern_id = i.id
      LEFT JOIN intern_evaluations e ON e.intern_id = i.id
      LEFT JOIN intern_certificates c ON c.intern_id = i.id
      WHERE 1=1
    `;

    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      queryStr += ` AND (
        LOWER(i.name) LIKE $${pIdx} OR 
        LOWER(COALESCE(i.intern_code, i.intern_id, i.id)) LIKE $${pIdx} OR 
        LOWER(COALESCE(i.college, '')) LIKE $${pIdx} OR 
        LOWER(COALESCE(i.designation, '')) LIKE $${pIdx} OR
        LOWER(COALESCE(i.email, '')) LIKE $${pIdx}
      )`;
    }

    if (department && department !== 'All') {
      params.push(department);
      queryStr += ` AND i.department = $${params.length}`;
    }

    if (internshipType && internshipType !== 'All') {
      params.push(internshipType);
      queryStr += ` AND i.internship_type = $${params.length}`;
    }

    if (mentor && mentor !== 'All') {
      params.push(mentor);
      queryStr += ` AND i.mentor_name = $${params.length}`;
    }

    if (status && status !== 'All') {
      params.push(status);
      queryStr += ` AND LOWER(i.status) = LOWER($${params.length})`;
    }

    if (duration && duration !== 'All') {
      params.push(duration);
      queryStr += ` AND i.duration = $${params.length}`;
    }

    queryStr += `
      GROUP BY i.id, e.recommendation, c.certificate_id
      ORDER BY i.created_at DESC, i.id DESC
    `;

    const result = await pool.query(queryStr, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('Error fetching interns:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 2. GET /api/interns/:id — Fetch complete 360-degree intern report
// ============================================================
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const internRes = await pool.query(`
      SELECT 
        i.*,
        COALESCE(i.intern_code, i.intern_id, i.id) AS intern_code,
        COALESCE(i.intern_id, i.intern_code, i.id) AS intern_id,
        COALESCE(i.branch_specialization, i.branch) AS branch_specialization,
        COALESCE(i.profile_photo, i.avatar) AS profile_photo
      FROM interns i 
      WHERE i.id = $1 OR i.intern_id = $1 OR i.intern_code = $1
    `, [id]);

    if (internRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Intern not found with ID: ${id}` });
    }

    const intern = internRes.rows[0];
    const targetId = intern.id;

    // Fetch related records concurrently
    const [tasksRes, attendanceRes, leavesRes, evaluationRes, certRes] = await Promise.all([
      pool.query(`SELECT * FROM intern_tasks WHERE intern_id = $1 ORDER BY created_at DESC`, [targetId]),
      pool.query(`SELECT * FROM intern_attendance_records WHERE intern_id = $1 ORDER BY date DESC LIMIT 60`, [targetId]),
      pool.query(`SELECT * FROM intern_leave_requests WHERE intern_id = $1 ORDER BY start_date DESC`, [targetId]),
      pool.query(`SELECT * FROM intern_evaluations WHERE intern_id = $1 ORDER BY created_at DESC LIMIT 1`, [targetId]),
      pool.query(`SELECT * FROM intern_certificates WHERE intern_id = $1 LIMIT 1`, [targetId])
    ]);

    // Compute attendance statistics
    const attendanceRecords = attendanceRes.rows;
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'Present' || r.status === 'Work From Home').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    res.json({
      success: true,
      data: {
        intern,
        tasks: tasksRes.rows,
        attendance: attendanceRecords,
        attendanceStats: {
          totalDays,
          presentDays,
          absentDays: attendanceRecords.filter(r => r.status === 'Absent').length,
          wfhDays: attendanceRecords.filter(r => r.status === 'Work From Home').length,
          halfDays: attendanceRecords.filter(r => r.status === 'Half Day').length,
          lateDays: attendanceRecords.filter(r => r.status === 'Late').length,
          attendancePercentage
        },
        leaves: leavesRes.rows,
        evaluation: evaluationRes.rows[0] || null,
        certificate: certRes.rows[0] || null,
      }
    });
  } catch (err) {
    console.error('Error fetching single intern:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 3. POST /api/interns — Create new intern record (Onboarding flow)
// ============================================================
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generate sequence number
    let internCode = req.body.internCode || req.body.internId;
    if (!internCode) {
      const seqRes = await client.query(
        `UPDATE number_sequences SET current_value = current_value + 1 WHERE id = 'seq-intern' RETURNING current_value, prefix`
      );
      const nextVal = seqRes.rows[0]?.current_value || Math.floor(Math.random() * 900) + 105;
      const prefix = seqRes.rows[0]?.prefix || 'INT';
      internCode = `${prefix}-${String(nextVal).padStart(3, '0')}`;
    }

    const {
      name, email, phone, dob, gender, address, emergencyContact, profilePhoto,
      college, degree, branch, branchSpecialization, graduationYear, rollNumber, cgpaPercentage, resumeUrl,
      internshipType, department, designation, startDate, endDate, duration, workMode, location, stipend,
      reportingManagerId, reportingManagerName, mentorId, mentorName, status,
      companyEmail, systemAccess, attendanceAccess, assignedDevice, idCardIssued, joiningChecklist, documents
    } = req.body;

    const finalBranch = branchSpecialization || branch || 'Computer Science';
    const finalStartDate = startDate || new Date().toISOString().split('T')[0];
    
    // Calculate initial status based on joining date
    let computedStatus = status || 'Active';
    const todayStr = new Date().toISOString().split('T')[0];
    if (finalStartDate > todayStr) {
      computedStatus = 'Upcoming';
    }

    const insertSql = `
      INSERT INTO interns (
        id, intern_id, intern_code, name, email, phone, dob, gender, address, emergency_contact,
        avatar, profile_photo, college, degree, branch, branch_specialization, graduation_year,
        roll_number, cgpa_percentage, resume_url, internship_type, department, designation,
        start_date, end_date, duration, work_mode, location, stipend,
        reporting_manager_id, reporting_manager_name, mentor_id, mentor_name, status,
        company_email, system_access, attendance_access, assigned_device, id_card_issued,
        joining_checklist, documents
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23,
        $24, $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $34,
        $35, $36, $37, $38, $39,
        $40, $41
      )
      RETURNING *
    `;

    const values = [
      internCode, internCode, internCode, name, email, phone || null,
      dob || '2002-05-15', gender || 'Male', address || '', emergencyContact || '',
      profilePhoto || null, profilePhoto || null, college || 'Engineering College', degree || 'B.Tech',
      finalBranch, finalBranch, graduationYear || '2025', rollNumber || '', cgpaPercentage || '8.5 CGPA',
      resumeUrl || null, internshipType || 'Full Stack', department || 'Engineering', designation || 'Software Engineering Intern',
      finalStartDate, endDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      duration || '6 Months', workMode || 'Hybrid', location || 'Headquarters (HQ)', Number(stipend) || 20000,
      reportingManagerId || 'EMP-001', reportingManagerName || 'Sarah Jenkins',
      mentorId || 'EMP-004', mentorName || 'Rahul Verma', computedStatus,
      companyEmail || `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      systemAccess !== undefined ? Boolean(systemAccess) : true,
      attendanceAccess !== undefined ? Boolean(attendanceAccess) : true,
      assignedDevice || 'Company Laptop', idCardIssued !== undefined ? Boolean(idCardIssued) : true,
      JSON.stringify(joiningChecklist || [
        { task: "ID Badge Issued", completed: true },
        { task: "Laptop Allocated", completed: true },
        { task: "Repository Access Granted", completed: true },
        { task: "Mentor Assigned", completed: true }
      ]),
      JSON.stringify(documents || [])
    ];

    const result = await client.query(insertSql, values);

    // Create a starter attendance record for today if status is Active
    if (computedStatus === 'Active') {
      await client.query(`
        INSERT INTO intern_attendance_records (id, intern_id, date, check_in, work_hours, worked_hours, status)
        VALUES ($1, $2, CURRENT_DATE, '09:30 AM', 8.0, 8.0, 'Present')
        ON CONFLICT (intern_id, date) DO NOTHING
      `, [`ATT-${internCode}-${todayStr}`, internCode]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Intern created successfully', data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating intern:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ============================================================
// 4. PUT /api/interns/:id — Update intern details or status
// ============================================================
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'email', 'phone', 'dob', 'gender', 'address', 'emergency_contact',
      'profile_photo', 'avatar', 'college', 'degree', 'branch', 'branch_specialization',
      'graduation_year', 'roll_number', 'cgpa_percentage', 'internship_type', 'department',
      'designation', 'start_date', 'end_date', 'duration', 'work_mode', 'location',
      'stipend', 'reporting_manager_id', 'reporting_manager_name', 'mentor_id',
      'mentor_name', 'status', 'company_email', 'system_access', 'attendance_access',
      'assigned_device', 'id_card_issued', 'joining_checklist', 'documents'
    ];

    for (const field of allowedFields) {
      // Check both camelCase and snake_case
      const camel = field.replace(/_([a-z])/g, g => g[1].toUpperCase());
      const val = updates[field] !== undefined ? updates[field] : updates[camel];
      if (val !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(typeof val === 'object' && val !== null ? JSON.stringify(val) : val);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid update fields provided.' });
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE interns 
      SET ${setClauses.join(', ')} 
      WHERE id = $${paramIndex} OR intern_id = $${paramIndex} OR intern_code = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Intern not found' });
    }

    res.json({ success: true, message: 'Intern updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating intern:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 5. POST /api/interns/:id/attendance — Check In / Check Out / Mark
// ============================================================
router.post('/:id/attendance', async (req, res) => {
  const { id } = req.params;
  const { action, status, date, checkIn, checkOut, workedHours, reason } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const recordId = `ATT-${id}-${targetDate}`;

    if (action === 'check-in') {
      const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const result = await pool.query(`
        INSERT INTO intern_attendance_records (id, intern_id, date, check_in, work_hours, worked_hours, status)
        VALUES ($1, $2, $3, $4, 0.0, 0.0, 'Present')
        ON CONFLICT (intern_id, date) DO UPDATE 
        SET check_in = EXCLUDED.check_in, status = 'Present', updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [recordId, id, targetDate, checkIn || nowTime]);
      return res.json({ success: true, message: 'Check-in recorded', data: result.rows[0] });
    }

    if (action === 'check-out') {
      const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const result = await pool.query(`
        UPDATE intern_attendance_records 
        SET check_out = $1, work_hours = COALESCE(work_hours, 8.0), worked_hours = COALESCE(worked_hours, 8.0), updated_at = CURRENT_TIMESTAMP
        WHERE intern_id = $2 AND date = $3
        RETURNING *
      `, [checkOut || nowTime, id, targetDate]);
      return res.json({ success: true, message: 'Check-out recorded', data: result.rows[0] });
    }

    // Direct status update (Present, Absent, Half Day, Late, Work From Home, Permission, Overtime)
    const finalStatus = status || 'Present';
    const hours = workedHours !== undefined ? Number(workedHours) : (finalStatus === 'Absent' ? 0.0 : finalStatus === 'Half Day' ? 4.0 : 8.0);
    const result = await pool.query(`
      INSERT INTO intern_attendance_records (id, intern_id, date, check_in, check_out, work_hours, worked_hours, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8)
      ON CONFLICT (intern_id, date) DO UPDATE 
      SET status = EXCLUDED.status, work_hours = EXCLUDED.work_hours, worked_hours = EXCLUDED.worked_hours,
          check_in = COALESCE(EXCLUDED.check_in, intern_attendance_records.check_in),
          check_out = COALESCE(EXCLUDED.check_out, intern_attendance_records.check_out),
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [recordId, id, targetDate, checkIn || '09:30 AM', checkOut || '06:30 PM', hours, finalStatus, reason || '']);

    res.json({ success: true, message: 'Attendance status updated', data: result.rows[0] });
  } catch (err) {
    console.error('Error logging intern attendance:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 6. POST /api/interns/:id/leaves — Apply for leave
// ============================================================
router.post('/:id/leaves', async (req, res) => {
  const { id } = req.params;
  const { leaveType, startDate, endDate, days, reason } = req.body;
  try {
    const leaveId = `LV-${id}-${Date.now()}`;
    const result = await pool.query(`
      INSERT INTO intern_leave_requests (id, intern_id, leave_type, start_date, end_date, days, reason, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
      RETURNING *
    `, [leaveId, id, leaveType || 'Casual Leave', startDate, endDate, Number(days) || 1.0, reason || 'Exam / Personal work']);

    res.status(201).json({ success: true, message: 'Leave request submitted', data: result.rows[0] });
  } catch (err) {
    console.error('Error applying intern leave:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 7. PATCH /api/interns/leaves/:leaveId — Approve/Reject leave
// ============================================================
router.patch('/leaves/:leaveId', async (req, res) => {
  const { leaveId } = req.params;
  const { status, reviewedBy, comment } = req.body;
  try {
    const result = await pool.query(`
      UPDATE intern_leave_requests 
      SET status = $1, approved_by = $2, review_comment = $3
      WHERE id = $4
      RETURNING *
    `, [status || 'APPROVED', reviewedBy || 'Mentor / HR', comment || '', leaveId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    res.json({ success: true, message: `Leave request ${status.toLowerCase()}`, data: result.rows[0] });
  } catch (err) {
    console.error('Error updating intern leave:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 8. POST /api/interns/:id/tasks — Mentor assigns task
// ============================================================
router.post('/:id/tasks', async (req, res) => {
  const { id } = req.params;
  const { title, description, assignedBy, mentorName, deadline, status, progress } = req.body;
  try {
    const taskId = `TSK-${id}-${Date.now()}`;
    const result = await pool.query(`
      INSERT INTO intern_tasks (id, intern_id, title, description, assigned_by, mentor_name, deadline, status, progress_percent, progress, comments)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, '[]'::jsonb)
      RETURNING *
    `, [
      taskId, id, title, description || '', assignedBy || mentorName || 'Mentor',
      mentorName || 'Assigned Mentor', deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status || 'Not Started', Number(progress) || 0
    ]);

    res.status(201).json({ success: true, message: 'Task assigned successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error assigning intern task:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 9. PATCH /api/interns/tasks/:taskId — Update task status / feedback
// ============================================================
router.patch('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { status, progress, feedback, newComment, author } = req.body;
  try {
    let commentClause = '';
    const params = [taskId];

    const fields = [];
    if (status) {
      params.push(status);
      fields.push(`status = $${params.length}`);
    }
    if (progress !== undefined) {
      params.push(Number(progress));
      fields.push(`progress_percent = $${params.length}`);
      fields.push(`progress = $${params.length}`);
    }
    if (feedback !== undefined) {
      params.push(feedback);
      fields.push(`feedback = $${params.length}`);
    }

    if (newComment) {
      const commentObj = { author: author || 'Mentor', text: newComment, date: new Date().toISOString() };
      params.push(JSON.stringify(commentObj));
      fields.push(`comments = COALESCE(comments, '[]'::jsonb) || $${params.length}::jsonb`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const query = `
      UPDATE intern_tasks 
      SET ${fields.join(', ')} 
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, message: 'Task updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 10. POST /api/interns/:id/evaluation — Submit 9-parameter evaluation
// ============================================================
router.post('/:id/evaluation', async (req, res) => {
  const { id } = req.params;
  const {
    technicalSkills, communication, problemSolving, teamwork, discipline,
    attendance, taskCompletion, learningAbility, overallPerformance,
    mentorComments, managerComments, hrComments, recommendation, evaluatedBy
  } = req.body;

  try {
    const evalId = `EVAL-${id}`;
    const result = await pool.query(`
      INSERT INTO intern_evaluations (
        id, intern_id, technical_skills, communication, problem_solving, teamwork, discipline,
        attendance, attendance_rating, task_completion, learning_ability, overall_performance,
        mentor_comments, manager_comments, hr_comments, recommendation, evaluated_by, evaluation_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_DATE
      )
      ON CONFLICT (id) DO UPDATE SET
        technical_skills = EXCLUDED.technical_skills,
        communication = EXCLUDED.communication,
        problem_solving = EXCLUDED.problem_solving,
        teamwork = EXCLUDED.teamwork,
        discipline = EXCLUDED.discipline,
        attendance = EXCLUDED.attendance,
        attendance_rating = EXCLUDED.attendance_rating,
        task_completion = EXCLUDED.task_completion,
        learning_ability = EXCLUDED.learning_ability,
        overall_performance = EXCLUDED.overall_performance,
        mentor_comments = EXCLUDED.mentor_comments,
        manager_comments = EXCLUDED.manager_comments,
        hr_comments = EXCLUDED.hr_comments,
        recommendation = EXCLUDED.recommendation,
        evaluated_by = EXCLUDED.evaluated_by,
        evaluation_date = CURRENT_DATE
      RETURNING *
    `, [
      evalId, id,
      Number(technicalSkills) || 5, Number(communication) || 5, Number(problemSolving) || 5,
      Number(teamwork) || 5, Number(discipline) || 5, Number(attendance) || 5,
      Number(taskCompletion) || 5, Number(learningAbility) || 5, Number(overallPerformance) || 5,
      mentorComments || '', managerComments || '', hrComments || '',
      recommendation || 'Successfully Completed', evaluatedBy || 'Mentor & HR'
    ]);

    // If internship has completed or reached end date, update status to Completed
    await pool.query(`
      UPDATE interns 
      SET status = CASE WHEN status = 'Active' THEN 'Completed' ELSE status END
      WHERE id = $1
    `, [id]);

    res.json({ success: true, message: 'Evaluation submitted successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error saving evaluation:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 11. POST /api/interns/:id/certificate — Generate Certificate
// ============================================================
router.post('/:id/certificate', async (req, res) => {
  const { id } = req.params;
  try {
    const internRes = await pool.query(`SELECT * FROM interns WHERE id = $1`, [id]);
    if (internRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Intern not found' });
    }
    const intern = internRes.rows[0];

    const certId = `CERT-2026-${intern.id}`;
    const result = await pool.query(`
      INSERT INTO intern_certificates (
        id, intern_id, certificate_id, intern_name, department, role,
        start_date, end_date, duration, organization, issue_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE)
      ON CONFLICT (certificate_id) DO UPDATE SET
        intern_name = EXCLUDED.intern_name,
        department = EXCLUDED.department,
        role = EXCLUDED.role,
        issue_date = CURRENT_DATE
      RETURNING *
    `, [
      certId, intern.id, certId, intern.name, intern.department, intern.designation,
      intern.start_date, intern.end_date, intern.duration || '6 Months',
      req.body.organization || 'Antigravity Enterprise Solutions Pvt. Ltd.'
    ]);

    res.json({ success: true, message: 'Certificate generated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error generating certificate:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 12. POST /api/interns/:id/convert-to-employee — Conversion Flow
// ============================================================
router.post('/:id/convert-to-employee', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch Intern details
    const internRes = await client.query(`SELECT * FROM interns WHERE id = $1`, [id]);
    if (internRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Intern not found' });
    }
    const intern = internRes.rows[0];

    if (intern.status === 'Converted' && intern.converted_employee_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Intern has already been converted to employee ${intern.converted_employee_id}`
      });
    }

    // 2. Generate next employee code
    const seqRes = await client.query(
      `UPDATE number_sequences SET current_value = current_value + 1 WHERE id = 'seq-emp' RETURNING current_value, prefix`
    );
    const nextVal = seqRes.rows[0]?.current_value || Math.floor(Math.random() * 900) + 100;
    const prefix = seqRes.rows[0]?.prefix || 'EMP';
    const empCode = `${prefix}-${String(nextVal).padStart(3, '0')}`;

    // 3. Compensation parameters for permanent role
    const annualSalary = Number(req.body.annualSalary) || (Number(intern.stipend || 25000) * 20); // Default to competitive full-time salary
    const monthlySalary = Math.round((annualSalary / 12) * 100) / 100;
    const basicSalary = Math.round(monthlySalary * 0.6 * 100) / 100;
    const allowances = Math.round(monthlySalary * 0.4 * 100) / 100;
    const designation = req.body.designation || intern.designation.replace(/Intern/gi, 'Associate Software Engineer').trim();

    // 4. Insert into employees master
    const empInsert = await client.query(`
      INSERT INTO employees (
        id, emp_code, name, email, phone, dob, gender, address,
        department, designation, joining_date, status,
        annual_salary, annual_ctc, salary, basic_salary, allowances,
        reporting_manager_id, reporting_manager_name,
        branch, employment_type, converted_from_intern_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, CURRENT_DATE, 'Joined',
        $11, $12, $13, $14, $15,
        $16, $17,
        $18, 'Full-time', $19
      )
      ON CONFLICT (email) DO UPDATE SET
        emp_code = EXCLUDED.emp_code,
        status = 'Joined',
        designation = EXCLUDED.designation,
        converted_from_intern_id = EXCLUDED.converted_from_intern_id,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      empCode, empCode, intern.name, intern.company_email || intern.email, intern.phone,
      intern.dob || '2002-05-15', intern.gender || 'Male', intern.address,
      intern.department, designation,
      annualSalary, annualSalary, monthlySalary, basicSalary, allowances,
      intern.reporting_manager_id || 'EMP-001', intern.reporting_manager_name || 'Sarah Jenkins',
      intern.location || 'Bengaluru HQ', intern.id
    ]);

    // 5. Insert into employee onboarding pipeline
    await client.query(`
      INSERT INTO employee_onboarding (employee_id, current_stage, stage, joined_date)
      VALUES ($1, 'JOINED', 'Joined', CURRENT_DATE)
      ON CONFLICT (employee_id) DO UPDATE SET current_stage = 'JOINED', stage = 'Joined', updated_at = CURRENT_TIMESTAMP
    `, [empCode]);

    // 6. Update intern record to Converted
    await client.query(`
      UPDATE interns 
      SET status = 'Converted', converted_employee_id = $1, conversion_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [empCode, intern.id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Intern ${intern.name} successfully converted to Employee ${empCode}!`,
      data: {
        employee: empInsert.rows[0],
        internId: intern.id,
        employeeId: empCode
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error converting intern to employee:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

export default router;
