import express from 'express';
import { hrmsPool as pool, crmPool } from '../db/pool.js';

// Auto-provision a default project group if one doesn't exist yet for a project
export async function autoProvisionProjectGroup(projectId, customProjectName = null) {
  try {
    if (!projectId) return null;

    // 1. Check if group already exists for this project
    const existing = await pool.query(
      `SELECT id FROM project_groups WHERE project_id = $1 OR project_id = (SELECT code FROM projects WHERE id = $1 LIMIT 1)`,
      [projectId]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }

    // 2. Fetch project details from HRMS or CRM
    let project = null;
    const hrmsProj = await pool.query(`SELECT id, code, name, repository_url, project_manager FROM projects WHERE id = $1 OR code = $1 LIMIT 1`, [projectId]);
    if (hrmsProj.rows.length > 0) {
      project = hrmsProj.rows[0];
    } else {
      const crmProj = await crmPool.query(`SELECT id, code, name, repository_url, project_manager FROM projects WHERE id = $1 OR code = $1 LIMIT 1`, [projectId]);
      if (crmProj.rows.length > 0) {
        project = crmProj.rows[0];
      }
    }

    const projId = project?.id || projectId;
    const projCode = project?.code || projId;
    const projName = project?.name || customProjectName || projId;
    const repoUrl = project?.repository_url || `https://github.com/company/${projCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const cleanCode = (projCode || projId).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'CORE';
    const groupId = `GRP-${cleanCode}-01`;
    const groupName = `${projName} Development Team`;

    // 3. Fetch active HRMS employees
    const empRes = await pool.query(`
      SELECT emp_code, id, name, designation, department 
      FROM employees 
      WHERE (status IS NULL OR status NOT IN ('Exited', 'Terminated', 'Inactive'))
        AND emp_code NOT IN ('ADMIN-001', 'EMP-000')
        AND id NOT IN ('ADMIN-001', 'EMP-000')
        AND LOWER(COALESCE(department, '')) NOT IN ('administration', 'management')
      ORDER BY 
        CASE 
          WHEN LOWER(COALESCE(department, '')) LIKE '%eng%' OR LOWER(COALESCE(designation, '')) LIKE '%lead%' THEN 0 
          ELSE 1 
        END,
        id ASC
    `);

    const employees = empRes.rows;
    if (employees.length === 0) return null;

    // Pick team head
    let teamHead = null;
    if (project?.project_manager) {
      teamHead = employees.find(e => 
        e.name.toLowerCase() === project.project_manager.toLowerCase() || 
        e.emp_code === project.project_manager || 
        e.id === project.project_manager
      );
    }
    if (!teamHead) {
      teamHead = employees[0];
    }

    // Insert project group
    await pool.query(`
      INSERT INTO project_groups (id, name, project_id, team_head_id, team_head_name, description, repository_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        project_id = EXCLUDED.project_id,
        team_head_id = EXCLUDED.team_head_id,
        team_head_name = EXCLUDED.team_head_name,
        description = EXCLUDED.description,
        repository_url = COALESCE(EXCLUDED.repository_url, project_groups.repository_url)
    `, [
      groupId,
      groupName,
      projId,
      teamHead.emp_code || teamHead.id,
      teamHead.name,
      `Core cross-functional delivery team for ${projName}`,
      repoUrl
    ]);

    // Insert group members (up to 5 active employees)
    const teamMembers = [{ ...teamHead, role: 'Team Head' }];
    const roles = ['Frontend Lead', 'Backend Engineer', 'Database Architect', 'QA Specialist', 'Full-Stack Developer'];
    
    let rIdx = 0;
    for (const emp of employees) {
      if ((emp.emp_code || emp.id) !== (teamHead.emp_code || teamHead.id)) {
        teamMembers.push({ ...emp, role: roles[rIdx % roles.length] });
        rIdx++;
        if (teamMembers.length >= 5) break;
      }
    }

    for (const member of teamMembers) {
      const gmId = `GM-${groupId}-${member.emp_code || member.id}`;
      await pool.query(`
        INSERT INTO group_members (id, group_id, employee_id, employee_name, role)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          role = EXCLUDED.role,
          employee_name = EXCLUDED.employee_name
      `, [
        gmId,
        groupId,
        member.emp_code || member.id,
        member.name,
        member.role
      ]);
    }

    return groupId;
  } catch (err) {
    console.warn('Auto-provisioning project group notice:', err.message);
    return null;
  }
}

const router = express.Router();

// GET /api/groups — List project groups (supports employeeId filter & personal progress calculation)
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    const employeeId = req.query.employeeId || req.headers['x-employee-id'] || null;

    if (employeeId && employeeId !== 'ALL' && employeeId !== 'ADMIN-001') {
      // Scoped view for logged-in employee: return their assigned project groups without duplicates
      const query = `
        SELECT DISTINCT ON (LOWER(TRIM(g.name)))
          g.id,
          g.name,
          g.project_id,
          g.team_head_id,
          COALESCE(th.name, g.team_head_name) as team_head_name,
          th.emp_code as team_head_emp_code,
          COALESCE(th.designation, 'Lead Architect') as team_head_designation,
          COALESCE(th.department, 'Engineering') as team_head_department,
          g.description,
          g.created_at,
          COALESCE(g.repository_url, p.repository_url) as repository_url,
          COALESCE(p.name, g.name, 'Project') as project_name,
          p.code as project_code,
          p.description as project_description,
          p.start_date,
          COALESCE(p.end_date, CURRENT_DATE + INTERVAL '30 days') as deadline,
          COALESCE(p.status, 'In Progress') as project_status,
          COALESCE(tsk.task_count, 0) as task_count,
          COALESCE(tsk.completed_count, 0) as completed_count,
          COALESCE(tsk.overall_progress, 0) as overall_progress,
          COALESCE(my_tsk.my_progress, 0) as my_progress,
          COALESCE(my_tsk_mod.module_name, my_mod.module_name, 'Core Deliverables') as my_module,
          COALESCE(my_mod.status, 'In Progress') as my_status,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', gm2.id,
                  'employeeId', gm2.employee_id,
                  'employee_id', gm2.employee_id,
                  'name', COALESCE(e2.name, gm2.employee_name),
                  'employeeName', COALESCE(e2.name, gm2.employee_name),
                  'designation', COALESCE(e2.designation, 'Specialist'),
                  'department', COALESCE(e2.department, 'Engineering'),
                  'role', gm2.role,
                  'isTeamHead', (gm2.employee_id = g.team_head_id)
                )
              )
              FROM group_members gm2
              LEFT JOIN employees e2 ON (gm2.employee_id = e2.emp_code OR gm2.employee_id = e2.id)
              WHERE gm2.group_id = g.id
            ), '[]'::json
          ) as members,
          COALESCE(
            (SELECT COUNT(DISTINCT gm2.employee_id) FROM group_members gm2 WHERE gm2.group_id = g.id),
            4
          ) as member_count
        FROM project_groups g
        LEFT JOIN projects p ON (g.project_id = p.id OR g.project_id = p.code)
        LEFT JOIN employees th ON (g.team_head_id = th.emp_code OR g.team_head_id = th.id)
        LEFT JOIN (
          SELECT 
            group_id,
            COUNT(*) as task_count,
            COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count,
            ROUND(COALESCE(AVG(progress_percent), 0)) as overall_progress
          FROM tasks
          WHERE group_id IS NOT NULL
          GROUP BY group_id
        ) tsk ON g.id = tsk.group_id
        LEFT JOIN (
          SELECT 
            group_id,
            ROUND(COALESCE(AVG(progress_percent), 0)) as my_progress
          FROM tasks
          WHERE (assigned_to = $1 OR assigned_to_employee_id = $1)
            AND group_id IS NOT NULL
          GROUP BY group_id
        ) my_tsk ON g.id = my_tsk.group_id
        LEFT JOIN (
          SELECT DISTINCT ON (team_id)
            team_id,
            module_name,
            'In Progress' as status
          FROM employee_assigned_modules
          WHERE employee_id = $1
          ORDER BY team_id, created_at DESC
        ) my_mod ON g.id = my_mod.team_id
        LEFT JOIN (
          SELECT DISTINCT ON (group_id)
            group_id,
            module_name
          FROM tasks
          WHERE (assigned_to = $1 OR assigned_to_employee_id = $1)
            AND group_id IS NOT NULL
          ORDER BY group_id, created_at DESC
        ) my_tsk_mod ON g.id = my_tsk_mod.group_id
        WHERE (
          -- 1. Assigned in group_members
          g.id IN (
            SELECT DISTINCT group_id FROM group_members 
            WHERE employee_id = $1
          )
          OR
          -- 2. Designated team head
          g.team_head_id = $1
          OR
          -- 3. Assigned module
          g.id IN (
            SELECT DISTINCT team_id FROM employee_assigned_modules 
            WHERE employee_id = $1
          )
          OR
          -- 4. Groups where employee has assigned tasks
          g.id IN (
            SELECT DISTINCT group_id FROM tasks 
            WHERE (assigned_to = $1 OR assigned_to_employee_id = $1)
              AND group_id IS NOT NULL
            UNION
            SELECT DISTINCT group_id FROM task_member_assignments 
            WHERE employee_id = $1
              AND group_id IS NOT NULL
          )
        )
        ORDER BY LOWER(TRIM(g.name)), COALESCE(tsk.task_count, 0) DESC, (CASE WHEN g.repository_url IS NOT NULL THEN 1 ELSE 0 END) DESC, g.created_at ASC
      `;

      const result = await pool.query(query, [employeeId]);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    }

    // Default Org/Admin List
    let query = `
      SELECT 
        g.id,
        g.name,
        g.project_id,
        g.team_head_id,
        COALESCE(th.name, g.team_head_name) as team_head_name,
        g.description,
        g.created_at,
        COALESCE(g.repository_url, p.repository_url) as repository_url,
        p.name as project_name,
        p.code as project_code,
        p.start_date,
        p.end_date as deadline,
        COALESCE(p.status, 'In Progress') as project_status,
        COALESCE(tsk.task_count, 0) as task_count,
        COALESCE(tsk.completed_count, 0) as completed_count,
        COALESCE(tsk.overall_progress, 0) as overall_progress,
        COALESCE(
          json_agg(
            json_build_object(
              'id', gm.id,
              'employeeId', gm.employee_id,
              'employee_id', gm.employee_id,
              'name', gm.employee_name,
              'employeeName', gm.employee_name,
              'designation', COALESCE(gm.designation, 'Specialist'),
              'department', COALESCE(gm.department, 'Engineering'),
              'role', gm.role,
              'isTeamHead', (gm.employee_id = g.team_head_id)
            )
          ) FILTER (WHERE gm.id IS NOT NULL), '[]'::json
        ) as members
      FROM project_groups g
      LEFT JOIN projects p ON (g.project_id = p.id OR g.project_id = p.code)
      LEFT JOIN employees th ON (g.team_head_id = th.emp_code OR g.team_head_id = th.id)
      LEFT JOIN (
        SELECT 
          group_id,
          COUNT(*) as task_count,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count,
          ROUND(COALESCE(AVG(progress_percent), 0)) as overall_progress
        FROM tasks
        WHERE group_id IS NOT NULL
        GROUP BY group_id
      ) tsk ON g.id = tsk.group_id
      LEFT JOIN (
        SELECT DISTINCT ON (gm.group_id, gm.employee_id)
          gm.id,
          gm.group_id,
          gm.employee_id,
          gm.role,
          e.name as employee_name,
          e.designation,
          e.department,
          gm.created_at
        FROM group_members gm
        INNER JOIN employees e ON (gm.employee_id = e.emp_code OR gm.employee_id = e.id)
        WHERE (e.status IS NULL OR e.status NOT IN ('Exited', 'Terminated', 'Inactive'))
          AND e.emp_code NOT IN ('ADMIN-001', 'EMP-000')
          AND e.id NOT IN ('ADMIN-001', 'EMP-000')
          AND LOWER(COALESCE(e.department, '')) NOT IN ('administration', 'management')
        ORDER BY gm.group_id, gm.employee_id, gm.created_at DESC
      ) gm ON g.id = gm.group_id
      WHERE 1=1
    `;
    const params = [];
    if (projectId) {
      params.push(projectId);
      query += ` AND (g.project_id = $${params.length} OR p.code = $${params.length} OR p.id = $${params.length})`;
    }

    query += ` GROUP BY g.id, g.name, g.project_id, g.team_head_id, g.team_head_name, th.name, g.description, g.created_at, g.repository_url, p.repository_url, p.name, p.code, p.start_date, p.end_date, p.status, tsk.task_count, tsk.completed_count, tsk.overall_progress ORDER BY g.created_at ASC`;

    let result = await pool.query(query, params);

    // If query was for a specific projectId and returned 0 groups, auto-provision and re-query
    if (projectId && result.rows.length === 0) {
      await autoProvisionProjectGroup(projectId);
      result = await pool.query(query, params);
    }

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('Error fetching groups:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// TEAM MEMBER DIRECT MESSAGING (PERSISTENT BIDIRECTIONAL CHAT & UNREAD COUNTS)
// =========================================================================
// TEAM DIRECT & GROUP CHAT MESSAGES API
// =========================================================================

// GET /api/groups/messages - Fetch messages between two employees OR whole group channel
router.get('/messages', async (req, res) => {
  try {
    const { employeeId, targetId, groupId, type } = req.query;
    if (!employeeId && !groupId) {
      return res.status(400).json({ success: false, message: 'employeeId or groupId is required' });
    }

    let messages = [];
    if (targetId === 'GROUP' || type === 'group') {
      const gId = groupId || 'GRP-CMS-01';
      const msgRes = await pool.query(
        `SELECT id, group_id, sender_id, sender_name, receiver_id, receiver_name, message, is_read, created_at
         FROM team_chat_messages
         WHERE (receiver_id = 'GROUP' OR receiver_id = 'ALL' OR receiver_id IS NULL)
           AND (group_id = $1 OR $1 IS NULL OR group_id IS NULL)
         ORDER BY created_at ASC`,
        [gId]
      );
      messages = msgRes.rows;
    } else if (targetId) {
      const msgRes = await pool.query(
        `SELECT id, group_id, sender_id, sender_name, receiver_id, receiver_name, message, is_read, created_at
         FROM team_chat_messages
         WHERE ((sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1))
         ORDER BY created_at ASC`,
        [employeeId, targetId]
      );
      messages = msgRes.rows;
    }

    // Calculate unread count map for employeeId from direct senders
    const unreadCounts = {};
    if (employeeId) {
      const unreadRes = await pool.query(
        `SELECT sender_id, COUNT(*)::int as count
         FROM team_chat_messages
         WHERE receiver_id = $1 AND is_read = false
         GROUP BY sender_id`,
        [employeeId]
      );

      unreadRes.rows.forEach(r => {
        unreadCounts[r.sender_id] = r.count;
      });

      // Group unread count: messages sent to GROUP by someone other than current employee
      if (groupId) {
        const groupUnreadRes = await pool.query(
          `SELECT COUNT(*)::int as count
           FROM team_chat_messages
           WHERE (group_id = $1 OR group_id IS NULL)
             AND (receiver_id = 'GROUP' OR receiver_id = 'ALL' OR receiver_id IS NULL)
             AND sender_id != $2
             AND is_read = false`,
          [groupId, employeeId]
        );
        unreadCounts['GROUP'] = groupUnreadRes.rows[0]?.count || 0;
      }
    }

    res.json({
      success: true,
      data: {
        messages,
        unreadCounts
      }
    });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/groups/messages - Send a message (direct or group broadcast)
router.post('/messages', async (req, res) => {
  try {
    const { groupId, senderId, senderName, receiverId, receiverName, message } = req.body;
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ success: false, message: 'senderId, receiverId, and message are required' });
    }

    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const insertRes = await pool.query(
      `INSERT INTO team_chat_messages (id, group_id, sender_id, sender_name, receiver_id, receiver_name, message, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
       RETURNING *`,
      [id, groupId || null, senderId, senderName || senderId, receiverId, receiverName || receiverId, message]
    );

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: insertRes.rows[0]
    });
  } catch (err) {
    console.error('Error sending chat message:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/groups/messages/read - Mark messages as read (direct or group)
router.put('/messages/read', async (req, res) => {
  try {
    const { senderId, receiverId, groupId } = req.body;
    if (receiverId === 'GROUP' || receiverId === 'ALL') {
      const gId = groupId || 'GRP-CMS-01';
      await pool.query(
        `UPDATE team_chat_messages
         SET is_read = true
         WHERE (receiver_id = 'GROUP' OR receiver_id = 'ALL' OR receiver_id IS NULL)
           AND (group_id = $1 OR $1 IS NULL)`,
        [gId]
      );
    } else if (senderId && receiverId) {
      await pool.query(
        `UPDATE team_chat_messages
         SET is_read = true
         WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
        [senderId, receiverId]
      );
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/groups/:id — Complete Project / Group Details Hierarchy
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const groupRes = await pool.query(
      `SELECT g.*, 
              COALESCE(th.name, g.team_head_name) as team_head_name,
              th.emp_code as team_head_emp_code,
              COALESCE(th.designation, 'Lead Architect') as team_head_designation,
              COALESCE(th.department, 'Engineering') as team_head_department,
              p.id as project_actual_id,
              COALESCE(p.name, 'CMS Project') as project_name, 
              p.code as project_code,
              COALESCE(p.description, g.description, 'Core cross-functional delivery group for CMS Project') as project_description,
              p.start_date as project_start_date,
              COALESCE(p.end_date, CURRENT_DATE + INTERVAL '30 days') as project_deadline,
              COALESCE(p.status, 'In Progress') as project_status,
              p.requirement_documents,
              COALESCE(g.repository_url, p.repository_url) as repository_url
       FROM project_groups g 
       LEFT JOIN projects p ON (g.project_id = p.id OR g.project_id = p.code)
       LEFT JOIN employees th ON (g.team_head_id = th.emp_code OR g.team_head_id = th.id)
       WHERE g.id = $1`,
      [id]
    );

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const group = groupRes.rows[0];

    // Fetch members with active HRMS records
    const membersRes = await pool.query(
      `SELECT 
        gm.id as member_record_id,
        gm.employee_id as "employeeId",
        gm.employee_id,
        e.name as "employeeName",
        e.name as name,
        e.name as employee_name,
        COALESCE(e.designation, 'Specialist') as designation,
        COALESCE(e.department, 'Engineering') as department,
        gm.role,
        (gm.employee_id = $2) as "isTeamHead",
        (gm.employee_id = $2) as is_team_head
       FROM (
         SELECT DISTINCT ON (employee_id) id, group_id, employee_id, role, created_at
         FROM group_members
         WHERE group_id = $1
         ORDER BY employee_id, created_at DESC
       ) gm
       INNER JOIN employees e ON (gm.employee_id = e.emp_code OR gm.employee_id = e.id)
       WHERE (e.status IS NULL OR e.status NOT IN ('Exited', 'Terminated', 'Inactive'))
         AND e.emp_code NOT IN ('ADMIN-001', 'EMP-000')
         AND e.id NOT IN ('ADMIN-001', 'EMP-000')
         AND LOWER(COALESCE(e.department, '')) NOT IN ('administration', 'management')
       ORDER BY CASE WHEN gm.employee_id = $2 THEN 0 ELSE 1 END, gm.employee_id ASC`,
      [id, group.team_head_id]
    );

    // Fetch assigned modules from employee_assigned_modules
    const eamRes = await pool.query(
      `SELECT eam.*, e.name as employee_name
       FROM employee_assigned_modules eam
       LEFT JOIN employees e ON (eam.employee_id = e.emp_code OR eam.employee_id = e.id)
       WHERE eam.team_id = $1`,
      [id]
    );

    // Fetch tasks assigned to this group — STRICTLY by group_id or group_name only.
    // Never by project_id alone; that would pull tasks from unrelated projects that happen to share the same project_id.
    const tasksRes = await pool.query(
      `SELECT 
        t.id, t.title, t.description, t.status, t.priority, t.progress_percent,
        t.module_name, t.deliverable_type, t.due_date, t.start_date, t.task_weightage,
        t.repository_url, 
        COALESCE(t.assigned_to, t.assigned_to_employee_id) as assigned_to,
        COALESCE(t.assigned_to_employee_id, t.assigned_to) as assigned_to_employee_id,
        COALESCE(ea.name, t.assigned_to_name) as assigned_to_name,
        t.assigned_by, t.assigned_by_id, t.review_target_date, t.completion_note
       FROM tasks t
       LEFT JOIN employees ea ON (t.assigned_to = ea.emp_code OR t.assigned_to = ea.id OR t.assigned_to_employee_id = ea.emp_code OR t.assigned_to_employee_id = ea.id)
       WHERE t.group_id = $1 OR (t.group_name = $2 AND (t.project_id = $3 OR t.project_id IS NULL))
       ORDER BY t.created_at ASC`,
      [id, group.name, group.project_id]
    );

    const tasks = tasksRes.rows;

    // Calculate member individual progress and assigned modules
    const enrichedMembers = membersRes.rows.map(m => {
      const memberTasks = tasks.filter(t => 
        t.assigned_to === m.employee_id || 
        t.assigned_to_employee_id === m.employee_id ||
        (m.name && t.assigned_to === m.name) ||
        (m.name && t.assigned_to_name === m.name)
      );
      const memberModules = eamRes.rows.filter(e => e.employee_id === m.employee_id);
      const avgProgress = memberTasks.length > 0
        ? Math.round(memberTasks.reduce((acc, t) => acc + Number(t.progress_percent || 0), 0) / memberTasks.length)
        : (memberModules[0]?.progress || 0);

      return {
        ...m,
        assigned_modules: memberModules.map(mod => mod.module_name).join(', ') || (memberTasks[0]?.module_name || 'General'),
        assigned_module_list: memberModules,
        progress: avgProgress,
        task_count: memberTasks.length
      };
    });

    // Build Module Responsibilities map
    const moduleMap = {};
    eamRes.rows.forEach(em => {
      moduleMap[em.module_name] = {
        module_name: em.module_name,
        assigned_to_id: em.employee_id,
        assigned_to_name: em.employee_name || em.employee_id,
        assigned_by_id: group.team_head_id,
        assigned_by_name: group.team_head_name,
        role: em.role
      };
    });

    // Include modules discovered in tasks
    tasks.forEach(t => {
      if (t.module_name && !moduleMap[t.module_name]) {
        moduleMap[t.module_name] = {
          module_name: t.module_name,
          assigned_to_id: t.assigned_to,
          assigned_to_name: t.assigned_to_name,
          assigned_by_id: t.assigned_by_id || group.team_head_id,
          assigned_by_name: t.assigned_by || group.team_head_name,
          role: 'Member'
        };
      }
    });

    const moduleResponsibilities = Object.values(moduleMap).map(mod => {
      const modTasks = tasks.filter(t => t.module_name?.toLowerCase() === mod.module_name?.toLowerCase());
      const avgProgress = modTasks.length > 0
        ? Math.round(modTasks.reduce((acc, t) => acc + Number(t.progress_percent || 0), 0) / modTasks.length)
        : 0;
      const status = avgProgress === 100 ? 'Completed' : avgProgress > 0 ? 'In Progress' : 'Pending';

      return {
        ...mod,
        progress: avgProgress,
        status,
        task_count: modTasks.length
      };
    });

    // Calculate true overall project progress
    const overallProgress = tasks.length > 0
      ? Math.round(tasks.reduce((acc, t) => acc + Number(t.progress_percent || 0), 0) / tasks.length)
      : 0;

    // Parse project documents
    let documents = [];
    if (group.requirement_documents && Array.isArray(group.requirement_documents)) {
      documents = group.requirement_documents;
    }

    res.json({
      success: true,
      data: {
        ...group,
        overall_progress: overallProgress,
        repository_url: group.repository_url || null,
        project: {
          id: group.project_id,
          name: group.project_name,
          code: group.project_code,
          description: group.project_description,
          start_date: group.project_start_date,
          deadline: group.project_deadline,
          status: group.project_status,
          overall_progress: overallProgress,
          documents: documents,
          repository_url: group.repository_url || null
        },
        team_head: {
          id: group.team_head_id,
          emp_code: group.team_head_emp_code || group.team_head_id,
          name: group.team_head_name,
          designation: group.team_head_designation,
          department: group.team_head_department
        },
        members: enrichedMembers,
        memberCount: enrichedMembers.length,
        module_responsibilities: moduleResponsibilities,
        tasks: tasks,
        taskCount: tasks.length,
        documents: documents
      }
    });
  } catch (err) {
    console.error('Error fetching single group:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/groups/:id/member-progress — Assign or update module progress for a group member directly to DB
router.patch('/:id/member-progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, progressPercent, moduleName, progressNote } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId is required.' });
    }

    const progress = Math.max(0, Math.min(100, parseInt(progressPercent, 10) || 0));

    // 1. Fetch group and linked project
    const groupRes = await pool.query(
      `SELECT g.*, p.name as project_name, COALESCE(p.end_date, CURRENT_DATE + INTERVAL '14 days') as project_deadline, p.repository_url as project_repo_url
       FROM project_groups g
       LEFT JOIN projects p ON (g.project_id = p.id OR g.project_id = p.code)
       WHERE g.id = $1`,
      [id]
    );

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }
    const group = groupRes.rows[0];

    // 2. Resolve employee
    const empRes = await pool.query(
      `SELECT emp_code, id, name, designation, department 
       FROM employees 
       WHERE (emp_code = $1 OR id = $1)
       LIMIT 1`,
      [employeeId]
    );
    const emp = empRes.rows[0] || {
      emp_code: employeeId,
      id: employeeId,
      name: employeeId === 'EMP-005' ? 'Vishnu Vardhan' : 'Assigned Employee',
      designation: 'Specialist',
      department: 'Engineering'
    };
    const empCode = emp.emp_code || emp.id || employeeId;
    const empName = emp.name;

    // 3. Check for existing task under this group for this employee
    const taskRes = await pool.query(
      `SELECT id, title, progress_percent, status 
       FROM tasks 
       WHERE (group_id = $1 OR group_name = $2 OR project_id = $3)
         AND (assigned_to = $4 OR assigned_to_employee_id = $4 OR assigned_to = $5 OR assigned_to_name = $5)
       ORDER BY created_at ASC
       LIMIT 1`,
      [id, group.name, group.project_id, empCode, empName]
    );

    let activeTaskId = null;
    let taskStatus = progress === 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'PENDING';

    if (taskRes.rows.length > 0) {
      // Update existing task
      activeTaskId = taskRes.rows[0].id;
      await pool.query(
        `UPDATE tasks 
         SET progress_percent = $1,
             status = $2,
             completion_note = COALESCE($3, completion_note),
             completed_at = CASE WHEN $1 = 100 THEN CURRENT_TIMESTAMP ELSE NULL END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [progress, taskStatus, progressNote || null, activeTaskId]
      );
    } else {
      // Create new deliverable task directly in database
      activeTaskId = `TSK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const assignedMod = moduleName || 'General';
      const taskTitle = `${group.name} — ${assignedMod} Deliverables`;
      const taskDesc = `Core module deliverables for ${assignedMod} assigned to ${empName}`;
      const defaultDue = group.project_deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      const repoUrl = group.repository_url || group.project_repo_url || 'https://github.com/enterprise/crm-hrms-core';

      await pool.query(
        `INSERT INTO tasks (
          id, title, description, project_id, project_name, group_id, group_name,
          assigned_to, assigned_to_employee_id, assigned_to_name,
          assigned_by, assigned_by_id,
          module_name, deliverable_type,
          progress_percent, status, priority,
          start_date, due_date, review_target_date,
          task_weightage, repository_url,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $8, $9,
          $10, $11,
          $12, 'Code Implementation & Review',
          $13, $14, 'HIGH',
          CURRENT_DATE, $15, $15,
          25.0, $16,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`,
        [
          activeTaskId,
          taskTitle,
          taskDesc,
          group.project_id || 'PRJ-GEN',
          group.project_name || group.name,
          id,
          group.name,
          empCode,
          empName,
          group.team_head_name || 'Team Head',
          group.team_head_id || 'ADM-001',
          assignedMod,
          progress,
          taskStatus,
          defaultDue,
          repoUrl
        ]
      );

      // Insert into task_member_assignments
      const tmaId = `TMA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await pool.query(
        `INSERT INTO task_member_assignments (
          id, task_id, group_id, employee_id, employee_name, role, is_team_head,
          employee_status, employee_progress, assigned_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING`,
        [
          tmaId,
          activeTaskId,
          id,
          empCode,
          empName,
          empCode === group.team_head_id ? 'Team Head' : 'Member',
          empCode === group.team_head_id,
          taskStatus,
          progress
        ]
      );
    }

    // 4. Update task_member_assignments progress
    if (activeTaskId) {
      await pool.query(
        `UPDATE task_member_assignments
         SET employee_progress = $1, employee_status = $2, updated_at = CURRENT_TIMESTAMP
         WHERE task_id = $3 AND (employee_id = $4 OR employee_id = $5)`,
        [progress, taskStatus, activeTaskId, empCode, emp.id]
      );
    }

    // 5. Update or insert into employee_assigned_modules
    try {
      const modName = (moduleName && moduleName.trim()) || 'General';
      const cleanCode = modName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'general';
      
      let modRes = await pool.query(
        `SELECT id, code, name FROM modules WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($2) OR id = $3 LIMIT 1`,
        [modName, cleanCode, `MOD-${cleanCode.toUpperCase()}`]
      );

      let mod = modRes.rows[0];
      if (!mod) {
        const newModId = `MOD-${cleanCode.toUpperCase()}`;
        const insertMod = await pool.query(
          `INSERT INTO modules (id, code, name, category, status, description, created_at, updated_at)
           VALUES ($1, $2, $3, 'Custom', 'active', $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (code) DO UPDATE SET status = 'active'
           RETURNING id, code, name`,
          [newModId, cleanCode, modName, `Module: ${modName}`]
        );
        mod = insertMod.rows[0];
      }

      if (mod) {
        const eamId = `EAM-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        await pool.query(
          `INSERT INTO employee_assigned_modules (id, employee_id, module_id, module_name, team_id, role, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'Member', CURRENT_TIMESTAMP)
           ON CONFLICT (employee_id, module_id)
           DO UPDATE SET module_name = EXCLUDED.module_name, team_id = EXCLUDED.team_id, updated_at = CURRENT_TIMESTAMP`,
          [eamId, empCode, mod.id, mod.name, id]
        );
      }
    } catch (eamErr) {
      console.warn('employee_assigned_modules sync warning:', eamErr.message);
    }

    // 6. Recalculate group overall progress across all tasks — STRICT group match only
    const overallRes = await pool.query(
      `SELECT ROUND(AVG(COALESCE(progress_percent, 0))) as overall_progress
       FROM tasks
       WHERE group_id = $1 OR (group_name = $2 AND (project_id = $3 OR project_id IS NULL))`,
      [id, group.name, group.project_id]
    );
    const overallProgress = Number(overallRes.rows[0]?.overall_progress || progress);

    // Update project progress if project exists
    if (group.project_id) {
      await pool.query(
        `UPDATE projects 
         SET overall_progress = $1,
             status = CASE WHEN $1 = 100 THEN 'Completed' WHEN $1 > 0 THEN 'In Progress' ELSE status END
         WHERE id = $2 OR code = $2`,
        [overallProgress, group.project_id]
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: `Progress updated to ${progress}% and saved to database.`,
      data: {
        taskId: activeTaskId,
        employeeId: empCode,
        progressPercent: progress,
        status: taskStatus,
        overallProgress: overallProgress
      }
    });
  } catch (err) {
    console.error('Error updating member group progress:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/groups — Create new project group
router.post('/', async (req, res) => {
  try {
    const { name, projectId, teamHeadId, teamHeadName, description, members = [] } = req.body;
    if (!name || !projectId || !teamHeadId) {
      return res.status(400).json({ success: false, message: 'Group name, projectId, and teamHeadId are required.' });
    }

    const groupId = `GRP-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Resolve team head name if not provided
    let headName = teamHeadName;
    if (!headName) {
      const empRes = await pool.query(
        `SELECT name FROM employees 
         WHERE (emp_code = $1 OR id = $1) AND (status IS NULL OR status NOT IN ('Exited', 'Terminated', 'Inactive')) 
         LIMIT 1`,
        [teamHeadId]
      );
      headName = empRes.rows[0]?.name || 'Team Head';
    }

    await pool.query(
      `INSERT INTO project_groups (id, name, project_id, team_head_id, team_head_name, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [groupId, name.trim(), projectId, teamHeadId, headName, description || null]
    );

    // Insert members (only active HRMS employees)
    const allMembers = Array.isArray(members) ? [...members] : [];
    if (!allMembers.some(m => (typeof m === 'string' ? m : m.employeeId) === teamHeadId)) {
      allMembers.unshift({ employeeId: teamHeadId, role: 'Team Head' });
    }

    const seenIds = new Set();
    for (let i = 0; i < allMembers.length; i++) {
      const m = allMembers[i];
      const empId = typeof m === 'string' ? m : m.employeeId;
      if (!empId) continue;
      const normId = String(empId).trim().toLowerCase();
      if (seenIds.has(normId)) continue;

      const empRes = await pool.query(
        `SELECT emp_code, id, name, designation, department FROM employees 
         WHERE (emp_code = $1 OR id = $1) 
           AND (status IS NULL OR status NOT IN ('Exited', 'Terminated', 'Inactive'))
           AND emp_code NOT IN ('ADMIN-001', 'EMP-000')
           AND id NOT IN ('ADMIN-001', 'EMP-000')
           AND LOWER(COALESCE(department, '')) NOT IN ('administration', 'management')
         LIMIT 1`,
        [empId]
      );
      if (empRes.rows.length === 0) continue; // Skip non-HRMS or inactive employees

      seenIds.add(normId);
      const activeEmp = empRes.rows[0];
      const role = typeof m === 'string' ? (empId === teamHeadId ? 'Team Head' : 'Member') : (m.role || 'Member');
      const memberId = `GM-${groupId.substring(0, 20)}-${String(activeEmp.emp_code || activeEmp.id).substring(0, 15)}-${i}`;

      await pool.query(
        `INSERT INTO group_members (id, group_id, employee_id, employee_name, role, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO NOTHING`,
        [memberId, groupId, activeEmp.emp_code || activeEmp.id, activeEmp.name, role]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { id: groupId, name, projectId, teamHeadId, teamHeadName: headName }
    });
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/groups/:id — Update project group (active HRMS employees only, deduplicated)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, teamHeadId, teamHeadName, members, repositoryUrl } = req.body;

    // 1. Check if group exists
    const groupRes = await pool.query('SELECT * FROM project_groups WHERE id = $1', [id]);
    if (groupRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    const currentGroup = groupRes.rows[0];

    // 2. Resolve team head from active HRMS employees
    let newHeadId = (teamHeadId || currentGroup.team_head_id || '').trim();
    let newHeadName = (teamHeadName || '').trim();

    const headRes = await pool.query(
      `SELECT emp_code, id, name FROM employees 
       WHERE (emp_code = $1 OR id = $1) AND (status IS NULL OR status NOT IN ('Exited', 'Terminated', 'Inactive')) 
       LIMIT 1`,
      [newHeadId]
    );
    if (headRes.rows.length > 0) {
      newHeadId = headRes.rows[0].emp_code || headRes.rows[0].id;
      newHeadName = headRes.rows[0].name;
    } else if (!newHeadName) {
      newHeadName = currentGroup.team_head_name;
    }

    const newName = name ? name.trim() : currentGroup.name;
    const newDescription = description !== undefined ? description : currentGroup.description;

    // 3. Update project_groups record
    const repoInput = req.body.repositoryUrl !== undefined ? req.body.repositoryUrl : req.body.repository_url;
    const newRepoUrl = repoInput !== undefined ? (repoInput ? repoInput.trim() : null) : undefined;
    if (newRepoUrl !== undefined) {
      await pool.query(
        `UPDATE project_groups 
         SET name = $1, description = $2, team_head_id = $3, team_head_name = $4, repository_url = $5
         WHERE id = $6`,
        [newName, newDescription, newHeadId, newHeadName, newRepoUrl, id]
      );
      // Also sync repository_url to master projects table if project_id exists
      if (currentGroup.project_id) {
        try {
          await pool.query(
            `UPDATE projects SET repository_url = $1 WHERE id = $2 OR code = $2`,
            [newRepoUrl, currentGroup.project_id]
          );
        } catch (pErr) {
          console.warn('Could not sync repository_url to projects table:', pErr.message);
        }
      }
    } else {
      await pool.query(
        `UPDATE project_groups 
         SET name = $1, description = $2, team_head_id = $3, team_head_name = $4
         WHERE id = $5`,
        [newName, newDescription, newHeadId, newHeadName, id]
      );
    }

    // 4. Update members if provided (strictly active HRMS employees & deduplicated)
    if (Array.isArray(members)) {
      await pool.query('DELETE FROM group_members WHERE group_id = $1', [id]);

      const allMembers = [...members];
      const hasHead = allMembers.some(m => {
        const empId = typeof m === 'string' ? m : (m.employeeId || m.employee_id);
        return String(empId).trim().toLowerCase() === String(newHeadId).trim().toLowerCase();
      });

      if (!hasHead && newHeadId) {
        allMembers.unshift({ employeeId: newHeadId, role: 'Team Head' });
      }

      const seenIds = new Set();
      for (let i = 0; i < allMembers.length; i++) {
        const m = allMembers[i];
        const empId = typeof m === 'string' ? m : (m.employeeId || m.employee_id);
        if (!empId) continue;
        const normId = String(empId).trim().toLowerCase();
        if (seenIds.has(normId)) continue; // Skip duplicates

        const empRes = await pool.query(
          `SELECT emp_code, id, name, designation, department FROM employees 
           WHERE (emp_code = $1 OR id = $1) 
             AND (status IS NULL OR status NOT IN ('Exited', 'Terminated', 'Inactive'))
             AND emp_code NOT IN ('ADMIN-001', 'EMP-000')
             AND id NOT IN ('ADMIN-001', 'EMP-000')
             AND LOWER(COALESCE(department, '')) NOT IN ('administration', 'management')
           LIMIT 1`,
          [empId]
        );
        if (empRes.rows.length === 0) continue; // Skip non-HRMS / inactive / admin accounts

        seenIds.add(normId);
        const activeEmp = empRes.rows[0];
        const finalEmpCode = activeEmp.emp_code || activeEmp.id;
        const isLead = String(finalEmpCode).trim().toLowerCase() === String(newHeadId).trim().toLowerCase();
        let role = typeof m === 'string' ? (isLead ? 'Team Head' : 'Member') : (m.role || (isLead ? 'Team Head' : 'Member'));
        if (isLead) role = 'Team Head';

        const memberId = `GM-${id.substring(0, 20)}-${String(finalEmpCode).substring(0, 15)}-${i}`;

        await pool.query(
          `INSERT INTO group_members (id, group_id, employee_id, employee_name, role, created_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET employee_name = EXCLUDED.employee_name, role = EXCLUDED.role`,
          [memberId, id, finalEmpCode, activeEmp.name, role]
        );
      }
    } else if (teamHeadId && teamHeadId !== currentGroup.team_head_id) {
      await pool.query(
        `UPDATE group_members SET role = 'Member' WHERE group_id = $1 AND role = 'Team Head'`,
        [id]
      );
      await pool.query(
        `UPDATE group_members SET role = 'Team Head' WHERE group_id = $1 AND (employee_id = $2 OR employee_id = (SELECT emp_code FROM employees WHERE id = $2 LIMIT 1))`,
        [id, newHeadId]
      );
    }

    // 5. Query updated group with all active members
    const updatedRes = await pool.query(
      `SELECT 
        g.id,
        g.name,
        g.project_id,
        g.team_head_id,
        COALESCE(th.name, g.team_head_name) as team_head_name,
        g.description,
        g.created_at,
        g.repository_url,
        p.name as project_name,
        p.code as project_code,
        COALESCE(
          json_agg(
            json_build_object(
              'id', gm.id,
              'employeeId', gm.employee_id,
              'employee_id', gm.employee_id,
              'name', gm.employee_name,
              'employeeName', gm.employee_name,
              'designation', COALESCE(gm.designation, 'Specialist'),
              'department', COALESCE(gm.department, 'Engineering'),
              'role', gm.role,
              'isTeamHead', (gm.employee_id = g.team_head_id)
            )
          ) FILTER (WHERE gm.id IS NOT NULL), '[]'::json
        ) as members
      FROM project_groups g
      LEFT JOIN projects p ON (g.project_id = p.id OR g.project_id = p.code)
      LEFT JOIN employees th ON (g.team_head_id = th.emp_code OR g.team_head_id = th.id)
      LEFT JOIN (
        SELECT DISTINCT ON (gm.group_id, gm.employee_id)
          gm.id,
          gm.group_id,
          gm.employee_id,
          gm.role,
          e.name as employee_name,
          e.designation,
          e.department,
          gm.created_at
        FROM group_members gm
        INNER JOIN employees e ON (gm.employee_id = e.emp_code OR gm.employee_id = e.id)
        WHERE (e.status IS NULL OR e.status NOT IN ('Exited', 'Terminated', 'Inactive'))
        ORDER BY gm.group_id, gm.employee_id, gm.created_at DESC
      ) gm ON g.id = gm.group_id
      WHERE g.id = $1
      GROUP BY g.id, g.name, g.project_id, g.team_head_id, g.team_head_name, th.name, g.description, g.created_at, g.repository_url, p.name, p.code, p.repository_url`,
      [id]
    );

    const updatedGroup = updatedRes.rows[0];
    res.json({
      success: true,
      message: 'Group updated successfully',
      data: updatedGroup
    });
  } catch (err) {
    console.error('Error updating group:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/groups/:id — Permanently delete group and clean up members and assignments from database
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    const check = await client.query('SELECT id, name FROM project_groups WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Clean up members and assignments
    await client.query('DELETE FROM group_members WHERE group_id = $1', [id]);
    await client.query('DELETE FROM task_member_assignments WHERE group_id = $1', [id]);
    await client.query('UPDATE tasks SET group_id = NULL, group_name = NULL WHERE group_id = $1', [id]);
    await client.query('DELETE FROM project_groups WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Group "${check.rows[0].name}" permanently deleted from database`,
      id
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting group:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

export default router;

