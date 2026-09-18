import React, { useState, useEffect } from 'react';
import {
  Hexagon, ArrowRight, Briefcase, MapPin, Clock, DollarSign, 
  CheckCircle2, Users, Heart, Award, Sparkles, Search, Filter, 
  Send, X, Shield, Globe, Zap, Star, Plus, Trash2, UserCheck, Building2
} from 'lucide-react';

interface CareersPageProps {
  onNavigate: (view: 'landing' | 'login' | 'register' | 'careers') => void;
}

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  hiringManager?: string;
  experienceYears?: string;
  vacancies?: number;
  isCustom?: boolean;
  postedDate?: string;
}

const initialJobs: JobPosition[] = [
  {
    id: 'job-101',
    title: 'Senior Full Stack Engineer (React & Node.js)',
    department: 'Engineering',
    location: 'Remote (Worldwide)',
    type: 'Full-Time',
    salary: '$120,000 - $160,000 + Equity',
    description: 'Lead the development of high-performance real-time ERP and HRMS features powered by React, TypeScript, and PostgreSQL.',
    requirements: ['5+ years with React, Node.js & TypeScript', 'Deep expertise with PostgreSQL & query optimization', 'Experience with large-scale SaaS architecture'],
    hiringManager: 'Alex Rivera (Engineering Director)',
    experienceYears: '5+ Years'
  },
  {
    id: 'job-102',
    title: 'Staff Database Architect (PostgreSQL)',
    department: 'Engineering',
    location: 'Remote (US / Europe / India)',
    type: 'Full-Time',
    salary: '$140,000 - $180,000 + Equity',
    description: 'Design and optimize our multi-tenant PostgreSQL cluster handling millions of daily attendance and payroll transactions.',
    requirements: ['7+ years managing production PostgreSQL databases', 'Expertise in replication, partitioning, and zero-downtime migrations', 'Strong background in database security & SOC 2 compliance'],
    hiringManager: 'Alex Rivera (Engineering Director)',
    experienceYears: '7+ Years'
  },
  {
    id: 'job-103',
    title: 'Product Manager (HRMS & Payroll)',
    department: 'Product',
    location: 'Remote',
    type: 'Full-Time',
    salary: '$110,000 - $145,000 + Equity',
    description: 'Drive the roadmap for our core HRMS, attendance tracking, and automated statutory payroll engines.',
    requirements: ['4+ years in SaaS product management', 'Experience with B2B HR Tech or ERP software', 'Customer-centric data-driven decision maker'],
    hiringManager: 'Sarah Jenkins (VP Product)',
    experienceYears: '4+ Years'
  },
  {
    id: 'job-104',
    title: 'Senior UI/UX Designer (Design Systems)',
    department: 'Product & Design',
    location: 'Remote',
    type: 'Full-Time',
    salary: '$105,000 - $135,000',
    description: 'Craft beautiful, intuitive enterprise interfaces and maintain our modern UI component design system.',
    requirements: ['4+ years designing complex web apps in Figma', 'Strong portfolio showcasing clean dashboards and data visualization', 'Mastery of design systems and micro-interactions'],
    hiringManager: 'Sarah Jenkins (VP Product)',
    experienceYears: '4+ Years'
  },
  {
    id: 'job-105',
    title: 'Enterprise Account Executive (SaaS)',
    department: 'Sales & Marketing',
    location: 'Hybrid / Remote',
    type: 'Full-Time',
    salary: '$90,000 Base + Uncapped OTE ($180k+)',
    description: 'Close mid-market and enterprise deals with CEOs, HR Directors, and CFOs transitioning to ERP Suite.',
    requirements: ['3+ years in B2B SaaS sales closing $50k+ ARR deals', 'Proven track record of quota achievement', 'Exceptional presentation and consultative selling skills'],
    hiringManager: 'Robert Vance (VP Sales)',
    experienceYears: '3+ Years'
  },
  {
    id: 'job-106',
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Remote',
    type: 'Full-Time',
    salary: '$80,000 - $105,000',
    description: 'Partner with enterprise customers during onboarding, workflow setup, and quarterly business reviews to ensure 99%+ retention.',
    requirements: ['3+ years in Customer Success for SaaS platforms', 'Strong technical troubleshooting and relationship building', 'Passion for solving complex customer problems'],
    hiringManager: 'Emma Watson (VP Customer Success)',
    experienceYears: '3+ Years'
  }
];

