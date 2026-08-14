import React from 'react';
import { useApp } from '../../context/AppContext';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import {
  Target,
  TrendingUp,
  UserCheck,
  Clock,
  Banknote,
  Briefcase,
  BookOpen,
  Landmark,
  Receipt,
  ShoppingCart,
  Truck,
  Boxes,
  FolderKanban,
  Headphones,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const RoleDashboardContainer: React.FC = () => {
  const { userRole, userProfile, setActiveModule } = useApp();

  if (userRole === 'Executive') {
    return <ExecutiveDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2563eb] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
            {userProfile.roleTitle} Mode
          </span>
          <h1 className="text-xl font-bold text-[#0f172a] mt-2">
            Welcome back, {userProfile.name}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <span className="text-[#2563eb] font-semibold">{userProfile.roleTitle}</span> for {userProfile.company}.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setActiveModule('settings')}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-[#0f172a] font-bold hover:bg-slate-100 transition-colors"
          >
            Role Settings
          </button>
        </div>
      </div>

      {/* Role Specific Views */}
      {userRole === 'SalesManager' || userRole === 'SalesExecutive' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Active Leads Pipeline</span>
              <Target className="text-[#2563eb]" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">320 Leads</p>
            <p className="text-xs text-emerald-600 mt-1">₹ 2,34,50,000 Total Value</p>
            <button
              onClick={() => setActiveModule('crm')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Open Lead Manager →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Quotations Sent</span>
              <TrendingUp className="text-emerald-600" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">₹ 12,70,000</p>
            <p className="text-xs text-slate-500 mt-1">5 Pending Customer Acceptance</p>
            <button
              onClick={() => setActiveModule('sales')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Manage Sales Orders →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Monthly Quota Achievement</span>
              <CheckCircle2 className="text-purple-500" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">84.5%</p>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '84.5%' }} />
            </div>
          </div>
        </div>
      ) : userRole === 'HRAdmin' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Total Workforce</span>
              <UserCheck className="text-[#2563eb]" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">45 Employees</p>
            <p className="text-xs text-emerald-600 mt-1">92.6% Present Today</p>
            <button
              onClick={() => setActiveModule('hrms')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Employee Directory →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Pending Leave Applications</span>
              <Clock className="text-amber-500" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">2 Requests</p>
            <p className="text-xs text-amber-600 mt-1">Awaiting HR Sign-off</p>
            <button
              onClick={() => setActiveModule('leave')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Review Leaves →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">May 2026 Payroll</span>
              <Banknote className="text-emerald-500" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">₹ 44,70,000</p>
            <p className="text-xs text-[#2563eb] mt-1">Calculated & Ready for Disbursal</p>
            <button
              onClick={() => setActiveModule('payroll')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Payroll Processing →
            </button>
          </div>
        </div>
      ) : userRole === 'FinanceAccountant' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">General Ledger Status</span>
              <BookOpen className="text-[#2563eb]" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">Balanced (Debit = Credit)</p>
            <p className="text-xs text-emerald-600 mt-1">₹ 1,48,35,000 Posted Ledger Total</p>
            <button
              onClick={() => setActiveModule('ledger')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Open General Ledger →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Liquid Cash & Bank Balances</span>
              <Landmark className="text-emerald-500" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">₹ 1,94,60,000</p>
            <p className="text-xs text-slate-500 mt-1">Across 3 Operating Accounts</p>
            <button
              onClick={() => setActiveModule('banking')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Banking & Cash Book →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Pending Expense Claims</span>
              <Receipt className="text-amber-500" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">₹ 12,450</p>
            <p className="text-xs text-amber-600 mt-1">1 Claim Awaiting Verification</p>
            <button
              onClick={() => setActiveModule('expenses')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Audit Expense Claims →
            </button>
          </div>
        </div>
      ) : userRole === 'OperationsManager' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Active Client Projects</span>
              <FolderKanban className="text-[#2563eb]" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">2 Projects</p>
            <p className="text-xs text-slate-500 mt-1">Avg 51.5% Progress</p>
            <button
              onClick={() => setActiveModule('projects')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Project Overview →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Inventory SKUs Stock</span>
              <Boxes className="text-amber-500" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">455 Units</p>
            <p className="text-xs text-emerald-600 mt-1">4 SKUs Active & Healthy</p>
            <button
              onClick={() => setActiveModule('inventory')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Stock Ledger →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Open Purchase Orders</span>
              <ShoppingCart className="text-purple-500" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">₹ 85,000</p>
            <p className="text-xs text-slate-500 mt-1">PO-2026-045 Pending GRN</p>
            <button
              onClick={() => setActiveModule('purchases')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Procurement Desk →
            </button>
          </div>
        </div>
      ) : userRole === 'Employee' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Today's Attendance</span>
              <Clock className="text-emerald-500" size={18} />
            </div>
            <p className="text-xl font-bold text-[#0f172a] mt-2">Checked In: 09:15 AM</p>
            <p className="text-xs text-emerald-600 mt-1">On Time (Shift 09:00 - 18:00)</p>
            <button
              onClick={() => setActiveModule('attendance')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Log Timesheet →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Leave Balances</span>
              <Briefcase className="text-[#2563eb]" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">14 Days Available</p>
            <p className="text-xs text-slate-500 mt-1">Casual: 4 | Earned: 10</p>
            <button
              onClick={() => setActiveModule('leave')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Apply Leave →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">My Payslips</span>
              <Banknote className="text-purple-500" size={18} />
            </div>
            <p className="text-xl font-bold text-[#0f172a] mt-2">April 2026 Generated</p>
            <p className="text-xs text-emerald-600 mt-1">₹ 1,80,000 Gross Credit</p>
            <button
              onClick={() => setActiveModule('payroll')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Download Payslip PDF →
            </button>
          </div>
        </div>
      ) : userRole === 'Customer' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Account Outstanding</span>
              <AlertCircle className="text-amber-500" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">₹ 4,52,000</p>
            <p className="text-xs text-slate-500 mt-1">Credit Limit: ₹ 25,00,000</p>
            <button
              onClick={() => setActiveModule('sales')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              View Statement & Invoices →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Open Quotations</span>
              <Receipt className="text-[#2563eb]" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">QT-2026-001</p>
            <p className="text-xs text-emerald-600 mt-1">Approved • ₹ 8,50,000</p>
            <button
              onClick={() => setActiveModule('sales')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Accept Quotation →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Support Tickets</span>
              <Headphones className="text-[#2563eb]" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">1 Active Ticket</p>
            <p className="text-xs text-[#2563eb] mt-1">HD-8091 Open in Helpdesk</p>
            <button
              onClick={() => setActiveModule('helpdesk')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              Support Desk →
            </button>
          </div>
        </div>
      ) : (
        /* Vendor View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Received Purchase Orders</span>
              <Truck className="text-[#2563eb]" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">PO-2026-045</p>
            <p className="text-xs text-amber-600 mt-1">₹ 85,000 Pending Dispatch</p>
            <button
              onClick={() => setActiveModule('purchases')}
              className="mt-4 text-xs font-bold text-[#2563eb] hover:underline"
            >
              View PO Details →
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Payable Balance</span>
              <Banknote className="text-emerald-500" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">₹ 85,000</p>
            <p className="text-xs text-emerald-600 mt-1">Payment Schedule: Net 30</p>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Vendor Rating</span>
              <CheckCircle2 className="text-amber-500" size={18} />
            </div>
            <p className="text-2xl font-black text-[#0f172a] mt-2">4.6 / 5.0 ⭐</p>
            <p className="text-xs text-slate-500 mt-1">98% On-time GRN Delivery</p>
          </div>
        </div>
      )}
    </div>
  );
};
