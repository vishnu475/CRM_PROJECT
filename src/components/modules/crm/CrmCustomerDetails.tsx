import React, { useState, useMemo } from 'react';
import { CrmView, Customer } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { formatINR } from './crmUtils';
import { 
  ChevronRight, ArrowLeft, MoreVertical, Edit2, Calendar, User, Building2,
  Phone, Mail, MapPin, FileText, Banknote, Target, Plus, CheckCircle2, ShieldAlert
} from 'lucide-react';

interface CrmCustomerDetailsProps {
  customerId: string;
  onViewChange: (view: CrmView) => void;
}

type TabType = 'overview' | 'contacts' | 'opportunities' | 'activities' | 'follow-ups' | 'notes' | 'documents';

export const CrmCustomerDetails: React.FC<CrmCustomerDetailsProps> = ({ customerId, onViewChange }) => {
  const { customers, opportunities, activities, followUps, updateCustomer } = useApp();
  
  const customer = customers.find(c => c.id === customerId);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const customerOpps = useMemo(() => opportunities.filter(o => o.customerId === customerId), [opportunities, customerId]);
  const customerActivities = useMemo(() => activities.filter(a => a.relatedTo === customer?.customerName), [activities, customer]);
  const customerFollowUps = useMemo(() => followUps.filter(f => f.relatedEntity === customer?.id && f.status !== 'Overdue'), [followUps, customer]);

  const openOpps = customerOpps.filter(o => o.stage !== 'Won' && o.stage !== 'Lost');
  const totalValue = openOpps.reduce((sum, opp) => sum + opp.value, 0);
  
  const nextFollowUp = useMemo(() => {
    if (customerFollowUps.length === 0) return null;
    return customerFollowUps.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  }, [customerFollowUps]);

  const lastActivity = useMemo(() => {
    if (customerActivities.length === 0) return null;
    return customerActivities.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0];
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

  const handleArchive = () => {
    updateCustomer(customer.id, { status: 'Archived' });
    setShowArchiveModal(false);
    onViewChange('customers');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'At Risk': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Inactive': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      
      {/* ARCHIVE MODAL */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#0f172a] mb-2">Archive Customer?</h3>
            <p className="text-sm text-slate-500 mb-6">This customer will be removed from active customer views.</p>
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
      <div className="mb-6">
        <div className="flex items-center text-xs text-slate-500 mb-3 font-medium">
          <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('overview')}>CRM</span> 
          <ChevronRight size={12} className="mx-1" /> 
          <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('customers')}>Customers</span> 
          <ChevronRight size={12} className="mx-1" /> 
          <span className="text-[#0f172a]">{customer.customerName}</span>
        </div>
        <button onClick={() => onViewChange('customers')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-[#0f172a] transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Customers
        </button>
      </div>

      {/* CUSTOMER HEADER CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#0f172a]">{customer.customerName}</h1>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(customer.status)}`}>
                {customer.status}
              </span>
            </div>
            <div className="flex items-center text-sm text-slate-500 flex-wrap gap-2 mt-2">
              <span className="flex items-center"><Building2 size={14} className="mr-1" /> {customer.industry || 'No Industry'}</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center font-mono text-indigo-400">{customer.customerCode || 'No Code'}</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center"><MapPin size={14} className="mr-1" /> {customer.billingAddress?.city || 'No Location'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-[#0f172a] font-semibold text-sm rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-2">
              <Edit2 size={14} /> Edit
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-500 flex items-center gap-2">
              <Plus size={14} /> Add Activity
            </button>
            <div className="relative">
              <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50">
                <MoreVertical size={18} />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Assign Owner</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Add Follow-up</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Create Opportunity</button>
                  <div className="h-px bg-slate-200 my-1"></div>
                  <button onClick={() => { setShowArchiveModal(true); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium">Archive</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Open Opportunities</p>
            <p className="text-lg font-bold text-[#0f172a]">{openOpps.length}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Pipeline Value</p>
            <p className="text-lg font-bold text-[#0f172a]">{formatINR(totalValue)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Last Activity</p>
            <p className="text-sm font-bold text-[#0f172a]">{lastActivity ? lastActivity.dueDate : 'No activity yet'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Owner</p>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2">
                {customer.ownerId?.charAt(0) || '?'}
              </div>
              <span className="text-sm font-bold text-[#0f172a]">{customer.ownerId || 'Unassigned'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* NEXT FOLLOW UP (If exists) */}
      {nextFollowUp && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg mt-0.5">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 tracking-wider uppercase mb-1">Next Follow-up • {nextFollowUp.dueDate}</p>
              <p className="text-sm text-amber-900 font-medium">{nextFollowUp.activityType} regarding customer account.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors">Reschedule</button>
            <button className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm">Complete</button>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
        {(['overview', 'contacts', 'opportunities', 'activities', 'follow-ups', 'notes', 'documents'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-[#0f172a] hover:border-slate-300'}`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center"><Building2 size={18} className="mr-2 text-indigo-500" /> Customer Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Name</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.customerName}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Code</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.customerCode || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Type</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.customerType}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Industry</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.industry || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Website</span>
                <span className="text-sm font-medium text-indigo-600 col-span-2">{customer.website ? <a href={customer.website} target="_blank" rel="noreferrer" className="hover:underline">{customer.website}</a> : '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center"><User size={18} className="mr-2 text-indigo-500" /> Primary Contact</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Name</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.primaryContact?.name || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Title</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.primaryContact?.designation || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Email</span>
                <span className="text-sm font-medium text-indigo-600 col-span-2">{customer.primaryContact?.email || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Phone</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.primaryContact?.phone || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Alt. Phone</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.primaryContact?.alternatePhone || '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center"><MapPin size={18} className="mr-2 text-indigo-500" /> Billing Address</h2>
            {customer.billingAddress?.address || customer.billingAddress?.city ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">Street</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.billingAddress.address || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">City/State</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{[customer.billingAddress.city, customer.billingAddress.state].filter(Boolean).join(', ') || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">Country</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.billingAddress.country || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">Postal Code</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.billingAddress.postalCode || '—'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No information available.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center"><MapPin size={18} className="mr-2 text-indigo-500" /> Shipping Address</h2>
            {customer.shippingAddress?.address || customer.shippingAddress?.city ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">Street</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.shippingAddress.address || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">City/State</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{[customer.shippingAddress.city, customer.shippingAddress.state].filter(Boolean).join(', ') || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">Country</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.shippingAddress.country || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">Postal Code</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.shippingAddress.postalCode || '—'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No information available.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center"><FileText size={18} className="mr-2 text-indigo-500" /> Tax & Compliance</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Tax ID</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.taxId || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">GST/VAT</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.gstVatNumber || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">KYC Status</span>
                <span className="text-sm font-medium col-span-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${customer.kycStatus === 'Verified' ? 'bg-emerald-100 text-emerald-700' : (customer.kycStatus === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}`}>
                    {customer.kycStatus || 'Pending'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center"><Banknote size={18} className="mr-2 text-indigo-500" /> Financial Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Credit Limit</span>
                <span className="text-sm font-bold text-[#0f172a] col-span-2">{customer.creditLimit ? formatINR(customer.creditLimit) : '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Payment Terms</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.paymentTerms || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Currency</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{customer.currency || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTHER TABS - PLACEHOLDERS */}
      {activeTab !== 'overview' && (
        <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
            <Target className="text-indigo-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#0f172a] mb-2 capitalize">{activeTab.replace('-', ' ')}</h2>
          <p className="text-slate-500 max-w-sm mb-6">
            This section will contain all {activeTab.replace('-', ' ')} related to this customer account. 
            <br/><br/>
            <span className="font-semibold text-indigo-600">Coming in the next CRM module!</span>
          </p>
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-50" onClick={() => setActiveTab('overview')}>
            Back to Overview
          </button>
        </div>
      )}

    </div>
  );
};
