import React, { useState, useEffect } from 'react';
import { X, Settings, Plus, Layers, FileCheck, Check, Edit2, AlertCircle } from 'lucide-react';
import { DocumentType, DocumentCategory } from '../types';
import { documentApiService } from '../services/documentApiService';

interface DocumentAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentAdminModal: React.FC<DocumentAdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'types' | 'categories'>('types');
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showAddType, setShowAddType] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);

  // New Type Form
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [typeCategory, setTypeCategory] = useState('');
  const [typeScope, setTypeScope] = useState<'company' | 'employee' | 'both'>('employee');
  const [typeApprovalReq, setTypeApprovalReq] = useState(true);
  const [typeExpirySup, setTypeExpirySup] = useState(false);

  // New Cat Form
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catScope, setCatScope] = useState<'company' | 'employee' | 'both'>('both');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [t, c] = await Promise.all([
        documentApiService.getDocumentTypes(),
        documentApiService.getCategories()
      ]);
      setDocTypes(t);
      setCategories(c);
      if (c.length > 0 && !typeCategory) setTypeCategory(c[0].id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await documentApiService.saveDocumentType({
        name: typeName,
        code: typeCode.toUpperCase().replace(/\s+/g, '_'),
        category_id: typeCategory,
        scope: typeScope,
        approval_required: typeApprovalReq,
        expiry_supported: typeExpirySup,
        allowed_file_types: ['pdf', 'png', 'jpg', 'jpeg', 'docx'],
        max_file_size_mb: 25,
        is_active: true
      });
      setShowAddType(false);
      setTypeName('');
      setTypeCode('');
      await loadData();
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await documentApiService.saveCategory({
        name: catName,
        code: catCode.toUpperCase().replace(/\s+/g, '_'),
        scope: catScope,
        is_active: true
      });
      setShowAddCat(false);
      setCatName('');
      setCatCode('');
      await loadData();
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Document Administration</h3>
              <p className="text-[11px] text-slate-500">
                Configure Document Types, Category Scopes, and Verification Rules.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex space-x-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('types')}
              className={`py-3 border-b-2 transition ${
                activeTab === 'types'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Document Types ({docTypes.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-3 border-b-2 transition ${
                activeTab === 'categories'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Categories ({categories.length})
            </button>
          </div>

          <div>
            {activeTab === 'types' ? (
              <button
                onClick={() => setShowAddType(!showAddType)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1 shadow-xs"
              >
                <Plus size={14} /> New Type
              </button>
            ) : (
              <button
                onClick={() => setShowAddCat(!showAddCat)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1 shadow-xs"
              >
                <Plus size={14} /> New Category
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add Type Form */}
          {activeTab === 'types' && showAddType && (
            <form onSubmit={handleSaveType} className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-3 mb-4">
              <h4 className="text-xs font-bold text-blue-900 uppercase">Create New Document Type</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Document Type Name (e.g. Passport)"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  required
                  placeholder="Code (e.g. EMP_PASSPORT)"
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={typeCategory}
                  onChange={(e) => setTypeCategory(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={typeScope}
                  onChange={(e) => setTypeScope(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                >
                  <option value="employee">Employee Scope</option>
                  <option value="company">Company Scope</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="flex items-center space-x-6 text-xs font-semibold text-slate-700">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeApprovalReq}
                    onChange={(e) => setTypeApprovalReq(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Requires Verification Review</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeExpirySup}
                    onChange={(e) => setTypeExpirySup(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Supports Expiry Tracking</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddType(false)}
                  className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Save Type
                </button>
              </div>
            </form>
          )}

          {/* Add Category Form */}
          {activeTab === 'categories' && showAddCat && (
            <form onSubmit={handleSaveCategory} className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-3 mb-4">
              <h4 className="text-xs font-bold text-blue-900 uppercase">Create New Category</h4>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Category Name"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  required
                  placeholder="Code"
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                />
                <select
                  value={catScope}
                  onChange={(e) => setCatScope(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                >
                  <option value="both">Both</option>
                  <option value="company">Company</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          )}

          {/* Types Table */}
          {activeTab === 'types' ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Name & Code</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Scope</th>
                    <th className="py-2.5 px-4">Approval</th>
                    <th className="py-2.5 px-4">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docTypes.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4">
                        <p className="font-bold text-slate-800">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{t.code}</p>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{t.category_name || '-'}</td>
                      <td className="py-2.5 px-4 capitalize">{t.scope}</td>
                      <td className="py-2.5 px-4">
                        {t.approval_required ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                            Required
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Direct</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {t.expiry_supported ? (
                          <span className="text-emerald-600 font-semibold text-[11px]">Yes</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Scope</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{c.name}</td>
                      <td className="py-2.5 px-4 font-mono text-[10px] text-slate-500">{c.code}</td>
                      <td className="py-2.5 px-4 capitalize">{c.scope}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
