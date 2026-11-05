# 📘 Startup Project Documentation
## Enterprise CRM, HRMS & ERP Management Platform
### Comprehensive System Architecture, Engineering Design & Operations Manual

---

## 1. Cover Page

| Metadata Field | Project Specification |
|:---|:---|
| **Project Name** | **Enterprise CRM, HRMS & ERP Management Platform** *(Codename: ERP Suite)* |
| **System Version** | `v2.4.0-production` |
| **Document Version** | `v1.0` *(Comprehensive Master Handover Edition)* |
| **Document Classification** | Confidential — Internal Technical Specification & Operations Guide |
| **Prepared By** | Core Software Architecture & Full-Stack Engineering Team |
| **Release Date** | October 30, 2026 |
| **Last Updated** | October 31, 2026 |
| **Target Audience** | Technical Leads, DevOps Engineers, Product Managers, System Administrators, Executive Stakeholders |

---

## 2. Project Summary

### 2.1 Purpose of the Project
The **Enterprise CRM, HRMS & ERP Management Platform** is a unified, multi-tenant capable, production-grade business management operating system. It consolidates seven historically isolated business domains into a single synchronized web ecosystem:
1. **Human Resource Management (HRMS):** Comprehensive employee master records, departmental hierarchies, designations, and multi-branch infrastructure.
2. **Attendance & Biometric Kiosk:** Real-time clock-in/out, biometric terminal synchronization, shift scheduling, geofencing validation, and automated late/overtime tracking.
3. **Leave Management Engine:** Dynamic leave entitlement balances, multi-tier approval workflows, loss-of-pay (LOP) deductions, and holiday schedules.
4. **Central Payroll Engine:** India-compliant statutory deduction computation (PF, ESI, Professional Tax, TDS), gross-to-net salary structuring, salary slip generation, and automated financial journal posting.
5. **Employee Self-Service (ESS):** Dedicated, secure portal allowing employees to access attendance logs, regularizations, leave submissions, documents, and payslips without administrative friction.
6. **Customer Relationship Management (CRM):** Lead acquisition pipelines, interactive Kanban deal boards, customer lifecycle directories, contacts, opportunities, and activities.
7. **Sales, Finance, Procurement & Delivery:** Quotations, sales orders, CRM invoices, Chart of Accounts (COA), double-entry General Ledger, banking, expense reimbursements, vendor management, purchase orders, inventory management, project allocation, and standalone timesheets.

### 2.2 Business Problem It Solves
Small-to-medium enterprises (SMEs) and growing corporations frequently suffer from **software fragmentation**. Companies juggle 5 to 8 disparate SaaS tools:
- One tool for CRM and sales pipelines (e.g., Salesforce/HubSpot)
- A separate tool for payroll and attendance (e.g., Keka/GreytHR)
- Disjointed spreadsheets for project tasks and billable timesheets
- An isolated accounting ledger (e.g., Tally/QuickBooks)
- Ad-hoc cloud storage for employee compliance documents

This fragmentation leads to:
- **Severe Data Silos:** Sales deals won in CRM must be manually keyed into project tools and invoicing systems.
- **High Recurring Subscription Overhead:** Cumulative per-seat monthly subscription costs scale unsustainably.
- **Attendance Fraud & Payroll Errors:** Disconnect between clock-in logs and monthly payroll runs produces salary miscalculations and compliance penalties.
- **Zero Real-Time Visibility:** Executive leadership lacks a single, live pane of glass for organizational health, cash flow, employee productivity, and customer acquisition.

This platform resolves these challenges by anchoring all modules to a centralized, dual-PostgreSQL database layer, exposing standardized REST APIs, and providing instant WebSocket synchronization across administrative and self-service interfaces.

### 2.3 Intended Users
The system is architected around strict Role-Based Access Control (RBAC) supporting the following user personas:

| User Persona | Access Level | Primary Responsibilities & Permissions |
|:---|:---|:---|
| **Super Admin / Executive** | `super_admin` | Full organizational oversight; access to executive dashboard, company-wide audit trails, financial health, module assignment, and system settings. |
| **HR Administrator** | `hr_admin` | Employee lifecycle management (onboarding, transfers, exits), biometric shift assignments, leave adjudications, and monthly payroll execution. |
| **Finance Controller / Accountant** | `finance` | General ledger management, chart of accounts, banking reconciliations, invoice creation, expense claim approvals, and purchase order tracking. |
| **Sales Director / Sales Executive** | `sales` | Lead generation, pipeline stage advancement, opportunity tracking, quotation generation, and customer profile updates. |
| **Project Manager / Department Head** | `manager` | Project milestone planning, resource allocation, task distribution, group workflow oversight, and timesheet review. |
| **Employee (Self-Service)** | `employee` | Dedicated `/employee` portal: clock-in/out, attendance regularizations, leave applications, timesheet submissions, document uploads, and payslip downloads. |

### 2.4 Current Status
- **Phase:** **Production / Active Maintenance**
- **Readiness:**
  - Backend API: 41 modular REST routers with centralized error handling and rate-limiting.
  - Frontend SPA: 25 fully responsive React 18 modules powered by Vite and Tailwind CSS.
  - Database Layer: 23 sequential SQL migrations executed idempotently with schema tracking.
  - Real-time Engine: WebSocket server broadcasting live updates for attendance, leaves, and tasks.
  - Test Harness: 9 distinct automated test suites containing 45+ integration and unit test scripts.

---

## 3. Business Context

### 3.1 Why Was This Project Built?
The platform was commissioned to modernize operational infrastructure. As modern organizations scale past 50 employees, manual spreadsheet workflows and multi-vendor SaaS stacks break down. The project was built to deliver an end-to-end proprietary operating system that grants the enterprise complete ownership over its business data, eliminates vendor lock-in, and enforces strict operational governance.

