import { useEffect, useRef, useState } from "react";
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
  const [configuredMode, setConfiguredMode] = useState<Mode | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);

  // Cancel an in-flight analyze when the user unmounts or starts a new one.
  const analyzeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // [M-7] abort the health poll if App unmounts before it resolves.
    const controller = new AbortController();
    fetchHealth({ signal: controller.signal })
      .then((h) => {
        if (controller.signal.aborted) return;
        setMode(h.mode);
        setConfiguredMode(h.configured_mode);
        setProvider(h.provider);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof Error && err.name === "AbortError") return;
        setMode("UNKNOWN");
        setConfiguredMode(null);
        setProvider(null);
      });
    return () => controller.abort();
  }, []);

  // Cancel any in-flight analyze when the whole app unmounts.
  useEffect(() => {
    return () => analyzeAbortRef.current?.abort();
  }, []);

  async function handleAnalyze() {
    if (!file || isAnalyzing) return;
    // If the user clicks Analyze twice, drop the older request.
    analyzeAbortRef.current?.abort();
    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeRfp(file, profile, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setResult(res);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof RfpApiError) {
        setError(`[${err.code}] ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      if (analyzeAbortRef.current === controller) {
        analyzeAbortRef.current = null;
      }
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header mode={mode} provider={provider} configuredMode={configuredMode} />
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
