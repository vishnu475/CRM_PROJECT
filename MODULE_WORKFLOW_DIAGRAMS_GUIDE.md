# ERP Suite: Module-by-Module End-to-End Workflow Diagrams

This guide contains complete, detailed workflow diagrams for each distinct enterprise module across the entire ERP/CRM/HRMS platform.

---

## 📑 Table of Modules
1. [CRM & Sales Pipeline Workflow](#1-crm--sales-pipeline-workflow)
2. [HRMS & Employee Lifecycle Workflow](#2-hrms--employee-lifecycle-workflow)
3. [Biometric Attendance & Leave Workflow](#3-biometric-attendance--leave-workflow)
4. [Task Intelligence & Work Deliverables Workflow](#4-task-intelligence--work-deliverables-workflow)
5. [Payroll Processing & Salary Disbursement Workflow](#5-payroll-processing--salary-disbursement-workflow)
6. [Double-Entry Accounting & Banking Workflow](#6-double-entry-accounting--banking-workflow)
7. [Procurement, Vendors & Inventory Workflow](#7-procurement-vendors--inventory-workflow)
8. [Support Helpdesk & Ticket Resolution Workflow](#8-support-helpdesk--ticket-resolution-workflow)

---

## 1. CRM & Sales Pipeline Workflow

Tracks leads from initial acquisition through opportunity deal stages, price quotation, sales order confirmation, and final invoice generation.

```mermaid
flowchart TD
    classDef startEnd fill:#1e293b,stroke:#0f172a,stroke-width:2px,color:#fff;
    classDef process fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a;
    classDef decision fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef database fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;

    LeadGen(["1. Lead Generated (Web Form / Manual / Campaign)"]):::startEnd --> CaptureLead["Capture Lead in CRM System"]:::process
    CaptureLead --> DB_Leads[("Save in PostgreSQL 'leads' table")]:::database
    DB_Leads --> QualifyLead{"Sales Qualification (BANT Criteria)?"}:::decision

    QualifyLead -- "Unqualified / Spam" --> JunkLead["Mark as 'Lost / Disqualified'"]:::process
    QualifyLead -- "Qualified" --> ConvertOpp["2. Convert to Deal / Opportunity"]:::process

    ConvertOpp --> DB_Opps[("Create Record in 'opportunities'")]:::database
    DB_Opps --> CreateCustomer["Create Customer & Contact Profile"]:::process
    CreateCustomer --> DB_Cust[("Insert into 'customers' & 'contacts'")]:::database

    CreateCustomer --> PipelineStages["3. Sales Pipeline Stages"]:::process
    PipelineStages --> Discovery["Discovery & Needs Analysis"]:::process
    Discovery --> DemoStage["Product Demo / Proposal Discussion"]:::process
    DemoStage --> GenQuote["4. Generate Official Price Quotation"]:::process

    GenQuote --> DB_Quotes[("Write to 'quotations' table (QUO-xxxx)")]:::database
    DB_Quotes --> QuoteDecision{"Client Approves Quotation?"}:::decision

    QuoteDecision -- "Revision Requested" --> ReviseQuote["Adjust Pricing / Line Items"]:::process
    ReviseQuote --> GenQuote
    QuoteDecision -- "Rejected / Competitor Won" --> ClosedLost["Mark Opportunity 'Closed-Lost'"]:::process

    QuoteDecision -- "Approved" --> ClosedWon["5. Mark Opportunity 'Closed-Won'"]:::process
    ClosedWon --> SalesOrder["Create Official Sales Order"]:::process
    SalesOrder --> DB_SalesOrders[("Write to 'sales_orders' (SO-xxxx)")]:::database
    
    SalesOrder --> GenInvoice["6. Issue Tax Invoice (INV-xxxxxx)"]:::process
    GenInvoice --> DB_Invoices[("Insert into 'crm_invoices' & Post Accounts Receivable")]:::database
    DB_Invoices --> OrderComplete(["CRM Deal Flow Complete"]):::startEnd
```

---

## 2. HRMS & Employee Lifecycle Workflow

Manages candidate hiring, onboarding, unique ID generation, department placement, performance audits, and eventual exit offboarding.

```mermaid
flowchart TD
    classDef startEnd fill:#1e293b,stroke:#0f172a,stroke-width:2px,color:#fff;
    classDef process fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a;
    classDef decision fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef database fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;

    JobReq(["1. Job Requisition & Posting"]):::startEnd --> CandidateApply["Candidates Apply via Careers Portal"]:::process
    CandidateApply --> DB_Candidates[("Save in 'job_candidates' table")]:::database
    DB_Candidates --> ATS_Review["2. ATS Screening & Interview Scheduling"]:::process
    
    ATS_Review --> InterviewResult{"Interview Assessment Passed?"}:::decision
    InterviewResult -- "No" --> RejectCandidate["Send Polite Rejection / Talent Pool"]:::process
    InterviewResult -- "Yes" --> OfferLetter["3. Issue Digital Offer Letter"]:::process
    
    OfferLetter --> OfferAccept{"Candidate Accepts Offer?"}:::decision
    OfferAccept -- "Declined" --> ArchiveOffer["Archive Candidate Record"]:::process
    
    OfferAccept -- "Accepted" --> Onboarding["4. Employee Onboarding Workflow"]:::process
    Onboarding --> AutoEmpCode["Auto-Generate Employee Code (EMP-xxx)"]:::process
    AutoEmpCode --> SetOrgDetails["Assign Department, Designation & Reporting Manager"]:::process
    SetOrgDetails --> SetSalaryStructure["Configure CTC, Basic Salary & Allowances"]:::process
    SetSalaryStructure --> DB_Employees[("Write Active Record to 'employees' table")]:::database
    
    DB_Employees --> CreateESSUser["Provision ESS Portal Credentials"]:::process
    CreateESSUser --> ActiveWorkforce["5. Active Workforce Lifecycle"]:::process
    
    ActiveWorkforce --> AnnualReview["Performance Appraisals & Salary Increments"]:::process
    AnnualReview --> Resignation{"Resignation / Contract Termination?"}:::decision
    Resignation -- "No" --> ActiveWorkforce
    
    Resignation -- "Yes" --> Offboarding["6. Offboarding & Separation"]:::process
    Offboarding --> AssetHandover["Company Asset Handover & Knowledge Transfer"]:::process
    AssetHandover --> FNF_Settlement["Full & Final (FNF) Settlement Calculation"]:::process
    FNF_Settlement --> StatusExited["Update Status to 'EXITED' in DB"]:::database
    StatusExited --> EndHRMS(["HRMS Lifecycle Terminated"]):::startEnd
```

---

## 3. Biometric Attendance & Leave Workflow

Automates daily biometric punches, shifts, late penalties, leave balance deduction, and regularization approvals.

```mermaid
flowchart TD
    classDef startEnd fill:#1e293b,stroke:#0f172a,stroke-width:2px,color:#fff;
    classDef process fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a;
    classDef decision fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef database fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;
    classDef approval fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#78350f;

    ShiftStart(["1. Shift Starts (e.g. 09:00 AM)"]):::startEnd --> BiometricPunch["Employee Punch-In (Biometric / Web ESS)"]:::process
    BiometricPunch --> TimeCheck{"Punch Time <= 09:15 AM (Grace Period)?"}:::decision

    TimeCheck -- "Yes" --> MarkPresent["Status: 'PRESENT' (On-Time)"]:::process
    TimeCheck -- "No" --> MarkLate["Status: 'LATE' & Log Delay Minutes"]:::process

    MarkPresent --> WorkDay["Active Working Hours"]:::process
    MarkLate --> WorkDay

    WorkDay --> PunchOut["2. Shift End Punch-Out (e.g. 06:00 PM)"]:::process
    PunchOut --> CalcDuration["Compute Total Hours Worked, Early Exit & Overtime"]:::process
    CalcDuration --> DB_Att[("Save in 'attendance_records' table")]:::database

    DB_Att --> RegCheck{"Missed Punch / Device Error?"}:::decision
    RegCheck -- "Yes" --> SubmitReg["Submit Attendance Regularization Request"]:::process
    SubmitReg --> ManagerRegApprove{"Manager Approval?"}:::approval
    ManagerRegApprove -- "Approved" --> FixAttendance["Update Attendance to 'PRESENT' in DB"]:::database
    ManagerRegApprove -- "Rejected" --> KeepPenalty["Maintain Late / Half-Day Penalty"]:::process

    subgraph Leave_Subworkflow ["Leave Application Flow"]
        LeaveReq(["Employee Submits Leave"]):::startEnd --> CheckLeaveBalance{"Available Leave Balance?"}:::decision
        CheckLeaveBalance -- "No" --> RejectNoBal["Reject Request (Zero Balance)"]:::process
        CheckLeaveBalance -- "Yes" --> ManagerLeaveApprove{"Manager / HR Approval?"}:::approval
        ManagerLeaveApprove -- "Approved" --> DeductLeaveBal["Deduct Balance & Mark 'ON_LEAVE' in Attendance"]:::database
        ManagerLeaveApprove -- "Rejected" --> RejectLeaveReq["Notify Rejection Reason to Employee"]:::process
    end

    FixAttendance --> MonthlySync["3. Month-End Sync to Payroll Engine"]:::process
    DeductLeaveBal --> MonthlySync
    MonthlySync --> EndAtt(["Attendance Consolidated"]):::startEnd
```

---

## 4. Task Intelligence & Work Deliverables Workflow

Manages task deliverable assignments, PostgreSQL persistence, live completion percentage auditing, and employee work portions.

```mermaid
flowchart TD
    classDef startEnd fill:#1e293b,stroke:#0f172a,stroke-width:2px,color:#fff;
    classDef process fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a;
    classDef decision fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef database fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;

    NewTask(["1. Task Assignment Initiated"]):::startEnd --> SelectAssignee["Select Employee Specialist (Code / Name)"]:::process
    SelectAssignee --> SetDeliverables["Set Due Date, Priority, Estimated Hours & Checklist"]:::process
    SetDeliverables --> API_Assign["POST /api/tasks (or /api/hrms/tasks/assign)"]:::process
    
    API_Assign --> DB_Task[("Write to PostgreSQL 'tasks' table")]:::database
    DB_Task --> DB_Activity[("Insert Audit in 'task_activities' table")]:::database
    DB_Task --> DB_Notif[("Create Alert in 'ess_notifications' table")]:::database

    DB_Notif --> ESS_Portal["2. Employee Opens ESS / My Tasks View"]:::process
    ESS_Portal --> StartWork["Employee Starts Deliverable (Status: IN_PROGRESS)"]:::process
    StartWork --> LogTime["Log Actual Working Hours Spent"]:::process
    LogTime --> CheckItems["Check Off Deliverable Checklist Items"]:::process
    CheckItems --> UpdateProgress["Update Progress Percentage (% Done)"]:::process

    UpdateProgress --> DB_Update[("Update PostgreSQL 'tasks' Progress & Hours")]:::database
    DB_Update --> ProgressCheck{"Progress == 100%?"}:::decision

    ProgressCheck -- "No (e.g. 45% / 75%)" --> TaskReports["Live Audit visible in Task Reports View"]:::process
    TaskReports --> LogTime

    ProgressCheck -- "Yes (100%)" --> SubmitComplete["3. Mark Deliverable Status: 'COMPLETED'"]:::process
    SubmitComplete --> ManagerAudit["Manager Reviews Deliverable Outcome"]:::process
    ManagerAudit --> AuditApproval{"Outcome Accepted?"}:::decision
    AuditApproval -- "Revisions Needed" --> ReopenTask["Reopen Task & Send Feedback Note"]:::process
    ReopenTask --> StartWork
    AuditApproval -- "Approved" --> TaskArchived["4. Task Archived in Completed Audit Log"]:::database
    TaskArchived --> EndTask(["Task Execution Complete"]):::startEnd
```

---

## 5. Payroll Processing & Salary Disbursement Workflow

Synchronizes attendance records, calculates gross earnings, applies statutory taxes/deductions, produces payslips, and posts journal vouchers.

```mermaid
flowchart TD
    classDef startEnd fill:#1e293b,stroke:#0f172a,stroke-width:2px,color:#fff;
    classDef process fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a;
    classDef decision fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef database fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;
    classDef approval fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#78350f;

    MonthEnd(["1. Initiate Monthly Payroll Run"]):::startEnd --> PullAttendance["Pull Approved Attendance & LOP Days"]:::process
    PullAttendance --> DB_AttSource[("Read 'attendance_records' & 'leave_requests'")]:::database
    DB_AttSource --> PullSalaryMaster["Pull Employee CTC & Salary Structure"]:::process
    PullSalaryMaster --> DB_Salary[("Read 'employees' CTC & Allowances")]:::database

    PullSalaryMaster --> CalcEarnings["2. Calculate Gross Earnings"]:::process
    CalcEarnings --> CompEarnings["Basic + HRA + Special Allowance + Overtime Bonus"]:::process

    CompEarnings --> CalcDeductions["3. Calculate Deductions"]:::process
    CalcDeductions --> CompDeductions["Provident Fund (PF) + ESI + Professional Tax + LOP Deductions"]:::process

    CompDeductions --> ComputeNet["4. Compute Net Take-Home Pay (Gross - Deductions)"]:::process
    ComputeNet --> PreviewPayroll["5. Generate Payroll Preview Register"]:::process
    
    PreviewPayroll --> HR_Approval{"HR & Finance Sign-Off?"}:::approval
    HR_Approval -- "Discrepancy Found" --> AdjustDetails["Adjust Unpaid Leave / Bonus Exception"]:::process
    AdjustDetails --> ComputeNet

    HR_Approval -- "Approved" --> ExecutePayroll["6. Execute Official Payroll Run"]:::process
    ExecutePayroll --> DB_PayrollRuns[("Insert into 'payroll_runs' & 'salary_slips'")]:::database
    
    DB_PayrollRuns --> PostAccounting["7. Automated General Ledger Accounting"]:::process
    PostAccounting --> DB_Journal[("Post Salary Expense Vouchers to 'journal_entries'")]:::database
    
    DB_PayrollRuns --> GenPayslips["8. Dispatch Digital Payslip PDFs to ESS Portal"]:::process
    GenPayslips --> BankDisbursement["9. Export Bank Direct-Deposit NACH / NEFT File"]:::process
    BankDisbursement --> EndPayroll(["Payroll Cycle Completed"]):::startEnd
```

---

## 6. Double-Entry Accounting & Banking Workflow

Maintains balance sheets, profit & loss statements, customer invoicing receivables, vendor payable vouchers, and bank reconciliation.

```mermaid
flowchart TD
    classDef startEnd fill:#1e293b,stroke:#0f172a,stroke-width:2px,color:#fff;
    classDef process fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a;
    classDef decision fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef database fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;

    Transaction(["1. Financial Transaction Occurs"]):::startEnd --> TransType{"Transaction Category"}:::decision

    TransType -- "Customer Sales Invoice" --> RecEntry["Debit: Accounts Receivable | Credit: Sales Revenue"]:::process
    TransType -- "Vendor Purchase Bill" --> PayEntry["Debit: Inventory/Expense | Credit: Accounts Payable"]:::process
    TransType -- "Payroll Disbursement" --> PayRollEntry["Debit: Salaries Expense | Credit: Bank Account"]:::process
    TransType -- "Employee Expense Claim" --> ExpEntry["Debit: Travel/Operations | Credit: Cash/Bank"]:::process

    RecEntry --> ValidateCOA["2. Validate Chart of Accounts (COA)"]:::process
    PayEntry --> ValidateCOA
    PayRollEntry --> ValidateCOA
    ExpEntry --> ValidateCOA

    ValidateCOA --> DB_COA[("Read 'chart_of_accounts'")]:::database
    DB_COA --> BalancedCheck{"Debit Total == Credit Total (Balanced)?"}:::decision
    
    BalancedCheck -- "No" --> ErrorRollback["Rollback Transaction (Imbalance Detected)"]:::process
    BalancedCheck -- "Yes" --> DB_Journal[("Write Immutable Rows to 'journal_entries'")]:::database

    DB_Journal --> BankRec["3. Bank Reconciliation Engine"]:::process
    BankRec --> MatchStatements["Match Bank Statement Feeds with Internal Vouchers"]:::process
    MatchStatements --> DB_Banking[("Update 'banking_transactions' Status to 'RECONCILED'")]:::database

    DB_Banking --> FinancialReports["4. Live Real-Time Financial Statements"]:::process
    FinancialReports --> TrialBalance["Trial Balance Report"]:::process
    FinancialReports --> ProfitLoss["Profit & Loss (P&L) Statement"]:::process
    FinancialReports --> BalanceSheet["Balance Sheet Statement"]:::process
    FinancialReports --> EndAccounting(["Financial Period Closed"]):::startEnd
```

---

## 7. Procurement, Vendors & Inventory Workflow

Handles purchase requisitions, vendor price quotes, Purchase Orders (PO), goods receipt stock updates, and vendor billing.

```mermaid
flowchart TD
    classDef startEnd fill:#1e293b,stroke:#0f172a,stroke-width:2px,color:#fff;
    classDef process fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a;
    classDef decision fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef database fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;
    classDef approval fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#78350f;

    LowStock(["1. Low Stock Alert / Department Requisition"]):::startEnd --> CreatePR["Create Purchase Requisition"]:::process
    CreatePR --> SelectVendor["Select Verified Vendor from 'vendors' Directory"]:::process
    SelectVendor --> GenPO["2. Generate Purchase Order (PO-xxxxx)"]:::process
    
    GenPO --> PO_Approval{"Procurement Manager Approval?"}:::approval
    PO_Approval -- "Rejected" --> CancelPO["Cancel Requisition"]:::process
    
    PO_Approval -- "Approved" --> DB_PO[("Write to 'purchase_orders' Table")]:::database
    DB_PO --> DispatchVendor["3. Dispatch PO to Vendor (Email / PDF)"]:::process
    
    DispatchVendor --> GoodsArrived["4. Goods Delivered to Warehouse / Office"]:::process
    GoodsArrived --> QualityInspection{"Quality Inspection Passed?"}:::decision
    
    QualityInspection -- "Damaged / Defective" --> ReturnGoods["Issue Goods Return Note (GRN) to Vendor"]:::process
    
    QualityInspection -- "Passed" --> AcceptGRN["5. Issue Goods Receipt Note (GRN)"]:::process
    AcceptGRN --> UpdateInventory["Increment Stock Quantities in 'inventory_items'"]:::database
    
    UpdateInventory --> VendorInvoice["6. Receive Vendor Tax Invoice"]:::process
    VendorInvoice --> ThreeWayMatch{"3-Way Match (PO == GRN == Invoice)?"}:::decision
    ThreeWayMatch -- "Mismatch" --> DisputeInvoice["Put Invoice On-Hold for Vendor Clarification"]:::process
    
    ThreeWayMatch -- "Match Verified" --> PostAP[("Post Accounts Payable Voucher in General Ledger")]:::database
    PostAP --> DisburseVendorPayment["7. Schedule Vendor Payment & Close PO"]:::process
    DisburseVendorPayment --> EndProcurement(["Procurement Flow Complete"]):::startEnd
```

---

## 8. Support Helpdesk & Ticket Resolution Workflow

Handles customer and internal employee service tickets, SLA prioritization, technician dispatch, resolution, and satisfaction ratings.

```mermaid
flowchart TD
    classDef startEnd fill:#1e293b,stroke:#0f172a,stroke-width:2px,color:#fff;
    classDef process fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a;
    classDef decision fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef database fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;

    IssueRaised(["1. Support Request / Issue Reported"]):::startEnd --> CreateTicket["Create Ticket (Portal / Email / Chat)"]:::process
    CreateTicket --> DB_Tickets[("Insert into 'support_tickets' (TCK-xxxx)")]:::database
    
    DB_Tickets --> ClassifyTicket["2. Automatic Classification & Priority Assignment"]:::process
    ClassifyTicket --> SetSLA["Calculate SLA Due Date (e.g. Critical: 2 hrs, Low: 24 hrs)"]:::process
    
    SetSLA --> AssignAgent["3. Dispatch to Support Specialist / Department"]:::process
    AssignAgent --> AgentInvestigation["Specialist Diagnoses Issue & Logs Internal Notes"]:::process
    
    AgentInvestigation --> ResolveCheck{"Resolution Solution Found?"}:::decision
    ResolveCheck -- "No / Complex Bug" --> EscalateTicket["Escalate to Engineering / Tier-2 Lead"]:::process
    EscalateTicket --> AgentInvestigation
    
    ResolveCheck -- "Yes" --> ApplyFix["4. Apply Solution & Respond to Requestor"]:::process
    ApplyFix --> UpdateStatus["Set Ticket Status to 'RESOLVED' in DB"]:::database
    
    UpdateStatus --> UserConfirmation{"Requestor Confirms Resolution?"}:::decision
    UserConfirmation -- "Issue Persists" --> ReopenTicket["Reopen Ticket & Follow-up"]:::process
    ReopenTicket --> AgentInvestigation
    
    UserConfirmation -- "Confirmed / Timeout (48 hrs)" --> CloseTicket["5. Close Ticket & Capture CSAT Rating"]:::process
    CloseTicket --> DB_Closed[("Archive Ticket in 'support_tickets' as 'CLOSED'")]:::database
    DB_Closed --> EndHelpdesk(["Ticket Resolution Complete"]):::startEnd
```

---

## 9. Master Integration Architecture

```mermaid
graph TD
    subgraph Frontend_Layer ["Client Presentation Layer (React 18 + Vite)"]
        UI_CRM["CRM & Sales"]
        UI_HRMS["HRMS & ESS"]
        UI_Tasks["Tasks & Reports"]
        UI_Attendance["Attendance & Leave"]
        UI_Accounts["Accounting & Payroll"]
        UI_Settings["Settings & Security"]
    end

    subgraph API_Gateway ["Express Node.js API Gateway (/api/*)"]
        Auth["JWT Auth & RBAC Middleware"]
        Router_CRM["/api/leads • /api/customers • /api/quotations"]
        Router_HRMS["/api/employees • /api/recruitment • /api/departments"]
        Router_Tasks["/api/tasks • /api/hrms/tasks/assign • /api/v1/employee/me/tasks"]
        Router_Att["/api/attendance • /api/shifts • /api/leave"]
        Router_Finance["/api/payroll • /api/accounts • /api/banking • /api/expenses"]
    end

    subgraph Database_Layer ["PostgreSQL Relational Database Engine"]
        T_CRM[("CRM: leads, opportunities, customers, quotations, invoices")]
        T_HRMS[("HRMS: employees, departments, designations, job_candidates")]
        T_Tasks[("Tasks: tasks, task_activities, ess_notifications")]
        T_Att[("Attendance: attendance_records, shifts, leave_requests")]
        T_Finance[("Finance: chart_of_accounts, journal_entries, payroll_runs")]
    end

    Frontend_Layer --> Auth
    Auth --> Router_CRM
    Auth --> Router_HRMS
    Auth --> Router_Tasks
    Auth --> Router_Att
    Auth --> Router_Finance

    Router_CRM --> T_CRM
    Router_HRMS --> T_HRMS
    Router_Tasks --> T_Tasks
    Router_Att --> T_Att
    Router_Finance --> T_Finance
```