### 3.2 What Problem Does It Solve?
1. **Lead-to-Cash Automation:** When a sales lead reaches the "Won" stage, the system enables 1-click conversion into an active Customer record, auto-creates an onboarding Project, and allows instant generation of Quotations and Invoices without retyping customer specifications.
2. **Clock-to-Payslip Automation:** Biometric attendance logs flow directly into the payroll engine. Loss-of-Pay (LOP) penalties, late clock-in deductions, and overtime bonuses are computed programmatically using PostgreSQL triggers and backend mathematical calculators.
3. **Audit Compliance:** Every financial transaction, employee salary revision, and document upload maintains an unalterable audit log with timestamping, IP recording, and actor tracking.
4. **Data Security & Privacy:** Proprietary client data, employee salaries, and commercial contracts reside strictly within secure, on-premise or privately hosted PostgreSQL instances rather than third-party public clouds.

### 3.3 Expected Business Value
- **~40% Reduction in Administrative Overhead:** Automated leave deduction, instant payroll batch processing, and 1-click invoicing eliminate hundreds of manual administrative hours monthly.
- **100% Elimination of Data Duplication:** Shared relational schema guarantees that customer, employee, and financial records update across the platform simultaneously.
- **Zero Software Subscription Leakage:** Replaces 5+ recurring SaaS licenses with a self-hosted, scalable web application.
- **Statutory Compliance Accuracy:** Elimination of manual payroll math ensures 100% adherence to Provident Fund (PF) caps, Employee State Insurance (ESI), Professional Tax slabs, and Tax Deducted at Source (TDS).

---

## 4. System Overview

### 4.1 System Description
The platform utilizes a **3-Tier Modern Web Architecture**:
- **Presentation Tier (Client):** A responsive Single Page Application (SPA) built using React 18, TypeScript, and Tailwind CSS. State is managed via a centralized React Context API, with instant notifications delivered via WebSockets.
- **Application Tier (API Gateway & Backend):** A modular Node.js/Express.js server operating under strict ES Module semantics (`"type": "module"`). It enforces JWT authentication, module-level route guards, rate-limiting, request validation via Zod, and asynchronous connection pooling.
- **Persistence Tier (Dual Database):** Two physically or logically segregated PostgreSQL database instances:
  - `HRMS`: Houses employee profiles, biometric logs, leave tables, payroll runs, documents, and timesheets.
  - `crm`: Houses customer directories, sales pipelines, deals, invoices, inventory, and procurement.

### 4.2 High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER (Browser)                                │
│                                                                                        │
│   ┌───────────────────────────┐                    ┌───────────────────────────────┐   │
│   │   Admin & Executive Web   │                    │   Employee Self-Service (ESS) │   │
│   │   (Dashboard, CRM, ERP)   │                    │   (Clock-In, Leaves, Slips)   │   │
│   └─────────────┬─────────────┘                    └───────────────┬───────────────┘   │
└─────────────────┼──────────────────────────────────────────────────┼───────────────────┘
                  │                                                  │
                  │ HTTPS REST JSON Calls                            │ WebSocket Push
                  ▼                                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION TIER (Express.js)                           │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │   Security & Gateway Middleware Chain:                                         │   │
│   │   • CORS Origin Whitelist   • Helmet Security Headers   • Express Rate-Limiter │   │
│   │   • JWT Auth Verification   • Module Permission Guard   • Multer File Handler  │   │
│   └────────────────────────────────────────┬───────────────────────────────────────┘   │
│                                            │                                           │
│   ┌────────────────────────────────────────▼───────────────────────────────────────┐   │
│   │   API Routers (41 Modular Route Handlers):                                     │   │
│   │   /api/auth       /api/employees   /api/attendance  /api/payroll   /api/leave  │   │
│   │   /api/leads      /api/customers   /api/quotations  /api/invoices  /api/tasks  │   │
│   │   /api/projects   /api/accounts    /api/documents   /api/testing   /api/email  │   │
│   └────────────────────────────────────────┬───────────────────────────────────────┘   │
│                                            │                                           │
│   ┌────────────────────────────────────────▼───────────────────────────────────────┐   │
│   │   Underlying Services:                                                         │   │
│   │   • WebSocket Server (ws)  • Zod Validators  • Winston Logger  • Nodemailer    │   │
│   └────────────────────┬───────────────────────────────────────┬───────────────────┘   │
└────────────────────────┼───────────────────────────────────────┼───────────────────────┘
                         │                                       │
                         │ hrmsPool (pg.Pool)                    │ crmPool (pg.Pool)
                         ▼                                       ▼
