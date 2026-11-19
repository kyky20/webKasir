import api from './api';
import type { Employee, AuditLog, StoreSetting } from '../types/employee';

export const employeeService = {
  // Employees
  async getEmployees(params?: { search?: string; role?: string; status?: string; page?: number; per_page?: number }) {
    const response = await api.get<{
      success: boolean;
      data: Employee[];
      meta: { current_page: number; last_page: number; per_page: number; total: number };
    }>('/employees', { params });
    return response.data;
  },

  async createEmployee(data: {
    name: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
    role: 'owner' | 'employee';
    status?: 'active' | 'inactive';
  }) {
    const response = await api.post<{ success: boolean; message: string; data: Employee }>('/employees', data);
    return response.data;
  },

  async updateEmployee(
    id: number,
    data: {
      name: string;
      email: string;
      phone?: string;
      role: 'owner' | 'employee';
      status: 'active' | 'inactive';
    }
  ) {
    const response = await api.put<{ success: boolean; message: string; data: Employee }>(`/employees/${id}`, data);
    return response.data;
  },

  async changePassword(id: number, password: string) {
    const response = await api.post<{ success: boolean; message: string }>(`/employees/${id}/change-password`, {
      password,
    });
    return response.data;
  },

  async deleteEmployee(id: number) {
    const response = await api.delete<{ success: boolean; message: string }>(`/employees/${id}`);
    return response.data;
  },

  // Audit Logs
  async getAuditLogs(params?: {
    action?: string;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) {
    const response = await api.get<{
      success: boolean;
      data: AuditLog[];
      meta: { current_page: number; last_page: number; per_page: number; total: number };
    }>('/audit-logs', { params });
    return response.data;
  },

  async getAuditActions() {
    const response = await api.get<{ success: boolean; data: string[] }>('/audit-logs/actions');
    return response.data;
  },

  // Store Settings
  async getStoreSettings() {
    const response = await api.get<{ success: boolean; data: StoreSetting }>('/settings/store');
    return response.data;
  },

  async updateStoreSettings(data: Partial<StoreSetting>) {
    const response = await api.put<{ success: boolean; message: string; data: StoreSetting }>(
      '/settings/store',
      data
    );
    return response.data;
  },
};
