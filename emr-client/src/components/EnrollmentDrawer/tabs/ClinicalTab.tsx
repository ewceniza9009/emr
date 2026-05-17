"use client";

import React from "react";
import { EnrollmentState } from "../hooks/useEnrollmentState";
import { formatPhoneNumber } from "../utils";
import { RELATIONSHIP_LABELS } from "../types";
import {
  HeartPulse, HeartHandshake, Search, ChevronRight,
} from "lucide-react";

interface Props { state: EnrollmentState; }

export default function ClinicalTab({ state }: Props) {
  return (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      {/* Clinical Intake HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <HeartPulse className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Clinical Intake Triage
                          </h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-6 border border-[var(--card-border)] space-y-6 shadow-inner">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                              Primary Diagnosis (ICD-10 Search)
                            </label>
                            <div className="relative group/icd10">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/icd10:text-[var(--primary)] transition-colors" />
                              <input
                                type="text"
                                value={state.primaryDiagnosis}
                                onChange={(e) =>
                                  state.setPrimaryDiagnosis(e.target.value)
                                }
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-10 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/40 transition-all"
                                placeholder="Search codes (e.g. I50.9)..."
                              />
                              {state.isSearchingIcd10 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}

                              {state.showIcd10Search && state.icd10Results.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                  {state.icd10Results.map((res: any, idx: number) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        state.setPrimaryDiagnosis(
                                          `${res.icd10Code} - ${res.description}`,
                                        );
                                        state.setShowIcd10Search(false);
                                      }}
                                      className="w-full px-4 py-3 text-left hover:bg-[var(--primary)]/10 transition-colors border-b border-[var(--card-border)] last:border-0 group/item"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-[var(--primary)]">
                                          {res.icd10Code}
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover/item:opacity-100 transition-all" />
                                      </div>
                                      <p className="text-[9px] font-bold text-[var(--text-primary)] mt-1 line-clamp-1">
                                        {res.description}
                                      </p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {["LOW", "MODERATE", "HIGH"].map((v) => (
                              <button
                                key={v}
                                onClick={() => state.setAcuity(v)}
                                className={`h-10 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all
                                    ${state.acuity === v ? "bg-rose-500/10 border-rose-500 text-rose-500" : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]"}`}
                              >
                                {v} ACUITY
                              </button>
                            ))}
                          </div>
                        </div>
                      </section>

                      {/* SDoH HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <HeartHandshake className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Social Determinants (SDoH)
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                              Housing Stability
                            </label>
                            <div className="space-y-1.5">
                              {["STABLE", "AT_RISK", "UNSTABLE"].map((v) => (
                                <button
                                  key={v}
                                  onClick={() => state.setSdohHousing(v)}
                                  className={`w-full h-8 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${state.sdohHousing === v ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--input-bg)]"}`}
                                >
                                  {v.replace("_", " ")}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                              Social Support
                            </label>
                            <div className="space-y-1.5">
                              {["ADEQUATE", "LIMITED", "NONE"].map((v) => (
                                <button
                                  key={v}
                                  onClick={() => state.setSdohSupport(v)}
                                  className={`w-full h-8 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${state.sdohSupport === v ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--input-bg)]"}`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
  );
}
