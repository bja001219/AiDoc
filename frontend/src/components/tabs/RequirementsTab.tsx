import type { Importance, Requirement } from "../../lib/types";
import EvidenceBadge from "../EvidenceBadge";

interface Props {
  requirements: Requirement[];
}

const importanceStyle: Record<Importance, string> = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-slate-100 text-slate-600",
};

export default function RequirementsTab({ requirements }: Props) {
  if (requirements.length === 0) {
    return <EmptyState text="추출된 요구사항이 없습니다." />;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">분류</th>
            <th className="px-4 py-3 text-left">요구사항</th>
            <th className="px-4 py-3 text-left">중요도</th>
            <th className="px-4 py-3 text-left">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requirements.map((req) => (
            <tr key={req.id} data-testid={`req-${req.id}`}>
              <td className="px-4 py-3 font-mono text-xs text-slate-700">
                {req.id}
              </td>
              <td className="px-4 py-3 text-slate-700">{req.category}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{req.title}</p>
                <p className="mt-1 text-xs text-slate-600">{req.description}</p>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${importanceStyle[req.importance]}`}
                >
                  {req.importance}
                </span>
              </td>
              <td className="px-4 py-3">
                <EvidenceBadge evidence={req.evidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
