# Automated Test Reports & Testing Framework Index

This directory contains the comprehensive, executable test reports across **all 9 primary testing disciplines** for the CRM + HRMS + ERP Enterprise Application.

---

## 📊 Master Test Execution Summary (100% Pass Rate)

| # | Testing Category | Embedded Suite File | Total Tests | Passed | Failed | Pass Rate | Report Link |
| :-: | :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| **01** | **Unit Testing** | [`backend/tests/01_unit_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/01_unit_testing_suite.js) | 40 | 40 | 0 | 100.0% | [Unit Test Report](file:///c:/Users/lokesh/OneDrive/Documents/CRM/test-reports/01_UNIT_TESTING_REPORT.md) |
| **02** | **Integration Testing** | [`backend/tests/02_integration_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/02_integration_testing_suite.js) | 16 | 16 | 0 | 100.0% | [Integration Test Report](file:///c:/Users/lokesh/OneDrive/Documents/CRM/test-reports/02_INTEGRATION_TESTING_REPORT.md) |
| **03** | **Acceptance Testing (UAT)** | [`backend/tests/03_acceptance_uat_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/03_acceptance_uat_testing_suite.js) | 14 | 14 | 0 | 100.0% | [Acceptance UAT Report](file:///c:/Users/lokesh/OneDrive/Documents/CRM/test-reports/03_ACCEPTANCE_UAT_TESTING_REPORT.md) |
| **04** | **Smoke Testing** | [`backend/tests/04_smoke_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/04_smoke_testing_suite.js) | 19 | 19 | 0 | 100.0% | [Smoke Test Report](file:///c:/Users/lokesh/OneDrive/Documents/CRM/test-reports/04_SMOKE_TESTING_REPORT.md) |
| **05** | **Sanity Testing** | [`backend/tests/05_sanity_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/05_sanity_testing_suite.js) | 20 | 20 | 0 | 100.0% | [Sanity Test Report](file:///c:/Users/lokesh/OneDrive/Documents/CRM/test-reports/05_SANITY_TESTING_REPORT.md) |
| **06** | **Regression Testing** | [`backend/tests/06_regression_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/06_regression_testing_suite.js) | 17 | 17 | 0 | 100.0% | [Regression Test Report](file:///c:/Users/lokesh/OneDrive/Documents/CRM/test-reports/06_REGRESSION_TESTING_REPORT.md) |
| **07** | **End-to-End (E2E) Testing** | [`backend/tests/07_e2e_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/07_e2e_testing_suite.js) | 16 | 16 | 0 | 100.0% | [E2E Test Report](file:///c:/Users/lokesh/OneDrive/Documents/CRM/test-reports/07_E2E_TESTING_REPORT.md) |
| **08** | **Component Testing** | [`backend/tests/08_component_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/08_component_testing_suite.js) | 20 | 20 | 0 | 100.0% | [Component Test Report](file:///c:/Users/lokesh/OneDrive/Documents/CRM/test-reports/08_COMPONENT_TESTING_REPORT.md) |
| **09** | **Interface Testing** | [`backend/tests/09_interface_testing_suite.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/09_interface_testing_suite.js) | 25 | 25 | 0 | 100.0% | [Interface Test Report](file:///c:/Users/lokesh/OneDrive/Documents/CRM/test-reports/09_INTERFACE_TESTING_REPORT.md) |
| **ALL** | **Consolidated Master** | [`backend/tests/run_all_tests.js`](file:///c:/Users/lokesh/OneDrive/Documents/CRM/backend/tests/run_all_tests.js) | **187** | **187** | **0** | **100.0%** | [Master Reports Reference](file:///c:/Users/lokesh/OneDrive/Documents/CRM/TEST_REPORTS_MASTER.md) |

---

## 🛠️ CLI Test Execution Commands

All test suites are permanently embedded into the codebase and can be executed at any time from the terminal:

```bash
# Run all 9 test suites sequentially
npm --prefix backend test

# Or run individual test suites:
npm --prefix backend run test:unit           # Suite 01: Unit Testing
npm --prefix backend run test:integration    # Suite 02: Integration Testing
npm --prefix backend run test:uat            # Suite 03: Acceptance Testing (UAT)
npm --prefix backend run test:smoke          # Suite 04: Smoke Testing
npm --prefix backend run test:sanity         # Suite 05: Sanity Testing
npm --prefix backend run test:regression     # Suite 06: Regression Testing
npm --prefix backend run test:e2e            # Suite 07: End-to-End (E2E) Testing
npm --prefix backend run test:component      # Suite 08: Component Testing
npm --prefix backend run test:interface      # Suite 09: Interface Testing
```

