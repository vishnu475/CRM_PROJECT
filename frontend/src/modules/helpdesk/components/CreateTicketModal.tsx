import React, { useState } from 'react';
import { X, Loader2, Plus, Headphones, AlertCircle } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { HelpdeskTicket } from '../../../types';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (newTicket: HelpdeskTicket) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onTicketCreated,
}) => {
  const { customers = [], addHelpdeskTicket } = useApp() || {};

  const [subject, setSubject] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [category, setCategory] = useState('General');
  const [assignedAgent, setAssignedAgent] = useState('Support Desk');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomerSelect = (val: string) => {
    if (val === '__custom__') {
      setCustomerId('');
      setCustomerName('');
      return;
    }
    const matched = customers.find(c => c.id === val || (c as any).customer_code === val);
    if (matched) {
      setCustomerId(matched.id);
      setCustomerName(matched.customerName || (matched as any).name || (matched as any).customer_name || '');
    } else {
      setCustomerId('');
      setCustomerName(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!subject.trim() || subject.trim().length < 3) {
      setErrorMessage('Please provide a ticket subject with at least 3 characters.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Customer / Company name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      let created: HelpdeskTicket | null = null;
      if (addHelpdeskTicket) {
        created = await addHelpdeskTicket({
          subject: subject.trim(),
          customerName: customerName.trim(),
          customerId: customerId || undefined,
          priority,
          category,
          status: 'Open',
          assignedAgent: assignedAgent.trim() || 'Support Desk',
          description: description.trim(),
        });
      } else {
        // Direct fetch fallback
        const res = await fetch('/api/helpdesk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: subject.trim(),
            customerName: customerName.trim(),
            customerId: customerId || undefined,
            priority,
            category,
            status: 'Open',
            assignedAgent: assignedAgent.trim() || 'Support Desk',
            description: description.trim(),
          }),
        });
        const data = await res.json();
        if (data.success && data.ticket) {
          created = data.ticket;
        } else {
          throw new Error(data.message || 'Failed to create ticket');
        }
      }

      if (created) {
        onTicketCreated(created);
        onClose();
      }
    } catch (err: any) {
      console.error('Ticket creation error:', err);
      setErrorMessage(err.message || 'Failed to create ticket. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        id="create-ticket-modal"
        className="bg-white dark:bg-[#0B0F19] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[92vh] overflow-y-auto flex flex-col transition-all animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Headphones size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Support Ticket</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Log a new issue, request, or customer inquiry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Ticket Subject */}
          <div className="space-y-1.5">
            <label htmlFor="ticket-subject" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              id="ticket-subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Invoice PDF download alignment query"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
            />
          </div>

          {/* Customer / Requester & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="ticket-customer" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Customer / Requester <span className="text-rose-500">*</span>
              </label>
              {customers.length > 0 ? (
                <div className="space-y-2">
                  <select
                    id="ticket-customer"
                    value={customerId || (customerName ? '__custom__' : '')}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium cursor-pointer"
                  >
                    <option value="">-- Select Customer Account --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customerName || (c as any).name || c.id}
                      </option>
                    ))}
                    <option value="__custom__">+ Enter Custom Company / Name</option>
                  </select>
                  {(!customerId || customerId === '__custom__') && (
                    <input
                      type="text"
                      placeholder="Enter company or requester name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                    />
                  )}
                </div>
              ) : (
                <input
                  id="ticket-customer"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Globex Corporation"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ticket-category" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                id="ticket-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium cursor-pointer"
              >
                <option value="General">General Inquiries</option>
                <option value="Technical">Technical Issue / Bug</option>
                <option value="Billing">Billing &amp; Invoices</option>
                <option value="Account">Account Access &amp; Permissions</option>
                <option value="Feature Request">Feature Request</option>
              </select>
            </div>
          </div>

          {/* Priority & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="ticket-priority" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                id="ticket-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium cursor-pointer"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Priority</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ticket-assignee" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Assignee
              </label>
              <select
                id="ticket-assignee"
                value={assignedAgent}
                onChange={(e) => setAssignedAgent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium cursor-pointer"
              >
                <option value="Support Desk">Support Desk (Default)</option>
                <option value="Tech Team">Tech Team</option>
                <option value="Billing Ops">Billing Ops</option>
                <option value="Senior Engineer">Senior Engineer</option>
                <option value="Unassigned">Unassigned</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="ticket-description" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Detailed Description
            </label>
            <textarea
              id="ticket-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details about the issue, steps to reproduce, or requested outcome..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-create-ticket-btn"
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creating Ticket...</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Create Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

