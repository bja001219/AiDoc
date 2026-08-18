# PublicBid AI Assistant

AI-powered RFP Analysis for Public Sector Projects.

> 공공사업 담당자가 장문의 RFP에서 요구사항, 평가기준, 입찰조건을 반복적으로
> 정리해야 하는 문제를 AI로 보조하는 포트폴리오 MVP.

RFP PDF 하나를 업로드하면 다음을 자동으로 정리한다.

- 사업 개요 (사업명 · 발주기관 · 예산 · 기간)
- 요구사항 표 (ID · 카테고리 · 중요도 · 근거 페이지)
- 참가 자격 및 제출 자료
- 평가 기준
- 리스크 (technical / security / schedule / business)
- 회사 프로필 대비 적합도 (적합 / 확인 필요 / 부족)
- Bid Fit Score + Go / Conditional Go / No-Go 결정
- 제안 전략과 제안서 목차 초안

핵심 질문은 언제나 하나다: **"우리 회사가 이 사업에 참여할 만한가?"**

---

## Why

한 건의 공공 RFP는 흔히 100~300페이지를 넘는다.
제안 담당자와 PM은 매번 요구사항 · 평가 기준 · 참가조건 · 리스크를 다시 정리한다.
이 서비스는 그 반복 작업을 LLM으로 자동화하여 참여 여부 판단을 앞으로 당긴다.

---

## Architecture

```text
[React + Vite + Tailwind]
          │  fetch(FormData PDF + company JSON)
          ▼
[FastAPI  /api/analyze]
          │
          ▼
[pypdf PDF Parser]  ──► 페이지별 텍스트 + 마커
          │
          ▼
[Analyzer (factory: LLM_PROVIDER)]
   ├─ MockAnalyzer      → 번들된 한국투자공사 샘플 JSON
   ├─ GeminiAnalyzer    → Google Gemini (기본 · 무료 티어)
   └─ OpenAIAnalyzer    → OpenAI Chat Completions (json_object)
          │
          ▼
[Pydantic AnalysisResult]  → JSON 응답
```

세부 설계와 진행 상태는 두 문서에서 관리된다.

- SPEC: [`docs/superpowers/specs/2026-08-18-public-bid-ai-assistant-design.md`](docs/superpowers/specs/2026-08-18-public-bid-ai-assistant-design.md)
- PLAN: [`docs/superpowers/plans/2026-08-18-public-bid-ai-assistant.md`](docs/superpowers/plans/2026-08-18-public-bid-ai-assistant.md)

---

## Repository Layout

```text
DocAi/
├── backend/                    # FastAPI + pypdf + OpenAI
│   ├── app/
│   │   ├── api/                # /api/health, /api/analyze, error handlers
│   │   ├── mocks/              # 번들 샘플 (Korea Investment RFP)
│   │   ├── models/             # Pydantic 스키마
│   │   └── services/           # PDF parser, mock/openai analyzer, prompts
│   └── tests/                  # pytest 21건
├── frontend/                   # Vite + React 18 + Tailwind + Vitest
│   └── src/
│       ├── components/         # Header, UploadCard, ResultSummary, tabs/*
│       └── lib/                # types, api client, defaults
├── docs/superpowers/           # SPEC / PLAN (living documents)
├── .env.example
└── README.md
```

---

## Prerequisites

- Python 3.11+ (개발/CI는 3.13.14로 검증)
- Node.js 18+ (개발/CI는 24.15로 검증)
- npm 9+

