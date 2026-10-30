import React, { useState } from 'react';
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

export type PeriodKey = 'month' | 'quarter' | 'ytd' | 'all';

export const PERIOD_NAMES: Record<PeriodKey, string> = {
  month: 'This Month',
  quarter: 'Quarter',
  ytd: 'YTD 2026',
  all: 'All Time'
};

export const PERIOD_FISCAL_LABELS: Record<PeriodKey, string> = {
  month: 'This Month',
  quarter: 'Q2 FY 2025-26',
  ytd: 'YTD 2026',
  all: 'All Time'
};

const KPI_DATA: Record<PeriodKey, {
  revenue: string;
  revenueChange: string;
  revenuePositive: boolean;
  revenueSparkline: string;
  pipeline: string;
  pipelineChange: string;
  pipelinePositive: boolean;
  pipelineSparkline: string;
  attendance: string;
  attendanceChange: string;
  attendancePositive: boolean;
  attendanceSparkline: string;
  tickets: string;
  ticketsChange: string;
  ticketsPositive: boolean;
  ticketsSparkline: string;
  netProfit: string;
  netProfitChange: string;
  netProfitPositive: boolean;
  netProfitSparkline: string;
}> = {
  month: {
    revenue: '₹ 1,48,35,000',
    revenueChange: '+12.5% vs last month',
    revenuePositive: true,
    revenueSparkline: 'M0 20 L20 18 L40 12 L60 15 L80 8 L100 2',
    pipeline: '₹ 2,34,50,000',
    pipelineChange: '+8.3% vs last month',
    pipelinePositive: true,
    pipelineSparkline: 'M0 22 L20 19 L40 16 L60 10 L80 12 L100 4',
    attendance: '92.6%',
    attendanceChange: '-2.4% vs last month',
    attendancePositive: false,
    attendanceSparkline: 'M0 5 L20 8 L40 12 L60 10 L80 18 L100 20',
    tickets: '28',
    ticketsChange: '-10.3% vs last month',
    ticketsPositive: true,
    ticketsSparkline: 'M0 8 L20 12 L40 10 L60 16 L80 14 L100 22',
    netProfit: '₹ 24,75,000',
    netProfitChange: '+15.8% vs last month',
    netProfitPositive: true,
    netProfitSparkline: 'M0 22 L20 18 L40 16 L60 10 L80 8 L100 3',
  },
  quarter: {
    revenue: '₹ 4,35,80,000',
    revenueChange: '+18.2% vs last quarter',
    revenuePositive: true,
    revenueSparkline: 'M0 22 L20 16 L40 14 L60 9 L80 6 L100 2',
    pipeline: '₹ 6,85,00,000',
    pipelineChange: '+14.5% vs last quarter',
    pipelinePositive: true,
    pipelineSparkline: 'M0 20 L20 17 L40 13 L60 11 L80 7 L100 3',
    attendance: '94.2%',
    attendanceChange: '+1.8% vs last quarter',
    attendancePositive: true,
    attendanceSparkline: 'M0 18 L20 14 L40 11 L60 8 L80 6 L100 4',
    tickets: '84',
    ticketsChange: '-14.2% vs last quarter',
    ticketsPositive: true,
    ticketsSparkline: 'M0 6 L20 9 L40 12 L60 15 L80 18 L100 22',
    netProfit: '₹ 78,40,000',
    netProfitChange: '+19.4% vs last quarter',
    netProfitPositive: true,
    netProfitSparkline: 'M0 21 L20 17 L40 13 L60 9 L80 5 L100 2',
  },
  ytd: {
    revenue: '₹ 12,85,00,000',
    revenueChange: '+24.6% vs last year',
    revenuePositive: true,
    revenueSparkline: 'M0 24 L20 19 L40 14 L60 10 L80 5 L100 1',
    pipeline: '₹ 18,40,00,000',
    pipelineChange: '+22.1% vs last year',
    pipelinePositive: true,
    pipelineSparkline: 'M0 23 L20 18 L40 14 L60 8 L80 5 L100 2',
    attendance: '93.8%',
    attendanceChange: '+2.1% vs last year',
    attendancePositive: true,
    attendanceSparkline: 'M0 16 L20 13 L40 10 L60 8 L80 5 L100 4',
    tickets: '312',
    ticketsChange: '-18.5% vs last year',
    ticketsPositive: true,
    ticketsSparkline: 'M0 5 L20 8 L40 11 L60 14 L80 19 L100 23',
    netProfit: '₹ 2,45,60,000',
    netProfitChange: '+26.2% vs last year',
    netProfitPositive: true,
    netProfitSparkline: 'M0 23 L20 18 L40 13 L60 8 L80 4 L100 1',
  },
  all: {
    revenue: '₹ 28,45,00,000',
    revenueChange: '+31.4% all time',
    revenuePositive: true,
    revenueSparkline: 'M0 25 L20 20 L40 15 L60 10 L80 4 L100 1',
    pipeline: '₹ 32,50,00,000',
    pipelineChange: '+28.7% all time',
    pipelinePositive: true,
    pipelineSparkline: 'M0 24 L20 18 L40 13 L60 9 L80 4 L100 1',
    attendance: '93.5%',
    attendanceChange: '+1.5% all time',
    attendancePositive: true,
    attendanceSparkline: 'M0 15 L20 12 L40 9 L60 7 L80 5 L100 4',
    tickets: '680',
    ticketsChange: '-22.0% all time',
    ticketsPositive: true,
    ticketsSparkline: 'M0 4 L20 7 L40 11 L60 15 L80 18 L100 24',
    netProfit: '₹ 5,12,00,000',
    netProfitChange: '+33.1% all time',
    netProfitPositive: true,
    netProfitSparkline: 'M0 24 L20 19 L40 14 L60 8 L80 3 L100 1',
  }
};

