import React from "react";

interface SectionLabelProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "amber" | "teal" | "rose";
}

export default function SectionLabel({
  title,
  subtitle,
  icon,
  color,
}: SectionLabelProps) {
  const colors: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-500",
    teal: "bg-[var(--primary)]/10 text-[var(--primary)]",
    rose: "bg-rose-500/10 text-rose-500",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest leading-none">
          {title}
        </h2>
        <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
