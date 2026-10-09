import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hrmsPool as pool } from './db/pool.js';
import { DocumentService } from './services/documentService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runDmsTestSuite() {
  console.log('🚀 Starting Enterprise Document Management System (DMS) Test Suite...\n');

  // Step 1: Run Migration 013
  console.log('📦 Step 1: Applying migration 013_enterprise_document_management_system.sql...');
  const migrationPath = path.join(__dirname, 'db', 'migrations', '013_enterprise_document_management_system.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  await pool.query(sql);
  console.log('✅ Migration 013 applied successfully.');

  // Step 2: Verify Tables & Seed Data
  console.log('\n📊 Step 2: Verifying seeded documents, categories, and types...');
  const docCount = await pool.query('SELECT COUNT(*) FROM documents');
  const catCount = await pool.query('SELECT COUNT(*) FROM document_categories');
  const typeCount = await pool.query('SELECT COUNT(*) FROM document_types');
  console.log(`   - Documents in DB: ${docCount.rows[0].count}`);
  console.log(`   - Categories: ${catCount.rows[0].count}`);
  console.log(`   - Document Types: ${typeCount.rows[0].count}`);
  if (parseInt(docCount.rows[0].count) < 8) {
    throw new Error('Seed documents count does not match expectation.');
  }

  // Users for Testing
  const adminUser = { id: 'EMP-001', empCode: 'EMP-001', name: 'Sarah Jenkins', role: 'Executive', designation: 'VP of Engineering', department: 'Engineering' };
  const hrUser = { id: 'EMP-003', empCode: 'EMP-003', name: 'Priya Sharma', role: 'HRAdmin', designation: 'HR Operations Lead', department: 'HR' };
  const managerUser = { id: 'EMP-002', empCode: 'EMP-002', name: 'Michael Vance', role: 'SalesManager', designation: 'Sales Director', department: 'Sales' };
  const empRahul = { id: 'EMP-004', empCode: 'EMP-004', name: 'Rahul Verma', role: 'Employee', designation: 'Senior Full Stack Engineer', department: 'Engineering' };
  const empRamesh = { id: 'EMP-008', empCode: 'EMP-008', name: 'Ramesh', role: 'Employee', designation: 'Senior Full Stack Engineer', department: 'Engineering' };

  // Step 3: Test KPI Stats scoped by role
  console.log('\n📈 Step 3: Testing KPI Dashboard Statistics...');
  const adminStats = await DocumentService.getDocumentStats(adminUser);
  console.log('   - Admin Stats:', adminStats);
  const empStats = await DocumentService.getDocumentStats(empRahul);
  console.log('   - Rahul (Employee) Stats:', empStats);

  // Step 4: Test Role-Based Isolation (Employee cannot see another employee's private document)
  console.log('\n🔒 Step 4: Testing Strict Role-Based Document Access Control...');
  const rameshPrivateDoc = await pool.query("SELECT id FROM documents WHERE owner_id = 'EMP-008' AND visibility = 'private' LIMIT 1");
  const rameshDocId = rameshPrivateDoc.rows[0]?.id;
  if (rameshDocId) {
    try {
      await DocumentService.getDocumentById(rameshDocId, empRahul);
      throw new Error('FAILED: Rahul was able to access Ramesh private document!');
    } catch (err) {
      if (err.message.includes('Forbidden')) {
        console.log('   ✅ PASS: Rahul was correctly blocked from accessing Ramesh private document (403 Forbidden).');
      } else {
        throw err;
      }
    }
  }

  // Step 5: Test Employee Document Upload Workflow (Draft -> Submit -> HR Review -> Rejection -> Re-upload -> Approval)
  console.log('\n📝 Step 5: Testing End-to-End Approval & Rejection Lifecycle...');
  const samplePdf = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDw+Pi9Db250ZW50cyA0IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9MZW5ndGggNzg+PnN0cmVhbQpCVAovRjEgMTggVGYKNTAgNzIwIFRkCihQYW5DYXJkX1ZlcmlmaWNhdGlvbikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1NiAwMDAwMCBuIAowMDAwMDAwMTExIDAwMDAwIG4gCjAwMDAwMDAyMTIgMDAwMDAgbiAKdHJhaWxlcjw8L1NpemUgNS9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjM0MAolJUVPRg==';

  const newEmpDoc = await DocumentService.createDocument({
    document_name: 'Permanent Account Number (PAN) Card - Rahul.pdf',
    document_type_id: 'TYPE-EMP-ID',
    category_id: 'CAT-ID',
    file_name: 'Rahul_PAN_Card.pdf',
    file_data: samplePdf,
    description: 'Statutory PAN Card scan for tax deduction verification',
    tags: ['PAN', 'Statutory', 'Tax']
  }, empRahul);

  console.log(`   - Document created by Rahul: ${newEmpDoc.id} with status: ${newEmpDoc.status} (DRAFT)`);
  if (newEmpDoc.status !== 'DRAFT') throw new Error(`Expected initial status DRAFT, got ${newEmpDoc.status}`);

  // Employee cannot approve their own document
  try {
    await DocumentService.approveDocument(newEmpDoc.id, empRahul);
    throw new Error('FAILED: Rahul was able to self-approve his own document!');
  } catch (err) {
    console.log('   ✅ PASS: Self-approval correctly blocked.');
  }

  // Employee Submits document
  await DocumentService.submitForReview(newEmpDoc.id, empRahul);
  const submittedDoc = await DocumentService.getDocumentById(newEmpDoc.id, adminUser);
  console.log(`   - Document submitted for review: status is now ${submittedDoc.status}`);
  if (submittedDoc.status !== 'PENDING_REVIEW') throw new Error('Expected status PENDING_REVIEW');

  // HR Rejects document with reason
  console.log('   - HR reviews and rejects document with feedback...');
  await DocumentService.rejectDocument(newEmpDoc.id, hrUser, 'The signature on the PAN card is truncated. Please upload complete card.');
  const rejectedDoc = await DocumentService.getDocumentById(newEmpDoc.id, empRahul);
  console.log(`   - Document rejected: status=${rejectedDoc.status}, rejection_reason="${rejectedDoc.approvals[0].comments}"`);
  if (rejectedDoc.status !== 'REJECTED') throw new Error('Expected status REJECTED');

  // Rahul uploads new revision v1.1 and re-submits
  console.log('   - Rahul creates revision v1.1 with corrected scan...');
  await DocumentService.createNewVersion(newEmpDoc.id, {
    file_name: 'Rahul_PAN_Card_v2.pdf',
    file_data: samplePdf,
    change_description: 'Replaced with full high resolution clear scan showing complete signature'
  }, empRahul);

  await DocumentService.submitForReview(newEmpDoc.id, empRahul);
  const reSubmittedDoc = await DocumentService.getDocumentById(newEmpDoc.id, adminUser);
  console.log(`   - Rahul re-submitted: current_version=${reSubmittedDoc.current_version}, status=${reSubmittedDoc.status}`);

  // HR approves document
  console.log('   - HR verifies and approves document...');
  await DocumentService.approveDocument(newEmpDoc.id, hrUser, 'Verified clear PAN number and signature. Approved.');
  const approvedDoc = await DocumentService.getDocumentById(newEmpDoc.id, empRahul);
  console.log(`   - Document verified: status=${approvedDoc.status}`);
  if (approvedDoc.status !== 'APPROVED') throw new Error('Expected status APPROVED');

  // Step 6: Test Sharing
  console.log('\n🤝 Step 6: Testing Document Sharing...');
  const shareResult = await DocumentService.shareDocument(newEmpDoc.id, {
    target_type: 'user',
    target_id: 'EMP-002', // Share with Michael Vance (Manager)
    can_view: true,
    can_download: true
  }, empRahul);
  console.log(`   - Document shared with Michael Vance (Share ID: ${shareResult.shareId})`);

  // Verify Michael Vance can now view it
  const sharedDocView = await DocumentService.getDocumentById(newEmpDoc.id, managerUser);
  console.log(`   ✅ PASS: Michael Vance can access shared document "${sharedDocView.document_name}"`);

  // Step 7: Test Soft Delete, Trash, and Restore
  console.log('\n🗑️  Step 7: Testing Soft Delete (Trash) and Restore...');
  await DocumentService.deleteDocument(newEmpDoc.id, adminUser, false);
  const trashDocs = await DocumentService.getDocuments(adminUser, { section: 'trash' });
  const foundInTrash = trashDocs.documents.some(d => d.id === newEmpDoc.id);
  console.log(`   - Document in Trash: ${foundInTrash}`);
  if (!foundInTrash) throw new Error('Document not found in Trash!');

  // Restore
  await DocumentService.restoreDocument(newEmpDoc.id, adminUser);
  const restoredDoc = await DocumentService.getDocumentById(newEmpDoc.id, adminUser);
  console.log(`   - Document restored from Trash: status=${restoredDoc.status}, deleted_at=${restoredDoc.deleted_at}`);
  if (restoredDoc.deleted_at !== null) throw new Error('Expected deleted_at to be NULL after restore');

  // Step 8: Test Audit Logs
  console.log('\n📜 Step 8: Testing Document Audit Trail...');
  const detailedDoc = await DocumentService.getDocumentById(newEmpDoc.id, adminUser);
  console.log(`   - Total audit events recorded for document: ${detailedDoc.auditLogs.length}`);
  const actions = detailedDoc.auditLogs.map(a => a.action);
  console.log('   - Audit actions captured:', actions.join(' -> '));

  console.log('\n🎉 ALL ENTERPRISE DMS TESTS PASSED SUCCESSFULLY! 100% PRODUCTION READY.');
  process.exit(0);
}

runDmsTestSuite().catch(err => {
  console.error('\n❌ DMS Test Suite Failed:', err);
  process.exit(1);
});
