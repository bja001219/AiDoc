# PublicBid AI Assistant — Design Specification

Document ID: 2026-08-18-public-bid-ai-assistant-design
Status: ACTIVE
Owner: bja001219@gmail.com
Last updated: 2026-08-18

> 이 문서는 **무엇을 만들 것인가**를 정의한다.
> 세션 사이의 source of truth이며, 사소한 구현 상태 때문에 수정하지 않는다.
> 설계 자체가 변경될 때만 개정한다.

---

## 1. Product Goal

공공기관 AI/SI 사업의 제안 및 PM 업무를 보조하는 웹 서비스.
사용자가 나라장터 등의 RFP PDF를 업로드하면, AI가 문서를 분석하여
사업 개요, 요구사항, 참가조건, 평가 기준, 리스크, 회사 역량 대비 적합도,
Go / No-Go 판단, 제안 전략, 제안서 목차를 구조화된 UI로 제공한다.

핵심 가치:

> "우리 회사가 이 사업에 참여할 만한가?" 라는 질문에 대한
> 의사결정 보조를 AI로 자동화한다.

---

## 2. Target User

- 공공사업 제안 담당자 (Proposal Manager)
- 공공 SI 프로젝트 PM
- 사업개발/영업 담당자

이들은 100~300페이지 분량의 RFP를 반복적으로 읽고 정리해야 하며,
사업 참여 여부를 빠르게 판단해야 한다.

---

## 3. User Scenario

1. 사용자가 서비스에 접속한다.
2. 회사 프로필(기술 스택, 인력, 실적)을 확인/편집한다.
3. RFP PDF를 업로드한다.
4. `Analyze RFP` 버튼을 누른다.
5. 몇 초~수십 초 후 다음이 표시된다.
   - 사업 개요
   - 요구사항 표
   - 참가 자격
   - 평가 기준
   - 제출 자료
   - 리스크
   - Company Fit 결과
   - Go / Conditional Go / No-Go
   - 제안 전략 3~5개
   - 제안서 목차
6. 사용자는 각 결과 옆에 표시된 source page를 참고해 원문을 확인한다.

---

## 4. MVP Scope

- 단일 페이지 대시보드
- PDF 업로드 (단일 파일)
- 백엔드 PDF 파싱 (PyMuPDF)
- OpenAI 기반 RFP 분석
- Mock / Live 모드 전환
- 회사 프로필 입력(로컬 상태만, DB 저장 X)
- 결과 시각화
- 최소한의 테스트 (backend + frontend)

## 5. Non-Goals

포함하지 않는 것:

- 로그인/회원가입/OAuth
- DB (PostgreSQL, Redis 등)
- Vector DB / RAG 인프라
- Celery / Kafka / background worker
- 실제 나라장터 API 연동
- 입찰 제출 / 결제
- OCR (텍스트가 추출되지 않는 PDF는 오류 반환)
- Kubernetes / 마이크로서비스
- 대규모 문서 저장 (분석 후 즉시 삭제)
- Docker (명확한 필요성 없음)

YAGNI 원칙을 엄격히 적용한다.

---

## 6. Functional Requirements

### FR-01. RFP PDF 업로드
- Drag & Drop 및 파일 선택 지원
- MIME 및 확장자 검증 (application/pdf, .pdf)
- 최대 파일 크기 제한 (예: 25MB)

### FR-02. PDF 파싱
- PyMuPDF로 페이지별 텍스트 추출
- 페이지 번호 유지 (source page 연결용)
- 텍스트가 거의 없으면 오류 응답

### FR-03. RFP 구조 분석 (LLM)
- OpenAI SDK로 structured output 요청
- Pydantic으로 응답 검증
- 다음 항목 추출:
  - project_overview
  - requirements (id/category/title/description/importance/page/evidence)
  - eligibility
  - evaluation
  - required_documents
  - risks (technical/security/schedule/business)
  - company_fit
  - bid_decision (GO / CONDITIONAL_GO / NO_GO + score)
  - proposal_strategy
  - proposal_outline

