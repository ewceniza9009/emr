import React from "react";
import { Search, User, Car, Stethoscope } from "lucide-react";
import { UseBookingStateReturn } from "../hooks/useBookingState";

interface ClinicianSelectionPanelProps {
  state: UseBookingStateReturn;
}

export function ClinicianSelectionPanel({ state }: ClinicianSelectionPanelProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* 2. Attending Clinician Lead */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">02</span>
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
              {state.isBlockMode ? "Assign Clinician" : "Clinical Lead Assignment"}
            </h3>
          </div>
          <div className="relative group">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
            <input
              type="text"
              placeholder="Search Leads..."
              value={state.cnSearch}
              onChange={(e) => state.setCnSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/40 w-32 focus:w-48 transition-all"
            />
          </div>
        </div>
        <div className="max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.displayCns.map((p: any) => {
              const pid = p.practitionerId;
              const isPrimary = state.practitionerId?.toLowerCase() === pid?.toLowerCase();
              const isSupporting = state.supportingIds.some((id: string) => id?.toLowerCase() === pid?.toLowerCase());
              return (
                <div key={pid} className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group
                    ${isPrimary || isSupporting ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 shadow-sm" : "bg-white/5 border-white/10 hover:border-white/30"}`}
                  onClick={() => {
                    if (!pid) return;
                    if (isSupporting) {
                      state.setPractitionerId(pid);
                      state.setSupportingIds(prev => prev.filter(id => id?.toLowerCase() !== pid.toLowerCase()));
                    } else if (isPrimary) {
                      state.setPractitionerId("");
                    } else {
                      state.setPractitionerId(pid);
                      state.setSupportingIds(prev => prev.filter(id => id?.toLowerCase() !== pid.toLowerCase()));
                    }
                  }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isPrimary || isSupporting ? "bg-[var(--primary)] text-white" : "bg-white/10 text-slate-500"}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${isPrimary || isSupporting ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                        {p.firstName ? `${p.firstName} ${p.lastName}` : (p.fullName || p.FullName || "Provider")}
                      </p>
                      <p className="text-[10px] font-medium text-[var(--text-muted)] mt-0.5 uppercase tracking-tighter">
                        {isPrimary ? `${p.position} (Lead)` : isSupporting ? `${p.position} (Support)` : p.position}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      {p.travelTimeInMinutes != null ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <Car className={`w-3 h-3 ${isPrimary || isSupporting ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`} />
                            <span className={`text-[11px] font-bold ${isPrimary || isSupporting ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                              {p.travelTimeInMinutes}m
                            </span>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-tight ${isPrimary || isSupporting ? "text-[var(--primary)]" : "text-[var(--text-muted)]"} opacity-70`}>
                            {p.distanceInMiles?.toFixed(1)}mi
                          </span>
                        </>
                      ) : (
                        <span className="text-[9px] font-black text-rose-500/80 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/10 uppercase tracking-widest">
                          No Data
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Supporting Clinicians */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">03</span>
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Supporting Clinicians</h3>
          </div>
          <div className="relative group">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
            <input
              type="text"
              placeholder="Search Support..."
              value={state.scSearch}
              onChange={(e) => state.setScSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/40 w-32 focus:w-48 transition-all"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.displayScs.map((p: any) => {
              const pid = p.practitionerId;
              const isPrimary = state.practitionerId?.toLowerCase() === pid?.toLowerCase();
              const isSupporting = state.supportingIds.some((id: string) => id?.toLowerCase() === pid?.toLowerCase());
              return (
                <div key={pid} className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group
                  ${isPrimary || isSupporting ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 shadow-sm" : "bg-white/5 border-white/10 hover:border-white/30"}`}
                  onClick={() => {
                    if (!pid) return;
                    if (isPrimary) {
                      state.setPractitionerId("");
                      state.setSupportingIds(prev => [...prev, pid]);
                    } else if (isSupporting) {
                      state.setSupportingIds(prev => prev.filter(id => id?.toLowerCase() !== pid.toLowerCase()));
                    } else {
                      state.setSupportingIds(prev => [...prev, pid]);
                      if (state.practitionerId?.toLowerCase() === pid.toLowerCase()) state.setPractitionerId("");
                    }
                  }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isPrimary || isSupporting ? "bg-[var(--primary)] text-white" : "bg-white/10 text-slate-500"}`}>
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${isPrimary || isSupporting ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                        {p.firstName ? `${p.firstName} ${p.lastName}` : (p.fullName || p.FullName || "Provider")}
                      </p>
                      <p className="text-[10px] font-medium text-[var(--text-muted)] mt-0.5 uppercase tracking-tighter">
                        {isPrimary ? `${p.position} (Lead)` : isSupporting ? `${p.position} (Support)` : p.position}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
