from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import hashlib
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserUpdate, User as UserSchema, UserLogin
from datetime import datetime

router = APIRouter()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return hashlib.sha256(plain_password.encode('utf-8')).hexdigest() == hashed_password

def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """새 사용자 생성"""
    # 이메일 중복 확인
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="이미 존재하는 이메일입니다"
        )
    
    # 비밀번호 해싱
    hashed_password = get_password_hash(user.password)
    
    # 사용자 생성
    db_user = User(
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=user.is_active,
        is_admin=user.is_admin
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.get("/", response_model=dict)
def get_users(page: int = 1, per_page: int = 10, search: str = None, db: Session = Depends(get_db)):
    """사용자 목록 조회 (페이징 포함)"""
    query = db.query(User)
    
    # 검색 기능
    if search:
        query = query.filter(
            (User.first_name.contains(search)) |
            (User.last_name.contains(search)) |
            (User.email.contains(search))
        )
    
    # 전체 개수
    total = query.count()
    
    # 페이징 계산
    skip = (page - 1) * per_page
    total_pages = (total + per_page - 1) // per_page
    
    # 사용자 조회
    users = query.offset(skip).limit(per_page).all()
    
    return {
        "users": [UserSchema.model_validate(user) for user in users],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/{user_id}", response_model=UserSchema)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """특정 사용자 조회"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="사용자를 찾을 수 없습니다"
        )
    return user

@router.put("/{user_id}", response_model=UserSchema)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    """사용자 정보 수정"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="사용자를 찾을 수 없습니다"
        )
    
    # 이메일 중복 확인 (다른 사용자와 중복되지 않는지)
    if user_update.email and user_update.email != user.email:
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="이미 존재하는 이메일입니다"
            )
    
    # 업데이트할 필드들
    update_data = user_update.dict(exclude_unset=True)
    
    # 비밀번호가 제공된 경우 해싱
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = get_password_hash(update_data["password"])
        del update_data["password"]
    
    # password_confirm 필드 제거
    if "password_confirm" in update_data:
        del update_data["password_confirm"]
    
    # 사용자 정보 업데이트
    for field, value in update_data.items():
        setattr(user, field, value)
    
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """사용자 삭제"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="사용자를 찾을 수 없습니다"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "사용자가 성공적으로 삭제되었습니다"}

@router.post("/login")
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """사용자 로그인"""
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="이메일 또는 비밀번호가 올바르지 않습니다"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="비활성화된 계정입니다"
        )
    
    return {
        "message": "로그인 성공",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_admin": user.is_admin
        }
    }
