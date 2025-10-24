from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from app.database import get_db
from app.models import Post as PostModel, Category as CategoryModel
from app.schemas import PostCreate, PostUpdate, PostWithCategory, PostWithCategoryAndUser
from sqlalchemy.orm import joinedload
from pydantic import BaseModel

router = APIRouter()

class PaginatedPostsResponse(BaseModel):
    posts: List[PostWithCategoryAndUser]
    total: int
    page: int
    per_page: int
    total_pages: int

@router.get("/", response_model=PaginatedPostsResponse)
def get_posts(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Number of posts per page"),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get posts with pagination and optional filtering"""
    # Calculate offset
    offset = (page - 1) * per_page
    
    # Build base query
    query = db.query(PostModel).options(joinedload(PostModel.category), joinedload(PostModel.user))
    
    # Apply filters
    if category_id:
        query = query.filter(PostModel.category_id == category_id)
    
    if search:
        query = query.filter(
            PostModel.title.ilike(f"%{search}%") |
            PostModel.content.ilike(f"%{search}%")
        )
    
    # Get total count
    total = query.count()
    
    # Apply ordering (newest first) and pagination
    posts = query.order_by(desc(PostModel.created_at)).offset(offset).limit(per_page).all()
    
    # Calculate total pages
    total_pages = (total + per_page - 1) // per_page
    
    return PaginatedPostsResponse(
        posts=posts,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@router.get("/{post_id}", response_model=PostWithCategoryAndUser)
def get_post(post_id: int, db: Session = Depends(get_db)):
    """Get a specific post by ID"""
    post = db.query(PostModel).options(joinedload(PostModel.category), joinedload(PostModel.user)).filter(PostModel.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.post("/", response_model=PostWithCategoryAndUser)
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    """Create a new post"""
    # Check if category exists
    category = db.query(CategoryModel).filter(CategoryModel.id == post.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")
    
    db_post = PostModel(**post.dict())
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    
    # Return post with category and user
    return db.query(PostModel).options(joinedload(PostModel.category), joinedload(PostModel.user)).filter(PostModel.id == db_post.id).first()

@router.put("/{post_id}", response_model=PostWithCategoryAndUser)
def update_post(post_id: int, post: PostUpdate, db: Session = Depends(get_db)):
    """Update an existing post"""
    db_post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if category exists if category_id is being updated
    if post.category_id and post.category_id != db_post.category_id:
        category = db.query(CategoryModel).filter(CategoryModel.id == post.category_id).first()
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
    
    # Update only provided fields
    update_data = post.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_post, field, value)
    
    db.commit()
    db.refresh(db_post)
    
    # Return post with category and user
    return db.query(PostModel).options(joinedload(PostModel.category), joinedload(PostModel.user)).filter(PostModel.id == db_post.id).first()

@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    """Delete a post"""
    db_post = db.query(PostModel).filter(PostModel.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db.delete(db_post)
    db.commit()
    return {"message": "Post deleted successfully"}

@router.get("/search/", response_model=List[PostWithCategoryAndUser])
def search_posts(
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db)
):
    """Search posts by title, content, or tags"""
    posts = db.query(PostModel).options(joinedload(PostModel.category), joinedload(PostModel.user)).filter(
        PostModel.title.ilike(f"%{q}%") |
        PostModel.content.ilike(f"%{q}%") |
        PostModel.tags.any(q)
    ).all()
    return posts
