# 🛠️ Tools, Technologies & Dependencies Guide

A complete, categorized inventory of all tools, libraries, frameworks, databases, dev tools, and packages used across the **Enterprise CRM, HRMS, ESS & ERP Platform**.

---

## 📑 Table of Contents
1. [Frontend Stack & UI Tools](#1-frontend-stack--ui-tools)
2. [Backend & API Architecture](#2-backend--api-architecture)
3. [Database & Data Layer](#3-database--data-layer)
4. [Authentication & Security](#4-authentication--security)
5. [Real-time Communication](#5-real-time-communication)
6. [DevOps, Containerization & Infrastructure](#6-devops-containerization--infrastructure)
7. [Testing & Quality Assurance Suites](#7-testing--quality-assurance-suites)
8. [Developer Tooling & Package Management](#8-developer-tooling--package-management)
9. [Summary Comparison Matrix](#9-summary-comparison-matrix)

---

## 1. Frontend Stack & UI Tools

The frontend is built as a Single Page Application (SPA) prioritizing performance, component reusability, and responsive design.

| Tool / Library | Version | Category | Purpose in Project |
| :--- | :--- | :--- | :--- |
| **[React](https://react.dev/)** | `^18.3.1` | UI Library | Core component-based reactive user interface rendering. |
| **[React DOM](https://react.dev/)** | `^18.3.1` | DOM Renderer | Entry point for mounting React into the browser DOM. |
| **[TypeScript](https://www.typescriptlang.org/)** | `^5.7.3` | Language | Provides strict type safety, data modeling, and compile-time error catching. |
| **[Vite](https://vitejs.dev/)** | `^6.1.0` | Build Tool & Bundler | Ultra-fast Hot Module Replacement (HMR) development server and optimized production bundler. |
| **[Tailwind CSS](https://tailwindcss.com/)** | `^3.4.17` | CSS Framework | Modern utility-first styling for responsive layouts, color schemes, and glassmorphism. |
| **[PostCSS](https://postcss.org/)** | `^8.5.1` | CSS Tooling | Processes Tailwind CSS directives into standard browser CSS. |
| **[Autoprefixer](https://github.com/postcss/autoprefixer)** | `^10.4.20` | CSS Post-Processor | Automatically adds vendor prefixes for cross-browser CSS compatibility. |
| **[Lucide React](https://lucide.dev/)** | `^0.475.0` | Iconography | Clean, modern vector icons used across navigation, status badges, buttons, and tables. |
| **[clsx](https://github.com/lukeed/clsx)** | `^2.1.1` | Utility | Utility for conditionally constructing `className` strings. |
| **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** | `^3.0.1` | Utility | Efficiently merges Tailwind CSS classes without style conflict bugs. |
| **React Context API** | Native | State Management | Global state management for authentication tokens, active role, current module, and toast notifications. |

---

## 2. Backend & API Architecture

The backend operates as a Node.js REST API server using ES Modules (`"type": "module"`).

| Tool / Library | Version | Category | Purpose in Project |
| :--- | :--- | :--- | :--- |
| **[Node.js](https://nodejs.org/)** | `18.x` / `20.x`+ | Runtime Environment | High-performance asynchronous JavaScript server runtime. |
| **[Express.js](https://expressjs.com/)** | `^4.21.2` | Web Framework | REST API routing, HTTP middleware pipeline, parameter parsing, and static file serving. |
| **[dotenv](https://github.com/motdotla/dotenv)** | `^16.4.7` | Environment Config | Loads environment configurations (`.env`) for ports, DB credentials, and JWT keys. |
| **[CORS](https://github.com/expressjs/cors)** | `^2.8.5` | Middleware | Enables Cross-Origin Resource Sharing between Vite frontend (`localhost:3000` / `localhost:5173`) and API (`localhost:5000`). |
| **[Zod](https://zod.dev/)** | `^3.24.2` | Data Validation | Strict schema validation for incoming HTTP request payloads, preventing malformed inputs. |
| **[Winston](https://github.com/winstonjs/winston)** | `^3.17.0` | Logging Library | Structured logging for debugging, audit trails, and error tracking. |

---

## 3. Database & Data Layer

A **Database-First** approach using PostgreSQL with automated triggers, relational constraints, and migration scripts.

| Tool / Technology | Version | Category | Purpose in Project |
| :--- | :--- | :--- | :--- |
| **[PostgreSQL](https://www.postgresql.org/)** | `18-alpine` | Relational DBMS | Primary database storing employees, attendance, payroll, tasks, CRM deals, and general ledger. |
| **[pg (node-postgres)](https://node-postgres.com/)** | `^8.13.1` | Database Driver | High-throughput PostgreSQL client and connection pooling (`pg.Pool`). |
| **SQL Migrations Engine** | Native SQL | Migration System | 11 sequential migration scripts (`001` - `011`) executed automatically on boot by `setup_hrms.js`. |
| **PostgreSQL Triggers & Stored Procedures** | Native PL/pgSQL | DB Logic | Auto-calculates attendance durations, updates modification timestamps, and triggers real-time data sync. |

---

## 4. Authentication & Security

| Tool / Library | Version | Category | Purpose in Project |
| :--- | :--- | :--- | :--- |
| **[jsonwebtoken (JWT)](https://github.com/auth0/node-jsonwebtoken)** | `^9.0.2` | Auth Token Engine | Signs and verifies stateless JWT tokens for role-based API access. |
| **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** | `^2.4.3` | Cryptography | One-way password hashing and PIN salting for employee and admin accounts. |
| **Custom Auth Middleware** | Internal | RBAC Middleware | Protects `/api/*` endpoints and validates user permissions (Super Admin, HR, Finance, Employee). |

---

## 5. Real-time Communication

| Tool / Library | Version | Category | Purpose in Project |
| :--- | :--- | :--- | :--- |
| **[ws (WebSocket)](https://github.com/websockets/ws)** | `^8.18.0` | Real-time Engine | Bidirectional WebSocket server broadcasting real-time updates for leave approvals, task status changes, and clock-in/out logs. |
| **Frontend WebSocket Listener** | Native JS API | Client-side Socket | Listens for server events to refresh UI components without requiring manual page reloads. |

---

## 6. DevOps, Containerization & Infrastructure

| Tool | Category | Purpose in Project |
| :--- | :--- | :--- |
| **[Docker](https://www.docker.com/)** | Container Platform | Packages frontend, backend, and PostgreSQL into isolated, reproducible container images. |
| **[Docker Compose](https://docs.docker.com/compose/)** | Multi-Container Orchestration | Manages multi-container setup via `docker-compose.yml` (`crm_postgres`, `crm_backend`, `crm_frontend`). |
| **[Nginx](https://nginx.org/)** (Production Ready) | Reverse Proxy & Web Server | Routes incoming traffic, serves compiled static frontend assets, and forwards API & WebSocket connections. |
| **[PM2](https://pm2.keymetrics.io/)** (Optional) | Process Manager | Production daemon process manager for auto-restarting and load-balancing the Node.js backend. |

---

## 7. Testing & Quality Assurance Suites

The application includes built-in end-to-end (E2E) verification scripts located in the `backend` folder:

| Test Script | Target Area | What It Validates |
| :--- | :--- | :--- |
| `test_payroll_production_suite.js` | Payroll & Finance | CTC computation, statutory deductions (PF/ESI/TDS/PT), LOP auto-deduction, and payslip creation. |
| `test_task_management_e2e.js` | Enterprise Tasks | Task creation, subtask completion, priority management, and file attachment uploads. |
| `test_ess_admin_complete_suite.js` | ESS & Admin Sync | Two-way sync between Employee Self-Service actions and Admin dashboard responses. |
| `test_leave_approval_workflow.js` | Leave Engine | Leave balance deductions, multi-tier approval stages, rejection reasons, and cancellations. |
| `test_recruitment_careers_integration.js` | ATS & Careers | Public job application submissions, candidate status pipeline progression, and resume handling. |
| `test_salary_payment_e2e.js` | Ledger & Banking | Salary disbursement batch creation and general ledger journal entries. |

---

## 8. Developer Tooling & Package Management

| Tool | Usage | Purpose |
| :--- | :--- | :--- |
| **Node Package Manager (npm)** | Package Manager | Manages dependencies, scripts, and package lockfiles. |
| **TypeScript Compiler (`tsc`)** | Linter & Type Checker | Runs `npm run lint` and `tsc && vite build` to prevent type mismatches. |
| **Git** | Version Control | Versioning, branch workflows, and team collaboration. |
| **Visual Studio Code / Cursor / Windsurf** | IDE | Code editing, debugging, and extensions support. |

---

## 9. Summary Comparison Matrix

```text
========================================================================================
LAYER            PRIMARY TOOLS USED                       COMMUNICATION PROTOCOL
========================================================================================
Frontend         React 18, TypeScript 5.7, Vite 6,       HTTP / REST (JSON) +
                 Tailwind CSS 3.4, Lucide Icons          WebSocket (ws://)
----------------------------------------------------------------------------------------
Backend API      Node.js (ESM), Express 4.21, Zod,       REST API Endpoints +
                 JWT, Bcrypt.js, Winston, CORS           WebSocket Broadcasts
----------------------------------------------------------------------------------------
Database         PostgreSQL 18 (Alpine), pg Pool,        TCP Port 5432 (SQL)
                 PL/pgSQL Triggers & 11 Migrations
----------------------------------------------------------------------------------------
Infrastructure   Docker, Docker Compose, Nginx, PM2      Container Networking / Proxy
========================================================================================
```
