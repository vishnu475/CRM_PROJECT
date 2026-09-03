import React, { useState } from 'react';
import {
  Zap, Play, CheckCircle2, Shield, Cloud, 
  Smartphone, BarChart, Settings, Users, Target, Briefcase, 
  FileText, Landmark, ShoppingCart, Boxes, FolderKanban, 
  CheckSquare, Headphones, Folder, BarChart3, Star, ArrowRight,
  Globe, Database, Lock, Hexagon, Factory, ShoppingBag, Stethoscope, BookOpen, Video, HelpCircle, FileCode, Check, Building2, LogIn
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'login' | 'register' | 'careers') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [activeSection, setActiveSection] = useState<string>('hero');

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
    <div className="min-h-screen bg-white text-slate-600 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* Navbar - Clean White with Blue Accent */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center text-white shadow-sm">
              <Hexagon size={18} className="fill-white/20" />
            </div>
            <span className="font-extrabold text-[#1e3a8a] tracking-tight text-xl uppercase">ERP SUITE</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600">
            <button 
              onClick={() => scrollToSection('platform')} 
              className={`transition-colors cursor-pointer ${activeSection === 'platform' ? 'text-[#2563eb] font-extrabold' : 'hover:text-[#2563eb]'}`}
            >
              Platform
            </button>
            <button 
              onClick={() => scrollToSection('solutions')} 
              className={`transition-colors cursor-pointer ${activeSection === 'solutions' ? 'text-[#2563eb] font-extrabold' : 'hover:text-[#2563eb]'}`}
            >
              Solutions
            </button>
            <button 
              onClick={() => scrollToSection('customers')} 
              className={`transition-colors cursor-pointer ${activeSection === 'customers' ? 'text-[#2563eb] font-extrabold' : 'hover:text-[#2563eb]'}`}
            >
              Customers
            </button>
            <button 
              onClick={() => scrollToSection('pricing')} 
              className={`transition-colors cursor-pointer ${activeSection === 'pricing' ? 'text-[#2563eb] font-extrabold' : 'hover:text-[#2563eb]'}`}
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('resources')} 
              className={`transition-colors cursor-pointer ${activeSection === 'resources' ? 'text-[#2563eb] font-extrabold' : 'hover:text-[#2563eb]'}`}
            >
              Resources
            </button>
            <button 
              onClick={() => onNavigate('careers')} 
              className="text-slate-600 hover:text-[#2563eb] transition-colors cursor-pointer flex items-center gap-1 font-extrabold"
            >
              Careers <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-black">Hiring</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('login')} 
              className="px-6 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white text-sm font-extrabold rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer flex items-center gap-2"
            >
              <LogIn size={16} /> Login
            </button>
            <button 
              onClick={() => onNavigate('register')} 
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-extrabold rounded-xl transition-all border border-slate-200 cursor-pointer hidden sm:block"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-20 lg:pt-32 lg:pb-16 bg-gradient-to-br from-[#f8faff] via-white to-blue-50/50">
        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left Content - Deep Navy Text */}
            <div className="lg:w-[50%]">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#1e3a8a] mb-6 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse"></div>
                New: Enterprise Release 2.0
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-extrabold text-[#0f172a] leading-[1.1] tracking-[-0.03em] mb-6">
                Affordable CRM & ERP for <span className="text-[#2563eb]">Growing Teams</span>
              </h1>
              
              <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-lg font-medium">
                Unify your Sales, HRMS, Accounts, Inventory, and Projects in one platform. Stop overpaying for software and start scaling today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button 
                  onClick={() => onNavigate('login')} 
                  className="px-8 py-4 bg-[#2563eb] text-white font-extrabold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transform hover:-translate-y-0.5 text-lg cursor-pointer"
                >
                  <LogIn size={20} /> Login
                </button>
                <button 
                  onClick={() => onNavigate('register')} 
                  className="px-8 py-4 bg-white text-[#1e3a8a] font-extrabold rounded-xl hover:bg-slate-50 transition-all border-2 border-slate-200 flex items-center justify-center gap-2 shadow-sm transform hover:-translate-y-0.5 text-lg cursor-pointer"
                >
                  Start Free Trial <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => scrollToSection('platform')} 
                  className="px-6 py-4 text-slate-600 font-extrabold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
                >
                  <Play size={18} className="text-[#2563eb]" /> Watch Demo
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-700 font-bold">
                <div className="flex items-center gap-2"><CheckCircle2 size={20} className="text-[#2563eb]" /> No Credit Card Required</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={20} className="text-[#2563eb]" /> Setup in 5 Minutes</div>
              </div>
            </div>
            
            {/* Right Content - Embedded Video Mockup */}
            <div className="lg:w-[50%] w-full relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/50 rounded-full blur-3xl z-0 pointer-events-none"></div>
              
              <div className="relative z-10 w-full rounded-2xl shadow-2xl overflow-hidden border border-slate-200 bg-white transform lg:scale-105">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="ml-4 text-xs font-bold text-[#1e3a8a]">Business Presentation</div>
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

      {/* TRUST BADGES */}
      <section className="border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-center text-xs text-slate-500 font-extrabold uppercase tracking-widest mb-8">Trusted by industry leaders globally</p>
          <div className="flex flex-wrap justify-center lg:justify-between items-center gap-8 text-slate-400 opacity-80">
             <div className="flex items-center gap-2 font-extrabold text-xl"><Shield size={22}/> TechNova</div>
             <div className="flex items-center gap-2 font-extrabold text-xl"><Zap size={22}/> NexGen</div>
             <div className="flex items-center gap-2 font-extrabold text-xl"><Cloud size={22}/> CloudWave</div>
             <div className="flex items-center gap-2 font-extrabold text-xl"><Target size={22}/> Pinnacle</div>
             <div className="flex items-center gap-2 font-extrabold text-xl"><Globe size={22}/> Quantum</div>
             <div className="flex items-center gap-2 font-extrabold text-xl"><Star size={22}/> BrightPath</div>
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-20">
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-300 transition-colors">
              <Boxes size={28} className="text-[#1e3a8a] mb-4"/>
              <div className="font-extrabold text-slate-900 text-xl">25+</div>
              <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">Modules</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-300 transition-colors">
              <Database size={28} className="text-[#1e3a8a] mb-4"/>
              <div className="font-extrabold text-slate-900 text-xl">99.99%</div>
              <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">Uptime</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-300 transition-colors">
              <Users size={28} className="text-[#1e3a8a] mb-4"/>
              <div className="font-extrabold text-slate-900 text-xl">500+</div>
              <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">Clients</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-300 transition-colors">
              <Headphones size={28} className="text-[#1e3a8a] mb-4"/>
              <div className="font-extrabold text-slate-900 text-xl">24/7</div>
              <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">Support</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-300 transition-colors">
              <Lock size={28} className="text-[#1e3a8a] mb-4"/>
              <div className="font-extrabold text-slate-900 text-xl">SOC 2</div>
              <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">Security</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-300 transition-colors">
              <Smartphone size={28} className="text-[#1e3a8a] mb-4"/>
              <div className="font-extrabold text-slate-900 text-xl">Native</div>
              <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">Mobile</div>
            </div>
         </div>
      </section>

      {/* 1. PLATFORM SECTION */}
      <section id="platform" className="bg-slate-50 border-y border-slate-200 py-24 scroll-mt-20">
         <div className="max-w-7xl mx-auto px-6">
           <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
             <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3 uppercase tracking-wider">
                 Unified Platform Engine
               </div>
               <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.03em]">A unified platform for every department.</h2>
               <p className="text-slate-600 max-w-2xl text-lg font-medium">Seamlessly integrated modules designed to eliminate data silos and streamline your operations.</p>
             </div>
             <button onClick={() => onNavigate('register')} className="mt-6 md:mt-0 px-6 py-3 bg-white hover:bg-slate-100 text-[#1e3a8a] text-sm font-extrabold rounded-xl flex items-center gap-2 transition-colors border-2 border-slate-200 shadow-sm cursor-pointer">
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
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-100 transition-all group cursor-pointer shadow-sm">
                   <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1e3a8a] mb-5 group-hover:bg-[#2563eb] group-hover:text-white group-hover:border-blue-600 transition-colors">
                     <m.icon size={22} />
                   </div>
                   <h3 className="text-slate-900 font-extrabold mb-2">{m.name}</h3>
                   <p className="text-sm text-slate-600 leading-relaxed font-medium">{m.desc}</p>
                </div>
              ))}
           </div>
         </div>
      </section>

      {/* 2. SOLUTIONS SECTION */}
      <section id="solutions" className="py-24 bg-white border-b border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3 uppercase tracking-wider">
              Industry Tailored Solutions
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.03em]">Tailored Solutions for Every Industry</h2>
            <p className="text-slate-600 text-lg font-medium">Pre-configured workflows and compliance packages built specifically for your sector.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-50 border border-slate-200 shadow-sm p-8 rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-md shadow-blue-500/20">
                <Factory size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Manufacturing & Production</h3>
              <p className="text-slate-600 leading-relaxed text-sm font-medium mb-6">Automate Multi-Level BOMs, work orders, shop floor execution, and quality control checks with real-time IoT integration.</p>
              <ul className="space-y-2 text-xs font-bold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-600"/> Shop Floor Control</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-600"/> Batch & Serial Tracking</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 shadow-sm p-8 rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-md shadow-indigo-500/20">
                <ShoppingBag size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Retail & E-commerce</h3>
              <p className="text-slate-600 leading-relaxed text-sm font-medium mb-6">Omnichannel POS synchronization, central inventory management, customer loyalty programs, and automated fulfillment.</p>
              <ul className="space-y-2 text-xs font-bold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-600"/> Real-time POS Sync</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-600"/> Multi-Store Inventory</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 shadow-sm p-8 rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-6 shadow-md shadow-purple-500/20">
                <Building2 size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Professional Services</h3>
              <p className="text-slate-600 leading-relaxed text-sm font-medium mb-6">Project profitability analytics, timesheets, milestone billing, resource capacity planning, and automated invoicing.</p>
              <ul className="space-y-2 text-xs font-bold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-600"/> Project Billing & P&L</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-600"/> Automated Timesheets</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 shadow-sm p-8 rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-md shadow-emerald-500/20">
                <Stethoscope size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Healthcare & Lifesciences</h3>
              <p className="text-slate-600 leading-relaxed text-sm font-medium mb-6">Compliant document management, medical asset maintenance, staff scheduling, and HIPAA-compliant audit logs.</p>
              <ul className="space-y-2 text-xs font-bold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600"/> Audit Trail & Logs</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600"/> Asset Maintenance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CUSTOMERS SECTION */}
      <section id="customers" className="py-24 bg-slate-50 border-b border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-16">
            <div className="lg:w-1/3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3 uppercase tracking-wider">
                Customer Success
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-[-0.03em]">Proven business impact for 500+ enterprises</h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed font-medium">Organizations that migrate to ERP Suite experience measurable improvements in operational efficiency and cost reduction within the first two quarters.</p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-slate-700 font-bold"><CheckCircle2 size={22} className="text-[#2563eb]"/> Accelerated financial close</li>
                <li className="flex items-center gap-3 text-slate-700 font-bold"><CheckCircle2 size={22} className="text-[#2563eb]"/> Reduced inventory holding costs</li>
                <li className="flex items-center gap-3 text-slate-700 font-bold"><CheckCircle2 size={22} className="text-[#2563eb]"/> Improved employee retention</li>
              </ul>
            </div>
            
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="bg-[#1e3a8a] rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl">
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

              <div className="bg-[#2563eb] rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl">
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
      <section id="pricing" className="py-24 bg-white border-b border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3 uppercase tracking-wider">
              Flexible & Transparent Pricing
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.03em]">Simple, Predictable Plans for Growing Teams</h2>
            <p className="text-slate-600 text-lg font-medium">No hidden fees, no per-module surcharges. Change plans or cancel anytime.</p>

            {/* Monthly / Yearly Toggle */}
            <div className="mt-8 inline-flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button 
                onClick={() => setBillingCycle('monthly')} 
                className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Monthly Billing
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')} 
                className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Yearly Billing <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Starter Plan */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col justify-between hover:border-blue-300 transition-all shadow-sm">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">Starter</h3>
                <p className="text-xs text-slate-500 font-medium mb-6">Ideal for small teams getting started.</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900">${billingCycle === 'yearly' ? '24' : '29'}</span>
                  <span className="text-slate-500 text-xs font-bold"> / month per organization</span>
                </div>
                <ul className="space-y-3 text-xs font-semibold text-slate-700 mb-8 border-t border-slate-200 pt-6">
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600"/> Up to 15 Active Employees</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600"/> Core CRM & Lead Pipeline</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600"/> Attendance & ESS Employee Portal</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600"/> Standard Email Support</li>
                </ul>
              </div>
              <button onClick={() => onNavigate('register')} className="w-full py-3 bg-white border-2 border-slate-300 hover:border-blue-600 text-[#1e3a8a] font-extrabold rounded-xl transition-colors text-sm cursor-pointer">
                Start Free Trial
              </button>
            </div>

            {/* Growth Plan (Popular) */}
            <div className="bg-[#1e3a8a] text-white rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative border-2 border-blue-400 transform lg:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-blue-300 shadow-sm">
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
              <button onClick={() => onNavigate('register')} className="w-full py-3 bg-[#2563eb] hover:bg-blue-600 text-white font-extrabold rounded-xl transition-colors shadow-lg shadow-blue-500/30 text-sm cursor-pointer">
                Get Started Now
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col justify-between hover:border-blue-300 transition-all shadow-sm">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">Enterprise</h3>
                <p className="text-xs text-slate-500 font-medium mb-6">Unlimited users, custom SLA, & dedicated support.</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900">${billingCycle === 'yearly' ? '159' : '199'}</span>
                  <span className="text-slate-500 text-xs font-bold"> / month per organization</span>
                </div>
                <ul className="space-y-3 text-xs font-semibold text-slate-700 mb-8 border-t border-slate-200 pt-6">
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600"/> Unlimited Employees & Users</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600"/> All 25+ ERP Suite Modules</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600"/> Custom API & Database Integrations</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-blue-600"/> Dedicated Technical Account Manager</li>
                </ul>
              </div>
              <button onClick={() => onNavigate('register')} className="w-full py-3 bg-white border-2 border-slate-300 hover:border-blue-600 text-[#1e3a8a] font-extrabold rounded-xl transition-colors text-sm cursor-pointer">
                Contact Enterprise Sales
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 5. RESOURCES SECTION */}
      <section id="resources" className="py-24 bg-slate-50 border-b border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3 uppercase tracking-wider">
              Resource Center
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.03em]">Documentation, Tutorials & Guides</h2>
            <p className="text-slate-600 text-lg font-medium">Explore everything you need to configure, deploy, and master ERP Suite.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileCode size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">API Documentation</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">Complete REST & GraphQL endpoint reference for custom integrations.</p>
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Read API Docs <ArrowRight size={14}/></span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Video size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Video Walkthroughs</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">Step-by-step video tutorials on setting up HRMS, Payroll, and CRM.</p>
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Watch Videos <ArrowRight size={14}/></span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Knowledge Base</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">Comprehensive guides, compliance best practices, and FAQs.</p>
              <span className="text-xs font-bold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Browse Knowledge Base <ArrowRight size={14}/></span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Helpdesk & Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">Contact our 24/7 technical support team or request custom setup help.</p>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Contact Support <ArrowRight size={14}/></span>
            </div>

          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-[#1e3a8a] rounded-3xl p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
           <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-blue-500/30 blur-3xl rounded-full pointer-events-none"></div>
           
           <div className="mb-10 lg:mb-0 text-center lg:text-left relative z-10">
             <h2 className="text-4xl font-extrabold text-white mb-4 tracking-[-0.03em]">Ready to modernize your operations?</h2>
             <p className="text-blue-200 text-xl font-medium">Connect with our enterprise architecture team today.</p>
           </div>
           <div className="flex flex-col sm:flex-row gap-4 relative z-10">
             <button onClick={() => onNavigate('register')} className="px-8 py-4 bg-[#2563eb] text-white font-extrabold rounded-xl hover:bg-blue-600 transition-colors shadow-xl shadow-blue-600/30 text-lg cursor-pointer">
               Start 14-Day Free Trial
             </button>
             <button onClick={() => scrollToSection('resources')} className="px-8 py-4 bg-transparent border-2 border-blue-400 text-white font-extrabold rounded-xl hover:bg-blue-800 transition-colors text-lg cursor-pointer">
               Contact Sales
             </button>
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white pt-20 pb-10">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => scrollToSection('hero')}>
                <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center text-white">
                  <Hexagon size={18} className="fill-white/20" />
                </div>
                <span className="font-extrabold text-[#1e3a8a] tracking-tight text-xl uppercase">ERP SUITE</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-xs font-medium">
                The complete operating system for modern enterprises. Unify, automate, and scale with confidence.
              </p>
              <div className="flex gap-6">
                <div className="text-slate-500 hover:text-[#2563eb] cursor-pointer transition-colors text-sm font-extrabold">LinkedIn</div>
                <div className="text-slate-500 hover:text-[#2563eb] cursor-pointer transition-colors text-sm font-extrabold">Twitter</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-[#1e3a8a] font-extrabold mb-6 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-4 text-sm text-slate-600 font-bold">
                <li><button onClick={() => scrollToSection('platform')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Platform Overview</button></li>
                <li><button onClick={() => scrollToSection('platform')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Modules Directory</button></li>
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Security & Trust</button></li>
                <li><button onClick={() => scrollToSection('resources')} className="hover:text-[#2563eb] transition-colors cursor-pointer">API Documentation</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[#1e3a8a] font-extrabold mb-6 text-sm uppercase tracking-wider">Solutions</h4>
              <ul className="space-y-4 text-sm text-slate-600 font-bold">
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Manufacturing</button></li>
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Retail & E-commerce</button></li>
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Professional Services</button></li>
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Healthcare</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[#1e3a8a] font-extrabold mb-6 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-4 text-sm text-slate-600 font-bold">
                <li><button onClick={() => scrollToSection('customers')} className="hover:text-[#2563eb] transition-colors cursor-pointer">About Us</button></li>
                <li><button onClick={() => onNavigate('register')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Careers</button></li>
                <li><button onClick={() => onNavigate('register')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Contact Sales</button></li>
                <li><button onClick={() => scrollToSection('resources')} className="hover:text-[#2563eb] transition-colors cursor-pointer">Support Portal</button></li>
              </ul>
            </div>
         </div>
         
         <div className="max-w-7xl mx-auto px-6 border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-bold">
           <div>&copy; 2025 ERP Suite Inc. All rights reserved.</div>
           <div className="flex gap-6 mt-4 md:mt-0">
             <a href="#" className="hover:text-[#1e3a8a] transition-colors">Terms of Service</a>
             <a href="#" className="hover:text-[#1e3a8a] transition-colors">Privacy Policy</a>
           </div>
         </div>
      </footer>
    </div>
  );
};
