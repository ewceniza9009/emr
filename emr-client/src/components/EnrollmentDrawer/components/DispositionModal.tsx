"use client";

import React from "react";
import { X, ClipboardCheck, Calendar } from "lucide-react";
import { PermissionGate } from "../../PermissionGate";
import { EnrollmentState } from "../hooks/useEnrollmentState";

interface Props {
  state: EnrollmentState;
}

export default function DispositionModal({ state }: Props) {
  if (!state.showDispositionModal) return null;

  return (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={() => state.setShowDispositionModal(false)}
      />
      <div className="relative w-full max-w-md bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
                Capture Disposition
              </h3>
              <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest opacity-60">
                Status: {state.pendingOutcome}
              </p>
            </div>
          </div>
          <button
            onClick={() => state.setShowDispositionModal(false)}
            className="text-[var(--text-muted)] hover:text-rose-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
              Interaction Notes / Reason
            </label>
            <textarea
              value={state.logNotes}
              onChange={(e) => state.setLogNotes(e.target.value)}
              placeholder="Provide clinical context or specific outcome reason..."
              rows={4}
              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl px-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 resize-none shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
              Next Follow-Up Plan
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--primary)] opacity-40" />
              <input
                type="date"
                value={state.followUpDate}
                onChange={(e) => state.setFollowUpDate(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-11 pr-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => state.setShowDispositionModal(false)}
              className="flex-1 h-12 rounded-xl bg-white/5 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Abort
            </button>
            <PermissionGate permission="outreach:manage">
              <button
                onClick={state.confirmLogActivity}
                className="flex-[2] h-12 rounded-xl bg-[var(--primary)] text-black text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.4)] transition-all active:scale-95"
              >
                Commit Disposition
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>
    </div>
  );
}
