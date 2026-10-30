# 🔧 [4] Technical Documentation
## Enterprise CRM, HRMS & ERP Platform

---

> This document covers the internal architecture, design patterns, authentication system,
> real-time communication, and coding conventions used across the platform.

---

## 4.1 Backend Technology Stack

| Layer | Technology | Version | Role |
|:---|:---|:---|:---|
| **Runtime** | Node.js | 18.x/20.x | JavaScript server runtime |
| **Framework** | Express.js | 4.21.2 | HTTP server, routing, middleware |
| **Module System** | ES Modules (`"type": "module"`) | — | Modern import/export syntax |
| **Database** | PostgreSQL | 16/18 Alpine | Primary relational data store |
| **DB Driver** | pg (node-postgres) | 8.13.1 | Connection pool management |
| **Auth** | jsonwebtoken | 9.0.2 | JWT token signing & verification |
| **Crypto** | bcryptjs | 2.4.3 | Password & PIN hashing |
| **Validation** | Zod | 3.24.2 | Runtime request schema validation |
| **File Upload** | Multer | 2.4.0 | Multipart form file handling |
| **Logging** | Winston | 3.17.0 | Structured application logging |
| **Real-time** | ws (WebSocket) | 8.18.0 | Bidirectional live updates |
| **PDF** | pdf-lib | 1.17.1 | Payslip PDF generation |
| **AI** | openai | 7.10.0 | AI-powered features |

---

## 4.2 Authentication & Authorization System

### JWT Authentication Flow

```
Client Login Request (POST /api/auth/login)
         │
         ▼
  Verify credentials in DB
  bcryptjs.compare(password, hash)
         │
         ▼
  Issue JWT Token:
  {
    id: employee.id,
    email: employee.email,
    role: employee.role,        ← "super_admin" | "hr_admin" | "finance" | "employee"
    employeeId: employee.emp_id,
    exp: now + 7days
  }
         │
         ▼
  Client stores token in localStorage
  All subsequent requests: Authorization: Bearer <token>
         │
         ▼
  authenticateUser middleware (middleware/auth.js)
  → jwt.verify(token, JWT_SECRET)
  → req.user = decoded payload
         │
         ▼
  protectModuleRoute middleware (middleware/moduleAuth.js)
  → Check module access against employee's assigned modules
  → 403 if unauthorized module access
```

### Role Permissions Matrix

| Permission | super_admin | hr_admin | finance | manager | employee |
|:---|:---:|:---:|:---:|:---:|:---:|
| View all employees | ✅ | ✅ | ❌ | Partial | ❌ |
| Manage payroll | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve leave | ✅ | ✅ | ❌ | ✅ | ❌ |
| View CRM leads | ✅ | ❌ | ❌ | ✅ | ❌ |
| Manage accounts | ✅ | ❌ | ✅ | ❌ | ❌ |
| ESS self-service | ✅ | ✅ | ✅ | ✅ | ✅ |
| System settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Module management | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4.3 Dual-Database Architecture

### Connection Pool (`db/pool.js`)

```javascript
// Two separate pg.Pool instances
hrmsPool → connects to DB_NAME (HRMS) — Employees, Payroll, Attendance
crmPool  → connects to CRM_DB_NAME (crm) — Leads, Customers, Sales
```

### Database Segregation

| Database | Tables / Domain | Pool |
|:---|:---|:---|
| **HRMS DB** | `employees`, `attendance_logs`, `leave_requests`, `payroll_runs`, `payslips`, `tasks`, `departments`, `designations`, `branches`, `shifts`, `interns`, `documents`, `timesheets`, `allocations` | `hrmsPool` |
| **CRM DB** | `leads`, `customers`, `contacts`, `opportunities`, `quotations`, `sales_orders`, `crm_invoices`, `products`, `vendors`, `purchase_orders`, `projects`, `groups` | `crmPool` |

---

## 4.4 Database Migration System

### Migration Runner (`db/migrator.js`)

```javascript
// On every server start:
await ensureDatabaseAndMigrate()     // HRMS migrations
await ensureCRMDatabaseAndMigrate()  // CRM migrations
```

- Migration files applied **idempotently** using `IF NOT EXISTS` guards
- A `schema_migrations` table tracks which migrations have been applied
- File naming: `NNN_description.sql` where NNN = 3-digit sequential number

