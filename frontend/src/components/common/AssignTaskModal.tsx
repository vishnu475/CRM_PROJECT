import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, User, Briefcase, AlertCircle, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEmployeeId?: string;
  targetEmployeeName?: string;
  onTaskAssigned?: () => void;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  onClose,
  targetEmployeeId = 'EMP-006',
  targetEmployeeName = 'Ashok',
  onTaskAssigned
}) => {
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState(targetEmployeeId);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [project, setProject] = useState('ERP Module Integration');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setSelectedEmpId(targetEmployeeId);
  }, [targetEmployeeId]);

  useEffect(() => {
    fetch('/api/hrms/employees')
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setEmployeesList(json.data);
        } else {
          setEmployeesList([
            { id: 'EMP-006', emp_code: 'EMP-006', name: 'Ashok', department: 'Product Management' },
            { id: 'EMP-001', emp_code: 'EMP-001', name: 'Sarah Jenkins', department: 'Executive' },
            { id: 'EMP-008', emp_code: 'EMP-008', name: 'Ramesh', department: 'Engineering' }
          ]);
        }
      })
      .catch(() => {
        setEmployeesList([
          { id: 'EMP-006', emp_code: 'EMP-006', name: 'Ashok', department: 'Product Management' },
          { id: 'EMP-001', emp_code: 'EMP-001', name: 'Sarah Jenkins', department: 'Executive' },
          { id: 'EMP-008', emp_code: 'EMP-008', name: 'Ramesh', department: 'Engineering' }
        ]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/hrms/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          title: taskTitle,
          description: taskDesc,
          priority,
          dueDate,
          project,
          assignedBy: 'HR Admin'
        })
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message || 'Task assigned successfully!' });
        setTimeout(() => {
          if (onTaskAssigned) onTaskAssigned();
          onClose();
        }, 1200);
      } else {
        setFeedback({ type: 'error', message: json.message || 'Failed to assign task.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Server error while assigning task.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign New Task to Employee">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex items-center gap-2">
          <Sparkles className="text-blue-600 shrink-0" size={16} />
          <div>
            <p className="font-bold text-blue-900">Direct Employee Task Assignment</p>
            <p className="text-[10px] text-blue-700">Assigned task triggers real-time ESS notification & populates employee Kanban.</p>
          </div>
        </div>

        {feedback && (
          <div className={`p-3 rounded-xl text-xs font-bold ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            {feedback.message}
          </div>
        )}

        <div>
          <label className="font-bold text-slate-700 block mb-1">Assign To Employee</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          >
            {employeesList.map((e) => {
              const code = e.emp_code || e.id;
              return (
                <option key={code} value={code}>
                  {e.name} ({code}) - {e.department || 'Staff'}
                </option>
              );
            })}
          </select>
        </div>

        <Input
          label="Task Title"
          type="text"
          placeholder="e.g. Review Q3 Attendance Regularization & Log Issues"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Priority Level</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent 🔥</option>
            </select>
          </div>

          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>

        <Input
          label="Project / Module Tag"
          type="text"
          placeholder="ERP Suite 2.0"
          value={project}
          onChange={(e) => setProject(e.target.value)}
        />

        <div>
          <label className="font-bold text-slate-700 block mb-1">Task Instructions & Description</label>
          <textarea
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            rows={3}
            placeholder="Provide explicit instructions or checklist for the assigned employee..."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 font-bold">
            {isSubmitting ? 'Assigning...' : 'Assign Task Now'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
