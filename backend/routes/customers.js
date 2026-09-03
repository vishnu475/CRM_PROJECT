import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/customers — Fetch all customers from CRM database
router.get('/', async (req, res) => {
  try {
    const { status, industry } = req.query;
    let query = `SELECT * FROM customers WHERE 1=1`;
    const params = [];

    if (status && status !== 'All') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (industry && industry !== 'All') {
      params.push(industry);
      query += ` AND industry = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/customers — Create new customer in CRM database
router.post('/', async (req, res) => {
  const {
    id, customerCode, customerName, customerType, industry,
    ownerId, status, creditLimit,
    contactName, contactEmail, contactPhone,
    billingCity, billingCountry
  } = req.body;
  try {
    const custId = id || `CUST-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO customers
         (id, customer_code, customer_name, customer_type, industry, owner_id, status,
          credit_limit, contact_name, contact_email, contact_phone, billing_city, billing_country)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [custId, customerCode || custId, customerName, customerType || 'Company', industry, ownerId,
       status || 'Active', creditLimit || 0, contactName, contactEmail, contactPhone,
       billingCity, billingCountry]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT & PATCH /api/customers/:id
const updateCustomerHandler = async (req, res) => {
  const { id } = req.params;
  const { customerName, customerType, industry, ownerId, status, creditLimit,
          contactName, contactEmail, contactPhone, billingCity, billingCountry } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customers SET
         customer_name = COALESCE($2, customer_name),
         customer_type = COALESCE($3, customer_type),
         industry = COALESCE($4, industry),
         owner_id = COALESCE($5, owner_id),
         status = COALESCE($6, status),
         credit_limit = COALESCE($7, credit_limit),
         contact_name = COALESCE($8, contact_name),
         contact_email = COALESCE($9, contact_email),
         contact_phone = COALESCE($10, contact_phone),
         billing_city = COALESCE($11, billing_city),
         billing_country = COALESCE($12, billing_country),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, customerName, customerType, industry, ownerId, status, creditLimit,
       contactName, contactEmail, contactPhone, billingCity, billingCountry]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
router.put('/:id', updateCustomerHandler);
router.patch('/:id', updateCustomerHandler);

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
