import React, { useState } from 'react';
import { FileText, Upload, Download, Trash2, ShieldCheck, FilePlus } from 'lucide-react';
import { EmployeeDoc } from '../types';
import { Button } from '../../../components/common/Button';

export interface EmployeeDocumentManagerProps {
  employeeName: string;
  initialDocs?: EmployeeDoc[];
}

export const EmployeeDocumentManager: React.FC<EmployeeDocumentManagerProps> = ({ employeeName, initialDocs = [] }) => {
  const [docs, setDocs] = useState<EmployeeDoc[]>(initialDocs.length > 0 ? initialDocs : [
    { id: 'doc-1', name: 'Aadhaar Card Copy.pdf', category: 'ID Proof', uploadDate: '2026-08-01', size: '1.2 MB' },
    { id: 'doc-2', name: 'PAN Card Copy.pdf', category: 'Statutory', uploadDate: '2026-08-01', size: '850 KB' },
    { id: 'doc-3', name: 'Signed Offer Letter.pdf', category: 'Offer Letter', uploadDate: '2026-07-28', size: '2.4 MB' },
    { id: 'doc-4', name: 'Degree Certificate.pdf', category: 'Degree', uploadDate: '2026-07-25', size: '3.1 MB' }
  ]);

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
          <FileText size={16} className="text-purple-600" /> Documents Vault for {employeeName}
        </h4>
        <Button variant="outline" size="sm">
          <FilePlus size={14} /> Add Document
        </Button>
      </div>

      {/* Upload Dropzone */}
      <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50 text-slate-500 hover:border-purple-400 transition-colors cursor-pointer space-y-1">
        <Upload size={20} className="mx-auto text-purple-600" />
        <p className="font-bold text-slate-700">Click or drag files to upload documents</p>
        <p className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB (Aadhaar, PAN, Passport, Degree, Experience Letters)</p>
      </div>

      {/* Documents List */}
      <div className="space-y-2">
        {docs.map((doc) => (
          <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <FileText size={16} />
              </div>
              <div>
                <p className="font-bold text-slate-900">{doc.name}</p>
                <p className="text-[10px] text-slate-400">{doc.category} • Uploaded on {doc.uploadDate} • {doc.size}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Download">
                <Download size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
