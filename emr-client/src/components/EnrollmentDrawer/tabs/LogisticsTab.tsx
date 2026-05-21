"use client";

import React from "react";
import { EnrollmentState } from "../hooks/useEnrollmentState";
import { formatPhoneNumber } from "../utils";
import { RELATIONSHIP_LABELS } from "../types";
import {
  Home, Building2, Video, PhoneCall, Search, Car,
} from "lucide-react";
import { CareModality } from "@/types/enums";

interface Props { state: EnrollmentState; }

export default function LogisticsTab({ state }: Props) {
  return (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      {/* 01: VISIT MODALITY */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] border-l-2 border-[var(--primary)] pl-3">
                            Visit Modality
                          </h3>
                        </div>
                        <div className="grid grid-cols-4 gap-2.5">
                          {[
                            {
                              id: "HomeCare",
                              label: "Home Visit",
                              icon: <Home className="w-4 h-4" />,
                            },
                            {
                              id: "InPatientHospice",
                              label: "Facility",
                              icon: <Building2 className="w-4 h-4" />,
                            },
                            {
                              id: "VirtualCare",
                              label: "Video Call",
                              icon: <Video className="w-4 h-4" />,
                            },
                            {
                              id: "HybridCare",
                              label: "Audio Only",
                              icon: <PhoneCall className="w-4 h-4" />,
                            },
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => state.setModality(m.id as CareModality)}
                              className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-2xl border text-[9px] font-bold transition-all
                                     ${state.modality === m.id ? "bg-[var(--primary)] border-transparent text-black shadow-lg shadow-[var(--primary-glow)]" : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)]"}`}
                            >
                              {m.icon}
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* 01-B: VISIT DURATION */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] border-l-2 border-[var(--primary)] pl-3">
                            Visit Duration
                          </h3>
                        </div>
                        <div className="flex bg-[var(--input-bg)] rounded-2xl p-1.5 border border-[var(--card-border)] shadow-inner">
                          {[30, 45, 60, 90, 120].map((d) => (
                            <button
                              key={d}
                              onClick={() => state.setDuration(d)}
                              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all
                                ${state.duration === d ? "bg-[var(--primary)] text-black shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                            >
                              {d} MIN
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* 02: CLINICAL TEAM ASSIGNMENT */}
                      <section className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] border-l-2 border-[var(--primary)] pl-3">
                              Clinical Team assignment
                            </h3>
                          </div>
                          <div className="relative group">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                              placeholder="Filter Practitioners..."
                              value={state.staffSearch}
                              onChange={(e) => state.setStaffSearch(e.target.value)}
                              className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full py-1.5 pl-9 pr-4 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/40 w-32 focus:w-48 transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-5">
                          {/* Care Navigator Selection */}
                          <div>
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 px-1">
                              Care Navigator Assignment
                            </p>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-hide">
                              {state.availabilityLoading &&
                              state.practitioners.length === 0 ? (
                                <div className="col-span-2 py-4 flex flex-col items-center justify-center opacity-30">
                                  <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-2" />
                                  <p className="text-[8px] font-bold uppercase tracking-widest">
                                    Scanning Availability...
                                  </p>
                                </div>
                              ) : (
                                state.practitioners
                                  .filter(
                                    (p: any) =>
                                      p.isCareNavigator &&
                                      (!state.staffSearch ||
                                        p.fullName
                                          .toLowerCase()
                                          .includes(state.staffSearch.toLowerCase())),
                                  )
                                  .map((p: any) => {
                                    const avail = state.availability.get(
                                      p.practitionerId,
                                    );
                                    const isSelected =
                                      state.careNavigatorId === p.practitionerId;
                                    return (
                                      <button
                                        key={p.practitionerId}
                                        onClick={() => {
                                          state.setCareNavigatorId(p.practitionerId);
                                          state.setSupportingClinicianIds(prev => prev.filter((id: string) => id !== p.practitionerId));
                                        }}
                                        className={`p-3 rounded-xl border text-left transition-all group relative overflow-hidden ${isSelected ? "bg-teal-500/10 border-teal-500 shadow-sm" : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-teal-500/30"}`}
                                      >
                                        <div className="flex justify-between items-start gap-2">
                                          <div className="min-w-0 flex-1">
                                            <p
                                              className={`text-[10px] font-black truncate leading-tight ${isSelected ? "text-teal-500" : "text-[var(--text-primary)]"}`}
                                            >
                                              {p.fullName}
                                            </p>
                                            <p className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1 opacity-60">
                                              Patient Navigation
                                            </p>
                                          </div>
                                          {avail && (
                                            <div
                                              className={`flex flex-col items-end shrink-0 ${isSelected ? "text-teal-500" : "text-[var(--text-primary)]"}`}
                                            >
                                              <span className="text-[10px] font-black leading-none">
                                                {avail.travelTimeInMinutes}M
                                              </span>
                                              <span className="text-[7px] font-bold opacity-50 mt-1 uppercase tracking-tighter">
                                                {avail.distanceInMiles.toFixed(
                                                  1,
                                                )}
                                                MI
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        {!avail && !state.availabilityLoading && (
                                          <div className="mt-2 flex items-center gap-1 opacity-30">
                                            <Car className="w-2 h-2" />
                                            <span className="text-[7px] font-bold uppercase tracking-tighter">
                                              Scan Unavailable
                                            </span>
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })
                              )}
                            </div>
                          </div>

                          {/* Supporting Clinicians Selection */}
                          <div>
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 px-1">
                              Supporting Clinicians Assignment
                            </p>
                            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto scrollbar-hide">
                              {state.availabilityLoading &&
                              state.practitioners.length === 0 ? (
                                <div className="col-span-2 py-4 flex flex-col items-center justify-center opacity-30">
                                  <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-2" />
                                  <p className="text-[8px] font-bold uppercase tracking-widest">
                                    Scanning Availability...
                                  </p>
                                </div>
                              ) : (
                                state.practitioners
                                  .filter(
                                    (p: any) =>
                                      p.isSupportingClinician &&
                                      (!state.staffSearch ||
                                        p.fullName
                                          .toLowerCase()
                                          .includes(state.staffSearch.toLowerCase())),
                                  )
                                  .map((p: any) => {
                                    const avail = state.availability.get(
                                      p.practitionerId,
                                    );
                                    const isSelected =
                                      state.supportingClinicianIds.includes(p.practitionerId);
                                    return (
                                      <button
                                        key={p.practitionerId}
                                        onClick={() => {
                                          if (isSelected) {
                                            state.setSupportingClinicianIds(prev => prev.filter((id: string) => id !== p.practitionerId));
                                          } else {
                                            state.setSupportingClinicianIds(prev => [...prev, p.practitionerId]);
                                            if (state.careNavigatorId === p.practitionerId) {
                                              state.setCareNavigatorId("");
                                            }
                                          }
                                        }}
                                        className={`p-3 rounded-xl border text-left transition-all group relative overflow-hidden ${isSelected ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm" : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/30"}`}
                                      >
                                        <div className="flex justify-between items-start gap-2">
                                          <div className="min-w-0 flex-1">
                                            <p
                                              className={`text-[10px] font-black truncate leading-tight ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}
                                            >
                                              {p.fullName}
                                            </p>
                                            <p className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1 opacity-60">
                                              Lead Practitioner
                                            </p>
                                          </div>
                                          {avail && (
                                            <div
                                              className={`flex flex-col items-end shrink-0 ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}
                                            >
                                              <span className="text-[10px] font-black leading-none">
                                                {avail.travelTimeInMinutes}M
                                              </span>
                                              <span className="text-[7px] font-bold opacity-50 mt-1 uppercase tracking-tighter">
                                                {avail.distanceInMiles.toFixed(
                                                  1,
                                                )}
                                                MI
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        {!avail && !state.availabilityLoading && (
                                          <div className="mt-2 flex items-center gap-1 opacity-30">
                                            <Car className="w-2 h-2" />
                                            <span className="text-[7px] font-bold uppercase tracking-tighter">
                                              Scan Unavailable
                                            </span>
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })
                              )}
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
  );
}
