from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models import Knowledgebase, User
from app.schemas import (
    KnowledgebaseCreate,
    KnowledgebaseUpdate,
    Knowledgebase as KnowledgebaseSchema
)
from app.storage import delete_kb_files

router = APIRouter()

# For now, we'll use a simple user_id. In production, use proper authentication
def get_current_user_id() -> int:
    """Temporary function to get current user. Replace with proper auth."""
    return 1

@router.post("/", response_model=KnowledgebaseSchema, status_code=status.HTTP_201_CREATED)
def create_knowledgebase(
    kb: KnowledgebaseCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Create a new knowledgebase."""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Create knowledgebase
    db_kb = Knowledgebase(
        **kb.model_dump(),
        user_id=user_id
    )
    db.add(db_kb)
    db.commit()
    db.refresh(db_kb)

    return db_kb

@router.get("/", response_model=List[KnowledgebaseSchema])
def list_knowledgebases(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get all knowledgebases for the current user."""
    kbs = db.query(Knowledgebase).filter(
        Knowledgebase.user_id == user_id
    ).offset(skip).limit(limit).all()

    return kbs

@router.get("/{kb_id}", response_model=KnowledgebaseSchema)
def get_knowledgebase(
    kb_id: UUID,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get a specific knowledgebase."""
    kb = db.query(Knowledgebase).filter(
        Knowledgebase.id == kb_id,
        Knowledgebase.user_id == user_id
    ).first()

    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledgebase not found"
        )

    return kb

@router.put("/{kb_id}", response_model=KnowledgebaseSchema)
def update_knowledgebase(
    kb_id: UUID,
    kb_update: KnowledgebaseUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Update a knowledgebase."""
    kb = db.query(Knowledgebase).filter(
        Knowledgebase.id == kb_id,
        Knowledgebase.user_id == user_id
    ).first()

    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledgebase not found"
        )

    # Update only provided fields
    update_data = kb_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(kb, field, value)

    db.commit()
    db.refresh(kb)

    return kb

@router.delete("/{kb_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_knowledgebase(
    kb_id: UUID,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Delete a knowledgebase and all its documents."""
    kb = db.query(Knowledgebase).filter(
        Knowledgebase.id == kb_id,
        Knowledgebase.user_id == user_id
    ).first()

    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledgebase not found"
        )

    # Delete all files
    try:
        delete_kb_files(kb_id)
    except Exception as e:
        # Log error but continue with database deletion
        print(f"Error deleting files for KB {kb_id}: {e}")

    # Delete from database (cascade will delete documents)
    db.delete(kb)
    db.commit()

    return None
