import { useState } from "react";
import type { AnalysisResult } from "../lib/types";
import OverviewTab from "./tabs/OverviewTab";
import RequirementsTab from "./tabs/RequirementsTab";
import EligibilityTab from "./tabs/EligibilityTab";
import EvaluationTab from "./tabs/EvaluationTab";
import RisksTab from "./tabs/RisksTab";
import CompanyFitTab from "./tabs/CompanyFitTab";
import ProposalTab from "./tabs/ProposalTab";

interface Props {
  result: AnalysisResult;
}

type TabKey =
  | "overview"
  | "requirements"
  | "eligibility"
  | "evaluation"
  | "risks"
  | "fit"
  | "proposal";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "requirements", label: "Requirements" },
  { key: "eligibility", label: "Eligibility" },
  { key: "evaluation", label: "Evaluation" },
  { key: "risks", label: "Risks" },
  { key: "fit", label: "Company Fit" },
  { key: "proposal", label: "Proposal" },
];

export default function ResultTabs({ result }: Props) {
  const [active, setActive] = useState<TabKey>("overview");

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      data-testid="result-tabs"
    >
      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={
              "rounded-lg px-3 py-1.5 text-sm font-medium transition " +
              (active === tab.key
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100")
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-5">
        {active === "overview" && (
          <OverviewTab overview={result.project_overview} />
        )}
        {active === "requirements" && (
          <RequirementsTab requirements={result.requirements} />
        )}
        {active === "eligibility" && (
          <EligibilityTab
            eligibility={result.eligibility}
            requiredDocuments={result.required_documents}
          />
        )}
        {active === "evaluation" && (
          <EvaluationTab evaluation={result.evaluation} />
        )}
        {active === "risks" && <RisksTab risks={result.risks} />}
        {active === "fit" && <CompanyFitTab fit={result.company_fit} />}
        {active === "proposal" && (
          <ProposalTab
            strategy={result.proposal_strategy}
            outline={result.proposal_outline}
          />
        )}
      </div>
    </section>
  );
}
