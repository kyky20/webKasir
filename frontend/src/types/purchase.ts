export interface Supplier {
  id: number;
  store_id: number;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
  purchases_count?: number;
  created_at: string;
}

export interface Customer {
  id: number;
  store_id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseItem {
  id?: number;
  purchase_id?: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  unit_cost: number | string;
  quantity: number;
  subtotal: number | string;
  product?: {
    id: number;
    name: string;
    sku: string;
    unit: string;
  };
}

export interface Payable {
  id: number;
  store_id: number;
  purchase_id?: number;
  supplier_id: number;
  invoice_number: string;
  total_amount: number | string;
  paid_amount: number | string;
  remaining_amount: number | string;
  due_date?: string | null;
  status: 'unpaid' | 'partially_paid' | 'paid';
  notes?: string | null;
  supplier?: Supplier;
}

export interface Purchase {
  id: number;
  store_id: number;
  user_id: number;
  supplier_id?: number | null;
  invoice_number: string;
  reference_no?: string | null;
  purchase_date: string;
  status: 'draft' | 'received' | 'cancelled';
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  payment_method: 'cash' | 'bank_transfer' | 'credit';
  subtotal: number | string;
  discount_amount: number | string;
  additional_cost: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  due_date?: string | null;
  notes?: string | null;
  received_at?: string | null;
  received_by?: number | null;
  created_at: string;
  supplier?: Supplier | null;
  creator?: { id: number; name: string; role?: string };
  receiver?: { id: number; name: string; role?: string };
  items?: PurchaseItem[];
  items_count?: number;
  payable?: Payable | null;
}

export interface PurchaseSummary {
  total_received_amount: number;
  total_unpaid_payables: number;
  draft_count: number;
  total_purchases_count: number;
}
