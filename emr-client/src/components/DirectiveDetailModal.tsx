"use client";

import {
  X,
  ShieldCheck,
  Calendar,
  FileText,
  Clock,
  Zap,
  CheckCircle2,
} from "lucide-react";
import HalcyonPortal from "./Portal";

interface DirectiveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  directive: {
    advanceDirectiveId: string;
    type: string;
    notes?: string;
    effectiveDate: string;
  } | null;
}

export default function DirectiveDetailModal({ isOpen, onClose, directive }: DirectiveDetailModalProps) {
  if (!isOpen || !directive) return null;

  return (
    <HalcyonPortal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 !m-0 !p-0 z-[99999999] flex items-center justify-center p-6 overflow-hidden"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" />

        {/* Modal */}
        <div
          className="relative w-full max-w-lg flex flex-col bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-400" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-6 border-b border-[var(--card-border)] shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">
                  Legal Directive: {directive.type.replace(/_/g, ' ')}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    <Calendar className="w-3 h-3" />
                    Effective {new Date(directive.effectiveDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-emerald-500/40 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar">
            <div className="space-y-3">
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                Directive Content & Clinical Instructions
              </p>
              <div className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm leading-relaxed text-[var(--text-primary)] font-medium">
                {directive.notes || "No specific instructions or limitations were documented for this directive. This status represents the patient's verified legal preference at the time of entry."}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">Verified</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Impact</p>
                <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase">Legally Binding</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-[9px] text-amber-600 font-medium">This record should be cross-referenced with physical documentation during critical clinical decisions.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-[var(--card-border)] shrink-0 flex items-center justify-between">
            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Halkyone Clinical OS · Legal Archive
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
            >
              Acknowledged
            </button>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
