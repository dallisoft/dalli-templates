# 로딩 UI 컴포넌트

이 디렉토리는 애플리케이션의 로딩 상태를 표시하는 다양한 UI 컴포넌트들을 포함합니다.

## 컴포넌트 목록

### LoadingSpinner
로딩 중임을 나타내는 스피너 컴포넌트입니다.

```tsx
import { LoadingSpinner } from '../ui/loading';

<LoadingSpinner 
  size="medium" 
  text="로딩 중..." 
  showText={true} 
/>
```

**Props:**
- `size`: 'small' | 'medium' | 'large' (기본값: 'medium')
- `text`: 표시할 텍스트 (기본값: '로딩 중...')
- `className`: 추가 CSS 클래스
- `showText`: 텍스트 표시 여부 (기본값: true)

### Skeleton
콘텐츠가 로딩 중일 때 표시할 스켈레톤 UI 컴포넌트입니다.

#### TableSkeleton
테이블 형태의 스켈레톤 UI

```tsx
import { TableSkeleton } from '../ui/loading';

<TableSkeleton rows={5} columns={4} />
```

#### CardSkeleton
카드 형태의 스켈레톤 UI

```tsx
import { CardSkeleton } from '../ui/loading';

<CardSkeleton 
  lines={3} 
  showAvatar={true} 
  className="mb-4" 
/>
```

#### ListSkeleton
리스트 형태의 스켈레톤 UI

```tsx
import { ListSkeleton } from '../ui/loading';

<ListSkeleton 
  items={5} 
  showAvatar={true} 
/>
```

#### FormSkeleton
폼 형태의 스켈레톤 UI

```tsx
import { FormSkeleton } from '../ui/loading';

<FormSkeleton fields={4} />
```

#### PageSkeleton
전체 페이지 형태의 스켈레톤 UI

```tsx
import { PageSkeleton } from '../ui/loading';

<PageSkeleton 
  showHeader={true} 
  showSidebar={true} 
/>
```

### LoadingOverlay
기존 콘텐츠 위에 로딩 오버레이를 표시하는 컴포넌트입니다.

```tsx
import { LoadingOverlay } from '../ui/loading';

<LoadingOverlay 
  isLoading={isLoading} 
  text="데이터를 불러오는 중..."
  size="medium"
>
  <div>기존 콘텐츠</div>
</LoadingOverlay>
```

**Props:**
- `isLoading`: 로딩 상태 (boolean)
- `text`: 표시할 텍스트
- `size`: 스피너 크기
- `className`: 추가 CSS 클래스
- `children`: 오버레이가 적용될 콘텐츠

## 사용 예시

### 페이지 로딩 상태
```tsx
function PostList() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  return (
    <div>
      {/* 실제 콘텐츠 */}
    </div>
  );
}
```

### 오버레이 로딩
```tsx
function DataCard() {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingOverlay isLoading={loading} text="데이터 저장 중...">
      <div className="p-6">
        <h3>데이터 카드</h3>
        <button onClick={() => setLoading(true)}>
          저장
        </button>
      </div>
    </LoadingOverlay>
  );
}
```

## 스타일링

모든 컴포넌트는 Tailwind CSS를 사용하여 스타일링되어 있으며, 다크 모드를 지원합니다.

- `animate-pulse`: 스켈레톤 애니메이션
- `animate-spin`: 스피너 애니메이션
- `bg-gray-200 dark:bg-gray-700`: 스켈레톤 배경색
- `border-gray-300 dark:border-gray-600`: 스피너 테두리 색상

## 접근성

- 스피너에는 `role="status"`와 `aria-label` 속성이 포함되어 있습니다
- 스크린 리더 사용자를 위한 `sr-only` 텍스트가 포함되어 있습니다
- 키보드 네비게이션을 지원합니다
