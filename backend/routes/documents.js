import express from 'express';
import fs from 'fs';
import { DocumentService } from '../services/documentService.js';

const router = express.Router();

// Helper to extract client IP address
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
}

// ─── DOCUMENT LIST & METRICS ──────────────────────────────────────────────────

// GET /api/documents - Paginated & filtered document list
router.get('/', async (req, res) => {
  try {
    const result = await DocumentService.getDocuments(req.user, req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/documents/stats - Scoped summary statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await DocumentService.getDocumentStats(req.user);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/documents - Upload & create document
router.post('/', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const newDoc = await DocumentService.createDocument(req.body, req.user, ip);
    res.status(201).json({ success: true, data: newDoc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/documents/bulk - Bulk actions
router.post('/bulk', async (req, res) => {
  try {
    const { action, ids } = req.body;
    const ip = getClientIp(req);
    const result = await DocumentService.bulkAction(action, ids, req.user, ip);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── SINGLE DOCUMENT OPERATIONS ───────────────────────────────────────────────

// GET /api/documents/:id - Full details
router.get('/:id', async (req, res) => {
  try {
    const doc = await DocumentService.getDocumentById(req.params.id, req.user);
    res.json({ success: true, data: doc });
  } catch (err) {
    const code = err.message.includes('Forbidden') ? 403 : err.message.includes('not found') ? 404 : 500;
    res.status(code).json({ success: false, message: err.message });
  }
});

// GET /api/documents/:id/preview - Secure file preview
router.get('/:id/preview', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const file = await DocumentService.getDocumentFile(req.params.id, req.user, 'preview', ip);
    res.setHeader('Content-Type', file.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    const stream = fs.createReadStream(file.filePath);
    stream.pipe(res);
  } catch (err) {
    const code = err.message.includes('Forbidden') ? 403 : 404;
    res.status(code).json({ success: false, message: err.message });
  }
});

// GET /api/documents/:id/download - Secure file download
router.get('/:id/download', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const file = await DocumentService.getDocumentFile(req.params.id, req.user, 'download', ip);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
    const stream = fs.createReadStream(file.filePath);
    stream.pipe(res);
  } catch (err) {
    const code = err.message.includes('Forbidden') ? 403 : 404;
    res.status(code).json({ success: false, message: err.message });
  }
});

// POST /api/documents/:id/submit - Submit for approval
router.post('/:id/submit', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const result = await DocumentService.submitForReview(req.params.id, req.user, ip);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/documents/:id/approve - Approve document
router.post('/:id/approve', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const comments = req.body.comments || 'Document verified and approved.';
    const result = await DocumentService.approveDocument(req.params.id, req.user, comments, ip);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/documents/:id/reject - Reject document
router.post('/:id/reject', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const { comments } = req.body;
    const result = await DocumentService.rejectDocument(req.params.id, req.user, comments, ip);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/documents/:id/versions - Upload new version
router.post('/:id/versions', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const result = await DocumentService.createNewVersion(req.params.id, req.body, req.user, ip);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/documents/:id/versions/:versionId/restore - Revert version
router.post('/:id/versions/:versionId/restore', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const result = await DocumentService.restoreVersion(req.params.id, req.params.versionId, req.user, ip);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/documents/:id/share - Share document
router.post('/:id/share', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const result = await DocumentService.shareDocument(req.params.id, req.body, req.user, ip);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/documents/:id/share/:shareId - Revoke share
router.delete('/:id/share/:shareId', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const result = await DocumentService.revokeShare(req.params.id, req.params.shareId, req.user, ip);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/documents/:id/archive - Archive document
router.post('/:id/archive', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const result = await DocumentService.archiveDocument(req.params.id, req.user, ip);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/documents/:id/restore - Restore from trash/archive
router.post('/:id/restore', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const result = await DocumentService.restoreDocument(req.params.id, req.user, ip);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/documents/:id - Delete (soft or permanent)
router.delete('/:id', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const isPermanent = req.query.permanent === 'true';
    const result = await DocumentService.deleteDocument(req.params.id, req.user, isPermanent, ip);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
