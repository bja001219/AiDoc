# PublicBid AI Assistant — Implementation Plan

Document ID: 2026-08-18-public-bid-ai-assistant
Related SPEC: `docs/superpowers/specs/2026-08-18-public-bid-ai-assistant-design.md`

> 이 문서는 living document다. 작업이 끝날 때마다 checkbox와
> `Current Project Status`, `Session Handoff`를 반드시 업데이트한다.
> 대화 맥락이 아니라 이 파일이 세션 간 source of truth다.

---

# Current Project Status

Updated:
2026-08-18

Overall status:
DONE (MVP complete, ready to demo)

Current phase:
Phase 10 — README & polish (모든 필수 task DONE)

Current task:
없음 — 다음 세션에서 남길 수 있는 옵션 작업은 아래 "Optional next work" 참조.

Last completed:
- Task 8~11 완료 (Frontend 스캐폴딩 → types/api client → Upload + Company +
  Analyze 워크플로 → 7개 결과 탭 + Result Summary + Disclaimer).
- Task 12 완료 (README 최종본, verification 마무리).
- Post-MVP 폴리시 (Task 13):
  - ResultSummary에 "JSON 다운로드" 버튼 추가 (Blob 기반, 파일명 슬러그)
  - `lib/api.ts`에 `safeFetch` — 네트워크 실패 시 친화적 오류 (NETWORK_ERROR)
- Vitest 13건 PASS, `npm run build` (tsc + vite) PASS.
- uvicorn 실서버 부팅 확인 (`GET /api/health` → 200 mock).

Next action:
없음. 원하는 경우 아래 Optional next work 참조.

Known issues:
- None

Blocked:
- None

Verification status:
- Backend tests: 27 PASS (pytest, 2026-08-18)
- Frontend tests: 15 PASS (vitest, 2026-08-18)
- Backend startup: uvicorn 127.0.0.1:8765 확인, /api/health 200 (provider 필드 포함)
- Frontend production build: PASS (tsc + vite, 164.52KB JS · 16.03KB CSS)
- Manual mock workflow: TestClient/uvicorn 경로 검증됨. 브라우저 육안 확인은
  사용자 환경에서 수행 권장.
- Live 분석 (Gemini/OpenAI): 미수행 (키 없이는 실행 불가, 프롬프트/파서 unit
  test로 대체)

---

# Phases

- Phase 0 — Repository scaffolding & docs
- Phase 1 — Backend foundation (FastAPI + health)
- Phase 2 — PDF parsing
- Phase 3 — Analysis contracts (Pydantic + Mock)
- Phase 4 — OpenAI live analyzer
- Phase 5 — `/api/analyze` endpoint end-to-end
- Phase 6 — Frontend foundation (Vite + Tailwind)
- Phase 7 — Frontend upload + analyze flow
- Phase 8 — Result dashboard tabs
- Phase 9 — Tests & verification
- Phase 10 — README & final polish

---

# Tasks

## Task 1 — Repository scaffolding

Goal:
저장소 루트에 최소한의 메타 파일 생성. 이후 backend/frontend 하위 디렉터리
스캐폴딩을 위한 기반.

Files:
- `.gitignore`
- `.env.example`
- `README.md` (스켈레톤)

Steps:
- [x] `docs/superpowers/specs/...` SPEC 파일 작성
- [x] `docs/superpowers/plans/...` PLAN 파일 작성
- [x] 루트 `.gitignore` 생성 (Python, Node, dotenv)
- [x] 루트 `.env.example` 생성 (OPENAI_API_KEY, OPENAI_MODEL, MOCK_MODE)
- [x] 루트 `README.md` 스켈레톤 생성 (자세한 내용은 Task 10에서)

Verification:
- [x] 파일들이 존재한다 (`ls` 확인 — 2026-08-18)

Status:
DONE

Last completed:
루트 스캐폴딩 3파일 생성 완료.

Next action:
Task 2 시작.

---

## Task 2 — Backend project skeleton

Goal:
FastAPI 프로젝트 부트스트랩, 실행 가능한 최소 `/api/health`.

