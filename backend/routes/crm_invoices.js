import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/crm/invoices
router.get('/', async (req, res) => {
  try {
    const { status, customerId } = req.query;
    let query = `SELECT * FROM crm_invoices WHERE 1=1`;
    const params = [];

    if (status && status !== 'All') { params.push(status);     query += ` AND status = $${params.length}`; }
    if (customerId)                 { params.push(customerId); query += ` AND customer_id = $${params.length}`; }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crm/invoices — Create invoice in CRM database
router.post('/', async (req, res) => {
  const { id, invoiceNumber, salesOrderId, customerId, customerName, date, dueDate, amount, status, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const invId = id || `INV-${Date.now()}`;
    const invNo = invoiceNumber || `INV-${new Date().getFullYear()}-${invId}`;

    const invRes = await client.query(
      `INSERT INTO crm_invoices (id, invoice_number, sales_order_id, customer_id, customer_name, date, due_date, amount, paid_amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9) RETURNING *`,
      [invId, invNo, salesOrderId, customerId, customerName, date, dueDate, amount || 0, status || 'Draft']
    );

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          `INSERT INTO crm_invoice_items (invoice_id, product_id, product_name, quantity, unit_price, tax_rate, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [invId, item.productId, item.productName, item.quantity, item.unitPrice, item.taxRate || 18, item.total]
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

// PATCH /api/crm/invoices/:id — Mark as Paid, update status
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, paidAmount } = req.body;
  try {
    const result = await pool.query(
      `UPDATE crm_invoices SET
         status = COALESCE($2, status),
         paid_amount = COALESCE($3, paid_amount),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, status, paidAmount]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
