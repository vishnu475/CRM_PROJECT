import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// Helper to compute stock metrics
function computeStockStatus(stock, reserved, reorderLevel) {
  const onHand = Number(stock) || 0;
  const res = Number(reserved) || 0;
  const available = Math.max(0, onHand - res);
  const reorder = Number(reorderLevel) || 20;

  let status = 'In Stock';
  if (available <= 0) {
    status = 'Out of Stock';
  } else if (available <= reorder) {
    status = 'Low Stock';
  }

  return {
    onHandStock: onHand,
    reservedStock: res,
    availableStock: available,
    stockStatus: status,
  };
}

// GET /api/crm/products — Fetch products with live stock, reservation, and valuation aggregation
router.get('/', async (req, res) => {
  try {
    const { category, stockStatus, search } = req.query;
    let query = `
      SELECT 
        p.*,
        v.name AS primary_vendor_name_resolved,
        COALESCE(res_stats.reserved_stock, 0) AS reserved_stock,
        COALESCE(sm_stats.movements_count, 0) AS movements_count
      FROM products p
      LEFT JOIN vendors v ON p.primary_vendor_id = v.id
      LEFT JOIN (
        SELECT 
          soi.product_id,
          SUM(soi.quantity) AS reserved_stock
        FROM sales_order_items soi
        JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE so.status != 'Cancelled' 
          AND COALESCE(so.fulfillment_status, 'Pending') != 'Fulfilled'
          AND soi.product_id IS NOT NULL
        GROUP BY soi.product_id
      ) res_stats ON p.id = res_stats.product_id
      LEFT JOIN (
        SELECT 
          sm.product_id,
          COUNT(*) AS movements_count
        FROM stock_movements sm
        GROUP BY sm.product_id
      ) sm_stats ON p.id = sm_stats.product_id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR COALESCE(p.category, '') ILIKE $${params.length} OR COALESCE(p.description, '') ILIKE $${params.length})`;
    }

    query += ` ORDER BY p.name ASC`;
    const result = await pool.query(query, params);

    const enriched = result.rows.map(row => {
      const onHand = parseInt(row.stock, 10) || 0;
      const reserved = parseInt(row.reserved_stock, 10) || 0;
      const reorderLevel = parseInt(row.reorder_level, 10) || 20;
      const metrics = computeStockStatus(onHand, reserved, reorderLevel);

      const costPrice = parseFloat(row.cost_price) || 0;
      const purchasePrice = parseFloat(row.purchase_price) || 0;
      const salesPrice = parseFloat(row.price) || 0;
      const unitValuation = costPrice > 0 ? costPrice : (purchasePrice > 0 ? purchasePrice : salesPrice);
      const inventoryValue = onHand * unitValuation;

      return {
        ...row,
        id: row.id,
        sku: row.sku,
        name: row.name,
        category: row.category || 'General',
        price: salesPrice,
        costPrice,
        cost_price: costPrice,
        purchasePrice,
        purchase_price: purchasePrice,
        stock: onHand,
        onHandStock: onHand,
        on_hand_stock: onHand,
        reservedStock: reserved,
        reserved_stock: reserved,
        availableStock: metrics.availableStock,
        available_stock: metrics.availableStock,
        reorderLevel,
        reorder_level: reorderLevel,
        reorderQuantity: parseInt(row.reorder_quantity, 10) || 50,
        reorder_quantity: parseInt(row.reorder_quantity, 10) || 50,
        stockStatus: metrics.stockStatus,
        stock_status: metrics.stockStatus,
        inventoryValue,
        inventory_value: inventoryValue,
        uom: row.uom || 'Units',
        hsnCode: row.hsn_code || '',
        hsn_code: row.hsn_code || '',
        taxRate: parseFloat(row.tax_rate) || 18,
        tax_rate: parseFloat(row.tax_rate) || 18,
        description: row.description || '',
        warehouseLocation: row.warehouse_location || 'Main Warehouse - Bay A',
        warehouse_location: row.warehouse_location || 'Main Warehouse - Bay A',
        primaryVendorId: row.primary_vendor_id || '',
        primary_vendor_id: row.primary_vendor_id || '',
        primaryVendorName: row.primary_vendor_name || row.primary_vendor_name_resolved || '',
        primary_vendor_name: row.primary_vendor_name || row.primary_vendor_name_resolved || '',
        movementsCount: parseInt(row.movements_count, 10) || 0,
        movements_count: parseInt(row.movements_count, 10) || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    let finalData = enriched;
    if (stockStatus && stockStatus !== 'All') {
      finalData = finalData.filter(p => p.stockStatus === stockStatus);
    }

    res.json({ success: true, data: finalData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/crm/products/movements — All global stock movements
router.get('/movements/all', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const result = await pool.query(
      `SELECT sm.*, p.category, p.uom
       FROM stock_movements sm
       LEFT JOIN products p ON sm.product_id = p.id
       ORDER BY sm.created_at DESC
       LIMIT $1`,
      [Number(limit)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/crm/products/:id — Single product with stock summary, movements history & linked supply/sales
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prodRes = await pool.query(
      `SELECT p.*, v.name AS primary_vendor_name_resolved
       FROM products p
       LEFT JOIN vendors v ON p.primary_vendor_id = v.id
       WHERE p.id = $1`,
      [id]
    );

    if (prodRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const row = prodRes.rows[0];

    // Compute reserved stock
    const resRes = await pool.query(
      `SELECT COALESCE(SUM(soi.quantity), 0) AS reserved_stock
       FROM sales_order_items soi
       JOIN sales_orders so ON soi.sales_order_id = so.id
       WHERE soi.product_id = $1
         AND so.status != 'Cancelled'
         AND COALESCE(so.fulfillment_status, 'Pending') != 'Fulfilled'`,
      [id]
    );
    const reserved = parseInt(resRes.rows[0]?.reserved_stock, 10) || 0;
    const onHand = parseInt(row.stock, 10) || 0;
    const reorderLevel = parseInt(row.reorder_level, 10) || 20;
    const metrics = computeStockStatus(onHand, reserved, reorderLevel);

    const costPrice = parseFloat(row.cost_price) || 0;
    const purchasePrice = parseFloat(row.purchase_price) || 0;
    const salesPrice = parseFloat(row.price) || 0;
    const unitValuation = costPrice > 0 ? costPrice : (purchasePrice > 0 ? purchasePrice : salesPrice);
    const inventoryValue = onHand * unitValuation;

    // Fetch stock movements history
    const movementsRes = await pool.query(
      `SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [id]
    );

    // Fetch linked purchase order items
    const poRes = await pool.query(
      `SELECT poi.*, po.po_number, po.date AS po_date, po.status AS po_status, po.vendor_name, po.receipt_status
       FROM purchase_order_items poi
       JOIN purchase_orders po ON poi.purchase_order_id = po.id
       WHERE poi.product_id = $1
       ORDER BY po.created_at DESC LIMIT 20`,
      [id]
    );

    // Fetch linked sales order items
    const soRes = await pool.query(
      `SELECT soi.*, so.so_number, so.date AS so_date, so.status AS so_status, so.customer_name, so.fulfillment_status
       FROM sales_order_items soi
       JOIN sales_orders so ON soi.sales_order_id = so.id
       WHERE soi.product_id = $1
       ORDER BY so.created_at DESC LIMIT 20`,
      [id]
    );

    const product = {
      ...row,
      id: row.id,
      sku: row.sku,
      name: row.name,
      category: row.category || 'General',
      price: salesPrice,
      costPrice,
      cost_price: costPrice,
      purchasePrice,
      purchase_price: purchasePrice,
      stock: onHand,
      onHandStock: onHand,
      on_hand_stock: onHand,
      reservedStock: reserved,
      reserved_stock: reserved,
      availableStock: metrics.availableStock,
      available_stock: metrics.availableStock,
      reorderLevel,
      reorder_level: reorderLevel,
      reorderQuantity: parseInt(row.reorder_quantity, 10) || 50,
      reorder_quantity: parseInt(row.reorder_quantity, 10) || 50,
      stockStatus: metrics.stockStatus,
      stock_status: metrics.stockStatus,
      inventoryValue,
      inventory_value: inventoryValue,
      uom: row.uom || 'Units',
      hsnCode: row.hsn_code || '',
      hsn_code: row.hsn_code || '',
      taxRate: parseFloat(row.tax_rate) || 18,
      tax_rate: parseFloat(row.tax_rate) || 18,
      description: row.description || '',
      warehouseLocation: row.warehouse_location || 'Main Warehouse - Bay A',
      warehouse_location: row.warehouse_location || 'Main Warehouse - Bay A',
      primaryVendorId: row.primary_vendor_id || '',
      primary_vendor_id: row.primary_vendor_id || '',
      primaryVendorName: row.primary_vendor_name || row.primary_vendor_name_resolved || '',
      primary_vendor_name: row.primary_vendor_name || row.primary_vendor_name_resolved || '',
      movements: movementsRes.rows,
      purchaseOrders: poRes.rows,
      salesOrders: soRes.rows,
    };

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crm/products — Add product to CRM database with initial opening stock transaction
router.post('/', async (req, res) => {
  const {
    id, sku, name, category, price, costPrice, cost_price, purchasePrice, purchase_price,
    stock, initialStock, initial_stock, uom, hsnCode, hsn_code, taxRate, tax_rate,
    reorderLevel, reorder_level, reorderQuantity, reorder_quantity,
    description, warehouseLocation, warehouse_location, primaryVendorId, primary_vendor_id, primaryVendorName, primary_vendor_name
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const prodId = id || `PROD-${Date.now()}`;
    const generatedSku = sku || `SKU-${Date.now().toString().slice(-6)}`;
    const effectiveStock = parseInt(stock !== undefined ? stock : (initialStock !== undefined ? initialStock : (initial_stock !== undefined ? initial_stock : 0)), 10) || 0;
    const effectivePrice = parseFloat(price) || 0;
    const effectiveCostPrice = parseFloat(costPrice !== undefined ? costPrice : (cost_price !== undefined ? cost_price : (effectivePrice * 0.7))) || 0;
    const effectivePurchasePrice = parseFloat(purchasePrice !== undefined ? purchasePrice : (purchase_price !== undefined ? purchase_price : (effectivePrice * 0.75))) || 0;
    const effectiveReorderLevel = parseInt(reorderLevel !== undefined ? reorderLevel : (reorder_level !== undefined ? reorder_level : 20), 10);
    const effectiveReorderQty = parseInt(reorderQuantity !== undefined ? reorderQuantity : (reorder_quantity !== undefined ? reorder_quantity : 50), 10);
    const effectiveLocation = warehouseLocation || warehouse_location || 'Main Warehouse - Bay A';
    const effectiveVendorId = primaryVendorId || primary_vendor_id || null;
    let effectiveVendorName = primaryVendorName || primary_vendor_name || null;

    if (effectiveVendorId && !effectiveVendorName) {
      const vRes = await client.query('SELECT name FROM vendors WHERE id = $1', [effectiveVendorId]);
      if (vRes.rows.length > 0) effectiveVendorName = vRes.rows[0].name;
    }

    const prodResult = await client.query(
      `INSERT INTO products 
         (id, sku, name, category, price, cost_price, purchase_price, stock, uom, hsn_code, tax_rate, reorder_level, reorder_quantity, description, warehouse_location, primary_vendor_id, primary_vendor_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) 
       RETURNING *`,
      [
        prodId, generatedSku, name, category || 'General', effectivePrice,
        effectiveCostPrice, effectivePurchasePrice, effectiveStock, uom || 'Units',
        hsnCode || hsn_code || null, taxRate || tax_rate || 18,
        effectiveReorderLevel, effectiveReorderQty, description || null,
        effectiveLocation, effectiveVendorId, effectiveVendorName
      ]
    );

    // If opening stock > 0, log opening stock movement
    if (effectiveStock > 0) {
      const smId = `SM-OP-${Date.now()}`;
      await client.query(
        `INSERT INTO stock_movements 
           (id, product_id, product_name, sku, movement_type, quantity, previous_stock, new_stock, reference_type, reference_number, source_location, destination_location, unit_cost, total_cost, reason, performed_by, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          smId, prodId, name, generatedSku, 'Opening Stock', effectiveStock,
          0, effectiveStock, 'Opening Stock', `OP-${generatedSku}`,
          'Initial Setup', effectiveLocation, effectiveCostPrice,
          (effectiveStock * effectiveCostPrice), 'Initial Product Master Opening Stock',
          'System Administrator', 'Opening stock registered during product creation'
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: prodResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/crm/products/:id — Update product specifications
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name, sku, category, price, costPrice, cost_price, purchasePrice, purchase_price,
    stock, uom, hsnCode, hsn_code, taxRate, tax_rate,
    reorderLevel, reorder_level, reorderQuantity, reorder_quantity,
    description, warehouseLocation, warehouse_location, primaryVendorId, primary_vendor_id, primaryVendorName, primary_vendor_name
  } = req.body;

  try {
    const existingRes = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const effectiveCost = costPrice !== undefined ? costPrice : cost_price;
    const effectivePurch = purchasePrice !== undefined ? purchasePrice : purchase_price;
    const effectiveReorder = reorderLevel !== undefined ? reorderLevel : reorder_level;
    const effectiveReorderQty = reorderQuantity !== undefined ? reorderQuantity : reorder_quantity;
    const effectiveHsn = hsnCode !== undefined ? hsnCode : hsn_code;
    const effectiveTax = taxRate !== undefined ? taxRate : tax_rate;
    const effectiveLoc = warehouseLocation !== undefined ? warehouseLocation : warehouse_location;
    const effectiveVId = primaryVendorId !== undefined ? primaryVendorId : primary_vendor_id;
    let effectiveVName = primaryVendorName !== undefined ? primaryVendorName : primary_vendor_name;

    if (effectiveVId && !effectiveVName) {
      const vRes = await pool.query('SELECT name FROM vendors WHERE id = $1', [effectiveVId]);
      if (vRes.rows.length > 0) effectiveVName = vRes.rows[0].name;
    }

    const result = await pool.query(
      `UPDATE products SET
         name = COALESCE($2, name),
         sku = COALESCE($3, sku),
         category = COALESCE($4, category),
         price = COALESCE($5, price),
         cost_price = COALESCE($6, cost_price),
         purchase_price = COALESCE($7, purchase_price),
         stock = COALESCE($8, stock),
         uom = COALESCE($9, uom),
         hsn_code = COALESCE($10, hsn_code),
         tax_rate = COALESCE($11, tax_rate),
         reorder_level = COALESCE($12, reorder_level),
         reorder_quantity = COALESCE($13, reorder_quantity),
         description = COALESCE($14, description),
         warehouse_location = COALESCE($15, warehouse_location),
         primary_vendor_id = COALESCE($16, primary_vendor_id),
         primary_vendor_name = COALESCE($17, primary_vendor_name),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [
        id, name, sku, category, price, effectiveCost, effectivePurch,
        stock, uom, effectiveHsn, effectiveTax, effectiveReorder,
        effectiveReorderQty, description, effectiveLoc, effectiveVId, effectiveVName
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/crm/products/:id/adjust — Controlled stock adjustment with audit logging
router.post('/:id/adjust', async (req, res) => {
  const { id } = req.params;
  const {
    adjustmentQuantity, adjustment_quantity, quantity,
    reason, notes, performedBy, performed_by, location
  } = req.body;

  const adjQty = parseInt(adjustmentQuantity !== undefined ? adjustmentQuantity : (adjustment_quantity !== undefined ? adjustment_quantity : quantity), 10);
  if (isNaN(adjQty) || adjQty === 0) {
    return res.status(400).json({ success: false, message: 'Please provide a non-zero adjustment quantity.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [id]);
    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    const product = prodRes.rows[0];
    const prevStock = parseInt(product.stock, 10) || 0;
    const newStock = prevStock + adjQty;

    // Guard against negative stock
    if (newStock < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Adjustment of ${adjQty} units rejected. Current on-hand stock is ${prevStock}. Inventory cannot be negative.`
      });
    }

    // Update product stock
    const updatedProd = await client.query(
      `UPDATE products SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [newStock, id]
    );

    // Record stock movement
    const smId = `SM-ADJ-${Date.now()}`;
    const adjNumber = `ADJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const effectiveReason = reason || (adjQty > 0 ? 'Stock Inward Adjustment' : 'Damaged Goods / Scrap');
    const unitCost = parseFloat(product.cost_price) || parseFloat(product.price) || 0;

    await client.query(
      `INSERT INTO stock_movements 
         (id, product_id, product_name, sku, movement_type, quantity, previous_stock, new_stock, reference_type, reference_number, source_location, destination_location, unit_cost, total_cost, reason, performed_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        smId, id, product.name, product.sku, 'Adjustment', adjQty,
        prevStock, newStock, 'Adjustment', adjNumber,
        adjQty < 0 ? (location || product.warehouse_location) : 'Audit Reconciliation',
        adjQty > 0 ? (location || product.warehouse_location) : 'Write-off / Scrap',
        unitCost, Math.abs(adjQty * unitCost), effectiveReason,
        performedBy || performed_by || 'Warehouse Supervisor', notes || null
      ]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      data: updatedProd.rows[0],
      movementId: smId,
      referenceNumber: adjNumber,
      message: `Stock successfully adjusted from ${prevStock} to ${newStock} units (${adjQty > 0 ? '+' : ''}${adjQty}).`
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/crm/products/:id — Soft or safe delete product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if linked to purchase order items
    const poItems = await pool.query('SELECT id FROM purchase_order_items WHERE product_id = $1 LIMIT 1', [id]);
    if (poItems.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product linked to historical Purchase Orders. Archive or adjust stock to 0 instead.'
      });
    }

    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
