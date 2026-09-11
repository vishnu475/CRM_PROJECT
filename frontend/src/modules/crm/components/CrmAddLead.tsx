import React, { useState, useMemo, useRef } from 'react';
import { CrmView, Lead, Employee, LeadAttachment } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { LeadsAPI } from '../../../services/apiService';
import { 
  ChevronRight, Save, Plus, ArrowLeft, CheckCircle2, AlertCircle, 
  UploadCloud, FileText, Image as FileImage, Trash2, ExternalLink, Loader2, Lock
} from 'lucide-react';

interface CrmAddLeadProps {
  onViewChange: (view: CrmView) => void;
}

interface PendingAttachmentItem {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'failed';
  url?: string;
  errorMessage?: string;
}

const ALLOWED_EXTS = ['svg', 'png', 'jpg', 'jpeg', 'pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Validation Regex Patterns
const LEAD_NAME_REGEX = /^[a-zA-Z\s\-'.]+$/;
const COMPANY_REGEX = /^[a-zA-Z0-9\s&.\-',()/#]+$/;
const CAMPAIGN_REGEX = /^[a-zA-Z0-9\s&_\-',()]+$/;
const CONTACT_PERSON_REGEX = /^[a-zA-Z\s\-'.]+$/;
const DESIGNATION_REGEX = /^[a-zA-Z0-9\s\-'.&/,()]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const POSTAL_CODE_REGEX = /^(?:[1-9][0-9]{5}|[a-zA-Z0-9\s-]{3,10})$/;
const CITY_STATE_REGEX = /^[a-zA-Z\s\-'.]+$/;
const COUNTRY_REGEX = /^[a-zA-Z\s\-]+$/;

function isValidUrl(urlString: string): boolean {
  if (!urlString) return true;
  const trimmed = urlString.trim();
  if (trimmed.length > 250) return false;
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return false;
  try {
    const candidate = trimmed.startsWith('http://') || trimmed.startsWith('https://') 
      ? trimmed 
      : `https://${trimmed}`;
    const parsed = new URL(candidate);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch (e) {
    return false;
  }
}

function normalizeUrl(urlString: string): string {
  if (!urlString) return '';
  const trimmed = urlString.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const CrmAddLead: React.FC<CrmAddLeadProps> = ({ onViewChange }) => {
  const { addLead, employees } = useApp();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Attachments state
  const [attachments, setAttachments] = useState<PendingAttachmentItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter only Confirmed HRMS employees eligible for Lead assignment
  const eligibleEmployees = useMemo(() => {
    return employees.filter(
      (emp: Employee) => (emp.status || '').toLowerCase() === 'confirmed'
    );
  }, [employees]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    industry: '',
    source: '',
    campaign: '',
    contactPerson: '',
    designation: '',
    contactRole: 'Decision Maker',
    email: '',
    phone: '',
    alternatePhone: '',
    website: '',
    stage: 'New' as Lead['stage'],
    score: 50,
    expectedDealValue: '',
    expectedCloseDate: '',
    assignedTo: '',
    assignedToEmployeeId: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    requirement: '',
    notes: '',
    tags: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const uploadSingleAttachment = async (file: File, tempId: string) => {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const res = await LeadsAPI.uploadAttachment({
        fileName: file.name,
        fileData: dataUrl,
        fileSize: file.size,
        fileType: file.type,
      });

      if (res.success && res.data) {
        setAttachments(prev => prev.map(item => item.id === tempId ? {
          ...item,
          id: res.data.id,
          url: res.data.url,
          status: 'uploaded',
          errorMessage: undefined,
        } : item));
      } else {
        throw new Error(res.message || 'Upload failed');
      }
    } catch (err: any) {
      setAttachments(prev => prev.map(item => item.id === tempId ? {
        ...item,
        status: 'failed',
        errorMessage: err.message || 'Upload failed. Please try again.'
      } : item));
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const newErrors: string[] = [];

    for (const file of fileArray) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      // 1. Check extension
      if (!ALLOWED_EXTS.includes(ext)) {
        newErrors.push(`"${file.name}": Unsupported file type. Please upload SVG, PNG, JPG, JPEG, or PDF.`);
        continue;
      }

      // 2. Check size
      if (file.size > MAX_SIZE_BYTES) {
        newErrors.push(`"${file.name}": File size must be 10 MB or less.`);
        continue;
      }

      // 3. Create pending item and start upload
      const tempId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const pendingItem: PendingAttachmentItem = {
        id: tempId,
        file,
        name: file.name,
        size: file.size,
        type: ext.toUpperCase(),
        status: 'uploading',
      };

      setAttachments(prev => [...prev, pendingItem]);
      uploadSingleAttachment(file, tempId);
    }

    if (newErrors.length > 0) {
      setAttachmentErrors(newErrors);
      setTimeout(() => setAttachmentErrors([]), 8000);
    }

    // Reset hidden input value so re-selecting same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = (item: PendingAttachmentItem) => {
    if (!item.file) return;
    setAttachments(prev => prev.map(a => a.id === item.id ? { ...a, status: 'uploading', errorMessage: undefined } : a));
    uploadSingleAttachment(item.file, item.id);
  };

  const handleRemove = async (item: PendingAttachmentItem) => {
    setAttachments(prev => prev.filter(a => a.id !== item.id));
    if (item.url) {
      const filename = item.url.split('/').pop();
      if (filename) {
        try {
          await LeadsAPI.deleteAttachment(filename);
        } catch (e) {
          console.warn('Failed to delete uncommitted attachment file:', e);
        }
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // 1. Lead Name
    const nameTrimmed = formData.name.trim();
    if (!nameTrimmed) {
      newErrors.name = 'Lead name is required.';
    } else if (nameTrimmed.length > 100) {
      newErrors.name = 'Lead name cannot exceed 100 characters.';
    } else if (!LEAD_NAME_REGEX.test(nameTrimmed)) {
      newErrors.name = 'Lead name can only contain letters, spaces, hyphens, periods, and apostrophes (no numbers).';
    }

    // 2. Company
    const companyTrimmed = formData.company.trim();
    if (companyTrimmed) {
      if (companyTrimmed.length > 150) {
        newErrors.company = 'Company name cannot exceed 150 characters.';
      } else if (!COMPANY_REGEX.test(companyTrimmed) || /[\x00-\x1F\x7F]/.test(companyTrimmed)) {
        newErrors.company = 'Company name contains invalid characters.';
      }
    }

    // 3. Lead Source
    if (!formData.source) {
      newErrors.source = 'Please select a lead source.';
    }

    // 4. Campaign
    const campaignTrimmed = formData.campaign.trim();
    if (campaignTrimmed) {
      if (campaignTrimmed.length > 150) {
        newErrors.campaign = 'Campaign name cannot exceed 150 characters.';
      } else if (!CAMPAIGN_REGEX.test(campaignTrimmed)) {
        newErrors.campaign = 'Campaign can only contain letters, numbers, spaces, and - _ & ( ) \'.';
      }
    }

    // 5. Contact Person
    const contactPersonTrimmed = formData.contactPerson.trim();
    if (!contactPersonTrimmed) {
      newErrors.contactPerson = 'Contact person is required.';
    } else if (contactPersonTrimmed.length > 100) {
      newErrors.contactPerson = 'Contact person cannot exceed 100 characters.';
    } else if (!CONTACT_PERSON_REGEX.test(contactPersonTrimmed)) {
      newErrors.contactPerson = 'Contact person can only contain letters, spaces, hyphens, periods, and apostrophes (no numbers).';
    }

    // 6. Designation
    const designationTrimmed = formData.designation.trim();
    if (!designationTrimmed) {
      newErrors.designation = 'Designation is required.';
    } else if (designationTrimmed.length > 100) {
      newErrors.designation = 'Designation cannot exceed 100 characters.';
    } else if (/^\d+$/.test(designationTrimmed)) {
      newErrors.designation = 'Designation cannot be numbers only.';
    } else if (!DESIGNATION_REGEX.test(designationTrimmed)) {
      newErrors.designation = 'Designation contains invalid characters.';
    }

    // 7. Contact Role
    if (!formData.contactRole) {
      newErrors.contactRole = 'Contact role is required.';
    }

    // 8. Email
    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      newErrors.email = 'Email address is required.';
    } else if (emailTrimmed.length > 254 || /\s/.test(emailTrimmed) || !EMAIL_REGEX.test(emailTrimmed)) {
      newErrors.email = 'Enter a valid email address.';
    }

    // 9. Phone (India 10-digit mobile rule: 6/7/8/9 + 9 digits)
    const phoneTrimmed = formData.phone.trim();
    if (phoneTrimmed) {
      if (!PHONE_REGEX.test(phoneTrimmed)) {
        newErrors.phone = 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
      }
    }

    // 10. Alternate Phone
    const altPhoneTrimmed = formData.alternatePhone.trim();
    if (altPhoneTrimmed) {
      if (!PHONE_REGEX.test(altPhoneTrimmed)) {
        newErrors.alternatePhone = 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
      } else if (phoneTrimmed && altPhoneTrimmed === phoneTrimmed) {
        newErrors.alternatePhone = 'Alternate phone must be different from primary phone.';
      }
    }

    // 11. Website
    const websiteTrimmed = formData.website.trim();
    if (websiteTrimmed) {
      if (!isValidUrl(websiteTrimmed)) {
        newErrors.website = 'Enter a valid website URL (e.g., https://example.com).';
      }
    }

    // 12. Lead Score
    const scoreVal = Number(formData.score);
    if (isNaN(scoreVal) || !Number.isInteger(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      newErrors.score = 'Score must be an integer between 0 and 100.';
    }

    // 13. Expected Deal Value
    if (formData.expectedDealValue !== '') {
      const dealVal = Number(formData.expectedDealValue);
      if (isNaN(dealVal) || dealVal < 0) {
        newErrors.expectedDealValue = 'Expected deal value must be a valid positive number.';
      }
    }

    // 14. Expected Close Date
    const closeDateTrimmed = formData.expectedCloseDate.trim();
    if (closeDateTrimmed) {
      if (closeDateTrimmed < todayStr) {
        newErrors.expectedCloseDate = 'Select today or a future date.';
      }
    }

    // 15. Assigned To HRMS Confirmed Employee
    if (!formData.assignedTo && !formData.assignedToEmployeeId) {
      newErrors.assignedTo = 'Please select an eligible Confirmed HRMS employee.';
    }

    // 16. Address
    const addressTrimmed = formData.address.trim();
    if (addressTrimmed) {
      if (addressTrimmed.length > 250) {
        newErrors.address = 'Address cannot exceed 250 characters.';
      } else if (/[\x00-\x1F\x7F]/.test(addressTrimmed)) {
        newErrors.address = 'Address contains invalid control characters.';
      }
    }

    // 17. City, State, Country
    const cityTrimmed = formData.city.trim();
    if (cityTrimmed) {
      if (cityTrimmed.length > 100) {
        newErrors.city = 'City cannot exceed 100 characters.';
      } else if (/^\d+$/.test(cityTrimmed) || !CITY_STATE_REGEX.test(cityTrimmed)) {
        newErrors.city = 'City must contain valid text characters (no numbers).';
      }
    }

    const stateTrimmed = formData.state.trim();
    if (stateTrimmed) {
      if (stateTrimmed.length > 100) {
        newErrors.state = 'State cannot exceed 100 characters.';
      } else if (/^\d+$/.test(stateTrimmed) || !CITY_STATE_REGEX.test(stateTrimmed)) {
        newErrors.state = 'State must contain valid text characters (no numbers).';
      }
    }

    const countryTrimmed = formData.country.trim();
    if (countryTrimmed) {
      if (countryTrimmed.length > 100) {
        newErrors.country = 'Country cannot exceed 100 characters.';
      } else if (/^\d+$/.test(countryTrimmed) || !COUNTRY_REGEX.test(countryTrimmed)) {
        newErrors.country = 'Country must contain valid text characters (no numbers).';
      }
    }

    // 18. Postal Code
    const postalTrimmed = formData.postalCode.trim();
    if (postalTrimmed) {
      if (postalTrimmed.length > 10 || !POSTAL_CODE_REGEX.test(postalTrimmed) || !/[a-zA-Z0-9]/.test(postalTrimmed)) {
        newErrors.postalCode = 'Enter a valid postal code (e.g., 530001 or 3-10 alphanumeric characters).';
      }
    }

    // 19. Project Requirements & Notes
    const reqTrimmed = formData.requirement.trim();
    if (reqTrimmed) {
      if (reqTrimmed.length > 5000) {
        newErrors.requirement = 'Project requirement cannot exceed 5000 characters.';
      } else if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(reqTrimmed)) {
        newErrors.requirement = 'Malicious script tags are not allowed.';
      }
    }

    const notesTrimmed = formData.notes.trim();
    if (notesTrimmed && notesTrimmed.length > 3000) {
      newErrors.notes = 'Notes cannot exceed 3000 characters.';
    }

    setErrors(newErrors);

    // If invalid, focus and scroll to first error field
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0];
      const targetElement = document.querySelector(`[name="${firstField}"]`) as HTMLElement | null;
      if (targetElement) {
        targetElement.focus();
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  };

  const handleSave = (addAnother: boolean) => {
    if (!validate()) return;

    try {
      const validAttachments: LeadAttachment[] = attachments
        .filter(a => a.status === 'uploaded' && a.url)
        .map(a => ({
          id: a.id,
          name: a.name,
          originalName: a.name,
          url: a.url!,
          type: a.type,
          size: a.size,
          uploadedAt: new Date().toISOString(),
        }));

      // Parse and deduplicate tags
      const cleanTags = formData.tags
        ? Array.from(new Set(
            formData.tags
              .split(',')
              .map(t => t.replace(/<[^>]*>?/gm, '').trim())
              .filter(t => t.length > 0 && t.length <= 50)
          ))
        : [];

      addLead({
        name: formData.name.trim(),
        company: formData.company.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        value: formData.expectedDealValue !== '' ? Number(formData.expectedDealValue) : 0,
        stage: 'New', // Always locked to 'New'
        score: Number(formData.score) || 50,
        source: formData.source.trim(),
        assignedTo: formData.assignedTo.trim(),
        assignedToEmployeeId: formData.assignedToEmployeeId.trim(),
        industry: formData.industry.trim(),
        campaign: formData.campaign.trim(),
        contactPerson: formData.contactPerson.trim(),
        designation: formData.designation.trim(),
        contactRole: formData.contactRole.trim(),
        alternatePhone: formData.alternatePhone.trim(),
        website: normalizeUrl(formData.website),
        expectedCloseDate: formData.expectedCloseDate.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        postalCode: formData.postalCode.trim(),
        requirement: formData.requirement.trim(),
        notes: formData.notes.trim(),
        tags: cleanTags,
        attachments: validAttachments,
      });

      showToast('Lead and linked Contact created successfully.', 'success');

      if (addAnother) {
        setFormData({ 
          name: '', 
          company: '', 
          industry: '',
          source: '',
          campaign: '',
          contactPerson: '',
          designation: '',
          contactRole: 'Decision Maker',
          email: '', 
          phone: '', 
          alternatePhone: '',
          website: '',
          stage: 'New',
          score: 50,
          expectedDealValue: '', 
          expectedCloseDate: '',
          assignedTo: '',
          assignedToEmployeeId: '',
          address: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          requirement: '', 
          notes: '', 
          tags: '' 
        });
        setAttachments([]);
        setAttachmentErrors([]);
        setErrors({});
      } else {
        setTimeout(() => onViewChange('overview'), 1000);
      }
    } catch (err) {
      showToast('Unable to create lead. Please try again.', 'error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Specific digit-only typing and paste handler for phone fields
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, field: 'phone' | 'alternatePhone') => {
    const rawVal = e.target.value;
    // Allow only digits, max 10 characters
    const digitsOnly = rawVal.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, [field]: digitsOnly }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>, field: 'phone' | 'alternatePhone') => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, [field]: digitsOnly }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Score slider/number change
  const handleScoreChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '');
    let num = cleanDigits === '' ? 0 : parseInt(cleanDigits, 10);
    if (num > 100) num = 100;
    if (num < 0) num = 0;
    setFormData(prev => ({ ...prev, score: num }));
    if (errors.score) {
      setErrors(prev => ({ ...prev, score: '' }));
    }
  };

  // Deal value input (allow digits and one decimal)
  const handleDealValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Allow positive numbers and decimals
    if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) {
      setFormData(prev => ({ ...prev, expectedDealValue: rawVal }));
      if (errors.expectedDealValue) {
        setErrors(prev => ({ ...prev, expectedDealValue: '' }));
      }
    }
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    const emp = eligibleEmployees.find((em: Employee) => em.id === empId || em.empCode === empId);
    setFormData(prev => ({
      ...prev,
      assignedToEmployeeId: empId,
      assignedTo: emp ? emp.name : '',
    }));
    if (errors.assignedTo) {
      setErrors(prev => ({ ...prev, assignedTo: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'} animate-in fade-in slide-in-from-bottom-5 duration-200`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-1 font-medium">
            <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('overview')}>CRM</span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('leads')}>Leads</span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="text-[#0f172a]">Add Lead</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Add New Lead</h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button type="button" onClick={() => onViewChange('leads')} className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-sm rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none">
            <ArrowLeft size={16} /> Cancel
          </button>
          <button type="button" onClick={() => handleSave(true)} className="px-4 py-2 border border-indigo-600 text-indigo-600 font-semibold text-sm rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none">
            <Plus size={16} /> Save & Add Another
          </button>
          <button type="button" onClick={() => handleSave(false)} className="px-5 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-none">
            <Save size={16} /> Save Lead
          </button>
        </div>
      </div>

      {/* FORM SECTIONS */}
      <div className="space-y-6">

        {/* SECTION 1: LEAD DETAILS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Lead Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Lead Name <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                name="name" 
                maxLength={100}
                value={formData.name} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`} 
                placeholder="e.g. Sunny / Priya Sharma" 
              />
              {errors.name && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Company</label>
              <input 
                type="text" 
                name="company" 
                maxLength={150}
                value={formData.company} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.company ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`} 
                placeholder="e.g. 3M India / Apex Solutions" 
              />
              {errors.company && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.company}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Industry</label>
              <select name="industry" value={formData.industry} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all">
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Lead Source <span className="text-rose-500">*</span></label>
              <select name="source" value={formData.source} onChange={handleChange} className={`w-full p-2.5 bg-slate-50 border ${errors.source ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`}>
                <option value="">Select Source</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Email Campaign">Email Campaign</option>
                <option value="Trade Show">Trade Show</option>
                <option value="Manual/Other">Manual / Other</option>
              </select>
              {errors.source && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.source}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Campaign</label>
              <input 
                type="text" 
                name="campaign" 
                maxLength={150}
                value={formData.campaign} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.campaign ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`} 
                placeholder="e.g. Q3 Growth Campaign / Google Ads 2026" 
              />
              {errors.campaign && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.campaign}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: PRIMARY CONTACT */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Primary Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Contact Person <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                name="contactPerson" 
                maxLength={100}
                value={formData.contactPerson} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.contactPerson ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`} 
                placeholder="e.g. Priya Sharma / John D'Souza" 
              />
              {errors.contactPerson && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.contactPerson}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Designation <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                name="designation" 
                maxLength={100}
                value={formData.designation} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.designation ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`} 
                placeholder="e.g. CTO / Tech Head / VP - Engineering" 
              />
              {errors.designation && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.designation}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Contact Role <span className="text-rose-500">*</span></label>
              <select name="contactRole" value={formData.contactRole} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all">
                <option value="Decision Maker">Decision Maker</option>
                <option value="Technical Evaluator">Technical Evaluator</option>
                <option value="Procurement">Procurement</option>
                <option value="Influencer">Influencer</option>
                <option value="End User">End User</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Email <span className="text-rose-500">*</span></label>
              <input 
                type="email" 
                name="email" 
                maxLength={254}
                value={formData.email} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.email ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`} 
                placeholder="e.g. sunny@gmail.com" 
              />
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.email}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">
                Phone <span className="text-xs font-normal text-slate-500">(10-digit India mobile)</span>
              </label>
              <input 
                type="text" 
                name="phone" 
                maxLength={10}
                value={formData.phone} 
                onChange={(e) => handlePhoneInput(e, 'phone')} 
                onPaste={(e) => handlePhonePaste(e, 'phone')}
                className={`w-full p-2.5 bg-slate-50 border ${errors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`} 
                placeholder="e.g. 9848454737" 
              />
              {errors.phone && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">
                Alternate Phone <span className="text-xs font-normal text-slate-500">(10-digit India mobile)</span>
              </label>
              <input 
                type="text" 
                name="alternatePhone" 
                maxLength={10}
                value={formData.alternatePhone} 
                onChange={(e) => handlePhoneInput(e, 'alternatePhone')} 
                onPaste={(e) => handlePhonePaste(e, 'alternatePhone')}
                className={`w-full p-2.5 bg-slate-50 border ${errors.alternatePhone ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`} 
                placeholder="e.g. 9876543210" 
              />
              {errors.alternatePhone && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.alternatePhone}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Website</label>
              <input 
                type="text" 
                name="website" 
                maxLength={250}
                value={formData.website} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.website ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`} 
                placeholder="e.g. https://example.com" 
              />
              {errors.website && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.website}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: QUALIFICATION & ASSIGNMENT */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Qualification & Assignment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-[#0f172a]">Stage</label>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                  <Lock size={11} /> Locked for new leads
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="stage"
                  value="New"
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 cursor-not-allowed select-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Lead Score (0-100)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={formData.score} 
                  onChange={(e) => handleScoreChange(e.target.value)} 
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                />
                <input 
                  type="text" 
                  name="score" 
                  maxLength={3}
                  value={formData.score} 
                  onChange={(e) => handleScoreChange(e.target.value)} 
                  className={`w-20 p-2.5 bg-slate-50 border ${errors.score ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-center font-semibold`} 
                />
              </div>
              {errors.score && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.score}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Expected Deal Value (₹)</label>
              <input 
                type="text" 
                name="expectedDealValue" 
                value={formData.expectedDealValue} 
                onChange={handleDealValueChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.expectedDealValue ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all`} 
                placeholder="e.g. 50000 or 350000.50"
              />
              {errors.expectedDealValue && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.expectedDealValue}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Expected Close Date</label>
              <input 
                type="date" 
                name="expectedCloseDate" 
                min={todayStr}
                value={formData.expectedCloseDate} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.expectedCloseDate ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all`} 
              />
              {errors.expectedCloseDate && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.expectedCloseDate}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-[#0f172a]">
                  Assigned To (HRMS Confirmed) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {eligibleEmployees.length} Confirmed
                </span>
              </div>
              <select
                name="assignedTo"
                value={formData.assignedToEmployeeId}
                onChange={handleEmployeeChange}
                className={`w-full p-2.5 bg-slate-50 border ${errors.assignedTo ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'} rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`}
              >
                <option value="">-- Select Confirmed HRMS Employee --</option>
                {eligibleEmployees.map((emp: Employee) => (
                  <option key={emp.empCode || emp.id} value={emp.empCode || emp.id}>
                    {emp.name} ({emp.empCode || emp.id}) • {emp.department} • {emp.designation}
                  </option>
                ))}
              </select>
              {errors.assignedTo && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.assignedTo}
                </p>
              )}
              {eligibleEmployees.length === 0 && (
                <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-2 rounded border border-amber-200">
                  No confirmed employees available in HRMS Employee Directory. Only employees with 'Confirmed' lifecycle status are eligible for lead assignments.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: ADDRESS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Address</label>
              <input 
                type="text" 
                name="address" 
                maxLength={250}
                value={formData.address} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.address ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all`} 
                placeholder="e.g. 12-4-55, MVP Colony / Flat #204, Main Road"
              />
              {errors.address && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.address}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">City</label>
              <input 
                type="text" 
                name="city" 
                maxLength={100}
                value={formData.city} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.city ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all`} 
                placeholder="e.g. Visakhapatnam / Bengaluru"
              />
              {errors.city && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.city}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">State</label>
              <input 
                type="text" 
                name="state" 
                maxLength={100}
                value={formData.state} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.state ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all`} 
                placeholder="e.g. Andhra Pradesh / California"
              />
              {errors.state && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.state}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Country</label>
              <input 
                type="text" 
                name="country" 
                maxLength={100}
                value={formData.country} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.country ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all`} 
                placeholder="e.g. India / United States"
              />
              {errors.country && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.country}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Postal Code</label>
              <input 
                type="text" 
                name="postalCode" 
                maxLength={10}
                value={formData.postalCode} 
                onChange={handleChange} 
                className={`w-full p-2.5 bg-slate-50 border ${errors.postalCode ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all`} 
                placeholder="e.g. 530001 or 90210"
              />
              {errors.postalCode && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.postalCode}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5: PROJECT REQUIREMENTS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Project Requirements</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Project Requirement</label>
              <textarea
                name="requirement"
                maxLength={5000}
                value={formData.requirement}
                onChange={handleChange}
                rows={6}
                className={`w-full p-3 bg-slate-50 border ${errors.requirement ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all leading-relaxed`}
                placeholder="Describe what the customer needs, including the project scope, business requirements, modules, features, expected deliverables, etc."
              ></textarea>
              {errors.requirement && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.requirement}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Project Notes</label>
              <textarea
                name="notes"
                maxLength={3000}
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className={`w-full p-2.5 bg-slate-50 border ${errors.notes ? 'border-rose-400' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all`}
                placeholder="Enter any additional project or internal notes about this lead..."
              ></textarea>
              {errors.notes && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.notes}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-1">Tags</label>
              <input 
                type="text" 
                name="tags" 
                value={formData.tags} 
                onChange={handleChange} 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" 
                placeholder="ERP, CRM, Enterprise, Priority" 
              />
            </div>

            {/* ATTACHMENTS UPLOAD AREA */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-[#0f172a]">Attachments</label>
                {attachments.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium">
                    {attachments.filter(a => a.status === 'uploaded').length} uploaded
                  </span>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".svg,.png,.jpg,.jpeg,.pdf,image/svg+xml,image/png,image/jpeg,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFiles(e.target.files);
                  }
                }}
              />

              {/* Drop Zone */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload lead attachments"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  if (e.dataTransfer.files) {
                    handleFiles(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer select-none outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/90 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border mb-3 transition-colors ${
                  isDragging ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  <UploadCloud size={22} className={isDragging ? 'text-indigo-600 animate-bounce' : 'text-slate-400'} />
                </div>
                <p className="text-sm font-semibold text-[#0f172a]">
                  {isDragging ? 'Drop files here to upload' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  SVG, PNG, JPG or PDF (max. 10MB)
                </p>
              </div>

              {/* Validation Error Notices */}
              {attachmentErrors.length > 0 && (
                <div className="mt-3 space-y-1.5 animate-in fade-in">
                  {attachmentErrors.map((errMsg, idx) => (
                    <div key={idx} className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                      <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>{errMsg}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded Attachments List */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Attached Documents & Files ({attachments.length})
                  </h4>
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          att.type === 'PDF' 
                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          {att.type === 'PDF' ? <FileText size={18} /> : <FileImage size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md" title={att.name}>
                            {att.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-semibold uppercase text-slate-600">{att.type}</span>
                            <span>•</span>
                            <span>{formatFileSize(att.size)}</span>
                            <span>•</span>
                            {att.status === 'uploading' && (
                              <span className="text-indigo-600 font-semibold flex items-center gap-1">
                                <Loader2 size={11} className="animate-spin" /> Uploading...
                              </span>
                            )}
                            {att.status === 'uploaded' && (
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 size={12} /> Uploaded ✓
                              </span>
                            )}
                            {att.status === 'failed' && (
                              <span className="text-rose-600 font-semibold flex items-center gap-1">
                                <AlertCircle size={12} /> {att.errorMessage || 'Upload failed'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {att.status === 'failed' && (
                          <button
                            type="button"
                            onClick={() => handleRetry(att)}
                            className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                          >
                            Retry
                          </button>
                        )}
                        {att.status === 'uploaded' && att.url && (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition"
                            title="View or Download attachment"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemove(att)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove attachment"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
