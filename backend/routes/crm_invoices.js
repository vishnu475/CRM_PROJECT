import express from 'express';
import { crmPool as pool, hrmsPool } from '../db/pool.js'; // CRM DB (Friend 1) & HRMS DB (Friend 2)
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Ensure all GST, Place of Supply, Billing, and Banking columns exist idempotently
const ensureInvoiceColumns = async () => {
  try {
    await pool.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_invoices_status_check') THEN
          ALTER TABLE crm_invoices DROP CONSTRAINT crm_invoices_status_check;
        END IF;
      END $$;
    `);
    await pool.query(`
      ALTER TABLE crm_invoices ADD CONSTRAINT crm_invoices_status_check
        CHECK (status IN ('Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'))
    `);
  } catch (err) {
    // Constraint may already exist
  }

  try {
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS place_of_supply TEXT`);
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS place_of_supply_code TEXT`);
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS billing_address TEXT`);
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS customer_gstin TEXT`);
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS seller_gstin TEXT DEFAULT '29AABCU9603R1ZM'`);
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS tax_type TEXT DEFAULT 'INTRA_STATE'`);
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(15,2) DEFAULT 0`);
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(15,2) DEFAULT 0`);
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(15,2) DEFAULT 0`);
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS bank_account_id TEXT`);
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS bank_details_json JSONB`);
    await pool.query(`ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Bank Transfer'`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS crm_invoice_payments (
        id TEXT PRIMARY KEY,
        invoice_id TEXT REFERENCES crm_invoices(id) ON DELETE CASCADE,
        payment_date DATE DEFAULT CURRENT_DATE,
        amount NUMERIC(15,2) NOT NULL,
        payment_method TEXT DEFAULT 'Bank Transfer',
        bank_account_id TEXT,
        reference_number TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.warn('⚠️ [CRM] Failed to add crm_invoices columns:', err.message);
  }
};
ensureInvoiceColumns();

