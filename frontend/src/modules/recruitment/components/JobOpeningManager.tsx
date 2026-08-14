import React, { useState } from 'react';
import { Plus, Briefcase, MapPin, Users, DollarSign, Calendar, Clock, Edit3, Trash2 } from 'lucide-react';
import { JobOpening, JobStatus } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

interface JobOpeningManagerProps {
  jobs: JobOpening[];
  onAddJob: (job: Partial<JobOpening>) => void;
}

export const JobOpeningManager: React.FC<JobOpeningManagerProps> = ({ jobs, onAddJob }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    department: 'Engineering',
    branch: 'Bengaluru HQ',
    employmentType: 'Full-Time' as 'Full-Time' | 'Part-Time' | 'Contract',
    vacancies: 1,
    experienceYears: '3-5 Years',
    salaryRange: '₹12,00,000 - ₹18,00,000 PA',
    hiringManager: 'Sarah Jenkins',
    priority: 'High' as 'High' | 'Medium' | 'Low',
    closingDate: '2026-09-30',
    description: '',
    status: 'Open' as JobStatus
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    onAddJob(form);
    setIsModalOpen(false);
    setForm({
      title: '',
      department: 'Engineering',
      branch: 'Bengaluru HQ',
      employmentType: 'Full-Time',
      vacancies: 1,
      experienceYears: '3-5 Years',
      salaryRange: '₹12,00,000 - ₹18,00,000 PA',
      hiringManager: 'Sarah Jenkins',
      priority: 'High',
      closingDate: '2026-09-30',
      description: '',
      status: 'Open'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Job Requisitions & Openings Master</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage active headcount requisitions and hiring budgets.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} /> Post New Job Opening
        </Button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map(job => (
          <div key={job.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{job.title}</h4>
                <p className="text-xs text-slate-500 font-medium">{job.department} • {job.branch}</p>
              </div>
              <Badge variant={job.status === 'Open' ? 'success' : 'neutral'}>
                {job.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Vacancies</span>
                <span className="font-bold text-slate-800">{job.vacancies} Openings</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Experience</span>
                <span className="font-semibold text-slate-800">{job.experienceYears}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Hiring Lead</span>
                <span className="font-semibold text-slate-800">{job.hiringManager}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold text-emerald-600">{job.salaryRange}</span>
              <span className="text-[10px] text-slate-400">Closing: {job.closingDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Job Requisition">
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Job Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Lead Backend Engineer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Department</label>
              <Select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                options={[
                  { value: 'Engineering', label: 'Engineering' },
                  { value: 'Sales', label: 'Sales' },
                  { value: 'HR', label: 'HR' },
                  { value: 'Finance', label: 'Finance' }
                ]}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Vacancies</label>
              <Input
                type="number"
                value={form.vacancies}
                onChange={(e) => setForm({ ...form, vacancies: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Salary Budget Range</label>
              <Input
                value={form.salaryRange}
                onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Hiring Manager</label>
              <Input
                value={form.hiringManager}
                onChange={(e) => setForm({ ...form, hiringManager: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Publish Requisition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
