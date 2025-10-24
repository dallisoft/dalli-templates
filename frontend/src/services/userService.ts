import { User, UserCreate, UserUpdate, UserLogin } from '../types/user';

const API_BASE_URL = 'http://localhost:8000/api';

export const userService = {
  // 사용자 목록 조회 (페이징 포함)
  async getUsers(page: number = 1, per_page: number = 10, search?: string): Promise<{
    users: User[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await fetch(`${API_BASE_URL}/users/?${params}`);
    if (!response.ok) {
      throw new Error('사용자 목록을 불러오는데 실패했습니다.');
    }
    return response.json();
  },

  // 특정 사용자 조회
  async getUser(id: number): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error('사용자 정보를 불러오는데 실패했습니다.');
    }
    return response.json();
  },

  // 사용자 생성
  async createUser(userData: UserCreate): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '사용자 생성에 실패했습니다.');
    }
    
    return response.json();
  },

  // 사용자 수정
  async updateUser(id: number, userData: UserUpdate): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '사용자 수정에 실패했습니다.');
    }
    
    return response.json();
  },

  // 사용자 삭제
  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '사용자 삭제에 실패했습니다.');
    }
  },

  // 사용자 로그인
  async loginUser(loginData: UserLogin): Promise<{ message: string; user: User }> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '로그인에 실패했습니다.');
    }
    
    return response.json();
  },
};
