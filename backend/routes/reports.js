import express from 'express';
import { hrmsPool, crmPool } from '../db/pool.js';

const router = express.Router();

// GET /api/reports/summary — Dual-DB Real-time Aggregated Report
router.get('/summary', async (req, res) => {
  try {
    // ----------------------------------------------------
    // 1. HRMS Metrics (from hrmsPool)
    // ----------------------------------------------------
    const [
      empStatusRes,
      empDeptRes,
      attRes,
      payrollRes,
      internsRes,
      internTracksRes,
      bankRes,
      expenseRes
    ] = await Promise.all([
      hrmsPool.query(`
        SELECT status, COUNT(*) as count 
        FROM employees 
        GROUP BY status
      `),
      hrmsPool.query(`
        SELECT 
          department, 
          COUNT(*) as headcount, 
          ROUND(SUM(COALESCE(salary, 0))::numeric, 2) as monthly_cost,
          ROUND(AVG(COALESCE(salary, 0))::numeric, 2) as avg_salary
        FROM employees 
        WHERE status != 'Exited'
        GROUP BY department 
        ORDER BY headcount DESC
      `),
      hrmsPool.query(`
        SELECT status, COUNT(*) as count 
        FROM attendance_records 
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY status
      `),
      hrmsPool.query(`
        SELECT 
          COUNT(*) as total_employees,
          ROUND(SUM(COALESCE(salary, 0))::numeric, 2) as total_monthly_payroll,
          ROUND(SUM(COALESCE(annual_salary, salary * 12, 0))::numeric, 2) as total_annual_payroll,
          ROUND(AVG(COALESCE(salary, 0))::numeric, 2) as avg_monthly_salary
        FROM employees 
        WHERE status != 'Exited'
      `),
      hrmsPool.query(`
        SELECT 
          status, 
          COUNT(*) as count, 
          ROUND(SUM(COALESCE(stipend, 0))::numeric, 2) as total_stipend
        FROM interns 
        GROUP BY status
      `),
      hrmsPool.query(`
        SELECT 
          internship_type, 
          COUNT(*) as count 
        FROM interns 
        GROUP BY internship_type
        ORDER BY count DESC
      `),
      hrmsPool.query(`
        SELECT bank_name, account_number, balance 
        FROM bank_accounts 
        ORDER BY balance DESC
      `),
      hrmsPool.query(`
        SELECT status, ROUND(SUM(COALESCE(amount, 0))::numeric, 2) as total 
        FROM expenses 
        GROUP BY status
      `)
    ]);

    // ----------------------------------------------------
    // 2. CRM Metrics (from crmPool)
    // ----------------------------------------------------
    let crmLeadsStage = [];
    let crmLeadSources = [];
    let crmInvoices = [];
    let crmSalesOrders = [];
    let crmCustomersCount = 0;

    try {
      const [leadsStageRes, leadSourcesRes, invoicesRes, salesOrdersRes, customersRes] = await Promise.all([
        crmPool.query(`
          SELECT stage, COUNT(*) as count, ROUND(SUM(COALESCE(value, 0))::numeric, 2) as total_value 
          FROM leads 
          GROUP BY stage
          ORDER BY total_value DESC
        `),
        crmPool.query(`
          SELECT source, COUNT(*) as count, ROUND(SUM(COALESCE(value, 0))::numeric, 2) as total_value 
          FROM leads 
          GROUP BY source 
          ORDER BY total_value DESC 
          LIMIT 6
        `),
        crmPool.query(`
          SELECT status, COUNT(*) as count, ROUND(SUM(COALESCE(amount, 0))::numeric, 2) as total_amount 
          FROM crm_invoices 
          GROUP BY status
        `),
        crmPool.query(`
          SELECT fulfillment_status, COUNT(*) as count, ROUND(SUM(COALESCE(total_amount, 0))::numeric, 2) as total_value 
          FROM sales_orders 
          GROUP BY fulfillment_status
        `),
        crmPool.query(`SELECT COUNT(*) as count FROM customers`)
      ]);

      crmLeadsStage = leadsStageRes.rows;
      crmLeadSources = leadSourcesRes.rows;
      crmInvoices = invoicesRes.rows;
      crmSalesOrders = salesOrdersRes.rows;
      crmCustomersCount = parseInt(customersRes.rows[0]?.count || 0);
    } catch (crmErr) {
      console.warn('CRM data warning (using default safe empty lists):', crmErr.message);
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      hrms: {
        statusDistribution: empStatusRes.rows,
        departmentBreakdown: empDeptRes.rows,
        attendance30Days: attRes.rows,
        payroll: payrollRes.rows[0] || {},
        interns: {
          statusBreakdown: internsRes.rows,
          trackBreakdown: internTracksRes.rows,
          totalInterns: internsRes.rows.reduce((acc, r) => acc + parseInt(r.count), 0),
          convertedInterns: parseInt(internsRes.rows.find(r => r.status === 'Converted')?.count || 0),
          activeInterns: parseInt(internsRes.rows.find(r => r.status === 'Active')?.count || 0)
        }
      },
      crm: {
        totalCustomers: crmCustomersCount,
        leadsByStage: crmLeadsStage,
        leadsBySource: crmLeadSources,
        totalLeadsCount: crmLeadsStage.reduce((acc, r) => acc + parseInt(r.count), 0),
        totalPipelineValue: crmLeadsStage.reduce((acc, r) => acc + parseFloat(r.total_value || 0), 0),
        invoices: crmInvoices,
        totalInvoicedValue: crmInvoices.reduce((acc, r) => acc + parseFloat(r.total_amount || 0), 0),
        salesOrders: crmSalesOrders,
        totalSalesValue: crmSalesOrders.reduce((acc, r) => acc + parseFloat(r.total_value || 0), 0)
      },
      finance: {
        bankAccounts: bankRes.rows,
        totalCash: bankRes.rows.reduce((acc, b) => acc + parseFloat(b.balance || 0), 0),
        expenses: expenseRes.rows
      }
    });
  } catch (err) {
    console.error('Error fetching reports summary:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
