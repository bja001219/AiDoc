import type { Risk, RiskCategory } from "../../lib/types";
import EvidenceBadge from "../EvidenceBadge";

interface Props {
  risks: Risk[];
}

const categoryLabel: Record<RiskCategory, string> = {
  technical: "Technical",
  security: "Security",
  schedule: "Schedule",
  business: "Business",
};

const categoryColor: Record<RiskCategory, string> = {
  technical: "bg-blue-100 text-blue-800",
  security: "bg-rose-100 text-rose-800",
  schedule: "bg-amber-100 text-amber-800",
  business: "bg-purple-100 text-purple-800",
};

export default function RisksTab({ risks }: Props) {
  if (risks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        확인된 리스크가 없습니다.
      </div>
    );
  }

  const grouped = new Map<RiskCategory, Risk[]>();
  for (const risk of risks) {
    const list = grouped.get(risk.category) ?? [];
    list.push(risk);
    grouped.set(risk.category, list);
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from(grouped.entries()).map(([category, list]) => (
        <section key={category} className="rounded-xl border border-slate-200 bg-white p-4">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${categoryColor[category]}`}
          >
            {categoryLabel[category]}
          </span>
          <ul className="mt-3 space-y-3">
            {list.map((risk, idx) => (
              <li key={idx}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-slate-900">{risk.title}</p>
                  <EvidenceBadge evidence={risk.evidence} />
                </div>
                <p className="mt-1 text-sm text-slate-600">{risk.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
