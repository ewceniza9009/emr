"use client";

import React from "react";
import { ShieldCheck, X } from "lucide-react";
import { EnrollmentState } from "../../../hooks/useEnrollmentState";

interface DemographicsHUDProps {
  state: EnrollmentState;
}

export default function DemographicsHUD({ state }: DemographicsHUDProps) {
  const statusLabel = state.lead.status?.replaceAll("_", " ") || "";

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] space-y-3 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-[var(--primary-glow)]">
          {state.lead.firstName?.[0] || "?"}
          {state.lead.lastName?.[0] || "?"}
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
            {state.lead.firstName || "Unknown"} {state.lead.lastName || "Patient"}
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest opacity-80">
              {state.lead.referralSource || "Internal Lead"}
            </p>
            <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              {state.patientDob
                ? `${new Date(state.patientDob).toLocaleDateString()} (${Math.floor(
                    (new Date().getTime() - new Date(state.patientDob).getTime()) /
                      31557600000,
                  )}Y)`
                : "DOB: --"}
            </p>
            {(state.patientSex || state.genderIdentity) && (
              <>
                <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  {state.patientSex}
                  {state.genderIdentity ? ` (${state.genderIdentity})` : ""}
                </p>
              </>
            )}
            {state.patientLanguage && (
              <>
                <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  {state.patientLanguage}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {state.lead.isDoNotCall && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> Do Not Call
              </span>
            )}
            {state.lead.isOptedOut && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                <X className="w-2.5 h-2.5" /> Marketing Opt-Out
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border
                  ${
                    state.lead.status === "ENROLLED"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      : state.lead.status === "REFUSED" ||
                          state.lead.status === "DO_NOT_CALL"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                        : "bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]"
                  }`}
            >
              Status: {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
