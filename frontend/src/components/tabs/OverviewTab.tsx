import type { ProjectOverview } from "../../lib/types";
import EvidenceBadge from "../EvidenceBadge";

interface Props {
  overview: ProjectOverview;
}

const FIELDS: Array<[keyof ProjectOverview, string]> = [
  ["project_name", "사업명"],
  ["agency", "발주기관"],
  ["purpose", "사업 목적"],
  ["period", "사업 기간"],
  ["budget", "사업 예산"],
  ["bidding_method", "입찰 방식"],
  ["contract_method", "계약 방법"],
];

export default function OverviewTab({ overview }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {FIELDS.map(([key, label]) => {
        const value = overview[key] as string | null | undefined;
        return (
          <div
            key={key as string}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {value ?? "문서에서 확인되지 않음"}
            </p>
          </div>
        );
      })}
      {overview.evidence && (
        <div className="md:col-span-2">
          <EvidenceBadge evidence={overview.evidence} />
        </div>
      )}
    </div>
  );
}
