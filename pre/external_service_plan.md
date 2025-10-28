# External Service Integration Architecture for dalli-rag

## Overview

This document outlines the comprehensive architecture for integrating external services (OCR, Chunking, and Embedding) into the dalli-rag system. The design follows a **plugin-based connector architecture** with user-level configuration, health monitoring, and fail-safe mechanisms.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Core Components](#core-components)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Docker Configuration](#docker-configuration)
8. [Service Configuration](#service-configuration)
9. [Implementation Guide](#implementation-guide)
10. [Security Considerations](#security-considerations)

---

## Architecture Overview

### Key Features

- **Plugin Architecture**: Easy to add new providers without modifying core code
- **User-Level Configuration**: Each user can configure their own service preferences
- **Connection Testing**: Test configurations before saving
- **Health Monitoring**: Built-in health checks for all services
- **Fallback Support**: Automatic fallback to local services if external APIs fail
- **Docker Integration**: External services deployable via Docker Compose
- **Secure Configuration**: API keys stored securely in database (encryption recommended)
- **Retry Logic**: Automatic retries with exponential backoff
- **Multi-Provider Support**: Multiple providers for each service type
- **Real-time Testing**: Test connections in UI before saving

### Supported Services

#### OCR Services
- **Tesseract** (Local) - Open-source OCR via Docker
- **Google Vision API** - Cloud-based OCR
- **Azure Computer Vision** - Microsoft cloud OCR
- **AWS Textract** - Amazon cloud OCR

#### Chunking Services
- **Internal** - Token-based chunking (default)
- **LangChain** - LangChain TextSplitter
- **LlamaIndex** - LlamaIndex chunking
- **Semantic** - Semantic-based chunking API

#### Embedding Services
- **OpenAI** - text-embedding-3-small/large
- **HuggingFace** - Local/remote HF models
- **Ollama** - Local embedding models
- **Azure OpenAI** - Azure-hosted OpenAI
- **Cohere** - Cohere embedding API

---

## Directory Structure

```
dalli-rag/
├── backend/
│   ├── app/
│   │   ├── connectors/                    # NEW: Service connector system
│   │   │   ├── __init__.py
│   │   │   ├── factory.py                 # ServiceConnectorFactory
│   │   │   ├── base.py                    # BaseConnector abstract class
│   │   │   ├── ocr_connector.py          # OCR service integration
│   │   │   ├── chunking_connector.py     # Chunking service integration
│   │   │   ├── embedding_connector.py    # Embedding service integration
│   │   │   ├── errors.py                 # Custom exceptions
│   │   │   ├── monitoring.py             # Performance monitoring
│   │   │   └── providers/                # Service providers
│   │   │       ├── __init__.py
│   │   │       ├── ocr/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── local_tesseract.py
│   │   │       │   ├── google_vision.py
│   │   │       │   ├── azure_cv.py
│   │   │       │   └── aws_textract.py
│   │   │       ├── chunking/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── internal.py       # Simple token-based chunking
│   │   │       │   ├── langchain_chunker.py
│   │   │       │   ├── llamaindex_chunker.py
│   │   │       │   └── semantic_chunker.py
│   │   │       └── embedding/
│   │   │           ├── __init__.py
│   │   │           ├── openai_embed.py
│   │   │           ├── huggingface_embed.py
│   │   │           ├── ollama_embed.py
│   │   │           ├── azure_embed.py
│   │   │           └── cohere_embed.py
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── service_configs.py    # NEW: Service configuration API
│   │   │   │   └── connectors.py         # NEW: Connector testing/health API
│   │   ├── models.py                      # Updated with ServiceConfig model
│   │   ├── schemas.py                     # Updated with service schemas
│   │   └── config.py                      # NEW: Service configuration loader
│   ├── config/                            # NEW: Configuration directory
│   │   └── service_conf.yaml             # Service configuration file
│   └── requirements.txt                   # Updated dependencies
├── frontend/
│   └── src/
│       ├── pages/
│       │   └── Settings/                  # NEW: Settings pages
│       │       ├── ServiceSettings.tsx    # Service configuration UI
│       │       └── ModelSettings.tsx      # Model/provider selection UI
│       ├── components/
│       │   └── settings/                  # NEW: Settings components
│       │       ├── ServiceConfigForm.tsx
│       │       ├── ProviderSelector.tsx
│       │       └── ConnectionTest.tsx
│       └── types/
│           └── service.ts                 # Service configuration types
├── docker-compose.yaml                    # Updated with external services
└── .env                                   # Service API keys and configs
```

---

## Core Components

### 1. Service Connector Factory

**File**: `backend/app/connectors/factory.py`

The factory pattern centralizes service connector creation and management.

```python
from typing import Dict, Type, Optional, Any
from abc import ABC
import yaml
import logging
from threading import Lock
from pathlib import Path
from .ocr_connector import OCRConnector
from .chunking_connector import ChunkingConnector
from .embedding_connector import EmbeddingConnector


class ServiceConnectorFactory:
    """
    Centralized factory for managing service connectors

    Features:
    - Singleton pattern for connector instances
    - Configuration-based initialization
    - Health check and reconnection
    - Thread-safe instance management
    """

    _instances: Dict[str, Any] = {}
    _lock = Lock()
    _config_cache: Optional[Dict] = None

    @classmethod
    def get_connector(cls, service_type: str, config: Optional[Dict] = None):
        """
        Get or create a service connector instance

        Args:
            service_type: 'ocr', 'chunking', or 'embedding'
            config: Optional config override (defaults to service_conf.yaml)

        Returns:
            Configured connector instance
        """
        cache_key = f"{service_type}_{hash(str(config))}"

        if cache_key not in cls._instances:
            with cls._lock:
                if cache_key not in cls._instances:
                    cls._instances[cache_key] = cls._create_connector(
                        service_type, config
                    )

        return cls._instances[cache_key]

    @classmethod
    def _create_connector(cls, service_type: str, config: Optional[Dict]):
        """Create new connector instance"""
        connector_map = {
            'ocr': OCRConnector,
            'chunking': ChunkingConnector,
            'embedding': EmbeddingConnector
        }

        connector_class = connector_map.get(service_type)
        if not connector_class:
            raise ValueError(f"Unknown service type: {service_type}")

        final_config = config or cls._load_config(service_type)
        return connector_class(final_config)

    @classmethod
    def _load_config(cls, service_type: str) -> Dict:
        """Load configuration from service_conf.yaml"""
        if cls._config_cache is None:
            config_path = Path(__file__).parent.parent.parent / 'config' / 'service_conf.yaml'

            if not config_path.exists():
                # Return default configuration
                return cls._get_default_config(service_type)

            with open(config_path, 'r') as f:
                cls._config_cache = yaml.safe_load(f)

        return cls._config_cache.get(f"{service_type}_service", {})

    @classmethod
    def _get_default_config(cls, service_type: str) -> Dict:
        """Get default configuration when file doesn't exist"""
        defaults = {
            'ocr': {
                'provider': 'tesseract',
                'tesseract': {'lang': 'eng+kor'},
                'timeout': 30,
                'max_retries': 3
            },
            'chunking': {
                'provider': 'internal',
                'internal': {
                    'chunk_size': 512,
                    'chunk_overlap': 50
                }
            },
            'embedding': {
                'provider': 'huggingface',
                'huggingface': {
                    'model_name': 'BAAI/bge-large-en-v1.5',
                    'device': 'cpu'
                }
            }
        }
        return defaults.get(service_type, {})

    @classmethod
    def reload_config(cls):
        """Reload configuration and reset instances"""
        with cls._lock:
            cls._config_cache = None
            cls._instances.clear()
```

### 2. Base Connector

**File**: `backend/app/connectors/base.py`

Abstract base class providing common functionality for all service connectors.

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import logging
import requests
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)


class BaseConnector(ABC):
    """
    Abstract base class for all service connectors

    Provides:
    - Retry logic with exponential backoff
    - Timeout management
    - Health checking
    - Error handling
    - Logging
    """

    def __init__(self, config: Dict):
        self.config = config
        self.provider_type = config.get('provider', 'default')
        self.timeout = config.get('timeout', 30)
        self.max_retries = config.get('max_retries', 3)
        self.logger = logging.getLogger(self.__class__.__name__)

        # Initialize provider
        self.provider = self._init_provider()

    @abstractmethod
    def _init_provider(self) -> Any:
        """Initialize the service provider (implemented by subclasses)"""
        pass

    @abstractmethod
    def process(self, *args, **kwargs) -> Any:
        """Main processing method (implemented by subclasses)"""
        pass

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((
            requests.exceptions.Timeout,
            requests.exceptions.ConnectionError
        ))
    )
    def _call_api(self, endpoint: str, data: Dict, headers: Optional[Dict] = None) -> Dict:
        """
        Make API call with retry logic

        Args:
            endpoint: API endpoint URL
            data: Request payload
            headers: Optional HTTP headers

        Returns:
            Response JSON data
        """
        try:
            response = requests.post(
                endpoint,
                json=data,
                headers=headers or {},
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            self.logger.error(f"API call failed: {str(e)}")
            raise

    def health_check(self) -> bool:
        """
        Check if service is healthy

        Returns:
            True if healthy, False otherwise
        """
        try:
            if hasattr(self.provider, 'health_check'):
                return self.provider.health_check()
            return True
        except Exception as e:
            self.logger.warning(f"Health check failed: {str(e)}")
            return False

    def get_provider_info(self) -> Dict:
        """Get information about current provider"""
        return {
            'type': self.provider_type,
            'config': {
                k: v for k, v in self.config.get(self.provider_type, {}).items()
                if k not in ['api_key', 'secret_key', 'password']  # Hide sensitive data
            },
            'timeout': self.timeout,
            'max_retries': self.max_retries
        }
```

### 3. OCR Connector

**File**: `backend/app/connectors/ocr_connector.py`

```python
from typing import Dict, Any
from .base import BaseConnector
from .providers.ocr import (
    LocalTesseractProvider,
    GoogleVisionProvider,
    AzureCVProvider,
    AWSTextractProvider
)


class OCRConnector(BaseConnector):
    """OCR service connector"""

    def _init_provider(self) -> Any:
        """Initialize OCR provider based on configuration"""
        provider_map = {
            'tesseract': LocalTesseractProvider,
            'google': GoogleVisionProvider,
            'azure': AzureCVProvider,
            'aws': AWSTextractProvider
        }

        provider_class = provider_map.get(self.provider_type)
        if not provider_class:
            raise ValueError(f"Unknown OCR provider: {self.provider_type}")

        provider_config = self.config.get(self.provider_type, {})
        return provider_class(provider_config)

    def process(self, image_data: bytes, **kwargs) -> str:
        """
        Extract text from image

        Args:
            image_data: Image bytes
            **kwargs: Additional provider-specific parameters

        Returns:
            Extracted text
        """
        return self.provider.extract_text(image_data, **kwargs)
```

### 4. Chunking Connector

**File**: `backend/app/connectors/chunking_connector.py`

```python
from typing import List, Dict, Any
from .base import BaseConnector
from .providers.chunking import (
    InternalChunker,
    LangChainChunker,
    LlamaIndexChunker,
    SemanticChunker
)


class ChunkingConnector(BaseConnector):
    """Text chunking service connector"""

    def _init_provider(self) -> Any:
        """Initialize chunking provider based on configuration"""
        provider_map = {
            'internal': InternalChunker,
            'langchain': LangChainChunker,
            'llamaindex': LlamaIndexChunker,
            'semantic': SemanticChunker
        }

        provider_class = provider_map.get(self.provider_type)
        if not provider_class:
            raise ValueError(f"Unknown chunking provider: {self.provider_type}")

        provider_config = self.config.get(self.provider_type, {})
        return provider_class(provider_config)

    def process(self, text: str, **kwargs) -> List[str]:
        """
        Split text into chunks

        Args:
            text: Input text
            **kwargs: Additional provider-specific parameters

        Returns:
            List of text chunks
        """
        return self.provider.chunk_text(text, **kwargs)
```

### 5. Embedding Connector

**File**: `backend/app/connectors/embedding_connector.py`

```python
from typing import List, Dict, Any
import numpy as np
from .base import BaseConnector
from .providers.embedding import (
    OpenAIEmbedding,
    HuggingFaceEmbedding,
    OllamaEmbedding,
    AzureEmbedding,
    CohereEmbedding
)


class EmbeddingConnector(BaseConnector):
    """Embedding service connector"""

    def _init_provider(self) -> Any:
        """Initialize embedding provider based on configuration"""
        provider_map = {
            'openai': OpenAIEmbedding,
            'huggingface': HuggingFaceEmbedding,
            'ollama': OllamaEmbedding,
            'azure': AzureEmbedding,
            'cohere': CohereEmbedding
        }

        provider_class = provider_map.get(self.provider_type)
        if not provider_class:
            raise ValueError(f"Unknown embedding provider: {self.provider_type}")

        provider_config = self.config.get(self.provider_type, {})
        return provider_class(provider_config)

    def process(self, texts: List[str], **kwargs) -> List[List[float]]:
        """
        Generate embeddings for texts

        Args:
            texts: List of input texts
            **kwargs: Additional provider-specific parameters

        Returns:
            List of embedding vectors
        """
        return self.provider.embed(texts, **kwargs)

    def get_dimension(self) -> int:
        """Get embedding dimension"""
        return self.provider.get_dimension()
```

---

## Database Schema

### ServiceConfig Model

**File**: `backend/app/models.py`

Add the following model to store user service configurations:

```python
class ServiceConfig(Base):
    """Store service configuration preferences per user"""
    __tablename__ = "service_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Service type: ocr, chunking, embedding
    service_type = Column(String(32), nullable=False)

    # Provider selection
    provider = Column(String(64), nullable=False)  # e.g., 'openai', 'google', 'tesseract'

    # Provider-specific configuration (JSON)
    config = Column(Text)  # Store as JSON string

    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Connection tested successfully

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_verified_at = Column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="service_configs")


# Update User model to add relationship
class User(Base):
    # ... existing fields ...
    service_configs = relationship("ServiceConfig", back_populates="user")
```

### Migration Script

```python
"""Add service_configs table

Revision ID: add_service_configs
"""
from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        'service_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('service_type', sa.String(32), nullable=False),
        sa.Column('provider', sa.String(64), nullable=False),
        sa.Column('config', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_service_configs_user_type', 'service_configs', ['user_id', 'service_type'])


def downgrade():
    op.drop_index('idx_service_configs_user_type')
    op.drop_table('service_configs')
```

---

## API Endpoints

### Service Configuration API

**File**: `backend/app/api/routes/service_configs.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import time

from app.database import get_db
from app.models import ServiceConfig as ServiceConfigModel, User
from app.schemas import (
    ServiceConfigCreate,
    ServiceConfigUpdate,
    ServiceConfig,
    ServiceConnectionTest,
    ServiceConnectionTestResult
)
from app.connectors.factory import ServiceConnectorFactory


router = APIRouter()


@router.get("/", response_model=List[ServiceConfig])
def get_user_service_configs(
    service_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Add your auth dependency
):
    """Get all service configurations for current user"""
    query = db.query(ServiceConfigModel).filter(
        ServiceConfigModel.user_id == current_user.id
    )

    if service_type:
        query = query.filter(ServiceConfigModel.service_type == service_type)

    configs = query.all()

    # Parse JSON config field
    for config in configs:
        config.config = json.loads(config.config) if config.config else {}

    return configs


@router.post("/", response_model=ServiceConfig)
def create_service_config(
    config_data: ServiceConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new service configuration"""

    # Check if config already exists for this service type
    existing = db.query(ServiceConfigModel).filter(
        ServiceConfigModel.user_id == current_user.id,
        ServiceConfigModel.service_type == config_data.service_type
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Configuration for {config_data.service_type} already exists"
        )

    # Create new config
    new_config = ServiceConfigModel(
        user_id=current_user.id,
        service_type=config_data.service_type,
        provider=config_data.provider,
        config=json.dumps(config_data.config),
        is_active=config_data.is_active
    )

    db.add(new_config)
    db.commit()
    db.refresh(new_config)

    new_config.config = json.loads(new_config.config)
    return new_config


@router.put("/{config_id}", response_model=ServiceConfig)
def update_service_config(
    config_id: int,
    config_data: ServiceConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a service configuration"""

    config = db.query(ServiceConfigModel).filter(
        ServiceConfigModel.id == config_id,
        ServiceConfigModel.user_id == current_user.id
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )

    # Update fields
    if config_data.provider is not None:
        config.provider = config_data.provider
    if config_data.config is not None:
        config.config = json.dumps(config_data.config)
    if config_data.is_active is not None:
        config.is_active = config_data.is_active

    db.commit()
    db.refresh(config)

    config.config = json.loads(config.config)
    return config


@router.delete("/{config_id}")
def delete_service_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a service configuration"""

    config = db.query(ServiceConfigModel).filter(
        ServiceConfigModel.id == config_id,
        ServiceConfigModel.user_id == current_user.id
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )

    db.delete(config)
    db.commit()

    return {"message": "Configuration deleted successfully"}


@router.post("/test", response_model=ServiceConnectionTestResult)
async def test_service_connection(
    test_data: ServiceConnectionTest,
    current_user: User = Depends(get_current_user)
):
    """Test connection to external service"""

    try:
        start_time = time.time()

        # Create temporary connector with provided config
        config = {
            'provider': test_data.provider,
            test_data.provider: test_data.config,
            'timeout': 10,
            'max_retries': 1
        }

        connector = ServiceConnectorFactory.get_connector(
            test_data.service_type,
            config
        )

        # Run health check
        is_healthy = connector.health_check()
        response_time = time.time() - start_time

        if is_healthy:
            provider_info = connector.get_provider_info()

            return ServiceConnectionTestResult(
                success=True,
                message=f"Successfully connected to {test_data.provider}",
                response_time=response_time,
                provider_info=provider_info
            )
        else:
            return ServiceConnectionTestResult(
                success=False,
                message=f"Failed to connect to {test_data.provider}",
                response_time=response_time
            )

    except Exception as e:
        return ServiceConnectionTestResult(
            success=False,
            message=f"Connection error: {str(e)}"
        )
```

### Pydantic Schemas

**File**: `backend/app/schemas.py`

Add the following schemas:

```python
from enum import Enum
from typing import Dict, Any

class ServiceType(str, Enum):
    OCR = "ocr"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"


class OCRProvider(str, Enum):
    TESSERACT = "tesseract"
    GOOGLE_VISION = "google"
    AZURE_CV = "azure"
    AWS_TEXTRACT = "aws"


class ChunkingProvider(str, Enum):
    INTERNAL = "internal"
    LANGCHAIN = "langchain"
    LLAMAINDEX = "llamaindex"
    SEMANTIC = "semantic"


class EmbeddingProvider(str, Enum):
    OPENAI = "openai"
    HUGGINGFACE = "huggingface"
    OLLAMA = "ollama"
    AZURE = "azure"
    COHERE = "cohere"


class ServiceConfigBase(BaseModel):
    service_type: ServiceType
    provider: str
    config: Dict[str, Any]
    is_active: bool = True


class ServiceConfigCreate(ServiceConfigBase):
    pass


class ServiceConfigUpdate(BaseModel):
    provider: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class ServiceConfig(ServiceConfigBase):
    id: int
    user_id: int
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ServiceConnectionTest(BaseModel):
    """Test service connection"""
    service_type: ServiceType
    provider: str
    config: Dict[str, Any]


class ServiceConnectionTestResult(BaseModel):
    """Connection test result"""
    success: bool
    message: str
    response_time: Optional[float] = None
    provider_info: Optional[Dict] = None
```

---

## Frontend Components

### Model Settings Page

**File**: `frontend/src/pages/Settings/ModelSettings.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Alert } from '../../components/ui/alert/Alert';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ServiceConfig {
  id: number;
  service_type: 'ocr' | 'chunking' | 'embedding';
  provider: string;
  config: Record<string, any>;
  is_active: boolean;
  is_verified: boolean;
}

interface Provider {
  value: string;
  label: string;
  configFields: ConfigField[];
}

interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'password' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

const PROVIDERS = {
  ocr: [
    {
      value: 'tesseract',
      label: 'Tesseract (Local)',
      configFields: [
        { name: 'lang', label: 'Languages', type: 'text', placeholder: 'eng+kor' }
      ]
    },
    {
      value: 'google',
      label: 'Google Vision API',
      configFields: [
        { name: 'api_key', label: 'API Key', type: 'password', required: true },
        { name: 'language_hints', label: 'Language Hints', type: 'text', placeholder: 'en,ko' }
      ]
    },
    {
      value: 'azure',
      label: 'Azure Computer Vision',
      configFields: [
        { name: 'endpoint', label: 'Endpoint URL', type: 'text', required: true },
        { name: 'api_key', label: 'API Key', type: 'password', required: true }
      ]
    }
  ],
  chunking: [
    {
      value: 'internal',
      label: 'Internal (Token-based)',
      configFields: [
        { name: 'chunk_size', label: 'Chunk Size', type: 'number', placeholder: '512' },
        { name: 'chunk_overlap', label: 'Chunk Overlap', type: 'number', placeholder: '50' }
      ]
    },
    {
      value: 'langchain',
      label: 'LangChain TextSplitter',
      configFields: [
        {
          name: 'splitter_type',
          label: 'Splitter Type',
          type: 'select',
          options: [
            { value: 'recursive', label: 'Recursive Character' },
            { value: 'token', label: 'Token Based' },
            { value: 'markdown', label: 'Markdown' }
          ]
        },
        { name: 'chunk_size', label: 'Chunk Size', type: 'number', placeholder: '512' },
        { name: 'chunk_overlap', label: 'Overlap', type: 'number', placeholder: '50' }
      ]
    },
    {
      value: 'semantic',
      label: 'Semantic Chunking API',
      configFields: [
        { name: 'api_endpoint', label: 'API Endpoint', type: 'text', required: true },
        { name: 'api_key', label: 'API Key', type: 'password', required: true },
        { name: 'similarity_threshold', label: 'Similarity Threshold', type: 'number', placeholder: '0.7' }
      ]
    }
  ],
  embedding: [
    {
      value: 'openai',
      label: 'OpenAI',
      configFields: [
        { name: 'api_key', label: 'API Key', type: 'password', required: true },
        { name: 'model_name', label: 'Model', type: 'select', options: [
          { value: 'text-embedding-3-small', label: 'text-embedding-3-small' },
          { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
          { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002' }
        ]}
      ]
    },
    {
      value: 'huggingface',
      label: 'HuggingFace',
      configFields: [
        { name: 'model_name', label: 'Model Name', type: 'text', placeholder: 'BAAI/bge-large-en-v1.5' },
        { name: 'api_key', label: 'API Key (optional)', type: 'password' },
        { name: 'base_url', label: 'API URL (optional)', type: 'text', placeholder: 'http://localhost:8080' }
      ]
    },
    {
      value: 'ollama',
      label: 'Ollama (Local)',
      configFields: [
        { name: 'base_url', label: 'Ollama URL', type: 'text', placeholder: 'http://localhost:11434' },
        { name: 'model_name', label: 'Model Name', type: 'text', placeholder: 'nomic-embed-text' }
      ]
    },
    {
      value: 'azure',
      label: 'Azure OpenAI',
      configFields: [
        { name: 'api_key', label: 'API Key', type: 'password', required: true },
        { name: 'base_url', label: 'Endpoint URL', type: 'text', required: true },
        { name: 'deployment_name', label: 'Deployment Name', type: 'text', required: true }
      ]
    }
  ]
};

export default function ModelSettings() {
  const [activeService, setActiveService] = useState<'ocr' | 'chunking' | 'embedding'>('embedding');
  const [configs, setConfigs] = useState<ServiceConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, [activeService]);

  const fetchConfigs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/service-configs?service_type=${activeService}`);
      const data = await response.json();
      setConfigs(data);

      if (data.length > 0) {
        setSelectedProvider(data[0].provider);
        setConfigValues(data[0].config);
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    }
  };

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    setConfigValues({});
    setTestResult(null);
  };

  const handleConfigChange = (field: string, value: any) => {
    setConfigValues(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${API_URL}/api/service-configs/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: activeService,
          provider: selectedProvider,
          config: configValues
        })
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${error}`
      });
    } finally {
      setTesting(false);
    }
  };

  const saveConfiguration = async () => {
    setLoading(true);

    try {
      const existingConfig = configs.find(c => c.service_type === activeService);

      const payload = {
        service_type: activeService,
        provider: selectedProvider,
        config: configValues,
        is_active: true
      };

      let response;
      if (existingConfig) {
        response = await fetch(`${API_URL}/api/service-configs/${existingConfig.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${API_URL}/api/service-configs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        fetchConfigs();
        alert('Configuration saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const currentProviders = PROVIDERS[activeService];
  const selectedProviderData = currentProviders.find(p => p.value === selectedProvider);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Model & Service Settings</h1>

      {/* Service Type Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          {(['ocr', 'chunking', 'embedding'] as const).map(service => (
            <button
              key={service}
              onClick={() => setActiveService(service)}
              className={`pb-2 px-4 ${
                activeService === service
                  ? 'border-b-2 border-blue-600 font-medium text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {service.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provider Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Select Provider</h3>
            <div className="space-y-2">
              {currentProviders.map(provider => (
                <button
                  key={provider.value}
                  onClick={() => handleProviderChange(provider.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border ${
                    selectedProvider === provider.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {provider.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Configuration</h3>

            {selectedProviderData && (
              <div className="space-y-4">
                {selectedProviderData.configFields.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium mb-2">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        value={configValues[field.name] || ''}
                        onChange={(e) => handleConfigChange(field.name, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={configValues[field.name] || ''}
                        onChange={(e) => handleConfigChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    )}
                  </div>
                ))}

                {/* Test Connection */}
                <div className="pt-4">
                  <button
                    onClick={testConnection}
                    disabled={testing}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700
                             disabled:opacity-50 disabled:cursor-not-allowed mr-3"
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>

                  <button
                    onClick={saveConfiguration}
                    disabled={loading || !testResult?.success}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>

                {/* Test Result */}
                {testResult && (
                  <Alert
                    type={testResult.success ? 'success' : 'error'}
                    message={testResult.message}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### TypeScript Types

**File**: `frontend/src/types/service.ts`

```typescript
export type ServiceType = 'ocr' | 'chunking' | 'embedding';

export interface ServiceConfig {
  id: number;
  user_id: number;
  service_type: ServiceType;
  provider: string;
  config: Record<string, any>;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  last_verified_at?: string;
}

export interface ServiceConfigCreate {
  service_type: ServiceType;
  provider: string;
  config: Record<string, any>;
  is_active?: boolean;
}

export interface ServiceConfigUpdate {
  provider?: string;
  config?: Record<string, any>;
  is_active?: boolean;
}

export interface ServiceConnectionTest {
  service_type: ServiceType;
  provider: string;
  config: Record<string, any>;
}

export interface ServiceConnectionTestResult {
  success: boolean;
  message: string;
  response_time?: number;
  provider_info?: Record<string, any>;
}
```

---

## Docker Configuration

### Updated Docker Compose

**File**: `docker-compose.yaml`

```yaml
services:
  # ========== Existing Services ==========
  postgres:
    image: postgres:15-alpine
    container_name: dalli-rag-postgres
    environment:
      POSTGRES_DB: dalli_rag
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - dalli-rag-network

  backend:
    build: ./backend
    container_name: dalli-rag-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://admin:password@postgres:5432/dalli_rag
    depends_on:
      - postgres
    networks:
      - dalli-rag-network

  frontend:
    build: ./frontend
    container_name: dalli-rag-frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - backend
    networks:
      - dalli-rag-network

  # ========== External Services ==========

  # Ollama for local embeddings
  ollama:
    image: ollama/ollama:latest
    container_name: dalli-rag-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    networks:
      - dalli-rag-network
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  # HuggingFace Text Embeddings Inference (TEI)
  tei-service:
    image: ghcr.io/huggingface/text-embeddings-inference:latest
    container_name: dalli-rag-tei
    ports:
      - "8080:80"
    environment:
      - MODEL_ID=BAAI/bge-large-en-v1.5
      - MAX_BATCH_SIZE=32
      - MAX_CONCURRENT_REQUESTS=512
    volumes:
      - tei_data:/data
    networks:
      - dalli-rag-network
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # Tesseract OCR Service (API wrapper)
  tesseract-api:
    image: hertzg/tesseract-server:latest
    container_name: dalli-rag-tesseract
    ports:
      - "8081:8080"
    environment:
      - TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata
    networks:
      - dalli-rag-network

volumes:
  postgres_data:
  ollama_data:
  tei_data:

networks:
  dalli-rag-network:
    driver: bridge
```

---

## Service Configuration

### Configuration File

**File**: `backend/config/service_conf.yaml`

```yaml
# ========== OCR Service Configuration ==========
ocr_service:
  provider: 'tesseract'  # tesseract | google | azure | aws

  tesseract:
    url: 'http://tesseract-api:8080'
    lang: 'eng+kor'

  google:
    api_key: ${GOOGLE_VISION_API_KEY}
    language_hints: ['en', 'ko']

  azure:
    endpoint: ${AZURE_CV_ENDPOINT}
    api_key: ${AZURE_CV_API_KEY}
    api_version: '2023-04-01'

  aws:
    region: 'us-east-1'
    aws_access_key_id: ${AWS_ACCESS_KEY_ID}
    aws_secret_access_key: ${AWS_SECRET_ACCESS_KEY}

  timeout: 30
  max_retries: 3
  fallback_to_local: true

# ========== Chunking Service Configuration ==========
chunking_service:
  provider: 'internal'  # internal | langchain | llamaindex | semantic

  internal:
    default_chunk_size: 512
    default_chunk_overlap: 50
    delimiter: '\n!?。；！？'

  langchain:
    splitter_type: 'recursive'
    chunk_size: 512
    chunk_overlap: 50

  llamaindex:
    chunk_size: 512
    chunk_overlap: 50

  semantic:
    api_endpoint: ${SEMANTIC_CHUNKING_API}
    api_key: ${SEMANTIC_CHUNKING_API_KEY}
    similarity_threshold: 0.7

  timeout: 30
  max_retries: 3

# ========== Embedding Service Configuration ==========
embedding_service:
  provider: 'huggingface'  # openai | huggingface | ollama | azure | cohere

  openai:
    api_key: ${OPENAI_API_KEY}
    model_name: 'text-embedding-3-small'
    base_url: 'https://api.openai.com/v1'

  huggingface:
    api_key: ${HUGGINGFACE_API_KEY}
    model_name: 'BAAI/bge-large-en-v1.5'
    base_url: 'http://tei-service:80'

  ollama:
    base_url: 'http://ollama:11434'
    model_name: 'nomic-embed-text'
    keep_alive: -1

  azure:
    api_key: ${AZURE_OPENAI_API_KEY}
    api_version: '2024-02-01'
    base_url: ${AZURE_OPENAI_ENDPOINT}
    deployment_name: 'text-embedding-ada-002'

  cohere:
    api_key: ${COHERE_API_KEY}
    model_name: 'embed-english-v3.0'

  batch_size: 16
  max_tokens: 8191
  timeout: 60
  max_retries: 3
```

### Environment Variables

**File**: `.env`

```bash
# Database
DATABASE_URL=postgresql://admin:password@postgres:5432/dalli_rag

# OCR Services
GOOGLE_VISION_API_KEY=your_google_api_key
AZURE_CV_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_CV_API_KEY=your_azure_cv_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret

# Chunking Services
SEMANTIC_CHUNKING_API=https://api.semantic-chunking.com
SEMANTIC_CHUNKING_API_KEY=your_semantic_key

# Embedding Services
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_API_KEY=your_hf_key
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
COHERE_API_KEY=your_cohere_key
```

---

## Implementation Guide

### Phase 1: Backend Infrastructure (Week 1-2)

1. **Create connector architecture**
   - Implement `BaseConnector` abstract class
   - Create `ServiceConnectorFactory`
   - Add custom exceptions in `errors.py`

2. **Implement service connectors**
   - OCR connector with Tesseract provider
   - Chunking connector with internal provider
   - Embedding connector with HuggingFace provider

3. **Database setup**
   - Create `ServiceConfig` model
   - Run database migrations
   - Add indexes for performance

4. **API development**
   - Implement service configuration endpoints
   - Add connection testing endpoint
   - Include proper error handling

### Phase 2: External Service Providers (Week 3-4)

1. **OCR providers**
   - Tesseract (local)
   - Google Vision API
   - Azure Computer Vision

2. **Chunking providers**
   - Internal (token-based)
   - LangChain integration
   - Semantic chunking

3. **Embedding providers**
   - HuggingFace TEI
   - Ollama
   - OpenAI
   - Azure OpenAI

### Phase 3: Frontend Development (Week 5-6)

1. **Settings UI**
   - Create `ModelSettings.tsx` page
   - Implement provider selector
   - Build configuration forms

2. **Testing interface**
   - Connection test button
   - Result display with status
   - Error handling

3. **Integration**
   - Connect to backend API
   - Add authentication
   - Implement error handling

### Phase 4: Docker & Deployment (Week 7)

1. **Docker services**
   - Add Ollama service
   - Add HuggingFace TEI
   - Add Tesseract API

2. **Configuration**
   - Create `service_conf.yaml`
   - Set up environment variables
   - Test service connections

### Phase 5: Testing & Documentation (Week 8)

1. **Testing**
   - Unit tests for connectors
   - Integration tests for API
   - E2E tests for UI

2. **Documentation**
   - API documentation
   - User guide
   - Deployment guide

---

## Security Considerations

### 1. API Key Storage

- **Database Encryption**: Encrypt API keys before storing in database
- **Environment Variables**: Use `.env` files for default configurations
- **Key Rotation**: Support periodic key rotation
- **Access Control**: Only allow users to access their own configurations

### 2. API Security

- **Authentication**: Require authentication for all configuration endpoints
- **Authorization**: Ensure users can only modify their own configs
- **Rate Limiting**: Implement rate limiting for connection tests
- **Input Validation**: Validate all configuration inputs

### 3. Network Security

- **HTTPS**: Use HTTPS for all external API calls
- **Timeout Management**: Set reasonable timeouts for all requests
- **Error Handling**: Don't expose sensitive information in error messages
- **Logging**: Log security events without logging sensitive data

### 4. Docker Security

- **Image Verification**: Use official images from trusted sources
- **Network Isolation**: Use Docker networks for service isolation
- **Resource Limits**: Set memory and CPU limits for containers
- **Health Checks**: Implement health checks for all services

---

## Performance Optimization

### 1. Connection Pooling

```python
# Implement connection pooling for external services
from sqlalchemy.pool import QueuePool

class PooledConnector(BaseConnector):
    _connection_pool = None

    @classmethod
    def get_connection(cls):
        if cls._connection_pool is None:
            cls._connection_pool = QueuePool(
                cls._create_connection,
                max_overflow=10,
                pool_size=5,
                timeout=30
            )
        return cls._connection_pool.connect()
```

### 2. Caching

```python
# Cache embedding results
from functools import lru_cache

class EmbeddingConnector(BaseConnector):
    @lru_cache(maxsize=1000)
    def embed_cached(self, text: str) -> List[float]:
        """Cache embedding results for frequently used texts"""
        return self.embed([text])[0]
```

### 3. Batch Processing

```python
# Batch multiple requests together
class EmbeddingConnector(BaseConnector):
    def embed_batch(self, texts: List[str], batch_size: int = 16) -> List[List[float]]:
        """Process embeddings in batches"""
        results = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_results = self.provider.embed(batch)
            results.extend(batch_results)
        return results
```

### 4. Monitoring

```python
# Add performance monitoring
import time
from prometheus_client import Histogram

request_duration = Histogram(
    'service_request_duration_seconds',
    'Service request duration',
    ['service_type', 'provider']
)

class BaseConnector(ABC):
    def process(self, *args, **kwargs):
        start_time = time.time()
        try:
            result = self._process_impl(*args, **kwargs)
            return result
        finally:
            duration = time.time() - start_time
            request_duration.labels(
                service_type=self.__class__.__name__,
                provider=self.provider_type
            ).observe(duration)
```

---

## Future Enhancements

### 1. Advanced Features

- **Service Health Dashboard**: Real-time monitoring of all services
- **Cost Tracking**: Track API usage and costs per user
- **Auto-Scaling**: Automatically scale local services based on load
- **Service Fallback**: Automatic fallback when primary service fails
- **Multi-Region Support**: Deploy services across multiple regions

### 2. Additional Providers

- **OCR**: PaddleOCR, EasyOCR, Amazon Textract
- **Chunking**: Semantic Scholar chunking, Custom neural chunkers
- **Embedding**: Voyage AI, Jina AI, Local sentence-transformers

### 3. Performance Improvements

- **Async Processing**: Convert to async/await for better performance
- **Queue System**: Use Celery for background processing
- **Streaming**: Stream large documents instead of loading into memory
- **Distributed Processing**: Distribute processing across multiple workers

### 4. User Experience

- **Configuration Templates**: Pre-configured templates for common setups
- **Usage Analytics**: Show users their service usage statistics
- **Cost Estimation**: Estimate costs before processing
- **Service Recommendations**: Recommend best service based on use case

---

## Conclusion

This architecture provides a robust, scalable foundation for integrating external services into dalli-rag. The plugin-based design makes it easy to add new providers, while the user-level configuration allows each user to customize their experience. The combination of local and cloud services provides flexibility and cost optimization.

### Key Benefits

1. **Flexibility**: Support for multiple providers per service type
2. **Scalability**: Easy to add new services and providers
3. **User Control**: Each user configures their own services
4. **Reliability**: Built-in retry logic and health monitoring
5. **Security**: Secure storage of API keys and credentials
6. **Performance**: Caching, batching, and connection pooling
7. **Cost Optimization**: Mix of local and cloud services
8. **Monitoring**: Real-time health checks and performance metrics

### Next Steps

1. Begin with Phase 1 backend infrastructure
2. Implement one provider per service type initially
3. Add comprehensive testing
4. Deploy to staging environment
5. Gather user feedback
6. Iterate and add more providers
7. Monitor performance and optimize
8. Scale as needed

---

**Document Version**: 1.0
**Last Updated**: 2025-01-28
**Author**: Claude (Anthropic)
**Status**: Draft - Ready for Implementation
