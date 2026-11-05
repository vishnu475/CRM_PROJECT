/**
 * ============================================================
 * MASTER TEST RUNNER — Enterprise CRM / HRMS / ERP Platform
 * ============================================================
 * Runs all 9 test suites in sequence and provides a
 * consolidated pass/fail summary report.
 *
 * TEST SUITES:
 *   [1] Unit Testing          → tests/unit.test.js
 *   [2] Integration Testing   → tests/integration.test.js
 *   [3] Acceptance (UAT)      → tests/acceptance.test.js
 *   [4] Smoke Testing         → tests/smoke.test.js
 *   [5] Sanity Testing        → tests/sanity.test.js
 *   [6] Regression Testing    → tests/regression.test.js
 *   [7] E2E Testing           → tests/e2e.test.js
 *   [8] Component Testing     → tests/component.test.js
 *   [9] Interface Testing     → tests/interface.test.js
 *
 * HOW TO RUN (ALL SUITES):
 *   cd backend
 *   npm run dev          ← Start backend first (for HTTP tests)
 *   node tests/run-all.js
 *
 * HOW TO RUN UNIT TESTS ONLY (no backend needed):
 *   node tests/unit.test.js
 *
 * HOW TO RUN A SINGLE SUITE:
 *   node tests/smoke.test.js
 *   node tests/regression.test.js
 *   node tests/e2e.test.js
 * ============================================================
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUITES = [
  { id: 1, name: 'Unit Testing',         file: 'unit.test.js',        needsServer: false },
  { id: 2, name: 'Integration Testing',  file: 'integration.test.js', needsServer: true  },
  { id: 3, name: 'Acceptance (UAT)',      file: 'acceptance.test.js',  needsServer: true  },
  { id: 4, name: 'Smoke Testing',         file: 'smoke.test.js',       needsServer: true  },
  { id: 5, name: 'Sanity Testing',        file: 'sanity.test.js',      needsServer: true  },
  { id: 6, name: 'Regression Testing',   file: 'regression.test.js',  needsServer: true  },
  { id: 7, name: 'E2E Testing',           file: 'e2e.test.js',         needsServer: true  },
  { id: 8, name: 'Component Testing',    file: 'component.test.js',   needsServer: true  },
  { id: 9, name: 'Interface Testing',    file: 'interface.test.js',   needsServer: true  },
];

const results = [];
const startTime = Date.now();

// ──────────────────────────────────────────────────────────────
// Check if backend server is reachable
// ──────────────────────────────────────────────────────────────
async function isServerRunning() {
  try {
    const res = await fetch('http://localhost:5000/api/health');
    return res.status === 200 || res.status === 503;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────
// Run a single test file as a subprocess
// ──────────────────────────────────────────────────────────────
function runSuite(file) {
  return new Promise((resolve) => {
    const proc = spawn('node', [path.join(__dirname, file)], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env
    });

    let output = '';
    proc.stdout.on('data', (d) => { output += d.toString(); process.stdout.write(d); });
    proc.stderr.on('data', (d) => { output += d.toString(); process.stderr.write(d); });

    proc.on('close', (code) => {
      resolve({ exitCode: code, output });
    });
  });
}

// ──────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║     MASTER TEST RUNNER — All 9 Test Suites            ║');
console.log('║     Enterprise CRM / HRMS / ERP Platform              ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

const serverUp = await isServerRunning();

if (!serverUp) {
  console.warn('⚠️  WARNING: Backend server is NOT running on localhost:5000');
  console.warn('   HTTP tests (Integration, UAT, Smoke, E2E, etc.) will likely fail.');
  console.warn('   Run: npm run dev (in backend/) and then re-run this file.\n');
  console.warn('   Only Unit Tests (no server required) will be fully reliable.\n');
} else {
  console.log('✅ Backend server is ONLINE at localhost:5000\n');
}

// Run suites sequentially
for (const suite of SUITES) {
  const skip = suite.needsServer && !serverUp;
  console.log(`\n${'─'.repeat(57)}`);
  if (skip) {
    console.log(`⏭️  SKIPPED  [${suite.id}] ${suite.name} (server offline)`);
    results.push({ ...suite, status: 'SKIPPED', exitCode: null });
    continue;
  }

  console.log(`▶  RUNNING  [${suite.id}] ${suite.name}`);
  const { exitCode } = await runSuite(suite.file);
  const status = exitCode === 0 ? 'PASSED' : 'FAILED';
  results.push({ ...suite, status, exitCode });
}

// ──────────────────────────────────────────────────────────────
// FINAL SUMMARY REPORT
// ──────────────────────────────────────────────────────────────
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
const totalPassed = results.filter(r => r.status === 'PASSED').length;
const totalFailed = results.filter(r => r.status === 'FAILED').length;
const totalSkipped = results.filter(r => r.status === 'SKIPPED').length;

console.log('\n\n╔═══════════════════════════════════════════════════════╗');
console.log('║           FINAL TEST REPORT SUMMARY                   ║');
console.log('╠═══════════════════════════════════════════════════════╣');

for (const r of results) {
  const icon = r.status === 'PASSED' ? '✅' : r.status === 'FAILED' ? '❌' : '⏭️ ';
  const padded = `[${r.id}] ${r.name}`.padEnd(38);
  console.log(`║  ${icon}  ${padded}  ${r.status.padEnd(7)} ║`);
}

console.log('╠═══════════════════════════════════════════════════════╣');
console.log(`║  Total Suites : ${String(results.length).padEnd(38)}║`);
console.log(`║  Passed       : ${String(totalPassed).padEnd(38)}║`);
console.log(`║  Failed       : ${String(totalFailed).padEnd(38)}║`);
console.log(`║  Skipped      : ${String(totalSkipped).padEnd(38)}║`);
console.log(`║  Time Elapsed : ${(elapsed + 's').padEnd(38)}║`);
console.log('╚═══════════════════════════════════════════════════════╝\n');

if (totalFailed > 0) {
  console.error('❌ MASTER TEST RUNNER FAILED — Some suites have failures.\n');
  process.exit(1);
} else if (totalSkipped > 0 && totalPassed === 0) {
  console.warn('⚠️  All suites were skipped — start the backend server and re-run.\n');
} else {
  console.log('✅ ALL TEST SUITES PASSED\n');
}