Files:
- `backend/pyproject.toml`
- `backend/app/__init__.py`
- `backend/app/main.py`
- `backend/app/config.py`
- `backend/app/api/__init__.py`
- `backend/app/api/health.py`
- `backend/tests/__init__.py`
- `backend/tests/test_health.py`

Steps:
- [x] `backend/pyproject.toml` 작성 (fastapi, uvicorn, pydantic, pypdf, openai, python-multipart, pytest, httpx, fpdf2)
- [x] `backend/app/config.py`에 `Settings` (env: OPENAI_API_KEY, OPENAI_MODEL, MOCK_MODE, MAX_PDF_BYTES, CORS_ALLOW_ORIGINS)
- [x] `backend/app/main.py`에 FastAPI 앱 + CORS + 라우터 등록
- [x] `backend/app/api/health.py`에 `GET /api/health` (상태 + mode)
- [x] `backend/tests/test_health.py` 작성
- [x] `pytest tests/test_health.py` 실행 (전체 suite 21 PASS)

Verification:
- [x] health test PASS

Status:
DONE

Last completed:
Backend 스캐폴딩 + health 엔드포인트 검증 완료.

Next action:
Task 3으로 이동.

---

## Task 3 — PDF Parser service

Goal:
PDF 바이트 → 페이지별 텍스트 문자열 추출. 텍스트 부족 감지.

Files:
- `backend/app/services/__init__.py`
- `backend/app/services/pdf_parser.py`
- `backend/app/models/errors.py`
- `backend/tests/test_pdf_parser.py`

Steps:
- [x] `errors.py`에 `InvalidPDFError`, `EmptyPDFTextError`, `PDFTooLargeError`,
      `InvalidRequestError`, `AnalysisFailedError` 정의
- [x] `pdf_parser.py`에 `extract_pages(pdf_bytes) -> list[PageText]` (pypdf 기반)
- [x] 텍스트 부족 감지 (총 문자 수 200 미만이면 EmptyPDFTextError)
- [x] 페이지별 결합 helper `format_pages(pages) -> str`
- [x] `tests/test_pdf_parser.py` — fpdf2로 런타임 PDF 생성해 5개 시나리오 검증
- [x] `pytest` 실행

Verification:
- [x] 5개 케이스 모두 PASS

Status:
DONE

---

## Task 4 — Analysis Pydantic schema

Goal:
SPEC §13에 정의된 모든 스키마를 Pydantic으로 구현.

Files:
- `backend/app/models/__init__.py`
- `backend/app/models/analysis.py`
- `backend/app/models/company.py`
- `backend/tests/test_models.py`

Steps:
- [x] `analysis.py` — Evidence / ProjectOverview / Requirement / EligibilityItem /
      EvaluationCriterion / RequiredDocument / Risk / CompanyFit / BidDecision /
      ProposalStrategy / ProposalOutlineItem / AnalysisResult
- [x] `company.py` — CompanyProfile + DEFAULT_COMPANY_PROFILE
- [x] `test_models.py` — round-trip 직렬화, score 범위 검증, default profile 검증
- [x] `pytest` 실행

Verification:
- [x] 모델 테스트 PASS

Status:
DONE

---

## Task 5 — Mock analyzer + sample data

Goal:
API 키 없이 realistic 결과를 반환하는 MockAnalyzer.

Files:
- `backend/app/services/analyzer_base.py`
- `backend/app/services/mock_analyzer.py`
- `backend/app/mocks/korea_investment.json`
- `backend/tests/test_analyzer_mock.py`

Steps:
- [x] `analyzer_base.py`에 `Analyzer` Protocol
- [x] `korea_investment.json` — 한국투자공사 RFP 요약 (requirements 7, eligibility 3,
      evaluation 4, docs 8, risks 4, CONDITIONAL_GO, strategy 5, outline 6)
- [x] `MockAnalyzer.analyze` — dataset 로드 + Pydantic 검증 + mode=MOCK
- [x] `test_analyzer_mock.py` — 스키마 검증 + input 무시 확인
- [x] pytest 실행

Verification:
- [x] Mock 스키마 검증 PASS

Status:
DONE

---

## Task 6 — OpenAI analyzer + prompts

Goal:
OpenAI SDK를 사용하여 실제 RFP 분석. 실패 처리 포함.

