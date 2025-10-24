import React from 'react';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', children }) => {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}>
      {children}
    </div>
  );
};

// 테이블 스켈레톤
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// 카드 스켈레톤
export const CardSkeleton: React.FC<{ 
  lines?: number; 
  showAvatar?: boolean;
  className?: string;
}> = ({ 
  lines = 3, 
  showAvatar = false,
  className = ''
}) => {
  return (
    <div className={`p-6 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        )}
        <div className="flex-1 space-y-3">
          {[...Array(lines)].map((_, index) => (
            <Skeleton 
              key={index} 
              className={`h-4 ${index === 0 ? 'w-3/4' : index === lines - 1 ? 'w-1/2' : 'w-full'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// 리스트 스켈레톤
export const ListSkeleton: React.FC<{ 
  items?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ 
  items = 5, 
  showAvatar = false,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(items)].map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4">
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 폼 스켈레톤
export const FormSkeleton: React.FC<{ 
  fields?: number;
  className?: string;
}> = ({ 
  fields = 4,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {[...Array(fields)].map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-4 pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
};

// 페이지 스켈레톤
export const PageSkeleton: React.FC<{ 
  showHeader?: boolean;
  showSidebar?: boolean;
  className?: string;
}> = ({ 
  showHeader = true,
  showSidebar = false,
  className = ''
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {showHeader && (
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex">
        {showSidebar && (
          <div className="w-64 bg-white dark:bg-gray-800 shadow-sm">
            <div className="p-4 space-y-4">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))}
            </div>
          </div>
        )}
        
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
