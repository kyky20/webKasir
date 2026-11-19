import api from './api';
import type { ApiResponse } from '@/types/auth';
import type { Product } from '@/types/pos';

export interface StockMovementRecord {
  id: number;
  product_id: number;
  user_id: number;
  type: 'sale' | 'purchase' | 'adjustment' | 'return';
  quantity: number;
  stock_before: number;
  stock_after: number;
  notes?: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    role: string;
  };
}

export interface InventoryKPI {
  total_asset_value: number;
  total_units: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_products_count: number;
}

export interface InventorySummaryResult {
  kpi: InventoryKPI;
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface StockAdjustmentPayload {
  product_id: number;
  adjustment_type: 'set_stock' | 'add_stock' | 'subtract_stock';
  quantity: number;
  reason: string;
}

export const inventoryService = {
  async getSummary(params?: {
    page?: number;
    category_id?: number;
    search?: string;
    stock_status?: string;
    per_page?: number;
  }): Promise<InventorySummaryResult> {
    const response = await api.get<ApiResponse<Product[]> & { kpi: InventoryKPI; meta: InventorySummaryResult['meta'] }>(
      '/inventory/summary',
      { params }
    );
    return {
      kpi: response.data.kpi || {
        total_asset_value: 0,
        total_units: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        total_products_count: 0,
      },
      data: response.data.data || [],
      meta: response.data.meta || { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    };
  },

  async getMovements(productId: number): Promise<{ product: Product; movements: StockMovementRecord[] }> {
    const response = await api.get<ApiResponse<StockMovementRecord[]> & { product: Product }>(
      `/inventory/${productId}/movements`
    );
    return {
      product: response.data.product,
      movements: response.data.data || [],
    };
  },

  async adjustStock(payload: StockAdjustmentPayload): Promise<{ product: Product; movement: StockMovementRecord }> {
    const response = await api.post<ApiResponse<{ product: Product; movement: StockMovementRecord }>>(
      '/inventory/adjust',
      payload
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Gagal menyesuaikan stok.');
    }
    return response.data.data;
  },
};