┌────────────────────────────────────────┐      ┌────────────────────────────────────────┐
│          HRMS DATABASE (PostgreSQL)     │      │          CRM DATABASE (PostgreSQL)     │
│                                        │      │                                        │
│  • employees        • attendance_logs  │      │  • leads            • customers        │
│  • leave_requests   • payroll_runs     │      │  • opportunities    • quotations       │
│  • payslips         • employee_salaries│      │  • sales_orders     • crm_invoices     │
│  • tasks            • documents        │      │  • products         • vendors          │
│  • timesheets       • allocations      │      │  • purchase_orders  • project_groups   │
│  • PL/pgSQL Automatic Triggers         │      │  • Relational Foreign-Key Constraints  │
└────────────────────────────────────────┘      └────────────────────────────────────────┘
```

---

## 5. Technology Stack

### 5.1 Technology Matrix & Component Versions

| Component Layer | Technology | Version | Purpose & Strategic Rationale |
|:---|:---|:---|:---|
| **Frontend Framework** | **React** | `18.3.1` | Component-based UI with declarative DOM updates and fast virtual reconciliation. |
| **Type System** | **TypeScript** | `^5.5.3` | Compile-time type checking, interface contracts, and developer safety across 25 modules. |
| **Build Tooling** | **Vite** | `^6.4.3` | Ultra-fast Hot Module Replacement (HMR) and optimized Rollup production bundling. |
| **Styling & CSS** | **Tailwind CSS** | `^3.4.1` | Utility-first, purge-optimized styling guaranteeing responsive design and clean theme consistency. |
| **Iconography** | **Lucide React** | `^1.16.0` | Comprehensive, lightweight, SVG-native iconography across all visual interfaces. |
| **Runtime Environment**| **Node.js** | `v18.x / v20.x` | High-throughput asynchronous JavaScript event loop capable of thousands of concurrent I/O events. |
| **Backend Framework** | **Express.js** | `^4.21.2` | Minimalist, unopinionated HTTP routing framework with robust middleware piping. |
| **Language Standard** | **ES Modules (ESM)**| Native | Native `"type": "module"` standard allowing cleaner imports, top-level awaits, and alignment with modern JavaScript. |
| **Relational Database**| **PostgreSQL** | `14+ / 16 Alpine` | ACID-compliant relational data store with advanced indexing, JSONB support, and PL/pgSQL triggers. |
| **Database Driver** | **node-postgres (`pg`)** | `^8.13.1` | Native, lightweight connection pool driver executing raw parameterized SQL queries without ORM abstraction overhead. |
| **Authentication** | **jsonwebtoken** | `^9.0.2` | Cryptographic signing and stateless verification of JSON Web Tokens (JWT). |
| **Password Hashing** | **bcryptjs** | `^2.4.3` | Adaptive key-derivation function with 10 salt rounds for secure credential storage. |
| **Schema Validation** | **Zod** | `^3.24.2` | Composable, static-inferred schema validation for incoming HTTP request payloads. |
| **File Multipart** | **Multer** | `^2.4.0` | Streaming multipart/form-data handler for file uploads with size and MIME validation. |
| **Logging Subsystem** | **Winston** | `^3.17.0` | Leveled, structured logging with console output and daily rotating log file storage. |
| **Real-time Protocol** | **ws (WebSocket)** | `^8.18.0` | Low-latency, full-duplex TCP communication channels for instant administrative alerts and status sync. |
| **Document Synthesis** | **pdf-lib** | `^1.17.1` | Vector-accurate client and server PDF document generation for formal test reports and payslips. |
| **Email Transport** | **Nodemailer** | `^6.10.1` | SMTP transport agent supporting secure TLS/STARTTLS delivery for transactional notifications. |
| **AI Integration** | **OpenAI SDK** | `^7.10.0` | Natural language processing for proposal refinement and smart lead analysis. |
| **Containerization** | **Docker & Compose** | `Compose v2` | Multi-container isolated orchestration for zero-configuration staging and production deployments. |

### 5.2 Rationale Behind Architectural Choices
1. **Raw Parameterized SQL over Heavy ORMs:** Rather than using heavy abstraction layers like Prisma or TypeORM, the platform utilizes parameterized SQL queries (`$1, $2`). This eliminates ORM N+1 query overhead, provides total control over execution plans, and enables complex PL/pgSQL triggers and analytical aggregations.
2. **Dual-Database Separation:** Segregating the `HRMS` database from the `crm` database mirrors enterprise boundaries. Human resources and payroll data maintain strict internal confidentiality, while customer relationships and sales pipelines can be scaled or backed up independently.
3. **Pure WebSockets over External Push Services:** Eliminates third-party reliance on proprietary push platforms (e.g., Pusher/Firebase), retaining complete privacy and zero cost at enterprise scale.

---

## 6. Major Modules

The application is decomposed into 14 major functional domains covering 25 UI views:

### Module 1: HRMS — Core Employee Lifecycle & Org Structure
- **Purpose:** Centralized repository for organizational hierarchy and employee records.
- **Responsibilities:** Onboarding, employee profile maintenance, role assignment, departmental classification, branch allocation, and termination workflows.
- **Main Features:**
  - Auto-generated sequential employee codes (`EMP-001`, `EMP-002`).
  - Emergency contacts, banking records, PAN/Aadhaar compliance numbers, and PF account metadata.
  - Multi-tier organization structure: Departments (Engineering, Sales, HR), Designations, and Branch Offices.
  - One-click employee status toggling (`active`, `probation`, `notice`, `terminated`).
- **Dependencies:** PostgreSQL `employees`, `departments`, `designations`, `branches` tables.

### Module 2: Attendance Management & Biometric Kiosk
- **Purpose:** Real-time tracking of employee work hours, daily clock-in/out, and shift adherence.
- **Responsibilities:** Enforcing shift timings, tracking biometric punches, computing late marks, overtime calculation, and providing a full-screen interactive Kiosk interface.
- **Main Features:**
  - Kiosk Mode with PIN authentication and webcam visual verification.
  - Automated calculation of daily work hours via database triggers (`clock_out - clock_in`).
  - Shift master configuration (Morning, General, Night shifts with customizable grace periods).
  - Geofencing and client IP validation for attendance integrity.
  - Instant live updates pushed to administrative dashboard rosters via WebSockets.
- **Dependencies:** `attendance_logs`, `shifts`, `employees`, `ws` WebSocket broadcast.

### Module 3: Leave Management & Approval Engine
- **Purpose:** Digital administration of employee time-off, statutory leave entitlements, and approvals.
- **Responsibilities:** Balance decrementing, leave history tracking, multi-level manager approval, and holiday calendar integration.
- **Main Features:**
  - Configurable leave quotas (Casual Leave - CL, Sick Leave - SL, Privilege Leave - PL).
  - Automated balance checks preventing leave application when available balance is insufficient.
  - Real-time approval/rejection triggers notifying employees instantly.
  - Approved unpaid leaves auto-flagged as Loss of Pay (LOP) for payroll processing.
- **Dependencies:** `leave_requests`, `leave_balances`, `employees`, `payroll_runs`.

### Module 4: Central Payroll Engine
- **Purpose:** Autonomous, compliant payroll calculation, payslip delivery, and statutory tracking.
- **Responsibilities:** Generating gross-to-net pay computations, enforcing statutory deductions, and locking monthly payroll runs.
- **Main Features:**
  - CTC component configuration: Basic (40-50%), HRA, Conveyance, Special Allowances.
  - Statutory compliance engine:
    - **PF:** 12% of Basic, capped strictly at statutory ₹1,800/month.
    - **ESI:** 0.75% of Gross for employees earning under ₹21,000/month.
    - **Professional Tax (PT):** State-specific stepped slab calculation.
    - **TDS:** Income tax withholding calculation.
  - Programmatic Loss of Pay (LOP) formula: `LOP Deduction = (Gross Salary / Total Working Days) * LOP Days`.
  - PDF payslip generation and distribution via `pdf-lib`.
- **Dependencies:** `employee_salaries`, `payroll_runs`, `payslips`, `chart_of_accounts`.

### Module 5: Employee Self-Service (ESS) Portal
- **Purpose:** Employee empowerment through a dedicated, isolated self-service environment.
- **Responsibilities:** Allowing staff to review personal metrics without administrative intervention.
- **Main Features:**
  - Dedicated route `/employee` isolated from administrative navigation controls.
  - Real-time punch-in/out widget with live stopwatch.
  - Leave balance cards, history tracker, and leave request submission.
  - Payslip download archive and company policy document viewer.
- **Dependencies:** JWT token claims with `role: "employee"`, `routes/ess.js`.

### Module 6: Recruitment & Applicant Tracking System (ATS)
- **Purpose:** Managing end-to-end talent acquisition from job requisition to offer acceptance.
- **Responsibilities:** Candidate pipeline tracking, resume indexing, interview scheduling, and hire conversion.
- **Main Features:**
  - Visual candidate hiring pipeline (Applied, Screening, Interview, Offered, Hired, Rejected).
  - Resume attachment storage with MIME validation.
  - 1-click candidate conversion into active Employee record with prefilled demographic details.
- **Dependencies:** `job_applications`, `job_openings`, `employees`.

### Module 7: CRM & Lead Pipeline (Kanban)
- **Purpose:** Commercial lead acquisition, qualification tracking, and sales cycle management.
- **Responsibilities:** Lead ingestion, lead scoring, deal stage tracking, activity logging, and follow-ups.
- **Main Features:**
  - Drag-and-drop Kanban pipeline: New -> Contacted -> Qualified -> Proposal -> Negotiation -> Won -> Lost.
  - Follow-up scheduling with calendar synchronization and overdue reminders.
  - 1-Click "Convert Won Lead" to Customer record and linked onboarding Project.
- **Dependencies:** `crmPool`, `leads`, `customers`, `opportunities`, `crm_activities`.

### Module 8: Sales Operations (Quotations, Orders & Invoicing)
- **Purpose:** Commercial transaction generation, tax calculation, and payment lifecycle tracking.
- **Responsibilities:** Price quotation authoring, sales order confirmation, and tax invoice generation.
- **Main Features:**
  - Line-item builder with tax rate calculations (GST/VAT).
  - Quotation revision tracking with PDF export.
  - Sales order fulfillment tracking and linked CRM invoice generation.
  - Invoice status ledger: Draft -> Issued -> Partially Paid -> Paid -> Void.
- **Dependencies:** `quotations`, `sales_orders`, `crm_invoices`, `products`, `customers`.

### Module 9: Finance & Accounting (General Ledger, Banking, Expenses)
- **Purpose:** Comprehensive enterprise bookkeeping and cash flow tracking.
- **Responsibilities:** Double-entry accounting, bank ledger reconciliation, and staff expense processing.
- **Main Features:**
  - Standardized Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expenses).
  - Journal entry creation linked to payroll runs and sales invoice settlements.
  - Bank account transaction ledgers with deposit/withdrawal reconciliations.
  - Employee expense reimbursement claim workflows with receipt attachment uploads.
- **Dependencies:** `accounts`, `general_ledger`, `bank_accounts`, `expense_claims`.

### Module 10: Procurement & Inventory Management
- **Purpose:** Vendor lifecycle management, purchase ordering, and warehouse stock tracking.
- **Responsibilities:** Vendor master records, PO issuance, goods receipt tracking, and item valuation.
- **Main Features:**
  - Vendor rating, payment terms, and commercial catalog.
  - Multi-item Purchase Orders with automatic status progression (Draft -> Sent -> Received).
  - Inventory product catalog with reorder threshold alerts and stock adjustment audits.
- **Dependencies:** `vendors`, `purchase_orders`, `products`.

### Module 11: Projects & Resource Allocations
- **Purpose:** Client delivery governance, milestone scheduling, and group collaboration.
- **Responsibilities:** Tracking project scope, repository links, delivery phases, and team assignments.
- **Main Features:**
  - Comprehensive Project Details View with repository URLs, budgets, and milestone progress.
  - Resource Allocation Panel mapping employees to projects with percentage allocation and duration.
  - Project Groups with team chat messaging and phase-based approval workflows.
- **Dependencies:** `projects`, `project_allocations`, `project_groups`, `team_chat_messages`.

### Module 12: Timesheets & Enterprise Task Board
- **Purpose:** Daily engineering/operational task distribution and billable timesheet tracking.
- **Responsibilities:** Task assignments, checklist verification, time logging, and manager approvals.
- **Main Features:**
  - Standalone weekly timesheet submission with project, task, and billable hour tagging.
  - Administrative timesheet review, approval, and rejection workflow.
  - Enterprise task board with subtask checklists, priority flags, and file attachments.
- **Dependencies:** `timesheets`, `tasks`, `task_attachments`, `employees`, `projects`.

### Module 13: Enterprise Document Management System (DMS)
- **Purpose:** Secure corporate repository for employee, financial, and organizational documentation.
- **Responsibilities:** Document indexing, version control, category tagging, and role-based permissions.
- **Main Features:**
  - Categories: HR Policies, Employee Identity Docs, Client Contracts, Test Reports.
  - Multer upload pipeline with SHA-256 integrity checksums.
  - Role-gated document access: employees only access personal files; HR/Admins access corporate records.
- **Dependencies:** `documents`, `document_categories`, `document_types`, Multer storage.

### Module 14: Quality Assurance & Test Management
- **Purpose:** Integrated QA testing harness, test case execution, and compliance reporting.
- **Responsibilities:** Tracking manual and automated test execution, bug logs, and formal report synthesis.
- **Main Features:**
  - QA test suites, test run histories, and pass/fail metric tracking.
  - Dedicated Attendance Test Reports and Software Test Reports view.
  - 4-page formal Software Test Report PDF synthesis powered by `TestReportPdfService`.
- **Dependencies:** `qa_test_suites`, `qa_test_cases`, `qa_test_runs`, `pdf-lib`.

---

## 7. System Workflow

### 7.1 End-to-End Enterprise Workflow
The diagram below illustrates how a single business cycle flows through the platform:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 1: REVENUE GENERATION (CRM & SALES)                       │
│                                                                                        │
│   [Lead Generated]  ──►  [Kanban Stage Moves]  ──►  [Lead Marked 'Won']               │
│   (Marketing/Cold)       (Qualified / Demo)         │                                  │
│                                                     ▼                                  │
│   [Invoice Issued]  ◄──  [Quotation / Order]  ◄───  [Auto-Convert to Customer]         │
│   (Payment Tracked)      (Pricing & Scope)          │                                  │
└─────────────────────────────────────────────────────┼──────────────────────────────────┘
                                                      │ Triggers Onboarding
                                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     PHASE 2: PROJECT DELIVERY & OPERATIONS (ERP)                       │
│                                                                                        │
│   [Project Created] ──►  [Tasks Distributed]  ──►  [Employees Allocated]               │
│   (Scope & Budget)       (Checklists & Due)         │                                  │
│                                                     ▼                                  │
│   [QA Verification] ◄──  [Milestones Met]     ◄───  [Weekly Timesheet Logged]          │
│   (Test Reports)         (Progress Updated)         │                                  │
└─────────────────────────────────────────────────────┼──────────────────────────────────┘
                                                      │ Correlated with Punch Logs
                                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                 PHASE 3: HUMAN RESOURCES & PAYROLL (HRMS & FINANCE)                    │
│                                                                                        │
│   [Daily Attendance]──►  [Shift Adherence]    ──►  [Approved Leaves & LOP]             │
│   (Biometric/Kiosk)      (Late/Overtime)            │                                  │
│                                                     ▼                                  │
│   [General Ledger]  ◄──  [Payslip Delivered]  ◄───  [Monthly Payroll Run]              │
│   (Journal Entries)      (PDF via ESS / Mail)       (Statutory PF / ESI / TDS / PT)    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Core Operational Sequences
1. **Sales Conversion Sequence:** A lead is created via API or UI -> Sales representative updates notes -> On deal close, clicking "Convert" writes a new customer record to `customers`, archives the lead, and creates an initial record in `projects`.
2. **Attendance to Payroll Pipeline:** Employee clocks in via Kiosk or Web -> Trigger calculates duration -> At month-end, HR clicks "Run Payroll" -> System fetches worked days, subtracts approved unpaid leave (LOP), calculates statutory PF/ESI/PT/TDS deductions, and writes locked payslip records.
3. **Task & Timesheet Flow:** Project Manager assigns tasks -> Assignee marks tasks complete -> Timesheet hours are logged against the project -> Manager approves -> Hours flow into customer billing reports.

---

## 8. Data Model

The data layer is segregated across two PostgreSQL databases. Below is the relational entity map showing the primary business entities:

### 8.1 Primary Database Entities

```
                          ┌────────────────────────┐
                          │       departments      │
                          └───────────┬────────────┘
                                      │ 1
                                      │
                                      │ N
                          ┌───────────▼────────────┐
                          │       employees        │◄────────────────────────┐
                          └─────┬───┬───┬───┬───┬──┘                         │
                                │   │   │   │   │                            │
             ┌──────────────────┘   │   │   │   └────────────────┐           │
             │ 1                    │   │   │ 1                  │ 1         │
             │                      │   │   │                    │           │
             │ N                    │   │   │ N                  │ N         │
