import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

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

    const quoteId = id || `QT-${Date.now()}`;
    const quoteNo = quoteNumber || `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
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
        customerId,
        customerName,
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
        contactId || null,
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
           AND status IN ('Sent', 'Draft')`,
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
         valid_until = COALESCE($7, valid_until),
         sent_date = COALESCE($8, sent_date),
         accepted_date = COALESCE($9, accepted_date),
         date = COALESCE($10, date),
         revision_number = COALESCE($11, revision_number),
         revision_group_id = COALESCE($12, revision_group_id),
         terms = COALESCE($13, terms),
         notes = COALESCE($14, notes),
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
        notes
      ]
    );

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
