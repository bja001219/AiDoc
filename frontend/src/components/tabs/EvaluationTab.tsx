import type { EvaluationCriterion } from "../../lib/types";
import EvidenceBadge from "../EvidenceBadge";

interface Props {
  evaluation: EvaluationCriterion[];
}

export default function EvaluationTab({ evaluation }: Props) {
  if (evaluation.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        확인된 평가 기준이 없습니다.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">평가 항목</th>
            <th className="px-4 py-3 text-left">배점</th>
            <th className="px-4 py-3 text-left">세부</th>
            <th className="px-4 py-3 text-left">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {evaluation.map((item, idx) => (
            <tr key={idx}>
              <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
              <td className="px-4 py-3 text-slate-700">{item.weight ?? "-"}</td>
              <td className="px-4 py-3 text-slate-600">{item.detail ?? "-"}</td>
              <td className="px-4 py-3">
                <EvidenceBadge evidence={item.evidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
