import React from "react";

interface ControlCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: React.ReactNode;
}

export default function ControlCard({
  title,
  subtitle,
  icon,
  action,
}: ControlCardProps) {
  return (
    <div className="p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between group hover:border-[var(--primary)]/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--card-border)] group-hover:scale-105 transition-all">
          {icon}
        </div>
        <div>
          <h4 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tighter">
            {title}
          </h4>
          <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            {subtitle}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}