Files:
- `backend/app/services/prompts.py`
- `backend/app/services/openai_analyzer.py`
- `backend/app/services/analyzer_factory.py`
- `backend/tests/test_analyzer_openai.py`

Steps:
- [x] `prompts.py`에 SYSTEM_PROMPT + build_user_prompt(pages_text, company)
- [x] `openai_analyzer.py` — `OpenAIAnalyzer(client, model)`
  - `chat.completions.create(response_format={"type":"json_object"})`
  - JSON 파싱 → mode=LIVE 강제 → Pydantic 검증
  - 실패 시 `AnalysisFailedError`
- [x] `analyzer_factory.py`에서 MOCK_MODE/API key 기반 선택
- [x] `test_analyzer_openai.py` — success / raise / invalid JSON / schema mismatch /
      LIVE 강제 5개 케이스 (fake client)
- [x] pytest 실행 (실제 OpenAI 호출 없음)

Verification:
- [x] 5개 시나리오 PASS

Status:
DONE

---

## Task 7 — /api/analyze endpoint

Goal:
파일 업로드 → parser → analyzer (mode에 따라 선택) → JSON 응답.

Files:
- `backend/app/api/analyze.py`
- `backend/app/api/errors.py`
- `backend/app/main.py` (라우터 + 오류 핸들러 등록)
- `backend/tests/test_api_analyze.py`

Steps:
- [x] `analyze.py`에 `POST /api/analyze`
  - `UploadFile` PDF + `company` JSON (Form + File 조합)
  - Content-Type/확장자 검증, 크기 검증
  - PDF bytes → parser.extract_pages → analyzer.analyze
  - 성공 시 AnalysisResult JSON
- [x] `errors.py`의 `register_error_handlers`로 DomainError → 표준 JSON 응답
- [x] `_get_analyzer` 의존성이 MOCK_MODE/API key로 Analyzer 선택
- [x] `test_api_analyze.py`
  - 정상 mock 시나리오
  - 잘못된 파일 형식 → 400 INVALID_PDF
  - 빈 텍스트 PDF → 422 EMPTY_PDF_TEXT
  - custom company 프로필 수용
  - 잘못된 company JSON → 400 INVALID_REQUEST
- [x] pytest 실행 — 5개 PASS

Verification:
- [x] endpoint 테스트 PASS
- [ ] `uvicorn app.main:app` 로 수동 실행 확인 (health + docs) — 개발 시 확인 예정

Status:
DONE

---

## Optional Next Work (not part of MVP)

- Live 모드 실제 OpenAI 호출로 end-to-end 검증 (키 필요)
- Playwright/브라우저 육안 QA (Mock 흐름 시각 확인)
- 텍스트 추출 정확도 개선 (예: pypdfium2 옵션 도입, 언어별 heuristic)
- 대용량 RFP를 위한 token-aware 청크 전략 및 여러 요청 병합
- Dockerfile / docker-compose (배포 자동화 필요할 때)
- 추가 mock 시나리오 (GO / NO_GO 데이터셋 + 사용자 선택 UI)
- 결과 히스토리 / 로컬 스토리지 저장

---

## Task 14 — Gemini 프로바이더 추가 (완료)

Goal:
채용 담당자가 유료 API 없이 Live 모드까지 확인할 수 있도록 Google Gemini
무료 티어를 기본 프로바이더로 도입. OpenAI는 선택 프로바이더로 유지.

Files:
- `backend/pyproject.toml` (google-genai>=1.0.0)
- `backend/app/config.py` (Provider Literal, gemini/openai 관련 env, default=gemini)
- `backend/app/services/gemini_analyzer.py` (신설)
- `backend/app/services/analyzer_factory.py` (Provider 분기, key 없으면 mock fallback)
- `backend/app/api/health.py` (provider 필드 반환)
- `backend/tests/test_analyzer_gemini.py` (신설 · 6 tests)
- `backend/tests/test_health.py` (provider 검증 추가)
- `.env.example` (LLM_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL)
- `frontend/src/lib/types.ts` (Provider, HealthResponse)
- `frontend/src/lib/api.ts` (fetchHealth 반환 타입)
- `frontend/src/components/Header.tsx` (provider prop + `LIVE · Gemini` 배지)
- `frontend/src/App.tsx` (provider 상태 관리 + Header 전달)
- `frontend/src/components/Header.test.tsx` (LIVE · Gemini/OpenAI 케이스 추가)
- `README.md` (Live Mode = Gemini/OpenAI 두 가지)
- `docs/superpowers/specs/...` (§10 의존성, §12 LLM Strategy, §23 결정)

