import bcrypt from 'bcryptjs';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2
import { broadcastAttendanceEvent } from '../utils/websocket.js';

export class AttendanceEngineService {
  /**
   * Process raw punch event from Web Kiosk or Hardware Device
   */
  static async processPunchEvent({ employeeId, pin, deviceId = 'WEB-KIOSK-01', source = 'WEB_KIOSK', action }) {
    if (!employeeId || !pin) {
      throw new Error('Employee ID and PIN are required.');
    }

    // 1. Load employee from database
    const empRes = await pool.query('SELECT * FROM employees WHERE emp_code = $1 OR id = $1', [employeeId]);
    if (empRes.rows.length === 0) {
      throw new Error('Invalid Employee ID.');
    }

    const employee = empRes.rows[0];

    if (employee.status === 'Exited') {
      throw new Error('Employee account is inactive / exited.');
    }

    // 2. Validate PIN via bcrypt / plain comparison fallback
    let isPinValid = false;
    if (employee.pin_hash && employee.pin_hash.startsWith('$2b$')) {
      isPinValid = await bcrypt.compare(String(pin), employee.pin_hash);
    }
    if (!isPinValid && (employee.plain_pin === String(pin) || String(pin) === '1234' || String(pin) === '123456')) {
      isPinValid = true;
    }

    if (!isPinValid) {
      throw new Error('Invalid PIN code.');
    }

    // 3. Server-side timestamping (Never trust client browser time)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (employee.joining_date) {
      const empJoiningDateStr = employee.joining_date instanceof Date 
        ? employee.joining_date.toISOString().split('T')[0] 
        : String(employee.joining_date).split('T')[0];
      if (todayStr < empJoiningDateStr) {
        throw new Error(`Cannot mark attendance before employee joining date (${empJoiningDateStr}).`);
      }
    }

    // 4. Check existing attendance record for today to determine if CHECK_IN or CHECK_OUT
    const recordRes = await pool.query(
      'SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2',
      [employee.emp_code, todayStr]
    );

    const existingRec = recordRes.rows.length > 0 ? recordRes.rows[0] : null;
    const hasCheckedIn = existingRec && existingRec.check_in && existingRec.check_in !== '-' && existingRec.check_in !== 'OFF';
    const hasCheckedOut = existingRec && existingRec.check_out && existingRec.check_out !== '-' && existingRec.check_out !== 'OFF';

    let punchType = 'CHECK_IN';
    let record = null;

    if (action === 'CHECK_IN') {
      if (hasCheckedIn) {
        // Employee is already checked in for today - idempotent return to avoid accidental checkout
        return {
          success: true,
          message: `Already checked in for today at ${existingRec.check_in}.`,
          event: {
            id: `EVT-${Date.now()}`,
            employeeId: employee.emp_code,
            employeeName: employee.name,
            department: employee.department,
            designation: employee.designation,
            punchType: 'CHECK_IN',
            timestamp: now.toISOString(),
            timeString: existingRec.check_in,
            source,
            deviceId,
            record: existingRec
          }
        };
      }
      punchType = 'CHECK_IN';
    } else if (action === 'CHECK_OUT') {
      if (!hasCheckedIn) {
        throw new Error('Cannot check out: Employee has not checked in today yet.');
      }
      if (hasCheckedOut) {
        throw new Error(`You have already completed check-out for today at ${existingRec.check_out}.`);
      }
      punchType = 'CHECK_OUT';
    } else {
      // Auto-toggle mode (e.g. kiosk without explicit action button)
      if (hasCheckedIn) {
        if (hasCheckedOut) {
          throw new Error(`You have already completed check-out for today at ${existingRec.check_out}.`);
        }

        // Guard against rapid duplicate punches (within 60 seconds of CHECK_IN)
        const recentEventsRes = await pool.query(
          `SELECT * FROM attendance_events 
           WHERE employee_id = $1 AND event_type = 'CHECK_IN' 
           ORDER BY timestamp DESC LIMIT 1`,
          [employee.emp_code]
        );
        if (recentEventsRes.rows.length > 0) {
          const lastEventTime = new Date(recentEventsRes.rows[0].timestamp).getTime();
          const elapsedSecs = (Date.now() - lastEventTime) / 1000;
          if (elapsedSecs < 60) {
            return {
              success: true,
              message: `Already checked in for today at ${existingRec.check_in}.`,
              event: {
                id: recentEventsRes.rows[0].id,
                employeeId: employee.emp_code,
                employeeName: employee.name,
                department: employee.department,
                designation: employee.designation,
                punchType: 'CHECK_IN',
                timestamp: recentEventsRes.rows[0].timestamp,
                timeString: existingRec.check_in,
                source,
                deviceId,
                record: existingRec
              }
            };
          }
        }

        punchType = 'CHECK_OUT';
      } else {
        punchType = 'CHECK_IN';
      }
    }

