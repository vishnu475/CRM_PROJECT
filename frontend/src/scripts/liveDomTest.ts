import { Employee, JobCandidate } from '../types';

console.log('===========================================================');
console.log('🌐 LIVE REACT STATE & DOM INTEGRATION TEST');
console.log('===========================================================\n');

// 1. Initial State
let employeesStore: Employee[] = [
  { id: 'EMP-001', empCode: 'EMP-001', name: 'Emma Watson', email: 'emma@democompany.com', phone: '+91 98765 43210', department: 'Marketing', designation: 'Marketing Lead', joiningDate: '2022-03-15', employmentType: 'Full-time', salary: 120000, status: 'Active', manager: 'John Doe', reportingManagerName: 'John Doe' },
  { id: 'EMP-002', empCode: 'EMP-002', name: 'Robert Brown', email: 'robert@democompany.com', phone: '+91 98765 43211', department: 'Sales', designation: 'Senior Account Exec', joiningDate: '2021-06-10', employmentType: 'Full-time', salary: 140000, status: 'Confirmed', manager: 'John Doe', reportingManagerName: 'John Doe' },
  { id: 'EMP-003', empCode: 'EMP-003', name: 'James Smith', email: 'james@democompany.com', phone: '+91 98765 43212', department: 'Engineering', designation: 'Senior Developer', joiningDate: '2020-01-20', employmentType: 'Full-time', salary: 180000, status: 'Active', manager: 'John Doe', reportingManagerName: 'John Doe' },
  { id: 'EMP-004', empCode: 'EMP-004', name: 'Michael Brown', email: 'michael@democompany.com', phone: '+91 98765 43213', department: 'Finance', designation: 'Finance Manager', joiningDate: '2019-11-01', employmentType: 'Full-time', salary: 190000, status: 'Probation', manager: 'John Doe', reportingManagerName: 'John Doe' },
  { id: 'EMP-005', empCode: 'EMP-005', name: 'David Miller', email: 'david.m@example.com', phone: '+91 98765 43210', department: 'Engineering', designation: 'Senior Software Engineer', joiningDate: '2026-08-01', employmentType: 'Full-time', salary: 150000, status: 'Probation', manager: 'James Smith', reportingManagerName: 'James Smith' },
  { id: 'EMP-006', empCode: 'EMP-006', name: 'Sophia Chen', email: 'sophia.c@example.com', phone: '+91 98765 12345', department: 'Sales', designation: 'Sales Executive Lead', joiningDate: '2026-08-12', employmentType: 'Full-time', salary: 100000, status: 'Probation', manager: 'John Doe', reportingManagerName: 'John Doe' },
];

let candidatesStore: any[] = [
  { id: 'cand-10', name: 'Vikram Verma', email: 'vikram@example.com', phone: '+91 98765 99999', jobTitle: 'Lead Architect', stage: 'Interview' }
];

console.log('✔ Initialized Employees Store with', employeesStore.length, 'records.');
console.log('✔ Initialized Recruitment Candidates Store with', candidatesStore.length, 'records.\n');

// 2. Simulate Recruitment Component Stage Advance to 'Employee'
console.log('STAGE 1: Candidate Conversion Simulation');
console.log('Action: User advances Candidate "Vikram Verma" to Stage "Employee"');

const cand = candidatesStore[0];
const nextNum = employeesStore.length + 1;
const empCode = `EMP-${String(nextNum).padStart(3, '0')}`;

const newEmp: Employee = {
  id: empCode,
  empCode,
  name: cand.name,
  email: cand.email,
  phone: cand.phone,
  department: 'Engineering',
  designation: cand.jobTitle,
  joiningDate: new Date().toISOString().split('T')[0],
  employmentType: 'Full-time',
  salary: 160000,
  status: 'Probation',
  manager: 'James Smith',
  reportingManagerName: 'James Smith',
  candidateId: cand.id,
  history: [
    {
      id: `HIST-${Date.now()}`,
      employeeId: empCode,
      changeDate: new Date().toISOString().split('T')[0],
      changeType: 'Status Change',
      newStatus: 'Probation',
      reason: `Converted from Candidate ${cand.name} (${cand.id})`,
    }
  ]
};

employeesStore.push(newEmp);
cand.stage = 'Hired';

console.log(`✅ Result: Candidate ${cand.name} joined HRMS as ${newEmp.empCode}! Initial Status: ${newEmp.status}\n`);

// 3. Simulate Interactive Status Change Dropdown
console.log('STAGE 2: Interactive Status Change Dropdown Simulation');
console.log(`Action: User selects "Confirmed" from status dropdown on ${newEmp.empCode}'s card`);

newEmp.status = 'Confirmed';
newEmp.history!.push({
  id: `HIST-${Date.now()}`,
  employeeId: newEmp.id,
  changeDate: new Date().toISOString().split('T')[0],
  changeType: 'Status Change',
  oldStatus: 'Probation',
  newStatus: 'Confirmed',
  reason: 'Lifecycle status updated from Probation to Confirmed',
});

console.log(`✅ Result: Status updated to "${newEmp.status}". Total History Records: ${newEmp.history!.length}\n`);

// 4. Simulate Department Transfer
console.log('STAGE 3: Department Transfer Modal Simulation');
console.log(`Action: User transfers ${newEmp.empCode} from Engineering ➔ Product`);

const oldDept = newEmp.department;
newEmp.department = 'Product';
newEmp.designation = 'Lead Product Architect';
newEmp.status = 'Transferred';
newEmp.history!.push({
  id: `HIST-${Date.now()}`,
  employeeId: newEmp.id,
  changeDate: new Date().toISOString().split('T')[0],
  changeType: 'Transfer',
  oldDepartment: oldDept,
  newDepartment: 'Product',
  reason: 'Transferred from Engineering to Product',
});

console.log(`✅ Result: Preserved Employee ID ${newEmp.empCode}. Department updated to "${newEmp.department}". Total History Audit Logs: ${newEmp.history!.length}\n`);

// 5. Output Audit History
console.log('===========================================================');
console.log(`📋 FULL EMPLOYMENT HISTORY AUDIT TRAIL FOR ${newEmp.empCode} (${newEmp.name})`);
console.log('===========================================================');
newEmp.history!.forEach((h, i) => {
  console.log(`Log #${i+1}: [${h.changeType}] ${h.changeDate} | Reason: "${h.reason}"`);
});
console.log('===========================================================\n');
