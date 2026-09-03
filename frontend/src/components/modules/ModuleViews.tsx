import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId } from '../../types';
import {
  Target,
  Plus,
  TrendingUp,
  Users,
  UserPlus,
  UserCheck,
  Clock,
  CalendarDays,
  Banknote,
  Receipt,
  BookOpen,
  FileText,
  Landmark,
  Truck,
  ShoppingCart,
  Boxes,
  FolderKanban,
  CheckSquare,
  Headphones,
  Folder,
  BarChart3,
  Zap,
  ShieldCheck,
  Settings,
  Search,
  CheckCircle,
  XCircle,
  FileDown,
  ArrowRight,
} from 'lucide-react';
import { CrmModule } from '../../modules/crm';
import { CustomersPage } from '../../modules/customers/pages/CustomersPage';
import { SalesPage } from '../../modules/sales/pages/SalesPage';
import { VendorsPage } from '../../modules/vendors/pages/VendorsPage';
import { PurchasesPage } from '../../modules/purchases/pages/PurchasesPage';
import { InventoryPage } from '../../modules/inventory/pages/InventoryPage';
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
  SettingsPage
} from '../../modules/friend_2_frontend_implementation';
import { EmployeeWorkReportPage } from '../../modules/ess/pages/EmployeeWorkReportPage';
import { TasksPage } from '../../modules/tasks';



export const ModuleViews: React.FC = () => {
  const {
    activeModule,
    leads,
    addLead,
    customers,
    products,
    quotations,
    invoices,
    employees,
    attendanceRecords,
    leaveRequests,
    approveLeave,
    rejectLeave,
    payrollRuns,
    jobCandidates,
    accounts,
    journalEntries,
    bankAccounts,
    expenseClaims,
    approveExpense,
    purchaseOrders,
    vendors,
    projects,
    tasks,
    helpdeskTickets,
    documents,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadValue, setNewLeadValue] = useState('150000');

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadCompany) return;
    addLead({
      name: newLeadName,
      company: newLeadCompany,
      email: `${newLeadName.toLowerCase().replace(' ', '.')}@${newLeadCompany.toLowerCase().replace(' ', '')}.com`,
      phone: '+1 555-0199',
      value: parseFloat(newLeadValue) || 100000,
      stage: 'New',
      score: 80,
      source: 'Website Direct',
      assignedTo: 'Sarah Johnson',
    });
    setNewLeadName('');
    setNewLeadCompany('');
    setShowAddLeadModal(false);
  };

  switch (activeModule) {
    case 'crm':
      return <CrmModule />;

    case 'sales':
      return <SalesPage />;

    case 'customers':
      return <CustomersPage />;

    case 'recruitment':
      return <RecruitmentPage />;

    case 'hrms':
      return <HrmsPage />;

    case 'attendance':
      return <AttendancePage />;

    case 'leave':
      return <LeavePage />;

    case 'payroll':
      return <PayrollPage />;

    case 'expenses':
      return <ExpensesPage />;

    case 'accounts':
      return <AccountsPage />;

    case 'ledger':
      return <LedgerPage />;

    case 'banking':
      return <BankingPage />;

    case 'vendors':
      return <VendorsPage />;

    case 'purchases':
      return <PurchasesPage />;

    case 'inventory':
      return <InventoryPage />;

    case 'projects':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <FolderKanban className="text-indigo-400" size={22} />
            Projects & Client Delivery
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((prj) => (
              <div key={prj.id} className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-[#0f172a] text-sm">{prj.name}</p>
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded">{prj.status}</span>
                </div>
                <p className="text-xs text-slate-500">Client: {prj.client}</p>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-bold text-emerald-400">{prj.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${prj.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'tasks':
      return <TasksPage />;

    case 'helpdesk':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Headphones className="text-rose-400" size={22} />
            Helpdesk & Support Tickets
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

    case 'documents':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Folder className="text-teal-400" size={22} />
            Central Documents Vault
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white shadow-sm border border-slate-200 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#0f172a] text-xs">{doc.name}</p>
                  <p className="text-[10px] text-slate-500">{doc.category} • {doc.size}</p>
                </div>
                <button className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-[#0f172a]">
                  <FileDown size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      );

    case 'reports':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={22} />
            Enterprise Reports & Analytics
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl">
              <h3 className="font-bold text-[#0f172a] text-sm">Financial Statements</h3>
              <p className="text-xs text-slate-500 mt-1">P&L, Balance Sheet, Trial Balance</p>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl">
              <h3 className="font-bold text-[#0f172a] text-sm">Lead-to-Cash Analytics</h3>
              <p className="text-xs text-slate-500 mt-1">Funnel conversion & aging</p>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl">
              <h3 className="font-bold text-[#0f172a] text-sm">HR & Payroll Metrics</h3>
              <p className="text-xs text-slate-500 mt-1">Headcount & department cost</p>
            </div>
          </div>
        </div>
      );

    case 'automation':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Zap className="text-amber-400" size={22} />
            Workflow & Automation Rules
          </h1>

          <div className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl space-y-3">
            <p className="text-xs text-slate-600 font-semibold">Active Event Rules:</p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
              ⚡ Trigger: Lead Stage = "Qualified" → Action: Auto-assign Sales Manager & Send Email
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
              ⚡ Trigger: Attendance Lock → Action: Compute LOP & Auto-feed into Payroll Run
            </div>
          </div>
        </div>
      );

    case 'administration':
      return <AdministrationPage />;

    case 'settings':
      return <SettingsPage />;

    case 'employee':
      return <EmployeeWorkReportPage />;

    default:
      return null;
  }
};
