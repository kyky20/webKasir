import api from './api';
import type { Customer, Supplier } from '../types/purchase';

export interface SupplierListResponse {
  success: boolean;
  data: Supplier[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const contactService = {
  // Suppliers
  async getSuppliers(params?: { search?: string; all?: boolean; page?: number; per_page?: number }) {
    const response = await api.get<SupplierListResponse>('/suppliers', { params });
    return response.data;
  },

  async getSupplier(id: number) {
    const response = await api.get<{ success: boolean; data: Supplier }>(`/suppliers/${id}`);
    return response.data;
  },

  async createSupplier(data: Partial<Supplier>) {
    const response = await api.post<{ success: boolean; message: string; data: Supplier }>('/suppliers', data);
    return response.data;
  },

  async updateSupplier(id: number, data: Partial<Supplier>) {
    const response = await api.put<{ success: boolean; message: string; data: Supplier }>(`/suppliers/${id}`, data);
    return response.data;
  },

  async deleteSupplier(id: number) {
    const response = await api.delete<{ success: boolean; message: string }>(`/suppliers/${id}`);
    return response.data;
  },

  // Customers
  async getCustomers(params?: { search?: string; all?: boolean; page?: number; per_page?: number }) {
    const response = await api.get<CustomerListResponse>('/customers', { params });
    return response.data;
  },

  async getCustomer(id: number) {
    const response = await api.get<{ success: boolean; data: Customer }>(`/customers/${id}`);
    return response.data;
  },

  async createCustomer(data: Partial<Customer>) {
    const response = await api.post<{ success: boolean; message: string; data: Customer }>('/customers', data);
    return response.data;
  },

  async updateCustomer(id: number, data: Partial<Customer>) {
    const response = await api.put<{ success: boolean; message: string; data: Customer }>(`/customers/${id}`, data);
    return response.data;
  },

  async deleteCustomer(id: number) {
    const response = await api.delete<{ success: boolean; message: string }>(`/customers/${id}`);
    return response.data;
  },
};
