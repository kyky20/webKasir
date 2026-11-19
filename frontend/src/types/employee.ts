export interface Employee {
  id: number;
  store_id: number;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  role: 'owner' | 'employee';
  status: 'active' | 'inactive';
  last_login_at?: string | null;
  completed_sales_count?: number;
  total_sales_amount?: number | string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  store_id: number;
  user_id?: number | null;
  user_name?: string | null;
  action: string;
  description: string;
  ip_address?: string | null;
  user_agent?: string | null;
  properties?: Record<string, any> | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    username: string;
    role: string;
  } | null;
}

export interface StoreSetting {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo?: string | null;
  currency: string;
  timezone: string;
  tax_percentage: number | string;
  receipt_header?: string | null;
  receipt_footer?: string | null;
  receipt_paper_size: '58mm' | '80mm';
  show_cashier_name: boolean;
}
