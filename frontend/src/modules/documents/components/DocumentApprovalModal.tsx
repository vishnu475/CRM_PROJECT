import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { DocumentItem } from '../types';
import { documentApiService } from '../services/documentApiService';

interface DocumentApprovalModalProps {
  document: DocumentItem | null;
  mode: 'approve' | 'reject';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentApprovalModal: React.FC<DocumentApprovalModalProps> = ({
  document,
  mode,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const isReject = mode === 'reject';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReject && (!comments || !comments.trim())) {
      setError('A rejection reason / comment is required so the employee can correct the document.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isReject) {
        await documentApiService.rejectDocument(document.id, comments);
      } else {
        await documentApiService.approveDocument(document.id, comments || 'Document verified and approved.');
      }
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
        <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${
          isReject ? 'bg-rose-50/50' : 'bg-emerald-50/50'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${isReject ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {isReject ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isReject ? 'Reject Document Verification' : 'Approve Document'}
              </h3>
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
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Owner:</span>
              <span className="font-bold text-slate-800">{document.owner_name || document.owner_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Type:</span>
              <span className="font-semibold text-slate-700">{document.document_type_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Status:</span>
              <span className="font-semibold text-amber-600">Pending Review</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isReject ? 'Rejection Reason (Required) *' : 'Approval Remarks (Optional)'}
            </label>
            <textarea
              required={isReject}
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                isReject
                  ? 'Specify clearly why this document is rejected (e.g. blurred scan, expired credentials, missing signature)...'
                  : 'Add any optional verification notes...'
              }
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition shadow-sm cursor-pointer ${
                isReject ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? 'Processing...' : isReject ? 'Reject Document' : 'Confirm Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
