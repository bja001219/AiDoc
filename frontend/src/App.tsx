import { useEffect, useState } from "react";
import Header from "./components/Header";
import CompanyProfileCard from "./components/CompanyProfileCard";
import UploadCard from "./components/UploadCard";
import ResultSummary from "./components/ResultSummary";
import ResultTabs from "./components/ResultTabs";
import Disclaimer from "./components/Disclaimer";
import { DEFAULT_COMPANY } from "./lib/companyDefaults";
import { RfpApiError, analyzeRfp, fetchHealth } from "./lib/api";
import type {
  AnalysisResult,
  CompanyProfile,
  Mode,
  Provider,
} from "./lib/types";

type ModeUiState = Mode | "UNKNOWN";

export default function App() {
  const [profile, setProfile] = useState<CompanyProfile>(DEFAULT_COMPANY);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ModeUiState>("UNKNOWN");
  const [provider, setProvider] = useState<Provider | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((h) => {
        if (cancelled) return;
        setMode(h.mode);
        setProvider(h.provider);
      })
      .catch(() => {
        if (!cancelled) {
          setMode("UNKNOWN");
          setProvider(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAnalyze() {
    if (!file || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeRfp(file, profile);
      setResult(res);
    } catch (err) {
      if (err instanceof RfpApiError) {
        setError(`[${err.code}] ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header mode={mode} provider={provider} />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <CompanyProfileCard profile={profile} onChange={setProfile} />
          </div>
          <div className="lg:col-span-2">
            <UploadCard
              file={file}
              onFileSelected={(f) => {
                setFile(f);
                setError(null);
              }}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              error={error}
            />
          </div>
        </div>

        {result && (
          <>
            <ResultSummary result={result} />
            <ResultTabs result={result} />
          </>
        )}

        <Disclaimer />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        PublicBid AI Assistant · Portfolio MVP · 2026
      </footer>
    </div>
  );
}
