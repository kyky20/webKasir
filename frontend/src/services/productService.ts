import api from './api';
import type { ApiResponse } from '@/types/auth';
import type { Product, Category } from '@/types/pos';

export interface ProductFormData {
  name: string;
  category_id?: number | null;
  sku: string;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  stock?: number;
  min_stock?: number;
  unit?: string;
  description?: string;
  is_active?: boolean;
}

export interface PaginatedProducts {
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const productService = {
  async getProducts(params?: {
    page?: number;
    category_id?: number;
    search?: string;
    status?: string;
    stock_status?: string;
    per_page?: number;
    all?: boolean;
  }): Promise<PaginatedProducts> {
    const response = await api.get<ApiResponse<Product[]> & { meta: PaginatedProducts['meta'] }>('/products', {
      params,
    });
    return {
      data: response.data.data || [],
      meta: response.data.meta || { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    };
  },

  async getProduct(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Produk tidak ditemukan.');
    }
    return response.data.data;
  },

  async createProduct(data: ProductFormData): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Gagal menambahkan produk.');
    }
    return response.data.data;
  },

  async updateProduct(id: number, data: Partial<ProductFormData>): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Gagal memperbarui produk.');
    }
    return response.data.data;
  },

  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async getCategories(): Promise<(Category & { products_count?: number })[]> {
    const response = await api.get<ApiResponse<(Category & { products_count?: number })[]>>('/categories');
    return response.data.data || [];
  },

  async createCategory(data: { name: string; description?: string; is_active?: boolean }): Promise<Category> {
    const response = await api.post<ApiResponse<Category>>('/categories', data);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Gagal menambahkan kategori.');
    }
    return response.data.data;
  },

  async updateCategory(id: number, data: { name: string; description?: string; is_active?: boolean }): Promise<Category> {
    const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Gagal memperbarui kategori.');
    }
    return response.data.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
