import React from "react";
import { Search, MapPin, Navigation, Check, Edit3, Info, Home, Building2, Video, Phone, AlertCircle, Zap, Shield, Target, Users, Clock, Activity, Stethoscope } from "lucide-react";
import { UseBookingStateReturn } from "../hooks/useBookingState";
import { format } from "date-fns";

interface ServiceLocationPanelProps {
  state: UseBookingStateReturn;
  patientId: string;
  setPatientId: (id: string) => void;
}

export function ServiceLocationPanel({ state, patientId, setPatientId }: ServiceLocationPanelProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">01</span>
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{state.isBlockMode ? "Scheduling Details" : "Patient Selection"}</h3>
        <div className="flex-1 h-px bg-[var(--card-border)]" />
      </div>

      {!state.isBlockMode && (
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
          <input required={!state.isBlockMode} value={state.patientSearch} onChange={e => { state.setPatientSearch(e.target.value); state.setShowPatientResults(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            placeholder="Search by MRN or patient name..."
            className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-14 pr-6 py-4 text-[var(--text-primary)] text-sm font-medium placeholder:text-[var(--text-muted)]
              focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all shadow-sm"
          />
          {state.showPatientResults && state.patientSearch && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden z-[1001] max-h-60 overflow-y-auto shadow-2xl backdrop-blur-2xl">
              {state.patientData?.patients?.items?.filter((p: any) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(state.patientSearch.toLowerCase())).map((p: any) => (
                <button key={p.patientId} type="button" onClick={() => {
                  setPatientId(p.patientId);
                  state.setPatientSearch(`${p.firstName} ${p.lastName}`);
                  state.setPatientAddress({
                    street: p.addresses?.find((x: any) => x.isPrimary)?.address?.street || p.addresses?.[0]?.address?.street || "",
                    city: p.addresses?.find((x: any) => x.isPrimary)?.address?.city || p.addresses?.[0]?.address?.city || "",
                    state: p.addresses?.find((x: any) => x.isPrimary)?.address?.state || p.addresses?.[0]?.address?.state || "",
                    postalCode: p.addresses?.find((x: any) => x.isPrimary)?.address?.postalCode || p.addresses?.[0]?.address?.postalCode || ""
                  });
                  state.setShowPatientResults(false);
                  state.setIsEditingAddress(false);
                }}
                  className="w-full px-6 py-4 text-left hover:bg-[var(--primary)]/10 border-b border-[var(--card-border)] transition-colors flex items-center justify-between group">
                  <span className="font-semibold text-[var(--text-primary)] text-sm">{p.firstName} {p.lastName}</span>
                  <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--primary)]">{p.mrn}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(patientId || state.isBlockMode) && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Service Location</span>
            </div>
            {!state.isBlockMode ? (
              <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 relative group/addr space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Patient Primary Address</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all group/travel">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Navigation className="w-3 h-3 text-indigo-500 fill-indigo-500/20" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">
                          {(() => {
                            const activePractitioner = state.practitionerId
                              ? state.displayCns.find((p: any) => p.practitionerId?.toLowerCase() === state.practitionerId.toLowerCase()) || state.displayScs.find((p: any) => p.practitionerId?.toLowerCase() === state.practitionerId.toLowerCase())
                              : null;
                            return activePractitioner?.travelTimeInMinutes != null ? `${activePractitioner.travelTimeInMinutes}m` : "0m";
                          })()} Transit
                        </span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">Clinical Vector</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => state.setIsEditingAddress(!state.isEditingAddress)}
                      className={`p-2.5 rounded-xl border transition-all ${state.isEditingAddress ? "bg-[var(--primary)] text-white border-transparent" : "bg-white/5 hover:bg-white/10 border-white/10 text-[var(--text-muted)]"}`}>
                      {state.isEditingAddress ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {state.isEditingAddress ? (
                  <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Street Address</label>
                      <input autoFocus value={state.patientAddress.street} onChange={e => state.setPatientAddress({ ...state.patientAddress, street: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">City</label>
                        <input value={state.patientAddress.city} onChange={e => state.setPatientAddress({ ...state.patientAddress, city: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">State</label>
                        <input value={state.patientAddress.state} onChange={e => state.setPatientAddress({ ...state.patientAddress, state: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Zip Code</label>
                        <input value={state.patientAddress.postalCode} onChange={e => state.setPatientAddress({ ...state.patientAddress, postalCode: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Street Address</label>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{state.patientAddress.street || "No address recorded"}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">City</label>
                        <p className="text-[13px] font-medium text-[var(--text-secondary)]">{state.patientAddress.city || "--"}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">State</label>
                        <p className="text-[13px] font-medium text-[var(--text-secondary)]">{state.patientAddress.state || "--"}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Zip Code</label>
                        <p className="text-[13px] font-medium text-[var(--text-secondary)]">{state.patientAddress.postalCode || "--"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                <Info className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest leading-relaxed">
                  Blocks do not require a patient record. You are reserving this time as &apos;Unavailable&apos;.
                </p>
              </div>
            )}
          </div>

          {!state.isBlockMode && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Visit Modality</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { id: "IN_PERSON_HOME_VISIT", label: "Home Visit", icon: <Home className="w-3.5 h-3.5" /> },
                    { id: "IN_PERSON_FACILITY", label: "Facility", icon: <Building2 className="w-3.5 h-3.5" /> },
                    { id: "TELEHEALTH_VIDEO", label: "Video Call", icon: <Video className="w-3.5 h-3.5" /> },
                    { id: "TELEPHONE", label: "Audio Only", icon: <Phone className="w-3.5 h-3.5" /> },
                  ].map((m) => (
                    <button key={m.id} type="button" onClick={() => { state.setModality(m.id); state.setPeriod(null); }}
                      className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border text-[10px] font-bold transition-all
                        ${state.modality === m.id ? "bg-[var(--primary)] border-transparent text-white shadow-lg shadow-[var(--primary-glow)]" : "bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10"}`}>
                      {React.cloneElement(m.icon as React.ReactElement, { className: "w-4 h-4 shrink-0" })}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {state.modality === "IN_PERSON_FACILITY" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Select Target Facility</label>
                  </div>
                  <div className="relative">
                    <select required={state.modality === "IN_PERSON_FACILITY"} value={state.facilityId} onChange={e => state.setFacilityId(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-5 py-4 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all appearance-none cursor-pointer">
                      <option value="" className="bg-[var(--sidebar-bg)]">-- Select active clinical facility --</option>
                      {state.facilityData?.facilities?.map((f: any) => (
                        <option key={f.facilityId} value={f.facilityId} className="bg-[var(--sidebar-bg)]">{f.name} ({f.type})</option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none border-l border-[var(--card-border)] pl-4">
                      <Building2 className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Stethoscope className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Visit Type</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "INITIAL_HOSPICE_INTAKE", label: "Initial Intake", icon: <Zap className="w-3 h-3" /> },
                    { id: "ROUTINE_SYMPTOM_MANAGEMENT", label: "Routine Management", icon: <Activity className="w-3 h-3" /> },
                    { id: "BEREAVEMENT_FOLLOW_UP", label: "Bereavement", icon: <Shield className="w-3 h-3" /> },
                    { id: "EMERGENCY_TRIAGE", label: "Emergency", icon: <AlertCircle className="w-3 h-3" /> },
                    { id: "ADVANCE_CARE_PLANNING", label: "Advance Care", icon: <Target className="w-3 h-3" /> },
                    { id: "SPIRITUAL_ASSESSMENT", label: "Spiritual", icon: <Activity className="w-3 h-3" /> },
                    { id: "PSYCHOSOCIAL_ASSESSMENT", label: "Psychosocial", icon: <Users className="w-3 h-3" /> },
                  ].map((t) => (
                    <button key={t.id} type="button" onClick={() => state.setVisitType(t.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold transition-all
                        ${state.visitType === t.id ? "bg-[var(--primary)] border-transparent text-white shadow-lg shadow-[var(--primary-glow)]" : "bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10"}`}>
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Time & Duration</span>
            </div>
            <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-6 space-y-6">
              {state.isBlockMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Start Time</label>
                    <div className="flex items-center gap-2">
                      <select value={state.startHour} onChange={e => state.setStartHour(parseInt(e.target.value))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all appearance-none cursor-pointer">
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i} className="bg-[var(--sidebar-bg)]">{i % 12 || 12}:00 {i < 12 ? "AM" : "PM"}</option>
                        ))}
                      </select>
                      <select value={state.startMinute} onChange={e => state.setStartMinute(parseInt(e.target.value))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all appearance-none cursor-pointer">
                        {[0, 15, 30, 45].map(m => (
                          <option key={m} value={m} className="bg-[var(--sidebar-bg)]">{m.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Duration (Min)</label>
                    <input type="number" step="15" min="15" value={state.duration} onChange={e => state.setDuration(parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Scheduled Time</p>
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {state.selectedSlot?.shiftStart ? format(new Date(state.selectedSlot.shiftStart), "hh:mm a") : (state.period ? (state.period === "AM" ? "08:00 AM (Target)" : "01:00 PM (Target)") : "Select Window")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pr-2">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Encounter Date</p>
                      <p className="text-xs font-bold text-[var(--text-secondary)]">
                        {format(state.selectedDate, "EEE, MMM do")}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-[var(--card-border)]" />
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Window</p>
                      <p className={`text-xs font-bold ${state.period ? "text-[var(--primary)]" : "text-rose-500"}`}>
                        {state.period ? (state.period === "AM" ? "MORNING" : "AFTERNOON") : "PENDING"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
