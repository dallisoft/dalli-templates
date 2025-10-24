export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Post {
  id: number;
  category_id: number;
  user_id: number;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at?: string;
}

export interface PostFormData {
  category_id: number;
  user_id: number;
  title: string;
  content: string;
  tags: string[];
}

export interface PostWithCategory extends Post {
  category: Category;
}

export interface PostWithUser extends Post {
  user: User;
}

export interface PostWithCategoryAndUser extends Post {
  category: Category;
  user: User;
}
