import React, { useState } from 'react';
import { Hash, Edit, CheckCircle2 } from 'lucide-react';
import { SystemNumberingSequence } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const NumberingSettingsManager: React.FC = () => {
  const [sequences, setSequences] = useState<SystemNumberingSequence[]>([
    { module: 'Invoice', prefix: 'INV', nextNumber: 1, paddingDigits: 6, exampleFormatted: 'INV-000001' },
    { module: 'Voucher', prefix: 'VCHR', nextNumber: 1, paddingDigits: 6, exampleFormatted: 'VCHR-000001' },
    { module: 'Purchase', prefix: 'PO', nextNumber: 1, paddingDigits: 6, exampleFormatted: 'PO-000001' },
    { module: 'Employee', prefix: 'EMP', nextNumber: 1, paddingDigits: 6, exampleFormatted: 'EMP-000001' }
  ]);

  const updateSequence = (module: string, newPrefix: string, nextNum: number) => {
    setSequences(sequences.map(s => {
      if (s.module === module) {
        const padded = String(nextNum).padStart(s.paddingDigits, '0');
        return {
          ...s,
          prefix: newPrefix,
          nextNumber: nextNum,
          exampleFormatted: `${newPrefix}-${padded}`
        };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Hash className="text-indigo-600" size={18} /> Document Auto-Numbering Sequences & Formats
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Configure prefix patterns, next sequence numbers, and zero-padded digit formatting.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3.5">Module Document</th>
              <th className="p-3.5">Prefix Code</th>
              <th className="p-3.5">Next Sequence #</th>
              <th className="p-3.5">Padding Digits</th>
              <th className="p-3.5 font-bold text-slate-900">Generated Format Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sequences.map(s => (
              <tr key={s.module} className="hover:bg-slate-50">
                <td className="p-3.5 font-bold text-slate-900">{s.module} Document</td>
                <td className="p-3.5 font-mono">
                  <input
                    type="text"
                    value={s.prefix}
                    onChange={(e) => updateSequence(s.module, e.target.value, s.nextNumber)}
                    className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-bold uppercase text-indigo-600 focus:outline-none"
                  />
                </td>
                <td className="p-3.5 font-mono">
                  <input
                    type="number"
                    value={s.nextNumber}
                    onChange={(e) => updateSequence(s.module, s.prefix, Number(e.target.value))}
                    className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-bold text-slate-800 focus:outline-none"
                  />
                </td>
                <td className="p-3.5 font-mono text-slate-500">{s.paddingDigits} Digits Padded</td>
                <td className="p-3.5 font-mono font-bold text-emerald-600 text-sm">
                  <Badge variant="success">{s.exampleFormatted}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
