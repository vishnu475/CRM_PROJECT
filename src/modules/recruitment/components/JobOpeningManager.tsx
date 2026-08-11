import React, { useState } from 'react';
import { Briefcase, Plus, MapPin, Users, Edit, Building2 } from 'lucide-react';
import { JobOpening } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const JobOpeningManager: React.FC = () => {
  const [openings, setOpenings] = useState<JobOpening[]>([
    { id: 'job-1', title: 'Senior Software Engineer', department: 'Engineering', location: 'Bengaluru / Hybrid', headcount: 3, hiringManager: 'James Smith', status: 'Active', createdDate: '2026-08-01' },
    { id: 'job-2', title: 'Sales Executive Lead', department: 'Sales', location: 'Mumbai HQ', headcount: 2, hiringManager: 'Robert Vance', status: 'Active', createdDate: '2026-08-03' },
    { id: 'job-3', title: 'HR Generalist', department: 'HR', location: 'Delhi NCR', headcount: 1, hiringManager: 'Emma Watson', status: 'Active', createdDate: '2026-08-05' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', department: 'Engineering', location: 'Mumbai HQ', headcount: 1, hiringManager: 'John Doe' });

  const handleAddJob = () => {
    const created: JobOpening = {
      id: `job-${openings.length + 1}`,
      title: newJob.title,
      department: newJob.department,
      location: newJob.location,
      headcount: Number(newJob.headcount),
      hiringManager: newJob.hiringManager,
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0]
    };
    setOpenings([...openings, created]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="text-purple-600" size={18} /> Job Requisitions & Openings Directory
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Approved hiring requisitions, department headcount goals, and hiring managers.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} /> Create Job Opening
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {openings.map(job => (
          <div key={job.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-purple-200 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-purple-600 font-bold">{job.id}</span>
              <Badge variant={job.status === 'Active' ? 'success' : 'neutral'}>{job.status}</Badge>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm">{job.title}</h4>
              <p className="text-xs text-purple-700 font-semibold">{job.department} • {job.location}</p>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
              <div className="flex justify-between">
                <span>Target Headcount:</span>
                <span className="font-bold text-slate-800">{job.headcount} Openings</span>
              </div>
              <div className="flex justify-between">
                <span>Hiring Manager:</span>
                <span className="font-semibold text-slate-700">{job.hiringManager}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Job Requisition Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Job Requisition">
        <div className="space-y-4 text-xs">
          <Input label="Job Title" placeholder="e.g. Principal Cloud Architect" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} />
          <Select
            label="Department"
            value={newJob.department}
            onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
            options={[
              { label: 'Engineering', value: 'Engineering' },
              { label: 'Sales', value: 'Sales' },
              { label: 'HR', value: 'HR' },
              { label: 'Finance', value: 'Finance' }
            ]}
          />
          <Input label="Location" placeholder="e.g. Mumbai HQ / Remote" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} />
          <Input label="Target Headcount" type="number" value={newJob.headcount} onChange={(e) => setNewJob({ ...newJob, headcount: Number(e.target.value) })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddJob}>Save Requisition</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