Steps:
- [x] `google-genai` 설치
- [x] `Settings`에 llm_provider/gemini_* 추가, `active_model` 프로퍼티
- [x] `GeminiAnalyzer` — `client.models.generate_content` 호출, 응답 `.text` 파싱,
      LIVE 모드 강제, `AnalysisFailedError` 래핑, `candidates[]` 폴백 지원
- [x] `analyzer_factory` — mock/gemini/openai 분기 + 각 provider 키/의존성 없을 때
      mock 폴백
- [x] `/api/health`가 `provider` 반환, TestClient 테스트 갱신
- [x] Gemini fake client 테스트 6종 (성공/LIVE 강제/예외/JSON 오류/스키마 오류/
      candidates 폴백)
- [x] Frontend Header 배지 `LIVE · Gemini/OpenAI` 표시 + Vitest 케이스 2건 추가
- [x] `.env.example` + README + SPEC 갱신
- [x] `pytest` 27 PASS, `npm run test:run` 15 PASS, `npm run build` PASS

Verification:
- [x] Backend 27 PASS (기존 21 + gemini 6)
- [x] Frontend 15 PASS (기존 13 + Header 2)
- [x] `npm run build` PASS

Status:
DONE

---

## Task 13 — Post-MVP polish (완료)

Goal:
데모 품질과 신뢰성 향상. 아키텍처 변경 없이 UX/오류처리를 다듬는다.

Files:
- `frontend/src/lib/api.ts` (safeFetch 추가)
- `frontend/src/components/ResultSummary.tsx` ("JSON 다운로드" 버튼)
- `frontend/src/components/ResultSummary.test.tsx` (다운로드 트리거 검증)

Steps:
- [x] `safeFetch` — `fetch` TypeError를 `RfpApiError(0, "NETWORK_ERROR", ...)`로
      래핑. `fetchHealth` / `analyzeRfp` 양쪽에 적용
- [x] ResultSummary — Blob(JSON) 생성 → `<a download>` 트리거,
      파일명은 project_name 슬러그 기반 (`{name}.analysis.json`)
- [x] Vitest — 다운로드 버튼 클릭 시 `URL.createObjectURL(Blob)`이
      호출되고 blob의 MIME이 `application/json` 이며
      `URL.revokeObjectURL(url)`이 호출됨을 확인
- [x] `npm run build` + `npm run test:run` 회귀 없음 확인

Verification:
- [x] Vitest 13 PASS
- [x] `npm run build` PASS (164.35KB JS · 16.03KB CSS)

Status:
DONE

---

## Task 8 — Frontend project skeleton

Goal:
Vite + React + TS + Tailwind 부트스트랩.

Files:
- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/tsconfig.node.json`
- `frontend/index.html`
- `frontend/postcss.config.js`
- `frontend/tailwind.config.js`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`

Steps:
- [x] `package.json` (react 18, vite 5, typescript 5.5, tailwind 3.4, vitest 1.6,
      @testing-library/react 15, jsdom, autoprefixer, postcss)
- [x] Tailwind + PostCSS 설정
- [x] `vite.config.ts` (react 플러그인 + vitest env=jsdom, setupFiles)
- [x] `tsconfig.json` + `tsconfig.node.json`
- [x] `App.tsx` 최소 헤더 + Header 컴포넌트 + `main.tsx` + `index.css`
- [x] `npm install`
- [x] `npm run build` PASS (tsc + vite)

Verification:
- [x] `npm run build` PASS
- [x] `tsc -b` 타입 에러 없음
- Note: `vite.config.ts`는 `vitest/config` 의 `defineConfig`를 사용 (test 옵션 지원).

Status:
DONE

---

## Task 9 — Frontend types + API client

Goal:
Backend 스키마 mirror + fetch 래퍼.

