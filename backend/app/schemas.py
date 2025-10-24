from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional
from datetime import datetime
import re

# Category schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None

class Category(CategoryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Post schemas
class PostBase(BaseModel):
    title: str
    content: str
    tags: List[str] = []
    category_id: int
    user_id: int

class PostCreate(PostBase):
    pass

class PostUpdate(PostBase):
    title: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[int] = None
    user_id: Optional[int] = None

class Post(PostBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PostWithCategory(Post):
    category: Category

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool = True
    is_admin: bool = False

class UserCreate(UserBase):
    password: str
    password_confirm: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('비밀번호는 6자 이상이어야 합니다')
        
        # 특수문자, 대문자, 소문자, 숫자 조합 검증
        if not re.search(r'[A-Z]', v):
            raise ValueError('비밀번호는 대문자를 포함해야 합니다')
        if not re.search(r'[a-z]', v):
            raise ValueError('비밀번호는 소문자를 포함해야 합니다')
        if not re.search(r'[0-9]', v):
            raise ValueError('비밀번호는 숫자를 포함해야 합니다')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('비밀번호는 특수문자를 포함해야 합니다')
        
        return v
    
    @validator('password_confirm')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('비밀번호가 일치하지 않습니다')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    password: Optional[str] = None
    password_confirm: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if v is not None:
            if len(v) < 6:
                raise ValueError('비밀번호는 6자 이상이어야 합니다')
            
            # 특수문자, 대문자, 소문자, 숫자 조합 검증
            if not re.search(r'[A-Z]', v):
                raise ValueError('비밀번호는 대문자를 포함해야 합니다')
            if not re.search(r'[a-z]', v):
                raise ValueError('비밀번호는 소문자를 포함해야 합니다')
            if not re.search(r'[0-9]', v):
                raise ValueError('비밀번호는 숫자를 포함해야 합니다')
            if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
                raise ValueError('비밀번호는 특수문자를 포함해야 합니다')
        
        return v
    
    @validator('password_confirm')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and values['password'] is not None and v != values['password']:
            raise ValueError('비밀번호가 일치하지 않습니다')
        return v

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# UserProfile schemas
class UserProfileBase(BaseModel):
    bio: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    github: Optional[str] = None
    avatar_url: Optional[str] = None
    birth_date: Optional[datetime] = None

class UserProfileCreate(UserProfileBase):
    user_id: int

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfile(UserProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserWithProfile(User):
    profile: Optional[UserProfile] = None

class PostWithUser(Post):
    user: User

class PostWithCategoryAndUser(Post):
    category: Category
    user: User
