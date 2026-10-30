import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Ensure revision_group_id column exists on quotations table
const ensureRevisionGroupColumn = async () => {
  try {
    await pool.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS revision_group_id VARCHAR(255)`);
  } catch (err) {
    console.warn('⚠️ [CRM] Failed to add revision_group_id column:', err.message);
  }
};
ensureRevisionGroupColumn();

// GET /api/quotations — Fetch all quotations with item count and sales order linkage
router.get('/', async (req, res) => {
  try {
    const { status, customerId, opportunityId, leadId, revisionGroupId } = req.query;
    let query = `
      SELECT 
        q.*, 
        COUNT(qi.id) as items_count,
        so.id as sales_order_id,
        so.so_number as sales_order_number
      FROM quotations q 
      LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
      LEFT JOIN sales_orders so ON q.id = so.quotation_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') { 
      params.push(status);     
      query += ` AND q.status = $${params.length}`; 
    }
    if (customerId) { 
      params.push(customerId); 
      query += ` AND q.customer_id = $${params.length}`; 
    }
    if (opportunityId) {
      params.push(opportunityId);
      query += ` AND q.opportunity_id = $${params.length}`;
    }
    if (leadId) {
      params.push(leadId);
      query += ` AND (q.lead_id = $${params.length} OR q.customer_id = $${params.length})`;
    }
    if (revisionGroupId) {
      params.push(revisionGroupId);
      query += ` AND q.revision_group_id = $${params.length}`;
    }

    query += ` GROUP BY q.id, so.id, so.so_number ORDER BY q.created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/quotations/:id — Fetch single quotation with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const quoteRes = await pool.query(
      `SELECT q.*, so.id as sales_order_id, so.so_number as sales_order_number 
       FROM quotations q
       LEFT JOIN sales_orders so ON q.id = so.quotation_id
       WHERE q.id = $1`,
      [id]
    );
    if (quoteRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const itemsRes = await pool.query(
      `SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...quoteRes.rows[0],
        items: itemsRes.rows,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/quotations — Create new quotation in CRM database
router.post('/', async (req, res) => {
  const { 
    id, 
    quoteNumber, 
    customerId, 
    customerName, 
    date, 
    validUntil, 
    amount, 
    subtotal, 
    taxAmount, 
    discountAmount, 
    status, 
    sentDate, 
    acceptedDate, 
    leadId, 
    opportunityId, 
    contactId, 
    revisionNumber, 
    revisionGroupId, 
    terms, 
    notes, 
    owner, 
    items 
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let resolvedCustomerId = customerId;
    let resolvedCustomerName = customerName;
    let resolvedContactId = contactId;
    let linkedLead = null;

    if (leadId) {
      const leadCheck = await client.query('SELECT * FROM leads WHERE id = $1', [leadId]);
      if (leadCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: `Lead "${leadId}" not found.` });
      }
      linkedLead = leadCheck.rows[0];

      // Step 2 & 7: Centralized lead qualification check
      const eligibleStages = ['Qualified', 'Proposal', 'Negotiation'];
      if (!eligibleStages.includes(linkedLead.stage)) {
        await client.query('ROLLBACK');
        if (linkedLead.stage === 'New' || linkedLead.stage === 'Contacted') {
          return res.status(400).json({
            success: false,
            message: `Lead must reach "Qualified" stage before a Sales Quotation can be created. Current stage is "${linkedLead.stage}".`
          });
        }
        if (linkedLead.stage === 'Lost') {
          return res.status(400).json({
            success: false,
            message: 'Cannot create quotation for a lead marked as "Lost".'
          });
        }
        if (linkedLead.stage === 'Won') {
          return res.status(400).json({
            success: false,
            message: 'Cannot create quotation for a lead already marked as "Won".'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Lead stage "${linkedLead.stage}" is not eligible for quotation creation.`
        });
      }

      // Auto-resolve customer record if missing or placeholder to satisfy foreign key constraint without duplicates
      if (!resolvedCustomerId || resolvedCustomerId === 'CUST-001') {
        if (linkedLead.converted_to_customer_id) {
          const cCheck = await client.query('SELECT * FROM customers WHERE id = $1', [linkedLead.converted_to_customer_id]);
          if (cCheck.rows.length > 0) {
            resolvedCustomerId = cCheck.rows[0].id;
            resolvedCustomerName = resolvedCustomerName || cCheck.rows[0].customer_name;
          }
        }
        if (!resolvedCustomerId || resolvedCustomerId === 'CUST-001') {
          const cLeadCheck = await client.query('SELECT * FROM customers WHERE converted_from_lead_id = $1', [leadId]);
          if (cLeadCheck.rows.length > 0) {
            resolvedCustomerId = cLeadCheck.rows[0].id;
            resolvedCustomerName = resolvedCustomerName || cLeadCheck.rows[0].customer_name;
          }
        }
        const compName = (linkedLead.company || linkedLead.name || '').trim();
        if ((!resolvedCustomerId || resolvedCustomerId === 'CUST-001') && compName) {
          const cNameCheck = await client.query('SELECT * FROM customers WHERE LOWER(customer_name) = LOWER($1)', [compName]);
          if (cNameCheck.rows.length > 0) {
            resolvedCustomerId = cNameCheck.rows[0].id;
            resolvedCustomerName = resolvedCustomerName || cNameCheck.rows[0].customer_name;
          }
        }
        if (!resolvedCustomerId || resolvedCustomerId === 'CUST-001') {
          const newCustId = `CUST-${Date.now()}`;
          resolvedCustomerName = resolvedCustomerName || compName || 'Prospective Client';
          await client.query(`
            INSERT INTO customers (
              id, customer_code, customer_name, customer_type, industry, owner_id, status,
              credit_limit, contact_name, contact_email, contact_phone, billing_city, billing_country,
              converted_from_lead_id, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            newCustId,
            newCustId,
            resolvedCustomerName,
            linkedLead.company ? 'Company' : 'Individual',
            linkedLead.industry || 'General',
            linkedLead.assigned_to || linkedLead.assigned_to_employee_id || owner || 'Sales Team',
            'Active',
            0,
            linkedLead.contact_person || linkedLead.decision_maker || linkedLead.name || '',
            linkedLead.email || '',
            linkedLead.phone || '',
            linkedLead.city || linkedLead.address || '',
            linkedLead.country || '',
            leadId
          ]);
          resolvedCustomerId = newCustId;
          await client.query('UPDATE leads SET converted_to_customer_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newCustId, leadId]);
        }
      }

      // Ensure lead is linked to the resolved customer
      if (resolvedCustomerId) {
        await client.query(
          'UPDATE leads SET converted_to_customer_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND converted_to_customer_id IS NULL',
          [resolvedCustomerId, leadId]
        );
      }

      // Auto-resolve contact record
      if (!resolvedContactId && resolvedCustomerId) {
        const contactCheck = await client.query(
          'SELECT id FROM contacts WHERE customer_id = $1 OR lead_id = $2 LIMIT 1',
          [resolvedCustomerId, leadId]
        );
        if (contactCheck.rows.length > 0) {
          resolvedContactId = contactCheck.rows[0].id;
        } else {
          const newContactId = `CON-${Date.now()}`;
          await client.query(`
            INSERT INTO contacts (id, name, email, phone, company, customer_id, lead_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            newContactId,
            linkedLead.contact_person || linkedLead.decision_maker || linkedLead.name,
            linkedLead.email || '',
            linkedLead.phone || '',
            linkedLead.company || resolvedCustomerName,
            resolvedCustomerId,
            leadId
          ]);
          resolvedContactId = newContactId;
          await client.query('UPDATE leads SET converted_to_contact_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newContactId, leadId]);
        }
      }
    }

    const quoteId = id || `QT-${Date.now()}`;
    let quoteNo = quoteNumber || `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const effectiveStatus = status || 'Draft';
    const computedSentDate = sentDate || (effectiveStatus === 'Sent' ? new Date().toISOString().split('T')[0] : null);
    const computedAcceptedDate = acceptedDate || (effectiveStatus === 'Accepted' ? new Date().toISOString().split('T')[0] : null);
    const groupNo = revisionGroupId || (leadId ? `GRP-${leadId}` : `GRP-${quoteId}`);

    // Automatically calculate revision number if not provided or to ensure no duplicate version numbers
    let calcRev = revisionNumber ? Number(revisionNumber) : 1;
    if (leadId || groupNo) {
      const revCheck = await client.query(
        `SELECT COALESCE(MAX(revision_number), 0) + 1 AS next_rev FROM quotations WHERE revision_group_id = $1 OR lead_id = $2`,
        [groupNo, leadId || null]
      );
      const maxNext = Number(revCheck.rows[0]?.next_rev || 1);
      if (!revisionNumber || calcRev < maxNext) {
        calcRev = maxNext;
      }
    }

    // Ensure quote_number uniqueness across revisions by formatting revision suffix if existing
    const existingNumCheck = await client.query('SELECT id FROM quotations WHERE quote_number = $1', [quoteNo]);
    if (existingNumCheck.rows.length > 0) {
      quoteNo = `${quoteNo.replace(/-R\d+$/, '')}-R${calcRev}`;
    }

    // Insert new quotation version row into PostgreSQL database
    const quoteRes = await client.query(
      `INSERT INTO quotations (
        id, quote_number, customer_id, customer_name, date, valid_until, 
        amount, subtotal, tax_amount, discount_amount, status, sent_date, 
        accepted_date, lead_id, opportunity_id, contact_id, revision_number, 
        revision_group_id, terms, notes, owner
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [
        quoteId,
        quoteNo,
        resolvedCustomerId || customerId,
        resolvedCustomerName || customerName,
        date || new Date().toISOString().split('T')[0],
        validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        parseFloat(amount) || 0,
        parseFloat(subtotal) || 0,
        parseFloat(taxAmount) || 0,
        parseFloat(discountAmount) || 0,
        effectiveStatus,
        computedSentDate,
        computedAcceptedDate,
        leadId || null,
        opportunityId || null,
        resolvedContactId || contactId || null,
        calcRev,
        groupNo,
        terms || 'Standard 30 days payment terms upon invoice delivery.',
        notes || '',
        owner || 'Sales Executive'
      ]
    );

    // If new quotation is Sent, automatically mark previous active quotations in same group as 'Revised'
    if (effectiveStatus === 'Sent' && (leadId || groupNo)) {
      await client.query(
        `UPDATE quotations 
         SET status = 'Revised', updated_at = CURRENT_TIMESTAMP 
         WHERE (lead_id = $1 OR revision_group_id = $2) 
           AND id != $3 
           AND status IN ('Sent', 'Draft', 'Revision Requested')`,
        [leadId || null, groupNo, quoteId]
      );
    }

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          `INSERT INTO quotation_items (quotation_id, product_id, product_name, quantity, unit_price, tax_rate, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            quoteId,
            item.productId || null,
            item.productName || 'Custom Service',
            item.quantity || 1,
            item.unitPrice || 0,
            item.taxRate !== undefined ? item.taxRate : 18,
            item.total || 0
          ]
        );
      }
    }

    // If initial status is Accepted and linked to lead, mark lead as Won
    if (effectiveStatus === 'Accepted' && leadId) {
      await client.query(
        `UPDATE leads SET
          stage = 'Won',
          final_agreed_amount = $2,
          won_date = COALESCE(won_date, CURRENT_TIMESTAMP::text),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [leadId, parseFloat(amount) || 0]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: quoteRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/quotations/:id — Update status, sent_date, items, and commercial fields
const updateQuotationHandler = async (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    amount, 
    subtotal,
    taxAmount,
    discountAmount,
    validUntil, 
    sentDate, 
    acceptedDate,
    date,
    revisionNumber,
    revisionGroupId,
    terms,
    notes,
    owner,
    opportunityId,
    contactId,
    customerId,
    customerName,
    items
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch existing
    const existingRes = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    const current = existingRes.rows[0];

    // Ensure generic quotation PATCH/PUT updates cannot bypass the dedicated email-send rules
    if (status === 'Sent' && current.status !== 'Sent' && !req.body.allowStatusOverride) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot mark quotation as Sent via generic update. Please use POST /api/quotations/:id/send to dispatch quotation to customer.',
      });
    }

    let computedSentDate = sentDate !== undefined ? sentDate : current.sent_date;
    if (status === 'Sent' && !computedSentDate) {
      computedSentDate = new Date().toISOString().split('T')[0];
    }

    let computedAcceptedDate = acceptedDate !== undefined ? acceptedDate : current.accepted_date;
    if (status === 'Accepted' && !computedAcceptedDate) {
      computedAcceptedDate = new Date().toISOString().split('T')[0];
    }

    const result = await client.query(
      `UPDATE quotations SET
         status = COALESCE($2, status),
         amount = COALESCE($3, amount),
         subtotal = COALESCE($4, subtotal),
         tax_amount = COALESCE($5, tax_amount),
         discount_amount = COALESCE($6, discount_amount),
         valid_until = COALESCE($7::date, valid_until),
         sent_date = COALESCE($8::text, sent_date),
         accepted_date = COALESCE($9::text, accepted_date),
         date = COALESCE($10::date, date),
         revision_number = COALESCE($11, revision_number),
         revision_group_id = COALESCE($12, revision_group_id),
         terms = COALESCE($13, terms),
         notes = COALESCE($14, notes),
         owner = COALESCE($15, owner),
         opportunity_id = CASE WHEN $16::boolean THEN $17 ELSE opportunity_id END,
         contact_id = CASE WHEN $18::boolean THEN $19 ELSE contact_id END,
         customer_id = COALESCE($20, customer_id),
         customer_name = COALESCE($21, customer_name),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [
        id, 
        status, 
        amount, 
        subtotal,
        taxAmount,
        discountAmount,
        validUntil, 
        computedSentDate, 
        computedAcceptedDate,
        date,
        revisionNumber,
        revisionGroupId,
        terms,
        notes,
        owner,
        opportunityId !== undefined,
        opportunityId || null,
        contactId !== undefined,
        contactId || null,
        customerId,
        customerName
      ]
    );

    // Sync linked CRM lead when quotation status changes to Accepted or Rejected
    const targetLeadId = current.lead_id || req.body.leadId;

    if (status === 'Accepted' && targetLeadId) {
      const leadRes = await client.query('SELECT * FROM leads WHERE id = $1', [targetLeadId]);
      if (leadRes.rows.length > 0) {
        const linkedLead = leadRes.rows[0];
        if (linkedLead.stage === 'Lost') {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Cannot accept quotation: linked CRM lead is marked as Lost.'
          });
        }
        // Update linked CRM Lead to Won within the same transaction
        const finalAmt = amount !== undefined ? parseFloat(amount) : parseFloat(current.amount) || 0;
        await client.query(
          `UPDATE leads SET
            stage = 'Won',
            final_agreed_amount = $2,
            won_date = COALESCE(won_date, CURRENT_TIMESTAMP::text),
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [targetLeadId, finalAmt]
        );
      }
    } else if (status === 'Rejected' && targetLeadId) {
      const leadRes = await client.query('SELECT * FROM leads WHERE id = $1', [targetLeadId]);
      if (leadRes.rows.length > 0) {
        const linkedLead = leadRes.rows[0];
        if (linkedLead.stage === 'Won') {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Cannot reject quotation: linked CRM lead is already marked as Won.'
          });
        }

        const isDefinitiveLoss = req.body.isDefinitiveLoss === true || req.body.closeLeadAsLost === true;
        const rawLostReason = req.body.lostReason;

        // Step 4 Rule: Rejection of a single quote does not close the lead as Lost unless explicitly indicated as definitive loss
        if (isDefinitiveLoss || (rawLostReason && String(rawLostReason).trim())) {
          const lostReason = (rawLostReason || linkedLead.lost_reason || '').trim();
          const lostReasonDetails = (req.body.lostReasonDetails || linkedLead.lost_reason_details || '').trim();
          const lostNotes = (req.body.lostNotes || linkedLead.lost_notes || '').trim();

          if (!lostReason) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              success: false,
              message: 'Please provide a valid Lost Reason before closing the deal as Lost.'
            });
          }
          if (lostReason.toLowerCase() === 'other' && !lostReasonDetails && !lostNotes) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              success: false,
              message: 'Please provide a custom explanation when selecting "Other" as the Lost Reason.'
            });
          }
          if (!lostNotes) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              success: false,
              message: 'Please provide Lost Notes/Comments explaining why this deal was lost.'
            });
          }

          // Update linked CRM Lead to Lost within the same transaction
          await client.query(
            `UPDATE leads SET
              stage = 'Lost',
              lost_reason = $2,
              lost_reason_details = $3,
              lost_notes = $4,
              lost_date = COALESCE(lost_date, CURRENT_DATE),
              updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [targetLeadId, lostReason, lostReasonDetails || null, lostNotes]
          );
        } else {
          // Non-definitive quotation rejection: lead remains open in its current stage (e.g. Qualified)
          // allowing the sales team to revise, negotiate, or re-quote.
        }
      }
    }

    // If replacement items provided
    if (items && Array.isArray(items)) {
      await client.query('DELETE FROM quotation_items WHERE quotation_id = $1', [id]);
      for (const item of items) {
        await client.query(
          `INSERT INTO quotation_items (quotation_id, product_id, product_name, quantity, unit_price, tax_rate, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            id,
            item.productId || null,
            item.productName || 'Custom Item',
            item.quantity || 1,
            item.unitPrice || 0,
            item.taxRate !== undefined ? item.taxRate : 18,
            item.total || 0
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// In-flight concurrency lock to prevent duplicate sends from rapid clicks
const activeQuotationSends = new Set();

// HTML escape helper to prevent untrusted content injection in email clients
const sanitizeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// POST /api/quotations/:id/send — Dedicated Customer Email Dispatch & State Transition
router.post('/:id/send', async (req, res) => {
  const { id } = req.params;
  const { recipientEmail: manualRecipient, forceResend } = req.body || {};

  // 1. Process-local concurrency guard
  if (activeQuotationSends.has(id)) {
    return res.status(409).json({
      success: false,
      message: 'Quotation dispatch is currently in progress. Please wait for the current request to complete.',
    });
  }

  activeQuotationSends.add(id);

  // 2. Cross-process / multi-instance PostgreSQL advisory lock
  let lockClient = null;
  let lockAcquired = false;

  try {
    lockClient = await pool.connect();
    const lockRes = await lockClient.query(
      'SELECT pg_try_advisory_lock(hashtext($1)::bigint) AS acquired',
      [id]
    );
    lockAcquired = !!lockRes.rows[0]?.acquired;
    if (!lockAcquired) {
      lockClient.release();
      lockClient = null;
      activeQuotationSends.delete(id);
      return res.status(409).json({
        success: false,
        message: 'Quotation dispatch is currently in progress across processes. Please wait for the current request to complete.',
      });
    }

    // 1. Fetch quotation with customer, contact, and lead details
    const quoteRes = await pool.query(
      `SELECT 
         q.*, 
         c.customer_name as resolved_customer_name, 
         c.contact_email as customer_email,
         con.name as contact_name, 
         con.email as contact_email,
         l.email as lead_email,
         l.name as lead_name,
         l.contact_person as lead_contact_person
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       LEFT JOIN contacts con ON q.contact_id = con.id
       LEFT JOIN leads l ON q.lead_id = l.id
       WHERE q.id = $1`,
      [id]
    );

    if (quoteRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const quote = quoteRes.rows[0];

    // If already sent and not forcing a resend, return existing without resending
    if (quote.status === 'Sent' && !forceResend) {
      return res.json({
        success: true,
        message: `Quotation ${quote.quote_number || quote.id} was already sent on ${quote.sent_date || 'a previous date'}.`,
        alreadySent: true,
        data: quote,
      });
    }

    // 2. Resolve and validate recipient email (prefer contact email, fallback to customer email, support valid manual override)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let resolvedRecipient = '';
    let recipientSource = '';

    if (manualRecipient && typeof manualRecipient === 'string' && manualRecipient.trim()) {
      resolvedRecipient = manualRecipient.trim();
      recipientSource = 'manual override';
    } else if (quote.contact_email && typeof quote.contact_email === 'string' && quote.contact_email.trim()) {
      resolvedRecipient = quote.contact_email.trim();
      recipientSource = 'contact email';
    } else if (quote.customer_email && typeof quote.customer_email === 'string' && quote.customer_email.trim()) {
      resolvedRecipient = quote.customer_email.trim();
      recipientSource = 'customer account email';
    } else if (quote.lead_email && typeof quote.lead_email === 'string' && quote.lead_email.trim()) {
      resolvedRecipient = quote.lead_email.trim();
      recipientSource = 'lead email';
    }

    if (!resolvedRecipient || !emailRegex.test(resolvedRecipient)) {
      return res.status(400).json({
        success: false,
        message: 'No valid recipient email address could be resolved for this quotation. Please select a contact with a valid email or specify a recipient address.',
      });
    }

    // 3. Fetch line items
    const itemsRes = await pool.query(
      `SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id ASC`,
      [id]
    );
    const lineItems = itemsRes.rows;

    if (!lineItems || lineItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send quotation: quotation must contain at least one line item.',
      });
    }

    // 4. Construct Customer-facing Commercial Content (strictly EXCLUDING internal notes)
    const quoteNo = sanitizeHtml(quote.quote_number || quote.id);
    const custName = sanitizeHtml(quote.customer_name || quote.resolved_customer_name || 'Valued Customer');
    const contactName = sanitizeHtml(quote.contact_name || quote.lead_contact_person || quote.lead_name || custName);
    const repName = sanitizeHtml(quote.owner || 'Sales Team');
    const termsClean = quote.terms ? sanitizeHtml(quote.terms) : 'Standard payment terms: 30 days from invoice date.';
    const quoteDate = quote.date ? new Date(quote.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date().toLocaleDateString('en-IN');
    const validUntilDate = quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'As specified';

    const fmtINR = (val) => `₹${(parseFloat(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const subtotalFmt = fmtINR(quote.subtotal);
    const discountFmt = fmtINR(quote.discount_amount);
    const taxFmt = fmtINR(quote.tax_amount);
    const grandTotalFmt = fmtINR(quote.amount);

    const subject = `Commercial Quotation: ${quoteNo} – ${custName}`;

    // Line items HTML table rows
    const itemRowsHtml = lineItems.map((it, idx) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${sanitizeHtml(it.product_name)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">${it.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">${fmtINR(it.unit_price)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">${it.tax_rate}%</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${fmtINR(it.total)}</td>
      </tr>
    `).join('');

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commercial Quotation ${quoteNo}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background: #0f172a; color: #ffffff; padding: 28px 32px; border-bottom: 3px solid #2563eb;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Commercial Quotation</h1>
      <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Quotation Ref: <span style="color: #60a5fa; font-weight: 600;">${quoteNo}</span></p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px;">
      <p style="font-size: 14px; margin-top: 0; margin-bottom: 20px;">Dear <strong>${contactName}</strong>,</p>
      <p style="font-size: 13px; color: #475569; margin-top: 0; margin-bottom: 24px;">
        Thank you for your business interest. We are pleased to present our official commercial quotation for <strong>${custName}</strong> detailed below.
      </p>

      <!-- Metadata Cards -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; width: 50%;">
            <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; display: block;">Customer Account</span>
            <strong style="color: #0f172a; font-size: 13px;">${custName}</strong>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; width: 50%;">
            <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; display: block;">Attention / Contact</span>
            <strong style="color: #0f172a; font-size: 13px;">${contactName}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; width: 50%;">
            <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; display: block;">Quotation Date</span>
            <span style="color: #0f172a; font-weight: 500;">${quoteDate}</span>
          </td>
          <td style="padding: 12px 16px; width: 50%;">
            <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; display: block;">Valid Until</span>
            <span style="color: #0f172a; font-weight: 500;">${validUntilDate}</span>
          </td>
        </tr>
      </table>

      <!-- Line Items Table -->
      <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; margin: 24px 0 12px;">Scope of Products & Services</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: center; width: 30px;">#</th>
            <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: left;">Description</th>
            <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: center; width: 50px;">Qty</th>
            <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: right; width: 100px;">Unit Price</th>
            <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: center; width: 60px;">GST</th>
            <th style="padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: right; width: 110px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <!-- Financial Totals Summary -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-top: 20px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Subtotal (Base Value):</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a;">${subtotalFmt}</td>
          </tr>
          ${parseFloat(quote.discount_amount) > 0 ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Special Discount (Applied before GST):</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #e11d48;">- ${discountFmt}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Estimated Taxes (GST):</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a;">${taxFmt}</td>
          </tr>
          <tr style="border-top: 2px solid #cbd5e1;">
            <td style="padding: 12px 0 4px; font-weight: 700; font-size: 15px; color: #0f172a;">Grand Total (Payable):</td>
            <td style="padding: 12px 0 4px; text-align: right; font-weight: 700; font-size: 16px; color: #2563eb;">${grandTotalFmt}</td>
          </tr>
        </table>
      </div>

      <!-- Commercial Terms -->
      <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; margin: 24px 0 8px;">Commercial Terms & Conditions</h3>
      <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 4px; font-size: 12px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
        ${termsClean}
      </div>

      <p style="font-size: 13px; color: #475569; margin-bottom: 0;">
        If you wish to accept this proposal or require modifications, please contact our assigned sales representative directly.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #64748b;">
      <p style="margin: 0;">Sales Representative: <strong style="color: #0f172a;">${repName}</strong></p>
      <p style="margin: 4px 0 0; font-size: 11px;">This is an electronically generated official quotation.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Plain text alternative
    const itemRowsText = lineItems.map((it, idx) => 
      `${idx + 1}. ${it.product_name} | Qty: ${it.quantity} | Unit Price: ${fmtINR(it.unit_price)} | GST: ${it.tax_rate}% | Total: ${fmtINR(it.total)}`
    ).join('\n');

    const textBody = `
COMMERCIAL QUOTATION: ${quote.quote_number || quote.id}
Customer: ${quote.customer_name || quote.resolved_customer_name}
Attention: ${quote.contact_name || quote.customer_name}
Quotation Date: ${quoteDate}
Valid Until: ${validUntilDate}
Sales Representative: ${quote.owner || 'Sales Team'}

PRODUCTS & SERVICES:
${itemRowsText}

FINANCIAL TOTALS:
Subtotal: ${subtotalFmt}
${parseFloat(quote.discount_amount) > 0 ? `Special Discount: - ${discountFmt}\n` : ''}Estimated Taxes (GST): ${taxFmt}
Grand Total (Payable): ${grandTotalFmt}

COMMERCIAL TERMS & CONDITIONS:
${quote.terms || 'Standard 30 days payment terms.'}

Please contact us if you have any questions or require revisions.
    `.trim();

    // 5. Send email via Nodemailer emailService
    const emailResult = await sendEmail({
      to: resolvedRecipient,
      subject,
      text: textBody,
      html: htmlBody,
    });

    if (!emailResult.success) {
      // SMTP delivery rejected before acceptance: restore retryable state
      return res.status(500).json({
        success: false,
        message: `Failed to deliver quotation email to ${resolvedRecipient}: ${emailResult.message || 'SMTP delivery rejected'}`,
        canRetry: true,
      });
    }

    // 6. Email accepted by SMTP provider -> update quotation state atomically
    const client = await pool.connect();
    let updatedQuote;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      await client.query('BEGIN');

      // Mark quotation Sent with sent_date
      const updateRes = await client.query(
        `UPDATE quotations SET
           status = 'Sent',
           sent_date = $2,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 RETURNING *`,
        [id, todayStr]
      );

      updatedQuote = updateRes.rows[0];

      // Automatically mark previous revisions as 'Revised'
      const groupNo = updatedQuote.revision_group_id;
      const leadId = updatedQuote.lead_id;
      if (leadId || groupNo) {
        await client.query(
          `UPDATE quotations 
           SET status = 'Revised', updated_at = CURRENT_TIMESTAMP 
           WHERE (lead_id = $1 OR revision_group_id = $2) 
             AND id != $3 
             AND status IN ('Sent', 'Draft', 'Revision Requested')`,
          [leadId || null, groupNo || null, id]
        );
      }

      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.error('[Quotation Send] DB state update failed after email dispatch:', dbErr.message);
      return res.status(502).json({
        success: false,
        message: `Email was accepted by the server (Message ID: ${emailResult.messageId}), but updating database status encountered an error: ${dbErr.message}`,
        emailDelivered: true,
        canRetry: false,
        messageId: emailResult.messageId,
        recipient: resolvedRecipient,
      });
    } finally {
      client.release();
    }

    // 7. Log activity in activities table non-fatally after quotation status is committed
    try {
      const actId = `ACT-${Date.now()}`;
      await pool.query(
        `INSERT INTO activities (id, title, type, related_to, customer_id, opportunity_id, assigned_to, due_date, status, outcome)
         VALUES ($1, $2, 'Email', $3, $4, $5, $6, $7, 'Completed', $8)`,
        [
          actId,
          `Quotation ${quoteNo} sent to ${resolvedRecipient}`,
          quote.customer_name || 'Customer',
          quote.customer_id,
          quote.opportunity_id || null,
          quote.owner || 'Sales Executive',
          todayStr,
          `Email delivered successfully (Message ID: ${emailResult.messageId || 'MOCK'}) via ${recipientSource}`
        ]
      );
    } catch (actErr) {
      console.warn('⚠️ [Quotation Send] Activity logging failed (non-fatal):', actErr.message);
    }

    return res.json({
      success: true,
      message: `Quotation ${quoteNo} delivered to ${resolvedRecipient} successfully.`,
      data: updatedQuote,
      recipient: resolvedRecipient,
      messageId: emailResult.messageId,
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    if (lockAcquired && lockClient) {
      try {
        await lockClient.query('SELECT pg_advisory_unlock(hashtext($1)::bigint)', [id]);
      } catch (unlockErr) {
        console.warn('⚠️ [CRM] pg_advisory_unlock error:', unlockErr.message);
      }
      lockClient.release();
    }
    activeQuotationSends.delete(id);
  }
});

router.patch('/:id', updateQuotationHandler);
router.put('/:id', updateQuotationHandler);

// DELETE /api/quotations/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if linked to active Sales Order
    const linkedSo = await pool.query('SELECT id, so_number FROM sales_orders WHERE quotation_id = $1', [id]);
    if (linkedSo.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete quotation. It is linked to Sales Order ${linkedSo.rows[0].so_number}.` 
      });
    }

    const result = await pool.query('DELETE FROM quotations WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
