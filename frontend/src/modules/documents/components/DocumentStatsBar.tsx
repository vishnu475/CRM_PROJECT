import React from 'react';
import {
  Files,
  FileCheck,
  Clock,
  AlertTriangle,
  Database,
  UserCheck,
  XCircle
} from 'lucide-react';
import { DocumentKPIStats, DocumentSection } from '../types';

interface DocumentStatsBarProps {
  stats: DocumentKPIStats | null;
  activeSection: DocumentSection;
  onSelectSection: (section: DocumentSection) => void;
  isLoading?: boolean;
}

export const DocumentStatsBar: React.FC<DocumentStatsBarProps> = ({
  stats,
  activeSection,
  onSelectSection,
  isLoading = false
}) => {
  const cards = [
    {
      id: 'all' as DocumentSection,
      title: 'Total Documents',
      value: stats?.totalDocuments ?? 0,
      icon: Files,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50/80 border-blue-200/80',
      activeBg: 'ring-2 ring-blue-500 bg-blue-100/70',
      sub: 'Central Vault'
    },
    {
      id: 'my' as DocumentSection,
      title: 'My Documents',
      value: stats?.myDocuments ?? 0,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50/80 border-purple-200/80',
      activeBg: 'ring-2 ring-purple-500 bg-purple-100/70',
      sub: 'Owned & Uploaded'
    },
    {
      id: 'pending_approvals' as DocumentSection,
      title: 'Pending Review',
      value: stats?.pendingReview ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/80 border-amber-200/80',
      activeBg: 'ring-2 ring-amber-500 bg-amber-100/70',
      sub: 'Awaiting Verification'
    },
    {
      id: 'expiring_soon' as DocumentSection,
      title: 'Expiring Soon',
      value: stats?.expiringSoon ?? 0,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50/80 border-rose-200/80',
      activeBg: 'ring-2 ring-rose-500 bg-rose-100/70',
      sub: 'Next 30 Days'
    },
    {
      id: 'all' as DocumentSection,
      title: 'Expired Records',
      value: stats?.expired ?? 0,
      icon: XCircle,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50 border-slate-200',
      activeBg: 'ring-2 ring-slate-400 bg-slate-100',
      sub: 'Action Required'
    },
    {
      id: 'all' as DocumentSection,
      title: 'Storage Used',
      value: stats?.storageUsed ?? '0.0 MB',
      icon: Database,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50/80 border-teal-200/80',
      activeBg: 'ring-2 ring-teal-500 bg-teal-100/70',
      sub: 'Local Secure Storage'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isSelected = activeSection === card.id;

        return (
          <div
            key={idx}
            onClick={() => onSelectSection(card.id)}
            className={`p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${card.bgColor} ${
              isSelected ? card.activeBg : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg bg-white shadow-xs ${card.color}`}>
                <Icon size={16} />
              </div>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                {isLoading ? (
                  <span className="inline-block w-8 h-5 bg-slate-200 animate-pulse rounded" />
                ) : (
                  card.value
                )}
              </span>
            </div>

            <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
              {card.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
};
