import React from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { Step } from "../hooks/useGuidedVisitState";

export function VisitNavigator({ state }: { state: any }) {
  const {
    step,
    setStep,
    maxStepReached,
    steps,
    setIsAssessmentModalOpen,
    currentStepIndex
  } = state;

  return (
    <div className="h-16 border-b border-[var(--border-color,rgba(0,0,0,0.05))] bg-[var(--card-bg)] flex items-center px-8 z-30 shrink-0">
      <div className="flex-1 overflow-x-auto no-scrollbar py-2">
        <div className="flex items-center gap-2 min-w-max mx-auto px-4">
          {steps.map((s: Step, idx: number) => {
            const isActive = step === s.id;
            const isCompleted = currentStepIndex > idx;
            const isUnlocked = idx <= steps.findIndex((st: Step) => st.id === maxStepReached);
            const isAssessment = s.type === "ASSESSMENT_WRAPPER";

            return (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => (isUnlocked || isActive) && setStep(s.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${isActive
                    ? isAssessment
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105"
                      : "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 scale-105"
                    : isUnlocked
                      ? isAssessment
                        ? "text-indigo-500 hover:bg-indigo-500/5"
                        : "text-[var(--primary)] hover:bg-[var(--primary)]/5"
                      : "text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-black ${isActive
                    ? "bg-white border-white " + (isAssessment ? "text-indigo-500" : "text-[var(--primary)]")
                    : "border-current"
                    }`}>
                    {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : String(idx + 1).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div className="w-6 h-[1px] bg-[var(--border-color,rgba(0,0,0,0.1))]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <button
        onClick={() => setIsAssessmentModalOpen(true)}
        className="ml-4 p-2 rounded-full border border-dashed border-[var(--border-color,rgba(0,0,0,0.2))] text-[var(--text-muted)] hover:text-indigo-500 hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-indigo-500/10 shrink-0"
        title="Add Assessment"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
