import express from 'express';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2

const router = express.Router();

// GET /api/banking/accounts - Fetch Bank Accounts
router.get('/accounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bank_accounts ORDER BY bank_name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/banking/transactions - Fetch Transactions
router.get('/transactions', async (req, res) => {
  const { bankAccountId } = req.query;
  try {
    let query = 'SELECT * FROM bank_transactions';
    const params = [];
    if (bankAccountId) {
      params.push(bankAccountId);
      query += ' WHERE bank_account_id = $1';
    }
    query += ' ORDER BY txn_date DESC, created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/banking/transfer - Fund Transfer
router.post('/transfer', async (req, res) => {
  const { fromAccountId, toAccountId, amount, description, referenceNo } = req.body;
  if (fromAccountId === toAccountId) {
    return res.status(400).json({ success: false, message: 'Source and destination accounts must be different.' });
  }

  const client = await pool.connect();
  try {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) throw new Error('Valid transfer amount required.');

    await client.query('BEGIN');

    // Verify source account balance with row lock
    const srcRes = await client.query('SELECT balance FROM bank_accounts WHERE id = $1 FOR UPDATE', [fromAccountId]);
    if (srcRes.rows.length === 0) throw new Error('Source account not found.');
    if (parseFloat(srcRes.rows[0].balance) < amt) {
      throw new Error(`Insufficient funds: Available balance is ₹${parseFloat(srcRes.rows[0].balance).toLocaleString()}`);
    }

    // Verify destination account exists with row lock
    const destRes = await client.query('SELECT id FROM bank_accounts WHERE id = $1 FOR UPDATE', [toAccountId]);
    if (destRes.rows.length === 0) throw new Error('Destination account not found.');

    const txnDate = new Date().toISOString().split('T')[0];

    // Debit From Account
    await client.query('UPDATE bank_accounts SET balance = balance - $1 WHERE id = $2', [amt, fromAccountId]);
    await client.query(
      `INSERT INTO bank_transactions (id, bank_account_id, txn_date, reference_no, description, type, amount, running_balance)
       VALUES ($1, $2, $3, $4, $5, 'DEBIT', $6, (SELECT balance FROM bank_accounts WHERE id = $2))`,
      [`TXN-${Date.now()}-1`, fromAccountId, txnDate, referenceNo || `TRF-${Date.now()}`, description || 'Fund Transfer Out', amt]
    );

    // Credit To Account
    await client.query('UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2', [amt, toAccountId]);
    await client.query(
      `INSERT INTO bank_transactions (id, bank_account_id, txn_date, reference_no, description, type, amount, running_balance)
       VALUES ($1, $2, $3, $4, $5, 'CREDIT', $6, (SELECT balance FROM bank_accounts WHERE id = $2))`,
      [`TXN-${Date.now()}-2`, toAccountId, txnDate, referenceNo || `TRF-${Date.now()}`, description || 'Fund Transfer In', amt]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: `Successfully transferred ₹${amt.toLocaleString()}!` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

export default router;
