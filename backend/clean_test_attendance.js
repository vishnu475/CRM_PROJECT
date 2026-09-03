import { pool } from './db/pool.js';
import { ESSService } from './services/essService.js';

async function testRameshAttendanceSync() {
  console.log('Testing Ramesh EMP-008 Date-Wise Attendance Resolution...');

  const rameshAtt = await ESSService.getEmployeeAttendance('EMP-008', 8, 2026);
  console.log(`Ramesh Attendance Header: Name = ${rameshAtt.header.employeeName}, ID = ${rameshAtt.header.employeeId}`);

  console.log('\nRamesh Monthly Daily Records List (Top 5 Days):');
  console.table(rameshAtt.records.slice(0, 5));

  const day24 = rameshAtt.records.find(r => r.date === '2026-08-24');
  const day23 = rameshAtt.records.find(r => r.date === '2026-08-23');

  console.log('\nVERIFICATION CHECKS:');
  console.log(`Day 24 (2026-08-24): Status = ${day24?.status}, Check In = ${day24?.check_in}`);
  console.log(`Day 23 (2026-08-23): Status = ${day23?.status}, Check In = ${day23?.check_in}`);

  await pool.end();
}

testRameshAttendanceSync().catch(console.error);
