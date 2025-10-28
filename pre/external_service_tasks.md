# External Service Integration - Task Plan

## Project Overview

**Goal**: Integrate external services (OCR, Chunking, Embedding) into dalli-rag using a plugin-based connector architecture.

**Duration**: 8 weeks

**Reference**: [External Service Architecture Plan](./external_service_plan.md)

---

## Phase 1: Backend Infrastructure (Week 1-2)

### Week 1: Core Connector Architecture

#### Task 1.1: Setup Project Structure
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: None

**Subtasks**:
- [x] Create `backend/app/connectors/` directory
- [x] Create `backend/app/connectors/providers/` directory structure
  - [x] `providers/ocr/`
  - [x] `providers/chunking/`
  - [x] `providers/embedding/`
- [x] Create `backend/config/` directory
- [x] Add `__init__.py` files to all new directories

**Files to Create**:
```
backend/app/connectors/__init__.py
backend/app/connectors/providers/__init__.py
backend/app/connectors/providers/ocr/__init__.py
backend/app/connectors/providers/chunking/__init__.py
backend/app/connectors/providers/embedding/__init__.py
backend/config/.gitkeep
```

**Acceptance Criteria**:
- All directories created
- Import paths work correctly
- No import errors when running backend

---

#### Task 1.2: Implement Custom Exceptions
**Estimated Time**: 1 hour
**Priority**: High
**Dependencies**: Task 1.1

**Subtasks**:
- [x] Create `backend/app/connectors/errors.py`
- [x] Define custom exception classes:
  - [x] `ConnectorError` (base exception)
  - [x] `ProviderNotFoundError`
  - [x] `ConfigurationError`
  - [x] `ConnectionError`
  - [x] `HealthCheckError`
  - [x] `ProcessingError`

**Implementation**:
```python
# backend/app/connectors/errors.py

class ConnectorError(Exception):
    """Base exception for connector errors"""
    pass

class ProviderNotFoundError(ConnectorError):
    """Raised when provider is not found"""
    pass

class ConfigurationError(ConnectorError):
    """Raised when configuration is invalid"""
    pass

class ConnectionError(ConnectorError):
    """Raised when connection to service fails"""
    pass

class HealthCheckError(ConnectorError):
    """Raised when health check fails"""
    pass

class ProcessingError(ConnectorError):
    """Raised when processing fails"""
    pass
```

**Acceptance Criteria**:
- All exception classes defined
- Proper inheritance hierarchy
- Exceptions can be imported and raised

---

#### Task 1.3: Implement BaseConnector
**Estimated Time**: 4 hours
**Priority**: Critical
**Dependencies**: Task 1.2

**Subtasks**:
- [x] Create `backend/app/connectors/base.py`
- [x] Implement abstract base class with:
  - [x] `__init__` method with configuration
  - [x] Abstract `_init_provider` method
  - [x] Abstract `process` method
  - [x] `_call_api` method with retry logic
  - [x] `health_check` method
  - [x] `get_provider_info` method
- [x] Add retry logic using `tenacity`
- [x] Add logging configuration
- [x] Add type hints

**Dependencies to Install**:
```bash
pip install tenacity
```

**Acceptance Criteria**:
- BaseConnector class is abstract
- Cannot instantiate directly
- All methods have proper type hints
- Retry logic works (test with mock)
- Health check returns boolean
- Provider info filters sensitive data

**Testing**:
- Create mock connector class for testing
- Test retry logic with failing API
- Test health check with healthy/unhealthy provider
- Verify sensitive data filtering

---

#### Task 1.4: Implement ServiceConnectorFactory
**Estimated Time**: 3 hours
**Priority**: Critical
**Dependencies**: Task 1.3

**Subtasks**:
- [x] Create `backend/app/connectors/factory.py`
- [x] Implement factory class with:
  - [x] `get_connector` class method
  - [x] `_create_connector` class method
  - [x] `_load_config` class method
  - [x] `_get_default_config` class method
  - [x] `reload_config` class method
- [x] Add thread-safe singleton pattern
- [x] Add configuration caching
- [x] Handle missing config file gracefully

**Dependencies to Install**:
```bash
pip install pyyaml
```

