export interface UserProfile {
  id: number;
  user_id: number;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  avatar_url?: string;
  birth_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserProfileCreate {
  user_id: number;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  avatar_url?: string;
  birth_date?: string;
}

export interface UserProfileUpdate {
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  avatar_url?: string;
  birth_date?: string;
}

export interface UserWithProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
  profile?: UserProfile;
}
