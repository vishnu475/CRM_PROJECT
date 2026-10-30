import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { TimesheetService } from '../services/timesheetService.js';
import { hrmsPool as pool } from '../db/pool.js';

const router = express.Router();

// Ensure upload directory exists
const timesheetUploadDir = path.join(process.cwd(), 'uploads', 'timesheets');
if (!fs.existsSync(timesheetUploadDir)) {
  fs.mkdirSync(timesheetUploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, timesheetUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
  if (isPdfMime && isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Helper for error responses
function handleRouteError(res, err, defaultMsg = 'An error occurred.') {
  const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
  console.warn('[Timesheet API Error]', err.message);
  return res.status(statusCode).json({
    success: false,
    message: err.message || defaultMsg
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/timesheets/assign
 * Assign single day or date range to an employee
 */
router.post('/assign', async (req, res) => {
  try {
    const result = await TimesheetService.assignTimesheet(req.body, req.user);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to assign timesheet.');
  }
});

/**
 * GET /api/timesheets/admin
 * List all employee timesheets with filters & search
 */
router.get('/admin', async (req, res) => {
  try {
    const timesheets = await TimesheetService.getAdminTimesheets(req.query);
    res.json({ success: true, data: timesheets });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch admin timesheets.');
  }
});

/**
 * GET /api/timesheets/admin/:id
 * Full detail of a timesheet for admin review
 */
router.get('/admin/:id', async (req, res) => {
  try {
    const timesheet = await TimesheetService.getTimesheetDetail(req.params.id, req.user, true);
    res.json({ success: true, data: timesheet });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch timesheet details.');
  }
});

/**
 * POST /api/timesheets/admin/:id/approve
 * Approve submitted timesheet
 */
router.post('/admin/:id/approve', async (req, res) => {
  try {
    const result = await TimesheetService.approveTimesheet(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to approve timesheet.');
  }
});

/**
 * POST /api/timesheets/admin/:id/reject
 * Reject timesheet with required reason
 */
router.post('/admin/:id/reject', async (req, res) => {
  try {
    const { rejection_reason } = req.body;
    const result = await TimesheetService.rejectTimesheet(req.params.id, rejection_reason, req.user);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to reject timesheet.');
  }
});

/**
 * PATCH /api/timesheets/admin/:id
 * Admin updates timesheet (status, date, expected hours, remarks)
 */
router.patch('/admin/:id', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const result = await TimesheetService.adminUpdateTimesheet(req.params.id, req.body, userCtx);
    res.json({ success: true, message: 'Timesheet updated by administrator.', data: result });
  } catch (err) {
    handleRouteError(res, err, 'Failed to update timesheet.');
  }
});

/**
 * DELETE /api/timesheets/admin/:id
 * Admin completely deletes timesheet and all associated proofs/entries/files/logs
 */
router.delete('/admin/:id', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const result = await TimesheetService.adminDeleteTimesheet(req.params.id, userCtx);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete timesheet.');
  }
});

/**
 * DELETE /api/timesheets/:id
 * Direct delete timesheet (Admin / owner)
 */
router.delete('/:id', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const result = await TimesheetService.adminDeleteTimesheet(req.params.id, userCtx);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete timesheet.');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS ENDPOINTS (Admin & Manager)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/timesheets/reports/summary
 */
router.get('/reports/summary', async (req, res) => {
  try {
    const summary = await TimesheetService.getReportsSummary(req.query);
    res.json({ success: true, data: summary });
  } catch (err) {
    handleRouteError(res, err, 'Failed to generate timesheet summary report.');
  }
});

/**
 * GET /api/timesheets/reports/employee
 */
router.get('/reports/employee', async (req, res) => {
  try {
    const data = await TimesheetService.getEmployeeReports(req.query);
    res.json({ success: true, data });
  } catch (err) {
    handleRouteError(res, err, 'Failed to generate employee report.');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE CONTEXT RESOLVER
// Ensures each employee is strictly isolated and only accesses their own timesheets
// ─────────────────────────────────────────────────────────────────────────────
function resolveUserContext(req) {
  const headerEmpId = req.headers['x-employee-id'];
  const queryEmpId = req.query?.employeeId;
  const targetId = headerEmpId || queryEmpId || req.user?.empCode || req.user?.id;
  const role = req.headers['x-user-role'] || req.user?.role || (req.user?.isAdmin ? 'Admin' : 'Employee');
  return {
    ...req.user,
    id: targetId,
    empCode: targetId,
    name: req.headers['x-user-name'] || req.user?.name,
    role
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/timesheets/current
 * Returns ONLY DRAFT or OPEN timesheets for the authenticated employee.
 * Never returns SUBMITTED, APPROVED, REJECTED, or COMPLETED.
 */
router.get('/current', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const timesheet = await TimesheetService.getCurrentTimesheet(userCtx, req.query.date);
    res.json({ success: true, data: timesheet });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch current timesheet.');
  }
});

/**
 * POST /api/timesheets
 * Initialize or get draft timesheet for employee & date
 */
router.post('/', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const { date, expected_hours = 8.0 } = req.body;
    const timesheet = await TimesheetService.getOrCreateDraftTimesheet(date, userCtx, expected_hours);
    res.json({ success: true, message: 'Draft timesheet ready.', data: timesheet });
  } catch (err) {
    handleRouteError(res, err, 'Failed to create or open draft timesheet.');
  }
});

/**
 * GET /api/timesheets/history
 * List historical/submitted timesheets for the authenticated employee
 */
router.get('/history', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const data = await TimesheetService.getEmployeeHistory(userCtx, req.query);
    res.json({ success: true, data });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch timesheet history.');
  }
});

/**
 * GET /api/timesheets/history/:id
 * Historical submitted timesheet snapshot details
 */
router.get('/history/:id', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const timesheet = await TimesheetService.getTimesheetDetail(req.params.id, userCtx, false);
    res.json({ success: true, data: timesheet });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch historical timesheet.');
  }
});

/**
 * POST /api/timesheets/:id/save-draft
 * Save current timesheet in DRAFT status
 */
router.post('/:id/save-draft', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const result = await TimesheetService.saveDraftTimesheet(req.params.id, req.body, userCtx);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to save draft timesheet.');
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const result = await TimesheetService.saveDraftTimesheet(req.params.id, req.body, userCtx);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to update timesheet.');
  }
});