**Acceptance Criteria**:
- Factory returns same instance for same config
- Thread-safe implementation
- Graceful fallback to defaults
- Configuration can be reloaded
- Proper error handling

**Testing**:
- Test singleton pattern (multiple calls return same instance)
- Test thread safety (concurrent access)
- Test config loading from file
- Test default config fallback
- Test config reload

---

#### Task 1.5: Implement Service Connectors (OCR, Chunking, Embedding)
**Estimated Time**: 6 hours total (2 hours each)
**Priority**: High
**Dependencies**: Task 1.4

**Subtasks**:
- [x] Create `backend/app/connectors/ocr_connector.py`
- [x] Create `backend/app/connectors/chunking_connector.py`
- [x] Create `backend/app/connectors/embedding_connector.py`
- [x] Implement each connector extending `BaseConnector`
- [x] Add provider mapping for each
- [x] Implement `process` method signatures

**Acceptance Criteria**:
- All three connectors implemented
- Extend BaseConnector properly
- Provider initialization works
- Ready for provider implementations

---

### Week 2: Database & API

#### Task 1.6: Create Database Model
**Estimated Time**: 2 hours
**Priority**: Critical
**Dependencies**: None

**Subtasks**:
- [x] Add `ServiceConfig` model to `backend/app/models.py`
- [x] Add relationship to `User` model
- [x] Define all columns with proper types
- [x] Add indexes for performance

**Database Schema**:
```sql
CREATE TABLE service_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(32) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    config TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    last_verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_service_configs_user_type ON service_configs(user_id, service_type);
```

**Acceptance Criteria**:
- Model defined in SQLAlchemy
- Relationship to User model added
- All fields have correct types
- Index created

---

#### Task 1.7: Create Database Migration
**Estimated Time**: 1 hour
**Priority**: Critical
**Dependencies**: Task 1.6

**Subtasks**:
- [x] Create Alembic migration script or direct SQL
- [x] Test upgrade migration
- [x] Test downgrade migration
- [x] Update database schema

**Commands**:
```bash
# If using Alembic
alembic revision -m "add_service_configs_table"
alembic upgrade head

# Or direct SQL execution
```

**Acceptance Criteria**:
- Migration completed
- Table created with correct schema
- Can rollback if needed

---

#### Task 1.8: Implement Service Configuration Schemas
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: Task 1.6

**Subtasks**:
- [x] Add service enums to `backend/app/schemas.py`:
  - [x] `ServiceType`
  - [x] `OCRProvider`
  - [x] `ChunkingProvider`
  - [x] `EmbeddingProvider`
- [x] Add Pydantic schemas:
  - [x] `ServiceConfigBase`
  - [x] `ServiceConfigCreate`
  - [x] `ServiceConfigUpdate`
  - [x] `ServiceConfig`
  - [x] `ServiceConnectionTest`
  - [x] `ServiceConnectionTestResult`

**Acceptance Criteria**:
- All enums defined
- All schemas have proper validation
- Type hints are correct
- Example values work

---

#### Task 1.9: Implement Service Configuration API
**Estimated Time**: 4 hours
**Priority**: Critical
**Dependencies**: Task 1.8

**Subtasks**:
- [x] Create `backend/app/api/routes/service_configs.py`
- [x] Implement endpoints:
  - [x] `GET /api/service-configs` - List user configs
  - [x] `POST /api/service-configs` - Create config
  - [x] `PUT /api/service-configs/{id}` - Update config
  - [x] `DELETE /api/service-configs/{id}` - Delete config
  - [x] `POST /api/service-configs/test` - Test connection
- [x] Add authentication dependency
- [x] Add proper error handling
- [x] Add JSON serialization for config field

**Acceptance Criteria**:
- All CRUD endpoints work
- Authentication required
- Users can only access their own configs
- Config field properly serialized/deserialized
- Connection test endpoint works

**Testing**:
- Test each endpoint with curl/Postman
- Test authentication
- Test authorization
- Test error cases

---

#### Task 1.10: Register API Routes
**Estimated Time**: 30 minutes
**Priority**: High
**Dependencies**: Task 1.9

**Subtasks**:
- [x] Add router import to `backend/main.py`
- [x] Register service_configs router
- [x] Test API endpoints are accessible

