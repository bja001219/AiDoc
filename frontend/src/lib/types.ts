export type Importance = "High" | "Medium" | "Low";
export type RiskCategory = "technical" | "security" | "schedule" | "business";
export type BidDecisionValue = "GO" | "CONDITIONAL_GO" | "NO_GO";
export type Mode = "MOCK" | "LIVE";
export type Provider = "gemini" | "openai";

export interface HealthResponse {
  status: string;
  mode: Mode;
  provider: Provider;
  model: string;
}

export interface Evidence {
  page?: number | null;
  quote?: string | null;
}

export interface ProjectOverview {
  project_name?: string | null;
  agency?: string | null;
  purpose?: string | null;
  period?: string | null;
  budget?: string | null;
  bidding_method?: string | null;
  contract_method?: string | null;
  evidence?: Evidence | null;
}

export interface Requirement {
  id: string;
  category: string;
  title: string;
  description: string;
  importance: Importance;
  evidence?: Evidence | null;
}

export interface EligibilityItem {
  title: string;
  detail?: string | null;
  evidence?: Evidence | null;
}

export interface EvaluationCriterion {
  name: string;
  weight?: string | null;
  detail?: string | null;
  evidence?: Evidence | null;
}

export interface RequiredDocument {
  name: string;
  note?: string | null;
  evidence?: Evidence | null;
}

export interface Risk {
  category: RiskCategory;
  title: string;
  description: string;
  evidence?: Evidence | null;
}

export interface CompanyFit {
  strengths: string[];
  gaps: string[];
  unknowns: string[];
}

export interface BidDecision {
  decision: BidDecisionValue;
  score: number;
  strengths: string[];
  risks: string[];
  rationale: string;
}

export interface ProposalStrategy {
  title: string;
  description: string;
}

export interface ProposalOutlineItem {
  section: string;
  points: string[];
}

export interface AnalysisResult {
  mode: Mode;
  project_overview: ProjectOverview;
  requirements: Requirement[];
  eligibility: EligibilityItem[];
  evaluation: EvaluationCriterion[];
  required_documents: RequiredDocument[];
  risks: Risk[];
  company_fit: CompanyFit;
  bid_decision: BidDecision;
  proposal_strategy: ProposalStrategy[];
  proposal_outline: ProposalOutlineItem[];
}

export interface CompanyProfile {
  name: string;
  tech_stack: string[];
  people: string[];
  capabilities: string[];
  experiences: string[];
  certifications: string[];
  notes?: string | null;
}

export interface ApiError {
  code: string;
  message: string;
}
