# 💻 [2] Source Code Handover Report
## Enterprise CRM, HRMS & ERP Platform

---

> **This document is the definitive source code handover guide for the incoming engineering team.**
> **Repository Path:** `CRM/` | **Language:** TypeScript (Frontend) + JavaScript ESM (Backend)
> **Date Prepared:** October 30, 2026

---

## 2.1 Repository Structure

```
CRM/                                        # Project Root
├── docker-compose.yml                      # Multi-container orchestration
├── .env.example                            # Environment variable template
├── README.md                               # Quick start guide
├── TOOLS_AND_TECH_STACK.md                 # Full technology inventory
├── PROJECT_DOCUMENTATION.md               # Project documentation
├── HRMS_WORKFLOW_AND_USECASE_DIAGRAMS.md  # HRMS workflow diagrams
├── MODULE_WORKFLOW_DIAGRAMS_GUIDE.md      # Module workflow guide
├── docs/                                  # ← All 8 handover documents (this folder)
│
├── backend/                               # Node.js + Express API Server
│   ├── index.js                           # ⭐ Main application entry point
│   ├── package.json                       # Backend dependencies
│   ├── .env                               # Environment variables (DO NOT COMMIT)
│   ├── config/                            # Configuration files
│   ├── db/
│   │   ├── pool.js                        # PostgreSQL dual connection pool
│   │   ├── migrator.js                    # Migration runner & status checker
│   │   └── migrations/                    # 23+ sequential SQL migration files
│   │       ├── 001_initial_schema.sql
│   │       ├── 002_enterprise_complete_schema.sql
│   │       ├── ...
│   │       └── 023_timesheet_standalone_system.sql
│   │       ├── crm/                       # CRM-specific migration files
│   │       └── hrms/                      # HRMS-specific migration files
│   ├── middleware/
│   │   ├── auth.js                        # JWT authentication & decode
│   │   ├── moduleAuth.js                  # Module-level RBAC authorization
│   │   ├── errorHandler.js                # Global error handler
│   │   ├── permission.js                  # Fine-grained permissions
│   │   └── validation.js                  # Zod schema validation middleware
│   ├── routes/                            # 41 API route files
│   ├── controllers/
│   │   ├── attendanceController.js        # Attendance logic controller
│   │   └── recruitmentController.js       # Recruitment logic controller
│   ├── services/                          # Business logic services
│   ├── utils/
│   │   └── websocket.js                   # WebSocket server initialization
│   ├── validators/                        # Zod validation schemas
│   ├── setup_hrms.js                      # HRMS DB auto-migration bootstrap
│   └── setup_crm.js                       # CRM DB auto-migration bootstrap
│
└── frontend/                              # React 18 + TypeScript + Vite SPA
    ├── index.html                         # HTML entry point
    ├── vite.config.ts                     # Vite build configuration
    ├── tsconfig.json                      # TypeScript compiler options
    ├── tailwind.config.js                 # Tailwind CSS configuration
    ├── nginx.conf                         # Production nginx config
    └── src/
        ├── main.tsx                       # React DOM entry point
        ├── app/
        │   ├── App.tsx                    # ⭐ Root app component & routing
        │   └── providers.tsx              # Context providers wrapper
        ├── context/                       # Global state management
        ├── components/
        │   ├── auth/                      # Login, Register, Landing, Careers pages
        │   ├── dashboard/                 # Role-specific dashboards
        │   ├── layout/                    # Header, Sidebar, Modals
        │   └── modules/                   # ModuleViews dispatcher
        ├── modules/                       # 25 Domain-specific UI modules
        │   ├── hrms/ | ess/ | attendance/ | leave/ | payroll/
        │   ├── recruitment/ | crm/ | customers/ | sales/ | accounts/
        │   ├── banking/ | expenses/ | purchases/ | vendors/ | inventory/
        │   ├── projects/ | tasks/ | timesheets/ | documents/ | reports/
        │   └── ledger/ | helpdesk/ | administration/ | settings/ | testing/
        ├── services/                      # API client service functions
        ├── hooks/                         # Custom React hooks
        ├── types/                         # TypeScript interface definitions
        ├── constants/                     # App-wide constants
        ├── styles/                        # Global CSS & Tailwind directives
        └── utils/                         # Utility functions
```

---

## 2.2 Backend API Routes (41 Route Files)

### HRMS Routes (Friend 2 — HR Domain)

