import React from "react";
import { ChevronRight } from "lucide-react";

const SKIP_REASONS = [
  "PATIENT_REFUSED",
  "CLINICALLY_INAPPROPRIATE",
  "TIME_CONSTRAINT",
  "PATIENT_DISTRESSED",
  "COGNITIVE_IMPAIRMENT",
  "LANGUAGE_BARRIER",
  "ALREADY_COMPLETED_RECENTLY",
  "OTHER"
];

export function SkipAssessmentModal({ state }: { state: any }) {
  const {
    skippingAssessment,
    setSkippingAssessment,
    setAssessmentResults,
    steps,
    step,
    setStep
  } = state;

  if (!skippingAssessment) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-[var(--card-bg)] border border-[var(--divider-color)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-black">
        <div className="p-8 space-y-6 text-left">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Skip Assessment</h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Select reason for bypassing <span className="text-[var(--primary)]">{skippingAssessment?.name}</span></p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {SKIP_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => {
                  setAssessmentResults((prev: any) => ({
                    ...prev,
                    [skippingAssessment?.id || '']: { skipped: true, reason, timestamp: new Date().toISOString() }
                  }));
                  setSkippingAssessment(null);
                  const currentIndex = steps.findIndex((s: any) => s.id === step);
                  if (currentIndex < steps.length - 1) setStep(steps[currentIndex + 1].id);
                }}
                className="w-full p-4 rounded-xl border border-[var(--divider-color)] text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 hover:text-[var(--text-primary)] transition-all flex items-center justify-between group"
              >
                {reason.replace(/_/g, ' ')}
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-[var(--primary)]" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setSkippingAssessment(null)}
            className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