┌────────────▼───────────┐          │   │ ┌─▼──────────────┐ ┌───▼─────────┐ │
│    attendance_logs     │          │   │ │ leave_requests │ │  timesheets │ │
└────────────────────────┘          │   │ └────────────────┘ └─────────────┘ │
                                    │   │                                    │
                                    │ 1 │ 1                                  │
                                    │   │                                    │
                                    │ N │ N                                  │
                          ┌─────────▼───▼──────────┐                         │
                          │      payroll_runs      │                         │
                          └───────────┬────────────┘                         │
                                      │ 1                                    │
                                      │                                      │
                                      │ N                                    │
                          ┌───────────▼────────────┐                         │
                          │        payslips        │                         │
                          └────────────────────────┘                         │
                                                                             │
============================== DUAL-DB BOUNDARY ============================│====
                                                                             │
                          ┌────────────────────────┐                         │
                          │       customers        │                         │
                          └───────────┬────────────┘                         │
                                      │ 1                                    │
                                      │                                      │
                                      │ N                                    │
                          ┌───────────▼────────────┐       N:1               │
                          │        projects        │─────────────────────────┘
                          └─────┬───────────────┬──┘
                                │ 1             │ 1
                                │               │
                                │ N             │ N
                          ┌─────▼──────┐  ┌─────▼──────────┐
                          │   tasks    │  │  allocations   │
                          └────────────┘  └────────────────┘
