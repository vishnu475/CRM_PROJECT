# 🧪 Testing Reports — All 9 Types
## Enterprise CRM, HRMS & ERP Management Platform

---

> **All test files are in:** `backend/tests/`
> **Master runner:** `node backend/tests/run-all.js`
> **Prerequisite:** `npm run dev` in `backend/` (for HTTP tests)

---

## Quick Reference

| # | Test Type | File | Needs Server | Tests Count |
|:---:|:---|:---|:---:|:---:|
| 1 | Unit Testing | `tests/unit.test.js` | ❌ No | 50+ |
| 2 | Integration Testing | `tests/integration.test.js` | ✅ Yes | 35+ |
| 3 | Acceptance (UAT) | `tests/acceptance.test.js` | ✅ Yes | 30+ |
| 4 | Smoke Testing | `tests/smoke.test.js` | ✅ Yes | 50+ endpoints |
| 5 | Sanity Testing | `tests/sanity.test.js` | ✅ Yes | 25+ |
| 6 | Regression Testing | `tests/regression.test.js` | ✅ Yes | 20 bug guards |
| 7 | E2E Testing | `tests/e2e.test.js` | ✅ Yes | 9 full journeys |
| 8 | Component Testing | `tests/component.test.js` | ✅ Yes | 45+ |
| 9 | Interface Testing | `tests/interface.test.js` | ✅ Yes | 35+ |

---

## How to Run

```bash
# Start backend server first (for all HTTP tests)
cd backend
npm run dev

# In a new terminal — Run all 9 suites
node tests/run-all.js

# Run individual suites
node tests/unit.test.js           # No server needed
node tests/smoke.test.js          # Quick health check
node tests/regression.test.js     # After every hotfix
node tests/e2e.test.js            # Full user journey
node tests/interface.test.js      # API contract check
```

---

## [1] Unit Testing

**File:** `tests/unit.test.js`
**Purpose:** Tests pure business logic functions in complete isolation — no database, no HTTP.

### Logic Tested (Embedded from Source Code)

| Function | Source File | What It Tests |
|:---|:---|:---|
| `computeNetSalary()` | `services/payrollService.js` | PF cap (₹1800), ESI (0.75%), PT slabs, TDS (5%), LOP = (Gross/WorkingDays)×LOP_Days |
| `checkLeaveBalance()` | `routes/leave.js:182` | Blocks leave when `available < requested` |
| `mapLeaveTypeId()` | `routes/leave.js:189` | sick→lt-sl, privilege→lt-pl, others→lt-cl |
| `validateLeadAttachment()` | `routes/leads.js:16-71` | Only SVG/PNG/JPG/JPEG/PDF, max 10MB |
| `isValidUrl()` | `routes/leads.js:172` | Blocks javascript:, data:, vbscript:, URLs >250 chars |
| `normalizeUrl()` | `routes/leads.js:188` | Prefixes https:// once, not twice |
| `sanitizeTags()` | `routes/leads.js:196` | Strips HTML, deduplicates case-insensitively, drops >50 chars |
| `isValidIndianPhone()` | `routes/leads.js:163` | 10 digits, must start 6-9 |
| `isValidEmail()` | `routes/leads.js:162` | Must have @, domain |
| `isValidEmployeeId()` | `routes/employees.js:57` | Must start with `EMP-` |
| `resolveTaskRole()` | `routes/tasks.js:15` | JWT role > header emp → Employee > default Admin |
| `canDisburseSalary()` | `routes/payroll.js:126` | Blocks Employee/EMPLOYEE from disbursement |
| `resolveAttendanceStatus()` | `routes/attendance.js:33` | null/"-"/"OFF" → Absent, else Present |

**Sample Test Cases:**
```
✅ Gross ₹30,000 → PF capped at ₹1800 (not 12% of 30000)
✅ Gross ₹20,000 → ESI = ₹150 (0.75% applies)
✅ 3 LOP days, 26 working days → LOP = ₹30,000/26 × 3 = ₹3,461
✅ Available 0 days + request 1 day → BLOCKED
✅ javascript:alert(1) URL → BLOCKED (XSS prevention)
✅ .exe file upload → REJECTED
✅ Employee role → CANNOT disburse salary
```

---

## [2] Integration Testing

**File:** `tests/integration.test.js`
**Purpose:** Tests how multiple APIs interact — verifying data flows correctly across modules.

### Flows Tested

| Integration | Description |
|:---|:---|
| Health → DB Status | Both HRMS and CRM pools must be HEALTHY |
| Employee Create → ESS Access | Employee data accessible via /api/employees |
| Leave Apply → Balance Deduction | Balance check before insert (transaction) |
| Attendance → Today Roster | Clock-in event visible in today's roster |
| Payroll Run → Payslip | Run creation → calculation → payment tracking |
| CRM Lead → Customer → Invoice | Lead pipeline through sales funnel |
| Task Create → Analytics | Task KPIs updated after task operations |
| Finance → Accounts → Banking | COA linked with bank transaction entries |

