"use client";

import React from "react";
import { Stethoscope, X, FileText, ShieldCheck } from "lucide-react";
import HalcyonPortal from "@/components/Portal";
import { UsePatientDashboardStateReturn } from "../hooks/usePatientDashboardState";

interface EncounterDetailModalProps {
  state: UsePatientDashboardStateReturn;
}

export function EncounterDetailModal({ state }: EncounterDetailModalProps) {
  const { selectedEncounter, setSelectedEncounter } = state;

  if (!selectedEncounter) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[10000000] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          onClick={() => setSelectedEncounter(null)}
        />
        <div className="relative w-full max-w-lg flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[1.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
          <div className="h-2 w-full premium-gradient" />

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shadow-lg shadow-[var(--primary-glow)]">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight leading-none">
                    {selectedEncounter.type?.replace(/_/g, " ")}
                  </h3>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-2">
                    Encounter Date:{" "}
                    {new Date(selectedEncounter.encounterDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEncounter(null)}
                className="p-2 hover:bg-[var(--input-bg)] rounded-xl text-[var(--text-muted)] hover:text-white transition-all active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">
                    Status
                  </p>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    {selectedEncounter.status}
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                  <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">
                    Practitioner
                  </p>
                  <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest">
                    {selectedEncounter.practitioner
                      ? `${selectedEncounter.practitioner.firstName} ${selectedEncounter.practitioner.lastName}`
                      : "System Admin"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                    Clinical Narrative
                  </span>
                </div>
                <div className="p-6 rounded-3xl bg-[var(--input-bg)]/50 border border-[var(--card-border)] relative group min-h-[100px] overflow-y-auto max-h-[250px] custom-scrollbar">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                    <Stethoscope className="w-24 h-24" />
                  </div>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed italic relative z-10 whitespace-pre-wrap">
                    {selectedEncounter.clinicalNotes?.[0]?.content ||
                      "No narrative content recorded for this encounter."}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-[var(--card-border)] flex-wrap gap-3">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                  Forensically Audited Encounter Record
                </span>
              </div>
              <button
                onClick={() => setSelectedEncounter(null)}
                className="px-8 py-3 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 active:scale-95 transition-all"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