```

### 8.2 Key Entity Definitions

| Domain | Entity Name | Database | Description & Key Foreign-Key Relationships |
|:---|:---|:---|:---|
| **HRMS** | `employees` | `HRMS` | Master personnel table containing demographic, credential, and status attributes. Foreign keys to `departments`, `designations`, and `branches`. |
| **HRMS** | `attendance_logs` | `HRMS` | Daily biometric punch entries. Linked via `employee_id` to `employees`. Duration and status computed via database triggers. |
| **HRMS** | `leave_requests` | `HRMS` | Employee leave submissions. Foreign key to `employees`. Status: `Pending`, `Approved`, `Rejected`. |
| **HRMS** | `payroll_runs` | `HRMS` | Monthly payroll batch master record detailing pay period, total gross disbursement, and processing status. |
| **HRMS** | `payslips` | `HRMS` | Granular per-employee net pay vouchers detailing PF, ESI, PT, TDS, and LOP deductions. Foreign keys to `employees` and `payroll_runs`. |
| **HRMS** | `timesheets` | `HRMS` | Standalone weekly time logs tagged with project code, hours worked, billable status, and approval state. |
| **CRM** | `leads` | `crm` | Commercial inquiries and prospects. Captures pipeline stage, estimated value, source, and assigned sales agent. |
| **CRM** | `customers` | `crm` | Master client directory created upon winning leads or manual entry. Linked to contacts, opportunities, and projects. |
| **CRM** | `quotations` | `crm` | Commercial estimates detailing line-items, tax computations, discount allowances, and approval states. |
| **CRM** | `crm_invoices` | `crm` | Tax invoices issued to customers. Tracks total billed, payment status, and links to general ledger journals. |
| **CRM** | `projects` | `crm` | Delivery master record tracking repository URL, budget, manager, start/end dates, and milestones. |
| **CRM** | `tasks` | `crm` | Granular work items linked to projects with assignees, checklist items, and priority flags. |

---

## 9. External Integrations

| Service / Tool | Protocol / Integration Method | Purpose in System | Configuration Keys |
|:---|:---|:---|:---|
| **SMTP Mail Server** | SMTP over TLS/SSL (`nodemailer`) | Automated delivery of employee payslip PDFs, leave approval alerts, and password resets. | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` |
| **OpenAI API** | REST API (`openai` SDK) | AI-powered proposal refinement, executive task summaries, and intelligent lead scoring. | `OPENAI_API_KEY` |
| **Biometric / Kiosk** | HTTP POST / REST webhook | Hardware biometric fingerprint/face scanners clocking in via `/api/attendance/kiosk-punch`. | Device API token, Static IP whitelist |
| **PDF Synthesis Engine**| In-memory binary generation (`pdf-lib`) | High-speed, client/server vector rendering of formal 4-page Software Test Reports and Payslips. | Embedded Helvetica standard fonts |
| **WebSocket Engine** | RFC 6455 Native WebSocket (`ws`) | Full-duplex live synchronization between administrative control panels and employee self-service terminals. | Inherits HTTP server port |

