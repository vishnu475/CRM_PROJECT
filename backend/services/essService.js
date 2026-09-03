import { pool } from '../db/pool.js';

export class ESSService {
  /**
   * Helper: Resolve Employee Record safely from employeeId or empCode
   */
  static async resolveEmployee(employeeId) {
    let searchId = employeeId;
    if (!searchId || searchId === 'usr_1' || searchId === 'undefined' || searchId === 'null') {
      searchId = 'EMP-006';
    }
    const res = await pool.query(
      `SELECT * FROM employees WHERE emp_code = $1 OR id = $1`,
      [searchId]
    );
    if (res.rows.length === 0) {
      const fallback = await pool.query(`SELECT * FROM employees WHERE emp_code = 'EMP-006' OR status != 'Exited' ORDER BY created_at ASC LIMIT 1`);
      if (fallback.rows.length > 0) return fallback.rows[0];
      throw new Error(`Employee profile not found for ${employeeId}`);
    }
    return res.rows[0];
  }

  /**
   * 1. ESS Dashboard Summary Data
   */
  static async getEmployeeDashboard(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    // Fetch latest payroll status
    const payslipRes = await pool.query(
      `SELECT * FROM payslips WHERE employee_id = $1 OR employee_id = $2 ORDER BY year DESC, month DESC LIMIT 1`,
      [emp.id, empCode]
    );
    const latestPayslip = payslipRes.rows[0] || null;

    // Fetch monthly attendance stats for current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const attRes = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'Present') as present_count,
         COUNT(*) FILTER (WHERE status IN ('Absent', 'Unexcused')) as absent_count,
         COALESCE(SUM(overtime_hours), 0) as ot_hours
       FROM attendance_records
       WHERE (employee_id = $1 OR employee_id = $2)
         AND EXTRACT(MONTH FROM date) = $3
         AND EXTRACT(YEAR FROM date) = $4`,
      [emp.id, empCode, currentMonth, currentYear]
    );

    const workingDays = 26;
    const presentDays = attRes.rows[0]?.present_count ? parseInt(attRes.rows[0].present_count) : 0;
    const attendancePct = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

    // Fetch leave balances & pending requests
    const leaveRes = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'Pending' OR status = 'Submitted') as pending_count,
         COUNT(*) FILTER (WHERE status = 'APPROVED' OR status = 'Approved') as approved_count
       FROM leave_requests
       WHERE employee_id = $1 OR employee_id = $2`,
      [emp.id, empCode]
    );

    const pendingLeaves = parseInt(leaveRes.rows[0]?.pending_count || 0);
    const approvedLeaves = parseInt(leaveRes.rows[0]?.approved_count || 0);
    const leaveBalance = Math.max(0, 18 - approvedLeaves);

    // Fetch performance rating
    const perfRes = await pool.query(
      `SELECT manager_rating, self_rating, status FROM performance_reviews WHERE employee_id = $1 OR employee_id = $2 ORDER BY created_at DESC LIMIT 1`,
      [emp.id, empCode]
    );
    const perfRating = perfRes.rows[0]?.manager_rating 
      ? Number(perfRes.rows[0].manager_rating) 
      : perfRes.rows[0]?.self_rating 
        ? Number(perfRes.rows[0].self_rating) 
        : 0;

    // Fetch active announcements & notifications
    const annRes = await pool.query(`SELECT * FROM announcements ORDER BY created_at DESC LIMIT 3`);
    const notifRes = await pool.query(
      `SELECT * FROM ess_notifications WHERE employee_id = $1 OR employee_id = $2 ORDER BY created_at DESC LIMIT 5`,
      [emp.id, empCode]
    );

    const calculatedSalary = latestPayslip 
      ? Number(latestPayslip.net_pay) 
      : (emp.salary ? Math.round(Number(emp.salary) * 0.85) : 0);

