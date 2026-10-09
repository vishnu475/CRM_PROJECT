import { TaskService } from '../services/taskService.js';
import { hrmsPool } from '../db/pool.js';

async function seedFreshTasks() {
  try {
    console.log('--- Seeding Fresh Standard Tasks ---');

    const testTasks = [
      {
        id: 'TASK-001',
        title: 'Design System 2026 Component Token Overhaul',
        description: 'Migrate UI design tokens and components to 2026 enterprise design specs.',
        projectId: 'PROJECT-001',
        projectName: 'HRMS Cloud Migration',
        assignedTo: 'EMP-014',
        priority: 'HIGH',
        dueDate: '2026-09-20',
        estimatedHours: 12
      },
      {
        id: 'TASK-002',
        title: 'Statutory Compliances & ESI / PF Calculation Engine',
        description: 'Automate salary calculation engine with the latest 2026 tax brackets.',
        projectId: 'PROJECT-002',
        projectName: 'Payroll Automation',
        assignedTo: 'EMP-015',
        priority: 'MEDIUM',
        dueDate: '2026-09-25',
        estimatedHours: 16
      },
      {
        id: 'TASK-003',
        title: 'Audit Logging & Security Alert Streaming Gateway',
        description: 'Stream real-time audit ledger logs and configure high-severity threshold triggers.',
        projectId: 'PROJECT-003',
        projectName: 'Banking & Financial Ledger',
        assignedTo: 'EMP-016',
        priority: 'URGENT',
        dueDate: '2026-09-18',
        estimatedHours: 20
      },
      {
        id: 'TASK-004',
        title: 'Multi-Currency Reconciliation & Ledger Balancing',
        description: 'Reconcile multi-currency entries with real-time forex rates against master ledger.',
        projectId: 'PROJECT-003',
        projectName: 'Banking & Financial Ledger',
        assignedTo: 'EMP-017',
        priority: 'HIGH',
        dueDate: '2026-09-22',
        estimatedHours: 10
      },
      {
        id: 'TASK-005',
        title: 'Sales Pipeline Forecasting & Deal Progression AI',
        description: 'Integrate CRM lead scoring models for revenue pipeline predictions.',
        projectId: 'PROJECT-004',
        projectName: 'CRM Revenue Expansion',
        assignedTo: 'EMP-012',
        priority: 'MEDIUM',
        dueDate: '2026-09-30',
        estimatedHours: 14
      }
    ];

    for (const t of testTasks) {
      const created = await TaskService.createTask(t, { name: 'Admin', id: 'ADM-001', role: 'Admin' });
      console.log(`Created: ${created.id} -> Project: ${created.project_name} -> Assigned to: ${created.assigned_to_name} (${created.assigned_to})`);
    }

    // Now verify query with joins
    console.log('\n--- Verifying SQL Join Results from TaskService.getAllTasks() ---');
    const allTasks = await TaskService.getAllTasks({});
    console.log(`Total tasks retrieved: ${allTasks.length}`);
    for (const t of allTasks) {
      console.log(`[${t.taskId || t.id}] ${t.projectName} | Employee: ${t.employeeId} - ${t.employeeName} | Priority: ${t.priority} | Status: ${t.status}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding tasks:', err);
    process.exit(1);
  }
}

seedFreshTasks();
