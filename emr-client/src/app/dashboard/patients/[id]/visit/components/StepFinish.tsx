import React from "react";
import { CheckCircle2, Activity, ClipboardList, Users, ChevronRight } from "lucide-react";

export function StepFinish({ state }: { state: any }) {
  const {
    vitals,
    assessmentResults,
    appointment,
    setStep,
    steps
  } = state;

  return (
    <div className="space-y-12 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight">Visit Summary</h2>
          <p className="text-[var(--text-muted)] text-[8px] uppercase tracking-widest font-bold">Review all captured data before final submission.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Vitals Summary */}
        <div className="p-8 rounded-[2rem] bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] space-y-6">
          <div className="flex items-center gap-3 border-b border-[var(--border-color,rgba(0,0,0,0.05))] pb-4">
            <Activity className="w-5 h-5 text-blue-400" />
            <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest">Biometric Data</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(vitals).map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{k}</p>
                <p className="text-lg font-bold text-[var(--foreground)]">{v as string || '--'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Assessments Summary */}
        <div className="p-8 rounded-[2rem] bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] space-y-6">
          <div className="flex items-center gap-3 border-b border-[var(--border-color,rgba(0,0,0,0.05))] pb-4">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest">Assessment Scores</h4>
          </div>
          <div className="space-y-4">
            {Object.entries(assessmentResults).map(([k, v]: [string, any]) => (
              <div key={k} className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">{k}</p>
                <p className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 font-black text-sm">
                  {typeof v === 'object' ? (v.score !== undefined ? v.score : 'N/A') : v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {appointment?.supportingClinicians?.length > 0 && (
        <div className="p-8 rounded-[2rem] bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] space-y-6">
          <div className="flex items-center gap-3 border-b border-[var(--border-color,rgba(0,0,0,0.05))] pb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest">Supporting Clinical Team</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {appointment.supportingClinicians.map((sc: any) => (
              <div key={sc.practitionerId} className="flex items-center gap-3 p-3 rounded-xl bg-blue-600/5 border border-blue-600/10">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                  {sc.firstName[0]}{sc.lastName[0]}
                </div>
                <div>
                  <p className="text-[10px] font-black text-[var(--foreground)] uppercase">{sc.firstName} {sc.lastName}</p>
                  <p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest">{sc.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-8 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/10 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-lg font-bold text-[var(--foreground)] tracking-tight uppercase">Ready for Finalization</p>
          <p className="text-[10px] text-[var(--text-muted)] max-w-sm leading-relaxed">Proceeding will sign the clinical note and archive the encounter.</p>
        </div>
        <button
          onClick={() => setStep(steps.find((s: any) => s.type === 'NOTE')?.id || 91)}
          className="px-8 py-3.5 rounded-xl bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all flex items-center gap-2"
        >
          Sign & Close <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
