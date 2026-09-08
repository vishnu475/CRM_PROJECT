import React from 'react';
import {
  Eye,
  Download,
  Share2,
  History,
  Archive,
  Trash2,
  RotateCcw,
  Check,
  XCircle,
  Send,
  MoreVertical
} from 'lucide-react';
import { DocumentItem } from '../types';
import { getFileIcon, getStatusBadge, formatFileSize } from './DocumentListView';

interface DocumentGridViewProps {
  documents: DocumentItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onPreview: (doc: DocumentItem) => void;
  onDownload: (doc: DocumentItem) => void;
  onViewDetails: (doc: DocumentItem) => void;
  onUploadVersion: (doc: DocumentItem) => void;
  onShare: (doc: DocumentItem) => void;
  onSubmitForReview: (doc: DocumentItem) => void;
  onApprove: (doc: DocumentItem) => void;
  onReject: (doc: DocumentItem) => void;
  onArchive: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
  onRestore: (doc: DocumentItem) => void;
  userRole?: string;
  currentUserId?: string;
  isTrashSection?: boolean;
}

export const DocumentGridView: React.FC<DocumentGridViewProps> = ({
  documents,
  selectedIds,
  onToggleSelect,
  onPreview,
  onDownload,
  onViewDetails,
  onUploadVersion,
  onShare,
  onSubmitForReview,
  onApprove,
  onReject,
  onArchive,
  onDelete,
  onRestore,
  userRole = 'Employee',
  currentUserId,
  isTrashSection = false
}) => {
  const isAdmin = userRole === 'Executive' || userRole === 'Admin';
  const isHR = userRole === 'HRAdmin';

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {documents.map((doc) => {
        const isSelected = selectedIds.includes(doc.id);
        const isOwner = currentUserId && (doc.owner_id === currentUserId || doc.uploaded_by === currentUserId);
        const canReview = (isAdmin || isHR) && doc.status === 'PENDING_REVIEW' && (!isOwner || isAdmin);
        const canSubmit = (isOwner || isAdmin) && (doc.status === 'DRAFT' || doc.status === 'REJECTED');

        return (
          <div
            key={doc.id}
            className={`bg-white border rounded-2xl p-4 flex flex-col justify-between transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 group relative ${
              isSelected ? 'border-blue-400 ring-2 ring-blue-100 bg-blue-50/20' : 'border-slate-200'
            }`}
          >
            {/* Top Bar: Select checkbox, File icon, and Status */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(doc.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                  />
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                    {getFileIcon(doc.file_type)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                    {doc.current_version || 'v1.0'}
                  </span>
                  {getStatusBadge(doc.status)}
                </div>
              </div>

              {/* Title & metadata */}
              <div className="mt-3">
                <h4
                  onClick={() => onViewDetails(doc)}
                  className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition"
                  title={doc.document_name}
                >
                  {doc.document_name}
                </h4>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                  <span>{doc.id}</span>
                  <span>•</span>
                  <span>{formatFileSize(doc.file_size)}</span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px] truncate max-w-[130px]">
                    {doc.document_type_name || 'Document'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[10px] border border-slate-200/60 truncate max-w-[110px]">
                    {doc.category_name || 'General'}
                  </span>
                </div>

                {doc.status === 'REJECTED' && doc.rejection_reason && (
                  <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-700">
                    <span className="font-bold">Reason:</span> {doc.rejection_reason}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Bar: Owner info and Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-[11px] font-semibold text-slate-800 truncate">
                  {doc.owner_name || doc.owner_id}
                </p>
                <p className="text-[9px] text-slate-400 truncate">
                  {doc.department || 'General'}
                </p>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => onPreview(doc)}
                  className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-blue-200/60 cursor-pointer"
                  title="View Document"
                >
                  <Eye size={13} /> View
                </button>

                <button
                  onClick={() => onDownload(doc)}
                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition border border-slate-200"
                  title="Download"
                >
                  <Download size={13} />
                </button>

                {canSubmit && (
                  <button
                    onClick={() => onSubmitForReview(doc)}
                    className="p-1.5 bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition"
                    title="Submit for Verification"
                  >
                    <Send size={13} />
                  </button>
                )}

                {canReview && (
                  <>
                    <button
                      onClick={() => onApprove(doc)}
                      className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition"
                      title="Approve"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => onReject(doc)}
                      className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition"
                      title="Reject"
                    >
                      <XCircle size={13} />
                    </button>
                  </>
                )}

                {isTrashSection ? (
                  <button
                    onClick={() => onRestore(doc)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    title="Restore"
                  >
                    <RotateCcw size={14} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onShare(doc)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Share"
                    >
                      <Share2 size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(doc)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Trash"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
