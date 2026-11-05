# 🗄️ [5] Database & API Documentation
## Enterprise CRM, HRMS & ERP Platform

---

> **Architecture:** Dual PostgreSQL databases (HRMS + CRM)
> **Driver:** node-postgres (`pg`) with Connection Pooling
> **Migration Count:** 23 sequential SQL files

---

## 5.1 Database Overview

### HRMS Database
- **Name:** `HRMS`
- **Port:** `5432` (local) / `5434` (Docker)
- **Purpose:** Employee data, payroll, attendance, leave, tasks, documents, timesheets

### CRM Database
- **Name:** `crm`
- **Port:** `5432` (local) / `5435` (Docker)
- **Purpose:** Leads, customers, contacts, sales, invoices, projects, vendors

---

## 5.2 Database Migration History (23 Migrations)

| # | Migration File | Key Tables & Features Created |
|:---:|:---|:---|
| 001 | `001_initial_schema.sql` | `users`, `roles`, base company config |
| 002 | `002_enterprise_complete_schema.sql` | `employees`, `departments`, `designations`, `branches`, `shifts`, `attendance_logs` |
| 003 | `003_automatic_database_triggers.sql` | PostgreSQL triggers: auto-timestamps, attendance duration, late penalties |
| 004 | `004_db_first_complete.sql` | `accounts`, `general_ledger`, `customers`, `leads`, `products`, `sales_orders`, `expense_claims` |
| 005 | `005_master_prompt_complete_schema.sql` | Enhanced models, `job_applications`, `helpdesk_tickets`, audit logging |
| 006 | `006_central_payroll_engine.sql` | `employee_salaries`, `payroll_runs`, `payslips`, `salary_components`, PF/ESI/TDS/PT, LOP |
| 007 | `007_ess_portal_engine.sql` | `ess_credentials`, PIN hashes, biometric sync, notification tokens |
| 008 | `008_ess_admin_two_way_integration.sql` | Real-time two-way sync: ESS ↔ Admin |
| 009 | `009_admin_notifications_and_two_way_sync.sql` | Admin alert queue, leave sync triggers, payroll listeners |
| 010 | `010_enterprise_task_management_and_performance.sql` | `tasks`, `task_milestones`, `task_assignees`, `task_checklist_items`, KPIs |
| 011 | `011_task_attachments.sql` | `task_attachments` — file metadata, MIME validation |
| 012 | `012_intern_management_complete.sql` | `interns`, intern lifecycle, onboarding workflows |
| 013 | `013_enterprise_document_management_system.sql` | `documents`, `document_categories`, `document_types`, version control |
| 014 | `014_modules_and_employee_assignments.sql` | `modules`, `employee_module_assignments` — per-employee module access |
| 015 | `015_team_chat_messages.sql` | `team_chat_messages` — project group messaging |
| 016 | `016_project_groups_and_workflows.sql` | `project_groups`, `group_workflows`, project collaboration |
| 017 | `017_ensure_unique_constraints_and_clean_on_conflict.sql` | Data integrity constraints, ON CONFLICT cleanup |
| 018 | `018_sync_projects_schema.sql` | Projects schema synchronization |
| 019 | `019_testing_qa_management_system.sql` | QA test suites, test cases, test runs |
| 020 | `020_project_centric_qa_system.sql` | Project-linked QA system |
| 021 | `021_attendance_test_reports_system.sql` | Attendance test reports table |
| 022 | `022_project_allocation_system.sql` | `project_allocations`, resource allocation tracking |
| 023 | `023_timesheet_standalone_system.sql` | `timesheets`, standalone timesheet management |

---

## 5.3 Key Table Schemas

### `employees` Table (HRMS DB)

