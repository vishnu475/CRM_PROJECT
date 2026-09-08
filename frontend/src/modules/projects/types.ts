export interface ProjectMember {
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  avatar?: string;
  taskCount: number;
  completedTasks: number;
}

export interface ProjectTaskItem {
  id: string;
  title: string;
  description?: string;
  projectName: string;
  assignedTo: string;
  employeeName: string;
  employeeCode?: string;
  employeeDesignation?: string;
  department?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | string;
  progressPercent: number;
  startDate?: string | null;
  dueDate?: string | null;
  createdAt?: string;
  isOverdue?: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  client: string;
  status: 'In Progress' | 'Completed' | 'Planning' | 'On Hold';
  budget?: number;
  progress: number;
  startDate: string;
  dueDate: string;
  members: ProjectMember[];
  tasks: ProjectTaskItem[];
  totalTasks: number;
  completedTasks: number;
}
