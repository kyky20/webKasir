import api from './api';
import type { ApiResponse, AuthResponseData, User, Store } from '@/types/auth';

export const authService = {
  async login(login: string, password: string): Promise<AuthResponseData> {
    const response = await api.post<ApiResponse<AuthResponseData>>('/auth/login', {
      login,
      password,
    });
    if (!response.data.data) {
      throw new Error(response.data.message || 'Login gagal.');
    }
    return response.data.data;
  },

  async me(): Promise<{ user: User; store: Store }> {
    const response = await api.get<ApiResponse<{ user: User; store: Store }>>('/auth/me');
    if (!response.data.data) {
      throw new Error('Gagal mengambil data user.');
    }
    return response.data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('kasirku_token');
      localStorage.removeItem('kasirku_user');
      localStorage.removeItem('kasirku_store');
    }
  },
};
