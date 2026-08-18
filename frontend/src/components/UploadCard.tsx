import { useRef, useState } from "react";

interface Props {
  file: File | null;
  onFileSelected: (file: File | null) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  disabled?: boolean;
  error?: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadCard({
  file,
  onFileSelected,
  onAnalyze,
  isAnalyzing,
  disabled,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick() {
    inputRef.current?.click();
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onFileSelected(dropped);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">RFP 업로드</h2>
        <p className="text-sm text-slate-500">
          공공사업 RFP PDF를 업로드하면 AI가 요구사항·평가기준·리스크·회사 적합도를
          분석합니다.
        </p>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={pick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") pick();
        }}
        data-testid="upload-dropzone"
        className={
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition " +
          (dragging
            ? "border-brand-500 bg-brand-50"
            : "border-slate-300 hover:border-brand-400 hover:bg-slate-50")
        }
      >
        <p className="text-sm font-medium text-slate-700">
          PDF 파일을 여기에 드롭하거나 클릭하여 선택
        </p>
        <p className="mt-1 text-xs text-slate-500">최대 25MB · .pdf 만 지원</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
          data-testid="upload-input"
        />
      </div>

      {file && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-slate-900" data-testid="file-name">
              {file.name}
            </p>
            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            className="text-xs text-slate-500 hover:text-slate-700"
            onClick={() => onFileSelected(null)}
          >
            제거
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={!file || isAnalyzing || disabled}
          onClick={onAnalyze}
          className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isAnalyzing ? "분석 중..." : "Analyze RFP"}
        </button>
      </div>
    </section>
  );
}
