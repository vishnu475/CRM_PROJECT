const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000${path}`);
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 STEP 23 VERIFICATION: INVENTORY & STOCK MANAGEMENT SYSTEM');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function getData(res) {
    if (res && res.data && res.data.data !== undefined) return res.data.data;
    return res.data;
  }

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // ------------------------------------------------------------------------
    // 1. Check Global Products & Stock Aggregations
    // ------------------------------------------------------------------------
    console.log('Test 1: Fetch all products with Stock & Valuation Aggregations');
    const productsRes = await request('GET', '/api/crm/products');
    assert(productsRes.status === 200, 'GET /api/crm/products returns 200');
    const productList = productsRes.data.data || productsRes.data;
    assert(Array.isArray(productList), 'Products response is an array');
    assert(productList.length > 0, 'Products list is non-empty');

    const sampleProduct = productList[0];
    assert(sampleProduct.on_hand_stock !== undefined, 'Product has on_hand_stock');
    assert(sampleProduct.reserved_stock !== undefined, 'Product has reserved_stock');
    assert(sampleProduct.available_stock !== undefined, 'Product has available_stock');
    assert(sampleProduct.stock_status !== undefined, 'Product has stock_status');
    assert(sampleProduct.inventory_value !== undefined, 'Product has inventory_value');
    console.log(`     Sample: ${sampleProduct.name} (${sampleProduct.sku}) | On-Hand: ${sampleProduct.on_hand_stock} | Reserved: ${sampleProduct.reserved_stock} | Available: ${sampleProduct.available_stock} | Status: ${sampleProduct.stock_status} | Value: ₹${sampleProduct.inventory_value}`);

    // ------------------------------------------------------------------------
    // 2. Create a New Product (Master creation with Opening Stock)
    // ------------------------------------------------------------------------
    console.log('\nTest 2: Create a New Product with SKU and Opening Stock');
    const testSku = `SKU-TEST-${Date.now().toString().slice(-4)}`;
    const createProductPayload = {
      sku: testSku,
      name: `Automated Test Enterprise Server ${testSku}`,
      category: 'Hardware',
      price: 150000,
      cost_price: 110000,
      purchase_price: 105000,
      stock: 50, // opening stock
      reorder_level: 15,
      reorder_quantity: 25,
      warehouse_location: 'Bengaluru DC - Rack B4',
      description: 'High-performance dual Xeon server for enterprise workload',
      primary_vendor_name: 'Dell Technologies India',
    };

    const createRes = await request('POST', '/api/crm/products', createProductPayload);
    assert(createRes.status === 201, 'POST /api/crm/products creates new product (201)');
    const createdProd = getData(createRes);
    assert(createdProd.id !== undefined, 'Created product has ID');
    assert(Number(createdProd.stock) === 50, 'Opening stock is 50');
    assert(createdProd.sku === testSku, 'Product SKU is preserved');

    // ------------------------------------------------------------------------
    // 3. Verify Opening Stock Movement Was Logged
    // ------------------------------------------------------------------------
    console.log('\nTest 3: Verify Opening Stock audit trail in Stock Movements');
    const detailsRes = await request('GET', `/api/crm/products/${createdProd.id}`);
    assert(detailsRes.status === 200, 'GET /api/crm/products/:id returns 200');
    const prodDetailsData = getData(detailsRes);
    assert(Array.isArray(prodDetailsData.movements), 'Product details include movements history');
    const openingMovement = prodDetailsData.movements.find(m => m.movement_type === 'Opening Stock');
    assert(!!openingMovement, 'Opening Stock movement record exists');
    assert(Number(openingMovement.quantity) === 50, 'Opening Stock movement quantity is +50');
    assert(openingMovement.destination_location === 'Bengaluru DC - Rack B4', 'Destination location recorded');

    // ------------------------------------------------------------------------
    // 4. Test Controlled Stock Adjustment
    // ------------------------------------------------------------------------
    console.log('\nTest 4: Controlled Stock Adjustment (+10 units for audit reconciliation)');
    const adjustRes1 = await request('POST', `/api/crm/products/${createdProd.id}/adjust`, {
      adjustmentQuantity: 10,
      reason: 'Physical Count Reconciliation',
      notes: 'Discovered 10 units in overflow storage',
      performedBy: 'Inventory Manager',
      location: 'Bengaluru DC - Rack B4',
    });
    assert(adjustRes1.status === 200, 'Stock adjustment (+10) succeeded');
    const adjust1Data = getData(adjustRes1);
    assert(adjust1Data.stock === 60, 'New on-hand stock is 60 (50 + 10)');

    console.log('\nTest 5: Controlled Stock Adjustment (-5 units for damaged goods)');
    const adjustRes2 = await request('POST', `/api/crm/products/${createdProd.id}/adjust`, {
      adjustmentQuantity: -5,
      reason: 'Damaged in Transit / Storage',
      notes: 'Water damage in rack shelf',
      performedBy: 'Quality Inspector',
      location: 'Bengaluru DC - Rack B4',
    });
    assert(adjustRes2.status === 200, 'Stock adjustment (-5) succeeded');
    const adjust2Data = getData(adjustRes2);
    assert(adjust2Data.stock === 55, 'New on-hand stock is 55 (60 - 5)');

    // ------------------------------------------------------------------------
    // 6. Test Negative Stock Prevention
    // ------------------------------------------------------------------------
    console.log('\nTest 6: Negative Stock Prevention on Adjustment');
    const adjustResNegative = await request('POST', `/api/crm/products/${createdProd.id}/adjust`, {
      adjustmentQuantity: -100, // exceeds 55
      reason: 'Excessive Deduct Test',
      performedBy: 'QA Bot',
    });
    assert(adjustResNegative.status === 400, 'Negative stock adjustment is blocked (400)');
    assert((adjustResNegative.data.message || '').includes('Inventory cannot be negative') || (adjustResNegative.data.message || '').includes('rejected'), 'Returns clear rejection error message');

    // ------------------------------------------------------------------------
    // 7. Purchase Order -> Goods Receipt Integration
    // ------------------------------------------------------------------------
    console.log('\nTest 7: Purchase Order & Goods Receipt (GRN) -> Stock In flow');
    // First find or create vendor
    const vendorsRes = await request('GET', '/api/vendors');
    let vendorId = 'VEND-001';
    let vendorName = 'Dell Technologies India';
    const vendorsData = getData(vendorsRes);
    if (vendorsRes.status === 200 && Array.isArray(vendorsData) && vendorsData.length > 0) {
      vendorId = vendorsData[0].id;
      vendorName = vendorsData[0].name;
    }

    // Create PO for 100 units of createdProd with status Ordered
    const poPayload = {
      vendorId,
      vendorName,
      status: 'Ordered',
      expectedDeliveryDate: '2026-09-30',
      currency: 'INR',
      items: [
        {
          productId: createdProd.id,
          productName: createdProd.name,
          sku: createdProd.sku,
          orderedQty: 100,
          quantity: 100,
          unitPrice: 105000,
          totalPrice: 10500000,
        },
      ],
      paymentTerms: 'Net 30',
      notes: 'Test PO for Inventory Receiving Flow',
    };

    const poRes = await request('POST', '/api/purchase-orders', poPayload);
    assert(poRes.status === 201, 'Purchase Order created (201)');
    const createdPO = getData(poRes);

    // Verify inventory did NOT increase simply upon PO creation
    const checkStockAfterPO = await request('GET', `/api/crm/products/${createdProd.id}`);
    const checkStockAfterPOData = getData(checkStockAfterPO);
    assert(checkStockAfterPOData.stock === 55, 'Inventory stock did NOT increase on PO creation (remains 55)');

    // Partial Goods Receipt of 60 units
    console.log('\nTest 8: Partial Goods Receipt of 60 / 100 units');
    const grnRes1 = await request('POST', `/api/purchase-orders/${createdPO.id}/receive`, {
      receivedBy: 'Warehouse Keeper',
      receiptDate: new Date().toISOString().split('T')[0],
      items: [
        {
          itemId: createdPO.items[0].id,
          productId: createdProd.id,
          receivedQty: 60,
          location: 'Bengaluru DC - Rack B4',
        },
      ],
    });
    console.log('DEBUG grnRes1:', grnRes1.status, JSON.stringify(grnRes1.data));
    assert(grnRes1.status === 200, 'Goods Receipt 1 (60 units) recorded');
    const grn1Data = getData(grnRes1);
    assert((grn1Data.purchaseOrder || grn1Data).receiptStatus === 'Partially Received', 'PO receipt status is Partially Received');

    // Verify stock increased by exactly 60
    const checkStockAfterGRN1 = await request('GET', `/api/crm/products/${createdProd.id}`);
    const checkStockAfterGRN1Data = getData(checkStockAfterGRN1);
    assert(checkStockAfterGRN1Data.stock === 115, 'Inventory stock increased by exactly +60 (55 + 60 = 115)');

    // Receive remaining 40 units
    console.log('\nTest 9: Receive Remaining 40 units');
    const grnRes2 = await request('POST', `/api/purchase-orders/${createdPO.id}/receive`, {
      receivedBy: 'Warehouse Keeper',
      receiptDate: new Date().toISOString().split('T')[0],
      items: [
        {
          itemId: createdPO.items[0].id,
          productId: createdProd.id,
          receivedQty: 40,
          location: 'Bengaluru DC - Rack B4',
        },
      ],
    });
    assert(grnRes2.status === 200, 'Goods Receipt 2 (40 units) recorded');
    const grn2Data = getData(grnRes2);
    const po2Status = (grn2Data.purchaseOrder || grn2Data).receiptStatus;
    assert(po2Status === 'Received' || po2Status === 'Fully Received', 'PO receipt status is now Fully Received');

    const checkStockAfterGRN2 = await request('GET', `/api/crm/products/${createdProd.id}`);
    const checkStockAfterGRN2Data = getData(checkStockAfterGRN2);
    assert(checkStockAfterGRN2Data.stock === 155, 'Inventory stock increased by remaining +40 (115 + 40 = 155)');

    // ------------------------------------------------------------------------
    // 10. Sales Order Reservation & Stock Allocation
    // ------------------------------------------------------------------------
    console.log('\nTest 10: Sales Order Reservation & Available Stock calculation');
    // Create Sales Order reserving 35 units
    const soPayload = {
      soNumber: `SO-TEST-${Date.now().toString().slice(-4)}`,
      customerName: 'Acme Enterprise Ltd',
      date: new Date().toISOString().split('T')[0],
      totalAmount: 35 * 150000,
      status: 'Confirmed',
      fulfillmentStatus: 'Pending',
      items: [
        {
          productId: createdProd.id,
          productName: createdProd.name,
          quantity: 35,
          unitPrice: 150000,
          taxRate: 18,
          total: 35 * 150000 * 1.18,
        },
      ],
    };

    const soRes = await request('POST', '/api/sales-orders', soPayload);
    assert(soRes.status === 201, 'Sales Order created with status Confirmed (201)');
    const createdSO = getData(soRes);

    // Check Product Stock Aggregation
    const checkStockAfterSO = await request('GET', `/api/crm/products/${createdProd.id}`);
    const checkStockAfterSOData = getData(checkStockAfterSO);
    assert(checkStockAfterSOData.on_hand_stock === 155, 'On-Hand stock remains 155 (Physical stock not issued yet)');
    assert(checkStockAfterSOData.reserved_stock === 35, 'Reserved stock is 35 (Committed to Sales Order)');
    assert(checkStockAfterSOData.available_stock === 120, 'Available stock is 120 (155 - 35)');
    assert(checkStockAfterSOData.stock_status === 'In Stock', 'Stock status is In Stock (120 > reorder level 15)');

    // ------------------------------------------------------------------------
    // 11. Sales Order Fulfillment -> Stock Out
    // ------------------------------------------------------------------------
    console.log('\nTest 11: Sales Order Fulfillment -> Inventory Stock Out');
    const fulfillRes = await request('PATCH', `/api/sales-orders/${createdSO.id}`, {
      status: 'Delivered',
      fulfillmentStatus: 'Fulfilled',
    });
    assert(fulfillRes.status === 200, 'Sales Order updated to Fulfilled (200)');

    // Check Product Stock after fulfillment
    const checkStockAfterFulfill = await request('GET', `/api/crm/products/${createdProd.id}`);
    const checkStockAfterFulfillData = getData(checkStockAfterFulfill);
    assert(checkStockAfterFulfillData.on_hand_stock === 120, 'On-Hand stock decreased to 120 (155 - 35 issued)');
    assert(checkStockAfterFulfillData.reserved_stock === 0, 'Reserved stock reset to 0');
    assert(checkStockAfterFulfillData.available_stock === 120, 'Available stock is 120');

    // ------------------------------------------------------------------------
    // 12. Verify Audit Trail in Movements
    // ------------------------------------------------------------------------
    console.log('\nTest 12: Verify Full Audit Trail in Stock Movements');
    const finalProductDetails = await request('GET', `/api/crm/products/${createdProd.id}`);
    const finalProdData = getData(finalProductDetails);
    const movements = finalProdData.movements;
    assert(movements.length >= 5, `Audit trail recorded ${movements.length} movements (Opening, +10 Adj, -5 Adj, GRN 1, GRN 2, Sales Issue)`);

    const hasPurchaseReceipt = movements.some(m => m.movement_type === 'Purchase Receipt');
    const hasSalesIssue = movements.some(m => m.movement_type === 'Sales Issue');
    const hasAdjustment = movements.some(m => m.movement_type === 'Adjustment');
    assert(hasPurchaseReceipt, 'Purchase Receipt movement recorded');
    assert(hasSalesIssue, 'Sales Issue movement recorded');
    assert(hasAdjustment, 'Adjustment movement recorded');

    // ------------------------------------------------------------------------
    // 13. Low Stock & Out of Stock Threshold Rules
    // ------------------------------------------------------------------------
    console.log('\nTest 13: Low Stock & Out of Stock Dynamic Rules');
    // Adjust stock down to 10 (which is <= reorder_level 15)
    await request('POST', `/api/crm/products/${createdProd.id}/adjust`, {
      adjustmentQuantity: -110, // from 120 down to 10
      reason: 'Transfer to Demo Lab',
    });
    const lowStockCheck = await request('GET', `/api/crm/products/${createdProd.id}`);
    const lowStockData = getData(lowStockCheck);
    assert(lowStockData.on_hand_stock === 10, 'Stock is now 10');
    assert(lowStockData.stock_status === 'Low Stock', 'Status dynamically calculated as Low Stock (10 <= reorder level 15)');

    // Adjust down to 0
    await request('POST', `/api/crm/products/${createdProd.id}/adjust`, {
      adjustmentQuantity: -10, // down to 0
      reason: 'Scrapped',
    });
    const outOfStockCheck = await request('GET', `/api/crm/products/${createdProd.id}`);
    const outOfStockData = getData(outOfStockCheck);
    assert(outOfStockData.on_hand_stock === 0, 'Stock is now 0');
    assert(outOfStockData.stock_status === 'Out of Stock', 'Status dynamically calculated as Out of Stock (0 == 0)');

    // ------------------------------------------------------------------------
    // 14. Global Movements Endpoint
    // ------------------------------------------------------------------------
    console.log('\nTest 14: Global Stock Movements Audit Log Endpoint');
    const allMovementsRes = await request('GET', '/api/crm/products/movements/all');
    assert(allMovementsRes.status === 200, 'GET /api/crm/products/movements/all returns 200');
    const allMovementsData = getData(allMovementsRes);
    assert(Array.isArray(allMovementsData), 'Global movements returns array');
    assert(allMovementsData.length > 0, 'Global movements contains records');

    console.log('\n========================================================================');
    console.log(`🎉 ALL TESTS COMPLETED: ${passed} / ${total} assertions passed (${Math.round(passed/total*100)}%)`);
    console.log('========================================================================');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
  }
}

runTests();
