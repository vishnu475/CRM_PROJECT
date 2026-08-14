import React from 'react';
import {
  TrendingUp,
  Target,
  Clock,
  Headphones,
  DollarSign,
  ChevronDown,
  UserPlus,
  FileText,
  UserCheck,
  Banknote,
  Upload,
  Users,
  BarChart3,
  Boxes,
  FolderKanban,
  CheckSquare,
  Folder,
  ArrowUpRight,
  ArrowDownRight,
  FileCheck2,
  Receipt,
  ShoppingCart,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ExecutiveDashboard: React.FC = () => {
  const { setActiveModule, approveLeave, approveExpense } = useApp();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            Welcome back, John! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs text-slate-500 bg-white shadow-sm border border-slate-200/80 px-3.5 py-2 rounded-xl">
          <span className="font-semibold text-slate-700">Fiscal Period:</span> Q2 FY 2025-26
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Banknote size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#0f172a] mt-2">₹ 1,48,35,000</p>
          <div className="flex items-center text-[11px] text-emerald-400 mt-2 font-medium">
            <ArrowUpRight size={14} className="mr-0.5" />
            <span>+12.5% vs last month</span>
          </div>
          {/* Mini Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path
                d="M0 20 L20 18 L40 12 L60 15 L80 8 L100 2"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Pipeline Value</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Target size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#0f172a] mt-2">₹ 2,34,50,000</p>
          <div className="flex items-center text-[11px] text-purple-400 mt-2 font-medium">
            <ArrowUpRight size={14} className="mr-0.5" />
            <span>+8.3% vs last month</span>
          </div>
          {/* Mini Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path
                d="M0 22 L20 19 L40 16 L60 10 L80 12 L100 4"
                fill="none"
                stroke="#A855F7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Attendance %</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#0f172a] mt-2">92.6%</p>
          <div className="flex items-center text-[11px] text-rose-400 mt-2 font-medium">
            <ArrowDownRight size={14} className="mr-0.5" />
            <span>-2.4% vs last month</span>
          </div>
          {/* Mini Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path
                d="M0 5 L20 8 L40 12 L60 10 L80 18 L100 20"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Open Tickets</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Headphones size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#0f172a] mt-2">28</p>
          <div className="flex items-center text-[11px] text-emerald-400 mt-2 font-medium">
            <ArrowDownRight size={14} className="mr-0.5" />
            <span>-10.3% vs last month</span>
          </div>
          {/* Mini Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path
                d="M0 8 L20 12 L40 10 L60 16 L80 14 L100 22"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Net Profit</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#0f172a] mt-2">₹ 24,75,000</p>
          <div className="flex items-center text-[11px] text-emerald-400 mt-2 font-medium">
            <ArrowUpRight size={14} className="mr-0.5" />
            <span>+15.8% vs last month</span>
          </div>
          {/* Mini Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path
                d="M0 22 L20 18 L40 16 L60 10 L80 8 L100 3"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Middle Row: Revenue Overview, Sales Pipeline, Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Overview */}
        <div className="lg:col-span-5 bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f172a]">Revenue Overview</h2>
            <button className="flex items-center space-x-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span>This Month</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="my-6 relative">
            {/* SVG Area Chart */}
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 130 Q40 100 80 110 T160 80 T240 60 T320 30 T400 20 L400 150 L0 150 Z"
                  fill="url(#revGrad)"
                />
                <path
                  d="M0 130 Q40 100 80 110 T160 80 T240 60 T320 30 T400 20"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="3"
                />

                {/* Data point dot on May 20 */}
                <circle cx="240" cy="60" r="5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2" />

                {/* Tooltip Overlay */}
                <g transform="translate(200, 15)">
                  <rect width="90" height="34" rx="6" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                  <text x="45" y="14" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                    ₹ 1,48,35,000
                  </text>
                  <text x="45" y="26" fill="#94A3B8" fontSize="8" textAnchor="middle">
                    20 May, 2025
                  </text>
                </g>
              </svg>
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1 font-medium">
              <span>01 May</span>
              <span>05 May</span>
              <span>10 May</span>
              <span>15 May</span>
              <span>20 May</span>
              <span>25 May</span>
              <span>31 May</span>
            </div>
          </div>
        </div>

        {/* Sales Pipeline */}
        <div className="lg:col-span-4 bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f172a]">Sales Pipeline</h2>
            <button className="flex items-center space-x-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span>This Month</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="my-4 space-y-2">
            {/* Funnel Stage 1 */}
            <div className="relative group">
              <div
                className="h-8 rounded-lg bg-blue-600/80 flex items-center justify-between px-3 text-xs font-semibold text-[#0f172a] transition-all group-hover:bg-blue-500"
                style={{ width: '100%' }}
              >
                <span>New Leads</span>
                <span>320</span>
              </div>
            </div>

            {/* Funnel Stage 2 */}
            <div className="relative group">
              <div
                className="h-8 rounded-lg bg-cyan-600/80 flex items-center justify-between px-3 text-xs font-semibold text-[#0f172a] transition-all group-hover:bg-cyan-500 mx-auto"
                style={{ width: '82%' }}
              >
                <span>Contacted</span>
                <span>180</span>
              </div>
            </div>

            {/* Funnel Stage 3 */}
            <div className="relative group">
              <div
                className="h-8 rounded-lg bg-teal-600/80 flex items-center justify-between px-3 text-xs font-semibold text-[#0f172a] transition-all group-hover:bg-teal-500 mx-auto"
                style={{ width: '68%' }}
              >
                <span>Qualified</span>
                <span>98</span>
              </div>
            </div>

            {/* Funnel Stage 4 */}
            <div className="relative group">
              <div
                className="h-8 rounded-lg bg-emerald-600/80 flex items-center justify-between px-3 text-xs font-semibold text-[#0f172a] transition-all group-hover:bg-emerald-500 mx-auto"
                style={{ width: '52%' }}
              >
                <span>Proposal</span>
                <span>45</span>
              </div>
            </div>

            {/* Funnel Stage 5 */}
            <div className="relative group">
              <div
                className="h-8 rounded-lg bg-green-500 flex items-center justify-between px-3 text-xs font-extrabold text-[#0f172a] transition-all group-hover:bg-green-400 mx-auto"
                style={{ width: '38%' }}
              >
                <span>Won</span>
                <span>20</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-xs">
            <span className="text-slate-500">Conversion Rate</span>
            <span className="font-bold text-emerald-400">6.25%</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="lg:col-span-3 bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f172a]">Pending Approvals</h2>
            <button
              onClick={() => setActiveModule('leave')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 my-3">
            {/* Approval 1 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                  <FileCheck2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Leave Application</p>
                  <p className="text-[10px] text-slate-500">Emma Watson • Marketing</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700 block">2 Days</span>
                <button
                  onClick={() => approveLeave('LV-101')}
                  className="text-[10px] text-amber-400 font-bold hover:underline"
                >
                  Pending
                </button>
              </div>
            </div>

            {/* Approval 2 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
                  <Receipt size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Expense Claim</p>
                  <p className="text-[10px] text-slate-500">Robert Brown • Sales</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700 block">₹ 12,450</span>
                <button
                  onClick={() => approveExpense('EXP-101')}
                  className="text-[10px] text-amber-400 font-bold hover:underline"
                >
                  Pending
                </button>
              </div>
            </div>

            {/* Approval 3 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Purchase Order</p>
                  <p className="text-[10px] text-slate-500">PO-2025-045 • Office Supplies</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700 block">₹ 85,000</span>
                <span className="text-[10px] text-amber-400 font-bold">Pending</span>
              </div>
            </div>

            {/* Approval 4 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                  <Briefcase size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Recruitment Request</p>
                  <p className="text-[10px] text-slate-500">UI/UX Designer • Design Team</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700 block">3 Days</span>
                <span className="text-[10px] text-amber-400 font-bold">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activity, Top Performing Products, Department Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-4 bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f172a]">Recent Activity</h2>
            <button
              onClick={() => setActiveModule('crm')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="space-y-3.5 my-4">
            <div className="flex items-start space-x-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                SJ
              </div>
              <div className="flex-1">
                <p className="text-slate-700 font-medium">
                  New lead <span className="font-bold text-[#0f172a]">Acme Corp</span> added by Sarah Johnson
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">10 min ago</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div className="flex-1">
                <p className="text-slate-700 font-medium">
                  Invoice <span className="font-bold text-[#0f172a]">INV-2025-1024</span> paid by Globex Corporation
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">1 hour ago</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div className="flex-1">
                <p className="text-slate-700 font-medium">
                  Employee <span className="font-bold text-[#0f172a]">James Smith</span> checked in at 09:15 AM
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <ShoppingCart size={16} />
              </div>
              <div className="flex-1">
                <p className="text-slate-700 font-medium">
                  Purchase Order <span className="font-bold text-[#0f172a]">PO-2025-045</span> approved by Michael Brown
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Products */}
        <div className="lg:col-span-4 bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f172a]">Top Performing Products</h2>
            <button className="flex items-center space-x-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span>This Month</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="my-4 flex items-center justify-between">
            {/* SVG Donut Chart */}
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3.8"
                  strokeDasharray="35, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3.8"
                  strokeDasharray="24, 100"
                  strokeDashoffset="-35"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.8"
                  strokeDasharray="17, 100"
                  strokeDashoffset="-59"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.8"
                  strokeDasharray="15, 100"
                  strokeDashoffset="-76"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-[#0f172a] leading-tight">₹1,84,95,000</span>
                <span className="text-[8px] text-slate-500">Total Sales</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="flex-1 ml-4 space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-slate-600 truncate">Product A</span>
                </div>
                <span className="text-[#0f172a] font-bold">₹ 65,40,000 (35%)</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-slate-600 truncate">Product B</span>
                </div>
                <span className="text-[#0f172a] font-bold">₹ 45,20,000 (24%)</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-slate-600 truncate">Product C</span>
                </div>
                <span className="text-[#0f172a] font-bold">₹ 32,10,000 (17%)</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-600 truncate">Product D</span>
                </div>
                <span className="text-[#0f172a] font-bold">₹ 28,75,000 (15%)</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                  <span className="text-slate-600 truncate">Others</span>
                </div>
                <span className="text-[#0f172a] font-bold">₹ 12,90,000 (9%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Attendance */}
        <div className="lg:col-span-4 bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f172a]">Department Attendance</h2>
            <button className="flex items-center space-x-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span>This Month</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="space-y-3.5 my-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Engineering</span>
                <span className="text-[#0f172a] font-bold">95%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Sales</span>
                <span className="text-[#0f172a] font-bold">93%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '93%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Marketing</span>
                <span className="text-[#0f172a] font-bold">90%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '90%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">HR</span>
                <span className="text-[#0f172a] font-bold">88%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '88%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Finance</span>
                <span className="text-[#0f172a] font-bold">85%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Support</span>
                <span className="text-[#0f172a] font-bold">80%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Quick Shortcuts Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-6 bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg">
          <h2 className="text-sm font-bold text-[#0f172a] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <button
              onClick={() => setActiveModule('crm')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-600/20 border border-slate-200 hover:border-indigo-500/50 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-[#0f172a] transition-colors mb-2">
                <UserPlus size={18} />
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-[#0f172a]">
                New Lead
              </span>
            </button>

            <button
              onClick={() => setActiveModule('sales')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-600/20 border border-slate-200 hover:border-indigo-500/50 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-[#0f172a] transition-colors mb-2">
                <FileText size={18} />
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-[#0f172a]">
                Create Invoice
              </span>
            </button>

            <button
              onClick={() => setActiveModule('hrms')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-600/20 border border-slate-200 hover:border-indigo-500/50 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-[#0f172a] transition-colors mb-2">
                <UserCheck size={18} />
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-[#0f172a]">
                Add Employee
              </span>
            </button>

            <button
              onClick={() => setActiveModule('payroll')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-600/20 border border-slate-200 hover:border-indigo-500/50 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-[#0f172a] transition-colors mb-2">
                <Banknote size={18} />
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-[#0f172a]">
                Run Payroll
              </span>
            </button>

            <button
              onClick={() => setActiveModule('helpdesk')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-600/20 border border-slate-200 hover:border-indigo-500/50 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-[#0f172a] transition-colors mb-2">
                <Headphones size={18} />
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-[#0f172a]">
                New Ticket
              </span>
            </button>

            <button
              onClick={() => setActiveModule('documents')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-600/20 border border-slate-200 hover:border-indigo-500/50 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-[#0f172a] transition-colors mb-2">
                <Upload size={18} />
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-[#0f172a]">
                Upload Document
              </span>
            </button>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="lg:col-span-6 bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg">
          <h2 className="text-sm font-bold text-[#0f172a] mb-4">Quick Shortcuts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveModule('customers')}
              className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-medium text-slate-700"
            >
              <Users size={16} className="text-teal-400" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => setActiveModule('sales')}
              className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-medium text-slate-700"
            >
              <FileText size={16} className="text-purple-400" />
              <span>Invoices</span>
            </button>

            <button
              onClick={() => setActiveModule('hrms')}
              className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-medium text-slate-700"
            >
              <UserCheck size={16} className="text-amber-400" />
              <span>Employees</span>
            </button>

            <button
              onClick={() => setActiveModule('reports')}
              className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-medium text-slate-700"
            >
              <BarChart3 size={16} className="text-emerald-400" />
              <span>Reports</span>
            </button>

            <button
              onClick={() => setActiveModule('inventory')}
              className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-medium text-slate-700"
            >
              <Boxes size={16} className="text-amber-400" />
              <span>Inventory</span>
            </button>

            <button
              onClick={() => setActiveModule('projects')}
              className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-medium text-slate-700"
            >
              <FolderKanban size={16} className="text-emerald-400" />
              <span>Projects</span>
            </button>

            <button
              onClick={() => setActiveModule('tasks')}
              className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-medium text-slate-700"
            >
              <CheckSquare size={16} className="text-amber-400" />
              <span>Tasks</span>
            </button>

            <button
              onClick={() => setActiveModule('documents')}
              className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-medium text-slate-700"
            >
              <Folder size={16} className="text-rose-400" />
              <span>Documents</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <p>© 2025 Demo Company Pvt. Ltd. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          <a href="#" className="hover:text-slate-600">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600">
            Terms of Service
          </a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600">
            Support
          </a>
        </div>
      </footer>
    </div>
  );
};
