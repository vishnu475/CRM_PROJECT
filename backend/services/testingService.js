import { hrmsPool as pool } from '../db/pool.js';
import { broadcastNotificationEvent } from '../utils/websocket.js';

export class TestingService {
  /**
   * Helper: Resolve Employee safely
   */
  static async resolveEmployee(employeeId) {
    if (!employeeId) return null;
    const searchId = String(employeeId).trim();
    const res = await pool.query(
      `SELECT emp_code, id, name, department, designation 
       FROM employees 
       WHERE emp_code = $1 OR id = $1 OR LOWER(name) = LOWER($1) 
       LIMIT 1`,
      [searchId]
    );
    return res.rows[0] || null;
  }

  /**
   * Helper: Resolve Module safely
   */
  static async resolveModule(moduleIdOrName) {
    if (!moduleIdOrName) return null;
    const search = String(moduleIdOrName).trim();
    // 1. Direct match on id, code, or name
    let res = await pool.query(
      `SELECT id, code, name, category, status 
       FROM modules 
       WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($1) 
       LIMIT 1`,
      [search]
    );
    if (res.rows[0]) return res.rows[0];

    // 2. Normalized match (stripping 'MOD-', hyphens, underscores)
    const normalized = search.toUpperCase().replace(/^MOD[-_]+/i, '').replace(/[-_]/g, '');
    res = await pool.query(
      `SELECT id, code, name, category, status 
       FROM modules 
       WHERE UPPER(REPLACE(REPLACE(REPLACE(id, 'MOD-', ''), '-', ''), '_', '')) = $1
          OR UPPER(REPLACE(REPLACE(REPLACE(code, 'MOD-', ''), '-', ''), '_', '')) = $1
          OR UPPER(REPLACE(REPLACE(name, '-', ''), '_', '')) = $1
          OR UPPER(REPLACE(REPLACE(id, '-', ''), '_', '')) LIKE '%' || $1 || '%'
          OR UPPER(REPLACE(REPLACE(name, '-', ''), '_', '')) LIKE '%' || $1 || '%'
       LIMIT 1`,
      [normalized]
    );
    return res.rows[0] || null;
  }

  /**
   * Helper: Insert Audit Log
   */
  static async logAudit({ entityType, entityId, moduleId, moduleName, user, action, oldStatus = null, newStatus = null, comment = '', metadata = {} }) {
    const logId = `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const userId = user?.empCode || user?.id || 'SYSTEM';
    const userName = user?.name || 'System User';
    const userRole = user?.role || 'System';

    await pool.query(
      `INSERT INTO testing_audit_logs (
        id, entity_type, entity_id, module_id, module_name,
        user_id, user_name, user_role, action, old_status, new_status, comment, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)`,
      [logId, entityType, entityId, moduleId, moduleName, userId, userName, userRole, action, oldStatus, newStatus, comment, JSON.stringify(metadata)]
    );
    return logId;
  }

  /**
   * Helper: Send Notification to Developer, Tester, or Admin
   */
  static async sendNotification({ type, moduleId, moduleName, entityId, recipientId, recipientName, recipientRole, title, message }) {
    const notifId = `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    await pool.query(
      `INSERT INTO qa_notifications (
        id, type, module_id, module_name, entity_id,
        recipient_id, recipient_name, recipient_role, title, message, read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, CURRENT_TIMESTAMP)`,
      [notifId, type, moduleId, moduleName, entityId, recipientId, recipientName, recipientRole, title, message]
    );

    // Also populate admin_notifications for unified admin notification bell
    if (recipientRole === 'Admin' || recipientRole === 'HRManager' || recipientId === 'ADMIN') {
      const adminNotifId = `AN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await pool.query(
        `INSERT INTO admin_notifications (
          id, type, employee_id, employee_name, entity_id, message, priority, target_role, read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'High', 'HRManager', FALSE, CURRENT_TIMESTAMP)`,
        [adminNotifId, type, recipientId || 'ADMIN', recipientName || 'System', entityId, message]
      );
    }

    // Broadcast via WebSocket
    broadcastNotificationEvent({
      id: notifId,
      type,
      moduleId,
      moduleName,
      title,
      message,
      recipientId,
      recipientRole,
      createdAt: new Date().toISOString()
    });

    return notifId;
  }

  /**
   * 1. AUTOMATIC 70% TASK COMPLETION TRIGGER
   * Recalculates module completion percentage for an employee/module.
   * When completion >= 70%, promotes module status to READY_FOR_TESTING and creates testing_request.
  /**
   * Helper: Send Milestone Notification to Developer, Tester, and Admin
   */
  static async sendMilestoneNotifications({ mod, devCode, devName, prjName, targetPhase, targetPhaseName, completionPercentage, reqId }) {
    const formattedPercent = Math.round(completionPercentage);
    const notifMsg = `Module "${mod.name}" assigned to ${devName} reached ${formattedPercent}% progress and is queued for ${targetPhaseName} (${prjName || 'Project'}).`;

    // 1. Notify Admin / QA Manager
    await this.sendNotification({
      type: `MODULE_TESTING_PHASE_${targetPhase}`,
      moduleId: mod.id,
      moduleName: mod.name,
      entityId: reqId,
      recipientId: 'ADMIN',
      recipientName: 'Admin / QA Manager',
      recipientRole: 'Admin',
      title: `${targetPhaseName}: ${mod.name} (${devName})`,
      message: notifMsg
    });

    // 2. Notify QA Tester (Rahul Verma / EMP-004)
    await this.sendNotification({
      type: `TESTER_ASSIGNED_PHASE_${targetPhase}`,
      moduleId: mod.id,
      moduleName: mod.name,
      entityId: reqId,
      recipientId: 'EMP-004',
      recipientName: 'Rahul Verma',
      recipientRole: 'Tester',
      title: `QA Assignment: ${targetPhaseName} - ${mod.name}`,
      message: `Action Required: Please test and verify ${mod.name} developed by ${devName}. Status: ${targetPhaseName} (${formattedPercent}% milestone).`
    });

    // 3. Notify Developer
    await this.sendNotification({
      type: `MODULE_ENTERED_PHASE_${targetPhase}`,
      moduleId: mod.id,
      moduleName: mod.name,
      entityId: reqId,
      recipientId: devCode,
      recipientName: devName,
      recipientRole: 'Developer',
      title: `Promoted to ${targetPhaseName}`,
      message: `Great progress! Your module "${mod.name}" reached ${formattedPercent}% and has advanced to ${targetPhaseName}. Assigned QA tester: Rahul Verma.`
    });

    console.log(`🚀 [QA Engine] ${devName} - ${mod.name} reached ${completionPercentage}% -> Promoted to ${targetPhaseName}!`);
  }

  /**
   * 1. AUTOMATIC DYNAMIC TESTING MILESTONE PROMOTION ALGORITHM
   * Milestone 1 (80% <= progress < 90%): Promotes to Phase 1 (Alpha Testing - 80%).
   * Milestone 2 (90% <= progress < 100%): Promotes to Phase 2 (Beta Testing - 90%) with Developer Name & Module Name.
   * Milestone 3 (progress >= 100%): Promotes to Phase 3 (Final Gate / Production UAT - 100%).
   * State is dynamically persisted in PostgreSQL.
   */
  static async checkAndTriggerModuleTesting(moduleNameOrId, employeeIdOrAssignee, explicitProgress = null) {
    try {
      if (!moduleNameOrId) return null;

      const mod = await this.resolveModule(moduleNameOrId);
      if (!mod) return null;

      // Identify developer
      let dev = null;
      if (employeeIdOrAssignee) {
        dev = await this.resolveEmployee(employeeIdOrAssignee);
      }

      // If developer not passed or not found, try to locate from existing assigned module or task
      if (!dev) {
        const empModRes = await pool.query(
          `SELECT employee_id FROM employee_assigned_modules WHERE module_id = $1 LIMIT 1`,
          [mod.id]
        );
        if (empModRes.rows.length > 0) {
          dev = await this.resolveEmployee(empModRes.rows[0].employee_id);
        }
      }

      const devCode = dev?.emp_code || dev?.id || 'EMP-005';
      const devName = dev?.name || 'Vishnu Vardhan';

      // Query tasks for this module (and employee if specified)
      const tasksRes = await pool.query(
        `SELECT 
           COUNT(*) as total_tasks,
           COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED' OR COALESCE(progress_percent, 0) >= 100) as completed_tasks,
           ROUND(COALESCE(AVG(COALESCE(progress_percent, 0)), 0), 2) as avg_progress,
           MAX(project_id) as project_id,
           MAX(project_name) as project_name
         FROM tasks 
         WHERE (LOWER(module_name) = LOWER($1) OR module_id = $2 OR module_name ILIKE $3)
           AND (assigned_to = $4 OR assigned_to_employee_id = $4 OR employee_id = $4 OR $4 IS NULL)`,
        [mod.name, mod.id, `%${mod.name}%`, devCode]
      );

      let totalTasks = parseInt(tasksRes.rows[0]?.total_tasks, 10) || 0;
      let completedTasks = parseInt(tasksRes.rows[0]?.completed_tasks, 10) || 0;
      let avgProgress = parseFloat(tasksRes.rows[0]?.avg_progress) || 0;
      let prjId = tasksRes.rows[0]?.project_id || null;
      let prjName = tasksRes.rows[0]?.project_name || null;

      // If no tasks found scoped to dev, query all module tasks
      if (totalTasks === 0) {
        const allTasksRes = await pool.query(
          `SELECT 
             COUNT(*) as total_tasks,
             COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED' OR COALESCE(progress_percent, 0) >= 100) as completed_tasks,
             ROUND(COALESCE(AVG(COALESCE(progress_percent, 0)), 0), 2) as avg_progress,
             MAX(project_id) as project_id,
             MAX(project_name) as project_name
           FROM tasks 
           WHERE LOWER(module_name) = LOWER($1) OR module_id = $2 OR module_name ILIKE $3`,
          [mod.name, mod.id, `%${mod.name}%`]
        );
        totalTasks = parseInt(allTasksRes.rows[0]?.total_tasks, 10) || 0;
        completedTasks = parseInt(allTasksRes.rows[0]?.completed_tasks, 10) || 0;
        avgProgress = parseFloat(allTasksRes.rows[0]?.avg_progress) || 0;
        prjId = allTasksRes.rows[0]?.project_id || prjId;
        prjName = allTasksRes.rows[0]?.project_name || prjName;
      }

      // If project info not yet found, check project_allocations
      if (!prjId) {
        const allocRes = await pool.query(
          `SELECT project_id, project_name FROM project_allocations 
           WHERE employee_id = $1 AND (module_id = $2 OR LOWER(module_name) = LOWER($3)) LIMIT 1`,
          [devCode, mod.id, mod.name]
        );
        if (allocRes.rows.length > 0) {
          prjId = allocRes.rows[0].project_id;
          prjName = allocRes.rows[0].project_name;
        }
      }

      // Determine true completion percentage
      let completionPercentage = avgProgress;
      if (explicitProgress !== null && explicitProgress !== undefined) {
        const expVal = parseFloat(explicitProgress);
        if (!isNaN(expVal)) {
          completionPercentage = expVal;
        }
      }

      const pendingTasks = Math.max(0, totalTasks - completedTasks);

      // Determine Milestone Target Phase:
      // Milestone 1 (80% <= progress < 90%): Phase 1 (Alpha - 80%)
      // Milestone 2 (90% <= progress < 100%): Phase 2 (Beta - 90%)
      // Milestone 3 (progress >= 100%): Phase 3 (Final Gate / Production UAT - 100%)
      let targetPhase = 0;
      let targetPhaseName = '';
      if (completionPercentage >= 100) {
        targetPhase = 3;
        targetPhaseName = 'Phase 3 - Final Gate (100%)';
      } else if (completionPercentage >= 90) {
        targetPhase = 2;
        targetPhaseName = 'Phase 2 - Beta Testing (90%)';
      } else if (completionPercentage >= 80) {
        targetPhase = 1;
        targetPhaseName = 'Phase 1 - Alpha Testing (80%)';
      }

      // Query existing testing request for this module and developer
      const reqRes = await pool.query(
        `SELECT * FROM testing_requests 
         WHERE (module_id = $1 OR LOWER(module_name) = LOWER($2))
           AND (developer_employee_id = $3 OR LOWER(developer_employee_name) = LOWER($4))
         ORDER BY created_at DESC LIMIT 1`,
        [mod.id, mod.name, devCode, devName]
      );

      let testingReq = reqRes.rows[0] || null;

      if (targetPhase > 0) {
        if (!testingReq) {
          // CREATE NEW TESTING REQUEST FOR CURRENT MILESTONE PHASE
          const reqId = `TR-${prjId || 'PRJ'}-${(mod.code || 'MOD').toUpperCase()}-P${targetPhase}-${devCode}`;
          const insertRes = await pool.query(
            `INSERT INTO testing_requests (
              id, module_id, module_name, developer_employee_id, developer_employee_name,
              tester_employee_id, tester_employee_name,
              project_id, project_name,
              total_tasks, completed_tasks, pending_tasks, completion_percentage,
              testing_phase, phase_name, phase_status,
              status, submitted_date, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5,
              'EMP-004', 'Rahul Verma',
              $6, $7,
              $8, $9, $10, $11,
              $12, $13, 'PENDING',
              'READY_FOR_TESTING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING *`,
            [
              reqId, mod.id, mod.name, devCode, devName,
              prjId, prjName,
              totalTasks, completedTasks, pendingTasks, completionPercentage,
              targetPhase, targetPhaseName
            ]
          );
          testingReq = insertRes.rows[0];

          // Update module master status
          await pool.query(
            `UPDATE modules SET status = 'READY_FOR_TESTING', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [mod.id]
          );

          // Audit Log
          await this.logAudit({
            entityType: 'MODULE',
            entityId: mod.id,
            moduleId: mod.id,
            moduleName: mod.name,
            user: { empCode: devCode, name: devName, role: 'Developer' },
            action: `Module promoted to ${targetPhaseName} (${completionPercentage}% completed)`,
            oldStatus: 'IN_PROGRESS',
            newStatus: 'READY_FOR_TESTING',
            comment: `Developer ${devName} reached ${completionPercentage}% completion on ${mod.name}. Automatically entered ${targetPhaseName}.`,
            metadata: { totalTasks, completedTasks, completionPercentage, targetPhase, targetPhaseName }
          });

          // Send Milestone Notifications
          await this.sendMilestoneNotifications({
            mod, devCode, devName, prjName, targetPhase, targetPhaseName, completionPercentage, reqId
          });
        } else {
          // EXISTING TESTING REQUEST EXISTS
          const currentPhase = testingReq.testing_phase || 1;
          const currentStatus = testingReq.status;

          // Check if promoting to higher phase (e.g., from Phase 1 to Phase 2, or Phase 2 to Phase 3)
          if (targetPhase > currentPhase) {
            const updateRes = await pool.query(
              `UPDATE testing_requests 
               SET testing_phase = $1,
                   phase_name = $2,
                   phase_status = 'PENDING',
                   status = 'READY_FOR_TESTING',
                   completion_percentage = $3,
                   total_tasks = $4,
                   completed_tasks = $5,
                   pending_tasks = $6,
                   project_id = COALESCE(project_id, $7),
                   project_name = COALESCE(project_name, $8),
                   notes = $9,
                   submitted_date = CURRENT_TIMESTAMP,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $10
               RETURNING *`,
              [
                targetPhase, targetPhaseName, completionPercentage,
                totalTasks, completedTasks, pendingTasks,
                prjId, prjName,
                `Milestone ${completionPercentage}% reached. Promoted to ${targetPhaseName} for ${devName} on ${mod.name}.`,
                testingReq.id
              ]
            );
            testingReq = updateRes.rows[0];

            await pool.query(
              `UPDATE modules SET status = 'READY_FOR_TESTING', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
              [mod.id]
            );

            await this.logAudit({
              entityType: 'MODULE',
              entityId: mod.id,
              moduleId: mod.id,
              moduleName: mod.name,
              user: { empCode: devCode, name: devName, role: 'Developer' },
              action: `Promoted to ${targetPhaseName}`,
              oldStatus: currentStatus,
              newStatus: 'READY_FOR_TESTING',
              comment: `Progress reached ${completionPercentage}%. Advanced to ${targetPhaseName}.`,
              metadata: { totalTasks, completedTasks, completionPercentage, targetPhase, targetPhaseName }
            });

            await this.sendMilestoneNotifications({
              mod, devCode, devName, prjName, targetPhase, targetPhaseName, completionPercentage, reqId: testingReq.id
            });
          } else {
            // SAME PHASE: Update progress numbers; if NOT_READY, FAILED or tested and progress updated, queue again
            let nextStatus = currentStatus;
            if (nextStatus === 'NOT_READY' || nextStatus === 'FAILED' || nextStatus === 'TESTING_FAILED') {
              nextStatus = 'READY_FOR_TESTING';
              await pool.query(
                `UPDATE modules SET status = 'READY_FOR_TESTING', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [mod.id]
              );
            }

            const updateRes = await pool.query(
              `UPDATE testing_requests 
               SET total_tasks = $1,
                   completed_tasks = $2,
                   pending_tasks = $3,
                   completion_percentage = $4,
                   status = $5,
                   project_id = COALESCE(project_id, $6),
                   project_name = COALESCE(project_name, $7),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $8
               RETURNING *`,
              [totalTasks, completedTasks, pendingTasks, completionPercentage, nextStatus, prjId, prjName, testingReq.id]
            );
            testingReq = updateRes.rows[0];
          }
        }
      } else {
        // Under 80%: Update task counts and progress
        if (testingReq) {
          await pool.query(
            `UPDATE testing_requests 
             SET total_tasks = $1,
                 completed_tasks = $2,
                 pending_tasks = $3,
                 completion_percentage = $4,
                 project_id = COALESCE(project_id, $5),
                 project_name = COALESCE(project_name, $6),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7`,
            [totalTasks, completedTasks, pendingTasks, completionPercentage, prjId, prjName, testingReq.id]
          );
        }
      }

      return testingReq;
    } catch (err) {
      console.error('Error in checkAndTriggerModuleTesting:', err);
      return null;
    }
  }

  /**
   * 2. GET MODULES OVERVIEW (All modules with task completion, testing status, bug counts)
   */
  static async getModulesOverview() {
    const query = `
      SELECT 
        m.id as module_id,
        m.name as module_name,
        m.code as module_code,
        m.category,
        COALESCE(tr.developer_employee_id, eam.employee_id, 'EMP-005') as developer_employee_id,
        COALESCE(tr.developer_employee_name, e.name, 'Vishnu Vardhan') as developer_employee_name,
        COALESCE(tr.tester_employee_id, 'EMP-004') as tester_employee_id,
        COALESCE(tr.tester_employee_name, 'Rahul Verma') as tester_employee_name,
        COALESCE(tr.total_tasks, task_counts.total, 0) as total_tasks,
        COALESCE(tr.completed_tasks, task_counts.completed, 0) as completed_tasks,
        COALESCE(tr.pending_tasks, (COALESCE(tr.total_tasks, task_counts.total, 0) - COALESCE(tr.completed_tasks, task_counts.completed, 0)), 0) as pending_tasks,
        COALESCE(tr.completion_percentage, task_counts.percent, 0.00) as completion_percentage,
        COALESCE(tr.status, CASE WHEN COALESCE(tr.completion_percentage, task_counts.percent, 0) >= 70 THEN 'READY_FOR_TESTING' ELSE 'NOT_READY' END) as testing_status,
        tr.id as testing_request_id,
        tr.submitted_date,
        tr.last_tested_date,
        COALESCE(bug_counts.total_bugs, 0) as bugs_found,
        COALESCE(bug_counts.critical_bugs, 0) as critical_bugs,
        COALESCE(bug_counts.high_bugs, 0) as high_bugs,
        COALESCE(bug_counts.medium_bugs, 0) as medium_bugs,
        COALESCE(bug_counts.low_bugs, 0) as low_bugs,
        COALESCE(bug_counts.open_bugs, 0) as open_bugs,
        COALESCE(tc_counts.total_test_cases, 0) as total_test_cases,
        COALESCE(tc_counts.passed_test_cases, 0) as passed_test_cases,
        COALESCE(tc_counts.failed_test_cases, 0) as failed_test_cases
      FROM modules m
      LEFT JOIN (
        SELECT 
          COALESCE(module_id, m2.id) as mod_id,
          LOWER(t.module_name) as m_name,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE UPPER(t.status) = 'COMPLETED') as completed,
          ROUND((COUNT(*) FILTER (WHERE UPPER(t.status) = 'COMPLETED')::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 2) as percent
        FROM tasks t
        LEFT JOIN modules m2 ON LOWER(t.module_name) = LOWER(m2.name)
        GROUP BY mod_id, m_name
      ) task_counts ON (m.id = task_counts.mod_id OR LOWER(m.name) = task_counts.m_name)
      LEFT JOIN testing_requests tr ON m.id = tr.module_id
      LEFT JOIN employee_assigned_modules eam ON m.id = eam.module_id
      LEFT JOIN employees e ON eam.employee_id = e.emp_code OR eam.employee_id = e.id
      LEFT JOIN (
        SELECT 
          module_id,
          COUNT(*) as total_bugs,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'CRITICAL') as critical_bugs,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'HIGH') as high_bugs,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'MEDIUM') as medium_bugs,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'LOW') as low_bugs,
          COUNT(*) FILTER (WHERE UPPER(status) NOT IN ('CLOSED', 'WONT_FIX', 'DUPLICATE')) as open_bugs
        FROM bugs
        GROUP BY module_id
      ) bug_counts ON m.id = bug_counts.module_id
      LEFT JOIN (
        SELECT 
          module_id,
          COUNT(*) as total_test_cases,
          COUNT(*) FILTER (WHERE UPPER(status) = 'PASSED') as passed_test_cases,
          COUNT(*) FILTER (WHERE UPPER(status) = 'FAILED') as failed_test_cases
        FROM test_cases
        GROUP BY module_id
      ) tc_counts ON m.id = tc_counts.module_id
      ORDER BY completion_percentage DESC, m.name ASC
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  /**
   * 3. GET TESTING QUEUE (All modules >= 70% completion)
   */
  static async getTestingQueue() {
    const modules = await this.getModulesOverview();
    return modules.filter(m => parseFloat(m.completion_percentage) >= 70 || m.testing_request_id !== null);
  }

