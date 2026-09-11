import { TaskItem, TaskAnalytics, EmployeeTaskPerformance, AIAssistantInsight, ProjectGroup } from '../types';

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

  // Fetch project groups with roster (supports employeeId filter for employee persona)
  async getGroups(projectId?: string, employeeId?: string): Promise<ProjectGroup[]> {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (employeeId) params.append('employeeId', employeeId);
    const url = params.toString() ? `/api/groups?${params.toString()}` : '/api/groups';
    const headers: Record<string, string> = {};
    if (employeeId) headers['x-employee-id'] = employeeId;
    const res = await fetch(url, { headers });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch groups');
    return json.data || [];
  },

  // Fetch single group
  async getGroupById(groupId: string, employeeId?: string): Promise<ProjectGroup> {
    const headers: Record<string, string> = {};
    if (employeeId) headers['x-employee-id'] = employeeId;
    const res = await fetch(`/api/groups/${groupId}`, { headers });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch group');
    return json.data;
  },

  // Update project group (team head, roster members, team count, name, description)
  async updateGroup(
    groupId: string,
    data: {
      name?: string;
      description?: string;
      teamHeadId?: string;
      teamHeadName?: string;
      members?: Array<{ employeeId: string; role?: string; name?: string } | string>;
      repositoryUrl?: string;
      repository_url?: string;
    }
  ): Promise<ProjectGroup> {
    const res = await fetch(`/api/groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update group');
    return json.data;
  },

  // Fetch project workspace with calculated progress and tasks
  async getProjectWorkspace(projectId: string): Promise<any> {
    const res = await fetch(`/api/projects/${projectId}/workspace`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch project workspace');
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
  async updateProgress(
    taskId: string,
    payload: {
      progressPercent: number;
      progressNote?: string;
      status?: string;
      targetEmployeeId?: string;
      assignedTo?: string;
      employeeId?: string;
    },
    employeeId?: string
  ): Promise<TaskItem> {
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
  async submitForReview(taskId: string, payload: { completionNote?: string; actualHours?: number; videoUrl?: string; referenceLink?: string; deliverableLink?: string }, employeeId?: string): Promise<TaskItem> {
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

  // Fetch tasks ready for review (Admin view)
  async getReviewTasks(): Promise<TaskItem[]> {
    const res = await fetch('/api/tasks/review');
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch review tasks');
    return json.data || [];
  },

  // Fetch completed tasks
  async getCompletedTasks(): Promise<TaskItem[]> {
    const res = await fetch('/api/tasks/completed');
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch completed tasks');
    return json.data || [];
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

  // Add Comment (Supports reply and projectId)
  async addComment(taskId: string, commentPayload: string | { comment: string; parentCommentId?: string; projectId?: string }): Promise<any> {
    const payload = typeof commentPayload === 'string' ? { comment: commentPayload } : commentPayload;
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to post comment');
    return json.data;
  },

  // Get Task Comments
  async getComments(taskId: string, projectId?: string): Promise<any[]> {
    const url = projectId ? `/api/tasks/${taskId}/comments?projectId=${encodeURIComponent(projectId)}` : `/api/tasks/${taskId}/comments`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch comments');
    return json.data || [];
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
  },

  // Search active modules dynamically from database
  async searchModules(query: string): Promise<Array<{ id: string; code: string; name: string; category?: string }>> {
    if (!query || !query.trim()) return [];
    const res = await fetch(`/api/modules?search=${encodeURIComponent(query.trim())}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to search modules');
    return json.data || [];
  },

  // Fetch modules assigned to an employee
  async getEmployeeModules(employeeId: string): Promise<Array<{ id: string; code: string; name: string; category?: string }>> {
    if (!employeeId) return [];
    const res = await fetch(`/api/modules/employee/${encodeURIComponent(employeeId)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch employee modules');
    return json.data || [];
  },

  // Save/Assign module IDs against an employee ID with Team ID and Role
  async assignEmployeeModules(employeeId: string, moduleIds: string[], teamId?: string, role?: string): Promise<any> {
    const res = await fetch(`/api/modules/employee/${encodeURIComponent(employeeId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleIds, teamId, role })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to assign modules');
    return json;
  },

  // Fetch HRMS employee by ID or Code directly from HRMS database API
  async getEmployeeById(employeeId: string): Promise<any> {
    if (!employeeId || !employeeId.trim()) return null;
    const res = await fetch(`/api/employees/${encodeURIComponent(employeeId.trim())}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Employee not found');
    return json.data;
  },

  // Fetch all assigned modules for group members
  async getGroupModules(groupId: string): Promise<Record<string, Array<{ id: string; code: string; name: string; category?: string }>>> {
    if (!groupId) return {};
    const res = await fetch(`/api/modules/group/${encodeURIComponent(groupId)}`);
    const json = await res.json();
    if (!json.success) return {};
    return json.data || {};
  }
};

