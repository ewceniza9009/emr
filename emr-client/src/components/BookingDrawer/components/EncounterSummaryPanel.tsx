import React from "react";
import { ListChecks, Timer, Clock, Zap, MapPin, Car, Shield, Activity, Check, Calendar } from "lucide-react";
import { UseBookingStateReturn } from "../hooks/useBookingState";
import { ASSESSMENT_OPTIONS } from "../constants";
import { PermissionGate } from "../../PermissionGate";

interface EncounterSummaryPanelProps {
  state: UseBookingStateReturn;
  appointmentId?: string;
  isLocked: boolean;
  bookingLoading: boolean;
}

export function EncounterSummaryPanel({ state, appointmentId, isLocked, bookingLoading }: EncounterSummaryPanelProps) {
  return (
    <>
      <section className="space-y-6">
        <div className="grid grid-cols-3 gap-4 pb-6 border-b border-white/5">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Travel</p>
            <p className="text-base font-bold text-[var(--text-primary)]">{state.selectedSlot?.travelTimeInMinutes || "0"}m</p>
          </div>
          <div className="space-y-1.5 border-l border-white/5 pl-4">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Distance</p>
            <p className="text-base font-bold text-[var(--text-primary)]">{state.selectedSlot?.distanceInMiles?.toFixed(1) || "0.0"}mi</p>
          </div>
          <div className="space-y-1.5 border-l border-white/5 pl-4">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Duration</p>
            <p className="text-base font-bold text-[var(--text-primary)]">{state.duration}m</p>
          </div>
        </div>

        {/* Calendar Selector goes into orchestrator sidebar before duration */}

        <div className="pt-4 px-2">
          <div className="flex justify-between items-baseline mb-4">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Encounter Duration</label>
            <span className="text-lg font-bold text-[var(--primary)]">{state.duration} <span className="text-xs text-[var(--text-muted)]">mins</span></span>
          </div>
          <input type="range" min="15" max="60" step="15" value={state.duration}
            disabled={isLocked}
            onChange={e => state.setDuration(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none transition-colors accent-[var(--primary)] bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer disabled:opacity-30" />
          <div className="flex justify-between mt-4 text-[9px] font-bold text-[var(--text-muted)] tracking-widest uppercase">
            <span>15m</span>
            <span>Standard Visit</span>
            <span>60m</span>
          </div>
        </div>
      </section>

      {state.plannedAssessments.length > 0 && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="w-3.5 h-3.5 text-[var(--primary)]" />
              <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Planned Assessments</h3>
            </div>
            <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/20">
              {state.plannedAssessments.length} Total
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.plannedAssessments.map(id => {
              const category = ASSESSMENT_OPTIONS.find(cat => cat.items.some(i => i.id === id));
              const item = category?.items.find(i => i.id === id);
              return (
                <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl hover:bg-[var(--input-bg)]/80 transition-colors group">
                  <div className="text-[var(--primary)] group-hover:scale-110 transition-transform">
                    {category?.icon}
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-primary)]">{item?.label || id}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Encounter Summary</h3>
          {state.selectedSlot?.shiftStart && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider
                        ${(state.modality.includes("TELEHEALTH") || state.modality.includes("VIDEO")) ? "bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]" :
                state.selectedSlot.distanceInMiles < 0.1 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]" :
                  state.selectedSlot.travelTimeInMinutes < 15 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                    state.selectedSlot.travelTimeInMinutes < 30 ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                      "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}>
              <Timer className="w-3 h-3" />
              {state.modality.includes("TELE") ? "Virtual Sync" :
                state.selectedSlot.distanceInMiles < 0.1 ? "Back-to-back Visit" :
                  state.selectedSlot.travelTimeInMinutes < 15 ? "Efficient Window" :
                    "Transit Warning"}
            </div>
          )}
        </div>
        <div className={`p-6 rounded-3xl border-2 transition-all duration-500 relative overflow-hidden group
                ${state.selectedSlot?.shiftStart ? "bg-[var(--primary)]/5 border-[var(--primary)]/30" : "bg-white/[0.01] border-white/5 opacity-20"}`}>
          {state.selectedSlot?.shiftStart ? (
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Scheduled Time</p>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                      {new Date(state.selectedSlot.shiftStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </h4>
                    {state.selectedSlot.distanceInMiles < 0.1 && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-tighter">
                        <Zap className="w-2.5 h-2.5 fill-emerald-500" />
                        Optimized
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {state.selectedSlot.distanceInMiles < 0.1 && (
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Back-to-back Advantage</p>
                    <p className="text-[9px] font-medium text-slate-500 leading-normal">
                      Practitioner is already at this location (or extremely close). Travel time has been negated for maximum efficiency.
                    </p>
                  </div>
                </div>
              )}

              {state.selectedSlot.distanceInMiles > 0 && state.selectedSlot.travelTimeInMinutes < 15 && (
                <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Proximity Advantage</p>
                    <p className="text-[9px] font-medium text-slate-500 leading-normal">
                      Clinician is in the immediate vicinity. Minimal transit time allows for a more flexible start window.
                    </p>
                  </div>
                </div>
              )}
              <div className="pt-6 flex items-center justify-between border-t border-white/5">
                <div className="text-left space-y-1">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Travel Time</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{state.selectedSlot?.travelTimeInMinutes != null ? state.selectedSlot.travelTimeInMinutes : "0"}<span className="text-xs ml-1 opacity-60">m</span></p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Distance</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{state.selectedSlot?.distanceInMiles != null ? state.selectedSlot.distanceInMiles.toFixed(1) : "0.0"}<span className="text-xs ml-1 opacity-60">mi</span></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-xs font-semibold text-slate-500">Awaiting Time Selection</p>
            </div>
          )}
        </div>
      </section>

      <div className="mt-auto pt-8 space-y-6">
        {isLocked && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-relaxed">
              Encounter Lock Active: Time and modification controls are restricted for {state.appointmentData?.appointment?.status?.toUpperCase().includes("PROGRESS") || state.appointmentData?.appointment?.status?.toUpperCase().includes("LIVE") ? "active" : "finalized"} visits.
            </p>
          </div>
        )}
        <PermissionGate permission="scheduling:manage">
          <button type="submit" form="appointment-form" disabled={bookingLoading || !state.selectedSlot?.shiftStart || isLocked}
            className="w-full h-14 bg-[var(--primary)] hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed
                      text-white font-bold text-sm shadow-xl shadow-[var(--primary-glow)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 rounded-2xl">
            {bookingLoading ? (
              <Activity className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>{appointmentId ? "Update Appointment" : "Schedule Appointment"}</span>
              </>
            )}
          </button>
        </PermissionGate>
        <p className="text-[10px] font-bold text-[var(--text-muted)] text-center uppercase tracking-widest opacity-50">
          Authorized Clinical Staff Only
        </p>
      </div>
    </>
  );
}
