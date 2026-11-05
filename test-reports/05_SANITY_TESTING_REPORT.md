# Test Report: Sanity Testing Suite

| Metadata | Value |
| :--- | :--- |
| **Test Type** | **Sanity Testing** |
| **Target Code** | Targeted Verifications of Recent Bug Fixes and Code Updates |
| **Source Implementation** | [`backend/tests/05_sanity_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/05_sanity_testing_suite.js) |
| **Execution Command** | `npm run test:sanity` (or `node backend/tests/05_sanity_testing_suite.js`) |
| **Test Environment** | Node.js v24.12.0, Express API, Dual PostgreSQL DBs |
| **Execution Date** | October 30, 2026 |
| **Execution Status** | **PASSED (100%)** |
| **Total Test Cases** | **20** |
| **Passed** | **20** |
| **Failed** | **0** |

---

## 1. Executive Summary & Purpose

Sanity Testing is a fast, highly-focused testing process executed following specific bug fixes or minor code alterations. While Regression Testing checks the broad application, Sanity Testing proves that the specific rationales for recent developer interventions are completely resolved and function accurately without causing side effects in adjacent components.

---

## 2. Tested Bug Fixes & Hotfixes

The Sanity Testing Suite verifies 6 recent critical fixes:

1. **BUG-108: CRM Leads Page Stage Navigation Tabs**:
   - Verification that the primary stage filter tabs strictly display only 5 tabs: **New**, **Contacted**, **Qualified**, **Won**, and **Lost**.
   - Verification that obsolete/redundant tabs (`All`, `Proposal`, and `Negotiation`) are omitted from the main navigation strip.
2. **BUG-107: Priya Sharma HR Lead Authentication**:
   - Verification that Priya Sharma (`EMP-003`) exists in the HRMS database under the HR department.
   - Verification that authentication with role `HRAdmin` and PIN `1234` succeeds and yields an active session.
3. **BUG-106: Global Header Signout Button**:
   - Verification of the presence and accessibility of the top-right `Sign Out` button in the navigation header.
4. **BUG-105: Intern Onboarding 10-Digit Phone Enforcement**:
   - Verification that phone numbers differing from 10 digits (e.g. 20 digits) are rejected with clear error messaging.
5. **BUG-104: Quotation Rejection Non-Destructive Behavior**:
   - Verification that non-definitive rejection of a quotation keeps the linked CRM Lead in the `Qualified` stage rather than prematurely marking it `Lost`.
6. **BUG-103: Helpdesk Ticket Summary Cards**:
   - Verification that KPI counters (`Open`, `In Progress`, `Resolved`, `High Priority`) are computed dynamically from real PostgreSQL records.

---

## 3. Test Cases & Results Matrix

| ID | Bug ID | Target / Verification | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **SN-01** | BUG-108 | Lead tabs include "New" | Included | Included | ✅ PASS |
| **SN-02** | BUG-108 | Lead tabs include "Contacted" | Included | Included | ✅ PASS |
| **SN-03** | BUG-108 | Lead tabs include "Qualified" | Included | Included | ✅ PASS |
| **SN-04** | BUG-108 | Lead tabs include "Won" | Included | Included | ✅ PASS |
| **SN-05** | BUG-108 | Lead tabs include "Lost" | Included | Included | ✅ PASS |
| **SN-06** | BUG-108 | Lead tab array excludes "All" | Excluded | Excluded | ✅ PASS |
| **SN-07** | BUG-108 | Lead tab array excludes "Proposal" | Excluded | Excluded | ✅ PASS |
| **SN-08** | BUG-108 | Lead tab array excludes "Negotiation" | Excluded | Excluded | ✅ PASS |
| **SN-09** | BUG-107 | Priya Sharma (EMP-003) exists in DB | Record exists | Record exists | ✅ PASS |
| **SN-10** | BUG-107 | Employee name contains "Priya" | Name verified | Name verified | ✅ PASS |
| **SN-11** | BUG-107 | Priya belongs to HR department | `department: "HR"` | `department: "HR"` | ✅ PASS |
| **SN-12** | BUG-107 | Priya authenticates with HRAdmin credentials | HTTP 200 + token | HTTP 200 + token | ✅ PASS |
| **SN-13** | BUG-106 | Global Header includes Sign Out button & handler | Found in layout | Found in layout | ✅ PASS |
| **SN-14** | BUG-105 | 20-digit phone rejected with "10 digits only" message | HTTP 400 + error | HTTP 400 + error | ✅ PASS |
| **SN-15** | BUG-104 | Lead remains "Qualified" after non-definitive rejection | Stage is "Qualified" | Stage is "Qualified" | ✅ PASS |
| **SN-16** | BUG-103 | Helpdesk `/summary` endpoint returns HTTP 200 | HTTP 200 | HTTP 200 | ✅ PASS |
| **SN-17** | BUG-103 | Summary returns numeric `open` count | Numeric count | Numeric count | ✅ PASS |
| **SN-18** | BUG-103 | Summary returns numeric `inProgress` count | Numeric count | Numeric count | ✅ PASS |
| **SN-19** | BUG-103 | Summary returns numeric `resolved` count | Numeric count | Numeric count | ✅ PASS |
| **SN-20** | BUG-103 | Summary returns numeric `highPriority` count | Numeric count | Numeric count | ✅ PASS |

---

## 4. Execution Terminal Output

```text
================================================================
🧪 TEST SUITE 05: SANITY TESTING (Targeted Bug Fix Verifications)
================================================================

--- 1. BUG-108: CRM Leads Stage Tabs Definition ---
  ✅ PASS: Lead tabs include "New"
  ✅ PASS: Lead tabs include "Contacted"
  ✅ PASS: Lead tabs include "Qualified"
  ✅ PASS: Lead tabs include "Won"
  ✅ PASS: Lead tabs include "Lost"
  ✅ PASS: Tab array does NOT contain "All"
  ✅ PASS: Tab array does NOT contain "Proposal"
  ✅ PASS: Tab array does NOT contain "Negotiation"

--- 2. BUG-107: Priya Sharma HR Lead Authentication ---
✅ [CRM DB]  Connected to "crm" on port 5432
✅ [HRMS DB] Connected to "HRMS" on port 5432
  ✅ PASS: Priya Sharma (EMP-003) exists in HRMS database
  ✅ PASS: Employee name is Priya Sharma
  ✅ PASS: Priya Sharma belongs to HR department
  ✅ PASS: Priya Sharma authenticates successfully with HRAdmin credentials

--- 3. BUG-106: Global Header Signout Action ---
  ✅ PASS: Top navigation / App includes Signout button and handler

--- 4. BUG-105: Intern Onboarding 10-Digit Phone Enforcement ---
  ✅ PASS: 20-digit phone rejected with "Phone number must be 10 digits only"

--- 5. BUG-104: Non-Definitive Quotation Rejection Stage Integrity ---
  ✅ PASS: Lead remains "Qualified" after non-definitive quote rejection (not Lost)

--- 6. BUG-103: Helpdesk Summary Derived from Real DB Counts ---
  ✅ PASS: Helpdesk /summary endpoint returns HTTP 200
  ✅ PASS: Summary contains numeric "open" count
  ✅ PASS: Summary contains numeric "inProgress" count
  ✅ PASS: Summary contains numeric "resolved" count
  ✅ PASS: Summary contains numeric "highPriority" count

----------------------------------------------------------------
Sanity Testing Suite Results: 20 PASSED, 0 FAILED (Total: 20)
================================================================
```

