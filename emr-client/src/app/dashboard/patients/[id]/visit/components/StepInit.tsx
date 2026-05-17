import React from "react";
import { Stethoscope, ClipboardList, Users, ChevronRight } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import { useSession } from "next-auth/react";

export function StepInit({ state }: { state: any }) {
  const { data: session } = useSession();

  const {
    appointment,
    starting,
    handleStart
  } = state;

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500 py-12">
      <div className="w-20 h-20 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
        <Stethoscope className="w-10 h-10" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-tight text-[var(--text-primary)]">Ready to Begin</h2>
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.4em] font-bold">Select Start to establish secure clinical session</p>
      </div>

      <PermissionGate permission="clinical:chart">
        <button
          onClick={handleStart}
          disabled={starting}
          className={`w-full max-w-sm py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${starting
            ? "bg-[var(--input-bg)] text-[var(--text-muted)] cursor-not-allowed grayscale"
            : "premium-gradient text-white shadow-[var(--primary-glow)] hover:scale-[1.02] active:scale-[0.98]"
            }`}
        >
          {starting ? "Establishing..." : "Start Encounter"} <ChevronRight className="w-5 h-5" />
        </button>
      </PermissionGate>

      {appointment?.plannedAssessments?.length > 0 && (
        <div className="w-full max-w-sm pt-12 border-t border-[var(--border-color,rgba(0,0,0,0.05))] space-y-6">
          <p className="text-center text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.5em]">Clinical Plan</p>
          <div className="flex flex-wrap justify-center gap-8">
            {appointment.plannedAssessments.map((code: string) => (
              <div key={code} className="flex flex-col items-center gap-3 group cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 group-hover:scale-110 transition-all duration-300 shadow-sm">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] group-hover:text-indigo-400 transition-colors">{code}</p>
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">Assessment</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {appointment?.supportingClinicians?.length > 0 && (
        <div className="w-full max-w-sm pt-8 border-t border-[var(--border-color,rgba(0,0,0,0.05))] space-y-6 text-center">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.5em]">Clinical Team</p>
          <div className="flex flex-wrap justify-center gap-8">
            {appointment.supportingClinicians.map((sc: any) => (
              <div key={sc.practitionerId} className="flex flex-col items-center gap-3 group cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:border-blue-500/40 group-hover:scale-110 transition-all duration-300 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-[var(--foreground)] uppercase tracking-tight group-hover:text-blue-400 transition-colors">{sc.firstName} {sc.lastName}</p>
                  <p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest opacity-70">{sc.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