// GET /api/crm/invoices/next-number/preview — Preview next sequential invoice number
router.get('/next-number/preview', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    const seqRes = await pool.query(
      `SELECT invoice_number FROM crm_invoices 
       WHERE invoice_number LIKE $1 
       ORDER BY invoice_number DESC 
       LIMIT 1`,
      [`${prefix}%`]
    );
    let nextSeq = 1;
    if (seqRes.rows.length > 0) {
      const lastNum = seqRes.rows[0].invoice_number;
      const match = lastNum.match(/INV-\d{4}-(\d+)/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }
    const nextInvoiceNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    res.json({ success: true, nextInvoiceNumber });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/crm/invoices — Fetch all invoices with items count, quotation, and sales order info
router.get('/', async (req, res) => {
  try {
    const { status, customerId, salesOrderId } = req.query;
    let query = `
      SELECT 
        inv.*, 
        COUNT(DISTINCT invi.id) as items_count,
        COUNT(DISTINCT pmt.id) as payments_count,
        so.so_number as sales_order_number,
        so.quotation_id,
        q.quote_number,
        so.customer_po_number
      FROM crm_invoices inv
      LEFT JOIN crm_invoice_items invi ON inv.id = invi.invoice_id
      LEFT JOIN crm_invoice_payments pmt ON inv.id = pmt.invoice_id
      LEFT JOIN sales_orders so ON inv.sales_order_id = so.id
      LEFT JOIN quotations q ON COALESCE(inv.quotation_id, so.quotation_id) = q.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') { 
      params.push(status);     
      query += ` AND inv.status = $${params.length}`; 
    }
    if (customerId) { 
      params.push(customerId); 
      query += ` AND inv.customer_id = $${params.length}`; 
    }
    if (salesOrderId) {
      params.push(salesOrderId);
      query += ` AND inv.sales_order_id = $${params.length}`;
    }

    query += ` GROUP BY inv.id, so.so_number, so.quotation_id, q.quote_number, so.customer_po_number ORDER BY inv.created_at DESC`;
    const result = await pool.query(query, params);

    // Auto-compute overdue status in-memory if due date has passed with outstanding balance
    const todayStr = new Date().toISOString().split('T')[0];
    const rows = result.rows.map(r => {
      const amt = parseFloat(r.amount) || 0;
      const paid = parseFloat(r.paid_amount) || 0;
      const outstanding = Math.max(0, amt - paid);
      let currentStatus = r.status;
      if (currentStatus !== 'Paid' && currentStatus !== 'Cancelled' && r.due_date && r.due_date < todayStr && outstanding > 0) {
        currentStatus = 'Overdue';
      }
      return {
        ...r,
        status: currentStatus,
        outstanding_balance: outstanding
      };
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/crm/invoices/:id — Fetch single invoice with items and payments history
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invRes = await pool.query(
      `SELECT 
        inv.*, 
        so.so_number as sales_order_number,
        so.quotation_id,
        q.quote_number,
        so.customer_po_number
       FROM crm_invoices inv
       LEFT JOIN sales_orders so ON inv.sales_order_id = so.id
       LEFT JOIN quotations q ON COALESCE(inv.quotation_id, so.quotation_id) = q.id
       WHERE inv.id = $1`,
      [id]
    );
    if (invRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const itemsRes = await pool.query(
      `SELECT * FROM crm_invoice_items WHERE invoice_id = $1 ORDER BY id ASC`,
      [id]
    );

    const paymentsRes = await pool.query(
      `SELECT * FROM crm_invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC, created_at DESC`,
      [id]
    );

    const inv = invRes.rows[0];
    const amt = parseFloat(inv.amount) || 0;
    const paid = parseFloat(inv.paid_amount) || 0;
    const outstanding = Math.max(0, amt - paid);

    res.json({
      success: true,
      data: {
        ...inv,
        outstanding_balance: outstanding,
        items: itemsRes.rows,
        payments: paymentsRes.rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crm/invoices — Create tax invoice with automated sequential numbering, GST calculations & duplicate prevention
router.post('/', async (req, res) => {
  const { 
    id, 
    invoiceNumber, 
    salesOrderId, 
    quotationId,
    opportunityId,
    customerId, 
    customerName, 
    date, 
    dueDate, 
    amount, 
    subtotal,
    taxAmount,
    discountAmount,
    status, 
    paymentTerms,
    notes,
    items,
    placeOfSupply,
    place_of_supply,
    placeOfSupplyCode,
    place_of_supply_code,
    billingAddress,
    billing_address,
    customerGstin,
    customer_gstin,
    sellerGstin,
    seller_gstin,
    taxType,
    tax_type,
    cgstAmount,
    cgst_amount,
    sgstAmount,
    sgst_amount,
    igstAmount,
    igst_amount,
    bankAccountId,
    bank_account_id,
    bankDetails,
    bank_details_json,
    paymentMethod,
    payment_method
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let resolvedQuotationId = quotationId || null;
    let resolvedOpportunityId = opportunityId || null;

    // 1. If linked to sales order, perform validation & duplicate prevention
    if (salesOrderId) {
      const soRes = await client.query('SELECT * FROM sales_orders WHERE id = $1', [salesOrderId]);
      if (soRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: 'Sales Order not found.' 
        });
      }

      const so = soRes.rows[0];

      // Validate order status is confirmed or fulfilled (not Draft/Cancelled)
      if (so.status === 'Draft' || so.status === 'Cancelled' || so.fulfillment_status === 'Cancelled') {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `Cannot generate invoice for Sales Order in "${so.status || so.fulfillment_status}" status. Order must be Confirmed.` 
        });
      }

      // Duplicate invoice prevention
      const existingInvRes = await client.query('SELECT id, invoice_number FROM crm_invoices WHERE sales_order_id = $1', [salesOrderId]);
      if (existingInvRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `An Invoice (${existingInvRes.rows[0].invoice_number}) already exists for this Sales Order. Duplicate creation is blocked.`,
          existingInvoiceId: existingInvRes.rows[0].id,
          existingInvoiceNumber: existingInvRes.rows[0].invoice_number
        });
      }

      if (!resolvedQuotationId && so.quotation_id) {
        resolvedQuotationId = so.quotation_id;
      }
      if (!resolvedOpportunityId && so.opportunity_id) {
        resolvedOpportunityId = so.opportunity_id;
      }
    }

    // 2. Generate unique sequential invoice number (e.g., INV-2026-0001)
    let invNo = invoiceNumber;
    if (!invNo || invNo.includes('Math.random') || invNo.startsWith('INV-TEMP')) {
      const currentYear = new Date().getFullYear();
      const prefix = `INV-${currentYear}-`;
      const seqRes = await client.query(
        `SELECT invoice_number FROM crm_invoices 
         WHERE invoice_number LIKE $1 
         ORDER BY invoice_number DESC 
         LIMIT 1 FOR UPDATE`,
        [`${prefix}%`]
      );
      let nextSeq = 1;
      if (seqRes.rows.length > 0) {
        const lastNum = seqRes.rows[0].invoice_number;
        const match = lastNum.match(/INV-\d{4}-(\d+)/);
        if (match) {
          nextSeq = parseInt(match[1], 10) + 1;
        }
      }
      invNo = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    }

    const invId = id || `INV-${Date.now()}`;
    const effectiveStatus = status || 'Issued';

    // 3. Tax and Place of Supply Resolution
    const finalPlaceOfSupply = placeOfSupply || place_of_supply || 'Karnataka';
    const finalPlaceOfSupplyCode = placeOfSupplyCode || place_of_supply_code || '29';
    const finalBillingAddress = billingAddress || billing_address || '';
    const finalCustomerGstin = customerGstin || customer_gstin || null;
    const finalSellerGstin = sellerGstin || seller_gstin || '29AABCU9603R1ZM';

    // Determine supply type: Intra-State (State code 29) vs Inter-State (other state)
    const isInterState = finalPlaceOfSupplyCode !== '29' || (taxType === 'INTER_STATE' || tax_type === 'INTER_STATE');
    const finalTaxType = isInterState ? 'INTER_STATE' : 'INTRA_STATE';

    const totalTaxVal = parseFloat(taxAmount) || 0;
    let finalCgst = 0;
    let finalSgst = 0;
    let finalIgst = 0;

    if (finalTaxType === 'INTER_STATE') {
      finalIgst = parseFloat(igstAmount !== undefined ? igstAmount : igst_amount) || totalTaxVal;
      finalCgst = 0;
      finalSgst = 0;
    } else {
      const halfTax = Math.round((totalTaxVal / 2) * 100) / 100;
      finalCgst = parseFloat(cgstAmount !== undefined ? cgstAmount : cgst_amount) || halfTax;
      finalSgst = parseFloat(sgstAmount !== undefined ? sgstAmount : sgst_amount) || (totalTaxVal - finalCgst);
      finalIgst = 0;
    }

    const finalBankAccId = bankAccountId || bank_account_id || null;
    const finalBankDetails = bankDetails || bank_details_json || null;
    const finalPaymentMethod = paymentMethod || payment_method || 'Bank Transfer';

    const invRes = await client.query(
      `INSERT INTO crm_invoices (
        id, invoice_number, sales_order_id, quotation_id, opportunity_id, customer_id, 
        customer_name, date, due_date, amount, subtotal, tax_amount, discount_amount, 
        paid_amount, status, payment_terms, notes,
        place_of_supply, place_of_supply_code, billing_address, customer_gstin, seller_gstin,
        tax_type, cgst_amount, sgst_amount, igst_amount, bank_account_id, bank_details_json, payment_method
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28) RETURNING *`,
      [
        invId, 
        invNo, 
        salesOrderId || null, 
        resolvedQuotationId,
        resolvedOpportunityId,
        customerId, 
        customerName, 
        date || new Date().toISOString().split('T')[0], 
        dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], 
        parseFloat(amount) || 0, 
        parseFloat(subtotal) || 0,
        totalTaxVal, 
        parseFloat(discountAmount) || 0,
        effectiveStatus,
        paymentTerms || 'Payment due within 15 days of invoice date',
        notes || '',
        finalPlaceOfSupply,
        finalPlaceOfSupplyCode,
        finalBillingAddress,
        finalCustomerGstin,
        finalSellerGstin,
        finalTaxType,
        finalCgst,
        finalSgst,
        finalIgst,
        finalBankAccId,
        finalBankDetails ? JSON.stringify(finalBankDetails) : null,
        finalPaymentMethod
      ]
    );

    // If explicit items passed, use them; otherwise copy from sales order
    let lineItemsToInsert = items;
    if ((!lineItemsToInsert || lineItemsToInsert.length === 0) && salesOrderId) {
      const soItemsRes = await client.query('SELECT * FROM sales_order_items WHERE sales_order_id = $1', [salesOrderId]);
      lineItemsToInsert = soItemsRes.rows.map(soi => ({
        productId: soi.product_id,
        productName: soi.product_name,
        quantity: soi.quantity,
        unitPrice: soi.unit_price,
        taxRate: soi.tax_rate,
        total: soi.total
      }));
    }

    if (lineItemsToInsert && Array.isArray(lineItemsToInsert)) {
      for (const item of lineItemsToInsert) {
        await client.query(
          `INSERT INTO crm_invoice_items (invoice_id, product_id, product_name, quantity, unit_price, tax_rate, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            invId, 
            item.productId || null, 
            item.productName || 'Custom Billed Item', 
            item.quantity || 1, 
            item.unitPrice || 0, 
            item.taxRate !== undefined ? item.taxRate : 18, 
            item.total || 0
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: invRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// POST /api/crm/invoices/:id/payments — Record customer payment (partial or full) with status update & banking integration
router.post('/:id/payments', async (req, res) => {
  const { id } = req.params;
  const { amount, paymentDate, paymentMethod, bankAccountId, referenceNumber, notes } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const invRes = await client.query('SELECT * FROM crm_invoices WHERE id = $1 FOR UPDATE', [id]);
    if (invRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const invoice = invRes.rows[0];
    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Valid positive payment amount required.' });
    }

    const currentPaid = parseFloat(invoice.paid_amount) || 0;
    const invoiceTotal = parseFloat(invoice.amount) || 0;
    const remainingBalance = Math.max(0, invoiceTotal - currentPaid);

    if (payAmt > remainingBalance + 0.05) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount (₹${payAmt.toLocaleString('en-IN')}) exceeds outstanding balance (₹${remainingBalance.toLocaleString('en-IN')}).` 
      });
    }

    const newPaidAmount = Math.round((currentPaid + payAmt) * 100) / 100;
    let newStatus = 'Partially Paid';
    if (newPaidAmount >= invoiceTotal - 0.05) {
      newStatus = 'Paid';
    }

    const pmtId = `PMT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const effectivePayDate = paymentDate || new Date().toISOString().split('T')[0];
    const effectivePayMethod = paymentMethod || 'Bank Transfer';

    await client.query(
      `INSERT INTO crm_invoice_payments (id, invoice_id, payment_date, amount, payment_method, bank_account_id, reference_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [pmtId, id, effectivePayDate, payAmt, effectivePayMethod, bankAccountId || null, referenceNumber || null, notes || '']
    );

    const updateRes = await client.query(
      `UPDATE crm_invoices SET
         paid_amount = $2,
         status = $3,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, newPaidAmount, newStatus]
    );

    // If bank account provided, credit bank account in HRMS DB and log transaction
    if (bankAccountId) {
      try {
        await hrmsPool.query('UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2', [payAmt, bankAccountId]);
        await hrmsPool.query(
          `INSERT INTO bank_transactions (id, bank_account_id, txn_date, reference_no, description, type, amount, running_balance)
           VALUES ($1, $2, $3, $4, $5, 'CREDIT', $6, (SELECT balance FROM bank_accounts WHERE id = $2))`,
          [
            `TXN-INV-${Date.now()}`,
            bankAccountId,
            effectivePayDate,
            referenceNumber || invoice.invoice_number,
            `Customer Payment: ${invoice.customer_name} for ${invoice.invoice_number}`,
            payAmt
          ]
        );
      } catch (bankErr) {
        console.warn('⚠️ [Banking Integration Note]:', bankErr.message);
      }
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Payment of ₹${payAmt.toLocaleString('en-IN')} recorded successfully. Invoice status: ${newStatus}`,
      data: updateRes.rows[0],
      payment: {
        id: pmtId,
        amount: payAmt,
        date: effectivePayDate,
        method: effectivePayMethod,
        referenceNumber
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET /api/crm/invoices/:id/payments — Fetch payments list for invoice
router.get('/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM crm_invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC, created_at DESC`,
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crm/invoices/:id/send — Send Tax Invoice via email
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const invRes = await pool.query(
      `SELECT inv.*, c.email as customer_email
       FROM crm_invoices inv
       LEFT JOIN customers c ON inv.customer_id = c.id
       WHERE inv.id = $1`,
      [id]
    );
    if (invRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    const inv = invRes.rows[0];
    const recipient = req.body.email || inv.customer_email || 'corporate@democompany.com';

    await sendEmail({
      to: recipient,
      subject: `Tax Invoice ${inv.invoice_number} from Demo Company Pvt. Ltd.`,
      text: `Dear Customer,\n\nPlease find attached Tax Invoice ${inv.invoice_number} for an amount of ₹${inv.amount}.\nPayment Due Date: ${inv.due_date}\n\nThank you for your business.`,
      html: `<h3>Tax Invoice ${inv.invoice_number}</h3><p>Dear Customer,</p><p>Please find attached Tax Invoice <strong>${inv.invoice_number}</strong> for the amount of <strong>₹${inv.amount}</strong>.</p><p>Due Date: ${inv.due_date}</p><p>Payment Terms: ${inv.payment_terms || 'Standard 30 days'}</p><p>Thank you for your partnership.</p>`
    });

    res.json({ success: true, message: `Tax Invoice successfully emailed to ${recipient}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/crm/invoices/:id — Update status, paid_amount, due_date
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, paidAmount, dueDate, notes, paymentTerms, billingAddress, placeOfSupply } = req.body;
  try {
    const existingRes = await pool.query('SELECT * FROM crm_invoices WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const result = await pool.query(
      `UPDATE crm_invoices SET
         status = COALESCE($2, status),
         paid_amount = COALESCE($3, paid_amount),
         due_date = COALESCE($4, due_date),
         notes = COALESCE($5, notes),
         payment_terms = COALESCE($6, payment_terms),
         billing_address = COALESCE($7, billing_address),
         place_of_supply = COALESCE($8, place_of_supply),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, status, paidAmount, dueDate, notes, paymentTerms, billingAddress, placeOfSupply]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/crm/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existingRes = await pool.query('SELECT * FROM crm_invoices WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    if (existingRes.rows[0].status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Cannot delete a Paid invoice.' });
    }

    await pool.query('DELETE FROM crm_invoices WHERE id = $1', [id]);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
