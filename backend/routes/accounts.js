import express from 'express';
import { FinanceService } from '../services/financeService.js';
import { pool } from '../db/pool.js';

const router = express.Router();

// GET /api/accounts/coa - Fetch Chart of Accounts
router.get('/coa', async (req, res) => {
  try {
    const data = await FinanceService.getChartOfAccounts();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/accounts/journals - Post Journal Entry (Double-Entry Validation)
router.post('/journals', async (req, res) => {
  const { voucherNo, entryDate, narration, lines } = req.body;
  const createdBy = req.user ? req.user.name : 'Finance Admin';
  try {
    const result = await FinanceService.postJournalEntry({ voucherNo, entryDate, narration, lines, createdBy });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/accounts/trial-balance - Fetch Trial Balance
router.get('/trial-balance', async (req, res) => {
  try {
    const data = await FinanceService.getTrialBalance();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
