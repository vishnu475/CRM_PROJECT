const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const unwrap = (res) => (res && res.data && res.data.data !== undefined ? res.data.data : (res ? res.data : null));

async function runTests() {
  console.log('=== RUNNING STEP 21 VENDOR & SUPPLIER MANAGEMENT INTEGRATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, msg) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Test GET /api/vendors
    console.log('--- Test 1: Fetch Vendors List with Aggregated Metrics ---');
    const vendorsRes = await request('GET', '/api/vendors');
    assert(vendorsRes.status === 200, 'GET /api/vendors returned status 200');
    const vendorList = unwrap(vendorsRes);
    assert(Array.isArray(vendorList), 'Vendors response is an array');
    console.log(`Found ${vendorList.length} vendors in database.`);

    const firstVendor = vendorList[0];
    assert(firstVendor && firstVendor.id, 'Vendor has ID');
    assert(firstVendor.code, 'Vendor has code');
    assert(firstVendor.category !== undefined, 'Vendor has category');
    assert(firstVendor.total_purchases !== undefined, 'Vendor has aggregated total_purchases');
    assert(firstVendor.calculated_amount_due !== undefined, 'Vendor has aggregated calculated_amount_due');
    assert(firstVendor.open_orders !== undefined, 'Vendor has open_orders count');

    // 2. Test POST /api/vendors (Register New Vendor)
    console.log('\n--- Test 2: Register New Vendor ---');
    const newVendorPayload = {
      name: 'Nexus Cloud Infrastructure Ltd',
      contactPerson: 'Arun Kumar',
      email: 'arun@nexuscloud.io',
      phone: '+91 98765 43210',
      category: 'Cloud Services',
      address: 'Plot 42, Electronics City Phase 1, Bengaluru, KA 560100',
      gstin: '29ABCDE1234F1Z5',
      paymentTerms: 'Net 45 Days',
      website: 'https://nexuscloud.io',
      notes: 'Strategic cloud provider for ERP production clusters',
      rating: 4.8,
    };
    const createVendorRes = await request('POST', '/api/vendors', newVendorPayload);
    assert(createVendorRes.status === 201, 'POST /api/vendors returned status 201');
    const createdVendor = unwrap(createVendorRes);
    assert(createdVendor && createdVendor.id, `Created vendor with ID: ${createdVendor.id}`);
    assert(createdVendor.code.startsWith('VND-'), `Generated vendor code: ${createdVendor.code}`);
    assert(createdVendor.category === 'Cloud Services', 'Category persisted correctly');
    assert(createdVendor.payment_terms === 'Net 45 Days', 'Payment terms persisted correctly');
    assert(createdVendor.status === 'Active', 'Default status is Active');

    // 3. Test GET /api/vendors/:id (Supplier 360 Profile)
    console.log('\n--- Test 3: Get Supplier 360° Profile for New Vendor ---');
    const vendor360Res = await request('GET', `/api/vendors/${createdVendor.id}`);
    assert(vendor360Res.status === 200, 'GET /api/vendors/:id returned status 200');
    const vendor360 = unwrap(vendor360Res);
    assert(vendor360.id === createdVendor.id, 'Supplier 360 returns correct vendor');
    assert(Array.isArray(vendor360.purchase_orders), 'Supplier 360 has purchase_orders array');
    assert(Array.isArray(vendor360.payments), 'Supplier 360 has payments array');
    assert(parseFloat(vendor360.total_purchases) === 0, 'Initial total purchases is 0');
    assert(parseFloat(vendor360.calculated_amount_due) === 0, 'Initial calculated amount due is 0');

    // 4. Test Create PO linked to Vendor
    console.log('\n--- Test 4: Create Purchase Order Linked to Vendor ---');
    const poPayload = {
      vendorId: createdVendor.id,
      vendorName: createdVendor.name,
      paymentTerms: createdVendor.payment_terms,
      deliveryDate: '2026-09-30',
      status: 'Ordered',
      items: [
        {
          productId: null,
          productName: 'Dedicated Cloud Server Instance',
          quantity: 2,
          unitPrice: 25000,
          taxRate: 18,
          total: 59000,
        },
      ],
      amount: 59000,
      notes: 'Initial monthly cluster billing',
    };
    const createPoRes = await request('POST', '/api/purchase-orders', poPayload);
    if (createPoRes.status !== 201) {
      console.error('PO Creation Error:', createPoRes.data);
    }
    assert(createPoRes.status === 201, 'POST /api/purchase-orders returned status 201');
    const createdPo = unwrap(createPoRes);
    assert(createdPo && createdPo.vendor_id === createdVendor.id, 'PO correctly linked to vendorId');
    assert(createdPo && createdPo.payment_terms === 'Net 45 Days', 'PO inherited vendor payment terms');
    assert(createdPo && parseFloat(createdPo.amount) === 59000, 'PO total with 18% GST is 59000');

    // 5. Test Supplier 360 after PO Creation
    console.log('\n--- Test 5: Verify Vendor Metrics after PO Creation ---');
    const vendorAfterPoRes = await request('GET', `/api/vendors/${createdVendor.id}`);
    const vendorAfterPo = unwrap(vendorAfterPoRes);
    assert(vendorAfterPo.purchase_orders.length === 1, 'Vendor 360 lists 1 purchase order');
    assert(parseFloat(vendorAfterPo.total_purchases) === 59000, 'Total purchases updated to 59,000');
    assert(parseInt(vendorAfterPo.open_orders) === 1, 'Open orders count is 1');
    assert(parseInt(vendorAfterPo.pending_receipts) === 1, 'Pending receipts count is 1');
    assert(parseFloat(vendorAfterPo.calculated_amount_due) === 0, 'Amount due remains 0 before invoicing (financial distinction enforced)');

    // 6. Test Receive Goods for PO
    console.log('\n--- Test 6: Receive Goods for PO & Verify Supplier GRN Tracking ---');
    const receiveRes = await request('POST', `/api/purchase-orders/${createdPo.id}/receive`, {
      receivedBy: 'Ashok (Warehouse Manager)',
      notes: 'Server configuration verified',
      items: [{ productName: 'Dedicated Cloud Server Instance', quantityReceived: 2 }],
    });
    if (receiveRes.status !== 200) {
      console.error('Receive Error:', receiveRes.data);
    }
    assert(receiveRes.status === 200, 'POST /receive returned status 200');
    const receiveData = unwrap(receiveRes);
    const poData = receiveData.po || receiveData;
    assert(poData && (poData.receipt_status === 'Received' || poData.receipt_status === 'Fully Received'), 'PO receipt_status is Received / Fully Received');

    const vendorAfterReceiveRes = await request('GET', `/api/vendors/${createdVendor.id}`);
    const vendorAfterReceive = unwrap(vendorAfterReceiveRes);
    assert(parseInt(vendorAfterReceive.pending_receipts) === 0, 'Pending receipts count is now 0');

    // 7. Test Vendor Invoice Creation
    console.log('\n--- Test 7: Create Vendor Invoice & Verify Amount Due ---');
    const invoiceRes = await request('POST', `/api/purchase-orders/${createdPo.id}/invoice`, {
      invoiceNumber: 'INV-NX-2026-901',
      invoiceDate: '2026-09-09',
      dueDate: '2026-10-24',
      invoiceAmount: 59000,
      notes: 'Tax Invoice from Nexus Cloud',
    });
    assert(invoiceRes.status === 200, 'POST /invoice returned status 200');
    const invoicedPo = unwrap(invoiceRes);
    assert(invoicedPo.vendor_invoice_number === 'INV-NX-2026-901', 'Vendor invoice recorded');
    assert(invoicedPo.payment_status === 'Unpaid', 'Payment status is Unpaid');

    const vendorAfterInvoiceRes = await request('GET', `/api/vendors/${createdVendor.id}`);
    const vendorAfterInvoice = unwrap(vendorAfterInvoiceRes);
    assert(parseFloat(vendorAfterInvoice.calculated_amount_due) === 59000, 'Vendor Amount Due updated to 59,000');

    // 8. Test Partial & Full Payments
    console.log('\n--- Test 8: Record Partial Payment & Check Vendor Balance ---');
    const partialPaymentRes = await request('POST', `/api/purchase-orders/${createdPo.id}/payment`, {
      paymentDate: '2026-09-15',
      amount: 25000,
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'NEFT-NX-99881',
      notes: 'Part payment 1',
    });
    if (partialPaymentRes.status !== 200) {
      console.error('Payment Error:', partialPaymentRes.data);
    }
    assert(partialPaymentRes.status === 200, 'Partial payment recorded');
    const partialPo = unwrap(partialPaymentRes);
    assert(partialPo && partialPo.payment_status === 'Partially Paid', 'PO is Partially Paid');

    const vendorAfterPartialRes = await request('GET', `/api/vendors/${createdVendor.id}`);
    const vendorAfterPartial = unwrap(vendorAfterPartialRes);
    assert(parseFloat(vendorAfterPartial.total_paid_amount) === 25000, 'Total paid amount is 25,000');
    assert(parseFloat(vendorAfterPartial.calculated_amount_due) === 34000, 'Remaining Amount Due is 34,000 (59,000 - 25,000)');
    assert(vendorAfterPartial.payments.length === 1, 'Vendor 360 contains 1 payment record');

    console.log('\n--- Test 9: Record Final Payment to Settle Balance ---');
    const fullPaymentRes = await request('POST', `/api/purchase-orders/${createdPo.id}/payment`, {
      paymentDate: '2026-09-20',
      amount: 34000,
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'NEFT-NX-99882',
      notes: 'Final settlement',
    });
    assert(fullPaymentRes.status === 200, 'Full payment recorded');
    const fullPo = unwrap(fullPaymentRes);
    assert(fullPo && fullPo.payment_status === 'Paid', 'PO is fully Paid');

    const vendorAfterFullRes = await request('GET', `/api/vendors/${createdVendor.id}`);
    const vendorAfterFull = unwrap(vendorAfterFullRes);
    assert(parseFloat(vendorAfterFull.total_paid_amount) === 59000, 'Total paid amount is 59,000');
    assert(parseFloat(vendorAfterFull.calculated_amount_due) === 0, 'Amount Due is now 0');
    assert(vendorAfterFull.payments.length === 2, 'Vendor 360 contains 2 payment records');

    // 9. Test Vendor Status & Profile Edit
    console.log('\n--- Test 10: Update Vendor Status and Profile ---');
    const updateRes = await request('PATCH', `/api/vendors/${createdVendor.id}`, {
      status: 'Suspended',
      notes: 'Temporarily suspended pending annual compliance audit',
      rating: 4.9,
    });
    assert(updateRes.status === 200, 'PATCH /api/vendors/:id returned 200');
    const updatedVendor = unwrap(updateRes);
    assert(updatedVendor.status === 'Suspended', 'Status successfully changed to Suspended');
    assert(parseFloat(updatedVendor.rating) === 4.9, 'Rating updated to 4.9');

    // Re-activate vendor
    const reactivateRes = await request('PATCH', `/api/vendors/${createdVendor.id}`, {
      status: 'Active',
    });
    const reactivatedVendor = unwrap(reactivateRes);
    assert(reactivatedVendor.status === 'Active', 'Vendor reactivated to Active');

    // 10. Verify Non-Interference with Customers, Sales, Inventory
    console.log('\n--- Test 11: Verify Customers Module Isolation ---');
    const customersRes = await request('GET', '/api/customers');
    assert(customersRes.status === 200, 'GET /api/customers returned 200');
    const customers = unwrap(customersRes);
    assert(Array.isArray(customers) && customers.length > 0, 'Customer directory intact');

    console.log('\n--- Test 12: Verify Sales Orders Module Isolation ---');
    const salesOrdersRes = await request('GET', '/api/sales-orders');
    assert(salesOrdersRes.status === 200, 'GET /api/sales-orders returned 200');

    console.log('\n======================================================');
    console.log(`TOTAL TESTS RUN: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('======================================================\n');

    if (failed === 0) {
      console.log('🎯 ALL VENDOR & PURCHASES INTEGRATION TESTS PASSED PERFECTLY!');
    }
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
