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
  projectName = 'HRMS'
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

  const rawFileName = fileName || 'Document.pdf';
  const displayPdfName = rawFileName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '.pdf');

  // Convert Base64 Data URL to a real browser Object URL if needed
  const { directUrl, isPdf, isImage } = useMemo(() => {
    if (!fileUrl) return { directUrl: null, isPdf: false, isImage: false };

    if (fileUrl.startsWith('data:')) {
      const parsed = dataUrlToBlob(fileUrl);
      if (parsed) {
        const url = URL.createObjectURL(parsed.blob);
        const isPdfType = parsed.mime.includes('pdf');
        const isImgType = parsed.mime.includes('image');
        return { directUrl: url, isPdf: isPdfType, isImage: isImgType };
      }
    }

    const isPdfType = fileUrl.includes('.pdf') || fileUrl.toLowerCase().endsWith('.pdf') || rawFileName.toLowerCase().endsWith('.pdf');
    const isImgType = /\.(jpg|jpeg|png|webp|gif)/i.test(fileUrl) || /\.(jpg|jpeg|png|webp|gif)$/i.test(rawFileName);

    return { directUrl: fileUrl, isPdf: isPdfType, isImage: isImgType };
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
      a.download = displayPdfName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs animate-fade-in">
      <div
        className={`bg-slate-900 rounded-2xl shadow-2xl flex flex-col border border-slate-700 overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[92vh]'
        }`}
      >
        {/* PDF Reader Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-slate-200 border-b border-slate-800 shrink-0">
          {/* File Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-[11px] shrink-0">
              PDF
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {displayPdfName}
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
              title="Download PDF"
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
        <div className="flex-1 overflow-auto bg-slate-800/90 p-3 sm:p-6 flex justify-center items-start min-h-0">
          {directUrl ? (
            isImage ? (
              /* A4 PDF Page Sheet with embedded image */
              <div
                className="bg-white rounded shadow-2xl overflow-hidden border border-slate-300 transition-transform duration-150 flex flex-col my-auto"
                style={{
                  width: '100%',
                  maxWidth: '820px',
                  minHeight: '1060px',
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'top center'
                }}
              >
                <div className="px-8 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
                  <span>{displayPdfName}</span>
                  <span>CONFIDENTIAL DOCUMENT</span>
                </div>
                <div className="p-6 sm:p-8 flex-1 flex items-center justify-center bg-white">
                  <img
                    src={directUrl}
                    alt={displayPdfName}
                    className="max-w-full max-h-[920px] object-contain mx-auto rounded"
                  />
                </div>
                <div className="px-8 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
                  <span>HRMS Document Specification</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            ) : (
              /* Native PDF Viewer Iframe loaded directly from server URL */
              <div
                className="w-full h-full min-h-[680px] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700 transition-transform duration-150"
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'top center'
                }}
              >
                <iframe
                  src={directUrl}
                  title={displayPdfName}
                  className="w-full h-full min-h-[680px] border-0"
                />
              </div>
            )
          ) : (
            /* Clean Empty State when No PDF Attached */
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-10 text-center space-y-4 max-w-md my-auto">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
                <FileText size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No PDF Document Attached</h3>
                <p className="text-xs text-slate-400 mt-1">
                  No PDF document was attached to this task by the administrator.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
