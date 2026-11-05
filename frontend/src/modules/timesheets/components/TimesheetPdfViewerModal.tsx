import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { TimesheetProof } from '../types';

interface Props {
  timesheetId: string;
  entryId: string;
  proof: TimesheetProof;
  onClose: () => void;
}

export const TimesheetPdfViewerModal: React.FC<Props> = ({
  timesheetId,
  entryId,
  proof,
  onClose
}) => {
  const streamUrl = `/api/timesheets/${timesheetId}/entries/${entryId}/proof`;
  const downloadUrl = `/api/timesheets/${timesheetId}/entries/${entryId}/proof?download=true`;

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-md">
                  {proof.file_name}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-900">
                  PDF Work Proof
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatFileSize(proof.file_size)} • Uploaded {proof.uploaded_at ? new Date(proof.uploaded_at).toLocaleString() : 'Recently'} {proof.uploaded_by ? `by ${proof.uploaded_by}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download={proof.file_name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              <Download size={14} />
              <span>Download</span>
            </a>

            <a
              href={streamUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF Frame Viewer */}
        <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950 p-2 overflow-hidden flex flex-col">
          <iframe
            src={streamUrl}
            title={proof.file_name}
            className="w-full h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white"
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center text-xs text-slate-500">
          <span>Supporting work proof document</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
