import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Folder,
  Plus,
  Search,
  Filter,
  List,
  Grid,
  RefreshCw,
  Archive,
  Trash2,
  Settings,
  Share2,
  SlidersHorizontal,
  Clock,
  UserCheck,
  Building,
  Users,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  FileDown
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  DocumentItem,
  DocumentSection,
  DocumentKPIStats,
  DocumentCategory,
  DocumentType
} from '../types';
import { documentApiService } from '../services/documentApiService';
import { DocumentStatsBar } from '../components/DocumentStatsBar';
import { DocumentListView } from '../components/DocumentListView';
import { DocumentGridView } from '../components/DocumentGridView';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { DocumentDetailDrawer } from '../components/DocumentDetailDrawer';
import { DocumentVersionModal } from '../components/DocumentVersionModal';
import { DocumentShareModal } from '../components/DocumentShareModal';
import { DocumentApprovalModal } from '../components/DocumentApprovalModal';
import { DocumentAdminModal } from '../components/DocumentAdminModal';
import { DocumentViewerModal } from '../components/DocumentViewerModal';

export const DocumentsPage: React.FC = () => {
  const { userRole = 'Executive', userProfile, employees = [] } = useApp() || {};

  const isAdmin = userRole === 'Executive' || (userRole as string) === 'Admin';
  const isHR = userRole === 'HRAdmin';
  const isManager = userRole === 'SalesManager' || userRole === 'OperationsManager';
  const isEmployee = userRole === 'Employee';

  // State
  const [activeSection, setActiveSection] = useState<DocumentSection>(() => {
    return isEmployee ? 'my' : 'all';
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Data
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [stats, setStats] = useState<DocumentKPIStats | null>(null);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Drawers
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [versionTargetDoc, setVersionTargetDoc] = useState<DocumentItem | null>(null);
  const [shareTargetDoc, setShareTargetDoc] = useState<DocumentItem | null>(null);
  const [approvalModalState, setApprovalModalState] = useState<{
    doc: DocumentItem | null;
    mode: 'approve' | 'reject';
  }>({ doc: null, mode: 'approve' });

  // Document Preview Modal State
  const [previewModalDoc, setPreviewModalDoc] = useState<DocumentItem | null>(null);

  // Fetch Documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const [docsRes, statsRes] = await Promise.all([
        documentApiService.getDocuments({
          section: activeSection,
          search: searchQuery,
          status: selectedStatus,
          category_id: selectedCategory,
          document_type_id: selectedDocType,
          department: selectedDepartment,
          sortBy,
          sortOrder
        }),
        documentApiService.getStats()
      ]);
      setDocuments(docsRes.documents);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeSection, searchQuery, selectedStatus, selectedCategory, selectedDocType, selectedDepartment, sortBy, sortOrder]);

  // Initial metadata fetch
  useEffect(() => {
    documentApiService.getCategories().then(setCategories).catch(console.error);
    documentApiService.getDocumentTypes().then(setDocTypes).catch(console.error);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Transform employees list
  const employeesList = useMemo(() => {
    return employees.map((e: any) => ({
      emp_code: e.emp_code || e.id,
      name: e.name,
      department: e.department
    }));
  }, [employees]);

  // Role-Specific Section Tabs
  const sectionTabs = useMemo(() => {
    const tabs: { id: DocumentSection; label: string; icon: any }[] = [];

    if (!isEmployee) {
      tabs.push({ id: 'all', label: 'All Documents', icon: Folder });
    }
    tabs.push({ id: 'my', label: 'My Documents', icon: UserCheck });
    tabs.push({ id: 'company', label: 'Company Documents', icon: Building });

    if (isAdmin || isHR) {
      tabs.push({ id: 'employee', label: 'Employee Records', icon: Users });
    }

    tabs.push({ id: 'shared', label: 'Shared With Me', icon: Share2 });

    if (isAdmin || isHR || isManager) {
      tabs.push({ id: 'pending_approvals', label: 'Pending Review', icon: Clock });
    }

    tabs.push({ id: 'expiring_soon', label: 'Expiring Soon', icon: AlertTriangle });

    if (isAdmin || isHR) {
      tabs.push({ id: 'archive', label: 'Archive', icon: Archive });
    }

    if (isAdmin) {
      tabs.push({ id: 'trash', label: 'Trash', icon: Trash2 });
    }

    return tabs;
  }, [isAdmin, isHR, isManager, isEmployee]);

  // Bulk Actions
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === documents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(documents.map((d) => d.id));
    }
  };

  const handleBulkAction = async (action: 'archive' | 'trash' | 'restore') => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to ${action} ${selectedIds.length} selected document(s)?`)) return;

    try {
      await documentApiService.bulkAction(action, selectedIds);
      setSelectedIds([]);
      fetchDocuments();
    } catch (err: any) {
      alert(`Bulk ${action} failed: ${err.message}`);
    }
  };

  // Preview Document Handler
  const handlePreview = (doc: DocumentItem) => {
    setPreviewModalDoc(doc);
  };

  // Download Document Handler
  const handleDownload = (doc: DocumentItem) => {
    const downloadUrl = documentApiService.getDownloadUrl(doc.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', doc.original_file_name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Single Action Handlers
  const handleSubmitReview = async (doc: DocumentItem) => {
    try {
      await documentApiService.submitDocument(doc.id);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleArchive = async (doc: DocumentItem) => {
    if (!confirm(`Archive "${doc.document_name}"?`)) return;
    try {
      await documentApiService.archiveDocument(doc.id);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    const isPermanent = activeSection === 'trash';
    const msg = isPermanent
      ? `Permanently delete "${doc.document_name}"? This action cannot be undone.`
      : `Move "${doc.document_name}" to Trash?`;
    if (!confirm(msg)) return;

    try {
      await documentApiService.deleteDocument(doc.id, isPermanent);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRestore = async (doc: DocumentItem) => {
    try {
      await documentApiService.restoreDocument(doc.id);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Bar with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <Folder size={20} />
            </div>
            Enterprise Document Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized document repository with role-based governance, automated approval workflows, version control & audit trail.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchDocuments()}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white bg-slate-100/80 border border-slate-200 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-3.5 py-2 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings size={14} className="text-slate-500" />
              Document Admin
            </button>
          )}

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Upload Document
          </button>
        </div>
      </div>

      {/* 2. Top KPI Stats Bar */}
      <DocumentStatsBar
        stats={stats}
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          setSelectedIds([]);
        }}
        isLoading={isLoading}
      />

      {/* 3. Section Navigation Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        {sectionTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id);
                setSelectedIds([]);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Search, Filter, Sort & View Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document name, tags, owner, type..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Filter & Sort Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">Verified / Approved</option>
            <option value="PENDING_REVIEW">In Review</option>
            <option value="DRAFT">Draft</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-blue-500 max-w-[140px] truncate"
          >
            <option value="">All Types</option>
            {docTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="created_at">Newest First</option>
            <option value="document_name">Name A-Z</option>
            <option value="updated_at">Recently Updated</option>
            <option value="expiry_date">Expiry Date</option>
            <option value="file_size">File Size</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <Grid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Bulk Action Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-blue-900 text-white rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2 text-xs font-bold pl-2">
            <CheckSquare size={16} className="text-blue-300" />
            <span>{selectedIds.length} document(s) selected</span>
          </div>

          <div className="flex items-center space-x-2">
            {activeSection === 'trash' ? (
              <button
                onClick={() => handleBulkAction('restore')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={13} /> Restore Selected
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Archive size={13} /> Archive
                </button>
                <button
                  onClick={() => handleBulkAction('trash')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} /> Move to Trash
                </button>
              </>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-xs text-blue-200 hover:text-white"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* 6. Documents List / Grid Content */}
      {viewMode === 'list' ? (
        <DocumentListView
          documents={documents}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onViewDetails={(doc) => setActiveDetailId(doc.id)}
          onUploadVersion={(doc) => setVersionTargetDoc(doc)}
          onShare={(doc) => setShareTargetDoc(doc)}
          onSubmitForReview={handleSubmitReview}
          onApprove={(doc) => setApprovalModalState({ doc, mode: 'approve' })}
          onReject={(doc) => setApprovalModalState({ doc, mode: 'reject' })}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onRestore={handleRestore}
          userRole={userRole}
          currentUserId={userProfile?.empCode || userProfile?.id}
          isTrashSection={activeSection === 'trash'}
        />
      ) : (
        <DocumentGridView
          documents={documents}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onViewDetails={(doc) => setActiveDetailId(doc.id)}
          onUploadVersion={(doc) => setVersionTargetDoc(doc)}
          onShare={(doc) => setShareTargetDoc(doc)}
          onSubmitForReview={handleSubmitReview}
          onApprove={(doc) => setApprovalModalState({ doc, mode: 'approve' })}
          onReject={(doc) => setApprovalModalState({ doc, mode: 'reject' })}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onRestore={handleRestore}
          userRole={userRole}
          currentUserId={userProfile?.empCode || userProfile?.id}
          isTrashSection={activeSection === 'trash'}
        />
      )}

      {/* 7. Slide-over Detail Drawer */}
      <DocumentDetailDrawer
        documentId={activeDetailId}
        isOpen={Boolean(activeDetailId)}
        onClose={() => setActiveDetailId(null)}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onUploadVersion={(doc) => setVersionTargetDoc(doc)}
        onShare={(doc) => setShareTargetDoc(doc)}
        onApprove={(doc) => setApprovalModalState({ doc, mode: 'approve' })}
        onReject={(doc) => setApprovalModalState({ doc, mode: 'reject' })}
        onRefreshList={fetchDocuments}
        userRole={userRole}
        currentUserId={userProfile?.empCode || userProfile?.id}
      />

      {/* 8. Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          fetchDocuments();
        }}
        userRole={userRole}
        currentUser={userProfile}
        employeesList={employeesList}
      />

      {/* 9. Version Upload Modal */}
      <DocumentVersionModal
        document={versionTargetDoc}
        isOpen={Boolean(versionTargetDoc)}
        onClose={() => setVersionTargetDoc(null)}
        onSuccess={() => {
          fetchDocuments();
          if (activeDetailId) setActiveDetailId(activeDetailId);
        }}
      />

      {/* 10. Share Modal */}
      <DocumentShareModal
        document={shareTargetDoc}
        isOpen={Boolean(shareTargetDoc)}
        onClose={() => setShareTargetDoc(null)}
        onSuccess={() => {
          fetchDocuments();
          if (activeDetailId) setActiveDetailId(activeDetailId);
        }}
        employeesList={employeesList}
      />

      {/* 11. Approval / Rejection Modal */}
      <DocumentApprovalModal
        document={approvalModalState.doc}
        mode={approvalModalState.mode}
        isOpen={Boolean(approvalModalState.doc)}
        onClose={() => setApprovalModalState({ doc: null, mode: 'approve' })}
        onSuccess={() => {
          fetchDocuments();
          if (activeDetailId) setActiveDetailId(activeDetailId);
        }}
      />

      {/* 12. Admin Configuration Modal */}
      <DocumentAdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={() => {
          fetchDocuments();
          documentApiService.getCategories().then(setCategories);
          documentApiService.getDocumentTypes().then(setDocTypes);
        }}
      />

      {/* 13. Interactive In-App Real Document Viewer with Metadata Side Panel */}
      {previewModalDoc && (
        <DocumentViewerModal
          documentId={previewModalDoc.id}
          isOpen={Boolean(previewModalDoc)}
          onClose={() => setPreviewModalDoc(null)}
          onApprove={(doc) => setApprovalModalState({ doc, mode: 'approve' })}
          onReject={(doc) => setApprovalModalState({ doc, mode: 'reject' })}
          onShare={(doc) => setShareTargetDoc(doc)}
          onUploadVersion={(doc) => setVersionTargetDoc(doc)}
          onRefresh={() => fetchDocuments()}
          userRole={userRole}
          currentUserId={userProfile?.empCode || userProfile?.id}
        />
      )}
    </div>
  );
};
