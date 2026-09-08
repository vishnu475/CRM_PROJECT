import React, { useState, useEffect } from 'react';
import {
  X,
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
  Send,
  Calendar,
  Layers,
  User,
  Building,
  Shield,
  Tag,
  AlertTriangle,
  Info,
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { DocumentItem } from '../types';
import { documentApiService } from '../services/documentApiService';
import { getFileIcon, getStatusBadge, formatFileSize } from './DocumentListView';

interface DocumentDetailDrawerProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onPreview: (doc: DocumentItem) => void;
  onDownload: (doc: DocumentItem) => void;
  onUploadVersion: (doc: DocumentItem) => void;
  onShare: (doc: DocumentItem) => void;
  onApprove: (doc: DocumentItem) => void;
  onReject: (doc: DocumentItem) => void;
  onRefreshList: () => void;
  userRole?: string;
  currentUserId?: string;
}

export const DocumentDetailDrawer: React.FC<DocumentDetailDrawerProps> = ({
  documentId,
  isOpen,
  onClose,
  onPreview,
  onDownload,
  onUploadVersion,
  onShare,
  onApprove,
  onReject,
  onRefreshList,
  userRole = 'Employee',
  currentUserId
}) => {
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'versions' | 'shares' | 'audit'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDocDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await documentApiService.getDocument(id);
      setDoc(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && documentId) {
      fetchDocDetails(documentId);
      setActiveTab('overview');
    } else {
      setDoc(null);
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const isAdmin = userRole === 'Executive' || userRole === 'Admin';
  const isHR = userRole === 'HRAdmin';
  const isOwner = currentUserId && doc && (doc.owner_id === currentUserId || doc.uploaded_by === currentUserId);
  const canReview = (isAdmin || isHR) && doc?.status === 'PENDING_REVIEW' && (!isOwner || isAdmin);
  const canSubmit = (isOwner || isAdmin) && (doc?.status === 'DRAFT' || doc?.status === 'REJECTED');

  const handleRestoreVersion = async (versionId: string) => {
    if (!doc || !confirm('Are you sure you want to restore this previous version as active?')) return;
    setActionLoading(true);
    try {
      await documentApiService.restoreVersion(doc.id, versionId);
      await fetchDocDetails(doc.id);
      onRefreshList();
    } catch (err: any) {
      alert(`Failed to restore version: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!doc || !confirm('Revoke this share access?')) return;
    try {
      await documentApiService.revokeShare(doc.id, shareId);
      await fetchDocDetails(doc.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitReview = async () => {
    if (!doc) return;
    try {
      await documentApiService.submitDocument(doc.id);
      await fetchDocDetails(doc.id);
      onRefreshList();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-start space-x-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
              {getFileIcon(doc?.file_type)}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
                {doc?.document_name || 'Loading Document Details...'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                <span>{doc?.id}</span>
                <span>•</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  {doc?.current_version || 'v1.0'}
                </span>
                <span>•</span>
                <span>{formatFileSize(doc?.file_size)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition ml-3"
          >
            <X size={18} />
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : doc ? (
          <>
            {/* Status & Rejection Banner */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                {getStatusBadge(doc.status)}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onPreview(doc)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Eye size={14} /> Preview
                </button>
                <button
                  onClick={() => onDownload(doc)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download size={14} /> Download
                </button>
              </div>
            </div>

            {/* Rejection Alert Box */}
            {doc.status === 'REJECTED' && doc.rejection_reason && (
              <div className="mx-5 mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <div className="flex items-start space-x-2.5">
                  <XCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h5 className="text-xs font-bold text-rose-800">Verification Rejected</h5>
                    <p className="text-xs text-rose-700 mt-0.5 font-medium">
                      {doc.rejection_reason}
                    </p>
                    {isOwner && (
                      <button
                        onClick={() => onUploadVersion(doc)}
                        className="mt-2.5 px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition"
                      >
                        Upload Corrected Version
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="px-5 border-b border-slate-100 flex space-x-6 text-xs font-bold">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'versions', label: `Versions (${doc.versions?.length || 1})` },
                { id: 'shares', label: `Shared (${doc.shares?.length || 0})` },
                { id: 'audit', label: `Audit Log (${doc.auditLogs?.length || 0})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 border-b-2 transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Document Type</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{doc.document_type_name || 'Standard'}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{doc.category_name || 'Corporate'}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Document Owner</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{doc.owner_name || doc.owner_id}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{doc.department || 'General'}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Uploaded By</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{doc.uploader_name || doc.uploaded_by}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Visibility</p>
                      <span className="capitalize font-semibold text-slate-800 mt-0.5 block">{doc.visibility}</span>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{doc.expiry_date || 'None (No Expiry)'}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Created Date</p>
                      <p className="font-semibold text-slate-800 mt-0.5 font-mono">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {doc.description && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Description & Notes
                      </h4>
                      <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                        {doc.description}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {Array.isArray(doc.tags) && doc.tags.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Tag size={13} /> Tags & Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approval Record */}
                  {doc.approvals && doc.approvals.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield size={14} className="text-purple-600" /> Verification Lifecycle
                      </h4>
                      {doc.approvals.map((appr) => (
                        <div key={appr.id} className="text-xs border-t border-slate-200/60 pt-2 first:border-0 first:pt-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">
                              Reviewer: {appr.reviewer_name || 'HR Reviewer'}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {appr.reviewed_at ? new Date(appr.reviewed_at).toLocaleDateString() : 'Pending'}
                            </span>
                          </div>
                          {appr.comments && (
                            <p className="text-slate-600 text-[11px] mt-1 italic">
                              "{appr.comments}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: VERSION HISTORY */}
              {activeTab === 'versions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase">Version Revisions</span>
                    <button
                      onClick={() => onUploadVersion(doc)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus size={14} /> New Revision
                    </button>
                  </div>

                  <div className="space-y-3">
                    {doc.versions?.map((ver) => {
                      const isCurrent = ver.version_number === doc.current_version;
                      return (
                        <div
                          key={ver.id}
                          className={`p-3.5 rounded-2xl border transition ${
                            isCurrent
                              ? 'bg-blue-50/50 border-blue-200'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                                {ver.version_number}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                                  Current
                                </span>
                              )}
                              <span className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                                {ver.file_name}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(ver.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mt-2">
                            {ver.change_description || 'No description provided.'}
                          </p>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">
                              By {ver.uploader_name || ver.uploaded_by} • {formatFileSize(ver.file_size)}
                            </span>

                            <div className="flex items-center space-x-2">
                              {!isCurrent && (
                                <button
                                  onClick={() => handleRestoreVersion(ver.id)}
                                  disabled={actionLoading}
                                  className="text-purple-600 hover:text-purple-800 font-bold"
                                >
                                  Revert to this
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: SHARED WITH */}
              {activeTab === 'shares' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase">Access Sharing</span>
                    <button
                      onClick={() => onShare(doc)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Share2 size={13} /> Share Document
                    </button>
                  </div>

                  {doc.shares && doc.shares.length > 0 ? (
                    <div className="space-y-2">
                      {doc.shares.map((shr) => (
                        <div
                          key={shr.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="capitalize font-bold text-slate-800">
                                {shr.share_target_type}: {shr.share_target_id}
                              </span>
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                {shr.can_edit ? 'Edit & View' : 'View Only'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Shared by {shr.sharer_name || shr.shared_by} on {new Date(shr.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <button
                            onClick={() => handleRevokeShare(shr.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Revoke Share"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
                      No explicit shares. Visibility is governed by "{doc.visibility}" permissions.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: AUDIT LOG */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-600 uppercase">Immutable Audit Trail</span>
                  <div className="relative pl-5 border-l-2 border-slate-200 space-y-4">
                    {doc.auditLogs?.map((log) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-xs" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-800">{log.action}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{log.description}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            By {log.user_name || log.user_id} • IP: {log.ip_address || '127.0.0.1'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                {canSubmit && (
                  <button
                    onClick={handleSubmitReview}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Send size={14} /> Submit for Verification
                  </button>
                )}

                {canReview && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onApprove(doc)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      onClick={() => onReject(doc)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUploadVersion(doc)}
                  className="p-2 text-slate-600 hover:text-purple-600 hover:bg-white rounded-xl border border-slate-200 transition"
                  title="Upload New Version"
                >
                  <History size={16} />
                </button>
                <button
                  onClick={() => onShare(doc)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl border border-slate-200 transition"
                  title="Share"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