### FR-04. Company Fit
- 사용자가 입력한 회사 프로필과 RFP 요구사항을 비교
- 적합 / 확인 필요 / 부족 3분류
- 가능하면 requirement id 및 페이지 참조

### FR-05. Go / No-Go 판단
- 세 가지 결과 중 하나: GO / CONDITIONAL_GO / NO_GO
- 100점 만점 참고 score
- Strengths / Risks bullet list
- 법적 판단이 아니라는 disclaimer 필수

### FR-06. Mock Mode
- `MOCK_MODE=true` 이면 OpenAI 호출 없이
  한국투자공사 RFP를 분석한 realistic sample 응답 반환
- 채용 담당자가 API 키 없이 전체 workflow 확인 가능

### FR-07. Live Mode
- `MOCK_MODE=false` 및 `OPENAI_API_KEY` 존재 시 실제 호출
- 파싱 실패 시 raw exception 노출 금지 → 사용자 친화적 오류

### FR-08. Error handling
- PDF 형식 오류
- 텍스트 추출 실패
- LLM 응답 파싱 실패
- 파일 크기 초과
- OpenAI API 오류 (429/5xx 등)
모두 프론트엔드에서 이해 가능한 문구로 표시.

---

## 7. User Flow

```text
[Landing / Dashboard]
      │
      ▼
[Company Profile Editor] (선택적, 기본값 존재)
      │
      ▼
[PDF Upload]
      │
      ▼ (Analyze RFP)
[Loading]
      │
      ▼
[Result Dashboard]
   ├─ Overview
   ├─ Requirements
   ├─ Eligibility
   ├─ Evaluation
   ├─ Risks
   ├─ Company Fit
   └─ Proposal
```

---

## 8. UI Structure

- Header
  - 서비스명: **PublicBid AI Assistant**
  - 부제: AI-powered RFP Analysis for Public Sector Projects
  - 모드 배지: MOCK / LIVE
- Left column: Company Profile 카드 (편집 가능)
- Center: PDF 업로드 카드 → 분석 실행 후 결과 카드들
- Result summary bar
  - 사업명 · Budget · Period · Bid Fit Score · 결정 배지
- Result tabs: Overview / Requirements / Eligibility / Evaluation / Risks / Company Fit / Proposal
- Footer disclaimer

Desktop-first. Tailwind CSS 사용. 과도한 애니메이션 없음.

---

## 9. Frontend Architecture

- React 18 + Vite + TypeScript
- Tailwind CSS
- 상태 관리: `useState` / `useReducer` (Redux 등 도입하지 않음)
- API 클라이언트: 브라우저 `fetch` 래퍼 (`src/lib/api.ts`)
- 폴더 구조:
  ```text
  frontend/
    src/
      components/
        Header.tsx
        CompanyProfileCard.tsx
        UploadCard.tsx
        ResultSummary.tsx
        tabs/
          OverviewTab.tsx
          RequirementsTab.tsx
          EligibilityTab.tsx
          EvaluationTab.tsx
          RisksTab.tsx
          CompanyFitTab.tsx
          ProposalTab.tsx
      lib/
        api.ts
        types.ts
      App.tsx
      main.tsx
      index.css
  ```
- 테스트: Vitest + React Testing Library

## 10. Backend Architecture

- Python 3.11+ / FastAPI / Uvicorn
- 폴더 구조:
  ```text
  backend/
    app/
      main.py               # FastAPI app + CORS
      config.py             # 환경변수, MOCK_MODE
      api/
        __init__.py
        analyze.py          # /api/analyze
        health.py           # /api/health
      services/
        pdf_parser.py       # PyMuPDF 래퍼
        analyzer_base.py    # Analyzer interface
        mock_analyzer.py
        openai_analyzer.py
        prompts.py          # LLM system/user prompts
      models/
        analysis.py         # Pydantic 스키마
        company.py
        errors.py
      mocks/
        korea_investment.json  # sample response
    tests/
      test_pdf_parser.py
      test_analyzer_mock.py
      test_analyzer_openai.py
      test_api_analyze.py
    pyproject.toml (또는 requirements.txt)
  ```
