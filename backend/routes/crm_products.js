import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/crm/products — Fetch product catalog from CRM database
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = `SELECT * FROM products WHERE 1=1`;
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ` ORDER BY name ASC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crm/products — Add product to CRM database
router.post('/', async (req, res) => {
  const { id, sku, name, category, price, stock, uom, hsnCode, taxRate } = req.body;
  try {
    const prodId = id || `PROD-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO products (id, sku, name, category, price, stock, uom, hsn_code, tax_rate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [prodId, sku || prodId, name, category, price || 0, stock || 0, uom || 'Units', hsnCode, taxRate || 18]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/crm/products/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, price, stock, uom } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET
         name = COALESCE($2, name),
         category = COALESCE($3, category),
         price = COALESCE($4, price),
         stock = COALESCE($5, stock),
         uom = COALESCE($6, uom),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, name, category, price, stock, uom]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
