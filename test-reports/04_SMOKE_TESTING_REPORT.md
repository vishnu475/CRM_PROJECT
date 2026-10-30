# Test Report: Smoke Testing Suite

| Metadata | Value |
| :--- | :--- |
| **Test Type** | **Smoke Testing** |
| **Target Code** | Port Listeners, Database Connectors, API Health, Frontend Server, Schema Readiness |
| **Source Implementation** | [`backend/tests/04_smoke_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/04_smoke_testing_suite.js) |
| **Execution Command** | `npm run test:smoke` (or `node backend/tests/04_smoke_testing_suite.js`) |
| **Test Environment** | Node.js v24.12.0, Vite Dev Server (:3000), Express API (:5000), PostgreSQL (:5432) |
| **Execution Date** | October 30, 2026 |
| **Execution Status** | **PASSED (100%)** |
| **Total Test Cases** | **19** |
| **Passed** | **19** |
| **Failed** | **0** |

---

## 1. Executive Summary & Purpose

Smoke Testing (also called "Build Verification Testing") acts as the primary gatekeeper immediately following a deployment, server boot, or build creation. Its purpose is to rapidly confirm that all critical subsystems are operational, ports are accepting traffic, database connection pools are active, and essential REST routes respond with valid HTTP status codes before deeper testing begins.

---

## 2. Scope & Verification Layers

1. **System & Web Server Availability**: Verifies that the Express API (Port 5000) and Vite React frontend (Port 3000) are running and returning valid HTTP responses.
2. **Dual Database Ping**: Validates SQL ping queries against both PostgreSQL databases: `crm` and `HRMS`.
3. **Core REST API Route Readiness**: Probes 8 major business endpoints across CRM and HRMS modules.
4. **Authentication Gateway**: Verifies the authentication gate is actively enforcing validation.
5. **Schema Integrity**: Verifies the physical presence of mandatory production tables in both databases.

---

## 3. Test Cases & Results Matrix

| ID | Layer | Target / Check | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **ST-01** | Backend | `GET /api/health` status code | HTTP 200 | HTTP 200 | ✅ PASS |
| **ST-02** | Backend | `GET /api/health` body status | `status: "OK"` | `status: "OK"` | ✅ PASS |
| **ST-03** | Backend | CRM database health report | `status: "HEALTHY"` | `status: "HEALTHY"` | ✅ PASS |
| **ST-04** | Backend | HRMS database health report | `status: "HEALTHY"` | `status: "HEALTHY"` | ✅ PASS |
| **ST-05** | Frontend | Frontend Vite server (Port 3000) | HTTP 200 | HTTP 200 | ✅ PASS |
| **ST-06** | Frontend | Frontend HTML bundle markup | Contains `<html` | Contains `<html` | ✅ PASS |
| **ST-07** | Database | CRM PostgreSQL ping (`SELECT 1`) | `db: "crm"` | `db: "crm"` | ✅ PASS |
| **ST-08** | Database | HRMS PostgreSQL ping (`SELECT 1`) | `db: "HRMS"` | `db: "HRMS"` | ✅ PASS |
| **ST-09** | REST API | `GET /api/leads` | HTTP 200 | HTTP 200 | ✅ PASS |
| **ST-10** | REST API | `GET /api/quotations` | HTTP 200 | HTTP 200 | ✅ PASS |
| **ST-11** | REST API | `GET /api/sales-orders` | HTTP 200 | HTTP 200 | ✅ PASS |
| **ST-12** | REST API | `GET /api/customers` | HTTP 200 | HTTP 200 | ✅ PASS |
| **ST-13** | REST API | `GET /api/employees` | HTTP 200 | HTTP 200 | ✅ PASS |
| **ST-14** | REST API | `GET /api/interns` | HTTP 200 | HTTP 200 | ✅ PASS |
| **ST-15** | REST API | `GET /api/helpdesk/summary` | HTTP 200 | HTTP 200 | ✅ PASS |
| **ST-16** | REST API | `GET /api/departments` | HTTP 200 | HTTP 200 | ✅ PASS |
| **ST-17** | Security | Auth Gateway rejects empty login payload | HTTP 400 or 401 | HTTP 400 | ✅ PASS |
| **ST-18** | Schema | Core CRM tables exist in `crm` DB | `leads`, `quotations`, `sales_orders` | Tables present | ✅ PASS |
| **ST-19** | Schema | Core HRMS tables exist in `HRMS` DB | `employees`, `interns`, `attendance_records` | Tables present | ✅ PASS |

---

## 4. Execution Terminal Output

```text
================================================================
🧪 TEST SUITE 04: SMOKE TESTING (Service Health & Core Readiness)
================================================================

--- 1. Service Availability Smoke Checks ---
✅ [HRMS DB] Connected to "HRMS" on port 5432
✅ [CRM DB]  Connected to "crm" on port 5432
  ✅ PASS: Backend API health check returns HTTP 200
  ✅ PASS: Backend reports status "OK"
  ✅ PASS: CRM database status is "HEALTHY"
  ✅ PASS: HRMS database status is "HEALTHY"
  ✅ PASS: Frontend Vite server is running at port 3000 (HTTP 200)
  ✅ PASS: Frontend returns valid HTML bundle

--- 2. Database Connectivity Smoke Checks ---
  ✅ PASS: CRM PostgreSQL database responds to ping
  ✅ PASS: HRMS PostgreSQL database responds to ping

--- 3. Core REST Endpoints Smoke Checks ---
  ✅ PASS: Endpoint CRM Leads Collection (/api/leads) responds HTTP 200
  ✅ PASS: Endpoint Sales Quotations Collection (/api/quotations) responds HTTP 200
  ✅ PASS: Endpoint Sales Orders Collection (/api/sales-orders) responds HTTP 200
  ✅ PASS: Endpoint Customers Directory (/api/customers) responds HTTP 200
  ✅ PASS: Endpoint HRMS Employees Master (/api/employees) responds HTTP 200
  ✅ PASS: Endpoint HRMS Interns Directory (/api/interns) responds HTTP 200
  ✅ PASS: Endpoint Helpdesk Summary Metrics (/api/helpdesk/summary) responds HTTP 200
  ✅ PASS: Endpoint HRMS Departments Directory (/api/departments) responds HTTP 200

--- 4. Authentication Gateway Smoke Check ---
  ✅ PASS: Auth Gateway active: rejects empty login payload with 400/401

--- 5. Critical Tables Existence Smoke Check ---
  ✅ PASS: Core CRM tables exist (leads, quotations, sales_orders)
  ✅ PASS: Core HRMS tables exist (employees, interns, attendance_records)

----------------------------------------------------------------
Smoke Testing Suite Results: 19 PASSED, 0 FAILED (Total: 19)
================================================================
```

