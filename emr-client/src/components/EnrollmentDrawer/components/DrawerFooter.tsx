"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, Trash2 } from "lucide-react";
import { PermissionGate } from "../../PermissionGate";
import { EnrollmentState } from "../hooks/useEnrollmentState";
import { TABS } from "../types";

interface Props {
  state: EnrollmentState;
}

export default function DrawerFooter({ state }: Props) {
  const currentStepIndex = TABS.indexOf(state.activeTab);
  const totalSteps = TABS.length;

  return (
    <div className="h-16 px-8 border-t border-[var(--card-border)] bg-[var(--sidebar-bg)]/95 backdrop-blur-3xl shrink-0 relative z-[70] flex items-center justify-between">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />

      {/* Left side: Minimalist progress indicators */}
      <div className="flex items-center gap-4 select-none">
        <div className="flex flex-col">
          <span className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] leading-none">
            Workflow Progress
          </span>
          <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider mt-1">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>
        <div className="flex gap-1 h-1.5 items-center">
          {TABS.map((tab, idx) => {
            const isPassed = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={tab}
                className={`h-1 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "w-6 bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]"
                    : isPassed
                    ? "w-2 bg-teal-500"
                    : "w-2 bg-[var(--card-border)]"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Right side: Beautiful, compact button groups */}
      <div className="flex items-center gap-3">
        {state.lead?.status === "ENROLLED" ? (
          <PermissionGate permission="patients:enrollment">
            <button
              onClick={state.handleUnenroll}
              disabled={state.unenrolling}
              className="h-9 px-5 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] hover:bg-rose-500 hover:text-white transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2 group shadow-[0_0_15px_rgba(239,68,68,0.05)]"
            >
              <Trash2 className="w-3.5 h-3.5 group-hover:shake" />
              {state.unenrolling ? "REVERSING..." : "REVERSE ENROLLMENT"}
            </button>
          </PermissionGate>
        ) : (
          <>
            <button
              onClick={state.handleBack}
              disabled={state.activeTab === "OUTREACH"}
              className={`h-9 px-4 rounded-lg border font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5
                ${state.activeTab === "OUTREACH" ? "opacity-20 cursor-not-allowed bg-transparent border-[var(--card-border)] text-[var(--text-muted)]" : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/30 hover:bg-[var(--card-bg)]"}`}
            >
              <ChevronLeft className="w-3 h-3" />
              Back
            </button>

            {state.activeTab === "LOGISTICS" ? (
              <PermissionGate permission="patients:enrollment">
                <button
                  onClick={state.handleFinalize}
                  disabled={state.finalizing}
                  className="h-9 px-6 bg-gradient-to-r from-[var(--primary)] to-teal-500 rounded-lg text-black font-black text-[9px] uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2 group"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {state.finalizing ? "ENROLLING..." : "ENROLL PATIENT"}
                  </span>
                </button>
              </PermissionGate>
            ) : (
              <button
                onClick={state.handleNext}
                className="h-9 px-6 bg-[var(--primary)] rounded-lg text-black font-black text-[9px] uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 group"
              >
                <span>Next Step</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