**Code**:
```python
from app.api.routes import service_configs

app.include_router(
    service_configs.router,
    prefix="/api/service-configs",
    tags=["service-configs"]
)
```

**Acceptance Criteria**:
- Routes registered
- API docs show new endpoints
- Endpoints accessible via HTTP

---

## Phase 2: External Service Providers (Week 3-4)

### Week 3: Essential Providers

#### Task 2.1: Implement Internal Chunking Provider
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: Task 1.5

**Subtasks**:
- [ ] Create `backend/app/connectors/providers/chunking/internal.py`
- [ ] Implement `InternalChunker` class
- [ ] Implement token-based text splitting
- [ ] Add configurable chunk size and overlap
- [ ] Add delimiter support
- [ ] Implement `health_check` method

**Acceptance Criteria**:
- Chunks text into specified sizes
- Respects overlap configuration
- Handles delimiters correctly
- Health check always returns True (local)

---

#### Task 2.2: Implement Tesseract OCR Provider
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Task 1.5

**Subtasks**:
- [ ] Create `backend/app/connectors/providers/ocr/local_tesseract.py`
- [ ] Implement `LocalTesseractProvider` class
- [ ] Add HTTP client for Tesseract API
- [ ] Implement `extract_text` method
- [ ] Implement `health_check` method

**Dependencies to Install**:
```bash
pip install requests pillow
```

**Acceptance Criteria**:
- Connects to Tesseract API
- Extracts text from images
- Health check verifies API availability
- Handles errors gracefully

---

#### Task 2.3: Implement HuggingFace Embedding Provider
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Task 1.5

**Subtasks**:
- [ ] Create `backend/app/connectors/providers/embedding/huggingface_embed.py`
- [ ] Implement `HuggingFaceEmbedding` class
- [ ] Add HTTP client for TEI service
- [ ] Implement `embed` method
- [ ] Implement `get_dimension` method
- [ ] Implement `health_check` method

**Acceptance Criteria**:
- Connects to HuggingFace TEI service
- Generates embeddings for text
- Returns correct embedding dimension
- Health check works
- Batch processing supported

---

#### Task 2.4: Implement OpenAI Embedding Provider
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: Task 1.5

**Subtasks**:
- [ ] Create `backend/app/connectors/providers/embedding/openai_embed.py`
- [ ] Implement `OpenAIEmbedding` class
- [ ] Integrate OpenAI API
- [ ] Support multiple embedding models

**Dependencies to Install**:
```bash
pip install openai
```

**Acceptance Criteria**:
- Authenticates with OpenAI API
- Generates embeddings
- Supports multiple models

---

#### Task 2.5: Implement Ollama Embedding Provider
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: Task 1.5

**Subtasks**:
- [ ] Create `backend/app/connectors/providers/embedding/ollama_embed.py`
- [ ] Implement `OllamaEmbedding` class
- [ ] Add HTTP client for Ollama API

**Acceptance Criteria**:
- Connects to Ollama service
- Generates embeddings
- Health check works

---

### Week 4: Additional Providers (Optional)

#### Task 2.6: Implement LangChain Chunking Provider
**Estimated Time**: 3 hours
**Priority**: Low
**Dependencies**: Task 1.5

**Subtasks**:
- [ ] Create `backend/app/connectors/providers/chunking/langchain_chunker.py`
- [ ] Integrate LangChain TextSplitter
- [ ] Support multiple splitter types

**Dependencies to Install**:
```bash
pip install langchain langchain-text-splitters
```

---

#### Task 2.7: Implement Google Vision OCR Provider
**Estimated Time**: 4 hours
**Priority**: Low
**Dependencies**: Task 1.5

**Subtasks**:
- [ ] Create `backend/app/connectors/providers/ocr/google_vision.py`
- [ ] Integrate Google Vision API

**Dependencies to Install**:
```bash
pip install google-cloud-vision
```

---

#### Task 2.8: Implement Azure Providers (Optional)
**Estimated Time**: 6 hours
**Priority**: Low
**Dependencies**: Task 1.5

**Subtasks**:
- [ ] Azure Computer Vision for OCR
- [ ] Azure OpenAI for Embeddings

---

## Phase 3: Frontend Development (Week 5-6)

### Week 5: UI Components

