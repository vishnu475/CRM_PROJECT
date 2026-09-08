import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hrmsPool as pool } from '../db/pool.js';
import { broadcastNotificationEvent } from '../utils/websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Generate minimal valid PDF buffer fallback if needed
function createMinimalPdfBuffer(title, sub) {
  const content = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n4 0 obj<</Length 140>>stream\nBT\n/F1 18 Tf\n50 720 Td\n(${title.replace(/[()]/g, '')}) Tj\n/F1 11 Tf\n0 -28 Td\n(${sub.replace(/[()]/g, '')}) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n402\n%%EOF`;
  return Buffer.from(content, 'utf-8');
}

export class DocumentService {
  /**
   * Helper to evaluate user role category
   */
  static getRoleCategory(user) {
    if (!user) return 'Employee';
    const r = (user.role || '').toLowerCase();
    const des = (user.designation || '').toLowerCase();
    const dept = (user.department || '').toLowerCase();

    if (r === 'executive' || r === 'admin' || des.includes('director') || des.includes('vp') || des.includes('ceo')) {
      return 'ADMIN';
    }
    if (r === 'hradmin' || dept === 'hr' || dept.includes('human resources') || des.includes('hr')) {
      return 'HR';
    }
    if (r.includes('manager') || des.includes('manager') || des.includes('lead')) {
      return 'MANAGER';
    }
    return 'EMPLOYEE';
  }

  /**
   * Automatically check and update expired documents
   */
  static async checkAndUpdateExpiredDocuments() {
    try {
      await pool.query(`
        UPDATE documents 
        SET status = 'EXPIRED', updated_at = NOW()
        WHERE expiry_date IS NOT NULL 
          AND expiry_date < CURRENT_DATE 
          AND status = 'APPROVED'
          AND deleted_at IS NULL
      `);
    } catch (e) {
      console.warn('[DMS] Expiry check warning:', e.message);
    }
  }

  /**
   * Query documents with role-based access control and section filtering
   */
  static async getDocuments(user, query = {}) {
    await this.checkAndUpdateExpiredDocuments();
    const roleCat = this.getRoleCategory(user);
    const empCode = user?.empCode || user?.id || 'EMP-001';
    const dept = user?.department || '';

    const {
      section = 'all',
      search = '',
      status = '',
      category_id = '',
      document_type_id = '',
      department = '',
      owner_id = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      limit = 50,
      offset = 0
    } = query;

    let whereClauses = [];
    let params = [];
    let pIdx = 1;

    // 1. SECTION & DELETED_AT FILTER
    if (section === 'trash') {
      whereClauses.push('d.deleted_at IS NOT NULL');
    } else {
      whereClauses.push('d.deleted_at IS NULL');
      if (section === 'archive') {
        whereClauses.push("d.status = 'ARCHIVED'");
      } else {
        whereClauses.push("d.status != 'ARCHIVED'");
      }
    }

    // 2. ROLE-BASED ACCESS CONTROL FILTER
    if (roleCat === 'ADMIN') {
      // Admin has global visibility across all sections
    } else if (roleCat === 'HR') {
      // HR can view:
      // - Their own documents
      // - All employee documents (document_types scope in ('employee', 'both'))
      // - Company documents in HR or public/company visibility
      // - Documents explicitly shared with HR
      if (section !== 'trash') {
        whereClauses.push(`(
          d.owner_id = $${pIdx} 
          OR d.uploaded_by = $${pIdx}
          OR dt.scope IN ('employee', 'both')
          OR d.visibility IN ('company', 'public')
          OR (d.visibility = 'department' AND d.department = $${pIdx + 1})
          OR EXISTS (
            SELECT 1 FROM document_shares ds 
            WHERE ds.document_id = d.id 
              AND (ds.share_target_id = $${pIdx} OR ds.share_target_id = 'HR' OR ds.share_target_id = 'HRAdmin')
          )
        )`);
        params.push(empCode, dept);
        pIdx += 2;
      } else {
        // Only see their own trash
        whereClauses.push(`d.uploaded_by = $${pIdx}`);
        params.push(empCode);
        pIdx++;
      }
    } else if (roleCat === 'MANAGER') {
      // Manager can view:
      // - My documents
      // - Documents of reporting team members
      // - Department documents in their department
      // - Documents shared with them or Manager role
      // - Company wide documents
      if (section !== 'trash') {
        whereClauses.push(`(
          d.owner_id = $${pIdx} 
          OR d.uploaded_by = $${pIdx}
          OR d.department = $${pIdx + 1}
          OR d.visibility IN ('company', 'public')
          OR EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.emp_code = d.owner_id AND e.reporting_manager_id = $${pIdx}
          )
          OR EXISTS (
            SELECT 1 FROM document_shares ds 
            WHERE ds.document_id = d.id 
              AND (ds.share_target_id = $${pIdx} OR ds.share_target_id = 'Manager' OR ds.share_target_id = $${pIdx + 1})
          )
        )`);
        params.push(empCode, dept);
        pIdx += 2;
      } else {
        whereClauses.push(`d.uploaded_by = $${pIdx}`);
        params.push(empCode);
        pIdx++;
      }
    } else {
      // EMPLOYEE: STRICT ISOLATION
      // Can ONLY view:
      // - My Documents (owner_id = empCode OR uploaded_by = empCode)
      // - Documents shared with them
      // - Company documents with public visibility or company scope without confidential restriction
      if (section !== 'trash') {
        whereClauses.push(`(
          d.owner_id = $${pIdx} 
          OR d.uploaded_by = $${pIdx}
          OR EXISTS (
            SELECT 1 FROM document_shares ds 
            WHERE ds.document_id = d.id 
              AND (ds.share_target_id = $${pIdx} OR ds.share_target_id = $${pIdx + 1})
          )
          OR (d.visibility = 'public')
          OR (d.visibility = 'company' AND dt.scope = 'company' AND dc.code NOT IN ('FINANCE', 'LEGAL'))
        )`);
        params.push(empCode, dept);
        pIdx += 2;
      } else {
        whereClauses.push(`d.uploaded_by = $${pIdx}`);
        params.push(empCode);
        pIdx++;
      }
    }

    // 3. SECTION SPECIFIC SUB-FILTERS
    if (section === 'my') {
      whereClauses.push(`d.owner_id = $${pIdx}`);
      params.push(empCode);
      pIdx++;
    } else if (section === 'company') {
      whereClauses.push(`(dt.scope = 'company' OR d.visibility IN ('company', 'department', 'public'))`);
      whereClauses.push(`d.owner_id != $${pIdx}`);
      params.push(empCode);
      pIdx++;
    } else if (section === 'employee') {
      whereClauses.push(`dt.scope IN ('employee', 'both')`);
    } else if (section === 'shared') {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM document_shares ds 
        WHERE ds.document_id = d.id 
          AND (ds.share_target_id = $${pIdx} OR ds.share_target_id = $${pIdx + 1} OR ds.share_target_id = $${pIdx + 2})
      )`);
      params.push(empCode, dept, user?.role || 'Employee');
      pIdx += 3;
    } else if (section === 'pending_approvals') {
      whereClauses.push(`d.status = 'PENDING_REVIEW'`);
    } else if (section === 'expiring_soon') {
      whereClauses.push(`d.expiry_date IS NOT NULL AND (d.expiry_date <= CURRENT_DATE + INTERVAL '30 days')`);
    }

    // 4. COMMON SEARCH & ATTRIBUTE FILTERS
    if (search) {
      whereClauses.push(`(
        d.document_name ILIKE $${pIdx} 
        OR d.original_file_name ILIKE $${pIdx} 
        OR d.description ILIKE $${pIdx}
        OR dt.name ILIKE $${pIdx}
        OR dc.name ILIKE $${pIdx}
        OR emp.name ILIKE $${pIdx}
      )`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (status) {
      whereClauses.push(`d.status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (category_id) {
      whereClauses.push(`d.category_id = $${pIdx}`);
      params.push(category_id);
      pIdx++;
    }

    if (document_type_id) {
      whereClauses.push(`d.document_type_id = $${pIdx}`);
      params.push(document_type_id);
      pIdx++;
    }

    if (department) {
      whereClauses.push(`d.department = $${pIdx}`);
      params.push(department);
      pIdx++;
    }

    if (owner_id) {
      whereClauses.push(`d.owner_id = $${pIdx}`);
      params.push(owner_id);
      pIdx++;
    }

    // Valid Sort columns
    const allowedSort = {
      'created_at': 'd.created_at',
      'document_name': 'd.document_name',
      'updated_at': 'd.updated_at',
      'expiry_date': 'd.expiry_date',
      'file_size': 'd.file_size',
      'status': 'd.status'
    };
    const sortCol = allowedSort[sortBy] || 'd.created_at';
    const orderDir = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const querySql = `
      SELECT 
        d.id,
        d.document_name,
        d.original_file_name,
        d.file_type,
        d.mime_type,
        d.file_size,
        d.storage_path,
        d.document_type_id,
        d.category_id,
        d.department,
        d.owner_id,
        d.uploaded_by,
        d.description,
        d.status,
        d.visibility,
        d.expiry_date,
        d.current_version,
        d.tags,
        d.created_at,
        d.updated_at,
        d.deleted_at,
        dt.name AS document_type_name,
        dt.code AS document_type_code,
        dt.scope AS document_type_scope,
        dt.approval_required,
        dt.expiry_supported,
        dc.name AS category_name,
        dc.code AS category_code,
        emp.name AS owner_name,
        emp.department AS owner_department,
        uploader.name AS uploader_name,
        appr.reviewer_name,
        appr.status AS approval_status,
        appr.comments AS rejection_reason,
        appr.reviewed_at AS verification_date
      FROM documents d
      LEFT JOIN document_types dt ON dt.id = d.document_type_id
      LEFT JOIN document_categories dc ON dc.id = d.category_id
      LEFT JOIN employees emp ON emp.emp_code = d.owner_id
      LEFT JOIN employees uploader ON uploader.emp_code = d.uploaded_by
      LEFT JOIN LATERAL (
        SELECT reviewer_name, status, comments, reviewed_at 
        FROM document_approvals 
        WHERE document_id = d.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) appr ON TRUE
      ${whereSql}
      ORDER BY ${sortCol} ${orderDir}
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    params.push(Number(limit), Number(offset));

    const countSql = `
      SELECT COUNT(*) AS total
      FROM documents d
      LEFT JOIN document_types dt ON dt.id = d.document_type_id
      LEFT JOIN document_categories dc ON dc.id = d.category_id
      LEFT JOIN employees emp ON emp.emp_code = d.owner_id
      ${whereSql}
    `;

    const [rowsRes, countRes] = await Promise.all([
      pool.query(querySql, params),
      pool.query(countSql, params.slice(0, pIdx - 1))
    ]);

    return {
      documents: rowsRes.rows,
      total: parseInt(countRes.rows[0]?.total || 0, 10),
      limit: Number(limit),
      offset: Number(offset)
    };
  }

  /**
   * Get KPI statistics scoped to user permissions
   */
  static async getDocumentStats(user) {
    await this.checkAndUpdateExpiredDocuments();
    const roleCat = this.getRoleCategory(user);
    const empCode = user?.empCode || user?.id || 'EMP-001';

    // Base query for user's visible active documents
    let scopeWhere = 'd.deleted_at IS NULL AND d.status != \'ARCHIVED\'';
    let params = [];

    if (roleCat === 'ADMIN') {
      // All
    } else if (roleCat === 'HR') {
      scopeWhere += ` AND (
        d.owner_id = $1 
        OR d.uploaded_by = $1
        OR dt.scope IN ('employee', 'both')
        OR d.visibility IN ('company', 'public')
      )`;
      params.push(empCode);
    } else if (roleCat === 'MANAGER') {
      scopeWhere += ` AND (
        d.owner_id = $1 
        OR d.uploaded_by = $1 
        OR d.department = $2
        OR d.visibility IN ('company', 'public')
      )`;
      params.push(empCode, user?.department || '');
    } else {
      // Employee
      scopeWhere += ` AND (
        d.owner_id = $1 
        OR d.uploaded_by = $1
        OR (d.visibility = 'public')
        OR (d.visibility = 'company' AND dt.scope = 'company')
      )`;
      params.push(empCode);
    }

    const statQuery = `
      SELECT
        COUNT(*) AS total_documents,
        COUNT(CASE WHEN d.owner_id = '${empCode}' THEN 1 END) AS my_documents,
        COUNT(CASE WHEN d.status = 'PENDING_REVIEW' THEN 1 END) AS pending_review,
        COUNT(CASE WHEN d.expiry_date IS NOT NULL AND d.expiry_date >= CURRENT_DATE AND d.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) AS expiring_soon,
        COUNT(CASE WHEN d.status = 'EXPIRED' OR (d.expiry_date IS NOT NULL AND d.expiry_date < CURRENT_DATE) THEN 1 END) AS expired,
        COUNT(CASE WHEN d.status = 'REJECTED' AND d.owner_id = '${empCode}' THEN 1 END) AS rejected_my_documents,
        COALESCE(SUM(d.file_size), 0) AS total_storage_bytes
      FROM documents d
      LEFT JOIN document_types dt ON dt.id = d.document_type_id
      WHERE ${scopeWhere}
    `;

    const res = await pool.query(statQuery, params);
    const row = res.rows[0] || {};
    const bytes = parseInt(row.total_storage_bytes || 0, 10);
    const storageFormatted = bytes > 1073741824 
      ? `${(bytes / 1073741824).toFixed(1)} GB`
      : `${(bytes / 1048576).toFixed(1)} MB`;

    return {
      totalDocuments: parseInt(row.total_documents || 0, 10),
      myDocuments: parseInt(row.my_documents || 0, 10),
      pendingReview: parseInt(row.pending_review || 0, 10),
      expiringSoon: parseInt(row.expiring_soon || 0, 10),
      expired: parseInt(row.expired || 0, 10),
      rejectedMyDocuments: parseInt(row.rejected_my_documents || 0, 10),
      storageUsed: storageFormatted,
      storageBytes: bytes
    };
  }

  /**
   * Get single document details with versions, approvals, shares, and audit logs
   */
  static async getDocumentById(id, user) {
    const res = await pool.query(`
      SELECT 
        d.*,
        dt.name AS document_type_name,
        dt.code AS document_type_code,
        dt.scope AS document_type_scope,
        dt.approval_required,
        dt.expiry_supported,
        dt.allowed_file_types,
        dt.max_file_size_mb,
        dc.name AS category_name,
        dc.code AS category_code,
        emp.name AS owner_name,
        emp.email AS owner_email,
        emp.department AS owner_department,
        uploader.name AS uploader_name
      FROM documents d
      LEFT JOIN document_types dt ON dt.id = d.document_type_id
      LEFT JOIN document_categories dc ON dc.id = d.category_id
      LEFT JOIN employees emp ON emp.emp_code = d.owner_id
      LEFT JOIN employees uploader ON uploader.emp_code = d.uploaded_by
      WHERE d.id = $1
    `, [id]);

    if (res.rows.length === 0) {
      throw new Error('Document not found.');
    }

    const doc = res.rows[0];

    // Verify User Access
    this.assertUserCanAccess(user, doc, 'view');

    // Fetch Versions
    const versionsRes = await pool.query(`
      SELECT v.*, u.name AS uploader_name
      FROM document_versions v
      LEFT JOIN employees u ON u.emp_code = v.uploaded_by
      WHERE v.document_id = $1
      ORDER BY v.created_at DESC
    `, [id]);

    // Fetch Approvals
    const approvalsRes = await pool.query(`
      SELECT a.*, r.name AS reviewer_full_name, r.designation AS reviewer_designation
      FROM document_approvals a
      LEFT JOIN employees r ON r.emp_code = a.reviewer_id
      WHERE a.document_id = $1
      ORDER BY a.created_at DESC
    `, [id]);

    // Fetch Shares
    const sharesRes = await pool.query(`
      SELECT s.*, u.name AS sharer_name
      FROM document_shares s
      LEFT JOIN employees u ON u.emp_code = s.shared_by
      WHERE s.document_id = $1
      ORDER BY s.created_at DESC
    `, [id]);

    // Fetch Audit Logs
    const auditRes = await pool.query(`
      SELECT a.*
      FROM document_audit_logs a
      WHERE a.document_id = $1
      ORDER BY a.created_at DESC
      LIMIT 30
    `, [id]);

    return {
      ...doc,
      versions: versionsRes.rows,
      approvals: approvalsRes.rows,
      shares: sharesRes.rows,
      auditLogs: auditRes.rows
    };
  }

  /**
   * Save uploaded file to disk
   */
  static async saveFileToDisk(docId, fileName, fileData) {
    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const diskFileName = `${docId}_${Date.now()}_${cleanName}`;
    const filePath = path.join(uploadsDir, diskFileName);

    let mimeType = 'application/pdf';
    let buffer;

    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      const parts = fileData.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (mimeMatch) mimeType = mimeMatch[1];
      const base64Content = parts[1] || '';
      buffer = Buffer.from(base64Content, 'base64');
    } else if (Buffer.isBuffer(fileData)) {
      buffer = fileData;
    } else {
      // Fallback sample PDF if plain text or empty
      buffer = createMinimalPdfBuffer(cleanName, `Document ID: ${docId}`);
    }

    fs.writeFileSync(filePath, buffer);
    const ext = cleanName.split('.').pop()?.toLowerCase() || 'pdf';

    return {
      storagePath: `uploads/documents/${diskFileName}`,
      fileSize: buffer.length,
      mimeType,
      fileType: ext,
      cleanName
    };
  }

  /**
   * Upload & Create New Document
   */
  static async createDocument(payload, user, ipAddress = '127.0.0.1') {
    const roleCat = this.getRoleCategory(user);
    const userEmpCode = user?.empCode || user?.id || 'EMP-001';

    const {
      document_name,
      document_type_id,
      category_id,
      department,
      owner_id,
      description = '',
      tags = [],
      expiry_date = null,
      visibility = 'company',
      file_name,
      file_data,
      submit_immediately = false
    } = payload;

    if (!document_name || !document_type_id || !file_name) {
      throw new Error('Document name, document type, and file are required.');
    }

    // Resolve owner
    let resolvedOwner = owner_id;
    if (roleCat === 'EMPLOYEE') {
      // Rule: Employee owner is automatically the logged-in employee
      resolvedOwner = userEmpCode;
    } else if (!resolvedOwner) {
      resolvedOwner = userEmpCode;
    }

    // Fetch document type to check approval & expiry requirements
    const typeRes = await pool.query('SELECT * FROM document_types WHERE id = $1', [document_type_id]);
    if (typeRes.rows.length === 0) {
      throw new Error('Invalid document type selected.');
    }
    const docType = typeRes.rows[0];

    // Determine initial status
    let initialStatus = 'APPROVED';
    if (docType.approval_required) {
      initialStatus = submit_immediately ? 'PENDING_REVIEW' : 'DRAFT';
    }

    // Generate unique ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const docId = `DOC-${new Date().getFullYear()}-${randomSuffix}`;

    // Save file
    const fileInfo = await this.saveFileToDisk(docId, file_name, file_data);

    // Insert document record
    const insertDocSql = `
      INSERT INTO documents (
        id, document_name, original_file_name, file_type, mime_type, file_size, storage_path,
        document_type_id, category_id, department, owner_id, uploaded_by, description,
        status, visibility, expiry_date, current_version, tags, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, 'v1.0', $17, NOW(), NOW()
      ) RETURNING *
    `;

    const docRes = await pool.query(insertDocSql, [
      docId,
      document_name,
      fileInfo.cleanName,
      fileInfo.fileType,
      fileInfo.mimeType,
      fileInfo.fileSize,
      fileInfo.storagePath,
      document_type_id,
      category_id || docType.category_id,
      department || user?.department || 'General',
      resolvedOwner,
      userEmpCode,
      description,
      initialStatus,
      visibility,
      expiry_date || null,
      JSON.stringify(tags || [])
    ]);

    const newDoc = docRes.rows[0];

    // Create initial Version v1.0
    const versionId = `VER-${randomSuffix}-1`;
    await pool.query(`
      INSERT INTO document_versions (
        id, document_id, version_number, file_name, storage_path, file_size, mime_type, uploaded_by, change_description
      ) VALUES ($1, $2, 'v1.0', $3, $4, $5, $6, $7, $8)
    `, [
      versionId,
      docId,
      fileInfo.cleanName,
      fileInfo.storagePath,
      fileInfo.fileSize,
      fileInfo.mimeType,
      userEmpCode,
      'Initial document upload'
    ]);

    // Create initial Approval record if approval required
    if (docType.approval_required) {
      const approvalId = `APP-${randomSuffix}`;
      const appStatus = submit_immediately ? 'PENDING' : 'DRAFT';
      await pool.query(`
        INSERT INTO document_approvals (id, document_id, status, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [approvalId, docId, appStatus]);

      // If submitted immediately, notify HR/Admin
      if (submit_immediately) {
        await this.notifyAdminsOfSubmission(newDoc, user);
      }
    }

    // Record Audit Log
    await this.logAudit(
      docId,
      userEmpCode,
      user?.name || 'User',
      'UPLOAD',
      `Uploaded document ${document_name} (${fileInfo.cleanName})`,
      ipAddress,
      { file_size: fileInfo.fileSize, version: 'v1.0', initialStatus }
    );

    return newDoc;
  }

  /**
   * Submit document for verification
   */
  static async submitForReview(id, user, ipAddress = '127.0.0.1') {
    const doc = await this.assertUserCanAccessDoc(id, user, 'edit');
    if (doc.status !== 'DRAFT' && doc.status !== 'REJECTED') {
      throw new Error(`Only Draft or Rejected documents can be submitted for review. Current status: ${doc.status}`);
    }

    await pool.query(`
      UPDATE documents 
      SET status = 'PENDING_REVIEW', updated_at = NOW() 
      WHERE id = $1
    `, [id]);

    // Record/Update Approval Record
    const appRes = await pool.query('SELECT id FROM document_approvals WHERE document_id = $1 ORDER BY created_at DESC LIMIT 1', [id]);
    if (appRes.rows.length > 0) {
      await pool.query(`
        UPDATE document_approvals 
        SET status = 'PENDING', comments = NULL, reviewed_at = NULL 
        WHERE id = $1
      `, [appRes.rows[0].id]);
    } else {
      const appId = `APP-${Math.floor(1000 + Math.random() * 9000)}`;
      await pool.query(`
        INSERT INTO document_approvals (id, document_id, status) VALUES ($1, $2, 'PENDING')
      `, [appId, id]);
    }

    // Record Audit
    await this.logAudit(id, user.empCode || user.id, user.name || 'User', 'SUBMITTED', 'Submitted document for verification', ipAddress);

    // Notify HR / Admins
    await this.notifyAdminsOfSubmission(doc, user);

    return { success: true, message: 'Document successfully submitted for verification.' };
  }

  /**
   * Approve document
   */
  static async approveDocument(id, user, comments = 'Document verified and approved.', ipAddress = '127.0.0.1') {
    const roleCat = this.getRoleCategory(user);
    if (roleCat !== 'ADMIN' && roleCat !== 'HR') {
      throw new Error('Only HR or Administrator can approve documents.');
    }

    const docRes = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (docRes.rows.length === 0) throw new Error('Document not found.');
    const doc = docRes.rows[0];

    // Rule: Employee cannot approve their own document
    const userEmpCode = user.empCode || user.id;
    if (doc.owner_id === userEmpCode && roleCat !== 'ADMIN') {
      throw new Error('You cannot approve your own document.');
    }

    await pool.query(`
      UPDATE documents 
      SET status = 'APPROVED', updated_at = NOW() 
      WHERE id = $1
    `, [id]);

    await pool.query(`
      UPDATE document_approvals 
      SET status = 'APPROVED', reviewer_id = $1, reviewer_name = $2, comments = $3, reviewed_at = NOW()
      WHERE document_id = $4 AND status = 'PENDING'
    `, [userEmpCode, user.name || 'HR Reviewer', comments, id]);

    await this.logAudit(id, userEmpCode, user.name || 'Reviewer', 'APPROVED', `Approved document: ${comments}`, ipAddress);

    // Notify Employee Owner
    await this.notifyOwner(doc, 'approved', `Your document "${doc.document_name}" has been verified and approved.`);

    return { success: true, message: 'Document approved successfully.' };
  }

  /**
   * Reject document with required comments
   */
  static async rejectDocument(id, user, comments, ipAddress = '127.0.0.1') {
    if (!comments || !comments.trim()) {
      throw new Error('Rejection reason / comment is required.');
    }

    const roleCat = this.getRoleCategory(user);
    if (roleCat !== 'ADMIN' && roleCat !== 'HR') {
      throw new Error('Only HR or Administrator can reject documents.');
    }

    const docRes = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (docRes.rows.length === 0) throw new Error('Document not found.');
    const doc = docRes.rows[0];

    const userEmpCode = user.empCode || user.id;

    await pool.query(`
      UPDATE documents 
      SET status = 'REJECTED', updated_at = NOW() 
      WHERE id = $1
    `, [id]);

    await pool.query(`
      UPDATE document_approvals 
      SET status = 'REJECTED', reviewer_id = $1, reviewer_name = $2, comments = $3, reviewed_at = NOW()
      WHERE document_id = $4
    `, [userEmpCode, user.name || 'HR Reviewer', comments, id]);

    await this.logAudit(id, userEmpCode, user.name || 'Reviewer', 'REJECTED', `Rejected document: ${comments}`, ipAddress);

    // Notify Employee Owner
    await this.notifyOwner(doc, 'rejected', `Your document "${doc.document_name}" was rejected. Reason: ${comments}`);

    return { success: true, message: 'Document rejected.' };
  }

  /**
   * Upload and register a new version of an existing document
   */
  static async createNewVersion(id, payload, user, ipAddress = '127.0.0.1') {
    const doc = await this.assertUserCanAccessDoc(id, user, 'edit');
    const { file_name, file_data, change_description = 'New revision uploaded', version_increment = 'minor' } = payload;

    if (!file_name || !file_data) {
      throw new Error('File name and file content are required for a new version.');
    }

    // Parse current version e.g. 'v1.0' -> 'v1.1' or 'v2.0'
    const currVer = doc.current_version || 'v1.0';
    const match = currVer.match(/v?(\d+)\.(\d+)/);
    let major = 1, minor = 0;
    if (match) {
      major = parseInt(match[1], 10);
      minor = parseInt(match[2], 10);
    }
    const nextVer = version_increment === 'major' ? `v${major + 1}.0` : `v${major}.${minor + 1}`;

    const userEmpCode = user.empCode || user.id;
    const fileInfo = await this.saveFileToDisk(doc.id, file_name, file_data);
    const versionId = `VER-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

    await pool.query(`
      INSERT INTO document_versions (
        id, document_id, version_number, file_name, storage_path, file_size, mime_type, uploaded_by, change_description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      versionId,
      doc.id,
      nextVer,
      fileInfo.cleanName,
      fileInfo.storagePath,
      fileInfo.fileSize,
      fileInfo.mimeType,
      userEmpCode,
      change_description
    ]);

    // If was rejected, transition back to DRAFT or PENDING_REVIEW
    let nextStatus = doc.status;
    if (doc.status === 'REJECTED') {
      nextStatus = 'DRAFT';
    }

    await pool.query(`
      UPDATE documents 
      SET 
        current_version = $1,
        storage_path = $2,
        file_size = $3,
        original_file_name = $4,
        file_type = $5,
        mime_type = $6,
        status = $7,
        updated_at = NOW()
      WHERE id = $8
    `, [nextVer, fileInfo.storagePath, fileInfo.fileSize, fileInfo.cleanName, fileInfo.fileType, fileInfo.mimeType, nextStatus, doc.id]);

    await this.logAudit(
      doc.id,
      userEmpCode,
      user.name || 'User',
      'VERSION_CREATED',
      `Created version ${nextVer}: ${change_description}`,
      ipAddress,
      { version: nextVer, file_size: fileInfo.fileSize }
    );

    return { success: true, version: nextVer, storagePath: fileInfo.storagePath };
  }

  /**
   * Revert / Restore a previous version
   */
  static async restoreVersion(id, versionId, user, ipAddress = '127.0.0.1') {
    const doc = await this.assertUserCanAccessDoc(id, user, 'edit');
    const verRes = await pool.query('SELECT * FROM document_versions WHERE id = $1 AND document_id = $2', [versionId, id]);
    if (verRes.rows.length === 0) throw new Error('Version record not found.');
    const ver = verRes.rows[0];

    await pool.query(`
      UPDATE documents 
      SET 
        current_version = $1,
        storage_path = $2,
        file_size = $3,
        original_file_name = $4,
        mime_type = $5,
        updated_at = NOW()
      WHERE id = $6
    `, [ver.version_number, ver.storage_path, ver.file_size, ver.file_name, ver.mime_type, id]);

    await this.logAudit(
      id,
      user.empCode || user.id,
      user.name || 'User',
      'RESTORED',
      `Restored active document to version ${ver.version_number}`,
      ipAddress
    );

    return { success: true, message: `Restored to version ${ver.version_number}` };
  }

  /**
   * Share document with User, Role, or Department
   */
  static async shareDocument(id, sharePayload, user, ipAddress = '127.0.0.1') {
    const doc = await this.assertUserCanAccessDoc(id, user, 'share');
    const { target_type, target_id, can_view = true, can_download = true, can_edit = false, expires_at = null } = sharePayload;

    if (!target_type || !target_id) {
      throw new Error('Share target type (user/role/department) and target ID are required.');
    }

    const shareId = `SHR-${Math.floor(1000 + Math.random() * 9000)}`;
    const userEmpCode = user.empCode || user.id;

    await pool.query(`
      INSERT INTO document_shares (
        id, document_id, shared_by, share_target_type, share_target_id, can_view, can_download, can_edit, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [shareId, id, userEmpCode, target_type, target_id, can_view, can_download, can_edit, expires_at]);

    await this.logAudit(
      id,
      userEmpCode,
      user.name || 'User',
      'SHARED',
      `Shared document with ${target_type}: ${target_id} (view: ${can_view}, download: ${can_download}, edit: ${can_edit})`,
      ipAddress
    );

    // Send notification if shared with user
    if (target_type === 'user') {
      await this.notifyRecipient(target_id, `A document "${doc.document_name}" was shared with you by ${user.name || 'a colleague'}.`);
    }

    return { success: true, shareId };
  }

  /**
   * Revoke a document share
   */
  static async revokeShare(id, shareId, user, ipAddress = '127.0.0.1') {
    await this.assertUserCanAccessDoc(id, user, 'share');
    await pool.query('DELETE FROM document_shares WHERE id = $1 AND document_id = $2', [shareId, id]);
    await this.logAudit(id, user.empCode || user.id, user.name || 'User', 'UNSHARED', `Revoked share ID: ${shareId}`, ipAddress);
    return { success: true, message: 'Share revoked.' };
  }

  /**
   * Archive an approved document
   */
  static async archiveDocument(id, user, ipAddress = '127.0.0.1') {
    const doc = await this.assertUserCanAccessDoc(id, user, 'edit');
    const roleCat = this.getRoleCategory(user);
    if (roleCat === 'EMPLOYEE') {
      throw new Error('Employees cannot archive documents.');
    }

    await pool.query(`UPDATE documents SET status = 'ARCHIVED', updated_at = NOW() WHERE id = $1`, [id]);
    await this.logAudit(id, user.empCode || user.id, user.name || 'User', 'ARCHIVED', 'Archived document', ipAddress);
    return { success: true, message: 'Document moved to archive.' };
  }

  /**
   * Soft delete to Trash or Permanent delete (Admin only)
   */
  static async deleteDocument(id, user, isPermanent = false, ipAddress = '127.0.0.1') {
    const roleCat = this.getRoleCategory(user);
    const doc = await this.assertUserCanAccessDoc(id, user, 'delete');

    if (isPermanent) {
      if (roleCat !== 'ADMIN') {
        throw new Error('Only Administrators can permanently delete documents.');
      }
      // Delete from disk if exists
      const fullPath = path.join(__dirname, '..', doc.storage_path);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) {}
      }
      await pool.query('DELETE FROM documents WHERE id = $1', [id]);
      await this.logAudit(id, user.empCode || user.id, user.name || 'User', 'DELETED', `Permanently deleted document ${doc.document_name}`, ipAddress);
      return { success: true, message: 'Document permanently deleted.' };
    }

    // Soft delete to Trash
    await pool.query(`
      UPDATE documents 
      SET status = 'TRASHED', deleted_at = NOW(), updated_at = NOW() 
      WHERE id = $1
    `, [id]);

    await this.logAudit(id, user.empCode || user.id, user.name || 'User', 'DELETED', 'Moved document to Trash', ipAddress);
    return { success: true, message: 'Document moved to Trash.' };
  }

  /**
   * Restore document from Trash or Archive
   */
  static async restoreDocument(id, user, ipAddress = '127.0.0.1') {
    const roleCat = this.getRoleCategory(user);
    const docRes = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (docRes.rows.length === 0) throw new Error('Document not found.');
    const doc = docRes.rows[0];

    if (roleCat === 'EMPLOYEE' && doc.uploaded_by !== (user.empCode || user.id)) {
      throw new Error('You cannot restore this document.');
    }

    await pool.query(`
      UPDATE documents 
      SET deleted_at = NULL, status = 'APPROVED', updated_at = NOW() 
      WHERE id = $1
    `, [id]);

    await this.logAudit(id, user.empCode || user.id, user.name || 'User', 'RESTORED', 'Restored document from Trash/Archive', ipAddress);
    return { success: true, message: 'Document restored.' };
  }

  /**
   * Retrieve file binary/stream for download or preview
   */
  static async getDocumentFile(id, user, actionType = 'preview', ipAddress = '127.0.0.1') {
    const doc = await this.assertUserCanAccessDoc(id, user, actionType);
    let fullPath = path.join(__dirname, '..', doc.storage_path);

    // If file doesn't exist on disk, create on the fly so preview/download doesn't crash
    if (!fs.existsSync(fullPath)) {
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
      fs.writeFileSync(fullPath, createMinimalPdfBuffer(doc.document_name, `ERP Vault Document: ${doc.original_file_name}`));
    }

    if (actionType === 'download') {
      await this.logAudit(id, user?.empCode || user?.id || 'GUEST', user?.name || 'User', 'DOWNLOAD', `Downloaded file: ${doc.original_file_name}`, ipAddress);
    } else {
      await this.logAudit(id, user?.empCode || user?.id || 'GUEST', user?.name || 'User', 'VIEW', `Viewed document preview: ${doc.document_name}`, ipAddress);
    }

    return {
      filePath: fullPath,
      fileName: doc.original_file_name,
      mimeType: doc.mime_type || 'application/pdf'
    };
  }

  /**
   * Bulk actions (Download list, Archive, Trash)
   */
  static async bulkAction(action, ids, user, ipAddress = '127.0.0.1') {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('No documents selected.');
    }

    const results = [];
    for (const docId of ids) {
      try {
        if (action === 'archive') {
          await this.archiveDocument(docId, user, ipAddress);
          results.push({ id: docId, success: true });
        } else if (action === 'trash') {
          await this.deleteDocument(docId, user, false, ipAddress);
          results.push({ id: docId, success: true });
        } else if (action === 'restore') {
          await this.restoreDocument(docId, user, ipAddress);
          results.push({ id: docId, success: true });
        }
      } catch (err) {
        results.push({ id: docId, success: false, error: err.message });
      }
    }
    return { success: true, processed: results };
  }

  /**
   * Document Types CRUD
   */
  static async getDocumentTypes() {
    const res = await pool.query(`
      SELECT dt.*, dc.name AS category_name
      FROM document_types dt
      LEFT JOIN document_categories dc ON dc.id = dt.category_id
      ORDER BY dt.name ASC
    `);
    return res.rows;
  }

  static async saveDocumentType(data, user) {
    const roleCat = this.getRoleCategory(user);
    if (roleCat !== 'ADMIN') throw new Error('Only Administrators can configure document types.');

    const { id, name, code, description, category_id, scope, approval_required, expiry_supported, allowed_file_types, max_file_size_mb, is_active } = data;
    if (!name || !code) throw new Error('Name and Code are required.');

    if (id) {
      await pool.query(`
        UPDATE document_types 
        SET 
          name = $1, code = $2, description = $3, category_id = $4, scope = $5,
          approval_required = $6, expiry_supported = $7, allowed_file_types = $8,
          max_file_size_mb = $9, is_active = $10, updated_at = NOW()
        WHERE id = $11
      `, [name, code, description, category_id, scope, approval_required, expiry_supported, allowed_file_types, max_file_size_mb, is_active, id]);
      return { success: true, id };
    } else {
      const newId = `TYPE-${code.toUpperCase()}`;
      await pool.query(`
        INSERT INTO document_types (
          id, name, code, description, category_id, scope, approval_required, expiry_supported, allowed_file_types, max_file_size_mb, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [newId, name, code, description, category_id, scope, approval_required, expiry_supported, allowed_file_types, max_file_size_mb, is_active]);
      return { success: true, id: newId };
    }
  }

  /**
   * Document Categories CRUD
   */
  static async getCategories() {
    const res = await pool.query(`SELECT * FROM document_categories ORDER BY name ASC`);
    return res.rows;
  }

  static async saveCategory(data, user) {
    const roleCat = this.getRoleCategory(user);
    if (roleCat !== 'ADMIN') throw new Error('Only Administrators can configure document categories.');

    const { id, name, code, description, scope, is_active } = data;
    if (!name || !code) throw new Error('Name and Code are required.');

    if (id) {
      await pool.query(`
        UPDATE document_categories 
        SET name = $1, code = $2, description = $3, scope = $4, is_active = $5, updated_at = NOW()
        WHERE id = $6
      `, [name, code, description, scope, is_active, id]);
      return { success: true, id };
    } else {
      const newId = `CAT-${code.toUpperCase()}`;
      await pool.query(`
        INSERT INTO document_categories (id, name, code, description, scope, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [newId, name, code, description, scope, is_active]);
      return { success: true, id: newId };
    }
  }

  /**
   * Access Permission Checker
   */
  static async assertUserCanAccessDoc(docId, user, requiredPermission = 'view') {
    const res = await pool.query(`
      SELECT d.*, dt.scope AS document_type_scope
      FROM documents d
      LEFT JOIN document_types dt ON dt.id = d.document_type_id
      WHERE d.id = $1
    `, [docId]);

    if (res.rows.length === 0) {
      throw new Error('Document not found.');
    }
    const doc = res.rows[0];
    this.assertUserCanAccess(user, doc, requiredPermission);
    return doc;
  }

  static assertUserCanAccess(user, doc, requiredPermission = 'view') {
    const roleCat = this.getRoleCategory(user);
    const userEmpCode = user?.empCode || user?.id || 'EMP-001';

    // Admin has full access to everything
    if (roleCat === 'ADMIN') return true;

    // Owner has full view, download, edit & share
    if (doc.owner_id === userEmpCode || doc.uploaded_by === userEmpCode) {
      if (requiredPermission === 'delete' && doc.status === 'APPROVED' && roleCat === 'EMPLOYEE') {
        throw new Error('Employees cannot delete verified/approved company records.');
      }
      return true;
    }

    // HR can view, download & verify employee documents
    if (roleCat === 'HR') {
      if (doc.document_type_scope === 'employee' || doc.visibility !== 'private') {
        if (requiredPermission === 'delete') {
          throw new Error('Only Administrator can delete verified records.');
        }
        return true;
      }
    }

    // Public documents can be viewed/downloaded by any authenticated user
    if (doc.visibility === 'public') {
      if (requiredPermission === 'view' || requiredPermission === 'download') return true;
    }

    // Company wide documents (non-employee confidential)
    if (doc.visibility === 'company' && doc.document_type_scope !== 'employee') {
      if (requiredPermission === 'view' || requiredPermission === 'download') return true;
    }

    // Manager can view department documents if not marked private
    if (roleCat === 'MANAGER') {
      if (doc.department === user?.department && doc.visibility !== 'private' && doc.document_type_scope !== 'employee') {
        return true;
      }
    }

    // By default, unauthorized users (including managers & other employees) are blocked
    throw new Error('HTTP 403 Forbidden: You do not have permission to access this document.');
  }

  /**
   * Audit Logging Helper
   */
  static async logAudit(docId, userId, userName, action, description, ipAddress = '127.0.0.1', metadata = {}) {
    try {
      const logId = `LOG-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
      await pool.query(`
        INSERT INTO document_audit_logs (
          id, document_id, user_id, user_name, action, description, ip_address, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [logId, docId, userId, userName, action, description, ipAddress, JSON.stringify(metadata)]);
    } catch (e) {
      console.warn('[DMS] Audit log error:', e.message);
    }
  }

  /**
   * Notifications Helpers
   */
  static async notifyAdminsOfSubmission(doc, user) {
    try {
      const notifId = `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const empName = user.name || 'An Employee';
      const msg = `${empName} (${user.empCode || user.id}) submitted "${doc.document_name}" for document verification.`;

      await pool.query(`
        INSERT INTO admin_notifications (
          id, type, employee_id, employee_name, entity_id, message, priority, target_role, read, created_at
        ) VALUES ($1, 'DOCUMENT_SUBMITTED', $2, $3, $4, $5, 'High', 'HRManager', FALSE, NOW())
      `, [notifId, user.empCode || user.id, empName, doc.id, msg]);

      broadcastNotificationEvent({
        type: 'NOTIFICATION_RECEIVED',
        targetRole: 'HRAdmin',
        notification: { id: notifId, message: msg, type: 'DOCUMENT_SUBMITTED', created_at: new Date() }
      });
    } catch (e) {
      console.warn('[DMS] Admin notification failed:', e.message);
    }
  }

  static async notifyOwner(doc, action, message) {
    try {
      const notifId = `ESS-NOTIF-${Date.now()}`;
      await pool.query(`
        INSERT INTO ess_notifications (
          id, employee_id, title, message, link, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
      `, [notifId, doc.owner_id, `Document ${action.toUpperCase()}`, message, `/documents?id=${doc.id}`]);

      broadcastNotificationEvent({
        type: 'NOTIFICATION_RECEIVED',
        employeeId: doc.owner_id,
        notification: { id: notifId, title: `Document ${action}`, message, created_at: new Date() }
      });
    } catch (e) {
      console.warn('[DMS] Owner notification failed:', e.message);
    }
  }

  static async notifyRecipient(empId, message) {
    try {
      const notifId = `ESS-NOTIF-${Date.now()}`;
      await pool.query(`
        INSERT INTO ess_notifications (
          id, employee_id, title, message, link, is_read, created_at
        ) VALUES ($1, $2, 'Document Shared', $3, '/documents', FALSE, NOW())
      `, [notifId, empId, message]);
    } catch (e) {}
  }
}
