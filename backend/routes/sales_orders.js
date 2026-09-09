import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/sales-orders — Fetch all sales orders with item count and invoice linkage
router.get('/', async (req, res) => {
  try {
    const { fulfillmentStatus, status, customerId, quotationId } = req.query;
    let query = `
      SELECT 
        so.*, 
        COUNT(soi.id) as items_count,
        q.quote_number,
        q.status as quotation_status,
        inv.id as invoice_id,
        inv.invoice_number
      FROM sales_orders so
      LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
      LEFT JOIN quotations q ON so.quotation_id = q.id
      LEFT JOIN crm_invoices inv ON so.id = inv.sales_order_id
      WHERE 1=1
    `;
    const params = [];

    if (fulfillmentStatus && fulfillmentStatus !== 'All') {
      params.push(fulfillmentStatus);
      query += ` AND so.fulfillment_status = $${params.length}`;
    }
    if (status && status !== 'All') {
      params.push(status);
      query += ` AND so.status = $${params.length}`;
    }
    if (customerId) { 
      params.push(customerId); 
      query += ` AND so.customer_id = $${params.length}`; 
    }
    if (quotationId) {
      params.push(quotationId);
      query += ` AND so.quotation_id = $${params.length}`;
    }

    query += ` GROUP BY so.id, q.quote_number, q.status, inv.id, inv.invoice_number ORDER BY so.created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sales-orders/:id — Fetch single sales order with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const soRes = await pool.query(
      `SELECT so.*, q.quote_number, q.status as quotation_status, inv.id as invoice_id, inv.invoice_number
       FROM sales_orders so
       LEFT JOIN quotations q ON so.quotation_id = q.id
       LEFT JOIN crm_invoices inv ON so.id = inv.sales_order_id
       WHERE so.id = $1`,
      [id]
    );
    if (soRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sales Order not found' });
    }

    const itemsRes = await pool.query(
      `SELECT * FROM sales_order_items WHERE sales_order_id = $1 ORDER BY id ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...soRes.rows[0],
        items: itemsRes.rows,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/sales-orders — Create sales order with strict workflow & duplicate prevention
router.post('/', async (req, res) => {
  const { 
    id, 
    soNumber, 
    quotationId, 
    customerId, 
    customerName, 
    opportunityId,
    contactId,
    date, 
    totalAmount, 
    subtotal,
    taxAmount,
    discountAmount,
    fulfillmentStatus, 
    status,
    paymentTerms,
    deliveryNotes,
    notes,
    items 
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. If linked to quotation, perform strict validation
    if (quotationId) {
      const quoteRes = await client.query('SELECT * FROM quotations WHERE id = $1', [quotationId]);
      if (quoteRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: 'Quotation not found.' 
        });
      }

      const quote = quoteRes.rows[0];

      // Strict lifecycle rule: Quotation MUST be Accepted or Approved
      if (quote.status !== 'Accepted' && quote.status !== 'Approved') {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `Cannot create Sales Order from quotation in "${quote.status}" status. Only Accepted quotations can be converted.` 
        });
      }

      // Duplicate prevention: check if a Sales Order already exists for this quotation
      const existingSoRes = await client.query('SELECT id, so_number FROM sales_orders WHERE quotation_id = $1', [quotationId]);
      if (existingSoRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `A Sales Order (${existingSoRes.rows[0].so_number}) already exists for this quotation. Duplicate creation is blocked.`,
          existingSalesOrderId: existingSoRes.rows[0].id,
          existingSoNumber: existingSoRes.rows[0].so_number
        });
      }
    }

    const soId = id || `SO-${Date.now()}`;
    const soNum = soNumber || `SO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const effectiveStatus = status || 'Confirmed';

    const soRes = await client.query(
      `INSERT INTO sales_orders (
        id, so_number, quotation_id, customer_id, customer_name, opportunity_id, 
        contact_id, date, total_amount, subtotal, tax_amount, discount_amount, 
        fulfillment_status, status, payment_terms, delivery_notes, notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [
        soId, 
        soNum, 
        quotationId || null, 
        customerId, 
        customerName, 
        opportunityId || null,
        contactId || null,
        date || new Date().toISOString().split('T')[0], 
        parseFloat(totalAmount) || 0, 
        parseFloat(subtotal) || 0,
        parseFloat(taxAmount) || 0,
        parseFloat(discountAmount) || 0,
        fulfillmentStatus || 'Pending',
        effectiveStatus,
        paymentTerms || 'Standard 30 days',
        deliveryNotes || '',
        notes || ''
      ]
    );

    // If explicit items passed, use them; otherwise if quotationId passed, copy items from quotation
    let lineItemsToInsert = items;
    if ((!lineItemsToInsert || lineItemsToInsert.length === 0) && quotationId) {
      const qItemsRes = await client.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [quotationId]);
      lineItemsToInsert = qItemsRes.rows.map(qi => ({
        productId: qi.product_id,
        productName: qi.product_name,
        quantity: qi.quantity,
        unitPrice: qi.unit_price,
        taxRate: qi.tax_rate,
        total: qi.total
      }));
    }

    if (lineItemsToInsert && Array.isArray(lineItemsToInsert)) {
      for (const item of lineItemsToInsert) {
        await client.query(
          `INSERT INTO sales_order_items (sales_order_id, product_id, product_name, quantity, unit_price, tax_rate, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            soId, 
            item.productId || null, 
            item.productName || 'Custom Line Item', 
            item.quantity || 1, 
            item.unitPrice || 0, 
            item.taxRate !== undefined ? item.taxRate : 18, 
            item.total || 0
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: soRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/sales-orders/:id — Update fulfillment status or order status
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { fulfillmentStatus, status, totalAmount, paymentTerms, deliveryNotes, notes } = req.body;
  try {
    const existingRes = await pool.query('SELECT * FROM sales_orders WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }

    // If transitioning to Fulfilled, issue stock from inventory and log Sales Issue movement
    if (fulfillmentStatus === 'Fulfilled' && existingRes.rows[0].fulfillment_status !== 'Fulfilled') {
      const itemsRes = await pool.query('SELECT * FROM sales_order_items WHERE sales_order_id = $1', [id]);
      for (const item of itemsRes.rows) {
        let prodRow = null;
        if (item.product_id) {
          const pRes = await pool.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
          if (pRes.rows.length > 0) prodRow = pRes.rows[0];
        } else if (item.product_name) {
          const pRes = await pool.query('SELECT * FROM products WHERE name ILIKE $1', [item.product_name]);
          if (pRes.rows.length > 0) prodRow = pRes.rows[0];
        }

        if (prodRow) {
          const prevStock = parseInt(prodRow.stock, 10) || 0;
          const qtyToDeduct = parseInt(item.quantity, 10) || 0;
          const newStockVal = Math.max(0, prevStock - qtyToDeduct);
          
          await pool.query('UPDATE products SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStockVal, prodRow.id]);
          
          const smId = `SM-SO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const unitCost = parseFloat(prodRow.cost_price || prodRow.price) || 0;
          await pool.query(
            `INSERT INTO stock_movements 
               (id, product_id, product_name, sku, movement_type, quantity, previous_stock, new_stock, reference_type, reference_id, reference_number, source_location, destination_location, unit_cost, total_cost, reason, performed_by, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
            [
              smId, prodRow.id, prodRow.name, prodRow.sku, 'Sales Issue', -qtyToDeduct,
              prevStock, newStockVal, 'Sales Order', id, existingRes.rows[0].so_number,
              prodRow.warehouse_location || 'Main Warehouse - Bay A', `Customer: ${existingRes.rows[0].customer_name || 'Client'}`,
              unitCost, (qtyToDeduct * unitCost), `Order Delivery for ${existingRes.rows[0].so_number}`,
              'Fulfillment Dispatcher', deliveryNotes || 'Sales order fulfilled and inventory issued'
            ]
          );
        }
      }
    }

    const result = await pool.query(
      `UPDATE sales_orders SET
         fulfillment_status = COALESCE($2, fulfillment_status),
         status = COALESCE($3, status),
         total_amount = COALESCE($4, total_amount),
         payment_terms = COALESCE($5, payment_terms),
         delivery_notes = COALESCE($6, delivery_notes),
         notes = COALESCE($7, notes),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, fulfillmentStatus, status, totalAmount, paymentTerms, deliveryNotes, notes]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/sales-orders/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if linked to active Invoice
    const linkedInv = await pool.query('SELECT id, invoice_number FROM crm_invoices WHERE sales_order_id = $1', [id]);
    if (linkedInv.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete Sales Order. It is linked to Invoice ${linkedInv.rows[0].invoice_number}.` 
      });
    }

    const result = await pool.query('DELETE FROM sales_orders WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Sales order not found' });
    res.json({ success: true, message: 'Sales order deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
