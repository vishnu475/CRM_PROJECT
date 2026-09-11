import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { crmPool as pool, hrmsPool } from '../db/pool.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const leadsUploadsDir = path.join(__dirname, '..', 'uploads', 'leads');
if (!fs.existsSync(leadsUploadsDir)) {
  fs.mkdirSync(leadsUploadsDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set(['svg', 'png', 'jpg', 'jpeg', 'pdf']);
const ALLOWED_MIME_TYPES = new Set([
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'application/pdf'
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// POST /api/leads/upload-attachment — Upload and validate project requirement attachment
router.post('/upload-attachment', async (req, res) => {
  try {
    const { fileName, fileData, fileSize, fileType } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ success: false, message: 'File name and file content are required.' });
    }

    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = cleanName.split('.').pop()?.toLowerCase() || '';

    // Extension validation
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Please upload SVG, PNG, JPG, JPEG, or PDF.'
      });
    }

    // Decode base64 data
    let mimeType = fileType || (ext === 'pdf' ? 'application/pdf' : `image/${ext === 'svg' ? 'svg+xml' : ext}`);
    let buffer;

    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      const parts = fileData.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (mimeMatch) mimeType = mimeMatch[1].toLowerCase();
      const base64Data = parts[1] || '';
      buffer = Buffer.from(base64Data, 'base64');
    } else if (typeof fileData === 'string') {
      buffer = Buffer.from(fileData, 'base64');
    } else if (Buffer.isBuffer(fileData)) {
      buffer = fileData;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid file data format.' });
    }

    // Size validation
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: 'File size must be 10 MB or less.'
      });
    }

    // MIME type validation
    if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType) && !ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Please upload SVG, PNG, JPG, JPEG, or PDF.'
      });
    }

    // Save to uploads/leads with unique safe filename
    const diskFileName = `lead_att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;
    const filePath = path.join(leadsUploadsDir, diskFileName);
    fs.writeFileSync(filePath, buffer);

    const attachment = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: fileName,
      originalName: fileName,
      url: `/uploads/leads/${diskFileName}`,
      type: ext.toUpperCase(),
      mimeType,
      size: buffer.length,
      uploadedAt: new Date().toISOString()
    };

    res.status(201).json({ success: true, data: attachment });
  } catch (err) {
    console.error('Lead attachment upload failed:', err);
    res.status(500).json({ success: false, message: 'Upload failed. Please try again.' });
  }
});

// DELETE /api/leads/upload-attachment/:filename — Delete uncommitted uploaded attachment file
router.delete('/upload-attachment/:filename', async (req, res) => {
  try {
    const filename = path.basename(req.params.filename); // Prevents directory traversal
    const filePath = path.join(leadsUploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: 'Attachment deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/leads — Fetch all leads from CRM database
router.get('/', async (req, res) => {
  try {
    const { stage, source, assignedTo } = req.query;
    let query = `SELECT * FROM leads WHERE 1=1`;
    const params = [];

    if (stage && stage !== 'All') {
      params.push(stage);
      query += ` AND stage = $${params.length}`;
    }
    if (source && source !== 'All') {
      params.push(source);
      query += ` AND source = $${params.length}`;
    }
    if (assignedTo) {
      params.push(assignedTo);
      query += ` AND (assigned_to = $${params.length} OR assigned_to_employee_id = $${params.length})`;
    }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/leads/:id — Fetch single lead
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const LEAD_NAME_REGEX = /^[a-zA-Z\s\-'.]+$/;
const COMPANY_REGEX = /^[a-zA-Z0-9\s&.\-',()/#]+$/;
const CAMPAIGN_REGEX = /^[a-zA-Z0-9\s&_\-',()]+$/;
const CONTACT_PERSON_REGEX = /^[a-zA-Z\s\-'.]+$/;
const DESIGNATION_REGEX = /^[a-zA-Z0-9\s\-'.&/,()]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const POSTAL_CODE_REGEX = /^(?:[1-9][0-9]{5}|[a-zA-Z0-9\s-]{3,10})$/;
const CITY_STATE_REGEX = /^[a-zA-Z\s\-'.]+$/;
const COUNTRY_REGEX = /^[a-zA-Z\s\-]+$/;

const ALLOWED_INDUSTRIES = new Set(['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Other']);
const ALLOWED_SOURCES = new Set(['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Google Ads', 'Email Campaign', 'Trade Show', 'Manual/Other']);
const ALLOWED_ROLES = new Set(['Decision Maker', 'Technical Evaluator', 'Procurement', 'Influencer', 'End User', 'Other']);

function isValidUrl(urlString) {
  if (!urlString) return true;
  const trimmed = urlString.trim();
  if (trimmed.length > 250) return false;
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return false;
  try {
    const candidate = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(candidate);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch (e) {
    return false;
  }
}

function normalizeUrl(urlString) {
  if (!urlString) return null;
  const trimmed = urlString.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function sanitizeTags(tagsInput) {
  if (!tagsInput) return [];
  let tagList = [];
  if (Array.isArray(tagsInput)) {
    tagList = tagsInput;
  } else if (typeof tagsInput === 'string') {
    tagList = tagsInput.split(',');
  }
  const cleanTags = [];
  const seen = new Set();
  for (const t of tagList) {
    if (typeof t !== 'string') continue;
    const cleaned = t.replace(/<[^>]*>?/gm, '').trim();
    if (cleaned.length > 0 && cleaned.length <= 50) {
      const lower = cleaned.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        cleanTags.push(cleaned);
      }
    }
  }
  return cleanTags;
}

// POST /api/leads — Create new lead in CRM database
router.post('/', async (req, res) => {
  const { 
    id, name, company, email, phone, value, stage, score, source, assignedTo, assignedToEmployeeId,
    requirement, notes, expectedCloseDate, decisionMaker, budget,
    contactPerson, designation, contactRole, alternatePhone, website, industry, campaign,
    address, city, state, country, postalCode, tags,
    attachments
  } = req.body;

  try {
    // 1. Stage restriction: New lead must start as 'New'
    if (stage && stage !== 'New') {
      return res.status(400).json({
        success: false,
        message: 'New leads must always be created in the "New" stage.'
      });
    }

    // 2. Lead Name validation
    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Lead name is required.' });
    }
    if (trimmedName.length > 100) {
      return res.status(400).json({ success: false, message: 'Lead name cannot exceed 100 characters.' });
    }
    if (!LEAD_NAME_REGEX.test(trimmedName)) {
      return res.status(400).json({
        success: false,
        message: 'Lead name can only contain letters, spaces, hyphens, periods, and apostrophes (no numbers).'
      });
    }

    // 3. Company validation
    const trimmedCompany = (company || '').trim();
    if (trimmedCompany) {
      if (trimmedCompany.length > 150) {
        return res.status(400).json({ success: false, message: 'Company name cannot exceed 150 characters.' });
      }
      if (/[\x00-\x1F\x7F]/.test(trimmedCompany) || !COMPANY_REGEX.test(trimmedCompany)) {
        return res.status(400).json({ success: false, message: 'Company name contains invalid characters.' });
      }
    }

    // 4. Industry validation
    const trimmedIndustry = (industry || '').trim();
    if (trimmedIndustry && !ALLOWED_INDUSTRIES.has(trimmedIndustry)) {
      return res.status(400).json({ success: false, message: 'Invalid industry option selected.' });
    }

    // 5. Lead Source validation
    const trimmedSource = (source || '').trim();
    if (!trimmedSource) {
      return res.status(400).json({ success: false, message: 'Lead source is required.' });
    }
    if (!ALLOWED_SOURCES.has(trimmedSource)) {
      return res.status(400).json({ success: false, message: 'Invalid lead source selected.' });
    }

    // 6. Campaign validation
    const trimmedCampaign = (campaign || '').trim();
    if (trimmedCampaign) {
      if (trimmedCampaign.length > 150) {
        return res.status(400).json({ success: false, message: 'Campaign name cannot exceed 150 characters.' });
      }
      if (!CAMPAIGN_REGEX.test(trimmedCampaign)) {
        return res.status(400).json({ success: false, message: 'Campaign name contains invalid characters.' });
      }
    }

    // 7. Contact Person validation
    const trimmedContactPerson = (contactPerson || '').trim();
    if (!trimmedContactPerson) {
      return res.status(400).json({ success: false, message: 'Contact person is required.' });
    }
    if (trimmedContactPerson.length > 100) {
      return res.status(400).json({ success: false, message: 'Contact person cannot exceed 100 characters.' });
    }
    if (!CONTACT_PERSON_REGEX.test(trimmedContactPerson)) {
      return res.status(400).json({
        success: false,
        message: 'Contact person can only contain letters, spaces, hyphens, periods, and apostrophes (no numbers).'
      });
    }

    // 8. Designation validation
    const trimmedDesignation = (designation || '').trim();
    if (!trimmedDesignation) {
      return res.status(400).json({ success: false, message: 'Designation is required.' });
    }
    if (trimmedDesignation.length > 100) {
      return res.status(400).json({ success: false, message: 'Designation cannot exceed 100 characters.' });
    }
    if (/^\d+$/.test(trimmedDesignation)) {
      return res.status(400).json({ success: false, message: 'Designation cannot be numeric-only.' });
    }
    if (!DESIGNATION_REGEX.test(trimmedDesignation)) {
      return res.status(400).json({ success: false, message: 'Designation contains invalid characters.' });
    }

    // 9. Contact Role validation
    const trimmedRole = (contactRole || '').trim();
    if (!trimmedRole) {
      return res.status(400).json({ success: false, message: 'Contact role is required.' });
    }
    if (!ALLOWED_ROLES.has(trimmedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid contact role selected.' });
    }

    // 10. Email validation
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    if (trimmedEmail.length > 254 || /\s/.test(trimmedEmail) || !EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // 11. Phone validation (India 10-digit mobile rule: 6/7/8/9 + 9 digits)
    const trimmedPhone = (phone || '').toString().trim();
    if (trimmedPhone) {
      if (!PHONE_REGEX.test(trimmedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Phone must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
        });
      }
    }

    // 12. Alternate Phone validation
    const trimmedAltPhone = (alternatePhone || '').toString().trim();
    if (trimmedAltPhone) {
      if (!PHONE_REGEX.test(trimmedAltPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Alternate phone must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
        });
      }
      if (trimmedPhone && trimmedAltPhone === trimmedPhone) {
        return res.status(400).json({
          success: false,
          message: 'Alternate phone must be different from primary phone number.'
        });
      }
    }

    // 13. Website validation
    const trimmedWebsite = (website || '').trim();
    if (trimmedWebsite) {
      if (!isValidUrl(trimmedWebsite)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid website URL.'
        });
      }
    }

    // 14. Lead Score validation (0-100 integer)
    const rawScore = score !== undefined && score !== null && score !== '' ? Number(score) : 50;
    if (!Number.isInteger(rawScore) || rawScore < 0 || rawScore > 100) {
      return res.status(400).json({
        success: false,
        message: 'Lead score must be an integer between 0 and 100.'
      });
    }

    // 15. Expected Deal Value validation
    const dealValueRaw = value !== undefined && value !== null && value !== '' ? value : budget;
    let dealValue = 0;
    if (dealValueRaw !== undefined && dealValueRaw !== null && dealValueRaw !== '') {
      dealValue = Number(dealValueRaw);
      if (isNaN(dealValue) || dealValue < 0) {
        return res.status(400).json({
          success: false,
          message: 'Expected deal value must be a valid positive numeric amount.'
        });
      }
    }

    // 16. Expected Close Date validation
    const trimmedCloseDate = (expectedCloseDate || '').trim();
    if (trimmedCloseDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedCloseDate)) {
        return res.status(400).json({ success: false, message: 'Invalid expected close date format (YYYY-MM-DD).' });
      }
      const closeDateObj = new Date(trimmedCloseDate);
      if (isNaN(closeDateObj.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid expected close date.' });
      }
      const todayStr = new Date().toISOString().split('T')[0];
      if (trimmedCloseDate < todayStr) {
        return res.status(400).json({
          success: false,
          message: 'Expected close date must be today or a future date.'
        });
      }
    }

    // 17. HRMS Confirmed Employee Validation
    let finalAssignedTo = assignedTo || null;
    let finalAssignedToEmployeeId = assignedToEmployeeId || null;

    if (finalAssignedToEmployeeId || (finalAssignedTo && finalAssignedTo.trim() !== '' && finalAssignedTo.toLowerCase() !== 'unassigned')) {
      const empLookupId = finalAssignedToEmployeeId || finalAssignedTo;
      const empLookupName = (finalAssignedTo || '').trim();
      const empRes = await hrmsPool.query(
        `SELECT id, emp_code, name, status FROM employees WHERE id = $1 OR emp_code = $1 OR (LOWER(name) = LOWER($2) AND $2 <> '')`,
        [empLookupId, empLookupName]
      );

      if (empRes.rows.length === 0 || (empRes.rows[0].status || '').toLowerCase() !== 'confirmed') {
        return res.status(400).json({ 
          success: false, 
          message: 'Selected employee is not eligible for new lead assignments. Only Confirmed HRMS employees can be assigned.' 
        });
      }

      finalAssignedTo = empRes.rows[0].name;
      finalAssignedToEmployeeId = empRes.rows[0].emp_code || empRes.rows[0].id;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please select an eligible Confirmed HRMS employee.'
      });
    }

    // 18. Address validation
    const trimmedAddress = (address || '').trim();
    if (trimmedAddress) {
      if (trimmedAddress.length > 250) {
        return res.status(400).json({ success: false, message: 'Address cannot exceed 250 characters.' });
      }
      if (/[\x00-\x1F\x7F]/.test(trimmedAddress)) {
        return res.status(400).json({ success: false, message: 'Address contains invalid control characters.' });
      }
    }

    // 19. City, State, Country validation
    const trimmedCity = (city || '').trim();
    if (trimmedCity) {
      if (trimmedCity.length > 100) return res.status(400).json({ success: false, message: 'City cannot exceed 100 characters.' });
      if (/^\d+$/.test(trimmedCity) || !CITY_STATE_REGEX.test(trimmedCity)) {
        return res.status(400).json({ success: false, message: 'City must contain valid text characters (no numbers).' });
      }
    }

    const trimmedState = (state || '').trim();
    if (trimmedState) {
      if (trimmedState.length > 100) return res.status(400).json({ success: false, message: 'State cannot exceed 100 characters.' });
      if (/^\d+$/.test(trimmedState) || !CITY_STATE_REGEX.test(trimmedState)) {
        return res.status(400).json({ success: false, message: 'State must contain valid text characters (no numbers).' });
      }
    }

    const trimmedCountry = (country || '').trim();
    if (trimmedCountry) {
      if (trimmedCountry.length > 100) return res.status(400).json({ success: false, message: 'Country cannot exceed 100 characters.' });
      if (/^\d+$/.test(trimmedCountry) || !COUNTRY_REGEX.test(trimmedCountry)) {
        return res.status(400).json({ success: false, message: 'Country must contain valid text characters (no numbers).' });
      }
    }

    // 20. Postal Code validation
    const trimmedPostal = (postalCode || '').trim();
    if (trimmedPostal) {
      if (trimmedPostal.length > 10 || !POSTAL_CODE_REGEX.test(trimmedPostal) || !/[a-zA-Z0-9]/.test(trimmedPostal)) {
        return res.status(400).json({
          success: false,
          message: 'Postal code must be a valid postal code (e.g., 6 digits for India or 3-10 alphanumeric characters).'
        });
      }
    }

    // 21. Project Requirements & Notes
    const trimmedRequirement = (requirement || '').trim();
    if (trimmedRequirement) {
      if (trimmedRequirement.length > 5000) {
        return res.status(400).json({ success: false, message: 'Project requirement cannot exceed 5000 characters.' });
      }
      if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(trimmedRequirement)) {
        return res.status(400).json({ success: false, message: 'Malicious scripts are not allowed in requirements.' });
      }
    }

    const trimmedNotes = (notes || '').trim();
    if (trimmedNotes) {
      if (trimmedNotes.length > 3000) {
        return res.status(400).json({ success: false, message: 'Notes cannot exceed 3000 characters.' });
      }
    }

    // 22. Tags sanitization
    const cleanTags = sanitizeTags(tags);

    // 23. Attachments validation
    let validAttachments = [];
    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        const ext = (att.name || '').split('.').pop()?.toLowerCase() || '';
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          return res.status(400).json({
            success: false,
            message: `Attachment "${att.name}" has an unsupported file format. Allowed: SVG, PNG, JPG, JPEG, PDF.`
          });
        }
        if (att.size && att.size > MAX_FILE_SIZE_BYTES) {
          return res.status(400).json({
            success: false,
            message: `Attachment "${att.name}" exceeds 10 MB limit.`
          });
        }
        validAttachments.push(att);
      }
    }

    const leadId = id || `LD-${Date.now()}`;
    const normalizedWebsite = normalizeUrl(trimmedWebsite);
    const serializedAttachments = JSON.stringify(validAttachments);

    const result = await pool.query(
      `INSERT INTO leads (
        id, name, company, email, phone, value, stage, score, source, assigned_to, assigned_to_employee_id,
        requirement, notes, expected_close_date, decision_maker, budget,
        contact_person, designation, contact_role, alternate_phone, website, industry, campaign,
        address, city, state, country, postal_code, tags,
        attachments
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30) 
      RETURNING *`,
      [
        leadId,
        trimmedName,
        trimmedCompany || null,
        trimmedEmail,
        trimmedPhone || null,
        dealValue,
        'New', // Always locked to 'New'
        rawScore,
        trimmedSource,
        finalAssignedTo,
        finalAssignedToEmployeeId,
        trimmedRequirement || null,
        trimmedNotes || null,
        trimmedCloseDate || null,
        trimmedContactPerson,
        dealValue,
        trimmedContactPerson,
        trimmedDesignation,
        trimmedRole,
        trimmedAltPhone || null,
        normalizedWebsite,
        trimmedIndustry || null,
        trimmedCampaign || null,
        trimmedAddress || null,
        trimmedCity || null,
        trimmedState || null,
        trimmedCountry || null,
        trimmedPostal || null,
        cleanTags.length > 0 ? cleanTags : null,
        serializedAttachments
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT & PATCH /api/leads/:id — Update lead stage or details
const updateHandler = async (req, res) => {
  const { id } = req.params;
  const fields = { ...req.body };
  try {
    // If assignedTo or assignedToEmployeeId is being updated
    if ('assignedTo' in fields || 'assignedToEmployeeId' in fields) {
      const targetEmpId = fields.assignedToEmployeeId || fields.assignedTo;
      const targetEmpName = (fields.assignedTo || '').trim();

      if (targetEmpId && targetEmpId.trim() !== '' && targetEmpId.toLowerCase() !== 'unassigned') {
        const empRes = await hrmsPool.query(
          `SELECT id, emp_code, name, status FROM employees WHERE id = $1 OR emp_code = $1 OR (LOWER(name) = LOWER($2) AND $2 <> '')`,
          [targetEmpId, targetEmpName]
        );

        if (empRes.rows.length === 0 || (empRes.rows[0].status || '').toLowerCase() !== 'confirmed') {
          return res.status(400).json({ 
            success: false, 
            message: 'Selected employee is not eligible for new lead assignments. Only Confirmed HRMS employees can be assigned.' 
          });
        }

        fields.assignedTo = empRes.rows[0].name;
        fields.assignedToEmployeeId = empRes.rows[0].emp_code || empRes.rows[0].id;
      } else {
        fields.assignedTo = null;
        fields.assignedToEmployeeId = null;
      }
    }

    if ('attachments' in fields) {
      if (typeof fields.attachments !== 'string') {
        fields.attachments = JSON.stringify(fields.attachments || []);
      }
    }

    const setClauses = Object.keys(fields)
      .map((key, i) => `"${key.replace(/([A-Z])/g, '_$1').toLowerCase()}" = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(fields)];
    const result = await pool.query(
      `UPDATE leads SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
router.put('/:id', updateHandler);
router.patch('/:id', updateHandler);

// DELETE /api/leads/:id — Delete lead
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
