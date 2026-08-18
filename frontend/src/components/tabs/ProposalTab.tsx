import type { ProposalOutlineItem, ProposalStrategy } from "../../lib/types";

interface Props {
  strategy: ProposalStrategy[];
  outline: ProposalOutlineItem[];
}

export default function ProposalTab({ strategy, outline }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">제안 전략</h3>
        {strategy.length === 0 ? (
          <Empty text="제안 전략을 생성하지 못했습니다." />
        ) : (
          <ol className="space-y-3">
            {strategy.map((item, idx) => (
              <li
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {idx + 1}. {item.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">제안서 목차</h3>
        {outline.length === 0 ? (
          <Empty text="목차를 생성하지 못했습니다." />
        ) : (
          <ol className="space-y-3">
            {outline.map((section, idx) => (
              <li
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {section.section}
                </p>
                {section.points.length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-600">
                    {section.points.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
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
