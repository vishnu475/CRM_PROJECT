import { hrmsPool as pool } from '../db/pool.js';
import { TestingService } from '../services/testingService.js';

async function runAcceptanceTest() {
  console.log('\n🌟 =========================================================================');
  console.log('   ACCEPTANCE TEST: PROJECT-CENTRIC TESTING & QA SYSTEM');
  console.log('=========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // Reset Acceptance Request to clean initial state
    await pool.query(`
      UPDATE testing_requests 
      SET status = 'READY_FOR_TESTING', completion_percentage = 75.00, total_tasks = 20, completed_tasks = 15 
      WHERE id = 'TR-PRJ001-ATT'
    `);

    // -------------------------------------------------------------
    // Test 1: Project-Centric Hub Aggregation
    // -------------------------------------------------------------
    console.log('🔹 Step 1: Querying Project-Centric Testing Hub');
    const hub = await TestingService.getProjectCentricTestingHub();
    assert(Array.isArray(hub) && hub.length > 0, 'Hub returns list of active projects');

    const hrmsProject = hub.find(p => p.projectId === 'PRJ-001' || p.projectName === 'HRMS ERP');
    assert(Boolean(hrmsProject), 'Found project HRMS ERP (PRJ-001) in Quality Gate Hub');
    assert(hrmsProject.testingStatus === 'IN PROGRESS', `Project status is IN PROGRESS (Got: ${hrmsProject.testingStatus})`);

    // -------------------------------------------------------------
    // Test 2: Dynamic Project Employees & Module 70% Progress
    // -------------------------------------------------------------
    console.log('\n🔹 Step 2: Validating Project Employees & 75% Completion Threshold');
    const vishnu = hrmsProject.employees.find(e => e.employeeName.includes('Vishnu') || e.employeeId === 'EMP-005');
    assert(Boolean(vishnu), 'Found employee Vishnu Vardhan (EMP-005) assigned to project');
    assert(vishnu.moduleName === 'Attendance', `Assigned module is Attendance (Got: ${vishnu.moduleName})`);
    assert(vishnu.totalTasks === 20, `Total tasks = 20 (Got: ${vishnu.totalTasks})`);
    assert(vishnu.completedTasks === 15, `Completed tasks = 15 (Got: ${vishnu.completedTasks})`);
    assert(vishnu.completionPercentage === 75, `Completion % = 75% (Got: ${vishnu.completionPercentage}%)`);
    assert(vishnu.shouldPulse === true, 'Testing indicator shouldPulse = TRUE (waiting for testing)');
    assert(vishnu.status === 'TESTING REQUIRED' || vishnu.status === 'TESTING', `Testing status badge indicates testing required (Got: ${vishnu.status})`);

    // -------------------------------------------------------------
    // Test 3: Deep Project-Employee-Module Workspace
    // -------------------------------------------------------------
    console.log('\n🔹 Step 3: Loading Deep Workspace /testing/project/PRJ-001/employee/EMP-005/module/MOD-ATT');
    const workspace = await TestingService.getProjectEmployeeModuleWorkspace('PRJ-001', 'EMP-005', 'MOD-ATT');
    assert(workspace.project.name === 'HRMS ERP', 'Workspace loaded correct Project');
    assert(workspace.developer.name === 'Vishnu Vardhan', 'Workspace loaded developer Vishnu Vardhan');
    assert(workspace.module.name === 'Attendance', 'Workspace loaded Attendance module');
    assert(workspace.taskProgress.completionPercentage === 75, 'Workspace task progress is 75%');
    assert(Boolean(workspace.testingRequest.testingUrl), `Testing URL present: ${workspace.testingRequest.testingUrl}`);
    assert(workspace.testCases.length === 10, `Loaded 10 test cases (Got: ${workspace.testCases.length})`);
    assert(workspace.bugs.length >= 1, `Loaded active bugs count >= 1 (Got: ${workspace.bugs.length})`);

    const bug101 = workspace.bugs.find(b => b.bug_id === 'BUG-101');
    assert(Boolean(bug101), 'Found BUG-101 (Camera stream freezes on mobile Safari)');
    assert(bug101.severity === 'HIGH', 'BUG-101 severity is HIGH');

    // -------------------------------------------------------------
    // Test 4: Dynamic Report Submission & Template Fidelity
    // -------------------------------------------------------------
    console.log('\n🔹 Step 4: Submitting Testing Report based on Uploaded PDF Template');
    const submitPayload = {
      projectId: 'PRJ-001',
      projectName: 'HRMS ERP',
      moduleId: 'MOD-ATT',
      moduleName: 'Attendance',
      developerEmployeeId: 'EMP-005',
      developerEmployeeName: 'Vishnu Vardhan',
      testerEmployeeId: 'EMP-004',
      testerEmployeeName: 'Rahul Verma',
      testingRequestId: workspace.testingRequest.id,
      environment: 'Pre-Production',
      version: '1.0',
      totalExecuted: 10,
      passed: 8,
      failed: 1,
      blocked: 1,
      testScopeCoverage: workspace.testCases.map(tc => ({ id: tc.id, title: tc.feature, status: tc.status })),
      blockersNotes: 'Awaiting mobile Safari iOS 17 fix from developer for biometric kiosk camera feed.',
      preparedBy: 'Rahul Verma'
    };

    const submitResult = await TestingService.submitTestingReport(submitPayload, {
      id: 'EMP-004',
      name: 'Rahul Verma',
      role: 'Tester'
    });

    assert(Boolean(submitResult.report), 'Testing report record created');
    assert(submitResult.report.report_status === 'SUBMITTED', 'Testing report status is SUBMITTED');
    assert(submitResult.report.final_verdict === 'FAILED', 'Final verdict is FAILED due to 1 failed test case');
    assert(Number(submitResult.report.pass_rate) === 80, `Pass rate is 80% (Got: ${submitResult.report.pass_rate}%)`);
    assert(Boolean(submitResult.document), 'Testing document record created in testing_documents');
    assert(submitResult.document.status === 'SUBMITTED', 'Testing document status is SUBMITTED');

    const reportId = submitResult.report.id;
    const documentId = submitResult.document.id;

    // -------------------------------------------------------------
    // Test 5: Single Source of Truth in 3 Places
    // -------------------------------------------------------------
    console.log('\n🔹 Step 5: Verifying Document Appears in 3 Locations (Single Source of Truth)');
    
    // 5.1 Project View
    const projectDocs = await TestingService.getTestingDocuments({ projectId: 'PRJ-001' });
    assert(projectDocs.some(d => d.id === documentId && d.testing_report_id === reportId), 'Found document under Project PRJ-001 Testing Documents');

    // 5.2 Employee ESS View
    const employeeDocs = await TestingService.getTestingDocuments({ employeeId: 'EMP-005' });
    assert(employeeDocs.some(d => d.id === documentId && d.testing_report_id === reportId), 'Found document under Employee Vishnu Vardhan (EMP-005) Testing Documents');

    // 5.3 Admin Global View
    const adminDocs = await TestingService.getTestingDocuments({});
    assert(adminDocs.some(d => d.id === documentId && d.testing_report_id === reportId), 'Found document under Admin Global Testing Documents');

    // Verify all 3 point to identical testing_report_id
    const docP = projectDocs.find(d => d.id === documentId);
    const docE = employeeDocs.find(d => d.id === documentId);
    const docA = adminDocs.find(d => d.id === documentId);
    assert(docP.testing_report_id === docE.testing_report_id && docE.testing_report_id === docA.testing_report_id, 'All 3 views reference the EXACT same testing report ID record!');

    // -------------------------------------------------------------
    // Test 6: Admin Review Approval Workflow
    // -------------------------------------------------------------
    console.log('\n🔹 Step 6: Admin Review & Approval Workflow');
    const reviewResult = await TestingService.reviewTestingReport(reportId, {
      action: 'APPROVE',
      comment: 'Reviewed by VP of Engineering Sarah Jenkins. Conditionally approved pending hotfix.'
    }, {
      id: 'EMP-001',
      name: 'Sarah Jenkins',
      role: 'Admin'
    });

    assert(reviewResult.status === 'APPROVED', 'Report reviewed and approved by Admin');
    assert(reviewResult.report.report_status === 'APPROVED', 'Report status updated to APPROVED');

    // Verify document status updated in registry
    const updatedDocs = await TestingService.getTestingDocuments({ projectId: 'PRJ-001' });
    const verifiedDoc = updatedDocs.find(d => d.id === documentId);
    assert(verifiedDoc.status === 'APPROVED', 'Testing document status reflected as APPROVED in shared registry');

    console.log('\n🎉 =========================================================================');
    console.log(`   ALL ${passed}/${total} ACCEPTANCE TESTS PASSED SUCCESSFULLY!`);
    console.log('=========================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Acceptance Test Failed:', err);
    process.exit(1);
  }
}

runAcceptanceTest();