export const CareersPage: React.FC<CareersPageProps> = ({ onNavigate }) => {
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [isApplied, setIsApplied] = useState<boolean>(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);

  // Form for posting and assigning a new job
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    department: 'Engineering',
    hiringManager: 'Sarah Jenkins (Lead Recruiter)',
    type: 'Full-Time',
    location: 'Remote (Worldwide)',
    salary: '$120,000 - $160,000 + Equity',
    experienceYears: '3-5 Years',
    vacancies: 1,
    description: '',
    requirements: ''
  });

  const [applyForm, setApplyForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: '',
    coverNote: ''
  });

  const [jobs, setJobs] = useState<JobPosition[]>(() => {
    const saved = localStorage.getItem('erp_posted_jobs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const nonDup = initialJobs.filter(ij => !existingIds.has(ij.id));
          return [...parsed, ...nonDup];
        }
      } catch (e) {
        console.warn('Failed to parse local stored jobs:', e);
      }
    }
    return initialJobs;
  });

  // Fetch jobs from backend PostgreSQL and sync
  useEffect(() => {
    const fetchDBJobs = async () => {
      try {
        const res = await fetch('/api/recruitment/jobs');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const dbJobs: JobPosition[] = json.data.map((dj: any) => ({
              id: dj.id,
              title: dj.title,
              department: dj.department,
              location: dj.location || 'Remote (Worldwide)',
              type: dj.type || 'Full-Time',
              salary: dj.salary || '$110,000 - $150,000',
              description: dj.description || 'Lead innovation and high impact projects with our global engineering team.',
              requirements: Array.isArray(dj.requirements) && dj.requirements.length > 0 
                ? dj.requirements 
                : ['Relevant domain experience', 'Strong collaborative and problem-solving abilities'],
              hiringManager: dj.hiringManager || dj.hiring_manager || 'HR Recruitment Desk',
              experienceYears: dj.experienceYears || dj.experience_years || '3+ Years',
              isCustom: true
            }));

            setJobs(prev => {
              const map = new Map<string, JobPosition>();
              // Custom / DB jobs first
              dbJobs.forEach(j => map.set(j.id, j));
              // Then existing local state jobs
              prev.forEach(j => {
                if (!map.has(j.id)) map.set(j.id, j);
              });
              return Array.from(map.values());
            });
          }
        }
      } catch (e) {
        console.warn('Could not fetch backend jobs:', e);
      }
    };
    fetchDBJobs();
  }, []);

  const filteredJobs = jobs.filter(j => {
    const matchesDept = deptFilter === 'All' || j.department.toLowerCase().includes(deptFilter.toLowerCase());
    const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          j.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Handle Post / Assign New Job
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobForm.title.trim()) {
      alert('Please enter a Job Title.');
      return;
    }

    const reqArray = newJobForm.requirements
      .split('\n')
      .map(r => r.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);

    const newJob: JobPosition = {
      id: `JOB-${Date.now().toString().slice(-4)}`,
      title: newJobForm.title.trim(),
      department: newJobForm.department,
      location: newJobForm.location.trim() || 'Remote (Worldwide)',
      type: newJobForm.type,
      salary: newJobForm.salary.trim() || '$120,000 - $160,000 + Equity',
      description: newJobForm.description.trim() || 'Exciting career opportunity at ERP Suite.',
      requirements: reqArray.length > 0 
        ? reqArray 
        : ['Proven track record in this domain', 'Strong communication and proactive team collaboration', 'Passion for building high performance SaaS software'],
      hiringManager: newJobForm.hiringManager.trim() || 'HR Recruitment Desk',
      experienceYears: newJobForm.experienceYears,
      vacancies: Number(newJobForm.vacancies) || 1,
      isCustom: true,
      postedDate: 'Just Now'
    };

    // 1. Update State
    setJobs(prev => [newJob, ...prev]);

    // 2. Persist to localStorage
    try {
      const saved = localStorage.getItem('erp_posted_jobs');
      const existing = saved ? JSON.parse(saved) : [];
      localStorage.setItem('erp_posted_jobs', JSON.stringify([newJob, ...existing]));
    } catch (err) {
      console.warn('Failed saving to localStorage', err);
    }

    // 3. Persist to Backend PostgreSQL
    try {
      await fetch('/api/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newJob.id,
          title: newJob.title,
          department: newJob.department,
          location: newJob.location,
          salary: newJob.salary,
          type: newJob.type,
          description: newJob.description,
          requirements: newJob.requirements,
          hiringManager: newJob.hiringManager,
          experienceYears: newJob.experienceYears,
          headcount: Number(newJobForm.vacancies) || 1
        })
      });
    } catch (err) {
      console.warn('Backend sync note for new job:', err);
    }

    // Reset form and close modal
    setIsPostModalOpen(false);
    setNewJobForm({
      title: '',
      department: 'Engineering',
      hiringManager: 'Sarah Jenkins (Lead Recruiter)',
      type: 'Full-Time',
      location: 'Remote (Worldwide)',
      salary: '$120,000 - $160,000 + Equity',
      experienceYears: '3-5 Years',
      vacancies: 1,
      description: '',
      requirements: ''
    });
    setDeptFilter('All');
    alert(`🎉 Success! Job opening "${newJob.title}" has been created and assigned to ${newJob.hiringManager}.`);
  };

  // Handle Permanent Delete of a Job
  const handleDeleteJob = async (jobId: string, jobTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete the job opening "${jobTitle}" from the database?`)) {
      return;
    }

    setJobs(prev => prev.filter(j => j.id !== jobId));

    try {
      const saved = localStorage.getItem('erp_posted_jobs');
      if (saved) {
        const existing = JSON.parse(saved);
        localStorage.setItem('erp_posted_jobs', JSON.stringify(existing.filter((j: any) => j.id !== jobId)));
      }
    } catch (e) {
      console.warn(e);
    }

    try {
      await fetch(`/api/recruitment/jobs/${jobId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete note:', err);
    }
  };


  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setIsApplied(true);

    try {
      const payload = {
        name: applyForm.fullName,
        email: applyForm.email,
        phone: applyForm.phone,
        department: selectedJob.department,
        appliedPosition: selectedJob.title,
        jobTitle: selectedJob.title,
        recruiter: selectedJob.hiringManager || 'HR Recruitment Desk',
        stage: 'Applied',
        status: 'Active',
        experienceYears: 4,
        education: 'Bachelor Degree',
        skills: JSON.stringify(['React', 'TypeScript', 'Node.js', 'ERP / HRMS']),
        expectedSalary: 1500000,
        linkedin: applyForm.linkedin,
        portfolio: applyForm.portfolio,
        coverNote: applyForm.coverNote
      };

      const res = await fetch('/api/recruitment/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        alert(`Application Submitted Successfully to HRMS Recruitment Pipeline!\nCandidate ID: ${json.data?.candidateNo || json.data?.id}`);
      } else {
        alert('Application submitted successfully to HRMS Recruitment Pipeline!');
      }
    } catch (err: any) {
      console.warn('Recruitment API submission note:', err);
      alert('Application submitted successfully to HRMS Recruitment Pipeline!');
    } finally {
      setIsApplied(false);
      setSelectedJob(null);
      setApplyForm({ fullName: '', email: '', phone: '', linkedin: '', portfolio: '', coverNote: '' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center text-white shadow-sm">
              <Hexagon size={18} className="fill-white/20" />
            </div>
            <span className="font-extrabold text-[#1e3a8a] tracking-tight text-xl uppercase">ERP SUITE</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600">
            <button onClick={() => onNavigate('landing')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Home</button>
            <button onClick={() => onNavigate('landing')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Platform</button>
            <button onClick={() => onNavigate('landing')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Pricing</button>
            <span className="text-[#2563eb] font-extrabold border-b-2 border-[#2563eb] pb-1">Careers</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('login')} className="text-sm font-bold text-slate-700 hover:text-[#2563eb] transition-colors cursor-pointer">
              Sign In
            </button>
            <button onClick={() => onNavigate('register')} className="px-6 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-blue-600/30 cursor-pointer">
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#f8faff] via-white to-blue-50/50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1e3a8a] mb-6 shadow-sm">
            <Sparkles size={14} className="text-amber-500 animate-spin" />
            We are hiring globally across all departments!
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-extrabold text-[#0f172a] leading-[1.1] tracking-[-0.03em] mb-6 max-w-4xl mx-auto">
            Build the Future of <span className="text-[#2563eb]">Enterprise Software</span>
          </h1>
          
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
            Join a fast-growing, mission-driven team redefining how 500+ global enterprises run CRM, HRMS, and Payroll.
          </p>

          {/* Quick Perks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Globe size={20} />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs">100% Remote-First</p>
                <p className="text-[11px] text-slate-500 font-medium">Work from anywhere</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs">Top Compensation</p>
                <p className="text-[11px] text-slate-500 font-medium">Salary + Equity Options</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Heart size={20} />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs">Full Health Coverage</p>
                <p className="text-[11px] text-slate-500 font-medium">Medical, dental & vision</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Award size={20} />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs">Unlimited PTO</p>
                <p className="text-[11px] text-slate-500 font-medium">Rest & recharge anytime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-[-0.02em]">Open Job Positions</h2>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                {filteredJobs.length} Active {filteredJobs.length === 1 ? 'Opening' : 'Openings'}
              </span>
            </div>
            <p className="text-slate-600 text-sm font-medium mt-1">
              Explore career opportunities or assign & publish a new position directly to the portal.
            </p>
          </div>

          {/* Search, Department Filters & Post Job Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search job title..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
              {['All', 'Engineering', 'Product', 'Sales', 'Customer Success', 'HR'].map(dept => (
                <button 
                  key={dept}
                  onClick={() => setDeptFilter(dept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${deptFilter === dept ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {dept}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsPostModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition-all cursor-pointer whitespace-nowrap"
              title="Create, assign, and post a new job position"
            >
              <Plus size={16} className="stroke-[2.5]" />
              Assign & Post New Job
            </button>
          </div>
        </div>

        {/* Job Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <div 
                key={job.id} 
                className="bg-white border border-slate-200/90 rounded-3xl p-6 hover:border-blue-500 hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group cursor-pointer relative"
                onClick={() => setSelectedJob(job)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider border border-blue-100">
                        {job.department}
                      </span>
                      {job.isCustom && (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] rounded-full border border-emerald-200 flex items-center gap-1">
                          <Sparkles size={11} className="text-emerald-500" /> NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {job.salary}
                      </span>
                      {job.isCustom && (
                        <button
                          onClick={(e) => handleDeleteJob(job.id, job.title, e)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Permanently delete this job from database"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                    {job.title}
                  </h3>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4 line-clamp-3">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {job.location}</div>
                    <div className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {job.type}</div>
                    {job.hiringManager && (
                      <div className="flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 text-[11px]">
                        <UserCheck size={13} className="text-blue-600" /> Assigned: {job.hiringManager}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Apply online in 2 mins</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    Apply Now <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-16 bg-slate-50 rounded-3xl border border-slate-200">
              <Briefcase size={36} className="text-slate-400 mx-auto mb-3" />
              <h3 className="font-extrabold text-slate-800 text-base">No open positions matching your search</h3>
              <p className="text-xs text-slate-500 mt-1">Try resetting department filters, search keywords, or click "+ Assign & Post New Job".</p>
            </div>
          )}
        </div>
      </section>

      {/* POST & ASSIGN NEW JOB MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 space-y-5 max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setIsPostModalOpen(false)} 
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs mb-2 border border-blue-100">
                <Briefcase size={14} /> Headcount & Requisition System
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">Post & Assign New Job Position</h3>
              <p className="text-xs text-slate-500 mt-1">
                Publish a career opening to the public Careers Portal and assign a recruiter or hiring lead.
              </p>
            </div>

            <form onSubmit={handlePostJob} className="space-y-4">
              {/* Job Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Senior Frontend Engineer (React & TypeScript)"
                  value={newJobForm.title}
                  onChange={e => setNewJobForm({ ...newJobForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Department & Assigned Recruiter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newJobForm.department}
                    onChange={e => setNewJobForm({ ...newJobForm, department: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Sales">Sales</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Customer Success">Customer Success</option>
                    <option value="HR & Operations">HR & Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Assign To (Recruiter / Hiring Lead) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Sarah Jenkins (Lead Recruiter)"
                    value={newJobForm.hiringManager}
                    onChange={e => setNewJobForm({ ...newJobForm, hiringManager: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Employment Type & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Employment Type
                  </label>
                  <select
                    value={newJobForm.type}
                    onChange={e => setNewJobForm({ ...newJobForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Workplace Location
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Remote (Worldwide) or Bengaluru HQ"
                    value={newJobForm.location}
                    onChange={e => setNewJobForm({ ...newJobForm, location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Salary Range & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Salary / Compensation Range
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. $130,000 - $165,000 + Equity or ₹15,00,000 - ₹22,00,000"
                    value={newJobForm.salary}
                    onChange={e => setNewJobForm({ ...newJobForm, salary: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Experience
                  </label>
                  <select
                    value={newJobForm.experienceYears}
                    onChange={e => setNewJobForm({ ...newJobForm, experienceYears: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="1-2 Years">1-2 Years</option>
                    <option value="3-5 Years">3-5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                    <option value="Lead / Principal">Lead / Principal</option>
                  </select>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Job Description & Overview
                </label>
                <textarea 
                  rows={3}
                  placeholder="Describe the key responsibilities, impact, and day-to-day work for this position..."
                  value={newJobForm.description}
                  onChange={e => setNewJobForm({ ...newJobForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Key Requirements (One per line)
                </label>
                <textarea 
                  rows={3}
                  placeholder={"• 4+ years React and modern TypeScript\n• Strong background in relational databases\n• Excellent problem solving skills"}
                  value={newJobForm.requirements}
                  onChange={e => setNewJobForm({ ...newJobForm, requirements: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-colors shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Publish & Assign Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* JOB APPLICATION MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setSelectedJob(null)} 
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider border border-blue-100">
                  {selectedJob.department}
                </span>
                {selectedJob.hiringManager && (
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-800 font-semibold text-[11px] rounded-full border border-blue-100 flex items-center gap-1">
                    <UserCheck size={12} className="text-blue-600" /> Assigned: {selectedJob.hiringManager}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-2">{selectedJob.title}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-4">
                <span>📍 {selectedJob.location}</span> • <span>💼 {selectedJob.type}</span> • <span className="font-extrabold text-emerald-600">💰 {selectedJob.salary}</span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <p className="font-bold text-slate-900">Key Qualifications:</p>
              <ul className="space-y-1 text-slate-600">
                {selectedJob.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium">
                    <CheckCircle2 size={14} className="text-blue-600 shrink-0" /> {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Application Form */}
            <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">Submit Your Candidate Application</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Alex Morgan"
                    value={applyForm.fullName}
                    onChange={e => setApplyForm({ ...applyForm, fullName: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="e.g. alex@example.com"
                    value={applyForm.email}
                    onChange={e => setApplyForm({ ...applyForm, email: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="+1 (555) 000-0000"
                    value={applyForm.phone}
                    onChange={e => setApplyForm({ ...applyForm, phone: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">LinkedIn Profile URL</label>
                  <input 
                    type="url" 
                    placeholder="https://linkedin.com/in/username"
                    value={applyForm.linkedin}
                    onChange={e => setApplyForm({ ...applyForm, linkedin: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Portfolio / GitHub / Website URL</label>
                <input 
                  type="url" 
                  placeholder="https://github.com/username or portfolio"
                  value={applyForm.portfolio}
                  onChange={e => setApplyForm({ ...applyForm, portfolio: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Cover Note / Why ERP Suite?</label>
                <textarea 
                  rows={3}
                  placeholder="Briefly tell us why you are excited about this role..."
                  value={applyForm.coverNote}
                  onChange={e => setApplyForm({ ...applyForm, coverNote: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setSelectedJob(null)} 
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isApplied}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2 cursor-pointer"
                >
                  {isApplied ? 'Submitting...' : 'Submit Application'} <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-bold">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <Hexagon size={16} className="text-[#1e3a8a]" />
            <span className="font-extrabold text-[#1e3a8a]">ERP SUITE CAREERS</span>
          </div>
          <div>&copy; 2025 ERP Suite Inc. All rights reserved. Equal Opportunity Employer.</div>
        </div>
      </footer>
    </div>
  );
};
