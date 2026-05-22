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
        <div className="flex bg-slate-200/50 dark:bg-neutral-900/60 backdrop-blur-md rounded-full p-1 border border-slate-300/40 dark:border-neutral-800/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] gap-0.5">
          {(["OUTREACH", "ADMIN", "LEGAL", "CLINICAL", "LOGISTICS"] as TabType[]).map((tab, idx) => {
            const isActive = state.activeTab === tab;
            const isComplete = state.checkStepCompleteness(tab);
            const isLocked = idx > 0 && !TABS.slice(0, idx).every((t) => state.checkStepCompleteness(t));

            return (
              <button
                key={tab}
                onClick={() => !isLocked && state.setActiveTab(tab)}
                disabled={isLocked}
                className={`relative px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-[0.16em] transition-all duration-300 flex items-center gap-2 group/tab border border-transparent
                ${isActive 
                  ? "bg-white dark:bg-white/10 text-[var(--primary)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] border-slate-200/50 dark:border-white/5" 
                  : isLocked 
                    ? "opacity-35 cursor-not-allowed text-slate-400 dark:text-neutral-600" 
                    : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-white/[0.02]"}`}
              >
                {isComplete && !isActive ? (
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                ) : isLocked ? (
                  <FolderLock className="w-3 h-3 text-slate-400 dark:text-neutral-600" />
                ) : (
                  <span className={`text-[8.5px] font-black ${isActive ? "text-[var(--primary)]" : "text-slate-400 dark:text-neutral-500"}`}>
                    0{idx + 1}
                  </span>
                )}
                <span>{tab}</span>
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

