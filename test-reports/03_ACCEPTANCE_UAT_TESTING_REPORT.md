# Test Report: Acceptance Testing (UAT)

| Metadata | Value |
| :--- | :--- |
| **Test Type** | **Acceptance Testing (User Acceptance Testing - UAT)** |
| **Target Code** | End-User Business Scenarios, Role Personas, Acceptance Criteria |
| **Source Implementation** | [`backend/tests/03_acceptance_uat_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/03_acceptance_uat_testing_suite.js) |
| **Execution Command** | `npm run test:uat` (or `node backend/tests/03_acceptance_uat_testing_suite.js`) |
| **Test Environment** | Node.js v24.12.0, Express API (Port 5000), Dual PostgreSQL Databases |
| **Execution Date** | October 30, 2026 |
| **Execution Status** | **PASSED (100%)** |
| **Total Test Cases** | **14** |
| **Passed** | **14** |
| **Failed** | **0** |

---

## 1. Executive Summary & Purpose

User Acceptance Testing (UAT) evaluates whether the software meets formal business requirements and satisfies user personas under realistic operational conditions. Rather than testing isolated functions, UAT tests end-to-end customer and employee journeys across different role perspectives: Executive/VP of Sales, HR Lead, Employee Self-Service, and Support Desk Agent.

---

## 2. Tested Personas & User Journeys

The Acceptance Testing Suite evaluates 4 primary organizational personas:

### Journey 1: Sales VP Closed Deal Acceptance (Sarah Jenkins Persona)
- **Goal**: Convert an enterprise prospect into confirmed revenue following the strict pipeline sequence: `New` $\rightarrow$ `Contacted` $\rightarrow$ `Qualified` $\rightarrow$ Quotation Draft $\rightarrow$ Customer Acceptance $\rightarrow$ Lead `Won` $\rightarrow$ Confirmed Sales Order.
- **Criteria**: Stage skipping is strictly blocked; discovery activity is required before advancing to `Contacted`; quotation acceptance automatically flags the deal as `Won` with the exact contracted amount.

### Journey 2: HR Intern Onboarding Lifecycle (Priya Sharma Persona)
- **Goal**: Complete onboarding for an engineering intern with verified phone, college, stipend, and mentor assignment.
- **Criteria**: Phone number must be exactly 10 digits; mentor and reporting manager must be assigned; intern record status initializes to `Active`.

### Journey 3: Employee Self-Service Leave Application (Ramesh Persona)
- **Goal**: Employee applies for Paid Leave and verifies approval progression.
- **Criteria**: Leave request enters `Pending` state; manager review transitions status to `Approved`.

### Journey 4: Customer Support Agent Helpdesk Resolution
- **Goal**: Log, investigate, and resolve high-priority helpdesk issue.
- **Criteria**: Ticket generates sequential ticket number (`HD-XXXX`); agent resolves ticket with mandatory resolution comments.

---

## 3. Test Cases & Results Matrix

| ID | Persona | Journey Step | Expected Behavior | Actual Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UAT-01** | Sarah (VP Sales) | Capture inbound enterprise lead | HTTP 201 Created | HTTP 201 Created | ✅ PASS |
| **UAT-02** | Sarah (VP Sales) | Log discovery call & move to Contacted | HTTP 200 OK | HTTP 200 OK | ✅ PASS |
| **UAT-03** | Sarah (VP Sales) | Qualify lead with verified requirements & budget | HTTP 200 OK | HTTP 200 OK | ✅ PASS |
| **UAT-04** | Sarah (VP Sales) | Create sales quotation with itemized services | HTTP 201 Created | HTTP 201 Created | ✅ PASS |
| **UAT-05** | Sarah (VP Sales) | Customer accepts quotation | HTTP 200 OK | HTTP 200 OK | ✅ PASS |
| **UAT-06** | Sarah (VP Sales) | CRM Lead automatically reflects "Won" deal status | Stage is "Won" | Stage is "Won" | ✅ PASS |
| **UAT-07** | Sarah (VP Sales) | Official Sales Order generated and confirmed | Order ID generated | Order ID generated | ✅ PASS |
| **UAT-08** | Priya (HR Lead) | Onboard intern record via HRMS API | HTTP 201 Created | HTTP 201 Created | ✅ PASS |
| **UAT-09** | Priya (HR Lead) | Intern record persisted in PostgreSQL HRMS DB | DB row exists | DB row exists | ✅ PASS |
| **UAT-10** | Priya (HR Lead) | Verified 10-digit phone number stored accurately | `phone: "9811223344"` | `phone: "9811223344"` | ✅ PASS |
| **UAT-11** | Ramesh (ESS) | Submit 2-day Paid Leave request | Status is "Pending" | Status is "Pending" | ✅ PASS |
| **UAT-12** | Ramesh (ESS) | Manager approves submitted leave request | Status is "Approved" | Status is "Approved" | ✅ PASS |
| **UAT-13** | Support Agent | Customer logs High-Priority Helpdesk Ticket | Ticket ID generated | Ticket ID generated | ✅ PASS |
| **UAT-14** | Support Agent | Support agent resolves ticket with resolution notes | Status is "Resolved" | Status is "Resolved" | ✅ PASS |

---

## 4. Execution Terminal Output

```text
================================================================
🧪 TEST SUITE 03: ACCEPTANCE TESTING (UAT Business Journeys)
================================================================

--- Journey 1: Sales VP Closed Deal Acceptance (Sarah Jenkins) ---
✅ [HRMS DB] Connected to "HRMS" on port 5432
✅ [CRM DB]  Connected to "crm" on port 5432
  ✅ PASS: UAT-1.1: Sarah creates new enterprise lead inquiry
  ✅ PASS: UAT-1.2: Sarah logs discovery call & advances lead to "Contacted"
  ✅ PASS: UAT-1.3: Lead qualifies successfully after requirement and budget verification
  ✅ PASS: UAT-1.4: Sales Quotation created with line items
  ✅ PASS: UAT-1.5: Quotation accepted by customer
  ✅ PASS: UAT-1.6: CRM Lead status reflects "Won" deal closure
  ✅ PASS: UAT-1.7: Official Sales Order issued to customer

--- Journey 2: HR Intern Onboarding Lifecycle (Priya Sharma) ---
  ✅ PASS: UAT-2.1: Priya Sharma onboarded intern record successfully via HRMS API
  ✅ PASS: UAT-2.2: Intern saved in PostgreSQL HRMS database
  ✅ PASS: UAT-2.3: Verified 10-digit phone number stored accurately

--- Journey 3: Employee Self-Service Leave Application (Ramesh) ---
  ✅ PASS: UAT-3.1: Ramesh submitted 2-day Paid Leave request (Pending state)
  ✅ PASS: UAT-3.2: Manager approved leave request successfully

--- Journey 4: Helpdesk Support Ticket Lifecycle ---
  ✅ PASS: UAT-4.1: Customer logged High-Priority Helpdesk Ticket
  ✅ PASS: UAT-4.2: Support Agent resolved ticket with resolution notes

----------------------------------------------------------------
Acceptance Testing (UAT) Results: 14 PASSED, 0 FAILED (Total: 14)
================================================================
```

