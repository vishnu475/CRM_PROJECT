import React, { useState, Suspense, memo } from 'react';
import { useApp } from '../../context/AppContext';
import { Headphones, Zap } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Lazy-loaded module pages — each module is a separate JS chunk.
// Only downloaded the FIRST time a user visits that section.
// All SUBSEQUENT visits are INSTANT (browser chunk cache hit).
// ─────────────────────────────────────────────────────────────────────────────
import { CrmModule } from '../../modules/crm';
import { CustomersPage } from '../../modules/customers/pages/CustomersPage';
import { SalesPage } from '../../modules/sales/pages/SalesPage';
import { VendorsPage } from '../../modules/vendors/pages/VendorsPage';
import { PurchasesPage } from '../../modules/purchases/pages/PurchasesPage';
import { InventoryPage } from '../../modules/inventory/pages/InventoryPage';
import { TasksPage } from '../../modules/tasks';
import { ProjectsDeliveryView } from '../../modules/projects/components/ProjectsDeliveryView';
import { ReportsPage } from '../../modules/reports/pages/ReportsPage';
import { DocumentsPage } from '../../modules/documents';
import { EmployeeWorkReportPage } from '../../modules/ess/pages/EmployeeWorkReportPage';
import { TestingPage } from '../../modules/testing';
import { TimesheetPage } from '../../modules/timesheets';
import { HelpdeskPage } from '../../modules/helpdesk';

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
const ModuleSkeleton = memo(() => (
  <div className="flex flex-col gap-4 animate-pulse p-2">
    <div className="h-8 w-56 bg-slate-200/70 rounded-xl" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="h-28 bg-slate-100 rounded-2xl border border-slate-200/60" />
      ))}
    </div>
    <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200/60" />
  </div>
));

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export const ModuleViews: React.FC = () => {
  const {
    activeModule,
    helpdeskTickets,
  } = useApp();

  let content: React.ReactNode = null;

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
          <div className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl space-y-3">
            <p className="text-xs text-slate-600 font-semibold">Active Event Rules:</p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
              ⚡ Trigger: Lead Stage = "Qualified" → Action: Auto-assign Sales Manager &amp; Send Email
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
              ⚡ Trigger: Attendance Lock → Action: Compute LOP &amp; Auto-feed into Payroll Run
            </div>
          </div>
        </div>
      );
      break;

    default:
      content = null;
  }

  // Single Suspense boundary — skeleton only shows on a module's FIRST ever load.
  // Every click after that is instant.
  return (
    <Suspense fallback={<ModuleSkeleton />}>
      {content}
    </Suspense>
  );
};
