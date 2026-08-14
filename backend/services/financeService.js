import { pool } from '../db/pool.js';

export class FinanceService {
  /**
   * Post Journal Entry with Strict Double-Entry Validation (Total Debit == Total Credit)
   */
  static async postJournalEntry({ voucherNo, entryDate, narration, lines, createdBy = 'Finance Admin' }) {
    if (!lines || lines.length < 2) {
      throw new Error('Journal Entry must contain at least 2 lines (1 Debit, 1 Credit).');
    }

    const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Double-Entry Error: Total Debit (₹${totalDebit}) does not equal Total Credit (₹${totalCredit}).`);
    }

    const jId = `JRN-${Date.now()}`;
    const vNo = voucherNo || `VCHR-${Date.now()}`;

    // 1. Insert Journal Entry Header
    await pool.query(
      `INSERT INTO journal_entries (id, voucher_no, entry_date, narration, total_debit, total_credit, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'POSTED', $7)`,
      [jId, vNo, entryDate || new Date().toISOString().split('T')[0], narration, totalDebit, totalCredit, createdBy]
    );

    // 2. Insert Journal Lines & Update Account Balances
    for (const line of lines) {
      const lineId = `JLN-${Math.floor(1000 + Math.random() * 9000)}`;
      await pool.query(
        `INSERT INTO journal_lines (id, journal_entry_id, account_id, debit, credit, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [lineId, jId, line.accountId, line.debit || 0, line.credit || 0, line.description || narration]
      );

      // Update account balance
      const netEffect = (parseFloat(line.debit) || 0) - (parseFloat(line.credit) || 0);
      await pool.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [netEffect, line.accountId]);
    }

    return {
      success: true,
      journalEntry: {
        id: jId,
        voucherNo: vNo,
        totalDebit,
        totalCredit,
        linesCount: lines.length,
        status: 'POSTED'
      }
    };
  }

  static async getChartOfAccounts() {
    const res = await pool.query('SELECT * FROM accounts ORDER BY code ASC');
    return res.rows;
  }

  static async getTrialBalance() {
    const res = await pool.query(
      `SELECT a.code, a.name, a.type, 
              SUM(jl.debit) as total_debit, 
              SUM(jl.credit) as total_credit,
              a.balance
       FROM accounts a
       LEFT JOIN journal_lines jl ON a.id = jl.account_id
       GROUP BY a.id, a.code, a.name, a.type, a.balance
       ORDER BY a.code ASC`
    );
    return res.rows;
  }
}
