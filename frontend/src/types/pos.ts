export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Product {
  id: number;
  category_id?: number | null;
  name: string;
  sku: string;
  barcode?: string | null;
  cost_price: number | string;
  selling_price: number | string;
  stock: number;
  min_stock: number;
  unit: string;
  image?: string | null;
  description?: string | null;
  is_active?: boolean;
  category?: Category | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'qris' | 'other';
export type SaleStatus = 'completed' | 'cancelled';

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id?: number | null;
  product_name: string;
  product_sku: string;
  unit_price: number | string;
  cost_price: number | string;
  quantity: number;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
}

export interface Sale {
  id: number;
  store_id: number;
  user_id: number;
  invoice_number: string;
  status: SaleStatus;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  change_amount: number | string;
  payment_method: PaymentMethod;
  notes?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  items: SaleItem[];
  cashier?: {
    id: number;
    name: string;
    username: string;
  };
  cancelled_by_user?: {
    id: number;
    name: string;
  } | null;
  store?: {
    id: number;
    name: string;
    address?: string | null;
    phone?: string | null;
    receipt_header?: string | null;
    receipt_footer?: string | null;
    receipt_paper_size?: string | null;
    show_cashier_name?: boolean;
  };
}

export interface CheckoutPayload {
  items: {
    product_id: number;
    quantity: number;
  }[];
  payment_method: PaymentMethod;
  paid_amount: number;
  discount_amount?: number;
  notes?: string;
  idempotency_key?: string;
}

export interface TransactionFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  payment_method?: string;
  cashier_id?: number;
  date_from?: string;
  date_to?: string;
}
