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

// These share one chunk (friend_2 bundle) — still lazy to defer the large file
const AdministrationPage = React.lazy(() => import('../../modules/friend_2_frontend_implementation').then(m => ({ default: m.AdministrationPage })));
const HrmsPage           = React.lazy(() => import('../../modules/friend_2_frontend_implementation').then(m => ({ default: m.HrmsPage })));
const AttendancePage     = React.lazy(() => import('../../modules/friend_2_frontend_implementation').then(m => ({ default: m.AttendancePage })));
const LeavePage          = React.lazy(() => import('../../modules/friend_2_frontend_implementation').then(m => ({ default: m.LeavePage })));
const PayrollPage        = React.lazy(() => import('../../modules/friend_2_frontend_implementation').then(m => ({ default: m.PayrollPage })));
const RecruitmentPage    = React.lazy(() => import('../../modules/friend_2_frontend_implementation').then(m => ({ default: m.RecruitmentPage })));
const AccountsPage       = React.lazy(() => import('../../modules/friend_2_frontend_implementation').then(m => ({ default: m.AccountsPage })));
const LedgerPage         = React.lazy(() => import('../../modules/friend_2_frontend_implementation').then(m => ({ default: m.LedgerPage })));
const BankingPage        = React.lazy(() => import('../../modules/friend_2_frontend_implementation').then(m => ({ default: m.BankingPage })));
const ExpensesPage       = React.lazy(() => import('../../modules/friend_2_frontend_implementation').then(m => ({ default: m.ExpensesPage })));
const SettingsPage       = React.lazy(() => import('../../modules/friend_2_frontend_implementation').then(m => ({ default: m.SettingsPage })));

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
    case 'documents':      content = <DocumentsPage />;         break;
    case 'reports':        content = <ReportsPage />;           break;
    case 'administration': content = <AdministrationPage />;    break;
    case 'settings':       content = <SettingsPage />;          break;
    case 'employee':       content = <EmployeeWorkReportPage />; break;

    case 'helpdesk':
      content = (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Headphones className="text-rose-400" size={22} />
            Helpdesk &amp; Support Tickets
          </h1>
          <div className="space-y-3">
            {helpdeskTickets.map((tck) => (
              <div key={tck.id} className="bg-white shadow-sm border border-slate-200 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#0f172a] text-xs">{tck.ticketNo} - {tck.subject}</p>
                  <p className="text-[10px] text-slate-500">{tck.customerName} • {tck.createdAt}</p>
                </div>
                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-lg">{tck.status}</span>
              </div>
            ))}
          </div>
        </div>
      );
      break;

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
