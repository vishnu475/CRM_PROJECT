import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { LandingPage } from '../components/auth/LandingPage';

const html = ReactDOMServer.renderToString(
  React.createElement(LandingPage, { onNavigate: () => {} })
);

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}`);
    failed++;
  }
}

console.log('\n--- Landing Page Header & Hero Section Verification ---');
assert(html.includes('Login'), 'Login button is present');
assert(!html.includes('Watch Demo'), 'Watch Demo button is completely removed');
assert(!html.includes('Start Free Trial <'), 'Start Free Trial button is completely removed from hero');
assert(!html.includes('Get Started Free'), 'Get Started Free button is completely removed from header');

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exitCode = 1;

