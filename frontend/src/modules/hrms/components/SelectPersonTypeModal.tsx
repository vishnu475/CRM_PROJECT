import React, { useState } from 'react';
import { UserCheck, GraduationCap, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../../../components/common/Button';

interface SelectPersonTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'employee' | 'intern') => void;
}

export const SelectPersonTypeModal: React.FC<SelectPersonTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  const [selectedType, setSelectedType] = useState<'employee' | 'intern' | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedType) {
      onSelectType(selectedType);
      setSelectedType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-purple-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Select Person Type</h2>
              <p className="text-xs text-slate-500">What type of person would you like to add?</p>
            </div>
          </div>
          <button
            onClick={() => { setSelectedType(null); onClose(); }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Two Large Cards */}
        <div className="p-6 space-y-3.5">
          {/* Employee Option */}
          <div
            onClick={() => setSelectedType('employee')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
              selectedType === 'employee'
                ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20 shadow-md'
                : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50/70'
            }`}
          >
            <div className={`p-3 rounded-xl shrink-0 transition-colors ${
              selectedType === 'employee' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
            }`}>
              <UserCheck size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Employee
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full">Permanent</span>
                </h3>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedType === 'employee' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                }`}>
                  {selectedType === 'employee' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Permanent / regular organization employee
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Standard employee onboarding, payroll assignment, statutory records, and reporting hierarchy.
              </p>
            </div>
          </div>

          {/* Intern Option */}
          <div
            onClick={() => setSelectedType('intern')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
              selectedType === 'intern'
                ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20 shadow-md'
                : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50/70'
            }`}
          >
            <div className={`p-3 rounded-xl shrink-0 transition-colors ${
              selectedType === 'intern' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
            }`}>
              <GraduationCap size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Intern
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full">Trainee / Candidate</span>
                </h3>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedType === 'intern' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                }`}>
                  {selectedType === 'intern' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Intern / trainee / internship candidate
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Multi-step intern onboarding, mentorship assignment, stipend, evaluations, and certification.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSelectedType(null); onClose(); }}
            className="text-xs font-semibold text-slate-600 border-slate-300 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedType}
            onClick={handleConfirm}
            className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <span>Confirm Selection</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};
