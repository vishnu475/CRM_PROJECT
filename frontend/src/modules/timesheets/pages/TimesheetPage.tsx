import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  History,
  BarChart3,
  FileCheck,
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AssignTimesheetView } from '../components/AssignTimesheetView';
import { MyTimesheetView } from '../components/MyTimesheetView';
import { EmployeeTimesheetsAdminView } from '../components/EmployeeTimesheetsAdminView';
import { TimesheetHistoryView } from '../components/TimesheetHistoryView';
import { TimesheetReportsView } from '../components/TimesheetReportsView';

export const TimesheetPage: React.FC = () => {
  const { userRole, userProfile } = useApp();

  const isEmployeeRole = userRole === 'Employee';

  // Available tabs
  // ADMIN: Dashboard, Assign Timesheet, Employee Timesheets, History, Reports
  // EMPLOYEE: My Timesheet, My History
  const [activeTab, setActiveTab] = useState<string>(() => {
    return isEmployeeRole ? 'my-timesheet' : 'employee-timesheets';
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-2 border border-blue-100 dark:border-blue-900">
            <Clock className="w-3.5 h-3.5" />
            <span>Standalone Enterprise Timesheet Module</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Timesheet Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Dedicated standalone timesheet engine with daily work entry logging, automatic time calculations,
            PDF evidence verification, and structured admin approvals.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700">
          {/* Admin Tabs */}
          {!isEmployeeRole && (
            <>
              <button
                onClick={() => setActiveTab('employee-timesheets')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'employee-timesheets'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <FileCheck size={14} />
                <span>Employee Timesheets</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <History size={14} />
                <span>History</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 size={14} />
                <span>Reports</span>
              </button>

              {/* Quick toggle to Employee view for Admin review testing */}
              <button
                onClick={() => setActiveTab('my-timesheet')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-dashed ${
                  activeTab === 'my-timesheet'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'border-slate-300 dark:border-slate-600 text-slate-500 hover:text-blue-600'
                }`}
                title="Preview Employee Timesheet UI"
              >
                <Clock size={13} />
                <span>My Timesheet (ESS)</span>
              </button>
            </>
          )}

          {/* Employee Tabs */}
          {isEmployeeRole && (
            <>
              <button
                onClick={() => setActiveTab('my-timesheet')}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'my-timesheet'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Clock size={14} />
                <span>My Timesheet</span>
              </button>

              <button
                onClick={() => setActiveTab('my-history')}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'my-history'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <History size={14} />
                <span>My History</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Tab View Rendering */}
      <div>
        {activeTab === 'employee-timesheets' && <EmployeeTimesheetsAdminView />}
        {activeTab === 'assign' && (
          <AssignTimesheetView onAssignedSuccess={() => setActiveTab('employee-timesheets')} />
        )}
        {activeTab === 'my-timesheet' && (
          <MyTimesheetView onNavigateToHistory={() => setActiveTab(isEmployeeRole ? 'my-history' : 'history')} />
        )}
        {activeTab === 'history' && <TimesheetHistoryView isAdmin={true} />}
        {activeTab === 'my-history' && <TimesheetHistoryView isAdmin={false} />}
        {activeTab === 'reports' && <TimesheetReportsView />}
      </div>
    </div>
  );
};
