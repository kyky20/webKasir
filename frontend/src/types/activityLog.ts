export interface ActivityLogUser {
  id: number;
  name: string;
  username: string;
  role: 'owner' | 'employee';
  email?: string;
}

export interface ActivityLog {
  id: number;
  store_id: number;
  user_id: number | null;
  user_name: string;
  module: string;
  action: string;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  properties: Record<string, unknown> | null;
  created_at: string;
  user?: ActivityLogUser;
}

export interface ActivityLogFilterParams {
  page?: number;
  per_page?: number;
  module?: string;
  action?: string;
  user_id?: number | '';
  role?: string;
  date_range?: 'today' | '7_days' | '30_days' | 'custom' | '';
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface ActivityLogPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface SystemNotification {
  id: number;
  store_id: number;
  user_id: number | null;
  audit_log_id: number | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  category: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}
