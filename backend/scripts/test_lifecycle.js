import { TaskService } from '../services/taskService.js';

async function testCompleteLifecycle() {
  console.log('--- Testing Full Review Lifecycle ---');

  // 1. EMP-014 submits TASK-001 for review
  console.log('\n[Step 1] EMP-014 submits TASK-001 for review');
  const submitted1 = await TaskService.submitForReview('TASK-001', 'EMP-014', { completionNote: 'Tokens overhauled and verified.' });
  console.log(`TASK-001 status: ${submitted1.status}`);
  if (submitted1.status !== 'READY_FOR_REVIEW') throw new Error('Expected READY_FOR_REVIEW');

  // Verify review queue
  const reviewQueue = await TaskService.getAllTasks({ status: 'READY_FOR_REVIEW' });
  console.log(`Review queue count: ${reviewQueue.length}, contains TASK-001: ${reviewQueue.some(t => t.id === 'TASK-001')}`);
  if (!reviewQueue.some(t => t.id === 'TASK-001')) throw new Error('TASK-001 not in review queue');

  // 2. Admin approves TASK-001
  console.log('\n[Step 2] Admin approves TASK-001');
  const approved1 = await TaskService.approveTask('TASK-001', { name: 'Admin', id: 'ADM-001' }, { managerFeedback: 'Looks excellent!' });
  console.log(`TASK-001 status: ${approved1.status}`);
  if (approved1.status !== 'COMPLETED') throw new Error('Expected COMPLETED');

  // Verify review queue removes it, completed queue has it, and EMP-014 my-tasks has it as COMPLETED
  const reviewQueueAfterApprove = await TaskService.getAllTasks({ status: 'READY_FOR_REVIEW' });
  const completedQueue = await TaskService.getAllTasks({ status: 'COMPLETED' });
  const emp14Tasks = await TaskService.getAllTasks({ employeeId: 'EMP-014' });

  console.log(`Review queue contains TASK-001: ${reviewQueueAfterApprove.some(t => t.id === 'TASK-001')}`);
  console.log(`Completed queue contains TASK-001: ${completedQueue.some(t => t.id === 'TASK-001')}`);
  console.log(`EMP-014 tasks contains TASK-001: ${emp14Tasks.some(t => t.id === 'TASK-001' && t.status === 'COMPLETED')}`);

  if (reviewQueueAfterApprove.some(t => t.id === 'TASK-001')) throw new Error('TASK-001 should be removed from review queue');
  if (!completedQueue.some(t => t.id === 'TASK-001')) throw new Error('TASK-001 should be in completed queue');
  if (!emp14Tasks.some(t => t.id === 'TASK-001' && t.status === 'COMPLETED')) throw new Error('TASK-001 should be COMPLETED in EMP-014 tasks');

  // 3. Admin requests changes on TASK-002
  console.log('\n[Step 3] Admin requests changes on TASK-002');
  const changed2 = await TaskService.reopenTask('TASK-002', { name: 'Admin', id: 'ADM-001' }, { managerFeedback: 'Fix PF calculation precision to 2 decimals' });
  console.log(`TASK-002 status: ${changed2.status}`);
  if (changed2.status !== 'CHANGES_REQUESTED') throw new Error('Expected CHANGES_REQUESTED');

  const emp15Tasks = await TaskService.getAllTasks({ employeeId: 'EMP-015' });
  console.log(`EMP-015 sees TASK-002 status: ${emp15Tasks.find(t => t.id === 'TASK-002')?.status}`);
  if (emp15Tasks.find(t => t.id === 'TASK-002')?.status !== 'CHANGES_REQUESTED') throw new Error('EMP-015 should see CHANGES_REQUESTED');

  // 4. EMP-015 fixes and resubmits TASK-002
  console.log('\n[Step 4] EMP-015 fixes and resubmits TASK-002');
  const resubmitted2 = await TaskService.submitForReview('TASK-002', 'EMP-015', { completionNote: 'Fixed PF precision to 2 decimals.' });
  console.log(`TASK-002 status: ${resubmitted2.status}`);
  if (resubmitted2.status !== 'READY_FOR_REVIEW') throw new Error('Expected READY_FOR_REVIEW on resubmit');

  const reviewQueueAfterResubmit = await TaskService.getAllTasks({ status: 'READY_FOR_REVIEW' });
  console.log(`Review queue contains TASK-002: ${reviewQueueAfterResubmit.some(t => t.id === 'TASK-002')}`);
  if (!reviewQueueAfterResubmit.some(t => t.id === 'TASK-002')) throw new Error('TASK-002 should be back in review queue');

  console.log('\n✅ ALL 5 LIFECYCLE TESTS PASSED 100% ON DATABASE AND SERVICE LAYER!');
  process.exit(0);
}

testCompleteLifecycle().catch(e => {
  console.error(e);
  process.exit(1);
});
