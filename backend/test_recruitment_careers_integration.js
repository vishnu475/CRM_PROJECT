import { pool } from './db/pool.js';
import { RecruitmentService } from './services/recruitmentService.js';

async function runRecruitmentCareersTest() {
  console.log('================================================================');
  console.log('🚀 TESTING CAREERS PAGE APPLICATION ➔ HRMS RECRUITMENT PIPELINE');
  console.log('================================================================\n');

  try {
    // 1. Submit Candidate Application from Careers page
    console.log('[STEP 1] Candidate submitting application on Careers page...');
    const candidateData = {
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+91 98765 43210',
      department: 'Engineering',
      appliedPosition: 'Senior Full Stack Engineer (React & Node.js)',
      jobTitle: 'Senior Full Stack Engineer (React & Node.js)',
      recruiter: 'Talent Acquisition Desk',
      stage: 'Applied',
      status: 'Active',
      experienceYears: 5,
      education: 'B.Tech Computer Science',
      skills: JSON.stringify(['React', 'TypeScript', 'Node.js', 'PostgreSQL']),
      expectedSalary: 1600000
    };

    const newCandidate = await RecruitmentService.addCandidate(candidateData);
    console.log('  ✅ PASS: Candidate created in PostgreSQL database!');
    console.log('     Candidate ID:', newCandidate.id);
    console.log('     Candidate No:', newCandidate.candidate_no);
    console.log('     Candidate Name:', newCandidate.name);
    console.log('     Stage:', newCandidate.stage);

    // 2. Fetch all candidates in HRMS Recruitment Pipeline
    console.log('\n[STEP 2] HR Team fetching candidates in HRMS Recruitment ATS...');
    const allCandidates = await RecruitmentService.getCandidates();
    const foundCandidate = allCandidates.find(c => c.name === 'Priya Sharma');

    if (foundCandidate) {
      console.log('  ✅ PASS: Found candidate in HRMS Recruitment ATS Board!');
      console.log('     Name:', foundCandidate.name);
      console.log('     Position:', foundCandidate.appliedPosition);
      console.log('     Stage:', foundCandidate.stage);

      console.log('\n================================================================');
      console.log('🎉 100% SUCCESS: CAREERS PAGE & HRMS RECRUITMENT SYNC VERIFIED!');
      console.log('================================================================');
    } else {
      console.error('❌ FAIL: Candidate not found in HRMS Recruitment Pipeline');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error during test:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runRecruitmentCareersTest();
