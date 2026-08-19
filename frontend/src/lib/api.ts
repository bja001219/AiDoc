import type {
  AnalysisResult,
  ApiError,
  CompanyProfile,
  HealthResponse,
} from "./types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000";

const HEALTH_TIMEOUT_MS = 10_000;   // health should be near-instant
const ANALYZE_TIMEOUT_MS = 120_000; // Gemini can take ~60s on large RFPs

export class RfpApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface SafeFetchInit extends RequestInit {
  /** Total budget in ms before the fetch is aborted with a TIMEOUT error. */
  timeoutMs?: number;
}

async function readError(response: Response): Promise<RfpApiError> {
  let code = "UNKNOWN_ERROR";
  let message = `요청이 실패했습니다 (HTTP ${response.status}).`;
  try {
    const body = (await response.json()) as { error?: ApiError };
    if (body.error?.code) code = body.error.code;
    if (body.error?.message) message = body.error.message;
  } catch {
    /* body was not JSON */
  }
  return new RfpApiError(response.status, code, message);
}

function combineSignals(signals: AbortSignal[]): AbortSignal {
  // AbortSignal.any is available in Node 20+ and every evergreen browser we
  // target. If somehow missing, degrade to just the first signal.
  const any = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  return typeof any === "function" ? any(signals) : signals[0];
}

async function safeFetch(url: string, init: SafeFetchInit = {}): Promise<Response> {
  const { timeoutMs = ANALYZE_TIMEOUT_MS, signal: externalSignal, ...rest } = init;

  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);

  const signals: AbortSignal[] = [timeoutController.signal];
  if (externalSignal) signals.push(externalSignal);
  const signal = signals.length === 1 ? signals[0] : combineSignals(signals);

  try {
    return await fetch(url, { ...rest, signal });
  } catch (err) {
    if (timeoutController.signal.aborted) {
      throw new RfpApiError(
        0,
        "TIMEOUT",
        `요청이 ${Math.round(timeoutMs / 1000)}초 안에 완료되지 않았습니다. 백엔드나 LLM 응답이 지연되었을 수 있습니다.`,
      );
    }
    // Caller-triggered abort: let the raw error propagate so the caller
    // (App.tsx cleanup, etc.) can distinguish it from a real network fault.
    if (externalSignal?.aborted) {
      throw err;
    }
    throw new RfpApiError(
      0,
      "NETWORK_ERROR",
      "백엔드에 연결할 수 없습니다. FastAPI 서버(기본 http://localhost:8000)가 실행 중인지 확인해 주세요.",
    );
  } finally {
    clearTimeout(timer);
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export async function fetchHealth(opts: RequestOptions = {}): Promise<HealthResponse> {
  const response = await safeFetch(`${API_BASE_URL}/api/health`, {
    signal: opts.signal,
    timeoutMs: HEALTH_TIMEOUT_MS,
  });
  if (!response.ok) throw await readError(response);
  return (await response.json()) as HealthResponse;
}

export async function analyzeRfp(
  file: File,
  company: CompanyProfile,
  opts: RequestOptions = {},
): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("company", JSON.stringify(company));

  const response = await safeFetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: form,
    signal: opts.signal,
    timeoutMs: ANALYZE_TIMEOUT_MS,
  });
  if (!response.ok) throw await readError(response);
  return (await response.json()) as AnalysisResult;
}
