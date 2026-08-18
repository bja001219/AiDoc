# PublicBid AI Assistant — Senior Engineering Review

Reviewer: Claude (acting as senior engineer)
Date: 2026-08-18
Scope: Full repository at commit `eebebd7`
Runtime under review:
- Backend uvicorn on http://127.0.0.1:8000 (`mode:LIVE, provider:gemini, model:gemini-3.6-flash`)
- Frontend Vite dev on http://localhost:5173
- Live Gemini call verified end-to-end (200, `CONDITIONAL_GO`, full AnalysisResult populated)

---

## 1. Verdict

**Ship-ready as a portfolio MVP.** Architecture is clean, tests are honest,
the demo works with zero API keys (mock) and a free Gemini key (live).
Documentation (`SPEC`, `PLAN`, `README`) is unusually strong for MVP scale
and directly reduces onboarding friction for a reviewer.

Not ship-ready as a **product** — the top 3 findings below (H-1, H-2, H-3)
are the ones that would embarrass you in a real deployment.

Overall grade: **A- for portfolio, C for production**. Gap is entirely
about operational maturity (rate limiting, observability, cache, timeouts),
not about correctness of what's built.

---

## 2. What was verified in this review pass

- Static: read every source file, checked imports, deps, tsconfig, gitignore.
- Backend tests: 27 pytest passed (2026-08-18).
- Frontend tests: 15 vitest passed.
- Frontend production build: PASS (tsc + vite).
- `/api/health` returns provider + model as configured.
- CORS preflight `OPTIONS /api/analyze` from `Origin: http://localhost:5173`
  returns `HTTP 200` with correct `Access-Control-Allow-Origin`,
  `Access-Control-Allow-Methods: GET, POST, OPTIONS`,
  `Access-Control-Allow-Headers: content-type`.
- Vite dev server serves `index.html` (200) and hot-module JS pipeline.
- Live Gemini `/api/analyze` returned STATUS 200 with `mode:LIVE`,
  `decision:CONDITIONAL_GO`, populated requirements/company_fit/rationale.
- `.env` is git-ignored; `.env.example` template is clean (no secrets);
  no build artifacts leaked into git (checked `git ls-tree`).

---

## 3. Findings by severity

Legend: **H** = high, **M** = medium, **L** = low, **N** = nice-to-have.
Anchor format: **[H-1]** etc. for cross-reference.

### HIGH

**[H-1] Health endpoint lies about `mode` when key is missing.**
File: `backend/app/api/health.py`, `backend/app/services/analyzer_factory.py`

If `MOCK_MODE=false`, `LLM_PROVIDER=gemini`, but `GEMINI_API_KEY` is empty,
`/api/health` still returns `{"mode":"LIVE","provider":"gemini",...}` because
`Settings.mode` only reads `mock_mode`, ignoring key presence. Meanwhile
`build_analyzer` silently falls back to `MockAnalyzer`. The UI badge shows
`LIVE · Gemini` even though every request returns the Korea Investment
sample. A reviewer running the demo would wonder why every RFP produces the
same output.

Recommended fix: compute `effective_mode` in `get_settings()` /
`build_analyzer()` and expose it through `/api/health`. Something like:

```python
@property
def effective_mode(self) -> str:
    if self.mock_mode:
        return "MOCK"
    if self.llm_provider == "gemini" and not self.gemini_api_key:
        return "MOCK"   # or "MISCONFIGURED"
    if self.llm_provider == "openai" and not self.openai_api_key:
        return "MOCK"
    return "LIVE"
```

Frontend badge should reflect `effective_mode`.

---

**[H-2] `_get_analyzer` builds a fresh SDK client per request.**
File: `backend/app/api/analyze.py:44`, `backend/app/services/analyzer_factory.py`

Every `POST /api/analyze` calls `build_analyzer(settings)` which instantiates
`genai.Client(api_key=...)` or `OpenAI(api_key=...)`. Each of those runs TLS
handshake and auth setup. Under any real traffic this is a needless latency
tax and can easily hit connection quotas.

Fix: cache the analyzer instance via a module-level `@lru_cache` on
`build_analyzer(settings_key)`, keyed by `(provider, model, api_key_hash)`.
Or attach it to `app.state` on startup.

---

**[H-3] `/api/analyze` reads the whole PDF into memory before checking size.**
File: `backend/app/api/analyze.py:52-55`

```python
pdf_bytes = await file.read()
_validate_pdf(file, settings.max_pdf_bytes, len(pdf_bytes))
```

A malicious client can POST a 500 MB body — we've already allocated 500 MB
before the size guard fires. Combined with no rate limiting, one attacker
can OOM the process trivially.