const REVENUE_OVERVIEW_DATA: Record<PeriodKey, {
  chartPath: string;
  fillPath: string;
  dotCx: number;
  dotCy: number;
  tooltipX: number;
  tooltipY: number;
  amount: string;
  periodLabel: string;
  xLabels: string[];
}> = {
  month: {
    chartPath: 'M0 130 Q40 100 80 110 T160 80 T240 60 T320 30 T400 20',
    fillPath: 'M0 130 Q40 100 80 110 T160 80 T240 60 T320 30 T400 20 L400 150 L0 150 Z',
    dotCx: 240,
    dotCy: 60,
    tooltipX: 200,
    tooltipY: 15,
    amount: '₹ 1,48,35,000',
    periodLabel: '20 May, 2025',
    xLabels: ['01 May', '05 May', '10 May', '15 May', '20 May', '25 May', '31 May'],
  },
  quarter: {
    chartPath: 'M0 125 Q50 95 100 85 T200 65 T300 45 T400 15',
    fillPath: 'M0 125 Q50 95 100 85 T200 65 T300 45 T400 15 L400 150 L0 150 Z',
    dotCx: 280,
    dotCy: 48,
    tooltipX: 235,
    tooltipY: 10,
    amount: '₹ 4,35,80,000',
    periodLabel: 'Q2 FY 2025-26',
    xLabels: ['Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Close'],
  },
  ytd: {
    chartPath: 'M0 135 Q60 105 120 90 T240 55 T340 30 T400 10',
    fillPath: 'M0 135 Q60 105 120 90 T240 55 T340 30 T400 10 L400 150 L0 150 Z',
    dotCx: 310,
    dotCy: 35,
    tooltipX: 260,
    tooltipY: 5,
    amount: '₹ 12,85,00,000',
    periodLabel: 'YTD 2026',
    xLabels: ['Q1 FY26', 'Q2 FY26', 'Q3 FY26', 'Q4 FY26', 'YTD Target', 'Realized', 'Projected'],
  },
  all: {
    chartPath: 'M0 140 Q70 110 140 85 T260 45 T360 25 T400 8',
    fillPath: 'M0 140 Q70 110 140 85 T260 45 T360 25 T400 8 L400 150 L0 150 Z',
    dotCx: 330,
    dotCy: 28,
    tooltipX: 280,
    tooltipY: 5,
    amount: '₹ 28,45,00,000',
    periodLabel: 'Cumulative All-Time',
    xLabels: ['2022', '2023', '2024', '2025', '2026', 'Current', 'Future'],
  }
};

