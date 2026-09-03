import { ESSService } from './services/essService.js';
import { pool } from './db/pool.js';

async function runESSTestSuite() {
  console.log('===========================================================');
  console.log('🚀 EMPLOYEE SELF-SERVICE (ESS) PORTAL PRODUCTION TEST SUITE');
  console.log('===========================================================');

  try {
    const empId = 'EMP-006'; // Ashok (Senior Full Stack Engineer)

    // TEST 1: ESS DASHBOARD SUMMARY & KPIS
    console.log('\n[TEST 1] ESS Dashboard Summary & KPIs Retrieval...');
    const dash = await ESSService.getEmployeeDashboard(empId);
    if (dash.employee.name === 'ashok' && dash.kpis.latestNetSalary > 0) {
      console.log(`✅ PASS: Employee Dashboard loaded for ${dash.employee.name} (${dash.employee.empCode}). Net Salary: ₹${dash.kpis.latestNetSalary.toLocaleString()}`);
    } else {
      throw new Error('FAILED: Dashboard data retrieval failed.');
    }

    // TEST 2: MY PROFILE (MASKED BANK & STATUTORY DATA)
    console.log('\n[TEST 2] ESS My Profile Masked Data Scoping...');
    const prof = await ESSService.getEmployeeProfile(empId);
    if (prof.bankAndStatutory.bankAccount.includes('XXXX')) {
      console.log(`✅ PASS: Profile loaded with masked Bank Account: ${prof.bankAndStatutory.bankAccount} & PAN: ${prof.bankAndStatutory.panNumber}`);
    } else {
      throw new Error('FAILED: Sensitive bank account was unmasked!');
    }

    // TEST 3: CLOCK-IN / CLOCK-OUT REAL-TIME ATTENDANCE
    console.log('\n[TEST 3] Real-Time Clock In / Clock Out Attendance...');
    const checkIn = await ESSService.markCheckIn(empId);
    const checkOut = await ESSService.markCheckOut(empId);
    if (checkIn.success && checkOut.success) {
      console.log(`✅ PASS: Clock-In (${checkIn.message}) & Clock-Out (${checkOut.message}) recorded in PostgreSQL.`);
    } else {
      throw new Error('FAILED: Clock in/out failed.');
    }

    // TEST 4: LEAVE APPLICATION SUBMISSION
    console.log('\n[TEST 4] Leave Application Submission...');
    const leaveRes = await ESSService.submitLeaveRequest(empId, {
      leaveType: 'Casual',
      startDate: '2026-09-10',
      endDate: '2026-09-12',
      reason: 'Personal family event'
    });
    if (leaveRes.success && leaveRes.data.status === 'Pending') {
      console.log(`✅ PASS: Submitted Leave Request ${leaveRes.data.id} (Status: ${leaveRes.data.status})`);
    } else {
      throw new Error('FAILED: Leave application submission failed.');
    }

    // TEST 5: PAYROLL & SERVER-SIDE PDF PAYSLIP GENERATION
    console.log('\n[TEST 5] ESS My Payroll & PDF Payslip Access...');
    const payroll = await ESSService.getEmployeePayroll(empId);
    if (payroll.payslips.length > 0) {
      console.log(`✅ PASS: Retrieved ${payroll.payslips.length} finalized payslips. Latest Net Disbursal: ₹${Number(payroll.payslips[0].net_pay).toLocaleString()}`);
    } else {
      throw new Error('FAILED: No payslips returned for employee.');
    }

    // TEST 6: EXPENSE CLAIM SUBMISSION
    console.log('\n[TEST 6] Expense Claim Submission...');
    const expRes = await ESSService.submitExpenseClaim(empId, {
      category: 'Business Travel',
      amount: 4500,
      description: 'Flight tickets for client meeting in Bengaluru'
    });
    if (expRes.success && expRes.data.status === 'Submitted') {
      console.log(`✅ PASS: Submitted Expense Claim ${expRes.data.id} (Amount: ₹${Number(expRes.data.amount).toLocaleString()})`);
    } else {
      throw new Error('FAILED: Expense claim submission failed.');
    }

    // TEST 7: DEPARTMENT / BRANCH TRANSFER REQUEST
    console.log('\n[TEST 7] Department & Branch Transfer Request...');
    const transRes = await ESSService.submitTransferRequest(empId, {
      requestedDepartment: 'Product',
      requestedBranch: 'Bengaluru Tech Hub',
      preferredEffectiveDate: '2026-10-01',
      reason: 'Relocation to Bengaluru'
    });
    if (transRes.success && transRes.data.status === 'Submitted') {
      console.log(`✅ PASS: Submitted Transfer Request ${transRes.data.id} (Engineering ➔ ${transRes.data.requested_department})`);
    } else {
      throw new Error('FAILED: Transfer request failed.');
    }

    // TEST 8: 1-CLICK INTERNAL JOB APPLICATION
    console.log('\n[TEST 8] 1-Click Internal Job Application...');
    const jobRes = await ESSService.applyInternalJob(empId, 'JOB-INT-101', 'Experienced engineer applying for Lead Architect opening.');
    if (jobRes.success && jobRes.data.status === 'Applied') {
      console.log(`✅ PASS: Applied for Internal Job ${jobRes.data.job_id} (Application ID: ${jobRes.data.id})`);
    } else {
      throw new Error('FAILED: Internal job application failed.');
    }

    // TEST 9: DAILY TIMESHEET LOGGING
    console.log('\n[TEST 9] Daily Task & Project Timesheet Entry...');
    const tsRes = await ESSService.submitTimesheet(empId, {
      projectName: 'ERP Suite 2.0',
      taskName: 'ESS Portal Module Integration',
      date: '2026-08-22',
      hoursSpent: 8.5,
      description: 'Completed ESS Portal endpoints, React views, and PostgreSQL schema.'
    });
    if (tsRes.success && tsRes.data.status === 'Submitted') {
      console.log(`✅ PASS: Logged Timesheet Entry ${tsRes.data.id} (${tsRes.data.hours_spent} Hours on ${tsRes.data.project_name})`);
    } else {
      throw new Error('FAILED: Timesheet submission failed.');
    }

    // TEST 10: PERFORMANCE SELF-REVIEW EVALUATION
    console.log('\n[TEST 10] Performance Self-Review Evaluation...');
    const selfRes = await ESSService.submitSelfReview(empId, {
      selfRating: 4.8,
      selfReviewNotes: 'Delivered central payroll and ESS portal modules with 100% test coverage.'
    });
    if (selfRes.success && selfRes.data.status === 'Manager Review') {
      console.log(`✅ PASS: Submitted Performance Self-Review (Rating: ${selfRes.data.self_rating}/5.0, Status: ${selfRes.data.status})`);
    } else {
      throw new Error('FAILED: Self-review submission failed.');
    }

    console.log('\n===========================================================');
    console.log('🎉 ALL 10 ESS PORTAL INTEGRATION TESTS PASSED (100% GREEN)');
    console.log('===========================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ESS SUITE ERROR:', err);
    process.exit(1);
  }
}

runESSTestSuite();
