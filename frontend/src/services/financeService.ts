import api from './api';
import type {
  FinancialAccount,
  ExpenseCategory,
  CashTransaction,
  CashTransactionsSummary,
  ProfitLossReport,
  CashFlowReport,
  SalesAnalyticsReport,
  InventoryValuationReport,
} from '../types/finance';

export const financeService = {
  // Accounts
  async getAccounts() {
    const response = await api.get<{
      success: boolean;
      data: FinancialAccount[];
      summary: { total_liquid_assets: number; active_accounts_count: number };
    }>('/finance/accounts');
    return response.data;
  },

  async createAccount(data: {
    name: string;
    account_type: 'cash' | 'bank' | 'ewallet' | 'other';
    account_number?: string;
    initial_balance?: number;
    notes?: string;
  }) {
    const response = await api.post<{ success: boolean; message: string; data: FinancialAccount }>(
      '/finance/accounts',
      data
    );
    return response.data;
  },

  async updateAccount(
    id: number,
    data: {
      name: string;
      account_type: 'cash' | 'bank' | 'ewallet' | 'other';
      account_number?: string;
      is_active?: boolean;
      notes?: string;
    }
  ) {
    const response = await api.put<{ success: boolean; message: string; data: FinancialAccount }>(
      `/finance/accounts/${id}`,
      data
    );
    return response.data;
  },

  async deleteAccount(id: number) {
    const response = await api.delete<{ success: boolean; message: string }>(`/finance/accounts/${id}`);
    return response.data;
  },

  // Categories
  async getCategories() {
    const response = await api.get<{ success: boolean; data: ExpenseCategory[] }>('/finance/categories');
    return response.data;
  },

  async createCategory(data: { name: string; description?: string }) {
    const response = await api.post<{ success: boolean; message: string; data: ExpenseCategory }>(
      '/finance/categories',
      data
    );
    return response.data;
  },

  async updateCategory(id: number, data: { name: string; description?: string; is_active?: boolean }) {
    const response = await api.put<{ success: boolean; message: string; data: ExpenseCategory }>(
      `/finance/categories/${id}`,
      data
    );
    return response.data;
  },

  async deleteCategory(id: number) {
    const response = await api.delete<{ success: boolean; message: string }>(`/finance/categories/${id}`);
    return response.data;
  },

  // Cash Transactions
  async getTransactions(params?: {
    type?: string;
    account_id?: number;
    category_id?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) {
    const response = await api.get<{
      success: boolean;
      data: CashTransaction[];
      summary: CashTransactionsSummary;
      meta: { current_page: number; last_page: number; per_page: number; total: number };
    }>('/finance/transactions', { params });
    return response.data;
  },

  async createTransaction(data: {
    type: 'expense' | 'income' | 'transfer';
    account_id: number;
    to_account_id?: number | null;
    category_id?: number | null;
    transaction_date: string;
    amount: number;
    recipient_payer?: string;
    reference_no?: string;
    notes?: string;
  }) {
    const response = await api.post<{ success: boolean; message: string; data: CashTransaction }>(
      '/finance/transactions',
      data
    );
    return response.data;
  },

  async deleteTransaction(id: number) {
    const response = await api.delete<{ success: boolean; message: string }>(`/finance/transactions/${id}`);
    return response.data;
  },

  // Reports
  async getProfitLoss(params?: { date_from?: string; date_to?: string }) {
    const response = await api.get<ProfitLossReport>('/reports/profit-loss', { params });
    return response.data;
  },

  async getCashFlow(params?: { date_from?: string; date_to?: string }) {
    const response = await api.get<CashFlowReport>('/reports/cash-flow', { params });
    return response.data;
  },

  async getSalesAnalytics(params?: { date_from?: string; date_to?: string }) {
    const response = await api.get<SalesAnalyticsReport>('/reports/sales-analytics', { params });
    return response.data;
  },

  async getInventoryValuation() {
    const response = await api.get<InventoryValuationReport>('/reports/inventory-valuation');
    return response.data;
  },
};
