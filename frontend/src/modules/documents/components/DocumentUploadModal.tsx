import React, { useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
  Tag,
  Calendar,
  Layers,
  Building,
  User,
  ShieldCheck
} from 'lucide-react';
import { DocumentType, DocumentCategory } from '../types';
import { documentApiService } from '../services/documentApiService';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userRole?: string;
  currentUser?: {
    id: string;
    empCode?: string;
    name: string;
    department?: string;
  };
  employeesList?: Array<{ emp_code: string; name: string; department: string }>;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userRole = 'Employee',
  currentUser,
  employeesList = []
}) => {
  const isEmployee = userRole === 'Employee';
  const isAdminOrHR = userRole === 'Executive' || userRole === 'Admin' || userRole === 'HRAdmin';

  const [documentName, setDocumentName] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [department, setDepartment] = useState(currentUser?.department || 'Engineering');
  const [ownerId, setOwnerId] = useState(currentUser?.empCode || currentUser?.id || 'EMP-001');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'department' | 'company' | 'public'>('company');
  const [submitImmediately, setSubmitImmediately] = useState(true);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Types & Categories
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedTypeObj, setSelectedTypeObj] = useState<DocumentType | null>(null);

  useEffect(() => {
    if (isOpen) {
      documentApiService.getDocumentTypes().then((types) => {
        setDocTypes(types);
        if (types.length > 0 && !documentTypeId) {
          setDocumentTypeId(types[0].id);
          setSelectedTypeObj(types[0]);
          if (types[0].category_id) setCategoryId(types[0].category_id);
        }
      }).catch(console.error);

      documentApiService.getCategories().then(setCategories).catch(console.error);

      // Default owner
      setOwnerId(currentUser?.empCode || currentUser?.id || 'EMP-001');
      setDepartment(currentUser?.department || 'Engineering');
      if (isEmployee) setVisibility('private');
    }
  }, [isOpen, currentUser, isEmployee]);

  const handleTypeChange = (typeId: string) => {
    setDocumentTypeId(typeId);
    const found = docTypes.find((t) => t.id === typeId);
    setSelectedTypeObj(found || null);
    if (found?.category_id) {
      setCategoryId(found.category_id);
    }
    if (found?.scope === 'employee') {
      setVisibility('private');
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setFileError(null);

    // Validate size (max 25MB default or per type)
    const maxMb = selectedTypeObj?.max_file_size_mb || 25;
    if (file.size > maxMb * 1024 * 1024) {
      setFileError(`File size exceeds maximum allowed ${maxMb}MB.`);
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = selectedTypeObj?.allowed_file_types || ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'xlsx'];
    if (ext && allowed.length > 0 && !allowed.includes(ext)) {
      setFileError(`File format .${ext} not supported. Allowed: ${allowed.join(', ')}`);
      return;
    }

    setSelectedFile(file);
    if (!documentName) {
      setDocumentName(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }

    // Read as Data URL
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentName || !documentTypeId || !selectedFile || !fileDataUrl) {
      alert('Please fill all required fields and choose a file.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(25);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      setUploadProgress(65);

      await documentApiService.createDocument({
        document_name: documentName,
        document_type_id: documentTypeId,
        category_id: categoryId,
        department,
        owner_id: ownerId,
        description,
        tags,
        expiry_date: expiryDate || null,
        visibility,
        file_name: selectedFile.name,
        file_data: fileDataUrl,
        submit_immediately: submitImmediately
      });

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        onSuccess();
        onClose();
      }, 400);
    } catch (err: any) {
      setIsUploading(false);
      alert(`Upload failed: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="text-blue-600" size={20} />
              Upload Enterprise Document
            </h3>
            <p className="text-xs text-slate-500">
              Upload statutory, corporate, or employee documents with metadata & access control.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              File Attachment *
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                selectedFile
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20'
              }`}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.xls"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />

              {selectedFile ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-sm">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {(selectedFile.size / 1048576).toFixed(2)} MB • Click to change
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <UploadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                  <p className="text-xs font-bold text-slate-800">
                    Click to browse or drag and drop document
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    PDF, JPEG, PNG, DOCX, XLSX (Max 25MB)
                  </p>
                </div>
              )}
            </div>
            {fileError && (
              <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle size={13} /> {fileError}
              </p>
            )}
          </div>

          {/* Document Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Document Name *
            </label>
            <input
              type="text"
              required
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g. B.Tech Degree Certificate or Q2 Financial Audit"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Type & Category row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Document Type *
              </label>
              <select
                value={documentTypeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {docTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.approval_required ? '(Approval Req.)' : ''}
                  </option>
                ))}
              </select>
              {selectedTypeObj?.approval_required && (
                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                  <ShieldCheck size={12} /> HR / Manager Verification required
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.scope})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Owner & Department row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Document Owner *
              </label>
              {isEmployee ? (
                <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <Lock size={13} className="text-slate-400" />
                  <span className="font-semibold">{currentUser?.name || 'Logged-in Employee'}</span>
                  <span className="text-[10px] text-slate-400">({ownerId})</span>
                </div>
              ) : (
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value={currentUser?.empCode || 'EMP-001'}>
                    Self ({currentUser?.name || 'Administrator'})
                  </option>
                  {employeesList.map((emp) => (
                    <option key={emp.emp_code} value={emp.emp_code}>
                      {emp.name} ({emp.emp_code}) - {emp.department}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering / HR / Finance"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Expiry Date & Visibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Visibility / Access Level
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="private">Private (Owner, HR & Admin only)</option>
                <option value="department">Department (My Department)</option>
                <option value="company">Company Wide</option>
                <option value="public">Public Official Policy</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about the document contents or statutory purpose..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Search Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Identity, PAN, Statutory, Onboarding"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Submit immediately checkbox */}
          {selectedTypeObj?.approval_required && (
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center space-x-3">
              <input
                type="checkbox"
                id="submit-now"
                checked={submitImmediately}
                onChange={(e) => setSubmitImmediately(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="submit-now" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Submit directly for verification review (sets status to Pending Review)
              </label>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-blue-600">
                <span>Uploading & Encrypting...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || !selectedFile}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud size={15} />
            {isUploading ? 'Uploading...' : 'Save & Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};
