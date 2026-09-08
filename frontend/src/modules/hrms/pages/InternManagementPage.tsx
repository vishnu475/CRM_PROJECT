import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Plus, Search, Filter, Phone, Mail, Building, Briefcase,
  LayoutGrid, List, BarChart2, CheckCircle2, RefreshCw, Award, Calendar,
  DollarSign, User, ShieldCheck, ArrowRight, UserCheck, Clock, Users, BookOpen
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export interface InternRecord {
  id: string;
  intern_id: string;
  intern_code: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  profile_photo?: string;
  avatar?: string;
  college?: string;
  degree?: string;
  branch_specialization?: string;
  branch?: string;
  graduation_year?: string;
  roll_number?: string;
  cgpa_percentage?: string;
  resume_url?: string;
  internship_type: string;
  department: string;
  designation: string;
  start_date: string;
  end_date: string;
  duration?: string;
  work_mode?: string;
  location?: string;
  stipend?: number;
  reporting_manager_id?: string;
  reporting_manager_name?: string;
  mentor_id?: string;
  mentor_name?: string;
  status: 'Upcoming' | 'Onboarding' | 'Active' | 'Completed' | 'Converted' | 'Terminated';
  company_email?: string;
  system_access?: boolean;
  attendance_access?: boolean;
  assigned_device?: string;
  id_card_issued?: boolean;
  converted_employee_id?: string;
  conversion_date?: string;
  completed_tasks_count?: number;
  total_tasks_count?: number;
  evaluation_recommendation?: string;
}

interface InternManagementPageProps {
  onAddIntern: () => void;
  onSelectIntern: (internId: string) => void;
  onNavigateToEmployee?: (empId: string) => void;
}

