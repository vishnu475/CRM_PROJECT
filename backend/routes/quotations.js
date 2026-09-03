import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/quotations
router.get('/', async (req, res) => {
  try {
    const { status, customerId } = req.query;
    let query = `SELECT q.*, COUNT(qi.id) as items_count 
                 FROM quotations q 
                 LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
                 WHERE 1=1`;
    const params = [];

    if (status && status !== 'All') { params.push(status);     query += ` AND q.status = $${params.length}`; }
    if (customerId)                 { params.push(customerId); query += ` AND q.customer_id = $${params.length}`; }

    query += ` GROUP BY q.id ORDER BY q.created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/quotations — Create quotation in CRM database
router.post('/', async (req, res) => {
  const { id, quoteNumber, customerId, customerName, date, validUntil, amount, status, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const quoteId = id || `QT-${Date.now()}`;
    const quoteNo = quoteNumber || `QT-${new Date().getFullYear()}-${quoteId}`;

    const quoteRes = await client.query(
      `INSERT INTO quotations (id, quote_number, customer_id, customer_name, date, valid_until, amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [quoteId, quoteNo, customerId, customerName, date, validUntil, amount || 0, status || 'Draft']
    );

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          `INSERT INTO quotation_items (quotation_id, product_id, product_name, quantity, unit_price, tax_rate, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [quoteId, item.productId, item.productName, item.quantity, item.unitPrice, item.taxRate || 18, item.total]
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

// PATCH /api/quotations/:id — Update status (Approve, Send, Reject)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, amount, validUntil } = req.body;
  try {
    const result = await pool.query(
      `UPDATE quotations SET
         status = COALESCE($2, status),
         amount = COALESCE($3, amount),
         valid_until = COALESCE($4, valid_until),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, status, amount, validUntil]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
