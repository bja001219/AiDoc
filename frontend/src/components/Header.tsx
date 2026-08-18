import type { Provider } from "../lib/types";

type ModeBadge = "MOCK" | "LIVE" | "UNKNOWN";

interface HeaderProps {
  mode: ModeBadge;
  provider?: Provider | null;
}

const modeStyles: Record<ModeBadge, string> = {
  MOCK: "bg-amber-100 text-amber-800 border-amber-200",
  LIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  UNKNOWN: "bg-slate-100 text-slate-600 border-slate-200",
};

const providerLabel: Record<Provider, string> = {
  gemini: "Gemini",
  openai: "OpenAI",
};

function badgeText(mode: ModeBadge, provider?: Provider | null): string {
  if (mode === "UNKNOWN") return "checking...";
  if (mode === "LIVE" && provider) return `LIVE · ${providerLabel[provider]}`;
  return mode;
}

export default function Header({ mode, provider }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            PublicBid AI Assistant
          </h1>
          <p className="text-sm text-slate-500">
            AI-powered RFP Analysis for Public Sector Projects
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${modeStyles[mode]}`}
          data-testid="mode-badge"
        >
          {badgeText(mode, provider)}
        </span>
      </div>
    </header>
  );
}