const PIPELINE_DATA: Record<PeriodKey, {
  newLeads: number;
  contacted: number;
  contactedPct: string;
  qualified: number;
  qualifiedPct: string;
  proposal: number;
  proposalPct: string;
  won: number;
  wonPct: string;
  conversionRate: string;
}> = {
  month: {
    newLeads: 320,
    contacted: 180,
    contactedPct: '82%',
    qualified: 98,
    qualifiedPct: '68%',
    proposal: 45,
    proposalPct: '52%',
    won: 20,
    wonPct: '38%',
    conversionRate: '6.25%',
  },
  quarter: {
    newLeads: 980,
    contacted: 580,
    contactedPct: '85%',
    qualified: 310,
    qualifiedPct: '71%',
    proposal: 145,
    proposalPct: '55%',
    won: 72,
    wonPct: '42%',
    conversionRate: '7.35%',
  },
  ytd: {
    newLeads: 3450,
    contacted: 2150,
    contactedPct: '87%',
    qualified: 1180,
    qualifiedPct: '74%',
    proposal: 580,
    proposalPct: '58%',
    won: 295,
    wonPct: '45%',
    conversionRate: '8.55%',
  },
  all: {
    newLeads: 7820,
    contacted: 5120,
    contactedPct: '88%',
    qualified: 2940,
    qualifiedPct: '76%',
    proposal: 1480,
    proposalPct: '60%',
    won: 740,
    wonPct: '48%',
    conversionRate: '9.46%',
  }
};

const PRODUCTS_DATA: Record<PeriodKey, {
  totalSales: string;
  productA: { amount: string; pct: number };
  productB: { amount: string; pct: number };
  productC: { amount: string; pct: number };
  productD: { amount: string; pct: number };
  others: { amount: string; pct: number };
}> = {
  month: {
    totalSales: '₹1,84,95,000',
    productA: { amount: '₹ 65,40,000 (35%)', pct: 35 },
    productB: { amount: '₹ 45,20,000 (24%)', pct: 24 },
    productC: { amount: '₹ 32,10,000 (17%)', pct: 17 },
    productD: { amount: '₹ 28,75,000 (15%)', pct: 15 },
    others: { amount: '₹ 12,90,000 (9%)', pct: 9 },
  },
  quarter: {
    totalSales: '₹5,42,80,000',
    productA: { amount: '₹ 2,06,26,400 (38%)', pct: 38 },
    productB: { amount: '₹ 1,35,70,000 (25%)', pct: 25 },
    productC: { amount: '₹ 86,84,800 (16%)', pct: 16 },
    productD: { amount: '₹ 70,56,400 (13%)', pct: 13 },
    others: { amount: '₹ 43,42,400 (8%)', pct: 8 },
  },
  ytd: {
    totalSales: '₹18,90,50,000',
    productA: { amount: '₹ 7,56,20,000 (40%)', pct: 40 },
    productB: { amount: '₹ 4,72,62,500 (25%)', pct: 25 },
    productC: { amount: '₹ 2,83,57,500 (15%)', pct: 15 },
    productD: { amount: '₹ 2,26,86,000 (12%)', pct: 12 },
    others: { amount: '₹ 1,51,24,000 (8%)', pct: 8 },
  },
  all: {
    totalSales: '₹45,20,00,000',
    productA: { amount: '₹ 18,98,40,000 (42%)', pct: 42 },
    productB: { amount: '₹ 10,84,80,000 (24%)', pct: 24 },
    productC: { amount: '₹ 6,32,80,000 (14%)', pct: 14 },
    productD: { amount: '₹ 5,42,40,000 (12%)', pct: 12 },
    others: { amount: '₹ 3,61,60,000 (8%)', pct: 8 },
  }
};

const ATTENDANCE_DATA: Record<PeriodKey, {
  engineering: number;
  sales: number;
  marketing: number;
  hr: number;
  finance: number;
  support: number;
}> = {
  month: {
    engineering: 95,
    sales: 93,
    marketing: 90,
    hr: 88,
    finance: 85,
    support: 80,
  },
  quarter: {
    engineering: 96,
    sales: 94,
    marketing: 92,
    hr: 91,
    finance: 88,
    support: 84,
  },
  ytd: {
    engineering: 94,
    sales: 92,
    marketing: 89,
    hr: 90,
    finance: 87,
    support: 82,
  },
  all: {
    engineering: 93,
    sales: 91,
    marketing: 88,
    hr: 89,
    finance: 86,
    support: 81,
  }
};

