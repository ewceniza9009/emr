"use client";

import React from "react";
import { X, AlertCircle, Trash2 } from "lucide-react";
import { PermissionGate } from "../../PermissionGate";
import { EnrollmentState } from "../hooks/useEnrollmentState";

interface Props {
  state: EnrollmentState;
}

export default function UnenrollModal({ state }: Props) {
  if (!state.showUnenrollModal) return null;

  return (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={() => state.setShowUnenrollModal(false)}
      />
      <div className="relative w-full max-w-md bg-[var(--sidebar-bg)] border border-rose-500/30 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
                Reverse Enrollment
              </h3>
              <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest opacity-60">
                High-Authority Action
              </p>
            </div>
          </div>
          <button
            onClick={() => state.setShowUnenrollModal(false)}
            className="text-[var(--text-muted)] hover:text-rose-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-[10px] font-medium text-[var(--text-secondary)] leading-relaxed">
            You are about to deactivate this clinical record
            and return the patient to lead status. Please
            provide a forensic reason for this reversal.
          </p>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
              Reversal Reason / Notes
            </label>
            <textarea
              value={state.logNotes}
              onChange={(e) => state.setLogNotes(e.target.value)}
              placeholder="e.g., Admitted in error, duplicate record, or patient request..."
              rows={4}
              className="w-full bg-[var(--input-bg)] border border-rose-500/20 rounded-2xl px-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-rose-500/50 resize-none shadow-inner"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => state.setShowUnenrollModal(false)}
              className="flex-1 h-12 rounded-xl bg-white/5 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Abort
            </button>
            <PermissionGate permission="patients:enrollment">
              <button
                onClick={state.confirmUnenroll}
                disabled={!state.logNotes}
                className="flex-[2] h-12 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all active:scale-95 disabled:opacity-20"
              >
                Commit Reversal
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>
    </div>
  );
}