---

## 10. Configuration & Environment

### 10.1 Environment Variables Specification
Below are all environment variables required by the system (sensitive secrets represented with placeholders):

```env
# ─── Server Configuration ─────────────────────────────────────
PORT=5000
NODE_ENV=development                       # 'development' | 'production' | 'test'

# ─── HRMS Database (Primary — Employees, Payroll, Attendance) ──
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRESQL_PASSWORD
DB_HOST=localhost                          # e.g., 'localhost' or 'hrms-db' in Docker
DB_NAME=HRMS
DB_PORT=5432

# ─── CRM Database (Secondary — Leads, Customers, Sales) ────────
CRM_DB_USER=postgres
CRM_DB_PASSWORD=YOUR_POSTGRESQL_PASSWORD
CRM_DB_HOST=localhost                      # e.g., 'localhost' or 'crm-db' in Docker
CRM_DB_NAME=crm
CRM_DB_PORT=5432

# ─── Authentication Security ──────────────────────────────────
JWT_SECRET=YOUR_SECURE_RANDOM_LONG_SECRET_KEY_2026

# ─── SMTP Email Configuration ──────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587                              # 587 (STARTTLS) or 465 (SSL)
SMTP_SECURE=false                          # true for 465, false for 587
SMTP_USER=your_organization_email@gmail.com
SMTP_PASS=your_app_specific_password       # Never commit plain password
MAIL_FROM="Enterprise ERP" <your_organization_email@gmail.com>

# ─── AI Integrations (Optional) ───────────────────────────────
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE
```

### 10.2 Important Configuration Files
- **`backend/.env`**: Main application configuration for database connections, JWT secrets, and external services.
- **`backend/db/pool.js`**: Defines the two `pg.Pool` connection managers with error handlers and connection limits.
- **`frontend/vite.config.ts`**: Configures Vite dev server, TypeScript compilation, and proxy rules forwarding `/api` calls to `http://localhost:5000`.
- **`docker-compose.yml`**: Multi-container production deployment definition for backend, frontend, and dual PostgreSQL instances.

---

## 11. Deployment Overview

