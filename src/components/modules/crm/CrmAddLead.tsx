import React, { useState } from 'react';
import { CrmView, Lead } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { ChevronRight, Save, Plus, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

interface CrmAddLeadProps {
  onViewChange: (view: CrmView) => void;
}

export const CrmAddLead: React.FC<CrmAddLeadProps> = ({ onViewChange }) => {
  const { addLead } = useApp();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    industry: '',
    source: '',
    campaign: '',
    contactPerson: '',
    designation: '',
    email: '',
    phone: '',
    alternatePhone: '',
    website: '',
    stage: 'New' as Lead['stage'],
    score: 50,
    expectedDealValue: '',
    expectedCloseDate: '',
    assignedTo: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    tags: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Lead name is required.';
    if (!formData.source) newErrors.source = 'Please select a lead source.';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.assignedTo) newErrors.assignedTo = 'Please select an owner.';
    
    if (formData.score < 0 || formData.score > 100) newErrors.score = 'Score must be between 0 and 100.';
    if (formData.expectedDealValue && isNaN(Number(formData.expectedDealValue))) {
      newErrors.expectedDealValue = 'Must be a valid number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (addAnother: boolean) => {
    if (!validate()) return;

    try {
      addLead({
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        value: Number(formData.expectedDealValue) || 0,
        stage: formData.stage,
        score: formData.score,
        source: formData.source,
        assignedTo: formData.assignedTo,
        industry: formData.industry,
        campaign: formData.campaign,
        contactPerson: formData.contactPerson,
        designation: formData.designation,
        alternatePhone: formData.alternatePhone,
        website: formData.website,
        expectedCloseDate: formData.expectedCloseDate,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        notes: formData.notes,
      });

      showToast('Lead created successfully.', 'success');

      if (addAnother) {
        setFormData({ ...formData, name: '', company: '', email: '', phone: '', expectedDealValue: '', notes: '' });
        setErrors({});
      } else {
        setTimeout(() => onViewChange('overview'), 1000);
      }
    } catch (err) {
      showToast('Unable to create lead. Please try again.', 'error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 relative">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white animate-in slide-in-from-top-2 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-1 font-medium cursor-pointer" onClick={() => onViewChange('overview')}>
            <span className="hover:text-indigo-600 transition-colors">CRM</span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="hover:text-indigo-600 transition-colors">Leads</span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="text-[#0f172a]">New Lead</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Create New Lead</h1>
          <p className="text-sm text-slate-500 mt-1">Capture and qualify a potential customer.</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button onClick={() => onViewChange('overview')} className="px-4 py-2 bg-white border border-slate-200 text-[#0f172a] font-semibold text-sm rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <ArrowLeft size={16} /> Cancel
          </button>
          <button onClick={() => handleSave(true)} className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-50 transition-colors flex items-center gap-2">
            <Plus size={16} /> Save & Add Another
          </button>
          <button onClick={() => handleSave(false)} className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-500 transition-colors flex items-center gap-2">
            <Save size={16} /> Save Lead
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: LEAD INFORMATION */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Lead Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Lead Name <span className="text-rose-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full p-2.5 bg-slate-50 border ${errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`} placeholder="e.g. John Doe or ACME Corp" />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Company</label>
              <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Industry</label>
              <select name="industry" value={formData.industry} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all">
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Lead Source <span className="text-rose-500">*</span></label>
              <select name="source" value={formData.source} onChange={handleChange} className={`w-full p-2.5 bg-slate-50 border ${errors.source ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`}>
                <option value="">Select Source</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Campaign">Campaign</option>
                <option value="Social Media">Social Media</option>
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="Partner">Partner</option>
                <option value="Event">Event</option>
                <option value="Manual">Manual</option>
                <option value="Other">Other</option>
              </select>
              {errors.source && <p className="text-xs text-rose-500 mt-1">{errors.source}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Campaign</label>
              <input type="text" name="campaign" value={formData.campaign} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" placeholder="e.g. Q3 Summer Promo" />
            </div>
          </div>
        </div>

        {/* SECTION 2: CONTACT INFORMATION */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Contact Person</label>
              <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Designation</label>
              <input type="text" name="designation" value={formData.designation} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Email <span className="text-rose-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full p-2.5 bg-slate-50 border ${errors.email ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`} />
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Alternate Phone</label>
              <input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Website</label>
              <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" placeholder="https://" />
            </div>
          </div>
        </div>

        {/* SECTION 3: QUALIFICATION */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Qualification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Stage</label>
              <select name="stage" value={formData.stage} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all">
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Lead Score (0-100)</label>
              <div className="flex items-center gap-4">
                <input type="range" name="score" min="0" max="100" value={formData.score} onChange={handleChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                <input type="number" name="score" min="0" max="100" value={formData.score} onChange={handleChange} className={`w-20 p-2.5 bg-slate-50 border ${errors.score ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-center`} />
              </div>
              {errors.score && <p className="text-xs text-rose-500 mt-1">{errors.score}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Expected Deal Value (₹)</label>
              <input type="number" name="expectedDealValue" value={formData.expectedDealValue} onChange={handleChange} className={`w-full p-2.5 bg-slate-50 border ${errors.expectedDealValue ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all`} />
              {errors.expectedDealValue && <p className="text-xs text-rose-500 mt-1">{errors.expectedDealValue}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Expected Close Date</label>
              <input type="date" name="expectedCloseDate" value={formData.expectedCloseDate} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Assigned To <span className="text-rose-500">*</span></label>
              <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className={`w-full p-2.5 bg-slate-50 border ${errors.assignedTo ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`}>
                <option value="">Select Owner</option>
                <option value="John Doe">John Doe</option>
                <option value="Sarah Connor">Sarah Connor</option>
                <option value="Mike Ross">Mike Ross</option>
                <option value="David Miller">David Miller</option>
                <option value="Emma Watson">Emma Watson</option>
              </select>
              {errors.assignedTo && <p className="text-xs text-rose-500 mt-1">{errors.assignedTo}</p>}
            </div>
          </div>
        </div>

        {/* SECTION 4: ADDRESS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">State</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Country</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Postal Code</label>
              <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
            </div>
          </div>
        </div>

        {/* SECTION 5: ADDITIONAL INFORMATION */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Additional Information</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Tags</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" placeholder="Enter tags separated by commas" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" placeholder="Enter any additional notes about this lead..."></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-2">Attachments</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 mb-3">
                  <Plus className="text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-[#0f172a]">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG or PDF (max. 10MB)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
