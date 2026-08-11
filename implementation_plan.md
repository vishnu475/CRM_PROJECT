# Implementation Plan - Advanced CRM + HRMS + ERP Suite

Build a full-featured, responsive enterprise business management platform following the exact module flow specified in the PDF blueprint and request:
`Dashboard → CRM → Sales → Customers → HRMS → Attendance → Leave → Payroll → Recruitment → Accounts → Ledger → Banking → Expenses → Purchases → Vendors → Inventory → Projects → Tasks → Helpdesk → Documents → Reports → Automation → Administration → Settings`

---

## Technical Stack & Architecture

- **Frontend Core**: React 18 / TypeScript with Vite for fast HMR and modular bundling.
- **Styling**: Tailwind CSS + Custom CSS Variables for sleek dark/light mode themes, glassmorphism, responsive data grids, and smooth micro-animations.
- **Icons**: `lucide-react` for rich enterprise module iconography.
- **State & Data Management**: In-memory relational state engine supporting live CRUD operations, automatic double-entry accounting posting, payroll calculation engine, and cross-module linkages (Lead-to-Cash, Procure-to-Pay, Hire-to-Retire).
- **Data Persistence**: `localStorage` persistence with seed data reset options to allow realistic end-to-end testing across all 25 modules.

---

## Modules Breakdown & Workflows

### 1. Dashboard & Analytics
- Multi-role switchable views (Executive, Sales, HR, Finance, Operations).
- Interactive KPI cards (Revenue, Pipeline Value, Employee Attendance %, Open Tickets, Net Profit).
- Recent activity timeline, pending approvals drawer, quick action shortcuts.

### 2. CRM (Lead & Opportunity Management)
- Lead pipeline (New, Contacted, Qualified, Proposal, Won, Lost) with drag/drop/stage selector.
- Lead scoring, source tracking, activities, follow-up scheduling, and 1-click conversion to Customer/Opportunity.

### 3. Sales
- Quotation builder with multi-currency line items, GST/tax calculations, PDF preview, approval workflow, and conversion to Sales Orders / Invoices.

### 4. Customers
- Organization & Contact directory, credit limits, transaction history, customer ledger statements, and interaction timelines.

### 5. HRMS
- Employee Master directory, organization chart view, manager hierarchy, department management, bank & statutory details.

### 6. Attendance
- Daily check-in/check-out simulator, shift roster mapping, overtime tracking, regularization requests, and monthly attendance lock.

### 7. Leave
- Leave application portal, leave balance tracking (CL, PL, SL), multi-level manager approval, holiday calendar, team leave timeline.

### 8. Payroll
- Salary structure builder (Basic, HRA, Allowance, PF, ESI, TDS), LOP attendance auto-deduction, 1-click monthly Payroll Run, and printable Payslips.

### 9. Recruitment (ATS)
- Job postings, candidate pipeline stages (Sourced, Screening, Interview, Offer, Hired), interview scheduling, and candidate-to-employee onboarding wizard.

### 10. Accounts
- Chart of Accounts tree (Assets, Liabilities, Equity, Revenue, Expenses), account groups, opening balance management.

### 11. Ledger & Double-Entry Accounting
- General Ledger view with filterable transaction records, manual Journal Entry posting with balanced Debit=Credit validation, and voucher history.

### 12. Banking & Cash
- Bank accounts & cash book balances, internal fund transfer records, cheque tracking, and bank reconciliation tool.

### 13. Expenses
- Employee expense claim submission, receipt attachment preview, department/project cost center allocation, and manager/finance approval.

### 14. Purchases
- Purchase requisitions, Purchase Orders (PO), Goods Receipt Notes (GRN), Purchase Bill creation, and posting to Accounts Payable.

### 15. Vendors
- Vendor master records, tax/GST profiles, outstanding payables ledger, purchase order history, and payment schedule.

### 16. Inventory
- Item master/SKUs, warehouse locations, stock transaction ledger (GRN, Issue, Transfer, Adjustment), low-stock alerts, and stock valuation summary.

### 17. Projects
- Project tracking, milestone management, client linkage, budget vs actual expenditure, project profitability dashboard.

### 18. Tasks & Timesheets
- Interactive Kanban board & List view for tasks, subtasks, assignees, due dates, priority tags, and weekly timesheet entries.

### 19. Helpdesk & Support
- Ticket ticketing system with SLA response timers, priority flags, agent assignment, customer communication log, and resolution status.

### 20. Documents
- Central document vault with category tagging, entity linking (Customer, Employee, Invoice, Vendor), version tracking, and upload simulator.

### 21. Reports
- Financial statements (Profit & Loss, Balance Sheet, Trial Balance), Lead-to-Cash summary, HR headcount & attendance reports, inventory valuation report. Exportable as PDF / CSV.

### 22. Automation Engine
- Event-condition-action workflow rule builder (e.g. "Auto-assign leads", "Low stock alert trigger", "Payment reminder email").

### 23. Administration
- Company & Branch management, User Management, granular Role-Based Access Control (RBAC) matrix, and immutable Audit Log.

### 24. Settings
- System preferences, GST details, currency settings, automated numbering sequences for Quotes/Invoices/POs/Vouchers.

---

## Proposed Changes

### Application Initialization
- Create Vite React + TypeScript app in workspace root `./`
- Install dependencies (`lucide-react`, `clsx`, `tailwind-merge`, `jspdf`, `html2canvas` / CSS framing).
- Setup Tailwind CSS & Custom Theme tokens.

### Component Structure
- `src/components/layout/Header.tsx`: Top bar with global search, company switcher, branch switcher, notification bell, user profile menu.
- `src/components/layout/Sidebar.tsx`: Sequential navigation flow with active state indicators and collapsible submenus.
- `src/components/modules/`: 25 feature module views matching the user's explicit workflow chain.
- `src/context/AppContext.tsx`: Central state store handling sample data, CRUD actions, double-entry auto-postings, payroll calculations, and local persistence.
- `src/types/index.ts`: TypeScript domain model definitions for all entities across CRM, HRMS, ERP, and Accounting.
- `src/utils/accounting.ts`: Financial engine for journal postings and statement calculations.

---

## Verification Plan

### Automated Verification
- Run `npm run build` to ensure zero TypeScript errors or missing imports.
- Run dev server (`npm run dev`) and test page load speed & responsiveness.

### Manual Verification
- Test full flow traversal: `Dashboard → CRM → Sales → Customers → HRMS → Attendance → Leave → Payroll → Recruitment → Accounts → Ledger → Banking → Expenses → Purchases → Vendors → Inventory → Projects → Tasks → Helpdesk → Documents → Reports → Automation → Administration → Settings`.
- Verify cross-module actions:
  - Lead conversion to Customer & Opportunity.
  - Quotation creation -> Sales Order -> Invoice -> Ledger debit/credit posting.
  - Employee creation -> Attendance -> Leave -> Payroll run -> Payslip generation.
  - Expense submission -> Approval -> Cash/Bank ledger payment entry.
  - Purchase Order -> GRN -> Purchase Bill -> Vendor Payable posting.