export const InternManagementPage: React.FC<InternManagementPageProps> = ({
  onAddIntern,
  onSelectIntern,
  onNavigateToEmployee
}) => {
  const [interns, setInterns] = useState<InternRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Main Tabs: [ Intern Directory & Master ] [ Intern Dashboard & Analytics ] [ Intern Mentors & Projects ]
  const [mainTab, setMainTab] = useState<'directory' | 'dashboard' | 'mentors'>('directory');

  // Status Filter: [ All ] [ Upcoming ] [ Onboarding ] [ Active ] [ Completed ] [ Converted ] [ Terminated ]
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedMentor, setSelectedMentor] = useState('All');
  const [selectedDuration, setSelectedDuration] = useState('All');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Fetch Interns from PostgreSQL
  const fetchInterns = useCallback(async () => {
    try {
      const res = await fetch('/api/interns');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setInterns(data.data);
      }
    } catch (err) {
      console.error('Error loading interns:', err);
    }
  }, []);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchInterns();
    setIsRefreshing(false);
    setRefreshMessage('PostgreSQL Intern Master Data Refreshed!');
    setTimeout(() => setRefreshMessage(null), 3000);
  };

  // Extract unique departments, types, mentors, durations for filters
  const departmentsList = Array.from(new Set(interns.map(i => i.department).filter(Boolean)));
  const typesList = Array.from(new Set(interns.map(i => i.internship_type).filter(Boolean)));
  const mentorsList = Array.from(new Set(interns.map(i => i.mentor_name).filter(Boolean)));
  const durationsList = Array.from(new Set(interns.map(i => i.duration).filter(Boolean)));

  // Filter interns
  const filteredInterns = interns.filter(intern => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      (intern.name && intern.name.toLowerCase().includes(term)) ||
      (intern.id && intern.id.toLowerCase().includes(term)) ||
      (intern.intern_code && intern.intern_code.toLowerCase().includes(term)) ||
      (intern.intern_id && intern.intern_id.toLowerCase().includes(term)) ||
      (intern.college && intern.college.toLowerCase().includes(term)) ||
      (intern.designation && intern.designation.toLowerCase().includes(term));

    const matchesStatus = selectedStatus === 'All' || intern.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesDept = selectedDept === 'All' || intern.department === selectedDept;
    const matchesType = selectedType === 'All' || intern.internship_type === selectedType;
    const matchesMentor = selectedMentor === 'All' || intern.mentor_name === selectedMentor;
    const matchesDuration = selectedDuration === 'All' || intern.duration === selectedDuration;

    return matchesSearch && matchesStatus && matchesDept && matchesType && matchesMentor && matchesDuration;
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Active': return <Badge variant="success">Active</Badge>;
      case 'Onboarding': return <Badge variant="info">Onboarding</Badge>;
      case 'Upcoming': return <Badge variant="neutral">Upcoming</Badge>;
      case 'Completed': return <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-200">Completed</span>;
      case 'Converted': return <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-full border border-purple-200">🎓 Converted</span>;
      case 'Terminated': return <Badge variant="danger">Terminated</Badge>;
      default: return <Badge variant="neutral">{st}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="text-purple-600" size={24} />
            HRMS Intern Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central intern management, onboarding, attendance, mentorship, evaluation, and internship lifecycle management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {refreshMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold animate-pulse">
              <CheckCircle2 size={14} /> {refreshMessage}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold text-xs"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-purple-600 mr-1.5' : 'text-purple-600 mr-1.5'} />
            {isRefreshing ? 'Refreshing DB...' : 'Refresh DB Data'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onAddIntern}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} /> + Add Intern
          </Button>
        </div>
      </div>

      {/* Main Tabs: Directory, Dashboard, Mentors */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setMainTab('directory')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'directory' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GraduationCap size={14} /> Intern Directory & Master
        </button>
        <button
          onClick={() => setMainTab('dashboard')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'dashboard' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart2 size={14} /> Intern Dashboard & Analytics
        </button>
        <button
          onClick={() => setMainTab('mentors')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'mentors' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={14} /> Intern Mentors & Projects
        </button>
      </div>

      {/* TAB CONTENT: 1. INTERN DIRECTORY & MASTER */}
      {mainTab === 'directory' && (
        <div className="space-y-4">
          {/* Status Pills: [ All ] [ Upcoming ] [ Onboarding ] [ Active ] [ Completed ] [ Converted ] [ Terminated ] */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Intern Lifecycle:</span>
            {['All', 'Upcoming', 'Onboarding', 'Active', 'Completed', 'Converted', 'Terminated'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedStatus === st
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st}
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedStatus === st ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {st === 'All' ? interns.length : interns.filter(i => i.status.toLowerCase() === st.toLowerCase()).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Multi-Filters Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search by intern name, intern ID, college, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Department */}
              <div className="flex items-center gap-1">
                <Filter size={13} className="text-slate-400" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="All">All Departments</option>
                  {departmentsList.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>

              {/* Internship Type */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="All">All Internship Types</option>
                {typesList.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              {/* Mentor */}
              <select
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="All">All Mentors</option>
                {mentorsList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              {/* Duration */}
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="All">All Durations</option>
                {durationsList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Card / Table Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-auto lg:ml-0">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-1.5 rounded-md text-xs font-semibold ${viewMode === 'card' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}
                  title="Card Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md text-xs font-semibold ${viewMode === 'table' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}
                  title="Table View"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Intern Records - Card Grid View */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInterns.map((intern) => (
                <div
                  key={intern.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all hover:border-purple-300 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-sm shadow-xs">
                          {intern.name.charAt(0)}
                        </div>
                        <div>
                          <h3
                            onClick={() => onSelectIntern(intern.id)}
                            className="font-bold text-slate-900 text-sm hover:text-purple-600 cursor-pointer transition-colors"
                          >
                            {intern.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {intern.intern_code || intern.intern_id || intern.id}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(intern.status)}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Briefcase size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{intern.designation}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building size={13} className="text-slate-400 shrink-0" />
                        <span>{intern.department} • <strong className="text-purple-700">{intern.internship_type}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{intern.college || 'Engineering College'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span>Mentor: <strong className="text-slate-900">{intern.mentor_name || 'Assigned Mentor'}</strong></span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">STIPEND</span>
                        <span className="font-bold text-emerald-700">₹{Number(intern.stipend || 0).toLocaleString()} / mo</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">DURATION</span>
                        <span className="font-bold text-slate-800">{intern.duration || '6 Months'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onSelectIntern(intern.id)}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
                    >
                      <span>View Profile</span>
                      <ArrowRight size={13} />
                    </button>

                    {intern.status === 'Converted' && intern.converted_employee_id && onNavigateToEmployee ? (
                      <button
                        onClick={() => onNavigateToEmployee(intern.converted_employee_id!)}
                        className="text-[11px] font-bold text-emerald-700 hover:underline"
                      >
                        EMP: {intern.converted_employee_id}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {intern.start_date}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Intern Records - List / Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Intern ID & Name</th>
                    <th className="py-3 px-4">Role & Track</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4">Mentor</th>
                    <th className="py-3 px-4">Duration & Dates</th>
                    <th className="py-3 px-4">Stipend</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInterns.map((intern) => (
                    <tr key={intern.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                            {intern.name.charAt(0)}
                          </div>
                          <div>
                            <p
                              onClick={() => onSelectIntern(intern.id)}
                              className="font-bold text-slate-900 hover:text-purple-600 cursor-pointer"
                            >
                              {intern.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{intern.intern_code || intern.intern_id || intern.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{intern.designation}</p>
                        <p className="text-[10px] text-purple-600 font-bold">{intern.internship_type}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{intern.department}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">{intern.college || 'NIT'}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{intern.mentor_name || 'Sarah Jenkins'}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        <span className="font-bold text-slate-700 block">{intern.duration || '6 Months'}</span>
                        {intern.start_date} to {intern.end_date}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">₹{Number(intern.stipend || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">{getStatusBadge(intern.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectIntern(intern.id)}
                          className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
                        >
                          View Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredInterns.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <GraduationCap className="mx-auto text-slate-300" size={40} />
              <h3 className="font-bold text-slate-700 text-sm">No Interns Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No intern records match the selected status pill and filters. Click "+ Add Intern" to onboard a new candidate.
              </p>
              <Button variant="primary" size="sm" onClick={onAddIntern} className="bg-purple-600 text-white text-xs">
                <Plus size={14} /> + Add Intern
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2. INTERN DASHBOARD & ANALYTICS */}
      {mainTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Headcount</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{interns.length}</h3>
              <p className="text-[11px] text-purple-600 mt-1">Across all departments</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Interns</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                {interns.filter(i => i.status === 'Active').length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Currently pursuing internship</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Completed / Ready</p>
              <h3 className="text-2xl font-extrabold text-blue-600 mt-1">
                {interns.filter(i => i.status === 'Completed').length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Eligible for certification</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Converted to Full-Time</p>
              <h3 className="text-2xl font-extrabold text-purple-700 mt-1">
                {interns.filter(i => i.status === 'Converted').length}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% Retained in HRMS</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Internship Distribution by Track</h3>
              <div className="space-y-2 text-xs">
                {typesList.map(type => {
                  const count = interns.filter(i => i.internship_type === type).length;
                  const percent = Math.round((count / (interns.length || 1)) * 100);
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-700">{type}</span>
                        <span className="text-slate-500">{count} interns ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Department Allocation</h3>
              <div className="space-y-2 text-xs">
                {departmentsList.map(dept => {
                  const count = interns.filter(i => i.department === dept).length;
                  const percent = Math.round((count / (interns.length || 1)) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-700">{dept}</span>
                        <span className="text-slate-500">{count} interns ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. INTERN MENTORS & PROJECTS */}
      {mainTab === 'mentors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mentorsList.filter((m): m is string => Boolean(m)).map(mentorName => {
              const assignedInterns = interns.filter(i => i.mentor_name === mentorName);
              return (
                <div key={mentorName} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center">
                      {mentorName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{mentorName}</h4>
                      <p className="text-xs text-slate-400">
                        Assigned Mentor {assignedInterns[0]?.mentor_id ? `(${assignedInterns[0]?.mentor_id})` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <p className="text-slate-600 font-semibold">Mentees ({assignedInterns.length}):</p>
                    <ul className="list-disc pl-4 text-slate-800 space-y-0.5">
                      {assignedInterns.map(i => (
                        <li key={i.id} className="cursor-pointer hover:text-purple-600 font-medium" onClick={() => onSelectIntern(i.id)}>
                          <span>{i.name}</span>
                          <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1 py-0.2 rounded ml-1.5 font-bold">
                            {i.intern_code || i.intern_id || i.id}
                          </span>
                          <span className="text-slate-400 ml-1">({i.internship_type})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
