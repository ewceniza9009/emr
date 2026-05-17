"use client";

import React from "react";
import { EnrollmentState } from "../hooks/useEnrollmentState";
import { RELATIONSHIP_LABELS } from "../types";
import { monthNames } from "../utils";
import {
  Navigation, Timer, MapPin, Clock, Users, History,
  ChevronLeft, ChevronRight, Sun, Wind, CalendarCheck, FolderLock,
} from "lucide-react";

interface Props { state: EnrollmentState; }

export default function TelemetryPanel({ state }: Props) {
  const renderCalendar = () => {
    const days: React.ReactNode[] = [];
    const count = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 0).getDate();
    const first = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth(), 1).getDay();
    const today = new Date();
    const headers = ["S", "M", "T", "W", "T", "F", "S"];
    const headerRow = headers.map((h, idx) => (
      <div key={`header-${h}-${idx}`} className="h-10 flex items-center justify-center text-[9px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-[0.2em]">{h}</div>
    ));
    for (let i = 0; i < first; i++) days.push(<div key={`empty-${i}`} className="h-12" />);
    for (let d = 1; d <= count; d++) {
      const isSelected = state.selectedDate.getDate() === d && state.selectedDate.getMonth() === state.viewDate.getMonth() && state.selectedDate.getFullYear() === state.viewDate.getFullYear();
      const isToday = today.getDate() === d && today.getMonth() === state.viewDate.getMonth() && today.getFullYear() === state.viewDate.getFullYear();
      days.push(
        <button key={d} type="button" onClick={() => state.setSelectedDate(new Date(state.viewDate.getFullYear(), state.viewDate.getMonth(), d))}
          className={`h-12 w-full rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 relative ${isSelected ? "bg-teal-500 text-black shadow-lg shadow-teal-500/30" : "text-[var(--text-primary)] hover:bg-[var(--card-bg)] hover:text-teal-500"}`}>
          {d}
          {isToday && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
        </button>
      );
    }
    return [...headerRow, ...days];
  };

  return (
    <div className="w-[380px] flex flex-col bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] relative">
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {(state.activeTab !== "LOGISTICS" || !state.checkStepCompleteness("CLINICAL")) && (
          <div className="absolute inset-0 z-[60] bg-[var(--sidebar-bg)]/80 backdrop-blur-sm flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
              <FolderLock className="w-8 h-8" />
            </div>
            <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em] mb-3">
              {!state.checkStepCompleteness("CLINICAL") ? "Clinical Block" : "Logistics Gate"}
            </h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-relaxed opacity-60 max-w-[200px]">
              {!state.checkStepCompleteness("CLINICAL") ? "Complete Clinical Intake to Unlock Scheduling" : "Advance to the Logistics phase to enable scheduling controls"}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {/* TOP METRICS */}
          <div className="grid grid-cols-2 gap-5 pb-8 border-b border-[var(--card-border)] shrink-0 relative">
            <div className="absolute -bottom-px left-0 w-1/2 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
            <div className="space-y-2 group/metric">
              <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] group-hover/metric:text-teal-500 transition-colors">
                <Navigation className="w-3.5 h-3.5" /> Travel Distance
              </div>
              <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">
                {state.selectedLogistics ? (
                  <>{state.selectedLogistics.distanceInMiles.toFixed(1)}<span className="text-xs font-bold opacity-30 ml-1.5 tracking-widest uppercase">MI</span></>
                ) : !state.careNavigatorId && !state.primaryClinicianId ? (
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 flex items-center gap-1.5 h-9"><Users className="w-3.5 h-3.5" /> Select Team</span>
                ) : (
                  <div className="flex items-baseline gap-1.5 h-9"><span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">Calculating...</span></div>
                )}
              </p>
            </div>
            <div className="space-y-2 group/metric">
              <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] group-hover/metric:text-teal-500 transition-colors">
                <Timer className="w-3.5 h-3.5" /> Duration
              </div>
              <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">
                {state.selectedLogistics ? (
                  <>{state.selectedLogistics.travelTimeInMinutes}<span className="text-xs font-bold opacity-30 ml-1.5 tracking-widest uppercase">MIN</span></>
                ) : !state.careNavigatorId && !state.primaryClinicianId ? (
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 flex items-center gap-1.5 h-9"><Clock className="w-3.5 h-3.5" /> Awaiting Choice</span>
                ) : (
                  <div className="flex items-baseline gap-1.5 h-9"><span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">Syncing...</span></div>
                )}
              </p>
            </div>
          </div>

          {/* LOCATION */}
          <div className="bg-[var(--input-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-inner">
            <h3 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><MapPin className="w-3 h-3" /> Location Details</h3>
            <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight leading-relaxed">
              {state.lead?.mailingAddress?.street}<br />
              <span className="opacity-60">{state.lead?.mailingAddress?.city}, {state.lead?.mailingAddress?.state} {state.lead?.mailingAddress?.postalCode}</span>
            </p>
          </div>

          {/* SCHEDULING STRATEGY TOGGLE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Scheduling Strategy</p>
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${state.scheduleIntakeNow ? "bg-teal-500/10 border-teal-500/30 text-teal-500" : "bg-amber-500/10 border-amber-500/30 text-amber-500"}`}>
                {state.scheduleIntakeNow ? "Instant Intake" : "Schedule Later"}
              </span>
            </div>
            <div className="flex bg-[var(--input-bg)] rounded-2xl p-1.5 border border-[var(--card-border)] shadow-inner">
              <button onClick={() => state.setScheduleIntakeNow(true)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${state.scheduleIntakeNow ? "bg-teal-500 text-black shadow-lg shadow-teal-500/20" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                <CalendarCheck className="w-3.5 h-3.5" /> Book Now
              </button>
              <button onClick={() => state.setScheduleIntakeNow(false)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!state.scheduleIntakeNow ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                <Clock className="w-3.5 h-3.5" /> Later
              </button>
            </div>
          </div>

          {/* CALENDAR */}
          <div className="space-y-4">
            <div className="bg-[var(--input-bg)]/30 rounded-[2.5rem] border border-[var(--card-border)] p-6 space-y-5 shadow-inner backdrop-blur-sm relative overflow-hidden group/cal">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center justify-between px-2 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em]">{monthNames[state.viewDate.getMonth()]}</span>
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">{state.viewDate.getFullYear()}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => state.setViewDate(new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] transition-all text-[var(--text-muted)] hover:text-[var(--primary)]"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => state.setViewDate(new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1))} className="w-9 h-9 flex items-center justify-center hover:bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] transition-all text-[var(--text-muted)] hover:text-[var(--primary)]"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 relative z-10">{renderCalendar()}</div>
            </div>
            <div className="flex bg-[var(--input-bg)]/50 rounded-2xl p-2 border border-[var(--card-border)] gap-2 shadow-inner">
              {(["AM", "PM"] as const).map((p) => (
                <button key={p} onClick={() => state.setPeriod(p)} className={`flex-1 py-4 rounded-xl text-[11px] font-black tracking-[0.3em] transition-all uppercase flex items-center justify-center gap-3 ${state.period === p ? "bg-teal-500 text-black shadow-[0_0_25px_rgba(20,184,166,0.3)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"}`}>
                  {p === "AM" ? <Sun className="w-4 h-4" /> : <Wind className="w-4 h-4" />}
                  {p === "AM" ? "Morning" : "Afternoon"}
                </button>
              ))}
            </div>
          </div>

          {/* INTERACTION HISTORY */}
          <div className="flex-1 space-y-5 overflow-hidden flex flex-col pt-6 border-t border-[var(--card-border)] relative">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--primary)]/10 to-transparent" />
            <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-3 px-1">
              <div className="w-6 h-6 rounded-lg bg-[var(--primary)]/5 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/10"><History className="w-3.5 h-3.5" /></div>
              Interaction History
            </h3>
            <div className="flex-1 overflow-y-auto pr-3 space-y-6 scrollbar-hide">
              {state.lead?.activities?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--card-border)] flex items-center justify-center"><Clock className="w-6 h-6" /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Activity Logged</p>
                </div>
              ) : (
                state.lead?.activities?.map((a: any) => (
                  <div key={a.outreachActivityId} className="flex gap-4 group/item">
                    <div className="flex flex-col items-center pt-1.5">
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${a.outcome === "CONNECTED" ? "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.6)]" : "bg-[var(--card-border)] group-hover/item:bg-[var(--text-muted)]"}`} />
                      <div className="w-px flex-1 bg-gradient-to-b from-[var(--card-border)] to-transparent my-2" />
                    </div>
                    <div className="pb-5 border-b border-[var(--card-border)]/30 flex-1 group-hover/item:border-[var(--primary)]/20 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${a.outcome === "CONNECTED" ? "text-teal-500" : "text-[var(--text-primary)]"}`}>{a.outcome.replace("_", " ")}</p>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-0.5 rounded-md border border-[var(--card-border)]">{new Date(a.activityDate).toLocaleDateString()}</p>
                      </div>
                      {a.reason && <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.1em] mb-1.5">{a.reason}</p>}
                      <div className="relative"><p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic opacity-80 pl-3 border-l-2 border-[var(--card-border)]">{a.notes}</p></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
