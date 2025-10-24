#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database initialization script
Creates tables and populates with initial data
"""

import os
import sys
import hashlib
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Category, Post, User, UserProfile
from datetime import datetime

# Database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://admin:password@localhost:5432/admin_test"
)

def init_database():
    """Initialize database with tables and sample data"""
    
    # Create engine and session
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    def hash_password(password: str) -> str:
        """Hash password with SHA-256"""
        return hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Create session
    db = SessionLocal()
    
    try:
        # Clear existing data
        print("Clearing existing data...")
        db.query(Post).delete()
        db.query(Category).delete()
        db.query(User).delete()
        db.commit()
        
        # Create categories
        print("Creating categories...")
        categories_data = [
            {"id": 1, "name": "기술", "description": "프로그래밍 및 기술 관련 포스트"},
            {"id": 2, "name": "비즈니스", "description": "비즈니스 및 스타트업 관련 포스트"},
            {"id": 3, "name": "디자인", "description": "UI/UX 디자인 관련 포스트"},
            {"id": 4, "name": "라이프스타일", "description": "생활 및 개인 개발 관련 포스트"},
            {"id": 5, "name": "여행", "description": "여행 및 관광 관련 포스트"},
            {"id": 6, "name": "요리", "description": "요리 및 레시피 관련 포스트"},
            {"id": 7, "name": "건강", "description": "운동 및 건강 관련 포스트"},
            {"id": 8, "name": "교육", "description": "학습 및 교육 관련 포스트"},
            {"id": 9, "name": "엔터테인먼트", "description": "영화, 음악, 게임 등 엔터테인먼트 관련 포스트"},
            {"id": 10, "name": "AI", "description": "인공지능 및 머신러닝 관련 포스트"}
        ]
        
        category_id_map = {}
        for cat_data in categories_data:
            # Remove id from data to let database auto-generate
            cat_data_without_id = {k: v for k, v in cat_data.items() if k != 'id'}
            category = Category(**cat_data_without_id)
            db.add(category)
            db.flush()  # Flush to get the generated ID
            category_id_map[cat_data['id']] = category.id
        
        db.commit()
        print(f"Created {len(categories_data)} categories")
        
        # Create users first
        print("Creating users...")
        users_data = [
            {
                "email": "admin@example.com",
                "password": "Admin123!",
                "first_name": "관리자",
                "last_name": "시스템",
                "is_active": True,
                "is_admin": True
            },
            {
                "email": "user1@example.com",
                "password": "User123!",
                "first_name": "김",
                "last_name": "철수",
                "is_active": True,
                "is_admin": False
            },
            {
                "email": "user2@example.com",
                "password": "User456!",
                "first_name": "이",
                "last_name": "영희",
                "is_active": True,
                "is_admin": False
            },
            {
                "email": "user3@example.com",
                "password": "User789!",
                "first_name": "박",
                "last_name": "민수",
                "is_active": False,
                "is_admin": False
            }
        ]
        
        for user_data in users_data:
            # Hash password
            hashed_password = hash_password(user_data["password"])
            user_data["password_hash"] = hashed_password
            del user_data["password"]
            
            user = User(**user_data)
            db.add(user)
        
        db.commit()
        print(f"Created {len(users_data)} users")
        
        # Create posts
        print("Creating posts...")
        import random
        posts_data = [
            {
                "id": 1,
                "category_id": 1,
                "user_id": random.randint(1, 4),  # Random user ID between 1-4
                "title": "React 18의 새로운 기능들",
                "content": "# React 18의 새로운 기능들\n\nReact 18이 출시되면서 많은 새로운 기능들이 추가되었습니다.\n\n## 주요 변경사항\n\n### 1. Concurrent Features\n- **Automatic Batching**: 자동으로 배칭 처리\n- **Suspense**: 더 나은 로딩 상태 관리\n- **Transitions**: 우선순위 기반 업데이트\n\n### 2. 새로운 Hooks\n- `useId()`: 고유 ID 생성\n- `useDeferredValue()`: 지연된 값 처리\n- `useTransition()`: 전환 상태 관리\n\n### 3. 성능 개선\n- 더 나은 메모리 사용량\n- 향상된 렌더링 성능\n\n## 결론\n\nReact 18은 더 나은 사용자 경험을 제공하는 많은 기능들을 포함하고 있습니다.",
                "tags": ["React", "JavaScript", "Frontend", "Web Development"],
                "created_at": datetime(2024, 1, 15, 10, 30, 0),
                "updated_at": datetime(2024, 1, 15, 10, 30, 0)
            },
            {
                "id": 2,
                "category_id": 2,
                "user_id": random.randint(1, 4),
                "title": "스타트업 성장 전략",
                "content": "# 스타트업 성장 전략\n\n스타트업이 성공적으로 성장하기 위한 핵심 전략들을 살펴보겠습니다.\n\n## 1. 제품-시장 적합성 (Product-Market Fit)\n\n가장 중요한 것은 올바른 제품을 올바른 시장에 제공하는 것입니다.\n\n## 2. 고객 중심 사고\n\n- 고객 피드백 수집\n- 지속적인 개선\n- 고객 만족도 향상\n\n## 3. 마케팅 전략\n\n### 디지털 마케팅\n- SEO 최적화\n- 소셜 미디어 마케팅\n- 콘텐츠 마케팅\n\n### 오프라인 마케팅\n- 네트워킹 이벤트\n- 파트너십 구축\n\n## 4. 팀 빌딩\n\n올바른 인재를 확보하고 팀 문화를 구축하는 것이 중요합니다.",
                "tags": ["스타트업", "비즈니스", "마케팅", "성장"],
                "created_at": datetime(2024, 1, 14, 14, 20, 0),
                "updated_at": datetime(2024, 1, 14, 14, 20, 0)
            },
            {
                "id": 3,
                "category_id": 3,
                "user_id": random.randint(1, 4),
                "title": "UI/UX 디자인 트렌드 2024",
                "content": "# UI/UX 디자인 트렌드 2024\n\n2024년을 주도할 UI/UX 디자인 트렌드를 살펴보겠습니다.\n\n## 1. 미니멀리즘의 진화\n\n- **Neumorphism**: 부드러운 그림자와 하이라이트\n- **Glassmorphism**: 투명한 유리 효과\n- **Brutalism**: 대담하고 직설적인 디자인\n\n## 2. 색상 트렌드\n\n### 다크 모드\n- 시스템 다크 모드 지원\n- 사용자 선호도 반영\n\n### 그라데이션\n- 복잡한 그라데이션 패턴\n- 브랜드 아이덴티티 강화\n\n## 3. 타이포그래피\n\n- **Variable Fonts**: 유연한 폰트\n- **Custom Typography**: 브랜드 고유 폰트\n- **Readable Fonts**: 가독성 중심\n\n## 4. 인터랙션 디자인\n\n- **Micro-interactions**: 세밀한 상호작용\n- **Gesture-based Navigation**: 제스처 기반 네비게이션\n- **Voice UI**: 음성 인터페이스\n\n## 5. 접근성 (Accessibility)\n\n- WCAG 2.1 준수\n- 스크린 리더 지원\n- 키보드 네비게이션\n\n## 결론\n\n사용자 중심의 디자인과 접근성을 고려한 디자인이 중요합니다.",
                "tags": ["UI", "UX", "디자인", "트렌드", "2024"],
                "created_at": datetime(2024, 1, 13, 9, 15, 0),
                "updated_at": datetime(2024, 1, 13, 9, 15, 0)
            },
            {
                "id": 4,
                "category_id": 4,
                "user_id": random.randint(1, 4),
                "title": "생산성 향상을 위한 아침 루틴",
                "content": "# 생산성 향상을 위한 아침 루틴\n\n성공한 사람들의 공통점은 효과적인 아침 루틴을 가지고 있다는 것입니다.\n\n## 1. 일찍 일어나기\n\n- 5-6시 사이에 기상\n- 충분한 수면 시간 확보\n- 일정한 기상 시간 유지\n\n## 2. 운동과 명상\n\n### 운동\n- 30분 이상의 유산소 운동\n- 스트레칭과 요가\n- 근력 운동\n\n### 명상\n- 10-15분 명상\n- 마음챙김 연습\n- 긍정적 마인드셋 구축\n\n## 3. 학습과 계획\n\n- 독서 시간 확보\n- 하루 계획 세우기\n- 목표 설정과 리뷰\n\n## 4. 건강한 아침 식사\n\n- 단백질 중심의 식사\n- 충분한 수분 섭취\n- 영양가 있는 음식\n\n## 결론\n\n꾸준한 아침 루틴이 하루의 생산성을 크게 좌우합니다.",
                "tags": ["생산성", "루틴", "라이프스타일", "자기계발"],
                "created_at": datetime(2024, 1, 12, 7, 0, 0),
                "updated_at": datetime(2024, 1, 12, 7, 0, 0)
            },
            {
                "id": 5,
                "category_id": 5,
                "user_id": random.randint(1, 4),
                "title": "제주도 3박 4일 완벽 여행 코스",
                "content": "# 제주도 3박 4일 완벽 여행 코스\n\n제주도의 아름다운 자연과 문화를 만끽할 수 있는 여행 코스를 소개합니다.\n\n## 1일차: 제주시 중심가\n\n### 오전\n- 제주공항 도착\n- 제주시내 호텔 체크인\n- 동문시장에서 간식\n\n### 오후\n- 제주도립미술관 관람\n- 용두암 해안 산책\n- 제주시청 앞 분수쇼\n\n### 저녁\n- 흑돼지 맛집에서 저녁\n- 제주시 야경 감상\n\n## 2일차: 서부 제주\n\n### 오전\n- 한라산 등반 (성판악 코스)\n- 한라산 정상에서 점심\n\n### 오후\n- 협재해수욕장\n- 한림공원 관람\n\n### 저녁\n- 서귀포시 이동\n- 서귀포 칼치구이\n\n## 3일차: 동부 제주\n\n### 오전\n- 성산일출봉 일출 관람\n- 성산포구에서 아침\n\n### 오후\n- 섭지코지 해안 산책\n- 만장굴 탐험\n\n### 저녁\n- 중문관광단지\n- 제주도 특산품 쇼핑\n\n## 4일차: 마지막 하루\n\n### 오전\n- 제주민속촌 관람\n- 제주도 기념품 구매\n\n### 오후\n- 제주공항으로 이동\n- 귀국\n\n## 여행 팁\n\n- 렌터카 이용 권장\n- 날씨 확인 후 옷차림\n- 현금과 카드 모두 준비",
                "tags": ["제주도", "여행", "관광", "휴가"],
                "created_at": datetime(2024, 1, 11, 15, 30, 0),
                "updated_at": datetime(2024, 1, 11, 15, 30, 0)
            },
            {
                "id": 6,
                "category_id": 6,
                "user_id": random.randint(1, 4),
                "title": "홈메이드 파스타 레시피",
                "content": "# 홈메이드 파스타 레시피\n\n집에서 쉽게 만들 수 있는 맛있는 파스타 레시피를 소개합니다.\n\n## 재료 (2인분)\n\n### 파스타 면\n- 스파게티 면 200g\n- 소금 1큰술\n- 올리브오일 1큰술\n\n### 토마토 소스\n- 토마토 4개 (또는 통조림 토마토 1캔)\n- 마늘 3쪽\n- 양파 1/2개\n- 올리브오일 3큰술\n- 소금, 후추 약간\n- 바질 잎 5-6장\n\n### 추가 재료\n- 파마산 치즈 50g\n- 모짜렐라 치즈 100g\n\n## 만드는 방법\n\n### 1단계: 토마토 소스 만들기\n1. 토마토를 끓는 물에 30초 담갔다가 꺼내어 껍질 벗기기\n2. 토마토를 잘게 다지기\n3. 팬에 올리브오일을 두르고 다진 마늘과 양파 볶기\n4. 토마토를 넣고 15분간 끓이기\n5. 소금, 후추로 간 맞추고 바질 잎 넣기\n\n### 2단계: 파스타 면 삶기\n1. 큰 냄비에 물을 끓이기\n2. 소금과 올리브오일 넣기\n3. 스파게티 면을 넣고 8-10분 삶기\n4. 면수를 1컵 정도 남겨두기\n\n### 3단계: 완성하기\n1. 팬에 토마토 소스와 삶은 면 넣기\n2. 면수 조금씩 넣어가며 볶기\n3. 파마산 치즈와 모짜렐라 치즈 넣기\n4. 바질 잎으로 장식하기\n\n## 팁\n\n- 면수는 소스의 농도를 조절하는 데 사용\n- 치즈는 불을 끄고 넣어야 끈적이지 않음\n- 신선한 바질이 없으면 건조 바질 사용 가능",
                "tags": ["파스타", "요리", "레시피", "이탈리안"],
                "created_at": datetime(2024, 1, 10, 18, 45, 0),
                "updated_at": datetime(2024, 1, 10, 18, 45, 0)
            },
            {
                "id": 7,
                "category_id": 7,
                "user_id": random.randint(1, 4),
                "title": "홈트레이닝으로 시작하는 헬스케어",
                "content": "# 홈트레이닝으로 시작하는 헬스케어\n\n집에서도 효과적으로 운동할 수 있는 홈트레이닝 방법을 소개합니다.\n\n## 홈트레이닝의 장점\n\n- 시간과 장소의 제약 없음\n- 비용 절약\n- 개인 맞춤형 운동 가능\n- 꾸준한 운동 습관 형성\n\n## 기본 운동 루틴\n\n### 1. 워밍업 (5분)\n- 목과 어깨 스트레칭\n- 팔 돌리기\n- 제자리 뛰기\n- 사이드 스텝\n\n### 2. 근력 운동 (20분)\n\n#### 상체 운동\n- 푸시업 3세트 x 10회\n- 플랭크 3세트 x 30초\n- 딥스 3세트 x 8회\n\n#### 하체 운동\n- 스쿼트 3세트 x 15회\n- 런지 3세트 x 10회 (양쪽)\n- 월 시트 3세트 x 30초\n\n### 3. 유산소 운동 (15분)\n- 버피 3세트 x 5회\n- 마운틴 클라이머 3세트 x 20초\n- 하이 니즈 3세트 x 30초\n\n### 4. 쿨다운 (5분)\n- 전신 스트레칭\n- 심호흡\n\n## 운동 도구\n\n### 필수 도구\n- 운동 매트\n- 물병\n- 운동복\n\n### 선택 도구\n- 덤벨\n- 저항 밴드\n- 요가 블록\n\n## 주의사항\n\n- 운동 전 충분한 워밍업\n- 올바른 자세 유지\n- 무리하지 않기\n- 충분한 수분 섭취\n- 운동 후 스트레칭\n\n## 꾸준한 운동을 위한 팁\n\n- 매일 같은 시간에 운동\n- 운동 일지 작성\n- 목표 설정\n- 운동 파트너와 함께\n- 작은 성취도 축하하기\n\n## 결론\n\n홈트레이닝은 건강한 생활의 시작입니다. 꾸준함이 가장 중요합니다.",
                "tags": ["홈트레이닝", "운동", "건강", "헬스케어"],
                "created_at": datetime(2024, 1, 9, 20, 0, 0),
                "updated_at": datetime(2024, 1, 9, 20, 0, 0)
            },
            {
                "id": 8,
                "category_id": 8,
                "user_id": random.randint(1, 4),
                "title": "온라인 학습의 효과적인 방법",
                "content": "# 온라인 학습의 효과적인 방법\n\n온라인 학습을 통해 최대한의 효과를 얻는 방법을 알아보겠습니다.\n\n## 온라인 학습의 장점\n\n- 시간과 장소의 자유로움\n- 다양한 학습 자료 접근\n- 개인 맞춤형 학습 속도\n- 비용 절약\n- 반복 학습 가능\n\n## 효과적인 온라인 학습 전략\n\n### 1. 학습 환경 조성\n\n#### 물리적 환경\n- 전용 학습 공간 마련\n- 적절한 조명과 온도\n- 방해 요소 제거\n- 편안한 의자와 책상\n\n#### 디지털 환경\n- 안정적인 인터넷 연결\n- 필요한 소프트웨어 설치\n- 백업 계획 수립\n\n### 2. 학습 계획 수립\n\n#### 목표 설정\n- 구체적이고 측정 가능한 목표\n- 단기, 중기, 장기 목표\n- 현실적인 목표 설정\n\n#### 시간 관리\n- 일정한 학습 시간 확보\n- 휴식 시간 포함\n- 우선순위 정하기\n\n### 3. 적극적인 학습 방법\n\n#### 노트 작성\n- 핵심 내용 정리\n- 질문과 답변 기록\n- 시각적 자료 활용\n\n#### 토론과 질문\n- 온라인 포럼 참여\n- 강사에게 질문하기\n- 동료와 토론\n\n### 4. 복습과 평가\n\n#### 정기적 복습\n- 학습 후 즉시 복습\n- 주간, 월간 복습\n- 실전 문제 풀이\n\n#### 자기 평가\n- 학습 진도 체크\n- 이해도 확인\n- 목표 달성도 측정\n\n## 추천 온라인 학습 플랫폼\n\n### 무료 플랫폼\n- Coursera (일부 무료)\n- edX\n- Khan Academy\n- YouTube Education\n\n### 유료 플랫폼\n- Udemy\n- LinkedIn Learning\n- MasterClass\n- Skillshare\n\n## 학습 동기 유지 방법\n\n- 학습 그룹 참여\n- 성취감 느끼기\n- 보상 시스템\n- 꾸준한 피드백\n\n## 결론\n\n온라인 학습은 올바른 방법과 꾸준한 노력이 필요합니다. 효과적인 전략을 통해 목표를 달성하세요.",
                "tags": ["온라인학습", "교육", "자기계발", "학습방법"],
                "created_at": datetime(2024, 1, 8, 14, 20, 0),
                "updated_at": datetime(2024, 1, 8, 14, 20, 0)
            },
            {
                "id": 9,
                "category_id": 9,
                "user_id": random.randint(1, 4),
                "title": "2024년 최고의 넷플릭스 드라마 추천",
                "content": "# 2024년 최고의 넷플릭스 드라마 추천\n\n2024년 넷플릭스에서 주목받은 최고의 드라마들을 소개합니다.\n\n## 1. 기생충: 더 그레이 (Parasite: The Grey)\n\n### 장르: 공포, 스릴러\n### 에피소드: 6부작\n\n기생충의 세계관을 확장한 새로운 스토리로, 기생충에 감염된 사람들과의 생존 투쟁을 그린 작품입니다.\n\n**추천 포인트:**\n- 독특한 세계관과 설정\n- 긴장감 넘치는 전개\n- 뛰어난 시각 효과\n\n## 2. 더 글로리 (The Glory)\n\n### 장르: 복수, 스릴러\n### 에피소드: 16부작\n\n학교 폭력 피해자가 복수극을 펼치는 이야기로, 사회적 이슈를 다룬 작품입니다.\n\n**추천 포인트:**\n- 강력한 메시지\n- 뛰어난 연기력\n- 치밀한 복수 계획\n\n## 3. 스위트홈 (Sweet Home)\n\n### 장르: 공포, 액션\n### 에피소드: 10부작\n\n괴물이 된 사람들과의 생존 게임을 그린 작품으로, 웹툰 원작의 매력을 잘 살렸습니다.\n\n**추천 포인트:**\n- 독창적인 괴물 설정\n- 액션과 공포의 조화\n- 인간의 본성 탐구\n\n## 4. 오징어 게임 (Squid Game)\n\n### 장르: 서바이벌, 스릴러\n### 에피소드: 9부작\n\n생존 게임을 통해 사회적 불평등을 비판한 작품으로, 전 세계적인 화제를 모았습니다.\n\n**추천 포인트:**\n- 독창적인 게임 설정\n- 사회적 메시지\n- 글로벌 인기\n\n## 5. 킹덤 (Kingdom)\n\n### 장르: 사극, 좀비\n### 에피소드: 12부작\n\n조선시대를 배경으로 한 좀비 아포칼립스 드라마로, 독특한 장르 믹스가 인상적입니다.\n\n**추천 포인트:**\n- 독창적인 장르 조합\n- 뛰어난 제작 품질\n- 역사적 배경\n\n## 6. 지옥 (Hellbound)\n\n### 장르: 공포, 판타지\n### 에피소드: 6부작\n\n죄인을 지옥으로 보내는 초자연적 현상을 다룬 작품으로, 종교와 사회를 비판합니다.\n\n**추천 포인트:**\n- 독특한 컨셉\n- 사회적 비판\n- 시각적 임팩트\n\n## 시청 팁\n\n- 자막과 더빙 옵션 확인\n- 시리즈별 에피소드 수 확인\n- 장르별 선호도 고려\n- 리뷰와 평점 참고\n\n## 결론\n\n넷플릭스는 다양한 장르의 고품질 드라마를 제공합니다. 개인의 취향에 맞는 작품을 선택하여 즐거운 시청 시간을 보내세요.",
                "tags": ["넷플릭스", "드라마", "엔터테인먼트", "추천"],
                "created_at": datetime(2024, 1, 7, 21, 15, 0),
                "updated_at": datetime(2024, 1, 7, 21, 15, 0)
            },
            {
                "id": 10,
                "category_id": 10,
                "user_id": random.randint(1, 4),
                "title": "ChatGPT와 함께하는 AI 시대",
                "content": "# ChatGPT와 함께하는 AI 시대\n\nChatGPT의 등장으로 시작된 AI 혁명이 우리 삶에 미치는 영향을 살펴보겠습니다.\n\n## ChatGPT란?\n\nChatGPT는 OpenAI에서 개발한 대화형 AI 모델로, 자연어로 대화하며 다양한 작업을 수행할 수 있습니다.\n\n### 주요 기능\n- 자연어 대화\n- 텍스트 생성 및 편집\n- 질문 답변\n- 창작 활동 지원\n- 프로그래밍 도움\n\n## AI가 변화시키는 분야들\n\n### 1. 교육 분야\n\n#### 개인 맞춤형 학습\n- 학습자 수준에 맞는 설명\n- 24시간 질문 답변\n- 학습 계획 수립 지원\n\n#### 교사 업무 지원\n- 수업 자료 생성\n- 평가 문제 제작\n- 피드백 작성\n\n### 2. 비즈니스 분야\n\n#### 콘텐츠 마케팅\n- 블로그 포스트 작성\n- 소셜 미디어 콘텐츠\n- 이메일 마케팅 텍스트\n\n#### 고객 서비스\n- 챗봇 서비스\n- 고객 문의 응답\n- FAQ 자동화\n\n### 3. 창작 분야\n\n#### 글쓰기\n- 아이디어 브레인스토밍\n- 초안 작성\n- 편집 및 교정\n\n#### 예술\n- 이미지 생성\n- 음악 작곡\n- 디자인 지원\n\n## AI 활용 팁\n\n### 효과적인 프롬프트 작성\n\n#### 구체적인 지시\n- 명확한 목표 설정\n- 상세한 요구사항\n- 예시 제공\n\n#### 단계별 접근\n- 복잡한 작업을 단계로 나누기\n- 중간 결과 확인\n- 피드백 반영\n\n### 윤리적 사용\n\n#### 주의사항\n- 저작권 존중\n- 사실 확인\n- 개인정보 보호\n\n#### 책임감 있는 사용\n- AI의 한계 인식\n- 인간의 판단력 유지\n- 지속적인 학습\n\n## AI 시대의 준비\n\n### 필수 스킬\n- AI 도구 활용 능력\n- 프롬프트 엔지니어링\n- 비판적 사고\n- 창의적 문제 해결\n\n### 마인드셋 변화\n- AI와의 협업\n- 지속적인 학습\n- 적응력\n- 윤리적 의식\n\n## 미래 전망\n\n### 긍정적 측면\n- 업무 효율성 향상\n- 창작 활동 지원\n- 교육 접근성 개선\n- 의료 진단 정확도 향상\n\n### 주의할 점\n- 일자리 변화\n- 정보의 신뢰성\n- 개인정보 보호\n- 사회적 불평등\n\n## 결론\n\nAI는 도구일 뿐이며, 인간의 창의성과 판단력이 더욱 중요해집니다. AI를 올바르게 활용하여 더 나은 미래를 만들어가야 합니다.",
                "tags": ["ChatGPT", "AI", "인공지능", "기술"],
                "created_at": datetime(2024, 1, 6, 16, 30, 0),
                "updated_at": datetime(2024, 1, 6, 16, 30, 0)
            },
            {
                "id": 11,
                "category_id": 1,
                "user_id": random.randint(1, 4),
                "title": "Python으로 시작하는 데이터 분석",
                "content": "# Python으로 시작하는 데이터 분석\n\nPython을 활용한 데이터 분석의 기초부터 실전까지 알아보겠습니다.\n\n## Python 데이터 분석의 장점\n\n- 풍부한 라이브러리 생태계\n- 직관적인 문법\n- 강력한 시각화 도구\n- 커뮤니티 지원\n- 무료 오픈소스\n\n## 필수 라이브러리\n\n### 1. NumPy\n- 수치 계산의 기초\n- 배열 연산\n- 수학적 함수\n\n### 2. Pandas\n- 데이터 조작 및 분석\n- CSV, Excel 파일 처리\n- 데이터 정제\n\n### 3. Matplotlib\n- 기본 시각화\n- 그래프 생성\n- 커스터마이징\n\n### 4. Seaborn\n- 통계적 시각화\n- 아름다운 그래프\n- 간편한 사용법\n\n## 데이터 분석 프로세스\n\n### 1. 데이터 수집\n```python\nimport pandas as pd\n\n# CSV 파일 읽기\ndf = pd.read_csv('data.csv')\n\n# Excel 파일 읽기\ndf = pd.read_excel('data.xlsx')\n```\n\n### 2. 데이터 탐색\n```python\n# 기본 정보 확인\ndf.info()\ndf.describe()\ndf.head()\n\n# 결측값 확인\ndf.isnull().sum()\n\n# 데이터 타입 확인\ndf.dtypes\n```\n\n### 3. 데이터 정제\n```python\n# 결측값 처리\ndf.dropna()  # 결측값 제거\ndf.fillna(0)  # 0으로 채우기\ndf.fillna(df.mean())  # 평균으로 채우기\n\n# 중복값 제거\ndf.drop_duplicates()\n\n# 이상값 처리\nQ1 = df.quantile(0.25)\nQ3 = df.quantile(0.75)\nIQR = Q3 - Q1\ndf = df[~((df < (Q1 - 1.5 * IQR)) | (df > (Q3 + 1.5 * IQR))).any(axis=1)]\n```\n\n### 4. 데이터 분석\n```python\n# 기술통계\ndf.describe()\n\n# 상관관계 분석\ndf.corr()\n\n# 그룹별 분석\ndf.groupby('category').mean()\n\n# 피벗 테이블\ndf.pivot_table(values='sales', index='month', columns='region')\n```\n\n### 5. 데이터 시각화\n```python\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\n# 히스토그램\nplt.hist(df['age'], bins=20)\nplt.title('Age Distribution')\nplt.show()\n\n# 산점도\nplt.scatter(df['x'], df['y'])\nplt.xlabel('X')\nplt.ylabel('Y')\nplt.show()\n\n# 상관관계 히트맵\nsns.heatmap(df.corr(), annot=True)\nplt.show()\n\n# 박스플롯\nsns.boxplot(data=df, x='category', y='value')\nplt.show()\n```\n\n## 실전 프로젝트 예시\n\n### 1. 판매 데이터 분석\n```python\n# 데이터 로드\ndf = pd.read_csv('sales_data.csv')\n\n# 월별 판매량 분석\nmonthly_sales = df.groupby('month')['sales'].sum()\n\n# 시각화\nplt.plot(monthly_sales.index, monthly_sales.values)\nplt.title('Monthly Sales Trend')\nplt.xlabel('Month')\nplt.ylabel('Sales')\nplt.show()\n```\n\n### 2. 고객 세분화\n```python\nfrom sklearn.cluster import KMeans\n\n# 특성 선택\nfeatures = ['age', 'income', 'spending']\nX = df[features]\n\n# K-means 클러스터링\nkmeans = KMeans(n_clusters=3)\ndf['cluster'] = kmeans.fit_predict(X)\n\n# 클러스터별 특성 분석\ndf.groupby('cluster')[features].mean()\n```\n\n## 고급 기법\n\n### 1. 시계열 분석\n```python\nfrom statsmodels.tsa.seasonal import seasonal_decompose\n\n# 시계열 분해\ndecomposition = seasonal_decompose(df['value'], model='additive')\ndecomposition.plot()\nplt.show()\n```\n\n### 2. 머신러닝\n```python\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LinearRegression\n\n# 특성과 타겟 분리\nX = df[['feature1', 'feature2']]\ny = df['target']\n\n# 훈련/테스트 분할\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\n\n# 모델 훈련\nmodel = LinearRegression()\nmodel.fit(X_train, y_train)\n\n# 예측\npredictions = model.predict(X_test)\n```\n\n## 학습 자료\n\n### 온라인 강의\n- Coursera: Python for Data Science\n- edX: Introduction to Data Science\n- Udemy: Python for Data Analysis\n\n### 도서\n- '파이썬으로 데이터 주무르기'\n- '파이썬 데이터 분석 실무'\n- 'Hands-On Machine Learning'\n\n### 실습 데이터\n- Kaggle Datasets\n- UCI Machine Learning Repository\n- 공공데이터포털\n\n## 결론\n\nPython은 데이터 분석의 강력한 도구입니다. 꾸준한 실습을 통해 데이터에서 인사이트를 발견하는 능력을 기르세요.",
                "tags": ["Python", "데이터분석", "프로그래밍", "데이터사이언스"],
                "created_at": datetime(2024, 1, 5, 11, 45, 0),
                "updated_at": datetime(2024, 1, 5, 11, 45, 0)
            },
            {
                "id": 12,
                "category_id": 2,
                "user_id": random.randint(1, 4),
                "title": "디지털 마케팅 전략 수립하기",
                "content": "# 디지털 마케팅 전략 수립하기\n\n효과적인 디지털 마케팅 전략을 수립하는 방법을 단계별로 알아보겠습니다.\n\n## 디지털 마케팅이란?\n\n디지털 마케팅은 인터넷과 디지털 기술을 활용하여 고객과 소통하고 제품/서비스를 홍보하는 마케팅 활동입니다.\n\n### 주요 특징\n- 정확한 측정 가능\n- 실시간 피드백\n- 개인화된 메시지\n- 비용 효율성\n- 글로벌 접근성\n\n## 전략 수립 단계\n\n### 1단계: 목표 설정\n\n#### 비즈니스 목표\n- 매출 증가\n- 브랜드 인지도 향상\n- 고객 획득\n- 고객 유지\n- 시장 점유율 확대\n\n#### 마케팅 목표\n- 웹사이트 트래픽 증가\n- 소셜 미디어 팔로워 증가\n- 이메일 구독자 증가\n- 리드 생성\n- 전환율 향상\n\n### 2단계: 타겟 고객 분석\n\n#### 페르소나 개발\n- 인구통계학적 특성\n- 심리적 특성\n- 행동 패턴\n- 니즈와 페인 포인트\n- 미디어 소비 패턴\n\n#### 고객 여정 매핑\n- 인지 단계 (Awareness)\n- 관심 단계 (Interest)\n- 고려 단계 (Consideration)\n- 구매 단계 (Purchase)\n- 충성도 단계 (Loyalty)\n\n### 3단계: 채널 선택\n\n#### 소유 채널 (Owned Media)\n- 웹사이트\n- 블로그\n- 이메일 뉴스레터\n- 모바일 앱\n\n#### 유료 채널 (Paid Media)\n- 검색 광고 (Google Ads)\n- 소셜 미디어 광고\n- 디스플레이 광고\n- 인플루언서 마케팅\n\n#### 획득 채널 (Earned Media)\n- 소셜 미디어 언급\n- PR 활동\n- 고객 리뷰\n- 바이럴 마케팅\n\n### 4단계: 콘텐츠 전략\n\n#### 콘텐츠 유형\n- 블로그 포스트\n- 인포그래픽\n- 비디오\n- 팟캐스트\n- 웨비나\n- 케이스 스터디\n\n#### 콘텐츠 캘린더\n- 주제 기획\n- 발행 일정\n- 담당자 배정\n- 리소스 계획\n\n### 5단계: 예산 배분\n\n#### 채널별 예산 배분\n- 검색 광고: 40%\n- 소셜 미디어: 30%\n- 콘텐츠 마케팅: 20%\n- 이메일 마케팅: 10%\n\n#### ROI 측정\n- 비용 대비 수익률\n- 고객 획득 비용 (CAC)\n- 고객 생애 가치 (LTV)\n- 전환율\n\n## 주요 디지털 마케팅 채널\n\n### 1. 검색 엔진 최적화 (SEO)\n\n#### 온페이지 SEO\n- 키워드 최적화\n- 메타 태그 작성\n- 내부 링크 구조\n- 페이지 속도 최적화\n\n#### 오프페이지 SEO\n- 백링크 구축\n- 소셜 시그널\n- 로컬 SEO\n- 브랜드 언급\n\n### 2. 소셜 미디어 마케팅\n\n#### 플랫폼별 전략\n- **Facebook**: 브랜드 인지도, 커뮤니티 구축\n- **Instagram**: 시각적 콘텐츠, 인플루언서 마케팅\n- **LinkedIn**: B2B 마케팅, 전문성 강조\n- **YouTube**: 비디오 마케팅, 교육 콘텐츠\n- **TikTok**: 젊은 세대, 바이럴 콘텐츠\n\n### 3. 이메일 마케팅\n\n#### 이메일 유형\n- 뉴스레터\n- 프로모션 이메일\n- 웰컴 시리즈\n- 재참여 캠페인\n\n#### 최적화 요소\n- 제목 최적화\n- 개인화\n- 모바일 최적화\n- A/B 테스트\n\n### 4. 콘텐츠 마케팅\n\n#### 콘텐츠 전략\n- 고객 니즈 중심\n- 검색 의도 분석\n- 경쟁사 분석\n- 트렌드 활용\n\n#### 콘텐츠 배포\n- 멀티 채널 활용\n- 재활용 및 재구성\n- 시너지 효과 창출\n\n## 성과 측정 및 최적화\n\n### 핵심 지표 (KPI)\n\n#### 웹사이트 지표\n- 방문자 수 (Visitors)\n- 페이지뷰 (Page Views)\n- 체류 시간 (Time on Site)\n- 이탈률 (Bounce Rate)\n- 전환율 (Conversion Rate)\n\n#### 소셜 미디어 지표\n- 팔로워 수\n- 참여율 (Engagement Rate)\n- 도달률 (Reach)\n- 클릭률 (CTR)\n- 공유 수\n\n#### 이메일 마케팅 지표\n- 오픈율 (Open Rate)\n- 클릭률 (Click Rate)\n- 구독 취소율 (Unsubscribe Rate)\n- 전환율\n\n### 분석 도구\n- Google Analytics\n- Google Search Console\n- Facebook Insights\n- 각 플랫폼별 분석 도구\n\n### 최적화 방법\n- A/B 테스트\n- 데이터 기반 의사결정\n- 지속적인 개선\n- 경쟁사 벤치마킹\n\n## 성공 사례\n\n### 스타트업 사례\n- 제품 출시 전 프리 런칭 캠페인\n- 인플루언서 마케팅 활용\n- 바이럴 마케팅 성공\n\n### 대기업 사례\n- 통합 마케팅 커뮤니케이션\n- 글로벌 캠페인\n- 브랜드 스토리텔링\n\n## 주의사항\n\n### 법적 고려사항\n- 개인정보보호법 준수\n- 광고 심의 규정\n- 저작권 보호\n\n### 윤리적 마케팅\n- 정직한 광고\n- 고객 신뢰 구축\n- 사회적 책임\n\n## 결론\n\n디지털 마케팅은 지속적인 학습과 실험을 통해 발전시켜야 합니다. 데이터를 기반으로 한 의사결정과 고객 중심의 접근이 성공의 열쇠입니다.",
                "tags": ["디지털마케팅", "마케팅", "비즈니스", "전략"],
                "created_at": datetime(2024, 1, 4, 9, 30, 0),
                "updated_at": datetime(2024, 1, 4, 9, 30, 0)
            }
        ]
        
        # Get user IDs for mapping
        users = db.query(User).all()
        user_id_map = {i+1: user.id for i, user in enumerate(users)}
        print(f"User ID mapping: {user_id_map}")
        
        for post_data in posts_data:
            # Remove id from data to let database auto-generate
            post_data_without_id = {k: v for k, v in post_data.items() if k != 'id'}
            # Map the category_id to the actual generated ID
            if 'category_id' in post_data_without_id:
                post_data_without_id['category_id'] = category_id_map[post_data['category_id']]
            # Map the user_id to the actual generated ID
            if 'user_id' in post_data_without_id:
                # Ensure user_id is within valid range
                user_id = post_data['user_id']
                if user_id in user_id_map:
                    post_data_without_id['user_id'] = user_id_map[user_id]
                else:
                    # Use first user if user_id is out of range
                    post_data_without_id['user_id'] = list(user_id_map.values())[0]
            post = Post(**post_data_without_id)
            db.add(post)
        
        db.commit()
        print(f"Created {len(posts_data)} posts")
        
        # Create user profiles
        print("Creating user profiles...")
        profiles_data = [
            {
                "user_id": 1,  # admin@example.com
                "bio": "시스템 관리자입니다. 웹 개발과 데이터베이스 관리에 전문성을 가지고 있습니다.",
                "phone": "+82-10-1234-5678",
                "address": "서울특별시 강남구 테헤란로 123",
                "city": "서울",
                "country": "대한민국",
                "website": "https://admin.example.com",
                "linkedin": "https://linkedin.com/in/admin",
                "twitter": "https://twitter.com/admin",
                "github": "https://github.com/admin",
                "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                "birth_date": datetime(1985, 3, 15)
            },
            {
                "user_id": 2,  # user1@example.com
                "bio": "프론트엔드 개발자로 React와 Vue.js를 주로 사용합니다. 사용자 경험에 관심이 많습니다.",
                "phone": "+82-10-2345-6789",
                "address": "서울특별시 마포구 홍대입구역 456",
                "city": "서울",
                "country": "대한민국",
                "website": "https://kimcheolsu.dev",
                "linkedin": "https://linkedin.com/in/kimcheolsu",
                "twitter": "https://twitter.com/kimcheolsu",
                "github": "https://github.com/kimcheolsu",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                "birth_date": datetime(1990, 7, 22)
            },
            {
                "user_id": 3,  # user2@example.com
                "bio": "백엔드 개발자로 Python과 Node.js를 사용합니다. API 설계와 데이터베이스 최적화에 전문성을 가지고 있습니다.",
                "phone": "+82-10-3456-7890",
                "address": "서울특별시 서초구 강남대로 789",
                "city": "서울",
                "country": "대한민국",
                "website": "https://leeyounghee.tech",
                "linkedin": "https://linkedin.com/in/leeyounghee",
                "twitter": "https://twitter.com/leeyounghee",
                "github": "https://github.com/leeyounghee",
                "avatar_url": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
                "birth_date": datetime(1988, 11, 8)
            },
            {
                "user_id": 4,  # user3@example.com
                "bio": "풀스택 개발자로 다양한 기술 스택을 다룹니다. 스타트업에서의 경험이 풍부합니다.",
                "phone": "+82-10-4567-8901",
                "address": "서울특별시 종로구 인사동 101",
                "city": "서울",
                "country": "대한민국",
                "website": "https://parkminsu.io",
                "linkedin": "https://linkedin.com/in/parkminsu",
                "twitter": "https://twitter.com/parkminsu",
                "github": "https://github.com/parkminsu",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
                "birth_date": datetime(1992, 5, 14)
            }
        ]
        
        for profile_data in profiles_data:
            profile = UserProfile(**profile_data)
            db.add(profile)
        
        db.commit()
        print(f"Created {len(profiles_data)} user profiles")
        
        print("Database initialization completed successfully!")
        
    except Exception as e:
        print(f"Error during database initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