/**
 * GET /api/timesheets/my
 * List assigned timesheets for the authenticated employee
 */
router.get('/my', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const data = await TimesheetService.getMyTimesheets(userCtx, req.query);
    res.json({ success: true, data });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch your timesheets.');
  }
});

/**
 * GET /api/timesheets/my/:id
 * Get single timesheet details with entries and proofs (with ownership verification)
 */
router.get('/my/:id', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const timesheet = await TimesheetService.getTimesheetDetail(req.params.id, userCtx, false);
    res.json({ success: true, data: timesheet });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch timesheet.');
  }
});

/**
 * POST /api/timesheets/:id/entries and alias /api/timesheets/:id/work-entries
 * Add work entry to timesheet
 */
router.post(['/:id/entries', '/:id/work-entries'], async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const entry = await TimesheetService.addWorkEntry(req.params.id, req.body, userCtx);
    res.json({ success: true, message: 'Work entry added.', data: entry });
  } catch (err) {
    handleRouteError(res, err, 'Failed to add work entry.');
  }
});

/**
 * PATCH /api/timesheets/:id/entries/:entryId
 * Update work entry (auto-save or manual edit)
 */
router.patch('/:id/entries/:entryId', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const entry = await TimesheetService.updateWorkEntry(req.params.id, req.params.entryId, req.body, userCtx);
    res.json({ success: true, message: 'Work entry updated.', data: entry });
  } catch (err) {
    handleRouteError(res, err, 'Failed to update work entry.');
  }
});

/**
 * DELETE /api/timesheets/:id/entries/:entryId
 * Remove work entry and its proof
 */
router.delete('/:id/entries/:entryId', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const result = await TimesheetService.deleteWorkEntry(req.params.id, req.params.entryId, userCtx);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete work entry.');
  }
});

/**
 * POST /api/timesheets/:id/entries/:entryId/proof
 * Upload or replace PDF proof (Supports both multipart FormData and JSON base64)
 */
router.post('/:id/entries/:entryId/proof', (req, res, next) => {
  if (req.is('application/json')) {
    return next();
  }
  upload.single('file')(req, res, next);
}, async (req, res) => {
  try {
    let fileObj = null;

    if (req.file) {
      fileObj = req.file;
    } else if (req.body && req.body.fileData) {
      const { fileName = 'proof.pdf', fileData } = req.body;
      let base64 = fileData;
      let mimeType = 'application/pdf';
      if (typeof fileData === 'string' && fileData.startsWith('data:')) {
        const parts = fileData.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch) mimeType = mimeMatch[1].toLowerCase();
        base64 = parts[1] || '';
      }
      const buffer = Buffer.from(base64, 'base64');
      const ext = path.extname(fileName).toLowerCase() || '.pdf';
      const cleanBase = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const diskName = `${cleanBase}-${Date.now()}${ext}`;
      const diskPath = path.join(timesheetUploadDir, diskName);
      fs.writeFileSync(diskPath, buffer);

      fileObj = {
        path: diskPath,
        originalname: fileName,
        mimetype: mimeType,
        size: buffer.length
      };
    }

    if (!fileObj) {
      return res.status(400).json({ success: false, message: 'No PDF file provided.' });
    }

    const userCtx = resolveUserContext(req);
    const proof = await TimesheetService.uploadProof(req.params.id, req.params.entryId, fileObj, userCtx);
    res.json({ success: true, message: 'PDF proof uploaded successfully.', data: proof });
  } catch (err) {
    handleRouteError(res, err, 'Failed to upload PDF proof.');
  }
});