- 의존성:
  - fastapi
  - uvicorn
  - pydantic
  - pypdf (순수 Python, DLL 의존 없음)
  - openai (선택 프로바이더)
  - google-genai (기본 프로바이더 · Gemini 무료 티어)
  - python-multipart
  - pytest, pytest-asyncio, httpx, fpdf2 (test)

---

## 11. PDF Parsing Strategy

- `pypdf.PdfReader(io.BytesIO(...))` 로 메모리에서 파싱
- 페이지 순회하며 `page.extract_text()` 사용
- 각 페이지 텍스트를 다음 포맷으로 결합:
  ```text
  === PAGE 1 ===
  ...
  === PAGE 2 ===
  ...
  ```
- 전체 텍스트 길이가 임계값 미만이거나 페이지당 평균 길이가 매우 작으면
  scanned PDF로 간주하고 오류 반환 (OCR 미지원).

---

## 12. LLM Strategy

프로바이더는 `LLM_PROVIDER` 환경변수로 선택 (기본값 `gemini` — 무료 티어).

- **Gemini (기본)**
  - `google-genai` SDK (`from google import genai`)
  - 기본 모델: `GEMINI_MODEL` (기본값 `gemini-2.0-flash`)
  - `client.models.generate_content(config={"response_mime_type":"application/json", ...})`
  - 응답 `.text`를 파싱 → Pydantic 검증
- **OpenAI (선택)**
  - `openai.OpenAI` (SDK v1+)
  - 기본 모델: `OPENAI_MODEL` (기본값 `gpt-4o-mini`)
  - `chat.completions.create(response_format={"type":"json_object"})`
  - 응답 `.choices[0].message.content`를 파싱 → Pydantic 검증
- 두 어댑터 모두 실패 시 `AnalysisFailedError` 로 정규화.
- 프롬프트는 `prompts.py`에 상수로 관리 (system + build_user_prompt).
- `LLM_PROVIDER` 지정 프로바이더의 키가 없으면 자동으로 mock 으로 fallback.
- 토큰 길이 관리를 위해 전체 텍스트를 잘라 넣는다 (`MAX_PROMPT_CHARS=60_000`,
  단순 head truncation).

---

## 13. Structured Output Schema

핵심 Pydantic 모델 (일부):

```python
class Evidence(BaseModel):
    page: Optional[int] = None
    quote: Optional[str] = None

class ProjectOverview(BaseModel):
    project_name: Optional[str]
    agency: Optional[str]
    purpose: Optional[str]
    period: Optional[str]
    budget: Optional[str]
    bidding_method: Optional[str]
    contract_method: Optional[str]

class Requirement(BaseModel):
    id: str                          # RFP에 존재하면 그대로, 없으면 REQ-###
    category: str                    # 기능/성능/보안/운영 등
    title: str
    description: str
    importance: Literal["High", "Medium", "Low"]
    evidence: Optional[Evidence] = None

class EligibilityItem(BaseModel):
    title: str
    detail: Optional[str]
    evidence: Optional[Evidence] = None

class EvaluationCriterion(BaseModel):
    name: str
    weight: Optional[str]
    detail: Optional[str]
    evidence: Optional[Evidence] = None

class RequiredDocument(BaseModel):
    name: str
    note: Optional[str]
    evidence: Optional[Evidence] = None

class Risk(BaseModel):
    category: Literal["technical", "security", "schedule", "business"]
    title: str
    description: str
    evidence: Optional[Evidence] = None

class CompanyFit(BaseModel):
    strengths: list[str]
    gaps: list[str]
    unknowns: list[str]

class BidDecision(BaseModel):
    decision: Literal["GO", "CONDITIONAL_GO", "NO_GO"]
    score: int                       # 0~100
    strengths: list[str]
    risks: list[str]
    rationale: str

class ProposalStrategy(BaseModel):
    title: str
    description: str

class ProposalOutlineItem(BaseModel):
    section: str
    points: list[str]

class AnalysisResult(BaseModel):
    mode: Literal["MOCK", "LIVE"]
    project_overview: ProjectOverview
    requirements: list[Requirement]
    eligibility: list[EligibilityItem]
    evaluation: list[EvaluationCriterion]
    required_documents: list[RequiredDocument]
    risks: list[Risk]
    company_fit: CompanyFit
    bid_decision: BidDecision
    proposal_strategy: list[ProposalStrategy]
    proposal_outline: list[ProposalOutlineItem]
```

