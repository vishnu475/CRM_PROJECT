import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { TestReportsService } from '../services/testReportsService.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePdfPath = path.join(__dirname, '..', 'uploads', 'test-reports', 'templates', 'software-test-report.pdf');

function getUserContext(req) {
  const tokenEmpId = req.user?.empCode || req.user?.id;
  const headerEmpId = req.headers['x-employee-id'];
  const headerRole = req.headers['x-user-role'];
  const headerName = req.headers['x-user-name'];

  const empId = headerEmpId || tokenEmpId || 'EMP-004';
  const role = headerRole || req.user?.role || (headerEmpId ? 'Employee' : 'Executive');
  const name = headerName || req.user?.name || (empId === 'EMP-004' ? 'Rahul Verma' : empId === 'EMP-001' ? 'Sarah Jenkins' : 'User');

  return {
    id: empId,
    empCode: empId,
    name: name,
    role: role
  };
}

// 0. GET /api/test-reports/template — Download/View original reference template PDF
router.get('/template', (req, res) => {
  if (fs.existsSync(templatePdfPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="software-test-report-template.pdf"');
    return res.sendFile(templatePdfPath);
  }
  return res.status(404).json({ success: false, message: 'Template PDF not found.' });
});

// 1. GET /api/test-reports/admin — Admin view all test reports
router.get('/admin', async (req, res) => {
  try {
    const user = getUserContext(req);
    const reports = await TestReportsService.getReportsForAdmin(user);
    res.json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 2. GET /api/test-reports/manager/:managerId — Manager view reports under hierarchy
router.get('/manager/:managerId', async (req, res) => {
  try {
    const user = getUserContext(req);
    const reports = await TestReportsService.getReportsForManager(req.params.managerId, user);
    res.json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 3. GET /api/test-reports/employee/:employeeId — Employee/Tester view own reports
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const user = getUserContext(req);
    const reports = await TestReportsService.getReportsForEmployee(req.params.employeeId, user);
    res.json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 4. GET /api/test-reports/:id — Single test report details
router.get('/:id', async (req, res) => {
  try {
    const user = getUserContext(req);
    const report = await TestReportsService.getReportById(req.params.id, user);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Test report not found.' });
    }
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 5. POST /api/test-reports — Create or initialize a test report
router.post('/', async (req, res) => {
  try {
    const user = getUserContext(req);
    const result = await TestReportsService.saveDraft(req.body.id, req.body, user);
    res.status(201).json({ success: true, message: 'Test report created successfully.', data: result });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// 6. PATCH /api/test-reports/:id/draft — Save Draft
router.patch('/:id/draft', async (req, res) => {
  try {
    const user = getUserContext(req);
    const result = await TestReportsService.saveDraft(req.params.id, req.body, user);
    res.json({ success: true, message: 'Draft saved successfully.', data: result });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// 7. POST /api/test-reports/:id/submit — Submit Test Report and generate final PDF
router.post('/:id/submit', async (req, res) => {
  try {
    const user = getUserContext(req);
    const result = await TestReportsService.submitReport(req.params.id, req.body, user);
    res.json({ success: true, message: 'Test report submitted successfully and final PDF generated.', data: result });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// 8. GET /api/test-reports/:id/document — Stream / View final PDF in browser
router.get('/:id/document', async (req, res) => {
  try {
    const user = getUserContext(req);
    const filePath = await TestReportsService.getPdfFilePath(req.params.id, user);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Generated PDF document not found.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Software_Test_Report_${req.params.id}.pdf"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 9. GET /api/test-reports/:id/download — Download final PDF
router.get('/:id/download', async (req, res) => {
  try {
    const user = getUserContext(req);
    const filePath = await TestReportsService.getPdfFilePath(req.params.id, user);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Generated PDF document not found.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Software_Test_Report_${req.params.id}.pdf"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 10. POST /api/test-reports/:id/reopen — Reopen a submitted report
router.post('/:id/reopen', async (req, res) => {
  try {
    const user = getUserContext(req);
    const result = await TestReportsService.reopenReport(req.params.id, req.body?.reason, user);
    res.json({ success: true, message: 'Test report reopened successfully for corrections.', data: result });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

export default router;
