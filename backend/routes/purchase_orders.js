import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/purchase-orders
router.get('/', async (req, res) => {
  try {
    const { status, vendorId } = req.query;
    let query = `SELECT po.*, v.name as vendor_name_resolved, v.contact_person, v.email as vendor_email
                 FROM purchase_orders po
                 LEFT JOIN vendors v ON po.vendor_id = v.id
                 WHERE 1=1`;
    const params = [];

    if (status && status !== 'All') { params.push(status);   query += ` AND po.status = $${params.length}`; }
    if (vendorId)                   { params.push(vendorId); query += ` AND po.vendor_id = $${params.length}`; }

    query += ` ORDER BY po.created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/purchase-orders — Create purchase order in CRM database
router.post('/', async (req, res) => {
  const { id, poNumber, vendorId, vendorName, date, amount, status } = req.body;
  try {
    const poId = id || `PO-${Date.now()}`;
    const poNum = poNumber || `PO-${new Date().getFullYear()}-${poId}`;
    const result = await pool.query(
      `INSERT INTO purchase_orders (id, po_number, vendor_id, vendor_name, date, amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [poId, poNum, vendorId, vendorName, date || new Date().toISOString().split('T')[0], amount || 0, status || 'Draft']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/purchase-orders/:id — Update status (Approve, Receive, Complete)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, amount } = req.body;
  try {
    const result = await pool.query(
      `UPDATE purchase_orders SET
         status = COALESCE($2, status),
         amount = COALESCE($3, amount),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, status, amount]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/purchase-orders/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM purchase_orders WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Purchase order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
