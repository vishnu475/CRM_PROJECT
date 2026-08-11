import React, { useState } from 'react';
import { Umbrella, Plus, Edit, ShieldCheck, DollarSign } from 'lucide-react';
import { LeaveTypeMasterConfig } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const LeaveTypeMasterManager: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeMasterConfig[]>([
    { id: 'lt-1', code: 'CL-01', name: 'Casual Leave (CL)', annualQuota: 12, isEncashable: false, carryForwardMax: 0, status: 'Active' },
    { id: 'lt-2', code: 'SL-02', name: 'Sick Leave (SL)', annualQuota: 10, isEncashable: false, carryForwardMax: 5, status: 'Active' },
    { id: 'lt-3', code: 'EL-03', name: 'Earned Leave (EL)', annualQuota: 15, isEncashable: true, carryForwardMax: 30, status: 'Active' },
    { id: 'lt-4', code: 'CO-04', name: 'Comp-Off', annualQuota: 6, isEncashable: false, carryForwardMax: 2, status: 'Active' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newType, setNewType] = useState({ name: 'Casual Leave (CL)', quota: 12, isEncashable: false, carryForward: 0 });

  const handleAddLeaveType = () => {
    const code = `LT-0${leaveTypes.length + 1}`;
    setLeaveTypes([
      ...leaveTypes,
      { id: `lt-${leaveTypes.length + 1}`, code, name: newType.name as any, annualQuota: Number(newType.quota), isEncashable: newType.isEncashable, carryForwardMax: Number(newType.carryForward), status: 'Active' }
    ]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Umbrella className="text-amber-600" size={18} /> Leave Type Master Configuration
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Configure annual leave quotas, encashability rules, and carry-forward limits.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} /> Add Leave Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveTypes.map((lt) => (
          <div key={lt.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-amber-200 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-amber-600 font-bold">{lt.code}</span>
              <Badge variant={lt.status === 'Active' ? 'success' : 'danger'}>{lt.status}</Badge>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{lt.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Annual Quota: <span className="font-bold text-slate-800">{lt.annualQuota} Days</span></p>
            </div>
            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Encashable:</span>
                <span className={`font-bold ${lt.isEncashable ? 'text-emerald-600' : 'text-slate-400'}`}>{lt.isEncashable ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Max Carry Forward:</span>
                <span className="font-bold text-slate-700">{lt.carryForwardMax} Days</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Leave Type Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure New Leave Type">
        <div className="space-y-4 text-xs">
          <Input label="Leave Type Name" placeholder="e.g. Maternity Leave" value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value as any })} />
          <Input label="Annual Quota (Days)" type="number" value={newType.quota} onChange={(e) => setNewType({ ...newType, quota: Number(e.target.value) })} />
          <Input label="Max Carry Forward Days" type="number" value={newType.carryForward} onChange={(e) => setNewType({ ...newType, carryForward: Number(e.target.value) })} />
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="encashable" checked={newType.isEncashable} onChange={(e) => setNewType({ ...newType, isEncashable: e.target.checked })} />
            <label htmlFor="encashable" className="font-semibold text-slate-700">Allow Encashment for this Leave Type</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddLeaveType}>Save Leave Type</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
