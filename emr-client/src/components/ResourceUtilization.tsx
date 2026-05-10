"use client";

import { useQuery, gql } from "@apollo/client";
import { 
  Users, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  ClipboardList,
  Flame,
  LayoutDashboard
} from "lucide-react";

const GET_UTILIZATION = gql`
  query GetPractitionerUtilization {
    practitionerUtilization {
      practitionerId
      fullName
      openCases
      pendingTasks
      loadPercentage
    }
  }
`;

export default function ResourceUtilization() {
  const { data, loading, error } = useQuery(GET_UTILIZATION);

  if (loading) return (
    <div className="p-20 text-center animate-pulse space-y-4">
      <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto border border-[var(--primary)]/20 text-[var(--primary)]">
        <Activity className="w-8 h-8 animate-spin" />
      </div>
      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Calibrating Workforce Load Metrics...</p>
    </div>
  );

  if (error) return (
    <div className="p-20 text-center text-rose-500 font-bold flex flex-col items-center gap-4">
      <AlertCircle className="w-10 h-10" />
      <span className="uppercase tracking-widest text-sm">Telemetry Signal Lost: {error.message}</span>
    </div>
  );

  const utilization = data?.practitionerUtilization || [];

  return (
    <div className="p-8 space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter flex items-center gap-3">
            <Flame className="w-6 h-6 text-orange-500" />
            Resource Utilization Heatmap
          </h2>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Real-time clinical capacity and caseload distribution</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Elevated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40" />
            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Critical</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {utilization.map((u: any) => {
          const isCritical = u.loadPercentage >= 80;
          const isWarning = u.loadPercentage >= 50 && u.loadPercentage < 80;
          
          let statusColor = "emerald";
          if (isCritical) statusColor = "rose";
          else if (isWarning) statusColor = "amber";

          return (
            <div key={u.practitionerId} className={`group relative bg-[var(--card-bg)]/80 border border-[var(--card-border)] rounded-[2rem] p-6 hover:border-${statusColor}-500/30 transition-all shadow-xl overflow-hidden`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-${statusColor}-500/10 flex items-center justify-center border border-${statusColor}-500/20 text-${statusColor}-500 transition-all group-hover:scale-110`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter">{u.fullName}</h3>
                    <p className={`text-[8px] font-black uppercase tracking-widest text-${statusColor}-500/70`}>
                      {isCritical ? "CRITICAL LOAD" : isWarning ? "ELEVATED LOAD" : "OPTIMAL LOAD"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Load Bar */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <span>Capacity Utilization</span>
                  <span>{Math.round(u.loadPercentage)}%</span>
                </div>
                <div className="h-2 w-full bg-[var(--input-bg)] rounded-full overflow-hidden border border-[var(--card-border)]">
                  <div 
                    className={`h-full bg-${statusColor}-500 shadow-[0_0_10px_rgba(var(--${statusColor}-rgb),0.5)] transition-all duration-1000 ease-out`}
                    style={{ width: `${u.loadPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--card-border)] text-center">
                  <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Open Cases</p>
                  <p className="text-lg font-black text-[var(--text-primary)]">{u.openCases}</p>
                </div>
                <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--card-border)] text-center">
                  <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Pending Tasks</p>
                  <p className="text-lg font-black text-[var(--text-primary)]">{u.pendingTasks}</p>
                </div>
              </div>

              <button className="w-full py-3 bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-[var(--primary)] hover:border-[var(--primary)] text-[var(--text-muted)] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn">
                <ClipboardList className="w-3.5 h-3.5" />
                Review Workflow
                <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </button>

              {/* Intensity Pulse */}
              {isCritical && (
                <div className="absolute top-3 right-3">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {utilization.length === 0 && (
        <div className="text-center py-20 bg-[var(--card-bg)]/20 border border-dashed border-[var(--card-border)] rounded-[3rem]">
          <LayoutDashboard className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-20" />
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">No clinical resources found in the current registry segment.</p>
        </div>
      )}
    </div>
  );
}
