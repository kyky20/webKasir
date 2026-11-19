export interface FinancialAccount {
  id: number;
  store_id: number;
  name: string;
  account_type: 'cash' | 'bank' | 'ewallet' | 'other';
  account_number?: string | null;
  initial_balance: number | string;
  current_balance: number | string;
  is_active: boolean;
  notes?: string | null;
  transactions_count?: number;
  created_at?: string;
}

export interface ExpenseCategory {
  id: number;
  store_id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  transactions_count?: number;
}

export interface CashTransaction {
  id: number;
  store_id: number;
  user_id: number;
  account_id: number;
  to_account_id?: number | null;
  category_id?: number | null;
  transaction_number: string;
  transaction_date: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number | string;
  recipient_payer?: string | null;
  reference_no?: string | null;
  notes?: string | null;
  created_at?: string;
  account?: { id: number; name: string; account_type: string };
  to_account?: { id: number; name: string; account_type: string } | null;
  category?: { id: number; name: string } | null;
  user?: { id: number; name: string };
}

export interface CashTransactionsSummary {
  total_expense: number;
  total_income: number;
  net_cash: number;
}

export interface ProfitLossReport {
  period: { date_from: string; date_to: string };
  data: {
    revenue: {
      gross_sales: number;
      sales_discount: number;
      net_sales: number;
      transactions_count: number;
    };
    cogs: {
      total_cogs: number;
    };
    gross_profit: {
      amount: number;
      margin_percentage: number;
    };
    operating_expenses: {
      total: number;
      categories: Array<{
        category_name: string;
        total_amount: number;
        count: number;
      }>;
    };
    other_income: {
      total: number;
    };
    net_profit: {
      amount: number;
      margin_percentage: number;
    };
  };
}

export interface CashFlowReport {
  period: { date_from: string; date_to: string };
  data: {
    inflow: {
      sales: number;
      other_income: number;
      total: number;
    };
    outflow: {
      purchases: number;
      operating_expenses: number;
      total: number;
    };
    net_cash_flow: number;
    accounts: Array<{
      id: number;
      name: string;
      account_type: string;
      current_balance: number | string;
    }>;
    total_liquid_assets: number;
  };
}

export interface SalesAnalyticsReport {
  period: { date_from: string; date_to: string };
  data: {
    daily_trend: Array<{
      date: string;
      total_sales: number;
      transaction_count: number;
    }>;
    payment_methods: Array<{
      method: string;
      total_amount: number;
      count: number;
    }>;
    top_products: Array<{
      id: number;
      name: string;
      sku: string;
      unit: string;
      total_quantity: number;
      total_revenue: number;
      estimated_profit: number;
    }>;
  };
}

export interface InventoryValuationReport {
  data: {
    summary: {
      total_products_count: number;
      total_stock_units: number;
      total_cost_value: number;
      total_sales_value: number;
      potential_profit: number;
      low_stock_count: number;
      out_of_stock_count: number;
    };
    by_category: Array<{
      category_name: string;
      items_count: number;
      stock_units: number;
      cost_value: number;
      sales_value: number;
      potential_profit: number;
    }>;
  };
}
