import React from "react";
import { X, Loader2 } from "lucide-react";
import { UseBookingStateReturn } from "../hooks/useBookingState";

interface DrawerHeaderProps {
  state: UseBookingStateReturn;
  appointmentId?: string;
  onClose: () => void;
}

export function DrawerHeader({ state, appointmentId, onClose }: DrawerHeaderProps) {
  return (
    <>
      <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="w-1.5 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_20px_var(--primary-glow)]" />
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight leading-none">
              {appointmentId ? "Modify Encounter Details" : "Schedule New Encounter"}
            </h2>
            <span className="text-xs font-medium text-[var(--text-muted)] mt-1.5">
              {appointmentId ? "Adjusting clinical team assignments and encounter parameters" : "Configure encounter details and clinical team"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)]">
            {state.availabilityLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-[var(--primary)]" />
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Scanning...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Booking Engine Active</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--input-bg)] rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="bg-[var(--card-bg)] px-8 py-3 border-b border-[var(--card-border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--card-border)]">
            <button type="button" onClick={() => state.setIsBlockMode(false)}
              className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${!state.isBlockMode ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              Appointment
            </button>
            <button type="button" onClick={() => state.setIsBlockMode(true)}
              className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${state.isBlockMode ? "bg-amber-500 text-white shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              Busy Block
            </button>
          </div>
          {state.isBlockMode && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Reason:</span>
              <select value={state.blockStatus} onChange={e => state.setBlockStatus(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-amber-500 outline-none cursor-pointer">
                <option value="BLOCKED">Unavailable / Personal</option>
                <option value="AVAILABLE">Available for Booking</option>
              </select>
            </div>
          )}
        </div>

        {/* Dynamic Contextual Badge to balance the layout void */}
        {!state.isBlockMode && state.patientSearch ? (
          <div className="flex items-center gap-2.5 px-4 py-2 bg-[var(--primary)]/10 rounded-xl border border-[var(--primary)]/20 animate-in fade-in slide-in-from-right duration-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Scheduling Lead: <span className="text-[var(--primary)]">{state.patientSearch}</span>
            </span>
          </div>
        ) : state.isBlockMode ? (
          <div className="flex items-center gap-2.5 px-4 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20 animate-in fade-in slide-in-from-right duration-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
              Personal Time Allocation
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white/5 rounded-xl border border-white/5 opacity-50">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Awaiting Patient Context
            </span>
          </div>
        )}
      </div>
    </>
  );
}