---

## [3] Acceptance Testing (UAT)

**File:** `tests/acceptance.test.js`
**Purpose:** Validates real business scenarios from actual user persona perspectives.

### User Stories Covered

| UAT ID | User Persona | Story | Acceptance Criterion |
|:---:|:---|:---|:---|
| UAT-01 | HR Admin | View employee directory | Returns EMP-NNN format IDs |
| UAT-02 | Employee | Apply for leave | Balance check → PENDING status |
| UAT-03 | Finance Manager | Run payroll | Employee role gets HTTP 403 on disburse |
| UAT-04 | Sales Director | Manage lead pipeline | Stage filter returns only matching leads |
| UAT-05 | Employee (ESS) | Access self-service portal | Own data visible, no other employees' data |
| UAT-06 | Manager | Approve leave requests | PENDING requests visible with employee name |
| UAT-07 | Super Admin | Manage modules | Module permissions visible and editable |
| UAT-08 | Manager | Track project tasks | Task board, analytics, completed tasks |
| UAT-09 | Finance | Manage procurement | Vendors, POs accessible to Finance role |

---

## [4] Smoke Testing

**File:** `tests/smoke.test.js`
**Purpose:** Quick "Is the system alive?" check — run FIRST after every deployment.

### Coverage: 50+ API Endpoints

All endpoints across these modules checked for HTTP 2xx/4xx responses:

```
CORE:         /api/health  /api/auth/session
HRMS:         /api/employees  /api/departments  /api/designations  /api/branches
ATTENDANCE:   /api/attendance/today  /api/attendance/history  /api/shifts  /api/timesheets
LEAVE:        /api/leave/types  /api/leave/balance  /api/leave/requests  /api/leave/holidays
PAYROLL:      /api/payroll/runs  /api/payroll/structures  /api/payroll/payments
ESS:          /api/v1/employee/profile  /attendance  /leaves  /payslips  /tasks
CRM:          /api/leads  /api/customers  /api/contacts  /api/opportunities
              /api/crm/activities  /api/crm/followups
SALES:        /api/quotations  /api/sales-orders  /api/crm/invoices  /api/crm/products
FINANCE:      /api/accounts  /api/banking  /api/expenses
PROCUREMENT:  /api/vendors  /api/purchase-orders
PROJECTS:     /api/projects  /api/groups  /api/tasks  /api/allocations
DOCUMENTS:    /api/documents  /api/document-types  /api/document-categories
REPORTS:      /api/reports  /api/test-reports
RECRUITMENT:  /api/recruitment  /api/interns
ADMIN:        /api/modules  /api/dashboard
```

> ⚠️ **Deployment rule:** If any smoke test fails (HTTP 5xx), roll back the deployment immediately.

---

## [5] Sanity Testing

**File:** `tests/sanity.test.js`
**Purpose:** Post-fix targeted checks verifying specific business logic is intact.

### Sanity Checks

- Leave type mapping: sick→lt-sl, privilege→lt-pl, others→lt-cl
- Payroll RBAC: Finance/HR/Admin can disburse; Employee cannot
- Attendance: null/"-"/"OFF" check-in always resolves to "Absent"
- Indian phone: 10 digits, starts 6-9; rejects 0-5 prefix
- Email: requires `@` and domain
- URL deduplication: `https://` never doubled
- Tag dedup: case-insensitive, HTML stripped
- Health check: responds with valid `{ databases }` object
- Core responses: all in `{ success, data }` shape
- Holiday count: 2026 always returns exactly 16 gazetted holidays

---

## [6] Regression Testing

**File:** `tests/regression.test.js`
**Purpose:** Guards against previously fixed bugs re-appearing.

### 20 Regression Guards

| Reg ID | Bug Protected |
|:---:|:---|
| REG-001 | LOP deduction never exceeds gross salary |
| REG-002 | Leave balance never goes negative |
| REG-003 | Employee cannot disburse own salary (403) |
| REG-004 | EMP- ID format always maintained |
| REG-005 | XSS via `javascript:` URL blocked |
| REG-006 | `.exe` and unsupported file types rejected |
| REG-007 | Files over 10MB rejected |
| REG-008 | Tag deduplication case-insensitive |
| REG-009 | HRMS migration count always ≥ 20 |
| REG-010 | 2026 holiday list always returns ≥ 16 entries |
| REG-011 | No check-in always resolves to "Absent" |
| REG-012 | Attendance history capped at 200 records |
| REG-013 | Lead stage filter returns only matching stage |
| REG-014 | Empty/unknown leave type defaults to lt-cl |
| REG-015 | Phone numbers starting 0-5 rejected |
| REG-016 | Emails without `@` rejected |
| REG-017 | `https://` not doubled in URL normalizer |
| REG-018 | Tags over 50 chars excluded silently |
| REG-019 | Malformed JSON returns 400, not server crash |
| REG-020 | PF capped at ₹1800 regardless of salary |