  /**
   * 4. ASSIGN / CHANGE TESTER
   */
  static async assignTester(requestId, { testerId, testerName }, user) {
    const reqRes = await pool.query(`SELECT * FROM testing_requests WHERE id = $1`, [requestId]);
    if (reqRes.rows.length === 0) throw new Error(`Testing request ${requestId} not found.`);
    const req = reqRes.rows[0];

    const tester = await this.resolveEmployee(testerId);
    const resolvedTesterId = tester?.emp_code || tester?.id || testerId;
    const resolvedTesterName = tester?.name || testerName || resolvedTesterId;

    const oldTester = req.tester_employee_name || 'Unassigned';
    const newStatus = req.status === 'READY_FOR_TESTING' ? 'TESTING_IN_PROGRESS' : req.status;

    const res = await pool.query(
      `UPDATE testing_requests
       SET tester_employee_id = $1,
           tester_employee_name = $2,
           status = $3,
           testing_start_date = COALESCE(testing_start_date, CURRENT_TIMESTAMP),
           last_tested_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [resolvedTesterId, resolvedTesterName, newStatus, requestId]
    );

    // Update test cases tester if previously unassigned
    await pool.query(
      `UPDATE test_cases 
       SET tester_id = $1, tester_name = $2 
       WHERE testing_request_id = $3 AND (tester_id IS NULL OR tester_id = '')`,
      [resolvedTesterId, resolvedTesterName, requestId]
    );

    // Audit log
    await this.logAudit({
      entityType: 'TESTING_REQUEST',
      entityId: requestId,
      moduleId: req.module_id,
      moduleName: req.module_name,
      user,
      action: `Assigned Tester: ${resolvedTesterName}`,
      oldStatus: req.status,
      newStatus: newStatus,
      comment: `Tester changed from ${oldTester} to ${resolvedTesterName}`
    });

    // Notify Tester
    await this.sendNotification({
      type: 'TESTER_ASSIGNED',
      moduleId: req.module_id,
      moduleName: req.module_name,
      entityId: requestId,
      recipientId: resolvedTesterId,
      recipientName: resolvedTesterName,
      recipientRole: 'Tester',
      title: `Assigned to Test Module: ${req.module_name}`,
      message: `You have been assigned as QA Tester for ${req.module_name} (${req.completion_percentage}% tasks completed).`
    });

    // Notify Developer
    await this.sendNotification({
      type: 'TESTER_ASSIGNED',
      moduleId: req.module_id,
      moduleName: req.module_name,
      entityId: requestId,
      recipientId: req.developer_employee_id,
      recipientName: req.developer_employee_name,
      recipientRole: 'Developer',
      title: `QA Tester Assigned: ${req.module_name}`,
      message: `${resolvedTesterName} has been assigned as QA Tester for your module ${req.module_name}.`
    });

    return res.rows[0];
  }

  /**
   * 5. UPDATE TESTING STATUS (with Strict Gatekeeping Rule)
   */
  static async updateTestingStatus(requestId, status, user, comments = '') {
    const validStatuses = [
      'NOT_READY', 'READY_FOR_TESTING', 'TESTING_IN_PROGRESS', 'BUGS_FOUND',
      'FIX_IN_PROGRESS', 'READY_FOR_RETEST', 'RETESTING', 'TESTING_PASSED',
      'TESTING_FAILED', 'APPROVED'
    ];
    const targetStatus = status.toUpperCase();
    if (!validStatuses.includes(targetStatus)) {
      throw new Error(`Invalid testing status: ${status}. Valid options: ${validStatuses.join(', ')}`);
    }

    const reqRes = await pool.query(`SELECT * FROM testing_requests WHERE id = $1`, [requestId]);
    if (reqRes.rows.length === 0) throw new Error(`Testing request ${requestId} not found.`);
    const req = reqRes.rows[0];

    // ============================================================
    // STRICT GATEKEEPING RULE (Requirement 8)
    // Do not allow the module to become "TESTING_PASSED" or "APPROVED"
    // while unresolved critical/high bugs remain or failed test cases exist.
    // ============================================================
    if (targetStatus === 'TESTING_PASSED' || targetStatus === 'APPROVED') {
      const bugRes = await pool.query(
        `SELECT COUNT(*) as count,
                COUNT(*) FILTER (WHERE UPPER(severity) = 'CRITICAL') as critical,
                COUNT(*) FILTER (WHERE UPPER(severity) = 'HIGH') as high
         FROM bugs 
         WHERE (testing_request_id = $1 OR module_id = $2)
           AND UPPER(status) NOT IN ('CLOSED', 'WONT_FIX', 'DUPLICATE')
           AND UPPER(severity) IN ('CRITICAL', 'HIGH')`,
        [requestId, req.module_id]
      );

      const criticalBugs = parseInt(bugRes.rows[0]?.critical, 10) || 0;
      const highBugs = parseInt(bugRes.rows[0]?.high, 10) || 0;
      const blockingBugs = criticalBugs + highBugs;

      if (blockingBugs > 0) {
        const error = new Error(
          `Cannot mark module as ${targetStatus}: ${blockingBugs} unresolved Critical/High priority bug(s) remain (${criticalBugs} Critical, ${highBugs} High). All Critical and High bugs must be fixed and retested before approval.`
        );
        error.statusCode = 400;
        throw error;
      }

      // Verify no test cases are in FAILED state
      const tcRes = await pool.query(
        `SELECT COUNT(*) as failed_count FROM test_cases 
         WHERE (testing_request_id = $1 OR module_id = $2) AND UPPER(status) = 'FAILED'`,
        [requestId, req.module_id]
      );
      const failedCases = parseInt(tcRes.rows[0]?.failed_count, 10) || 0;
      if (failedCases > 0) {
        const error = new Error(
          `Cannot mark module as ${targetStatus}: Module has ${failedCases} failed test case(s). Execute retests and ensure all required test cases pass.`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const isCompletion = targetStatus === 'TESTING_PASSED' || targetStatus === 'APPROVED';
    const isStart = targetStatus === 'TESTING_IN_PROGRESS';

    const updateRes = await pool.query(
      `UPDATE testing_requests
       SET status = $1::varchar,
           last_tested_date = CURRENT_TIMESTAMP,
           testing_start_date = CASE WHEN $2::boolean = TRUE THEN COALESCE(testing_start_date, CURRENT_TIMESTAMP) ELSE testing_start_date END,
           testing_end_date = CASE WHEN $3::boolean = TRUE THEN CURRENT_TIMESTAMP ELSE testing_end_date END,
           notes = COALESCE($4, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [targetStatus, isStart, isCompletion, comments || null, requestId]
    );

    // Sync master module status
    await pool.query(
      `UPDATE modules SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [targetStatus, req.module_id]
    );

    // Audit log
    await this.logAudit({
      entityType: 'TESTING_REQUEST',
      entityId: requestId,
      moduleId: req.module_id,
      moduleName: req.module_name,
      user,
      action: `Testing Status changed to ${targetStatus}`,
      oldStatus: req.status,
      newStatus: targetStatus,
      comment: comments || `Status transitioned from ${req.status} to ${targetStatus}`
    });

    // Notify Admin & Developer when testing passes or fails
    if (targetStatus === 'TESTING_PASSED') {
      await this.sendNotification({
        type: 'TESTING_PASSED',
        moduleId: req.module_id,
        moduleName: req.module_name,
        entityId: requestId,
        recipientId: 'ADMIN',
        recipientName: 'Admin / QA Lead',
        recipientRole: 'Admin',
        title: `Testing Passed: ${req.module_name}`,
        message: `${req.module_name} module testing completed successfully. All critical & high bugs resolved.`
      });

      await this.sendNotification({
        type: 'TESTING_PASSED',
        moduleId: req.module_id,
        moduleName: req.module_name,
        entityId: requestId,
        recipientId: req.developer_employee_id,
        recipientName: req.developer_employee_name,
        recipientRole: 'Developer',
        title: `Congratulations! ${req.module_name} Passed Testing`,
        message: `Your module ${req.module_name} has successfully passed all QA test cases.`
      });
    } else if (targetStatus === 'TESTING_FAILED') {
      await this.sendNotification({
        type: 'TESTING_FAILED',
        moduleId: req.module_id,
        moduleName: req.module_name,
        entityId: requestId,
        recipientId: req.developer_employee_id,
        recipientName: req.developer_employee_name,
        recipientRole: 'Developer',
        title: `Testing Failed: ${req.module_name}`,
        message: `${req.module_name} module testing failed. Please inspect test case failures and reported bugs.`
      });
    }

    return updateRes.rows[0];
  }

  /**
   * 6. TEST CASES: CRUD & EXECUTION
   */
  static async createTestCase(data, user) {
    const {
      moduleId, moduleName, feature, testScenario, testSteps,
      testData, expectedResult, testingRequestId
    } = data;

    if (!moduleId || !feature || !testScenario || !testSteps || !expectedResult) {
      throw new Error('Module ID, Feature, Test Scenario, Test Steps, and Expected Result are required.');
    }

    const mod = await this.resolveModule(moduleId);
    const modName = mod?.name || moduleName || 'Module';
    const modCode = (mod?.code || modName).toUpperCase().slice(0, 4);

    const tcId = `TC-${modCode}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const testerId = user?.empCode || user?.id || 'EMP-004';
    const testerName = user?.name || 'Tester';

    const res = await pool.query(
      `INSERT INTO test_cases (
        id, module_id, module_name, testing_request_id, feature, test_scenario,
        test_steps, test_data, expected_result, actual_result, status,
        tester_id, tester_name, execution_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, 'NOT_EXECUTED', $10, $11, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [tcId, mod?.id || moduleId, modName, testingRequestId || null, feature, testScenario, testSteps, testData || null, expectedResult, testerId, testerName]
    );

    await this.logAudit({
      entityType: 'TEST_CASE',
      entityId: tcId,
      moduleId: mod?.id || moduleId,
      moduleName: modName,
      user,
      action: `Created Test Case: ${feature}`,
      newStatus: 'NOT_EXECUTED',
      comment: testScenario
    });

    return res.rows[0];
  }

  static async getTestCases(moduleId) {
    const res = await pool.query(
      `SELECT * FROM test_cases 
       WHERE module_id = $1 OR LOWER(module_name) = LOWER($1)
       ORDER BY id ASC`,
      [moduleId]
    );
    return res.rows;
  }

  static async updateTestCase(id, data, user) {
    const tcRes = await pool.query(`SELECT * FROM test_cases WHERE id = $1`, [id]);
    if (tcRes.rows.length === 0) throw new Error(`Test Case ${id} not found.`);
    const tc = tcRes.rows[0];

    const { status, actualResult, testScenario, testSteps, expectedResult, feature } = data;
    const nextStatus = status ? status.toUpperCase() : tc.status;

    const res = await pool.query(
      `UPDATE test_cases 
       SET status = $1::varchar,
           actual_result = COALESCE($2, actual_result),
           test_scenario = COALESCE($3, test_scenario),
           test_steps = COALESCE($4, test_steps),
           expected_result = COALESCE($5, expected_result),
           feature = COALESCE($6, feature),
           execution_date = CASE WHEN $1::varchar IN ('PASSED', 'FAILED', 'BLOCKED') THEN CURRENT_TIMESTAMP ELSE execution_date END,
           tester_id = COALESCE($7, tester_id),
           tester_name = COALESCE($8, tester_name),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [nextStatus, actualResult, testScenario, testSteps, expectedResult, feature, user?.empCode || user?.id, user?.name, id]
    );

    // Audit log if executed
    if (nextStatus !== tc.status) {
      await this.logAudit({
        entityType: 'TEST_CASE',
        entityId: id,
        moduleId: tc.module_id,
        moduleName: tc.module_name,
        user,
        action: `Executed Test Case (${nextStatus})`,
        oldStatus: tc.status,
        newStatus: nextStatus,
        comment: actualResult || `Test case marked ${nextStatus}`
      });
    }

    return res.rows[0];
  }

  /**
   * 7. BUG MANAGEMENT: REPORT BUG, FIX BUG, RETEST BUG
   */
  static async createBug(data, user) {
    const {
      moduleId, moduleName, testingRequestId, testCaseId, feature, relatedTaskId,
      developerEmployeeId, developerEmployeeName, title, description,
      stepsToReproduce, expectedResult, actualResult,
      severity = 'MEDIUM', priority = 'MEDIUM',
      environment = 'Staging', browser = 'Chrome', device = 'Desktop',
      screenshotUrl = null, videoUrl = null, attachmentUrl = null
    } = data;

    if (!moduleId || !title || !description) {
      throw new Error('Module, Title, and Description are required to report a bug.');
    }

    const mod = await this.resolveModule(moduleId);
    const modName = mod?.name || moduleName || 'Module';
    const modCode = (mod?.code || modName).toUpperCase().slice(0, 4);

    // Resolve Developer
    let devId = developerEmployeeId;
    let devName = developerEmployeeName;
    if (!devId) {
      // Find from testing request or employee_assigned_modules
      const reqRes = await pool.query(`SELECT developer_employee_id, developer_employee_name FROM testing_requests WHERE module_id = $1 LIMIT 1`, [mod?.id || moduleId]);
      if (reqRes.rows.length > 0) {
        devId = reqRes.rows[0].developer_employee_id;
        devName = reqRes.rows[0].developer_employee_name;
      } else {
        devId = 'EMP-005';
        devName = 'Vishnu Vardhan';
      }
    }

    const testerId = user?.empCode || user?.id || 'EMP-004';
    const testerName = user?.name || 'Rahul Verma';

    const countRes = await pool.query(`SELECT COUNT(*) as count FROM bugs`);
    const bugNum = parseInt(countRes.rows[0]?.count, 10) + 101;
    const bugId = `BUG-${bugNum}`;
    const id = `BUG-${modCode}-${bugNum}`;

    const res = await pool.query(
      `INSERT INTO bugs (
        id, bug_id, module_id, module_name, testing_request_id, test_case_id, feature, related_task_id,
        developer_employee_id, developer_employee_name, tester_employee_id, tester_employee_name,
        title, description, steps_to_reproduce, expected_result, actual_result,
        severity, priority, environment, browser, device,
        screenshot_url, video_url, attachment_url, status,
        assigned_developer_id, assigned_developer_name, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22,
        $23, $24, $25, 'OPEN',
        $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        id, bugId, mod?.id || moduleId, modName, testingRequestId || null, testCaseId || null, feature || null, relatedTaskId || null,
        devId, devName, testerId, testerName,
        title, description, stepsToReproduce || null, expectedResult || null, actualResult || null,
        severity.toUpperCase(), priority.toUpperCase(), environment, browser, device,
        screenshotUrl, videoUrl, attachmentUrl
      ]
    );

    const createdBug = res.rows[0];

    // Status transition entry
    await pool.query(
      `INSERT INTO bug_status_history (id, bug_id, changed_by_id, changed_by_name, changed_by_role, old_status, new_status, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, NULL, 'OPEN', 'Bug reported by tester', CURRENT_TIMESTAMP)`,
      [`BSH-${Date.now()}`, id, testerId, testerName, 'Tester']
    );

    // If testing request is currently in progress, update status to BUGS_FOUND
    if (testingRequestId) {
      await pool.query(
        `UPDATE testing_requests 
         SET status = 'BUGS_FOUND', last_tested_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND status IN ('TESTING_IN_PROGRESS', 'READY_FOR_TESTING')`,
        [testingRequestId]
      );
    }

    // Audit log
    await this.logAudit({
      entityType: 'BUG',
      entityId: id,
      moduleId: mod?.id || moduleId,
      moduleName: modName,
      user,
      action: `Reported Bug #${bugId}`,
      oldStatus: null,
      newStatus: 'OPEN',
      comment: `${severity} priority: ${title}`,
      metadata: { bugId, severity, priority }
    });

    // Notify Developer
    await this.sendNotification({
      type: 'BUG_REPORTED',
      moduleId: mod?.id || moduleId,
      moduleName: modName,
      entityId: id,
      recipientId: devId,
      recipientName: devName,
      recipientRole: 'Developer',
      title: `New ${severity} Bug in ${modName}: ${bugId}`,
      message: `New ${severity} priority bug reported in ${modName}: "${title}". Assigned to you for resolution.`
    });

    return createdBug;
  }

  static async getAllBugs(filters = {}) {
    let query = `
      SELECT b.*,
             COALESCE((SELECT COUNT(*) FROM bug_comments bc WHERE bc.bug_id = b.id), 0) as comment_count
      FROM bugs b
      WHERE 1=1
    `;
    const params = [];

    if (filters.moduleId) {
      params.push(filters.moduleId);
      query += ` AND (b.module_id = $${params.length} OR LOWER(b.module_name) = LOWER($${params.length}))`;
    }
    if (filters.status) {
      params.push(filters.status.toUpperCase());
      query += ` AND UPPER(b.status) = $${params.length}`;
    }
    if (filters.severity) {
      params.push(filters.severity.toUpperCase());
      query += ` AND UPPER(b.severity) = $${params.length}`;
    }
    if (filters.developerId) {
      params.push(filters.developerId);
      query += ` AND (b.developer_employee_id = $${params.length} OR b.assigned_developer_id = $${params.length})`;
    }
    if (filters.testerId) {
      params.push(filters.testerId);
      query += ` AND b.tester_employee_id = $${params.length}`;
    }

    query += ` ORDER BY 
      CASE UPPER(b.severity) 
        WHEN 'CRITICAL' THEN 1 
        WHEN 'HIGH' THEN 2 
        WHEN 'MEDIUM' THEN 3 
        ELSE 4 
      END ASC,
      b.created_at DESC`;

    const res = await pool.query(query, params);
    return res.rows;
  }

  static async getBugById(id) {
    const res = await pool.query(`SELECT * FROM bugs WHERE id = $1 OR bug_id = $1`, [id]);
    if (res.rows.length === 0) throw new Error(`Bug ${id} not found.`);
    const bug = res.rows[0];

    const commentsRes = await pool.query(
      `SELECT * FROM bug_comments WHERE bug_id = $1 ORDER BY created_at ASC`,
      [bug.id]
    );
    const historyRes = await pool.query(
      `SELECT * FROM bug_status_history WHERE bug_id = $1 ORDER BY created_at ASC`,
      [bug.id]
    );

    return {
      ...bug,
      comments: commentsRes.rows,
      statusHistory: historyRes.rows
    };
  }

  /**
   * Developer Fix Workflow:
   * Developer updates bug status to FIXED / READY_FOR_RETEST
   */
  static async updateBug(id, data, user) {
    const bug = await this.getBugById(id);
    const { status, developerNotes, comments, assignedDeveloperId, assignedDeveloperName } = data;
    const newStatus = status ? status.toUpperCase() : bug.status;

    const isFixed = newStatus === 'FIXED' || newStatus === 'READY_FOR_RETEST';
    const isClosed = newStatus === 'CLOSED';

    const res = await pool.query(
      `UPDATE bugs
       SET status = $1::varchar,
           developer_notes = COALESCE($2, developer_notes),
           fixed_date = CASE WHEN $3::boolean = TRUE THEN COALESCE(fixed_date, CURRENT_TIMESTAMP) ELSE fixed_date END,
           closed_date = CASE WHEN $4::boolean = TRUE THEN CURRENT_TIMESTAMP ELSE closed_date END,
           assigned_developer_id = COALESCE($5, assigned_developer_id),
           assigned_developer_name = COALESCE($6, assigned_developer_name),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        newStatus,
        developerNotes || comments || null,
        isFixed,
        isClosed,
        assignedDeveloperId || null,
        assignedDeveloperName || null,
        bug.id
      ]
    );

    const updatedBug = res.rows[0];

    // Status transition record
    await pool.query(
      `INSERT INTO bug_status_history (id, bug_id, changed_by_id, changed_by_name, changed_by_role, old_status, new_status, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [
        `BSH-${Date.now()}`, bug.id, user?.empCode || user?.id || 'USER',
        user?.name || 'User', user?.role || 'Developer',
        bug.status, newStatus, developerNotes || comments || `Status changed to ${newStatus}`
      ]
    );

    // Audit log
    await this.logAudit({
      entityType: 'BUG',
      entityId: bug.id,
      moduleId: bug.module_id,
      moduleName: bug.module_name,
      user,
      action: `Updated Bug #${bug.bug_id} to ${newStatus}`,
      oldStatus: bug.status,
      newStatus: newStatus,
      comment: developerNotes || comments || ''
    });

    // Notify Tester when developer fixes bug
    if (isFixed) {
      await this.sendNotification({
        type: 'BUG_READY_FOR_RETEST',
        moduleId: bug.module_id,
        moduleName: bug.module_name,
        entityId: bug.id,
        recipientId: bug.tester_employee_id,
        recipientName: bug.tester_employee_name,
        recipientRole: 'Tester',
        title: `Bug Ready for Retest: ${bug.bug_id}`,
        message: `Bug #${bug.bug_id} in ${bug.module_name} was marked ${newStatus} by ${user?.name || 'Developer'} and is ready for retesting.`
      });
    }

    return updatedBug;
  }

  /**
   * Tester Retest Workflow:
   * Tester evaluates fix:
   * - If fixed: CLOSED
   * - If not fixed: REOPENED (returns to same developer)
   */
  static async retestBug(id, { outcome, retestNotes = '' }, user) {
    const bug = await this.getBugById(id);
    const isPass = outcome === 'PASS' || outcome === 'CLOSED';
    const newStatus = isPass ? 'CLOSED' : 'REOPENED';

    const res = await pool.query(
      `UPDATE bugs
       SET status = $1::varchar,
           retest_date = CURRENT_TIMESTAMP,
           retest_notes = $2,
           closed_date = CASE WHEN $3::boolean = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END,
           assigned_developer_id = $4,
           assigned_developer_name = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [newStatus, retestNotes, isPass, bug.developer_employee_id, bug.developer_employee_name, bug.id]
    );

    const updatedBug = res.rows[0];

    // Status transition history
    await pool.query(
      `INSERT INTO bug_status_history (id, bug_id, changed_by_id, changed_by_name, changed_by_role, old_status, new_status, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [
        `BSH-${Date.now()}`, bug.id, user?.empCode || user?.id || 'TESTER',
        user?.name || 'Tester', 'Tester', bug.status, newStatus,
        `Retest Result: ${outcome}. ${retestNotes}`
      ]
    );

    // Audit log
    await this.logAudit({
      entityType: 'BUG',
      entityId: bug.id,
      moduleId: bug.module_id,
      moduleName: bug.module_name,
      user,
      action: `Retested Bug #${bug.bug_id} -> ${newStatus}`,
      oldStatus: bug.status,
      newStatus: newStatus,
      comment: retestNotes
    });

    // Notify Developer
    if (isPass) {
      await this.sendNotification({
        type: 'BUG_CLOSED',
        moduleId: bug.module_id,
        moduleName: bug.module_name,
        entityId: bug.id,
        recipientId: bug.developer_employee_id,
        recipientName: bug.developer_employee_name,
        recipientRole: 'Developer',
        title: `Bug Closed: ${bug.bug_id}`,
        message: `Bug #${bug.bug_id} in ${bug.module_name} was retested and verified CLOSED.`
      });
    } else {
      await this.sendNotification({
        type: 'BUG_REOPENED',
        moduleId: bug.module_id,
        moduleName: bug.module_name,
        entityId: bug.id,
        recipientId: bug.developer_employee_id,
        recipientName: bug.developer_employee_name,
        recipientRole: 'Developer',
        title: `Bug REOPENED: ${bug.bug_id}`,
        message: `Bug #${bug.bug_id} in ${bug.module_name} failed retesting and has been REOPENED. Notes: ${retestNotes}`
      });
    }

    return updatedBug;
  }

  static async addBugComment(bugId, { comment }, user) {
    const bug = await this.getBugById(bugId);
    const commentId = `BC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const res = await pool.query(
      `INSERT INTO bug_comments (id, bug_id, user_id, user_name, user_role, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        commentId, bug.id, user?.empCode || user?.id || 'USER',
        user?.name || 'User', user?.role || 'Member', comment
      ]
    );
    return res.rows[0];
  }

  /**
   * 8. TESTING REPORTS & PDF / DOCUMENT EXPORT
   * Relationship chain:
   * Testing Report -> Module -> Developer -> Tasks -> Test Cases -> Bugs -> Retesting -> Final Result
   */
  static async generateTestingReport(moduleId, user) {
    const mod = await this.resolveModule(moduleId);
    if (!mod) throw new Error(`Module ${moduleId} not found.`);

    // Get testing request
    const reqRes = await pool.query(`SELECT * FROM testing_requests WHERE module_id = $1 LIMIT 1`, [mod.id]);
    const tr = reqRes.rows[0] || null;

    // Aggregate test cases
    const tcRes = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE UPPER(status) = 'PASSED') as passed,
         COUNT(*) FILTER (WHERE UPPER(status) = 'FAILED') as failed,
         COUNT(*) FILTER (WHERE UPPER(status) = 'BLOCKED') as blocked
       FROM test_cases 
       WHERE module_id = $1`,
      [mod.id]
    );

    // Aggregate bugs
    const bugRes = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE UPPER(severity) = 'CRITICAL') as critical,
         COUNT(*) FILTER (WHERE UPPER(severity) = 'HIGH') as high,
         COUNT(*) FILTER (WHERE UPPER(severity) = 'MEDIUM') as medium,
         COUNT(*) FILTER (WHERE UPPER(severity) = 'LOW') as low,
         COUNT(*) FILTER (WHERE UPPER(status) = 'OPEN') as open,
         COUNT(*) FILTER (WHERE UPPER(status) = 'FIXED') as fixed,
         COUNT(*) FILTER (WHERE UPPER(status) = 'READY_FOR_RETEST' OR UPPER(status) = 'RETESTING') as retested,
         COUNT(*) FILTER (WHERE UPPER(status) = 'CLOSED') as closed
       FROM bugs 
       WHERE module_id = $1`,
      [mod.id]
    );

    const tc = tcRes.rows[0];
    const bg = bugRes.rows[0];

    const reportId = `REP-${mod.code.toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const devId = tr?.developer_employee_id || 'EMP-005';
    const devName = tr?.developer_employee_name || 'Vishnu Vardhan';
    const testerId = tr?.tester_employee_id || 'EMP-004';
    const testerName = tr?.tester_employee_name || 'Rahul Verma';
    const finalStatus = tr?.status || 'TESTING_IN_PROGRESS';

    const insertRes = await pool.query(
      `INSERT INTO testing_reports (
        id, module_id, module_name, testing_request_id, developer_employee_id, developer_employee_name,
        tester_employee_id, tester_employee_name, testing_start_date, testing_end_date,
        total_test_cases, passed_test_cases, failed_test_cases, blocked_test_cases,
        total_bugs, critical_bugs, high_bugs, medium_bugs, low_bugs,
        open_bugs, fixed_bugs, retested_bugs, closed_bugs, final_testing_status,
        summary_notes, generated_by_id, generated_by_name, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24,
        $25, $26, $27, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        reportId, mod.id, mod.name, tr?.id || null, devId, devName,
        testerId, testerName, tr?.testing_start_date || null, tr?.testing_end_date || null,
        parseInt(tc.total, 10) || 0, parseInt(tc.passed, 10) || 0, parseInt(tc.failed, 10) || 0, parseInt(tc.blocked, 10) || 0,
        parseInt(bg.total, 10) || 0, parseInt(bg.critical, 10) || 0, parseInt(bg.high, 10) || 0, parseInt(bg.medium, 10) || 0, parseInt(bg.low, 10) || 0,
        parseInt(bg.open, 10) || 0, parseInt(bg.fixed, 10) || 0, parseInt(bg.retested, 10) || 0, parseInt(bg.closed, 10) || 0,
        finalStatus,
        `Automated QA Report generated for ${mod.name}.`,
        user?.empCode || user?.id || 'ADMIN', user?.name || 'QA Lead'
      ]
    );

