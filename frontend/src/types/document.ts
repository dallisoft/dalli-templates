export interface Document {
  id: string;
  kb_id: string;
  user_id: number;
  name: string;
  file_type: string;
  file_path: string;
  file_size: number;
  chunk_count: number;
  token_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DocumentUpdate {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  chunk_count?: number;
  token_count?: number;
  error_message?: string;
}
