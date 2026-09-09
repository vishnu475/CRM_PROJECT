import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/crm/invoices — Fetch all invoices with items count and sales order/quotation reference
router.get('/', async (req, res) => {
  try {
    const { status, customerId, salesOrderId } = req.query;
    let query = `
      SELECT 
        inv.*, 
        COUNT(invi.id) as items_count,
        so.so_number as sales_order_number,
        so.quotation_id,
        q.quote_number
      FROM crm_invoices inv
      LEFT JOIN crm_invoice_items invi ON inv.id = invi.invoice_id
      LEFT JOIN sales_orders so ON inv.sales_order_id = so.id
      LEFT JOIN quotations q ON COALESCE(inv.quotation_id, so.quotation_id) = q.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') { 
      params.push(status);     
      query += ` AND inv.status = $${params.length}`; 
    }
    if (customerId) { 
      params.push(customerId); 
      query += ` AND inv.customer_id = $${params.length}`; 
    }
    if (salesOrderId) {
      params.push(salesOrderId);
      query += ` AND inv.sales_order_id = $${params.length}`;
    }

    query += ` GROUP BY inv.id, so.so_number, so.quotation_id, q.quote_number ORDER BY inv.created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/crm/invoices/:id — Fetch single invoice with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invRes = await pool.query(
      `SELECT 
        inv.*, 
        so.so_number as sales_order_number,
        so.quotation_id,
        q.quote_number
       FROM crm_invoices inv
       LEFT JOIN sales_orders so ON inv.sales_order_id = so.id
       LEFT JOIN quotations q ON COALESCE(inv.quotation_id, so.quotation_id) = q.id
       WHERE inv.id = $1`,
      [id]
    );
    if (invRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const itemsRes = await pool.query(
      `SELECT * FROM crm_invoice_items WHERE invoice_id = $1 ORDER BY id ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...invRes.rows[0],
        items: itemsRes.rows,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crm/invoices — Create tax invoice with validation and duplicate prevention
router.post('/', async (req, res) => {
  const { 
    id, 
    invoiceNumber, 
    salesOrderId, 
    quotationId,
    opportunityId,
    customerId, 
    customerName, 
    date, 
    dueDate, 
    amount, 
    subtotal,
    taxAmount,
    discountAmount,
    status, 
    paymentTerms,
    notes,
    items 
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let resolvedQuotationId = quotationId || null;
    let resolvedOpportunityId = opportunityId || null;

    // 1. If linked to sales order, perform validation & duplicate prevention
    if (salesOrderId) {
      const soRes = await client.query('SELECT * FROM sales_orders WHERE id = $1', [salesOrderId]);
      if (soRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: 'Sales Order not found.' 
        });
      }

      const so = soRes.rows[0];

      // Validate order status is confirmed or fulfilled (not Draft/Cancelled)
      if (so.status === 'Draft' || so.status === 'Cancelled' || so.fulfillment_status === 'Cancelled') {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `Cannot generate invoice for Sales Order in "${so.status || so.fulfillment_status}" status. Order must be Confirmed.` 
        });
      }

      // Duplicate invoice prevention
      const existingInvRes = await client.query('SELECT id, invoice_number FROM crm_invoices WHERE sales_order_id = $1', [salesOrderId]);
      if (existingInvRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `An Invoice (${existingInvRes.rows[0].invoice_number}) already exists for this Sales Order. Duplicate creation is blocked.`,
          existingInvoiceId: existingInvRes.rows[0].id,
          existingInvoiceNumber: existingInvRes.rows[0].invoice_number
        });
      }

      if (!resolvedQuotationId && so.quotation_id) {
        resolvedQuotationId = so.quotation_id;
      }
      if (!resolvedOpportunityId && so.opportunity_id) {
        resolvedOpportunityId = so.opportunity_id;
      }
    }

    const invId = id || `INV-${Date.now()}`;
    const invNo = invoiceNumber || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const effectiveStatus = status || 'Issued';

    const invRes = await client.query(
      `INSERT INTO crm_invoices (
        id, invoice_number, sales_order_id, quotation_id, opportunity_id, customer_id, 
        customer_name, date, due_date, amount, subtotal, tax_amount, discount_amount, 
        paid_amount, status, payment_terms, notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,$14,$15,$16) RETURNING *`,
      [
        invId, 
        invNo, 
        salesOrderId || null, 
        resolvedQuotationId,
        resolvedOpportunityId,
        customerId, 
        customerName, 
        date || new Date().toISOString().split('T')[0], 
        dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], 
        parseFloat(amount) || 0, 
        parseFloat(subtotal) || 0,
        parseFloat(taxAmount) || 0,
        parseFloat(discountAmount) || 0,
        effectiveStatus,
        paymentTerms || 'Payment due within 15 days',
        notes || ''
      ]
    );

    // If explicit items passed, use them; otherwise if salesOrderId passed, copy from sales order
    let lineItemsToInsert = items;
    if ((!lineItemsToInsert || lineItemsToInsert.length === 0) && salesOrderId) {
      const soItemsRes = await client.query('SELECT * FROM sales_order_items WHERE sales_order_id = $1', [salesOrderId]);
      lineItemsToInsert = soItemsRes.rows.map(soi => ({
        productId: soi.product_id,
        productName: soi.product_name,
        quantity: soi.quantity,
        unitPrice: soi.unit_price,
        taxRate: soi.tax_rate,
        total: soi.total
      }));
    }

    if (lineItemsToInsert && Array.isArray(lineItemsToInsert)) {
      for (const item of lineItemsToInsert) {
        await client.query(
          `INSERT INTO crm_invoice_items (invoice_id, product_id, product_name, quantity, unit_price, tax_rate, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            invId, 
            item.productId || null, 
            item.productName || 'Custom Billed Item', 
            item.quantity || 1, 
            item.unitPrice || 0, 
            item.taxRate !== undefined ? item.taxRate : 18, 
            item.total || 0
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: invRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/crm/invoices/:id — Update status, paid_amount, due_date
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, paidAmount, dueDate, notes, paymentTerms } = req.body;
  try {
    const existingRes = await pool.query('SELECT * FROM crm_invoices WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const result = await pool.query(
      `UPDATE crm_invoices SET
         status = COALESCE($2, status),
         paid_amount = COALESCE($3, paid_amount),
         due_date = COALESCE($4, due_date),
         notes = COALESCE($5, notes),
         payment_terms = COALESCE($6, payment_terms),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, status, paidAmount, dueDate, notes, paymentTerms]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/crm/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existingRes = await pool.query('SELECT * FROM crm_invoices WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    if (existingRes.rows[0].status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Cannot delete a Paid invoice.' });
    }

    await pool.query('DELETE FROM crm_invoices WHERE id = $1', [id]);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
