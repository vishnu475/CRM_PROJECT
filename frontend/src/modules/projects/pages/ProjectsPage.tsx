import React, { useState } from 'react';
import { FolderGit2, Plus, Users, Calendar, CheckCircle2, Clock, BarChart2, Search, Filter, ShieldCheck, UserCheck } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';

interface ProjectMemberAllocation {
  employeeId: string;
  employeeName: string;
  role: string;
  allocatedHours: number;
}

interface ProjectRecord {
  id: string;
  name: string;
  client: string;
  status: 'In Progress' | 'Completed' | 'On Hold' | 'Planning';
  members: ProjectMemberAllocation[];
  budget: number;
  progress: number;
  startDate: string;
  endDate: string;
}

export const ProjectsPage: React.FC = () => {
  const { employees } = useApp();

  const [projects, setProjects] = useState<ProjectRecord[]>([
    {
      id: 'PRJ-101',
      name: 'CRM & HRMS Enterprise Suite',
      client: 'Acme Global Corp',
      status: 'In Progress',
      members: [
        { employeeId: employees[0]?.id || 'EMP-001', employeeName: employees[0]?.name || 'Emma Watson', role: 'Project Lead', allocatedHours: 160 },
        { employeeId: employees[2]?.id || 'EMP-003', employeeName: employees[2]?.name || 'James Smith', role: 'Backend Developer', allocatedHours: 160 },
      ],
      budget: 1500000,
      progress: 68,
      startDate: '2026-06-01',
      endDate: '2026-10-31',
    },
    {
      id: 'PRJ-102',
      name: 'Supply Chain & Inventory ERP',
      client: 'Initech Logistics',
      status: 'Planning',
      members: [
        { employeeId: employees[1]?.id || 'EMP-002', employeeName: employees[1]?.name || 'Robert Brown', role: 'Business Analyst', allocatedHours: 80 },
      ],
      budget: 950000,
      progress: 25,
      startDate: '2026-08-01',
      endDate: '2026-12-15',
    },
  ]);

  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedEmpForMember, setSelectedEmpForMember] = useState(employees[0]?.id || '');
  const [memberRole, setMemberRole] = useState('Developer');
  const [memberHours, setMemberHours] = useState('80');

  const handleAddMemberToProject = () => {
    if (!selectedProject || !selectedEmpForMember) return;
    const emp = employees.find(e => e.id === selectedEmpForMember || e.empCode === selectedEmpForMember);
    if (!emp) return;

    const newMember: ProjectMemberAllocation = {
      employeeId: emp.empCode || emp.id,
      employeeName: emp.name,
      role: memberRole,
      allocatedHours: parseInt(memberHours) || 80,
    };

    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProject.id) return p;
      return {
        ...p,
        members: [...p.members.filter(m => m.employeeId !== newMember.employeeId), newMember]
      };
    }));

    setSelectedProject(prev => prev ? {
      ...prev,
      members: [...prev.members.filter(m => m.employeeId !== newMember.employeeId), newMember]
    } : null);

    setIsAddMemberOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="text-purple-600" size={24} />
            Projects & Resource Allocation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign HRMS employees (<code className="text-purple-600 font-bold">employeeId</code>) to enterprise projects and track allocated resource capacity.
          </p>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-purple-200 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{p.id}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{p.name}</h3>
                <p className="text-xs text-slate-500">Client: <span className="font-semibold text-slate-700">{p.client}</span></p>
              </div>
              <Badge variant={p.status === 'In Progress' ? 'success' : 'info'}>{p.status}</Badge>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold mb-1">
                <span className="text-slate-500">Completion Progress</span>
                <span className="text-purple-700 font-bold">{p.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${p.progress}%` }}></div>
              </div>
            </div>

            {/* Members linked by employeeId */}
            <div className="border-t border-slate-100 pt-2 space-y-1 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Allocated Team Members (HRMS):</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {p.members.map((m, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-[11px] font-semibold flex items-center gap-1">
                    <UserCheck size={12} className="text-purple-600" />
                    {m.employeeName} (<code className="text-purple-700 font-mono text-[10px]">{m.employeeId}</code>) - {m.role}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => { setSelectedProject(p); setIsAddMemberOpen(true); }}>
                <Plus size={12} /> Allocate HRMS Employee
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Allocate Member Modal */}
      {selectedProject && (
        <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title={`Allocate Employee to ${selectedProject.name}`}>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Select Employee (HRMS Master)</label>
              <select
                value={selectedEmpForMember}
                onChange={(e) => setSelectedEmpForMember(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.empCode || e.id}) - {e.department} ({e.designation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Project Assignment Role</label>
              <input
                type="text"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                placeholder="e.g. Lead Architect, QA Tester"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Monthly Allocated Hours</label>
              <input
                type="number"
                value={memberHours}
                onChange={(e) => setMemberHours(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddMemberToProject}>Assign Employee</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
