export const authService = {
  getToken: (): string | null => localStorage.getItem('auth_token'),
  setToken: (token: string): void => localStorage.setItem('auth_token', token),
  clearToken: (): void => localStorage.removeItem('auth_token')
};
