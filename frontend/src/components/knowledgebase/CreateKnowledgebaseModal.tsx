import { useState } from 'react';
import { KnowledgebaseCreate } from '../../types/knowledgebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateKnowledgebaseModal({ isOpen, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<KnowledgebaseCreate>({
    name: '',
    description: '',
    embedding_model: 'BAAI/bge-large-en-v1.5',
    parser_type: 'naive',
    chunk_size: 512,
    similarity_threshold: 0.2,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/knowledgebases/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          name: '',
          description: '',
          embedding_model: 'BAAI/bge-large-en-v1.5',
          parser_type: 'naive',
          chunk_size: 512,
          similarity_threshold: 0.2,
        });
      }
    } catch (error) {
      console.error('Failed to create knowledgebase:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Create Knowledge Base</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Embedding Model</label>
            <select
              value={formData.embedding_model}
              onChange={(e) => setFormData({ ...formData, embedding_model: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
            >
              <option value="BAAI/bge-large-en-v1.5">BAAI BGE Large (English)</option>
              <option value="BAAI/bge-large-zh-v1.5">BAAI BGE Large (Chinese)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Parser Type</label>
            <select
              value={formData.parser_type}
              onChange={(e) => setFormData({ ...formData, parser_type: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
            >
              <option value="naive">General</option>
              <option value="qa">Q&A</option>
              <option value="paper">Academic Paper</option>
              <option value="book">Book</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-5 py-3.5 text-sm bg-brand-500 text-white rounded-lg shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 text-sm bg-white text-gray-700 rounded-lg ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
