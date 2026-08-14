import React, { useState } from 'react';
import { CrmView } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { ChevronRight, Save, ArrowLeft, Building2, User, MapPin, FileText, Banknote, Tag, CheckCircle2, AlertCircle } from 'lucide-react';

interface CrmAddCustomerProps {
  onViewChange: (view: CrmView) => void;
}

export const CrmAddCustomer: React.FC<CrmAddCustomerProps> = ({ onViewChange }) => {
  const { addCustomer, userProfile } = useApp();
  
  // State variables for all sections
  const [customerType, setCustomerType] = useState<'Company' | 'Individual'>('Company');
  const [customerName, setCustomerName] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [ownerId, setOwnerId] = useState(userProfile.name);
  const [status, setStatus] = useState<'Active' | 'At Risk' | 'Inactive'>('Active');

  const [contactName, setContactName] = useState('');
  const [contactDesignation, setContactDesignation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAlternatePhone, setContactAlternatePhone] = useState('');

  const [billingAddress, setBillingAddress] = useState({ address: '', city: '', state: '', country: '', postalCode: '' });
  const [shippingAddress, setShippingAddress] = useState({ address: '', city: '', state: '', country: '', postalCode: '' });
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const [taxId, setTaxId] = useState('');
  const [gstVatNumber, setGstVatNumber] = useState('');
  const [kycStatus, setKycStatus] = useState<'Pending' | 'Verified' | 'Rejected'>('Pending');

  const [creditLimit, setCreditLimit] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [currency, setCurrency] = useState('INR');

  const [notes, setNotes] = useState('');

  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showToast, setShowToast] = useState(false);

  const handleAddressChange = (type: 'billing' | 'shipping', field: string, value: string) => {
    if (type === 'billing') {
      const newBilling = { ...billingAddress, [field]: value };
      setBillingAddress(newBilling);
      if (sameAsBilling) {
        setShippingAddress(newBilling);
      }
    } else {
      setShippingAddress({ ...shippingAddress, [field]: value });
    }
  };

  const handleSameAsBillingToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAsBilling(checked);
    if (checked) {
      setShippingAddress({ ...billingAddress });
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!customerName.trim()) newErrors.customerName = 'Customer Name is required';
    if (!ownerId.trim()) newErrors.ownerId = 'Owner is required';
    if (!contactName.trim()) newErrors.contactName = 'Primary Contact Name is required';
    if (!contactEmail.trim()) {
      newErrors.contactEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }
    if (!contactPhone.trim()) {
      newErrors.contactPhone = 'Phone is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const now = new Date().toISOString();
    
    addCustomer({
      customerCode: customerCode || undefined,
      customerName,
      customerType,
      industry: industry || undefined,
      website: website || undefined,
      ownerId,
      status,
      primaryContact: {
        name: contactName,
        designation: contactDesignation || undefined,
        email: contactEmail,
        phone: contactPhone,
        alternatePhone: contactAlternatePhone || undefined,
      },
      billingAddress,
      shippingAddress,
      taxId: taxId || undefined,
      gstVatNumber: gstVatNumber || undefined,
      kycStatus,
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      paymentTerms,
      currency,
      notes: notes || undefined,
      source: 'Direct',
      createdAt: now,
      updatedAt: now,
    });

    setShowToast(true);
    setTimeout(() => {
      onViewChange('customers'); // Or navigate to details if we had the ID back from addCustomer
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 relative">
      
      {/* SUCCESS TOAST */}
      {showToast && (
        <div className="fixed top-24 right-8 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 z-50">
          <CheckCircle2 className="text-emerald-500" />
          <div>
            <p className="font-bold text-sm">Customer created successfully</p>
            <p className="text-xs opacity-80">Redirecting to customer details...</p>
          </div>
        </div>
      )}

      {/* BREADCRUMB & BACK */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-3 font-medium">
            <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('overview')}>CRM</span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('customers')}>Customers</span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="text-[#0f172a]">Create Customer</span>
          </div>
          <button onClick={() => onViewChange('customers')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-[#0f172a] transition-colors mb-2">
            <ArrowLeft size={16} className="mr-1" /> Back to Customers
          </button>
          <h1 className="text-2xl font-bold text-[#0f172a]">Create Customer</h1>
          <p className="text-sm text-slate-500 mt-1">Add an established customer account to your CRM.</p>
        </div>
        <button onClick={handleSave} className="hidden sm:flex px-6 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl shadow-sm hover:bg-indigo-500 transition-all items-center gap-2">
          <Save size={16} /> Save Customer
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1 - Customer Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
            <Building2 size={18} className="text-indigo-600" />
            <h2 className="font-bold text-[#0f172a]">1. Customer Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Type <span className="text-rose-500">*</span></label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="radio" checked={customerType === 'Company'} onChange={() => setCustomerType('Company')} className="text-indigo-600 focus:ring-indigo-500" />
                  Company
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="radio" checked={customerType === 'Individual'} onChange={() => setCustomerType('Individual')} className="text-indigo-600 focus:ring-indigo-500" />
                  Individual
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                <option value="Active">Active</option>
                <option value="At Risk">At Risk</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Name <span className="text-rose-500">*</span></label>
              <input type="text" value={customerName} onChange={(e) => { setCustomerName(e.target.value); if(errors.customerName) setErrors({...errors, customerName: ''}); }} className={`w-full p-2.5 border ${errors.customerName ? 'border-rose-500' : 'border-slate-300'} rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`} placeholder="E.g. Acme Corporation" />
              {errors.customerName && <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.customerName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Code</label>
              <input type="text" value={customerCode} onChange={(e) => setCustomerCode(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="E.g. CUST-1001" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                <option value="">Select Industry...</option>
                <option value="Technology">Technology</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Website</label>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://www.example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Owner <span className="text-rose-500">*</span></label>
              <input type="text" value={ownerId} onChange={(e) => { setOwnerId(e.target.value); if(errors.ownerId) setErrors({...errors, ownerId: ''}); }} className={`w-full p-2.5 border ${errors.ownerId ? 'border-rose-500' : 'border-slate-300'} rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`} />
              {errors.ownerId && <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.ownerId}</p>}
            </div>
          </div>
        </div>

        {/* SECTION 2 - Primary Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
            <User size={18} className="text-indigo-600" />
            <h2 className="font-bold text-[#0f172a]">2. Primary Contact</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Name <span className="text-rose-500">*</span></label>
              <input type="text" value={contactName} onChange={(e) => { setContactName(e.target.value); if(errors.contactName) setErrors({...errors, contactName: ''}); }} className={`w-full p-2.5 border ${errors.contactName ? 'border-rose-500' : 'border-slate-300'} rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`} />
              {errors.contactName && <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.contactName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
              <input type="text" value={contactDesignation} onChange={(e) => setContactDesignation(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="E.g. Procurement Manager" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email <span className="text-rose-500">*</span></label>
              <input type="email" value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); if(errors.contactEmail) setErrors({...errors, contactEmail: ''}); }} className={`w-full p-2.5 border ${errors.contactEmail ? 'border-rose-500' : 'border-slate-300'} rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`} placeholder="contact@company.com" />
              {errors.contactEmail && <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.contactEmail}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone <span className="text-rose-500">*</span></label>
              <input type="tel" value={contactPhone} onChange={(e) => { setContactPhone(e.target.value); if(errors.contactPhone) setErrors({...errors, contactPhone: ''}); }} className={`w-full p-2.5 border ${errors.contactPhone ? 'border-rose-500' : 'border-slate-300'} rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`} placeholder="+1 555-0100" />
              {errors.contactPhone && <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.contactPhone}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Alternate Phone</label>
              <input type="tel" value={contactAlternatePhone} onChange={(e) => setContactAlternatePhone(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
        </div>

        {/* SECTIONS 3 & 4 - Addresses */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
            <MapPin size={18} className="text-indigo-600" />
            <h2 className="font-bold text-[#0f172a]">3 & 4. Addresses</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Billing */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0f172a] border-b border-slate-200 pb-2">Billing Address</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
                <textarea rows={2} value={billingAddress.address} onChange={(e) => handleAddressChange('billing', 'address', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                  <input type="text" value={billingAddress.city} onChange={(e) => handleAddressChange('billing', 'city', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">State/Province</label>
                  <input type="text" value={billingAddress.state} onChange={(e) => handleAddressChange('billing', 'state', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Postal Code</label>
                  <input type="text" value={billingAddress.postalCode} onChange={(e) => handleAddressChange('billing', 'postalCode', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Country</label>
                  <input type="text" value={billingAddress.country} onChange={(e) => handleAddressChange('billing', 'country', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-[#0f172a]">Shipping Address</h3>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={sameAsBilling} onChange={handleSameAsBillingToggle} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  Same as billing
                </label>
              </div>
              <div className={sameAsBilling ? 'opacity-50 pointer-events-none' : ''}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
                  <textarea rows={2} value={shippingAddress.address} onChange={(e) => handleAddressChange('shipping', 'address', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" readOnly={sameAsBilling}></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                    <input type="text" value={shippingAddress.city} onChange={(e) => handleAddressChange('shipping', 'city', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" readOnly={sameAsBilling} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">State/Province</label>
                    <input type="text" value={shippingAddress.state} onChange={(e) => handleAddressChange('shipping', 'state', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" readOnly={sameAsBilling} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Postal Code</label>
                    <input type="text" value={shippingAddress.postalCode} onChange={(e) => handleAddressChange('shipping', 'postalCode', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" readOnly={sameAsBilling} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Country</label>
                    <input type="text" value={shippingAddress.country} onChange={(e) => handleAddressChange('shipping', 'country', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" readOnly={sameAsBilling} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTIONS 5 & 6 - Compliance and Finance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              <h2 className="font-bold text-[#0f172a]">5. Tax & Compliance</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tax ID / PAN</label>
                <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">GST / VAT Number</label>
                <input type="text" value={gstVatNumber} onChange={(e) => setGstVatNumber(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">KYC Status</label>
                <select value={kycStatus} onChange={(e) => setKycStatus(e.target.value as any)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
              <Banknote size={18} className="text-indigo-600" />
              <h2 className="font-bold text-[#0f172a]">6. Financial Info</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Credit Limit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                  <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Terms</label>
                <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 7 - Additional Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
            <Tag size={18} className="text-indigo-600" />
            <h2 className="font-bold text-[#0f172a]">7. Additional Information</h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Add any background context or internal notes..."></textarea>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Attachments</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <FileText className="text-slate-400 mb-2" size={24} />
                <p className="text-sm font-semibold text-indigo-600 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500">SVG, PNG, JPG, PDF or DOC (max. 10MB)</p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="flex justify-end gap-3 pt-6 pb-12">
          <button type="button" onClick={() => onViewChange('customers')} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl shadow-sm hover:bg-indigo-500 transition-all flex items-center gap-2">
            <Save size={16} /> Save Customer
          </button>
        </div>

      </form>
    </div>
  );
};
