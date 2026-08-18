import { useState } from "react";
import type { CompanyProfile } from "../lib/types";

interface Props {
  profile: CompanyProfile;
  onChange: (profile: CompanyProfile) => void;
}

function joinLines(items: string[]): string {
  return items.join("\n");
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function CompanyProfileCard({ profile, onChange }: Props) {
  const [editing, setEditing] = useState(false);

  function update<K extends keyof CompanyProfile>(
    key: K,
    value: CompanyProfile[K],
  ) {
    onChange({ ...profile, [key]: value });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Company Profile</h2>
          <p className="text-sm text-slate-500">
            분석 시 회사 적합도를 판단하는 근거가 됩니다.
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
          onClick={() => setEditing((prev) => !prev)}
        >
          {editing ? "완료" : "편집"}
        </button>
      </header>

      {editing ? (
        <div className="space-y-4 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              회사명
            </span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={profile.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>
          <TextareaField
            label="기술 스택 (한 줄에 하나)"
            value={joinLines(profile.tech_stack)}
            onChange={(v) => update("tech_stack", splitLines(v))}
          />
          <TextareaField
            label="인력 구성 (한 줄에 하나)"
            value={joinLines(profile.people)}
            onChange={(v) => update("people", splitLines(v))}
          />
          <TextareaField
            label="보유 역량 (한 줄에 하나)"
            value={joinLines(profile.capabilities)}
            onChange={(v) => update("capabilities", splitLines(v))}
          />
          <TextareaField
            label="수행 실적 (한 줄에 하나)"
            value={joinLines(profile.experiences)}
            onChange={(v) => update("experiences", splitLines(v))}
          />
          <TextareaField
            label="보유 인증 (한 줄에 하나)"
            value={joinLines(profile.certifications)}
            onChange={(v) => update("certifications", splitLines(v))}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              기타 메모
            </span>
            <textarea
              className="min-h-[60px] w-full rounded-md border border-slate-300 px-3 py-2"
              value={profile.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
            />
          </label>
        </div>
      ) : (
        <dl className="space-y-3 text-sm">
          <Row label="회사명" value={profile.name} />
          <Row label="기술" value={profile.tech_stack.join(" · ") || "-"} />
          <Row label="인력" value={profile.people.join(" · ") || "-"} />
          <Row label="역량" value={profile.capabilities.join(" · ") || "-"} />
          <Row
            label="실적"
            value={profile.experiences.length ? profile.experiences.join(" · ") : "없음"}
          />
          <Row
            label="인증"
            value={
              profile.certifications.length ? profile.certifications.join(" · ") : "없음"
            }
          />
          {profile.notes && <Row label="메모" value={profile.notes} />}
        </dl>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <dt className="col-span-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="col-span-3 text-slate-800">{value}</dd>
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <textarea
        className="min-h-[70px] w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
