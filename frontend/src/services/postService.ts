import { Post, Category, PostFormData, PostWithCategory } from '../types/post';
import apiService from './api';

interface PaginatedPostsResponse {
  posts: PostWithCategory[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

class PostService {
  // Get all posts with category information and pagination
  async getPosts(page: number = 1, per_page: number = 10, category_id?: number, search?: string): Promise<PaginatedPostsResponse> {
    try {
      const response = await apiService.getPosts({ page, per_page, category_id, search });
      return response;
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      return {
        posts: [],
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 0
      };
    }
  }

  // Get post by ID
  async getPostById(id: number): Promise<PostWithCategory | null> {
    try {
      return await apiService.getPost(id);
    } catch (error) {
      console.error(`Failed to fetch post ${id}:`, error);
      return null;
    }
  }

  // Create new post
  async createPost(postData: PostFormData): Promise<Post | null> {
    try {
      return await apiService.createPost(postData);
    } catch (error) {
      console.error('Failed to create post:', error);
      return null;
    }
  }

  // Update existing post
  async updatePost(id: number, postData: PostFormData): Promise<Post | null> {
    try {
      return await apiService.updatePost(id, postData);
    } catch (error) {
      console.error(`Failed to update post ${id}:`, error);
      return null;
    }
  }

  // Delete post
  async deletePost(id: number): Promise<boolean> {
    try {
      await apiService.deletePost(id);
      return true;
    } catch (error) {
      console.error(`Failed to delete post ${id}:`, error);
      return false;
    }
  }

  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      return await apiService.getCategories();
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  }

  // Get category by ID
  async getCategoryById(id: number): Promise<Category | null> {
    try {
      return await apiService.getCategory(id);
    } catch (error) {
      console.error(`Failed to fetch category ${id}:`, error);
      return null;
    }
  }

  // Search posts
  async searchPosts(query: string): Promise<PostWithCategory[]> {
    try {
      return await apiService.searchPosts(query);
    } catch (error) {
      console.error('Failed to search posts:', error);
      return [];
    }
  }

  // Get posts by category
  async getPostsByCategory(categoryId: number): Promise<PostWithCategory[]> {
    try {
      return await apiService.getPosts({ category_id: categoryId });
    } catch (error) {
      console.error(`Failed to fetch posts for category ${categoryId}:`, error);
      return [];
    }
  }

  // Get posts by tag
  async getPostsByTag(tag: string): Promise<PostWithCategory[]> {
    try {
      return await apiService.searchPosts(tag);
    } catch (error) {
      console.error(`Failed to fetch posts for tag ${tag}:`, error);
      return [];
    }
  }
}

// Create singleton instance
const postService = new PostService();

export default postService;
