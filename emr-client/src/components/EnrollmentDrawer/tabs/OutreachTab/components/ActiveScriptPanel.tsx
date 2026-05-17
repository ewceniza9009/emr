"use client";

import React from "react";
import { EnrollmentState } from "../../../hooks/useEnrollmentState";

interface ActiveScriptPanelProps {
  state: EnrollmentState;
}

export default function ActiveScriptPanel({ state }: ActiveScriptPanelProps) {
  const interpolatedScript = state.activeScript?.content
    ? state.activeScript.content
        .replace("{firstName}", state.lead.firstName || "")
        .replace("{lastName}", state.lead.lastName || "")
        .replaceAll("deployment", "home visit")
    : `"Hello ${state.lead.firstName || ""}, I'm calling from Halkyone Health..."`;

  return (
    <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-4 shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-[0.2em]">
          Active Interaction Script
        </p>
        <select
          className="bg-transparent border-none text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest outline-none cursor-pointer [color-scheme:dark]"
          value={state.selectedScriptId || ""}
          onChange={(e) => state.setSelectedScriptId(e.target.value)}
        >
          {state.scripts.map((s: any) => (
            <option key={s.outreachScriptId} value={s.outreachScriptId}>
              {s.scriptTitle}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed italic opacity-80">
        {interpolatedScript}
      </p>
    </div>
  );
}
