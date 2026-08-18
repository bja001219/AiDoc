import type {
  AnalysisResult,
  ApiError,
  CompanyProfile,
  HealthResponse,
} from "./types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000";

export class RfpApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
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

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new RfpApiError(
      0,
      "NETWORK_ERROR",
      "백엔드에 연결할 수 없습니다. FastAPI 서버(기본 http://localhost:8000)가 실행 중인지 확인해 주세요.",
    );
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await safeFetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) throw await readError(response);
  return (await response.json()) as HealthResponse;
}

export async function analyzeRfp(
  file: File,
  company: CompanyProfile,
): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("company", JSON.stringify(company));

  const response = await safeFetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw await readError(response);
  return (await response.json()) as AnalysisResult;
}
