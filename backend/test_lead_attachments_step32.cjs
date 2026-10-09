const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const crmPool = new Pool({
  host: process.env.CRM_DB_HOST || 'localhost',
  port: parseInt(process.env.CRM_DB_PORT || '5432'),
  user: process.env.CRM_DB_USER || 'postgres',
  password: process.env.CRM_DB_PASSWORD || '1234',
  database: process.env.CRM_DB_NAME || 'crm',
});

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 STEP 32 — LEAD PROJECT REQUIREMENTS ATTACHMENT TESTS');
  console.log('========================================================\n');

  const createdLeadIds = [];
  const createdDiskFiles = [];

  try {
    // 1. Test upload valid PDF
    console.log('[Test 1] Upload valid PDF attachment...');
    const samplePdfBase64 = Buffer.from('%PDF-1.4 sample pdf content for requirements document').toString('base64');
    const pdfUploadRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/leads/upload-attachment',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      fileName: 'Project_Scope_Requirements.pdf',
      fileData: `data:application/pdf;base64,${samplePdfBase64}`,
      fileSize: 1024,
      fileType: 'application/pdf',
    });

    console.log(`Response status: ${pdfUploadRes.status}`);
    if (pdfUploadRes.status !== 201 || !pdfUploadRes.data.success || !pdfUploadRes.data.data.url) {
      throw new Error(`PDF upload failed: ${JSON.stringify(pdfUploadRes.data)}`);
    }
    const uploadedPdf = pdfUploadRes.data.data;
    console.log('Uploaded PDF record:', uploadedPdf);
    createdDiskFiles.push(path.basename(uploadedPdf.url));

    // Verify physical file exists on disk
    const diskPath = path.join(__dirname, 'uploads', 'leads', path.basename(uploadedPdf.url));
    if (!fs.existsSync(diskPath)) {
      throw new Error(`File was not created on disk at ${diskPath}`);
    }
    console.log('✓ Test 1 Passed: Valid PDF uploaded and stored to disk successfully.');

    // 2. Test upload valid PNG
    console.log('\n[Test 2] Upload valid PNG attachment...');
    const samplePngBase64 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64').toString('base64');
    const pngUploadRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/leads/upload-attachment',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      fileName: 'Architecture_Diagram.png',
      fileData: `data:image/png;base64,${samplePngBase64}`,
      fileSize: 512,
      fileType: 'image/png',
    });

    console.log(`Response status: ${pngUploadRes.status}`);
    if (pngUploadRes.status !== 201 || !pngUploadRes.data.success) {
      throw new Error(`PNG upload failed: ${JSON.stringify(pngUploadRes.data)}`);
    }
    const uploadedPng = pngUploadRes.data.data;
    createdDiskFiles.push(path.basename(uploadedPng.url));
    console.log('✓ Test 2 Passed: Valid PNG uploaded successfully.');

    // 3. Test upload file exceeding 10MB (Should fail 400)
    console.log('\n[Test 3] Upload file exceeding 10 MB (Should fail 400)...');
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const largeBase64 = largeBuffer.toString('base64');
    const largeUploadRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/leads/upload-attachment',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      fileName: 'Massive_Spec.pdf',
      fileData: `data:application/pdf;base64,${largeBase64}`,
      fileSize: 11 * 1024 * 1024,
      fileType: 'application/pdf',
    });

    console.log(`Response status: ${largeUploadRes.status}, message: ${largeUploadRes.data?.message}`);
    if (largeUploadRes.status !== 400) {
      throw new Error(`Expected 400 for file > 10MB, got ${largeUploadRes.status}`);
    }
    console.log('✓ Test 3 Passed: Over-sized file was properly rejected with 400.');

    // 4. Test upload unsupported executable (Should fail 400)
    console.log('\n[Test 4] Upload forbidden file type .exe (Should fail 400)...');
    const exeUploadRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/leads/upload-attachment',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      fileName: 'malicious_installer.exe',
      fileData: 'data:application/octet-stream;base64,TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAA=',
      fileSize: 100,
      fileType: 'application/octet-stream',
    });

    console.log(`Response status: ${exeUploadRes.status}, message: ${exeUploadRes.data?.message}`);
    if (exeUploadRes.status !== 400) {
      throw new Error(`Expected 400 for forbidden file extension, got ${exeUploadRes.status}`);
    }
    console.log('✓ Test 4 Passed: Forbidden file extension was properly rejected with 400.');

    // 5. Test create Lead with attachments persisted in CRM database
    console.log('\n[Test 5] POST /api/leads with attachments...');
    const leadId = `LD-ATT-${Date.now()}`;
    const createLeadRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/leads',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      id: leadId,
      name: 'Acme Enterprise Requirements Deal',
      company: 'Acme Corp',
      email: 'requirements@acme.com',
      phone: '9876543210',
      requirement: 'Enterprise ERP setup with custom SLA & cloud backup.',
      attachments: [uploadedPdf, uploadedPng],
    });

    console.log(`Response status: ${createLeadRes.status}`);
    if (createLeadRes.status !== 201) {
      throw new Error(`Lead creation with attachments failed: ${JSON.stringify(createLeadRes.data)}`);
    }
    createdLeadIds.push(leadId);

    // Verify DB JSONB persistence directly
    const dbRes = await crmPool.query('SELECT id, name, attachments FROM leads WHERE id = $1', [leadId]);
    const leadRow = dbRes.rows[0];
    console.log('Database row attachments:', leadRow.attachments);
    const dbAttachments = typeof leadRow.attachments === 'string' ? JSON.parse(leadRow.attachments) : leadRow.attachments;
    if (!Array.isArray(dbAttachments) || dbAttachments.length !== 2) {
      throw new Error(`Attachments array mismatch in DB: ${JSON.stringify(dbAttachments)}`);
    }
    if (dbAttachments[0].name !== 'Project_Scope_Requirements.pdf') {
      throw new Error(`Attachment 0 name mismatch: ${dbAttachments[0].name}`);
    }
    console.log('✓ Test 5 Passed: Lead saved with attachments persisted in PostgreSQL JSONB.');

    // 6. Test GET /api/leads/:id returns attachments
    console.log('\n[Test 6] GET /api/leads/:id...');
    const getRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/leads/${leadId}`,
      method: 'GET',
    });

    console.log(`Response status: ${getRes.status}`);
    if (getRes.status !== 200 || !getRes.data.data.attachments) {
      throw new Error(`GET lead failed: ${JSON.stringify(getRes.data)}`);
    }
    console.log('✓ Test 6 Passed: GET lead returned parsed attachments.');

    // 7. Test PUT /api/leads/:id to update attachments
    console.log('\n[Test 7] PUT /api/leads/:id to remove an attachment...');
    const putRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/leads/${leadId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }, {
      attachments: [uploadedPdf], // removed PNG
    });

    console.log(`Response status: ${putRes.status}`);
    if (putRes.status !== 200) {
      throw new Error(`PUT lead failed: ${JSON.stringify(putRes.data)}`);
    }

    const updatedDbRes = await crmPool.query('SELECT attachments FROM leads WHERE id = $1', [leadId]);
    const updatedAtts = typeof updatedDbRes.rows[0].attachments === 'string' ? JSON.parse(updatedDbRes.rows[0].attachments) : updatedDbRes.rows[0].attachments;
    if (updatedAtts.length !== 1 || updatedAtts[0].name !== 'Project_Scope_Requirements.pdf') {
      throw new Error(`Updated attachments count mismatch: ${JSON.stringify(updatedAtts)}`);
    }
    console.log('✓ Test 7 Passed: Lead attachments update persisted correctly.');

    // 8. Test DELETE /api/leads/upload-attachment/:filename
    console.log('\n[Test 8] DELETE /api/leads/upload-attachment/:filename...');
    const delRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/leads/upload-attachment/${path.basename(uploadedPng.url)}`,
      method: 'DELETE',
    });
    console.log(`Delete response status: ${delRes.status}`);
    if (delRes.status !== 200) {
      throw new Error(`Delete attachment failed: ${JSON.stringify(delRes.data)}`);
    }
    console.log('✓ Test 8 Passed: Uncommitted attachment deletion succeeded.');

    // Cleanup test leads and files
    for (const id of createdLeadIds) {
      await crmPool.query('DELETE FROM leads WHERE id = $1', [id]);
    }
    for (const f of createdDiskFiles) {
      const p = path.join(__dirname, 'uploads', 'leads', f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    console.log('\n✓ Cleaned up test database records and disk files.');

    console.log('\n========================================================');
    console.log('🎉 ALL STEP 32 LEAD ATTACHMENT TESTS PASSED SUCCESSFULLY');
    console.log('========================================================');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  } finally {
    await crmPool.end();
  }
}

runTests();
