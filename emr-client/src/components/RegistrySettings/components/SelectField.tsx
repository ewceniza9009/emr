import React from "react";
import { ChevronRight } from "lucide-react";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  icon: React.ReactNode;
}

export default function SelectField({
  label,
  value,
  onChange,
  options,
  icon,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="clinical-label px-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">
          {icon}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-10 pr-4 text-[10px] font-black uppercase tracking-tight text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/5 outline-none appearance-none cursor-pointer transition-all"
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[var(--sidebar-bg)] text-[var(--text-primary)] py-2"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] rotate-90" />
      </div>
    </div>
  );
}
