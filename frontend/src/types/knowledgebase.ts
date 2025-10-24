export interface Knowledgebase {
  id: string;
  user_id: number;
  name: string;
  description: string | null;
  embedding_model: string;
  parser_type: string;
  chunk_size: number;
  similarity_threshold: number;
  doc_count: number;
  chunk_count: number;
  token_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface KnowledgebaseCreate {
  name: string;
  description?: string;
  embedding_model?: string;
  parser_type?: string;
  chunk_size?: number;
  similarity_threshold?: number;
}

export interface KnowledgebaseUpdate {
  name?: string;
  description?: string;
  embedding_model?: string;
  parser_type?: string;
  chunk_size?: number;
  similarity_threshold?: number;
}
