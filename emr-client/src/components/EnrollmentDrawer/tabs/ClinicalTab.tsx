"use client";

import React from "react";
import { EnrollmentState } from "../hooks/useEnrollmentState";
import { formatPhoneNumber } from "../utils";
import { RELATIONSHIP_LABELS } from "../types";
import {
  HeartPulse, HeartHandshake, Search, ChevronRight,
  Shield, AlertCircle, AlertTriangle, Home, Users, User, UserX, CheckCircle, Activity,
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
            {[
              { label: "LOW", value: "LOW", color: "emerald", icon: CheckCircle },
              { label: "MODERATE", value: "MODERATE", color: "amber", icon: AlertCircle },
              { label: "HIGH", value: "HIGH", color: "rose", icon: AlertTriangle }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = state.acuity === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => state.setAcuity(item.value)}
                  className={`h-11 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 active:scale-95 duration-200
                    ${isActive 
                      ? item.color === "emerald" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                        : item.color === "amber" ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                        : "bg-rose-500/15 border-rose-500 text-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.2)] animate-pulse"
                      : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:bg-white/5 hover:border-[var(--primary)]/30 hover:text-[var(--text-primary)]"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label} ACUITY</span>
                </button>
              );
            })}
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
              {[
                { label: "STABLE", value: "STABLE", color: "emerald", icon: Home },
                { label: "AT RISK", value: "AT_RISK", color: "amber", icon: AlertCircle },
                { label: "UNSTABLE", value: "UNSTABLE", color: "rose", icon: AlertTriangle }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = state.sdohHousing === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => state.setSdohHousing(item.value)}
                    className={`w-full h-9 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-between px-4 active:scale-[0.98] duration-200
                      ${isActive 
                        ? item.color === "emerald" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]" 
                          : item.color === "amber" ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.05)]" 
                          : "bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
                        : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:bg-white/5 hover:border-[var(--primary)]/20 hover:text-[var(--text-primary)]"
                      }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {item.label}
                    </span>
                    {isActive && <div className={`w-1.5 h-1.5 rounded-full ${item.color === "emerald" ? "bg-emerald-400" : item.color === "amber" ? "bg-amber-400" : "bg-rose-400"} animate-ping`} />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
              Social Support
            </label>
            <div className="space-y-1.5">
              {[
                { label: "ADEQUATE", value: "ADEQUATE", color: "emerald", icon: Users },
                { label: "LIMITED", value: "LIMITED", color: "amber", icon: User },
                { label: "NONE", value: "NONE", color: "rose", icon: UserX }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = state.sdohSupport === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => state.setSdohSupport(item.value)}
                    className={`w-full h-9 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-between px-4 active:scale-[0.98] duration-200
                      ${isActive 
                        ? item.color === "emerald" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]" 
                          : item.color === "amber" ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.05)]" 
                          : "bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
                        : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:bg-white/5 hover:border-[var(--primary)]/20 hover:text-[var(--text-primary)]"
                      }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {item.label}
                    </span>
                    {isActive && <div className={`w-1.5 h-1.5 rounded-full ${item.color === "emerald" ? "bg-emerald-400" : item.color === "amber" ? "bg-amber-400" : "bg-rose-400"} animate-ping`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
