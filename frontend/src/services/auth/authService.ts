import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export const authService = {
  login: async (credentials: any) => {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }
};