export const ExecutiveDashboard: React.FC = () => {
  const { userProfile, isAuthenticated, setActiveModule, approveLeave, approveExpense } = useApp();

  const [dashboardPeriod, setDashboardPeriod] = useState<PeriodKey>('month');
  const [fiscalDropdownOpen, setFiscalDropdownOpen] = useState(false);

  const [revenuePeriod, setRevenuePeriod] = useState<PeriodKey>('month');
  const [revDropdownOpen, setRevDropdownOpen] = useState(false);

  const [pipelinePeriod, setPipelinePeriod] = useState<PeriodKey>('month');
  const [pipeDropdownOpen, setPipeDropdownOpen] = useState(false);

  const [productsPeriod, setProductsPeriod] = useState<PeriodKey>('month');
  const [prodDropdownOpen, setProdDropdownOpen] = useState(false);

  const [attendancePeriod, setAttendancePeriod] = useState<PeriodKey>('month');
  const [attDropdownOpen, setAttDropdownOpen] = useState(false);

  const handleGlobalPeriodChange = (newPeriod: PeriodKey) => {
    setDashboardPeriod(newPeriod);
    setRevenuePeriod(newPeriod);
    setPipelinePeriod(newPeriod);
    setProductsPeriod(newPeriod);
    setAttendancePeriod(newPeriod);
  };

  const displayName =
    isAuthenticated && userProfile?.name && userProfile.name.trim()
      ? userProfile.name.trim()
      : 'there';

  const kpi = KPI_DATA[dashboardPeriod];
  const revData = REVENUE_OVERVIEW_DATA[revenuePeriod];
  const pipeData = PIPELINE_DATA[pipelinePeriod];
  const prodData = PRODUCTS_DATA[productsPeriod];
  const attData = ATTENDANCE_DATA[attendancePeriod];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] flex flex-wrap items-center gap-2">
            Welcome back, {displayName}! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Global Reporting / Fiscal Period Selector */}
        <div className="relative">
          <button
            id="executive-fiscal-period-selector"
            type="button"
            onClick={() => setFiscalDropdownOpen(prev => !prev)}
            className="flex items-center space-x-2 text-xs text-slate-700 bg-white shadow-sm border border-slate-200/80 px-3.5 py-2 rounded-xl hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer"
            aria-haspopup="listbox"
            aria-expanded={fiscalDropdownOpen}
          >
            <span className="font-semibold text-slate-700">Fiscal Period:</span>
            <span className="font-bold text-indigo-600">{PERIOD_FISCAL_LABELS[dashboardPeriod]}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${fiscalDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {fiscalDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 shadow-xl rounded-xl py-1 z-30">
              {(['month', 'quarter', 'ytd', 'all'] as const).map(p => (
                <button
                  key={p}
                  id={`executive-period-opt-${p}`}
                  type="button"
                  onClick={() => {
                    handleGlobalPeriodChange(p);
                    setFiscalDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    dashboardPeriod === p ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{PERIOD_FISCAL_LABELS[p]}</span>
                  {dashboardPeriod === p && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Banknote size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#0f172a] mt-2">{kpi.revenue}</p>
          <div className="flex items-center text-[11px] text-emerald-400 mt-2 font-medium">
            <ArrowUpRight size={14} className="mr-0.5" />
            <span>{kpi.revenueChange}</span>
          </div>
          {/* Mini Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path
                d={kpi.revenueSparkline}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Pipeline Value */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Pipeline Value</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Target size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#0f172a] mt-2">{kpi.pipeline}</p>
          <div className="flex items-center text-[11px] text-purple-400 mt-2 font-medium">
            <ArrowUpRight size={14} className="mr-0.5" />
            <span>{kpi.pipelineChange}</span>
          </div>
          {/* Mini Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path
                d={kpi.pipelineSparkline}
                fill="none"
                stroke="#A855F7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Attendance % */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Attendance %</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#0f172a] mt-2">{kpi.attendance}</p>
          <div className={`flex items-center text-[11px] ${kpi.attendancePositive ? 'text-emerald-400' : 'text-rose-400'} mt-2 font-medium`}>
            {kpi.attendancePositive ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
            <span>{kpi.attendanceChange}</span>
          </div>
          {/* Mini Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path
                d={kpi.attendanceSparkline}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Open Tickets */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Open Tickets</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Headphones size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#0f172a] mt-2">{kpi.tickets}</p>
          <div className="flex items-center text-[11px] text-emerald-400 mt-2 font-medium">
            <ArrowDownRight size={14} className="mr-0.5" />
            <span>{kpi.ticketsChange}</span>
          </div>
          {/* Mini Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path
                d={kpi.ticketsSparkline}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 5: Net Profit */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500">Net Profit</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#0f172a] mt-2">{kpi.netProfit}</p>
          <div className="flex items-center text-[11px] text-emerald-400 mt-2 font-medium">
            <ArrowUpRight size={14} className="mr-0.5" />
            <span>{kpi.netProfitChange}</span>
          </div>
          {/* Mini Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path
                d={kpi.netProfitSparkline}
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
            <div className="relative">
              <button
                id="rev-period-btn"
                type="button"
                onClick={() => setRevDropdownOpen(prev => !prev)}
                className="flex items-center space-x-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={revDropdownOpen}
              >
                <span>{PERIOD_NAMES[revenuePeriod]}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${revDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {revDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 shadow-lg rounded-xl py-1 z-30">
                  {(['month', 'quarter', 'ytd', 'all'] as const).map(p => (
                    <button
                      key={p}
                      id={`rev-period-opt-${p}`}
                      type="button"
                      onClick={() => {
                        setRevenuePeriod(p);
                        setRevDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                        revenuePeriod === p ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {PERIOD_NAMES[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                  d={revData.fillPath}
                  fill="url(#revGrad)"
                />
                <path
                  d={revData.chartPath}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="3"
                />

                {/* Data point dot */}
                <circle cx={revData.dotCx} cy={revData.dotCy} r="5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2" />

                {/* Tooltip Overlay */}
                <g transform={`translate(${revData.tooltipX}, ${revData.tooltipY})`}>
                  <rect width="90" height="34" rx="6" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                  <text x="45" y="14" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {revData.amount}
                  </text>
                  <text x="45" y="26" fill="#94A3B8" fontSize="8" textAnchor="middle">
                    {revData.periodLabel}
                  </text>
                </g>
              </svg>
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1 font-medium">
              {revData.xLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Sales Pipeline */}
        <div className="lg:col-span-4 bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f172a]">Sales Pipeline</h2>
            <div className="relative">
              <button
                id="pipe-period-btn"
                type="button"
                onClick={() => setPipeDropdownOpen(prev => !prev)}
                className="flex items-center space-x-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={pipeDropdownOpen}
              >
                <span>{PERIOD_NAMES[pipelinePeriod]}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${pipeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {pipeDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 shadow-lg rounded-xl py-1 z-30">
                  {(['month', 'quarter', 'ytd', 'all'] as const).map(p => (
                    <button
                      key={p}
                      id={`pipe-period-opt-${p}`}
                      type="button"
                      onClick={() => {
                        setPipelinePeriod(p);
                        setPipeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                        pipelinePeriod === p ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {PERIOD_NAMES[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="my-4 space-y-2">
            {/* Funnel Stage 1 */}
            <div className="relative group">
              <div
                className="h-8 rounded-lg bg-blue-600/80 flex items-center justify-between px-3 text-xs font-semibold text-[#0f172a] transition-all group-hover:bg-blue-500"
                style={{ width: '100%' }}
              >
                <span>New Leads</span>
                <span>{pipeData.newLeads}</span>
              </div>
            </div>

            {/* Funnel Stage 2 */}
            <div className="relative group">
              <div
                className="h-8 rounded-lg bg-cyan-600/80 flex items-center justify-between px-3 text-xs font-semibold text-[#0f172a] transition-all group-hover:bg-cyan-500 mx-auto"
                style={{ width: pipeData.contactedPct }}
              >
                <span>Contacted</span>
                <span>{pipeData.contacted}</span>
              </div>
            </div>

            {/* Funnel Stage 3 */}
            <div className="relative group">
              <div
                className="h-8 rounded-lg bg-teal-600/80 flex items-center justify-between px-3 text-xs font-semibold text-[#0f172a] transition-all group-hover:bg-teal-500 mx-auto"
                style={{ width: pipeData.qualifiedPct }}
              >
                <span>Qualified</span>
                <span>{pipeData.qualified}</span>
              </div>
            </div>

            {/* Funnel Stage 4 */}
            <div className="relative group">
              <div
                className="h-8 rounded-lg bg-emerald-600/80 flex items-center justify-between px-3 text-xs font-semibold text-[#0f172a] transition-all group-hover:bg-emerald-500 mx-auto"
                style={{ width: pipeData.proposalPct }}
              >
                <span>Proposal</span>
                <span>{pipeData.proposal}</span>
              </div>
            </div>

            {/* Funnel Stage 5 */}
            <div className="relative group">
              <div
                className="h-8 rounded-lg bg-green-500 flex items-center justify-between px-3 text-xs font-extrabold text-[#0f172a] transition-all group-hover:bg-green-400 mx-auto"
                style={{ width: pipeData.wonPct }}
              >
                <span>Won</span>
                <span>{pipeData.won}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-xs">
            <span className="text-slate-500">Conversion Rate</span>
            <span className="font-bold text-emerald-400">{pipeData.conversionRate}</span>
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
            <div className="relative">
              <button
                id="products-period-btn"
                type="button"
                onClick={() => setProdDropdownOpen(prev => !prev)}
                className="flex items-center space-x-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={prodDropdownOpen}
              >
                <span>{PERIOD_NAMES[productsPeriod]}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${prodDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {prodDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 shadow-lg rounded-xl py-1 z-30">
                  {(['month', 'quarter', 'ytd', 'all'] as const).map(p => (
                    <button
                      key={p}
                      id={`products-period-opt-${p}`}
                      type="button"
                      onClick={() => {
                        setProductsPeriod(p);
                        setProdDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                        productsPeriod === p ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {PERIOD_NAMES[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                  strokeDasharray={`${prodData.productA.pct}, 100`}
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3.8"
                  strokeDasharray={`${prodData.productB.pct}, 100`}
                  strokeDashoffset={`-${prodData.productA.pct}`}
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.8"
                  strokeDasharray={`${prodData.productC.pct}, 100`}
                  strokeDashoffset={`-${prodData.productA.pct + prodData.productB.pct}`}
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.8"
                  strokeDasharray={`${prodData.productD.pct}, 100`}
                  strokeDashoffset={`-${prodData.productA.pct + prodData.productB.pct + prodData.productC.pct}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-[#0f172a] leading-tight">{prodData.totalSales}</span>
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
                <span className="text-[#0f172a] font-bold">{prodData.productA.amount}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-slate-600 truncate">Product B</span>
                </div>
                <span className="text-[#0f172a] font-bold">{prodData.productB.amount}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-slate-600 truncate">Product C</span>
                </div>
                <span className="text-[#0f172a] font-bold">{prodData.productC.amount}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-600 truncate">Product D</span>
                </div>
                <span className="text-[#0f172a] font-bold">{prodData.productD.amount}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                  <span className="text-slate-600 truncate">Others</span>
                </div>
                <span className="text-[#0f172a] font-bold">{prodData.others.amount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Attendance */}
        <div className="lg:col-span-4 bg-white shadow-sm border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f172a]">Department Attendance</h2>
            <div className="relative">
              <button
                id="attendance-period-btn"
                type="button"
                onClick={() => setAttDropdownOpen(prev => !prev)}
                className="flex items-center space-x-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={attDropdownOpen}
              >
                <span>{PERIOD_NAMES[attendancePeriod]}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${attDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {attDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 shadow-lg rounded-xl py-1 z-30">
                  {(['month', 'quarter', 'ytd', 'all'] as const).map(p => (
                    <button
                      key={p}
                      id={`attendance-period-opt-${p}`}
                      type="button"
                      onClick={() => {
                        setAttendancePeriod(p);
                        setAttDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                        attendancePeriod === p ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {PERIOD_NAMES[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3.5 my-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Engineering</span>
                <span className="text-[#0f172a] font-bold">{attData.engineering}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${attData.engineering}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Sales</span>
                <span className="text-[#0f172a] font-bold">{attData.sales}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${attData.sales}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Marketing</span>
                <span className="text-[#0f172a] font-bold">{attData.marketing}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${attData.marketing}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">HR</span>
                <span className="text-[#0f172a] font-bold">{attData.hr}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${attData.hr}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Finance</span>
                <span className="text-[#0f172a] font-bold">{attData.finance}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${attData.finance}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Support</span>
                <span className="text-[#0f172a] font-bold">{attData.support}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${attData.support}%` }} />
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
