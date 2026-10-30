# Test Report: Regression Testing Suite

| Metadata | Value |
| :--- | :--- |
| **Test Type** | **Regression Testing** |
| **Target Code** | System-Wide Feature Stability across CRM, Sales, HRMS, and Helpdesk |
| **Source Implementation** | [`backend/tests/06_regression_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/06_regression_testing_suite.js) |
| **Execution Command** | `npm run test:regression` (or `node backend/tests/06_regression_testing_suite.js`) |
| **Test Environment** | Node.js v24.12.0, Express API, Dual PostgreSQL DBs |
| **Execution Date** | October 30, 2026 |
| **Execution Status** | **PASSED (100%)** |
| **Total Test Cases** | **17** |
| **Passed** | **17** |
| **Failed** | **0** |

---

## 1. Executive Summary & Purpose

Regression Testing guarantees that new features, performance updates, and bug fixes did not inadvertently break or degrade existing operational workflows. As this application incorporates integrated handoffs between CRM lead management, sales quotations, employee master directories, and security authentication, regression testing provides a safety net ensuring backwards compatibility across the entire feature surface.

---

## 2. Scope & Subsystems Under Test

1. **CRM Pipeline & Filter Matrix**: Multi-filter queries by stage (`stage=Qualified`), lead score (`minScore=70`), and lead collection integrity.
2. **CRM Input Validation & Guard Rails**: Rejection of missing required fields (e.g. `contactPerson`), alphabetic characters in phone numbers, and invalid email formatting.
3. **Sales Quotation Calculation & Persistence**: Schema validation for line items, unit prices, subtotal, and tax amounts in PostgreSQL `quotation_items`.
4. **HRMS Employees & Departments**: Directory retrieval and department taxonomy.
5. **HRMS Interns Directory**: Search and department filtering.
6. **Helpdesk Ticket Filtering**: Priority filtering (`priority=High`) and active queue listing.
7. **Role-Based Access Control (RBAC)**: Verification that privilege escalation is prevented (e.g. a standard employee attempting to authenticate as an Executive).

---

## 3. Test Cases & Results Matrix

| ID | Module | Target / Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **RT-01** | CRM | Leads list returns array of lead records | HTTP 200 + Array | HTTP 200 + Array | ✅ PASS |
| **RT-02** | CRM | Filtering by `stage=Qualified` | HTTP 200 | HTTP 200 | ✅ PASS |
| **RT-03** | CRM | Every lead in filtered set has `stage="Qualified"` | All match | All match | ✅ PASS |
| **RT-04** | CRM | Filtering by `minScore=70` | HTTP 200 | HTTP 200 | ✅ PASS |
| **RT-05** | CRM | Every lead in filtered set has score >= 70 | All match | All match | ✅ PASS |
| **RT-06** | CRM | Rejects lead creation without `contactPerson` | HTTP 400 Bad Request | HTTP 400 Bad Request | ✅ PASS |
| **RT-07** | CRM | Rejects lead creation with letters in phone | HTTP 400 Bad Request | HTTP 400 Bad Request | ✅ PASS |
| **RT-08** | CRM | Rejects lead creation with malformed email | HTTP 400 Bad Request | HTTP 400 Bad Request | ✅ PASS |
| **RT-09** | Sales | Quotation created with valid calculation schema | HTTP 201 Created | HTTP 201 Created | ✅ PASS |
| **RT-10** | Sales | Quotation line items persisted in database table | 2 line items | 2 line items | ✅ PASS |
| **RT-11** | HRMS | Employees API returns active employee list | HTTP 200 + Array | HTTP 200 + Array | ✅ PASS |
| **RT-12** | HRMS | Departments API returns configured departments | HTTP 200 + Array | HTTP 200 + Array | ✅ PASS |
| **RT-13** | HRMS | Interns API returns active intern registry | HTTP 200 + Array | HTTP 200 + Array | ✅ PASS |
| **RT-14** | HRMS | Filtering interns by `department=Engineering` | HTTP 200 OK | HTTP 200 OK | ✅ PASS |
| **RT-15** | Helpdesk | Helpdesk tickets listing returns tickets array | HTTP 200 OK | HTTP 200 OK | ✅ PASS |
| **RT-16** | Helpdesk | Filtering tickets by `priority=High` | HTTP 200 OK | HTTP 200 OK | ✅ PASS |
| **RT-17** | RBAC | Standard employee blocked from Executive role | HTTP 403 Forbidden | HTTP 403 Forbidden | ✅ PASS |

---

## 4. Execution Terminal Output

```text
================================================================
🧪 TEST SUITE 06: REGRESSION TESTING (Core System Stability)
================================================================

--- 1. CRM Pipeline & Multi-Parameter Filter Regression ---
✅ [CRM DB]  Connected to "crm" on port 5432
✅ [HRMS DB] Connected to "HRMS" on port 5432
  ✅ PASS: CRM Leads list returns array of lead records
  ✅ PASS: Filtering by stage=Qualified returns HTTP 200
  ✅ PASS: Every lead in filtered dataset has stage="Qualified"
  ✅ PASS: Filtering by minScore=70 returns HTTP 200
  ✅ PASS: Every lead in minScore=70 has score >= 70

--- 2. CRM Input Validation Regression ---
  ✅ PASS: Rejects lead with missing contactPerson (400)
  ✅ PASS: Rejects phone with alphabetic characters (400)
  ✅ PASS: Rejects malformed email address (400)

--- 3. Sales Quotation Regression ---
  ✅ PASS: Quotation created with valid calculation schema
  ✅ PASS: Quotation items table persisted exactly 2 line items

--- 4. HRMS Employee & Department Regression ---
  ✅ PASS: Employees API returns active employee list
  ✅ PASS: Departments API returns configured departments

--- 5. HRMS Interns Directory Regression ---
  ✅ PASS: Interns API returns active intern registry
  ✅ PASS: Filtering interns by department=Engineering returns HTTP 200

--- 6. Helpdesk Support Ticket Regression ---
  ✅ PASS: Helpdesk tickets listing returns tickets array
  ✅ PASS: Filtering tickets by priority=High returns HTTP 200

--- 7. RBAC & Privilege Elevation Protection Regression ---
  ✅ PASS: Privilege escalation blocked: Standard employee cannot log in with Executive role (403 Forbidden)

----------------------------------------------------------------
Regression Testing Suite Results: 17 PASSED, 0 FAILED (Total: 17)
================================================================
```

