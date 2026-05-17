import React from "react";
import Image from "next/image";
import { User, Navigation, Check } from "lucide-react";

interface ProviderCardProps {
  p: any;
  isSelected: boolean;
  onClick: () => void;
  role?: string;
}

export default function ProviderCard({
  p,
  isSelected,
  onClick,
  role,
}: ProviderCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 border rounded-xl text-left transition-all group relative overflow-hidden active:scale-[0.98] ${
        isSelected
          ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow-md"
          : "bg-[var(--card-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/40 hover:shadow-lg"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {p.avatarUrl ? (
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src={p.avatarUrl}
                alt={p.fullName || "Provider"}
                fill
                className="rounded-lg border border-[var(--card-border)] object-cover shadow-sm"
                unoptimized
              />
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)]"
                  : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] group-hover:text-[var(--primary)]"
              }`}
            >
              <User className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <p
                className={`text-[12px] font-black tracking-tight transition-colors ${
                  isSelected
                    ? "text-[var(--primary)]"
                    : "text-[var(--text-primary)] group-hover:text-[var(--primary)]"
                }`}
              >
                {p.fullName}
              </p>
              {p.isCareNavigator && (
                <span className="px-1 py-0.5 rounded bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[7px] font-black text-[var(--primary)] uppercase tracking-tighter">
                  CN
                </span>
              )}
              {p.isSupportingClinician && (
                <span className="px-1 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[7px] font-black text-sky-500 uppercase tracking-tighter">
                  SC
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <Navigation className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  {Math.round(p.travelTimeMinutes || 0)}m
                </span>
              </div>
              <span className="w-0.5 h-0.5 rounded-full bg-[var(--card-border)]" />
              <span className="text-[9px] font-bold text-[var(--text-muted)]">
                {p.distanceInMiles?.toFixed(1) || "0.0"}mi
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className={`px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-widest ${
              isSelected
                ? "bg-[var(--primary)] text-white border-transparent"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)]"
            }`}
          >
            {p.position || "Clinician"}
          </div>
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
              isSelected
                ? "bg-[var(--primary)] border-transparent text-white"
                : "border-[var(--card-border)] text-transparent"
            }`}
          >
            <Check className="w-3 h-3" />
          </div>
        </div>
      </div>
    </button>
  );
}
