import React, { useState } from 'react';
import { Clock, Plus, Edit, Sun, Moon } from 'lucide-react';
import { ShiftMasterConfig } from '../types';
import { useAttendance } from '../hooks/useAttendance';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';

export const ShiftMasterManager: React.FC = () => {
  const { shifts, saveShiftMaster, toggleShiftStatus } = useAttendance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftMasterConfig | null>(null);

  // Form State
  const [shiftForm, setShiftForm] = useState({
    code: '',
    name: '',
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    gracePeriodMins: 15,
    isNightShift: false
  });

  const handleOpenAdd = () => {
    setEditingShift(null);
    setShiftForm({
      code: `SH-0${shifts.length + 1}`,
      name: '',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      gracePeriodMins: 15,
      isNightShift: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sh: ShiftMasterConfig) => {
    setEditingShift(sh);
    setShiftForm({
      code: sh.code,
      name: sh.name,
      startTime: sh.startTime,
      endTime: sh.endTime,
      gracePeriodMins: sh.gracePeriodMins,
      isNightShift: sh.isNightShift
    });
    setIsModalOpen(true);
  };

  const handleSaveShift = () => {
    const shiftConfig: ShiftMasterConfig = {
      id: editingShift ? editingShift.id : `sh-${shifts.length + 1}`,
      code: shiftForm.code,
      name: shiftForm.name || 'Custom Shift',
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      workHours: 9,
      gracePeriodMins: Number(shiftForm.gracePeriodMins),
      breakDurationMins: 60,
      isNightShift: shiftForm.isNightShift,
      status: editingShift ? editingShift.status : 'Active'
    };

    saveShiftMaster(shiftConfig);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="text-blue-600" size={18} /> Shift Master Directory ({shifts.length} Configured Shifts)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Configure corporate work shifts, timing, and grace periods.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus size={14} /> Add Shift Master
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {shifts.map((sh: any) => (
          <div key={sh.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-200 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-blue-600 font-bold">{sh.code}</span>
              <div className="flex items-center gap-1.5">
                {sh.isNightShift ? <Moon size={14} className="text-purple-600" /> : <Sun size={14} className="text-amber-500" />}
                <Badge variant={sh.status === 'Active' ? 'success' : 'danger'}>{sh.status}</Badge>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm">{sh.name}</h4>
              <p className="text-xs font-mono text-slate-600 mt-0.5">{sh.startTime} - {sh.endTime}</p>
            </div>

            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Grace Period:</span>
                <span className="font-bold text-slate-700">{sh.gracePeriodMins} mins</span>
              </div>
              <div className="flex justify-between">
                <span>Total Work Hours:</span>
                <span className="font-bold text-slate-700">{sh.workHours} hrs</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <button onClick={() => toggleShiftStatus(sh.id)} className="text-slate-500 font-bold hover:underline">
                {sh.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => handleOpenEdit(sh)} className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                <Edit size={12} /> Edit Shift
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Shift Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingShift ? `Edit Shift: ${editingShift.name}` : "Add New Shift Master"}>
        <div className="space-y-4 text-xs">
          <Input label="Shift Code" placeholder="e.g. GS-01" value={shiftForm.code} onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })} />
          <Input label="Shift Name" placeholder="e.g. General Day Shift" value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Start Time" placeholder="09:00 AM" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} />
            <Input label="End Time" placeholder="06:00 PM" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })} />
          </div>
          <Input label="Grace Period (Minutes)" type="number" value={shiftForm.gracePeriodMins} onChange={(e) => setShiftForm({ ...shiftForm, gracePeriodMins: Number(e.target.value) })} />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isNightShift"
              checked={shiftForm.isNightShift}
              onChange={(e) => setShiftForm({ ...shiftForm, isNightShift: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isNightShift" className="text-slate-700 font-semibold">Overnight / Night Shift Policy</label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveShift}>Save Shift Master</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
