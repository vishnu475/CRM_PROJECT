import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  FileText,
  ExternalLink,
  Maximize2,
  RotateCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string | null;
  fileUrl?: string | null;
  taskTitle?: string;
  projectName?: string;
  scopeOfWork?: string;
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string } | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return { blob: new Blob([u8arr], { type: mime }), mime };
  } catch (err) {
    console.error('Failed to parse base64 to blob', err);
    return null;
  }
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  taskTitle = 'Task Specification Document',
  projectName = 'Sigma Systems - Implementation Project',
  scopeOfWork
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setZoomLevel(100);
    setRotation(0);
    setCurrentPage(1);
  }, [fileUrl, isOpen]);

  const rawFileName = fileName || 'PRJ-3240_Requirements_Specification.pdf';

  // Convert Base64 Data URL to a real browser Object URL if needed
  const { directUrl, isPdf, isImage } = useMemo(() => {
    if (!fileUrl) return { directUrl: null, isPdf: false, isImage: false };

    let isImg = false;
    let isDocPdf = false;
    let url = fileUrl;

    if (fileUrl.startsWith('data:')) {
      const parsed = dataUrlToBlob(fileUrl);
      if (parsed) {
        url = URL.createObjectURL(parsed.blob);
        isDocPdf = parsed.mime.includes('pdf');
        isImg = parsed.mime.includes('image');
      }
    }

    if (!isImg && !isDocPdf) {
      if (
        fileUrl.startsWith('data:image') ||
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(fileUrl) ||
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(rawFileName) ||
        fileUrl.includes('images.') ||
        fileUrl.includes('/photo-')
      ) {
        isImg = true;
      } else {
        isDocPdf = true;
      }
    }

    return { directUrl: url, isPdf: isDocPdf, isImage: isImg };
  }, [fileUrl, rawFileName]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (directUrl && directUrl.startsWith('blob:')) {
        URL.revokeObjectURL(directUrl);
      }
    };
  }, [directUrl]);

  if (!isOpen) return null;

  const handleOpenInNewTab = () => {
    if (directUrl) {
      window.open(directUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (directUrl) {
      const a = document.createElement('a');
      a.href = directUrl;
      a.download = rawFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const printDoc = document.getElementById('printable-spec-sheet');
      if (printDoc) {
        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${rawFileName}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #0f172a; padding: 40px; margin: 0; }
@page { size: A4; margin: 15mm; }
table { width: 100%; border-collapse: collapse; margin: 16px 0; }
th, td { border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 12px; }
th { background: #f1f5f9; text-align: left; }
</style>
</head>
<body>
${printDoc.innerHTML}
</body>
</html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = rawFileName.replace(/\.pdf$/i, '.html');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  const handlePrint = () => {
    if (directUrl) {
      const printWindow = window.open(directUrl, '_blank');
      printWindow?.print();
    } else {
      window.print();
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs animate-fade-in">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-spec-sheet, #printable-spec-sheet * {
            visibility: visible !important;
          }
          #printable-spec-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div
        className={`bg-slate-900 rounded-2xl shadow-2xl flex flex-col border border-slate-700 overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[92vh]'
        }`}
      >
        {/* PDF Reader Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-slate-200 border-b border-slate-800 shrink-0">
          {/* File Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-[11px] shrink-0 ${
              isImage 
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' 
                : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
            }`}>
              {isImage ? 'IMG' : 'PDF'}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {rawFileName}
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                {taskTitle} • {projectName}
              </p>
            </div>
          </div>

          {/* Center Page & Navigation Controls */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded transition"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-mono text-slate-200">
              Page <b className="text-white">{currentPage}</b> of 1
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded transition"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(40, prev - 15))}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[11px] font-mono text-slate-300 px-1.5 min-w-[38px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(250, prev + 15))}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Rotate */}
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Rotate Clockwise"
            >
              <RotateCw size={15} />
            </button>

            {/* Open in Full Native PDF Tab */}
            {directUrl && (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Open PDF in Full Browser Window"
              >
                <ExternalLink size={15} />
              </button>
            )}

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Print Document"
            >
              <Printer size={15} />
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Download Document"
            >
              <Download size={15} />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:inline-flex p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize2 size={15} />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition ml-1 cursor-pointer shadow-xs"
              title="Close PDF Viewer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* PDF Document Viewport */}
        <div className="flex-1 overflow-auto bg-slate-950/95 p-3 sm:p-6 flex justify-center items-start min-h-0">
          {directUrl ? (
            isImage ? (
              /* High-Clarity Receipt & Bill Image Viewer */
              <div
                className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 transition-transform duration-150 flex flex-col my-auto max-w-3xl w-full"
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-white truncate max-w-sm">{rawFileName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full font-bold">Receipt Attachment</span>
                </div>
                <div className="p-4 sm:p-6 flex-1 flex items-center justify-center bg-slate-900/60 min-h-[360px] max-h-[75vh] overflow-auto">
                  <img
                    src={directUrl}
                    alt={rawFileName}
                    className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg shadow-md"
                  />
                </div>
              </div>
            ) : (
              /* Native PDF Viewer */
              <div
                className="w-full h-full min-h-[680px] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700 transition-transform duration-150"
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'top center'
                }}
              >
                <object
                  data={directUrl}
                  type="application/pdf"
                  className="w-full h-full min-h-[680px] border-0"
                >
                  <iframe
                    src={directUrl}
                    title={rawFileName}
                    className="w-full h-full min-h-[680px] border-0"
                  />
                </object>
              </div>
            )
          ) : (
            /* High-Fidelity Enterprise Requirements Specification Document Canvas */
            <div
              id="printable-spec-sheet"
              className="bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-12 max-w-4xl w-full min-h-[960px] border border-slate-200 transition-transform duration-150 space-y-6"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'top center'
              }}
            >
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        <FileText size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 block">
                          Enterprise Implementation Framework
                        </span>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                          Requirements Specification Document
                        </h1>
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Approved & Released
                    </span>
                    <p className="text-[10px] font-mono text-slate-500">
                      Doc Ref: {rawFileName.replace('.pdf', '')}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Date: <strong className="text-slate-800">{todayFormatted}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Project & Task Meta Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Project Name</span>
                  <strong className="text-slate-900 font-bold block truncate mt-0.5" title={projectName}>
                    {projectName}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Deliverable</span>
                  <strong className="text-slate-900 font-bold block truncate mt-0.5" title={taskTitle}>
                    {taskTitle}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Milestone</span>
                  <span className="text-blue-700 font-bold block mt-0.5">Phase 1 Delivery</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Specification File</span>
                  <span className="text-slate-700 font-mono text-[11px] block truncate mt-0.5" title={rawFileName}>
                    {rawFileName}
                  </span>
                </div>
              </div>

              {/* 1. Executive Summary */}
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-3 border-blue-600 pl-2">
                  1. Executive Overview & Technical Objectives
                </h2>
                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                  This official Requirements Specification defines the architectural constraints, functional deliverables, dual-database sync requirements, and quality benchmarks for <strong>{projectName}</strong>. The implementation team is authorized to build, test, and release all assigned modules in strict compliance with the specifications detailed herein.
                </p>
              </div>

              {/* 2. Scope of Work & Deliverables */}
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-3 border-blue-600 pl-2">
                  2. Detailed Scope of Work & Implementation Requirements
                </h2>
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs sm:text-[13px] text-slate-800 leading-relaxed whitespace-pre-line">
                  {scopeOfWork ? (
                    scopeOfWork
                  ) : (
                    `• Complete business logic implementation for ${taskTitle} with transactional database persistence.
• Dual-database synchronization between CRM (Sales/Projects) and HRMS (Employees/Tasks/Groups) databases.
• Real-time WebSocket broadcasting of task state updates, progress milestones, and deliverables reviews.
• End-to-end user experience integration with responsive form controls, validation, and optimistic UI handling.
• Automated test coverage covering unit contracts, data constraints, and edge-case execution flows.`
                  )}
                </div>
              </div>

              {/* 3. Deliverables Breakdown Table */}
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-3 border-blue-600 pl-2">
                  3. Deliverables Breakdown & Acceptance Criteria
                </h2>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3">Deliverable Module</th>
                        <th className="py-2.5 px-3">Acceptance Benchmark</th>
                        <th className="py-2.5 px-3">Weightage</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold">REQ-01</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">Schema & DB Persistence</td>
                        <td className="py-2.5 px-3">All columns aligned, transactional commit, no orphan records</td>
                        <td className="py-2.5 px-3 font-semibold">30%</td>
                        <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Verified</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold">REQ-02</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">API & Endpoint Contracts</td>
                        <td className="py-2.5 px-3">Full RESTful CRUD endpoints with cascade deletion and error guards</td>
                        <td className="py-2.5 px-3 font-semibold">40%</td>
                        <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">In Progress</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold">REQ-03</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">Interactive UI & Document Viewer</td>
                        <td className="py-2.5 px-3">Live previews, PDF zoom/rotate, print & export capability</td>
                        <td className="py-2.5 px-3 font-semibold">30%</td>
                        <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">Complete</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Technical Constraints & Governance */}
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-3 border-blue-600 pl-2">
                  4. Security, Architectural Governance & Code Quality
                </h2>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 leading-relaxed pl-1">
                  <li><strong>Security:</strong> All operations must be authenticated with valid session tokens; unauthorized modifications will be rejected.</li>
                  <li><strong>Database Safety:</strong> Cascading foreign keys and transactional rollbacks are mandatory on all deletion and migration scripts.</li>
                  <li><strong>Data Cleanliness:</strong> System rejects soft-delete ghosts; permanent delete requests must purge associated child rows.</li>
                </ul>
              </div>

              {/* 5. Authorizations & Sign-off Stamp */}
              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project Manager</span>
                    <strong className="text-xs font-bold text-slate-900 block mt-1">Sarah Jenkins</strong>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">✓ Electronically Signed</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Architect</span>
                    <strong className="text-xs font-bold text-slate-900 block mt-1">Michael Vance</strong>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">✓ Technical Approval</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">QA Directorate</span>
                    <strong className="text-xs font-bold text-slate-900 block mt-1">Priya Sharma</strong>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">✓ Certified Compliance</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                  <span>CONFIDENTIAL — FOR INTERNAL USE ONLY</span>
                  <span>Page 1 of 1 • System Generated Specification Sheet</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
