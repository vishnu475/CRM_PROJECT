import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Star, 
  CreditCard, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  Tag
} from 'lucide-react';
import { Vendor } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorToEdit?: Vendor | null;
  onSuccess?: (vendor: Vendor) => void;
}

const CATEGORIES = [
  'General',
  'Cloud Services',
  'Hardware',
  'Software',
  'Office Supplies',
  'Raw Materials',
  'Logistics',
  'Services',
  'Consulting'
];

const PAYMENT_TERMS = [
  'Immediate / Advance',
  'Net 15 Days',
  'Net 30 Days',
  'Net 45 Days',
  'Net 60 Days'
];

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  vendorToEdit,
  onSuccess,
}) => {
  const { addVendor, updateVendor } = useApp();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Suspended' | 'Archived'>('Active');
  const [website, setWebsite] = useState('');
  const [rating, setRating] = useState<number>(4.5);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (vendorToEdit) {
        setCode(vendorToEdit.code || vendorToEdit.id);
        setName(vendorToEdit.name || '');
        setCategory(vendorToEdit.category || 'General');
        setContactPerson(vendorToEdit.contactPerson || vendorToEdit.contact_person || '');
        setEmail(vendorToEdit.email || '');
        setPhone(vendorToEdit.phone || '');
        setAddress(vendorToEdit.address || '');
        setGstin(vendorToEdit.gstin || '');
        setPaymentTerms(vendorToEdit.paymentTerms || vendorToEdit.payment_terms || 'Net 30 Days');
        setStatus(vendorToEdit.status || 'Active');
        setWebsite(vendorToEdit.website || '');
        setRating(vendorToEdit.rating || 4.5);
        setNotes(vendorToEdit.notes || '');
      } else {
        const generatedCode = `VND-${Math.floor(100 + Math.random() * 900)}`;
        setCode(generatedCode);
        setName('');
        setCategory('General');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setAddress('');
        setGstin('');
        setPaymentTerms('Net 30 Days');
        setStatus('Active');
        setWebsite('');
        setRating(4.5);
        setNotes('');
      }
      setError(null);
    }
  }, [isOpen, vendorToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vendor / Company name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (vendorToEdit) {
        await updateVendor(vendorToEdit.id, {
          name: name.trim(),
          category,
          contactPerson: contactPerson.trim() || 'Procurement Rep',
          contact_person: contactPerson.trim() || 'Procurement Rep',
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          gstin: gstin.trim(),
          paymentTerms,
          payment_terms: paymentTerms,
          status,
          website: website.trim(),
          rating: Number(rating),
          notes: notes.trim(),
        });
        if (onSuccess) {
          onSuccess({
            ...vendorToEdit,
            name: name.trim(),
            category,
            contactPerson: contactPerson.trim() || 'Procurement Rep',
            contact_person: contactPerson.trim() || 'Procurement Rep',
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
            gstin: gstin.trim(),
            paymentTerms,
            payment_terms: paymentTerms,
            status,
            website: website.trim(),
            rating: Number(rating),
            notes: notes.trim(),
          });
        }
        onClose();
      } else {
        const created = await addVendor({
          code: code.trim(),
          name: name.trim(),
          category,
          contactPerson: contactPerson.trim() || 'Procurement Rep',
          contact_person: contactPerson.trim() || 'Procurement Rep',
          email: email.trim(),
          phone: phone.trim() || '+91 98000 00000',
          address: address.trim(),
          gstin: gstin.trim(),
          paymentTerms,
          payment_terms: paymentTerms,
          status,
          website: website.trim(),
          payableBalance: 0,
          payable_balance: 0,
          rating: Number(rating),
          notes: notes.trim(),
        });
        if (onSuccess && created) {
          onSuccess(created);
        }
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {vendorToEdit ? 'Edit Supplier Profile' : 'Register New Supplier'}
              </h2>
              <p className="text-xs text-teal-100 font-medium">
                {vendorToEdit ? `Updating profile for ${vendorToEdit.name}` : 'Add an authorized vendor for procurement & purchase orders'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Vendor Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={Boolean(vendorToEdit)}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. VND-005"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 disabled:opacity-75"
              />
            </div>

            {/* Vendor Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company / Supplier Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dell Technologies Ltd"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Contact Person
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Mark Miller"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sales@supplier.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Payment Terms
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  {PAYMENT_TERMS.map((pt) => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* GSTIN / Tax ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN / Tax Identification
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* Supplier Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Rating (1.0 - 5.0)
              </label>
              <div className="relative">
                <Star className="w-4 h-4 absolute left-3 top-2.5 text-amber-400 fill-amber-400" />
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(parseFloat(e.target.value) || 5.0)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. https://www.supplier.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Address / Facility Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Suite 400, Market St, San Francisco, CA"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Vendor Notes / Procurement Terms
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details about procurement contracts, lead times, key account reps..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : vendorToEdit ? 'Update Supplier' : 'Register Supplier'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
