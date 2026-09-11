import React, { useState, useEffect } from 'react';
import { Lead, Customer, Project } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { 
  X, FolderKanban, Building2, User, Calendar, DollarSign, FileText, 
  CheckCircle2, AlertCircle, Sparkles, Clock, ShieldCheck, Flag
} from 'lucide-react';
import { formatINR } from '../utils/crmUtils';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  customer?: Customer | null;
  onSuccess: (projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  lead,
  customer,
  onSuccess,
}) => {
  const { employees, createProjectFromLead } = useApp();

  const getRequirementSummary = (req?: string) => {
    if (!req || !req.trim()) return 'Implementation Project';
    const lower = req.toLowerCase();
    if (lower.includes('crm') && lower.includes('hrms')) return 'CRM and HRMS Implementation';
    if (lower.includes('crm')) return 'CRM Implementation';
    if (lower.includes('hrms')) return 'HRMS Implementation';
    if (lower.includes('erp')) return 'ERP Implementation';
    if (lower.includes('payroll')) return 'Payroll System Implementation';
    if (req.length <= 40) return req.trim();
    return req.slice(0, 37).trim() + '...';
  };

  const companyName = customer?.customerName || lead.company || lead.name;
  const initialProjectName = `${companyName} - ${getRequirementSummary(lead.requirement)}`;
  const initialBudget = lead.finalAgreedAmount || lead.value || lead.budget || 0;
  const todayStr = lead.wonDate || new Date().toISOString().split('T')[0];
  const defaultEndDate = lead.expectedCloseDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: initialProjectName,
    client: companyName,
    projectRequirement: lead.requirement || '',
    projectNotes: lead.notes || '',
    projectManager: lead.assignedTo || (employees[0]?.name || 'Emma Watson'),
    startDate: todayStr,
    endDate: defaultEndDate,
    budget: initialBudget.toString(),
    status: 'Not Started' as Project['status'],
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cName = customer?.customerName || lead.company || lead.name;
      setFormData({
        name: `${cName} - ${getRequirementSummary(lead.requirement)}`,
        client: cName,
        projectRequirement: lead.requirement || '',
        projectNotes: lead.notes || '',
        projectManager: lead.assignedTo || (employees[0]?.name || 'Emma Watson'),
        startDate: lead.wonDate || new Date().toISOString().split('T')[0],
        endDate: lead.expectedCloseDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        budget: (lead.finalAgreedAmount || lead.value || lead.budget || 0).toString(),
        status: 'Not Started',
        priority: 'Medium',
      });
      setError(null);
    }
  }, [isOpen, lead, customer, employees]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project Name is required.');
      return;
    }
    if (!formData.client.trim()) {
      setError('Client / Customer Name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await createProjectFromLead(lead.id, {
        name: formData.name.trim(),
        client: formData.client.trim(),
        projectRequirement: formData.projectRequirement.trim(),
        projectNotes: formData.projectNotes.trim(),
        projectManager: formData.projectManager,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: parseFloat(formData.budget) || 0,
        status: formData.status,
        priority: formData.priority,
      });

      if (res.success && res.projectId) {
        onSuccess(res.projectId);
        onClose();
      } else {
        setError(res.message || 'Failed to create project.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 p-6 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
              <FolderKanban size={16} className="text-amber-300" />
              <span>CRM &rarr; Projects Integration</span>
            </div>
            <h3 className="text-xl font-bold">Create Project from Won Lead</h3>
            <p className="text-xs text-indigo-100 mt-1">
              Generate a client delivery project using the customer's verified project scope and requirements.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <div className="text-xs leading-relaxed font-semibold">{error}</div>
            </div>
          )}

          {/* Lead Context Banner */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Building2 size={16} />
              </span>
              <div>
                <div className="font-bold text-slate-800 text-xs">{companyName}</div>
                <div className="text-[11px] text-slate-500">Lead: {lead.name} • Stage: <span className="font-bold text-emerald-600">Won</span></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Agreed Deal Value</div>
              <div className="text-xs font-bold text-indigo-700">{formatINR(initialBudget)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Apex Cloud Solutions - CRM and HRMS Implementation"
              />
            </div>

            {/* Client / Customer */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Client / Customer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Client Name"
              />
            </div>

            {/* Project Manager */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Project Manager / Owner <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.projectManager}
                onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.designation || 'Team Lead'})
                  </option>
                ))}
                {(!employees || employees.length === 0) && (
                  <>
                    <option value="Emma Watson">Emma Watson (Project Lead)</option>
                    <option value="James Smith">James Smith (Senior Engineer)</option>
                    <option value="Sarah Connor">Sarah Connor (Technical Manager)</option>
                  </>
                )}
              </select>
            </div>

            {/* Project Requirement */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText size={13} className="text-indigo-600" />
                  Project Scope / Requirements (Copied from Lead)
                </label>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Canonical Scope
                </span>
              </div>
              <textarea
                rows={4}
                value={formData.projectRequirement}
                onChange={(e) => setFormData({ ...formData, projectRequirement: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
                placeholder="Detailed customer project and business requirements..."
              />
            </div>

            {/* Project Notes */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Project Notes (Internal / Kick-off Notes)
              </label>
              <textarea
                rows={2}
                value={formData.projectNotes}
                onChange={(e) => setFormData({ ...formData, projectNotes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Additional project kickoff notes or client preferences..."
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Expected End Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Expected End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Project Budget / Value (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Initial Status */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                <option value="Not Started">Not Started (Default)</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <FolderKanban size={15} />
              {submitting ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
