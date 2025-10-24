from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID, uuid4
import os

from app.database import get_db
from app.models import Document as DocumentModel, Knowledgebase
from app.schemas import Document as DocumentSchema, DocumentUpdate
from app.storage import (
    save_upload_file,
    delete_document_file,
    read_file,
    get_document_path
)

router = APIRouter()

# Supported file types
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".doc"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def get_current_user_id() -> int:
    """Temporary function to get current user. Replace with proper auth."""
    return 1

def validate_file(filename: str, file_size: int):
    """Validate uploaded file."""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
        )

@router.post("/{kb_id}/documents/upload", response_model=DocumentSchema, status_code=status.HTTP_201_CREATED)
async def upload_document(
    kb_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Upload a document to a knowledgebase."""
    # Verify knowledgebase exists and belongs to user
    kb = db.query(Knowledgebase).filter(
        Knowledgebase.id == kb_id,
        Knowledgebase.user_id == user_id
    ).first()

    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledgebase not found"
        )

    # Get file info
    filename = file.filename
    file_content = await file.read()
    file_size = len(file_content)

    # Validate file
    validate_file(filename, file_size)

    # Create document ID
    doc_id = uuid4()

    # Save file
    try:
        # Reset file pointer
        await file.seek(0)

        file_path = await save_upload_file(kb_id, doc_id, filename, file.file)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Get file extension
    file_type = os.path.splitext(filename)[1].lstrip('.')

    # Create document record
    document = DocumentModel(
        id=doc_id,
        kb_id=kb_id,
        user_id=user_id,
        name=filename,
        file_type=file_type,
        file_path=file_path,
        file_size=file_size,
        status="pending"
    )

    db.add(document)

    # Update knowledgebase doc count
    kb.doc_count += 1

    db.commit()
    db.refresh(document)

    return document

@router.get("/{kb_id}/documents", response_model=List[DocumentSchema])
def list_documents(
    kb_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get all documents in a knowledgebase."""
    # Verify knowledgebase access
    kb = db.query(Knowledgebase).filter(
        Knowledgebase.id == kb_id,
        Knowledgebase.user_id == user_id
    ).first()

    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledgebase not found"
        )

    documents = db.query(DocumentModel).filter(
        DocumentModel.kb_id == kb_id
    ).offset(skip).limit(limit).all()

    return documents

@router.get("/documents/{doc_id}", response_model=DocumentSchema)
def get_document(
    doc_id: UUID,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get a specific document."""
    document = db.query(DocumentModel).filter(
        DocumentModel.id == doc_id,
        DocumentModel.user_id == user_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return document

@router.put("/documents/{doc_id}", response_model=DocumentSchema)
def update_document(
    doc_id: UUID,
    doc_update: DocumentUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Update document metadata (used for processing status)."""
    document = db.query(DocumentModel).filter(
        DocumentModel.id == doc_id,
        DocumentModel.user_id == user_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Update fields
    update_data = doc_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(document, field, value)

    db.commit()
    db.refresh(document)

    return document

@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: UUID,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Delete a document."""
    document = db.query(DocumentModel).filter(
        DocumentModel.id == doc_id,
        DocumentModel.user_id == user_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    kb_id = document.kb_id

    # Delete file
    try:
        delete_document_file(kb_id, doc_id)
    except Exception as e:
        print(f"Error deleting file for document {doc_id}: {e}")

    # Update knowledgebase counts
    kb = db.query(Knowledgebase).filter(Knowledgebase.id == kb_id).first()
    if kb:
        kb.doc_count = max(0, kb.doc_count - 1)
        kb.chunk_count = max(0, kb.chunk_count - document.chunk_count)
        kb.token_count = max(0, kb.token_count - document.token_count)

    # Delete from database
    db.delete(document)
    db.commit()

    return None

@router.get("/documents/{doc_id}/download")
async def download_document(
    doc_id: UUID,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Download original document file."""
    document = db.query(DocumentModel).filter(
        DocumentModel.id == doc_id,
        DocumentModel.user_id == user_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Read file
    try:
        file_content = await read_file(document.file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file: {str(e)}"
        )

    # Return file
    return StreamingResponse(
        iter([file_content]),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={document.name}"}
    )
