import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Props {
  kbId: string;
  onSuccess: () => void;
}

export default function DocumentUpload({ kbId, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        await fetch(`${API_URL}/api/knowledgebases/${kbId}/documents/upload`, {
          method: 'POST',
          body: formData,
        });

        setProgress(((i + 1) / acceptedFiles.length) * 100);
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [kbId, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: uploading,
  });

  return (
    <div className="mb-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div>
            <div className="text-lg font-medium mb-2">Uploading...</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-gray-500">{progress.toFixed(0)}%</div>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-lg mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500">
              or click to select files
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supported: PDF, DOCX, DOC, TXT, MD (Max 50MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
