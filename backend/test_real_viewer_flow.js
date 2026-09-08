import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hrmsPool as pool } from './db/pool.js';
import { DocumentService } from './services/documentService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCompleteDocumentJourney() {
  console.log('🌟 Testing Complete Real Document Management & Viewer Journey...\n');

  // Defined User Profiles
  const empVishnu = { id: 'EMP-004', empCode: 'EMP-004', name: 'Vishnu', role: 'Employee', department: 'Engineering' };
  const hrPriya = { id: 'EMP-003', empCode: 'EMP-003', name: 'Priya Sharma', role: 'HRAdmin', department: 'HR' };
  const adminSarah = { id: 'EMP-001', empCode: 'EMP-001', name: 'Sarah Jenkins', role: 'Executive', department: 'Engineering' };
  const mgrMichael = { id: 'EMP-002', empCode: 'EMP-002', name: 'Michael Vance', role: 'SalesManager', department: 'Sales' };

  // Step 1: Employee Vishnu logs in & uploads BTech_Certificate.pdf
  console.log('1️⃣ Employee Vishnu uploads "BTech_Certificate.pdf" (Education Certificate)...');
  const samplePdfData = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDw+Pi9Db250ZW50cyA0IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9MZW5ndGggODU+PnN0cmVhbQpCVAovRjEgMTggVGYKNTAgNzIwIFRkCihCUGFjaF9DZXJ0aWZpY2F0ZV9WaXNobnUpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTYgMDAwMDAgbiAKMDAwMDAwMDExMSAwMDAwMCBuIAowMDAwMDAwMjEyIDAwMDAwIG4gCnRyYWlsZXI8PC9TaXplIDUvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgowCiUlRU9G';

  const doc = await DocumentService.createDocument({
    document_name: 'BTech_Certificate.pdf',
    document_type_id: 'TYPE-EMP-EDU',
    category_id: 'CAT-EDU',
    file_name: 'BTech_Certificate.pdf',
    file_data: samplePdfData,
    description: 'Degree certificate submitted for HR statutory verification',
    tags: ['Degree', 'Education', 'Vishnu'],
    submit_immediately: true // Submits immediately
  }, empVishnu);

  console.log(`   ✅ Document created with ID: ${doc.id}, Current Status: ${doc.status}, Version: ${doc.current_version}`);
  if (doc.status !== 'PENDING_REVIEW') throw new Error(`Expected PENDING_REVIEW, got ${doc.status}`);

  // Step 2: HR opens Pending Verification
  console.log('\n2️⃣ HR Priya opens Pending Verification list...');
  const pendingDocs = await DocumentService.getDocuments(hrPriya, { section: 'pending_approvals' });
  const foundInPending = pendingDocs.documents.some(d => d.id === doc.id);
  console.log(`   ✅ Found BTech_Certificate.pdf in HR pending verification list: ${foundInPending}`);
  if (!foundInPending) throw new Error('Document not found in Pending Approvals!');

  // Step 3: HR clicks [View] -> ACTUAL uploaded file opens inside ERP
  console.log('\n3️⃣ HR clicks [View] -> Opening actual uploaded document content...');
  const hrFileView = await DocumentService.getDocumentFile(doc.id, hrPriya, 'preview');
  console.log(`   ✅ Actual file located at: ${hrFileView.filePath}`);
  console.log(`   ✅ MIME Type: ${hrFileView.mimeType}, File Name: ${hrFileView.fileName}`);
  const fileBytes = fs.readFileSync(hrFileView.filePath);
  console.log(`   ✅ Real binary content verified (${fileBytes.length} bytes, starts with "${fileBytes.subarray(0, 5).toString()}").`);

  // Step 4: HR rejects document with reason
  console.log('\n4️⃣ HR checks document and rejects with reason...');
  const rejectReason = 'Certificate image is not clear. University seal and registration number are blurred.';
  await DocumentService.rejectDocument(doc.id, hrPriya, rejectReason);
  const rejectedDoc = await DocumentService.getDocumentById(doc.id, empVishnu);
  console.log(`   ✅ Status updated to: ${rejectedDoc.status}`);
  console.log(`   ✅ Stored rejection reason: "${rejectedDoc.approvals[0].comments}"`);
  if (rejectedDoc.status !== 'REJECTED' || rejectedDoc.approvals[0].comments !== rejectReason) {
    throw new Error('Rejection reason was not stored properly!');
  }

  // Step 5: Employee sees rejection reason and clicks [Replace Document] -> creates v2.0
  console.log('\n5️⃣ Employee Vishnu sees rejection reason and replaces document with v2.0...');
  const newVersionResult = await DocumentService.createNewVersion(doc.id, {
    file_name: 'BTech_Certificate_HighRes.pdf',
    file_data: samplePdfData,
    change_description: 'Uploaded high resolution clear scan showing university seal and reg number',
    version_increment: 'major' // v1.0 -> v2.0
  }, empVishnu);

  console.log(`   ✅ New revision published: ${newVersionResult.version}`);

  // Employee re-submits for verification
  await DocumentService.submitForReview(doc.id, empVishnu);
  const reSubmittedDoc = await DocumentService.getDocumentById(doc.id, hrPriya);
  console.log(`   ✅ Re-submitted for review: Status: ${reSubmittedDoc.status}, Active Version: ${reSubmittedDoc.current_version}`);
  if (reSubmittedDoc.current_version !== 'v2.0' || reSubmittedDoc.status !== 'PENDING_REVIEW') {
    throw new Error('Expected status PENDING_REVIEW and version v2.0');
  }

  // Step 6: HR views v2.0 and clicks [Approve]
  console.log('\n6️⃣ HR views v2.0 actual document and clicks [Approve]...');
  await DocumentService.approveDocument(doc.id, hrPriya, 'Verified high-resolution certificate. Registration authenticated.');
  const approvedDoc = await DocumentService.getDocumentById(doc.id, empVishnu);
  console.log(`   ✅ Document verified and APPROVED! Reviewed at: ${approvedDoc.approvals[0].reviewed_at}`);
  if (approvedDoc.status !== 'APPROVED') throw new Error('Expected status APPROVED');

  // Step 7: Employee can download approved document
  console.log('\n7️⃣ Employee Vishnu downloads approved document...');
  const downloadResult = await DocumentService.getDocumentFile(doc.id, empVishnu, 'download');
  console.log(`   ✅ Download authorized: ${downloadResult.fileName}`);

  // Step 8: Security isolation test: Manager Michael cannot access Vishnu private certificate
  console.log('\n8️⃣ Security Check: Manager Michael attempts to access Vishnu private certificate...');
  try {
    await DocumentService.getDocumentById(doc.id, mgrMichael);
    throw new Error('FAILED: Unauthorized manager was able to view private certificate!');
  } catch (err) {
    if (err.message.includes('Forbidden') || err.message.includes('permission')) {
      console.log('   ✅ PASS: Unauthorized manager blocked with HTTP 403 Forbidden.');
    } else {
      throw err;
    }
  }

  console.log('\n🎉 ALL VERIFICATION FLOWS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

testCompleteDocumentJourney().catch(err => {
  console.error('\n❌ Test Journey Failed:', err);
  process.exit(1);
});
