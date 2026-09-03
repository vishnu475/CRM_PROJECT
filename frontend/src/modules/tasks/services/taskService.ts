import { TaskItem, TaskAnalytics, EmployeeTaskPerformance, AIAssistantInsight } from '../types';

export const taskApiService = {
  // Fetch all tasks with optional filters
  async getTasks(filters: Record<string, string> = {}): Promise<TaskItem[]> {
    const params = new URLSearchParams(filters);
    const res = await fetch(`/api/tasks?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch tasks');
    return json.data || [];
  },

  // Fetch current employee's tasks
  async getMyTasks(employeeId?: string): Promise<TaskItem[]> {
    const headers: Record<string, string> = {};
    if (employeeId) headers['x-employee-id'] = employeeId;
    const res = await fetch('/api/tasks/my', { headers });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch my tasks');
    return json.data || [];
  },

  // Fetch single task details
  async getTaskById(taskId: string): Promise<TaskItem> {
    const res = await fetch(`/api/tasks/${taskId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch task');
    return json.data;
  },

  // Create & Assign Task
  async createTask(taskData: any): Promise<TaskItem> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create task');
    return json.data;
  },

  // Start Task
  async startTask(taskId: string, employeeId?: string): Promise<TaskItem> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (employeeId) headers['x-employee-id'] = employeeId;
    const res = await fetch(`/api/tasks/${taskId}/start`, { method: 'POST', headers });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to start task');
    return json.data;
  },

  // Update Progress
  async updateProgress(taskId: string, payload: { progressPercent: number; progressNote?: string; status?: string }, employeeId?: string): Promise<TaskItem> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (employeeId) headers['x-employee-id'] = employeeId;
    const res = await fetch(`/api/tasks/${taskId}/progress`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update progress');
    return json.data;
  },

  // Submit Task for Review
  async submitForReview(taskId: string, payload: { completionNote?: string; actualHours?: number }, employeeId?: string): Promise<TaskItem> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (employeeId) headers['x-employee-id'] = employeeId;
    const res = await fetch(`/api/tasks/${taskId}/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to submit task');
    return json.data;
  },

  // Approve & Complete Task
  async approveTask(taskId: string, payload: { managerFeedback?: string; actualHours?: number }): Promise<TaskItem> {
    const res = await fetch(`/api/tasks/${taskId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to approve task');
    return json.data;
  },

  // Reopen Task
  async reopenTask(taskId: string, payload: { managerFeedback: string }): Promise<TaskItem> {
    const res = await fetch(`/api/tasks/${taskId}/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to reopen task');
    return json.data;
  },

  // Reassign Task
  async reassignTask(taskId: string, payload: { newAssigneeId: string; reason?: string }): Promise<TaskItem> {
    const res = await fetch(`/api/tasks/${taskId}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to reassign task');
    return json.data;
  },

  // Add Comment
  async addComment(taskId: string, comment: string): Promise<any> {
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to post comment');
    return json.data;
  },

  // Get Analytics & Workload
  async getAnalytics(department?: string): Promise<TaskAnalytics> {
    const url = department && department !== 'ALL' ? `/api/tasks/analytics?department=${encodeURIComponent(department)}` : '/api/tasks/analytics';
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch analytics');
    return json.data;
  },

  // Get Dynamic Employee Performance
  async getEmployeePerformance(employeeId: string): Promise<EmployeeTaskPerformance> {
    const res = await fetch(`/api/tasks/employee/${employeeId}/analytics`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch employee performance');
    return json.data;
  },

  // AI Assistant Copilot
  async getAIAssistant(context: { taskId?: string; employeeId?: string } = {}): Promise<AIAssistantInsight> {
    const res = await fetch('/api/tasks/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to get AI insights');
    return json.data;
  },

  // AI Task Work Order Auto-Plan
  async generateAITaskPlan(params: { title: string; department?: string; category?: string; projectName?: string; moduleName?: string }): Promise<any> {
    const res = await fetch('/api/tasks/ai/auto-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to auto-plan task with AI');
    return json.data;
  }
};