Fix (any of):
- Read in a bounded loop: `while chunk := await file.read(1 << 20): ...`
  and abort at `max_pdf_bytes + 1`.
- Or use Starlette's `Request.stream()` with size accounting.
- Or set `MAX_UPLOAD_SIZE` at the ASGI layer.

Also check `file.size` / `Content-Length` header first for cheap rejection.

---

### MEDIUM

**[M-1] No client-side or server-side timeout on Gemini call.**
Files: `backend/app/services/gemini_analyzer.py:34-42`, `frontend/src/lib/api.ts:56-60`

`client.models.generate_content(...)` has no explicit timeout. Frontend
`fetch(...)` has no `AbortController`. If Gemini hangs, so does the request
and so does the spinner — indefinitely. Real users hit CTRL+R eventually,
which orphans a running LLM call and burns quota.

Fix backend: pass `config={"http_options": {"timeout": 60_000}}` (ms) to
google-genai, or wrap in `asyncio.wait_for`. Fix frontend: use
`AbortController` with `signal` and abort after ~90 s.

---

**[M-2] Silent fallback to mock when the provider SDK or key is missing.**
File: `backend/app/services/analyzer_factory.py:17-38`

Any of these silently return `MockAnalyzer`:
- Missing `GEMINI_API_KEY` in gemini mode
- `ImportError` on `from google import genai`
- Missing `OPENAI_API_KEY` in openai mode
- `ImportError` on `from openai import OpenAI`

Operator has zero signal that they're serving demo data. At minimum: log a
`WARNING` in each fallback branch with the reason. Better: expose the
`effective_mode` via `/api/health` (see [H-1]).

---

**[M-3] `analyzer_factory` has no unit tests.**
File: `backend/tests/`

The factory has 4 non-trivial branches and 2 exception-swallowing paths.
`test_analyzer_gemini.py` covers the `GeminiAnalyzer` class but nothing
tests the branch selection. A misedit could silently break provider
routing and none of the current 27 tests would catch it.

Fix: add `test_analyzer_factory.py` with 4 cases (mock, gemini-with-key,
gemini-without-key, openai-with-key). Use `monkeypatch.setenv` + fresh
`Settings`.

---

**[M-4] Prompt duplicates the Pydantic schema in prose.**
File: `backend/app/services/prompts.py:29-75`

The JSON schema in `SYSTEM_PROMPT` is hand-maintained. Any change to
`AnalysisResult` (adding an enum value, renaming a field) will silently
skew: Pydantic validation will reject the LLM's now-legal-per-prompt
output and users will see `ANALYSIS_FAILED`.

Fix: auto-generate the schema hint from
`AnalysisResult.model_json_schema()` and embed a compact version at
module import time. Then there's a single source of truth.

Trade-off: `model_json_schema()` produces `$defs` refs that LLMs handle
poorly. Might need a small flattener. Still cheaper than the sync burden.

---

**[M-5] Empty-page catch-all hides parser errors.**
File: `backend/app/services/pdf_parser.py:36-40`

```python
try:
    text = page.extract_text() or ""
except Exception:
    text = ""
```

Bare `except Exception` silently zeroes a page. If pypdf regressed and
started failing every page, we'd raise `EmptyPDFTextError` — but the
operator would have no clue *why*. Log the exception at WARNING.

---

**[M-6] Frontend has no test for App.tsx's orchestration or error branches.**
File: `frontend/src/App.tsx`

`App.tsx` owns the whole workflow (health poll, analyze call, error
mapping) but there are zero tests. If someone breaks the state reset on
new-file-selected or the `RfpApiError` → error string mapping, no test
fails. Add at least one integration-style test that mounts `App`, mocks
`fetch`, and asserts the render path for success + error.

---

**[M-7] `useEffect` in App.tsx doesn't abort the in-flight fetch on unmount.**
File: `frontend/src/App.tsx:19-31`

The `cancelled` flag prevents setState after unmount but the underlying
`fetch` still runs to completion. Cheap fix: use `AbortController` and
`controller.abort()` in the cleanup. Not a bug for a top-level component
that never unmounts, but sloppy pattern that will hurt if App.tsx is
ever nested or if StrictMode double-invokes.

---

### LOW

**[L-1] `_get_provider` silently swallows unknown values.**
File: `backend/app/config.py:33-40`

Setting `LLM_PROVIDER=claude` falls back to `gemini` with no warning. Log
a WARNING for unrecognized values.

---

**[L-2] Frontend has no request timeout, no retry, no visible progress
beyond "분석 중...".**
File: `frontend/src/components/UploadCard.tsx`, `frontend/src/lib/api.ts`