### 11.1 Deployment Environments

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION DEPLOYMENT TOPOLOGY                            │
│                                                                                        │
│                                 Internet / Client Browser                              │
│                                             │                                          │
│                                             ▼                                          │
│                           ┌───────────────────────────────────┐                        │
│                           │      Nginx Reverse Proxy / SSL    │                        │
│                           │   (Port 80/443 -> SSL Termination)│                        │
│                           └─────────┬───────────────┬─────────┘                        │
│                                     │               │                                  │
│                 Static Requests     │               │ API & WS Requests                │
│                 (HTML, JS, CSS)     │               │ (/api/*, /uploads/*, ws://)      │
│                                     ▼               ▼                                  │
│                 ┌───────────────────────┐   ┌──────────────────────────────┐           │
│                 │  Vite Production Build│   │  Node.js Express API Server  │           │
│                 │   (dist/ Static Web)  │   │  (PM2 Cluster Mode — Port 5000)│         │
│                 └───────────────────────┘   └───────────────┬──────────────┘           │
│                                                             │                          │
│                                              Connection Pools (pg.Pool)                │
│                                                             │                          │
│                                     ┌───────────────────────┴───────────────┐          │
│                                     ▼                                       ▼          │
│                         ┌───────────────────────┐               ┌──────────────────┐   │
│                         │  PostgreSQL: HRMS DB  │               │ PostgreSQL: CRM  │   │
│                         │  (Port 5432 - Primary)│               │ (Port 5432 - Sec)│   │
│                         └───────────────────────┘               └──────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 1. Local Development Environment
- Backend executed via native Node.js: `npm run dev` (utilizing Node watch mode on port 5000).
- Frontend executed via Vite dev server: `npm run dev` (with Hot Module Replacement on port 5173).
- Databases hosted on local PostgreSQL service on default port 5432.

#### 2. Staging / Containerized Environment
- Handled through `docker-compose.yml`.
- Spins up four coordinated containers:
  - `crm-frontend` (Port 3001)
  - `crm-backend` (Port 5001)
  - `hrms-db` (PostgreSQL container mapped to port 5434)
  - `crm-db` (PostgreSQL container mapped to port 5435)

#### 3. Production Environment
- **Web Server:** Nginx acting as reverse proxy handling SSL certificates (Let's Encrypt / Certbot), gzip/brotli compression, and rate limiting.
- **Process Manager:** PM2 managing the Express API server in cluster mode (`pm2 start index.js -i max --name "crm-api"`), providing zero-downtime reloads and automatic restarts on crash.
- **Database Server:** Dedicated PostgreSQL 16 instance configured with WAL archiving, parameterized connection pooling (`max: 20` per pool), and hourly incremental snapshots.

---

## 12. Project Structure

Below is the simplified folder hierarchy explaining the responsibility of each major directory:

```
CRM/
├── backend/                              # Node.js Express Backend Service
│   ├── config/                           # System configuration and environment loaders
│   ├── controllers/                      # Business controllers for specialized workflows
│   ├── db/                               # Database connectivity & migration engine
│   │   ├── migrations/                   # 23 sequential SQL migration scripts
│   │   ├── migrator.js                   # Idempotent migration runner with schema tracking
│   │   └── pool.js                       # Dual pg.Pool connections (hrmsPool, crmPool)
│   ├── middleware/                       # Request processing pipeline
│   │   ├── auth.js                       # JWT token authentication middleware
│   │   ├── moduleAuth.js                 # Role & module-level authorization guards
│   │   └── errorHandler.js               # Centralized exception formatter
│   ├── routes/                           # 41 REST router definitions (auth, employees, etc.)
│   ├── services/                         # Reusable domain services (payroll, email, pdf)
│   ├── tests/                            # Master test runner & 9 comprehensive test suites
│   ├── uploads/                          # Static upload storage (tasks, docs, timesheets)
│   ├── utils/                            # Shared utilities (WebSocket server, helpers)
│   ├── validators/                       # Zod runtime request payload validation schemas
│   ├── index.js                          # Express application entry point & server boot
│   └── package.json                      # Backend dependency manifest
│
├── frontend/                             # React 18 TypeScript Single Page Application
│   ├── public/                           # Static assets, logos, and favicon icons
│   ├── src/
│   │   ├── app/                          # Navigation routes and layout wrappers
│   │   ├── components/                   # Shared UI primitives (modals, buttons, navbar)
│   │   ├── context/                      # Global state management via AppContext.tsx
│   │   ├── modules/                      # 25 domain-driven feature modules
│   │   │   ├── attendance/               # Biometric kiosk, daily rosters, regularization
│   │   │   ├── crm/                      # Lead Kanban, customer profiles, follow-ups
│   │   │   ├── documents/                # DMS categories, file list, preview modals
│   │   │   ├── employee/                 # Dedicated ESS self-service portal
│   │   │   ├── hrms/                     # Employee directory, departments, branches
│   │   │   ├── payroll/                  # Salary runs, CTC config, payslip generator
│   │   │   ├── projects/                 # Delivery views, project allocations, groups
│   │   │   ├── tasks/                    # Enterprise task boards and subtask lists
│   │   │   ├── testing/                  # QA test suites and test report management
│   │   │   └── timesheets/               # Standalone weekly timesheet entries
│   │   ├── services/                     # Typed API client services (apiService.ts)
│   │   ├── types/                        # Global TypeScript interfaces and data models
│   │   ├── App.tsx                       # Root React component with routing switch
│   │   └── main.tsx                      # DOM mount point
│   ├── vite.config.ts                    # Vite build configuration and reverse proxy
│   └── package.json                      # Frontend dependency manifest
│
└── docs/                                 # Complete documentation repository
    ├── 1_Project_Documentation.md        # High-level architecture overview
    ├── 2_Source_Code_Handover_Report.md  # Detailed routing & codebase inventory
    ├── 3_Project_Setup_Guide.md          # Step-by-step developer onboarding & runbook
    ├── 4_Technical_Documentation.md      # Security, database triggers, payroll logic
    ├── 5_Database_and_API_Documentation.md # Full table schemas and endpoint inventory
    ├── 6_Testing_Report.md               # Test execution strategy and command index
    ├── 7_Project_Status_and_Pending_Work.md # Known issues and enhancement backlog
    ├── 8_Final_Project_Handover_Summary.md  # Master checklist and handover summary
    ├── 9_Testing_Reports_All_Types.md    # 9-suite test report documentation
    └── Startup_Project_Documentation.pdf # ← Official Compiled Technical PDF Manual
```

---

## 13. Known Limitations & Technical Debt

### 13.1 Scalability Limits
- **Single-Node WebSocket Topology:** The real-time notification engine relies on Node's in-memory `ws` library. This operates efficiently for up to ~5,000 concurrent sockets on a single server. Beyond this scale, a Redis Pub/Sub adapter is required to broadcast socket events across multi-instance clusters.
- **Local Disk File Storage:** Uploaded attachments (documents, task files, lead contracts) are stored in `backend/uploads/` on the local file system. In a distributed multi-server deployment, this should be transitioned to Amazon S3 or Google Cloud Storage.

### 13.2 Technical Debt
- **CommonJS Test Suite Execution:** While the backend is natively authored in ES Modules (`"type": "module"`), several legacy unit and integration test scripts in `tests/` maintain `.cjs` or CommonJS syntax.
- **Database Trigger Dependency:** Key business logic (such as attendance work hour calculation and updated-at timestamps) resides inside PostgreSQL PL/pgSQL database triggers. While highly performant, developers must inspect SQL migration files rather than Node.js code to debug trigger-based updates.

### 13.3 Postponed Features
- **Mobile Native Application:** The platform currently delivers a responsive mobile web experience (optimized for ESS). Dedicated native iOS and Android wrappers using React Native remain scheduled for subsequent release cycles.
- **Integrated Video Conferencing:** Recruitment interview scheduling currently stores third-party links (Google Meet/Zoom) rather than offering in-app WebRTC video conferencing.
- **Multi-Currency Dynamic Forex:** Multi-currency support currently relies on fixed manual exchange rates rather than a live dynamic currency exchange API.

### 13.4 Performance Considerations
- **Index Optimization on Punch Logs:** As the `attendance_logs` table accumulates hundreds of thousands of punch records, composite indexing on `(employee_id, date)` must be periodically maintained.
- **PDF Synthesis Memory Allocation:** High-volume batch generation of payslips or test reports using `pdf-lib` consumes notable RAM buffers. Batch payroll generation should be capped at 100 payslips per asynchronous batch.

---

## 14. Maintenance & Operations

### 14.1 Scheduled Maintenance Tasks
- **Daily Attendance Reconciliation (Midnight Cron):** Automatically flags employees who failed to clock in as "Absent" and updates the daily attendance summary.
- **Monthly Payroll Draft Creation (25th of Every Month):** Scans active employee records, computes attendance loss-of-pay deductions for the month, and drafts the preliminary payroll run for HR review.
- **Weekly Database Maintenance:** Automated execution of `VACUUM ANALYZE` on PostgreSQL databases every Sunday at 02:00 AM to optimize query planner performance and reclaim disk space.

### 14.2 Backup Strategy
- **Daily Full Logical Backups:** Automated cron job executing `pg_dump` on both `HRMS` and `crm` databases:
  ```bash
  # Daily backup command example
  pg_dump -U postgres -d HRMS | gzip > /backups/hrms_$(date +\%Y\%m\%d).sql.gz
  pg_dump -U postgres -d crm | gzip > /backups/crm_$(date +\%Y\%m\%d).sql.gz
  ```
- **Retention Schedule:**
  - Daily backups preserved for 7 days.
  - Weekly Sunday backups preserved for 4 weeks.
  - Monthly snapshots archived to cold off-site storage for 12 months.
- **Disaster Recovery (RTO / RPO):**
  - **Recovery Time Objective (RTO):** < 30 minutes to spin up new containers and restore schemas.
  - **Recovery Point Objective (RPO):** < 24 hours with standard daily dumps (or < 15 minutes with PostgreSQL WAL archiving enabled).

### 14.3 Logging & Monitoring
- **Structured Application Logs:** Managed by Winston, writing to:
  - `backend/logs/combined.log` (All standard HTTP requests, SQL queries, and socket events).
  - `backend/logs/error.log` (Unhandled exceptions, 500 responses, and database connection failures).
- **Health Check Endpoint:** Public, unauthenticated endpoint at `GET /api/health` returning live database pool statuses, memory usage, and process uptime.

### 14.4 Common Troubleshooting Playbook

| Symptom / Error | Root Cause | Immediate Remediation Action |
|:---|:---|:---|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL service stopped or credentials invalid | Verify PostgreSQL service is running (`services.msc` or `systemctl status postgresql`). Check `backend/.env` credentials. |
| `ERR_MODULE_NOT_FOUND` | Missing npm package in `node_modules` | Run `npm install` inside `backend/` or `frontend/` to ensure all dependencies from `package.json` are installed. |
| `403 Forbidden: Module Not Permitted` | Logged-in employee lacks permission for module | Check `employee_module_assignments` table in `HRMS` DB or assign the module to the user via Super Admin Settings. |
| `WebSocket connection failed` | Port blocked or proxy misconfigured | Ensure port 5000 is open in firewall; verify Nginx has `proxy_set_header Upgrade $http_upgrade;` and `Connection "upgrade";`. |
| Vite HMR WebSocket disconnect | Frontend proxy mispointing | Check `frontend/vite.config.ts` target points to active backend port (`http://localhost:5000`). |

---

## 15. Changelog & Version History

| Version | Release Date | Summary of Key Changes & Major Milestones |
|:---|:---|:---|
| **`v1.0.0`** | May 15, 2026 | Initial prototype release. Basic employee profile master, primitive attendance punch logging, and simple lead table. |
| **`v1.5.0`** | July 10, 2026 | Architectural shift to Dual-Database model (`HRMS` + `crm`). Implemented idempotent migration runner (`migrator.js`) and JWT authentication. |
| **`v2.0.0`** | August 28, 2026 | Central Payroll Engine with statutory PF/ESI/PT/TDS rules. Launched dedicated Employee Self-Service (`/employee`) portal with biometric Kiosk UI. |
| **`v2.2.0`** | September 20, 2026 | Enterprise Task Board with checklist items. Integrated Document Management System (DMS) with Multer upload pipeline and SHA-256 checks. |
| **`v2.3.0`** | October 14, 2026 | Integrated QA Testing Management module. Added Project Allocations panel and Standalone Timesheets system with approval gates. |
| **`v2.4.0-prod`** | October 30, 2026 | **Current Production Release.** Comprehensive 9-suite testing harness (45+ tests), Nodemailer SMTP transactional integration, Proposal Refinement AI workflows, and security hardening. |

---

## 16. References & Separate Documents

### 16.1 Internal Project Documentation Index
The project codebase is accompanied by 9 dedicated technical reports maintained in the `docs/` directory:
- **`[1] 1_Project_Documentation.md`**: Executive platform summary, business problems, user personas, and module inventories.
- **`[2] 2_Source_Code_Handover_Report.md`**: Granular source code inventory, 41 API router paths, and middleware sequences.
- **`[3] 3_Project_Setup_Guide.md`**: Step-by-step developer onboarding, PostgreSQL setup, and Docker deployment guide.
- **`[4] 4_Technical_Documentation.md`**: Architectural deep-dive covering JWT security, database triggers, and payroll formulas.
- **`[5] 5_Database_and_API_Documentation.md`**: Full entity relationship models, 23 migration histories, and complete API endpoint catalog.
- **`[6] 6_Testing_Report.md`**: QA strategy, test suite categorization, and automated testing run instructions.
- **`[7] 7_Project_Status_and_Pending_Work.md`**: Module completion audit, known issues matrix, and prioritized backlog.
- **`[8] 8_Final_Project_Handover_Summary.md`**: Master handover checklist, deployment credentials, and operational runbook.
- **`[9] 9_Testing_Reports_All_Types.md`**: In-depth test execution report covering all 9 software testing disciplines.

### 16.2 Separate Operational Documents Notice
In accordance with enterprise governance standards, the following companion manuals should be maintained and referenced as separate standalone documents for distinct operational teams:
1. **API Documentation**: Detailed Swagger/OpenAPI 3.0 specification covering every request/response JSON payload and HTTP status code.
2. **Database Schema Guide**: Full data dictionary listing every table, column data type, default value, index, and trigger definition.
3. **Deployment & DevOps Guide**: Production infrastructure runbook with Nginx configs, SSL renewal scripts, and Docker container maintenance.
4. **Testing & QA Guide**: Test case catalog, test data seeding scripts, and regression testing protocols.
5. **Developer Onboarding Guide**: Day-1 developer guide covering local environment setup, Git branching models, and pull request conventions.
6. **User Manual & Training Guides**: Role-specific operating guides for HR Admins, Accountants, Sales Staff, and General Employees.

---
*End of Technical Documentation — Enterprise CRM, HRMS & ERP Management Platform*

