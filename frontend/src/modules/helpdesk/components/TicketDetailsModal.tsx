import React, { useState } from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Building,
  Calendar,
  Save,
  MessageSquare,
  Shield,
  FileText
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { HelpdeskTicket } from '../../../types';

interface TicketDetailsModalProps {
  ticket: HelpdeskTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated: (updated: HelpdeskTicket) => void;
}

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onTicketUpdated,
}) => {
  const { updateHelpdeskTicket } = useApp() || {};

  const [status, setStatus] = useState<HelpdeskTicket['status']>(ticket?.status || 'Open');
  const [priority, setPriority] = useState<HelpdeskTicket['priority']>(ticket?.priority || 'Medium');
  const [assignedAgent, setAssignedAgent] = useState(ticket?.assignedAgent || 'Support Desk');
  const [resolutionNotes, setResolutionNotes] = useState(ticket?.resolutionNotes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if ticket changes
  React.useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setPriority(ticket.priority);
      setAssignedAgent(ticket.assignedAgent || 'Support Desk');
      setResolutionNotes(ticket.resolutionNotes || '');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let updated: HelpdeskTicket | null = null;
      if (updateHelpdeskTicket) {
        updated = await updateHelpdeskTicket(ticket.id, {
          status,
          priority,
          assignedAgent,
          resolutionNotes: resolutionNotes.trim(),
        });
      } else {
        const res = await fetch(`/api/helpdesk/${encodeURIComponent(ticket.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            priority,
            assignedAgent,
            resolutionNotes: resolutionNotes.trim(),
          }),
        });
        const data = await res.json();
        if (data.success && data.ticket) {
          updated = data.ticket;
        } else {
          throw new Error(data.message || 'Failed to update ticket');
        }
      }

      if (updated) {
        onTicketUpdated(updated);
        setSuccessMessage('Ticket details and status successfully updated.');
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err: any) {
      console.error('Update error:', err);
      setErrorMessage(err.message || 'Failed to update ticket. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityBadge = (p: HelpdeskTicket['priority']) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50';
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
      case 'Low':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getStatusBadge = (s: HelpdeskTicket['status']) => {
    switch (s) {
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50';
      case 'Closed':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'Open':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        id="ticket-details-modal"
        className="bg-white dark:bg-[#0B0F19] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col transition-all animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50 shrink-0">
              {ticket.ticketNo}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {ticket.subject}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{ticket.customerName}</span>
                <span>•</span>
                <span>Category: {ticket.category || 'General'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
              <div className="mt-1">
                <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</p>
              <div className="mt-1">
                <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md border ${getPriorityBadge(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Agent</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 truncate">
                {ticket.assignedAgent || 'Support Desk'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 truncate">
                {ticket.createdAt}
              </p>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText size={14} className="text-blue-500" />
              Ticket Description &amp; Scope
            </h4>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {ticket.description || 'No additional description provided with this ticket submission.'}
            </div>
          </div>

          {/* Update Controls Form */}
          <form onSubmit={handleUpdate} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Update Status &amp; Reassignment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Update Status</label>
                <select
                  id="ticket-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Update Priority</label>
                <select
                  id="ticket-priority-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Reassign Agent</label>
                <select
                  id="ticket-agent-select"
                  value={assignedAgent}
                  onChange={(e) => setAssignedAgent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                >
                  <option value="Support Desk">Support Desk</option>
                  <option value="Tech Team">Tech Team</option>
                  <option value="Billing Ops">Billing Ops</option>
                  <option value="Senior Engineer">Senior Engineer</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>
            </div>

            {/* Resolution Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Resolution Notes / Staff Remarks
              </label>
              <textarea
                id="ticket-resolution-notes"
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Log solution steps, root cause, or closure confirmation..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="flex justify-end">
              <button
                id="save-ticket-updates-btn"
                type="submit"
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Updates</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Activity / Audit History Timeline */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              Activity &amp; Audit Timeline
            </h4>
            
            <div className="space-y-2">
              {ticket.history && ticket.history.length > 0 ? (
                ticket.history.map((h, idx) => (
                  <div
                    key={h.id || idx}
                    className="p-3 bg-slate-50/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl flex items-start gap-2.5 text-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{h.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{h.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        By <span className="font-semibold text-slate-700 dark:text-slate-300">{h.author}</span>
                        {h.note ? ` • ${h.note}` : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50/40 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
                  No previous audit events recorded for this ticket.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

