const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Posts API
  async getPosts(params?: {
    page?: number;
    per_page?: number;
    category_id?: number;
    search?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.category_id) searchParams.append('category_id', params.category_id.toString());
    if (params?.search) searchParams.append('search', params.search.toString());
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/posts/?${queryString}` : '/api/posts/';
    
    return this.request<any>(endpoint);
  }

  async getPost(id: number): Promise<any> {
    return this.request<any>(`/api/posts/${id}`);
  }

  async createPost(data: any): Promise<any> {
    return this.request<any>('/api/posts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePost(id: number, data: any): Promise<any> {
    return this.request<any>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: number): Promise<void> {
    return this.request<void>(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async searchPosts(query: string): Promise<any[]> {
    return this.request<any[]>(`/api/posts/search/?q=${encodeURIComponent(query)}`);
  }

  // Categories API
  async getCategories(): Promise<any[]> {
    return this.request<any[]>('/api/categories/');
  }

  async getCategory(id: number): Promise<any> {
    return this.request<any>(`/api/categories/${id}`);
  }

  async createCategory(data: any): Promise<any> {
    return this.request<any>('/api/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: any): Promise<any> {
    return this.request<any>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    return this.request<void>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
