import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  children: React.ReactNode;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = '로딩 중...',
  size = 'medium',
  className = '',
  children
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <LoadingSpinner size={size} text={text} />
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
