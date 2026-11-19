import api from './api';
import type { ApiResponse } from '@/types/auth';
import type { Category, Product, Sale, CheckoutPayload } from '@/types/pos';

export const posService = {
  async getCategories(): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>('/pos/categories');
    return response.data.data || [];
  },

  async getProducts(params?: { category_id?: number; search?: string }): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/pos/products', { params });
    return response.data.data || [];
  },

  async checkout(payload: CheckoutPayload): Promise<Sale> {
    const response = await api.post<ApiResponse<Sale>>('/pos/checkout', payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Gagal memproses transaksi.');
    }
    return response.data.data;
  },
};
