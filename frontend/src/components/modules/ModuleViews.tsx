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
import { ProjectsPage } from '../../modules/projects';
import { ReportsPage } from '../../modules/reports/pages/ReportsPage';
import { DocumentsPage } from '../../modules/documents';



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
      return <ProjectsPage />;

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
      return <DocumentsPage />;

    case 'reports':
      return <ReportsPage />;

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
