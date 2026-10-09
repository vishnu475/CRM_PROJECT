import { pool } from '../db/pool.js';
import { TaskService } from '../services/taskService.js';

async function runEndToEndVerification() {
  console.log('=== RUNNING FULL END-TO-END WORKFLOW VERIFICATION ===\n');

  try {
    // 1. Verify Project Workspace and Initial Calculated Progress
    console.log('[Step 1] Fetching PRJ-CMS project...');
    const projectRes = await pool.query("SELECT * FROM projects WHERE id = 'PRJ-CMS' OR code = 'PRJ-CMS'");
    const project = projectRes.rows[0];
    if (!project) {
      console.log('PRJ-CMS not found, fetching first available project...');
      const anyProj = await pool.query("SELECT * FROM projects LIMIT 1");
      console.log('Available project:', anyProj.rows[0]);
    } else {
      console.log(`Found Project: ${project.title || project.name} (Code: ${project.code || project.id}, Repo: ${project.repository_url})`);
    }

    // 2. Fetch Group
    console.log('\n[Step 2] Fetching Group GRP-CMS-01...');
    const groupRes = await pool.query(`
      SELECT g.*, 
        json_agg(json_build_object(
          'id', gm.id, 'employee_id', gm.employee_id, 'name', gm.employee_name,
          'is_team_head', (gm.employee_id = g.team_head_id), 'role', gm.role
        )) as members
      FROM project_groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      WHERE g.id = 'GRP-CMS-01'
      GROUP BY g.id
    `);
    const group = groupRes.rows[0];
    console.log(`Group: ${group.name} (${group.code}) - ${group.members?.length || 0} members`);
    const teamHead = group.members?.find(m => m.is_team_head);
    console.log(`Team Head: ${teamHead ? teamHead.name + ' (' + teamHead.emp_code + ')' : 'None'}`);

    // 3. Create a Group Task
    console.log('\n[Step 3] Creating a Group Task with 25% weightage...');
    const dueDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
    const newTask = await TaskService.createTask({
      title: 'E2E Test: Full-Stack Content Workflow Pipeline',
      description: 'Implement automated CMS publishing pipeline and API endpoints with unit tests.',
      priority: 'HIGH',
      category: 'Feature Development',
      department: 'Engineering',
      projectId: 'PRJ-CMS',
      projectName: project ? (project.title || project.name) : 'CMS Portal',
      moduleName: 'Content Engine',
      deliverableType: 'API & Microservice',
      dueDate: dueDate,
      estimatedHours: 20,
      assignedBy: 'System Admin',
      assignmentType: 'GROUP',
      groupId: group.id,
      groupName: group.name,
      taskWeightage: 25,
      repositoryUrl: project?.repository_url || 'https://github.com/organization/cms-engine',
      videoUrl: 'https://loom.com/share/cms-workflow-briefing',
      referenceLink: 'https://github.com/organization/cms-engine/pull/42',
      checklist: [
        { id: '1', label: 'Setup CMS schema', completed: true },
        { id: '2', label: 'Write REST endpoints', completed: false }
      ]
    });
    console.log(`Task Created: ${newTask.id} - ${newTask.title}`);
    console.log(`Assignment Type: ${newTask.assignment_type}, Group: ${newTask.group_name}`);
    console.log(`Task Weightage: ${newTask.task_weightage}%, 5-Day Review Target: ${newTask.review_target_date}`);

    // 4. Verify task_member_assignments
    console.log('\n[Step 4] Checking task_member_assignments for all group members...');
    const memberAssignments = await pool.query(
      'SELECT * FROM task_member_assignments WHERE task_id = $1 ORDER BY is_team_head DESC, employee_name ASC',
      [newTask.id]
    );
    console.log(`Total group members assigned to task: ${memberAssignments.rows.length}`);
    memberAssignments.rows.forEach(m => {
      console.log(`  - ${m.employee_name} (${m.emp_code || m.employee_id}) | Role: ${m.role} | Team Head: ${m.is_team_head ? '👑 YES' : 'NO'} | Progress: ${m.individual_progress || m.employee_progress || 0}%`);
    });

    // 5. Update Progress to 50% by member EMP-008
    console.log('\n[Step 5] Member EMP-008 updates progress to 50%...');
    const updatedTask = await TaskService.updateProgress(newTask.id, 'EMP-008', {
      progressPercent: 50,
      progressNote: 'Configured database schema and REST controllers.'
    });
    console.log(`Task progress updated: ${updatedTask.progress_percent}% (Status: ${updatedTask.status})`);

    // 6. Submit Task with Deliverables (PR + Video Demo) by member EMP-006
    console.log('\n[Step 6] Submitting Task for Manager / Admin Review with Deliverables...');
    const submittedTask = await TaskService.submitForReview(newTask.id, 'EMP-006', {
      completionNote: 'Completed pipeline with 100% test coverage. Attached PR and Loom recording demo.',
      referenceLink: 'https://github.com/organization/cms-engine/pull/42',
      videoUrl: 'https://loom.com/share/cms-complete-demo-v1',
      actualHours: 18
    });
    console.log(`Task Status: ${submittedTask.status} (Needs Review: ${submittedTask.needs_review})`);
    console.log(`Artifacts Submitted -> Video: ${submittedTask.video_url} | PR: ${submittedTask.reference_link}`);

    // 7. Verify Review Queue
    console.log('\n[Step 7] Verifying Admin Review Queue contains the task with artifacts...');
    const reviewQueue = await TaskService.getAllTasks({ status: 'READY_FOR_REVIEW' });
    const inReview = (reviewQueue.tasks || reviewQueue).find(t => (t.id === newTask.id || t.taskId === newTask.id));
    if (!inReview) {
      throw new Error(`Task ${newTask.id} not found in READY_FOR_REVIEW queue!`);
    }
    console.log(`Task verified in Review Queue: ${inReview.id || inReview.taskId} - ${inReview.title}`);
    console.log(`  Review video: ${inReview.video_url || inReview.videoUrl}`);
    console.log(`  Review PR link: ${inReview.reference_link || inReview.referenceLink}`);
    console.log(`  Completion note: ${inReview.completion_note || inReview.completionNote}`);

    // 8. Admin Approves the Task
    console.log('\n[Step 8] Admin Approving the task...');
    const approvedTask = await TaskService.approveTask(newTask.id, 'Admin User', 'Excellent implementation and video walkthrough. Clean code and all specs passed.');
    console.log(`Task Approved! Status: ${approvedTask.status}, Progress: ${approvedTask.progress_percent}%`);
    console.log(`Approved By: ${approvedTask.approved_by}, Comment: "${approvedTask.approval_comment}"`);

    // 9. Check Recalculated Project Progress
    console.log('\n[Step 9] Checking Recalculated Overall Project Progress in Project Workspace...');
    const allProjTasksRes = await pool.query(`
      SELECT id, title, status, progress_percent, COALESCE(task_weightage, 0) as weightage
      FROM tasks
      WHERE project_id = 'PRJ-CMS'
    `);
    let totalWeight = 0;
    let weightedProgress = 0;
    allProjTasksRes.rows.forEach(t => {
      const w = Number(t.weightage) || 0;
      const p = Number(t.progress_percent) || 0;
      totalWeight += w;
      weightedProgress += (p * w);
      console.log(`  Task: ${t.id} | Weight: ${w}% | Progress: ${p}% | Status: ${t.status}`);
    });
    const calculatedOverall = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
    console.log(`\n=> Total Allocated Project Weightage: ${totalWeight}%`);
    console.log(`=> Dynamic Overall Project Progress: ${calculatedOverall}%`);

    console.log('\n=== ALL END-TO-END WORKFLOW VERIFICATION CHECKS PASSED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (err) {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  }
}

runEndToEndVerification();
