# RAGFlow 데이터셋(지식베이스) 구축 시스템 상세 분석

## 📋 목차
1. [데이터 모델 & 데이터베이스 스키마](#1-데이터-모델--데이터베이스-스키마)
2. [지식베이스 생성 & 관리 API](#2-지식베이스-생성--관리-api)
3. [문서 업로드 & 처리 파이프라인](#3-문서-업로드--처리-파이프라인)
4. [청킹(Chunking) 전략 & 텍스트 추출](#4-청킹chunking-전략--텍스트-추출)
5. [임베딩 생성 & 인덱싱](#5-임베딩-생성--인덱싱)
6. [프론트엔드 UI 컴포넌트](#6-프론트엔드-ui-컴포넌트)
7. [전체 워크플로우 요약](#7-전체-워크플로우-요약)

---

## 1. 데이터 모델 & 데이터베이스 스키마

### 핵심 데이터 모델 (Peewee ORM)

#### **Knowledgebase 모델** ([api/db/db_models.py:736-771](api/db/db_models.py#L736-L771))

```python
class Knowledgebase(DataBaseModel):
    # 기본 정보
    id = CharField(max_length=32, primary_key=True)  # UUID
    avatar = TextField(null=True)  # Base64 아바타
    tenant_id = CharField(max_length=32)  # 테넌트(사용자) ID
    name = CharField(max_length=128)  # KB 이름
    language = CharField(max_length=32, default="English|Chinese")
    description = TextField(null=True)

    # 모델 설정
    embd_id = CharField(max_length=128)  # 임베딩 모델 ID
    parser_id = CharField(max_length=32, default=ParserType.NAIVE.value)  # 파서 타입
    pipeline_id = CharField(max_length=32, null=True)  # 파이프라인 ID
    parser_config = JSONField(default={"pages": [[1, 1000000]]})  # 파서 설정

    # 통계 정보
    doc_num = IntegerField(default=0)  # 문서 수
    token_num = IntegerField(default=0)  # 총 토큰 수
    chunk_num = IntegerField(default=0)  # 총 청크 수

    # 검색 설정
    similarity_threshold = FloatField(default=0.2)  # 유사도 임계값
    vector_similarity_weight = FloatField(default=0.3)  # 벡터 가중치
    pagerank = IntegerField(default=0)  # PageRank 점수

    # 고급 기능 태스크
    graphrag_task_id = CharField(max_length=32, null=True)  # GraphRAG 태스크
    graphrag_task_finish_at = DateTimeField(null=True)
    raptor_task_id = CharField(max_length=32, null=True)  # RAPTOR 태스크
    raptor_task_finish_at = DateTimeField(null=True)
    mindmap_task_id = CharField(max_length=32, null=True)  # Mindmap 태스크
    mindmap_task_finish_at = DateTimeField(null=True)

    # 권한 & 상태
    permission = CharField(max_length=16, default="me")  # me|team
    created_by = CharField(max_length=32)
    status = CharField(max_length=1, default="1")  # 0: 삭제됨, 1: 유효
```

#### **Document 모델** ([api/db/db_models.py:773-799](api/db/db_models.py#L773-L799))

```python
class Document(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    thumbnail = TextField(null=True)  # 썸네일 Base64
    kb_id = CharField(max_length=256)  # 소속 KB ID

    # 파서 설정
    parser_id = CharField(max_length=32)
    pipeline_id = CharField(max_length=32, null=True)
    parser_config = JSONField(default={"pages": [[1, 1000000]]})

    # 파일 정보
    source_type = CharField(max_length=128, default="local")  # local|web|...
    type = CharField(max_length=32)  # 파일 확장자 (pdf, docx 등)
    suffix = CharField(max_length=32)  # 실제 파일 확장자
    name = CharField(max_length=255)  # 파일 이름
    location = CharField(max_length=255)  # 저장 위치
    size = IntegerField(default=0)  # 파일 크기

    # 처리 통계
    token_num = IntegerField(default=0)
    chunk_num = IntegerField(default=0)
    progress = FloatField(default=0)  # 0.0 ~ 1.0
    progress_msg = TextField(null=True)
    process_begin_at = DateTimeField(null=True)
    process_duration = FloatField(default=0)
    meta_fields = JSONField(null=True, default={})

    # 실행 상태
    run = CharField(max_length=1, default="0")  # 0: 대기, 1: 실행, 2: 취소
    status = CharField(max_length=1, default="1")  # 유효성
    created_by = CharField(max_length=32)
```

#### **File & File2Document 모델**

```python
class File(DataBaseModel):
    id = CharField(max_length=32, primary_key=True)
    parent_id = CharField(max_length=32)  # 폴더 구조
    tenant_id = CharField(max_length=32)
    name = CharField(max_length=255)
    location = CharField(max_length=255)
    size = IntegerField(default=0)
    type = CharField(max_length=32)  # file|folder
    source_type = CharField(max_length=128)

class File2Document(DataBaseModel):
    # File과 Document의 다대다 관계
    file_id = CharField(max_length=32)
    document_id = CharField(max_length=32)
```

### 데이터베이스 관계도

```
Tenant (User)
    ↓ 1:N
Knowledgebase
    ↓ 1:N
Document ←→ File (N:M via File2Document)
    ↓ 1:N
Chunk (Elasticsearch/Infinity에 저장)
```

---

## 2. 지식베이스 생성 & 관리 API

### 2.1 KB 생성 API

**엔드포인트**: `POST /v1/dataset/create` ([api/apps/kb_app.py:43-106](api/apps/kb_app.py#L43-L106))

**요청 본문**:
```json
{
  "name": "My Knowledge Base",
  "description": "Optional description",
  "parser_id": "naive",
  "embd_id": "BAAI/bge-large-zh-v1.5"
}
```

**처리 로직**:

```python
def create():
    req = request.json
    dataset_name = req["name"]

    # 1. 이름 유효성 검사
    if len(dataset_name.encode("utf-8")) > DATASET_NAME_LIMIT:
        return error

    # 2. 중복 이름 처리 (자동으로 "(1)" 추가)
    dataset_name = duplicate_name(
        KnowledgebaseService.query,
        name=dataset_name,
        tenant_id=current_user.id
    )

    # 3. 기본 파서 설정 생성
    req["parser_config"] = {
        "layout_recognize": "DeepDOC",  # Vision 모델 사용
        "chunk_token_num": 512,  # 청크당 토큰 수
        "delimiter": "\n",
        "auto_keywords": 0,  # LLM 키워드 추출 비활성화
        "auto_questions": 0,  # LLM 질문 생성 비활성화
        "html4excel": False,
        "topn_tags": 3,
        "raptor": {
            "use_raptor": True,
            "prompt": "...",
            "max_token": 256,
            "threshold": 0.1,
            "max_cluster": 64
        },
        "graphrag": {
            "use_graphrag": True,
            "entity_types": ["organization", "person", "geo", "event", "category"],
            "method": "light"
        }
    }

    # 4. UUID 생성 및 저장
    req["id"] = get_uuid()
    req["tenant_id"] = current_user.id
    KnowledgebaseService.save(**req)

    return {"kb_id": req["id"]}
```

**기본 파서 설정 상세**:

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `layout_recognize` | "DeepDOC" | Vision 모델로 레이아웃 분석 |
| `chunk_token_num` | 512 | 청크당 최대 토큰 수 |
| `delimiter` | "\n" | 텍스트 분할 구분자 |
| `auto_keywords` | 0 | LLM 키워드 추출 개수 (0=비활성화) |
| `auto_questions` | 0 | LLM 질문 생성 개수 (0=비활성화) |
| `raptor.use_raptor` | True | RAPTOR 알고리즘 활성화 |
| `graphrag.use_graphrag` | True | GraphRAG 엔티티 추출 활성화 |

### 2.2 KB 업데이트 API

**엔드포인트**: `POST /v1/dataset/update` ([api/apps/kb_app.py:109-170](api/apps/kb_app.py#L109-L170))

**주요 기능**:
- KB 이름, 설명, 파서 설정 변경
- `pagerank` 값 변경 시 Elasticsearch 인덱스 자동 업데이트
- 소유자만 수정 가능 (권한 검증)

### 2.3 KB 상세 조회 API

**엔드포인트**: `GET /v1/dataset/detail?kb_id=xxx` ([api/apps/kb_app.py:173-197](api/apps/kb_app.py#L173-L197))

**응답 예시**:
```json
{
  "id": "kb_uuid",
  "name": "My KB",
  "description": "...",
  "doc_num": 15,
  "chunk_num": 3420,
  "token_num": 850000,
  "size": 52428800,
  "parser_id": "naive",
  "embd_id": "BAAI/bge-large-zh-v1.5",
  "parser_config": {...},
  "graphrag_task_finish_at": "2025-01-15 10:30:00",
  "raptor_task_finish_at": "2025-01-15 11:45:00"
}
```

### 2.4 KB 삭제 API

**엔드포인트**: `POST /v1/dataset/rm` ([api/apps/kb_app.py:235-274](api/apps/kb_app.py#L235-L274))

**삭제 프로세스**:
```python
def rm():
    kb_id = request.json["kb_id"]

    # 1. 권한 검증 (소유자만 삭제 가능)
    if not KnowledgebaseService.accessible4deletion(kb_id, current_user.id):
        return error

    # 2. 모든 문서 삭제
    for doc in DocumentService.query(kb_id=kb_id):
        DocumentService.remove_document(doc, kb.tenant_id)
        # File2Document 관계 삭제
        File2DocumentService.delete_by_document_id(doc.id)
        # MinIO에서 파일 삭제
        FileService.filter_delete([File.id == file_id])

    # 3. KB 자체 삭제
    KnowledgebaseService.delete_by_id(kb_id)

    # 4. Elasticsearch 인덱스 삭제
    settings.docStoreConn.delete({"kb_id": kb_id}, index_name, kb_id)
    settings.docStoreConn.deleteIdx(index_name, kb_id)

    # 5. MinIO 버킷 삭제 (스토리지 지원 시)
    STORAGE_IMPL.remove_bucket(kb_id)
```

### 2.5 고급 기능 API

#### **GraphRAG 실행** ([api/apps/kb_app.py:544-588](api/apps/kb_app.py#L544-L588))
```python
POST /v1/dataset/run_graphrag
{
  "kb_id": "xxx"
}
```
→ 엔티티 추출 및 지식 그래프 생성 태스크 큐잉

#### **RAPTOR 실행** ([api/apps/kb_app.py:613-657](api/apps/kb_app.py#L613-L657))
```python
POST /v1/dataset/run_raptor
{
  "kb_id": "xxx"
}
```
→ 계층적 요약 트리 생성 태스크 큐잉

#### **지식 그래프 조회** ([api/apps/kb_app.py:352-389](api/apps/kb_app.py#L352-L389))
```python
GET /v1/dataset/<kb_id>/knowledge_graph
```
→ GraphRAG 결과 노드/엣지 반환 (최대 256 노드, 128 엣지)

---

## 3. 문서 업로드 & 처리 파이프라인

### 3.1 파일 업로드 API

**엔드포인트**: `POST /v1/document/upload` ([api/apps/document_app.py:52-83](api/apps/document_app.py#L52-L83))

**업로드 프로세스**:

```python
def upload():
    kb_id = request.form.get("kb_id")
    file_objs = request.files.getlist("file")

    # 1. 파일명 유효성 검사 (UTF-8 기준 최대 바이트 수)
    for file_obj in file_objs:
        if len(file_obj.filename.encode("utf-8")) > FILE_NAME_LEN_LIMIT:
            return error

    # 2. KB 존재 및 권한 확인
    kb = KnowledgebaseService.get_by_id(kb_id)
    if not check_kb_team_permission(kb, current_user.id):
        return error

    # 3. 파일 업로드 (MinIO)
    err, files = FileService.upload_document(kb, file_objs, current_user.id)

    return files
```

**FileService.upload_document 로직**:
```python
# 1. MinIO에 파일 저장
location = f"{kb_id}/{file_uuid}"
STORAGE_IMPL.put(bucket=kb_id, name=location, binary=file_data)

# 2. File 레코드 생성
file_record = {
    "id": file_uuid,
    "parent_id": kb_id,
    "tenant_id": tenant_id,
    "name": filename,
    "location": location,
    "size": file_size,
    "type": file_extension,
    "source_type": FileSource.KNOWLEDGEBASE
}
FileService.save(**file_record)

# 3. Document 레코드 생성
doc_record = {
    "id": doc_uuid,
    "kb_id": kb_id,
    "parser_id": kb.parser_id,  # KB의 기본 파서
    "parser_config": kb.parser_config,
    "name": filename,
    "type": file_extension,
    "size": file_size,
    "location": location,
    "run": TaskStatus.UNSTART  # 파싱 대기 상태
}
DocumentService.save(**doc_record)

# 4. File-Document 관계 생성
File2DocumentService.save(file_id=file_uuid, document_id=doc_uuid)
```

### 3.2 문서 파싱 태스크 큐잉

**엔드포인트**: `POST /v1/document/run` (문서 파싱 시작)

**태스크 생성 로직** ([api/db/services/document_service.py](api/db/services/document_service.py)):

```python
def queue_tasks(doc):
    task = {
        "id": get_uuid(),
        "doc_id": doc.id,
        "kb_id": doc.kb_id,
        "tenant_id": tenant_id,
        "parser_id": doc.parser_id,
        "parser_config": doc.parser_config,
        "embd_id": kb.embd_id,
        "llm_id": llm_id,
        "language": kb.language,
        "name": doc.name,
        "location": doc.location,
        "size": doc.size,
        "from_page": 0,
        "to_page": 100000,
        "task_type": "dataflow",
        "pagerank": kb.pagerank
    }

    # Redis Stream에 태스크 추가
    queue_name = get_svr_queue_name()
    REDIS_CONN.xadd(queue_name, {"message": json.dumps(task)})

    # Task 레코드 생성
    TaskService.save(**task)
```

### 3.3 태스크 실행자 (Worker)

**실행 파일**: [rag/svr/task_executor.py](rag/svr/task_executor.py)

**워커 아키텍처**:
```python
# 동시 실행 제한
MAX_CONCURRENT_TASKS = 5  # 최대 동시 태스크
MAX_CONCURRENT_CHUNK_BUILDERS = 1  # 청킹 작업
MAX_CONCURRENT_MINIO = 10  # MinIO 작업

task_limiter = trio.Semaphore(MAX_CONCURRENT_TASKS)
chunk_limiter = trio.CapacityLimiter(MAX_CONCURRENT_CHUNK_BUILDERS)
embed_limiter = trio.CapacityLimiter(MAX_CONCURRENT_CHUNK_BUILDERS)
minio_limiter = trio.CapacityLimiter(MAX_CONCURRENT_MINIO)

# Redis Stream Consumer Group
CONSUMER_GROUP_NAME = "task_executor"
CONSUMER_NAME = f"task_executor_{CONSUMER_NO}"
```

**메인 처리 함수**: `do_handle_task()` ([rag/svr/task_executor.py:759-890](rag/svr/task_executor.py#L759-L890))

```python
async def do_handle_task(task):
    task_id = task["id"]
    task_doc_id = task["doc_id"]
    task_kb_id = task["kb_id"]
    task_parser_config = task["parser_config"]
    task_embedding_id = task["embd_id"]

    progress_callback = partial(set_progress, task_id, ...)

    # 1. 임베딩 모델 로딩
    embedding_model = LLMBundle(
        tenant_id,
        LLMType.EMBEDDING,
        llm_name=task_embedding_id
    )

    # 2. 청킹 (문서 → 청크)
    chunks = await build_chunks(task, progress_callback)

    # 3. 임베딩 생성
    tk_count, vector_size = await embedding(
        chunks,
        embedding_model,
        task_parser_config,
        progress_callback
    )

    # 4. Elasticsearch 인덱싱
    await insert_es(task_id, tenant_id, task_kb_id, chunks, progress_callback)

    # 5. 문서 통계 업데이트
    DocumentService.update_by_id(task_doc_id, {
        "chunk_num": len(chunks),
        "token_num": tk_count,
        "progress": 1.0,
        "run": TaskStatus.DONE
    })

    # 6. KB 통계 업데이트
    KnowledgebaseService.update_by_id(task_kb_id, {
        "chunk_num": kb.chunk_num + len(chunks),
        "token_num": kb.token_num + tk_count
    })
```

---

## 4. 청킹(Chunking) 전략 & 텍스트 추출

### 4.1 파서 팩토리 시스템

**파서 타입별 구현** ([rag/svr/task_executor.py:74-91](rag/svr/task_executor.py#L74-L91)):

```python
FACTORY = {
    ParserType.NAIVE.value: naive,       # 일반 텍스트
    ParserType.QA.value: qa,             # Q&A 쌍
    ParserType.PAPER.value: paper,       # 논문
    ParserType.BOOK.value: book,         # 책
    ParserType.PRESENTATION.value: presentation,  # PPT
    ParserType.MANUAL.value: manual,     # 매뉴얼
    ParserType.LAWS.value: laws,         # 법률 문서
    ParserType.TABLE.value: table,       # 표 중심
    ParserType.RESUME.value: resume,     # 이력서
    ParserType.PICTURE.value: picture,   # 이미지
    ParserType.ONE.value: one,           # 단일 청크
    ParserType.AUDIO.value: audio,       # 오디오 → 텍스트
    ParserType.EMAIL.value: email,       # 이메일
    ParserType.TAG.value: tag            # 태그 추출
}
```

### 4.2 청킹 프로세스

**함수**: `build_chunks()` ([rag/svr/task_executor.py:262-381](rag/svr/task_executor.py#L262-L381))

```python
async def build_chunks(task, progress_callback):
    # 1. 파일 크기 검증
    if task["size"] > DOC_MAXIMUM_SIZE:
        raise Exception("File too large")

    # 2. 파서 선택
    chunker = FACTORY[task["parser_id"].lower()]

    # 3. MinIO에서 파일 가져오기
    bucket, name = File2DocumentService.get_storage_address(doc_id=task["doc_id"])
    binary = await get_storage_binary(bucket, name)

    # 4. 청킹 실행 (파서별 로직)
    async with chunk_limiter:
        cks = await trio.to_thread.run_sync(
            lambda: chunker.chunk(
                task["name"],
                binary=binary,
                from_page=task["from_page"],
                to_page=task["to_page"],
                lang=task["language"],
                callback=progress_callback,
                kb_id=task["kb_id"],
                parser_config=task["parser_config"],
                tenant_id=task["tenant_id"]
            )
        )

    # 5. 청크 메타데이터 추가
    docs = []
    for ck in cks:
        d = {
            "doc_id": task["doc_id"],
            "kb_id": str(task["kb_id"]),
            "content_with_weight": ck["content_with_weight"],
            "image": ck.get("image"),  # 이미지 청크
            ...ck  # 기타 메타데이터
        }

        # 이미지가 있으면 MinIO에 저장
        if d.get("image"):
            await image2id(d, STORAGE_IMPL.put, d["id"], task["kb_id"])

        docs.append(d)

    # 6. LLM 기반 증강 (선택적)
    if task["parser_config"].get("auto_keywords", 0):
        # 키워드 추출
        for d in docs:
            keywords = await keyword_extraction(chat_mdl, d["content_with_weight"], topn)
            d["important_kwd"] = keywords.split(",")

    if task["parser_config"].get("auto_questions", 0):
        # 질문 생성
        for d in docs:
            questions = await question_proposal(chat_mdl, d["content_with_weight"], topn)
            d["question_kwd"] = questions.split("\n")

    return docs
```

### 4.3 파서별 청킹 전략

#### **QA 파서** ([rag/app/qa.py:313](rag/app/qa.py#L313))

**목적**: Q&A 쌍 추출 (Excel, DOCX, PDF)

**청킹 로직**:
```python
def chunk(filename, binary, from_page, to_page, lang, callback, **kwargs):
    # 1. 파일 타입별 파서 선택
    if filename.lower().endswith(".xlsx"):
        excel_parser = Excel()
        res = excel_parser(filename, binary, callback)  # [(Q, A), ...]

    elif filename.lower().endswith(".docx"):
        docx_parser = Docx()
        res = docx_parser(filename, binary)

    elif filename.lower().endswith(".pdf"):
        pdf_parser = Pdf()
        res = pdf_parser(filename, binary, from_page, to_page, callback)

    # 2. Q&A 쌍을 청크로 변환
    chunks = []
    for question, answer in res:
        chunk = {
            "content_with_weight": f"Question: {question}\nAnswer: {answer}",
            "content_ltks": rag_tokenizer.tokenize(question + " " + answer),
            "q": question,
            "a": answer
        }
        chunks.append(chunk)

    return chunks
```

#### **Naive 파서** ([rag/app/naive.py:433](rag/app/naive.py#L433))

**목적**: 일반 텍스트 문서 (가장 범용적)

**청킹 단계**:
```python
def chunk(filename, binary, from_page, to_page, lang, callback, parser_config, **kwargs):
    # 1. 파일 타입별 텍스트 추출
    if is_pdf(filename):
        # DeepDoc Vision 파서 사용
        sections = pdf_parser(binary, from_page, to_page, callback)
    elif is_docx(filename):
        sections = docx_parser(binary)
    elif is_excel(filename):
        sections = excel_parser(binary)
    elif is_pptx(filename):
        sections = pptx_parser(binary)

    # 2. 섹션을 토큰 수 기준으로 청킹
    chunk_token_num = parser_config.get("chunk_token_num", 512)
    delimiter = parser_config.get("delimiter", "\n")

    chunks = []
    current_chunk = ""
    current_tokens = 0

    for section in sections:
        section_tokens = num_tokens_from_string(section["text"])

        if current_tokens + section_tokens > chunk_token_num:
            # 현재 청크 완료
            chunks.append({
                "content_with_weight": current_chunk,
                "content_ltks": rag_tokenizer.tokenize(current_chunk),
                "page_num": section["page_num"],
                "top": section["layout_bbox"]["top"],
                "image": section.get("image")  # 스크린샷
            })
            current_chunk = section["text"]
            current_tokens = section_tokens
        else:
            current_chunk += delimiter + section["text"]
            current_tokens += section_tokens

    # 3. 마지막 청크 추가
    if current_chunk:
        chunks.append(...)

    return chunks
```

#### **Table 파서** ([rag/app/table.py:302](rag/app/table.py#L302))

**목적**: 표 중심 문서 (데이터 정확성 중시)

**특징**:
- 표 구조 인식 (DeepDoc Vision)
- 표를 Markdown 형식으로 변환
- 각 표를 독립적인 청크로 생성

```python
def chunk(filename, binary, lang, callback, **kwargs):
    # 1. PDF에서 표 추출 (Vision 모델)
    tables = pdf_parser.extract_tables(binary, callback)

    chunks = []
    for table in tables:
        # 2. HTML 표 → Markdown 변환
        markdown_table = html_table_to_markdown(table["html"])

        # 3. 청크 생성 (표 단위)
        chunk = {
            "content_with_weight": markdown_table,
            "content_ltks": tokenize_table(markdown_table),
            "page_num": table["page_num"],
            "table_id": table["id"],
            "image": table["screenshot"]  # 표 이미지
        }
        chunks.append(chunk)

    return chunks
```

### 4.4 DeepDoc Vision 파서

**PDF 처리 파이프라인** ([rag/app/qa.py:79-99](rag/app/qa.py#L79-L99)):

```python
class Pdf(PdfParser):
    def __call__(self, filename, binary, from_page, to_page, zoomin=3, callback):
        # 1. OCR (광학 문자 인식)
        self.__images__(binary, zoomin, from_page, to_page, callback)
        callback(msg="OCR finished")

        # 2. 레이아웃 인식 (10가지 레이아웃 타입)
        self._layouts_rec(zoomin, drop=False)
        callback(msg="Layout analysis finished")
        # 레이아웃 타입: Text, Title, Figure, Caption, Table,
        #               Table Caption, Header, Footer, Reference, Equation

        # 3. 표 구조 인식 (5가지 표 컴포넌트)
        self._table_transformer_job(zoomin)
        callback(msg="Table analysis finished")

        # 4. Q&A 쌍 추출
        qa_pairs = self._extract_qa_pairs()

        return qa_pairs
```

**Vision 모델 활용**:
- **OCR**: 텍스트 위치 + 내용 추출
- **Layout Recognition**: 문서 구조 분석 (제목, 본문, 표, 그림 등)
- **Table Recognition**: 표 셀 구조 인식

---

## 5. 임베딩 생성 & 인덱싱

### 5.1 임베딩 생성 프로세스

**함수**: `embedding()` ([rag/svr/task_executor.py:462-511](rag/svr/task_executor.py#L462-L511))

```python
async def embedding(docs, mdl, parser_config, callback):
    # 1. 텍스트 준비 (제목 + 내용)
    tts, cnts = [], []  # titles, contents
    for d in docs:
        tts.append(d.get("docnm_kwd", "Title"))

        # 우선순위: 질문 > 원본 내용
        c = "\n".join(d.get("question_kwd", []))
        if not c:
            c = d["content_with_weight"]

        # HTML 테이블 태그 제거
        c = re.sub(r"</?(table|td|caption|tr|th)>", " ", c)
        cnts.append(c)

    # 2. 제목 임베딩 (모든 청크에 동일한 제목 벡터 사용)
    title_vecs, token_count = mdl.encode(tts[0:1])
    tts_embeds = np.repeat(title_vecs[0], len(tts), axis=0)

    # 3. 내용 임베딩 (배치 처리)
    content_embeds = []
    for i in range(0, len(cnts), EMBEDDING_BATCH_SIZE):
        batch = cnts[i:i+EMBEDDING_BATCH_SIZE]

        # 최대 길이 자르기
        batch_truncated = [truncate(c, mdl.max_length-10) for c in batch]

        async with embed_limiter:
            vecs, count = await trio.to_thread.run_sync(
                lambda: mdl.encode(batch_truncated)
            )

        content_embeds.append(vecs)
        token_count += count
        callback(prog=0.7 + 0.2 * (i+1)/len(cnts), msg="")

    content_embeds = np.concatenate(content_embeds, axis=0)

    # 4. 가중 평균 (제목 + 내용)
    filename_embd_weight = parser_config.get("filename_embd_weight", 0.1)
    title_w = float(filename_embd_weight)

    final_vecs = (title_w * tts_embeds + (1 - title_w) * content_embeds)

    # 5. 벡터를 문서에 추가
    vector_size = final_vecs.shape[1]
    for i, d in enumerate(docs):
        d[f"q_{vector_size}_vec"] = final_vecs[i].tolist()

    return token_count, vector_size
```

**임베딩 모델 지원**:
- **BAAI/bge-large-zh-v1.5** (중국어)
- **BAAI/bge-large-en-v1.5** (영어)
- **OpenAI text-embedding-3-small/large**
- **Infinity SDK** (로컬 배포)
- **Voyager AI**, **Cohere Embed v3**

### 5.2 Elasticsearch 인덱싱

**함수**: `insert_es()` ([rag/svr/task_executor.py:731-756](rag/svr/task_executor.py#L731-L756))

```python
async def insert_es(task_id, tenant_id, kb_id, chunks, progress_callback):
    # 배치 인서트 (DOC_BULK_SIZE = 4)
    for b in range(0, len(chunks), DOC_BULK_SIZE):
        batch = chunks[b:b+DOC_BULK_SIZE]

        # Elasticsearch bulk insert
        doc_store_result = await trio.to_thread.run_sync(
            lambda: settings.docStoreConn.insert(
                batch,
                index_name=search.index_name(tenant_id),
                kb_id=kb_id
            )
        )

        if doc_store_result:
            # 실패 시 롤백
            progress_callback(-1, msg=f"Insert chunk error: {doc_store_result}")
            raise Exception(doc_store_result)

        # Task에 chunk_ids 기록 (롤백용)
        chunk_ids = [chunk["id"] for chunk in batch]
        TaskService.update_chunk_ids(task_id, " ".join(chunk_ids))

        progress_callback(prog=0.8 + 0.1*(b+1)/len(chunks), msg="")

    return True
```

### 5.3 Elasticsearch 인덱스 구조

**인덱스 이름**: `{tenant_id}_{kb_id}`

**필드 매핑** (추정):
```json
{
  "mappings": {
    "properties": {
      "id": {"type": "keyword"},
      "doc_id": {"type": "keyword"},
      "kb_id": {"type": "keyword"},
      "docnm_kwd": {"type": "keyword"},
      "title_tks": {"type": "text", "analyzer": "ik_max_word"},
      "content_with_weight": {"type": "text"},
      "content_ltks": {"type": "text", "analyzer": "ik_max_word"},
      "content_sm_ltks": {"type": "text", "analyzer": "ik_smart"},
      "q_1024_vec": {"type": "dense_vector", "dims": 1024},
      "important_kwd": {"type": "keyword"},
      "question_kwd": {"type": "keyword"},
      "tag_kwd": {"type": "keyword"},
      "page_num": {"type": "integer"},
      "top": {"type": "float"},
      "img_id": {"type": "keyword"},
      "create_time": {"type": "date"},
      "pagerank": {"type": "integer"}
    }
  }
}
```

**벡터 필드 동적 생성**:
- `q_768_vec` (BAAI/bge-large)
- `q_1024_vec` (OpenAI ada-002)
- `q_1536_vec` (OpenAI text-embedding-3-small)

---

## 6. 프론트엔드 UI 컴포넌트

### 6.1 데이터셋 목록 페이지

**컴포넌트**: [web/src/pages/datasets/index.tsx](web/src/pages/datasets/index.tsx)

**주요 기능**:
```tsx
export default function Datasets() {
  const { kbs, total, pagination, setPagination } = useFetchNextKnowledgeListByPage();
  const { visible, showModal, onCreateOk } = useSaveKnowledge();

  return (
    <section>
      {/* 필터 & 검색 바 */}
      <ListFilterBar
        title="Dataset"
        onSearchChange={handleInputChange}
        filters={owners}
      >
        <Button onClick={showModal}>Create Knowledge Base</Button>
      </ListFilterBar>

      {/* 데이터셋 카드 그리드 */}
      <CardContainer>
        {kbs.map(dataset => (
          <DatasetCard
            dataset={dataset}
            key={dataset.id}
            showRenameModal={showDatasetRenameModal}
          />
        ))}
      </CardContainer>

      {/* 페이지네이션 */}
      <RAGFlowPagination
        total={total}
        pagination={pagination}
        onChange={handlePageChange}
      />

      {/* 생성 다이얼로그 */}
      <DatasetCreatingDialog
        visible={visible}
        onOk={onCreateOk}
        loading={creatingLoading}
      />
    </section>
  );
}
```

### 6.2 데이터셋 생성 다이얼로그

**컴포넌트**: `DatasetCreatingDialog`

**입력 필드**:
```tsx
<Form>
  <FormField name="name" label="Dataset Name">
    <Input placeholder="My Knowledge Base" />
  </FormField>

  <FormField name="description" label="Description">
    <Textarea placeholder="Optional description" />
  </FormField>

  <FormField name="parser_id" label="Parser Type">
    <Select>
      <option value="naive">General</option>
      <option value="qa">Q&A</option>
      <option value="manual">Manual</option>
      <option value="paper">Academic Paper</option>
      <option value="book">Book</option>
      <option value="laws">Legal Document</option>
      <option value="presentation">Presentation</option>
      <option value="table">Table</option>
      <option value="resume">Resume</option>
      <option value="picture">Image</option>
      <option value="one">Single Chunk</option>
      <option value="audio">Audio</option>
      <option value="email">Email</option>
    </Select>
  </FormField>

  <FormField name="embd_id" label="Embedding Model">
    <Select>
      <option value="BAAI/bge-large-zh-v1.5">BAAI BGE Large (Chinese)</option>
      <option value="BAAI/bge-large-en-v1.5">BAAI BGE Large (English)</option>
      <option value="text-embedding-3-small">OpenAI ada-002</option>
    </Select>
  </FormField>
</Form>
```

### 6.3 데이터셋 상세 페이지

**라우트**: `/datasets/{kb_id}`

**주요 섹션**:
```tsx
<DatasetDetail>
  {/* 헤더 */}
  <Header>
    <Title>{kb.name}</Title>
    <Stats>
      <Stat label="Documents" value={kb.doc_num} />
      <Stat label="Chunks" value={kb.chunk_num} />
      <Stat label="Tokens" value={kb.token_num} />
      <Stat label="Size" value={formatBytes(kb.size)} />
    </Stats>
  </Header>

  {/* 탭 네비게이션 */}
  <Tabs>
    <Tab label="Documents" />
    <Tab label="Configuration" />
    <Tab label="Graph" />
    <Tab label="Logs" />
  </Tabs>

  {/* 문서 목록 탭 */}
  <DocumentList>
    <UploadButton onClick={handleUpload}>Upload Files</UploadButton>
    <DocumentTable
      documents={documents}
      onDelete={handleDelete}
      onReparse={handleReparse}
    />
  </DocumentList>

  {/* 설정 탭 */}
  <ConfigurationPanel>
    <ParserConfig config={kb.parser_config} onChange={handleConfigChange} />
    <EmbeddingModelSelector value={kb.embd_id} onChange={handleModelChange} />
  </ConfigurationPanel>

  {/* 지식 그래프 탭 */}
  <KnowledgeGraph kb_id={kb.id} />
</DatasetDetail>
```

### 6.4 문서 업로드 컴포넌트

```tsx
<Dropzone onDrop={handleFileDrop}>
  <input type="file" multiple accept=".pdf,.docx,.xlsx,.pptx,.txt,.md" />
  <UploadIcon />
  <p>Drag and drop files here, or click to select files</p>
  <p className="text-sm text-muted">Supported formats: PDF, DOCX, XLSX, PPTX, TXT, MD</p>
</Dropzone>

{/* 업로드 진행률 */}
{uploadingFiles.map(file => (
  <UploadProgress
    key={file.id}
    filename={file.name}
    progress={file.progress}
    status={file.status}  // uploading|parsing|done|failed
  />
))}
```

---

## 7. 전체 워크플로우 요약

### 7.1 완전한 지식베이스 구축 플로우

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. 지식베이스 생성 (Frontend)                                     │
│    - 이름, 설명, 파서 타입, 임베딩 모델 선택                        │
│    - POST /v1/dataset/create                                      │
└──────────────┬───────────────────────────────────────────────────┘
               ↓
┌──────────────▼───────────────────────────────────────────────────┐
│ 2. Knowledgebase 레코드 생성 (Backend)                            │
│    - UUID 생성, parser_config 초기화                              │
│    - MySQL에 저장                                                 │
└──────────────┬───────────────────────────────────────────────────┘
               ↓
┌──────────────▼───────────────────────────────────────────────────┐
│ 3. 파일 업로드 (Frontend → Backend)                               │
│    - POST /v1/document/upload (multipart/form-data)              │
│    - 여러 파일 동시 업로드 가능                                     │
└──────────────┬───────────────────────────────────────────────────┘
               ↓
┌──────────────▼───────────────────────────────────────────────────┐
│ 4. 파일 저장 (Backend)                                            │
│    ├─ MinIO에 바이너리 저장 (bucket: kb_id, key: file_uuid)      │
│    ├─ File 레코드 생성 (parent_id, location, size)                │
│    ├─ Document 레코드 생성 (kb_id, parser_id, run=UNSTART)        │
│    └─ File2Document 관계 생성                                     │
└──────────────┬───────────────────────────────────────────────────┘
               ↓
┌──────────────▼───────────────────────────────────────────────────┐
│ 5. 파싱 태스크 큐잉 (Backend)                                      │
│    - Task 레코드 생성 (task_type="dataflow")                      │
│    - Redis Stream에 추가 (queue_name)                             │
│    - Document.run = RUNNING                                       │
└──────────────┬───────────────────────────────────────────────────┘
               ↓
┌──────────────▼───────────────────────────────────────────────────┐
│ 6. Worker가 태스크 처리 (task_executor.py)                        │
│    ┌──────────────────────────────────────────────────┐          │
│    │ 6.1 MinIO에서 파일 가져오기                        │          │
│    │     → get_storage_binary(bucket, name)            │          │
│    └──────────────┬───────────────────────────────────┘          │
│                   ↓                                               │
│    ┌──────────────▼───────────────────────────────────┐          │
│    │ 6.2 청킹 (build_chunks)                            │          │
│    │     ├─ 파서 선택 (FACTORY[parser_id])              │          │
│    │     ├─ Vision 파싱 (PDF: OCR + Layout + Table)    │          │
│    │     ├─ 텍스트 추출 & 분할 (토큰 수 기준)            │          │
│    │     ├─ LLM 증강 (auto_keywords, auto_questions)   │          │
│    │     └─ 이미지 청크 MinIO 저장                       │          │
│    └──────────────┬───────────────────────────────────┘          │
│                   ↓                                               │
│    ┌──────────────▼───────────────────────────────────┐          │
│    │ 6.3 임베딩 생성 (embedding)                        │          │
│    │     ├─ 임베딩 모델 로딩 (LLMBundle)                 │          │
│    │     ├─ 제목 + 내용 임베딩 (배치 처리)                │          │
│    │     ├─ 가중 평균 (filename_embd_weight=0.1)        │          │
│    │     └─ 벡터를 청크에 추가 (q_{size}_vec)            │          │
│    └──────────────┬───────────────────────────────────┘          │
│                   ↓                                               │
│    ┌──────────────▼───────────────────────────────────┐          │
│    │ 6.4 Elasticsearch 인덱싱 (insert_es)               │          │
│    │     ├─ 배치 인서트 (DOC_BULK_SIZE=4)               │          │
│    │     ├─ 인덱스: {tenant_id}_{kb_id}                │          │
│    │     ├─ 벡터 필드, 전문 검색 필드, 메타데이터          │          │
│    │     └─ chunk_ids 기록 (롤백용)                      │          │
│    └──────────────┬───────────────────────────────────┘          │
│                   ↓                                               │
│    ┌──────────────▼───────────────────────────────────┐          │
│    │ 6.5 통계 업데이트                                   │          │
│    │     ├─ Document (chunk_num, token_num, run=DONE)  │          │
│    │     └─ Knowledgebase (chunk_num↑, token_num↑)     │          │
│    └───────────────────────────────────────────────────┘          │
└──────────────┬─���─────────────────────────────────────────────────┘
               ↓
┌──────────────▼───────────────────────────────────────────────────┐
│ 7. 고급 기능 실행 (선택적)                                          │
│    ┌──────────────────────────────────────────────────┐          │
│    │ 7.1 GraphRAG (POST /v1/dataset/run_graphrag)      │          │
│    │     ├─ 엔티티 추출 (organization, person, geo...)  │          │
│    │     ├─ 관계 추출 (엔티티 간 연결)                    │          │
│    │     └─ 지식 그래프 Elasticsearch 저장                │          │
│    └──────────────────────────────────────────────────┘          │
│    ┌──────────────────────────────────────────────────┐          │
│    │ 7.2 RAPTOR (POST /v1/dataset/run_raptor)          │          │
│    │     ├─ 청크 클러스터링 (계층적)                      │          │
│    │     ├─ LLM 요약 (각 클러스터)                        │          │
│    │     └─ 요약 청크 인덱싱 (트리 구조)                  │          │
│    └──────────────────────────────────────────────────┘          │
└──────────────┬───────────────────────────────────────────────────┘
               ↓
┌──────────────▼───────────────────────────────────────────────────┐
│ 8. 지식베이스 사용 가능                                             │
│    - 하이브리드 검색 (벡터 + 키워드)                                 │
│    - 재순위화 (Reranking)                                          │
│    - RAG 기반 채팅                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 데이터 플로우 다이어그램

```
User (Frontend)
    ↓ [파일 업로드]
MinIO (Object Storage)
    ↓ [바이너리 저장]
MySQL (Metadata DB)
    ↓ [File, Document, Task 레코드]
Redis Stream (Task Queue)
    ↓ [태스크 큐잉]
task_executor.py (Worker)
    ├─→ [1] MinIO에서 파일 가져오기
    ├─→ [2] Vision 파서 (OCR, Layout, Table)
    ├─→ [3] 청킹 (파서별 로직)
    ├─→ [4] LLM 증강 (키워드, 질문)
    ├─→ [5] 임베딩 생성 (배치)
    └─→ [6] Elasticsearch 인덱싱
         ↓
Elasticsearch (Vector + Full-text Index)
    ↓ [검색 가능]
RAG Pipeline (검색 → 재순위화 → LLM 생성)
```

### 7.3 주요 성능 지표

| 단계 | 소요 시간 (예상) | 병목 요인 |
|------|------------------|----------|
| 파일 업로드 | 1-10초 | 네트워크 대역폭 |
| MinIO 저장 | <1초 | 스토리지 I/O |
| Vision 파싱 (PDF) | 2-30초/페이지 | GPU 가용성, 이미지 해상도 |
| 청킹 | 1-5초/문서 | 텍스트 복잡도 |
| LLM 증강 | 10-60초/청크 | LLM API 레이트 리밋 |
| 임베딩 생성 | 0.1-1초/배치(16청크) | GPU/임베딩 모델 |
| Elasticsearch 인덱싱 | 0.5-2초/배치(4청크) | ES 클러스터 성능 |

**전체 처리 시간 예시**:
- 10페이지 PDF → 약 50개 청크 → 2-5분 (Vision 파싱 포함)
- 100페이지 PDF → 약 500개 청크 → 20-50분
- 1000개 DOCX → 병렬 처리로 3-10시간

### 7.4 확장성 고려사항

**동시 처리**:

```python
MAX_CONCURRENT_TASKS = 5          # 동시 태스크
MAX_CONCURRENT_CHUNK_BUILDERS = 1 # 청킹 작업 (CPU 집약)
MAX_CONCURRENT_MINIO = 10         # MinIO I/O
EMBEDDING_BATCH_SIZE = 16         # 임베딩 배치
DOC_BULK_SIZE = 4                 # Elasticsearch 배치
```

**스케일링 전략**:

1. **수평 확장**: Worker 인스턴스 증가
2. **GPU 활용**: Vision 파싱 & 임베딩 가속
3. **ES 샤딩**: 인덱스 분산
4. **캐싱**: LLM 호출 결과 Redis 캐싱

---

## 8. 핵심 파일 참조 인덱스

| 기능 | 파일 경로 |
|------|----------|
| **데이터 모델** | [api/db/db_models.py:736-815](api/db/db_models.py#L736-L815) |
| **KB API** | [api/apps/kb_app.py](api/apps/kb_app.py) |
| **문서 API** | [api/apps/document_app.py](api/apps/document_app.py) |
| **파일 서비스** | [api/db/services/file_service.py](api/db/services/file_service.py) |
| **KB 서비스** | [api/db/services/knowledgebase_service.py](api/db/services/knowledgebase_service.py) |
| **문서 서비스** | [api/db/services/document_service.py](api/db/services/document_service.py) |
| **태스크 실행자** | [rag/svr/task_executor.py](rag/svr/task_executor.py) |
| **QA 파서** | [rag/app/qa.py](rag/app/qa.py) |
| **Naive 파서** | [rag/app/naive.py](rag/app/naive.py) |
| **Table 파서** | [rag/app/table.py](rag/app/table.py) |
| **프론트엔드** | [web/src/pages/datasets/](web/src/pages/datasets/) |

---

## 요약

RAGFlow의 데이터셋(지식베이스) 구축 시스템은 **엔터프라이즈급 문서 처리 파이프라인**으로, 다음과 같은 특징을 가집니다:

✅ **멀티 파서 지원**: 13개 문서 타입별 최적화된 파싱 전략
✅ **Vision AI 통합**: DeepDoc으로 OCR, 레이아웃, 표 구조 자동 인식
✅ **지능형 청킹**: 토큰 수 기반 + 문서 구조 고려
✅ **LLM 증강**: 자동 키워드 추출, 질문 생성, 태깅
✅ **하이브리드 검색**: 벡터 유사도 + 전문 검색 결합
✅ **확장성**: Worker 수평 확장, GPU 가속, 비동기 처리
✅ **고급 기능**: GraphRAG, RAPTOR, Mindmap 지원

이 시스템은 **대규모 문서 컬렉션**을 효율적으로 처리하고, **고품질의 검색 결과**를 제공하여 RAG 성능을 극대화합니다.