#### Task 3.1: Create Service TypeScript Types
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: None

**Subtasks**:
- [ ] Create `frontend/src/types/service.ts`
- [ ] Define all TypeScript types matching backend schemas

**Acceptance Criteria**:
- All types defined
- Types match backend schemas
- No TypeScript errors

---

#### Task 3.2: Create Provider Configuration Constants
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: Task 3.1

**Subtasks**:
- [ ] Define OCR providers with config fields
- [ ] Define Chunking providers with config fields
- [ ] Define Embedding providers with config fields

**Acceptance Criteria**:
- All providers defined
- Config fields have proper types

---

#### Task 3.3: Implement ModelSettings Page
**Estimated Time**: 6 hours
**Priority**: Critical
**Dependencies**: Task 3.2

**Subtasks**:
- [ ] Create `frontend/src/pages/Settings/` directory
- [ ] Create `ModelSettings.tsx`
- [ ] Implement:
  - [ ] Service type tabs
  - [ ] Provider selection panel
  - [ ] Configuration form
  - [ ] Test connection button
  - [ ] Save button
- [ ] Add state management
- [ ] Implement API calls

**Acceptance Criteria**:
- Page renders without errors
- All functionality works
- API integration complete

---

#### Task 3.4: Create Reusable Components
**Estimated Time**: 4 hours
**Priority**: Medium
**Dependencies**: Task 3.2

**Subtasks**:
- [ ] Create `frontend/src/components/settings/` directory
- [ ] Implement `ProviderSelector.tsx`
- [ ] Implement `ServiceConfigForm.tsx`
- [ ] Implement `ConnectionTest.tsx`

**Acceptance Criteria**:
- Components are reusable
- Clean separation of concerns

---

### Week 6: Integration

#### Task 3.5: Add Settings Route
**Estimated Time**: 1 hour
**Priority**: High
**Dependencies**: Task 3.3

**Subtasks**:
- [ ] Add route to `App.tsx`
- [ ] Add navigation link
- [ ] Test routing

**Acceptance Criteria**:
- Route works
- Navigation accessible

---

#### Task 3.6: Implement API Client
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: Task 3.1

**Subtasks**:
- [ ] Create `frontend/src/api/serviceConfig.ts`
- [ ] Implement all API client functions

**Acceptance Criteria**:
- All API functions work
- Proper error handling

---

#### Task 3.7: Add Responsive Design
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: Task 3.3

**Subtasks**:
- [ ] Test on mobile
- [ ] Test on tablet
- [ ] Fix layout issues

**Acceptance Criteria**:
- Works on all screen sizes
- Touch-friendly

---

## Phase 4: Docker & Configuration (Week 7)

### Week 7: Infrastructure

#### Task 4.1: Create Service Configuration File
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: None

**Subtasks**:
- [ ] Create `backend/config/service_conf.yaml`
- [ ] Add all service configurations
- [ ] Add environment variable placeholders

**Acceptance Criteria**:
- YAML file valid
- All services configured

---

#### Task 4.2: Update Docker Compose
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: None

**Subtasks**:
- [ ] Add Ollama service
- [ ] Add HuggingFace TEI service
- [ ] Add Tesseract service
- [ ] Configure networking
- [ ] Add health checks

**Acceptance Criteria**:
- All services start
- Health checks pass
- Services accessible

---

#### Task 4.3: Update Environment Variables
**Estimated Time**: 1 hour
**Priority**: High
**Dependencies**: Task 4.1

**Subtasks**:
- [ ] Update `.env` file
- [ ] Create `.env.example`
- [ ] Document all variables

**Acceptance Criteria**:
- All variables documented
- Example file created

---

#### Task 4.4: Update Backend Dependencies
**Estimated Time**: 1 hour
**Priority**: High
**Dependencies**: All provider tasks

**Subtasks**:
- [ ] Update `requirements.txt`
- [ ] Pin versions
- [ ] Test installation

**Acceptance Criteria**:
- All dependencies listed
- No conflicts

---

#### Task 4.5: Test Full Docker Stack
**Estimated Time**: 3 hours
**Priority**: Critical
**Dependencies**: Task 4.2

**Subtasks**:
- [ ] Start all services
- [ ] Verify connectivity
- [ ] Test integrations
- [ ] Fix issues