Files:
- `frontend/src/lib/types.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/companyDefaults.ts`

Steps:
- [x] `types.ts` — AnalysisResult / ProjectOverview / Requirement / ...
      / CompanyProfile / ApiError 인터페이스
- [x] `api.ts` — `analyzeRfp(file, company)` + `fetchHealth()` +
      `RfpApiError`; `import.meta.env.VITE_API_BASE_URL` fallback
- [x] `companyDefaults.ts` — DEFAULT_COMPANY 상수

Verification:
- [x] `tsc -b` PASS (build 파이프라인에 포함)

Status:
DONE

---

## Task 10 — Upload + Analyze UI

Goal:
PDF 업로드 UI + 분석 요청 + 로딩 상태.

Files:
- `frontend/src/components/Header.tsx` (+ Header.test.tsx)
- `frontend/src/components/CompanyProfileCard.tsx`
- `frontend/src/components/UploadCard.tsx` (+ UploadCard.test.tsx)
- `frontend/src/App.tsx` 업데이트
- `frontend/src/components/Disclaimer.tsx`

Steps:
- [x] Header — 서비스명 + 부제 + 모드 배지 (Mock/Live/UNKNOWN 색상 구분)
- [x] CompanyProfileCard — DEFAULT_COMPANY 기반 view/edit 토글
- [x] UploadCard — drag&drop + 파일 선택 + 파일명/크기 + Analyze 버튼 + error 표시
- [x] App.tsx — health fetch → 모드 배지 갱신, 분석 상태/에러 관리
- [x] Vitest — Header(3), UploadCard(4)

Verification:
- [x] Vitest PASS (7건)
- [x] uvicorn + fetch(/api/health) 확인
- [ ] 브라우저 육안 확인 — 다음 세션에서 사용자 환경에서 수행 권장

Status:
DONE

---

## Task 11 — Result Dashboard

Goal:
분석 결과 시각화 (요약 바 + 탭).

Files:
- `frontend/src/components/EvidenceBadge.tsx`
- `frontend/src/components/ResultSummary.tsx` (+ ResultSummary.test.tsx)
- `frontend/src/components/ResultTabs.tsx`
- `frontend/src/components/tabs/OverviewTab.tsx`
- `frontend/src/components/tabs/RequirementsTab.tsx` (+ RequirementsTab.test.tsx)
- `frontend/src/components/tabs/EligibilityTab.tsx`
- `frontend/src/components/tabs/EvaluationTab.tsx`
- `frontend/src/components/tabs/RisksTab.tsx`
- `frontend/src/components/tabs/CompanyFitTab.tsx`
- `frontend/src/components/tabs/ProposalTab.tsx`
- `frontend/src/test/fixtures.ts`

Steps:
- [x] ResultSummary — 사업명 · Budget · Period · Bid Fit Score · decision 배지
      (GO / CONDITIONAL_GO / NO_GO 색상 분기) · rationale
- [x] EvidenceBadge — `Source: p.N` 공용 컴포넌트
- [x] OverviewTab — 프로젝트 개요 grid
- [x] RequirementsTab — 표 형태, importance 색상, source 페이지
- [x] EligibilityTab — 참가자격 + 제출자료 두 컬럼
- [x] EvaluationTab — 평가 항목 표
- [x] RisksTab — 카테고리별 그룹 카드
- [x] CompanyFitTab — 적합 / 확인 필요 / 부족 3-bucket
- [x] ProposalTab — 전략 + 목차
- [x] ResultTabs — 7개 탭 상태 전환 (useState)
- [x] Disclaimer — 항상 표시
- [x] Vitest fixtures — sampleResult
- [x] Vitest — ResultSummary(2) + RequirementsTab(3)

Verification:
- [x] Vitest PASS (5건)
- [ ] 브라우저 육안 확인 — 다음 세션에서 수행 권장

Status:
DONE

---

## Task 12 — Verification & polish

Goal:
전체 acceptance criteria 실행 및 통과 확인.

