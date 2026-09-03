import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db/pool.js';
import { initWebSocketServer } from './utils/websocket.js';

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

import { authenticateUser } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ensureDatabaseAndMigrate } from './setup_hrms.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure uploads/tasks directory exists and serve statically
const uploadsDir = path.join(__dirname, 'uploads');
const tasksUploadsDir = path.join(uploadsDir, 'tasks');
if (!fs.existsSync(tasksUploadsDir)) {
  fs.mkdirSync(tasksUploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Run automatic database migration scripts on boot
async function initializeDatabaseSchema() {
  const migrations = [
    '001_initial_schema.sql',
    '002_enterprise_complete_schema.sql',
    '003_automatic_database_triggers.sql',
    '004_db_first_complete.sql',
    '005_master_prompt_complete_schema.sql',
    '006_central_payroll_engine.sql',
    '007_ess_portal_engine.sql',
    '008_ess_admin_two_way_integration.sql',
    '009_admin_notifications_and_two_way_sync.sql',
    '010_enterprise_task_management_and_performance.sql',
    '011_task_attachments.sql',
  ];

  for (const migrationFile of migrations) {
    const migrationPath = path.join(__dirname, 'db', 'migrations', migrationFile);
    if (fs.existsSync(migrationPath)) {
      try {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(sql);
        console.log(`✅ Migration applied: ${migrationFile}`);
      } catch (err) {
        console.warn(`⚠️ Migration note [${migrationFile}]: ${err.message}`);
      }
    }
  }
}

// Global Authentication Middleware
app.use(authenticateUser);

// API Route Handlers
app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/hrms', hrmsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/designations', designationsRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/leave', leaveRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/recruitment', recruitmentRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/banking', bankingRouter);
import essRouter from './routes/ess.js';

app.use('/api/v1/employee', essRouter);
app.use('/api/employee', essRouter);

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT current_database(), current_user, version()');
    const empCount = await pool.query('SELECT COUNT(*) FROM employees');
    const canCount = await pool.query('SELECT COUNT(*) FROM job_candidates');
    res.json({
      status: 'OK',
      message: 'CRM, HRMS & Finance Backend — 100% DB-First Enterprise API',
      database: dbRes.rows[0].current_database,
      dbUser: dbRes.rows[0].current_user,
      postgresVersion: dbRes.rows[0].version,
      stats: {
        employees: parseInt(empCount.rows[0].count),
        candidates: parseInt(canCount.rows[0].count),
      }
    });
  } catch (err) {
    res.json({ status: 'OK', message: 'Backend active (Database offline fallback)', error: err.message });
  }
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Real-time WebSocket Server
initWebSocketServer(server);

server.listen(PORT, async () => {
  console.log(`🚀 100% DB-First Enterprise API Server active on http://localhost:${PORT}`);
  try {
    await ensureDatabaseAndMigrate();
  } catch (e) {
    console.error("Database startup check failed:", e.message);
  }
  await initializeDatabaseSchema();
});

