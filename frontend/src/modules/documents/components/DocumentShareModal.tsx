import React, { useState } from 'react';
import { X, Share2, Users, Building, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { DocumentItem } from '../types';
import { documentApiService } from '../services/documentApiService';

interface DocumentShareModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeesList?: Array<{ emp_code: string; name: string; department: string }>;
}

export const DocumentShareModal: React.FC<DocumentShareModalProps> = ({
  document,
  isOpen,
  onClose,
  onSuccess,
  employeesList = []
}) => {
  const [targetType, setTargetType] = useState<'user' | 'department' | 'role'>('user');
  const [targetId, setTargetId] = useState('');
  const [canDownload, setCanDownload] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [expiryDays, setExpiryDays] = useState<string>('30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) {
      setError('Please select or specify a recipient.');
      return;
    }

    setIsSubmitting(true);
    try {
      let expiresAt: string | null = null;
      if (expiryDays && expiryDays !== 'never') {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(expiryDays, 10));
        expiresAt = d.toISOString();
      }

      await documentApiService.shareDocument(document.id, {
        target_type: targetType,
        target_id: targetId,
        can_view: true,
        can_download: canDownload,
        can_edit: canEdit,
        expires_at: expiresAt
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Share Document Access</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                {document.document_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Target Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Share With
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'user', label: 'User', icon: Users },
                { type: 'department', label: 'Dept', icon: Building },
                { type: 'role', label: 'Role', icon: Shield }
              ].map((item) => {
                const Icon = item.icon;
                const isSel = targetType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setTargetType(item.type as any);
                      setTargetId('');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      isSel
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={14} /> {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Identifier Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Recipient {targetType.toUpperCase()} *
            </label>
            {targetType === 'user' ? (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="">-- Select Employee --</option>
                {employeesList.map((emp) => (
                  <option key={emp.emp_code} value={emp.emp_code}>
                    {emp.name} ({emp.emp_code}) - {emp.department}
                  </option>
                ))}
              </select>
            ) : targetType === 'department' ? (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="">-- Select Department --</option>
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources (HR)</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="Sales">Sales & Marketing</option>
                <option value="Operations">Operations</option>
              </select>
            ) : (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="">-- Select Role --</option>
                <option value="Executive">Executive / Admin</option>
                <option value="HRAdmin">HR Manager</option>
                <option value="SalesManager">Sales Manager</option>
                <option value="Employee">All Employees</option>
              </select>
            )}
          </div>

          {/* Permissions checkboxes */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Permissions:</span>
            <div className="flex items-center space-x-4 text-xs">
              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Can View</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={canDownload}
                  onChange={(e) => setCanDownload(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Can Download</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={canEdit}
                  onChange={(e) => setCanEdit(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Can Edit / Revise</span>
              </label>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Access Duration
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="never">Permanent (No Expiration)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !targetId}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition shadow-sm cursor-pointer"
            >
              {isSubmitting ? 'Sharing...' : 'Confirm Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
