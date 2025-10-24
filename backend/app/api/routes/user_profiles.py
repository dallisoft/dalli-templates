from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import UserProfile as UserProfileModel, User
from app.schemas import UserProfile, UserProfileCreate, UserProfileUpdate, UserWithProfile
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[UserProfile])
def get_user_profiles(db: Session = Depends(get_db)):
    """모든 사용자 프로필 조회"""
    profiles = db.query(UserProfileModel).all()
    return profiles

@router.get("/{profile_id}", response_model=UserProfile)
def get_user_profile(profile_id: int, db: Session = Depends(get_db)):
    """ID로 사용자 프로필 조회"""
    profile = db.query(UserProfileModel).filter(UserProfileModel.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자 프로필을 찾을 수 없습니다.")
    return profile

@router.get("/user/{user_id}", response_model=UserProfile)
def get_user_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    """사용자 ID로 프로필 조회"""
    profile = db.query(UserProfileModel).filter(UserProfileModel.user_id == user_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자 프로필을 찾을 수 없습니다.")
    return profile

@router.post("/", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def create_user_profile(profile: UserProfileCreate, db: Session = Depends(get_db)):
    """새 사용자 프로필 생성"""
    # 사용자 존재 확인
    user = db.query(User).filter(User.id == profile.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="사용자를 찾을 수 없습니다."
        )
    
    # 이미 프로필이 있는지 확인
    existing_profile = db.query(UserProfileModel).filter(UserProfileModel.user_id == profile.user_id).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 프로필이 존재합니다."
        )
    
    db_profile = UserProfileModel(**profile.model_dump())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@router.put("/{profile_id}", response_model=UserProfile)
def update_user_profile(profile_id: int, profile: UserProfileUpdate, db: Session = Depends(get_db)):
    """사용자 프로필 업데이트"""
    db_profile = db.query(UserProfileModel).filter(UserProfileModel.id == profile_id).first()
    if db_profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자 프로필을 찾을 수 없습니다.")
    
    update_data = profile.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_profile, key, value)
    
    db_profile.updated_at = datetime.now()
    db.commit()
    db.refresh(db_profile)
    return db_profile

@router.put("/user/{user_id}", response_model=UserProfile)
def update_user_profile_by_user_id(user_id: int, profile: UserProfileUpdate, db: Session = Depends(get_db)):
    """사용자 ID로 프로필 업데이트"""
    db_profile = db.query(UserProfileModel).filter(UserProfileModel.user_id == user_id).first()
    if db_profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자 프로필을 찾을 수 없습니다.")
    
    update_data = profile.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_profile, key, value)
    
    db_profile.updated_at = datetime.now()
    db.commit()
    db.refresh(db_profile)
    return db_profile

@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_profile(profile_id: int, db: Session = Depends(get_db)):
    """사용자 프로필 삭제"""
    db_profile = db.query(UserProfileModel).filter(UserProfileModel.id == profile_id).first()
    if db_profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자 프로필을 찾을 수 없습니다.")
    db.delete(db_profile)
    db.commit()
    return {"message": "사용자 프로필이 성공적으로 삭제되었습니다."}

@router.get("/user/{user_id}/with-profile", response_model=UserWithProfile)
def get_user_with_profile(user_id: int, db: Session = Depends(get_db)):
    """사용자와 프로필 정보를 함께 조회"""
    from sqlalchemy.orm import joinedload
    
    user = db.query(User).options(joinedload(User.profile)).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")
    return user
