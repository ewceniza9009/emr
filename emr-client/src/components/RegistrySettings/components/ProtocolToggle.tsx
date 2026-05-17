import React from "react";

interface ProtocolToggleProps {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

export default function ProtocolToggle({
  title,
  desc,
  checked,
  onChange,
}: ProtocolToggleProps) {
  return (
    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer hover:border-[var(--primary)]/20 transition-all">
      <div className="flex items-center gap-4">
        <div
          className={`w-2 h-2 rounded-full ${
            checked ? "bg-[var(--primary)] animate-pulse" : "bg-slate-700"
          }`}
        />
        <div>
          <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tighter">
            {title}
          </p>
          <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            {desc}
          </p>
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-[var(--card-border)] bg-[var(--background)] text-[var(--primary)] focus:ring-[var(--primary)]"
      />
    </label>
  );
}
