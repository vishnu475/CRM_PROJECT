import express from 'express';
import fs from 'fs';
import path from 'path';
import { TaskService } from '../services/taskService.js';

const router = express.Router();

// Helper: Extract authenticated user from request
function getAuthUser(req) {
  const tokenEmpId = req.user?.empCode || req.user?.id;
  const headerEmpId = req.headers['x-employee-id'];
  const empId = headerEmpId || tokenEmpId || 'EMP-006';

  const role = req.user?.role || req.headers['x-user-role'] || (req.headers['x-employee-id'] ? 'Employee' : 'Admin');
  return {
    id: empId,
    empCode: empId,
    name: req.user?.name || req.headers['x-user-name'] || 'User',
    role: role,
    isEmployeeOnly: role === 'Employee' || role === 'EMPLOYEE'
  };
}

// 1. GET /api/tasks — List all tasks with filters & role scoping
router.get('/', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const tasks = await TaskService.getAllTasks(req.query, user);
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. GET /api/tasks/my and /api/tasks/my-tasks — Current employee's own assigned tasks
router.get('/my', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const tasks = await TaskService.getAllTasks({ employeeId: user.empCode }, { ...user, isEmployeeOnly: true });
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my-tasks', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const tasks = await TaskService.getAllTasks({ employeeId: user.empCode }, { ...user, isEmployeeOnly: true });
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. GET /api/tasks/analytics — Org-level KPIs & Workload
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await TaskService.getTaskAnalytics(req.query);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. GET /api/tasks/employee/:employeeId/analytics — Real dynamically calculated performance
router.get('/employee/:employeeId/analytics', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const user = getAuthUser(req);

    // Employee cannot view other employees' performance (IDOR protection)
    if (user.isEmployeeOnly && user.empCode !== employeeId && user.id !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are only authorized to view your own performance analytics.'
      });
    }

    const performance = await TaskService.getEmployeePerformanceMetrics(employeeId);
    res.json({ success: true, data: performance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. GET /api/tasks/department/:departmentId/analytics
router.get('/department/:departmentId/analytics', async (req, res) => {
  try {
    const { departmentId } = req.params;
    const analytics = await TaskService.getTaskAnalytics({ department: departmentId });
    res.json({ success: true, department: departmentId, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. AI Copilot Advisory Insights (GET & POST)
router.get('/ai/insights', async (req, res) => {
  try {
    const insights = await TaskService.getAIAssistantInsights(req.query);
    res.json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ai-assistant', async (req, res) => {
  try {
    const insights = await TaskService.getAIAssistantInsights(req.body);
    res.json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ai/auto-plan', async (req, res) => {
  try {
    const plan = await TaskService.generateAITaskPlan(req.body);
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. GET /api/tasks/:id — Single task with activity history and comments
router.get('/:id', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const task = await TaskService.getTaskById(req.params.id, user);
    res.json({ success: true, data: task });
  } catch (err) {
    const status = err.message.includes('Access denied') ? 403 : 404;
    res.status(status).json({ success: false, message: err.message });
  }
});

// 8. POST /api/tasks — Create and assign new task
router.post('/', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const assignedTarget = req.body.assignedTo || req.body.assigned_to || req.body.employeeId;
    const isSelfAssignment = Array.isArray(assignedTarget) 
      ? (assignedTarget.length === 1 && (assignedTarget[0] === user.empCode || assignedTarget[0] === user.id))
      : (assignedTarget === user.empCode || assignedTarget === user.id);

    if (user.isEmployeeOnly && !isSelfAssignment && user.role !== 'Admin' && user.role !== 'Manager' && user.role !== 'HR') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Employees cannot create/assign tasks to other employees.'
      });
    }
    const newTask = await TaskService.createTask(req.body, user);
    res.status(201).json({ success: true, message: 'Task assigned and saved to database successfully.', data: newTask });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 9. POST /api/tasks/:id/start — Employee starts task
router.post('/:id/start', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const updated = await TaskService.startTask(req.params.id, user.empCode);
    res.json({ success: true, message: 'Task started successfully.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 10. PATCH /api/tasks/:id/progress — Employee updates task progress
router.patch('/:id/progress', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const { progressPercent, progressNote, status } = req.body;
    const updated = await TaskService.updateProgress(req.params.id, user.empCode, { progressPercent, progressNote, status });
    res.json({ success: true, message: 'Progress updated successfully.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 11. POST /api/tasks/:id/submit — Employee submits task for review
router.post('/:id/submit', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const { completionNote, actualHours } = req.body;
    const updated = await TaskService.submitForReview(req.params.id, user.empCode, { completionNote, actualHours });
    res.json({ success: true, message: 'Task submitted for manager review.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 12. POST /api/tasks/:id/approve — Admin / Manager approves task
router.post('/:id/approve', async (req, res) => {
  try {
    const user = getAuthUser(req);
    if (user.isEmployeeOnly) {
      return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot approve tasks.' });
    }
    const { managerFeedback, actualHours } = req.body;
    const updated = await TaskService.approveTask(req.params.id, user, { managerFeedback, actualHours });
    res.json({ success: true, message: 'Task approved and marked completed.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 13. POST /api/tasks/:id/reopen — Admin / Manager reopens task / requests changes
router.post('/:id/reopen', async (req, res) => {
  try {
    const user = getAuthUser(req);
    if (user.isEmployeeOnly) {
      return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot reopen tasks.' });
    }
    const managerFeedback = req.body.managerFeedback || req.body.reason || 'Please address feedback and resubmit.';
    const updated = await TaskService.reopenTask(req.params.id, user, { managerFeedback });
    res.json({ success: true, message: 'Task reopened with changes requested.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 14. POST /api/tasks/:id/reassign — Admin / Manager reassigns task
router.post('/:id/reassign', async (req, res) => {
  try {
    const user = getAuthUser(req);
    if (user.isEmployeeOnly) {
      return res.status(403).json({ success: false, message: 'Forbidden: Employees cannot reassign tasks.' });
    }
    const newAssigneeId = req.body.newAssigneeId || req.body.newAssignedTo || req.body.assigned_to;
    const reason = req.body.reason || 'Workload rebalancing';
    const updated = await TaskService.reassignTask(req.params.id, user, { newAssigneeId, reason });
    res.json({ success: true, message: 'Task reassigned successfully.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 15. POST /api/tasks/:id/comments — Add comment to task
router.post('/:id/comments', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const { comment } = req.body;
    const newComment = await TaskService.addComment(req.params.id, user, comment);
    res.status(201).json({ success: true, message: 'Comment posted.', data: newComment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 16. GET /api/tasks/:id/activity & /api/tasks/:id/activities — Task audit activity history
router.get('/:id/activity', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const task = await TaskService.getTaskById(req.params.id, user);
    res.json({ success: true, data: task.activities || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 17. GET /api/tasks/attachment/:filename — Direct attachment file stream
router.get('/attachment/:filename', (req, res) => {
  const filename = req.params.filename;
  const uploadsDir = path.join(process.cwd(), 'uploads', 'tasks');
  const filePath = path.join(uploadsDir, filename);

  if (fs.existsSync(filePath)) {
    const isPdf = filename.toLowerCase().endsWith('.pdf');
    res.setHeader('Content-Type', isPdf ? 'application/pdf' : 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.sendFile(filePath);
  }
  res.status(404).json({ success: false, message: 'Attachment not found.' });
});

router.get('/attachments/:filename', (req, res) => {
  const filename = req.params.filename;
  const uploadsDir = path.join(process.cwd(), 'uploads', 'tasks');
  const filePath = path.join(uploadsDir, filename);

  if (fs.existsSync(filePath)) {
    const isPdf = filename.toLowerCase().endsWith('.pdf');
    res.setHeader('Content-Type', isPdf ? 'application/pdf' : 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.sendFile(filePath);
  }
  res.status(404).json({ success: false, message: 'Attachment not found.' });
});

export default router;
