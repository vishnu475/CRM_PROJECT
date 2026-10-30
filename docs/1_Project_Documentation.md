# 📘 [1] Project Documentation
## Enterprise CRM, HRMS & ERP Management Platform

---

> **Project Name:** ERP Suite — Advanced CRM, HRMS & Enterprise Resource Planning Platform
> **Version:** `v2.4.0-production` | **Document Version:** `v1.0`
> **Prepared By:** Core Engineering & Architecture Team | **Date:** October 30, 2026

---

## 1.1 Project Overview

The **Enterprise CRM, HRMS & ERP Management Platform** is an all-in-one, production-grade business management system that unifies Customer Relationship Management (CRM), Human Resource Management (HRMS), Employee Self-Service (ESS), Finance & Accounting, Inventory, Procurement, and Project Management into a single high-performance, real-time web application.

### Business Problem Solved

Small-to-medium and enterprise businesses struggle with 5+ disconnected SaaS subscriptions — separate tools for CRM, Payroll, Invoicing, Attendance, and Task Management. This system centralizes all data into a **single source of truth**, backed by PostgreSQL, eliminating duplicate data entry and information silos.

---

## 1.2 Intended Users & Personas

| User Persona | Role | Key Responsibilities |
|:---|:---|:---|
| **Executive / Super Admin** | `super_admin` | Company-wide analytics, financial health, full audit control |
| **HR Administrator** | `hr_admin` | Employee lifecycle, attendance, leave approvals, payroll |
| **Finance Accountant** | `finance` | General ledger, invoices, expense reimbursements, banking |
| **Sales Director** | `sales` | Lead pipelines, customer deals, quotations, sales orders |
| **Department Manager** | `manager` | Team task assignment, performance KPIs, leave approvals |
| **Employee (ESS)** | `employee` | Clock in/out, leave requests, payslip view, task tracking |

---

## 1.3 System Architecture

```
Client Browser (React 18 + TypeScript + Tailwind CSS)
         |
         | REST JSON API + WebSockets
         v
Backend API Server (Express.js — Port 5000)
  ├── JWT & RBAC Auth Middleware
  ├── Module-Level Authorization
  ├── WebSocket Server (Live Sync)
  └── Express API Routers (41 Route Files)
         |
         | pg Connection Pool
         v
Database Layer (PostgreSQL — Port 5432)
  ├── HRMS Database (employees, payroll, attendance, leave...)
  └── CRM Database (leads, customers, sales, invoices...)
```

---

## 1.4 Module Inventory (25 Frontend Modules)

| # | Module | Description |
|:---:|:---|:---|
| 1 | **HRMS** | Employee directory, profiles, departments, designations, branches |
| 2 | **Attendance** | Biometric kiosk, daily clock-in/out, timesheets, overtime |
| 3 | **Leave** | Leave balances, multi-tier approval workflow, calendar |
| 4 | **Payroll** | CTC structures, salary runs, payslips, statutory deductions |
| 5 | **ESS** | Employee Self-Service portal (dedicated `/employee` path) |
| 6 | **Recruitment** | Job openings, applicant tracking, candidate pipeline, careers page |
| 7 | **CRM** | Lead Kanban board, opportunity management, activities, follow-ups |
| 8 | **Customers** | Customer directory, profiles, interaction history, tags |
| 9 | **Sales** | Quotations, sales orders, CRM invoices, deal stages |
| 10 | **Accounts** | Chart of accounts, general ledger, double-entry accounting |
| 11 | **Banking** | Bank accounts, transactions, reconciliation |
| 12 | **Expenses** | Expense claims, reimbursements, receipt management |
| 13 | **Purchases** | Purchase orders, vendor invoices, procurement workflow |
| 14 | **Vendors** | Vendor directory, PO management, payment tracking |
| 15 | **Inventory** | Item catalog, stock levels, reorder alerts, valuation |
| 16 | **Projects** | Project management, milestones, project groups, workflows |
| 17 | **Tasks** | Enterprise task board, subtask checklists, attachments |
| 18 | **Timesheets** | Timesheet submission, admin review, allocation tracking |
| 19 | **Documents** | Document management system, version control, categories |
| 20 | **Reports** | Analytics dashboards, attendance reports, QA test reports |
| 21 | **Ledger** | General ledger views, journal entries |
| 22 | **Helpdesk** | Support tickets, SLA tracking, priority management |
| 23 | **Administration** | System administration, module permissions |
| 24 | **Settings** | System settings, preferences, configurations |
| 25 | **Testing/QA** | Integrated QA management with test reports |

---

## 1.5 Key Technical Features

### Dual-Database Architecture
- **HRMS Database** — Employees, Payroll, Attendance, Leave, Recruitment
- **CRM Database** — Leads, Customers, Opportunities, Sales, Invoices

### Real-Time Synchronization
- WebSocket server broadcasts live updates across admin and employee dashboards
- Leave approvals, task status changes, and clock-in/out events propagate instantly

### Role-Based Access Control (RBAC)
- JWT tokens with role claims
- Module-level permission authorization middleware
- Separate ESS portal isolated from admin controls

### Database-First Design
- 23+ sequential SQL migration files applied automatically on startup
- PostgreSQL PL/pgSQL triggers for automated calculations (attendance duration, LOP, timestamps)

---

## 1.6 Business Value Delivered

| KPI | Value |
|:---|:---|
| Administrative processing time reduction | **~40%** |
| Data silos eliminated | **100%** |
| Auditability across all modules | **Complete** |
| Real-time data synchronization | **WebSocket-powered** |
| Deployment options | **Local, Docker, Nginx+PM2** |
| Total modules delivered | **25 Frontend + 41 API routes** |
| Test scripts | **45+ E2E / Integration tests** |
| Database migrations | **23 sequential SQL files** |