    return this.getTestingReport(mod.id);
  }

  static async getTestingReport(moduleId) {
    const mod = await this.resolveModule(moduleId);
    if (!mod) throw new Error(`Module ${moduleId} not found.`);

    // Fetch latest generated report if exists
    const repRes = await pool.query(
      `SELECT * FROM testing_reports WHERE module_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [mod.id]
    );

    // Fetch tasks
    const tasksRes = await pool.query(
      `SELECT id, title, status, progress_percent, assigned_to_name 
       FROM tasks 
       WHERE LOWER(module_name) = LOWER($1) OR module_id = $2
       ORDER BY id ASC`,
      [mod.name, mod.id]
    );

    // Fetch test cases
    const tcRes = await pool.query(
      `SELECT id, feature, test_scenario, test_steps, expected_result, actual_result, status, execution_date, tester_name 
       FROM test_cases 
       WHERE module_id = $1 ORDER BY id ASC`,
      [mod.id]
    );

    // Fetch bugs with history
    const bugsRes = await pool.query(
      `SELECT b.*,
              (SELECT json_agg(bsh.*) FROM bug_status_history bsh WHERE bsh.bug_id = b.id) as history
       FROM bugs b 
       WHERE module_id = $1 ORDER BY id ASC`,
      [mod.id]
    );

    // Fetch testing request
    const trRes = await pool.query(`SELECT * FROM testing_requests WHERE module_id = $1 LIMIT 1`, [mod.id]);
    const tr = trRes.rows[0] || null;

    return {
      module: mod,
      testingRequest: tr,
      reportSummary: repRes.rows[0] || null,
      tasks: tasksRes.rows,
      testCases: tcRes.rows,
      bugs: bugsRes.rows
    };
  }

  /**
   * 9. ADMIN QA DASHBOARD METRICS & CHARTS
   */
  static async getDashboardMetrics() {
    // 1. KPI counts
    const kpisRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM testing_requests WHERE UPPER(status) = 'READY_FOR_TESTING') as ready_for_testing,
        (SELECT COUNT(*) FROM testing_requests WHERE UPPER(status) IN ('TESTING_IN_PROGRESS', 'RETESTING')) as testing_in_progress,
        (SELECT COUNT(*) FROM testing_requests WHERE UPPER(status) IN ('TESTING_PASSED', 'APPROVED')) as testing_passed,
        (SELECT COUNT(*) FROM testing_requests WHERE UPPER(status) = 'TESTING_FAILED') as testing_failed,
        (SELECT COUNT(*) FROM bugs WHERE UPPER(status) NOT IN ('CLOSED', 'WONT_FIX', 'DUPLICATE')) as open_bugs,
        (SELECT COUNT(*) FROM bugs WHERE UPPER(severity) = 'CRITICAL' AND UPPER(status) NOT IN ('CLOSED', 'WONT_FIX', 'DUPLICATE')) as critical_bugs,
        (SELECT COUNT(*) FROM bugs WHERE UPPER(priority) IN ('URGENT', 'HIGH') AND UPPER(status) NOT IN ('CLOSED', 'WONT_FIX', 'DUPLICATE')) as high_priority_bugs,
        (SELECT COUNT(*) FROM bugs WHERE UPPER(status) IN ('FIXED', 'READY_FOR_RETEST')) as bugs_awaiting_retest,
        (SELECT COUNT(*) FROM bugs WHERE UPPER(status) = 'CLOSED') as closed_bugs
    `);

    // 2. Bugs by Module
    const bugsByModuleRes = await pool.query(`
      SELECT module_name, COUNT(*) as count,
             COUNT(*) FILTER (WHERE UPPER(severity) = 'CRITICAL') as critical,
             COUNT(*) FILTER (WHERE UPPER(severity) = 'HIGH') as high
      FROM bugs
      GROUP BY module_name
      ORDER BY count DESC
      LIMIT 6
    `);

    // 3. Bugs by Severity
    const bugsBySeverityRes = await pool.query(`
      SELECT severity, COUNT(*) as count 
      FROM bugs 
      GROUP BY severity 
      ORDER BY 
        CASE UPPER(severity) 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          ELSE 4 
        END
    `);

    // 4. Bugs by Developer
    const bugsByDevRes = await pool.query(`
      SELECT developer_employee_name, COUNT(*) as total_bugs,
             COUNT(*) FILTER (WHERE UPPER(status) = 'CLOSED') as resolved_bugs,
             COUNT(*) FILTER (WHERE UPPER(status) NOT IN ('CLOSED', 'WONT_FIX', 'DUPLICATE')) as open_bugs
      FROM bugs
      GROUP BY developer_employee_name
      ORDER BY total_bugs DESC
      LIMIT 5
    `);

    // 5. Bugs by Tester
    const bugsByTesterRes = await pool.query(`
      SELECT tester_employee_name, COUNT(*) as reported_bugs 
      FROM bugs 
      GROUP BY tester_employee_name 
      ORDER BY reported_bugs DESC 
      LIMIT 5
    `);

    // 6. Testing Status Distribution
    const statusDistRes = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM testing_requests 
      GROUP BY status
    `);

    // 7. Average Resolution Time (hours)
    const avgResolutionRes = await pool.query(`
      SELECT 
        ROUND(COALESCE(AVG(EXTRACT(EPOCH FROM (closed_date - created_at)) / 3600), 24)::numeric, 1) as avg_resolution_hours
      FROM bugs 
      WHERE closed_date IS NOT NULL
    `);

    return {
      kpis: kpisRes.rows[0],
      bugsByModule: bugsByModuleRes.rows,
      bugsBySeverity: bugsBySeverityRes.rows,
      bugsByDeveloper: bugsByDevRes.rows,
      bugsByTester: bugsByTesterRes.rows,
      testingStatusDistribution: statusDistRes.rows,
      averageResolutionHours: parseFloat(avgResolutionRes.rows[0]?.avg_resolution_hours) || 24.0
    };
  }

  /**
   * 10. AUDIT LOGS & NOTIFICATIONS
   */
  static async getAuditLogs(filters = {}) {
    let query = `SELECT * FROM testing_audit_logs WHERE 1=1`;
    const params = [];
    if (filters.moduleId) {
      params.push(filters.moduleId);
      query += ` AND (module_id = $${params.length} OR LOWER(module_name) = LOWER($${params.length}))`;
    }
    if (filters.entityType) {
      params.push(filters.entityType.toUpperCase());
      query += ` AND UPPER(entity_type) = $${params.length}`;
    }
    query += ` ORDER BY created_at DESC LIMIT 100`;
    const res = await pool.query(query, params);
    return res.rows;
  }

  static async getNotifications(userId, role) {
    let query = `
      SELECT * FROM qa_notifications 
      WHERE recipient_id = $1 
         OR recipient_id = 'ADMIN' 
         OR recipient_role = $2 
         OR (recipient_role = 'Admin' AND $2 = 'Admin')
      ORDER BY created_at DESC 
      LIMIT 50
    `;
    const res = await pool.query(query, [userId || 'ADMIN', role || 'Admin']);
    return res.rows;
  }

  static async markNotificationRead(id) {
    await pool.query(`UPDATE qa_notifications SET read = TRUE WHERE id = $1`, [id]);
    return true;
  }

  /**
   * =========================================================================
   * PROJECT-CENTRIC TESTING QUALITY GATE EXTENSIONS
   * =========================================================================
   */

  /**
   * 11. PROJECT-CENTRIC TESTING HUB
   * Fetches all projects with modules, dynamic project employees, 70% task completion,
   * pulsing indicators, testing requests, and bug tallies.
   */
  static async getProjectCentricTestingHub() {
    const prjRes = await pool.query(`
      SELECT 
        p.id, p.name, p.code, p.status, p.priority, p.project_manager, p.client, p.progress
      FROM projects p
      ORDER BY p.created_at DESC
    `);
    const projects = prjRes.rows;
    const hubProjects = [];

    for (const prj of projects) {
      // ── PRIMARY: Use project_allocations as the source of truth ──────────────
      const allocRes = await pool.query(`
        SELECT 
          pa.id as allocation_id,
          pa.employee_id, pa.employee_name, pa.role,
          pa.module_id, pa.module_name,
          COALESCE(t_stats.total_tasks, 0) as total_tasks,
          COALESCE(t_stats.completed_tasks, 0) as completed_tasks,
          COALESCE(t_stats.avg_progress, 0) as avg_progress,
          tr.id as testing_request_id,
          tr.status as tr_status,
          tr.testing_phase,
          tr.phase_name,
          tr.phase_status,
          tr.submitted_for_testing_at
        FROM project_allocations pa
        LEFT JOIN LATERAL (
          SELECT 
            COUNT(*) as total_tasks,
            COUNT(*) FILTER (WHERE UPPER(t.status) = 'COMPLETED' OR COALESCE(t.progress_percent, 0) >= 100) as completed_tasks,
            ROUND(COALESCE(AVG(COALESCE(t.progress_percent, 0)), 0), 1) as avg_progress
          FROM tasks t
          WHERE (
            t.allocation_id = pa.id OR (
              (t.project_id = pa.project_id OR t.project_name = pa.project_name) AND
              (t.assigned_to = pa.employee_id OR t.assigned_to_employee_id = pa.employee_id) AND
              (LOWER(t.module_name) = LOWER(pa.module_name) OR LOWER(t.module_id) = LOWER(pa.module_id))
            )
          )
        ) t_stats ON true
        LEFT JOIN testing_requests tr ON (
          pa.id = tr.allocation_id 
          OR (
            (tr.project_id = pa.project_id OR tr.project_name = pa.project_name) 
            AND (tr.developer_employee_id = pa.employee_id OR tr.developer_employee_name = pa.employee_name)
            AND (
              tr.module_id = pa.module_id 
              OR LOWER(REPLACE(REPLACE(tr.module_name, '-', ''), '_', '')) = LOWER(REPLACE(REPLACE(pa.module_name, '-', ''), '_', ''))
              OR LOWER(REPLACE(REPLACE(tr.module_id, '-', ''), '_', '')) LIKE '%' || LOWER(REPLACE(REPLACE(pa.module_name, '-', ''), '_', '')) || '%'
            )
          )
        )
        WHERE pa.project_id = $1 AND pa.allocation_status = 'ACTIVE'
        ORDER BY pa.created_at ASC
      `, [prj.id]);

      let allocRows = allocRes.rows;

      // Fallback: if no allocations found, look at group members + task assignees
      if (allocRows.length === 0) {
        const membersRes = await pool.query(`
          SELECT DISTINCT gm.employee_id, gm.employee_name, gm.role
          FROM group_members gm JOIN project_groups pg ON gm.group_id = pg.id
          WHERE pg.project_id = $1
        `, [prj.id]);
        let members = membersRes.rows;

        const taskEmpsRes = await pool.query(`
          SELECT DISTINCT assigned_to_employee_id as employee_id, assigned_to_name as employee_name
          FROM tasks WHERE (project_id = $1 OR project_name = $2) AND assigned_to_employee_id IS NOT NULL
        `, [prj.id, prj.name]);

        for (const te of taskEmpsRes.rows) {
          if (!members.find(m => m.employee_id === te.employee_id)) {
            members.push({ employee_id: te.employee_id, employee_name: te.employee_name, role: 'Developer' });
          }
        }

        // Build synthetic alloc rows from members + task data
        for (const mem of members) {
          const empTasksRes = await pool.query(`
            SELECT COALESCE(module_id, 'MOD-GEN') as module_id,
              COALESCE(module_name, 'General') as module_name,
              COUNT(*) as total_tasks,
              COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED' OR COALESCE(progress_percent, 0) >= 100) as completed_tasks,
              ROUND(COALESCE(AVG(COALESCE(progress_percent, 0)), 0), 1) as avg_progress
            FROM tasks
            WHERE (project_id = $1 OR project_name = $2) AND (assigned_to = $3 OR assigned_to_employee_id = $3)
            GROUP BY COALESCE(module_id, 'MOD-GEN'), COALESCE(module_name, 'General')
          `, [prj.id, prj.name, mem.employee_id]);

          for (const am of empTasksRes.rows) {
            const trRes = await pool.query(`
              SELECT * FROM testing_requests 
              WHERE (project_id = $1 OR project_id IS NULL)
                AND (module_id = $2 OR LOWER(module_name) = LOWER($3))
                AND (developer_employee_id = $4 OR LOWER(developer_employee_name) = LOWER($5))
              ORDER BY created_at DESC LIMIT 1
            `, [prj.id, am.module_id, am.module_name, mem.employee_id, mem.employee_name]);

            allocRows.push({
              allocation_id: null,
              employee_id: mem.employee_id,
              employee_name: mem.employee_name,
              role: mem.role || 'Developer',
              module_id: am.module_id,
              module_name: am.module_name,
              total_tasks: am.total_tasks,
              completed_tasks: am.completed_tasks,
              avg_progress: am.avg_progress,
              testing_request_id: trRes.rows[0]?.id || null,
              tr_status: trRes.rows[0]?.status || null,
              testing_phase: trRes.rows[0]?.testing_phase || 1,
              phase_name: trRes.rows[0]?.phase_name || null,
              phase_status: trRes.rows[0]?.phase_status || null,
              submitted_for_testing_at: trRes.rows[0]?.submitted_for_testing_at || null
            });
          }
        }
      }

      const employeeRows = [];
      let totalProjectTestingRequests = 0;
      let totalProjectBugs = 0;
      const prjModuleNames = [];

      for (const row of allocRows) {
        const totalTasks = parseInt(row.total_tasks, 10) || 0;
        const completedTasks = parseInt(row.completed_tasks, 10) || 0;
        const avgProgress = parseFloat(row.avg_progress) || 0;
        // True progress percentage: actual task progress percentage
        const completionPercentage = totalTasks > 0 ? avgProgress : 0;

        if (!prjModuleNames.includes(row.module_name)) prjModuleNames.push(row.module_name);

        let tr = row.testing_request_id ? { id: row.testing_request_id, status: row.tr_status } : null;

        // Count bugs
        const bugsRes = await pool.query(`
          SELECT COUNT(*) FILTER (WHERE UPPER(status) NOT IN ('CLOSED', 'WONT_FIX')) as open_count
          FROM bugs 
          WHERE (module_id = $1 OR LOWER(module_name) = LOWER($2))
            AND (developer_employee_id = $3 OR developer_employee_name = $4)
        `, [row.module_id, row.module_name, row.employee_id, row.employee_name]);
        const bugCount = parseInt(bugsRes.rows[0]?.open_count, 10) || 0;
        totalProjectBugs += bugCount;

        const currentTestingPhase = row.testing_phase || (completionPercentage >= 100 ? 3 : completionPercentage >= 90 ? 2 : 1);
        const currentPhaseName = row.phase_name || (
          currentTestingPhase === 3 ? 'Phase 3 - Final Gate (100%)' :
          currentTestingPhase === 2 ? 'Phase 2 - Beta Testing (90%)' :
          'Phase 1 - Alpha Testing (80%)'
        );

        let statusBadge = 'DEVELOPMENT';
        let shouldPulse = false;

        if (tr) {
          totalProjectTestingRequests++;
          if (tr.status === 'READY_FOR_TESTING' || tr.status === 'PENDING') {
            statusBadge = `PHASE ${currentTestingPhase} TESTING REQUIRED`;
            shouldPulse = true;
          }
          else if (tr.status === 'TESTING_IN_PROGRESS' || tr.status === 'IN_PROGRESS' || tr.status === 'TESTING') {
            statusBadge = `PHASE ${currentTestingPhase} TESTING`;
            shouldPulse = true;
          }
          else if (['TESTING_PASSED', 'PASSED', 'COMPLETED', 'APPROVED'].includes(tr.status)) {
            statusBadge = currentTestingPhase === 3 ? 'CERTIFIED & APPROVED' : `PHASE ${currentTestingPhase} PASSED`;
          }
          else if (tr.status === 'TESTING_FAILED' || tr.status === 'FAILED') {
            statusBadge = `PHASE ${currentTestingPhase} FAILED`;
          }
          else {
            statusBadge = tr.status;
          }
        } else if (completionPercentage >= 80) {
          // Progress reached 80%+ testing milestone -> immediately activate testing state
          totalProjectTestingRequests++;
          statusBadge = `PHASE ${currentTestingPhase} TESTING REQUIRED`;
          shouldPulse = true;
        }

        employeeRows.push({
          employeeId: row.employee_id,
          employeeName: row.employee_name,
          role: row.role || 'Developer',
          allocationId: row.allocation_id,
          moduleId: row.module_id,
          moduleName: row.module_name,
          totalTasks,
          completedTasks,
          completionPercentage,
          testingRequestId: tr?.id || null,
          testingPhase: currentTestingPhase,
          phaseName: currentPhaseName,
          phaseStatus: row.phase_status || 'PENDING',
          testingUrl: `https://hrms-test.example.com/${(row.module_name || '').toLowerCase()}`,
          environment: 'Pre-Production',
          status: statusBadge,
          rawStatus: tr?.status || 'DEVELOPMENT',
          shouldPulse,
          openBugs: bugCount,
          submittedForTestingAt: row.submitted_for_testing_at
        });
      }

      // Sort: Testing requested / active testing items come FIRST!
      employeeRows.sort((a, b) => {
        const aP = a.shouldPulse || a.status.includes('TESTING REQUIRED') || a.status.includes('TESTING');
        const bP = b.shouldPulse || b.status.includes('TESTING REQUIRED') || b.status.includes('TESTING');
        if (aP && !bP) return -1;
        if (!aP && bP) return 1;
        return b.completionPercentage - a.completionPercentage;
      });

      let projectTestingStatus = 'DEVELOPMENT';
      if (employeeRows.some(e => e.shouldPulse || e.status === 'TESTING' || e.status === 'TESTING REQUIRED')) {
        projectTestingStatus = 'IN PROGRESS';
      } else if (employeeRows.length > 0 && employeeRows.every(e => e.status === 'COMPLETED')) {
        projectTestingStatus = 'COMPLETED';
      }

      hubProjects.push({
        projectId: prj.id,
        projectCode: prj.code,
        projectName: prj.name,
        client: prj.client,
        projectManager: prj.project_manager,
        status: prj.status,
        testingStatus: projectTestingStatus,
        modules: prjModuleNames,
        testingRequestsCount: totalProjectTestingRequests,
        bugsCount: totalProjectBugs,
        employees: employeeRows
      });
    }

    return hubProjects;
  }

  /**
   * 12. PROJECT-EMPLOYEE-MODULE TESTING WORKSPACE
   * Loads deep workspace data for tester:
   * /testing/project/:projectId/employee/:employeeId/module/:moduleId
   */
  static async getProjectEmployeeModuleWorkspace(projectId, employeeId, moduleId) {
    // Resolve project
    const prjRes = await pool.query(`
      SELECT * FROM projects WHERE id = $1 OR code = $1 LIMIT 1
    `, [projectId]);
    const project = prjRes.rows[0] || { id: projectId, name: 'HRMS ERP', code: projectId, project_manager: 'Sarah Jenkins', status: 'In Progress' };

    // Resolve employee
    const emp = await this.resolveEmployee(employeeId) || { emp_code: employeeId, name: 'Vishnu Vardhan', designation: 'Lead Backend Architect' };

    // Resolve module with smart fallback to project allocations if needed
    let mod = await this.resolveModule(moduleId);
    if (!mod) {
      // Check project allocation module name
      const allocCheck = await pool.query(`
        SELECT module_id, module_name FROM project_allocations
        WHERE (project_id = $1 OR project_name = $2)
          AND (employee_id = $3 OR employee_name = $4)
        LIMIT 1
      `, [project.id, project.name, emp.emp_code, emp.name]);
      if (allocCheck.rows[0]) {
        mod = await this.resolveModule(allocCheck.rows[0].module_name) ||
              await this.resolveModule(allocCheck.rows[0].module_id);
      }
    }
    if (!mod) {
      mod = { id: moduleId, code: 'mod_gen', name: moduleId.replace(/^MOD[-_]+/i, '') || 'General' };
    }

    // Ensure mod.id is a valid ID in modules table (or fallback to MOD-GEN to satisfy FK)
    let validModuleId = mod.id;
    const dbModCheck = await pool.query('SELECT id FROM modules WHERE id = $1', [validModuleId]);
    if (!dbModCheck.rows[0]) {
      const fallbackMod = await pool.query("SELECT id FROM modules WHERE code = 'gen_hr' OR id = 'MOD-GEN' LIMIT 1");
      validModuleId = fallbackMod.rows[0]?.id || 'MOD-GEN';
    }

    // Fetch tasks
    const tasksRes = await pool.query(`
      SELECT id, title, status, priority, progress_percent
      FROM tasks
      WHERE (project_id = $1 OR project_name = $2)
        AND (
          module_id = $3 
          OR module_name = $4 
          OR LOWER(module_name) = LOWER($4)
          OR LOWER(REPLACE(REPLACE(module_name, '-', ''), '_', '')) = LOWER(REPLACE(REPLACE($4, '-', ''), '_', ''))
        )
        AND (assigned_to = $5 OR assigned_to_employee_id = $5)
      ORDER BY id ASC
    `, [project.id, project.name, mod.id, mod.name, emp.emp_code]);

    const tasks = tasksRes.rows;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || (t.progress_percent || 0) >= 100).length;
    const avgProgress = tasks.length > 0
      ? Math.round(tasks.reduce((sum, t) => sum + (t.progress_percent || 0), 0) / tasks.length)
      : 0;
    const completionPercentage = avgProgress;

    // Testing request: Match robustly by project, employee, and normalized module
    let reqRes = await pool.query(`
      SELECT * FROM testing_requests
      WHERE (project_id = $1 OR project_id IS NULL OR project_name = $2)
        AND (developer_employee_id = $3 OR LOWER(developer_employee_name) = LOWER($4))
        AND (
          module_id = $5 
          OR LOWER(module_name) = LOWER($6)
          OR LOWER(REPLACE(REPLACE(module_name, '-', ''), '_', '')) = LOWER(REPLACE(REPLACE($6, '-', ''), '_', ''))
          OR LOWER(REPLACE(REPLACE(module_id, '-', ''), '_', '')) LIKE '%' || LOWER(REPLACE(REPLACE($6, '-', ''), '_', '')) || '%'
        )
      ORDER BY created_at DESC LIMIT 1
    `, [project.id, project.name, emp.emp_code, emp.name, mod.id, mod.name]);

    let tr = reqRes.rows[0];
    const targetPhase = completionPercentage >= 100 ? 3 : completionPercentage >= 90 ? 2 : 1;
    const targetPhaseName = targetPhase === 3 ? 'Phase 3 - Final Gate (100%)' : targetPhase === 2 ? 'Phase 2 - Beta Testing (90%)' : 'Phase 1 - Alpha Testing (80%)';

    if (tr) {
      // If task progress reached higher milestone (e.g. 90% for Phase 2 or 100% for Phase 3), advance testing phase
      if (targetPhase > (tr.testing_phase || 1)) {
        await pool.query(`
          UPDATE testing_requests 
          SET testing_phase = $1,
              phase_name = $2,
              completion_percentage = $3,
              status = 'READY_FOR_TESTING',
              phase_status = 'PENDING',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [targetPhase, targetPhaseName, completionPercentage, tr.id]);
        tr.testing_phase = targetPhase;
        tr.phase_name = targetPhaseName;
        tr.status = 'READY_FOR_TESTING';
        tr.phase_status = 'PENDING';
      }
    } else {
      const newReqId = `TR-${project.id}-${validModuleId}-${emp.emp_code}`;
      const insRes = await pool.query(`
        INSERT INTO testing_requests (
          id, project_id, project_name, module_id, module_name,
          developer_employee_id, developer_employee_name,
          tester_employee_id, tester_employee_name,
          testing_url, environment, version,
          total_tasks, completed_tasks, pending_tasks, completion_percentage,
          testing_phase, phase_name, phase_status,
          status, submitted_date, testing_start_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'EMP-004', 'Rahul Verma', $8, 'Pre-Production', '1.0', $9, $10, $11, $12, $13, $14, 'PENDING', 'TESTING_IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET status = 'TESTING_IN_PROGRESS'
        RETURNING *
      `, [newReqId, project.id, project.name, validModuleId, mod.name, emp.emp_code, emp.name, `https://hrms-test.example.com/${mod.name.toLowerCase()}`, totalTasks, completedTasks, Math.max(0, totalTasks - completedTasks), completionPercentage, targetPhase, targetPhaseName]);
      tr = insRes.rows[0];
    }

    // Test cases
    const tcRes = await pool.query(`
      SELECT id, feature, test_scenario, test_steps, test_data, expected_result, actual_result, status, execution_date, tester_name
      FROM test_cases
      WHERE testing_request_id = $1 OR module_id = $2
      ORDER BY id ASC
    `, [tr.id, validModuleId]);

    let testCases = tcRes.rows;

    // If no test cases exist for this module, auto-seed standard test cases
    if (testCases.length === 0) {
      const codePrefix = (mod.code || 'MOD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'MOD';
      const defaultScenarios = [
        {
          id: `TC-${codePrefix}-001`,
          feature: `${mod.name} Access & Authentication`,
          scenario: `Verify authorized user can access ${mod.name} dashboard with valid role permissions`,
          steps: `1. Log in with employee credentials\n2. Navigate to ${mod.name} module\n3. Verify page renders with correct role permissions`,
          expected: `${mod.name} loads successfully without unauthorized errors`,
          status: 'PASSED',
          actual: `Dashboard initialized cleanly with proper RBAC controls.`
        },
        {
          id: `TC-${codePrefix}-002`,
          feature: `${mod.name} Form Validation & Submission`,
          scenario: `Verify core input validation and mandatory field constraints`,
          steps: `1. Open new entry form\n2. Test invalid / blank inputs\n3. Submit with valid inputs`,
          expected: `Validation flags missing inputs, valid payload accepted`,
          status: 'PASSED',
          actual: `Field validations triggered properly and valid payload accepted.`
        },
        {
          id: `TC-${codePrefix}-003`,
          feature: `${mod.name} Workflow Transition & State Machine`,
          scenario: `Verify stage progression and status updates across lifecycle`,
          steps: `1. Select an active entity in ${mod.name}\n2. Advance to subsequent stage\n3. Verify state persistence`,
          expected: `State updates correctly and audit timestamp records`,
          status: 'FAILED',
          actual: `Transient issue observed during state transition.`
        },
        {
          id: `TC-${codePrefix}-004`,
          feature: `${mod.name} Filter, Search & Export`,
          scenario: `Verify search indexing and data export (CSV / PDF / Excel)`,
          steps: `1. Enter query in search bar\n2. Filter by status\n3. Trigger report export`,
          expected: `Matching results filter immediately and export file generates cleanly`,
          status: 'PASSED',
          actual: `Search results accurate and export generated in 180ms.`
        },
        {
          id: `TC-${codePrefix}-005`,
          feature: `${mod.name} Error Handling & Graceful Degradation`,
          scenario: `Verify network disconnection and system recovery resilience`,
          steps: `1. Simulate brief network timeout during operation\n2. Reconnect connection\n3. Observe auto-retry`,
          expected: `User-friendly error banner displayed without session crash`,
          status: 'BLOCKED',
          actual: `Waiting on staging webhook configuration to complete test run.`
        }
      ];

      for (const sc of defaultScenarios) {
        await pool.query(`
          INSERT INTO test_cases (
            id, module_id, module_name, testing_request_id, feature,
            test_scenario, test_steps, expected_result, actual_result, status,
            tester_id, tester_name, execution_date, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO NOTHING
        `, [
          sc.id, validModuleId, mod.name, tr.id, sc.feature,
          sc.scenario, sc.steps, sc.expected, sc.actual, sc.status,
          emp.emp_code || 'EMP-004', emp.name || 'Rahul Verma'
        ]);
      }

      const reFetch = await pool.query(`
        SELECT id, feature, test_scenario, test_steps, test_data, expected_result, actual_result, status, execution_date, tester_name
        FROM test_cases
        WHERE testing_request_id = $1 OR module_id = $2
        ORDER BY id ASC
      `, [tr.id, validModuleId]);
      testCases = reFetch.rows;
    }

    const totalTestCases = testCases.length;
    const executedTestCases = testCases.filter(tc => tc.status && tc.status !== 'NOT_EXECUTED').length;
    const passedTestCases = testCases.filter(tc => tc.status === 'PASSED').length;
    const failedTestCases = testCases.filter(tc => tc.status === 'FAILED').length;
    const blockedTestCases = testCases.filter(tc => tc.status === 'BLOCKED').length;
    const passRate = executedTestCases > 0 ? parseFloat(((passedTestCases / executedTestCases) * 100).toFixed(1)) : 0;
    const finalVerdict = failedTestCases > 0 ? 'FAILED' : (passedTestCases > 0 && executedTestCases === totalTestCases ? 'PASSED' : 'PENDING');

    // Bugs
    const bugsRes = await pool.query(`
      SELECT * FROM bugs
      WHERE testing_request_id = $1 OR (module_id = $2 AND developer_employee_id = $3)
      ORDER BY created_at DESC
    `, [tr.id, mod.id, emp.emp_code]);

    // Reports / Submitted documents
    const reportsRes = await pool.query(`
      SELECT r.*, d.status as document_status, d.document_name
      FROM testing_reports r
      LEFT JOIN testing_documents d ON r.id = d.testing_report_id
      WHERE (r.testing_request_id = $1 OR (r.module_id = $2 AND r.developer_employee_id = $3))
      ORDER BY r.created_at DESC
    `, [tr.id, mod.id, emp.emp_code]);

    return {
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        projectManager: project.project_manager || 'Sarah Jenkins',
        status: project.status
      },
      developer: {
        id: emp.emp_code,
        name: emp.name,
        designation: emp.designation || 'Lead Backend Architect',
        department: emp.department || 'Engineering'
      },
      module: {
        id: mod.id,
        name: mod.name,
        code: mod.code
      },
      tester: {
        id: tr.tester_employee_id || 'EMP-004',
        name: tr.tester_employee_name || 'Rahul Verma'
      },
      taskProgress: {
        totalTasks,
        completedTasks,
        pendingTasks: Math.max(0, totalTasks - completedTasks),
        completionPercentage,
        tasks
      },
      testingRequest: {
        id: tr.id,
        testingUrl: tr.testing_url || `https://hrms-test.example.com/${mod.name.toLowerCase()}`,
        environment: tr.environment || 'Pre-Production',
        version: tr.version || '1.0',
        status: tr.status,
        testingPhase: tr.testing_phase || targetPhase,
        phaseName: tr.phase_name || targetPhaseName,
        phaseStatus: tr.phase_status || 'PENDING',
        submittedDate: tr.submitted_date,
        testingStartDate: tr.testing_start_date
      },
      testExecution: {
        totalTestCases,
        executedTestCases,
        passedTestCases,
        failedTestCases,
        blockedTestCases,
        passRate,
        finalVerdict
      },
      testCases,
      bugs: bugsRes.rows,
      reports: reportsRes.rows
    };
  }

  /**
   * 13. UPDATE TESTING URL & ENVIRONMENT
   */
  static async updateTestingUrlAndEnv(requestId, { testingUrl, environment, notes }, user) {
    const res = await pool.query(`
      UPDATE testing_requests 
      SET 
        testing_url = COALESCE($1, testing_url),
        environment = COALESCE($2, environment),
        notes = COALESCE($3, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [testingUrl, environment, notes, requestId]);

    if (res.rows.length === 0) {
      throw new Error(`Testing request ${requestId} not found.`);
    }

    const updated = res.rows[0];
    await this.logAudit({
      entityType: 'TESTING_REQUEST',
      entityId: requestId,
      moduleId: updated.module_id,
      moduleName: updated.module_name,
      user,
      action: 'Updated Testing URL & Environment',
      comment: `Environment set to ${updated.environment}, URL: ${updated.testing_url}`
    });

    return updated;
  }

  /**
   * 14. SUBMIT TESTING REPORT & CREATE TESTING DOCUMENT
   * Creates/Updates testing_reports record, marks as SUBMITTED,
   * and creates a record in testing_documents (the single source of truth
   * visible under Project, Employee, and Admin views).
   */
  static async submitTestingReport(reportData, user) {
    const {
      projectId,
      projectName,
      moduleId,
      moduleName,
      developerEmployeeId,
      developerEmployeeName,
      testerEmployeeId,
      testerEmployeeName,
      testingRequestId,
      environment = 'Pre-Production',
      version = '1.0',
      totalExecuted = 10,
      passed = 8,
      failed = 1,
      blocked = 1,
      testScopeCoverage = [],
      defectsAndFailures = [],
      blockersNotes = '',
      preparedBy = ''
    } = reportData;

    // Resolve defects: use submitted list or fetch active bugs for this request/module
    let finalDefects = defectsAndFailures;
    if (!finalDefects || finalDefects.length === 0) {
      const bRes = await pool.query(`
        SELECT bug_id, title, description, severity, status 
        FROM bugs 
        WHERE testing_request_id = $1 OR (module_id = $2 AND developer_employee_id = $3)
      `, [testingRequestId, moduleId, developerEmployeeId]);
      finalDefects = bRes.rows.map(b => ({
        bugId: b.bug_id,
        title: b.title,
        description: b.description,
        severity: b.severity,
        status: b.status
      }));
    }

    const hasUnresolvedHighDefects = finalDefects.some(d => 
      (d.severity === 'CRITICAL' || d.severity === 'HIGH') && d.status !== 'CLOSED' && d.status !== 'RESOLVED'
    );
    const passRate = totalExecuted > 0 ? parseFloat(((passed / totalExecuted) * 100).toFixed(1)) : 0;
    const finalVerdict = reportData.finalVerdict || (
      (failed > 0 || hasUnresolvedHighDefects) 
        ? 'FAILED' 
        : (totalExecuted > 0 && passed === totalExecuted ? 'PASSED' : 'PENDING')
    );

    // Resolve current milestone phase
    let currentPhase = reportData.testingPhase;
    let currentPhaseName = reportData.phaseName;

    if (!currentPhase && testingRequestId) {
      const curReqRes = await pool.query(`SELECT testing_phase, phase_name FROM testing_requests WHERE id = $1`, [testingRequestId]);
      if (curReqRes.rows.length > 0) {
        currentPhase = curReqRes.rows[0].testing_phase || 1;
        currentPhaseName = curReqRes.rows[0].phase_name || `Phase ${currentPhase} Testing`;
      }
    }
    if (!currentPhase) currentPhase = 1;
    if (!currentPhaseName) {
      currentPhaseName = currentPhase === 3 ? 'Phase 3 - Final Gate (100%)' : currentPhase === 2 ? 'Phase 2 - Beta Testing (90%)' : 'Phase 1 - Alpha Testing (80%)';
    }

    const reportId = `REP-${moduleId}-P${currentPhase}-${Date.now().toString().slice(-6)}`;
    const documentId = `DOC-QA-P${currentPhase}-${Date.now().toString().slice(-6)}`;
    const documentName = `${moduleName} (${currentPhaseName}) - ${developerEmployeeName} Testing Report`;

    // 1. Insert into testing_reports
    const reportRes = await pool.query(`
      INSERT INTO testing_reports (
        id, project_id, project_name, module_id, module_name,
        testing_request_id, developer_employee_id, developer_employee_name,
        tester_employee_id, tester_employee_name,
        version, environment,
        total_test_cases, total_executed, passed_test_cases, passed,
        failed_test_cases, failed, blocked_test_cases, blocked,
        pass_rate, final_verdict, report_status,
        test_scope_coverage, defects_and_failures, blockers_notes, summary_notes,
        testing_phase, phase_name,
        submitted_at, generated_by_id, generated_by_name, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $13, $14, $14, $15, $15, $16, $16,
        $17, $18, 'SUBMITTED', $19, $20, $21, $21,
        $22, $23,
        CURRENT_TIMESTAMP, $24, $25, CURRENT_TIMESTAMP
      ) RETURNING *
    `, [
      reportId, projectId, projectName, moduleId, moduleName,
      testingRequestId, developerEmployeeId, developerEmployeeName,
      testerEmployeeId, testerEmployeeName,
      version, environment,
      totalExecuted, passed, failed, blocked,
      passRate, finalVerdict, JSON.stringify(testScopeCoverage),
      JSON.stringify(finalDefects),
      blockersNotes,
      currentPhase, currentPhaseName,
      user.id, user.name
    ]);

    const createdReport = reportRes.rows[0];

    // 2. Insert into testing_documents (Single Source of Truth)
    const docRes = await pool.query(`
      INSERT INTO testing_documents (
        id, project_id, project_name, module_id, module_name,
        developer_employee_id, developer_employee_name,
        tester_employee_id, tester_employee_name,
        testing_request_id, testing_report_id,
        document_name, version, environment, status,
        final_verdict, pass_rate,
        testing_phase, phase_name,
        created_by_id, created_by_name, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'SUBMITTED',
        $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `, [
      documentId, projectId, projectName, moduleId, moduleName,
      developerEmployeeId, developerEmployeeName,
      testerEmployeeId, testerEmployeeName,
      testingRequestId, reportId,
      documentName, version, environment,
      finalVerdict, passRate,
      currentPhase, currentPhaseName,
      user.id, user.name
    ]);

    const createdDoc = docRes.rows[0];

    // 2b. Sync to test_reports table so PDF test document viewer has identical data
    try {
      await pool.query(`
        INSERT INTO test_reports (
          id, employee_id, tester_id, tester_name, manager_id, manager_name,
          project_id, project_name, module_id, module_name, title, status, test_date, environment, version,
          total_executed, passed, failed, blocked, pass_rate, final_verdict,
          testing_phase, phase_name,
          test_scope_coverage, defects_and_failures, blockers_notes, prepared_by,
          submitted_at, submitted_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, 'EMP-001', 'Sarah Jenkins',
          $5, $6, $7, $8, $9, 'SUBMITTED', CURRENT_TIMESTAMP, $10, $11,
          $12, $13, $14, $15, $16, $17,
          $18, $19,
          $20::jsonb, $21::jsonb, $22, $4,
          CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (id) DO UPDATE SET
          defects_and_failures = EXCLUDED.defects_and_failures,
          test_scope_coverage = EXCLUDED.test_scope_coverage,
          blockers_notes = EXCLUDED.blockers_notes,
          status = 'SUBMITTED',
          final_verdict = EXCLUDED.final_verdict,
          pass_rate = EXCLUDED.pass_rate,
          testing_phase = EXCLUDED.testing_phase,
          phase_name = EXCLUDED.phase_name,
          updated_at = CURRENT_TIMESTAMP
      `, [
        reportId, developerEmployeeId, testerEmployeeId, testerEmployeeName,
        projectId, projectName, moduleId, moduleName, documentName, environment, version,
        totalExecuted, passed, failed, blocked, passRate, finalVerdict,
        currentPhase, currentPhaseName,
        JSON.stringify(testScopeCoverage), JSON.stringify(finalDefects), blockersNotes
      ]);
    } catch (trErr) {
      console.warn('Sync to test_reports non-critical error:', trErr.message);
    }

    // 3. Update testing_request status and phase status
    const isVerdictPassed = finalVerdict === 'PASSED';
    if (testingRequestId) {
      await pool.query(`
        UPDATE testing_requests 
        SET status = $1,
            phase_status = $2,
            last_tested_date = CURRENT_TIMESTAMP,
            notes = $3,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = $4
      `, [
        isVerdictPassed ? (currentPhase === 3 ? 'APPROVED' : 'PASSED') : 'FAILED',
        isVerdictPassed ? 'COMPLETED' : 'FAILED',
        `${currentPhaseName} report submitted by ${testerEmployeeName || user?.name || 'Tester'}. Verdict: ${finalVerdict}.`,
        testingRequestId
      ]);
    }

    if (currentPhase === 3 && isVerdictPassed) {
      await pool.query(
        `UPDATE modules SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [moduleId]
      );
    }

    // 4. Audit Log
    await this.logAudit({
      entityType: 'TESTING_REPORT',
      entityId: reportId,
      moduleId,
      moduleName,
      user,
      action: `Submitted Testing Report (${currentPhaseName})`,
      newStatus: 'SUBMITTED',
      comment: `Report submitted for ${projectName} - ${moduleName} (${currentPhaseName}). Verdict: ${finalVerdict}, Pass Rate: ${passRate}%`,
      metadata: { reportId, documentId, currentPhase, currentPhaseName, finalVerdict, passRate, passed, failed, blocked }
    });

    // 5. Send Notification to Admin
    await this.sendNotification({
      type: 'TESTING_REPORT_SUBMITTED',
      moduleId,
      moduleName,
      entityId: reportId,
      recipientId: 'ADMIN',
      recipientName: 'Admin / QA Lead',
      recipientRole: 'Admin',
      title: `Testing Report Submitted: ${projectName} - ${moduleName}`,
      message: `Testing report submitted for ${projectName} - ${moduleName} by ${testerEmployeeName}. Verdict: ${finalVerdict} (${passRate}% pass rate).`
    });

    // 6. Send Notification to Developer
    await this.sendNotification({
      type: 'TESTING_REPORT_SUBMITTED',
      moduleId,
      moduleName,
      entityId: reportId,
      recipientId: developerEmployeeId,
      recipientName: developerEmployeeName,
      recipientRole: 'Developer',
      title: `Testing Report Submitted: ${moduleName}`,
      message: `QA testing report submitted for ${moduleName}. Status: ${finalVerdict === 'PASSED' ? 'TESTING COMPLETED (PASSED)' : 'TESTING FAILED'}.`
    });

    return {
      report: createdReport,
      document: createdDoc
    };
  }

  /**
   * 15. UNIFIED TESTING DOCUMENTS
   * Filterable by project, employee, tester, status, or search term.
   */
  static async getTestingDocuments(filters = {}) {
    let query = `
      SELECT 
        d.*,
        COALESCE(r.total_executed, tr.total_executed) AS total_executed,
        COALESCE(r.passed, tr.passed) AS passed,
        COALESCE(r.failed, tr.failed) AS failed,
        COALESCE(r.blocked, tr.blocked) AS blocked,
        COALESCE(r.test_scope_coverage, tr.test_scope_coverage) AS test_scope_coverage,
        COALESCE(r.defects_and_failures, tr.defects_and_failures) AS defects_and_failures,
        COALESCE(r.blockers_notes, tr.blockers_notes) AS blockers_notes,
        COALESCE(r.submitted_at, tr.submitted_at) AS submitted_at,
        r.approved_at,
        r.approved_by_name
      FROM testing_documents d
      LEFT JOIN testing_reports r ON d.testing_report_id = r.id
      LEFT JOIN test_reports tr ON d.testing_report_id = tr.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.projectId) {
      params.push(filters.projectId);
      query += ` AND d.project_id = $${params.length}`;
    }

    if (filters.employeeId) {
      params.push(filters.employeeId);
      query += ` AND (d.developer_employee_id = $${params.length} OR d.tester_employee_id = $${params.length})`;
    }

    if (filters.developerId) {
      params.push(filters.developerId);
      query += ` AND d.developer_employee_id = $${params.length}`;
    }

    if (filters.testerId) {
      params.push(filters.testerId);
      query += ` AND d.tester_employee_id = $${params.length}`;
    }

    if (filters.moduleId) {
      params.push(filters.moduleId);
      query += ` AND d.module_id = $${params.length}`;
    }

    if (filters.status && filters.status !== 'ALL') {
      params.push(filters.status.toUpperCase());
      query += ` AND UPPER(d.status) = $${params.length}`;
    }

    if (filters.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      query += ` AND (
        LOWER(d.document_name) LIKE $${params.length} OR
        LOWER(d.project_name) LIKE $${params.length} OR
        LOWER(d.module_name) LIKE $${params.length} OR
        LOWER(d.developer_employee_name) LIKE $${params.length} OR
        LOWER(d.tester_employee_name) LIKE $${params.length}
      )`;
    }

    query += ` ORDER BY d.created_at DESC`;
    const res = await pool.query(query, params);

    // Format & resiliently parse defects and coverage
    const docs = await Promise.all(res.rows.map(async (row) => {
      let defects = null;
      let coverage = null;
      let blockersNotes = row.blockers_notes || null;

      // ── 1. PRIMARY SOURCE: The document's own submitted defects (from testing_reports or test_reports) ──
      let rawDefects = row.defects_and_failures;
      if (typeof rawDefects === 'string') {
        try { rawDefects = JSON.parse(rawDefects); } catch (e) { rawDefects = null; }
      }
      if (Array.isArray(rawDefects) && rawDefects.length > 0) {
        defects = rawDefects.map(b => ({
          bugId: b.bugId || b.bug_id || 'BUG-001',
          title: b.title || 'Untitled Defect',
          description: b.description || '',
          severity: b.severity || 'HIGH',
          status: b.status || 'OPEN',
          assignedTo: b.assignedTo || b.assigned_developer_id || row.developer_employee_id,
          assignedName: b.assignedName || b.assigned_developer_name || row.developer_employee_name
        }));
      }

      // ── 2. FALLBACK 1: If document has no defects, check test_reports by report ID or project / module ──
      if (!defects || defects.length === 0) {
        const trRes = await pool.query(
          `SELECT defects_and_failures, test_scope_coverage, blockers_notes
           FROM test_reports
           WHERE id = $1 OR LOWER(project_name) = LOWER($2)
           ORDER BY updated_at DESC LIMIT 1`,
          [row.testing_report_id, row.project_name]
        );
        if (trRes.rows.length > 0) {
          let d = trRes.rows[0].defects_and_failures;
          if (typeof d === 'string') { try { d = JSON.parse(d); } catch(e) { d = null; } }
          if (Array.isArray(d) && d.length > 0) {
            defects = d;
            let cov = trRes.rows[0].test_scope_coverage;
            if (typeof cov === 'string') { try { cov = JSON.parse(cov); } catch(e) { cov = null; } }
            if (Array.isArray(cov) && cov.length > 0) coverage = cov;
            if (!blockersNotes && trRes.rows[0].blockers_notes) blockersNotes = trRes.rows[0].blockers_notes;
          }
        }
      }

      // ── 3. FALLBACK 2: Check testing_reports by project / module ──
      if (!defects || defects.length === 0) {
        const trLatest = await pool.query(
          `SELECT defects_and_failures, test_scope_coverage, blockers_notes
           FROM testing_reports
           WHERE (module_id = $1 OR LOWER(module_name) = LOWER($2) OR id = $3)
             AND jsonb_array_length(COALESCE(defects_and_failures, '[]')::jsonb) > 0
           ORDER BY created_at DESC LIMIT 1`,
          [row.module_id, row.module_name, row.testing_report_id]
        );
        if (trLatest.rows.length > 0) {
          let d = trLatest.rows[0].defects_and_failures;
          if (typeof d === 'string') { try { d = JSON.parse(d); } catch(e) { d = null; } }
          if (Array.isArray(d) && d.length > 0) {
            defects = d;
            let cov = trLatest.rows[0].test_scope_coverage;
            if (typeof cov === 'string') { try { cov = JSON.parse(cov); } catch(e) { cov = null; } }
            if (Array.isArray(cov) && cov.length > 0) coverage = cov;
            if (!blockersNotes && trLatest.rows[0].blockers_notes) blockersNotes = trLatest.rows[0].blockers_notes;
          }
        }
      }

      // ── 4. FALLBACK 3: Check bugs table matching this module or project ──
      if (!defects || defects.length === 0) {
        const bugsRes = await pool.query(
          `SELECT bug_id, title, description, severity, status,
                  assigned_developer_id as "assignedTo", assigned_developer_name as "assignedName"
           FROM bugs
           WHERE module_id = $1
              OR testing_request_id = $2
              OR (developer_employee_id = $3 AND project_id = $4)
           ORDER BY created_at ASC`,
          [row.module_id, row.testing_request_id, row.developer_employee_id, row.project_id]
        );
        if (bugsRes.rows.length > 0) {
          defects = bugsRes.rows.map(b => ({
            bugId: b.bug_id,
            title: b.title,
            description: b.description,
            severity: b.severity,
            status: b.status,
            assignedTo: b.assignedTo,
            assignedName: b.assignedName
          }));
        }
      }

      // ── Parse coverage ──
      if (!coverage) {
        let cov = row.test_scope_coverage;
        if (typeof cov === 'string') { try { cov = JSON.parse(cov); } catch(e) { cov = []; } }
        coverage = Array.isArray(cov) ? cov : [];
      }

      return {
        ...row,
        test_scope_coverage: coverage,
        defects_and_failures: defects || [],
        blockers_notes: blockersNotes || 'All quality standards verified.'
      };
    }));

    return docs;
  }

  /**
   * 16. ADMIN REVIEW: APPROVE OR REOPEN TESTING REPORT
   */
  static async reviewTestingReport(reportId, { action, comment = '' }, user) {
    const isApprove = action === 'APPROVE' || action === 'APPROVED';
    const newStatus = isApprove ? 'APPROVED' : 'REOPENED';

    // Update testing_reports
    const repRes = await pool.query(`
      UPDATE testing_reports 
      SET 
        report_status = $1::varchar,
        approved_at = CASE WHEN $1::varchar = 'APPROVED' THEN CURRENT_TIMESTAMP ELSE NULL END,
        approved_by_id = CASE WHEN $1::varchar = 'APPROVED' THEN $2::varchar ELSE NULL END,
        approved_by_name = CASE WHEN $1::varchar = 'APPROVED' THEN $3::varchar ELSE NULL END
      WHERE id = $4
      RETURNING *
    `, [newStatus, user.id, user.name, reportId]);

    if (repRes.rows.length === 0) {
      throw new Error(`Testing report ${reportId} not found.`);
    }

    const report = repRes.rows[0];

    // Update testing_documents
    await pool.query(`
      UPDATE testing_documents
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE testing_report_id = $2
    `, [newStatus, reportId]);

    // If reopened, set testing_request to RETESTING
    if (!isApprove && report.testing_request_id) {
      await pool.query(`
        UPDATE testing_requests 
        SET status = 'RETESTING', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [report.testing_request_id]);
    }

    // Audit log
    await this.logAudit({
      entityType: 'TESTING_REPORT',
      entityId: reportId,
      moduleId: report.module_id,
      moduleName: report.module_name,
      user,
      action: isApprove ? 'Approved Testing Report' : 'Reopened Testing Report',
      newStatus,
      comment: comment || (isApprove ? 'Report approved by Admin.' : 'Report reopened for changes.')
    });

    // Notify Developer
    await this.sendNotification({
      type: isApprove ? 'TESTING_REPORT_APPROVED' : 'TESTING_REPORT_REOPENED',
      moduleId: report.module_id,
      moduleName: report.module_name,
      entityId: reportId,
      recipientId: report.developer_employee_id,
      recipientName: report.developer_employee_name,
      recipientRole: 'Developer',
      title: isApprove ? `${report.module_name} Module Testing Approved` : `${report.module_name} Testing Reopened`,
      message: isApprove 
        ? `${report.module_name} module testing approved by ${user.name}.`
        : `${report.module_name} testing report reopened by Admin: ${comment || 'Please review feedback.'}`
    });

    // Notify Tester
    if (report.tester_employee_id) {
      await this.sendNotification({
        type: isApprove ? 'TESTING_REPORT_APPROVED' : 'TESTING_REPORT_REOPENED',
        moduleId: report.module_id,
        moduleName: report.module_name,
        entityId: reportId,
        recipientId: report.tester_employee_id,
        recipientName: report.tester_employee_name,
        recipientRole: 'Tester',
        title: isApprove ? `Testing Report Approved: ${report.module_name}` : `Testing Report Reopened: ${report.module_name}`,
        message: isApprove
          ? `Testing report for ${report.module_name} approved.`
          : `Testing report for ${report.module_name} reopened by Admin.`
      });
    }

    return {
      report,
      status: newStatus
    };
  }
}
