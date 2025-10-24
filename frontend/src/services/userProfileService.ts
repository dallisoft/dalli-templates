import { UserProfile, UserProfileCreate, UserProfileUpdate, UserWithProfile } from '../types/userProfile';

const API_BASE_URL = 'http://localhost:8000/api';

export const userProfileService = {
  // 모든 사용자 프로필 조회
  async getUserProfiles(): Promise<UserProfile[]> {
    const response = await fetch(`${API_BASE_URL}/user-profiles/`);
    if (!response.ok) {
      throw new Error('사용자 프로필 목록을 불러오는데 실패했습니다.');
    }
    return response.json();
  },

  // ID로 사용자 프로필 조회
  async getUserProfile(id: number): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/user-profiles/${id}`);
    if (!response.ok) {
      throw new Error('사용자 프로필을 불러오는데 실패했습니다.');
    }
    return response.json();
  },

  // 사용자 ID로 프로필 조회
  async getUserProfileByUserId(userId: number): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/user-profiles/user/${userId}`);
    if (!response.ok) {
      throw new Error('사용자 프로필을 불러오는데 실패했습니다.');
    }
    return response.json();
  },

  // 사용자와 프로필 정보를 함께 조회
  async getUserWithProfile(userId: number): Promise<UserWithProfile> {
    const response = await fetch(`${API_BASE_URL}/user-profiles/user/${userId}/with-profile`);
    if (!response.ok) {
      throw new Error('사용자 정보를 불러오는데 실패했습니다.');
    }
    return response.json();
  },

  // 사용자 프로필 생성
  async createUserProfile(profileData: UserProfileCreate): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/user-profiles/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '사용자 프로필 생성에 실패했습니다.');
    }
    
    return response.json();
  },

  // 사용자 프로필 수정
  async updateUserProfile(id: number, profileData: UserProfileUpdate): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/user-profiles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '사용자 프로필 수정에 실패했습니다.');
    }
    
    return response.json();
  },

  // 사용자 ID로 프로필 수정
  async updateUserProfileByUserId(userId: number, profileData: UserProfileUpdate): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/user-profiles/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '사용자 프로필 수정에 실패했습니다.');
    }
    
    return response.json();
  },

  // 사용자 프로필 삭제
  async deleteUserProfile(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/user-profiles/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '사용자 프로필 삭제에 실패했습니다.');
    }
  },
};
