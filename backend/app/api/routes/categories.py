from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Category as CategoryModel
from app.schemas import CategoryCreate, CategoryUpdate, Category

router = APIRouter()

@router.get("/", response_model=List[Category])
def get_categories(db: Session = Depends(get_db)):
    """Get all categories"""
    categories = db.query(CategoryModel).all()
    return categories

@router.get("/{category_id}", response_model=Category)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a specific category by ID"""
    category = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.post("/", response_model=Category)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category"""
    # Check if category name already exists
    existing_category = db.query(CategoryModel).filter(CategoryModel.name == category.name).first()
    if existing_category:
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    db_category = CategoryModel(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/{category_id}", response_model=Category)
def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    """Update an existing category"""
    db_category = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name already exists (if name is being updated)
    if category.name and category.name != db_category.name:
        existing_category = db.query(CategoryModel).filter(CategoryModel.name == category.name).first()
        if existing_category:
            raise HTTPException(status_code=400, detail="Category name already exists")
    
    # Update only provided fields
    update_data = category.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category"""
    db_category = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has posts
    if db_category.posts:
        raise HTTPException(status_code=400, detail="Cannot delete category with existing posts")
    
    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted successfully"}
