"use client";

import React from "react";
import { X, Check, FolderLock, HeartPulse } from "lucide-react";
import { TabType, TABS } from "../types";
import { EnrollmentState } from "../hooks/useEnrollmentState";

interface Props {
  state: EnrollmentState;
  lead: any;
  onClose: () => void;
}

export default function DrawerHeader({ state, lead, onClose }: Props) {
  return (
    <div className="h-20 flex items-center justify-between px-8 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)]/80 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-50" />
            <HeartPulse className="w-5 h-5 relative z-10" />
          </div>
        </div>
        <div>
          <h2 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.25em] leading-none">
            Enrollment
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-[0.08em]">
              {lead?.firstName} {lead?.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Stepper Navigation */}
      <div className="flex-1 flex justify-center px-4">
        <div className="flex bg-[var(--input-bg)]/50 rounded-xl p-1 border border-[var(--card-border)] backdrop-blur-sm shadow-inner gap-1">
          {(["OUTREACH", "ADMIN", "LEGAL", "CLINICAL", "LOGISTICS"] as TabType[]).map((tab, idx) => {
            const isActive = state.activeTab === tab;
            const isComplete = state.checkStepCompleteness(tab);
            const isLocked = idx > 0 && !TABS.slice(0, idx).every((t) => state.checkStepCompleteness(t));

            return (
              <button
                key={tab}
                onClick={() => !isLocked && state.setActiveTab(tab)}
                disabled={isLocked}
                className={`relative px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 group/tab
                ${isActive ? "bg-[var(--primary)] text-black shadow-[0_0_15px_rgba(var(--primary-rgb),0.25)]" : isLocked ? "opacity-30 cursor-not-allowed grayscale" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"}`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[7px] transition-all
                ${isActive ? "border-black/20 bg-black/5" : isComplete ? "bg-teal-500/20 border-teal-500/40 text-teal-500" : isLocked ? "border-[var(--card-border)]/30 opacity-50" : "border-[var(--card-border)]"}`}
                >
                  {isComplete && !isActive ? (
                    <Check className="w-2 h-2" />
                  ) : isLocked ? (
                    <FolderLock className="w-2 h-2" />
                  ) : (
                    `0${idx + 1}`
                  )}
                </span>
                {tab}
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0.75 h-0.75 rounded-full bg-black/40" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-10 h-10 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center group shrink-0"
      >
        <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}

