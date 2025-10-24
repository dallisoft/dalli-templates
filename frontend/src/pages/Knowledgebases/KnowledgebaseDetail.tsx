import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Knowledgebase } from '../../types/knowledgebase';
import { Document } from '../../types/document';
import DocumentUpload from '../../components/knowledgebase/DocumentUpload';
import DocumentList from '../../components/knowledgebase/DocumentList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function KnowledgebaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [kb, setKb] = useState<Knowledgebase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'settings'>('documents');

  const fetchKnowledgebase = async () => {
    try {
      const response = await fetch(`${API_URL}/api/knowledgebases/${id}`);
      const data = await response.json();
      setKb(data);
    } catch (error) {
      console.error('Failed to fetch knowledgebase:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/knowledgebases/${id}/documents`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgebase();
    fetchDocuments();
  }, [id]);

  const handleUploadSuccess = () => {
    fetchDocuments();
    fetchKnowledgebase();
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await fetch(`${API_URL}/api/knowledgebases/documents/${docId}`, {
        method: 'DELETE',
      });
      setDocuments(documents.filter(doc => doc.id !== docId));
      fetchKnowledgebase();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  if (loading || !kb) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link to="/knowledgebases" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Knowledge Bases
        </Link>
        <h1 className="text-3xl font-bold mb-2">{kb.name}</h1>
        <p className="text-gray-600 dark:text-gray-400">{kb.description}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-3xl font-bold text-blue-600">{kb.doc_count}</div>
          <div className="text-sm text-gray-500">Documents</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-3xl font-bold text-green-600">{kb.chunk_count}</div>
          <div className="text-sm text-gray-500">Chunks</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-3xl font-bold text-purple-600">
            {(kb.token_count / 1000).toFixed(1)}K
          </div>
          <div className="text-sm text-gray-500">Tokens</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-sm font-medium">{kb.embedding_model}</div>
          <div className="text-xs text-gray-500">Embedding Model</div>
        </div>
      </div>

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-2 px-1 ${
              activeTab === 'documents'
                ? 'border-b-2 border-blue-600 font-medium'
                : 'text-gray-500'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 px-1 ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-600 font-medium'
                : 'text-gray-500'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'documents' && (
        <div>
          <DocumentUpload kbId={id!} onSuccess={handleUploadSuccess} />
          <DocumentList documents={documents} onDelete={handleDeleteDocument} />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chunk Size</label>
              <div className="text-gray-600 dark:text-gray-400">{kb.chunk_size} tokens</div>
            </div>
            <div>
              <label className="text-sm font-medium">Similarity Threshold</label>
              <div className="text-gray-600 dark:text-gray-400">{kb.similarity_threshold}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Parser Type</label>
              <div className="text-gray-600 dark:text-gray-400">{kb.parser_type}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
