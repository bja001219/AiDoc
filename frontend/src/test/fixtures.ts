import type { AnalysisResult } from "../lib/types";

export const sampleResult: AnalysisResult = {
  mode: "MOCK",
  project_overview: {
    project_name: "한국투자공사 내부 인공지능 플랫폼 및 인프라 구축",
    agency: "한국투자공사",
    purpose: "내부 지식 검색용 생성형 AI 플랫폼 구축",
    period: "6개월",
    budget: "1,250,000,000원",
    bidding_method: "협상에 의한 계약",
    contract_method: "총액 확정",
    evidence: { page: 3, quote: "예산 12억5천" },
  },
  requirements: [
    {
      id: "SFR-001",
      category: "기능",
      title: "생성형 AI 기반 지식 검색",
      description: "내부 문서에 대한 질의응답과 근거 링크 제공",
      importance: "High",
      evidence: { page: 5, quote: "지식 검색 서비스" },
    },
    {
      id: "SER-001",
      category: "보안",
      title: "내부 정보 외부 반출 금지",
      description: "임베딩 및 원문은 내부 인프라에서만 처리",
      importance: "High",
      evidence: { page: 30 },
    },
  ],
  eligibility: [
    {
      title: "소프트웨어 사업자 신고",
      detail: "소프트웨어산업진흥법에 따른 신고 필",
      evidence: { page: 41 },
    },
  ],
  evaluation: [
    { name: "기술 평가", weight: "90점", detail: "사업 이해도 등", evidence: { page: 55 } },
    { name: "가격 평가", weight: "10점" },
  ],
  required_documents: [
    { name: "입찰참가신청서" },
    { name: "기술제안서" },
  ],
  risks: [
    {
      category: "security",
      title: "외부 LLM API 제한",
      description: "내부 정보 반출 금지로 상용 API 사용 불가",
      evidence: { page: 30 },
    },
    {
      category: "schedule",
      title: "6개월 촉박",
      description: "범위 대비 일정 리스크 존재",
    },
  ],
  company_fit: {
    strengths: ["React + FastAPI 개발 역량", "RAG 파이프라인 경험"],
    gaps: ["공공/금융 실적 없음"],
    unknowns: ["온프레미스 GPU 파트너 확보 필요"],
  },
  bid_decision: {
    decision: "CONDITIONAL_GO",
    score: 72,
    strengths: ["핵심 기술 요구 충족"],
    risks: ["실적 요건"],
    rationale: "핵심 기술은 부합하나 실적/인프라 보완 필요.",
  },
  proposal_strategy: [
    {
      title: "지식 검색 정확도 차별화",
      description: "청크 전략과 재순위 파이프라인을 전면 배치.",
    },
  ],
  proposal_outline: [
    { section: "1. 제안 개요", points: ["사업 이해", "추진 목표"] },
    { section: "2. 사업 수행 전략", points: ["RAG 파이프라인"] },
  ],
};
