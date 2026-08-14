import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { ExtendedEmployee } from '../types';

interface EmployeeTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: ExtendedEmployee | null;
  onTransfer: (transferData: {
    newDepartment: string;
    newDesignation?: string;
    newManagerName?: string;
    reason?: string;
  }) => void;
  departments: string[];
}

export const EmployeeTransferModal: React.FC<EmployeeTransferModalProps> = ({
  isOpen,
  onClose,
  employee,
  onTransfer,
  departments,
}) => {
  const [newDepartment, setNewDepartment] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (employee) {
      setNewDepartment(employee.department);
      setNewDesignation(employee.designation);
      setNewManagerName(employee.reportingManagerName || '');
      setReason('');
    }
  }, [employee]);

  if (!employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment) return;

    onTransfer({
      newDepartment,
      newDesignation: newDesignation || employee.designation,
      newManagerName: newManagerName || employee.reportingManagerName,
      reason: reason || 'Departmental Transfer',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Department Transfer - ${employee.name} (${employee.empCode || employee.id})`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">{employee.name}</p>
            <p className="text-slate-500">Employee ID: <span className="font-mono text-purple-700 font-bold">{employee.empCode || employee.id}</span></p>
          </div>
          <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded font-semibold text-[10px]">
            Preserving ID across transfer
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Current Department</label>
            <input
              disabled
              value={employee.department}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-slate-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">New Department *</label>
            <select
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
              required
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Current Designation</label>
            <input
              disabled
              value={employee.designation}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-slate-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">New Designation</label>
            <input
              type="text"
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
              placeholder="e.g. Product Manager"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">New Reporting Manager</label>
          <input
            type="text"
            value={newManagerName}
            onChange={(e) => setNewManagerName(e.target.value)}
            placeholder="e.g. Jane Doe (Director)"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Transfer Justification / Reason</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain reason for transfer (logged into employment history audit trail)..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            <RefreshCw size={14} /> Execute Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
