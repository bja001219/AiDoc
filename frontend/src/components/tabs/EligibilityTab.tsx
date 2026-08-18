import type { EligibilityItem, RequiredDocument } from "../../lib/types";
import EvidenceBadge from "../EvidenceBadge";

interface Props {
  eligibility: EligibilityItem[];
  requiredDocuments: RequiredDocument[];
}

export default function EligibilityTab({ eligibility, requiredDocuments }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">참가 자격</h3>
        {eligibility.length === 0 ? (
          <Empty text="확인된 참가 자격 조건이 없습니다." />
        ) : (
          <ul className="space-y-3">
            {eligibility.map((item, idx) => (
              <li
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <EvidenceBadge evidence={item.evidence} />
                </div>
                {item.detail && (
                  <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">제출 자료</h3>
        {requiredDocuments.length === 0 ? (
          <Empty text="확인된 제출 자료가 없습니다." />
        ) : (
          <ul className="space-y-2">
            {requiredDocuments.map((doc, idx) => (
              <li
                key={idx}
                className="flex items-start justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
              >
                <div>
                  <p className="text-slate-900">{doc.name}</p>
                  {doc.note && (
                    <p className="text-xs text-slate-500">{doc.note}</p>
                  )}
                </div>
                <EvidenceBadge evidence={doc.evidence} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
