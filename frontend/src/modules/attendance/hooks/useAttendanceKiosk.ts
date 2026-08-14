import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  KioskStatus,
  KioskResult,
  AttendanceEvent,
  DetailedAttendanceRecord
} from '../types';
import { calculateLateMinutes, calculateEarlyOutMinutes, calculateWorkedHours, calculateOvertimeHours } from '../utils/attendanceCalculator';

export function useAttendanceKiosk() {
  const {
    employees,
    attendanceRecords,
    shifts,
    checkIn,
    checkOut,
    attendanceEvents = [],
    addAttendanceEvent = () => {},
    reloadAttendanceFromDB
  } = useApp() as any;

  const [kioskStatus, setKioskStatus] = useState<KioskStatus>('IDLE');
  const [kioskResult, setKioskResult] = useState<KioskResult | null>(null);

  // Security UX: Lockout state
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0);

  // Auto Reset Countdown
  const [resetCountdown, setResetCountdown] = useState<number>(0);

  // Lockout countdown timer effect
  useEffect(() => {
    if (lockoutTimeLeft <= 0) {
      if (kioskStatus === 'LOCKED') setKioskStatus('IDLE');
      return;
    }

    const timer = setInterval(() => {
      setLockoutTimeLeft(prev => {
        if (prev <= 1) {
          setKioskStatus('IDLE');
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutTimeLeft, kioskStatus]);

  // Success auto-reset countdown timer effect
  useEffect(() => {
    if (resetCountdown <= 0) return;

    const timer = setInterval(() => {
      setResetCountdown(prev => {
        if (prev <= 1) {
          resetKiosk();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resetCountdown]);

  const resetKiosk = useCallback(() => {
    setKioskStatus('IDLE');
    setKioskResult(null);
    setResetCountdown(0);
  }, []);

  const processKioskPunch = async (inputEmployeeId: string, inputPin: string): Promise<KioskResult> => {
    if (lockoutTimeLeft > 0) {
      const msg = `Too many failed attempts. Please try again in ${lockoutTimeLeft}s or contact HR.`;
      setKioskResult({ success: false, message: msg });
      return { success: false, message: msg };
    }

    const empCodeInput = inputEmployeeId.trim();
    if (!empCodeInput) {
      const msg = 'Please enter your Employee ID.';
      setKioskResult({ success: false, message: msg });
      return { success: false, message: msg };
    }

    if (!inputPin || inputPin.trim() === '') {
      const msg = 'Please enter your PIN.';
      setKioskResult({ success: false, message: msg });
      return { success: false, message: msg };
    }

    setKioskStatus('VERIFYING');

    try {
      // 1. Send punch event request to Express Backend Server
      const apiRes = await fetch('/api/attendance/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empCodeInput,
          pin: inputPin.trim(),
          deviceId: 'WEB-KIOSK-01',
          source: 'WEB_KIOSK'
        })
      });

      const data = await apiRes.json();

      if (!data.success) {
        const newFailCount = failedAttempts + 1;
        setFailedAttempts(newFailCount);
        let msg = data.message || 'Verification failed.';

        if (newFailCount >= 5) {
          setKioskStatus('LOCKED');
          setLockoutTimeLeft(120);
          msg = 'Too many invalid attempts. Kiosk locked for 2 minutes.';
        } else {
          setKioskStatus('ERROR');
        }

        const res = { success: false, message: msg };
        setKioskResult(res);
        return res;
      }

      // Successful Backend Punch
      setFailedAttempts(0);
      const evt = data.event;

      // Sync React state
      if (evt.punchType === 'CHECK_IN') {
        checkIn(evt.employeeId);
      } else if (evt.punchType === 'CHECK_OUT') {
        checkOut(evt.employeeId);
      }

      // Add to Live Stream Feed immediately
      const rawLiveEvent: AttendanceEvent = {
        eventId: evt.id || `EVT-${Date.now()}`,
        employeeId: evt.employeeId,
        empName: evt.employeeName || evt.empName,
        department: evt.department,
        eventType: evt.punchType || 'CHECK_IN',
        timestamp: evt.timestamp,
        timeString: evt.timeString,
        source: 'WEB_KIOSK',
        deviceId: 'WEB-KIOSK-01',
        statusCalculated: evt.record ? evt.record.status : 'Present'
      };

      if (addAttendanceEvent) {
        addAttendanceEvent(rawLiveEvent);
      }

      if (reloadAttendanceFromDB) {
        reloadAttendanceFromDB();
      }

      const resultData: KioskResult = {
        success: true,
        employeeId: evt.employeeId,
        empName: evt.employeeName,
        department: evt.department,
        designation: evt.designation,
        action: evt.punchType,
        timestamp: evt.timestamp,
        timeString: evt.timeString,
        shiftName: 'General Day Shift',
        status: evt.record ? evt.record.status : 'Present',
        lateMinutes: evt.record ? evt.record.late_minutes || 0 : 0,
        message: evt.punchType === 'CHECK_IN' ? `Check-in recorded at ${evt.timeString}` : `Check-out recorded at ${evt.timeString}`
      };

      setKioskResult(resultData);
      setKioskStatus('SUCCESS');
      setResetCountdown(4);

      return resultData;
    } catch (apiErr) {
      // Fallback for local offline prototype mode
      console.warn('Backend API connection offline, executing local state punch fallback');
    }

    // 1. Employee lookup
    const emp = employees.find(
      (e: any) =>
        e.id.toLowerCase() === empCodeInput.toLowerCase() ||
        e.empCode.toLowerCase() === empCodeInput.toLowerCase()
    );

    if (!emp) {
      const newFailCount = failedAttempts + 1;
      setFailedAttempts(newFailCount);
      let msg = 'Employee ID not found.';

      if (newFailCount >= 5) {
        setKioskStatus('LOCKED');
        setLockoutTimeLeft(120); // 2 minute lockout
        msg = 'Too many invalid attempts. Kiosk locked for 2 minutes.';
      } else {
        setKioskStatus('ERROR');
      }

      const res = { success: false, message: msg };
      setKioskResult(res);
      return res;
    }

    // 2. PIN Verification (check emp.pin or default prototype PIN '1234')
    const expectedPin = emp.pin || '1234';
    if (inputPin.trim() !== expectedPin) {
      const newFailCount = failedAttempts + 1;
      setFailedAttempts(newFailCount);
      let msg = 'Invalid PIN.';

      if (newFailCount >= 5) {
        setKioskStatus('LOCKED');
        setLockoutTimeLeft(120);
        msg = 'Too many invalid attempts. Kiosk locked for 2 minutes.';
      } else {
        setKioskStatus('ERROR');
      }

      const res = { success: false, message: msg };
      setKioskResult(res);
      return res;
    }

    // Reset failed attempts on valid credentials
    setFailedAttempts(0);

    const currentDateStr = new Date().toISOString().split('T')[0];

    // 3. Joining Date validation
    if (emp.joiningDate && emp.joiningDate > currentDateStr) {
      setKioskStatus('ERROR');
      const msg = `Attendance is not available before joining date (${emp.joiningDate}).`;
      const res = { success: false, message: msg };
      setKioskResult(res);
      return res;
    }

    // 4. Exit Date / Status validation
    if (emp.status === 'Exited') {
      setKioskStatus('ERROR');
      const msg = 'Attendance is not available for this employee (Exited).';
      const res = { success: false, message: msg };
      setKioskResult(res);
      return res;
    }

    // 5. Active Status validation
    if (emp.status === 'Inactive') {
      setKioskStatus('ERROR');
      const msg = 'Your account is not active for attendance.';
      const res = { success: false, message: msg };
      setKioskResult(res);
      return res;
    }

    // 6. Assigned Shift lookup
    const empShift = shifts.find((s: any) => s.id === emp.shiftId) || shifts[0];
    if (!empShift) {
      setKioskStatus('ERROR');
      const msg = 'No active shift is assigned. Please contact HR.';
      const res = { success: false, message: msg };
      setKioskResult(res);
      return res;
    }

    // 7. Today's attendance record & event action determination
    const empCode = emp.empCode || emp.id;
    const todayRecord = attendanceRecords.find(
      (r: DetailedAttendanceRecord) =>
        (r.employeeId === empCode || r.empId === empCode) && r.date === currentDateStr
    );

    const nowTimeString = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let action: 'CHECK_IN' | 'CHECK_OUT' = 'CHECK_IN';

    if (!todayRecord || !todayRecord.checkIn || todayRecord.checkIn === '-') {
      action = 'CHECK_IN';
      setKioskStatus('CHECKING_IN');
      const punchRes = checkIn(empCode, 'HQ Kiosk', '192.168.1.50');
      if (!punchRes.success) {
        setKioskStatus('ERROR');
        const res = { success: false, message: punchRes.message };
        setKioskResult(res);
        return res;
      }
    } else if (todayRecord.checkIn && todayRecord.checkIn !== '-' && (!todayRecord.checkOut || todayRecord.checkOut === '-')) {
      action = 'CHECK_OUT';
      setKioskStatus('CHECKING_OUT');
      const punchRes = checkOut(empCode);
      if (!punchRes.success) {
        setKioskStatus('ERROR');
        const res = { success: false, message: punchRes.message };
        setKioskResult(res);
        return res;
      }
    } else {
      // Both checkIn and checkOut already complete
      setKioskStatus('ERROR');
      const msg = 'Today\'s attendance is already completed for this employee.';
      const res = { success: false, message: msg };
      setKioskResult(res);
      return res;
    }

    // Create Raw Attendance Event
    const rawEvent: AttendanceEvent = {
      eventId: `EVT-${Date.now()}`,
      employeeId: empCode,
      empName: emp.name,
      department: emp.department,
      eventType: action,
      timestamp: new Date().toISOString(),
      timeString: nowTimeString,
      source: 'WEB_KIOSK',
      deviceId: 'WEB-KIOSK-01'
    };

    if (addAttendanceEvent) {
      addAttendanceEvent(rawEvent);
    }

    // Calculate updated metrics for result screen
    const lateMins = calculateLateMinutes(nowTimeString, empShift.startTime, empShift.gracePeriodMins);
    const resultData: KioskResult = {
      success: true,
      employeeId: empCode,
      empName: emp.name,
      department: emp.department,
      designation: emp.designation,
      action,
      timestamp: rawEvent.timestamp,
      timeString: nowTimeString,
      shiftName: empShift.name,
      status: lateMins > 0 ? 'Late In' : 'Present',
      lateMinutes: lateMins,
      message: action === 'CHECK_IN' ? `Check-in recorded at ${nowTimeString}` : `Check-out recorded at ${nowTimeString}`
    };

    setKioskResult(resultData);
    setKioskStatus('SUCCESS');

    // Start 4-second auto-reset countdown
    setResetCountdown(4);

    return resultData;
  };

  return {
    kioskStatus,
    kioskResult,
    failedAttempts,
    lockoutTimeLeft,
    resetCountdown,
    processKioskPunch,
    resetKiosk,
    attendanceEvents
  };
}