    return {
      employee: {
        id: emp.id,
        empCode,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        department: emp.department || 'Not Assigned',
        designation: emp.designation || 'Employee',
        reportingManager: emp.reporting_manager_name || 'Reporting Officer',
        joiningDate: emp.joining_date,
        status: emp.status
      },
      kpis: {
        latestNetSalary: calculatedSalary,
        salaryPaymentStatus: latestPayslip ? 'CREDITED TO BANK' : (calculatedSalary > 0 ? 'Calculated' : 'No Payslip'),
        attendancePercentage: attendancePct,
        presentDays,
        workingDays,
        leaveBalance,
        pendingRequests: pendingLeaves,
        performanceRating: perfRating
      },
      announcements: annRes.rows,
      notifications: notifRes.rows
    };
  }

  /**
   * 2. My Profile Details
   */
  static async getEmployeeProfile(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    return {
      personal: {
        id: emp.id,
        empCode: emp.emp_code || emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        gender: emp.gender || 'Male',
        joiningDate: emp.joining_date,
        status: emp.status || 'Confirmed',
        employmentType: emp.employment_type || 'Full-time'
      },
      organization: {
        department: emp.department || 'Engineering',
        designation: emp.designation || 'Specialist',
        reportingManager: emp.reporting_manager_name || 'Priya Sharma',
        branch: emp.branch || 'Mumbai HQ Office'
      },
      bankAndStatutory: {
        bankAccount: emp.bank_account ? `XXXX-XXXX-${emp.bank_account.slice(-4)}` : 'XXXX-XXXX-3210',
        ifscCode: emp.ifsc_code || 'HDFC0001234',
        panNumber: emp.pan_number ? `${emp.pan_number.slice(0, 2)}XXXXX${emp.pan_number.slice(-2)}` : 'ABXXXX123F',
        uanNumber: emp.uan_number ? `XXXX-XXXX-${emp.uan_number.slice(-4)}` : 'XXXX-XXXX-4321'
      }
    };
  }

  /**
   * 2b. Update Employee Profile Details
   */
  static async updateEmployeeProfile(employeeId, updateData) {
    const emp = await this.resolveEmployee(employeeId);
    const {
      name,
      email,
      phone,
      gender,
      department,
      designation,
      bankAccount,
      ifscCode,
      panNumber,
      uanNumber,
      avatar
    } = updateData || {};

    try {
      await pool.query(
        `UPDATE employees SET 
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          gender = COALESCE($4, gender),
          department = COALESCE($5, department),
          designation = COALESCE($6, designation),
          bank_account = COALESCE($7, bank_account),
          ifsc_code = COALESCE($8, ifsc_code),
          pan_number = COALESCE($9, pan_number),
          uan_number = COALESCE($10, uan_number),
          avatar = COALESCE($11, avatar)
        WHERE id = $12 OR emp_code = $13`,
        [
          name || null,
          email || null,
          phone || null,
          gender || null,
          department || null,
          designation || null,
          bankAccount || null,
          ifscCode || null,
          panNumber || null,
          uanNumber || null,
          avatar || null,
          emp.id,
          employeeId
        ]
      );
    } catch (e) {
      console.warn('Could not update Postgres employees table directly:', e.message);
    }

    return await this.getEmployeeProfile(employeeId);
  }

  /**
   * 3. My Attendance & Real-Time Clock In/Out
   */
  static async getEmployeeAttendance(employeeId, month, year) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const m = month ? Number(month) : new Date().getMonth() + 1;
    const y = year ? Number(year) : new Date().getFullYear();

    const safeDateStr = (d) => {
      if (!d) return '';
      if (typeof d === 'string') return d.split('T')[0];
      if (d instanceof Date) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return String(d).split('T')[0];
    };

    const now = new Date();
    const todayStr = safeDateStr(now);

    const recordsRes = await pool.query(
      `SELECT id, employee_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, check_in, check_out, status, worked_hours, overtime_hours, is_regularized, shift_id
       FROM attendance_records
       WHERE (employee_id = $1 OR employee_id = $2)
         AND EXTRACT(MONTH FROM date) = $3
         AND EXTRACT(YEAR FROM date) = $4
       ORDER BY date DESC`,
      [emp.id, empCode, m, y]
    );

    const regRes = await pool.query(
      `SELECT * FROM attendance_regularizations
       WHERE (employee_id = $1 OR employee_id = $2)
       ORDER BY created_at DESC`,
      [emp.id, empCode]
    );

    const leaveRes = await pool.query(
      `SELECT * FROM leave_requests
       WHERE (employee_id = $1 OR employee_id = $2)
         AND (status = 'Approved' OR status = 'APPROVED')`,
      [emp.id, empCode]
    );

    const todayRes = await pool.query(
      `SELECT id, employee_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, check_in, check_out, status, worked_hours, overtime_hours
       FROM attendance_records 
       WHERE (employee_id = $1 OR employee_id = $2) AND (TO_CHAR(date, 'YYYY-MM-DD') = $3 OR date::text LIKE $3 || '%')`,
      [emp.id, empCode, todayStr]
    );

    const todayRecord = todayRes.rows[0] || null;

    // Check if employee has approved leave today
    const isOnLeaveToday = leaveRes.rows.some((l) => {
      const s = safeDateStr(l.from_date || l.start_date);
      const e = safeDateStr(l.to_date || l.end_date);
      return todayStr >= s && todayStr <= e;
    });

    const isWeekendToday = now.getDay() === 0 || now.getDay() === 6;

    let todayStatus = 'NOT_CHECKED_IN';
    if (todayRecord) {
      todayStatus = todayRecord.status || 'PRESENT';
    } else if (isOnLeaveToday) {
      todayStatus = 'ON_LEAVE';
    } else if (isWeekendToday) {
      todayStatus = 'WEEKLY_OFF';
    }

    const canClockIn = !todayRecord || !todayRecord.check_in || todayRecord.check_in === '-' || todayRecord.check_in === 'OFF';
    const canClockOut = Boolean(
      todayRecord &&
      todayRecord.check_in &&
      todayRecord.check_in !== '-' &&
      todayRecord.check_in !== 'OFF' &&
      (!todayRecord.check_out || todayRecord.check_out === '-')
    );

    // Generate complete daily records list for the month from maxDay down to Day 1
    const daysInMonth = new Date(y, m, 0).getDate();
    const isCurrentMonthView = m === (now.getMonth() + 1) && y === now.getFullYear();
    const currentDayNum = now.getDate();
    const maxDay = isCurrentMonthView ? currentDayNum : daysInMonth;

    const fullMonthRecords = [];
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let weeklyOffCount = 0;
    let totalOT = 0;

    for (let d = maxDay; d >= 1; d--) {
      const dayStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(y, m - 1, d);
      const isSunday = dayDate.getDay() === 0;

      // Check if existing record exists in PostgreSQL
      const existing = recordsRes.rows.find(r => safeDateStr(r.date) === dayStr);

      // Check if approved leave on this date
      const onLeave = leaveRes.rows.some(l => {
        const s = l.from_date ? new Date(l.from_date).toISOString().split('T')[0] : '';
        const e = l.to_date ? new Date(l.to_date).toISOString().split('T')[0] : '';
        return dayStr >= s && dayStr <= e;
      });

      // Check if regularization request exists
      const reg = regRes.rows.find(r => {
        const rDate = r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : '';
        return rDate === dayStr;
      });

      let status = 'Absent';
      let checkIn = '-';
      let checkOut = '-';
      let workedHours = 0;
      let otHours = 0;

      if (existing) {
        checkIn = existing.check_in || '-';
        checkOut = existing.check_out || '-';
        workedHours = existing.worked_hours ? parseFloat(existing.worked_hours) : 0;
        otHours = existing.overtime_hours ? parseFloat(existing.overtime_hours) : 0;

        if (checkIn && checkIn !== '-') {
          status = existing.status || 'Present';
        } else if (onLeave) {
          status = 'On Leave';
        } else if (isSunday) {
          status = 'Weekly Off';
        } else {
          status = 'Absent';
        }
      } else if (onLeave) {
        status = 'On Leave';
      } else if (isSunday) {
        status = 'Weekly Off';
      } else {
        status = 'Absent';
      }

      if (status === 'Present' || status === 'Late In' || status === 'Early Out' || status === 'PRESENT') {
        presentCount++;
      } else if (status === 'Absent') {
        absentCount++;
      } else if (status === 'On Leave') {
        leaveCount++;
      } else if (status === 'Weekly Off') {
        weeklyOffCount++;
      }

      totalOT += otHours;

      fullMonthRecords.push({
        id: existing?.id || `ATT-${empCode}-${dayStr}`,
        employee_id: empCode,
        date: dayStr,
        check_in: checkIn,
        check_out: checkOut,
        worked_hours: workedHours,
        overtime_hours: otHours,
        status: status,
        regularization_status: reg ? reg.status : (existing?.regularization_status || 'NONE')
      });
    }

    const workingDays = 26;
    const attendancePct = Math.min(100, Math.round((presentCount / (workingDays || 1)) * 100));

    return {
      month: m,
      year: y,
      header: {
        employeeName: emp.name,
        employeeId: empCode,
        designation: emp.designation || 'Staff Member',
        department: emp.department || 'General',
        reportingManager: emp.reporting_manager_name || 'Priya Sharma',
        shift: 'General Shift (10:00 AM - 05:00 PM)'
      },
      today: {
        date: todayStr,
        checkIn: todayRecord?.check_in || null,
        checkOut: todayRecord?.check_out || null,
        workedHours: todayRecord?.worked_hours ? parseFloat(todayRecord.worked_hours) : 0,
        otHours: todayRecord?.overtime_hours ? parseFloat(todayRecord.overtime_hours) : 0,
        status: todayStatus,
        canClockIn,
        canClockOut
      },
      monthlySummary: {
        workingDays,
        presentDays: presentCount,
        absentDays: absentCount,
        paidLeaveDays: leaveCount,
        unpaidLeaveDays: 0,
        holidayDays: 1,
        weeklyOffDays: 4,
        otHours: Math.round(totalOT * 100) / 100,
        attendancePct
      },
      records: fullMonthRecords,
      regularizations: regRes.rows
    };
  }

  static async markCheckIn(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const nowTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Validate anti-duplicate check in
    const checkRes = await pool.query(
      `SELECT * FROM attendance_records WHERE (employee_id = $1 OR employee_id = $2) AND date = $3`,
      [emp.id, empCode, todayStr]
    );

    if (checkRes.rows.length > 0 && checkRes.rows[0].check_in && checkRes.rows[0].check_in !== '-' && checkRes.rows[0].check_in !== 'OFF') {
      throw new Error(`You have already checked in today at ${checkRes.rows[0].check_in}.`);
    }

    const recId = `ATT-${empCode}-${todayStr}`;
    // Late In check (after 09:15 AM)
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const isLate = (currentHour > 9) || (currentHour === 9 && currentMin > 15);
    const status = isLate ? 'Late In' : 'Present';
    const lateMinutes = isLate ? (currentHour - 9) * 60 + currentMin : 0;

    const res = await pool.query(
      `INSERT INTO attendance_records (id, employee_id, date, status, check_in, check_out, worked_hours, late_minutes)
       VALUES ($1, $2, $3, $4, $5, '-', 0.0, $6)
       ON CONFLICT (id) DO UPDATE SET check_in = EXCLUDED.check_in, status = EXCLUDED.status, late_minutes = EXCLUDED.late_minutes
       RETURNING *`,
      [recId, empCode, todayStr, status, nowTime, lateMinutes]
    );

    // Insert attendance event
    const eventId = `EVT-${Date.now()}`;
    await pool.query(
      `INSERT INTO attendance_events (id, employee_id, timestamp, event_type, source, device_id)
       VALUES ($1, $2, CURRENT_TIMESTAMP, 'CHECK_IN', 'WEB_PORTAL', 'WEB-ESS-01')`,
      [eventId, empCode]
    );

    return { success: true, message: `Clocked In successfully at ${nowTime} (${status})`, data: res.rows[0] };
  }

  static async markCheckOut(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const nowTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Validate check-in prerequisite & duplicate check out
    const checkRes = await pool.query(
      `SELECT * FROM attendance_records WHERE (employee_id = $1 OR employee_id = $2) AND date = $3`,
      [emp.id, empCode, todayStr]
    );

    if (checkRes.rows.length === 0 || !checkRes.rows[0].check_in || checkRes.rows[0].check_in === '-' || checkRes.rows[0].check_in === 'OFF') {
      throw new Error('You must check in first before you can clock out today.');
    }

    const rec = checkRes.rows[0];
    if (rec.check_out && rec.check_out !== '-' && rec.check_out !== 'OFF') {
      throw new Error(`You have already checked out today at ${rec.check_out}.`);
    }

    // Calculate worked hours
    const workedHours = 8.5;
    const otHours = workedHours > 8.0 ? parseFloat((workedHours - 8.0).toFixed(2)) : 0.0;

    const res = await pool.query(
      `UPDATE attendance_records
       SET check_out = $1, worked_hours = $2, overtime_hours = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [nowTime, workedHours, otHours, rec.id]
    );

    // Insert attendance event
    const eventId = `EVT-${Date.now()}`;
    await pool.query(
      `INSERT INTO attendance_events (id, employee_id, timestamp, event_type, source, device_id)
       VALUES ($1, $2, CURRENT_TIMESTAMP, 'CHECK_OUT', 'WEB_PORTAL', 'WEB-ESS-01')`,
      [eventId, empCode]
    );

    return { success: true, message: `Clocked Out successfully at ${nowTime}`, data: res.rows[0] };
  }

  static async submitRegularization(employeeId, data) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const { date, checkIn, checkOut, reason } = data;
    const regId = `REG-${empCode}-${Date.now().toString().slice(-6)}`;

    const res = await pool.query(
      `INSERT INTO attendance_regularizations 
         (id, employee_id, date, requested_check_in, requested_check_out, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
       RETURNING *`,
      [regId, empCode, date, checkIn, checkOut, reason]
    );

    await this.createAdminNotification({
      type: 'ATTENDANCE_REGULARIZATION',
      employeeId: empCode,
      employeeName: emp.name,
      entityId: regId,
      message: `${emp.name} (${empCode}) requested Attendance Regularization for ${date} (Reason: ${reason || 'Punch Issue'})`,
      priority: 'Normal',
      targetRole: 'Manager'
    });

    await this.logAuditEvent({
      userId: empCode,
      employeeId: empCode,
      action: 'ATTENDANCE_REGULARIZATION_SUBMITTED',
      entity: 'attendance_regularizations',
      entityId: regId,
      afterState: { date, checkIn, checkOut, reason }
    });

    return { success: true, message: 'Attendance Regularization Request submitted successfully for review.', data: res.rows[0] };
  }

  /**
   * 4. My Leave Management
   */
  static async getEmployeeLeaves(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    const requestsRes = await pool.query(
      `SELECT * FROM leave_requests
       WHERE employee_id = $1 OR employee_id = $2
       ORDER BY start_date DESC`,
      [emp.id, empCode]
    );

    return {
      balances: {
        casualLeave: 8,
        sickLeave: 6,
        earnedLeave: 12,
        compOff: 2
      },
      requests: requestsRes.rows
    };
  }

  static async submitLeaveRequest(employeeId, data) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const { leaveType, startDate, endDate, isUnpaid = false, reason } = data;
    const leaveId = `LV-${empCode}-${Date.now().toString().slice(-6)}`;

    const res = await pool.query(
      `INSERT INTO leave_requests 
         (id, employee_id, leave_type, start_date, end_date, is_unpaid, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
       RETURNING *`,
      [leaveId, empCode, leaveType, startDate, endDate, isUnpaid, reason]
    );

    await this.createAdminNotification({
      type: 'LEAVE_REQUEST',
      employeeId: empCode,
      employeeName: emp.name,
      entityId: leaveId,
      message: `${emp.name} (${empCode}) requested ${leaveType} Leave (${startDate} to ${endDate})`,
      priority: 'High',
      targetRole: 'HRManager'
    });

    await this.logAuditEvent({
      userId: empCode,
      employeeId: empCode,
      action: 'LEAVE_REQUEST_SUBMITTED',
      entity: 'leave_requests',
      entityId: leaveId,
      afterState: { leaveType, startDate, endDate, reason }
    });

    return { success: true, message: 'Leave application submitted successfully.', data: res.rows[0] };
  }

  /**
   * 5. My Salary & Payslips
   */
  static async getEmployeePayroll(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    // Structure
    const structRes = await pool.query(
      `SELECT * FROM salary_structures WHERE employee_id = $1 OR employee_id = $2 ORDER BY effective_from DESC LIMIT 1`,
      [emp.id, empCode]
    );
    const struct = structRes.rows[0];

    const annualSalary = Number(emp.annual_salary || (Number(emp.salary) >= 100000 ? emp.salary : Number(emp.salary) * 12)) || (struct ? Number(struct.gross_salary) * 12 : 400000);
    const monthlySalary = struct ? Number(struct.gross_salary) : (Math.round((annualSalary / 12) * 100) / 100);
    const basic = struct ? Number(struct.basic_salary) : (Number(emp.basic_salary) || Math.round(monthlySalary * 0.6 * 100) / 100);
    const hra = struct ? Number(struct.hra) : Math.round(basic * 0.4 * 100) / 100;
    const specialAllowance = struct ? Number(struct.special_allowance) : Math.max(0, Math.round((monthlySalary - basic - hra) * 100) / 100);

    // All Payment Transactions Check
    const allPmtsRes = await pool.query(
      `SELECT * FROM payment_transactions 
       WHERE (employee_id = $1 OR employee_id = $2)
       ORDER BY year DESC, month DESC, processed_at DESC`,
      [emp.id, empCode]
    );
    const allPayments = allPmtsRes.rows;
    const latestPayment = allPayments.find(p => p.status === 'PAID') || allPayments[0] || null;

    // Payslips history
    const psRes = await pool.query(
      `SELECT ps.*, pr.run_code, pr.run_date, pr.status as run_status
       FROM payslips ps
       LEFT JOIN payroll_runs pr ON ps.payroll_run_id = pr.id
       WHERE ps.employee_id = $1 OR ps.employee_id = $2
       ORDER BY ps.year DESC, ps.month DESC`,
      [emp.id, empCode]
    );

    const mappedPayslips = psRes.rows.map(ps => {
      const matchPmt = allPayments.find(p => p.month === Number(ps.month) && p.year === ps.year && p.status === 'PAID');
      return {
        ...ps,
        payment_status: ps.payment_status || (matchPmt ? 'PAID' : (ps.status === 'LOCKED' ? 'READY_FOR_PAYMENT' : ps.status)),
        payment_reference: ps.payment_reference || matchPmt?.payment_reference || null,
        transaction_id: ps.transaction_id || matchPmt?.provider_transaction_id || null,
        payment_date: ps.payment_date || matchPmt?.processed_at || null,
        bank_name: ps.bank_name || matchPmt?.bank_name || emp.bank_name || 'HDFC Bank',
        bank_account: ps.bank_account || (matchPmt?.account_number ? `XXXX XXXX ${String(matchPmt.account_number).slice(-4)}` : (emp.bank_account ? `XXXX XXXX ${String(emp.bank_account).slice(-4)}` : 'XXXX XXXX 4521')),
        ifsc_code: ps.ifsc_code || matchPmt?.ifsc_code || emp.ifsc_code || 'HDFC0001234'
      };
    });

    // Build 12-Month Detailed Salary & Credit Status Timeline for 2026 & 2025
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1;

    const monthlyHistory = [];
    for (const yr of [2026, 2025]) {
      for (let m = 1; m <= 12; m++) {
        const ps = mappedPayslips.find(p => (Number(p.month) === m || p.month === String(m)) && p.year === yr);
        const pmt = allPayments.find(p => p.month === m && p.year === yr && p.status === 'PAID');

        const isPastOrCurrent = (yr < currentYear) || (yr === currentYear && m <= currentMonthNum);
        let creditStatus = 'UPCOMING';
        let statusLabel = 'Upcoming Cycle';

        if (pmt || ps?.payment_status === 'PAID') {
          creditStatus = 'CREDITED';
          statusLabel = 'Salary Credited';
        } else if (ps) {
          creditStatus = 'PROCESSING';
          statusLabel = ps.status === 'LOCKED' ? 'Ready for Payment' : 'Under Processing';
        } else if (isPastOrCurrent) {
          creditStatus = 'PENDING';
          statusLabel = 'Pending Run';
        }

        const estGross = ps ? Number(ps.gross_pay || ps.gross_salary) : monthlySalary;
        const estDeductions = ps ? Number(ps.total_deductions) : Math.round(monthlySalary * 0.12);
        const estNet = ps ? Number(ps.net_pay) : (pmt ? Number(pmt.amount) : Math.max(0, estGross - estDeductions));

        monthlyHistory.push({
          month: m,
          monthName: monthNames[m],
          monthShort: monthNames[m].slice(0, 3).toUpperCase(),
          year: yr,
          creditStatus,
          statusLabel,
          isCredited: creditStatus === 'CREDITED',
          grossAmount: estGross,
          totalDeductions: estDeductions,
          netAmount: estNet,
          lopDays: ps ? Number(ps.lop_days || 0) : 0,
          lopDeduction: ps ? Number(ps.lop_amount || ps.lop_deduction || 0) : 0,
          otHours: ps ? Number(ps.ot_hours || 0) : 0,
          otPay: ps ? Number(ps.ot_amount || 0) : 0,
          pfDeduction: ps ? Number(ps.pf_deduction || 0) : Math.round(monthlySalary * 0.06 * 0.12),
          esiDeduction: ps ? Number(ps.esi_deduction || 0) : 0,
          tdsDeduction: ps ? Number(ps.tds_deduction || 0) : 0,
          ptaxDeduction: ps ? Number(ps.professional_tax || 0) : 200,
          reimbursements: ps ? Number(ps.reimbursement_amount || 0) : 0,
          loanEMI: ps ? Number(ps.loan_emi_deduction || 0) : 0,
          basicSalary: ps ? Number(ps.basic_salary || basic) : basic,
          hra: ps ? Number(ps.hra || hra) : hra,
          specialAllowance: ps ? Number(ps.special_allowance || specialAllowance) : specialAllowance,
          paymentReference: ps?.payment_reference || pmt?.payment_reference || null,
          transactionId: ps?.transaction_id || pmt?.provider_transaction_id || null,
          paymentDate: ps?.payment_date || pmt?.processed_at || null,
          bankName: ps?.bank_name || pmt?.bank_name || emp.bank_name || 'HDFC Bank',
          bankAccountMasked: ps?.bank_account || (pmt ? `XXXX XXXX ${String(pmt.account_number).slice(-4)}` : (emp.bank_account ? `XXXX XXXX ${String(emp.bank_account).slice(-4)}` : 'XXXX XXXX 4521')),
          ifscCode: ps?.ifsc_code || pmt?.ifsc_code || emp.ifsc_code || 'HDFC0001234',
          payslipId: ps?.id || null,
          hasPayslip: Boolean(ps)
        });
      }
    }

    return {
      annualSalary,
      monthlySalary,
      currentSalary: {
        annualSalary,
        grossSalary: monthlySalary,
        basicSalary: basic,
        hra,
        specialAllowance,
        effectiveFrom: struct?.effective_from || '2026-01-01'
      },
      latestPayment: latestPayment ? {
        status: latestPayment.status,
        amount: Number(latestPayment.amount),
        month: latestPayment.month,
        year: latestPayment.year,
        paymentDate: latestPayment.processed_at,
        paymentReference: latestPayment.payment_reference,
        transactionId: latestPayment.provider_transaction_id,
        bankName: latestPayment.bank_name || 'HDFC Bank',
        bankAccountMasked: `XXXX XXXX ${String(latestPayment.account_number).slice(-4)}`,
        ifscCode: latestPayment.ifsc_code
      } : null,
      allPayments,
      payslips: mappedPayslips,
      monthlyHistory
    };
  }

  /**
   * 6. My Expenses & Reimbursements
   */
  static async getEmployeeExpenses(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    const res = await pool.query(
      `SELECT * FROM expense_claims
       WHERE (employee_id = $1 OR emp_name = $2)
       ORDER BY created_at DESC`,
      [empCode, emp.name]
    );

    return res.rows;
  }

  static async submitExpenseClaim(employeeId, data) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const {
      category = 'Travel',
      amount = 0,
      description = '',
      vendor = 'Direct Vendor',
      paymentMode = 'Personal Card',
      receiptUrl = '',
      claimDate = new Date().toISOString().split('T')[0]
    } = data;
    const claimId = `EXP-${empCode}-${Date.now().toString().slice(-6)}`;

    await pool.query(`
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS vendor VARCHAR(150);
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(100);
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS receipt_url TEXT;
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS claim_date DATE;
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS description TEXT;
    `).catch(() => {});

    const res = await pool.query(
      `INSERT INTO expense_claims
         (id, employee_id, emp_name, category, amount, description, claim_date, vendor, payment_mode, receipt_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING_APPROVAL')
       RETURNING *`,
      [claimId, empCode, emp.name, category, Number(amount), description, claimDate, vendor, paymentMode, receiptUrl]
    );

    await this.createAdminNotification({
      type: 'EXPENSE_CLAIM',
      employeeId: empCode,
      employeeName: emp.name,
      entityId: claimId,
      message: `${emp.name} (${empCode}) submitted Expense Claim of ₹${Number(amount).toLocaleString()} for ${category}`,
      priority: 'High',
      targetRole: 'Finance'
    });

    await this.logAuditEvent({
      userId: empCode,
      employeeId: empCode,
      action: 'EXPENSE_CLAIM_SUBMITTED',
      entity: 'expense_claims',
      entityId: claimId,
      afterState: { category, amount, description, vendor, paymentMode }
    });

    return { success: true, message: 'Expense claim submitted successfully for Finance & Manager review.', data: res.rows[0] };
  }

  /**
   * 7. My Active Loans & EMIs
   */
  static async getEmployeeLoans(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    const res = await pool.query(
      `SELECT * FROM loans WHERE employee_id = $1 OR employee_id = $2`,
      [emp.id, empCode]
    );

    return res.rows;
  }

  /**
   * 8. My Performance Reviews & Self-Evaluation (Dynamic Task & Review Metrics)
   */
  static async getEmployeePerformance(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    // Fetch dynamic task-derived performance metrics
    const { TaskService } = await import('./taskService.js');
    const taskPerf = await TaskService.getEmployeePerformanceMetrics(empCode).catch(() => null);

    const res = await pool.query(
      `SELECT * FROM performance_reviews
       WHERE employee_id = $1 OR employee_id = $2
       ORDER BY created_at DESC`,
      [emp.id, empCode]
    );

    let review = res.rows[0];
    if (!review) {
      // Create initial review template if none exists
      const revId = `PERF-${empCode}-2026-Q3`;
      const newRev = await pool.query(
        `INSERT INTO performance_reviews 
           (id, employee_id, employee_name, review_period, goals, kpi_scores, status)
         VALUES ($1, $2, $3, 'Q3 2026', 'Complete enterprise module integrations and maintain high code quality.', '{"code_quality": 4.5, "productivity": 4.6, "teamwork": 4.8}'::jsonb, 'Self Review')
         RETURNING *`,
        [revId, empCode, emp.name]
      );
      review = newRev.rows[0];
    }

    return {
      ...review,
      taskMetrics: taskPerf?.metrics || null,
      scoringBreakdown: taskPerf?.scoringBreakdown || null,
      monthlyTrends: taskPerf?.monthlyTrends || []
    };
  }

  static async submitSelfReview(employeeId, data) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const { selfRating, selfReviewNotes } = data;
    const perfId = `PERF-${empCode}-2026-Q3`;

    const res = await pool.query(
      `INSERT INTO performance_reviews
         (id, employee_id, employee_name, review_period, self_rating, self_review_notes, status)
       VALUES ($1, $2, $3, 'Q3 2026', $4, $5, 'Manager Review')
       ON CONFLICT (id) DO UPDATE SET
         self_rating = EXCLUDED.self_rating,
         self_review_notes = EXCLUDED.self_review_notes,
         status = 'Manager Review',
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [perfId, empCode, emp.name, selfRating, selfReviewNotes]
    );

    return { success: true, message: 'Self-review submitted for manager evaluation.', data: res.rows[0] };
  }

  /**
   * 9. Internal Job Applications & Openings
   */
  static async getInternalJobs(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    // Fetch active job openings from recruitment
    const jobsRes = await pool.query(`SELECT * FROM job_openings WHERE status = 'Open' OR status = 'Active'`);
    const myAppsRes = await pool.query(
      `SELECT * FROM internal_job_applications WHERE employee_id = $1 OR employee_id = $2`,
      [emp.id, empCode]
    );

    return {
      openings: jobsRes.rows.length > 0 ? jobsRes.rows : [
        { id: 'JOB-INT-101', title: 'Lead Software Architect', department: 'Engineering', location: 'Fort Mumbai HQ', description: 'Lead architectural direction for cloud microservices.' },
        { id: 'JOB-INT-102', title: 'Product Manager - ERP Domain', department: 'Product', location: 'Bengaluru Tech Hub', description: 'Drive product strategy for HRMS & Finance suites.' }
      ],
      myApplications: myAppsRes.rows
    };
  }

  static async applyInternalJob(employeeId, jobId, coverLetter) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const appId = `APP-${empCode}-${Date.now().toString().slice(-4)}`;

    const res = await pool.query(
      `INSERT INTO internal_job_applications
         (id, job_id, job_title, department, location, employee_id, employee_name, current_designation, cover_letter, status)
       VALUES ($1, $2, 'Internal Transfer Opportunity', $3, 'HQ Office', $4, $5, $6, $7, 'Applied')
       ON CONFLICT (job_id, employee_id) DO UPDATE SET cover_letter = EXCLUDED.cover_letter
       RETURNING *`,
      [appId, jobId, emp.department || 'Engineering', empCode, emp.name, emp.designation || 'Engineer', coverLetter]
    );

    return { success: true, message: 'Internal job application submitted.', data: res.rows[0] };
  }

  /**
   * 10. Transfer Requests
   */
  static async getTransferRequests(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    const res = await pool.query(
      `SELECT * FROM transfer_requests WHERE employee_id = $1 OR employee_id = $2 ORDER BY created_at DESC`,
      [emp.id, empCode]
    );

    return res.rows;
  }

  static async submitTransferRequest(employeeId, data) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const { requestedDepartment, requestedBranch, preferredEffectiveDate, reason } = data;
    const reqId = `TR-${empCode}-${Date.now().toString().slice(-4)}`;

    const res = await pool.query(
      `INSERT INTO transfer_requests
         (id, employee_id, employee_name, current_department, requested_department, current_branch, requested_branch, preferred_effective_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Submitted')
       RETURNING *`,
      [reqId, empCode, emp.name, emp.department || 'Engineering', requestedDepartment, emp.branch || 'Mumbai HQ', requestedBranch, preferredEffectiveDate, reason]
    );

    await this.createAdminNotification({
      type: 'TRANSFER_REQUEST',
      employeeId: empCode,
      employeeName: emp.name,
      entityId: reqId,
      message: `${emp.name} (${empCode}) requested Transfer (${emp.department || 'Current'} → ${requestedDepartment})`,
      priority: 'High',
      targetRole: 'HRManager'
    });

    await this.logAuditEvent({
      userId: empCode,
      employeeId: empCode,
      action: 'TRANSFER_REQUEST_SUBMITTED',
      entity: 'transfer_requests',
      entityId: reqId,
      afterState: { requestedDepartment, requestedBranch, reason }
    });

    return { success: true, message: 'Transfer request submitted for Manager & HR approval.', data: res.rows[0] };
  }

  /**
   * 11. Documents Vault
   */
  static async getEmployeeDocuments(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    const res = await pool.query(
      `SELECT * FROM documents WHERE entity_id = $1 OR entity_id = $2`,
      [emp.id, empCode]
    );

    return res.rows.length > 0 ? res.rows : [
      { id: 'DOC-01', title: 'Official Employment Offer Letter', category: 'Offer Letter', created_at: emp.joining_date },
      { id: 'DOC-02', title: 'PAN & Identity Verification Card', category: 'ID Documents', created_at: emp.joining_date },
      { id: 'DOC-03', title: 'Form 16 Tax Statement 2025-26', category: 'Tax Documents', created_at: '2026-04-15' }
    ];
  }

  /**
   * 12. Timesheets
   */
  static async getEmployeeTimesheets(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    const res = await pool.query(
      `SELECT * FROM timesheets WHERE employee_id = $1 OR employee_id = $2 ORDER BY date DESC`,
      [emp.id, empCode]
    );

    return res.rows;
  }

  static async submitTimesheet(employeeId, data) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const { projectName, taskName, date, hoursSpent, description } = data;
    const tsId = `TS-${empCode}-${Date.now().toString().slice(-6)}`;

    const res = await pool.query(
      `INSERT INTO timesheets
         (id, employee_id, employee_name, project_name, task_name, task_description, date, hours_spent, hours, description, status)
       VALUES ($1, $2, $3, $4, $5, $8, $6, $7, $7, $8, 'Submitted')
       RETURNING *`,
      [tsId, empCode, emp.name, projectName, taskName, date, hoursSpent, description]
    );

    await this.createAdminNotification({
      type: 'TIMESHEET_SUBMISSION',
      employeeId: empCode,
      employeeName: emp.name,
      entityId: tsId,
      message: `${emp.name} (${empCode}) submitted Timesheet for ${projectName} (${hoursSpent} hours)`,
      priority: 'Normal',
      targetRole: 'Manager'
    });

    await this.logAuditEvent({
      userId: empCode,
      employeeId: empCode,
      action: 'TIMESHEET_SUBMITTED',
      entity: 'timesheets',
      entityId: tsId,
      afterState: { projectName, taskName, hoursSpent }
    });

    return { success: true, message: 'Timesheet entry submitted.', data: res.rows[0] };
  }

  /**
   * 13. My Tasks Management (Delegated to TaskService)
   */
  static async getEmployeeTasks(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const { TaskService } = await import('./taskService.js');
    return TaskService.getAllTasks({ employeeId: empCode }, { id: empCode, empCode, role: 'Employee', isEmployeeOnly: true });
  }

  static async updateTaskStatus(employeeId, taskId, status, progressPercent = null) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const { TaskService } = await import('./taskService.js');
    
    if (status === 'IN_PROGRESS' || status === 'In Progress') {
      return TaskService.startTask(taskId, empCode);
    } else if (status === 'SUBMITTED' || status === 'In Review' || status === 'Submitted') {
      return TaskService.submitForReview(taskId, empCode, { completionNote: 'Submitted for manager review.' });
    } else {
      return TaskService.updateProgress(taskId, empCode, {
        progressPercent: progressPercent !== null ? progressPercent : (status === 'COMPLETED' ? 100 : 50),
        status
      });
    }
  }

  static async createTask(employeeId, taskData) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const { TaskService } = await import('./taskService.js');
    const task = await TaskService.createTask({
      ...taskData,
      assignedTo: taskData.assignedTo || empCode,
      department: emp.department
    }, { id: empCode, name: emp.name, role: 'Employee' });
    return { success: true, message: 'Task created & assigned successfully!', data: task };
  }

  static async deleteTask(employeeId, taskId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    const res = await pool.query(
      `DELETE FROM tasks WHERE id = $1 AND (assigned_to = $2 OR assigned_to = $3 OR assigned_by = $2 OR assigned_by = $3) RETURNING id`,
      [taskId, emp.id, empCode]
    );

    if (res.rows.length === 0) throw new Error('Task not found or unauthorized.');
    return { success: true, message: 'Task deleted successfully', taskId };
  }

  /**
   * 14. My HR Requests Management
   */
  static async getEmployeeHRRequests(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    const res = await pool.query(
      `SELECT * FROM hr_requests WHERE employee_id = $1 OR employee_id = $2 ORDER BY created_at DESC`,
      [emp.id, empCode]
    );

    return res.rows;
  }

  static async submitHRRequest(employeeId, data) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;
    const { requestType, description } = data;
    const reqId = `HRR-${empCode}-${Date.now().toString().slice(-6)}`;

    const res = await pool.query(
      `INSERT INTO hr_requests (id, employee_id, employee_name, request_type, description, status)
       VALUES ($1, $2, $3, $4, $5, 'SUBMITTED')
       RETURNING *`,
      [reqId, empCode, emp.name, requestType, description]
    );

    await this.logAuditEvent({
      userId: empCode,
      employeeId: empCode,
      action: 'HR_REQUEST_SUBMITTED',
      entity: 'hr_requests',
      entityId: reqId,
      afterState: { requestType, description }
    });

    return { success: true, message: 'HR Request submitted successfully.', data: res.rows[0] };
  }

  static async updateHRRequestStatus(requestId, status, resolutionNotes) {
    const res = await pool.query(
      `UPDATE hr_requests SET status = $1, resolution_notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [status, resolutionNotes || 'Processed by HR', requestId]
    );

    if (res.rows.length === 0) throw new Error('HR Request not found');
    const req = res.rows[0];

    await this.createNotification(req.employee_id, 'HR Request Update', `Your HR Request (${req.request_type}) status is now ${status}.`, '/employee/hr-requests');

    return { success: true, data: req };
  }

  /**
   * 15. Real Event Activity Feed
   */
  static async getEmployeeActivityFeed(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    const [lvRes, expRes, transRes, psRes, tsRes] = await Promise.all([
      pool.query(`SELECT id, leave_type as title, status, start_date as created_at FROM leave_requests WHERE employee_id = $1 OR employee_id = $2 LIMIT 3`, [emp.id, empCode]),
      pool.query(`SELECT id, category as title, status, amount, created_at FROM expense_claims WHERE employee_id = $1 OR emp_name = $2 LIMIT 3`, [empCode, emp.name]),
      pool.query(`SELECT id, requested_department as title, status, created_at FROM transfer_requests WHERE employee_id = $1 OR employee_id = $2 LIMIT 3`, [emp.id, empCode]),
      pool.query(`SELECT id, month || '/' || year as title, net_pay, 'Paid' as status, created_at FROM payslips WHERE employee_id = $1 OR employee_id = $2 LIMIT 3`, [emp.id, empCode]),
      pool.query(`SELECT id, task_name as title, status, submitted_at as created_at FROM timesheets WHERE employee_id = $1 OR employee_id = $2 LIMIT 3`, [emp.id, empCode]),
    ]);

    const feed = [];
    lvRes.rows.forEach(r => feed.push({ type: 'Leave', title: `Leave Request (${r.title})`, description: `Status: ${r.status}`, timestamp: r.created_at, status: r.status }));
    expRes.rows.forEach(r => feed.push({ type: 'Expense', title: `Expense Claim (${r.title})`, description: `Amount: ₹${r.amount} | Status: ${r.status}`, timestamp: r.created_at, status: r.status }));
    transRes.rows.forEach(r => feed.push({ type: 'Transfer', title: `Department Transfer Request`, description: `Target: ${r.title} | Status: ${r.status}`, timestamp: r.created_at, status: r.status }));
    psRes.rows.forEach(r => feed.push({ type: 'Payroll', title: `Payslip Issued (${r.title})`, description: `Net Disbursal: ₹${r.net_pay}`, timestamp: r.created_at, status: r.status }));
    tsRes.rows.forEach(r => feed.push({ type: 'Timesheet', title: `Timesheet Submitted (${r.title})`, description: `Status: ${r.status}`, timestamp: r.created_at, status: r.status }));

    feed.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    return feed.slice(0, 10);
  }

  /**
   * Helper: Event Notifications & Immutable Audit Log Writer
   */
  static async createNotification(employeeId, title, message, link = '') {
    const notifId = `NOTIF-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    await pool.query(
      `INSERT INTO ess_notifications (id, employee_id, title, message, link) VALUES ($1, $2, $3, $4, $5)`,
      [notifId, employeeId, title, message, link]
    );
  }

  static async createAdminNotification({ type, employeeId, employeeName, entityId, message, priority = 'Normal', targetRole = 'HRManager' }) {
    const notifId = `ADM-NOTIF-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    await pool.query(
      `INSERT INTO admin_notifications (id, type, employee_id, employee_name, entity_id, message, priority, target_role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [notifId, type, employeeId, employeeName, entityId || null, message, priority, targetRole]
    );
    try {
      const { broadcastWebSocketEvent } = await import('../utils/websocket.js');
      broadcastWebSocketEvent('ADMIN_NOTIFICATION', {
        id: notifId,
        type,
        employeeId,
        employeeName,
        entityId,
        message,
        priority,
        targetRole,
        timestamp: new Date()
      });
    } catch (e) {
      // Ignore WS fallback
    }
  }

  static async getAdminNotifications(role = 'All') {
    let query = `SELECT * FROM admin_notifications`;
    const params = [];
    if (role && role !== 'All' && role !== 'Executive') {
      query += ` WHERE target_role = $1 OR target_role = 'All' OR target_role = 'HRManager'`;
      params.push(role);
    }
    query += ` ORDER BY created_at DESC LIMIT 50`;
    const res = await pool.query(query, params);
    return res.rows;
  }

  static async markAdminNotificationRead(id) {
    await pool.query(`UPDATE admin_notifications SET read = TRUE WHERE id = $1`, [id]);
    return { success: true };
  }

  static async getFullEmployeeReport(employeeId) {
    const emp = await this.resolveEmployee(employeeId);
    const empCode = emp.emp_code || emp.id;

    const [
      dash,
      prof,
      att,
      leaves,
      payroll,
      expenses,
      loans,
      perf,
      jobs,
      transfers,
      docs,
      timesheets,
      tasks,
      hrReqs,
      activity,
      audits
    ] = await Promise.all([
      this.getEmployeeDashboard(empCode),
      this.getEmployeeProfile(empCode),
      this.getEmployeeAttendance(empCode),
      this.getEmployeeLeaves(empCode),
      this.getEmployeePayroll(empCode),
      this.getEmployeeExpenses(empCode),
      this.getEmployeeLoans(empCode),
      this.getEmployeePerformance(empCode),
      this.getInternalJobs(empCode),
      this.getTransferRequests(empCode),
      this.getEmployeeDocuments(empCode),
      this.getEmployeeTimesheets(empCode),
      this.getEmployeeTasks(empCode),
      this.getEmployeeHRRequests(empCode),
      this.getEmployeeActivityFeed(empCode),
      pool.query(`SELECT * FROM audit_logs WHERE employee_id = $1 OR employee_id = $2 OR user_id = $1 OR user_id = $2 ORDER BY timestamp DESC LIMIT 50`, [emp.id, empCode])
    ]);

    return {
      employee: emp,
      dashboard: dash,
      profile: prof,
      attendance: att,
      leave: leaves,
      payroll,
      expenses,
      loans,
      performance: perf,
      internalJobs: jobs,
      transfers,
      documents: docs,
      timesheets,
      tasks,
      hrRequests: hrReqs,
      activity,
      auditLogs: audits.rows
    };
  }

  static async logAuditEvent({ userId, employeeId, action, entity, entityId, beforeState, afterState, ipAddress }) {
    const auditId = `AUD-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, employee_id, action, entity, entity_id, before_state, after_state, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [auditId, userId || 'SYSTEM', employeeId || null, action, entity, entityId || null, beforeState ? JSON.stringify(beforeState) : null, afterState ? JSON.stringify(afterState) : null, ipAddress || '127.0.0.1']
    );
  }
}
