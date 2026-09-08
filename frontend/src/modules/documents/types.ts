export type DocumentSection =
  | 'all'
  | 'my'
  | 'company'
  | 'employee'
  | 'shared'
  | 'pending_approvals'
  | 'expiring_soon'
  | 'archive'
  | 'trash';

export type DocumentStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ARCHIVED'
  | 'TRASHED';

export type DocumentVisibility = 'private' | 'department' | 'company' | 'public';

export interface DocumentCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  scope: 'company' | 'employee' | 'both';
  is_active: boolean;
}

export interface DocumentType {
  id: string;
  name: string;
  code: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  scope: 'company' | 'employee' | 'both';
  approval_required: boolean;
  expiry_supported: boolean;
  allowed_file_types: string[];
  max_file_size_mb: number;
  is_active: boolean;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type?: string;
  uploaded_by: string;
  uploader_name?: string;
  change_description?: string;
  created_at: string;
}

export interface DocumentApproval {
  id: string;
  document_id: string;
  reviewer_id?: string;
  reviewer_name?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  shared_by: string;
  sharer_name?: string;
  share_target_type: 'user' | 'role' | 'department';
  share_target_id: string;
  can_view: boolean;
  can_download: boolean;
  can_edit: boolean;
  expires_at?: string;
  created_at: string;
}

export interface DocumentAuditLog {
  id: string;
  document_id?: string;
  user_id?: string;
  user_name?: string;
  action:
    | 'UPLOAD'
    | 'VIEW'
    | 'DOWNLOAD'
    | 'EDIT'
    | 'VERSION_CREATED'
    | 'SHARED'
    | 'UNSHARED'
    | 'SUBMITTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'ARCHIVED'
    | 'RESTORED'
    | 'DELETED'
    | 'PERMISSION_CHANGED';
  description: string;
  ip_address?: string;
  metadata?: any;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  document_name: string;
  original_file_name: string;
  file_type: string;
  mime_type?: string;
  file_size: number;
  storage_path: string;
  document_type_id: string;
  document_type_name?: string;
  document_type_code?: string;
  document_type_scope?: string;
  approval_required?: boolean;
  expiry_supported?: boolean;
  category_id: string;
  category_name?: string;
  category_code?: string;
  department: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  owner_department?: string;
  uploaded_by: string;
  uploader_name?: string;
  description?: string;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  expiry_date?: string | null;
  current_version: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  reviewer_name?: string;
  approval_status?: string;
  rejection_reason?: string;
  verification_date?: string;
  versions?: DocumentVersion[];
  approvals?: DocumentApproval[];
  shares?: DocumentShare[];
  auditLogs?: DocumentAuditLog[];
}

export interface DocumentKPIStats {
  totalDocuments: number;
  myDocuments: number;
  pendingReview: number;
  expiringSoon: number;
  expired: number;
  rejectedMyDocuments: number;
  storageUsed: string;
  storageBytes: number;
}

export interface DocumentFilterOptions {
  section: DocumentSection;
  search: string;
  status: string;
  category_id: string;
  document_type_id: string;
  department: string;
  owner_id: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}
