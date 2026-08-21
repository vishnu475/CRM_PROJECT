import React, { useState } from 'react';
import { UserPlus, Sparkles, FileText, Briefcase, GraduationCap, MapPin, Link as LinkIcon, DollarSign } from 'lucide-react';
import { Candidate, JobOpening } from '../types';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobOpening[];
  onAddCandidate: (candidateData: Partial<Candidate>) => void;
}

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  jobs,
  onAddCandidate
}) => {
  const [form, setForm] = useState({
    // Personal
    name: '',
    email: '',
    phone: '',
    dob: '1998-05-14',
    gender: 'Male',

    // Address
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',

    // Professional
    appliedPosition: jobs[0]?.title || 'Senior Full Stack Engineer',
    jobOpeningId: jobs[0]?.id || '',
    department: 'Engineering',
    experienceYears: 4,
    currentCompany: 'Tech Solutions Corp',

    // Education
    degree: 'B.Tech Computer Science',
    college: 'IIT Bombay',
    graduationYear: '2020',

    // Skills
    primarySkills: 'React, TypeScript, Node.js, PostgreSQL',
    secondarySkills: 'Docker, AWS, Express',

    // Documents
    resumeUrl: 'https://example.com/resumes/candidate_resume.pdf',
    portfolioUrl: 'https://github.com/candidate',
    linkedinUrl: 'https://linkedin.com/in/candidate',

    // HR Metadata
    recruiter: 'Priya Sharma',
    source: 'LinkedIn Referral',
    expectedSalary: 1800000
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    onAddCandidate({
      name: form.name,
      email: form.email,
      phone: form.phone,
      appliedPosition: form.appliedPosition,
      jobOpeningId: form.jobOpeningId,
      department: form.department,
      experienceYears: Number(form.experienceYears),
      education: `${form.degree}, ${form.college} (${form.graduationYear})`,
      skills: form.primarySkills.split(',').map(s => s.trim()),
      resumeUrl: form.resumeUrl,
      recruiter: form.recruiter,
      expectedSalary: Number(form.expectedSalary),
      stage: 'Applied',
      score: 80
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Career Portal & Candidate Application Entry Point"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-600 max-h-[75vh] overflow-y-auto pr-1">
        {/* Banner */}
        <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 flex items-start gap-2.5">
          <Sparkles size={18} className="text-purple-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-purple-900">Direct ATS Application Submission</h4>
            <p className="text-purple-700 text-[11px] mt-0.5">
              Submitting this application auto-generates candidate code <strong className="font-mono text-purple-900 font-bold">CAN-XXX</strong> and places the record immediately into the <strong>Applied</strong> Kanban column.
            </p>
          </div>
        </div>

        {/* SECTION 1: PERSONAL INFORMATION */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
          <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <UserPlus size={14} className="text-purple-600" /> 1. Personal Details
          </h5>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Candidate Full Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. David Miller"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="david@company.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 00000"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Date of Birth</label>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Gender</label>
              <Select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PROFESSIONAL INFORMATION */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
          <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Briefcase size={14} className="text-purple-600" /> 2. Professional & Position Details
          </h5>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Applied Position</label>
              <Select
                value={form.appliedPosition}
                onChange={(e) => setForm({ ...form, appliedPosition: e.target.value })}
                options={jobs.map(j => ({ value: j.title, label: `${j.title} (${j.department})` }))}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Department</label>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Experience (Years)</label>
              <Input
                type="number"
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Current Employer</label>
              <Input
                value={form.currentCompany}
                onChange={(e) => setForm({ ...form, currentCompany: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: EDUCATION & SKILLS */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
          <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <GraduationCap size={14} className="text-purple-600" /> 3. Education & Skillset
          </h5>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Degree</label>
              <Input
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">College / University</label>
              <Input
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Graduation Year</label>
              <Input
                value={form.graduationYear}
                onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Primary Technical Skills (Comma Separated)</label>
            <Input
              value={form.primarySkills}
              onChange={(e) => setForm({ ...form, primarySkills: e.target.value })}
            />
          </div>
        </div>

        {/* SECTION 4: HR METADATA */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
          <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <DollarSign size={14} className="text-purple-600" /> 4. Recruiter & Salary Details
          </h5>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned Recruiter</label>
              <Input
                value={form.recruiter}
                onChange={(e) => setForm({ ...form, recruiter: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Sourcing Channel</label>
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Expected CTC (₹)</label>
              <Input
                type="number"
                value={form.expectedSalary}
                onChange={(e) => setForm({ ...form, expectedSalary: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 sticky bottom-0 bg-white py-2">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            <UserPlus size={14} /> Submit Application & Push to Applied Column
          </Button>
        </div>
      </form>
    </Modal>
  );
};
