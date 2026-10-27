import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Zap, Play, CheckCircle2, Shield, Cloud, 
  Smartphone, BarChart, Settings, Users, Target, Briefcase, 
  FileText, Landmark, ShoppingCart, Boxes, FolderKanban, 
  CheckSquare, Headphones, Folder, BarChart3, Star, ArrowRight,
  Globe, Database, Lock, Hexagon, Factory, ShoppingBag, Stethoscope, BookOpen, Video, HelpCircle, FileCode, Check, Building2, LogIn, Sun, Moon
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'login' | 'register' | 'careers') => void;
}

const TRUST_PARTNERS = [
  { 
    name: 'TechNova', 
    icon: Shield, 
    color: 'group-hover:text-blue-500', 
    bgHover: 'group-hover:bg-blue-500/10',
    borderHover: 'hover:border-blue-500/60 dark:hover:border-blue-400/60',
    floatClass: 'animate-float-1' 
  },
  { 
    name: 'NexGen', 
    icon: Zap, 
    color: 'group-hover:text-amber-500', 
    bgHover: 'group-hover:bg-amber-500/10',
    borderHover: 'hover:border-amber-500/60 dark:hover:border-amber-400/60',
    floatClass: 'animate-float-2' 
  },
  { 
    name: 'CloudWave', 
    icon: Cloud, 
    color: 'group-hover:text-cyan-500', 
    bgHover: 'group-hover:bg-cyan-500/10',
    borderHover: 'hover:border-cyan-500/60 dark:hover:border-cyan-400/60',
    floatClass: 'animate-float-3' 
  },
  { 
    name: 'Pinnacle', 
    icon: Target, 
    color: 'group-hover:text-purple-500', 
    bgHover: 'group-hover:bg-purple-500/10',
    borderHover: 'hover:border-purple-500/60 dark:hover:border-purple-400/60',
    floatClass: 'animate-float-4' 
  },
  { 
    name: 'Quantum', 
    icon: Globe, 
    color: 'group-hover:text-emerald-500', 
    bgHover: 'group-hover:bg-emerald-500/10',
    borderHover: 'hover:border-emerald-500/60 dark:hover:border-emerald-400/60',
    floatClass: 'animate-float-5' 
  },
  { 
    name: 'BrightPath', 
    icon: Star, 
    color: 'group-hover:text-rose-500', 
    bgHover: 'group-hover:bg-rose-500/10',
    borderHover: 'hover:border-rose-500/60 dark:hover:border-rose-400/60',
    floatClass: 'animate-float-6' 
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { theme, setTheme } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [activeSection, setActiveSection] = useState<string>('hero');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // Fixed navbar offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#090D16] text-slate-600 dark:text-slate-300 font-sans selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-200 overflow-x-hidden transition-colors duration-200">
      
      {/* Navbar - Responsive Dark/Light with Theme Toggle */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-[#090D16]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] dark:bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Hexagon size={18} className="fill-white/20" />
            </div>
            <span className="font-extrabold text-[#1e3a8a] dark:text-blue-400 tracking-tight text-xl uppercase">ERP SUITE</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-300">
            <button 
              onClick={() => scrollToSection('platform')} 
              className={`transition-colors cursor-pointer ${activeSection === 'platform' ? 'text-[#2563eb] dark:text-blue-400 font-extrabold' : 'hover:text-[#2563eb] dark:hover:text-blue-400'}`}
            >
              Platform
            </button>
            <button 
              onClick={() => scrollToSection('solutions')} 
              className={`transition-colors cursor-pointer ${activeSection === 'solutions' ? 'text-[#2563eb] dark:text-blue-400 font-extrabold' : 'hover:text-[#2563eb] dark:hover:text-blue-400'}`}
            >
              Solutions
            </button>
            <button 
              onClick={() => scrollToSection('customers')} 
              className={`transition-colors cursor-pointer ${activeSection === 'customers' ? 'text-[#2563eb] dark:text-blue-400 font-extrabold' : 'hover:text-[#2563eb] dark:hover:text-blue-400'}`}
            >
              Customers
            </button>
            <button 
              onClick={() => scrollToSection('pricing')} 
              className={`transition-colors cursor-pointer ${activeSection === 'pricing' ? 'text-[#2563eb] dark:text-blue-400 font-extrabold' : 'hover:text-[#2563eb] dark:hover:text-blue-400'}`}
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('resources')} 
              className={`transition-colors cursor-pointer ${activeSection === 'resources' ? 'text-[#2563eb] dark:text-blue-400 font-extrabold' : 'hover:text-[#2563eb] dark:hover:text-blue-400'}`}
            >
              Resources
            </button>
            <button 
              onClick={() => onNavigate('careers')} 
              className="text-slate-600 dark:text-slate-300 hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1 font-extrabold"
            >
              Careers <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full font-black border border-emerald-200 dark:border-emerald-800/60">Hiring</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button 
              onClick={() => onNavigate('login')} 
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold rounded-xl transition-all shadow-sm dark:shadow-none border border-transparent dark:border-blue-500/30 cursor-pointer flex items-center gap-2"
            >
              <LogIn size={16} /> Login
            </button>
            <button 
              onClick={() => onNavigate('register')} 
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-extrabold rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer hidden sm:block"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-20 lg:pt-36 lg:pb-24 bg-gradient-to-br from-[#f8faff] via-white to-blue-50/50 dark:from-[#090D16] dark:via-[#0c1322] dark:to-[#0f172a] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left Content */}
            <div className="lg:w-[50%]">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 text-xs font-semibold text-[#1e3a8a] dark:text-slate-300 mb-6 shadow-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                New: Enterprise Release 2.0
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-extrabold text-[#0f172a] dark:text-white leading-[1.1] tracking-[-0.03em] mb-6">
                Affordable CRM & ERP for <span className="text-[#2563eb] dark:text-blue-400">Growing Teams</span>
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 leading-relaxed max-w-lg font-medium">
                Unify your Sales, HRMS, Accounts, Inventory, and Projects in one platform. Stop overpaying for software and start scaling today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button 
                  onClick={() => onNavigate('login')} 
                  className="px-8 py-4 bg-blue-600 text-white font-extrabold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm dark:shadow-none border border-transparent dark:border-blue-500/30 transform hover:-translate-y-0.5 text-lg cursor-pointer"
                >
                  <LogIn size={20} /> Login
                </button>
                <button 
                  onClick={() => onNavigate('register')} 
                  className="px-8 py-4 bg-white dark:bg-slate-800 text-[#1e3a8a] dark:text-white font-extrabold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 shadow-sm dark:shadow-none transform hover:-translate-y-0.5 text-lg cursor-pointer"
                >
                  Start Free Trial <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => scrollToSection('platform')} 
                  className="px-6 py-4 text-slate-600 dark:text-slate-300 font-extrabold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
                >
                  <Play size={18} className="text-[#2563eb] dark:text-blue-400" /> Watch Demo
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-700 dark:text-slate-300 font-bold">
                <div className="flex items-center gap-2"><CheckCircle2 size={20} className="text-[#2563eb] dark:text-blue-400" /> No Credit Card Required</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={20} className="text-[#2563eb] dark:text-blue-400" /> Setup in 5 Minutes</div>
              </div>
            </div>
            
            {/* Right Content - Embedded Video Mockup */}
            <div className="lg:w-[50%] w-full relative">
              <div className="relative z-10 w-full rounded-2xl shadow-xl dark:shadow-none overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transform lg:scale-105">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="ml-4 text-xs font-bold text-[#1e3a8a] dark:text-blue-300">Business Presentation</div>
                </div>
                
                <div className="relative h-[400px] bg-slate-900">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/background-video.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* TRUST BADGES - FLOATING LOGO CARDS */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c111d] py-12 relative overflow-hidden transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest mb-8">
            Trusted by industry leaders globally
          </p>
          
          {/* Floating Infinite Stream with Soft Edge Gradients */}
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] py-2">
            <div className="animate-marquee-glide flex items-center gap-6 py-2">
              {[...TRUST_PARTNERS, ...TRUST_PARTNERS, ...TRUST_PARTNERS].map((partner, idx) => {
                const IconComponent = partner.icon;
                return (
                  <div
                    key={idx}
                    className={`${partner.floatClass} group flex items-center gap-3.5 px-6 py-3 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-xl dark:hover:shadow-black/60 ${partner.borderHover} hover:bg-white dark:hover:bg-slate-800/90 transition-all duration-300 cursor-pointer shrink-0 transform hover:-translate-y-2.5`}
                  >
                    <div className={`p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 ${partner.bgHover} transition-colors duration-300`}>
                      <IconComponent size={20} className={`text-slate-400 dark:text-slate-500 ${partner.color} group-hover:scale-115 transition-all duration-300`} />
                    </div>
                    <span className="font-extrabold text-base tracking-tight text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300">
                      {partner.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-20">
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: Boxes, val: '25+', label: 'Modules' },
              { icon: Database, val: '99.99%', label: 'Uptime' },
              { icon: Users, val: '500+', label: 'Clients' },
              { icon: Headphones, val: '24/7', label: 'Support' },
              { icon: Lock, val: 'SOC 2', label: 'Security' },
              { icon: Smartphone, val: 'Native', label: 'Mobile' },
            ].map((s, idx) => (
              <div 
                key={idx} 
                className="group bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2 transition-all duration-300 ease-out cursor-pointer"
              >
                <s.icon size={28} className="text-[#1e3a8a] dark:text-blue-400 mb-4 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-all duration-300"/>
                <div className="font-extrabold text-slate-900 dark:text-white text-xl tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{s.val}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
         </div>
      </section>

      {/* 1. PLATFORM SECTION */}
      <section id="platform" className="bg-slate-50 dark:bg-[#090D16] border-y border-slate-200 dark:border-slate-800 py-24 scroll-mt-20 transition-colors duration-200">
         <div className="max-w-7xl mx-auto px-6">
           <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
             <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold mb-3 uppercase tracking-wider">
                 Unified Platform Engine
               </div>
               <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-[-0.03em]">A unified platform for every department.</h2>
               <p className="text-slate-600 dark:text-slate-300 max-w-2xl text-lg font-medium">Seamlessly integrated modules designed to eliminate data silos and streamline your operations.</p>
             </div>
             <button onClick={() => onNavigate('register')} className="mt-6 md:mt-0 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#1e3a8a] dark:text-white text-sm font-extrabold rounded-xl flex items-center gap-2 transition-colors border-2 border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer">
               Explore All Capabilities <ArrowRight size={16}/>
             </button>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {[
                { icon: Target, name: 'CRM', desc: 'Lead management, pipelines & sales forecasting.' },
                { icon: BarChart, name: 'Sales', desc: 'Quotations, orders, invoicing & collections.' },
                { icon: Users, name: 'HRMS', desc: 'Employee directory, attendance & leave tracking.' },
                { icon: Landmark, name: 'Payroll', desc: 'Salary processing, tax compliance & payslips.' },
                { icon: Briefcase, name: 'Finance', desc: 'General ledger, P&L, balance sheets & audit.' },
                { icon: Boxes, name: 'Inventory', desc: 'Multi-warehouse stock, batches & tracking.' },
                { icon: ShoppingCart, name: 'Procurement', desc: 'Purchase orders, GRN, and vendor management.' },
                { icon: FolderKanban, name: 'Projects', desc: 'Resource planning, milestones & profitability.' },
                { icon: CheckSquare, name: 'Tasks', desc: 'Kanban boards, deadlines & team collaboration.' },
                { icon: Headphones, name: 'Helpdesk', desc: 'Support ticketing, SLA tracking & knowledge base.' },
                { icon: Landmark, name: 'Banking', desc: 'Account reconciliation & transaction matching.' },
                { icon: FileText, name: 'Expenses', desc: 'Employee claims, approvals & reimbursements.' },
                { icon: Folder, name: 'Documents', desc: 'Centralized, secure file management & sharing.' },
                { icon: BarChart3, name: 'Analytics', desc: 'Custom reporting, dashboards & business intelligence.' },
                { icon: Zap, name: 'Automation', desc: 'Custom workflows, smart rules & event triggers.' },
              ].map((m, i) => (
                <div 
                  key={i} 
                  className="group bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2 transition-all duration-300 ease-out cursor-pointer"
                >
                   <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-[#1e3a8a] dark:text-blue-400 mb-5 group-hover:scale-110 group-hover:bg-[#2563eb] group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                     <m.icon size={22} />
                   </div>
                   <h3 className="text-slate-900 dark:text-white font-extrabold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{m.name}</h3>
                   <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{m.desc}</p>
                </div>
              ))}
           </div>
         </div>
      </section>

      {/* 2. SOLUTIONS SECTION */}
      <section id="solutions" className="py-24 bg-white dark:bg-[#0c111d] border-b border-slate-200 dark:border-slate-800 scroll-mt-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold mb-3 uppercase tracking-wider">
              Industry Tailored Solutions
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-[-0.03em]">Tailored Solutions for Every Industry</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">Pre-configured workflows and compliance packages built specifically for your sector.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-white dark:hover:bg-slate-800/90 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2.5 transition-all duration-300 ease-out cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-sm dark:shadow-none group-hover:scale-110 transition-transform duration-300">
                <Factory size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Manufacturing & Production</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium mb-6">Automate Multi-Level BOMs, work orders, shop floor execution, and quality control checks with real-time IoT integration.</p>
              <ul className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400"/> Shop Floor Control</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400"/> Batch & Serial Tracking</li>
              </ul>
            </div>

            <div className="group bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-white dark:hover:bg-slate-800/90 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2.5 transition-all duration-300 ease-out cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-sm dark:shadow-none group-hover:scale-110 transition-transform duration-300">
                <ShoppingBag size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">Retail & E-commerce</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium mb-6">Omnichannel POS synchronization, central inventory management, customer loyalty programs, and automated fulfillment.</p>
              <ul className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400"/> Real-time POS Sync</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400"/> Multi-Store Inventory</li>
              </ul>
            </div>

            <div className="group bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-white dark:hover:bg-slate-800/90 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2.5 transition-all duration-300 ease-out cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-6 shadow-sm dark:shadow-none group-hover:scale-110 transition-transform duration-300">
                <Building2 size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">Professional Services</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium mb-6">Project profitability analytics, timesheets, milestone billing, resource capacity planning, and automated invoicing.</p>
              <ul className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-600 dark:text-purple-400"/> Project Billing & P&L</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-600 dark:text-purple-400"/> Automated Timesheets</li>
              </ul>
            </div>

            <div className="group bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-white dark:hover:bg-slate-800/90 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2.5 transition-all duration-300 ease-out cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-sm dark:shadow-none group-hover:scale-110 transition-transform duration-300">
                <Stethoscope size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">Healthcare & Lifesciences</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium mb-6">Compliant document management, medical asset maintenance, staff scheduling, and HIPAA-compliant audit logs.</p>
              <ul className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400"/> Audit Trail & Logs</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400"/> Asset Maintenance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CUSTOMERS SECTION */}
      <section id="customers" className="py-24 bg-slate-50 dark:bg-[#090D16] border-b border-slate-200 dark:border-slate-800 scroll-mt-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-16">
            <div className="lg:w-1/3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold mb-3 uppercase tracking-wider">
                Customer Success
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-[-0.03em]">Proven business impact for 500+ enterprises</h2>
              <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 leading-relaxed font-medium">Organizations that migrate to ERP Suite experience measurable improvements in operational efficiency and cost reduction within the first two quarters.</p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold"><CheckCircle2 size={22} className="text-[#2563eb] dark:text-blue-400"/> Accelerated financial close</li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold"><CheckCircle2 size={22} className="text-[#2563eb] dark:text-blue-400"/> Reduced inventory holding costs</li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold"><CheckCircle2 size={22} className="text-[#2563eb] dark:text-blue-400"/> Improved employee retention</li>
              </ul>
            </div>
            
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="bg-[#1e3a8a] dark:bg-[#172554] rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl border border-transparent hover:border-blue-300/50 transform hover:-translate-y-2.5 hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} size={18} className="fill-amber-400"/>)}
                  </div>
                  <p className="text-blue-100 italic text-sm mb-6 leading-relaxed">
                    "Migrating to ERP Suite unified our Sales, HRMS, and Payroll into one dashboard. We saved 40+ hours monthly on reconciliation and reduced IT overhead by 35%."
                  </p>
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base">Sarah Lin</h4>
                  <p className="text-blue-300 text-xs font-medium">VP of Operations, TechNova Global</p>
                </div>
              </div>

              <div className="bg-[#2563eb] dark:bg-[#1d4ed8] rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl border border-transparent hover:border-blue-200/50 transform hover:-translate-y-2.5 hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer">
                <div>
                  <div className="flex items-center gap-1 text-amber-300 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} size={18} className="fill-amber-300"/>)}
                  </div>
                  <p className="text-blue-100 italic text-sm mb-6 leading-relaxed">
                    "The single-source-of-truth PostgreSQL engine is rock solid. Our team checked in via ESS, attendance regularizations approved instantly, and payroll ran in seconds."
                  </p>
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base">Marcus Vance</h4>
                  <p className="text-blue-200 text-xs font-medium">Chief Technology Officer, CloudWave</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING SECTION */}
      <section id="pricing" className="py-24 bg-white dark:bg-[#0c111d] border-b border-slate-200 dark:border-slate-800 scroll-mt-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold mb-3 uppercase tracking-wider">
              Flexible & Transparent Pricing
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-[-0.03em]">Simple, Predictable Plans for Growing Teams</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">No hidden fees, no per-module surcharges. Change plans or cancel anytime.</p>

            {/* Monthly / Yearly Toggle */}
            <div className="mt-8 inline-flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setBillingCycle('monthly')} 
                className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Monthly Billing
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')} 
                className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Yearly Billing <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Starter Plan */}
            <div className="group bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-400 hover:bg-white dark:hover:bg-slate-800/90 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2.5 transition-all duration-300 ease-out cursor-pointer">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Starter</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">Ideal for small teams getting started.</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">${billingCycle === 'yearly' ? '24' : '29'}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-bold"> / month per organization</span>
                </div>
                <ul className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600 dark:text-blue-400"/> Up to 15 Active Employees</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600 dark:text-blue-400"/> Core CRM & Lead Pipeline</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600 dark:text-blue-400"/> Attendance & ESS Employee Portal</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600 dark:text-blue-400"/> Standard Email Support</li>
                </ul>
              </div>
              <button onClick={() => onNavigate('register')} className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-blue-600 text-[#1e3a8a] dark:text-white font-extrabold rounded-xl transition-colors text-sm cursor-pointer">
                Start Free Trial
              </button>
            </div>

            {/* Growth Plan (Popular) */}
            <div className="bg-[#1e3a8a] dark:bg-gradient-to-b dark:from-[#172554] dark:to-[#1e3a8a] text-white rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative border-2 border-blue-400 hover:border-blue-300 transform lg:-translate-y-2 hover:-translate-y-4 hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-blue-300 shadow-xs">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white mb-1">Growth</h3>
                <p className="text-xs text-blue-200 font-medium mb-6">Complete HRMS, CRM, and Payroll for scaling teams.</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">${billingCycle === 'yearly' ? '64' : '79'}</span>
                  <span className="text-blue-200 text-xs font-bold"> / month per organization</span>
                </div>
                <ul className="space-y-3 text-xs font-semibold text-blue-100 mb-8 border-t border-blue-800/80 pt-6">
                  <li className="flex items-center gap-2"><Check size={16} className="text-amber-400"/> Up to 100 Active Employees</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-amber-400"/> Full CRM, HRMS, Payroll & Accounts</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-amber-400"/> Automatic Statutory Tax Calculations</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-amber-400"/> 24/7 Priority Support</li>
                </ul>
              </div>
              <button onClick={() => onNavigate('register')} className="w-full py-3 bg-[#2563eb] hover:bg-blue-600 text-white font-extrabold rounded-xl transition-colors shadow-sm dark:shadow-none text-sm cursor-pointer">
                Get Started Now
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="group bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-blue-500 dark:hover:border-blue-400 hover:bg-white dark:hover:bg-slate-800/90 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2.5 transition-all duration-300 ease-out cursor-pointer">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Enterprise</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">Unlimited users, custom SLA, & dedicated support.</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">${billingCycle === 'yearly' ? '159' : '199'}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-bold"> / month per organization</span>
                </div>
                <ul className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600 dark:text-blue-400"/> Unlimited Employees & Users</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600 dark:text-blue-400"/> All 25+ ERP Suite Modules</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600 dark:text-blue-400"/> Custom API & Database Integrations</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600 dark:text-blue-400"/> Dedicated Technical Account Manager</li>
                </ul>
              </div>
              <button onClick={() => onNavigate('register')} className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-blue-600 text-[#1e3a8a] dark:text-white font-extrabold rounded-xl transition-colors text-sm cursor-pointer">
                Contact Enterprise Sales
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 5. RESOURCES SECTION */}
      <section id="resources" className="py-24 bg-slate-50 dark:bg-[#090D16] border-b border-slate-200 dark:border-slate-800 scroll-mt-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold mb-3 uppercase tracking-wider">
              Resource Center
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-[-0.03em]">Documentation, Tutorials & Guides</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">Explore everything you need to configure, deploy, and master ERP Suite.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="group bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2.5 transition-all duration-300 ease-out cursor-pointer shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <FileCode size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">API Documentation</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-4">Complete REST & GraphQL endpoint reference for custom integrations.</p>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform duration-300">Read API Docs <ArrowRight size={14}/></span>
            </div>

            <div className="group bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2.5 transition-all duration-300 ease-out cursor-pointer shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Video size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">Video Walkthroughs</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-4">Step-by-step video tutorials on setting up HRMS, Payroll, and CRM.</p>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform duration-300">Watch Videos <ArrowRight size={14}/></span>
            </div>

            <div className="group bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2.5 transition-all duration-300 ease-out cursor-pointer shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <BookOpen size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">Knowledge Base</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-4">Comprehensive guides, compliance best practices, and FAQs.</p>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform duration-300">Browse Knowledge Base <ArrowRight size={14}/></span>
            </div>

            <div className="group bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 hover:shadow-xl dark:hover:shadow-black/50 transform hover:-translate-y-2.5 transition-all duration-300 ease-out cursor-pointer shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">Helpdesk & Support</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-4">Contact our 24/7 technical support team or request custom setup help.</p>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform duration-300">Contact Support <ArrowRight size={14}/></span>
            </div>

          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] dark:from-[#172554] dark:to-[#1d4ed8] rounded-3xl p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between shadow-xl dark:shadow-none relative overflow-hidden">
           <div className="mb-10 lg:mb-0 text-center lg:text-left relative z-10">
             <h2 className="text-4xl font-extrabold text-white mb-4 tracking-[-0.03em]">Ready to modernize your operations?</h2>
             <p className="text-blue-200 text-xl font-medium">Connect with our enterprise architecture team today.</p>
           </div>
           <div className="flex flex-col sm:flex-row gap-4 relative z-10">
             <button onClick={() => onNavigate('register')} className="px-8 py-4 bg-[#2563eb] dark:bg-blue-600 text-white font-extrabold rounded-xl hover:bg-blue-700 transition-colors shadow-sm dark:shadow-none text-lg cursor-pointer">
               Start 14-Day Free Trial
             </button>
             <button onClick={() => scrollToSection('resources')} className="px-8 py-4 bg-transparent border-2 border-blue-300 dark:border-blue-400 text-white font-extrabold rounded-xl hover:bg-blue-800/40 transition-colors text-lg cursor-pointer">
               Contact Sales
             </button>
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D16] pt-20 pb-10 transition-colors duration-200">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => scrollToSection('hero')}>
                <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] dark:bg-blue-600 flex items-center justify-center text-white">
                  <Hexagon size={18} className="fill-white/20" />
                </div>
                <span className="font-extrabold text-[#1e3a8a] dark:text-blue-400 tracking-tight text-xl uppercase">ERP SUITE</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-xs font-medium">
                The complete operating system for modern enterprises. Unify, automate, and scale with confidence.
              </p>
              <div className="flex gap-6">
                <div className="text-slate-500 hover:text-[#2563eb] dark:hover:text-blue-400 cursor-pointer transition-colors text-sm font-extrabold">LinkedIn</div>
                <div className="text-slate-500 hover:text-[#2563eb] dark:hover:text-blue-400 cursor-pointer transition-colors text-sm font-extrabold">Twitter</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-[#1e3a8a] dark:text-blue-400 font-extrabold mb-6 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-bold">
                <li><button onClick={() => scrollToSection('platform')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">Platform Overview</button></li>
                <li><button onClick={() => scrollToSection('platform')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">Modules Directory</button></li>
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">Security & Trust</button></li>
                <li><button onClick={() => scrollToSection('resources')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">API Documentation</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[#1e3a8a] dark:text-blue-400 font-extrabold mb-6 text-sm uppercase tracking-wider">Solutions</h4>
              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-bold">
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">Manufacturing</button></li>
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">Retail & E-commerce</button></li>
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">Professional Services</button></li>
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">Healthcare</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[#1e3a8a] dark:text-blue-400 font-extrabold mb-6 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-bold">
                <li><button onClick={() => scrollToSection('customers')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">About Us</button></li>
                <li><button onClick={() => onNavigate('register')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">Careers</button></li>
                <li><button onClick={() => onNavigate('register')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">Contact Sales</button></li>
                <li><button onClick={() => scrollToSection('resources')} className="hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer">Support Portal</button></li>
              </ul>
            </div>
         </div>
         
         <div className="max-w-7xl mx-auto px-6 border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-bold">
           <div>&copy; 2025 ERP Suite Inc. All rights reserved.</div>
           <div className="flex gap-6 mt-4 md:mt-0">
             <a href="#" className="hover:text-[#1e3a8a] dark:hover:text-blue-400 transition-colors">Terms of Service</a>
             <a href="#" className="hover:text-[#1e3a8a] dark:hover:text-blue-400 transition-colors">Privacy Policy</a>
           </div>
         </div>
      </footer>
    </div>
  );
};