---

## [7] End-to-End (E2E) Testing

**File:** `tests/e2e.test.js`
**Purpose:** Simulates complete real-world user journeys from start to finish.

### 9 Full User Journeys

| Flow | User | Steps |
|:---|:---|:---|
| E2E-01: HR Onboarding | HR Admin | Health → Employees → Next ID → Departments → Designations → Branches |
| E2E-02: Leave Lifecycle | Employee | Balance → Leave Types → Holidays → Apply → View Status |
| E2E-03: Payroll Cycle | Finance | View Runs → Structures → Payments → Payslips |
| E2E-04: CRM Sales | Sales Director | All Leads → Filter Stage → Single Lead → Customers → Activities → Quotes → Orders → Invoices |
| E2E-05: ESS Portal | Employee | Profile → Attendance → Leaves → Payslips → Tasks → My Tasks |
| E2E-06: Task Management | Manager | All Tasks → Analytics → Review Queue → Completed → Leave Approvals |
| E2E-07: Finance Flow | Finance | COA → Banking → Expenses → Vendors → Purchase Orders |
| E2E-08: Attendance Kiosk | HR Admin | Today Roster → History (filtered) → Live Feed → Shifts → Timesheets |
| E2E-09: Super Admin Tour | Super Admin | Health → Dashboard → Reports → Documents → Modules → Interns → Projects → Allocations |

---

## [8] Component Testing

**File:** `tests/component.test.js`
**Purpose:** Tests individual backend components in isolation.

### Components Tested

| Component | Source File | Tests |
|:---|:---|:---|
| Auth Middleware | `middleware/auth.js` | JWT decode, role fallback, wildcard vs EMPLOYEE permissions |
| Leave Balance Component | `routes/leave.js` | Auto-init (12/10/15 days), array response |
| Payroll RBAC Guard | `routes/payroll.js` | Finance/HR/Admin allowed; Employee blocked |
| Lead Validation | `routes/leads.js` | Email, phone, URL, tags, file, industry, source regexes |
| Attendance Status | `routes/attendance.js` | CASE logic: null/"-"/"OFF" → Absent |
| Employee ID Generator | `utils/employeeIdGenerator.js` | EMP-NNN format, zero-padding |
| Holiday Component | `routes/leave.js` | 16 default 2026 holidays auto-seeded |
| Task Scoping | `routes/tasks.js` | Employee isEmployeeOnly=true, header overrides JWT |
| Leave Type Mapper | `routes/leave.js` | sick/privilege/casual mapping |
| Error Handler | `middleware/errorHandler.js` | 404/400/403 structured responses |

---

## [9] Interface Testing

**File:** `tests/interface.test.js`
**Purpose:** Verifies API interface contracts — the "contract" between frontend and backend.

### Contracts Verified

| Contract | What Is Tested |
|:---|:---|
| Response Shape | `{ success: bool, data: [] }` structure for all list endpoints |
| Required Fields | Employees have id/name/department/status; Leads have id/stage |
| HTTP Status Codes | 200 (success), 400 (bad request), 403 (forbidden), 404 (not found) |
| Filter Interface | `?stage=New` returns only New leads, `?status=PENDING` returns only pending |
| RBAC Interface | Finance can access payroll; Employee gets 403 on disburse |
| Dual-DB Interface | `/api/employees` → HRMS pool; `/api/leads` → CRM pool |
| Content-Type | All responses return `application/json` |
| Pagination | Attendance history capped at 200; task count field present |
| Error Shape | Errors return `{ success: false, message: string }` |
| WebSocket | Server responds on port 5000 |

---

## Running in CI/CD Pipeline

```yaml
# Example GitHub Actions snippet
- name: Run Unit Tests (no server)
  run: node backend/tests/unit.test.js

- name: Start Backend
  run: npm run dev &
  working-directory: backend

- name: Wait for server
  run: sleep 5

- name: Run Smoke Tests
  run: node backend/tests/smoke.test.js

- name: Run Integration Tests
  run: node backend/tests/integration.test.js

- name: Run Regression Tests
  run: node backend/tests/regression.test.js

- name: Run All Tests
  run: node backend/tests/run-all.js
```

---

*Generated: October 30, 2026 | Version: v2.4.0-production*
