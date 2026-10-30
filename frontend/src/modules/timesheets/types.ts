export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface TimesheetProof {
  id: string;
  timesheet_entry_id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  file_hash?: string;
  storage_reference: string;
  uploaded_by?: string;
  uploaded_at?: string;
}

export interface TimesheetWorkEntry {
  id: string;
  timesheet_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  duration_formatted?: string;
  work_title: string;
  work_description: string;
  created_at?: string;
  updated_at?: string;
  proof?: TimesheetProof | null;
}

export interface TimesheetAssignment {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  expected_hours_per_day: number;
  proof_required: boolean;
  allow_multiple_entries: boolean;
  require_description: boolean;
  instructions?: string;
  assigned_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Timesheet {
  id: string;
  assignment_id?: string;
  employee_id: string;
  employee_name?: string;
  emp_code?: string;
  department?: string;
  designation?: string;
  date: string;
  expected_hours: number;
  total_hours: number;
  total_minutes?: number;
  duration_formatted?: string;
  status: TimesheetStatus;
  submitted_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  proof_required?: boolean;
  allow_multiple_entries?: boolean;
  require_description?: boolean;
  instructions?: string;
  entries_count?: number;
  proofs_count?: number;
  entries?: TimesheetWorkEntry[];
}

export interface TimesheetSummaryReport {
  totalAssigned: number;
  submitted: number;
  approved: number;
  rejected: number;
  pending: number;
  totalHours: number;
  averageDailyHours: number;
  missingTimesheets: number;
}

export interface TimesheetEmployeeReport {
  employee_id: string;
  employee_name: string;
  department: string;
  designation: string;
  working_days: number;
  submitted: number;
  approved: number;
  rejected: number;
  pending: number;
  total_hours: number;
}
