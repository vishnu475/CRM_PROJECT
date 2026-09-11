import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hrmsPool, crmPool } from './db/pool.js';
import { initWebSocketServer } from './utils/websocket.js';
// Reload trigger: sequential-employee-id-flow-v2

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
import tasksRouter from './routes/tasks.js';
import internsRouter from './routes/interns.js';
import reportsRouter from './routes/reports.js';
import modulesRouter from './routes/modules.js';

// ─── CRM Routes (Friend 1 — Leads, Customers, Opportunities, Sales) ──────────
import leadsRouter from './routes/leads.js';
import customersRouter from './routes/customers.js';
import contactsRouter from './routes/contacts.js';
import opportunitiesRouter from './routes/opportunities.js';
import crmActivitiesRouter from './routes/crm_activities.js';
import crmFollowUpsRouter from './routes/crm_followups.js';
import quotationsRouter from './routes/quotations.js';
import salesOrdersRouter from './routes/sales_orders.js';
import crmInvoicesRouter from './routes/crm_invoices.js';
import crmProductsRouter from './routes/crm_products.js';
import vendorsRouter from './routes/vendors.js';
import purchaseOrdersRouter from './routes/purchase_orders.js';
import projectsRouter from './routes/projects.js';
import groupsRouter from './routes/groups.js';

import { authenticateUser } from './middleware/auth.js';
import { protectModuleRoute } from './middleware/moduleAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ensureDatabaseAndMigrate } from './setup_hrms.js';
import { ensureCRMDatabaseAndMigrate } from './setup_crm.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure uploads/tasks, uploads/documents, and uploads/leads directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const tasksUploadsDir = path.join(uploadsDir, 'tasks');
const docsUploadsDir = path.join(uploadsDir, 'documents');
const leadsUploadsDir = path.join(uploadsDir, 'leads');
if (!fs.existsSync(tasksUploadsDir)) {
  fs.mkdirSync(tasksUploadsDir, { recursive: true });
}
if (!fs.existsSync(docsUploadsDir)) {
  fs.mkdirSync(docsUploadsDir, { recursive: true });
}
if (!fs.existsSync(leadsUploadsDir)) {
  fs.mkdirSync(leadsUploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ─── HRMS Migration runner (runs on boot against hrmsPool) ──────────────────
async function initializeHRMSSchema() {
  const migrationsDir = path.join(__dirname, 'db', 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  for (const migrationFile of migrationFiles) {
    const migrationPath = path.join(migrationsDir, migrationFile);
    try {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await hrmsPool.query(sql);
      console.log(`✅ [HRMS] Migration applied: ${migrationFile}`);
    } catch (err) {
      console.warn(`⚠️  [HRMS] Migration note [${migrationFile}]: ${err.message}`);
    }
  }
}

// Global Authentication Middleware
app.use(authenticateUser);
// Global Module Authorization Protection Middleware
app.use(protectModuleRoute);

import essRouter from './routes/ess.js';
import documentsRouter from './routes/documents.js';
import { documentTypesRouter, documentCategoriesRouter } from './routes/document_config.js';

// ─── HRMS API Routes (Friend 2) ───────────────────────────────────────────────
app.use('/api/auth',                authRouter);
app.use('/auth',                    authRouter);
app.use('/api/employees',           employeesRouter);
app.use('/api/hrms',                hrmsRouter);
app.use('/api/tasks',               tasksRouter);
app.use('/api/modules',             modulesRouter);
app.use('/api/interns',             internsRouter);
app.use('/api/departments',         departmentsRouter);
app.use('/api/designations',        designationsRouter);
app.use('/api/branches',            branchesRouter);
app.use('/api/dashboard',           dashboardRouter);
app.use('/api/attendance',          attendanceRouter);
app.use('/api/shifts',              shiftsRouter);
app.use('/api/leave',               leaveRouter);
app.use('/api/payroll',             payrollRouter);
app.use('/api/recruitment',         recruitmentRouter);
app.use('/api/accounts',            accountsRouter);
app.use('/api/banking',             bankingRouter);
app.use('/api/expenses',            expensesRouter);
app.use('/api/reports',             reportsRouter);
app.use('/api/documents',           documentsRouter);
app.use('/api/document-types',      documentTypesRouter);
app.use('/api/document-categories', documentCategoriesRouter);
app.use('/api/v1/employee',         essRouter);
app.use('/api/employee',            essRouter);

// ─── CRM API Routes (Friend 1) ────────────────────────────────────────────────
app.use('/api/leads',           leadsRouter);
app.use('/api/customers',       customersRouter);
app.use('/api/contacts',        contactsRouter);
app.use('/api/opportunities',   opportunitiesRouter);
app.use('/api/crm/activities',  crmActivitiesRouter);
app.use('/api/crm/followups',   crmFollowUpsRouter);
app.use('/api/crm/follow-ups',  crmFollowUpsRouter);
app.use('/api/quotations',      quotationsRouter);
app.use('/api/sales-orders',    salesOrdersRouter);
app.use('/api/crm/invoices',    crmInvoicesRouter);
app.use('/api/crm/products',    crmProductsRouter);
app.use('/api/vendors',         vendorsRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);
app.use('/api/projects',        projectsRouter);
app.use('/api/groups',          groupsRouter);

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