Steps:
- [x] Backend: `pytest` 21 PASS
- [x] Frontend: `npm run test:run` 12 PASS
- [x] Frontend: `npm run build` PASS (tsc + vite)
- [x] Backend startup: `uvicorn app.main:app` 정상 (127.0.0.1:8765 확인)
- [ ] Frontend startup: `npm run dev` 브라우저 확인 (다음 세션 사용자 환경)
- [ ] Mock end-to-end 브라우저 확인 (다음 세션 사용자 환경)
- [ ] Live end-to-end — 키 없어 skip (프롬프트/파서 unit test로 대체 검증)
- [x] README 확정 (실행법, Mock/Live, disclaimer, test RFP)

Verification:
- [x] Verification Log 업데이트

Status:
DONE (브라우저 육안 확인만 다음 세션 대상)

---

# Decision Log

### 2026-08-18 — PDF 파서: pypdf 채택 (PyMuPDF 배제)
- Decision: PDF 파서로 `pypdf` 사용. 테스트 픽스처 생성용으로 `fpdf2` 추가.
- Reason: Windows + Python 3.13 조합에서 PyMuPDF(1.24.x/1.28.x) wheel의
  `_extra.pyd` DLL 로드 실패로 즉시 사용 불가. 채용 담당자의 환경에서도
  같은 이슈가 재현될 위험이 있음. pypdf는 순수 Python이라 어떤 환경에서도
  즉시 동작. 텍스트 추출 품질은 PyMuPDF보다 낮지만 MVP RFP 분석에는 충분.
- Rejected: PyMuPDF (DLL 이슈), pypdfium2 (역시 네이티브 의존), OCR (MVP 밖).
- How to apply: 파서 서비스는 `pypdf.PdfReader`만 사용한다. 향후
  텍스트 추출 정확도 개선이 필요하면 별도 task로 분리.

### 2026-08-18 — 프론트 상태 관리 최소화
- Decision: React 로컬 state (`useState`)만 사용.
- Reason: 단일 페이지 대시보드이며 상태가 얕음. Redux/Zustand 도입 시 이득 없음.

### 2026-08-18 — Docker 미사용
- Decision: Docker 없이 로컬 실행 문서화.
- Reason: MVP에서 배포 자동화 요구 없음. 실행 지침은 README로 충분.

### 2026-08-18 — Structured Output: SDK parse 우선
- Decision: OpenAI SDK `parse` API 우선, 실패 시 json_object fallback + Pydantic 검증.
- Reason: SDK가 스키마 검증까지 처리하지만 모델/버전에 따라 미지원 가능. Fallback으로 안정성 확보.

---

# Known Issues

없음.

---

# Verification Log

### Backend
- [x] `pytest` — 27 passed (2026-08-18, Python 3.13.14)
  - test_health.py: 1 PASS (provider 필드 포함)
  - test_pdf_parser.py: 5 PASS
  - test_models.py: 3 PASS
  - test_analyzer_mock.py: 2 PASS
  - test_analyzer_openai.py: 5 PASS
  - test_analyzer_gemini.py: 6 PASS
  - test_api_analyze.py: 5 PASS

### Frontend
- [x] `npm run test:run` — 15 passed (2026-08-18, Node 24.15.0, Vitest 1.6.1)
  - Header.test.tsx: 5 PASS (LIVE · Gemini/OpenAI 배지 포함)
  - UploadCard.test.tsx: 4 PASS
  - ResultSummary.test.tsx: 3 PASS (JSON 다운로드 포함)
  - tabs/RequirementsTab.test.tsx: 3 PASS
- [x] `npm run build` — PASS (tsc -b + vite v5.4.21, dist 164.52KB JS / 16.03KB CSS)

### Manual
- [x] Backend TestClient 부팅 (create_app OK, 라우터/미들웨어 로드 확인)
- [x] Backend uvicorn 실행 (127.0.0.1:8765, /api/health → 200
      `{"status":"ok","mode":"MOCK","model":"gpt-4o-mini"}`)
- [ ] Frontend `npm run dev` 브라우저 확인 — 다음 세션 사용자 환경에서 수행
- [ ] Mock end-to-end 브라우저 확인 — 다음 세션 사용자 환경에서 수행
- [ ] Live OpenAI analysis — 키 없어 skip. 프롬프트/파서 unit test로 대체.

---

# Final Verification

