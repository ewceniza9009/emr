import React from "react";
import { ChevronRight } from "lucide-react";
import { ToastProvider } from "@/components/ToastProvider";
import ProblemList from "@/components/ProblemList";
import MedicationRegistry from "@/components/MedicationRegistry";

export function StepClinical({ state }: { state: any }) {
  const {
    patientId,
    setStep,
    prevStep,
    nextStep
  } = state;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight">Profile Reconnaissance</h2>
        <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest font-bold">Audit active diagnoses and therapeutic medications.</p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <ToastProvider>
          <ProblemList patientId={patientId} />
          <MedicationRegistry patientId={patientId} />
        </ToastProvider>
      </div>

      <div className="pt-8 flex gap-4 border-t border-[var(--border-color,rgba(0,0,0,0.05))]">
        <button onClick={() => setStep(prevStep.id)} className="flex-1 py-3.5 rounded-xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-all">Back</button>
        <button onClick={() => setStep(nextStep.id)} className="flex-1 py-3.5 rounded-xl bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] flex items-center justify-center gap-2 hover:opacity-90 transition-all">
          Continue to Final SOAP <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
