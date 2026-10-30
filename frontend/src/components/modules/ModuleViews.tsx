import React, { useState, Suspense, memo } from 'react';
import { useApp } from '../../context/AppContext';
import { Headphones, Zap } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Lazy-loaded module pages — each module is a separate JS chunk.
// Only downloaded the FIRST time a user visits that section.
// All SUBSEQUENT visits are INSTANT (browser chunk cache hit).
// ─────────────────────────────────────────────────────────────────────────────
const CrmModule              = React.lazy(() => import('../../modules/crm').then(m => ({ default: m.CrmModule })));
const CustomersPage          = React.lazy(() => import('../../modules/customers/pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const SalesPage              = React.lazy(() => import('../../modules/sales/pages/SalesPage').then(m => ({ default: m.SalesPage })));
const VendorsPage            = React.lazy(() => import('../../modules/vendors/pages/VendorsPage').then(m => ({ default: m.VendorsPage })));
const PurchasesPage          = React.lazy(() => import('../../modules/purchases/pages/PurchasesPage').then(m => ({ default: m.PurchasesPage })));
const InventoryPage          = React.lazy(() => import('../../modules/inventory/pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const TasksPage              = React.lazy(() => import('../../modules/tasks').then(m => ({ default: m.TasksPage })));
const ProjectsDeliveryView   = React.lazy(() => import('../../modules/projects/components/ProjectsDeliveryView').then(m => ({ default: m.ProjectsDeliveryView })));
const ReportsPage            = React.lazy(() => import('../../modules/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const DocumentsPage          = React.lazy(() => import('../../modules/documents').then(m => ({ default: m.DocumentsPage })));
const EmployeeWorkReportPage = React.lazy(() => import('../../modules/ess/pages/EmployeeWorkReportPage').then(m => ({ default: m.EmployeeWorkReportPage })));
const HelpdeskPage           = React.lazy(() => import('../../modules/helpdesk/pages/HelpdeskPage').then(m => ({ default: m.HelpdeskPage })));
const TestingPage            = React.lazy(() => import('../../modules/testing').then(m => ({ default: m.TestingPage })));
const TimesheetPage          = React.lazy(() => import('../../modules/timesheets').then(m => ({ default: m.TimesheetPage })));

import {
  AdministrationPage,
  HrmsPage,
  AttendancePage,
  LeavePage,
  PayrollPage,
  RecruitmentPage,
  AccountsPage,
  LedgerPage,
  BankingPage,
  ExpensesPage,
  SettingsPage,
} from '../../modules/friend_2_frontend_implementation';

// ─────────────────────────────────────────────────────────────────────────────
// Slim animated skeleton — shown only while a chunk downloads (first visit only)
// ─────────────────────────────────────────────────────────────────────────────
const ModuleLoadingSkeleton: React.FC = () => (
  <div className="space-y-5 animate-pulse p-2">
    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/4" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-800" />
      ))}
    </div>
    <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-800" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Content Switcher — routes the active navigation selection to its page.
// ─────────────────────────────────────────────────────────────────────────────
export const ModuleViews: React.FC = memo(() => {
  const { activeModule } = useApp();

  let content: React.ReactNode;

  switch (activeModule) {
    case 'crm':            content = <CrmModule />;             break;
    case 'sales':          content = <SalesPage />;             break;
    case 'customers':      content = <CustomersPage />;         break;
    case 'recruitment':    content = <RecruitmentPage />;       break;
    case 'hrms':           content = <HrmsPage />;              break;
    case 'attendance':     content = <AttendancePage />;        break;
    case 'leave':          content = <LeavePage />;             break;
    case 'payroll':        content = <PayrollPage />;           break;
    case 'expenses':       content = <ExpensesPage />;          break;
    case 'accounts':       content = <AccountsPage />;          break;
    case 'ledger':         content = <LedgerPage />;            break;
    case 'banking':        content = <BankingPage />;           break;
    case 'vendors':        content = <VendorsPage />;           break;
    case 'purchases':      content = <PurchasesPage />;         break;
    case 'inventory':      content = <InventoryPage />;         break;
    case 'projects':       content = <ProjectsDeliveryView />;  break;
    case 'tasks':          content = <TasksPage />;             break;
    case 'testing':        content = <TestingPage />;           break;
    case 'timesheet':
    case 'timesheets':     content = <TimesheetPage />;         break;
    case 'documents':      content = <DocumentsPage />;         break;
    case 'reports':        content = <ReportsPage />;           break;
    case 'administration': content = <AdministrationPage />;    break;
    case 'settings':       content = <SettingsPage />;          break;
    case 'employee':       content = <EmployeeWorkReportPage />; break;
    case 'helpdesk':       content = <HelpdeskPage />;          break;

    case 'automation':
      content = (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Zap className="text-amber-400" size={22} />
            Workflow &amp; Automation Rules
          </h1>
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
            <Zap size={40} className="mx-auto text-amber-400 mb-3" />
            <h2 className="text-base font-bold text-slate-800">Visual Automation Builder</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Configure cross-module triggers, automated emails, approval workflows, and status synchronization rules.
            </p>
          </div>
        </div>
      );
      break;

    default:
      content = (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs">
          <p className="font-semibold text-slate-600">Module &ldquo;{activeModule}&rdquo; not found</p>
          <p className="mt-1">Please select an available module from the sidebar.</p>
        </div>
      );
  }

  return (
    <Suspense fallback={<ModuleLoadingSkeleton />}>
      {content}
    </Suspense>
  );
});

ModuleViews.displayName = 'ModuleViews';