---

## 4.5 Real-Time WebSocket System

### WebSocket Server (`utils/websocket.js`)

```
Backend WebSocket Server (ws://:5000)
         │
         ├── Broadcast: Leave approval status → Employee dashboard
         ├── Broadcast: Task status change → Assignee notification
         ├── Broadcast: Clock-in/Clock-out → Admin attendance roster
         ├── Broadcast: Payroll run complete → Finance notification
         └── Broadcast: New task assigned → Employee task board
```

### Frontend WebSocket Client

```typescript
const ws = new WebSocket('ws://localhost:5000');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Updates local state without page reload
  handleRealTimeUpdate(data.type, data.payload);
};
```

---

## 4.6 Frontend Architecture

### State Management (React Context API)

```typescript
AppContext {
  isAuthenticated: boolean
  userRole: 'super_admin' | 'hr_admin' | 'finance' | 'manager' | 'employee'
  activeModule: string        // Which module is currently displayed
  currentUser: UserProfile    // Logged-in user data
  modules: Module[]           // Permitted modules for this user
}
```

### API Service Pattern

```typescript
// Standard service function pattern (services/ directory)
export const fetchEmployees = async (params?: FilterParams) => {
  const response = await fetch(`/api/employees?${buildQuery(params)}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('crm_token')}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};
```

---

## 4.7 File Upload System

```
POST /api/tasks/:id/attachments
POST /api/documents
POST /api/leads/:id/attachments
         │
         ▼
   Multer Middleware
   → Validates file type & size
   → Saves to: backend/uploads/<category>/<filename>
         │
         ▼
   Static File Serving
   app.use('/uploads', express.static(uploadsDir))
   → Files: http://localhost:5000/uploads/<path>
```

Upload directories auto-created on server start:
- `backend/uploads/tasks/`
- `backend/uploads/documents/`
- `backend/uploads/leads/`
- `backend/uploads/timesheets/`

---

## 4.8 Payroll Engine Logic

```
Monthly Payroll Run:
  1. Fetch CTC structure for employee
  2. Calculate Gross Salary (Basic + HRA + Conveyance + Allowances)
  3. Compute Statutory Deductions:
     - PF = 12% of Basic (capped at ₹1,800/month)
     - ESI = 0.75% of Gross (if Gross < ₹21,000)
     - Professional Tax = State-specific slab
     - TDS = Annual income tax / 12
  4. Compute LOP Deductions:
     - Count absent/LOP-marked days in the month
     - LOP = (Gross / working_days) × LOP_days
  5. Net Pay = Gross - All Deductions - LOP
  6. Insert payslip record into `payslips` table
  7. Create journal entries in `chart_of_accounts`
```

---

## 4.9 Coding Conventions

### Backend (JavaScript ESM)

- **File naming:** `camelCase.js` for routes, controllers, utils
- **Database queries:** Raw SQL with parameterized queries (`$1, $2`) — no ORM
- **Error handling:** `try/catch` + centralized `errorHandler` middleware
- **Logging:** Winston logger for structured logs
- **Validation:** Zod schemas in `validators/` directory
- **Response format:** `{ success: true, data: [...] }` or `{ error: 'message' }`

### Frontend (TypeScript React)

- **File naming:** `PascalCase.tsx` for components, `camelCase.ts` for utils/services
- **State:** React Context API for global state, `useState`/`useEffect` for local
- **Styling:** Tailwind CSS utility classes
- **Icons:** Lucide React exclusively
- **API calls:** Fetch API with `Authorization: Bearer <token>` header
- **TypeScript:** Strict mode enabled, all props typed with interfaces

---

## 4.10 Security Implementation

| Security Measure | Implementation |
|:---|:---|
| Password hashing | `bcryptjs` with salt rounds = 10 |
| Token authentication | JWT with 7-day expiry |
| CORS protection | `cors` middleware, origin whitelist |
| SQL injection prevention | Parameterized queries (`$1, $2`) |
| Rate limiting | `express-rate-limit` on auth endpoints |
| Request validation | Zod schema validation |
| File upload security | MIME type validation via Multer |
| Module access control | Per-module authorization middleware |
