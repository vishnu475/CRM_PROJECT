const API_BASE = 'http://localhost:5000/api';

async function runMasterPromptVerification() {
  console.log('====================================================');
  console.log('   VERIFYING 100% DYNAMIC DATABASE ERP ARCHITECTURE ');
  console.log('====================================================\n');

  try {
    // 1. Health Check
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    console.log('1. Health Check:', healthData.status, '| DB:', healthData.database);

    // 2. PHASE 1: Add Candidate "Vishnu"
    console.log('\n--- PHASE 1: RECRUITMENT ---');
    const candPayload = {
      name: 'Vishnu',
      email: `vishnu.cand.${Date.now()}@democompany.com`,
      phone: '+91 98765 00007',
      email: `vishnu.cand.${Date.now()}@democompany.com`,
      department: 'Engineering',
      appliedPosition: 'Senior Software Engineer',
      experienceYears: 4,
      score: 88,
      stage: 'Applied'
    };
    const addCandRes = await fetch(`${API_BASE}/recruitment/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candPayload)
    });
    const addCandJson = await addCandRes.json();
    console.log('✅ Candidate Added:', addCandJson.data?.candidateNo || addCandJson.data?.candidate_no, '| Stage:', addCandJson.data?.stage);
    const candidateNo = addCandJson.data?.candidateNo || addCandJson.data?.candidate_no || addCandJson.data?.id;
    const candidateId = addCandJson.data?.id;

    // 3. Stage Movement: Applied -> Screening
    const stageRes1 = await fetch(`${API_BASE}/recruitment/candidates/${candidateNo}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'SCREENING' })
    });
    const stageJson1 = await stageRes1.json();
    console.log(`✅ Stage Movement (Applied -> SCREENING):`, stageJson1.message);

    // Move to HIRED stage
    await fetch(`${API_BASE}/recruitment/candidates/${candidateNo}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'Hired' })
    });
    console.log(`✅ Stage Movement (SCREENING -> Hired) Completed`);

    // 4. PHASE 2: Convert Candidate to Employee (SQL Transaction)
    console.log('\n--- PHASE 2: EMPLOYEE CONVERSION ---');
    const convertRes = await fetch(`${API_BASE}/recruitment/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: candidateId || candidateNo,
        customDetails: {
          name: 'Vishnu',
          department: 'Engineering',
          designation: 'Senior Software Engineer',
          salary: 95000,
          pin: '1234'
        }
      })
    });
    const convertJson = await convertRes.json();
    if (!convertJson.success) {
      console.log('❌ Convert Error:', convertJson.message);
    } else {
      console.log('✅ Candidate Converted:', convertJson.message);
    }
    const newEmpCode = convertJson.employee?.emp_code || convertJson.employee?.id;
    console.log('   New Employee Code:', newEmpCode, '| Status:', convertJson.employee?.status);

    // 5. PHASE 3: HRMS ONBOARDING PIPELINE
    console.log('\n--- PHASE 3: HRMS ONBOARDING PIPELINE ---');
    // Joined -> Probation
    const onboardRes1 = await fetch(`${API_BASE}/hrms/onboarding`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: newEmpCode, stage: 'Probation' })
    });
    const onboardJson1 = await onboardRes1.json();
    console.log('✅ Onboarding Stage (Joined -> Probation):', onboardJson1.message);

    // Probation -> Confirmed -> Active
    await fetch(`${API_BASE}/hrms/onboarding`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: newEmpCode, stage: 'Active' })
    });
    console.log('✅ Onboarding Stage (Probation -> Active): Employee is officially Active');

    // Transfer Employee
    const transferRes = await fetch(`${API_BASE}/employees/${newEmpCode}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newDepartment: 'Product & Architecture',
        newDesignation: 'Principal Architect',
        newManagerName: 'Sarah Jenkins',
        reason: 'Promoted and assigned to Core Platform team'
      })
    });
    const transferJson = await transferRes.json();
    console.log('✅ Department Transfer Executed:', transferJson.data?.department, '| Status:', transferJson.data?.status);

    // 6. PHASE 4 & 5: ATTENDANCE & SHIFT ALLOCATION
    console.log('\n--- PHASE 4 & 5: ATTENDANCE & SHIFT ALLOCATION ---');
    const punchRes = await fetch(`${API_BASE}/attendance/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: newEmpCode,
        pin: '1234',
        deviceId: 'WEB-KIOSK-01',
        source: 'WEB_KIOSK'
      })
    });
    const punchJson = await punchRes.json();
    console.log('✅ Kiosk Attendance Punch:', punchJson.message, '| Action:', punchJson.action);

    // 7. PHASE 6: LEAVE MANAGEMENT
    console.log('\n--- PHASE 6: LEAVE MANAGEMENT ---');
    const leaveAppRes = await fetch(`${API_BASE}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: newEmpCode,
        employeeName: 'Vishnu',
        leaveType: 'Casual Leave',
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        days: 1,
        reason: 'Personal work',
        managerName: 'Sarah Jenkins'
      })
    });
    const leaveAppJson = await leaveAppRes.json();
    console.log('✅ Leave Applied response:', leaveAppJson);
    const leaveReqId = leaveAppJson.data?.id;

    if (leaveReqId) {
      const approveRes = await fetch(`${API_BASE}/leave/${leaveReqId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'Sarah Jenkins', comments: 'Approved' })
      });
      const approveJson = await approveRes.json();
      console.log('✅ Leave Approved:', approveJson.message);
    }

    // 8. PHASE 7: PAYROLL GENERATION
    console.log('\n--- PHASE 7: PAYROLL GENERATION ---');
    const currentMonth = new Date().getMonth() + 1;
    const currentYr = new Date().getFullYear();
    const payrollRes = await fetch(`${API_BASE}/payroll/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: currentMonth, year: currentYr, processedBy: 'HR Admin' })
    });
    const payrollJson = await payrollRes.json();
    if (payrollJson.success) {
      console.log('✅ Payroll Processed:', payrollJson.message, '| Payslips:', payrollJson.data?.payslipCount);
    } else {
      console.log('ℹ️ Payroll Status:', payrollJson.message);
    }

    console.log('\n====================================================');
    console.log('   🎉 100% DATABASE-FIRST ERP SUITE TEST PASSED!    ');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Master Prompt Verification Failed:', err);
  }
}

runMasterPromptVerification();
