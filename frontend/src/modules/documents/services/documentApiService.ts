import {
  DocumentItem,
  DocumentKPIStats,
  DocumentCategory,
  DocumentType,
  DocumentFilterOptions
} from '../types';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const documentApiService = {
  async getDocuments(filters: Partial<DocumentFilterOptions> = {}): Promise<{ documents: DocumentItem[]; total: number }> {
    const params = new URLSearchParams();
    if (filters.section) params.set('section', filters.section);
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.category_id) params.set('category_id', filters.category_id);
    if (filters.document_type_id) params.set('document_type_id', filters.document_type_id);
    if (filters.department) params.set('department', filters.department);
    if (filters.owner_id) params.set('owner_id', filters.owner_id);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    params.set('limit', '100');

    const res = await fetch(`/api/documents?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch documents');
    return { documents: json.documents || [], total: json.total || 0 };
  },

  async getStats(): Promise<DocumentKPIStats> {
    const res = await fetch('/api/documents/stats', {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch stats');
    return json.data;
  },

  async getDocument(id: string): Promise<DocumentItem> {
    const res = await fetch(`/api/documents/${id}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch document');
    return json.data;
  },

  async createDocument(data: any): Promise<DocumentItem> {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to upload document');
    return json.data;
  },

  async submitDocument(id: string): Promise<void> {
    const res = await fetch(`/api/documents/${id}/submit`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to submit document');
  },

  async approveDocument(id: string, comments?: string): Promise<void> {
    const res = await fetch(`/api/documents/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comments })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to approve document');
  },

  async rejectDocument(id: string, comments: string): Promise<void> {
    const res = await fetch(`/api/documents/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comments })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to reject document');
  },

  async createVersion(id: string, payload: any): Promise<any> {
    const res = await fetch(`/api/documents/${id}/versions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create new version');
    return json;
  },

  async restoreVersion(id: string, versionId: string): Promise<void> {
    const res = await fetch(`/api/documents/${id}/versions/${versionId}/restore`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to restore version');
  },

  async shareDocument(id: string, payload: any): Promise<void> {
    const res = await fetch(`/api/documents/${id}/share`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to share document');
  },

  async revokeShare(id: string, shareId: string): Promise<void> {
    const res = await fetch(`/api/documents/${id}/share/${shareId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to revoke share');
  },

  async archiveDocument(id: string): Promise<void> {
    const res = await fetch(`/api/documents/${id}/archive`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to archive document');
  },

  async restoreDocument(id: string): Promise<void> {
    const res = await fetch(`/api/documents/${id}/restore`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to restore document');
  },

  async deleteDocument(id: string, permanent: boolean = false): Promise<void> {
    const res = await fetch(`/api/documents/${id}?permanent=${permanent}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to delete document');
  },

  async bulkAction(action: 'archive' | 'trash' | 'restore', ids: string[]): Promise<any> {
    const res = await fetch('/api/documents/bulk', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, ids })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to perform bulk action');
    return json;
  },

  async getDocumentTypes(): Promise<DocumentType[]> {
    const res = await fetch('/api/document-types', {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch document types');
    return json.data || [];
  },

  async saveDocumentType(data: Partial<DocumentType>): Promise<any> {
    const url = data.id ? `/api/document-types/${data.id}` : '/api/document-types';
    const method = data.id ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to save document type');
    return json;
  },

  async getCategories(): Promise<DocumentCategory[]> {
    const res = await fetch('/api/document-categories', {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch categories');
    return json.data || [];
  },

  async saveCategory(data: Partial<DocumentCategory>): Promise<any> {
    const url = data.id ? `/api/document-categories/${data.id}` : '/api/document-categories';
    const method = data.id ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to save category');
    return json;
  },

  getPreviewUrl(id: string): string {
    return `/api/documents/${id}/preview`;
  },

  getDownloadUrl(id: string): string {
    return `/api/documents/${id}/download`;
  }
};
