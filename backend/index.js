import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hrmsPool, crmPool } from './db/pool.js';
import { initWebSocketServer } from './utils/websocket.js';

// ─── HRMS Routes (Friend 2 — Employees, Payroll, Attendance) ────────────────
import authRouter from './routes/auth.js';
import employeesRouter from './routes/employees.js';
import attendanceRouter from './routes/attendance.js';
import shiftsRouter from './routes/shifts.js';
import leaveRouter from './routes/leave.js';
import payrollRouter from './routes/payroll.js';
import recruitmentRouter from './routes/recruitment.js';
import hrmsRouter from './routes/hrms.js';
import accountsRouter from './routes/accounts.js';
import bankingRouter from './routes/banking.js';
import expensesRouter from './routes/expenses.js';
import departmentsRouter from './routes/departments.js';
import designationsRouter from './routes/designations.js';
import branchesRouter from './routes/branches.js';
import dashboardRouter from './routes/dashboard.js';

// ─── CRM Routes (Friend 1 — Leads, Customers, Opportunities, Sales) ──────────
import leadsRouter from './routes/leads.js';
import customersRouter from './routes/customers.js';
import contactsRouter from './routes/contacts.js';
import opportunitiesRouter from './routes/opportunities.js';
import crmActivitiesRouter from './routes/crm_activities.js';
import quotationsRouter from './routes/quotations.js';
import salesOrdersRouter from './routes/sales_orders.js';
import crmInvoicesRouter from './routes/crm_invoices.js';
import crmProductsRouter from './routes/crm_products.js';
import vendorsRouter from './routes/vendors.js';
import purchaseOrdersRouter from './routes/purchase_orders.js';

import { authenticateUser } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ensureDatabaseAndMigrate } from './setup_hrms.js';
import { ensureCRMDatabaseAndMigrate } from './setup_crm.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ─── HRMS Migration runner (runs on boot against hrmsPool) ──────────────────
async function initializeHRMSSchema() {
  const migrations = [
    '001_initial_schema.sql',
    '002_enterprise_complete_schema.sql',
    '003_automatic_database_triggers.sql',
    '004_db_first_complete.sql',
    '005_master_prompt_complete_schema.sql',
  ];

  for (const migrationFile of migrations) {
    const migrationPath = path.join(__dirname, 'db', 'migrations', migrationFile);
    if (fs.existsSync(migrationPath)) {
      try {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await hrmsPool.query(sql);
        console.log(`✅ [HRMS] Migration applied: ${migrationFile}`);
      } catch (err) {
        console.warn(`⚠️  [HRMS] Migration note [${migrationFile}]: ${err.message}`);
      }
    }
  }
}

// Global Authentication Middleware
app.use(authenticateUser);

// ─── HRMS API Routes (Friend 2) ───────────────────────────────────────────────
app.use('/api/auth',         authRouter);
app.use('/api/employees',    employeesRouter);
app.use('/api/hrms',         hrmsRouter);
app.use('/api/departments',  departmentsRouter);
app.use('/api/designations', designationsRouter);
app.use('/api/branches',     branchesRouter);
app.use('/api/dashboard',    dashboardRouter);
app.use('/api/attendance',   attendanceRouter);
app.use('/api/shifts',       shiftsRouter);
app.use('/api/leave',        leaveRouter);
app.use('/api/payroll',      payrollRouter);
app.use('/api/recruitment',  recruitmentRouter);
app.use('/api/accounts',     accountsRouter);
app.use('/api/banking',      bankingRouter);
app.use('/api/expenses',     expensesRouter);

// ─── CRM API Routes (Friend 1) ────────────────────────────────────────────────
app.use('/api/leads',           leadsRouter);
app.use('/api/customers',       customersRouter);
app.use('/api/contacts',        contactsRouter);
app.use('/api/opportunities',   opportunitiesRouter);
app.use('/api/crm/activities',  crmActivitiesRouter);
app.use('/api/quotations',      quotationsRouter);
app.use('/api/sales-orders',    salesOrdersRouter);
app.use('/api/crm/invoices',    crmInvoicesRouter);
app.use('/api/crm/products',    crmProductsRouter);
app.use('/api/vendors',         vendorsRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);

// ─── Health Check (shows both DB connections) ─────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const hrmsInfo = await hrmsPool.query('SELECT current_database(), current_user, version()');
    const crmInfo  = await crmPool.query('SELECT current_database(), current_user');
    const empCount = await hrmsPool.query('SELECT COUNT(*) FROM employees');
    const leadCount = await crmPool.query('SELECT COUNT(*) FROM leads');

    res.json({
      status: 'OK',
      message: 'CRM + HRMS Dual-DB Enterprise API — 100% DB-First',
      databases: {
        hrms: {
          name: hrmsInfo.rows[0].current_database,
          user: hrmsInfo.rows[0].current_user,
          purpose: 'Friend 2 — Employees, Payroll, Attendance, Leave, Recruitment',
          stats: { employees: parseInt(empCount.rows[0].count) },
        },
        crm: {
          name: crmInfo.rows[0].current_database,
          user: crmInfo.rows[0].current_user,
          purpose: 'Friend 1 — Leads, Customers, Opportunities, Sales, Invoices',
          stats: { leads: parseInt(leadCount.rows[0].count) },
        },
      },
      postgresVersion: hrmsInfo.rows[0].version,
    });
  } catch (err) {
    res.json({ status: 'OK', message: 'Backend active (one or both DBs offline)', error: err.message });
  }
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Real-time WebSocket Server
initWebSocketServer(server);

server.listen(PORT, async () => {
  console.log(`🚀 Dual-DB Enterprise API active on http://localhost:${PORT}`);
  console.log(`   👥 HRMS DB (Friend 2): ${process.env.DB_NAME || 'HRMS'}`);
  console.log(`   📊 CRM  DB (Friend 1): ${process.env.CRM_DB_NAME || 'crm'}`);

  // Initialize HRMS database (Friend 2)
  try {
    await ensureDatabaseAndMigrate();
  } catch (e) {
    console.error('[HRMS] Database startup check failed:', e.message);
  }
  await initializeHRMSSchema();

  // Initialize CRM database (Friend 1)
  try {
    await ensureCRMDatabaseAndMigrate();
  } catch (e) {
    console.error('[CRM] Database startup check failed:', e.message);
  }
});