| Column | Type | Description |
|:---|:---|:---|
| `id` | `SERIAL PRIMARY KEY` | Internal auto-increment ID |
| `employee_id` | `VARCHAR(20) UNIQUE` | Sequential ID (e.g., EMP-001) |
| `first_name` | `VARCHAR(100)` | First name |
| `last_name` | `VARCHAR(100)` | Last name |
| `email` | `VARCHAR(255) UNIQUE` | Login email |
| `password_hash` | `VARCHAR(255)` | bcrypt hashed password |
| `role` | `VARCHAR(50)` | User role |
| `department_id` | `INTEGER FK` | Linked department |
| `designation_id` | `INTEGER FK` | Linked designation |
| `branch_id` | `INTEGER FK` | Linked branch |
| `status` | `VARCHAR(20)` | `active`, `inactive`, `terminated` |
| `date_of_joining` | `DATE` | Joining date |
| `created_at` | `TIMESTAMPTZ` | Auto-managed |
| `updated_at` | `TIMESTAMPTZ` | Trigger-managed |

### `attendance_logs` Table (HRMS DB)

| Column | Type | Description |
|:---|:---|:---|
| `id` | `SERIAL PRIMARY KEY` | Log ID |
| `employee_id` | `INTEGER FK` | Employee reference |
| `date` | `DATE` | Attendance date |
| `clock_in` | `TIMESTAMPTZ` | Clock-in timestamp |
| `clock_out` | `TIMESTAMPTZ` | Clock-out timestamp |
| `total_hours` | `DECIMAL(5,2)` | Auto-calculated by trigger |
| `status` | `VARCHAR(20)` | `present`, `absent`, `late`, `half_day`, `lop` |
| `shift_id` | `INTEGER FK` | Linked shift |

### `payslips` Table (HRMS DB)

| Column | Type | Description |
|:---|:---|:---|
| `id` | `SERIAL PRIMARY KEY` | Payslip ID |
| `employee_id` | `INTEGER FK` | Employee reference |
| `payroll_run_id` | `INTEGER FK` | Payroll batch reference |
| `month` | `DATE` | Pay period month |
| `gross_salary` | `DECIMAL(12,2)` | Total gross |
| `basic_salary` | `DECIMAL(12,2)` | Basic component |
| `hra` | `DECIMAL(12,2)` | HRA component |
| `pf_deduction` | `DECIMAL(12,2)` | Provident Fund |
| `esi_deduction` | `DECIMAL(12,2)` | ESI |
| `tds_deduction` | `DECIMAL(12,2)` | TDS/Income Tax |
| `professional_tax` | `DECIMAL(12,2)` | Professional Tax |
| `lop_deduction` | `DECIMAL(12,2)` | Loss of Pay deduction |
| `net_salary` | `DECIMAL(12,2)` | Final take-home pay |

### `leads` Table (CRM DB)

| Column | Type | Description |
|:---|:---|:---|
| `id` | `SERIAL PRIMARY KEY` | Lead ID |
| `name` | `VARCHAR(255)` | Lead/company name |
| `contact_name` | `VARCHAR(255)` | Contact person |
| `email` | `VARCHAR(255)` | Lead email |
| `phone` | `VARCHAR(50)` | Lead phone |
| `status` | `VARCHAR(50)` | `new`, `qualified`, `proposal`, `won`, `lost` |
| `source` | `VARCHAR(100)` | Lead source |
| `score` | `INTEGER` | Lead quality score (0-100) |
| `assigned_to` | `INTEGER FK` | Assigned sales person |
| `expected_value` | `DECIMAL(12,2)` | Deal value |
| `created_at` | `TIMESTAMPTZ` | Creation timestamp |

---

## 5.4 Complete REST API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `POST` | `/api/auth/login` | None | Login with email/password, returns JWT |
| `GET` | `/api/auth/session` | JWT | Validate existing session token |