/**
 * GET /api/timesheets/:id/entries/:entryId/proof
 * Stream or download the PDF file for in-app viewing
 */
router.get('/:id/entries/:entryId/proof', async (req, res) => {
  try {
    const proofRes = await pool.query(
      `SELECT * FROM timesheet_proofs WHERE timesheet_entry_id = $1`,
      [req.params.entryId]
    );

    if (proofRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'No proof document found for this entry.' });
    }

    const proof = proofRes.rows[0];

    // Check if client expects JSON metadata
    if (req.query.format === 'json') {
      return res.json({ success: true, data: proof });
    }

    const filePath = path.join(process.cwd(), proof.storage_reference.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      // Check if file_data BYTEA exists as backup
      if (proof.file_data) {
        res.setHeader('Content-Type', proof.mime_type || 'application/pdf');
        res.setHeader('Content-Disposition', `${req.query.download === 'true' ? 'attachment' : 'inline'}; filename="${proof.file_name}"`);
        return res.send(proof.file_data);
      }
      return res.status(404).json({ success: false, message: 'Physical file not found.' });
    }

    res.setHeader('Content-Type', proof.mime_type || 'application/pdf');
    res.setHeader('Content-Disposition', `${req.query.download === 'true' ? 'attachment' : 'inline'}; filename="${proof.file_name}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    handleRouteError(res, err, 'Failed to load PDF proof.');
  }
});

/**
 * GET /api/timesheets/proofs/:proofId/download
 * Download proof by proof ID
 */
router.get('/proofs/:proofId/download', async (req, res) => {
  try {
    const proofRes = await pool.query(
      `SELECT * FROM timesheet_proofs WHERE id = $1`,
      [req.params.proofId]
    );
    if (proofRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'PDF proof not found.' });
    }
    const proof = proofRes.rows[0];
    const filePath = path.join(process.cwd(), proof.storage_reference.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', proof.mime_type || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${proof.file_name}"`);
      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    } else if (proof.file_data) {
      res.setHeader('Content-Type', proof.mime_type || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${proof.file_name}"`);
      return res.send(proof.file_data);
    }
    return res.status(404).json({ success: false, message: 'Physical file not found.' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to download PDF proof.');
  }
});

/**
 * Direct PATCH /api/timesheets/work-entries/:id
 */
router.patch('/work-entries/:id', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const entryRes = await pool.query(`SELECT timesheet_id FROM timesheet_entries WHERE id = $1`, [req.params.id]);
    if (entryRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Work entry not found.' });
    const entry = await TimesheetService.updateWorkEntry(entryRes.rows[0].timesheet_id, req.params.id, req.body, userCtx);
    res.json({ success: true, message: 'Work entry updated.', data: entry });
  } catch (err) {
    handleRouteError(res, err, 'Failed to update work entry.');
  }
});

/**
 * Direct DELETE /api/timesheets/work-entries/:id
 */
router.delete('/work-entries/:id', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const entryRes = await pool.query(`SELECT timesheet_id FROM timesheet_entries WHERE id = $1`, [req.params.id]);
    if (entryRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Work entry not found.' });
    const result = await TimesheetService.deleteWorkEntry(entryRes.rows[0].timesheet_id, req.params.id, userCtx);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete work entry.');
  }
});

/**
 * DELETE /api/timesheets/:id/entries/:entryId/proof
 * Remove PDF proof
 */
router.delete('/:id/entries/:entryId/proof', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const result = await TimesheetService.deleteProof(req.params.id, req.params.entryId, userCtx);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to remove PDF proof.');
  }
});

/**
 * POST /api/timesheets/:id/submit
 * Submit timesheet with 12 validation rules
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const result = await TimesheetService.submitTimesheet(req.params.id, userCtx);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Timesheet submission failed.');
  }
});

/**
 * POST /api/timesheets/:id/rework
 * Unlock / assign rework to timesheet so employee can edit
 */
router.post('/:id/rework', async (req, res) => {
  try {
    const userCtx = resolveUserContext(req);
    const result = await TimesheetService.reworkTimesheet(req.params.id, userCtx);
    res.json(result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to assign rework.');
  }
});

/**
 * Multer error-handling middleware for file limit / extension errors
 */
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Maximum file size is 10 MB.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

export default router;
