import { useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import { 
  LoadingSpinner, 
  TableSkeleton, 
  CardSkeleton, 
  ListSkeleton, 
  FormSkeleton, 
  PageSkeleton,
  LoadingOverlay 
} from '../../components/ui/loading';

export default function LoadingDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const simulateOverlay = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <>
      <PageMeta
        title="로딩 UI 데모 | Dalli Template"
        description="로딩 스피너와 스켈레톤 UI 컴포넌트 데모"
      />
      <PageBreadcrumb pageTitle="로딩 UI 데모" />

      <div className="space-y-6">
        {/* 로딩 스피너 */}
        <ComponentCard title="로딩 스피너">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Small</h4>
                <LoadingSpinner size="small" text="작은 스피너" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Medium</h4>
                <LoadingSpinner size="medium" text="중간 스피너" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Large</h4>
                <LoadingSpinner size="large" text="큰 스피너" />
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* 스켈레톤 UI */}
        <ComponentCard title="스켈레톤 UI">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">테이블 스켈레톤</h4>
              <TableSkeleton rows={4} columns={4} />
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">카드 스켈레톤</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardSkeleton lines={3} showAvatar={true} />
                <CardSkeleton lines={2} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">리스트 스켈레톤</h4>
              <ListSkeleton items={3} showAvatar={true} />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">폼 스켈레톤</h4>
              <FormSkeleton fields={4} />
            </div>
          </div>
        </ComponentCard>

        {/* 인터랙티브 데모 */}
        <ComponentCard title="인터랙티브 데모">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Button onClick={simulateLoading} disabled={isLoading}>
                {isLoading ? '로딩 중...' : '로딩 시뮬레이션'}
              </Button>
              <Button onClick={simulateOverlay} disabled={showOverlay}>
                {showOverlay ? '오버레이 중...' : '오버레이 시뮬레이션'}
              </Button>
            </div>

            <LoadingOverlay isLoading={isLoading} text="데이터를 불러오는 중...">
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">일반 콘텐츠</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  이 영역은 로딩 오버레이가 적용될 때 뒤에 숨겨집니다.
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-700 rounded border">
                    <h4 className="font-medium">카드 1</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">설명 텍스트</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-700 rounded border">
                    <h4 className="font-medium">카드 2</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">설명 텍스트</p>
                  </div>
                </div>
              </div>
            </LoadingOverlay>
          </div>
        </ComponentCard>

        {/* 페이지 스켈레톤 */}
        <ComponentCard title="페이지 스켈레톤">
          <div className="h-96 overflow-hidden rounded-lg border">
            <PageSkeleton showHeader={true} showSidebar={true} />
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