**Acceptance Criteria**:
- All services running
- No errors
- Backend can connect

---

## Phase 5: Testing & Documentation (Week 8)

### Week 8: Quality Assurance

#### Task 5.1: Write Unit Tests
**Estimated Time**: 6 hours
**Priority**: High
**Dependencies**: Phase 1-2 complete

**Subtasks**:
- [ ] Test connectors
- [ ] Test providers
- [ ] Test factory
- [ ] Achieve >80% coverage

**Acceptance Criteria**:
- All tests pass
- Good coverage

---

#### Task 5.2: Write Integration Tests
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Task 1.9

**Subtasks**:
- [ ] Test API endpoints
- [ ] Test authentication
- [ ] Test authorization

**Acceptance Criteria**:
- All endpoints tested
- Edge cases covered

---

#### Task 5.3: Write E2E Tests
**Estimated Time**: 4 hours
**Priority**: Medium
**Dependencies**: Phase 3 complete

**Subtasks**:
- [ ] Setup test framework
- [ ] Test happy path
- [ ] Test error scenarios

**Acceptance Criteria**:
- E2E tests pass
- User flows validated

---

#### Task 5.4: Write Documentation
**Estimated Time**: 6 hours
**Priority**: High
**Dependencies**: All phases complete

**Subtasks**:
- [ ] API documentation
- [ ] User guide
- [ ] Deployment guide
- [ ] Add screenshots

**Acceptance Criteria**:
- Comprehensive documentation
- Clear instructions

---

#### Task 5.5: Performance Testing
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: All phases complete

**Subtasks**:
- [ ] Benchmark services
- [ ] Test concurrent requests
- [ ] Document results

**Acceptance Criteria**:
- Performance metrics collected
- Bottlenecks identified

---

#### Task 5.6: Security Audit
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: All phases complete

**Subtasks**:
- [ ] Review API key storage
- [ ] Test authentication/authorization
- [ ] Check for vulnerabilities

**Acceptance Criteria**:
- No critical issues
- Recommendations documented

---

#### Task 5.7: Final Integration Test
**Estimated Time**: 4 hours
**Priority**: Critical
**Dependencies**: All previous tasks

**Subtasks**:
- [ ] Test complete user flow
- [ ] Test all service combinations
- [ ] Fix any issues

**Acceptance Criteria**:
- Everything works end-to-end
- No errors

---

## Summary

### Total Estimated Time: ~140 hours (7 weeks)

### Phase Breakdown:
- **Phase 1** (Week 1-2): Backend Infrastructure - 25 hours
- **Phase 2** (Week 3-4): Service Providers - 24 hours
- **Phase 3** (Week 5-6): Frontend Development - 21 hours
- **Phase 4** (Week 7): Docker & Configuration - 11 hours
- **Phase 5** (Week 8): Testing & Documentation - 30 hours

### Priority Distribution:
- **Critical**: 8 tasks
- **High**: 20 tasks
- **Medium**: 10 tasks
- **Low**: 5 tasks

### Key Milestones:
1. **End of Week 2**: Backend API ready
2. **End of Week 4**: All providers implemented
3. **End of Week 6**: Frontend complete
4. **End of Week 7**: Full stack deployable
5. **End of Week 8**: Production ready

---

## Progress Tracking

### Week 1-2: Backend Infrastructure ☑️ 100%
- [x] Project structure setup
- [x] Core connector architecture
- [x] Database models and migrations
- [x] API endpoints

### Week 3-4: Service Providers ☐ 0%
- [ ] Essential providers (Internal, Tesseract, HuggingFace)
- [ ] Optional providers (OpenAI, Ollama, etc.)

### Week 5-6: Frontend Development ☐ 0%
- [ ] TypeScript types and constants
- [ ] Settings page UI
- [ ] API integration

### Week 7: Infrastructure ☐ 0%
- [ ] Docker services
- [ ] Configuration files
- [ ] Full stack testing

### Week 8: Quality Assurance ☐ 0%
- [ ] Unit and integration tests
- [ ] Documentation
- [ ] Security and performance audits

---

**Document Version**: 1.0
**Last Updated**: 2025-01-28
**Author**: Claude (Anthropic)
**Status**: Ready for Implementation