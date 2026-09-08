import React, { useState } from 'react';
import { X, UploadCloud, History, CheckCircle2, AlertCircle } from 'lucide-react';
import { DocumentItem } from '../types';
import { documentApiService } from '../services/documentApiService';

interface DocumentVersionModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentVersionModal: React.FC<DocumentVersionModalProps> = ({
  document,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [changeDescription, setChangeDescription] = useState('');
  const [versionIncrement, setVersionIncrement] = useState<'minor' | 'major'>('minor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const handleFile = (file: File | null) => {
    if (!file) return;
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setFileDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileDataUrl) {
      setError('Please choose a file to upload.');
      return;
    }
    setIsSubmitting(true);
    try {
      await documentApiService.createVersion(document.id, {
        file_name: selectedFile.name,
        file_data: fileDataUrl,
        change_description: changeDescription || 'Updated version',
        version_increment: versionIncrement
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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upload New Revision</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-xs">
                Current: <span className="font-mono font-bold text-purple-700">{document.current_version}</span> - {document.document_name}
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

          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Revised Document File *
            </label>
            <div
              onClick={() => window.document.getElementById('ver-file-input')?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition ${
                selectedFile ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-300 hover:border-purple-400 bg-slate-50'
              }`}
            >
              <input
                id="ver-file-input"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span>{selectedFile.name} ({(selectedFile.size / 1048576).toFixed(2)} MB)</span>
                </div>
              ) : (
                <div className="text-slate-500 text-xs">
                  <UploadCloud size={28} className="mx-auto text-slate-400 mb-1" />
                  <p className="font-semibold">Click to browse revision file</p>
                </div>
              )}
            </div>
          </div>

          {/* Version Increment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Revision Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 border rounded-xl flex items-center space-x-2 cursor-pointer transition ${
                  versionIncrement === 'minor' ? 'border-purple-500 bg-purple-50/50' : 'border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="ver_inc"
                  checked={versionIncrement === 'minor'}
                  onChange={() => setVersionIncrement('minor')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800">Minor Revision</p>
                  <p className="text-[10px] text-slate-500">e.g. v1.0 &rarr; v1.1</p>
                </div>
              </label>

              <label
                className={`p-3 border rounded-xl flex items-center space-x-2 cursor-pointer transition ${
                  versionIncrement === 'major' ? 'border-purple-500 bg-purple-50/50' : 'border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="ver_inc"
                  checked={versionIncrement === 'major'}
                  onChange={() => setVersionIncrement('major')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800">Major Revision</p>
                  <p className="text-[10px] text-slate-500">e.g. v1.0 &rarr; v2.0</p>
                </div>
              </label>
            </div>
          </div>

          {/* Change Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Change Description *
            </label>
            <textarea
              required
              rows={2}
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              placeholder="Describe what changed or why this revision was uploaded..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
            />
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
              disabled={isSubmitting || !selectedFile}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition shadow-sm"
            >
              {isSubmitting ? 'Uploading...' : 'Publish Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
