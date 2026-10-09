const http = require('http');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', err => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 STEP 19: PROCUREMENT & PURCHASES AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Fetch Vendors
    console.log('--- TEST 1: Retrieve Vendors ---');
    const vendorsRes = await makeRequest('GET', '/api/vendors');
    assert(vendorsRes.status === 200, 'Vendors API returned HTTP 200');
    assert(Array.isArray(vendorsRes.body) && vendorsRes.body.length > 0, 'Vendors list is not empty');
    const testVendor = vendorsRes.body[0];
    const initialVendorPayable = Number(testVendor.payable_balance || 0);
    console.log(`  Using test vendor: ${testVendor.name} (ID: ${testVendor.id}, Current Payable: ₹${initialVendorPayable})`);

    // 2. Fetch Products
    console.log('\n--- TEST 2: Retrieve Products for Inventory Verification ---');
    const productsRes = await makeRequest('GET', '/api/products');
    assert(productsRes.status === 200, 'Products API returned HTTP 200');
    assert(Array.isArray(productsRes.body) && productsRes.body.length > 0, 'Products catalog is not empty');
    const testProduct = productsRes.body[0];
    const initialProductStock = Number(testProduct.stock || 0);
    console.log(`  Using test product: ${testProduct.name} (ID: ${testProduct.id}, Current Stock: ${initialProductStock})`);

    // 3. Create a new Purchase Order in Draft
    console.log('\n--- TEST 3: Create New PO with Line Items ---');
    const newPOPayload = {
      vendor_id: testVendor.id,
      order_date: '2026-09-09',
      expected_delivery: '2026-09-15',
      delivery_location: 'Central Distribution Center, Hyderabad',
      payment_terms: 'Net 30',
      status: 'Draft',
      notes: 'Automated procurement test order with high priority delivery',
      items: [
        {
          product_id: testProduct.id,
          item_name: testProduct.name,
          sku: testProduct.sku || 'SKU-TEST-01',
          quantity: 10,
          unit_price: 2500,
          tax_rate: 18,
          discount_percent: 0
        }
      ]
    };

    const createRes = await makeRequest('POST', '/api/purchase-orders', newPOPayload);
    assert(createRes.status === 201, 'Create PO API returned HTTP 201');
    assert(createRes.body && createRes.body.id, 'Created PO has an ID');
    assert(createRes.body.status === 'Draft', 'PO initial status is Draft');
    assert(createRes.body.subtotal === 25000, 'Subtotal correctly calculated as ₹25,000');
    assert(createRes.body.tax_amount === 4500, 'Tax amount correctly calculated as 18% GST (₹4,500)');
    assert(createRes.body.total_amount === 29500, 'Total amount correctly calculated as ₹29,500');
    const createdPO = createRes.body;
    const poItemId = createdPO.items[0].id;
    console.log(`  PO Created: ${createdPO.po_number || createdPO.id} with ${createdPO.items.length} items`);

    // 4. Verify Inventory stock did NOT increase at PO creation
    console.log('\n--- TEST 4: Inventory Safety Check (No stock increase on PO creation) ---');
    const checkProd1 = await makeRequest('GET', '/api/products');
    const prodAfterPOCreate = checkProd1.body.find(p => p.id === testProduct.id);
    assert(
      Number(prodAfterPOCreate.stock) === initialProductStock,
      `Inventory stock unchanged: before=${initialProductStock}, after=${prodAfterPOCreate.stock}`
    );

    // 5. Lifecycle Workflow & Guard Enforcement
    console.log('\n--- TEST 5: Status Transitions & Receiving Guards ---');
    // Guard: Try to receive goods while Draft
    const invalidReceiveRes = await makeRequest('POST', `/api/purchase-orders/${createdPO.id}/receive`, {
      received_by: 'Inspector John',
      items: [{ po_item_id: poItemId, received_quantity: 5 }]
    });
    assert(invalidReceiveRes.status === 400, 'Blocked: Cannot receive goods for Draft PO (HTTP 400)');

    // Transition: Draft -> Pending Approval
    const pendRes = await makeRequest('PATCH', `/api/purchase-orders/${createdPO.id}`, {
      status: 'Pending Approval'
    });
    assert(pendRes.status === 200 && pendRes.body.status === 'Pending Approval', 'Transitioned to Pending Approval');

    // Transition: Pending Approval -> Approved
    const appRes = await makeRequest('PATCH', `/api/purchase-orders/${createdPO.id}`, {
      status: 'Approved'
    });
    assert(appRes.status === 200 && appRes.body.status === 'Approved', 'Transitioned to Approved');

    // Transition: Approved -> Ordered
    const ordRes = await makeRequest('PATCH', `/api/purchase-orders/${createdPO.id}`, {
      status: 'Ordered'
    });
    assert(ordRes.status === 200 && ordRes.body.status === 'Ordered', 'Transitioned to Ordered');

    // 6. Partial Goods Receipt & Inventory Stock-In
    console.log('\n--- TEST 6: Partial Goods Receipt (Receive 4 out of 10 units) ---');
    const partialReceiveRes = await makeRequest('POST', `/api/purchase-orders/${createdPO.id}/receive`, {
      received_by: 'Receiving Officer Vikram',
      delivery_note_number: 'DN-99412',
      notes: 'First partial batch in good condition',
      items: [{ po_item_id: poItemId, received_quantity: 4 }]
    });

    assert(partialReceiveRes.status === 200, 'Partial receipt processed with HTTP 200');
    assert(partialReceiveRes.body.receipt && partialReceiveRes.body.receipt.receipt_number, 'Generated GRN receipt number');
    assert(partialReceiveRes.body.po.status === 'Partially Received', 'PO Status updated to Partially Received');
    assert(partialReceiveRes.body.po.receipt_status === 'Partially Received', 'PO Receipt Status updated to Partially Received');

    // Verify Inventory Increased by EXACTLY 4 units
    const checkProd2 = await makeRequest('GET', '/api/products');
    const prodAfterPartial = checkProd2.body.find(p => p.id === testProduct.id);
    assert(
      Number(prodAfterPartial.stock) === initialProductStock + 4,
      `Inventory stock atomically increased by +4: was ${initialProductStock}, now ${prodAfterPartial.stock}`
    );

    // 7. Over-receiving Guard Test
    console.log('\n--- TEST 7: Over-Receiving Guard (Try to receive 8 when only 6 are pending) ---');
    const overReceiveRes = await makeRequest('POST', `/api/purchase-orders/${createdPO.id}/receive`, {
      received_by: 'Receiving Officer Vikram',
      items: [{ po_item_id: poItemId, received_quantity: 8 }]
    });
    assert(overReceiveRes.status === 400, 'Blocked: Over-receiving rejected by server with HTTP 400');

    // 8. Complete Goods Receipt (Receive remaining 6 units)
    console.log('\n--- TEST 8: Full Goods Receipt Completion (Receive remaining 6 units) ---');
    const fullReceiveRes = await makeRequest('POST', `/api/purchase-orders/${createdPO.id}/receive`, {
      received_by: 'Receiving Officer Vikram',
      delivery_note_number: 'DN-99450',
      notes: 'Final batch received and verified',
      items: [{ po_item_id: poItemId, received_quantity: 6 }]
    });

    assert(fullReceiveRes.status === 200, 'Full receipt processed with HTTP 200');
    assert(fullReceiveRes.body.po.status === 'Received', 'PO Status updated to Received');
    assert(fullReceiveRes.body.po.receipt_status === 'Fully Received', 'PO Receipt Status updated to Fully Received');

    // Verify Inventory Increased by another +6 (Total +10)
    const checkProd3 = await makeRequest('GET', '/api/products');
    const prodAfterFull = checkProd3.body.find(p => p.id === testProduct.id);
    assert(
      Number(prodAfterFull.stock) === initialProductStock + 10,
      `Inventory stock fully updated by total ordered quantity (+10): now ${prodAfterFull.stock}`
    );

    // 9. Vendor Invoice & Accounts Payable Integration
    console.log('\n--- TEST 9: Vendor Invoice Generation & Accounts Payable Update ---');
    const invoiceRes = await makeRequest('POST', `/api/purchase-orders/${createdPO.id}/invoice`, {
      invoice_number: `INV-VEND-${Date.now().toString().slice(-6)}`
    });

    assert(invoiceRes.status === 200, 'Vendor invoice created with HTTP 200');
    assert(invoiceRes.body.vendor_invoice_number, `Generated Invoice Number: ${invoiceRes.body.vendor_invoice_number}`);

    // Verify Vendor's Accounts Payable increased by PO total amount
    const checkVend = await makeRequest('GET', '/api/vendors');
    const vendAfterInvoice = checkVend.body.find(v => v.id === testVendor.id);
    assert(
      Number(vendAfterInvoice.payable_balance) === initialVendorPayable + 29500,
      `Vendor Accounts Payable increased by ₹29,500: was ₹${initialVendorPayable}, now ₹${vendAfterInvoice.payable_balance}`
    );

    // Duplicate Invoice Guard
    const dupInvoiceRes = await makeRequest('POST', `/api/purchase-orders/${createdPO.id}/invoice`);
    assert(dupInvoiceRes.status === 400, 'Blocked: Duplicate vendor invoice creation prevented (HTTP 400)');

    // 10. Complete PO and Fetch Enriched Record
    console.log('\n--- TEST 10: Mark Completed & Verify Traceability ---');
    const compRes = await makeRequest('PATCH', `/api/purchase-orders/${createdPO.id}`, {
      status: 'Completed'
    });
    assert(compRes.status === 200 && compRes.body.status === 'Completed', 'PO marked Completed');

    const singlePORes = await makeRequest('GET', `/api/purchase-orders/${createdPO.id}`);
    assert(singlePORes.status === 200, 'Fetched single PO record with HTTP 200');
    assert(Array.isArray(singlePORes.body.items) && singlePORes.body.items.length === 1, 'Items array populated');
    assert(singlePORes.body.items[0].received_quantity === 10, 'Item received quantity is 10/10');
    assert(Array.isArray(singlePORes.body.receipts) && singlePORes.body.receipts.length === 2, '2 Goods Receipts traceable');
    console.log(`  Traceability verified: 2 Goods Receipts attached to PO ${singlePORes.body.po_number}`);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
