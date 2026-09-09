import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/vendors — Fetch all vendors with live purchase & payable aggregation
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.*,
        COALESCE(po_stats.total_purchases, 0) AS total_purchases,
        COALESCE(po_stats.total_orders, 0) AS total_orders,
        COALESCE(po_stats.open_orders, 0) AS open_orders,
        COALESCE(po_stats.pending_receipts, 0) AS pending_receipts,
        COALESCE(po_stats.invoiced_amount, 0) AS invoiced_amount,
        COALESCE(po_stats.paid_amount, 0) AS total_paid_amount,
        COALESCE(po_stats.amount_due, v.payable_balance, 0) AS calculated_amount_due,
        COALESCE(po_stats.overdue_amount, 0) AS overdue_amount
      FROM vendors v
      LEFT JOIN (
        SELECT 
          po.vendor_id,
          COUNT(*) AS total_orders,
          SUM(CASE WHEN po.status != 'Cancelled' THEN po.amount ELSE 0 END) AS total_purchases,
          SUM(CASE WHEN po.status NOT IN ('Completed', 'Cancelled') THEN 1 ELSE 0 END) AS open_orders,
          SUM(CASE WHEN po.status IN ('Ordered', 'Partially Received') AND COALESCE(po.receipt_status, 'Not Received') != 'Fully Received' THEN 1 ELSE 0 END) AS pending_receipts,
          SUM(CASE WHEN po.vendor_invoice_number IS NOT NULL AND po.status != 'Cancelled' THEN COALESCE(po.vendor_invoice_amount, po.amount) ELSE 0 END) AS invoiced_amount,
          SUM(CASE WHEN po.vendor_invoice_number IS NOT NULL AND po.status != 'Cancelled' THEN COALESCE(po.paid_amount, 0) ELSE 0 END) AS paid_amount,
          SUM(CASE WHEN po.vendor_invoice_number IS NOT NULL AND po.status != 'Cancelled' THEN GREATEST(0, COALESCE(po.vendor_invoice_amount, po.amount) - COALESCE(po.paid_amount, 0)) ELSE 0 END) AS amount_due,
          SUM(CASE 
            WHEN po.vendor_invoice_number IS NOT NULL 
              AND po.status != 'Cancelled' 
              AND po.vendor_invoice_due_date IS NOT NULL 
              AND po.vendor_invoice_due_date < CURRENT_DATE 
              AND GREATEST(0, COALESCE(po.vendor_invoice_amount, po.amount) - COALESCE(po.paid_amount, 0)) > 0 
            THEN GREATEST(0, COALESCE(po.vendor_invoice_amount, po.amount) - COALESCE(po.paid_amount, 0))
            ELSE 0 
          END) AS overdue_amount
        FROM purchase_orders po
        WHERE po.vendor_id IS NOT NULL
        GROUP BY po.vendor_id
      ) po_stats ON v.id = po_stats.vendor_id
      ORDER BY v.name ASC
    `;

    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vendors/:id — Full Supplier 360 view with purchase orders, receipts, and payments
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vendorRes = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const vendor = vendorRes.rows[0];

    // Fetch all purchase orders for this vendor
    const poRes = await pool.query(
      `SELECT * FROM purchase_orders WHERE vendor_id = $1 ORDER BY date DESC, created_at DESC`,
      [id]
    );

    // Fetch all payments for this vendor
    let payments = [];
    try {
      const payRes = await pool.query(
        `SELECT * FROM purchase_payments WHERE vendor_id = $1 ORDER BY payment_date DESC`,
        [id]
      );
      payments = payRes.rows;
    } catch (e) {
      // purchase_payments table might be empty or fallback
      payments = [];
    }

    // Aggregate metrics
    let totalPurchases = 0;
    let openOrders = 0;
    let pendingReceipts = 0;
    let totalPaid = 0;
    let totalAmountDue = 0;
    let totalOverdue = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const purchaseOrdersWithDetails = poRes.rows.map(po => {
      const amt = parseFloat(po.amount) || 0;
      const invAmt = parseFloat(po.vendor_invoice_amount) || amt;
      const paid = parseFloat(po.paid_amount) || 0;
      const due = po.vendor_invoice_number ? Math.max(0, invAmt - paid) : 0;
      const isOverdue = Boolean(
        po.vendor_invoice_number &&
        po.vendor_invoice_due_date &&
        new Date(po.vendor_invoice_due_date) < today &&
        due > 0
      );

      if (po.status !== 'Cancelled') {
        totalPurchases += amt;
        totalPaid += paid;
        totalAmountDue += due;
        if (isOverdue) totalOverdue += due;
        if (po.status !== 'Completed') openOrders++;
        if (['Ordered', 'Partially Received'].includes(po.status) && po.receipt_status !== 'Fully Received') {
          pendingReceipts++;
        }
      }

      return {
        ...po,
        calculated_amount_due: due,
        is_overdue: isOverdue,
      };
    });

    res.json({
      success: true,
      data: {
        ...vendor,
        total_purchases: totalPurchases,
        total_orders: poRes.rows.length,
        open_orders: openOrders,
        pending_receipts: pendingReceipts,
        total_paid_amount: totalPaid,
        calculated_amount_due: totalAmountDue > 0 ? totalAmountDue : (parseFloat(vendor.payable_balance) || 0),
        overdue_amount: totalOverdue,
        purchase_orders: purchaseOrdersWithDetails,
        payments: payments,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vendors — Create vendor in CRM database
router.post('/', async (req, res) => {
  const {
    id,
    code,
    name,
    contactPerson,
    contact_person,
    email,
    phone,
    category,
    address,
    gstin,
    paymentTerms,
    payment_terms,
    status,
    website,
    notes,
    payableBalance,
    payable_balance,
    rating,
  } = req.body;

  try {
    const vendorId = id || `VND-${Date.now()}`;
    const vendorCode = code || vendorId;
    const finalContact = contactPerson || contact_person || 'Procurement Rep';
    const finalCategory = category || 'General';
    const finalPaymentTerms = paymentTerms || payment_terms || 'Net 30 Days';
    const finalStatus = status || 'Active';
    const finalRating = parseFloat(rating) || 5.0;
    const finalPayable = parseFloat(payableBalance || payable_balance) || 0;

    const result = await pool.query(
      `INSERT INTO vendors (
        id, code, name, contact_person, email, phone, 
        category, address, gstin, payment_terms, status, 
        website, notes, payable_balance, rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        vendorId,
        vendorCode,
        name,
        finalContact,
        email,
        phone,
        finalCategory,
        address || '',
        gstin || '',
        finalPaymentTerms,
        finalStatus,
        website || '',
        notes || '',
        finalPayable,
        finalRating
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/vendors/:id — Update vendor details
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    contactPerson,
    contact_person,
    email,
    phone,
    category,
    address,
    gstin,
    paymentTerms,
    payment_terms,
    status,
    website,
    notes,
    payableBalance,
    payable_balance,
    rating,
  } = req.body;

  try {
    const effectiveContact = contactPerson !== undefined ? contactPerson : contact_person;
    const effectivePaymentTerms = paymentTerms !== undefined ? paymentTerms : payment_terms;
    const effectivePayable = payableBalance !== undefined ? payableBalance : payable_balance;

    const result = await pool.query(
      `UPDATE vendors SET
         name = COALESCE($2, name),
         contact_person = COALESCE($3, contact_person),
         email = COALESCE($4, email),
         phone = COALESCE($5, phone),
         category = COALESCE($6, category),
         address = COALESCE($7, address),
         gstin = COALESCE($8, gstin),
         payment_terms = COALESCE($9, payment_terms),
         status = COALESCE($10, status),
         website = COALESCE($11, website),
         notes = COALESCE($12, notes),
         payable_balance = COALESCE($13, payable_balance),
         rating = COALESCE($14, rating),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [
        id,
        name,
        effectiveContact,
        email,
        phone,
        category,
        address,
        gstin,
        effectivePaymentTerms,
        status,
        website,
        notes,
        effectivePayable,
        rating
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/vendors/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vendors WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
