import React, { useState } from 'react';
import { Plus, CheckCircle2, FileText, Send, UserCheck } from 'lucide-react';
import { Candidate, OfferLetter, OfferStatus } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

interface OfferManagerProps {
  candidates: Candidate[];
  offers: OfferLetter[];
  onSaveOffer: (offer: Partial<OfferLetter>) => void;
  onOpenConvertModal: (candidate: Candidate) => void;
}

export const OfferManager: React.FC<OfferManagerProps> = ({
  candidates,
  offers,
  onSaveOffer,
  onOpenConvertModal
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    candidateId: candidates[0]?.id || '',
    position: 'Senior Full Stack Engineer',
    salary: 1800000,
    doj: '2026-09-01',
    reportingManager: 'Sarah Jenkins',
    branch: 'Bengaluru HQ',
    status: 'Sent' as OfferStatus
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cand = candidates.find(c => c.id === form.candidateId) || candidates[0];
    onSaveOffer({
      ...form,
      candidateName: cand ? cand.name : 'Candidate'
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Offer Letters & Hiring Commitments</h3>
          <p className="text-xs text-slate-500 mt-0.5">Generate formal offer letters and track acceptance status.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} /> Generate Offer Letter
        </Button>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Candidate</th>
                <th className="p-3">Offered Position</th>
                <th className="p-3">Annual Package (CTC)</th>
                <th className="p-3">Target DOJ</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offers.map(off => {
                const cand = candidates.find(c => c.id === off.candidateId);
                return (
                  <tr key={off.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{off.candidateName}</td>
                    <td className="p-3 font-semibold text-slate-800">{off.position}</td>
                    <td className="p-3 font-bold text-emerald-600">₹ {(off.salary || 1200000).toLocaleString()} PA</td>
                    <td className="p-3 font-mono text-slate-600">{off.doj}</td>
                    <td className="p-3 text-slate-600">{off.branch}</td>
                    <td className="p-3">
                      <Badge variant={off.status === 'Accepted' ? 'success' : off.status === 'Sent' ? 'info' : 'warning'}>
                        {off.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {off.status === 'Sent' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-emerald-600 hover:text-emerald-700"
                          onClick={() => onSaveOffer({ ...off, status: 'Accepted' })}
                        >
                          Mark Accepted
                        </Button>
                      )}

                      {off.status === 'Accepted' && cand && !cand.isConverted && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-[10px] py-1 px-2"
                          onClick={() => onOpenConvertModal(cand)}
                        >
                          <UserCheck size={11} /> Convert to Employee
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Offer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Formal Offer Letter">
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Candidate</label>
            <Select
              value={form.candidateId}
              onChange={(e) => setForm({ ...form, candidateId: e.target.value })}
              options={candidates.map(c => ({ value: c.id, label: `${c.name} (${c.appliedPosition})` }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Offered Position</label>
              <Input
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Annual CTC (₹)</label>
              <Input
                type="number"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Date of Joining (DOJ)</label>
              <Input
                type="date"
                value={form.doj}
                onChange={(e) => setForm({ ...form, doj: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Offer Status</label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as OfferStatus })}
                options={[
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Manager Review', label: 'Manager Review' },
                  { value: 'HR Approval', label: 'HR Approval' },
                  { value: 'Sent', label: 'Sent to Candidate' },
                  { value: 'Accepted', label: 'Accepted by Candidate' }
                ]}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Offer Letter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
