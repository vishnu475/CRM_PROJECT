import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Hash, Save, CheckCircle2, RotateCcw, HelpCircle, Layers, FileText, User, ShoppingCart, Receipt, FolderKanban } from 'lucide-react';
import { SystemNumberingSequence } from '../types';

export const NumberingSettingsManager: React.FC = () => {
  const { employees, invoices, tasks, leads, projects } = useApp();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Initialize sequences with dynamic counts from real data
  const [sequences, setSequences] = useState<SystemNumberingSequence[]>(() => {
    const saved = localStorage.getItem('crm_numbering_sequences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    const empCount = Math.max(1, employees.length + 1);
    const taskCount = Math.max(1, (tasks ? tasks.length : 0) + 1);
    const invCount = Math.max(1, (invoices ? invoices.length : 0) + 1);
    const leadCount = Math.max(1, (leads ? leads.length : 0) + 1);
    const prjCount = Math.max(1, (projects ? projects.length : 0) + 1);

    return [
      {
        module: 'Employee',
        prefix: 'EMP',
        separator: '-',
        nextNumber: empCount,
        paddingDigits: 4,
        exampleFormatted: `EMP-${String(empCount).padStart(4, '0')}`,
        description: 'Employee ID generation for personnel onboarding and HR records'
      },
      {
        module: 'Task',
        prefix: 'TSK',
        separator: '-',
        nextNumber: taskCount,
        paddingDigits: 4,
        exampleFormatted: `TSK-${String(taskCount).padStart(4, '0')}`,
        description: 'Work order and task deliverable unique tracker'
      },
      {
        module: 'Invoice',
        prefix: 'INV',
        separator: '-',
        nextNumber: invCount,
        paddingDigits: 6,
        exampleFormatted: `INV-${String(invCount).padStart(6, '0')}`,
        description: 'Customer sales invoices and accounting tax billings'
      },
      {
        module: 'Voucher',
        prefix: 'VCHR',
        separator: '-',
        nextNumber: 1,
        paddingDigits: 6,
        exampleFormatted: 'VCHR-000001',
        description: 'Payment, receipt and journal financial vouchers'
      },
      {
        module: 'Purchase',
        prefix: 'PO',
        separator: '-',
        nextNumber: 1,
        paddingDigits: 5,
        exampleFormatted: 'PO-00001',
        description: 'Vendor purchase orders and procurement requisition'
      },
      {
        module: 'Lead',
        prefix: 'LD',
        separator: '-',
        nextNumber: leadCount,
        paddingDigits: 5,
        exampleFormatted: `LD-${String(leadCount).padStart(5, '0')}`,
        description: 'Sales pipeline prospect and lead identification'
      },
      {
        module: 'Project',
        prefix: 'PRJ',
        separator: '-',
        nextNumber: prjCount,
        paddingDigits: 4,
        exampleFormatted: `PRJ-${String(prjCount).padStart(4, '0')}`,
        description: 'Client delivery project code prefix'
      }
    ];
  });

  const updateSequence = (module: string, updates: Partial<SystemNumberingSequence>) => {
    setSequences(prev => prev.map(s => {
      if (s.module === module) {
        const merged = { ...s, ...updates };
        const padded = String(merged.nextNumber).padStart(merged.paddingDigits, '0');
        const example = `${merged.prefix}${merged.separator}${padded}`;
        return {
          ...merged,
          exampleFormatted: example
        };
      }
      return s;
    }));
  };

  const handleSaveSequences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('crm_numbering_sequences', JSON.stringify(sequences));
    setSuccessToast('Document & Employee auto-numbering sequences saved successfully!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleResetDefaults = () => {
    const empCount = Math.max(1, employees.length + 1);
    const taskCount = Math.max(1, (tasks ? tasks.length : 0) + 1);
    const invCount = Math.max(1, (invoices ? invoices.length : 0) + 1);

    const defaults: SystemNumberingSequence[] = [
      { module: 'Employee', prefix: 'EMP', separator: '-', nextNumber: empCount, paddingDigits: 4, exampleFormatted: `EMP-${String(empCount).padStart(4, '0')}`, description: 'Employee ID generation for personnel onboarding and HR records' },
      { module: 'Task', prefix: 'TSK', separator: '-', nextNumber: taskCount, paddingDigits: 4, exampleFormatted: `TSK-${String(taskCount).padStart(4, '0')}`, description: 'Work order and task deliverable unique tracker' },
      { module: 'Invoice', prefix: 'INV', separator: '-', nextNumber: invCount, paddingDigits: 6, exampleFormatted: `INV-${String(invCount).padStart(6, '0')}`, description: 'Customer sales invoices and accounting tax billings' },
      { module: 'Voucher', prefix: 'VCHR', separator: '-', nextNumber: 1, paddingDigits: 6, exampleFormatted: 'VCHR-000001', description: 'Payment, receipt and journal financial vouchers' },
      { module: 'Purchase', prefix: 'PO', separator: '-', nextNumber: 1, paddingDigits: 5, exampleFormatted: 'PO-00001', description: 'Vendor purchase orders and procurement requisition' },
      { module: 'Lead', prefix: 'LD', separator: '-', nextNumber: 1001, paddingDigits: 5, exampleFormatted: 'LD-01001', description: 'Sales pipeline prospect and lead identification' },
      { module: 'Project', prefix: 'PRJ', separator: '-', nextNumber: 101, paddingDigits: 4, exampleFormatted: 'PRJ-0101', description: 'Client delivery project code prefix' }
    ];

    setSequences(defaults);
    localStorage.setItem('crm_numbering_sequences', JSON.stringify(defaults));
    setSuccessToast('Reset all auto-numbering sequences to dynamic system defaults.');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Hash size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900">Document & Employee Auto-Numbering Sequences</h2>
          </div>
          <p className="text-xs text-slate-500 pl-10">
            Configure dynamic prefix patterns, sequence starting numbers, zero padding digits, and separators across all enterprise modules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw size={12} /> Reset System Defaults
          </button>
        </div>
      </div>

      {/* Main Table Form */}
      <form onSubmit={handleSaveSequences} className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Module / Entity</th>
                  <th className="py-3 px-4">Prefix Code</th>
                  <th className="py-3 px-4">Separator</th>
                  <th className="py-3 px-4">Next Sequence #</th>
                  <th className="py-3 px-4">Padding Digits</th>
                  <th className="py-3 px-4">Live Format Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sequences.map(seq => (
                  <tr key={seq.module} className="hover:bg-slate-50/70 transition">
                    {/* Module Entity & Description */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {seq.module === 'Employee' && <User size={14} className="text-blue-600" />}
                        {seq.module === 'Task' && <Layers size={14} className="text-indigo-600" />}
                        {seq.module === 'Invoice' && <Receipt size={14} className="text-emerald-600" />}
                        {seq.module === 'Purchase' && <ShoppingCart size={14} className="text-purple-600" />}
                        {seq.module === 'Project' && <FolderKanban size={14} className="text-cyan-600" />}
                        {seq.module === 'Voucher' && <FileText size={14} className="text-amber-600" />}
                        {seq.module === 'Lead' && <Hash size={14} className="text-slate-600" />}
                        <span>{seq.module} Numbering</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 max-w-xs">{seq.description}</div>
                    </td>

                    {/* Prefix Code */}
                    <td className="py-3.5 px-4 font-mono">
                      <input
                        type="text"
                        value={seq.prefix}
                        onChange={(e) => updateSequence(seq.module, { prefix: e.target.value.toUpperCase() })}
                        className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        required
                      />
                    </td>

                    {/* Separator */}
                    <td className="py-3.5 px-4 font-mono">
                      <select
                        value={seq.separator}
                        onChange={(e) => updateSequence(seq.module, { separator: e.target.value })}
                        className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="-">- (Hyphen)</option>
                        <option value="/">/ (Slash)</option>
                        <option value="_">_ (Underscore)</option>
                        <option value="">None (Empty)</option>
                      </select>
                    </td>

                    {/* Next Sequence # */}
                    <td className="py-3.5 px-4 font-mono">
                      <input
                        type="number"
                        min="1"
                        value={seq.nextNumber}
                        onChange={(e) => updateSequence(seq.module, { nextNumber: Math.max(1, Number(e.target.value)) })}
                        className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        required
                      />
                    </td>

                    {/* Padding Digits */}
                    <td className="py-3.5 px-4 font-mono">
                      <select
                        value={seq.paddingDigits}
                        onChange={(e) => updateSequence(seq.module, { paddingDigits: Number(e.target.value) })}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value={3}>3 Digits (001)</option>
                        <option value={4}>4 Digits (0001)</option>
                        <option value={5}>5 Digits (00001)</option>
                        <option value={6}>6 Digits (000001)</option>
                      </select>
                    </td>

                    {/* Generated Live Format Example */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-xs font-bold tracking-wide font-mono inline-block">
                        {seq.exampleFormatted}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Save size={14} /> Save Auto-Numbering Sequences
          </button>
        </div>
      </form>
    </div>
  );
};