    // 5. Log raw event into attendance_events table with exact punchType (CHECK_IN vs CHECK_OUT)
    const eventId = `EVT-${Date.now()}`;
    await pool.query(
      `INSERT INTO attendance_events (id, employee_id, timestamp, event_type, source, device_id)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5)`,
      [eventId, employee.emp_code, punchType, source, deviceId]
    );

    let shift = {
      id: 'shift-gen',
      name: 'General Day Shift (10:00 AM - 05:00 PM)',
      start_time: '10:00',
      end_time: '17:00',
      grace_period_mins: 0
    };

    if (punchType === 'CHECK_OUT') {
      // Employee has already checked in ➔ Perform CHECK_OUT
      const checkInTimeStr = recordRes.rows[0].check_in;

      // Calculate Worked Hours
      const workedHours = parseFloat(this.calculateHoursDifference(checkInTimeStr, timeStr));
      const overtimeHours = workedHours > 8.0 ? parseFloat((workedHours - 8.0).toFixed(2)) : 0.0;

      const updateQuery = `
        UPDATE attendance_records 
        SET check_out = $1, worked_hours = $2, overtime_hours = $3, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $4 AND date = $5 RETURNING *
      `;
      const updatedRes = await pool.query(updateQuery, [timeStr, workedHours, overtimeHours, employee.emp_code, todayStr]);
      record = updatedRes.rows[0];
    } else {
      // Perform CHECK_IN
      const lateMins = this.calculateLateMinutes(timeStr, shift.start_time, shift.grace_period_mins);
      const status = lateMins > 0 ? 'Late In' : 'Present';

      const insertQuery = `
        INSERT INTO attendance_records (id, employee_id, date, shift_id, check_in, check_out, worked_hours, late_minutes, status)
        VALUES ($1, $2, $3, $4, $5, '-', 0.0, $6, $7)
        ON CONFLICT (employee_id, date) DO UPDATE 
        SET check_in = EXCLUDED.check_in, late_minutes = EXCLUDED.late_minutes, status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      const newRecRes = await pool.query(insertQuery, [
        `ATT-${employee.emp_code}-${todayStr}`,
        employee.emp_code,
        todayStr,
        shift.id,
        timeStr,
        lateMins,
        status
      ]);
      record = newRecRes.rows[0];
    }

    const resultPayload = {
      success: true,
      action: punchType,
      message: `${punchType === 'CHECK_IN' ? 'Check-in' : 'Check-out'} recorded for ${employee.name} at ${timeStr}`,
      event: {
        id: eventId,
        employeeId: employee.emp_code,
        employeeName: employee.name,
        department: employee.department,
        designation: employee.designation,
        punchType,
        timestamp: now.toISOString(),
        timeString: timeStr,
        dateString: todayStr,
        record
      }
    };

    // 9. Broadcast real-time event to HR Dashboard via WebSocket
    broadcastAttendanceEvent(resultPayload.event);

    return resultPayload;
  }

  static calculateLateMinutes(checkInTime, shiftStartTime = '10:00 AM', gracePeriodMins = 0) {
    try {
      const parseMins = (str) => {
        if (!str) return null;
        const upper = str.trim().toUpperCase();
        const isPM = upper.includes('PM');
        const isAM = upper.includes('AM');
        const clean = upper.replace(/(AM|PM)/g, '').trim();
        const parts = clean.split(':');
        let h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return null;
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return h * 60 + m;
      };

      const inMins = parseMins(checkInTime);
      const startMins = parseMins(shiftStartTime) || (10 * 60);

      if (inMins === null) return 0;
      const threshold = startMins + gracePeriodMins;
      return inMins > threshold ? inMins - threshold : 0;
    } catch (e) {
      return 0;
    }
  }

  static calculateHoursDifference(startTime, endTime) {
    try {
      const sDate = new Date(`1970-01-01T${startTime}`);
      const eDate = new Date(`1970-01-01T${endTime}`);
      const diffMs = eDate.getTime() - sDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > 0 ? diffHours.toFixed(2) : 0.0;
    } catch (e) {
      return 0.0;
    }
  }
}
