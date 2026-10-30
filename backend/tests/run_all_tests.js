/**
 * MASTER TEST RUNNER: ALL 9 TEST SUITES
 * 
 * Executes:
 * 1. Unit Testing Suite (Pure Logic & Calculation Engines)
 * 2. Integration Testing Suite (Cross-Module Workflows & Dual DB)
 * 3. Acceptance Testing Suite (UAT Business Journeys & User Personas)
 * 4. Smoke Testing Suite (Service Health, Ports & Schema Readiness)
 * 5. Sanity Testing Suite (Targeted Bug Fix Verifications)
 * 6. Regression Testing Suite (Core System Stability)
 * 7. End-to-End Testing Suite (E2E Complete Enterprise Data Lifecycle)
 * 8. Component Testing Suite (React Components & DOM Structure)
 * 9. Interface Testing Suite (REST API Contracts & Protocol Schemas)
 */

import { crmPool, hrmsPool } from '../db/pool.js';
import { runUnitTests } from './01_unit_testing_suite.js';
import { runIntegrationTests } from './02_integration_testing_suite.js';
import { runAcceptanceUatTests } from './03_acceptance_uat_testing_suite.js';
import { runSmokeTests } from './04_smoke_testing_suite.js';
import { runSanityTests } from './05_sanity_testing_suite.js';
import { runRegressionTests } from './06_regression_testing_suite.js';
import { runE2eTests } from './07_e2e_testing_suite.js';
import { runComponentTests } from './08_component_testing_suite.js';
import { runInterfaceTests } from './09_interface_testing_suite.js';

async function executeAllSuites() {
  const startTime = Date.now();

  console.log('\n################################################################################');
  console.log('🚀 ENTERPRISE CRM + HRMS + ERP — COMPLETE 9-TYPE AUTOMATED TEST SUITE');
  console.log('################################################################################\n');

  const suiteResults = [];

  try {
    // 1. Unit Testing
    const unitRes = await runUnitTests();
    suiteResults.push(unitRes);

    // 2. Integration Testing
    const integrationRes = await runIntegrationTests();
    suiteResults.push(integrationRes);

    // 3. Acceptance Testing (UAT)
    const uatRes = await runAcceptanceUatTests();
    suiteResults.push(uatRes);

    // 4. Smoke Testing
    const smokeRes = await runSmokeTests();
    suiteResults.push(smokeRes);

    // 5. Sanity Testing
    const sanityRes = await runSanityTests();
    suiteResults.push(sanityRes);

    // 6. Regression Testing
    const regressionRes = await runRegressionTests();
    suiteResults.push(regressionRes);

    // 7. End-to-End (E2E) Testing
    const e2eRes = await runE2eTests();
    suiteResults.push(e2eRes);

    // 8. Component Testing
    const componentRes = await runComponentTests();
    suiteResults.push(componentRes);

    // 9. Interface Testing
    const interfaceRes = await runInterfaceTests();
    suiteResults.push(interfaceRes);

  } catch (err) {
    console.error('Fatal execution error during master test run:', err);
  } finally {
    // Close shared DB pools
    try {
      await Promise.all([crmPool.end(), hrmsPool.end()]);
    } catch (_) {}
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  console.log('\n================================================================================');
  console.log('📊 EXECUTIVE TEST SUMMARY REPORT MATRIX (9 TESTING TYPES)');
  console.log('================================================================================');
  console.log('| # | Test Type Suite             | Total | Passed | Failed | Success Rate | Status |');
  console.log('|---|-----------------------------|-------|--------|--------|--------------|--------|');

  suiteResults.forEach((res, idx) => {
    totalTests += res.total;
    totalPassed += res.passed;
    totalFailed += res.failed;
    const rate = res.total > 0 ? ((res.passed / res.total) * 100).toFixed(1) + '%' : '0.0%';
    const statusIcon = res.failed === 0 ? '✅ PASS' : '❌ FAIL';
    const num = String(idx + 1).padStart(1, ' ');
    const name = res.suite.padEnd(27, ' ');
    const tot = String(res.total).padStart(5, ' ');
    const pass = String(res.passed).padStart(6, ' ');
    const fail = String(res.failed).padStart(6, ' ');
    const ratePadded = rate.padStart(12, ' ');
    console.log(`| ${num} | ${name} | ${tot} | ${pass} | ${fail} | ${ratePadded} | ${statusIcon} |`);
  });

  console.log('--------------------------------------------------------------------------------');
  const overallRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) + '%' : '0.0%';
  console.log(`TOTAL METRICS: ${totalTests} Executed | ${totalPassed} Passed | ${totalFailed} Failed`);
  console.log(`OVERALL COMPLIANCE RATE: ${overallRate} across all 9 Testing Categories`);
  console.log(`EXECUTION TIME: ${durationSec} seconds`);
  console.log('================================================================================\n');

  process.exitCode = totalFailed > 0 ? 1 : 0;
  return { totalTests, totalPassed, totalFailed, suiteResults, durationSec };
}

// Allow CLI invocation
if (process.argv[1]?.endsWith('run_all_tests.js')) {
  executeAllSuites();
}

export { executeAllSuites };

