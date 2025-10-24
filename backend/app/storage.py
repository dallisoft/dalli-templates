import os
import shutil
from pathlib import Path
from typing import BinaryIO
from uuid import UUID
import aiofiles

# Base upload directory
UPLOAD_DIR = Path("uploads")

def get_upload_dir() -> Path:
    """Get the base upload directory and create if not exists."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR

def get_kb_dir(kb_id: UUID) -> Path:
    """Get the directory for a specific knowledgebase."""
    kb_dir = UPLOAD_DIR / str(kb_id)
    kb_dir.mkdir(parents=True, exist_ok=True)
    return kb_dir

def get_document_dir(kb_id: UUID, doc_id: UUID) -> Path:
    """Get the directory for a specific document."""
    doc_dir = get_kb_dir(kb_id) / str(doc_id)
    doc_dir.mkdir(parents=True, exist_ok=True)
    return doc_dir

def get_document_path(kb_id: UUID, doc_id: UUID, filename: str) -> Path:
    """Get the full path for a document file."""
    doc_dir = get_document_dir(kb_id, doc_id)
    return doc_dir / filename

async def save_upload_file(kb_id: UUID, doc_id: UUID, filename: str, file: BinaryIO) -> str:
    """
    Save an uploaded file to the storage.

    Args:
        kb_id: Knowledgebase ID
        doc_id: Document ID
        filename: Original filename
        file: File-like object to save

    Returns:
        str: Relative file path
    """
    file_path = get_document_path(kb_id, doc_id, filename)

    # Save file (file is a SpooledTemporaryFile, read synchronously)
    content = file.read()
    async with aiofiles.open(file_path, 'wb') as out_file:
        await out_file.write(content)

    # Return relative path
    return str(file_path.relative_to(UPLOAD_DIR))

def delete_document_file(kb_id: UUID, doc_id: UUID):
    """Delete all files for a document."""
    doc_dir = get_document_dir(kb_id, doc_id)
    if doc_dir.exists():
        shutil.rmtree(doc_dir)

def delete_kb_files(kb_id: UUID):
    """Delete all files for a knowledgebase."""
    kb_dir = get_kb_dir(kb_id)
    if kb_dir.exists():
        shutil.rmtree(kb_dir)

def get_file_size(file_path: str) -> int:
    """Get the size of a file in bytes."""
    full_path = UPLOAD_DIR / file_path
    if full_path.exists():
        return full_path.stat().st_size
    return 0

async def read_file(file_path: str) -> bytes:
    """Read a file from storage."""
    full_path = UPLOAD_DIR / file_path
    async with aiofiles.open(full_path, 'rb') as f:
        return await f.read()
