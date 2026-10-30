import React from 'react';
import { HelpdeskTicket } from '../../../types';
import { Headphones, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TicketSummaryCardsProps {
  tickets: HelpdeskTicket[];
  activeStatusFilter?: string;
  onFilterChange?: (status: string) => void;
}

export const TicketSummaryCards: React.FC<TicketSummaryCardsProps> = ({
  tickets,
  activeStatusFilter,
  onFilterChange,
}) => {
  // Derive counts accurately from the actual authorized tickets data
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
  const highPriorityCount = tickets.filter(
    t => (t.priority === 'High' || t.priority === 'Urgent') && t.status !== 'Resolved' && t.status !== 'Closed'
  ).length;

  const cards = [
    {
      id: 'open',
      title: 'Open Tickets',
      count: openCount,
      subtext: 'Awaiting triage & assignment',
      icon: Headphones,
      filterValue: 'Open',
      bgClass: 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-900/50',
      iconBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300',
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      count: inProgressCount,
      subtext: 'Actively being investigated',
      icon: Clock,
      filterValue: 'In Progress',
      bgClass: 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/50',
      iconBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300',
    },
    {
      id: 'resolved',
      title: 'Resolved',
      count: resolvedCount,
      subtext: 'Solutions confirmed & closed',
      icon: CheckCircle2,
      filterValue: 'Resolved',
      bgClass: 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/50',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300',
    },
    {
      id: 'high-priority',
      title: 'High Priority',
      count: highPriorityCount,
      subtext: 'Urgent attention required',
      icon: AlertTriangle,
      filterValue: 'High',
      bgClass: 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/50',
      iconBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeStatusFilter === card.filterValue;

        return (
          <div
            key={card.id}
            data-testid={`kpi-card-${card.id}`}
            onClick={() => onFilterChange && onFilterChange(card.filterValue)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[#0B0F19] shadow-xs hover:shadow-md ${
              isActive
                ? 'ring-2 ring-blue-500 border-blue-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {card.count}
              </span>
              <span className="text-xs font-medium text-slate-400">tickets</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};

