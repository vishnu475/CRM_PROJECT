import React from 'react';
import {
  Zap, Play, CheckCircle2, Shield, Cloud, 
  Smartphone, BarChart, Settings, Users, Target, Briefcase, 
  FileText, Landmark, ShoppingCart, Boxes, FolderKanban, 
  CheckSquare, Headphones, Folder, BarChart3, Star, ArrowRight,
  Globe, Database, Lock, Hexagon
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* Navbar - Clean White with Blue Accent */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center text-white shadow-sm">
              <Hexagon size={18} className="fill-white/20" />
            </div>
            <span className="font-extrabold text-[#1e3a8a] tracking-tight text-xl uppercase">ERP SUITE</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#" className="hover:text-[#2563eb] transition-colors">Platform</a>
            <a href="#" className="hover:text-[#2563eb] transition-colors">Solutions</a>
            <a href="#" className="hover:text-[#2563eb] transition-colors">Customers</a>
            <a href="#" className="hover:text-[#2563eb] transition-colors">Pricing</a>
            <a href="#" className="hover:text-[#2563eb] transition-colors">Resources</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('login')} className="text-sm font-bold text-slate-700 hover:text-[#2563eb] transition-colors">
              Sign In
            </button>
            <button onClick={() => onNavigate('register')} className="px-6 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-blue-600/30">
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-32 lg:pb-16 bg-gradient-to-br from-[#f8faff] via-white to-blue-50/50">
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
                <button onClick={() => onNavigate('register')} className="px-8 py-4 bg-[#2563eb] text-white font-extrabold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transform hover:-translate-y-0.5 text-lg">
                  Start Free Trial <ArrowRight size={20} />
                </button>
                <button className="px-8 py-4 bg-white text-[#1e3a8a] font-extrabold rounded-xl hover:bg-slate-50 transition-all border-2 border-slate-200 flex items-center justify-center gap-2 shadow-sm transform hover:-translate-y-0.5 text-lg">
                  <Play size={20} className="text-[#2563eb]" /> Watch Demo
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

      {/* ALL IN ONE MODULES */}
      <section className="bg-slate-50 border-y border-slate-200 py-24">
         <div className="max-w-7xl mx-auto px-6">
           <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
             <div>
               <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.03em]">A unified platform for every department.</h2>
               <p className="text-slate-600 max-w-2xl text-lg font-medium">Seamlessly integrated modules designed to eliminate data silos and streamline your operations.</p>
             </div>
             <button className="mt-6 md:mt-0 px-6 py-3 bg-white hover:bg-slate-100 text-[#1e3a8a] text-sm font-extrabold rounded-xl flex items-center gap-2 transition-colors border-2 border-slate-200 shadow-sm">
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

      {/* WHY BUSINESSES LOVE */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.03em]">Enterprise-grade architecture</h2>
            <p className="text-slate-600 text-lg font-medium">Built from the ground up for security, scale, and reliability.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-50 border border-slate-200 shadow-sm p-8 rounded-3xl hover:border-blue-300 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-blue-100 border border-blue-200 text-[#1e3a8a] flex items-center justify-center mb-6"><Boxes size={26}/></div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Unified Data Model</h3>
              <p className="text-slate-600 leading-relaxed font-medium">A single, centralized database ensures real-time consistency across all departments without manual syncing.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 shadow-sm p-8 rounded-3xl hover:border-blue-300 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-blue-100 border border-blue-200 text-[#1e3a8a] flex items-center justify-center mb-6"><BarChart3 size={26}/></div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Advanced Analytics</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Drill down into operational metrics with live dashboards powered by an embedded BI engine.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 shadow-sm p-8 rounded-3xl hover:border-blue-300 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-blue-100 border border-blue-200 text-[#1e3a8a] flex items-center justify-center mb-6"><Shield size={26}/></div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Zero-Trust Security</h3>
              <p className="text-slate-600 leading-relaxed font-medium">Granular RBAC, AES-256 encryption at rest, and comprehensive, immutable audit logging.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 shadow-sm p-8 rounded-3xl hover:border-blue-300 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-blue-100 border border-blue-200 text-[#1e3a8a] flex items-center justify-center mb-6"><Settings size={26}/></div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Extensible APIs</h3>
              <p className="text-slate-600 leading-relaxed font-medium">REST and GraphQL APIs allow seamless integration with your existing legacy systems and external tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* REAL IMPACT */}
      <section className="bg-slate-50 border-y border-slate-200 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
             <div className="lg:w-1/3">
               <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-[-0.03em]">Proven business impact</h2>
               <p className="text-slate-600 text-lg mb-8 leading-relaxed font-medium">Organizations that migrate to ERP Suite experience measurable improvements in operational efficiency and cost reduction within the first two quarters.</p>
               <ul className="space-y-4 mb-10">
                 <li className="flex items-center gap-3 text-slate-700 font-bold"><CheckCircle2 size={22} className="text-[#2563eb]"/> Accelerated financial close</li>
                 <li className="flex items-center gap-3 text-slate-700 font-bold"><CheckCircle2 size={22} className="text-[#2563eb]"/> Reduced inventory holding costs</li>
                 <li className="flex items-center gap-3 text-slate-700 font-bold"><CheckCircle2 size={22} className="text-[#2563eb]"/> Improved employee retention</li>
               </ul>
               <button onClick={() => onNavigate('register')} className="text-[#2563eb] font-extrabold flex items-center gap-2 hover:text-blue-700 transition-colors">
                 Read our case studies <ArrowRight size={18}/>
               </button>
             </div>
             
             <div className="lg:w-2/3 grid grid-cols-2 gap-6 w-full">
               <div className="bg-[#1e3a8a] rounded-3xl p-10 flex flex-col justify-center shadow-lg">
                 <div className="text-5xl font-extrabold text-white mb-3">35%</div>
                 <div className="text-blue-200 font-bold uppercase tracking-wide text-sm">Reduction in IT Overhead</div>
               </div>
               <div className="bg-[#2563eb] rounded-3xl p-10 flex flex-col justify-center shadow-lg">
                 <div className="text-5xl font-extrabold text-white mb-3">2.5x</div>
                 <div className="text-blue-100 font-bold uppercase tracking-wide text-sm">Faster Order Fulfillment</div>
               </div>
               <div className="bg-white border border-slate-200 rounded-3xl p-10 flex flex-col justify-center shadow-sm">
                 <div className="text-5xl font-extrabold text-slate-900 mb-3">99%</div>
                 <div className="text-slate-500 font-bold uppercase tracking-wide text-sm">Data Accuracy & Compliance</div>
               </div>
               <div className="bg-white border border-slate-200 rounded-3xl p-10 flex flex-col justify-center shadow-sm">
                 <div className="text-5xl font-extrabold text-slate-900 mb-3">40 hrs</div>
                 <div className="text-slate-500 font-bold uppercase tracking-wide text-sm">Saved monthly on recon</div>
               </div>
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
             <button onClick={() => onNavigate('register')} className="px-8 py-4 bg-[#2563eb] text-white font-extrabold rounded-xl hover:bg-blue-600 transition-colors shadow-xl shadow-blue-600/30 text-lg">
               Start 14-Day Free Trial
             </button>
             <button className="px-8 py-4 bg-transparent border-2 border-blue-400 text-white font-extrabold rounded-xl hover:bg-blue-800 transition-colors text-lg">
               Contact Sales
             </button>
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white pt-20 pb-10">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
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
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">Platform Overview</a></li>
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">Modules Directory</a></li>
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">Security & Trust</a></li>
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">API Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[#1e3a8a] font-extrabold mb-6 text-sm uppercase tracking-wider">Solutions</h4>
              <ul className="space-y-4 text-sm text-slate-600 font-bold">
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">Manufacturing</a></li>
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">Retail & E-commerce</a></li>
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">Professional Services</a></li>
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">Healthcare</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[#1e3a8a] font-extrabold mb-6 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-4 text-sm text-slate-600 font-bold">
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">Contact Sales</a></li>
                <li><a href="#" className="hover:text-[#2563eb] transition-colors">Support Portal</a></li>
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
