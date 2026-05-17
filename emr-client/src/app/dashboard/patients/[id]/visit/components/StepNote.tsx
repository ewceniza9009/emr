import React from "react";
import { Save } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import SmartTextarea from "@/components/SmartTextarea";

export function StepNote({ state }: { state: any }) {
  const {
    note,
    setNote,
    smartPhrases,
    savingNote,
    handleFinish,
    setStep,
    prevStep
  } = state;

  const sections = [
    { id: 's', label: 'Subjective', placeholder: 'Patient reports... symptoms, history, concerns.' },
    { id: 'o', label: 'Objective', placeholder: 'Clinical findings... vitals, physical exam, observations.' },
    { id: 'a', label: 'Assessment', placeholder: 'Clinical reasoning... diagnosis, status, progress.' },
    { id: 'p', label: 'Plan', placeholder: 'Care strategy... medications, follow-up, interventions.' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight">Clinical Documentation</h2>
        <p className="text-[var(--text-muted)] text-[8px] uppercase tracking-widest font-bold">Synthesize encounter findings into a permanent SOAP record.</p>
      </div>
      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.id} className="space-y-2 relative">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[var(--primary)] text-white flex items-center justify-center text-[9px]">{section.id.toUpperCase()}</span>
              {section.label}
            </label>
            <SmartTextarea
              value={note[section.id as keyof typeof note]}
              onChange={(val: string) => setNote((prev: any) => ({ ...prev, [section.id]: val }))}
              smartPhrases={smartPhrases}
              placeholder={section.placeholder}
              className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] rounded-xl p-4 text-sm min-h-[120px] focus:border-[var(--primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/20 leading-relaxed text-[var(--foreground)]"
            />
          </div>
        ))}
      </div>

      <div className="p-8 bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] rounded-2xl space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Sign with Legal Identity</label>
          <input
            value={note.signature}
            onChange={e => setNote({ ...note, signature: e.target.value })}
            placeholder="Practitioner Signature"
            className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] rounded-xl py-4 px-6 text-[var(--foreground)] italic font-serif text-xl focus:border-[var(--primary)]/50 outline-none transition-all"
          />
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed italic">By finalizing this record, I attest that the clinical data documented reflects the true status of the encounter and the patient&apos;s condition.</p>
      </div>

      <div className="pt-8 flex gap-4 border-t border-[var(--border-color,rgba(0,0,0,0.05))]">
        <button onClick={() => setStep(prevStep.id)} className="flex-1 py-3.5 rounded-xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-all">Back</button>
        <PermissionGate permission="clinical:chart">
          <button
            onClick={handleFinish}
            disabled={savingNote || !note.signature}
            className="flex-1 py-3.5 rounded-xl bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
          >
            {savingNote ? "Securing..." : "Finalize & Save Encounter"} <Save className="w-4 h-4" />
          </button>
        </PermissionGate>
      </div>
    </div>
  );
}
