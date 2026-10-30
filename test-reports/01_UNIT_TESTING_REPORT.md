# Test Report: Unit Testing Suite

| Metadata | Value |
| :--- | :--- |
| **Test Type** | **Unit Testing** |
| **Target Code** | Pure Business Logic Calculators, Validation Rules, Formatting Utilities |
| **Source Implementation** | [`backend/tests/01_unit_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/01_unit_testing_suite.js) |
| **Execution Command** | `npm run test:unit` (or `node backend/tests/01_unit_testing_suite.js`) |
| **Test Environment** | Node.js v24.12.0, ESM, Headless Execution |
| **Execution Date** | October 30, 2026 |
| **Execution Status** | **PASSED (100%)** |
| **Total Test Cases** | **40** |
| **Passed** | **40** |
| **Failed** | **0** |

---

## 1. Executive Summary & Purpose

Unit testing validates the smallest testable units of software in complete isolation from external dependencies (such as databases, networks, and file systems). In this CRM + HRMS + ERP application, unit testing ensures that core financial calculations, input format validators, eligibility rules, attendance computations, and date formatting engines compute exact, predictable results without side effects.

---

## 2. Scope & Modules Under Test

The Unit Testing Suite tests 6 core business logic modules:
1. **Financial & Quotation Calculation Unit**: Line item discounting, subtotal aggregation, global discount deduction, 18% GST/tax computation, and rounding to 2 decimal places.
2. **Lead Qualification & Stage Validation Unit**: Validation of customer requirements (length, placeholder rejection), budget (> ₹0, numeric), decision maker name format, and expected close date (today or future).
3. **Intern Onboarding Wizard Field Validation**: Strict 10-digit phone number check, minimum age check (>= 16 years old), and CGPA/Percentage format parser.
4. **Currency & Formatting Engine**: Indian Rupee (`INR`) numbering format with comma grouping (e.g., ₹1,48,35,000), lead score level categorization (Low, Medium, High).
5. **HRMS Attendance & Overtime Calculator**: Net work hours calculation, grace period late-in detection (> 9:15 AM), half-day threshold (< 4.5 hours), and overtime calculation (> 8.0 hours).
6. **Helpdesk SLA Calculation Unit**: Priority-based turnaround SLA hours (Urgent = 4h, High = 8h, Medium = 24h, Low = 48h) and due timestamp computation.

---

## 3. Test Cases & Results Matrix

| ID | Category | Scenario / Function | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UT-01** | Finance | Line item: 2 qty @ ₹50,000 with 10% disc | ₹90,000.00 | ₹90,000.00 | ✅ PASS |
| **UT-02** | Finance | Line item: 1 qty @ ₹100,000 with 0% disc | ₹100,000.00 | ₹100,000.00 | ✅ PASS |
| **UT-03** | Finance | Subtotal aggregation (2 items) | ₹1,90,000.00 | ₹1,90,000.00 | ✅ PASS |
| **UT-04** | Finance | 5% Global discount on ₹1,90,000 | ₹9,500.00 | ₹9,500.00 | ✅ PASS |
| **UT-05** | Finance | Taxable amount computation | ₹1,80,500.00 | ₹1,80,500.00 | ✅ PASS |
| **UT-06** | Finance | 18% GST calculation on taxable | ₹32,490.00 | ₹32,490.00 | ✅ PASS |
| **UT-07** | Finance | Grand Total computation | ₹2,12,990.00 | ₹2,12,990.00 | ✅ PASS |
| **UT-08** | Validation | Rejects short requirement (`"abc"`) | `isValid: false` | `isValid: false` | ✅ PASS |
| **UT-09** | Validation | Rejects placeholder (`"n/a"`, `"test"`) | `isValid: false` | `isValid: false` | ✅ PASS |
| **UT-10** | Validation | Accepts valid customer requirement (>=10 chars) | `isValid: true` | `isValid: true` | ✅ PASS |
| **UT-11** | Validation | Rejects budget = `"0"` | `isValid: false` | `isValid: false` | ✅ PASS |
| **UT-12** | Validation | Rejects negative budget (`"-5000"`) | `isValid: false` | `isValid: false` | ✅ PASS |
| **UT-13** | Validation | Rejects non-numeric budget string | `isValid: false` | `isValid: false` | ✅ PASS |
| **UT-14** | Validation | Accepts positive numeric budget (`"750000"`) | `isValid: true` | `isValid: true` | ✅ PASS |
| **UT-15** | Validation | Rejects numeric-only decision maker (`"12345"`) | `isValid: false` | `isValid: false` | ✅ PASS |
| **UT-16** | Validation | Accepts valid person name (`"Vikram Malhotra"`) | `isValid: true` | `isValid: true` | ✅ PASS |
| **UT-17** | Validation | Accepts future expected close date (+15 days) | `isValid: true` | `isValid: true` | ✅ PASS |
| **UT-18** | Validation | Rejects past expected close date (`2020-01-01`) | `isValid: false` | `isValid: false` | ✅ PASS |
| **UT-19** | Interns | Accepts valid 10-digit phone (`"9876543210"`) | `null` (valid) | `null` (valid) | ✅ PASS |
| **UT-20** | Interns | Rejects 20-digit overly long phone | Error string | Error string | ✅ PASS |
| **UT-21** | Interns | Rejects 5-digit short phone | Error string | Error string | ✅ PASS |
| **UT-22** | Interns | Rejects alphanumeric phone (`"987654321A"`) | Error string | Error string | ✅ PASS |
| **UT-23** | Interns | Accepts DOB for adult intern (year 2003) | `null` (valid) | `null` (valid) | ✅ PASS |
| **UT-24** | Interns | Rejects intern younger than 16 years | Error string | Error string | ✅ PASS |
| **UT-25** | Interns | Accepts valid CGPA format (`"8.5 CGPA"`) | `null` (valid) | `null` (valid) | ✅ PASS |
| **UT-26** | Interns | Accepts valid percentage (`"85%"`) | `null` (valid) | `null` (valid) | ✅ PASS |
| **UT-27** | Interns | Rejects out-of-range CGPA (`15.5`) | Error string | Error string | ✅ PASS |
| **UT-28** | Formatter | Format Indian Rupee currency (₹1,48,35,000) | Formatted INR | Formatted INR | ✅ PASS |
| **UT-29** | Formatter | Classifies score 25 as "Low" | `"Low"` | `"Low"` | ✅ PASS |
| **UT-30** | Formatter | Classifies score 55 as "Medium" | `"Medium"` | `"Medium"` | ✅ PASS |
| **UT-31** | Formatter | Classifies score 85 as "High" | `"High"` | `"High"` | ✅ PASS |
| **UT-32** | Attendance | 09:00 to 18:00 = 9 hours worked | `9.0` | `9.0` | ✅ PASS |
| **UT-33** | Attendance | 09:00 check-in is not late | `isLate: false` | `isLate: false` | ✅ PASS |
| **UT-34** | Attendance | 9 hours workday is not half-day | `isHalfDay: false` | `isHalfDay: false` | ✅ PASS |
| **UT-35** | Attendance | 9 hours worked = 1 hour overtime | `1.0` | `1.0` | ✅ PASS |
| **UT-36** | Attendance | 09:30 check-in flagged as late (> 09:15) | `isLate: true` | `isLate: true` | ✅ PASS |
| **UT-37** | Attendance | 3.5 hours worked flagged as half-day (< 4.5h) | `isHalfDay: true` | `isHalfDay: true` | ✅ PASS |
| **UT-38** | Helpdesk | Urgent ticket SLA turnaround is 4 hours | `slaHours: 4` | `slaHours: 4` | ✅ PASS |
| **UT-39** | Helpdesk | Urgent ticket due timestamp exactly +4h | `14:00:00Z` | `14:00:00Z` | ✅ PASS |
| **UT-40** | Helpdesk | Low ticket SLA turnaround is 48 hours | `slaHours: 48` | `slaHours: 48` | ✅ PASS |

---

## 4. Execution Terminal Output

```text
================================================================
🧪 TEST SUITE 01: UNIT TESTING (Pure Logic & Calculation Units)
================================================================

--- Sub-Suite 1: Quotation & Financial Calculations ---
  ✅ PASS: Line Item Total with 10% discount: 2 * 50,000 - 10% = 90,000
  ✅ PASS: Line Item Total with 0% discount: 1 * 100,000 = 100,000
  ✅ PASS: Quotation Subtotal is ₹1,90,000
  ✅ PASS: Quotation 5% Global Discount is ₹9,500
  ✅ PASS: Taxable Amount is ₹1,80,500
  ✅ PASS: 18% GST is ₹32,490
  ✅ PASS: Grand Total is ₹2,12,990

--- Sub-Suite 2: Lead Qualification Validation ---
  ✅ PASS: Rejects short requirement ("abc")
  ✅ PASS: Rejects placeholder requirement ("n/a")
  ✅ PASS: Accepts valid requirement
  ✅ PASS: Rejects zero budget
  ✅ PASS: Rejects negative budget
  ✅ PASS: Rejects non-numeric budget
  ✅ PASS: Accepts valid positive budget "750000"
  ✅ PASS: Rejects numeric decision maker
  ✅ PASS: Accepts valid decision maker "Vikram Malhotra"
  ✅ PASS: Accepts future expected close date
  ✅ PASS: Rejects past expected close date

--- Sub-Suite 3: Intern Onboarding Field Validators ---
  ✅ PASS: Accepts exact 10-digit phone "9876543210"
  ✅ PASS: Rejects 20-digit phone number
  ✅ PASS: Rejects 5-digit short phone
  ✅ PASS: Rejects phone with letters
  ✅ PASS: Accepts valid DOB for adult intern (2003)
  ✅ PASS: Rejects intern younger than 16 years
  ✅ PASS: Accepts valid CGPA "8.5 CGPA"
  ✅ PASS: Accepts valid percentage "85%"
  ✅ PASS: Rejects out-of-range CGPA 15.5

--- Sub-Suite 4: Currency & Formatting ---
  ✅ PASS: Formats ₹1,48,35,000 in Indian numbering format
  ✅ PASS: Score 25 classified as Low
  ✅ PASS: Score 55 classified as Medium
  ✅ PASS: Score 85 classified as High

--- Sub-Suite 5: Attendance & Overtime Calculations ---
  ✅ PASS: Standard workday: 9 hours worked
  ✅ PASS: 9:00 AM check-in is not late
  ✅ PASS: 9 hours is not half day
  ✅ PASS: 9 hours = 1 hour overtime (> 8h)
  ✅ PASS: 9:30 AM check-in is marked as Late (> 9:15 AM)
  ✅ PASS: 3.5 hours worked is marked as Half Day (< 4.5h)

--- Sub-Suite 6: Helpdesk SLA Calculations ---
  ✅ PASS: Urgent ticket SLA is 4 hours
  ✅ PASS: Urgent ticket due 4 hours later (14:00:00Z)
  ✅ PASS: Low ticket SLA is 48 hours

----------------------------------------------------------------
Unit Testing Suite Results: 40 PASSED, 0 FAILED (Total: 40)
================================================================
```