Frontend 타입(`src/lib/types.ts`)은 위 스키마의 mirror.

---

## 14. Evidence / Source-Page Strategy

- 모든 핵심 결과에 optional `Evidence { page, quote }` 첨부
- LLM 프롬프트에 페이지 번호 유지 지시 명시
- 프론트엔드에서 `Source: p.N` 형태로 표시
- LLM이 페이지를 확신하지 못하면 null 허용, 임의 추측 금지

---

## 15. Company Profile

- 초기값 (프론트엔드 상수):
  - Company: Demo AI Solutions
  - Tech: Python / FastAPI / React / LLM API / RAG / Linux
  - People: PM 1 / BE 2 / FE 1 / AI 1
  - Capabilities: Web / AI API / Internal knowledge search
  - 공공 실적: 없음
  - 인증: 없음
- 사용자가 텍스트로 편집 가능
- 백엔드로 분석 요청 시 JSON 필드로 전달
- 서버측 저장 없음 (요청 종료 후 폐기)

---

## 16. Company Fit 분석 방식

LLM 프롬프트에 회사 프로필을 명시적으로 삽입하고,
다음 3분류로 응답하도록 지시:

- ✅ 적합: 요구사항을 충족한다는 명확한 근거가 있는 항목
- ⚠️ 확인 필요: 정보 부족 또는 조건부 (인증, 실적 등)
- ❌ 부족: 회사 프로필에 명시적으로 없는 필수 조건

가능하면 각 항목에 관련 requirement id 또는 page 첨부.

---

## 17. Go / No-Go 판단 방식

- `bid_decision.decision` = GO / CONDITIONAL_GO / NO_GO
- `bid_decision.score` = 0~100 (참고용)
- 판단 기준 (프롬프트에 명시):
  - GO: 대부분의 필수 조건 충족 + 리스크 관리 가능
  - CONDITIONAL_GO: 일부 조건 확인 필요하나 참여 검토 가치 있음
  - NO_GO: 필수 참가 자격 명확히 미충족
- UI에 disclaimer 항상 표시:
  > AI 분석 결과는 입찰 검토를 위한 참고자료이며,
  > 실제 참가자격 및 제출조건은 반드시 원문 공고와 RFP를 확인해야 합니다.

---

## 18. Mock / Live Mode

- 환경변수 `MOCK_MODE` (`true` / `false`, 기본 `true`)
- Mock 시 `backend/app/mocks/korea_investment.json` 로드 →
  `AnalysisResult`로 검증 후 반환
- 응답 payload에 `mode` 필드 포함, 프론트 헤더에 배지 표시

---

## 19. Error Handling

- 커스텀 예외:
  - `InvalidPDFError`
  - `EmptyPDFTextError`
  - `AnalysisFailedError`
- FastAPI exception handler로 4xx/5xx JSON 응답 표준화:
  ```json
  { "error": { "code": "EMPTY_PDF_TEXT", "message": "..." } }
  ```
- 프론트엔드는 `error.code`별 사용자 메시지 매핑.

---

## 20. Security Considerations

- OpenAI API 키는 서버측 환경변수로만 관리
- `.env` git 제외, `.env.example` 커밋
- CORS는 개발용으로 `http://localhost:5173` 허용
- 업로드 파일은 메모리로만 처리, 디스크 저장 금지
- 파일 크기 상한 검증 (`MAX_PDF_BYTES`)
- MIME 및 확장자 검증
- 응답 로그에 원문 텍스트 대량 저장 금지

