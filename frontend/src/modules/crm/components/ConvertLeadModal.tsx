import React, { useState, useEffect } from 'react';
import { Lead } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { validateLeadConversion } from '../utils/leadWorkflowValidation';
import { findMatchingCustomer, DuplicateCustomerMatch } from '../utils/duplicateCustomerDetection';
import { 
  Rocket, Building2, User, Award, ShieldCheck, CheckCheck, AlertCircle, X
} from 'lucide-react';

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSuccess?: () => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSuccess,
}) => {
  const { customers, convertLead } = useApp();

  const [convertSubmitting, setConvertSubmitting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<any>(null);
  const [matchedReason, setMatchedReason] = useState<string>('');
  const [customerChoice, setCustomerChoice] = useState<'existing' | 'new'>('existing');

  const [convertForm, setConvertForm] = useState({
    customerName: '',
    customerType: 'Company' as 'Company' | 'Individual',
    industry: '',
    website: '',
    contactName: '',
    contactDesignation: '',
    contactEmail: '',
    contactPhone: '',
    opportunityName: '',
    opportunityValue: '',
    expectedCloseDate: '',
  });

  useEffect(() => {
    if (!isOpen || !lead) return;

    // Detect duplicates
    const matchResult: DuplicateCustomerMatch = findMatchingCustomer(lead, customers);
    if (matchResult.hasDuplicate && matchResult.matchingCustomer) {
      setMatchedCustomer(matchResult.matchingCustomer);
      setMatchedReason(matchResult.matchReason || 'Matching customer identifier found');
      setCustomerChoice('existing');
    } else {
      setMatchedCustomer(null);
      setMatchedReason('');
      setCustomerChoice('new');
    }

    const defaultOppSummary = lead.requirement
      ? lead.requirement.length > 30
        ? lead.requirement.substring(0, 27) + '...'
        : lead.requirement
      : 'Deal';

    setConvertForm({
      customerName: lead.company?.trim() || lead.name,
      customerType: lead.company ? 'Company' : 'Individual',
      industry: lead.industry || '',
      website: lead.website || '',
      contactName: lead.decisionMaker || lead.contactPerson || lead.name,
      contactDesignation: lead.designation || 'Primary Contact',
      contactEmail: lead.email || '',
      contactPhone: lead.phone || '',
      opportunityName: lead.company ? `${lead.company} - ${defaultOppSummary}` : `${lead.name} Deal`,
      opportunityValue: String(lead.finalAgreedAmount || lead.value || lead.budget || 0),
      expectedCloseDate: lead.wonDate || lead.expectedCloseDate || new Date().toISOString().split('T')[0],
    });

    setConvertError(null);
  }, [isOpen, lead, customers]);

  if (!isOpen || !lead) return null;

  const handleExecuteConvert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setConvertSubmitting(true);
    setConvertError(null);

    const validation = validateLeadConversion(lead);
    if (!validation.allowed) {
      setConvertError(validation.reason || 'Lead cannot be converted.');
      setConvertSubmitting(false);
      return;
    }

    try {
      const res = await convertLead(lead.id, {
        customerName: convertForm.customerName,
        customerType: convertForm.customerType,
        industry: convertForm.industry,
        website: convertForm.website,
        contactName: convertForm.contactName,
        contactDesignation: convertForm.contactDesignation,
        contactEmail: convertForm.contactEmail,
        contactPhone: convertForm.contactPhone,
        opportunityName: convertForm.opportunityName,
        opportunityValue: parseFloat(convertForm.opportunityValue) || 0,
        expectedCloseDate: convertForm.expectedCloseDate,
        useExistingCustomerId: (customerChoice === 'existing' && matchedCustomer) ? matchedCustomer.id : undefined,
        forceNewCustomer: customerChoice === 'new',
      });

      if (!res.success) {
        setConvertError(res.message || 'Failed to convert lead.');
        setConvertSubmitting(false);
        return;
      }

      setConvertSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setConvertError(err.message || 'An unexpected error occurred during conversion.');
      setConvertSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl animate-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Rocket size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0f172a]">Convert Won Lead</h3>
              <p className="text-xs text-slate-500">
                Creates Customer Account, Primary Contact, and Won Opportunity in one operation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {convertError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Conversion Blocked</p>
              <p className="mt-0.5">{convertError}</p>
            </div>
          </div>
        )}

        {/* DUPLICATE CUSTOMER MATCH WARNING & SELECTION */}
        {matchedCustomer && (
          <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl shadow-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                <AlertCircle size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-amber-950">
                    An existing customer may match this lead.
                  </h4>
                  <span className="text-[11px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    Duplicate Found
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 font-medium">
                  <strong>Detection:</strong> {matchedReason}
                </p>

                {/* MATCHED CUSTOMER PREVIEW */}
                <div className="mt-3 p-3 bg-white/95 border border-amber-200 rounded-lg shadow-xs space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{matchedCustomer.customerName}</span>
                    <span className="font-mono text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {matchedCustomer.customerCode || matchedCustomer.id}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1.5 border-t border-slate-100">
                    <div>
                      <strong className="text-slate-700">Primary Contact:</strong> {matchedCustomer.primaryContact?.name || (matchedCustomer as any).contactName || 'N/A'}
                    </div>
                    <div>
                      <strong className="text-slate-700">Email:</strong> {matchedCustomer.primaryContact?.email || (matchedCustomer as any).contactEmail || (matchedCustomer as any).email || 'N/A'}
                    </div>
                    <div>
                      <strong className="text-slate-700">Website:</strong> {matchedCustomer.website || 'N/A'}
                    </div>
                    <div>
                      <strong className="text-slate-700">GST / Tax ID:</strong> {(matchedCustomer as any).taxId || (matchedCustomer as any).gstVatNumber || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* USER SELECTION BUTTONS */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerChoice('existing')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      customerChoice === 'existing'
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCheck size={14} /> Use Existing Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerChoice('new')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      customerChoice === 'new'
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    + Create New Customer Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleExecuteConvert} className="space-y-5">
          {/* SECTION 1: CUSTOMER */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Customer Account Master
                </h4>
              </div>
              {matchedCustomer && customerChoice === 'existing' && (
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Linking to Existing Customer
                </span>
              )}
            </div>

            {matchedCustomer && customerChoice === 'existing' ? (
              <div className="p-3 bg-white border border-indigo-200 rounded-lg text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>{matchedCustomer.customerName}</span>
                  <span className="text-[11px] font-mono text-slate-500">{matchedCustomer.id}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  This lead will be converted under this existing Customer Account. Existing customer data will remain intact.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={convertForm.customerName}
                    onChange={(e) => setConvertForm({ ...convertForm, customerName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={convertForm.customerType}
                    onChange={(e) => setConvertForm({ ...convertForm, customerType: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Company">Company</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    placeholder="e.g. Technology, Healthcare"
                    value={convertForm.industry}
                    onChange={(e) => setConvertForm({ ...convertForm, industry: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
                  <input
                    type="text"
                    placeholder="e.g. https://company.com"
                    value={convertForm.website}
                    onChange={(e) => setConvertForm({ ...convertForm, website: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center justify-between text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200/60">
                  <span>
                    <strong>Account Owner:</strong> {lead.assignedTo || 'Unassigned'}
                  </span>
                  <span className="font-mono text-indigo-600">Status: Active</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: PRIMARY CONTACT */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Primary Contact
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={convertForm.contactName}
                  onChange={(e) => setConvertForm({ ...convertForm, contactName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Director of Operations"
                  value={convertForm.contactDesignation}
                  onChange={(e) => setConvertForm({ ...convertForm, contactDesignation: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={convertForm.contactEmail}
                  onChange={(e) => setConvertForm({ ...convertForm, contactEmail: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={convertForm.contactPhone}
                  onChange={(e) => setConvertForm({ ...convertForm, contactPhone: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: OPPORTUNITY */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Won Opportunity Deal
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opportunity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={convertForm.opportunityName}
                  onChange={(e) => setConvertForm({ ...convertForm, opportunityName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agreed Deal Value (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={convertForm.opportunityValue}
                  onChange={(e) => setConvertForm({ ...convertForm, opportunityValue: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Close Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={convertForm.expectedCloseDate}
                  onChange={(e) => setConvertForm({ ...convertForm, expectedCloseDate: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between text-[11px] bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200">
                <span className="font-bold">Stage: Won</span>
                <span className="font-bold">Probability: 100%</span>
                <span>Owner: {lead.assignedTo || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={convertSubmitting}
              className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={convertSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {convertSubmitting ? (
                <>Converting...</>
              ) : (
                <>
                  <Rocket size={15} /> Convert to Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
