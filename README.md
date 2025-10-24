# Admin Test - Full Stack Application

FastAPI 백엔드와 React 프론트엔드, PostgreSQL 데이터베이스를 사용하는 풀스택 관리자 대시보드 애플리케이션입니다.

## 🏗️ 아키텍처

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python 3.11
- **Database**: PostgreSQL 15
- **Containerization**: Docker + Docker Compose

## 🚀 빠른 시작

### 1. 전체 시스템 실행

#### 기본 실행 (현재 아키텍처)
```bash
# 모든 서비스 빌드 및 실행
docker-compose up --build

# 백그라운드에서 실행
docker-compose up -d --build
```

#### 멀티 아키텍처 지원 (ARM64 + AMD64)
```bash
# 멀티 아키텍처 빌드 및 실행
./docker-compose-multi-arch.sh up

# 특정 아키텍처만 빌드
./docker-compose-multi-arch.sh up --platforms linux/amd64

# 멀티 아키텍처 이미지만 빌드
./build-multi-arch.sh

# 특정 플랫폼으로 빌드
./build-multi-arch.sh --platforms linux/arm64
```

### 2. 개별 서비스 실행

#### 백엔드만 실행
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

#### 프론트엔드만 실행
```bash
cd frontend
npm install
npm run dev
```

#### 데이터베이스만 실행
```bash
docker run --name postgres -e POSTGRES_DB=admin_test -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15-alpine
```

## 📁 프로젝트 구조

```
admin-test/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/      # API 라우터
│   │   ├── models.py        # SQLAlchemy 모델
│   │   ├── schemas.py       # Pydantic 스키마
│   │   └── database.py      # 데이터베이스 설정
│   ├── main.py             # FastAPI 앱 진입점
│   ├── init_db.py          # 데이터베이스 초기화
│   ├── requirements.txt    # Python 의존성
│   └── Dockerfile          # 백엔드 Docker 설정
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── services/       # API 서비스
│   │   └── types/          # TypeScript 타입
│   ├── package.json        # Node.js 의존성
│   └── Dockerfile          # 프론트엔드 Docker 설정
└── docker-compose.yaml     # 전체 시스템 설정
```

## 🔧 API 엔드포인트

### Posts API
- `GET /api/posts/` - 모든 포스트 조회
- `GET /api/posts/{id}` - 특정 포스트 조회
- `POST /api/posts/` - 새 포스트 생성
- `PUT /api/posts/{id}` - 포스트 수정
- `DELETE /api/posts/{id}` - 포스트 삭제
- `GET /api/posts/search/?q={query}` - 포스트 검색

### Categories API
- `GET /api/categories/` - 모든 카테고리 조회
- `GET /api/categories/{id}` - 특정 카테고리 조회
- `POST /api/categories/` - 새 카테고리 생성
- `PUT /api/categories/{id}` - 카테고리 수정
- `DELETE /api/categories/{id}` - 카테고리 삭제

## 🌐 접속 URL

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432

## 🗄️ 데이터베이스

### 테이블 구조

#### Categories 테이블
- `id` (Primary Key)
- `name` (카테고리 이름)
- `description` (카테고리 설명)
- `created_at` (생성일시)
- `updated_at` (수정일시)

#### Posts 테이블
- `id` (Primary Key)
- `category_id` (Foreign Key)
- `title` (포스트 제목)
- `content` (포스트 내용)
- `tags` (태그 배열)
- `created_at` (생성일시)
- `updated_at` (수정일시)

### 초기 데이터

시스템 시작 시 다음 데이터가 자동으로 생성됩니다:
- 10개의 카테고리 (기술, 비즈니스, 디자인 등)
- 3개의 샘플 포스트

## 🛠️ 개발 환경 설정

### 백엔드 개발
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 프론트엔드 개발
```bash
cd frontend
npm install
npm run dev
```

## 📝 환경 변수

### 백엔드
- `DATABASE_URL`: PostgreSQL 연결 URL (기본값: postgresql://admin:password@localhost:5432/admin_test)

### 프론트엔드
- `REACT_APP_API_URL`: 백엔드 API URL (기본값: http://localhost:8000)

## 🐳 Docker 명령어

```bash
# 전체 시스템 빌드
docker-compose build

# 전체 시스템 실행
docker-compose up

# 특정 서비스만 실행
docker-compose up postgres backend

# 로그 확인
docker-compose logs -f backend

# 컨테이너 중지
docker-compose down

# 볼륨까지 삭제 (데이터베이스 데이터 삭제)
docker-compose down -v
```

## 🏗️ 멀티 아키텍처 지원

이 프로젝트는 ARM64와 AMD64 아키텍처를 모두 지원합니다.

### 지원되는 아키텍처
- **linux/amd64**: Intel/AMD 64비트 프로세서
- **linux/arm64**: ARM 64비트 프로세서 (Apple Silicon, ARM 서버 등)

### 멀티 아키텍처 빌드 방법

#### 1. Docker Buildx 사용
```bash
# Docker buildx 활성화
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# 멀티 아키텍처 빌드
docker buildx build --platform linux/amd64,linux/arm64 -t dalli-template .
```

#### 2. 제공된 스크립트 사용
```bash
# 멀티 아키텍처 빌드
./build-multi-arch.sh

# 특정 플랫폼만 빌드
./build-multi-arch.sh --platforms linux/amd64

# 레지스트리에 푸시
./build-multi-arch.sh --push --registry your-registry.com
```

#### 3. Docker Compose 멀티 아키텍처
```bash
# 멀티 아키텍처로 서비스 실행
./docker-compose-multi-arch.sh up

# 특정 플랫폼으로 실행
./docker-compose-multi-arch.sh up --platforms linux/arm64

# 서비스 상태 확인
./docker-compose-multi-arch.sh ps

# 로그 확인
./docker-compose-multi-arch.sh logs --follow
```

### 아키텍처별 최적화

#### ARM64 (Apple Silicon, ARM 서버)
- Apple Silicon Mac에서 최적 성능
- ARM 기반 클라우드 서버 지원
- 전력 효율성 향상

#### AMD64 (Intel/AMD)
- 기존 x86_64 서버 호환성
- 널리 사용되는 클라우드 플랫폼 지원
- 기존 인프라와의 호환성

### 빌드 요구사항
- Docker 20.10+ (buildx 지원)
- 멀티 아키텍처 빌드를 위한 충분한 디스크 공간
- 네트워크 연결 (외부 이미지 다운로드용)

## 🔍 문제 해결

### 포트 충돌
- 3000, 8000, 5432 포트가 사용 중인 경우 다른 포트로 변경
- `docker-compose.yaml`에서 포트 매핑 수정

### 데이터베이스 연결 오류
- PostgreSQL 컨테이너가 완전히 시작될 때까지 대기
- 데이터베이스 자격 증명 확인

### API 호출 오류
- CORS 설정 확인
- 백엔드 서비스 상태 확인
- 네트워크 연결 확인

### 멀티 아키텍처 빌드 오류
- Docker buildx가 활성화되어 있는지 확인
- 충분한 디스크 공간이 있는지 확인
- 네트워크 연결 상태 확인
- 플랫폼별 의존성 문제 확인

## 📚 추가 정보

- FastAPI 공식 문서: https://fastapi.tiangolo.com/
- React 공식 문서: https://react.dev/
- PostgreSQL 공식 문서: https://www.postgresql.org/docs/
- Docker Compose 공식 문서: https://docs.docker.com/compose/
