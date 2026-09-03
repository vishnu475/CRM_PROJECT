import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/sales-orders
router.get('/', async (req, res) => {
  try {
    const { fulfillmentStatus, customerId } = req.query;
    let query = `SELECT so.*, COUNT(soi.id) as items_count
                 FROM sales_orders so
                 LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
                 WHERE 1=1`;
    const params = [];

    if (fulfillmentStatus && fulfillmentStatus !== 'All') {
      params.push(fulfillmentStatus);
      query += ` AND so.fulfillment_status = $${params.length}`;
    }
    if (customerId) { params.push(customerId); query += ` AND so.customer_id = $${params.length}`; }

    query += ` GROUP BY so.id ORDER BY so.created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/sales-orders — Create sales order in CRM database
router.post('/', async (req, res) => {
  const { id, soNumber, quotationId, customerId, customerName, date, totalAmount, fulfillmentStatus, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const soId = id || `SO-${Date.now()}`;
    const soNum = soNumber || `SO-${new Date().getFullYear()}-${soId}`;

    const soRes = await client.query(
      `INSERT INTO sales_orders (id, so_number, quotation_id, customer_id, customer_name, date, total_amount, fulfillment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [soId, soNum, quotationId, customerId, customerName, date, totalAmount || 0, fulfillmentStatus || 'Pending']
    );

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          `INSERT INTO sales_order_items (sales_order_id, product_id, product_name, quantity, unit_price, tax_rate, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [soId, item.productId, item.productName, item.quantity, item.unitPrice, item.taxRate || 18, item.total]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: soRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/sales-orders/:id — Update fulfillment status
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { fulfillmentStatus, totalAmount } = req.body;
  try {
    const result = await pool.query(
      `UPDATE sales_orders SET
         fulfillment_status = COALESCE($2, fulfillment_status),
         total_amount = COALESCE($3, total_amount),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, fulfillmentStatus, totalAmount]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Sales order not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