### Employees (HRMS)

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/api/employees` | JWT | List all employees (filterable) |
| `POST` | `/api/employees` | HR Admin | Create new employee |
| `GET` | `/api/employees/:id` | JWT | Get employee 360° profile |
| `PUT` | `/api/employees/:id` | HR Admin | Update employee record |
| `DELETE` | `/api/employees/:id` | Super Admin | Deactivate employee |
| `GET` | `/api/departments` | JWT | List departments |
| `GET` | `/api/designations` | JWT | List designations |
| `GET` | `/api/branches` | JWT | List branches |

### Attendance & Shifts

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `POST` | `/api/attendance/clock-in` | JWT | Record clock-in |
| `POST` | `/api/attendance/clock-out` | JWT | Record clock-out |
| `GET` | `/api/attendance/daily` | JWT | Daily attendance roster |
| `GET` | `/api/attendance/history/:employeeId` | JWT | Monthly attendance history |
| `GET` | `/api/shifts` | JWT | List all shifts |
| `POST` | `/api/shifts` | HR Admin | Create shift configuration |
| `GET` | `/api/timesheets` | JWT | List timesheets |
| `POST` | `/api/timesheets` | JWT | Submit timesheet |

### Leave Management

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/api/leave/balances/:employeeId` | JWT | Get leave balances |
| `POST` | `/api/leave/apply` | JWT | Submit leave application |
| `GET` | `/api/leave/requests` | HR Admin | All leave requests |
| `PUT` | `/api/leave/requests/:id/status` | Manager/HR | Approve/Reject leave |
| `DELETE` | `/api/leave/requests/:id` | JWT | Cancel pending leave |

### Payroll

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/api/payroll/structures` | JWT | List salary structures |
| `POST` | `/api/payroll/run` | Finance/HR | Execute monthly payroll run |
| `GET` | `/api/payroll/runs` | JWT | List payroll batches |
| `GET` | `/api/payroll/payslip/:employeeId/:month` | JWT | Get/generate payslip |

### Tasks

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/api/tasks` | JWT | List tasks (filtered) |
| `POST` | `/api/tasks` | JWT | Create task with subtasks |
| `GET` | `/api/tasks/:id` | JWT | Get task detail |
| `PUT` | `/api/tasks/:id` | JWT | Update task/checklist |
| `POST` | `/api/tasks/:id/attachments` | JWT | Upload task file |
| `DELETE` | `/api/tasks/:id` | Manager | Delete task |

### Employee Self-Service (ESS)

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/api/v1/employee/profile` | Employee JWT | Self profile |
| `GET` | `/api/v1/employee/attendance` | Employee JWT | Self attendance logs |
| `GET` | `/api/v1/employee/leaves` | Employee JWT | Self leave history |
| `GET` | `/api/v1/employee/payslips` | Employee JWT | Self payslips |
| `GET` | `/api/v1/employee/tasks` | Employee JWT | Self assigned tasks |

### CRM — Leads & Customers

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/api/leads` | JWT | List leads (Kanban data) |
| `POST` | `/api/leads` | JWT | Create lead |
| `PUT` | `/api/leads/:id` | JWT | Update lead stage/details |
| `DELETE` | `/api/leads/:id` | JWT | Delete lead |
| `GET` | `/api/customers` | JWT | Customer directory |
| `POST` | `/api/customers` | JWT | Create customer |
| `GET` | `/api/contacts` | JWT | List contacts |
| `GET` | `/api/opportunities` | JWT | List opportunities |

### Sales & Finance

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/api/quotations` | JWT | List quotations |
| `POST` | `/api/quotations` | JWT | Generate quotation |
| `GET` | `/api/sales-orders` | JWT | List sales orders |
| `GET` | `/api/crm/invoices` | JWT | CRM invoices |
| `GET` | `/api/vendors` | JWT | Vendor list |
| `GET` | `/api/purchase-orders` | JWT | Purchase orders |
| `GET` | `/api/accounts` | JWT | Chart of accounts |
| `GET` | `/api/banking` | JWT | Bank accounts & transactions |
| `GET` | `/api/expenses` | JWT | Expense claims |

### System Health

| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/api/health` | None | System health + DB status + migration count |

**Sample Health Response:**

```json
{
  "status": "OK",
  "message": "CRM + HRMS Dual-DB Enterprise API — All Systems Healthy",
  "databases": {
    "hrms": {
      "status": "HEALTHY",
      "name": "HRMS",
      "stats": { "employees": 45 },
      "migrationsApplied": 23
    },
    "crm": {
      "status": "HEALTHY",
      "name": "crm",
      "stats": { "leads": 128 },
      "migrationsApplied": 15
    }
  }
}
```

---

## 5.5 API Request/Response Format

### Standard Success Response

```json
{
  "success": true,
  "data": [ ... ],
  "total": 42,
  "page": 1
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": "Validation failed",
  "message": "email must be a valid email address",
  "statusCode": 400
}
```

### Authentication Header

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```
