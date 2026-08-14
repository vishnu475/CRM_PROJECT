import { useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  calculateDailyAttendance,
  calculateMonthlyAttendanceSummary
} from '../utils/attendanceCalculator';
import { AttendanceSummaryMetrics, DetailedAttendanceRecord } from '../types';

export function useAttendance() {
  const {
    employees,
    attendanceRecords,
    shifts,
    regularizationRequests,
    leaveRequests,
    checkIn,
    checkOut,
    submitRegularization,
    approveRegularization,
    rejectRegularization,
    saveShiftMaster,
    toggleShiftStatus
  } = useApp();

  /**
   * Returns daily calculated attendance records dynamically for a selected date
   */
  const getDailyAttendanceRecords = (selectedDate: string): DetailedAttendanceRecord[] => {
    return calculateDailyAttendance(
      employees,
      shifts,
      attendanceRecords,
      leaveRequests,
      undefined,
      selectedDate
    );
  };

  /**
   * Returns calculated KPI metrics for a selected date
   */
  const getSummaryMetrics = (selectedDate: string): AttendanceSummaryMetrics => {
    const dailyRecords = getDailyAttendanceRecords(selectedDate);
    const activeEmps = employees.filter(e => e.status !== 'Exited');

    const presentCount = dailyRecords.filter(
      r => r.status === 'Present' || r.status === 'Late In' || r.status === 'Early Out' || r.status === 'PRESENT' || r.status === 'LATE_IN' || r.status === 'EARLY_OUT'
    ).length;

    const lateInCount = dailyRecords.filter(r => r.isLateIn || r.status === 'Late In' || r.status === 'LATE_IN').length;
    const earlyOutCount = dailyRecords.filter(r => r.isEarlyOut || r.status === 'Early Out' || r.status === 'EARLY_OUT').length;
    const absentCount = dailyRecords.filter(r => r.status === 'Absent' || r.status === 'ABSENT').length;
    const onLeaveCount = dailyRecords.filter(r => r.status === 'On Leave' || r.status === 'Half Day' || r.status === 'ON_LEAVE' || r.status === 'HALF_DAY').length;
    const holidayCount = dailyRecords.filter(r => r.status === 'Holiday' || r.status === 'HOLIDAY').length;
    const weeklyOffCount = dailyRecords.filter(r => r.status === 'Weekly Off' || r.status === 'WEEKLY_OFF').length;

    const totalOvertimeHours = dailyRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    return {
      totalEmployees: activeEmps.length || employees.length,
      presentCount,
      lateInCount,
      earlyOutCount,
      absentCount,
      onLeaveCount,
      holidayCount,
      weeklyOffCount,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100
    };
  };

  /**
   * Returns monthly summary handoff for payroll calculation
   */
  const getMonthlyAttendanceSummary = (employeeId: string, yearMonth: string) => {
    const emp = employees.find(e => e.id === employeeId || e.empCode === employeeId);
    return calculateMonthlyAttendanceSummary(
      employeeId,
      emp ? emp.name : employeeId,
      emp ? emp.department : 'General',
      yearMonth,
      attendanceRecords,
      leaveRequests
    );
  };

  return {
    employees,
    attendanceRecords,
    shifts,
    regularizationRequests,
    leaveRequests,
    checkIn,
    checkOut,
    submitRegularization,
    approveRegularization,
    rejectRegularization,
    saveShiftMaster,
    toggleShiftStatus,
    getDailyAttendanceRecords,
    getSummaryMetrics,
    getMonthlyAttendanceSummary
  };
}
