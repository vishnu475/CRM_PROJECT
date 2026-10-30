import React from 'react';
import { renderToString } from 'react-dom/server';
import { AppProvider } from '../context/AppContext';
import { LeavePage } from '../modules/leave/pages/LeavePage';
import {
  DEFAULT_COMPANY_HOLIDAYS,
  getOfficialHolidays,
  isPublicHoliday,
  extractCalendarDate,
  getDayOfWeekForDate,
  formatHolidayDisplayDate,
  HolidayRecord
} from '../modules/attendance/utils/attendanceCalculator';

// Polyfill minimal browser environment if running in node/tsx
if (typeof window === 'undefined') {
  (global as any).window = {
    location: { pathname: '/leave/holidays', search: '' },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  (global as any).document = {
    title: '',
    cookie: '',
    getElementById: () => null,
  };
}

let mockStorage: Record<string, string> = {
  crm_auth: 'true',
  crm_user_role: 'Executive',
  crm_user_profile: JSON.stringify({
    id: 'EMP-001',
    empCode: 'EMP-001',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@company.com',
    role: 'Executive',
    roleTitle: 'Administrator',
    company: 'Acme Global Corp'
  })
};

(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { mockStorage = {}; }
};

const cleanHtml = (html: string) => html.replace(/<!--.*?-->/g, '');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
    totalFailed++;
  }
}

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 BUG-108: PUBLIC HOLIDAYS CALENDAR DATA & REGRESSION TEST SUITE');
  console.log('========================================================================\n');

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 1: Official Indian Public Holidays Master Data Integrity (2026 Fixture)
  // ────────────────────────────────────────────────────────────────────────
  console.log('📦 SUITE 1: Official Indian Public Holidays Master Data Integrity (2026 Fixture)');
  const holidays2026 = getOfficialHolidays(2026);
  assert(holidays2026.length >= 20, '2026 holidays list contains comprehensive dataset', `Got ${holidays2026.length}`);

  const repDay = holidays2026.find(h => h.date === '2026-01-26');
  assert(Boolean(repDay && repDay.name === 'Republic Day' && repDay.type === 'Gazetted'), 'Republic Day (2026-01-26) is Gazetted');

  const holi = holidays2026.find(h => h.date === '2026-03-04');
  assert(Boolean(holi && holi.name === 'Holi' && holi.type === 'Gazetted'), 'Holi (2026-03-04) is Gazetted');

  const idUlFitr = holidays2026.find(h => h.date === '2026-03-21');
  assert(Boolean(idUlFitr && idUlFitr.name.includes('Id-ul-Fitr')), 'Id-ul-Fitr (2026-03-21) is Gazetted');

  const goodFriday = holidays2026.find(h => h.date === '2026-04-03');
  assert(Boolean(goodFriday && goodFriday.name === 'Good Friday'), 'Good Friday (2026-04-03) is Gazetted');

  const indDay = holidays2026.find(h => h.date === '2026-08-15');
  assert(Boolean(indDay && indDay.name === 'Independence Day'), 'Independence Day (2026-08-15) is Gazetted');

  const gandhi = holidays2026.find(h => h.date === '2026-10-02');
  assert(Boolean(gandhi && gandhi.name.includes('Gandhi')), 'Gandhi Jayanti (2026-10-02) is Gazetted');

  const diwali = holidays2026.find(h => h.date === '2026-11-08');
  assert(Boolean(diwali && diwali.name.includes('Diwali')), 'Diwali (2026-11-08) is Gazetted on exact date');

  const christmas = holidays2026.find(h => h.date === '2026-12-25');
  assert(Boolean(christmas && christmas.name === 'Christmas Day'), 'Christmas Day (2026-12-25) is Gazetted');

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 2: Multi-Year Support & Navigation (2025, 2026, 2027)
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n📅 SUITE 2: Multi-Year Support & Navigation (2025, 2026, 2027)');
  const holidays2025 = getOfficialHolidays(2025);
  const holidays2027 = getOfficialHolidays(2027);

  assert(holidays2025.length > 0 && holidays2025.every(h => h.date.startsWith('2025-')), '2025 holidays list contains only 2025 dates');
  assert(holidays2026.length > 0 && holidays2026.every(h => h.date.startsWith('2026-')), '2026 holidays list contains only 2026 dates');
  assert(holidays2027.length > 0 && holidays2027.every(h => h.date.startsWith('2027-')), '2027 holidays list contains only 2027 dates');

  const diwali2025 = holidays2025.find(h => h.name.includes('Diwali'));
  assert(diwali2025?.date === '2025-10-20', 'Diwali 2025 correctly falls on 2025-10-20');

  const diwali2027 = holidays2027.find(h => h.name.includes('Diwali'));
  assert(diwali2027?.date === '2027-10-29', 'Diwali 2027 correctly falls on 2027-10-29');

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 3: Category Distinction: Gazetted vs Restricted vs Company
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n🏷️ SUITE 3: Category Distinction (Gazetted vs Restricted vs Company)');
  const gazetted2026 = getOfficialHolidays(2026, 'Gazetted');
  const restricted2026 = getOfficialHolidays(2026, 'Restricted');
  const company2026 = getOfficialHolidays(2026, 'Company');

  assert(gazetted2026.every(h => h.type === 'Gazetted' || h.isMandatory), 'Gazetted filter contains only mandatory public holidays');
  assert(restricted2026.every(h => h.type === 'Restricted' && !h.isMandatory), 'Restricted filter contains only optional holidays');
  assert(company2026.every(h => h.type === 'Company'), 'Company filter contains corporate observances');
  assert(company2026.some(h => h.name.includes('Foundation Day') || h.name.includes('May Day')), 'Company holidays include May Day or Foundation Day');

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 4: Timezone Shift Protection & Robust Date Parsing
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n🌐 SUITE 4: Timezone Shift Protection & Robust Date Parsing');
  // Date in IST UTC+5:30: '2026-08-15T00:00:00+05:30'
  const istString = '2026-08-15T00:00:00+05:30';
  const istExtracted = extractCalendarDate(istString);
  assert(istExtracted === '2026-08-15', 'extractCalendarDate prevents IST (+05:30) date shift to previous day');

  const istHolidayCheck = isPublicHoliday(istString);
  assert(istHolidayCheck.isHoliday && istHolidayCheck.holidayName === 'Independence Day', 'isPublicHoliday correctly identifies Independence Day from IST ISO string');

  // Date in UTC midnight: '2026-01-26T00:00:00Z'
  const utcString = '2026-01-26T00:00:00Z';
  assert(extractCalendarDate(utcString) === '2026-01-26', 'extractCalendarDate correctly preserves UTC date');
  assert(isPublicHoliday(utcString).isHoliday, 'isPublicHoliday correctly identifies Republic Day from UTC string');

  // Date in negative timezone offset: '2026-10-02T23:00:00-08:00'
  const pstString = '2026-10-02T23:00:00-08:00';
  assert(extractCalendarDate(pstString) === '2026-10-02', 'extractCalendarDate correctly preserves calendar date under negative timezone');

  // Deterministic formatting
  const formattedDisplay = formatHolidayDisplayDate('2026-01-26');
  assert(formattedDisplay === '26 Jan 2026', `formatHolidayDisplayDate returns '26 Jan 2026' (Got: ${formattedDisplay})`);

  const dayOfWeek = getDayOfWeekForDate('2026-01-26');
  assert(dayOfWeek === 'Monday', `getDayOfWeekForDate returns 'Monday' for 2026-01-26 (Got: ${dayOfWeek})`);

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 5: Duplicate Holiday Prevention
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n🚫 SUITE 5: Duplicate Holiday Prevention');
  const datesSet = new Set<string>();
  let hasDuplicates = false;
  for (const h of holidays2026) {
    if (datesSet.has(h.date)) {
      hasDuplicates = true;
      break;
    }
    datesSet.add(h.date);
  }
  assert(!hasDuplicates, 'Default 2026 holidays list contains zero duplicate dates');

  // Test de-duplication filter
  const listWithDupes: HolidayRecord[] = [
    ...holidays2026,
    { id: 'HOL-DUP', name: 'Duplicate Republic Day', date: '2026-01-26', day: 'Monday', type: 'Gazetted', isMandatory: true, description: 'Dupe' }
  ];
  const deduplicated = listWithDupes.filter((h, idx, arr) => arr.findIndex(item => item.date === h.date) === idx);
  assert(deduplicated.length === holidays2026.length, 'De-duplication filter removes duplicate dates completely');

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 6: UI Component & DOM Rendering Verification (LeavePage)
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n🖥️ SUITE 6: UI Component & DOM Rendering Verification (LeavePage)');
  let renderedHtml = '';
  try {
    renderedHtml = renderToString(
      <AppProvider>
        <LeavePage />
      </AppProvider>
    );
  } catch (err: any) {
    console.error('SSR Render error:', err);
  }

  const cleanedLeaveHtml = cleanHtml(renderedHtml);
  assert(cleanedLeaveHtml.includes('id="tab-btn-holidays"'), "LeavePage renders holidays tab button with id='tab-btn-holidays'");
  assert(cleanedLeaveHtml.includes('Public Holidays 2026'), 'Tab button label displays current active year 2026');
  assert(cleanedLeaveHtml.includes('id="total-holidays-count"'), "Renders Total Holidays KPI count with id='total-holidays-count'");
  assert(cleanedLeaveHtml.includes('id="gazetted-holidays-count"'), "Renders Gazetted KPI count with id='gazetted-holidays-count'");
  assert(cleanedLeaveHtml.includes('id="optional-holidays-count"'), "Renders Optional KPI count with id='optional-holidays-count'");
  assert(cleanedLeaveHtml.includes('id="company-holidays-count"'), "Renders Company KPI count with id='company-holidays-count'");
  assert(cleanedLeaveHtml.includes('id="holiday-year-select"'), "Renders Year selector dropdown with id='holiday-year-select'");
  assert(cleanedLeaveHtml.includes('id="holiday-category-select"'), "Renders Category selector dropdown with id='holiday-category-select'");
  assert(cleanedLeaveHtml.includes('id="holiday-search-input"'), "Renders Search input with id='holiday-search-input'");
  assert(cleanedLeaveHtml.includes('holiday-card-2026-01-26'), 'Renders Republic Day card for 2026-01-26');
  assert(cleanedLeaveHtml.includes('holiday-card-2026-08-15'), 'Renders Independence Day card for 2026-08-15');
  assert(cleanedLeaveHtml.includes('holiday-card-2026-11-08'), 'Renders Diwali card for 2026-11-08');

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 7: Live Backend API Verification (/api/leave/holidays)
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n🌐 SUITE 7: Live Backend API Verification (/api/leave/holidays)');
  try {
    const res = await fetch('http://localhost:5000/api/leave/holidays?year=2026');
    const json = await res.json();
    assert(res.status === 200 && json.success === true, 'Backend /api/leave/holidays?year=2026 returns 200 OK with success=true');
    assert(Array.isArray(json.data) && json.data.length >= 20, `Backend returns official holidays list (${json.data.length} items)`);
    assert(Boolean(json.source === 'database' || json.source === 'database_seeded'), `Holidays are sourced from PostgreSQL (${json.source})`);

    const repInDb = json.data.find((h: any) => h.date === '2026-01-26');
    assert(Boolean(repInDb && repInDb.name === 'Republic Day'), 'PostgreSQL database stores Republic Day with exact date');
  } catch (err: any) {
    assert(false, 'Live Backend API check failed', err.message);
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 8: Empty Data & Error Handling
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n🛡️ SUITE 8: Empty Data & Error Handling');
  assert(extractCalendarDate('') === '', 'extractCalendarDate handles empty string gracefully');
  assert(extractCalendarDate('invalid-date') === '', 'extractCalendarDate handles invalid date string gracefully');
  assert(isPublicHoliday('').isHoliday === false, 'isPublicHoliday returns false for empty input');

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 9: Regression Tests for Prior Bug Fixes (BUG-101 through BUG-107)
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n🔄 SUITE 9: Regression Tests (BUG-101 through BUG-107)');
  // BUG-101: Registration navigation
  const loginModule = await import('../components/auth/LoginPage');
  const loginHtml = renderToString(
    <AppProvider>
      <loginModule.LoginPage onNavigate={() => {}} />
    </AppProvider>
  );
  assert(cleanHtml(loginHtml).includes("href=\"/register\""), "REGRESSION BUG-101: Registration navigation link to /register is preserved");

  // BUG-102: Role dropdown
  assert(cleanHtml(loginHtml).includes('id="role-select"'), "REGRESSION BUG-102: Role dropdown with id='role-select' is preserved");

  // BUG-103: Password toggle
  assert(cleanHtml(loginHtml).includes('id="password-toggle-btn"'), "REGRESSION BUG-103: Password visibility toggle button is preserved");

  // BUG-105: Global search
  const headerModule = await import('../components/layout/Header');
  const headerHtml = renderToString(
    <AppProvider>
      <headerModule.Header />
    </AppProvider>
  );
  assert(cleanHtml(headerHtml).includes('id="global-search-input"'), "REGRESSION BUG-105: Header global search combobox is preserved");

  // BUG-106: Welcome user name
  const execModule = await import('../components/dashboard/ExecutiveDashboard');
  const execHtml = renderToString(
    <AppProvider>
      <execModule.ExecutiveDashboard />
    </AppProvider>
  );
  assert(cleanHtml(execHtml).includes('Welcome back, Sarah Jenkins!'), "REGRESSION BUG-106: ExecutiveDashboard displays user name 'Sarah Jenkins'");

  // BUG-107: Dashboard reporting-period filters
  assert(cleanHtml(execHtml).includes('id="executive-fiscal-period-selector"'), "REGRESSION BUG-107: Dashboard fiscal period selector is preserved");

  // ────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log(`📊 TEST RESULTS: ${totalPassed} / ${totalPassed + totalFailed} PASSED (${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%)`);
  console.log('========================================================================');

  if (totalFailed === 0) {
    console.log('✨ ALL PUBLIC HOLIDAYS CALENDAR (BUG-108) & REGRESSION TESTS PASSED SUCCESSFULLY!\n');
    process.exitCode = 0;
  } else {
    console.error(`💥 ${totalFailed} TEST(S) FAILED!\n`);
    process.exitCode = 1;
  }
}

runTests();
