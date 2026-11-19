import api from './api';
import type { ApiResponse } from '@/types/auth';
import type { Sale, TransactionFilterParams } from '@/types/pos';

export interface PaginatedSales {
  data: Sale[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const transactionService = {
  async getTransactions(params?: TransactionFilterParams): Promise<PaginatedSales> {
    const response = await api.get<ApiResponse<Sale[]> & { meta: PaginatedSales['meta'] }>('/transactions', {
      params,
    });
    return {
      data: response.data.data || [],
      meta: response.data.meta || { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    };
  },

  async getTransaction(id: number | string): Promise<Sale> {
    const response = await api.get<ApiResponse<Sale>>(`/transactions/${id}`);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Transaksi tidak ditemukan.');
    }
    return response.data.data;
  },

  async cancelTransaction(id: number, reason: string): Promise<Sale> {
    const response = await api.post<ApiResponse<Sale>>(`/transactions/${id}/cancel`, {
      reason,
    });
    if (!response.data.data) {
      throw new Error(response.data.message || 'Gagal membatalkan transaksi.');
    }
    return response.data.data;
  },
};
