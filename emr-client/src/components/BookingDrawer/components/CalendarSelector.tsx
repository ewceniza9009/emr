import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { UseBookingStateReturn } from "../hooks/useBookingState";
import { monthNames } from "../constants";

interface CalendarSelectorProps {
  state: UseBookingStateReturn;
  patientId: string;
  isLocked: boolean;
}

export function CalendarSelector({ state, patientId, isLocked }: CalendarSelectorProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentMonthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const renderCalendar = () => {
    const days = [];
    const count = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 0).getDate();
    const first = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth(), 1).getDay();
    for (let i = 0; i < first; i++) days.push(<div key={`empty-${i}`} className="h-10" />);
    for (let d = 1; d <= count; d++) {
      const date = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth(), d);
      const isSelected = state.selectedDate.getDate() === d && state.selectedDate.getMonth() === state.viewDate.getMonth();
      const isPast = date < today;
      days.push(
        <button key={d} type="button" disabled={isPast}
          onClick={() => { if (!isPast) { state.setSelectedDate(date); state.setPeriod(null); state.setPractitionerId(""); } }}
          className={`h-10 w-full rounded-2xl text-xs font-semibold transition-all flex items-center justify-center
            ${isSelected ? "bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary-glow)]" : isPast ? "text-[var(--text-muted)] opacity-50 cursor-not-allowed" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
          {d}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Encounter Date</h3>
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {isNaN(state.viewDate.getTime()) ? "Select Date" : `${monthNames[state.viewDate.getMonth()]} ${state.viewDate.getFullYear()}`}
            </span>
            <div className="flex gap-2">
              <button type="button" disabled={new Date(state.viewDate.getFullYear(), state.viewDate.getMonth()) <= currentMonthStart}
                onClick={() => { const prev = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1); if (prev >= currentMonthStart) state.setViewDate(prev); }}
                className={`p-1.5 rounded-lg border transition-colors ${new Date(state.viewDate.getFullYear(), state.viewDate.getMonth()) <= currentMonthStart ? "opacity-30 cursor-not-allowed border-white/5" : "hover:bg-white/10 border-white/10"}`}><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
              <button type="button" onClick={() => state.setViewDate(new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1))} className="p-1.5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
            </div>
          </div>
          <div className={`grid grid-cols-7 gap-1 ${isLocked ? "pointer-events-none opacity-50" : ""}`}>
            {renderCalendar()}
          </div>
        </div>
      </div>

      {patientId && (
        <div className={`flex bg-[var(--input-bg)] rounded-2xl p-1.5 border border-[var(--card-border)] gap-1.5 shadow-inner ${isLocked ? "pointer-events-none opacity-50" : ""}`}>
          <button
            type="button"
            onClick={() => {
              state.setPeriod("AM");
              state.setStartHour(state.clinicalConfig.AM_START);
              state.setStartMinute(0);
              state.setPractitionerId("");
              state.setSupportingIds([]);
            }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              state.period === "AM"
                ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20"
                : "bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--card-border)]"
            }`}
          >
            {state.availabilityLoading && state.period === "AM" ? <Activity className="w-4 h-4 animate-spin mx-auto" /> : "MORNING SLOT"}
          </button>
          <button
            type="button"
            onClick={() => {
              state.setPeriod("PM");
              state.setStartHour(state.clinicalConfig.PM_START);
              state.setStartMinute(0);
              state.setPractitionerId("");
              state.setSupportingIds([]);
            }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              state.period === "PM"
                ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20"
                : "bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--card-border)]"
            }`}
          >
            {state.availabilityLoading && state.period === "PM" ? <Activity className="w-4 h-4 animate-spin mx-auto" /> : "AFTERNOON SLOT"}
          </button>
        </div>
      )}
    </div>
  );
}
