# RAGFlow 외부 서비스 연결 아키텍처 설계

## 목차

1. [개요](#1-개요)
2. [현재 RAGFlow의 외부 서비스 통합 현황](#2-현재-ragflow의-외부-서비스-통합-현황)
3. [외부 서비스 연결 아키텍처](#3-외부-서비스-연결-아키텍처)
4. [핵심 컴포넌트 설계](#4-핵심-컴포넌트-설계)
5. [설정 파일 구조](#5-설정-파일-구조)
6. [Task Executor 통합](#6-task-executor-통합)
7. [API 명세 및 에러 핸들링](#7-api-명세-및-에러-핸들링)
8. [배포 전략 및 마이그레이션](#8-배포-전략-및-마이그레이션)
9. [종합 시스템 다이어그램](#9-종합-시스템-다이어그램)
10. [핵심 장점 요약](#10-핵심-장점-요약)
11. [실행 계획](#11-실행-계획)

---

## 1. 개요

RAGFlow에서 **텍스트 추출(OCR), 청킹(Chunking), 임베딩(Embedding)** 등의 작업을 수행하기 위해 외부 서비스와의 연결이 필요합니다. 본 문서는 확장 가능하고 유지보수가 쉬운 **통합 서비스 연결 아키텍처**를 설계합니다.

### 설계 목표

- **플러그인 아키텍처**: 새로운 외부 서비스 프로바이더를 쉽게 추가 가능
- **하위 호환성**: 기존 RAGFlow 코드와 호환
- **자동 폴백**: 외부 API 실패 시 로컬 서비스로 자동 전환
- **중앙 집중식 설정**: YAML 기반 설정 관리
- **모니터링 및 에러 처리**: 통합된 로깅, 메트릭, 재시도 로직

---

## 2. 현재 RAGFlow의 외부 서비스 통합 현황

### 분석 결과

RAGFlow는 이미 다음과 같은 외부 서비스 통합 패턴을 사용하고 있습니다:

#### A. OCR 서비스
**파일**: [deepdoc/vision/ocr.py](deepdoc/vision/ocr.py)

- **방식**: ONNX 모델 로컬 실행
- **특징**: HuggingFace에서 모델 다운로드 → ONNX Runtime 사용
- **멀티 GPU 지원**: `PARALLEL_DEVICES` 환경 변수로 GPU 할당

```python
class OCR:
    def __init__(self, model_dir=None):
        if PARALLEL_DEVICES > 0:
            self.text_detector = []
            self.text_recognizer = []
            for device_id in range(PARALLEL_DEVICES):
                self.text_detector.append(TextDetector(model_dir, device_id))
                self.text_recognizer.append(TextRecognizer(model_dir, device_id))
```

#### B. Embedding 서비스
**파일**: [rag/llm/embedding_model.py](rag/llm/embedding_model.py)

- **방식**: Factory Pattern + 다중 프로바이더
- **지원 프로바이더**: 30+ (OpenAI, HuggingFace, Ollama, Azure, Gemini, Jina 등)
- **설정**: [conf/service_conf.yaml](conf/service_conf.yaml)

```python
class OpenAIEmbed(Base):
    def __init__(self, key, model_name="text-embedding-ada-002", base_url="https://api.openai.com/v1"):
        self.client = OpenAI(api_key=key, base_url=base_url)
        self.model_name = model_name

    def encode(self, texts: list):
        res = self.client.embeddings.create(input=texts, model=self.model_name)
        return np.array([d.embedding for d in res.data])
```

#### C. 청킹(Chunking) 서비스
**위치**: `rag/app/*.py`

- **방식**: 내장 구현 (13개 파서)
- **파서 종류**: naive, qa, book, paper, resume, table, laws 등

```python
# rag/app/naive.py
def naive_chunk(text, chunk_token_num=512, delimiter='\n!?。；！？'):
    # 토큰 기반 청킹 로직
    chunks = []
    # ... 청킹 처리
    return chunks
```

---

## 3. 외부 서비스 연결 아키텍처

### 전체 아키텍처 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAGFlow Application Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Document API │  │ Task Executor│  │  Chat API    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────────────┐
│         │     Service Connector Layer (통합 레이어)              │
│         ▼                  ▼                  ▼                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │        ServiceConnectorFactory (서비스 팩토리)       │       │
│  │  - 설정 기반 프로바이더 선택                          │       │
│  │  - 연결 풀 관리                                       │       │
│  │  - 헬스체크 & 자동 재연결                             │       │
│  └──┬────────────────┬────────────────┬──────────────┘          │
│     │                │                │                         │
│     ▼                ▼                ▼                         │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐                     │
│  │  OCR    │  │ Chunking │  │ Embedding  │                     │
│  │Connector│  │Connector │  │ Connector  │                     │
│  └────┬────┘  └────┬─────┘  └─────┬──────┘                     │
└───────┼────────────┼──────────────┼─────────────────────────────┘
        │            │              │
┌───────┼────────────┼──────────────┼─────────────────────────────┐
│       │  Provider Abstraction Layer (프로바이더 추상화)         │
│       ▼            ▼              ▼                             │
│  ┌────────┐  ┌─────────┐  ┌──────────┐                         │
│  │  Base  │  │  Base   │  │   Base   │                         │
│  │  OCR   │  │ Chunker │  │Embedding │                         │
│  │Provider│  │Provider │  │ Provider │                         │
│  └───┬────┘  └────┬────┘  └────┬─────┘                         │
└──────┼────────────┼─────────────┼──────────────────────────────┘
       │            │             │
┌──────┼────────────┼─────────────┼──────────────────────────────┐
│      ▼            ▼             ▼                               │
│  External Service Providers (외부 서비스 프로바이더)            │
│                                                                 │
│  OCR:           Chunking:       Embedding:                      │
│  ├─ Local       ├─ Internal     ├─ OpenAI                      │
│  │  (ONNX)      │  Processors    ├─ HuggingFace                │
│  ├─ Google      ├─ LangChain    ├─ Azure                       │
│  │  Vision      │  TextSplitter  ├─ Cohere                     │
│  ├─ Azure       ├─ LlamaIndex   ├─ Ollama (Local)              │
│  │  Computer    │  NodeParser    ├─ Jina                       │
│  │  Vision      ├─ Semantic      ├─ Voyage                     │
│  ├─ AWS         │  Chunker       └─ Custom API                 │
│  │  Textract    │  (API)                                        │
│  └─ Custom API  └─ Custom API                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 핵심 컴포넌트 설계

### 4.1 ServiceConnectorFactory (통합 팩토리)

**파일**: `rag/connectors/factory.py`

```python
from typing import Dict, Type, Optional
from abc import ABC, abstractmethod
import yaml
import logging
from threading import Lock
from .ocr_connector import OCRConnector
from .chunking_connector import ChunkingConnector
from .embedding_connector import EmbeddingConnector

class ServiceConnectorFactory:
    """
    서비스 커넥터 통합 관리 팩토리

    역할:
    - 설정 파일 기반 프로바이더 초기화
    - 싱글톤 패턴으로 커넥터 인스턴스 관리
    - 헬스체크 및 재연결 로직
    """

    _instances: Dict[str, Any] = {}
    _lock = Lock()

    @classmethod
    def get_connector(cls, service_type: str, config: Dict = None) -> 'BaseConnector':
        """
        서비스 타입에 따른 커넥터 반환

        Args:
            service_type: 'ocr', 'chunking', 'embedding'
            config: 설정 딕셔너리 (None이면 service_conf.yaml에서 로드)

        Returns:
            해당 서비스 커넥터 인스턴스
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
    def _create_connector(cls, service_type: str, config: Dict):
        """커넥터 생성 내부 메서드"""
        connector_map = {
            'ocr': OCRConnector,
            'chunking': ChunkingConnector,
            'embedding': EmbeddingConnector
        }

        connector_class = connector_map.get(service_type)
        if not connector_class:
            raise ValueError(f"Unknown service type: {service_type}")

        return connector_class(config or cls._load_config(service_type))

    @classmethod
    def _load_config(cls, service_type: str) -> Dict:
        """service_conf.yaml에서 설정 로드"""
        with open('conf/service_conf.yaml', 'r') as f:
            config = yaml.safe_load(f)

        return config.get(f"{service_type}_service", {})
```

### 4.2 BaseConnector (추상 베이스)

**파일**: `rag/connectors/base.py`

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, List
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
    모든 서비스 커넥터의 추상 베이스 클래스

    공통 기능:
    - 연결 헬스체크
    - 재시도 로직
    - 타임아웃 관리
    - 에러 핸들링
    """

    def __init__(self, config: Dict):
        self.config = config
        self.provider_type = config.get('provider', 'default')
        self.timeout = config.get('timeout', 30)
        self.max_retries = config.get('max_retries', 3)
        self.logger = logging.getLogger(self.__class__.__name__)

        # 프로바이더 초기화
        self.provider = self._init_provider()

    @abstractmethod
    def _init_provider(self) -> Any:
        """프로바이더 초기화 (하위 클래스에서 구현)"""
        pass

    @abstractmethod
    def process(self, input_data: Any, **kwargs) -> Any:
        """메인 처리 로직 (하위 클래스에서 구현)"""
        pass

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((requests.exceptions.Timeout,
                                       requests.exceptions.ConnectionError))
    )
    def _call_api(self, endpoint: str, data: Dict) -> Dict:
        """API 호출 (재시도 로직 포함)"""
        try:
            response = requests.post(
                endpoint,
                json=data,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            self.logger.error(f"API call failed: {str(e)}")
            raise

    def health_check(self) -> bool:
        """서비스 헬스체크"""
        try:
            if hasattr(self.provider, 'health_check'):
                return self.provider.health_check()
            return True
        except Exception as e:
            self.logger.warning(f"Health check failed: {str(e)}")
            return False
```

### 4.3 OCR Connector 상세 설계

**파일**: `rag/connectors/ocr_connector.py`

```python
from typing import List, Dict, Tuple
import numpy as np
from .base import BaseConnector
from .providers.ocr import (
    LocalONNXOCR,
    GoogleVisionOCR,
    AzureComputerVisionOCR,
    AWSTextractOCR
)

class OCRConnector(BaseConnector):
    """
    OCR 서비스 통합 커넥터

    지원 프로바이더:
    - local: ONNX 모델 로컬 실행 (현재 구현)
    - google: Google Cloud Vision API
    - azure: Azure Computer Vision
    - aws: AWS Textract
    - custom: 커스텀 API 엔드포인트
    """

    PROVIDER_MAP = {
        'local': LocalONNXOCR,
        'google': GoogleVisionOCR,
        'azure': AzureComputerVisionOCR,
        'aws': AWSTextractOCR
    }

    def _init_provider(self):
        """프로바이더 초기화"""
        provider_class = self.PROVIDER_MAP.get(self.provider_type)

        if not provider_class:
            raise ValueError(f"Unknown OCR provider: {self.provider_type}")

        return provider_class(self.config)

    def process(
        self,
        image: np.ndarray,
        device_id: int = 0,
        return_confidence: bool = True
    ) -> List[Tuple[List, Tuple[str, float]]]:
        """
        이미지에서 텍스트 추출

        Args:
            image: 이미지 numpy 배열
            device_id: GPU 디바이스 ID (local 프로바이더용)
            return_confidence: 신뢰도 점수 포함 여부

        Returns:
            [(박스 좌표, (텍스트, 신뢰도)), ...]
        """
        try:
            result = self.provider.detect_and_recognize(
                image,
                device_id=device_id
            )

            if not return_confidence:
                result = [(box, (text, None)) for box, (text, _) in result]

            return result

        except Exception as e:
            self.logger.error(f"OCR processing failed: {str(e)}")

            # Fallback to local provider if external API fails
            if self.provider_type != 'local':
                self.logger.info("Falling back to local OCR provider")
                return self._fallback_to_local(image, device_id)

            raise

    def _fallback_to_local(self, image: np.ndarray, device_id: int):
        """외부 API 실패 시 로컬 OCR로 폴백"""
        local_provider = LocalONNXOCR(self.config)
        return local_provider.detect_and_recognize(image, device_id)
```

### 4.4 OCR Provider 구현 예시

**파일**: `rag/connectors/providers/ocr/local_onnx.py`

```python
from typing import List, Tuple
import numpy as np
from deepdoc.vision.ocr import OCR

class LocalONNXOCR:
    """
    로컬 ONNX 모델 기반 OCR (현재 RAGFlow 구현)
    """

    def __init__(self, config: Dict):
        self.model_dir = config.get('model_dir')
        self.ocr_engine = OCR(model_dir=self.model_dir)

    def detect_and_recognize(
        self,
        image: np.ndarray,
        device_id: int = 0
    ) -> List[Tuple[List, Tuple[str, float]]]:
        """텍스트 감지 및 인식"""
        return self.ocr_engine(image, device_id=device_id)

    def health_check(self) -> bool:
        """헬스체크"""
        return self.ocr_engine is not None
```

**파일**: `rag/connectors/providers/ocr/google_vision.py`

```python
from google.cloud import vision
import io

class GoogleVisionOCR:
    """
    Google Cloud Vision API OCR
    """

    def __init__(self, config: Dict):
        self.api_key = config.get('api_key')
        self.client = vision.ImageAnnotatorClient(
            credentials=self._get_credentials()
        )

    def detect_and_recognize(
        self,
        image: np.ndarray,
        **kwargs
    ) -> List[Tuple[List, Tuple[str, float]]]:
        """Google Vision API 호출"""
        import cv2

        # numpy array → bytes
        _, buffer = cv2.imencode('.png', image)
        content = buffer.tobytes()

        # API 요청
        image_obj = vision.Image(content=content)
        response = self.client.text_detection(image=image_obj)

        # 결과 변환 (RAGFlow 형식으로)
        results = []
        for annotation in response.text_annotations[1:]:  # 첫 번째는 전체 텍스트
            vertices = annotation.bounding_poly.vertices
            box = [[v.x, v.y] for v in vertices]
            text = annotation.description
            confidence = annotation.confidence if hasattr(annotation, 'confidence') else 0.9

            results.append((box, (text, confidence)))

        return results

    def _get_credentials(self):
        """Google Cloud 인증 정보 로드"""
        # 환경 변수 또는 키 파일에서 로드
        pass
```

**파일**: `rag/connectors/providers/ocr/azure_cv.py`

```python
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from msrest.authentication import CognitiveServicesCredentials
import time

class AzureComputerVisionOCR:
    """
    Azure Computer Vision OCR
    """

    def __init__(self, config: Dict):
        self.endpoint = config.get('endpoint')
        self.api_key = config.get('api_key')

        self.client = ComputerVisionClient(
            self.endpoint,
            CognitiveServicesCredentials(self.api_key)
        )

    def detect_and_recognize(
        self,
        image: np.ndarray,
        **kwargs
    ) -> List[Tuple[List, Tuple[str, float]]]:
        """Azure Computer Vision API 호출"""
        import cv2
        import io

        # numpy array → bytes stream
        _, buffer = cv2.imencode('.png', image)
        image_stream = io.BytesIO(buffer.tobytes())

        # Read API 호출 (비동기)
        read_response = self.client.read_in_stream(image_stream, raw=True)
        operation_id = read_response.headers["Operation-Location"].split("/")[-1]

        # 결과 대기
        while True:
            result = self.client.get_read_result(operation_id)
            if result.status.lower() not in ['notstarted', 'running']:
                break
            time.sleep(1)

        # 결과 변환
        results = []
        if result.status == 'succeeded':
            for text_result in result.analyze_result.read_results:
                for line in text_result.lines:
                    box = [[p.x, p.y] for p in line.bounding_box]
                    text = line.text
                    confidence = line.confidence if hasattr(line, 'confidence') else 0.9

                    results.append((box, (text, confidence)))

        return results
```

### 4.5 Chunking Connector 상세 설계

**파일**: `rag/connectors/chunking_connector.py`

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
    """
    청킹 서비스 통합 커넥터

    지원 프로바이더:
    - internal: RAGFlow 내장 파서 (naive, qa, book 등)
    - langchain: LangChain TextSplitter
    - llamaindex: LlamaIndex NodeParser
    - semantic: 의미 기반 청킹 API
    """

    PROVIDER_MAP = {
        'internal': InternalChunker,
        'langchain': LangChainChunker,
        'llamaindex': LlamaIndexChunker,
        'semantic': SemanticChunker
    }

    def _init_provider(self):
        """프로바이더 초기화"""
        provider_class = self.PROVIDER_MAP.get(self.provider_type, InternalChunker)
        return provider_class(self.config)

    def process(
        self,
        text: str,
        parser_config: Dict,
        **kwargs
    ) -> List[Dict]:
        """
        텍스트 청킹 처리

        Args:
            text: 입력 텍스트
            parser_config: 파서 설정 (chunk_token_num 등)

        Returns:
            [{"content": str, "metadata": dict}, ...]
        """
        try:
            chunks = self.provider.chunk(
                text=text,
                config=parser_config,
                **kwargs
            )

            # 통합 포맷으로 정규화
            return self._normalize_chunks(chunks)

        except Exception as e:
            self.logger.error(f"Chunking failed: {str(e)}")
            raise

    def _normalize_chunks(self, chunks: List) -> List[Dict]:
        """청크 포맷 통일"""
        normalized = []

        for chunk in chunks:
            if isinstance(chunk, dict):
                normalized.append(chunk)
            elif isinstance(chunk, str):
                normalized.append({"content": chunk, "metadata": {}})
            else:
                # LangChain Document, LlamaIndex Node 등
                normalized.append({
                    "content": getattr(chunk, 'text', str(chunk)),
                    "metadata": getattr(chunk, 'metadata', {})
                })

        return normalized
```

### 4.6 Chunking Provider 구현

**파일**: `rag/connectors/providers/chunking/internal.py`

```python
from typing import List, Dict
from rag.app.naive import naive_chunk
from rag.app.qa import qa_chunk
from rag.app.book import book_chunk

class InternalChunker:
    """
    RAGFlow 내장 청킹 시스템 (현재 구현)
    """

    PARSER_MAP = {
        'naive': naive_chunk,
        'qa': qa_chunk,
        'book': book_chunk,
        # ... 13개 파서 매핑
    }

    def __init__(self, config: Dict):
        self.parser_id = config.get('parser_id', 'naive')
        self.chunk_func = self.PARSER_MAP.get(self.parser_id, naive_chunk)

    def chunk(
        self,
        text: str,
        config: Dict,
        **kwargs
    ) -> List[Dict]:
        """내장 파서로 청킹"""
        chunk_token_num = config.get('chunk_token_num', 512)

        chunks = self.chunk_func(
            text,
            chunk_token_num=chunk_token_num,
            **config
        )

        return chunks
```

**파일**: `rag/connectors/providers/chunking/langchain_chunker.py`

```python
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
    TokenTextSplitter,
    MarkdownTextSplitter
)

class LangChainChunker:
    """
    LangChain TextSplitter 통합
    """

    def __init__(self, config: Dict):
        self.splitter_type = config.get('splitter_type', 'recursive')
        self.chunk_size = config.get('chunk_size', 512)
        self.chunk_overlap = config.get('chunk_overlap', 50)

        self.splitter = self._get_splitter()

    def _get_splitter(self):
        """텍스트 스플리터 선택"""
        if self.splitter_type == 'recursive':
            return RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap
            )
        elif self.splitter_type == 'token':
            return TokenTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap
            )
        elif self.splitter_type == 'markdown':
            return MarkdownTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap
            )

    def chunk(
        self,
        text: str,
        config: Dict,
        **kwargs
    ) -> List[Dict]:
        """LangChain으로 청킹"""
        documents = self.splitter.create_documents([text])

        return [
            {
                "content": doc.page_content,
                "metadata": doc.metadata
            }
            for doc in documents
        ]
```

**파일**: `rag/connectors/providers/chunking/semantic_chunker.py`

```python
import requests

class SemanticChunker:
    """
    의미 기반 청킹 외부 API

    예: 문장 임베딩 유사도 기반 청킹
    """

    def __init__(self, config: Dict):
        self.api_endpoint = config.get('api_endpoint')
        self.api_key = config.get('api_key')
        self.similarity_threshold = config.get('similarity_threshold', 0.7)

    def chunk(
        self,
        text: str,
        config: Dict,
        **kwargs
    ) -> List[Dict]:
        """외부 API로 의미 기반 청킹"""
        response = requests.post(
            self.api_endpoint,
            json={
                'text': text,
                'threshold': self.similarity_threshold,
                'config': config
            },
            headers={'Authorization': f'Bearer {self.api_key}'},
            timeout=30
        )

        response.raise_for_status()
        result = response.json()

        return result.get('chunks', [])
```

### 4.7 Embedding Connector 상세 설계

**파일**: `rag/connectors/embedding_connector.py`

```python
from typing import List, Tuple
import numpy as np
from .base import BaseConnector
from rag.llm.embedding_model import (
    OpenAIEmbed,
    HuggingFaceEmbed,
    OllamaEmbed,
    AzureEmbed,
    CoHereEmbed,
    # ... 30+ 프로바이더
)

class EmbeddingConnector(BaseConnector):
    """
    임베딩 서비스 통합 커넥터

    RAGFlow의 기존 embedding_model.py를 래핑하여
    통일된 인터페이스 제공
    """

    # 기존 RAGFlow 프로바이더 맵 재사용
    PROVIDER_MAP = {
        'openai': OpenAIEmbed,
        'huggingface': HuggingFaceEmbed,
        'ollama': OllamaEmbed,
        'azure': AzureEmbed,
        'cohere': CoHereEmbed,
        # ... 전체 30+ 프로바이더
    }

    def _init_provider(self):
        """임베딩 프로바이더 초기화"""
        provider_class = self.PROVIDER_MAP.get(self.provider_type)

        if not provider_class:
            raise ValueError(f"Unknown embedding provider: {self.provider_type}")

        api_key = self.config.get('api_key')
        model_name = self.config.get('model_name')
        base_url = self.config.get('base_url')

        return provider_class(
            key=api_key,
            model_name=model_name,
            base_url=base_url,
            **self.config
        )

    def process(
        self,
        texts: List[str],
        is_query: bool = False
    ) -> Tuple[np.ndarray, int]:
        """
        텍스트 임베딩 생성

        Args:
            texts: 텍스트 리스트
            is_query: 쿼리 임베딩 여부

        Returns:
            (임베딩 배열, 토큰 수)
        """
        try:
            if is_query and len(texts) == 1:
                return self.provider.encode_queries(texts[0])
            else:
                return self.provider.encode(texts)

        except Exception as e:
            self.logger.error(f"Embedding generation failed: {str(e)}")
            raise

    def batch_process(
        self,
        texts: List[str],
        batch_size: int = 16
    ) -> Tuple[np.ndarray, int]:
        """대용량 텍스트 배치 처리"""
        all_embeddings = []
        total_tokens = 0

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            embeddings, tokens = self.process(batch)

            all_embeddings.append(embeddings)
            total_tokens += tokens

        return np.vstack(all_embeddings), total_tokens
```

---

## 5. 설정 파일 구조

**파일**: `conf/service_conf.yaml`

```yaml
# ========== OCR 서비스 설정 ==========
ocr_service:
  provider: 'local'  # local | google | azure | aws | custom

  # Local ONNX 설정 (현재 기본)
  local:
    model_dir: 'rag/res/deepdoc'
    parallel_devices: 0  # GPU 수 (0 = CPU only)
    gpu_mem_limit_mb: 2048

  # Google Cloud Vision
  google:
    api_key: 'your-google-api-key'
    credentials_path: '/path/to/credentials.json'
    language_hints: ['en', 'ko']

  # Azure Computer Vision
  azure:
    endpoint: 'https://xxx.cognitiveservices.azure.com/'
    api_key: 'your-azure-key'
    api_version: '2023-04-01'

  # AWS Textract
  aws:
    region: 'us-east-1'
    access_key_id: 'your-aws-key'
    secret_access_key: 'your-aws-secret'

  # 공통 설정
  timeout: 30
  max_retries: 3
  fallback_to_local: true  # 외부 API 실패 시 로컬로 폴백

# ========== 청킹 서비스 설정 ==========
chunking_service:
  provider: 'internal'  # internal | langchain | llamaindex | semantic | custom

  # Internal (현재 RAGFlow 파서)
  internal:
    default_parser: 'naive'
    parsers:
      naive:
        chunk_token_num: 512
        delimiter: '\n!?。；！？'
      qa:
        chunk_token_num: 512
        raptor: {use_raptor: false}
      book:
        chunk_token_num: 256
        raptor: {use_raptor: true}

  # LangChain TextSplitter
  langchain:
    splitter_type: 'recursive'  # recursive | token | markdown
    chunk_size: 512
    chunk_overlap: 50

  # LlamaIndex NodeParser
  llamaindex:
    parser_type: 'sentence'  # sentence | simple | hierarchy
    chunk_size: 512
    chunk_overlap: 20

  # 의미 기반 청킹 API
  semantic:
    api_endpoint: 'https://api.semantic-chunking.com/v1/chunk'
    api_key: 'your-semantic-api-key'
    similarity_threshold: 0.7
    embedding_model: 'sentence-transformers/all-MiniLM-L6-v2'

# ========== 임베딩 서비스 설정 ==========
embedding_service:
  provider: 'openai'  # openai | huggingface | ollama | azure | cohere | ...

  # OpenAI
  openai:
    api_key: 'sk-xxx'
    model_name: 'text-embedding-3-small'
    base_url: 'https://api.openai.com/v1'

  # HuggingFace (로컬 또는 Inference API)
  huggingface:
    api_key: 'hf_xxx'
    model_name: 'BAAI/bge-large-en-v1.5'
    base_url: 'http://localhost:8080'  # TEI (Text Embeddings Inference) URL

  # Ollama (로컬)
  ollama:
    base_url: 'http://localhost:11434'
    model_name: 'nomic-embed-text'
    keep_alive: -1

  # Azure OpenAI
  azure:
    api_key: 'your-azure-key'
    api_version: '2024-02-01'
    base_url: 'https://xxx.openai.azure.com/'
    deployment_name: 'text-embedding-ada-002'

  # 공통 설정
  batch_size: 16
  max_tokens: 8191
  timeout: 60
  max_retries: 3

# ========== 서비스 헬스체크 설정 ==========
health_check:
  enabled: true
  interval: 60  # 초
  endpoints:
    ocr: '/health/ocr'
    chunking: '/health/chunking'
    embedding: '/health/embedding'
```

---

## 6. Task Executor 통합

**파일**: `rag/svr/task_executor.py` (수정 예시)

```python
from rag.connectors.factory import ServiceConnectorFactory

async def build_chunks(doc):
    """문서 청킹 (Connector 사용)"""

    # 청킹 커넥터 가져오기
    chunking_connector = ServiceConnectorFactory.get_connector('chunking')

    # 텍스트 추출 (OCR 포함)
    if doc.type == 'pdf' or doc.type == 'image':
        ocr_connector = ServiceConnectorFactory.get_connector('ocr')
        text = await extract_text_with_ocr(doc, ocr_connector)
    else:
        text = doc.content

    # 청킹 처리
    parser_config = doc.kb.parser_config
    chunks = chunking_connector.process(
        text=text,
        parser_config=parser_config
    )

    return chunks

async def embedding(chunks):
    """청크 임베딩 생성 (Connector 사용)"""

    # 임베딩 커넥터 가져오기
    embedding_connector = ServiceConnectorFactory.get_connector('embedding')

    # 텍스트 추출
    texts = [chunk['content'] for chunk in chunks]

    # 배치 임베딩 생성
    embeddings, token_count = await trio.to_thread.run_sync(
        embedding_connector.batch_process,
        texts,
        batch_size=16
    )

    # 청크에 임베딩 추가
    for i, chunk in enumerate(chunks):
        chunk['embedding'] = embeddings[i].tolist()
        chunk['token_count'] = token_count

    return chunks
```

---

## 7. API 명세 및 에러 핸들링

### 7.1 통합 API 엔드포인트

**파일**: `api/apps/connector_app.py`

```python
from flask import Blueprint, request, jsonify
from rag.connectors.factory import ServiceConnectorFactory

connector_bp = Blueprint('connector', __name__, url_prefix='/v1/connector')

@connector_bp.route('/ocr', methods=['POST'])
def ocr_endpoint():
    """
    OCR 서비스 엔드포인트

    POST /v1/connector/ocr
    {
        "image_base64": "...",
        "provider": "google",  # optional, 기본값은 설정 파일
        "device_id": 0,
        "return_confidence": true
    }

    Response:
    {
        "code": 0,
        "data": {
            "results": [
                {
                    "box": [[x1,y1], [x2,y2], [x3,y3], [x4,y4]],
                    "text": "extracted text",
                    "confidence": 0.95
                }
            ],
            "processing_time": 1.23
        }
    }
    """
    try:
        data = request.json
        image_base64 = data.get('image_base64')
        provider = data.get('provider')

        # 이미지 디코딩
        import base64
        import numpy as np
        import cv2
        image_bytes = base64.b64decode(image_base64)
        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        # OCR 커넥터 가져오기
        config = {'provider': provider} if provider else None
        ocr_connector = ServiceConnectorFactory.get_connector('ocr', config)

        # OCR 처리
        import time
        start = time.time()
        results = ocr_connector.process(
            image,
            device_id=data.get('device_id', 0),
            return_confidence=data.get('return_confidence', True)
        )
        processing_time = time.time() - start

        return jsonify({
            'code': 0,
            'data': {
                'results': [
                    {
                        'box': box,
                        'text': text,
                        'confidence': conf
                    }
                    for box, (text, conf) in results
                ],
                'processing_time': processing_time
            }
        })

    except Exception as e:
        return jsonify({
            'code': 500,
            'message': str(e)
        }), 500

@connector_bp.route('/chunk', methods=['POST'])
def chunk_endpoint():
    """
    청킹 서비스 엔드포인트

    POST /v1/connector/chunk
    {
        "text": "long text to chunk...",
        "provider": "langchain",  # optional
        "config": {
            "chunk_token_num": 512,
            "parser_id": "naive"
        }
    }

    Response:
    {
        "code": 0,
        "data": {
            "chunks": [
                {
                    "content": "chunk text",
                    "metadata": {...}
                }
            ],
            "chunk_count": 10
        }
    }
    """
    try:
        data = request.json
        text = data.get('text')
        provider = data.get('provider')
        config = data.get('config', {})

        # 청킹 커넥터 가져오기
        connector_config = {'provider': provider} if provider else None
        chunking_connector = ServiceConnectorFactory.get_connector(
            'chunking',
            connector_config
        )

        # 청킹 처리
        chunks = chunking_connector.process(
            text=text,
            parser_config=config
        )

        return jsonify({
            'code': 0,
            'data': {
                'chunks': chunks,
                'chunk_count': len(chunks)
            }
        })

    except Exception as e:
        return jsonify({
            'code': 500,
            'message': str(e)
        }), 500

@connector_bp.route('/embed', methods=['POST'])
def embed_endpoint():
    """
    임베딩 서비스 엔드포인트

    POST /v1/connector/embed
    {
        "texts": ["text1", "text2"],
        "provider": "openai",  # optional
        "is_query": false,
        "batch_size": 16
    }

    Response:
    {
        "code": 0,
        "data": {
            "embeddings": [[0.1, 0.2, ...], [0.3, 0.4, ...]],
            "token_count": 150,
            "dimensions": 1536
        }
    }
    """
    try:
        data = request.json
        texts = data.get('texts', [])
        provider = data.get('provider')
        is_query = data.get('is_query', False)
        batch_size = data.get('batch_size', 16)

        # 임베딩 커넥터 가져오기
        connector_config = {'provider': provider} if provider else None
        embedding_connector = ServiceConnectorFactory.get_connector(
            'embedding',
            connector_config
        )

        # 임베딩 생성
        if len(texts) > batch_size:
            embeddings, token_count = embedding_connector.batch_process(
                texts,
                batch_size=batch_size
            )
        else:
            embeddings, token_count = embedding_connector.process(
                texts,
                is_query=is_query
            )

        return jsonify({
            'code': 0,
            'data': {
                'embeddings': embeddings.tolist(),
                'token_count': token_count,
                'dimensions': embeddings.shape[1]
            }
        })

    except Exception as e:
        return jsonify({
            'code': 500,
            'message': str(e)
        }), 500

@connector_bp.route('/health', methods=['GET'])
def health_endpoint():
    """
    모든 서비스 헬스체크

    GET /v1/connector/health

    Response:
    {
        "code": 0,
        "data": {
            "ocr": {"status": "healthy", "provider": "local"},
            "chunking": {"status": "healthy", "provider": "internal"},
            "embedding": {"status": "healthy", "provider": "openai"}
        }
    }
    """
    try:
        health_status = {}

        for service_type in ['ocr', 'chunking', 'embedding']:
            try:
                connector = ServiceConnectorFactory.get_connector(service_type)
                is_healthy = connector.health_check()

                health_status[service_type] = {
                    'status': 'healthy' if is_healthy else 'unhealthy',
                    'provider': connector.provider_type
                }
            except Exception as e:
                health_status[service_type] = {
                    'status': 'error',
                    'message': str(e)
                }

        return jsonify({
            'code': 0,
            'data': health_status
        })

    except Exception as e:
        return jsonify({
            'code': 500,
            'message': str(e)
        }), 500
```

### 7.2 에러 핸들링 전략

**파일**: `rag/connectors/errors.py`

```python
class ConnectorError(Exception):
    """베이스 커넥터 에러"""
    pass

class ProviderNotFoundError(ConnectorError):
    """프로바이더를 찾을 수 없음"""
    pass

class ServiceUnavailableError(ConnectorError):
    """서비스 일시적 불가"""
    pass

class QuotaExceededError(ConnectorError):
    """API 쿼터 초과"""
    pass

class AuthenticationError(ConnectorError):
    """인증 실패"""
    pass

class TimeoutError(ConnectorError):
    """타임아웃"""
    pass
```

**파일**: `rag/connectors/base.py` (에러 핸들링 추가)

```python
class BaseConnector(ABC):
    """에러 핸들링 추가"""

    def _handle_error(self, error: Exception) -> Exception:
        """에러 분류 및 처리"""
        import requests

        # HTTP 에러 분류
        if isinstance(error, requests.exceptions.HTTPError):
            status_code = error.response.status_code

            if status_code == 401 or status_code == 403:
                return AuthenticationError(f"Authentication failed: {error}")
            elif status_code == 429:
                return QuotaExceededError(f"API quota exceeded: {error}")
            elif status_code >= 500:
                return ServiceUnavailableError(f"Service unavailable: {error}")

        # 타임아웃 에러
        elif isinstance(error, requests.exceptions.Timeout):
            return TimeoutError(f"Request timeout: {error}")

        # 기본 에러
        return ConnectorError(f"Unknown error: {error}")

    def process(self, *args, **kwargs):
        """에러 핸들링이 포함된 처리"""
        try:
            return self._process_impl(*args, **kwargs)
        except Exception as e:
            error = self._handle_error(e)
            self.logger.error(f"Process failed: {error}")
            raise error

    @abstractmethod
    def _process_impl(self, *args, **kwargs):
        """실제 처리 로직 (하위 클래스 구현)"""
        pass
```

### 7.3 모니터링 및 로깅

**파일**: `rag/connectors/monitoring.py`

```python
import logging
import time
from functools import wraps
from typing import Callable

class ConnectorMonitor:
    """
    커넥터 성능 모니터링

    - 처리 시간 측정
    - 에러율 추적
    - API 사용량 집계
    """

    def __init__(self):
        self.metrics = {
            'ocr': {'total': 0, 'success': 0, 'failed': 0, 'avg_time': 0},
            'chunking': {'total': 0, 'success': 0, 'failed': 0, 'avg_time': 0},
            'embedding': {'total': 0, 'success': 0, 'failed': 0, 'avg_time': 0}
        }
        self.logger = logging.getLogger('ConnectorMonitor')

    def track(self, service_type: str):
        """데코레이터: 서비스 호출 추적"""
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()

                try:
                    result = func(*args, **kwargs)

                    # 성공 기록
                    self.metrics[service_type]['total'] += 1
                    self.metrics[service_type]['success'] += 1

                    elapsed = time.time() - start_time
                    self._update_avg_time(service_type, elapsed)

                    self.logger.info(
                        f"{service_type} success | time: {elapsed:.3f}s"
                    )

                    return result

                except Exception as e:
                    # 실패 기록
                    self.metrics[service_type]['total'] += 1
                    self.metrics[service_type]['failed'] += 1

                    self.logger.error(
                        f"{service_type} failed | error: {str(e)}"
                    )

                    raise

            return wrapper
        return decorator

    def _update_avg_time(self, service_type: str, elapsed: float):
        """평균 처리 시간 업데이트"""
        metrics = self.metrics[service_type]
        total = metrics['success']

        if total == 1:
            metrics['avg_time'] = elapsed
        else:
            metrics['avg_time'] = (
                (metrics['avg_time'] * (total - 1) + elapsed) / total
            )

    def get_metrics(self) -> dict:
        """메트릭 조회"""
        return self.metrics

    def reset_metrics(self):
        """메트릭 초기화"""
        for service in self.metrics:
            self.metrics[service] = {
                'total': 0,
                'success': 0,
                'failed': 0,
                'avg_time': 0
            }

# 전역 모니터 인스턴스
monitor = ConnectorMonitor()

# 사용 예시
class OCRConnector(BaseConnector):

    @monitor.track('ocr')
    def process(self, image, **kwargs):
        return super().process(image, **kwargs)
```

---

## 8. 배포 전략 및 마이그레이션

### 8.1 단계적 마이그레이션 전략

**파일**: `rag/connectors/migration.py`

```python
"""
기존 코드 → 새 Connector 시스템 마이그레이션 전략

Phase 1: Backward Compatibility (하위 호환)
- 기존 API 유지하면서 내부적으로 Connector 사용
- 레거시 코드 점진적 교체

Phase 2: Dual Mode (이중 모드)
- 설정으로 레거시/신규 선택 가능
- A/B 테스트 및 성능 비교

Phase 3: Full Migration (완전 전환)
- 레거시 코드 제거
- Connector 시스템으로 완전 전환
"""

# 예시: 임베딩 레거시 래퍼
class LegacyEmbeddingWrapper:
    """
    기존 임베딩 코드와 호환되는 래퍼

    기존 코드:
        from rag.llm.embedding_model import OpenAIEmbed
        embedder = OpenAIEmbed(key, model_name)
        embeddings, tokens = embedder.encode(texts)

    새 코드 (내부):
        connector = ServiceConnectorFactory.get_connector('embedding')
        embeddings, tokens = connector.process(texts)
    """

    def __init__(self, key, model_name, base_url=None, **kwargs):
        # 설정 구성
        config = {
            'provider': 'openai',
            'api_key': key,
            'model_name': model_name,
            'base_url': base_url,
            **kwargs
        }

        # Connector 사용
        self.connector = ServiceConnectorFactory.get_connector(
            'embedding',
            config
        )

    def encode(self, texts: list):
        """기존 인터페이스 유지"""
        return self.connector.process(texts)

    def encode_queries(self, text: str):
        """기존 인터페이스 유지"""
        return self.connector.process([text], is_query=True)
```

### 8.2 Docker 배포 설정

**파일**: `docker-compose.yml` (확장)

```yaml
services:
  ragflow:
    image: ragflow:latest
    environment:
      # 기존 설정
      - MYSQL_PASSWORD=infini_rag_flow
      - MINIO_PASSWORD=infini_rag_flow

      # 새 Connector 설정
      - OCR_PROVIDER=local  # local | google | azure | aws
      - CHUNKING_PROVIDER=internal  # internal | langchain | semantic
      - EMBEDDING_PROVIDER=openai  # openai | huggingface | ollama

      # API 키 (환경 변수로 주입)
      - GOOGLE_VISION_API_KEY=${GOOGLE_VISION_API_KEY}
      - AZURE_CV_API_KEY=${AZURE_CV_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}

      # 외부 서비스 URL
      - HUGGINGFACE_TEI_URL=http://tei-service:8080
      - OLLAMA_URL=http://ollama:11434
      - SEMANTIC_CHUNKING_URL=http://semantic-chunker:8000

    depends_on:
      - mysql
      - minio
      - elasticsearch
      - redis
      - tei-service  # HuggingFace TEI (선택)
      - ollama  # Ollama (선택)

  # HuggingFace Text Embeddings Inference (선택적)
  tei-service:
    image: ghcr.io/huggingface/text-embeddings-inference:latest
    ports:
      - "8080:80"
    environment:
      - MODEL_ID=BAAI/bge-large-en-v1.5
    volumes:
      - ./data/tei-models:/data
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # Ollama (선택적 로컬 임베딩)
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ./data/ollama:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### 8.3 성능 최적화 전략

**파일**: `rag/connectors/optimization.py`

```python
import asyncio
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor
import numpy as np

class ParallelProcessor:
    """
    병렬 처리 최적화

    - 멀티 GPU OCR 처리
    - 배치 임베딩 병렬화
    - 비동기 API 호출
    """

    def __init__(self, max_workers: int = 4):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)

    async def parallel_ocr(
        self,
        images: List[np.ndarray],
        ocr_connector,
        device_count: int = 4
    ) -> List[List]:
        """멀티 GPU OCR 병렬 처리"""

        tasks = []
        for i, image in enumerate(images):
            device_id = i % device_count

            task = asyncio.get_event_loop().run_in_executor(
                self.executor,
                ocr_connector.process,
                image,
                device_id
            )
            tasks.append(task)

        return await asyncio.gather(*tasks)

    async def parallel_embedding(
        self,
        texts: List[str],
        embedding_connector,
        batch_size: int = 100
    ) -> np.ndarray:
        """대용량 텍스트 병렬 임베딩"""

        # 배치 분할
        batches = [
            texts[i:i + batch_size]
            for i in range(0, len(texts), batch_size)
        ]

        # 병렬 처리
        tasks = [
            asyncio.get_event_loop().run_in_executor(
                self.executor,
                embedding_connector.process,
                batch
            )
            for batch in batches
        ]

        results = await asyncio.gather(*tasks)

        # 결과 병합
        all_embeddings = np.vstack([r[0] for r in results])
        total_tokens = sum([r[1] for r in results])

        return all_embeddings, total_tokens
```

---

## 9. 종합 시스템 다이어그램

```
┌──────────────────────────────────────────────────────────────────┐
│                        RAGFlow Application                        │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│      Service Connector Layer (통합 레이어)                       │
│                           │                                       │
│  ┌────────────────────────┴────────────────────────┐             │
│  │     ServiceConnectorFactory                     │             │
│  │  - 싱글톤 패턴 인스턴스 관리                     │             │
│  │  - 설정 기반 프로바이더 선택                     │             │
│  │  - 헬스체크 & 재연결                            │             │
│  └─────┬──────────────┬──────────────┬─────────────┘             │
│        │              │              │                           │
│   ┌────▼────┐   ┌────▼─────┐  ┌─────▼──────┐                    │
│   │   OCR   │   │ Chunking │  │ Embedding  │                    │
│   │Connector│   │Connector │  │ Connector  │                    │
│   └────┬────┘   └────┬─────┘  └─────┬──────┘                    │
│        │             │               │                           │
│   ┌────▼────────┐    │          ┌────▼──────────┐               │
│   │ Monitoring  │    │          │ Error Handler │               │
│   │  + Retry    │    │          │  + Fallback   │               │
│   └─────────────┘    │          └───────────────┘               │
└──────────────────────┼───────────────────────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────────────────────┐
│    Provider Abstraction (추상화 레이어)                          │
│                      │                                            │
│   BaseOCR ◄──────────┼──────────► BaseChunker                    │
│   BaseEmbedding      │                                            │
│                      │                                            │
│   - health_check()   │                                            │
│   - process()        │                                            │
│   - _call_api()      │                                            │
└──────────────────────┼───────────────────────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────────────────────┐
│   External Services (외부 서비스)                                 │
│                      │                                            │
│  ┌──────────────┐   │   ┌──────────────┐   ┌──────────────┐     │
│  │ OCR Services │◄──┼──►│   Chunking   │   │  Embedding   │     │
│  │              │   │   │   Services   │   │   Services   │     │
│  │ • Local ONNX │   │   │              │   │              │     │
│  │ • Google     │   │   │ • Internal   │   │ • OpenAI     │     │
│  │ • Azure      │   │   │ • LangChain  │   │ • HuggingFace│     │
│  │ • AWS        │   │   │ • Semantic   │   │ • Ollama     │     │
│  └──────────────┘   │   └──────────────┘   └──────────────┘     │
└─────────────────────┴────────────────────────────────────────────┘

설정 관리:
conf/service_conf.yaml → 프로바이더 선택, API 키, 엔드포인트

특징:
1. 플러그인 아키텍처: 새 프로바이더 쉽게 추가
2. 하위 호환성: 기존 코드와 호환
3. 자동 폴백: 외부 API 실패 시 로컬로 자동 전환
4. 모니터링: 성능, 에러율, 사용량 추적
5. 비동기 지원: Trio와 통합 가능
```

---

## 10. 핵심 장점 요약

### 10.1 기술적 장점

| 측면 | 현재 (RAGFlow) | 새 Connector 시스템 |
|------|---------------|-------------------|
| **확장성** | 하드코딩된 프로바이더 | 플러그인 방식 확장 |
| **설정 관리** | 코드 내 설정 | YAML 기반 중앙 관리 |
| **에러 처리** | 개별 처리 | 통합 에러 핸들링 + 폴백 |
| **모니터링** | 제한적 로깅 | 성능 메트릭 + 헬스체크 |
| **테스트** | 외부 서비스 의존 | Mock Provider로 독립 테스트 |
| **마이그레이션** | 전면 교체 필요 | 점진적 마이그레이션 가능 |

### 10.2 운영상 장점

1. **멀티 클라우드 지원**: Google, Azure, AWS 등 자유롭게 전환
2. **비용 최적화**: 무료/저렴한 프로바이더 우선 사용, 실패 시 유료 서비스로 폴백
3. **성능 튜닝**: 각 서비스별 최적 프로바이더 선택 가능
4. **장애 격리**: 한 서비스 장애가 전체 시스템에 영향 최소화
5. **개발 효율**: 새 프로바이더 추가 시 기존 코드 수정 불필요

### 10.3 비즈니스 장점

1. **벤더 종속성 탈피**: 특정 클라우드 벤더에 종속되지 않음
2. **비용 예측 가능성**: 프로바이더별 비용 분석 및 최적화
3. **확장 용이성**: 신규 서비스 추가가 간단하고 빠름
4. **서비스 품질 향상**: 각 서비스별 최적 프로바이더 선택으로 품질 극대화
5. **리스크 관리**: 자동 폴백으로 서비스 중단 최소화

---

## 11. 실행 계획

### Phase 1: 기반 구축 (1-2주)

**목표**: 핵심 인프라 구축

- [ ] BaseConnector, ServiceConnectorFactory 구현
- [ ] service_conf.yaml 스키마 정의 및 검증
- [ ] 에러 핸들링 시스템 (errors.py)
- [ ] 모니터링 시스템 (monitoring.py)
- [ ] 단위 테스트 프레임워크

**산출물**:
- `rag/connectors/base.py`
- `rag/connectors/factory.py`
- `rag/connectors/errors.py`
- `rag/connectors/monitoring.py`
- `tests/connectors/test_base.py`

### Phase 2: OCR 통합 (1주)

**목표**: OCR 서비스 통합 완료

- [ ] OCRConnector 구현
- [ ] LocalONNXOCR Provider (기존 코드 래핑)
- [ ] Google Vision Provider 구현
- [ ] Azure Computer Vision Provider 구현
- [ ] AWS Textract Provider 구현 (선택)
- [ ] 폴백 로직 구현 및 테스트
- [ ] 통합 테스트 및 성능 벤치마크

**산출물**:
- `rag/connectors/ocr_connector.py`
- `rag/connectors/providers/ocr/local_onnx.py`
- `rag/connectors/providers/ocr/google_vision.py`
- `rag/connectors/providers/ocr/azure_cv.py`
- `tests/connectors/test_ocr.py`

### Phase 3: Embedding 통합 (1주)

**목표**: 임베딩 서비스 통합 완료

- [ ] EmbeddingConnector 구현
- [ ] 기존 30+ 프로바이더 마이그레이션
- [ ] 배치 처리 최적화
- [ ] 성능 벤치마크 (처리 시간, 메모리 사용량)
- [ ] 대용량 텍스트 처리 테스트

**산출물**:
- `rag/connectors/embedding_connector.py`
- `tests/connectors/test_embedding.py`
- 성능 벤치마크 리포트

### Phase 4: Chunking 통합 (1주)

**목표**: 청킹 서비스 통합 완료

- [ ] ChunkingConnector 구현
- [ ] InternalChunker Provider (기존 13개 파서 래핑)
- [ ] LangChain Provider 구현
- [ ] LlamaIndex Provider 구현 (선택)
- [ ] Semantic Chunking API Provider 구현 (선택)
- [ ] 청크 포맷 정규화 로직

**산출물**:
- `rag/connectors/chunking_connector.py`
- `rag/connectors/providers/chunking/internal.py`
- `rag/connectors/providers/chunking/langchain_chunker.py`
- `tests/connectors/test_chunking.py`

### Phase 5: 프로덕션 준비 (1주)

**목표**: 프로덕션 배포 준비

- [ ] REST API 엔드포인트 구현 (`api/apps/connector_app.py`)
- [ ] Task Executor 통합
- [ ] Docker 배포 설정 (docker-compose.yml)
- [ ] 환경 변수 및 설정 파일 관리
- [ ] 마이그레이션 가이드 작성
- [ ] API 문서화 (OpenAPI/Swagger)
- [ ] 부하 테스트 (동시 요청 처리)
- [ ] 성능 최적화 및 튜닝

**산출물**:
- `api/apps/connector_app.py`
- `docker-compose.yml` (업데이트)
- `docs/migration_guide.md`
- `docs/api_reference.md`
- 부하 테스트 리포트

### Phase 6: 마이그레이션 및 배포 (1주)

**목표**: 기존 시스템에서 신규 시스템으로 점진적 전환

- [ ] 레거시 래퍼 구현 (하위 호환성)
- [ ] A/B 테스트 설정
- [ ] 모니터링 대시보드 구축
- [ ] 프로덕션 배포
- [ ] 롤백 계획 및 검증
- [ ] 팀 교육 및 문서화

**산출물**:
- `rag/connectors/migration.py`
- 모니터링 대시보드
- 운영 매뉴얼

---

## 총 예상 기간

**6-7주** (1.5개월)

- Phase 1: 1-2주
- Phase 2: 1주
- Phase 3: 1주
- Phase 4: 1주
- Phase 5: 1주
- Phase 6: 1주

---

## 결론

본 외부 서비스 연결 아키텍처는 **확장성, 유지보수성, 안정성**을 모두 갖춘 시스템입니다.

**핵심 가치**:
1. **플러그인 아키텍처**로 새로운 프로바이더를 쉽게 추가
2. **하위 호환성**을 통한 점진적 마이그레이션
3. **자동 폴백**으로 서비스 안정성 극대화
4. **통합 모니터링**으로 운영 효율성 향상
5. **YAML 기반 설정**으로 관리 편의성 제공

이 설계를 기반으로 RAGFlow는 **엔터프라이즈급 외부 서비스 통합 시스템**을 구축할 수 있습니다.
