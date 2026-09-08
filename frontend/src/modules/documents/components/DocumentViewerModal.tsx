import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Share2,
  History,
  FileText,
  FileImage,
  Tag,
  Calendar,
  Building,
  User,
  Shield,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers
} from 'lucide-react';
import { DocumentItem, DocumentVersion } from '../types';
import { documentApiService } from '../services/documentApiService';
import { getFileIcon, getStatusBadge, formatFileSize } from './DocumentListView';

interface DocumentViewerModalProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (doc: DocumentItem) => void;
  onReject: (doc: DocumentItem) => void;
  onShare: (doc: DocumentItem) => void;
  onUploadVersion: (doc: DocumentItem) => void;
  onRefresh: () => void;
  userRole?: string;
  currentUserId?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  documentId,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onShare,
  onUploadVersion,
  onRefresh,
  userRole = 'Employee',
  currentUserId
}) => {
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  // Viewer Controls
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDoc = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await documentApiService.getDocument(id);
      setDoc(data);
      setSelectedVersion(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && documentId) {
      fetchDoc(documentId);
      setZoomLevel(100);
      setRotation(0);
      setCurrentPage(1);
    } else {
      setDoc(null);
      setSelectedVersion(null);
    }
  }, [isOpen, documentId]);

  if (!isOpen || !documentId) return null;

  const isAdmin = userRole === 'Executive' || userRole === 'Admin';
  const isHR = userRole === 'HRAdmin';
  const isOwner = currentUserId && doc && (doc.owner_id === currentUserId || doc.uploaded_by === currentUserId);
  const canReview = (isAdmin || isHR) && doc?.status === 'PENDING_REVIEW' && (!isOwner || isAdmin);
  const canReplace = isOwner && (doc?.status === 'REJECTED' || doc?.status === 'DRAFT' || doc?.status === 'APPROVED');

  const rawFileName = selectedVersion?.file_name || doc?.original_file_name || 'Document.pdf';
  const displayTitle = doc?.document_name || rawFileName;
  const fileExt = rawFileName.split('.').pop()?.toLowerCase() || 'pdf';
  const isPdf = fileExt === 'pdf' || (doc?.mime_type || '').includes('pdf');
  const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt);

  // Secure preview URL
  const previewUrl = doc ? `/api/documents/${doc.id}/preview` : '';
  const downloadUrl = doc ? `/api/documents/${doc.id}/download` : '';

  const handleDownload = () => {
    if (!doc) return;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', rawFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open(previewUrl, '_blank');
    printWindow?.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`bg-slate-900 rounded-3xl shadow-2xl flex flex-col border border-slate-800 overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-7xl h-[94vh]'
        }`}
      >
        {/* Top Viewer Header Bar */}
        <header className="px-4 py-3 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between shrink-0 gap-3">
          {/* Left: Back & Document Title */}
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer shrink-0"
              title="Return to Document List"
            >
              <ArrowLeft size={15} /> Back
            </button>

            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                {getFileIcon(fileExt)}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md" title={displayTitle}>
                  {displayTitle}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>{rawFileName}</span>
                  <span>•</span>
                  <span>{selectedVersion ? selectedVersion.version_number : doc?.current_version}</span>
                  <span>•</span>
                  <span>{formatFileSize(doc?.file_size)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center / Right: Workflow & Document Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Status Pill */}
            {doc && (
              <div className="hidden sm:inline-flex">
                {getStatusBadge(doc.status)}
              </div>
            )}

            {/* Quick Verification Actions: Approve / Reject for HR & Admin */}
            {canReview && doc && (
              <div className="flex items-center space-x-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => onApprove(doc)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                  title="Approve and verify this document"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button
                  onClick={() => onReject(doc)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                  title="Reject document with feedback"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            )}

            {/* If Rejected & User is Owner: Replace Document button */}
            {doc?.status === 'REJECTED' && isOwner && (
              <button
                onClick={() => onUploadVersion(doc)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer animate-pulse"
              >
                <UploadCloud size={14} /> Replace Document
              </button>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Download File"
            >
              <Download size={14} />
              <span className="hidden md:inline">Download</span>
            </button>

            {/* Share Button */}
            {doc && (
              <button
                onClick={() => onShare(doc)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition cursor-pointer"
                title="Share Document"
              >
                <Share2 size={15} />
              </button>
            )}

            {/* Toggle Info Side Panel */}
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                showInfoPanel
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle Information Sidebar"
            >
              <FileText size={14} />
              <span className="hidden lg:inline">Details</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:inline-flex p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer"
              title="Close Viewer"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Main Body: Document Viewport (Left) + Document Information Panel (Right) */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-950">
          {/* 1. DOCUMENT VIEWPORT */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative overflow-hidden">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p>Loading document content...</p>
              </div>
            ) : isPdf ? (
              /* REAL PDF VIEWER */
              <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
                <div
                  className="flex-1 w-full h-full bg-slate-900 transition-transform duration-150"
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'top center'
                  }}
                >
                  <iframe
                    key={`${previewUrl}-${selectedVersion?.id || 'current'}`}
                    src={`${previewUrl}#toolbar=1&navpanes=1`}
                    title={displayTitle}
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>
            ) : isImg ? (
              /* REAL IMAGE VIEWER */
              <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950">
                <div
                  className="transition-transform duration-150 flex items-center justify-center max-w-full"
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  <img
                    src={previewUrl}
                    alt={displayTitle}
                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
                  />
                </div>
              </div>
            ) : (
              /* Other formats (DOCX, XLSX) */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md text-center text-slate-300 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                    {getFileIcon(fileExt)}
                  </div>
                  <h4 className="text-sm font-bold text-white">{rawFileName}</h4>
                  <p className="text-xs text-slate-400">
                    This file format is ready for download and viewing in your default office suite application.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Download size={14} /> Download Document
                  </button>
                </div>
              </div>
            )}

            {/* Bottom In-App Viewer Floating Toolbar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 shadow-2xl text-slate-200">
              {/* Zoom Out */}
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Zoom Out (−)"
              >
                <ZoomOut size={15} />
              </button>

              <span className="text-xs font-mono font-bold px-2 min-w-[48px] text-center">
                {zoomLevel}%
              </span>

              {/* Zoom In */}
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Zoom In (+)"
              >
                <ZoomIn size={15} />
              </button>

              {/* Fit Width */}
              <button
                onClick={() => setZoomLevel(100)}
                className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition"
                title="Reset Fit (100%)"
              >
                Fit
              </button>

              {/* Rotate */}
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Rotate Clockwise"
              >
                <RotateCw size={14} />
              </button>

              <span className="w-px h-4 bg-slate-800 mx-1" />

              {/* Open in full tab */}
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Open in Dedicated Browser Window"
              >
                <ExternalLink size={14} />
              </a>

              {/* Print */}
              <button
                onClick={handlePrint}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Print Document"
              >
                <Printer size={14} />
              </button>
            </div>
          </div>

          {/* 2. DOCUMENT INFORMATION SIDE PANEL */}
          {showInfoPanel && doc && (
            <aside className="w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={15} className="text-blue-600" /> Document Information
                </span>
                <button
                  onClick={() => setShowInfoPanel(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  title="Collapse Details"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-5 text-xs">
                {/* Rejection Alert Box */}
                {doc.status === 'REJECTED' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                      <XCircle size={15} className="text-rose-600" />
                      <span>Verification Rejected</span>
                    </div>
                    <p className="text-xs text-rose-700 font-medium leading-relaxed">
                      {doc.rejection_reason || 'Document does not satisfy requirements. Please re-upload.'}
                    </p>
                    {isOwner && (
                      <button
                        onClick={() => onUploadVersion(doc)}
                        className="mt-2 w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <UploadCloud size={13} /> Replace Document (Upload v2.0)
                      </button>
                    )}
                  </div>
                )}

                {/* Metadata Items */}
                <div className="space-y-3">
                  <div className="pb-2.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Document Name</span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5">{doc.document_name}</p>
                  </div>

                  <div className="pb-2.5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Document Type</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{doc.document_type_name}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600">
                      {doc.document_type_code}
                    </span>
                  </div>

                  <div className="pb-2.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{doc.category_name}</p>
                  </div>

                  <div className="pb-2.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Owner / Employee</span>
                    <p className="font-bold text-slate-900 mt-0.5">{doc.owner_name || doc.owner_id}</p>
                    <p className="text-[10px] text-slate-400">{doc.department || 'General'}</p>
                  </div>

                  <div className="pb-2.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Uploaded By</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{doc.uploader_name || doc.uploaded_by}</p>
                  </div>

                  <div className="pb-2.5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Submitted / Created</span>
                      <p className="font-semibold text-slate-800 mt-0.5 font-mono">
                        {new Date(doc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Version</span>
                      <p className="font-bold text-blue-700 font-mono mt-0.5 text-right">{doc.current_version}</p>
                    </div>
                  </div>

                  <div className="pb-2.5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                      <div className="mt-1">{getStatusBadge(doc.status)}</div>
                    </div>
                    {doc.expiry_date && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</span>
                        <p className="font-semibold text-slate-800 mt-0.5 font-mono">{doc.expiry_date}</p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {doc.description && (
                    <div className="pb-2.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        {doc.description}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {Array.isArray(doc.tags) && doc.tags.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Tags</span>
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold border border-slate-200"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Version History List inside Viewer */}
                {doc.versions && doc.versions.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1">
                        <Layers size={13} className="text-purple-600" /> Version History
                      </span>
                      {canReplace && (
                        <button
                          onClick={() => onUploadVersion(doc)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                        >
                          + New Version
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {doc.versions.map((ver) => {
                        const isCurrent = ver.version_number === doc.current_version;
                        const isSelected = selectedVersion?.id === ver.id;
                        return (
                          <div
                            key={ver.id}
                            onClick={() => setSelectedVersion(ver)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                              isSelected
                                ? 'bg-blue-50 border-blue-300'
                                : isCurrent
                                ? 'bg-purple-50/50 border-purple-200'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-900">
                                {ver.version_number}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[9px] font-bold">
                                  CURRENT
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(ver.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                              {ver.change_description || ver.file_name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
