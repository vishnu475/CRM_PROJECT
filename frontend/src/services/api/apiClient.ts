import { ApiResponse } from '../../types';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${url}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, data: null as any, message: err.message };
    }
  }

  async post<T>(url: string, body: any): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, data: null as any, message: err.message };
    }
  }
}

export const apiClient = new ApiClient();
