/**
 * Automated Verification Suite for Intern Onboarding Wizard Validation
 * Tests Step 1-5 validation, draft validation, aggregate review, and backend API validation.
 */

import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateAllSteps,
  validateDraft,
  validatePhone,
  validateDob,
  validateCgpa,
  validateFileName,
  InternFormData
} from '../modules/hrms/utils/internOnboardingValidation';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING INTERN ONBOARDING VALIDATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // -----------------------------------------------------------------
  // 1. Phone Number Format Validation (10 digits only)
  // -----------------------------------------------------------------
  console.log('--- 1. Phone Number Validation ---');
  assert('Rejects phone with letters', validatePhone('98765abcde') === 'Phone number must be 10 digits only.');
  assert('Rejects phone that is too short', validatePhone('12345') === 'Phone number must be 10 digits only.');
  assert('Rejects phone with more than 10 digits (e.g. 32-digit string)', validatePhone('77777777777777777777777777777777') === 'Phone number must be 10 digits only.');
  assert('Rejects international phone with other length (e.g. US 11 digits)', validatePhone('+1 415 555 2671') === 'Phone number must be 10 digits only.');
  assert('Accepts valid 10-digit phone', validatePhone('9876543210') === null);
  assert('Accepts valid 10-digit phone starting with 7', validatePhone('7777777777') === null);
  assert('Accepts valid 10-digit phone with +91 country prefix', validatePhone('+91 98765 43210') === null);

  // -----------------------------------------------------------------
  // 2. Date of Birth & Age Eligibility
  // -----------------------------------------------------------------
  console.log('\n--- 2. Date of Birth Validation ---');
  assert('Rejects empty DOB', validateDob('') !== null);
  assert('Rejects future DOB', validateDob('2099-01-01') !== null);
  assert('Rejects candidate under 16 years old', validateDob('2020-01-01') !== null);
  assert('Accepts valid candidate DOB (e.g. 2003-05-15, age 20+)', validateDob('2003-05-15') === null);

  // -----------------------------------------------------------------
  // 3. CGPA and Academic Grading Scale
  // -----------------------------------------------------------------
  console.log('\n--- 3. Academic CGPA / Percentage Validation ---');
  assert('Rejects negative CGPA', validateCgpa('-2.5') !== null);
  assert('Rejects CGPA exceeding 10.0 on 10-point scale', validateCgpa('11.5 CGPA') !== null);
  assert('Rejects percentage exceeding 100%', validateCgpa('105%') !== null);
  assert('Accepts valid CGPA 8.75', validateCgpa('8.75 CGPA') === null);
  assert('Accepts valid percentage 82%', validateCgpa('82%') === null);

  // -----------------------------------------------------------------
  // 4. File Extension Validation
  // -----------------------------------------------------------------
  console.log('\n--- 4. Document File Extension Validation ---');
  assert('Rejects executable file extension (.exe)', validateFileName('script.exe') !== null);
  assert('Accepts PDF resume', validateFileName('candidate_resume.pdf') === null);
  assert('Accepts Word document (.docx)', validateFileName('college_certificate.docx') === null);
  assert('Accepts image ID card (.jpg)', validateFileName('student_id.jpg') === null);

  // -----------------------------------------------------------------
  // 5. Step 1: Personal Information Validation
  // -----------------------------------------------------------------
  console.log('\n--- 5. Step 1 Personal Info Validation ---');
  const emptyStep1 = validateStep1({});
  assert('Step 1 fails on empty input', !emptyStep1.isValid);
  assert('Requires fullName', Boolean(emptyStep1.errors.fullName));
  assert('Requires email', Boolean(emptyStep1.errors.email));

  const invalidNameStep1 = validateStep1({ fullName: 'Riya123!!', email: 'test@example.com', dob: '2002-05-15', gender: 'Female' });
  assert('Rejects name with digits/symbols', Boolean(invalidNameStep1.errors.fullName));

  const validStep1 = validateStep1({
    fullName: 'Riya Sen',
    email: 'riya.sen@college.edu',
    phone: '+91 98765 43210',
    dob: '2003-05-15',
    gender: 'Female',
    address: 'Indiranagar, Bengaluru, Karnataka',
    emergencyContact: 'Ramesh Sen (Father) — +91 98765 00000'
  });
  assert('Passes Step 1 with complete and valid details', validStep1.isValid);

  // -----------------------------------------------------------------
  // 6. Step 2: Academic Details Validation
  // -----------------------------------------------------------------
  console.log('\n--- 6. Step 2 Academic Details Validation ---');
  const emptyStep2 = validateStep2({});
  assert('Step 2 fails on empty input', !emptyStep2.isValid);
  assert('Requires college', Boolean(emptyStep2.errors.college));
  assert('Requires branch', Boolean(emptyStep2.errors.branch));

  const validStep2 = validateStep2({
    college: 'National Institute of Technology Karnataka (NITK)',
    degree: 'B.Tech / B.E.',
    branch: 'Computer Science & Engineering',
    graduationYear: '2025',
    rollNumber: '21CS089',
    cgpa: '8.92 CGPA',
    resumeName: 'Riya_Sen_Resume_2025.pdf'
  });
  assert('Passes Step 2 with valid academic details', validStep2.isValid);

  // -----------------------------------------------------------------
  // 7. Step 3: Internship Setup Validation
  // -----------------------------------------------------------------
  console.log('\n--- 7. Step 3 Internship Setup Validation ---');
  const invalidDatesStep3 = validateStep3({
    internshipType: 'Technical',
    department: 'Engineering',
    designation: 'Software Engineering Intern',
    workMode: 'Hybrid',
    startDate: '2026-10-01',
    endDate: '2026-09-01', // End date before start date!
    duration: '6 Months',
    stipend: '25000',
    location: 'Bengaluru HQ',
    mentor: 'Rahul Verma'
  });
  assert('Rejects end date preceding start date', Boolean(invalidDatesStep3.errors.endDate));

  const negativeStipendStep3 = validateStep3({
    internshipType: 'Technical',
    department: 'Engineering',
    designation: 'Software Engineering Intern',
    workMode: 'Hybrid',
    startDate: '2026-10-01',
    endDate: '2027-04-01',
    duration: '6 Months',
    stipend: '-5000', // Negative stipend!
    location: 'Bengaluru HQ',
    mentor: 'Rahul Verma'
  });
  assert('Rejects negative stipend', Boolean(negativeStipendStep3.errors.stipend));

  const validStep3 = validateStep3({
    internshipType: 'Technical',
    department: 'Engineering',
    designation: 'Software Engineering Intern',
    workMode: 'Hybrid',
    startDate: '2026-10-01',
    endDate: '2027-04-01',
    duration: '6 Months',
    stipend: '25000',
    location: 'Bengaluru HQ',
    mentor: 'Rahul Verma'
  });
  assert('Passes Step 3 with valid internship terms', validStep3.isValid);

  // -----------------------------------------------------------------
  // 8. Step 4: Documents Validation
  // -----------------------------------------------------------------
  console.log('\n--- 8. Step 4 Documents Validation ---');
  const emptyDocsStep4 = validateStep4({ documents: [] });
  assert('Rejects empty documents list', !emptyDocsStep4.isValid);

  const missingResumeStep4 = validateStep4({
    documents: [
      { name: 'College_ID.jpg', type: 'College ID', status: 'Uploaded' }
    ]
  });
  assert('Rejects when mandatory Resume is missing', Boolean(missingResumeStep4.errors.documents));

  const validStep4 = validateStep4({
    documents: [
      { name: 'Riya_Resume.pdf', type: 'Resume', status: 'Uploaded' },
      { name: 'College_ID.jpg', type: 'College ID', status: 'Uploaded' }
    ]
  });
  assert('Passes Step 4 when Resume and valid documents are attached', validStep4.isValid);

  // -----------------------------------------------------------------
  // 9. Step 5: Access & Assets Validation
  // -----------------------------------------------------------------
  console.log('\n--- 9. Step 5 Access & Assets Validation ---');
  const invalidEmailStep5 = validateStep5({ companyEmail: 'invalid-email-format' });
  assert('Rejects malformed corporate email', Boolean(invalidEmailStep5.errors.companyEmail));

  const validStep5 = validateStep5({
    companyEmail: 'riya.sen@company.com',
    assignedDevice: 'MacBook Air M2 (INT-DEV-01)'
  });
  assert('Passes Step 5 with valid asset configuration', validStep5.isValid);

  // -----------------------------------------------------------------
  // 10. Step 6: Review & Confirmation Aggregate Validation
  // -----------------------------------------------------------------
  console.log('\n--- 10. Step 6 Aggregate Review Validation ---');
  const completeInternData: InternFormData = {
    internId: 'INT-205',
    fullName: 'Riya Sen',
    dob: '2003-05-15',
    gender: 'Female',
    email: 'riya.sen@college.edu',
    phone: '+91 98765 43210',
    address: 'Bengaluru',
    emergencyContact: 'Father - +91 98765 00000',
    college: 'NIT Karnataka',
    degree: 'B.Tech / B.E.',
    branch: 'Computer Science',
    graduationYear: '2025',
    rollNumber: '21CS089',
    cgpa: '8.92 CGPA',
    resumeName: 'resume.pdf',
    internshipType: 'Technical',
    department: 'Engineering',
    designation: 'Software Engineering Intern',
    startDate: '2026-11-01',
    endDate: '2027-05-01',
    duration: '6 Months',
    workMode: 'Hybrid',
    location: 'Bengaluru HQ',
    stipend: '25000',
    reportingManager: 'Sarah Jenkins',
    reportingManagerId: 'EMP-001',
    mentor: 'Rahul Verma',
    mentorId: 'EMP-004',
    documents: [
      { name: 'Riya_Resume.pdf', type: 'Resume', status: 'Uploaded' }
    ],
    companyEmail: 'riya.sen@company.com',
    systemAccess: true,
    attendanceAccess: true,
    assignedDevice: 'MacBook Air M2',
    idCardIssued: true,
    checklist: [{ task: 'ID Badge Issued', completed: true }]
  };

  const allValidResult = validateAllSteps(completeInternData);
  assert('All steps pass for complete valid intern', allValidResult.isValid);
  assert('Total error count is 0', allValidResult.totalErrors === 0);

  const brokenInternData = {
    ...completeInternData,
    fullName: '', // Breaks Step 1
    college: '',  // Breaks Step 2
    endDate: '2026-10-01' // Breaks Step 3
  };
  const brokenResult = validateAllSteps(brokenInternData);
  assert('Aggregate validation fails when any step has invalid data', !brokenResult.isValid);
  assert('First invalid step is identified as Step 1', brokenResult.firstInvalidStep === 1);
  assert('Identifies multiple errors across steps', brokenResult.totalErrors >= 3);

  // -----------------------------------------------------------------
  // 11. Save as Draft Validation
  // -----------------------------------------------------------------
  console.log('\n--- 11. Save as Draft Validation ---');
  const emptyDraft = validateDraft({});
  assert('Draft fails when full name is missing', !emptyDraft.isValid);

  const validDraft = validateDraft({
    fullName: 'Riya Sen (Incomplete Candidate)'
    // Steps 2-5 are blank, but draft allows saving
  });
  assert('Draft succeeds with only full legal name', validDraft.isValid);

  const invalidFieldDraft = validateDraft({
    fullName: 'Riya Sen',
    email: 'not-an-email', // If provided, format must be valid
    stipend: '-100'
  });
  assert('Draft catches malformed email if provided', Boolean(invalidFieldDraft.errors.email));
  assert('Draft catches negative stipend if provided', Boolean(invalidFieldDraft.errors.stipend));

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

