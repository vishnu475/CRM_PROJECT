import React, { useState } from 'react';
import { Banknote, Plus, Edit, ShieldCheck, Layers, UserCheck } from 'lucide-react';
import { SalaryStructureConfig, EmployeeSalaryMapping } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const SalaryStructureManager: React.FC = () => {
  const [structures, setStructures] = useState<SalaryStructureConfig[]>([
    { id: 'struct-1', name: 'Executive & Lead Grade (50/25/25)', basicPct: 50, hraPct: 25, conveyance: 5000, specialAllowance: 25000, pfRate: 12, esiRate: 0.75, ptaxAmount: 200, status: 'Active' },
    { id: 'struct-2', name: 'Senior Developer Grade (40/30/30)', basicPct: 40, hraPct: 30, conveyance: 4000, specialAllowance: 18000, pfRate: 12, esiRate: 0.75, ptaxAmount: 200, status: 'Active' },
    { id: 'struct-3', name: 'Junior Associate Grade (50/20/30)', basicPct: 50, hraPct: 20, conveyance: 3000, specialAllowance: 10000, pfRate: 12, esiRate: 0.75, ptaxAmount: 200, status: 'Active' }
  ]);

  const [mappings, setMappings] = useState<EmployeeSalaryMapping[]>([
    { empId: 'EMP-001', empName: 'Emma Watson', department: 'HR', monthlyCtc: 120000, structureId: 'struct-1', structureName: 'Executive & Lead Grade', basicSalary: 60000, hraAmount: 30000, specialAllowance: 30000, pfAmount: 7200, esiAmount: 900, ptaxAmount: 200 },
    { empId: 'EMP-002', empName: 'Robert Vance', department: 'Sales', monthlyCtc: 140000, structureId: 'struct-1', structureName: 'Executive & Lead Grade', basicSalary: 70000, hraAmount: 35000, specialAllowance: 35000, pfAmount: 8400, esiAmount: 1050, ptaxAmount: 200 },
    { empId: 'EMP-003', empName: 'James Smith', department: 'Engineering', monthlyCtc: 180000, structureId: 'struct-2', structureName: 'Senior Developer Grade', basicSalary: 72000, hraAmount: 54000, specialAllowance: 54000, pfAmount: 8640, esiAmount: 1350, ptaxAmount: 200 },
    { empId: 'EMP-004', empName: 'Michael Brown', department: 'Finance', monthlyCtc: 190000, structureId: 'struct-1', structureName: 'Executive & Lead Grade', basicSalary: 95000, hraAmount: 47500, specialAllowance: 47500, pfAmount: 11400, esiAmount: 1425, ptaxAmount: 200 }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedMapEmp, setSelectedMapEmp] = useState<EmployeeSalaryMapping | null>(null);

  const [newStruct, setNewStruct] = useState({
    name: '',
    basicPct: 50,
    hraPct: 25,
    conveyance: 4000,
    specialAllowance: 15000
  });

  const handleAddStructure = () => {
    const created: SalaryStructureConfig = {
      id: `struct-${structures.length + 1}`,
      name: newStruct.name,
      basicPct: Number(newStruct.basicPct),
      hraPct: Number(newStruct.hraPct),
      conveyance: Number(newStruct.conveyance),
      specialAllowance: Number(newStruct.specialAllowance),
      pfRate: 12,
      esiRate: 0.75,
      ptaxAmount: 200,
      status: 'Active'
    };
    setStructures([...structures, created]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Salary Structures List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="text-emerald-600" size={18} /> Salary Structures & Component Rules
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Earnings formulas (Basic %, HRA %, Special Allowance) & Statutory Deductions (PF 12%, ESI 0.75%, PTax).</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={14} /> Add Salary Structure
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {structures.map((st) => (
            <div key={st.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-emerald-200 transition-all">
              <div className="flex justify-between items-center">
                <Badge variant="info">Rule Engine</Badge>
                <Badge variant={st.status === 'Active' ? 'success' : 'danger'}>{st.status}</Badge>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Basic: {st.basicPct}% • HRA: {st.hraPct}%</p>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                <div className="flex justify-between">
                  <span>Conveyance Allowance:</span>
                  <span className="font-bold text-slate-800">₹ {st.conveyance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Statutory PF / ESI Rate:</span>
                  <span className="font-bold text-emerald-600">{st.pfRate}% / {st.esiRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional Tax (PTax):</span>
                  <span className="font-bold text-slate-700">₹ {st.ptaxAmount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee → Salary Structure Mapping Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <UserCheck size={16} className="text-emerald-600" /> Employee → Salary Structure Mappings
          </h3>
          <span className="text-xs text-slate-400 font-mono">Backend statutory API delegation ready</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">EMP ID</th>
                <th className="p-3.5">Employee Name</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5 font-bold text-slate-900">Monthly CTC</th>
                <th className="p-3.5">Assigned Structure</th>
                <th className="p-3.5">Basic Salary</th>
                <th className="p-3.5">HRA</th>
                <th className="p-3.5">PF (12%)</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mappings.map((m) => (
                <tr key={m.empId} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono text-purple-600 font-bold">{m.empId}</td>
                  <td className="p-3.5 font-bold text-slate-900">{m.empName}</td>
                  <td className="p-3.5 font-semibold text-slate-700">{m.department}</td>
                  <td className="p-3.5 font-extrabold text-slate-900">₹ {m.monthlyCtc.toLocaleString()}</td>
                  <td className="p-3.5 font-semibold text-emerald-600">{m.structureName}</td>
                  <td className="p-3.5 font-mono">₹ {m.basicSalary.toLocaleString()}</td>
                  <td className="p-3.5 font-mono">₹ {m.hraAmount.toLocaleString()}</td>
                  <td className="p-3.5 font-mono text-rose-600 font-bold">₹ {m.pfAmount.toLocaleString()}</td>
                  <td className="p-3.5 text-right">
                    <button onClick={() => { setSelectedMapEmp(m); setIsMapModalOpen(true); }} className="text-emerald-600 font-bold hover:underline">
                      Re-Assign &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Structure Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Salary Structure Configuration">
        <div className="space-y-4 text-xs">
          <Input label="Structure Name" placeholder="e.g. Executive Senior Grade" value={newStruct.name} onChange={(e) => setNewStruct({ ...newStruct, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Basic Salary % of CTC" type="number" value={newStruct.basicPct} onChange={(e) => setNewStruct({ ...newStruct, basicPct: Number(e.target.value) })} />
            <Input label="HRA % of CTC" type="number" value={newStruct.hraPct} onChange={(e) => setNewStruct({ ...newStruct, hraPct: Number(e.target.value) })} />
          </div>
          <Input label="Conveyance Allowance (₹)" type="number" value={newStruct.conveyance} onChange={(e) => setNewStruct({ ...newStruct, conveyance: Number(e.target.value) })} />
          <Input label="Special Allowance (₹)" type="number" value={newStruct.specialAllowance} onChange={(e) => setNewStruct({ ...newStruct, specialAllowance: Number(e.target.value) })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddStructure}>Save Structure</Button>
          </div>
        </div>
      </Modal>

      {/* Re-Assign Structure Modal */}
      {selectedMapEmp && (
        <Modal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} title={`Re-Assign Structure: ${selectedMapEmp.empName}`}>
          <div className="space-y-4 text-xs">
            <Select
              label="Select Structure"
              options={structures.map(s => ({ label: s.name, value: s.id }))}
            />
            <Input label="Monthly Base CTC (₹)" type="number" defaultValue={selectedMapEmp.monthlyCtc} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsMapModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setIsMapModalOpen(false)}>Update Assignment</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
