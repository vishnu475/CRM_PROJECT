import { TaskService } from '../services/taskService.js';

async function testMyTasksIsolation() {
  console.log('--- Testing Employee Isolation ---');
  const emp14Tasks = await TaskService.getAllTasks({ employeeId: 'EMP-014' });
  console.log(`EMP-014 tasks count: ${emp14Tasks.length}`);
  emp14Tasks.forEach(t => console.log(`  EMP-014 has: ${t.taskId || t.id} - ${t.projectName} (${t.employeeId} - ${t.employeeName})`));

  const emp15Tasks = await TaskService.getAllTasks({ employeeId: 'EMP-015' });
  console.log(`EMP-015 tasks count: ${emp15Tasks.length}`);
  emp15Tasks.forEach(t => console.log(`  EMP-015 has: ${t.taskId || t.id} - ${t.projectName} (${t.employeeId} - ${t.employeeName})`));

  const emp14HasEmp15Tasks = emp14Tasks.some(t => t.employeeId === 'EMP-015');
  const emp15HasEmp14Tasks = emp15Tasks.some(t => t.employeeId === 'EMP-014');

  if (!emp14HasEmp15Tasks && !emp15HasEmp14Tasks) {
    console.log('✅ PASS: Total isolation! EMP-014 only sees EMP-014, EMP-015 only sees EMP-015.');
    process.exit(0);
  } else {
    console.error('❌ FAIL: Data leakage between employees!');
    process.exit(1);
  }
}

testMyTasksIsolation();