---

## 21. Testing Strategy

Backend (pytest):

- `test_pdf_parser.py`
  - 유효 PDF에서 페이지별 텍스트 추출
  - 잘못된 파일 형식 거부
  - 빈 텍스트 PDF에 대한 EmptyPDFTextError
- `test_analyzer_mock.py`
  - Mock 응답 로드 및 스키마 검증
- `test_analyzer_openai.py`
  - `openai.OpenAI`를 monkeypatch로 가짜 응답 주입
  - Structured output 파싱 성공/실패 시나리오
- `test_api_analyze.py`
  - `/api/analyze` E2E (FastAPI TestClient) — mock 모드
  - PDF 아닌 파일 업로드 시 400

Frontend (Vitest + RTL):

- `UploadCard.test.tsx`
  - 파일 선택 시 파일명 표시
  - Analyze 버튼 클릭 시 fetch 호출
- `ResultSummary.test.tsx`
  - decision 배지 색상/문구
- `RequirementsTab.test.tsx`
  - 요구사항 목록 렌더링 + source page 표시

실제 OpenAI 호출은 unit test에서 금지.

---

## 22. Repository Structure

```text
DocAi/
├── backend/
│   ├── app/...
│   ├── tests/...
│   ├── pyproject.toml
│   └── README.md (선택)
├── frontend/
│   ├── src/...
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/
│   └── superpowers/
│       ├── specs/2026-08-18-public-bid-ai-assistant-design.md
│       └── plans/2026-08-18-public-bid-ai-assistant.md
├── .env.example
├── .gitignore
└── README.md
```

---

## 23. 중요한 기술적 결정

- PDF parser: **pypdf** (Python 3.13 Windows 환경에서 PyMuPDF 휠 DLL 로드 실패로 전환.
  pypdf는 순수 Python이라 채용 담당자의 어떤 환경에서도 실행 안정성이 높다.)
- LLM 응답 검증: **Pydantic BaseModel** (JSON schema 자동 생성)
- 상태 관리: **로컬 React state만** (Redux/Zustand 배제)
- 스타일: **Tailwind CSS**
- LLM 프로바이더: **Gemini (무료 티어) 기본 + OpenAI 선택**. `LLM_PROVIDER`
  환경변수로 스위칭. 프로바이더 어댑터는 동일한 `Analyzer` Protocol에 맞춘다.
- Structured Output: Gemini는 `response_mime_type=application/json`, OpenAI는
  `response_format={"type":"json_object"}`
- 파일 저장 없음: 요청-스코프 메모리 처리
- 회사 프로필 저장 없음: 프론트 상태 + 요청 body

---

## 24. Acceptance Criteria

MVP 완료 기준 (PLAN에서 실제 상태 추적):

- Backend 실행 가능 (`uvicorn app.main:app`)
- Frontend 실행 가능 (`npm run dev`)
- PDF 업로드 가능
- PDF text extraction 가능
- Mock 분석 가능 (API 키 없이)
- Live OpenAI 분석 가능 (키 있을 때)
- 사업 개요/요구사항/참가조건/평가/리스크/Company Fit/Go 결정/제안 전략/제안서 목차 UI 표시
- Source page 표시
- API Key 프런트엔드 노출 없음
- Backend tests PASS
- Frontend tests PASS
- Frontend production build (`npm run build`) PASS
- README만 보고 실행 가능

---

## 25. Test RFP

- 한국투자공사 내부 인공지능 플랫폼 및 인프라 구축
- 나라장터 공고번호: R25BK01077222
- Mock 데이터는 이 RFP의 realistic 요약으로 구성.

---

## 26. Disclaimer

이 서비스는 포트폴리오/업무 보조 MVP이며,
실제 입찰 자격/법률 판단을 제공하지 않는다. README와 UI에 명시.
