import type { AnalysisResult, BidDecisionValue } from "../lib/types";

interface Props {
  result: AnalysisResult;
}

function slugify(input: string | null | undefined): string {
  if (!input) return "analysis";
  const cleaned = input
    .replace(/[^\p{L}\p{N}\-\s_]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
  return cleaned || "analysis";
}

function downloadResultJson(result: AnalysisResult): void {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugify(result.project_overview.project_name)}.analysis.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const decisionStyle: Record<
  BidDecisionValue,
  { label: string; bg: string; text: string; ring: string }
> = {
  GO: {
    label: "GO",
    bg: "bg-emerald-500",
    text: "text-white",
    ring: "ring-emerald-200",
  },
  CONDITIONAL_GO: {
    label: "CONDITIONAL GO",
    bg: "bg-amber-500",
    text: "text-white",
    ring: "ring-amber-200",
  },
  NO_GO: { label: "NO-GO", bg: "bg-rose-500", text: "text-white", ring: "ring-rose-200" },
};

export default function ResultSummary({ result }: Props) {
  const decision = decisionStyle[result.bid_decision.decision];
  const overview = result.project_overview;
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      data-testid="result-summary"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            사업명
          </p>
          <h2 className="mt-1 text-lg font-semibold leading-snug text-slate-900">
            {overview.project_name ?? "문서에서 확인되지 않음"}
          </h2>
          {overview.agency && (
            <p className="mt-1 text-sm text-slate-500">{overview.agency}</p>
          )}
        </div>
        <SummaryStat label="Budget" value={overview.budget ?? "-"} />
        <SummaryStat label="Period" value={overview.period ?? "-"} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-5 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Bid Fit Score
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {result.bid_decision.score}
              <span className="ml-1 text-sm font-normal text-slate-500">/ 100</span>
            </p>
          </div>
        </div>
        <span
          data-testid="decision-badge"
          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ring-4 ${decision.bg} ${decision.text} ${decision.ring}`}
        >
          {decision.label}
        </span>
        <p className="max-w-xl text-sm text-slate-600">
          {result.bid_decision.rationale}
        </p>
        <button
          type="button"
          data-testid="download-json"
          onClick={() => downloadResultJson(result)}
          className="ml-auto inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          JSON 다운로드
        </button>
      </div>
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-medium text-slate-900">{value}</p>
    </div>
  );
}
