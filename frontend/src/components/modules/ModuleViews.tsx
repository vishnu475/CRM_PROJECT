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
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
                <TrendingUp className="text-emerald-400" size={22} />
                Sales & Invoicing Pipeline
              </h1>
              <p className="text-xs text-slate-500">Generate quotations, issue sales orders, and post tax invoices.</p>
            </div>
            <button className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-[#0f172a] rounded-xl text-xs font-semibold">
              + New Quotation
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-[#0f172a] mb-3">Quotations</h3>
              <div className="space-y-3 text-xs">
                {quotations.map((q) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{q.quoteNumber}</p>
                      <p className="text-[10px] text-slate-500">{q.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-400">₹ {q.amount.toLocaleString()}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">{q.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-[#0f172a] mb-3">Tax Invoices</h3>
              <div className="space-y-3 text-xs">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-slate-500">{inv.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-400">₹ {inv.amount.toLocaleString()}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'customers':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Users className="text-indigo-400" size={22} />
            Customers & Account Ledger
          </h1>

          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Customer / Company</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Credit Limit</th>
                  <th className="p-3.5">Outstanding Balance</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-indigo-400">{c.customerCode || '—'}</td>
                    <td className="p-3.5 font-bold text-[#0f172a]">{c.customerName}</td>
                    <td className="p-3.5">{c.primaryContact.email}</td>
                    <td className="p-3.5 font-bold">₹ {(c.creditLimit || 0).toLocaleString()}</td>
                    <td className="p-3.5 font-bold text-amber-400">₹ 0</td>
                    <td className="p-3.5"><span className="text-emerald-400 font-bold">{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

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
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Truck className="text-teal-400" size={22} />
            Vendor Master Directory
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendors.map((v) => (
              <div key={v.id} className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-[#0f172a] text-sm">{v.name}</p>
                  <span className="text-amber-400 text-xs font-bold">⭐ {v.rating}</span>
                </div>
                <p className="text-xs text-slate-500">Contact: {v.contactPerson} ({v.email})</p>
                <p className="text-xs font-bold text-rose-400">Payable Balance: ₹ {v.payableBalance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'purchases':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <ShoppingCart className="text-purple-400" size={22} />
            Purchase Management & GRN
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#0f172a] text-sm">{po.poNumber}</p>
                  <p className="text-xs text-slate-500">{po.vendorName}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-emerald-400 text-sm">₹ {po.amount.toLocaleString()}</p>
                  <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-lg">{po.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'inventory':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Boxes className="text-amber-400" size={22} />
            Inventory SKUs & Stock Balance
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white shadow-sm border border-slate-200 p-4 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-[#0f172a]">{p.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</p>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-600">Stock: <span className="font-bold text-[#0f172a]">{p.stock}</span></span>
                  <span className="text-emerald-400 font-bold">₹ {p.price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

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
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <CheckSquare className="text-emerald-400" size={22} />
            Task Management & Kanban
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((t) => (
              <div key={t.id} className="bg-white shadow-sm border border-slate-200 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-[#0f172a] text-xs">{t.title}</p>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded">{t.priority}</span>
                </div>
                <p className="text-[10px] text-slate-500">{t.project} • Assignee: {t.assignee}</p>
              </div>
            ))}
          </div>
        </div>
      );

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

    default:
      return null;
  }
};
