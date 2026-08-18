import type { CompanyFit } from "../../lib/types";

interface Props {
  fit: CompanyFit;
}

interface BucketProps {
  title: string;
  items: string[];
  icon: string;
  color: string;
  emptyText: string;
}

function Bucket({ title, items, icon, color, emptyText }: BucketProps) {
  return (
    <section className={`rounded-xl border p-4 ${color}`}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden>{icon}</span> {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CompanyFitTab({ fit }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Bucket
        title="적합"
        items={fit.strengths}
        icon="✅"
        color="border-emerald-200 bg-emerald-50 text-emerald-900"
        emptyText="확인된 적합 항목이 없습니다."
      />
      <Bucket
        title="확인 필요"
        items={fit.unknowns}
        icon="⚠️"
        color="border-amber-200 bg-amber-50 text-amber-900"
        emptyText="확인이 필요한 항목이 없습니다."
      />
      <Bucket
        title="부족"
        items={fit.gaps}
        icon="❌"
        color="border-rose-200 bg-rose-50 text-rose-900"
        emptyText="현재 부족으로 판단된 항목이 없습니다."
      />
    </div>
  );
}
