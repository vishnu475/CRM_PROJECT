import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileImage,
  File,
  Eye,
  Download,
  Share2,
  History,
  Archive,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Check,
  Send,
  Calendar
} from 'lucide-react';
import { DocumentItem, DocumentStatus } from '../types';

interface DocumentListViewProps {
  documents: DocumentItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
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

export const getFileIcon = (fileType?: string) => {
  const t = (fileType || '').toLowerCase();
  if (t === 'pdf') return <FileText className="text-red-500" size={18} />;
  if (['xlsx', 'xls', 'csv'].includes(t)) return <FileSpreadsheet className="text-emerald-500" size={18} />;
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(t)) return <FileImage className="text-blue-500" size={18} />;
  if (['docx', 'doc', 'txt'].includes(t)) return <FileCode className="text-indigo-500" size={18} />;
  return <File className="text-slate-400" size={18} />;
};

export const getStatusBadge = (status: DocumentStatus) => {
  switch (status) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={11} /> Verified
        </span>
      );
    case 'PENDING_REVIEW':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
          <Clock size={11} /> In Review
        </span>
      );
    case 'DRAFT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Draft
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={11} /> Rejected
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300">
          <AlertCircle size={11} /> Expired
        </span>
      );
    case 'ARCHIVED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Archive size={11} /> Archived
        </span>
      );
    case 'TRASHED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
          <Trash2 size={11} /> In Trash
        </span>
      );
    default:
      return <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">{status}</span>;
  }
};

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export const DocumentListView: React.FC<DocumentListViewProps> = ({
  documents,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
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
  const isAllSelected = documents.length > 0 && selectedIds.length === documents.length;

  const isAdmin = userRole === 'Executive' || userRole === 'Admin';
  const isHR = userRole === 'HRAdmin';

  if (documents.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
          <FileText size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-800">No documents found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          {isTrashSection
            ? 'Trash is completely empty. No deleted documents.'
            : 'No documents match the selected filters or search query.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 min-w-[240px]">Document</th>
              <th className="py-3 px-4">Document Type</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Owner / Dept</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Version</th>
              <th className="py-3 px-4">Expiry</th>
              <th className="py-3 px-4">Updated</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {documents.map((doc) => {
              const isSelected = selectedIds.includes(doc.id);
              const isOwner = currentUserId && (doc.owner_id === currentUserId || doc.uploaded_by === currentUserId);
              const canReview = (isAdmin || isHR) && doc.status === 'PENDING_REVIEW' && (!isOwner || isAdmin);
              const canSubmit = (isOwner || isAdmin) && (doc.status === 'DRAFT' || doc.status === 'REJECTED');

              // Expiry calculations
              let expiryInfo = null;
              if (doc.expiry_date) {
                const expDate = new Date(doc.expiry_date);
                const diffDays = Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                  expiryInfo = <span className="text-rose-600 font-bold">Expired</span>;
                } else if (diffDays <= 7) {
                  expiryInfo = <span className="text-rose-600 font-bold">{diffDays}d left</span>;
                } else if (diffDays <= 30) {
                  expiryInfo = <span className="text-amber-600 font-semibold">{diffDays}d left</span>;
                } else {
                  expiryInfo = <span className="text-slate-600">{doc.expiry_date}</span>;
                }
              }

              return (
                <tr
                  key={doc.id}
                  className={`hover:bg-slate-50/80 transition-colors group ${
                    isSelected ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(doc.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => onViewDetails(doc)}
                          className="font-bold text-slate-900 hover:text-blue-600 text-left truncate block max-w-xs transition"
                          title={doc.document_name}
                        >
                          {doc.document_name}
                        </button>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{doc.id}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-700">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {doc.document_type_name || 'General'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    <span className="text-[11px] font-medium text-slate-600">
                      {doc.category_name || 'Corporate'}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-[11px] truncate">
                        {doc.owner_name || doc.owner_id}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {doc.department || 'General'}
                      </p>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {getStatusBadge(doc.status)}
                    {doc.status === 'REJECTED' && doc.rejection_reason && (
                      <p className="text-[10px] text-rose-600 truncate max-w-[130px] mt-0.5" title={doc.rejection_reason}>
                        {doc.rejection_reason}
                      </p>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => onViewDetails(doc)}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono text-[10px] font-bold hover:bg-blue-100 transition"
                      title="View Version History"
                    >
                      {doc.current_version || 'v1.0'}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-[11px] whitespace-nowrap">
                    {expiryInfo || <span className="text-slate-400">None</span>}
                  </td>

                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap font-mono">
                    {new Date(doc.updated_at || doc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* [View] Action: Opens In-App Document Viewer */}
                      <button
                        onClick={() => onPreview(doc)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-blue-200/60 shadow-2xs cursor-pointer"
                        title="View Real Uploaded Document & Metadata"
                      >
                        <Eye size={13} /> View
                      </button>

                      {/* [Download] Action */}
                      <button
                        onClick={() => onDownload(doc)}
                        className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 border border-slate-200/60 cursor-pointer"
                        title="Download Document"
                      >
                        <Download size={13} /> Download
                      </button>

                      {/* Verification Quick Action: Approve */}
                      {canReview && (
                        <button
                          onClick={() => onApprove(doc)}
                          className="px-2 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Approve Document"
                        >
                          <Check size={13} /> Approve
                        </button>
                      )}

                      {/* Verification Quick Action: Reject */}
                      {canReview && (
                        <button
                          onClick={() => onReject(doc)}
                          className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-rose-200 cursor-pointer"
                          title="Reject Document"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      )}

                      {/* Submit for Review Action */}
                      {canSubmit && (
                        <button
                          onClick={() => onSubmitForReview(doc)}
                          className="px-2 py-1 bg-amber-500 text-white hover:bg-amber-600 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Submit for Verification"
                        >
                          <Send size={11} /> Submit
                        </button>
                      )}

                      {/* Trash Section Action: Restore */}
                      {isTrashSection ? (
                        <button
                          onClick={() => onRestore(doc)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition border border-emerald-200"
                          title="Restore from Trash"
                        >
                          <RotateCcw size={14} />
                        </button>
                      ) : (
                        <>
                          {/* Share Button */}
                          <button
                            onClick={() => onShare(doc)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Share"
                          >
                            <Share2 size={14} />
                          </button>

                          {/* Version History / New Version */}
                          <button
                            onClick={() => onUploadVersion(doc)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Upload New Version / Replace"
                          >
                            <History size={14} />
                          </button>

                          {/* Delete to Trash */}
                          <button
                            onClick={() => onDelete(doc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Move to Trash"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
