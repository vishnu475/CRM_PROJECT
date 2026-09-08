import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, Users, DollarSign, Target, Calendar,
  Download, Printer, RefreshCw, ArrowUpRight, CheckCircle2,
  PieChart, Building, Briefcase, Clock, FileText, Landmark,
  ShieldCheck, Award, GraduationCap, ChevronRight, Filter, Search
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'ytd' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'crm' | 'hrms' | 'interns' | 'financial' | 'tables'>('overview');
  const [tableSearch, setTableSearch] = useState('');
  const [activeTableTab, setActiveTableTab] = useState<'employees' | 'leads' | 'invoices' | 'interns'>('employees');

  const fetchReportData = useCallback(async () => {
    try {
      const res = await fetch('/api/reports/summary');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchReportData();
    setIsRefreshing(false);
    setRefreshMsg('Dual-DB Analytics Refreshed from PostgreSQL!');
    setTimeout(() => setRefreshMsg(null), 3000);
  };

  const handleExportCSV = () => {
    if (!data) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (activeTableTab === 'employees') {
      csvContent += 'Department,Headcount,MonthlyCost,AvgSalary\n';
      data.hrms?.departmentBreakdown?.forEach((d: any) => {
        csvContent += `"${d.department}",${d.headcount},${d.monthly_cost},${d.avg_salary}\n`;
      });
    } else if (activeTableTab === 'leads') {
      csvContent += 'Stage,Count,TotalValue\n';
      data.crm?.leadsByStage?.forEach((l: any) => {
        csvContent += `"${l.stage}",${l.count},${l.total_value}\n`;
      });
    } else if (activeTableTab === 'invoices') {
      csvContent += 'Status,Count,TotalAmount\n';
      data.crm?.invoices?.forEach((i: any) => {
        csvContent += `"${i.status}",${i.count},${i.total_amount}\n`;
      });
    } else {
      csvContent += 'Track,Count\n';
      data.hrms?.interns?.trackBreakdown?.forEach((t: any) => {
        csvContent += `"${t.internship_type}",${t.count}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Enterprise_Report_${activeTableTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="animate-spin text-purple-600" size={36} />
        <p className="text-xs font-semibold text-slate-500">Aggregating Live HRMS & CRM Intelligence...</p>
      </div>
    );
  }

  const hrms = data?.hrms || {};
  const crm = data?.crm || {};
  const finance = data?.finance || {};

  // Formatted Metrics
  const totalEmployees = hrms.payroll?.total_employees || 0;
  const totalMonthlyPayroll = parseFloat(hrms.payroll?.total_monthly_payroll || 0);
  const totalAnnualPayroll = parseFloat(hrms.payroll?.total_annual_payroll || 0);
  const totalPipelineValue = parseFloat(crm.totalPipelineValue || 0);
  const totalLeadsCount = crm.totalLeadsCount || 0;
  const totalInvoicedValue = parseFloat(crm.totalInvoicedValue || 0);
  const totalCash = parseFloat(finance.totalCash || 0);

  // Conversion rate for interns
  const totalInterns = hrms.interns?.totalInterns || 0;
  const convertedInterns = hrms.interns?.convertedInterns || 0;
  const internConversionRate = totalInterns > 0 ? Math.round((convertedInterns / totalInterns) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={24} />
            Enterprise Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated intelligence across HRMS human capital, payroll liabilities, CRM pipeline, and enterprise revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {refreshMsg && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold animate-pulse">
              <CheckCircle2 size={14} /> {refreshMsg}
            </div>
          )}

          {/* Period Filter */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            {[
              { id: 'month', label: 'This Month' },
              { id: 'quarter', label: 'Quarter' },
              { id: 'ytd', label: 'YTD 2026' },
              { id: 'all', label: 'All Time' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  selectedPeriod === p.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin mr-1' : 'mr-1'} />
            {isRefreshing ? 'Refreshing...' : 'Refresh DB'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
          >
            <Download size={13} /> Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-sm"
          >
            <Printer size={13} /> Print Report
          </Button>
        </div>
      </div>

      {/* 3 Interactive Highlight Category Cards (Matching User Reference Image) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Financial Statements */}
        <div
          onClick={() => setActiveTab('financial')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === 'financial'
              ? 'bg-gradient-to-br from-indigo-50/80 to-white border-indigo-300 ring-2 ring-indigo-500/10'
              : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Landmark size={20} />
            </div>
            <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
              Live Balance <ArrowUpRight size={13} />
            </span>
          </div>
          <h3 className="font-bold text-[#0f172a] text-sm mt-3">Financial Statements</h3>
          <p className="text-xs text-slate-500 mt-0.5">P&L, Balance Sheet, Trial Balance, Cash Reserves</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Total Bank Cash</span>
            <span className="font-bold text-emerald-700">₹{(totalCash / 10000000).toFixed(2)} Cr</span>
          </div>
        </div>

        {/* Card 2: Lead-to-Cash Analytics */}
        <div
          onClick={() => setActiveTab('crm')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === 'crm'
              ? 'bg-gradient-to-br from-purple-50/80 to-white border-purple-300 ring-2 ring-purple-500/10'
              : 'bg-white border-slate-200 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <TrendingUp size={20} />
            </div>
            <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
              {totalLeadsCount} Leads Active <ArrowUpRight size={13} />
            </span>
          </div>
          <h3 className="font-bold text-[#0f172a] text-sm mt-3">Lead-to-Cash Analytics</h3>
          <p className="text-xs text-slate-500 mt-0.5">Funnel conversion, pipeline aging & won revenue</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Pipeline Value</span>
            <span className="font-bold text-purple-700">₹{(totalPipelineValue / 100000).toFixed(1)} Lakh</span>
          </div>
        </div>

        {/* Card 3: HR & Payroll Metrics */}
        <div
          onClick={() => setActiveTab('hrms')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === 'hrms'
              ? 'bg-gradient-to-br from-emerald-50/80 to-white border-emerald-300 ring-2 ring-emerald-500/10'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              {totalEmployees} Staff <ArrowUpRight size={13} />
            </span>
          </div>
          <h3 className="font-bold text-[#0f172a] text-sm mt-3">HR & Payroll Metrics</h3>
          <p className="text-xs text-slate-500 mt-0.5">Headcount, department cost & intern conversions</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Monthly Payroll</span>
            <span className="font-bold text-slate-900">₹{totalMonthlyPayroll.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1">
        <div className="flex space-x-1 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
            { id: 'crm', label: 'CRM Pipeline & Funnel', icon: Target },
            { id: 'hrms', label: 'HRMS Human Capital', icon: Users },
            { id: 'interns', label: 'Intern Lifecycle & Mentors', icon: GraduationCap },
            { id: 'financial', label: 'Financial Statements', icon: Landmark },
            { id: 'tables', label: 'Detailed Data Tables', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Headcount</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalEmployees + totalInterns}</h3>
              <p className="text-xs text-slate-500 mt-1">{totalEmployees} Employees + {totalInterns} Interns</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Payroll Liability</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalMonthlyPayroll.toLocaleString()}</h3>
              <p className="text-xs text-purple-600 mt-1">Annual CTC: ₹{(totalAnnualPayroll / 100000).toFixed(1)} Lakh</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active CRM Pipeline</span>
              <h3 className="text-2xl font-extrabold text-purple-700 mt-1">₹{totalPipelineValue.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-1">{totalLeadsCount} qualified sales opportunities</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Liquid Reserves</span>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">₹{totalCash.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-1">Across corporate bank accounts</p>
            </div>
          </div>

          {/* Two-Column Department & Pipeline Quick Visuals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Headcount & Salary Share */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building size={16} className="text-indigo-600" />
                  Department Headcount & Cost Distribution
                </h3>
                <span className="text-xs font-semibold text-slate-400">HRMS Database</span>
              </div>

              <div className="space-y-3 text-xs">
                {hrms.departmentBreakdown?.map((d: any) => {
                  const percent = Math.round((d.headcount / (totalEmployees || 1)) * 100);
                  return (
                    <div key={d.department} className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-800">{d.department}</span>
                        <span className="text-slate-500">
                          {d.headcount} staff • ₹{parseFloat(d.monthly_cost).toLocaleString()} / mo
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CRM Funnel Stages */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Target size={16} className="text-purple-600" />
                  Sales Pipeline Stages & Value
                </h3>
                <span className="text-xs font-semibold text-slate-400">CRM Database</span>
              </div>

              <div className="space-y-3 text-xs">
                {crm.leadsByStage?.map((stage: any) => {
                  const val = parseFloat(stage.total_value || 0);
                  const percent = totalPipelineValue > 0 ? Math.round((val / totalPipelineValue) * 100) : 20;
                  return (
                    <div key={stage.stage} className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          {stage.stage}
                        </span>
                        <span className="text-slate-500">
                          {stage.count} deals • ₹{val.toLocaleString()} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: CRM PIPELINE & SALES */}
      {/* ============================================================ */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales Pipeline</span>
              <h3 className="text-2xl font-extrabold text-purple-700 mt-1">₹{totalPipelineValue.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-1">Across all open stages</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">₹{totalInvoicedValue.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-1">From billing & accounts ledger</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customers Base</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{crm.totalCustomers || 12}</h3>
              <p className="text-xs text-slate-500 mt-1">Active enterprise accounts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Lead Sources */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <TrendingUp size={16} className="text-purple-600" />
                Revenue by Lead Generation Channel
              </h3>
              <div className="space-y-3 text-xs">
                {crm.leadsBySource?.map((src: any) => (
                  <div key={src.source} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold text-slate-800">{src.source || 'Website Direct'}</p>
                      <p className="text-[11px] text-slate-500">{src.count} qualified prospects</p>
                    </div>
                    <span className="font-extrabold text-purple-700">₹{parseFloat(src.total_value || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoicing Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <FileText size={16} className="text-emerald-600" />
                Invoicing & Receivables Aging
              </h3>
              <div className="space-y-3 text-xs">
                {crm.invoices?.map((inv: any) => (
                  <div key={inv.status} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        inv.status === 'Paid' ? 'bg-emerald-500' : inv.status === 'Sent' ? 'bg-blue-500' : 'bg-amber-500'
                      }`} />
                      <div>
                        <p className="font-bold text-slate-800">{inv.status} Invoices</p>
                        <p className="text-[11px] text-slate-500">{inv.count} records</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-slate-900">₹{parseFloat(inv.total_amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: HRMS HUMAN CAPITAL */}
      {/* ============================================================ */}
      {activeTab === 'hrms' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Employees</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalEmployees}</h3>
              <p className="text-xs text-slate-500 mt-1">Confirmed & on probation</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Monthly Salary</span>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                ₹{Math.round(parseFloat(hrms.payroll?.avg_monthly_salary || 0)).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Per active employee</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departments</span>
              <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{hrms.departmentBreakdown?.length || 4}</h3>
              <p className="text-xs text-slate-500 mt-1">Operational business units</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interns Enrolled</span>
              <h3 className="text-2xl font-extrabold text-purple-700 mt-1">{totalInterns}</h3>
              <p className="text-xs text-slate-500 mt-1">In training & research</p>
            </div>
          </div>

          {/* Detailed Department Cost Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                Departmental Headcount & Compensation Allocation
              </h3>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Active Staff</th>
                  <th className="py-3 px-4">Monthly Cost</th>
                  <th className="py-3 px-4">Annual Cost</th>
                  <th className="py-3 px-4">Average Salary</th>
                  <th className="py-3 px-4">Budget Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hrms.departmentBreakdown?.map((d: any) => {
                  const mCost = parseFloat(d.monthly_cost || 0);
                  const share = totalMonthlyPayroll > 0 ? Math.round((mCost / totalMonthlyPayroll) * 100) : 0;
                  return (
                    <tr key={d.department} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.department}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{d.headcount}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">₹{mCost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600">₹{(mCost * 12).toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600">₹{Math.round(parseFloat(d.avg_salary || 0)).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${share}%` }} />
                          </div>
                          <span className="font-bold text-slate-700">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: INTERN LIFECYCLE & MENTORS */}
      {/* ============================================================ */}
      {activeTab === 'interns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Interns</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalInterns}</h3>
              <p className="text-xs text-slate-500 mt-1">Registered in program</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Trainees</span>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{hrms.interns?.activeInterns || 0}</h3>
              <p className="text-xs text-slate-500 mt-1">Currently working on projects</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Converted to Employee</span>
              <h3 className="text-2xl font-extrabold text-purple-700 mt-1">{convertedInterns}</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Conversion Rate: {internConversionRate}%</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tracks Offered</span>
              <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{hrms.interns?.trackBreakdown?.length || 4}</h3>
              <p className="text-xs text-slate-500 mt-1">AI/ML, Full Stack, Cloud, HR</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tracks distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <GraduationCap size={16} className="text-purple-600" />
                Internship Tracks Enrolled
              </h3>
              <div className="space-y-3 text-xs">
                {hrms.interns?.trackBreakdown?.map((t: any) => (
                  <div key={t.internship_type} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-800">{t.internship_type}</span>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-bold rounded-lg">
                      {t.count} candidates
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifecycle Conversion Flow */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <Award size={16} className="text-emerald-600" />
                Internship Lifecycle Status
              </h3>
              <div className="space-y-3 text-xs">
                {hrms.interns?.statusBreakdown?.map((s: any) => (
                  <div key={s.status} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-800">{s.status}</span>
                    <span className="font-bold text-slate-900">{s.count} interns</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: FINANCIAL STATEMENTS */}
      {/* ============================================================ */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Liquid Cash</span>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">₹{totalCash.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-1">Verified from bank accounts</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accounts Receivable</span>
              <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">₹{totalInvoicedValue.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-1">From active billing invoices</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Payroll Liability</span>
              <h3 className="text-2xl font-extrabold text-rose-600 mt-1">₹{totalMonthlyPayroll.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-1">Fixed human capital burn</p>
            </div>
          </div>

          {/* Bank Accounts Listing */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                Treasury & Corporate Bank Reserves
              </h3>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Bank Name</th>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4 text-right">Available Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {finance.bankAccounts?.map((b: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Landmark size={14} className="text-indigo-600" />
                      {b.bank_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{b.account_number}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-700 text-right">
                      ₹{parseFloat(b.balance || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 6: DETAILED DATA TABLES (EXPORT READY) */}
      {/* ============================================================ */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          {/* Sub Table Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex space-x-1 text-xs font-semibold">
              {[
                { id: 'employees', label: 'HRMS Department Cost' },
                { id: 'leads', label: 'CRM Sales Stages' },
                { id: 'invoices', label: 'Invoices & Aging' },
                { id: 'interns', label: 'Internship Tracks' },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveTableTab(sub.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTableTab === sub.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
            >
              <Download size={13} /> Export Active Table
            </Button>
          </div>

          {/* Active Table Rendering */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {activeTableTab === 'employees' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Headcount</th>
                    <th className="py-3 px-4">Monthly Cost</th>
                    <th className="py-3 px-4">Annual Cost</th>
                    <th className="py-3 px-4">Avg Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hrms.departmentBreakdown?.map((d: any) => (
                    <tr key={d.department} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.department}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{d.headcount}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">₹{parseFloat(d.monthly_cost).toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600">₹{(parseFloat(d.monthly_cost) * 12).toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600">₹{Math.round(parseFloat(d.avg_salary)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTableTab === 'leads' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Deal Stage</th>
                    <th className="py-3 px-4">Number of Deals</th>
                    <th className="py-3 px-4">Total Opportunity Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {crm.leadsByStage?.map((l: any) => (
                    <tr key={l.stage} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{l.stage}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{l.count}</td>
                      <td className="py-3 px-4 font-bold text-purple-700">₹{parseFloat(l.total_value || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTableTab === 'invoices' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Billing Status</th>
                    <th className="py-3 px-4">Invoice Count</th>
                    <th className="py-3 px-4">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {crm.invoices?.map((i: any) => (
                    <tr key={i.status} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{i.status}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{i.count}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">₹{parseFloat(i.total_amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTableTab === 'interns' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Internship Track</th>
                    <th className="py-3 px-4">Candidate Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hrms.interns?.trackBreakdown?.map((t: any) => (
                    <tr key={t.internship_type} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{t.internship_type}</td>
                      <td className="py-3 px-4 font-bold text-purple-700">{t.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