| Route File | Mount Point | Purpose |
|:---|:---|:---|
| `auth.js` | `/api/auth` | Login, session validation |
| `employees.js` | `/api/employees` | Employee CRUD, profiles |
| `attendance.js` | `/api/attendance` | Clock-in/out, daily roster |
| `shifts.js` | `/api/shifts` | Shift configurations |
| `leave.js` | `/api/leave` | Leave balances, requests, approvals |
| `payroll.js` | `/api/payroll` | Payroll runs, CTC, payslips |
| `recruitment.js` | `/api/recruitment` | ATS, job candidates |
| `hrms.js` | `/api/hrms` | HRMS general operations |
| `accounts.js` | `/api/accounts` | General ledger |
| `banking.js` | `/api/banking` | Bank accounts & transactions |
| `expenses.js` | `/api/expenses` | Expense claims |
| `departments.js` | `/api/departments` | Department management |
| `designations.js` | `/api/designations` | Job title management |
| `branches.js` | `/api/branches` | Branch locations |
| `dashboard.js` | `/api/dashboard` | Executive analytics |
| `tasks.js` | `/api/tasks` | Enterprise task management |
| `interns.js` | `/api/interns` | Intern management |
| `reports.js` | `/api/reports` | Report generation |
| `modules.js` | `/api/modules` | Module access control |
| `allocations.js` | `/api/allocations` | Resource allocations |
| `timesheets.js` | `/api/timesheets` | Timesheet management |
| `ess.js` | `/api/v1/employee` & `/api/employee` | Employee Self-Service |
| `documents.js` | `/api/documents` | Document management |
| `document_config.js` | `/api/document-types`, `/api/document-categories` | Doc configuration |
| `testing.js` | `/api/testing` | QA system |
| `testReports.js` | `/api/test-reports` | QA test reports |

### CRM Routes (Friend 1 — Sales Domain)

| Route File | Mount Point | Purpose |
|:---|:---|:---|
| `leads.js` | `/api/leads` | Lead management, Kanban |
| `customers.js` | `/api/customers` | Customer directory |
| `contacts.js` | `/api/contacts` | Contact management |
| `opportunities.js` | `/api/opportunities` | Sales opportunities |
| `crm_activities.js` | `/api/crm/activities` | CRM activity log |
| `crm_followups.js` | `/api/crm/followups` | Follow-up scheduling |
| `quotations.js` | `/api/quotations` | Quote generation |
| `sales_orders.js` | `/api/sales-orders` | Sales order management |
| `crm_invoices.js` | `/api/crm/invoices` | CRM invoice generation |
| `crm_products.js` | `/api/crm/products` | Product catalog |
| `vendors.js` | `/api/vendors` | Vendor management |
| `purchase_orders.js` | `/api/purchase-orders` | Purchase order management |
| `projects.js` | `/api/projects` | Project management |
| `groups.js` | `/api/groups` | Project groups & workflows |

---

## 2.3 Middleware Stack

```
HTTP Request
     │
     ▼
CORS Middleware (cors)            → Allow cross-origin from frontend
Body Parser (express.json)        → Parse JSON body (50MB limit)
Static Files (/uploads)           → Serve uploaded task/doc files
authenticateUser (auth.js)        → JWT decode & user injection
protectModuleRoute (moduleAuth)   → Module-level RBAC check
Route Handlers                    → Business logic
Global errorHandler               → Centralized error responses
```

---

## 2.4 Frontend Application Entry Flow

```
main.tsx
  └── App.tsx (AppProviders wrapper)
        └── AuthWrapper
              ├── / → LandingPage
              ├── /login → LoginPage
              ├── /register → RegisterPage
              ├── /careers → CareersPage
              └── (authenticated)
                    ├── (Employee role) → ESSPage (/employee)
                    └── (Admin roles) → MainLayout
                          ├── Header
                          ├── Sidebar
                          └── main
                                ├── dashboard → RoleDashboardContainer
                                └── else → ModuleViews (25 modules)
```

---

## 2.5 Key Configuration Files

| File | Location | Purpose |
|:---|:---|:---|
| `backend/.env` | `backend/` | DB credentials, JWT secret, port |
| `backend/package.json` | `backend/` | Backend deps & npm scripts |
| `frontend/vite.config.ts` | `frontend/` | API proxy, build config |
| `frontend/tsconfig.json` | `frontend/` | TypeScript compiler options |
| `docker-compose.yml` | Root | Multi-container orchestration |
| `frontend/nginx.conf` | `frontend/` | Production reverse proxy config |

---

## 2.6 Handover Checklist

- [x] Source code reviewed and understood
- [x] All 41 API routes documented
- [x] Frontend 25 modules inventoried
- [x] Middleware chain documented
- [x] Database migrations listed (23 files)
- [x] Environment variables referenced (`.env.example`)
- [x] Docker deployment ready (`docker-compose.yml`)
- [ ] Obtain production `.env` credentials from outgoing team
- [ ] Verify PostgreSQL backup is current before handover
- [ ] Confirm all test suites pass in development environment