Windows 로컬에서 확인되었지만 macOS/Linux에서도 동일하게 동작한다.
(PDF 파서로 pypdf를 사용하므로 네이티브 DLL 의존이 없다 — [PLAN Decision Log](docs/superpowers/plans/2026-08-18-public-bid-ai-assistant.md#decision-log) 참조.)

---

## Setup

```bash
# 1) 리포지토리 클론 및 환경파일
cp .env.example .env
# (Mock 모드로 실행하려면 그대로 두어도 된다. Live 모드는 아래 참조.)

# 2) 백엔드 (권장: 별도 venv)
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# Windows Git Bash:   source .venv/Scripts/activate
# macOS/Linux:        source .venv/bin/activate
pip install -e ".[dev]"

# 3) 프론트엔드
cd ../frontend
npm install
```

---

## Run

터미널 두 개를 사용한다.

**Backend**

```bash
cd backend
# venv 활성화 상태에서:
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/api/health  →  {"status":"ok","mode":"MOCK","model":"..."}
# → http://localhost:8000/docs        →  Swagger UI
```

**Frontend**

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

브라우저에서 대시보드가 열린다. 화면 상단 오른쪽의 **MOCK / LIVE** 배지가
현재 백엔드 모드를 보여준다.

---

## Mock Mode (API 키 없이)

`.env` (또는 시스템 환경변수)에서:

```env
MOCK_MODE=true
```

이 상태에서는 LLM 호출 없이 [번들된 한국투자공사 샘플](backend/app/mocks/korea_investment.json)이
분석 결과로 반환된다. 채용 담당자가 API 키 없이 전체 워크플로를 확인할 수 있다.

## Live Mode (실제 LLM 호출)

프로바이더는 두 가지 중 선택할 수 있고 기본값은 **무료 티어가 있는 Gemini**다.

### A. Google Gemini (기본 · 무료 티어)

[Google AI Studio](https://aistudio.google.com/apikey)에서 API 키를 무료로 발급받은 뒤:

```env
MOCK_MODE=false
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-3.6-flash    # 무료 티어에서 사용 가능한 모델 (2026-08 기준)
```

### B. OpenAI (유료)

```env
MOCK_MODE=false
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

공통 사항:

- API 키는 반드시 백엔드에만 존재한다. 프론트엔드에는 절대 노출되지 않는다.
- `LLM_PROVIDER`에 지정한 프로바이더 키가 없으면 자동으로 **mock 응답**으로 되돌아간다.
- 응답 파싱 실패나 API 오류는 사용자에게 이해 가능한 문구로 표시된다.
- 텍스트 추출이 어려운 스캔 PDF는 명시적으로 거부된다 (MVP에서 OCR 미지원).
- 화면 상단 오른쪽 배지가 현재 프로바이더를 함께 표시한다 (예: `LIVE · Gemini`).

---

## Test RFP

Mock 데이터는 아래 실제 공공사업 RFP를 대상으로 구성했다.

```text
발주기관: 한국투자공사
사업명:   내부 인공지능 플랫폼 및 인프라 구축
나라장터: R25BK01077222
```

---

## Testing

```bash
# Backend  ── 27 pytest (2026-08-18 기준)
cd backend
.venv\Scripts\python.exe -m pytest        # Windows
python -m pytest                          # macOS/Linux

# Frontend ── 15 vitest, 1 vite build
cd ../frontend
npm run test:run     # Vitest run once
npm run build        # tsc + vite production build
```

CI/CD는 별도로 구성하지 않았다. 위 명령이 모두 통과하면 릴리스 준비 완료 상태다.

---

## Security Notes

- OpenAI API 키는 서버 환경변수로만 관리한다. `.env`는 git에 커밋되지 않는다.
- 업로드된 PDF는 메모리에서만 처리되고 디스크에 저장되지 않는다.
- 파일 크기 상한(`MAX_PDF_BYTES`, 기본 25MB)과 MIME/확장자 검증이 적용된다.
- CORS 허용 origin은 `CORS_ALLOW_ORIGINS` 환경변수로 제한된다 (기본 개발 서버만 허용).

---

## Disclaimer

이 서비스는 포트폴리오 및 업무 보조용 MVP다. 실제 입찰 참가 자격이나
법률 판단을 제공하지 않는다. 공식 참가 자격 및 제출 조건은 반드시
원문 공고와 RFP를 확인해야 한다.
