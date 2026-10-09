const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runStep20Tests() {
  console.log('========================================================');
  console.log('🧪 RUNNING STEP 20 VENDOR INVOICE & PAYMENT TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 0. Setup: Get a vendor and a product
    const vendorsRes = await request('GET', '/vendors');
    assert(vendorsRes.status === 200 && vendorsRes.body.data.length > 0, 'Fetched vendors');
    const vendor = vendorsRes.body.data[0];

    const productsRes = await request('GET', '/crm/products');
    assert(productsRes.status === 200 && productsRes.body.data.length > 0, 'Fetched products');
    const product = productsRes.body.data[0];
    const initialStock = parseInt(product.stock) || 0;

    // Test 1: Create a valid Purchase Order
    const poNumber = `PO-TEST-${Date.now().toString().slice(-5)}`;
    const createPoRes = await request('POST', '/purchase-orders', {
      vendorId: vendor.id,
      poNumber: poNumber,
      date: '2026-09-09',
      expectedDelivery: '2026-09-20',
      paymentTerms: 'Net 30 Days',
      status: 'Approved',
      items: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: 5,
          unitPrice: 5000,
          taxRate: 18,
          total: 29500
        }
      ],
      amount: 29500,
      subtotal: 25000,
      taxAmount: 4500
    });

    assert(createPoRes.status === 201 && createPoRes.body.data.id, `Test 1: Created PO ${poNumber}`);
    const poId = createPoRes.body.data.id;

    // Check inventory not increased yet
    const prodAfterPo = (await request('GET', `/crm/products`)).body.data.find(p => p.id === product.id);
    assert(parseInt(prodAfterPo.stock) === initialStock, 'Test 1b: Inventory NOT increased upon PO creation');

    // Test 2: Receive goods (Stock-In)
    const receiveRes = await request('POST', `/purchase-orders/${poId}/receive`, {
      receivedBy: 'Warehouse Manager',
      notes: 'Delivered in full',
      receipts: [
        {
          productId: product.id,
          productName: product.name,
          quantityReceived: 5
        }
      ]
    });
    assert(receiveRes.status === 200 && receiveRes.body.success, 'Test 2: Received goods via GRN');

    const prodAfterGrn = (await request('GET', `/crm/products`)).body.data.find(p => p.id === product.id);
    assert(parseInt(prodAfterGrn.stock) === initialStock + 5, `Test 2b: Inventory increased by received qty (+5 = ${prodAfterGrn.stock})`);

    // Test 3: Create Vendor Invoice
    const invNumber = `INV-TEST-${Date.now().toString().slice(-4)}`;
    const invoiceRes = await request('POST', `/purchase-orders/${poId}/invoice`, {
      invoiceNumber: invNumber,
      invoiceDate: '2026-09-09',
      paymentTerms: 'Net 30 Days',
      invoiceAmount: 29500,
      taxAmount: 4500,
      notes: 'Original vendor tax invoice'
    });
    assert(invoiceRes.status === 200 && invoiceRes.body.success, `Test 3: Created Vendor Invoice #${invNumber}`);
    assert(invoiceRes.body.data.vendor_invoice_due_date.startsWith('2026-10-09'), 'Test 3b: Due date auto-calculated from Net 30 (+30 days = 2026-10-09)');

    // Test 4: Verify Payment Status is Unpaid
    const poDetailsRes = await request('GET', `/purchase-orders/${poId}`);
    assert(poDetailsRes.status === 200, 'Fetched PO details');
    const poData = poDetailsRes.body.data;
    assert(poData.payment_status === 'Unpaid', `Test 4: Payment status is Unpaid (${poData.payment_status})`);
    assert(parseFloat(poData.amount_due) === 29500, `Test 4b: Amount due equals invoice total (₹${poData.amount_due})`);
    assert(parseFloat(poData.paid_amount) === 0, `Test 4c: Paid amount is ₹0`);

    // Test 5: Record partial payment of ₹10,000
    const partPayRes = await request('POST', `/purchase-orders/${poId}/payment`, {
      amount: 10000,
      paymentDate: '2026-09-10',
      paymentMethod: 'Bank Transfer',
      bankAccountId: 'BNK-01',
      referenceNumber: 'UTR-991823',
      notes: 'Advance installment'
    });
    assert(partPayRes.status === 200 && partPayRes.body.success, 'Test 5: Recorded partial payment of ₹10,000');
    assert(partPayRes.body.data.payment_status === 'Partially Paid', `Test 5b: Status is Partially Paid`);
    assert(parseFloat(partPayRes.body.data.paid_amount) === 10000, `Test 5c: Paid amount is ₹10,000`);
    assert(parseFloat(partPayRes.body.data.amount_due) === 19500, `Test 5d: Amount due is ₹19,500`);

    // Test 6: Attempt payment greater than amount due (e.g. ₹25,000 when ₹19,500 due)
    const overPayRes = await request('POST', `/purchase-orders/${poId}/payment`, {
      amount: 25000,
      paymentDate: '2026-09-11',
      paymentMethod: 'Bank Transfer'
    });
    assert(overPayRes.status === 400, `Test 6: Overpayment correctly blocked with HTTP 400 (${overPayRes.body.error})`);

    // Test 7: Record remaining payment (₹19,500)
    const fullPayRes = await request('POST', `/purchase-orders/${poId}/payment`, {
      amount: 19500,
      paymentDate: '2026-09-12',
      paymentMethod: 'Bank Transfer',
      bankAccountId: 'BNK-01',
      referenceNumber: 'UTR-991824',
      notes: 'Final settlement'
    });
    assert(fullPayRes.status === 200 && fullPayRes.body.success, 'Test 7: Recorded remaining payment of ₹19,500');
    assert(fullPayRes.body.data.payment_status === 'Paid', `Test 7b: Status is Paid`);
    assert(parseFloat(fullPayRes.body.data.paid_amount) === 29500, `Test 7c: Paid amount is ₹29,500`);
    assert(parseFloat(fullPayRes.body.data.amount_due) === 0, `Test 7d: Amount due is ₹0`);

    // Test 8: Overdue detection
    // Create an overdue PO
    const overduePoRes = await request('POST', '/purchase-orders', {
      vendorId: vendor.id,
      poNumber: `PO-OVERDUE-${Date.now().toString().slice(-4)}`,
      date: '2026-07-01',
      expectedDelivery: '2026-07-10',
      paymentTerms: 'Net 15 Days',
      status: 'Received',
      amount: 15000,
      items: [{ productId: product.id, productName: product.name, quantity: 1, unitPrice: 15000, taxRate: 0, total: 15000 }]
    });
    const overduePoId = overduePoRes.body.data.id;
    await request('POST', `/purchase-orders/${overduePoId}/invoice`, {
      invoiceNumber: `INV-OVERDUE-${Date.now().toString().slice(-4)}`,
      invoiceDate: '2026-07-01',
      dueDate: '2026-07-16',
      invoiceAmount: 15000
    });

    const overdueCheck = await request('GET', `/purchase-orders/${overduePoId}`);
    assert(overdueCheck.body.data.payment_status === 'Overdue', `Test 8: Unpaid invoice past due date detected as Overdue (${overdueCheck.body.data.payment_status})`);

    // Test 9: Fully paying an overdue invoice makes it Paid (not Overdue)
    await request('POST', `/purchase-orders/${overduePoId}/payment`, {
      amount: 15000,
      paymentDate: '2026-09-09',
      paymentMethod: 'Bank Transfer'
    });
    const settledOverdueCheck = await request('GET', `/purchase-orders/${overduePoId}`);
    assert(settledOverdueCheck.body.data.payment_status === 'Paid', `Test 9: Fully paid invoice changes from Overdue to Paid (${settledOverdueCheck.body.data.payment_status})`);

    // Test 10: Cancelled Purchase Order cannot create invoice
    const cancelPoRes = await request('POST', '/purchase-orders', {
      vendorId: vendor.id,
      poNumber: `PO-CANCEL-${Date.now().toString().slice(-4)}`,
      date: '2026-09-09',
      status: 'Cancelled',
      amount: 5000,
      items: [{ productId: product.id, productName: product.name, quantity: 1, unitPrice: 5000, taxRate: 0, total: 5000 }]
    });
    const cancelPoId = cancelPoRes.body.data.id;
    const cancelInvRes = await request('POST', `/purchase-orders/${cancelPoId}/invoice`, {
      invoiceNumber: 'INV-INVALID-01'
    });
    assert(cancelInvRes.status === 400, `Test 10: Cancelled PO invoice creation blocked with HTTP 400 (${cancelInvRes.body.error})`);

    // Test 11: Duplicate invoice creation on already invoiced PO blocked
    const dupInvRes = await request('POST', `/purchase-orders/${poId}/invoice`, {
      invoiceNumber: 'INV-DUPLICATE'
    });
    assert(dupInvRes.status === 400, `Test 11: Duplicate invoice creation blocked with HTTP 400 (${dupInvRes.body.error})`);

    // Test 12: Traceability & History
    const finalPoRes = await request('GET', `/purchase-orders/${poId}`);
    const finalPO = finalPoRes.body.data;
    assert(finalPO.receipts && finalPO.receipts.length >= 1, `Test 12a: GRN history linked (${finalPO.receipts.length} receipts)`);
    assert(finalPO.payments && finalPO.payments.length === 2, `Test 12b: Payment history linked (${finalPO.payments.length} payments)`);
    assert(finalPO.vendor_invoice_number === invNumber, `Test 12c: Invoice #${invNumber} linked to PO`);

    console.log('\n========================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('💥 Test suite runtime error:', err);
    process.exit(1);
  }
}

runStep20Tests();