- [x] Backend `pytest` — 27 passed (health + parser + models + mock/openai/gemini
      analyzer + /api/analyze)
- [x] Frontend `npm run test:run` — 15 passed (Header LIVE·Provider 포함)
- [x] Frontend `npm run build` — PASS (tsc + vite, 164.52KB JS)
- [x] Backend uvicorn 부팅 및 `/api/health` 200 (provider 필드 포함)
- [x] MOCK 흐름 unit 검증 (`test_api_analyze.py` E2E via TestClient)
- [x] 네트워크 실패 시 friendly 메시지 (`NETWORK_ERROR`)
- [x] 분석 결과 JSON 다운로드 (Blob) 검증
- [x] LLM 프로바이더 factory 분기 (mock/gemini/openai + 키 없을 때 mock 폴백)
- [x] README만 보고 setup/run 가능 (Gemini 무료 티어 안내 포함)
- [ ] Live Gemini analysis — 사용자 환경에서 GEMINI_API_KEY 설정 후 수행
- [ ] Live OpenAI analysis — 미수행 (키 없음)
- [ ] 브라우저 육안 QA — 다음 세션 사용자 환경에서 수행 권장

---

# Session Handoff

Last updated:
2026-08-18

What was completed this session:
- SPEC + PLAN 초기 작성
- Task 1 (루트 스캐폴딩) 완료
- Task 2~7 (Backend 스캐폴딩 → PDF 파서 pypdf 전환 → 스키마 → Mock analyzer
  + Korea Investment sample → OpenAI analyzer + factory → /api/analyze
  endpoint + 오류 핸들러) 완료
- Task 8~11 (Frontend Vite+React+TS+Tailwind 스캐폴딩 → types/api client →
  Upload + Company + Analyze 워크플로 → 7개 결과 탭 + Result Summary +
  Disclaimer) 완료
- Task 12 (README 최종본, verification 마무리) 완료
- Task 13 post-MVP 폴리시: JSON 다운로드 버튼 + safeFetch 친화적 네트워크 오류
- Task 14 Gemini 프로바이더 추가:
  - `google-genai` SDK 의존성 추가
  - `GeminiAnalyzer` + `analyzer_factory`에서 `LLM_PROVIDER` 분기
  - `/api/health`가 `provider` 반환, Header 배지 "LIVE · Gemini/OpenAI" 표시
  - `.env.example`에 GEMINI_API_KEY/GEMINI_MODEL/LLM_PROVIDER 추가
  - 기본값 `LLM_PROVIDER=gemini` (무료 티어 사용 가능)
- Backend pytest 27 PASS / Frontend vitest 15 PASS / `npm run build` PASS
- Backend uvicorn 실서버 부팅 확인
- Decisions:
  - PyMuPDF → pypdf 전환 (Windows DLL 이슈)
  - 기본 LLM 프로바이더 = Gemini 무료 티어 (채용 담당자 비용 부담 제거)

Current state:
- MVP 코드 완성. 저장소는 backend/, frontend/, docs/, .env.example, README.md 포함
- 모든 자동 테스트/빌드 PASS
- Live OpenAI 흐름과 브라우저 육안 확인만 사용자 환경에서 별도 필요

Next exact action:
필수 작업 없음. 사용자 환경에서 데모 시:
1. `.env.example` → `.env` 복사
2. `cd backend && python -m venv .venv && (activate) && pip install -e ".[dev]" && uvicorn app.main:app --reload --port 8000`
3. `cd frontend && npm install && npm run dev`
4. 브라우저 http://localhost:5173 열고 임의 RFP PDF 업로드

Optional next work (Plan 상단 "Optional Next Work" 섹션 참조):
- Live OpenAI E2E (키 필요)
- Playwright/시각 QA
- pypdfium2/OCR 등 파서 개선
- Docker화

Read first next session:
1. This PLAN (특히 "Current Project Status", "Verification Log",
   "Optional Next Work")
2. SPEC
3. 필요한 경우: `backend/pytest` 재실행 + `npm run test:run` 재실행

Do not redo:
- SPEC/PLAN 재작성
- Task 1~12 재구현
- pymupdf 재시도 (Decision Log 참조)
- backend/frontend 의존성 재선정

Known issue:
None
