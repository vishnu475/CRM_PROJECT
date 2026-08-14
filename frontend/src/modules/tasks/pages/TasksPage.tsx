import React, { useState } from 'react';
import { CheckSquare, Plus, UserCheck, Calendar, AlertCircle, Search, Filter } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';

interface TaskItem {
  id: string;
  title: string;
  projectName: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'In Progress' | 'Completed' | 'Pending';
  dueDate: string;
}

export const TasksPage: React.FC = () => {
  const { employees } = useApp();

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'TSK-201',
      title: 'Develop HRMS Candidate Conversion Flow',
      projectName: 'CRM & HRMS Enterprise Suite',
      assignedEmployeeId: employees[2]?.id || 'EMP-003',
      assignedEmployeeName: employees[2]?.name || 'James Smith',
      priority: 'High',
      status: 'In Progress',
      dueDate: '2026-08-20',
    },
    {
      id: 'TSK-202',
      title: 'Setup Double-Entry Ledger Auto Posting Engine',
      projectName: 'CRM & HRMS Enterprise Suite',
      assignedEmployeeId: employees[3]?.id || 'EMP-004',
      assignedEmployeeName: employees[3]?.name || 'Michael Brown',
      priority: 'High',
      status: 'In Progress',
      dueDate: '2026-08-25',
    },
    {
      id: 'TSK-203',
      title: 'Design Sales Executive Campaign Workflow',
      projectName: 'Supply Chain & Inventory ERP',
      assignedEmployeeId: employees[1]?.id || 'EMP-002',
      assignedEmployeeName: employees[1]?.name || 'Robert Brown',
      priority: 'Medium',
      status: 'Pending',
      dueDate: '2026-08-30',
    },
  ]);

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('CRM & HRMS Enterprise Suite');
  const [newAssignedEmpId, setNewAssignedEmpId] = useState(employees[0]?.id || '');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('High');

  const handleCreateTask = () => {
    if (!newTitle || !newAssignedEmpId) return;
    const emp = employees.find(e => e.id === newAssignedEmpId || e.empCode === newAssignedEmpId);

    const newTask: TaskItem = {
      id: `TSK-${Math.floor(200 + Math.random() * 800)}`,
      title: newTitle,
      projectName: newProject,
      assignedEmployeeId: emp?.empCode || emp?.id || newAssignedEmpId,
      assignedEmployeeName: emp?.name || 'Assigned Employee',
      priority: newPriority,
      status: 'Pending',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    };

    setTasks(prev => [newTask, ...prev]);
    setIsAddTaskOpen(false);
    setNewTitle('');
  };

  const handleToggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        status: t.status === 'Completed' ? 'In Progress' : 'Completed'
      };
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="text-purple-600" size={24} />
            Task Management & Employee Assignments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tasks assigned directly to HRMS employees using <code className="text-purple-600 font-bold">assignedEmployeeId</code>.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsAddTaskOpen(true)}>
          <Plus size={14} /> Create Task
        </Button>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3.5">Task ID</th>
              <th className="p-3.5">Task Title</th>
              <th className="p-3.5">Project</th>
              <th className="p-3.5">Assigned Employee (HRMS)</th>
              <th className="p-3.5">Priority</th>
              <th className="p-3.5">Due Date</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-mono text-purple-600 font-bold">{t.id}</td>
                <td className="p-3.5 font-bold text-slate-900">{t.title}</td>
                <td className="p-3.5 text-slate-500">{t.projectName}</td>
                <td className="p-3.5 font-semibold text-slate-800">
                  <span className="flex items-center gap-1">
                    <UserCheck size={12} className="text-purple-600" />
                    {t.assignedEmployeeName} (<code className="font-mono text-purple-700 text-[10px]">{t.assignedEmployeeId}</code>)
                  </span>
                </td>
                <td className="p-3.5">
                  <Badge variant={t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning' : 'neutral'}>
                    {t.priority}
                  </Badge>
                </td>
                <td className="p-3.5 text-slate-500 font-mono">{t.dueDate}</td>
                <td className="p-3.5">
                  <Badge variant={t.status === 'Completed' ? 'success' : t.status === 'In Progress' ? 'info' : 'warning'}>
                    {t.status}
                  </Badge>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleToggleTaskStatus(t.id)}
                    className="text-purple-600 hover:underline font-bold"
                  >
                    {t.status === 'Completed' ? 'Reopen' : 'Mark Done'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} title="Create New Assigned Task">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Implement Lead conversion algorithm"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Assigned Employee (HRMS Master)</label>
            <select
              value={newAssignedEmpId}
              onChange={(e) => setNewAssignedEmpId(e.target.value)}
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
            <label className="block font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateTask}>Assign Task</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
