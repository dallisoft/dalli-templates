import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Knowledgebase } from '../../types/knowledgebase';
import Button from '../../components/ui/button/Button';
import CreateKnowledgebaseModal from '../../components/knowledgebase/CreateKnowledgebaseModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function KnowledgebaseList() {
  const [knowledgebases, setKnowledgebases] = useState<Knowledgebase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchKnowledgebases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/knowledgebases/`);
      const data = await response.json();
      setKnowledgebases(data);
    } catch (error) {
      console.error('Failed to fetch knowledgebases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgebases();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledgebase?')) return;

    try {
      await fetch(`${API_URL}/api/knowledgebases/${id}`, {
        method: 'DELETE',
      });
      setKnowledgebases(knowledgebases.filter(kb => kb.id !== id));
    } catch (error) {
      console.error('Failed to delete knowledgebase:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Knowledge Bases</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          Create Knowledge Base
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {knowledgebases.map((kb) => (
          <div
            key={kb.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <Link to={`/knowledgebases/${kb.id}`}>
              <h3 className="text-xl font-semibold mb-2 hover:text-blue-600">
                {kb.name}
              </h3>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm line-clamp-2">
              {kb.description || 'No description'}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {kb.doc_count}
                </div>
                <div className="text-xs text-gray-500">Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {kb.chunk_count}
                </div>
                <div className="text-xs text-gray-500">Chunks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(kb.token_count / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-gray-500">Tokens</div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-4">
              <div>Model: {kb.embedding_model}</div>
              <div>Parser: {kb.parser_type}</div>
            </div>

            <div className="flex gap-2">
              <Link to={`/knowledgebases/${kb.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => handleDelete(kb.id)}
                className="text-red-600 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {knowledgebases.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No knowledge bases yet.</p>
          <Button onClick={() => setIsModalOpen(true)}>
            Create Your First Knowledge Base
          </Button>
        </div>
      )}

      <CreateKnowledgebaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchKnowledgebases();
        }}
      />
    </div>
  );
}
