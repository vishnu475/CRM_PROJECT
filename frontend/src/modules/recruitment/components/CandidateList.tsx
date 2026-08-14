import React, { useState } from 'react';
import { Search, Filter, Eye, Calendar, UserPlus, Trash2, CheckCircle2 } from 'lucide-react';
import { Candidate, CandidateStage } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

interface CandidateListProps {
  candidates: Candidate[];
  onOpenDrawer: (candidate: Candidate) => void;
  onOpenConvertModal: (candidate: Candidate) => void;
  onOpenScheduleModal: (candidate: Candidate) => void;
  onUpdateStage: (candidateId: string, stage: CandidateStage) => void;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  onOpenDrawer,
  onOpenConvertModal,
  onOpenScheduleModal,
  onUpdateStage
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');

  const filtered = candidates.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.candidateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.appliedPosition.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'All' || c.department === deptFilter;
    const matchesStage = stageFilter === 'All' || c.stage === stageFilter;

    return matchesSearch && matchesDept && matchesStage;
  });

  return (
    <div className="space-y-4">
      {/* Filters Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name, ID (CAN-001), or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
            <Filter size={14} /> Dept:
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
            Stage:
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700"
            >
              <option value="All">All Stages</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Hired">Hired</option>
              <option value="Employee">Employee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Candidate ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Applied Position</th>
                <th className="p-3">Department</th>
                <th className="p-3">Recruiter</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Score</th>
                <th className="p-3">Applied Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    No candidates found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-purple-600">{cand.candidateNo}</td>
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <img
                        src={cand.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.name)}&background=6366f1&color=fff`}
                        alt={cand.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      {cand.name}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{cand.appliedPosition}</td>
                    <td className="p-3 text-slate-600">{cand.department}</td>
                    <td className="p-3 text-slate-600">{cand.recruiter}</td>
                    <td className="p-3">
                      <Badge variant={
                        cand.stage === 'Hired' ? 'success' :
                        cand.stage === 'Employee' ? 'info' : 'warning'
                      }>
                        {cand.stage}
                      </Badge>
                    </td>
                    <td className="p-3 font-bold text-slate-800">{cand.score}/100</td>
                    <td className="p-3 text-slate-500">{cand.appliedDate}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenDrawer(cand)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="View Profile Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => onOpenScheduleModal(cand)}
                          className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                          title="Schedule Interview"
                        >
                          <Calendar size={15} />
                        </button>

                        {cand.stage === 'Hired' && !cand.isConverted && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-[10px] py-1 px-2"
                            onClick={() => onOpenConvertModal(cand)}
                          >
                            <UserPlus size={11} /> Convert
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
