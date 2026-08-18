import type { CompanyProfile } from "./types";

export const DEFAULT_COMPANY: CompanyProfile = {
  name: "Demo AI Solutions",
  tech_stack: ["Python", "FastAPI", "React", "LLM API", "RAG", "Linux"],
  people: ["PM 1", "Backend 2", "Frontend 1", "AI Engineer 1"],
  capabilities: [
    "Web service development",
    "AI API integration",
    "Internal knowledge search system",
  ],
  experiences: [],
  certifications: [],
  notes: "공공사업 수행실적 없음, 별도 인증 없음",
};
