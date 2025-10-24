from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, ARRAY, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    posts = relationship("Post", back_populates="category")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(ARRAY(String), default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    category = relationship("Category", back_populates="posts")
    user = relationship("User", back_populates="posts")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    posts = relationship("Post", back_populates="user")
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    knowledgebases = relationship("Knowledgebase", back_populates="user")
    documents = relationship("Document", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    bio = Column(Text)
    phone = Column(String(20))
    address = Column(String(255))
    city = Column(String(100))
    country = Column(String(100))
    website = Column(String(255))
    linkedin = Column(String(255))
    twitter = Column(String(255))
    github = Column(String(255))
    avatar_url = Column(String(500))
    birth_date = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    user = relationship("User", back_populates="profile")

class Knowledgebase(Base):
    __tablename__ = "knowledgebases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(Text)

    # Model settings
    embedding_model = Column(String(128), default="BAAI/bge-large-en-v1.5")
    parser_type = Column(String(32), default="naive")
    chunk_size = Column(Integer, default=512)

    # Search settings
    similarity_threshold = Column(Float, default=0.2)

    # Statistics
    doc_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    token_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="knowledgebases")
    documents = relationship("Document", back_populates="knowledgebase", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    kb_id = Column(UUID(as_uuid=True), ForeignKey("knowledgebases.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # File information
    name = Column(String(255), nullable=False)
    file_type = Column(String(32), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)

    # Processing statistics
    chunk_count = Column(Integer, default=0)
    token_count = Column(Integer, default=0)

    # Processing status
    status = Column(String(32), default="pending")  # pending, processing, completed, failed
    progress = Column(Float, default=0.0)  # 0.0 to 1.0
    error_message = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    knowledgebase = relationship("Knowledgebase", back_populates="documents")
    user = relationship("User", back_populates="documents")
