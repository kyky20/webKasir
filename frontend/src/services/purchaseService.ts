import api from './api';
import type { Payable, Purchase, PurchaseSummary } from '../types/purchase';

export interface PurchaseListResponse {
  success: boolean;
  data: Purchase[];
  summary: PurchaseSummary;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreatePurchasePayload {
  supplier_id?: number | null;
  reference_no?: string;
  purchase_date: string;
  status: 'draft' | 'received';
  payment_method: 'cash' | 'bank_transfer' | 'credit';
  discount_amount?: number;
  additional_cost?: number;
  paid_amount?: number;
  due_date?: string | null;
  notes?: string;
  items: Array<{
    product_id: number;
    unit_cost: number;
    quantity: number;
  }>;
}

export const purchaseService = {
  async getPurchases(params?: {
    supplier_id?: number;
    status?: string;
    payment_status?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) {
    const response = await api.get<PurchaseListResponse>('/purchases', { params });
    return response.data;
  },

  async getPurchase(id: number) {
    const response = await api.get<{ success: boolean; data: Purchase }>(`/purchases/${id}`);
    return response.data;
  },

  async createPurchase(payload: CreatePurchasePayload) {
    const response = await api.post<{ success: boolean; message: string; data: Purchase }>('/purchases', payload);
    return response.data;
  },

  async receivePurchase(id: number) {
    const response = await api.post<{ success: boolean; message: string; data: Purchase }>(`/purchases/${id}/receive`);
    return response.data;
  },

  async cancelPurchase(id: number, reason?: string) {
    const response = await api.post<{ success: boolean; message: string; data: Purchase }>(`/purchases/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  async payPayable(payableId: number, payload: { amount: number; payment_date?: string; notes?: string }) {
    const response = await api.post<{ success: boolean; message: string; data: Payable }>(`/payables/${payableId}/pay`, payload);
    return response.data;
  },
};
