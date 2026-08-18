import type { Evidence } from "../lib/types";

interface Props {
  evidence?: Evidence | null;
  className?: string;
}

export default function EvidenceBadge({ evidence, className }: Props) {
  if (!evidence || evidence.page == null) return null;
  return (
    <span
      className={
        "inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 " +
        (className ?? "")
      }
      title={evidence.quote ?? undefined}
    >
      Source: p.{evidence.page}
    </span>
  );
}
