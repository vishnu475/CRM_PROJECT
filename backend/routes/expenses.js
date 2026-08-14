import express from 'express';
import { pool } from '../db/pool.js';

const router = express.Router();

// GET /api/expenses - Fetch Expense Claims
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/expenses - Submit Expense Claim
router.post('/', async (req, res) => {
  const { employeeId, category, amount, description } = req.body;
  try {
    const seqRes = await pool.query("UPDATE number_sequences SET current_value = current_value + 1 WHERE id = 'seq-vchr' RETURNING current_value, prefix");
    const expNo = `EXP-${seqRes.rows[0].current_value}`;
    const expId = `EXP-${Date.now()}`;

    const query = `
      INSERT INTO expenses (id, expense_no, employee_id, category, amount, expense_date, description, status)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, 'PENDING') RETURNING *
    `;
    const result = await pool.query(query, [expId, expNo, employeeId || 'EMP-004', category, amount, description]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/expenses/:id/approve - Approve Expense Claim
router.patch('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { role } = req.user || { role: 'FinanceAccountant' };
  try {
    if (role === 'FinanceAccountant' || role === 'Executive') {
      const result = await pool.query(
        `UPDATE expenses SET status = 'APPROVED', finance_approval = 'APPROVED', manager_approval = 'APPROVED' WHERE id = $1 RETURNING *`,
        [id]
      );
      return res.json({ success: true, data: result.rows[0] });
    }
    const result = await pool.query(`UPDATE expenses SET manager_approval = 'APPROVED' WHERE id = $1 RETURNING *`, [id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
