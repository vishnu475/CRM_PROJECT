import React, { useState } from 'react';
import { DollarSign, Clock, Plus, CheckCircle2, Award } from 'lucide-react';
import { LeaveEncashmentRequest, CompOffGrantRequest } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const EncashmentCompOffView: React.FC = () => {
  const [encashments, setEncashments] = useState<LeaveEncashmentRequest[]>([
    { id: 'enc-1', empId: 'EMP-001', empName: 'Emma Watson', leaveType: 'Earned Leave (EL)', encashDays: 5, estimatedAmount: 25000, status: 'Pending', appliedDate: '2026-08-01' },
    { id: 'enc-2', empId: 'EMP-003', empName: 'James Smith', leaveType: 'Earned Leave (EL)', encashDays: 10, estimatedAmount: 60000, status: 'Approved', appliedDate: '2026-07-15' }
  ]);

  const [compOffs, setCompOffs] = useState<CompOffGrantRequest[]>([
    { id: 'co-1', empId: 'EMP-002', empName: 'Robert Vance', workedDate: '2026-08-09 (Sunday)', reason: 'Client Emergency Production Release', grantedDays: 1, status: 'Approved' }
  ]);

  const [isEncashModalOpen, setIsEncashModalOpen] = useState(false);
  const [isCompOffModalOpen, setIsCompOffModalOpen] = useState(false);

  const approveEncashment = (id: string) => {
    setEncashments(encashments.map(e => e.id === id ? { ...e, status: 'Approved' } : e));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Leave Encashment Column */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <DollarSign size={16} className="text-emerald-600" /> Leave Encashment Requests
          </h3>
          <Button variant="outline" size="sm" onClick={() => setIsEncashModalOpen(true)}>
            <Plus size={14} /> Encash Leaves
          </Button>
        </div>

        <div className="space-y-3">
          {encashments.map((enc) => (
            <div key={enc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{enc.empName}</span>
                <Badge variant={enc.status === 'Approved' ? 'success' : 'warning'}>{enc.status}</Badge>
              </div>
              <p className="text-slate-500">Days to encash: <span className="font-bold text-slate-800">{enc.encashDays} Days EL</span></p>
              <p className="text-emerald-600 font-bold">Est. Payout: ₹ {enc.estimatedAmount.toLocaleString()}</p>
              {enc.status === 'Pending' && (
                <div className="pt-2 flex justify-end">
                  <Button variant="primary" size="sm" onClick={() => approveEncashment(enc.id)}>
                    <CheckCircle2 size={12} /> Approve Encashment
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comp-Off Workflow Column */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Award size={16} className="text-purple-600" /> Comp-Off Credit Grants
          </h3>
          <Button variant="outline" size="sm" onClick={() => setIsCompOffModalOpen(true)}>
            <Plus size={14} /> Request Comp-Off
          </Button>
        </div>

        <div className="space-y-3">
          {compOffs.map((co) => (
            <div key={co.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{co.empName}</span>
                <Badge variant="success">{co.status}</Badge>
              </div>
              <p className="text-slate-500">Worked Date: <span className="font-bold text-slate-800">{co.workedDate}</span></p>
              <p className="text-slate-600 italic">"{co.reason}"</p>
              <p className="text-purple-600 font-bold">Credit Granted: +{co.grantedDays} Day Comp-Off</p>
            </div>
          ))}
        </div>
      </div>

      {/* Encash Modal */}
      <Modal isOpen={isEncashModalOpen} onClose={() => setIsEncashModalOpen(false)} title="Apply for Leave Encashment">
        <div className="space-y-4 text-xs">
          <Input label="Encashment Days (EL)" type="number" defaultValue="5" />
          <p className="text-slate-500">Est. Payout per day: ₹ 5,000 (Calculated based on Basic Salary)</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsEncashModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsEncashModalOpen(false)}>Submit Encashment Claim</Button>
          </div>
        </div>
      </Modal>

      {/* Comp-Off Modal */}
      <Modal isOpen={isCompOffModalOpen} onClose={() => setIsCompOffModalOpen(false)} title="Claim Weekend / Overtime Comp-Off">
        <div className="space-y-4 text-xs">
          <Input label="Worked Weekend Date" type="date" defaultValue="2026-08-09" />
          <Input label="Business Justification" placeholder="Explain extra work done..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsCompOffModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsCompOffModalOpen(false)}>Claim Comp-Off Credit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
