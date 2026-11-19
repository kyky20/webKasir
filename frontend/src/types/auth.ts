export type UserRole = 'owner' | 'employee';
export type UserStatus = 'active' | 'inactive';

export interface Store {
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
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  last_login_at?: string | null;
}

export interface AuthResponseData {
  token: string;
  user: User;
  store: Store;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}
