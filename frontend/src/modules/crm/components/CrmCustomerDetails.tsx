import React, { useState, useMemo, useEffect } from 'react';
import { CrmView, Customer, CustomerHealthSummary, Contact, Opportunity, Quotation, SalesOrder, Invoice, Project, Activity, FollowUp } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { formatINR } from '../utils/crmUtils';
import { CustomersAPI } from '../../../services/apiService';
import { 
  ChevronRight, ArrowLeft, MoreVertical, Edit2, Calendar, User, Building2,
  Phone, Mail, MapPin, FileText, Banknote, Target, Plus, CheckCircle2, ShieldAlert,
  AlertTriangle, Clock, Activity as ActivityIcon, ShieldCheck, Layers, RefreshCw,
  DollarSign, ShoppingCart, Receipt, Briefcase, FileSpreadsheet, FolderGit2,
  Tag, ExternalLink, X, Check, MessageSquare
} from 'lucide-react';

interface CrmCustomerDetailsProps {
  customerId: string;
  onViewChange: (view: CrmView) => void;
}

type TabType = 'overview' | 'contacts' | 'opportunities' | 'quotations' | 'sales-orders' | 'invoices' | 'projects' | 'activities' | 'follow-ups' | 'notes';

export const CrmCustomerDetails: React.FC<CrmCustomerDetailsProps> = ({ customerId, onViewChange }) => {
  const { 
    customers, leads, contacts, opportunities, quotations, salesOrders, invoices, 
    projects, activities, followUps, notes, updateCustomer, 
    addContact, addOpportunity, addActivity, addFollowUp, addNote
  } = useApp();
  
  const customer = customers.find(c => c.id === customerId);
  const convertedLead = customer?.convertedFromLeadId ? leads.find(l => l.id === customer.convertedFromLeadId) : null;
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [healthSummary, setHealthSummary] = useState<CustomerHealthSummary | null>(customer?.healthSummary || null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Quick Action Modal States
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showAddOppModal, setShowAddOppModal] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  // Fetch latest health calculation from backend on customerId change
  useEffect(() => {
    if (customerId) {
      setLoadingHealth(true);
      CustomersAPI.getHealth(customerId)
        .then((res: any) => {
          if (res.success && res.data) {
            setHealthSummary(res.data);
          }
        })
        .catch((err: any) => {
          console.warn('Customer health fetch error:', err);
        })
        .finally(() => setLoadingHealth(false));
    }
  }, [customerId]);

  // Filter Related Records by customer ID or customer Name
  const customerContacts = useMemo(() => {
    return contacts.filter(c => c.customerId === customerId || (customer?.customerName && c.customerName === customer.customerName));
  }, [contacts, customerId, customer]);

  const customerOpps = useMemo(() => {
    return opportunities.filter(o => o.customerId === customerId || (customer?.customerName && o.customerName === customer.customerName));
  }, [opportunities, customerId, customer]);

  const customerQuotations = useMemo(() => {
    return quotations.filter(q => q.customerId === customerId || (customer?.customerName && q.customerName?.toLowerCase() === customer.customerName.toLowerCase()));
  }, [quotations, customerId, customer]);

  const customerOrders = useMemo(() => {
    return salesOrders.filter(so => so.customerId === customerId || (customer?.customerName && so.customerName?.toLowerCase() === customer.customerName.toLowerCase()));
  }, [salesOrders, customerId, customer]);

  const customerInvoices = useMemo(() => {
    return invoices.filter(inv => inv.customerId === customerId || (customer?.customerName && inv.customerName?.toLowerCase() === customer.customerName.toLowerCase()));
  }, [invoices, customerId, customer]);

  const customerProjects = useMemo(() => {
    return projects.filter(p => p.customerId === customerId || (customer?.customerName && p.client?.toLowerCase() === customer.customerName.toLowerCase()));
  }, [projects, customerId, customer]);

  const customerActivities = useMemo(() => {
    return activities.filter(a => (customer?.customerName && a.relatedTo === customer.customerName) || a.customerId === customerId);
  }, [activities, customer, customerId]);

  const customerFollowUps = useMemo(() => {
    return followUps.filter(f => f.relatedEntity === customer?.id || (customer?.customerName && f.relatedEntity === customer.customerName));
  }, [followUps, customer, customerId]);

  const customerNotes = useMemo(() => {
    return notes.filter(n => n.relatedRecord === customerId || (customer?.customerName && (n.relatedRecord === customer.customerName || n.relatedRecord.includes(customer.customerName))));
  }, [notes, customerId, customer]);

  // Derived Key Metrics
  const openOpps = useMemo(() => customerOpps.filter(o => o.stage !== 'Won' && o.stage !== 'Lost'), [customerOpps]);
  const pipelineValue = useMemo(() => openOpps.reduce((sum, opp) => sum + (Number(opp.value) || 0), 0), [openOpps]);

  const totalSales = useMemo(() => {
    const ordersTotal = customerOrders
      .filter(so => so.status !== 'Cancelled')
      .reduce((sum, so) => sum + (Number(so.totalAmount) || 0), 0);
    const invoiceTotal = customerInvoices
      .filter(inv => inv.status !== 'Cancelled')
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    return ordersTotal > 0 ? ordersTotal : invoiceTotal;
  }, [customerOrders, customerInvoices]);

  const outstandingBalance = useMemo(() => {
    return customerInvoices
      .filter(inv => inv.status !== 'Paid' && inv.status !== 'Cancelled')
      .reduce((sum, inv) => {
        const amt = Number(inv.amount) || 0;
        const paid = Number(inv.paidAmount) || 0;
        return sum + Math.max(0, amt - paid);
      }, 0);
  }, [customerInvoices]);

  const activeProjectsCount = useMemo(() => {
    return customerProjects.filter(p => p.status !== 'Completed').length;
  }, [customerProjects]);

  const nextFollowUp = useMemo(() => {
    if (customerFollowUps.length === 0) return null;
    return [...customerFollowUps].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  }, [customerFollowUps]);

  const lastActivity = useMemo(() => {
    if (customerActivities.length === 0) return null;
    return [...customerActivities].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0];
  }, [customerActivities]);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <Building2 className="text-slate-400" size={24} />
        </div>
        <h3 className="text-lg font-bold text-[#0f172a] mb-2">Customer not found</h3>
        <p className="text-slate-500 text-sm mb-6">The customer you're looking for does not exist or may have been archived.</p>
        <button onClick={() => onViewChange('customers')} className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-500">
          Back to Customers
        </button>
      </div>
    );
  }

  const currentStatus = healthSummary?.status || customer.status;

  const handleArchive = () => {
    updateCustomer(customer.id, { status: 'Archived' });
    setShowArchiveModal(false);
    onViewChange('customers');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNote({
      title: `Note for ${customer.customerName}`,
      content: newNoteText.trim(),
      relatedRecord: customer.customerName,
      createdBy: 'Lokesh',
      visibility: 'Public'
    });
    setNewNoteText('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'At Risk': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Inactive': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Archived': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getHealthCardStyle = (status: string) => {
    switch (status) {
      case 'Active':
        return {
          wrapper: 'bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-slate-50/50 border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-600',
          headingColor: 'text-emerald-950',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          bulletColor: 'text-emerald-500'
        };
      case 'At Risk':
        return {
          wrapper: 'bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-slate-50/50 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-600',
          headingColor: 'text-amber-950',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          bulletColor: 'text-amber-500'
        };
      case 'Inactive':
        return {
          wrapper: 'bg-gradient-to-r from-slate-100/80 via-slate-50 to-gray-50/50 border-slate-200',
          iconBg: 'bg-slate-200 text-slate-600',
          headingColor: 'text-slate-900',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          bulletColor: 'text-slate-400'
        };
      default:
        return {
          wrapper: 'bg-slate-50 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-500',
          headingColor: 'text-slate-900',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          bulletColor: 'text-slate-400'
        };
    }
  };

  const healthStyle = getHealthCardStyle(currentStatus);

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      
      {/* ARCHIVE MODAL */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#0f172a] mb-2">Archive Customer?</h3>
            <p className="text-sm text-slate-500 mb-6">This customer account will be moved to archived records.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowArchiveModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={handleArchive} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-colors">
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BREADCRUMB & BACK */}
      <div>
        <div className="flex items-center text-xs text-slate-500 mb-3 font-medium">
          <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('overview')}>CRM</span> 
          <ChevronRight size={12} className="mx-1" /> 
          <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('customers')}>Customers</span> 
          <ChevronRight size={12} className="mx-1" /> 
          <span className="text-[#0f172a] font-semibold">{customer.customerName}</span>
        </div>
        <button onClick={() => onViewChange('customers')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-[#0f172a] transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Customers
        </button>
      </div>

      {/* 1. CUSTOMER OVERVIEW & HEADER CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#0f172a]">{customer.customerName}</h1>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(currentStatus)} cursor-default select-none`}>
                {currentStatus}
              </span>
            </div>
            <div className="flex items-center text-sm text-slate-500 flex-wrap gap-2 mt-2">
              <span className="flex items-center"><Building2 size={14} className="mr-1" /> {customer.industry || 'General Industry'}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center font-mono text-indigo-600 font-semibold">{customer.customerCode || customer.id}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center"><MapPin size={14} className="mr-1" /> {customer.billingAddress?.city || 'No Location'}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center"><User size={14} className="mr-1" /> {customer.ownerId || 'Unassigned'}</span>
              
              {/* Lead Conversion Visibility */}
              {customer.convertedFromLeadId && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Converted from Lead: <strong className="font-bold">{convertedLead?.name || customer.convertedFromLeadId}</strong>
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('contacts')} 
              className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg shadow-xs hover:bg-slate-50 flex items-center gap-1.5"
            >
              <User size={14} /> Contacts ({customerContacts.length})
            </button>
            <button 
              onClick={() => setActiveTab('opportunities')} 
              className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg shadow-xs hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Target size={14} /> Deals ({customerOpps.length})
            </button>
            <div className="relative">
              <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-xs hover:bg-slate-50">
                <MoreVertical size={16} />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={() => { setActiveTab('overview'); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">View Full Profile</button>
                  <button onClick={() => { setActiveTab('notes'); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">Add Note</button>
                  <button onClick={() => { setActiveTab('activities'); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">Log Activity</button>
                  <div className="h-px bg-slate-200 my-1"></div>
                  <button onClick={() => { setShowArchiveModal(true); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium">Archive Account</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. TOP METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t border-slate-100">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Sales</p>
            <p className="text-lg font-bold text-indigo-900 mt-0.5">{totalSales > 0 ? formatINR(totalSales) : '₹0'}</p>
            <p className="text-[10px] text-slate-400">From confirmed orders</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Credit Limit</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{formatINR(customer.creditLimit || 0)}</p>
            <p className="text-[10px] text-slate-400">Authorized balance</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Outstanding</p>
            <p className="text-lg font-bold text-rose-700 mt-0.5">{outstandingBalance > 0 ? formatINR(outstandingBalance) : '₹0'}</p>
            <p className="text-[10px] text-slate-400">Unpaid invoice amount</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Open Deals</p>
            <p className="text-lg font-bold text-[#0f172a] mt-0.5">{openOpps.length}</p>
            <p className="text-[10px] text-slate-400">Pipeline: {formatINR(pipelineValue)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Projects</p>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">{activeProjectsCount}</p>
            <p className="text-[10px] text-slate-400">In delivery</p>
          </div>
        </div>
      </div>

      {/* 3. CUSTOMER HEALTH & DIAGNOSTICS CARD */}
      <div className={`rounded-xl border p-5 transition-all shadow-xs ${healthStyle.wrapper}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-xs ${healthStyle.iconBg}`}>
              {currentStatus === 'Active' ? (
                <ShieldCheck size={22} />
              ) : currentStatus === 'At Risk' ? (
                <AlertTriangle size={22} />
              ) : (
                <Clock size={22} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${healthStyle.headingColor}`}>Customer Health Status</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${healthStyle.badge}`}>
                  {currentStatus}
                </span>
                {loadingHealth && <RefreshCw size={12} className="animate-spin text-slate-400" />}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">System-driven classification evaluated from activities, pipeline, invoices and delivery</p>
            </div>
          </div>

          {/* Key Signal Indicators */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-lg">
              <span className="text-slate-500">Last Activity: </span>
              <strong className="text-[#0f172a] font-semibold">
                {healthSummary?.daysSinceLastActivity !== null && healthSummary?.daysSinceLastActivity !== undefined
                  ? `${healthSummary.daysSinceLastActivity}d ago`
                  : 'No activity'}
              </strong>
            </div>
            <div className="bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-lg">
              <span className="text-slate-500">Active Projects: </span>
              <strong className="text-[#0f172a] font-semibold">{healthSummary?.activeProjects || 0}</strong>
            </div>
            <div className="bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-lg">
              <span className="text-slate-500">Open Deals: </span>
              <strong className="text-[#0f172a] font-semibold">{healthSummary?.openOpportunities || 0}</strong>
            </div>
            {(healthSummary?.overdueFollowUps || 0) > 0 && (
              <div className="bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-rose-700 font-semibold">
                Overdue Follow-ups: {healthSummary?.overdueFollowUps}
              </div>
            )}
            {(healthSummary?.overdueInvoices || 0) > 0 && (
              <div className="bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-rose-700 font-semibold">
                Overdue Invoices: {healthSummary?.overdueInvoices}
              </div>
            )}
          </div>
        </div>

        {/* Reasons List */}
        <div className="pt-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Classification Insights:</p>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {healthSummary?.reasons && healthSummary.reasons.length > 0 ? (
              healthSummary.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className={`font-bold mt-0.5 ${healthStyle.bulletColor}`}>•</span>
                  <span className="font-medium text-slate-800">{reason}</span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-2">
                <span className={`font-bold mt-0.5 ${healthStyle.bulletColor}`}>•</span>
                <span className="font-medium text-slate-800">
                  {currentStatus === 'Active' ? 'Account has ongoing business and healthy operational signals.' : 'Standard account lifecycle.'}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* 4. RELATIONSHIPS & 360° NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'contacts', label: `Contacts (${customerContacts.length})`, icon: User },
          { id: 'opportunities', label: `Opportunities (${customerOpps.length})`, icon: Target },
          { id: 'quotations', label: `Quotations (${customerQuotations.length})`, icon: FileSpreadsheet },
          { id: 'sales-orders', label: `Sales Orders (${customerOrders.length})`, icon: ShoppingCart },
          { id: 'invoices', label: `Invoices (${customerInvoices.length})`, icon: Receipt },
          { id: 'projects', label: `Projects (${customerProjects.length})`, icon: FolderGit2 },
          { id: 'activities', label: `Activities (${customerActivities.length})`, icon: ActivityIcon },
          { id: 'follow-ups', label: `Follow-ups (${customerFollowUps.length})`, icon: Calendar },
          { id: 'notes', label: `Notes (${customerNotes.length})`, icon: MessageSquare },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg' 
                  : 'border-transparent text-slate-500 hover:text-[#0f172a] hover:border-slate-300'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 5. TAB PANELS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Customer Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center">
              <Building2 size={18} className="mr-2 text-indigo-500" /> Account Information
            </h2>
            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Company Name</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.customerName}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Customer Code</span>
                <span className="font-mono font-medium text-indigo-600 col-span-2">{customer.customerCode || customer.id}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Account Type</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.customerType || 'Company'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Industry</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.industry || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Website</span>
                <span className="font-medium text-indigo-600 col-span-2">
                  {customer.website ? (
                    <a href={customer.website} target="_blank" rel="noreferrer" className="hover:underline inline-flex items-center gap-1">
                      {customer.website} <ExternalLink size={12} />
                    </a>
                  ) : '—'}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Account Owner</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.ownerId || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center">
              <User size={18} className="mr-2 text-indigo-500" /> Primary Contact
            </h2>
            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Contact Name</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.primaryContact?.name || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Title / Role</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.primaryContact?.designation || 'Primary Contact'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Email Address</span>
                <span className="font-medium text-indigo-600 col-span-2">
                  {customer.primaryContact?.email ? (
                    <a href={`mailto:${customer.primaryContact.email}`} className="hover:underline">
                      {customer.primaryContact.email}
                    </a>
                  ) : '—'}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Phone</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.primaryContact?.phone || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Alt. Phone</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.primaryContact?.alternatePhone || '—'}</span>
              </div>
            </div>
          </div>

          {/* Billing & Shipping Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center">
              <MapPin size={18} className="mr-2 text-indigo-500" /> Billing Address
            </h2>
            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Street</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.billingAddress?.address || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">City / State</span>
                <span className="font-medium text-[#0f172a] col-span-2">
                  {[customer.billingAddress?.city, customer.billingAddress?.state].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Country</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.billingAddress?.country || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Postal Code</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.billingAddress?.postalCode || '—'}</span>
              </div>
            </div>
          </div>

          {/* Financial & Compliance */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center">
              <Banknote size={18} className="mr-2 text-indigo-500" /> Commercial & Financial
            </h2>
            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Credit Limit</span>
                <span className="font-bold text-[#0f172a] col-span-2">{formatINR(customer.creditLimit || 0)}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Total Sales</span>
                <span className="font-bold text-indigo-700 col-span-2">{formatINR(totalSales)}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Outstanding</span>
                <span className="font-bold text-rose-600 col-span-2">{formatINR(outstandingBalance)}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Payment Terms</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.paymentTerms || 'Net 30 Days'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">GST / Tax ID</span>
                <span className="font-medium text-[#0f172a] col-span-2">{customer.gstVatNumber || customer.taxId || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTACTS */}
      {activeTab === 'contacts' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0f172a]">Associated Contacts ({customerContacts.length})</h3>
            <button 
              onClick={() => onViewChange('contacts')}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 flex items-center gap-1.5"
            >
              <Plus size={14} /> Open Contacts Directory
            </button>
          </div>
          {customerContacts.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Designation</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerContacts.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-[#0f172a] flex items-center gap-2">
                      <User size={14} className="text-indigo-500" />
                      {c.name}
                    </td>
                    <td className="p-4 text-slate-600">{c.designation || '—'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {c.contactRole || 'Decision Maker'}
                      </span>
                    </td>
                    <td className="p-4 text-indigo-600">{c.email ? <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a> : '—'}</td>
                    <td className="p-4 text-slate-600">{c.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              No contacts directly linked to this customer account.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OPPORTUNITIES */}
      {activeTab === 'opportunities' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0f172a]">Commercial Deals & Opportunities ({customerOpps.length})</h3>
            <button 
              onClick={() => onViewChange('opportunities')}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 flex items-center gap-1.5"
            >
              <Plus size={14} /> View Deals Hub
            </button>
          </div>
          {customerOpps.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">Deal Name</th>
                  <th className="p-4 font-semibold text-right">Value</th>
                  <th className="p-4 font-semibold">Stage</th>
                  <th className="p-4 font-semibold text-right">Probability</th>
                  <th className="p-4 font-semibold">Expected Close</th>
                  <th className="p-4 font-semibold">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerOpps.map(opp => (
                  <tr key={opp.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-[#0f172a]">{opp.name}</td>
                    <td className="p-4 font-bold text-indigo-900 text-right">{formatINR(opp.value)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        opp.stage === 'Won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        opp.stage === 'Lost' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {opp.stage}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-slate-700">{opp.probability || 50}%</td>
                    <td className="p-4 text-slate-600 text-xs">{opp.expectedClose || '—'}</td>
                    <td className="p-4 text-slate-600 text-xs">{opp.owner || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              No opportunities linked to this customer account yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: QUOTATIONS */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0f172a]">Quotations & Proposals ({customerQuotations.length})</h3>
          </div>
          {customerQuotations.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">Quote #</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Valid Until</th>
                  <th className="p-4 font-semibold text-right">Amount</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerQuotations.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-indigo-600">{q.quoteNumber}</td>
                    <td className="p-4 text-slate-600 text-xs">{q.date}</td>
                    <td className="p-4 text-slate-600 text-xs">{q.validUntil}</td>
                    <td className="p-4 font-bold text-[#0f172a] text-right">{formatINR(q.amount)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        q.status === 'Accepted' || q.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        q.status === 'Sent' ? 'bg-indigo-100 text-indigo-700' :
                        q.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              No quotations created for this customer.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SALES ORDERS */}
      {activeTab === 'sales-orders' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0f172a]">Sales Orders ({customerOrders.length})</h3>
          </div>
          {customerOrders.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">SO #</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold text-right">Total Amount</th>
                  <th className="p-4 font-semibold text-center">Fulfillment</th>
                  <th className="p-4 font-semibold text-center">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerOrders.map(so => (
                  <tr key={so.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-indigo-600">{so.soNumber}</td>
                    <td className="p-4 text-slate-600 text-xs">{so.date}</td>
                    <td className="p-4 font-bold text-indigo-950 text-right">{formatINR(so.totalAmount)}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {so.fulfillmentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {so.status || 'Confirmed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              No sales orders placed by this customer.
            </div>
          )}
        </div>
      )}

      {/* TAB 6: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0f172a]">Tax Invoices ({customerInvoices.length})</h3>
          </div>
          {customerInvoices.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">Invoice #</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Due Date</th>
                  <th className="p-4 font-semibold text-right">Invoice Amount</th>
                  <th className="p-4 font-semibold text-right">Paid</th>
                  <th className="p-4 font-semibold text-right">Balance</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerInvoices.map(inv => {
                  const bal = Math.max(0, (Number(inv.amount) || 0) - (Number(inv.paidAmount) || 0));
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                      <td className="p-4 text-slate-600 text-xs">{inv.date}</td>
                      <td className="p-4 text-slate-600 text-xs">{inv.dueDate}</td>
                      <td className="p-4 font-bold text-[#0f172a] text-right">{formatINR(inv.amount)}</td>
                      <td className="p-4 text-emerald-700 font-semibold text-right">{formatINR(inv.paidAmount || 0)}</td>
                      <td className="p-4 text-rose-700 font-bold text-right">{formatINR(bal)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                          inv.status === 'Overdue' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              No tax invoices billed to this customer account.
            </div>
          )}
        </div>
      )}

      {/* TAB 7: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0f172a]">Client Projects ({customerProjects.length})</h3>
          </div>
          {customerProjects.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">Code</th>
                  <th className="p-4 font-semibold">Project Name</th>
                  <th className="p-4 font-semibold">Manager</th>
                  <th className="p-4 font-semibold text-right">Budget</th>
                  <th className="p-4 font-semibold">Progress</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerProjects.map(proj => (
                  <tr key={proj.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-indigo-600">{proj.code || proj.id}</td>
                    <td className="p-4 font-bold text-[#0f172a]">{proj.name}</td>
                    <td className="p-4 text-slate-600 text-xs">{proj.projectManager || '—'}</td>
                    <td className="p-4 font-bold text-slate-800 text-right">{formatINR(proj.budget)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${proj.progress || 0}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{proj.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        proj.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        proj.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {proj.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              No delivery projects linked to this customer.
            </div>
          )}
        </div>
      )}

      {/* TAB 8: ACTIVITIES */}
      {activeTab === 'activities' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#0f172a] mb-4">Customer Activity Log ({customerActivities.length})</h3>
          {customerActivities.length > 0 ? (
            <div className="space-y-4">
              {customerActivities.map(act => (
                <div key={act.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mt-0.5">
                    <ActivityIcon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#0f172a]">{act.type} • {act.title || 'Activity Recorded'}</p>
                      <span className="text-xs text-slate-500">{act.dueDate || ''}</span>
                    </div>
                    {act.outcome && <p className="text-xs text-slate-600 mt-1">{act.outcome}</p>}
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                      {act.status || 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No past activities logged for this customer.
            </div>
          )}
        </div>
      )}

      {/* TAB 9: FOLLOW-UPS */}
      {activeTab === 'follow-ups' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#0f172a] mb-4">Scheduled Follow-ups ({customerFollowUps.length})</h3>
          {customerFollowUps.length > 0 ? (
            <div className="space-y-3">
              {customerFollowUps.map(fu => (
                <div key={fu.id} className="flex items-start justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg mt-0.5">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0f172a]">{fu.activityType} • Due: {fu.dueDate}</p>
                      <p className="text-xs text-slate-600 mt-0.5">Owner: {fu.owner || 'Unassigned'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    fu.status === 'Overdue' ? 'bg-rose-100 text-rose-700' :
                    fu.status === 'Today' ? 'bg-amber-100 text-amber-800' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    {fu.status || 'Upcoming'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No pending follow-ups for this customer.
            </div>
          )}
        </div>
      )}

      {/* TAB 10: NOTES */}
      {activeTab === 'notes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#0f172a] mb-4">Account Notes & Internal Logs</h3>
          
          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="mb-6">
            <textarea
              rows={3}
              placeholder="Write an internal note or meeting summary regarding this customer..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex justify-end mt-2">
              <button 
                type="submit" 
                disabled={!newNoteText.trim()}
                className="px-4 py-2 bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} /> Add Note
              </button>
            </div>
          </form>

          {/* Notes List */}
          {customerNotes.length > 0 || customer.notes ? (
            <div className="space-y-3">
              {customer.notes && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Primary Account Note</p>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}
              {customerNotes.map(n => (
                <div key={n.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
                    <span className="font-bold text-slate-700">{n.createdBy || 'Staff'} • {n.title}</span>
                    <span>{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-sm">
              No notes written for this customer account.
            </div>
          )}
        </div>
      )}

    </div>
  );
};
