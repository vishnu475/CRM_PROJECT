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
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <UserPlus className="text-purple-400" size={22} />
            Recruitment & Candidate ATS
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobCandidates.map((cand) => (
              <div key={cand.id} className="bg-white shadow-sm border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#0f172a]">{cand.name}</p>
                  <p className="text-xs text-slate-500">{cand.jobTitle} • {cand.email}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-lg">{cand.stage}</span>
                  <button className="block text-[10px] text-emerald-400 font-bold hover:underline mt-1">
                    Convert to Employee →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'hrms':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <UserCheck className="text-purple-400" size={22} />
            HRMS Employee Master
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-white shadow-sm border border-slate-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0f172a]">{emp.name}</p>
                    <p className="text-[10px] text-slate-500">{emp.designation}</p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2 space-y-1">
                  <p>Dept: <span className="text-slate-700">{emp.department}</span></p>
                  <p>Salary: <span className="text-emerald-400 font-bold">₹ {emp.salary.toLocaleString()}/mo</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'attendance':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Clock className="text-blue-400" size={22} />
            Attendance Logs & Roster
          </h1>

          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Check In</th>
                  <th className="p-3.5">Check Out</th>
                  <th className="p-3.5">Work Hours</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attendanceRecords.map((att) => (
                  <tr key={att.id}>
                    <td className="p-3.5 font-bold text-[#0f172a]">{att.empName}</td>
                    <td className="p-3.5">{att.date}</td>
                    <td className="p-3.5">{att.checkIn}</td>
                    <td className="p-3.5">{att.checkOut}</td>
                    <td className="p-3.5 font-bold">{att.workHours} hrs</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        att.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'leave':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <CalendarDays className="text-amber-400" size={22} />
            Leave Management Portal
          </h1>

          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Leave Type</th>
                  <th className="p-3.5">Dates</th>
                  <th className="p-3.5">Days</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaveRequests.map((lv) => (
                  <tr key={lv.id}>
                    <td className="p-3.5 font-bold text-[#0f172a]">{lv.empName}</td>
                    <td className="p-3.5">{lv.leaveType}</td>
                    <td className="p-3.5">{lv.startDate} to {lv.endDate}</td>
                    <td className="p-3.5 font-bold">{lv.days}</td>
                    <td className="p-3.5">{lv.reason}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lv.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {lv.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {lv.status === 'Pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveLeave(lv.id)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-[#0f172a] rounded"
                            title="Approve"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => rejectLeave(lv.id)}
                            className="p-1 bg-rose-600 hover:bg-rose-500 text-[#0f172a] rounded"
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'payroll':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Banknote className="text-emerald-400" size={22} />
            Payroll Processing Engine
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payrollRuns.map((pr) => (
              <div key={pr.id} className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-[#0f172a] text-base">{pr.month}</h3>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg">{pr.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200">
                  <div>
                    <p>Employees</p>
                    <p className="font-bold text-[#0f172a] text-sm mt-0.5">{pr.totalEmployees}</p>
                  </div>
                  <div>
                    <p>Gross Pay</p>
                    <p className="font-bold text-emerald-400 text-sm mt-0.5">₹ {pr.grossAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p>Net Disbursal</p>
                    <p className="font-bold text-indigo-400 text-sm mt-0.5">₹ {pr.netPay.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'expenses':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Receipt className="text-amber-400" size={22} />
            Expense Claims Management
          </h1>

          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase">
                <tr>
                  <th className="p-3.5">Claim #</th>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenseClaims.map((exp) => (
                  <tr key={exp.id}>
                    <td className="p-3.5 font-mono text-indigo-400">{exp.claimNumber}</td>
                    <td className="p-3.5 font-bold text-[#0f172a]">{exp.empName}</td>
                    <td className="p-3.5">{exp.category}</td>
                    <td className="p-3.5 font-bold text-amber-400">₹ {exp.amount.toLocaleString()}</td>
                    <td className="p-3.5"><span className="text-amber-400 font-bold">{exp.status}</span></td>
                    <td className="p-3.5">
                      {exp.status === 'Pending' && (
                        <button
                          onClick={() => approveExpense(exp.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-[#0f172a] rounded text-[10px] font-bold"
                        >
                          Approve Claim
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'accounts':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <BookOpen className="text-indigo-400" size={22} />
            Chart of Accounts (COA)
          </h1>

          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase">
                <tr>
                  <th className="p-3.5">Account Code</th>
                  <th className="p-3.5">Account Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="p-3.5 font-mono text-indigo-400">{acc.code}</td>
                    <td className="p-3.5 font-bold text-[#0f172a]">{acc.name}</td>
                    <td className="p-3.5">{acc.type}</td>
                    <td className="p-3.5 font-bold text-emerald-400">₹ {acc.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'ledger':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <FileText className="text-emerald-400" size={22} />
            General Ledger & Double-Entry Postings
          </h1>

          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 space-y-4">
            {journalEntries.map((je) => (
              <div key={je.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-mono text-indigo-400 font-bold">{je.entryNumber}</span>
                  <span className="text-slate-500">{je.date}</span>
                </div>
                <p className="text-xs text-slate-700">{je.narration}</p>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                  <span className="text-emerald-400 font-bold">Total Debit: ₹ {je.debitTotal.toLocaleString()}</span>
                  <span className="text-emerald-400 font-bold">Total Credit: ₹ {je.creditTotal.toLocaleString()}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded text-[10px]">{je.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'banking':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Landmark className="text-indigo-400" size={22} />
            Banking & Cash Management
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankAccounts.map((bnk) => (
              <div key={bnk.id} className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl space-y-2">
                <p className="text-xs font-semibold text-slate-500">{bnk.bankName}</p>
                <p className="text-xl font-extrabold text-[#0f172a]">₹ {bnk.balance.toLocaleString()}</p>
                <p className="text-[10px] font-mono text-slate-500">Acc: {bnk.accountNumber}</p>
              </div>
            ))}
          </div>
        </div>
      );

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
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <ShieldCheck className="text-purple-400" size={22} />
            Administration & RBAC Matrix
          </h1>
          <div className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl text-xs text-slate-600 space-y-2">
            <p className="font-bold text-[#0f172a]">System Security & Audit Controls</p>
            <p className="text-slate-500">Manage user roles, company branches, and view immutable audit trails.</p>
          </div>
        </div>
      );

    case 'settings':
      return (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Settings className="text-slate-500" size={22} />
            System Global Settings
          </h1>
          <div className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl text-xs text-slate-600 space-y-2">
            <p className="font-bold text-[#0f172a]">Company Branding & Numbering Sequences</p>
            <p className="text-slate-500">Configure tax rates, default currencies, and API webhook endpoints.</p>
          </div>
        </div>
      );

    default:
      return null;
  }
};
