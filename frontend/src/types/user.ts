export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserCreate {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  is_active?: boolean;
  is_admin?: boolean;
}

export interface UserUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_admin?: boolean;
  password?: string;
  password_confirm?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}
