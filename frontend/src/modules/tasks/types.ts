export type TaskStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REOPENED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskActivity {
  id: string;
  task_id: string;
  action: string;
  performed_by: string;
  performed_by_name: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  comment: string;
  created_at: string;
}

export interface TaskItem {
  id: string;
  task_code?: string;
  title: string;
  description?: string;
  department_id?: string;
  department_name?: string;
  department?: string;
  project_name?: string;
  assigned_to: string;
  assigned_to_name?: string;
  assigned_by?: string;
  assigned_by_id?: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress_percent?: number;
  start_date?: string;
  due_date?: string;
  created_at?: string;
  started_at?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  completed_by?: string | null;
  estimated_hours?: number;
  actual_hours?: number;
  completion_note?: string | null;
  manager_feedback?: string | null;
  reopened_at?: string | null;
  reopened_reason?: string | null;
  previous_assignee?: string | null;
  reassigned_at?: string | null;
  reassign_reason?: string | null;
  category?: string;
  tags?: string;
  instructions?: string;
  module_name?: string;
  deliverable_type?: string;
  pdf_attachment_name?: string;
  pdf_attachment_url?: string;
  attachments?: { id?: string | number; fileName?: string; file_name?: string; fileUrl?: string; file_url?: string; fileType?: string; fileSize?: number; uploadedBy?: string }[];
  checklist?: { id: string; label: string; completed: boolean }[];
  ai_recommendation_log?: string;
  is_overdue?: boolean;
  employee_name?: string;
  employee_code?: string;
  employee_designation?: string;
  activities?: TaskActivity[];
  comments?: TaskComment[];
  updated_at?: string;
}

export interface TaskKPIs {
  totalTasks: number;
  pending: number;
  inProgress: number;
  submitted: number;
  completed: number;
  reopened: number;
  overdue: number;
  highPriority: number;
  completionRate: number;
  onTimeRate: number;
}

export interface EmployeeWorkload {
  employee_id: string;
  employee_name: string;
  department: string;
  designation: string;
  total_assigned: number;
  active_tasks: number;
  urgent_tasks: number;
  overdue_tasks: number;
  completed_tasks: number;
}

export interface TaskAnalytics {
  kpis: TaskKPIs;
  workload: EmployeeWorkload[];
}

export interface PerformanceScoringComponent {
  name: string;
  maxPoints: number;
  earnedPoints: number;
  actualValue: string;
}

export interface EmployeeTaskPerformance {
  employee: {
    id: string;
    empCode: string;
    name: string;
    department: string;
    designation: string;
  };
  metrics: {
    totalAssigned: number;
    completed: number;
    pending: number;
    inProgress: number;
    submitted: number;
    overdue: number;
    onTimeCompleted: number;
    lateCompleted: number;
    highPriorityCompleted: number;
    completionRate: number;
    onTimeRate: number;
    avgCompletionHours: number;
    managerRating: number;
    managerFeedback: string;
  };
  scoringBreakdown: {
    overallScore: number;
    formula: string;
    components: PerformanceScoringComponent[];
  };
  monthlyTrends: Array<{
    month: string;
    year: number;
    assigned: number;
    completed: number;
    score: number;
  }>;
}

export interface AIAssistantInsight {
  type: string;
  taskId?: string;
  title?: string;
  suggestedPriority?: string;
  riskAnalysis?: string;
  progressSummary?: string;
  suggestedNextSteps?: string[];
  workloadSummary?: string;
  recommendation?: string;
  performanceExplanation?: string;
  summary?: string;
  actionableAlerts?: string[];
}
