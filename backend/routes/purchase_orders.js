import express from 'express';
import { crmPool as pool, hrmsPool } from '../db/pool.js'; // Dual DB

const router = express.Router();

// Helper to calculate payment terms due date
function calculateDueDateFromTerms(baseDateStr, terms) {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  if (isNaN(base.getTime())) return new Date().toISOString().split('T')[0];

  const t = (terms || '').toLowerCase();
  let daysToAdd = 30; // default Net 30

  if (t.includes('immediate') || t.includes('advance') || t.includes('cash')) {
    daysToAdd = 0;
  } else if (t.includes('15')) {
    daysToAdd = 15;
  } else if (t.includes('30')) {
    daysToAdd = 30;
  } else if (t.includes('45')) {
    daysToAdd = 45;
  } else if (t.includes('60')) {
    daysToAdd = 60;
  } else if (t.includes('90')) {
    daysToAdd = 90;
  }

  const d = new Date(base);
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split('T')[0];
}

// GET /api/purchase-orders — List all POs with vendor info & item count
router.get('/', async (req, res) => {
  try {
    const { status, vendorId, search, paymentStatus, receiptStatus, invoiceStatus } = req.query;
    let query = `
      SELECT po.*, 
             v.name as vendor_name_resolved, 
             v.contact_person, 
             v.email as vendor_email,
             v.phone as vendor_phone,
             (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.purchase_order_id = po.id) as items_count,
             (SELECT COUNT(*) FROM goods_receipts gr WHERE gr.purchase_order_id = po.id) as receipts_count,
             (SELECT COUNT(*) FROM purchase_payments pp WHERE pp.purchase_order_id = po.id) as payments_count
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      params.push(status);
      query += ` AND po.status = $${params.length}`;
    }

    if (vendorId && vendorId !== 'All') {
      params.push(vendorId);
      query += ` AND po.vendor_id = $${params.length}`;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      params.push(paymentStatus);
      query += ` AND po.payment_status = $${params.length}`;
    }

    if (receiptStatus && receiptStatus !== 'All') {
      params.push(receiptStatus);
      query += ` AND po.receipt_status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (po.po_number ILIKE $${params.length} OR po.vendor_name ILIKE $${params.length} OR v.name ILIKE $${params.length} OR po.vendor_invoice_number ILIKE $${params.length})`;
    }

    query += ` ORDER BY po.created_at DESC`;
    const result = await pool.query(query, params);

    // Fetch items for all returned POs
    const poIds = result.rows.map(r => r.id);
    let itemsMap = new Map();
    if (poIds.length > 0) {
      const itemsRes = await pool.query(
        `SELECT * FROM purchase_order_items WHERE purchase_order_id = ANY($1) ORDER BY id ASC`,
        [poIds]
      );
      itemsRes.rows.forEach(item => {
        if (!itemsMap.has(item.purchase_order_id)) {
          itemsMap.set(item.purchase_order_id, []);
        }
        itemsMap.get(item.purchase_order_id).push({
          id: item.id,
          purchaseOrderId: item.purchase_order_id,
          purchase_order_id: item.purchase_order_id,
          productId: item.product_id,
          product_id: item.product_id,
          productName: item.product_name,
          item_name: item.product_name,
          sku: item.sku || '',
          quantity: parseInt(item.quantity) || 1,
          receivedQuantity: parseInt(item.received_quantity) || 0,
          received_quantity: parseInt(item.received_quantity) || 0,
          unitPrice: parseFloat(item.unit_price) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          taxRate: parseFloat(item.tax_rate) || 18,
          tax_rate: parseFloat(item.tax_rate) || 18,
          total: parseFloat(item.total) || 0,
          total_amount: parseFloat(item.total) || 0,
        });
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const enriched = result.rows.map(row => {
      const invAmount = parseFloat(row.vendor_invoice_amount !== null && row.vendor_invoice_amount !== undefined ? row.vendor_invoice_amount : row.amount) || 0;
      const paidAmt = parseFloat(row.paid_amount) || 0;
      const amtDue = Math.max(0, invAmount - paidAmt);
      const invDueDate = row.vendor_invoice_due_date ? (typeof row.vendor_invoice_due_date === 'string' ? row.vendor_invoice_due_date.split('T')[0] : new Date(row.vendor_invoice_due_date).toISOString().split('T')[0]) : null;

      // Dynamic Payment Status calculation
      let calculatedPaymentStatus = 'Unpaid';
      if (row.status === 'Cancelled') {
        calculatedPaymentStatus = 'Cancelled';
      } else if (paidAmt >= invAmount && invAmount > 0) {
        calculatedPaymentStatus = 'Paid';
      } else if (paidAmt > 0 && paidAmt < invAmount) {
        calculatedPaymentStatus = 'Partially Paid';
      } else if (invDueDate && invDueDate < todayStr && amtDue > 0) {
        calculatedPaymentStatus = 'Overdue';
      } else {
        calculatedPaymentStatus = row.payment_status || 'Unpaid';
      }

      // Dynamic Invoice Status
      let calculatedInvoiceStatus = 'No Invoice';
      if (!row.vendor_invoice_number) {
        calculatedInvoiceStatus = (row.status === 'Received' || row.status === 'Completed' || row.status === 'Ordered') ? 'Invoice Pending' : 'No Invoice';
      } else if (invDueDate && invDueDate < todayStr && amtDue > 0) {
        calculatedInvoiceStatus = 'Overdue';
      } else {
        calculatedInvoiceStatus = 'Invoiced';
      }

      return {
        id: row.id,
        poNumber: row.po_number,
        po_number: row.po_number,
        vendorId: row.vendor_id,
        vendor_id: row.vendor_id,
        vendorName: row.vendor_name || row.vendor_name_resolved || 'Supplier',
        vendor_name: row.vendor_name || row.vendor_name_resolved || 'Supplier',
        vendorContact: row.contact_person,
        vendor_contact: row.contact_person,
        vendorEmail: row.vendor_email,
        vendor_email: row.vendor_email,
        vendorPhone: row.vendor_phone,
        vendor_phone: row.vendor_phone,
        date: row.date ? (typeof row.date === 'string' ? row.date.split('T')[0] : new Date(row.date).toISOString().split('T')[0]) : '',
        order_date: row.date ? (typeof row.date === 'string' ? row.date.split('T')[0] : new Date(row.date).toISOString().split('T')[0]) : '',
        expectedDelivery: row.expected_delivery ? (typeof row.expected_delivery === 'string' ? row.expected_delivery.split('T')[0] : new Date(row.expected_delivery).toISOString().split('T')[0]) : '',
        expected_delivery: row.expected_delivery ? (typeof row.expected_delivery === 'string' ? row.expected_delivery.split('T')[0] : new Date(row.expected_delivery).toISOString().split('T')[0]) : '',
        amount: parseFloat(row.amount) || 0,
        total_amount: parseFloat(row.amount) || 0,
        subtotal: parseFloat(row.subtotal) || 0,
        taxAmount: parseFloat(row.tax_amount) || 0,
        tax_amount: parseFloat(row.tax_amount) || 0,
        discountAmount: parseFloat(row.discount_amount) || 0,
        discount_amount: parseFloat(row.discount_amount) || 0,
        status: row.status || 'Draft',
        receiptStatus: row.receipt_status || 'Not Received',
        receipt_status: row.receipt_status || 'Not Received',
        paymentStatus: calculatedPaymentStatus,
        payment_status: calculatedPaymentStatus,
        paymentTerms: row.payment_terms || 'Net 30 Days',
        payment_terms: row.payment_terms || 'Net 30 Days',
        deliveryLocation: row.delivery_location || '',
        delivery_location: row.delivery_location || '',
        notes: row.notes || '',
        vendorInvoiceId: row.vendor_invoice_id || '',
        vendor_invoice_id: row.vendor_invoice_id || '',
        vendorInvoiceNumber: row.vendor_invoice_number || '',
        vendor_invoice_number: row.vendor_invoice_number || '',
        vendorInvoiceDate: row.vendor_invoice_date ? (typeof row.vendor_invoice_date === 'string' ? row.vendor_invoice_date.split('T')[0] : new Date(row.vendor_invoice_date).toISOString().split('T')[0]) : '',
        vendor_invoice_date: row.vendor_invoice_date ? (typeof row.vendor_invoice_date === 'string' ? row.vendor_invoice_date.split('T')[0] : new Date(row.vendor_invoice_date).toISOString().split('T')[0]) : '',
        vendorInvoiceDueDate: invDueDate || '',
        vendor_invoice_due_date: invDueDate || '',
        vendorInvoiceAmount: invAmount,
        vendor_invoice_amount: invAmount,
        paidAmount: paidAmt,
        paid_amount: paidAmt,
        amountDue: amtDue,
        amount_due: amtDue,
        lastPaymentDate: row.last_payment_date ? (typeof row.last_payment_date === 'string' ? row.last_payment_date.split('T')[0] : new Date(row.last_payment_date).toISOString().split('T')[0]) : '',
        last_payment_date: row.last_payment_date ? (typeof row.last_payment_date === 'string' ? row.last_payment_date.split('T')[0] : new Date(row.last_payment_date).toISOString().split('T')[0]) : '',
        lastPaymentReference: row.last_payment_reference || '',
        last_payment_reference: row.last_payment_reference || '',
        invoiceStatus: calculatedInvoiceStatus,
        invoice_status: calculatedInvoiceStatus,
        itemsCount: parseInt(row.items_count) || (itemsMap.get(row.id)?.length || 1),
        items_count: parseInt(row.items_count) || (itemsMap.get(row.id)?.length || 1),
        items: itemsMap.get(row.id) || [],
        paymentsCount: parseInt(row.payments_count) || 0,
        payments_count: parseInt(row.payments_count) || 0,
        createdAt: row.created_at,
        created_at: row.created_at,
        updatedAt: row.updated_at,
        updated_at: row.updated_at,
      };
    });

    // Handle invoiceStatus filtering if requested
    let finalEnriched = enriched;
    if (invoiceStatus && invoiceStatus !== 'All' && invoiceStatus !== 'All Invoices') {
      finalEnriched = finalEnriched.filter(po => po.invoiceStatus === invoiceStatus || po.invoice_status === invoiceStatus);
    }

    res.json({ success: true, data: finalEnriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/purchase-orders/:id — Single PO with line items, goods receipts, and payment history
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT po.*, 
              v.name as vendor_name_resolved, 
              v.contact_person, 
              v.email as vendor_email,
              v.phone as vendor_phone
       FROM purchase_orders po
       LEFT JOIN vendors v ON po.vendor_id = v.id
       WHERE po.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    const row = result.rows[0];

    // Fetch items
    const itemsRes = await pool.query(
      `SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY id ASC`,
      [row.id]
    );

    // Fetch goods receipts
    const receiptsRes = await pool.query(
      `SELECT gr.*, 
              (SELECT json_agg(gri.*) FROM goods_receipt_items gri WHERE gri.goods_receipt_id = gr.id) as items
       FROM goods_receipts gr
       WHERE gr.purchase_order_id = $1
       ORDER BY gr.created_at DESC`,
      [row.id]
    );

    // Fetch payments history
    const paymentsRes = await pool.query(
      `SELECT * FROM purchase_payments WHERE purchase_order_id = $1 ORDER BY payment_date DESC, created_at DESC`,
      [row.id]
    );

    const invAmount = parseFloat(row.vendor_invoice_amount !== null && row.vendor_invoice_amount !== undefined ? row.vendor_invoice_amount : row.amount) || 0;
    const paidAmt = parseFloat(row.paid_amount) || 0;
    const amtDue = Math.max(0, invAmount - paidAmt);
    const invDueDate = row.vendor_invoice_due_date ? (typeof row.vendor_invoice_due_date === 'string' ? row.vendor_invoice_due_date.split('T')[0] : new Date(row.vendor_invoice_due_date).toISOString().split('T')[0]) : null;
    const todayStr = new Date().toISOString().split('T')[0];

    // Dynamic Payment Status
    let calculatedPaymentStatus = 'Unpaid';
    if (row.status === 'Cancelled') {
      calculatedPaymentStatus = 'Cancelled';
    } else if (paidAmt >= invAmount && invAmount > 0) {
      calculatedPaymentStatus = 'Paid';
    } else if (paidAmt > 0 && paidAmt < invAmount) {
      calculatedPaymentStatus = 'Partially Paid';
    } else if (invDueDate && invDueDate < todayStr && amtDue > 0) {
      calculatedPaymentStatus = 'Overdue';
    } else {
      calculatedPaymentStatus = row.payment_status || 'Unpaid';
    }

    const po = {
      ...row,
      id: row.id,
      poNumber: row.po_number,
      po_number: row.po_number,
      vendorId: row.vendor_id,
      vendor_id: row.vendor_id,
      vendorName: row.vendor_name || row.vendor_name_resolved || 'Supplier',
      vendor_name: row.vendor_name || row.vendor_name_resolved || 'Supplier',
      vendorContact: row.contact_person,
      vendor_contact: row.contact_person,
      vendorEmail: row.vendor_email,
      vendor_email: row.vendor_email,
      vendorPhone: row.vendor_phone,
      vendor_phone: row.vendor_phone,
      date: row.date ? (typeof row.date === 'string' ? row.date.split('T')[0] : new Date(row.date).toISOString().split('T')[0]) : '',
      order_date: row.date ? (typeof row.date === 'string' ? row.date.split('T')[0] : new Date(row.date).toISOString().split('T')[0]) : '',
      expectedDelivery: row.expected_delivery ? (typeof row.expected_delivery === 'string' ? row.expected_delivery.split('T')[0] : new Date(row.expected_delivery).toISOString().split('T')[0]) : '',
      expected_delivery: row.expected_delivery ? (typeof row.expected_delivery === 'string' ? row.expected_delivery.split('T')[0] : new Date(row.expected_delivery).toISOString().split('T')[0]) : '',
      amount: parseFloat(row.amount) || 0,
      total_amount: parseFloat(row.amount) || 0,
      subtotal: parseFloat(row.subtotal) || 0,
      taxAmount: parseFloat(row.tax_amount) || 0,
      tax_amount: parseFloat(row.tax_amount) || 0,
      discountAmount: parseFloat(row.discount_amount) || 0,
      discount_amount: parseFloat(row.discount_amount) || 0,
      status: row.status || 'Draft',
      receiptStatus: row.receipt_status || 'Not Received',
      receipt_status: row.receipt_status || 'Not Received',
      paymentStatus: calculatedPaymentStatus,
      payment_status: calculatedPaymentStatus,
      paymentTerms: row.payment_terms || 'Net 30 Days',
      payment_terms: row.payment_terms || 'Net 30 Days',
      deliveryLocation: row.delivery_location || '',
      delivery_location: row.delivery_location || '',
      notes: row.notes || '',
      vendorInvoiceId: row.vendor_invoice_id || '',
      vendor_invoice_id: row.vendor_invoice_id || '',
      vendorInvoiceNumber: row.vendor_invoice_number || '',
      vendor_invoice_number: row.vendor_invoice_number || '',
      vendorInvoiceDate: row.vendor_invoice_date ? (typeof row.vendor_invoice_date === 'string' ? row.vendor_invoice_date.split('T')[0] : new Date(row.vendor_invoice_date).toISOString().split('T')[0]) : '',
      vendor_invoice_date: row.vendor_invoice_date ? (typeof row.vendor_invoice_date === 'string' ? row.vendor_invoice_date.split('T')[0] : new Date(row.vendor_invoice_date).toISOString().split('T')[0]) : '',
      vendorInvoiceDueDate: invDueDate || '',
      vendor_invoice_due_date: invDueDate || '',
      vendorInvoiceAmount: invAmount,
      vendor_invoice_amount: invAmount,
      paidAmount: paidAmt,
      paid_amount: paidAmt,
      amountDue: amtDue,
      amount_due: amtDue,
      lastPaymentDate: row.last_payment_date ? (typeof row.last_payment_date === 'string' ? row.last_payment_date.split('T')[0] : new Date(row.last_payment_date).toISOString().split('T')[0]) : '',
      last_payment_date: row.last_payment_date ? (typeof row.last_payment_date === 'string' ? row.last_payment_date.split('T')[0] : new Date(row.last_payment_date).toISOString().split('T')[0]) : '',
      lastPaymentReference: row.last_payment_reference || '',
      last_payment_reference: row.last_payment_reference || '',
      items: itemsRes.rows.map(item => ({
        id: item.id,
        purchaseOrderId: item.purchase_order_id,
        purchase_order_id: item.purchase_order_id,
        productId: item.product_id,
        product_id: item.product_id,
        productName: item.product_name,
        item_name: item.product_name,
        sku: item.sku || '',
        quantity: parseInt(item.quantity) || 1,
        receivedQuantity: parseInt(item.received_quantity) || 0,
        received_quantity: parseInt(item.received_quantity) || 0,
        unitPrice: parseFloat(item.unit_price) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        taxRate: parseFloat(item.tax_rate) || 18,
        tax_rate: parseFloat(item.tax_rate) || 18,
        total: parseFloat(item.total) || 0,
        total_amount: parseFloat(item.total) || 0,
      })),
      receipts: receiptsRes.rows.map(gr => ({
        id: gr.id,
        receiptNumber: gr.receipt_number,
        receipt_number: gr.receipt_number,
        purchaseOrderId: gr.purchase_order_id,
        purchase_order_id: gr.purchase_order_id,
        poNumber: gr.po_number,
        po_number: gr.po_number,
        date: gr.date ? (typeof gr.date === 'string' ? gr.date.split('T')[0] : new Date(gr.date).toISOString().split('T')[0]) : '',
        received_date: gr.date ? (typeof gr.date === 'string' ? gr.date.split('T')[0] : new Date(gr.date).toISOString().split('T')[0]) : '',
        receivedBy: gr.received_by,
        received_by: gr.received_by,
        deliveryNoteNumber: gr.delivery_note_number,
        delivery_note_number: gr.delivery_note_number,
        notes: gr.notes,
        items: gr.items || []
      })),
      payments: paymentsRes.rows.map(p => ({
        id: p.id,
        purchaseOrderId: p.purchase_order_id,
        purchase_order_id: p.purchase_order_id,
        vendorId: p.vendor_id,
        vendor_id: p.vendor_id,
        vendorInvoiceNumber: p.vendor_invoice_number,
        vendor_invoice_number: p.vendor_invoice_number,
        paymentNumber: p.payment_number,
        payment_number: p.payment_number,
        paymentDate: p.payment_date ? (typeof p.payment_date === 'string' ? p.payment_date.split('T')[0] : new Date(p.payment_date).toISOString().split('T')[0]) : '',
        payment_date: p.payment_date ? (typeof p.payment_date === 'string' ? p.payment_date.split('T')[0] : new Date(p.payment_date).toISOString().split('T')[0]) : '',
        amount: parseFloat(p.amount) || 0,
        paymentMethod: p.payment_method || 'Bank Transfer',
        payment_method: p.payment_method || 'Bank Transfer',
        bankAccountId: p.bank_account_id,
        bank_account_id: p.bank_account_id,
        bankAccountName: p.bank_account_name,
        bank_account_name: p.bank_account_name,
        referenceNumber: p.reference_number,
        reference_number: p.reference_number,
        notes: p.notes,
        createdAt: p.created_at,
        created_at: p.created_at
      }))
    };

    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/purchase-orders — Create PO with line items
router.post('/', async (req, res) => {
  const {
    id, poNumber, po_number, vendorId, vendor_id, vendorName, vendor_name, date, order_date, expectedDelivery, expected_delivery,
    items, subtotal, taxAmount, tax_amount, discountAmount, discount_amount, amount, total_amount,
    status, paymentTerms, payment_terms, deliveryLocation, delivery_location, notes
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const poId = id || `PO-${Date.now()}`;
    const generatedPoNumber = poNumber || po_number || `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const effectiveVendorId = vendorId || vendor_id || null;

    // Resolve vendor name if needed
    let resolvedVendorName = vendorName || vendor_name;
    if (effectiveVendorId && !resolvedVendorName) {
      const vRes = await client.query('SELECT name FROM vendors WHERE id = $1', [effectiveVendorId]);
      if (vRes.rows.length > 0) resolvedVendorName = vRes.rows[0].name;
    }

    // Compute line items totals
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    const rawItems = Array.isArray(items) && items.length > 0 ? items : [
      { productName: 'General Procurement Item', quantity: 1, unitPrice: amount || total_amount || 50000, taxRate: 18, total: amount || total_amount || 50000 }
    ];

    const validatedItems = rawItems.map(item => {
      const pId = item.productId || item.product_id || null;
      const pName = item.productName || item.item_name || item.product_name || 'Procurement Item';
      const pSku = item.sku || null;
      const qty = parseInt(item.quantity, 10) || 1;
      const price = parseFloat(item.unitPrice !== undefined ? item.unitPrice : (item.unit_price !== undefined ? item.unit_price : 0)) || 0;
      const taxRate = parseFloat(item.taxRate !== undefined ? item.taxRate : (item.tax_rate !== undefined ? item.tax_rate : 18)) || 0;
      const lineSubtotal = qty * price;
      const lineTax = lineSubtotal * (taxRate / 100);
      calculatedSubtotal += lineSubtotal;
      calculatedTax += lineTax;
      const lineTotal = lineSubtotal + lineTax;

      return {
        productId: pId,
        product_id: pId,
        productName: pName,
        item_name: pName,
        sku: pSku,
        quantity: qty,
        unitPrice: price,
        unit_price: price,
        taxRate: taxRate,
        tax_rate: taxRate,
        total: lineTotal,
        total_amount: lineTotal
      };
    });

    const disc = parseFloat(discountAmount !== undefined ? discountAmount : (discount_amount !== undefined ? discount_amount : 0)) || 0;
    const finalSubtotal = subtotal !== undefined ? parseFloat(subtotal) : calculatedSubtotal;
    const finalTax = taxAmount !== undefined ? parseFloat(taxAmount) : (tax_amount !== undefined ? parseFloat(tax_amount) : calculatedTax);
    const finalTotal = total_amount !== undefined ? parseFloat(total_amount) : (amount !== undefined ? parseFloat(amount) : (finalSubtotal + finalTax - disc));

    const initialStatus = status || 'Draft';
    const initialReceiptStatus = 'Not Received';
    const initialPaymentStatus = 'Unpaid';
    const effectiveOrderDate = date || order_date || new Date().toISOString().split('T')[0];
    const effectiveExpectedDelivery = expectedDelivery || expected_delivery || null;
    const effectivePaymentTerms = paymentTerms || payment_terms || 'Net 30 Days';
    const effectiveDeliveryLocation = deliveryLocation || delivery_location || 'Main Office & Warehouse';

    // Insert PO master
    const poResult = await client.query(
      `INSERT INTO purchase_orders 
         (id, po_number, vendor_id, vendor_name, date, expected_delivery, 
          subtotal, tax_amount, discount_amount, amount, status, 
          receipt_status, payment_status, payment_terms, delivery_location, notes, items_count, paid_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 0)
       RETURNING *`,
      [
        poId, generatedPoNumber, effectiveVendorId, resolvedVendorName || 'Office Supplies Ltd',
        effectiveOrderDate, effectiveExpectedDelivery,
        finalSubtotal, finalTax, disc, finalTotal, initialStatus,
        initialReceiptStatus, initialPaymentStatus, effectivePaymentTerms,
        effectiveDeliveryLocation, notes || null, validatedItems.length
      ]
    );

    // Insert line items
    const insertedItems = [];
    for (const it of validatedItems) {
      const itemRes = await client.query(
        `INSERT INTO purchase_order_items 
           (purchase_order_id, product_id, product_name, quantity, received_quantity, unit_price, tax_rate, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          poId, it.productId || null, it.productName, it.quantity,
          0, it.unitPrice, it.taxRate, it.total
        ]
      );
      insertedItems.push(itemRes.rows[0]);
    }

    await client.query('COMMIT');

    const createdRow = poResult.rows[0];
    const responseData = {
      ...createdRow,
      id: createdRow.id,
      poNumber: createdRow.po_number,
      po_number: createdRow.po_number,
      vendorId: createdRow.vendor_id,
      vendor_id: createdRow.vendor_id,
      vendorName: createdRow.vendor_name,
      vendor_name: createdRow.vendor_name,
      date: createdRow.date,
      order_date: createdRow.date,
      expectedDelivery: createdRow.expected_delivery,
      expected_delivery: createdRow.expected_delivery,
      amount: parseFloat(createdRow.amount),
      total_amount: parseFloat(createdRow.amount),
      subtotal: parseFloat(createdRow.subtotal),
      taxAmount: parseFloat(createdRow.tax_amount),
      tax_amount: parseFloat(createdRow.tax_amount),
      discountAmount: parseFloat(createdRow.discount_amount),
      discount_amount: parseFloat(createdRow.discount_amount),
      status: createdRow.status,
      receiptStatus: createdRow.receipt_status,
      receipt_status: createdRow.receipt_status,
      paymentStatus: createdRow.payment_status,
      payment_status: createdRow.payment_status,
      paidAmount: 0,
      paid_amount: 0,
      amountDue: parseFloat(createdRow.amount),
      amount_due: parseFloat(createdRow.amount),
      items: insertedItems.map(it => ({
        id: it.id,
        purchase_order_id: it.purchase_order_id,
        purchaseOrderId: it.purchase_order_id,
        product_id: it.product_id,
        productId: it.product_id,
        item_name: it.product_name,
        productName: it.product_name,
        quantity: parseInt(it.quantity, 10),
        received_quantity: parseInt(it.received_quantity, 10),
        receivedQuantity: parseInt(it.received_quantity, 10),
        unit_price: parseFloat(it.unit_price),
        unitPrice: parseFloat(it.unit_price),
        tax_rate: parseFloat(it.tax_rate),
        taxRate: parseFloat(it.tax_rate),
        total: parseFloat(it.total),
        total_amount: parseFloat(it.total)
      }))
    };

    res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/purchase-orders/:id — Update PO details or status (Submit, Approve, Order, Cancel)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    status, vendorId, vendor_id, vendorName, vendor_name, date, order_date, expectedDelivery, expected_delivery,
    paymentTerms, payment_terms, deliveryLocation, delivery_location, notes, receiptStatus, receipt_status, paymentStatus, payment_status
  } = req.body;

  try {
    // Check current PO
    const currentRes = await pool.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }
    const current = currentRes.rows[0];

    // Status transitions validation
    if (status && status !== current.status) {
      if (current.status === 'Cancelled') {
        return res.status(400).json({ success: false, message: 'Cannot modify a cancelled purchase order' });
      }
      if (status === 'Received' && current.status === 'Draft') {
        return res.status(400).json({ success: false, message: 'Draft purchase order must be approved and ordered before receiving goods' });
      }
    }

    const result = await pool.query(
      `UPDATE purchase_orders SET
         status = COALESCE($2, status),
         vendor_id = COALESCE($3, vendor_id),
         vendor_name = COALESCE($4, vendor_name),
         date = COALESCE($5, date),
         expected_delivery = COALESCE($6, expected_delivery),
         payment_terms = COALESCE($7, payment_terms),
         delivery_location = COALESCE($8, delivery_location),
         notes = COALESCE($9, notes),
         receipt_status = COALESCE($10, receipt_status),
         payment_status = COALESCE($11, payment_status),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [
        id, status || null, vendorId || vendor_id || null, vendorName || vendor_name || null,
        date || order_date || null, expectedDelivery || expected_delivery || null,
        paymentTerms || payment_terms || null, deliveryLocation || delivery_location || null,
        notes || null, receiptStatus || receipt_status || null, paymentStatus || payment_status || null
      ]
    );

    const row = result.rows[0];
    const data = {
      ...row,
      poNumber: row.po_number,
      po_number: row.po_number,
      vendorId: row.vendor_id,
      vendor_id: row.vendor_id,
      vendorName: row.vendor_name,
      vendor_name: row.vendor_name,
      date: row.date,
      order_date: row.date,
      expectedDelivery: row.expected_delivery,
      expected_delivery: row.expected_delivery,
      amount: parseFloat(row.amount),
      total_amount: parseFloat(row.amount),
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      tax_amount: parseFloat(row.tax_amount),
      discountAmount: parseFloat(row.discount_amount),
      discount_amount: parseFloat(row.discount_amount),
      status: row.status,
      receiptStatus: row.receipt_status,
      receipt_status: row.receipt_status,
      paymentStatus: row.payment_status,
      payment_status: row.payment_status
    };

    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/purchase-orders/:id/receive — Receive Goods & Update Inventory
router.post('/:id/receive', async (req, res) => {
  const { id } = req.params;
  const {
    receipts, items: bodyItems, receivedBy, received_by,
    deliveryNoteNumber, delivery_note_number, notes, date
  } = req.body;

  const incomingItems = Array.isArray(receipts) ? receipts : (Array.isArray(bodyItems) ? bodyItems : []);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const poRes = await client.query('SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE', [id]);
    if (poRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }
    const po = poRes.rows[0];

    if (po.status === 'Draft' || po.status === 'Pending Approval') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Purchase order must be Approved and Ordered before receiving goods' });
    }

    if (po.status === 'Cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Cannot receive goods on a cancelled purchase order' });
    }

    // Fetch line items
    const itemsRes = await client.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [id]);
    const items = itemsRes.rows;

    if (incomingItems.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'No receipt quantities provided' });
    }

    const receiptId = `GR-${Date.now()}`;
    const receiptNumber = `GRN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const effectiveReceivedBy = receivedBy || received_by || 'Warehouse Staff';
    const effectiveDeliveryNote = deliveryNoteNumber || delivery_note_number || null;

    // Create Goods Receipt header
    await client.query(
      `INSERT INTO goods_receipts (id, receipt_number, purchase_order_id, po_number, date, received_by, delivery_note_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        receiptId, receiptNumber, id, po.po_number,
        date || new Date().toISOString().split('T')[0],
        effectiveReceivedBy, effectiveDeliveryNote, notes || null
      ]
    );

    let totalOrdered = 0;
    let totalReceived = 0;

    for (const item of items) {
      const match = incomingItems.find(r => 
        (r.itemId && Number(r.itemId) === Number(item.id)) ||
        (r.po_item_id && Number(r.po_item_id) === Number(item.id)) ||
        (r.productId && r.productId === item.product_id) ||
        (r.product_id && r.product_id === item.product_id) ||
        (r.productName && r.productName === item.product_name) ||
        (r.item_name && r.item_name === item.product_name)
      );

      const toReceive = match ? parseInt(
        match.receivedQty !== undefined ? match.receivedQty :
        (match.received_qty !== undefined ? match.received_qty :
        (match.quantityReceived !== undefined ? match.quantityReceived :
        (match.received_quantity !== undefined ? match.received_quantity : match.quantity))), 10
      ) || 0 : 0;
      const currentReceived = parseInt(item.received_quantity, 10) || 0;
      const orderedQty = parseInt(item.quantity, 10) || 0;

      // Prevent over-receiving
      if (toReceive > (orderedQty - currentReceived)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Cannot receive ${toReceive} units of ${item.product_name}. Maximum pending is ${orderedQty - currentReceived}.`
        });
      }

      const newReceived = currentReceived + toReceive;
      totalOrdered += orderedQty;
      totalReceived += newReceived;

      // Update line item received quantity
      if (toReceive > 0) {
        await client.query(
          `UPDATE purchase_order_items SET received_quantity = $1 WHERE id = $2`,
          [newReceived, item.id]
        );

        // Record Goods Receipt Item
        await client.query(
          `INSERT INTO goods_receipt_items (goods_receipt_id, product_id, product_name, quantity_received)
           VALUES ($1, $2, $3, $4)`,
          [receiptId, item.product_id || null, item.product_name, toReceive]
        );

        // Update Product Catalog Inventory Stock & Log Stock Movement Audit Entry
        let prodRow = null;
        if (item.product_id) {
          const pRes = await client.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
          if (pRes.rows.length > 0) prodRow = pRes.rows[0];
          await client.query(
            `UPDATE products SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [toReceive, item.product_id]
          );
        } else {
          const pRes = await client.query('SELECT * FROM products WHERE name ILIKE $1', [item.product_name]);
          if (pRes.rows.length > 0) prodRow = pRes.rows[0];
          await client.query(
            `UPDATE products SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP WHERE name ILIKE $2`,
            [toReceive, item.product_name]
          );
        }

        if (prodRow) {
          const prevStock = parseInt(prodRow.stock, 10) || 0;
          const newStockVal = prevStock + toReceive;
          const unitCost = parseFloat(prodRow.cost_price || item.unit_price) || 0;
          const smId = `SM-GRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await client.query(
            `INSERT INTO stock_movements 
               (id, product_id, product_name, sku, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, reference_number, source_location, destination_location, unit_cost, total_cost, reason, performed_by, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
            [
              smId, prodRow.id, prodRow.name, prodRow.sku, 'Purchase Receipt', toReceive,
              prevStock, newStockVal, 'Goods Receipt', receiptId, receiptNumber,
              `Vendor: ${po.vendor_name || 'Supplier'}`, prodRow.warehouse_location || 'Main Warehouse - Bay A',
              unitCost, (toReceive * unitCost), `Purchase Receipt from ${po.po_number}`,
              effectiveReceivedBy, notes || `PO ${po.po_number} Goods Inward`
            ]
          );
        }
      }
    }

    // Determine new status
    let newStatus = po.status;
    let newReceiptStatus = 'Not Received';

    if (totalReceived >= totalOrdered && totalOrdered > 0) {
      newStatus = 'Received';
      newReceiptStatus = 'Fully Received';
    } else if (totalReceived > 0) {
      newStatus = 'Partially Received';
      newReceiptStatus = 'Partially Received';
    }

    const updatedPo = await client.query(
      `UPDATE purchase_orders SET
         status = $1,
         receipt_status = $2,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [newStatus, newReceiptStatus, id]
    );

    await client.query('COMMIT');

    const poRow = updatedPo.rows[0];
    const poData = {
      ...poRow,
      poNumber: poRow.po_number,
      po_number: poRow.po_number,
      status: poRow.status,
      receiptStatus: poRow.receipt_status,
      receipt_status: poRow.receipt_status
    };

    res.json({
      success: true,
      data: {
        receipt: {
          id: receiptId,
          receiptNumber,
          receipt_number: receiptNumber
        },
        po: poData,
        purchaseOrder: poData,
        totalReceived,
        totalOrdered
      },
      message: `Goods receipt ${receiptNumber} processed successfully. Inventory updated.`
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// POST /api/purchase-orders/:id/invoice — Issue Vendor Invoice & Update Payables
router.post('/:id/invoice', async (req, res) => {
  const { id } = req.params;
  const {
    invoiceNumber, invoice_number, invoiceDate, invoice_date,
    dueDate, due_date, paymentTerms, payment_terms, amount, invoiceAmount, invoice_amount, notes
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const poRes = await client.query('SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE', [id]);
    if (poRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }
    const po = poRes.rows[0];

    if (po.status === 'Cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Cannot create a vendor invoice for a cancelled purchase order.' });
    }

    if (po.vendor_invoice_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `Vendor invoice ${po.vendor_invoice_number || po.vendor_invoice_id} is already linked to this purchase order.` });
    }

    const invNum = invoiceNumber || invoice_number || `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const effectiveInvoiceDate = invoiceDate || invoice_date || new Date().toISOString().split('T')[0];
    const effectiveTerms = paymentTerms || payment_terms || po.payment_terms || 'Net 30 Days';
    const effectiveDueDate = dueDate || due_date || calculateDueDateFromTerms(effectiveInvoiceDate, effectiveTerms);
    const effectiveAmount = parseFloat(invoiceAmount !== undefined ? invoiceAmount : (invoice_amount !== undefined ? invoice_amount : (amount !== undefined ? amount : po.amount))) || parseFloat(po.amount) || 0;

    const currentPaid = parseFloat(po.paid_amount) || 0;
    let newPaymentStatus = 'Unpaid';
    if (currentPaid >= effectiveAmount && effectiveAmount > 0) {
      newPaymentStatus = 'Paid';
    } else if (currentPaid > 0) {
      newPaymentStatus = 'Partially Paid';
    }

    // Update PO with invoice info
    await client.query(
      `UPDATE purchase_orders SET
         vendor_invoice_id = $1,
         vendor_invoice_number = $1,
         vendor_invoice_date = $2,
         vendor_invoice_due_date = $3,
         vendor_invoice_amount = $4,
         payment_terms = $5,
         payment_status = $6,
         notes = COALESCE($7, notes),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [invNum, effectiveInvoiceDate, effectiveDueDate, effectiveAmount, effectiveTerms, newPaymentStatus, notes || null, id]
    );

    // Update Vendor's payable balance (increment by unpaid invoice portion)
    const netPayableAddition = Math.max(0, effectiveAmount - currentPaid);
    if (po.vendor_id && netPayableAddition > 0) {
      await client.query(
        `UPDATE vendors SET 
           payable_balance = payable_balance + $1, 
           updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [netPayableAddition, po.vendor_id]
      );
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      data: {
        vendorInvoiceNumber: invNum,
        vendor_invoice_number: invNum,
        vendorInvoiceId: invNum,
        vendor_invoice_id: invNum,
        vendorInvoiceDate: effectiveInvoiceDate,
        vendor_invoice_date: effectiveInvoiceDate,
        vendorInvoiceDueDate: effectiveDueDate,
        vendor_invoice_due_date: effectiveDueDate,
        vendorInvoiceAmount: effectiveAmount,
        vendor_invoice_amount: effectiveAmount,
        amountDue: Math.max(0, effectiveAmount - currentPaid),
        amount_due: Math.max(0, effectiveAmount - currentPaid),
        paymentStatus: newPaymentStatus,
        payment_status: newPaymentStatus,
        purchaseOrderId: id,
        amount: effectiveAmount
      },
      message: `Vendor invoice ${invNum} created. Vendor payable balance updated.`
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// POST /api/purchase-orders/:id/payment — Record Vendor Payment & Update Accounts/Banking
router.post('/:id/payment', async (req, res) => {
  const { id } = req.params;
  const {
    amount, paymentAmount, payment_amount,
    paymentDate, payment_date,
    paymentMethod, payment_method,
    bankAccountId, bank_account_id, bankAccountName, bank_account_name,
    referenceNumber, reference_number, referenceNo, reference_no,
    notes
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const poRes = await client.query('SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE', [id]);
    if (poRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }
    const po = poRes.rows[0];

    if (po.status === 'Cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Cannot record payment for a cancelled purchase order.' });
    }

    const payAmt = parseFloat(paymentAmount !== undefined ? paymentAmount : (payment_amount !== undefined ? payment_amount : amount)) || 0;
    if (payAmt <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Please specify a valid payment amount greater than ₹0.' });
    }

    const totalInvoiceVal = parseFloat(po.vendor_invoice_amount !== null && po.vendor_invoice_amount !== undefined ? po.vendor_invoice_amount : po.amount) || 0;
    const alreadyPaid = parseFloat(po.paid_amount) || 0;
    const currentDue = Math.max(0, totalInvoiceVal - alreadyPaid);

    // Overpayment validation guard
    if (payAmt > currentDue + 0.01) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Payment of ₹${payAmt.toLocaleString('en-IN')} exceeds outstanding amount due (₹${currentDue.toLocaleString('en-IN')}).`
      });
    }

    const newPaidTotal = alreadyPaid + payAmt;
    const newAmountDue = Math.max(0, totalInvoiceVal - newPaidTotal);

    let newPaymentStatus = 'Unpaid';
    if (newAmountDue <= 0.01) {
      newPaymentStatus = 'Paid';
    } else if (newPaidTotal > 0) {
      newPaymentStatus = 'Partially Paid';
    }

    const paymentId = `PAY-${Date.now()}`;
    const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const effectivePayDate = paymentDate || payment_date || new Date().toISOString().split('T')[0];
    const effectivePayMethod = paymentMethod || payment_method || 'Bank Transfer';
    const effectiveRefNo = referenceNumber || reference_number || referenceNo || reference_no || `REF-${Date.now().toString().slice(-6)}`;
    const effectiveBankAccId = bankAccountId || bank_account_id || null;
    let effectiveBankAccName = bankAccountName || bank_account_name || null;

    // Record Payment in purchase_payments table
    await client.query(
      `INSERT INTO purchase_payments 
         (id, purchase_order_id, vendor_id, vendor_invoice_number, payment_number, 
          payment_date, amount, payment_method, bank_account_id, bank_account_name, reference_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        paymentId, id, po.vendor_id || null, po.vendor_invoice_number || null, paymentNumber,
        effectivePayDate, payAmt, effectivePayMethod, effectiveBankAccId, effectiveBankAccName, effectiveRefNo, notes || null
      ]
    );

    // Update Purchase Order master
    await client.query(
      `UPDATE purchase_orders SET
         paid_amount = $1,
         payment_status = $2,
         last_payment_date = $3,
         last_payment_reference = $4,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [newPaidTotal, newPaymentStatus, effectivePayDate, effectiveRefNo, id]
    );

    // Update Vendor's Accounts Payable balance
    if (po.vendor_id) {
      await client.query(
        `UPDATE vendors SET 
           payable_balance = GREATEST(0, payable_balance - $1), 
           updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [payAmt, po.vendor_id]
      );
    }

    // Real Banking Integration with HRMS Bank Accounts
    if (effectiveBankAccId) {
      try {
        const bankCheck = await hrmsPool.query('SELECT * FROM bank_accounts WHERE id = $1', [effectiveBankAccId]);
        if (bankCheck.rows.length > 0) {
          effectiveBankAccName = bankCheck.rows[0].bank_name;
          await hrmsPool.query('UPDATE bank_accounts SET balance = balance - $1 WHERE id = $2', [payAmt, effectiveBankAccId]);
          await hrmsPool.query(
            `INSERT INTO bank_transactions (id, bank_account_id, txn_date, reference_no, description, type, amount, running_balance)
             VALUES ($1, $2, $3, $4, $5, 'DEBIT', $6, (SELECT balance FROM bank_accounts WHERE id = $2))`,
            [
              `TXN-PAY-${Date.now()}`,
              effectiveBankAccId,
              effectivePayDate,
              effectiveRefNo,
              `Vendor Payment - ${po.vendor_name || 'Supplier'} (PO: ${po.po_number || id}, Inv: ${po.vendor_invoice_number || 'N/A'})`,
              payAmt
            ]
          );
        }
      } catch (bankErr) {
        console.warn('⚠️ [Banking Integration Note]:', bankErr.message);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        paymentId,
        paymentNumber,
        payment_number: paymentNumber,
        paidAmount: newPaidTotal,
        paid_amount: newPaidTotal,
        amountDue: newAmountDue,
        amount_due: newAmountDue,
        paymentStatus: newPaymentStatus,
        payment_status: newPaymentStatus,
        lastPaymentDate: effectivePayDate,
        last_payment_date: effectivePayDate,
        lastPaymentReference: effectiveRefNo,
        last_payment_reference: effectiveRefNo,
        vendorInvoiceNumber: po.vendor_invoice_number
      },
      message: `Payment of ₹${payAmt.toLocaleString('en-IN')} recorded successfully (Ref: ${effectiveRefNo}).`
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/purchase-orders/:id — Delete PO (only Draft allowed)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const poRes = await pool.query('SELECT status FROM purchase_orders WHERE id = $1', [id]);
    if (poRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    const po = poRes.rows[0];
    if (po.status !== 'Draft') {
      return res.status(400).json({ success: false, message: `Cannot delete purchase order in ${po.status} status. Only Draft POs can be deleted.` });
    }

    await pool.query('DELETE FROM purchase_orders WHERE id = $1', [id]);
    res.json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