Gemini can take 30-90s on a real RFP. Users have no time hint. Consider
either (a) show a progress bar with an indeterminate animation + copy
like "Gemini 응답을 기다리는 중… 최대 1분", or (b) stream tokens (much
larger change).

---

**[L-3] `_extract_text` fallback for older google-genai is dead code
if you pin `google-genai>=1.0.0`.**
File: `backend/app/services/gemini_analyzer.py:67-80`

Defensive but never exercised. Remove or add a test that triggers it.

---

**[L-4] `_parse_company` surfaces raw Pydantic error strings in the API
response.**
File: `backend/app/api/analyze.py:38-46`

The full `ValidationError.__str__()` includes Pydantic v2 URLs and
internal jargon. Not sensitive, just ugly. Map to a user-friendly
message and log the raw error server-side.

---

**[L-5] tsconfig.json injects test types into all files.**
File: `frontend/tsconfig.json`

`"types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]`
means production components see `describe`/`expect`/`toBeInTheDocument`
in the global type space. Won't break anything, but a linter would
flag it as boundary pollution. Consider a `tsconfig.test.json` that
extends the base and only adds test types.

---

**[L-6] `allow_headers=["*"]` in CORS.**
File: `backend/app/main.py:15-21`

Overly permissive. Explicit allowlist (`["content-type"]`) is enough
for our one POST endpoint. Not exploitable given no cookies /
credentials.

---

**[L-7] No `.python-version` or runtime pin in pyproject.**
File: `backend/pyproject.toml:4`

`requires-python = ">=3.11"` is a soft floor. A `.python-version` file
(pyenv/asdf convention) or a stricter cap (`<3.14`) would help
future-you when a new Python breaks dependencies.

---

**[L-8] No `.editorconfig`, no ESLint/Prettier config.**

Code is consistent as-written but a reviewer can't tell whether that's
by convention or by tooling. Portfolio bonus: add `.editorconfig` +
`.prettierrc` (5 lines each).

---

### NICE-TO-HAVE

- **[N-1]** GitHub Actions: run `pytest` + `vitest run` + `npm run build` on
  every push. Confidence signal for anyone viewing the repo.
- **[N-2]** A second mock scenario (e.g., a `GO` case and a `NO_GO` case)
  toggled via `?sample=go` query param would make the demo dramatically
  more compelling. Currently every mock run shows the same
  `CONDITIONAL_GO`.
- **[N-3]** Structured logging (`structlog` or `python-json-logger`) so a
  future prod deployment gets grep-able logs.
- **[N-4]** OpenAPI examples on the FastAPI endpoints (via `responses={...}`)
  so Swagger UI at `/docs` shows realistic payloads.
- **[N-5]** Playwright smoke test that clicks through the mock flow and
  screenshots the result — becomes portfolio evidence + regression net.
- **[N-6]** Frontend: keyboard shortcut (Cmd/Ctrl-Enter) to trigger
  Analyze once a file is selected.
- **[N-7]** Result page: a "Copy as JSON" button next to the download button
  for quick clipboard usage during a demo.

---

## 4. What the review did NOT cover

- No load test — 25MB PDF single-request path only.
- No security scan of dependencies (`pip-audit`, `npm audit`).
- No accessibility audit (a11y) beyond visual scan (color contrast looks OK,
  but no ARIA landmarks were verified).
- No verification of the OpenAI live path — key not available, only the
  unit-mocked path is covered.
- Prompt injection resistance was not tested with adversarial PDFs.

---

## 5. Recommended next 90-minute batch (highest ROI)

1. **Fix [H-1]** — add `effective_mode` to `/api/health` and reflect in
   frontend badge (10 min).
2. **Fix [H-2]** — cache analyzer client per settings-hash (15 min).
3. **Fix [H-3]** — bounded upload read with early size rejection (20 min).
4. **Add [M-3]** — 4 unit tests for `analyzer_factory` (15 min).
5. **Fix [M-1]** — 60s timeout on Gemini + AbortController on frontend
   fetch (20 min).

That gets you from "portfolio ready" to "I would run this at a hackathon
demo without hedging". Everything else is polish.

---

## 6. Reviewer's honest closing

For a solo portfolio piece built in one session, this is well above
average. The `SPEC` / `PLAN` / `README` triad, the Mock/Gemini/OpenAI
factory abstraction, the source-page evidence tracking, and the
disclaimer copy show product judgment beyond the code. The bugs above
are the kind you'd expect to find in any hand-written first pass at
this scope — they're all cheap to fix.

The single biggest lever for perception, if I were reviewing this as
a hiring signal: **fix [H-1] and add [N-2]** (a NO_GO mock scenario).
Together they turn the demo from "one canned response" into
"the tool clearly makes real decisions."
