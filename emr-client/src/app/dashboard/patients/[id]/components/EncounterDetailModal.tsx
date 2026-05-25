"use client";

import React from "react";
import { Stethoscope, X, FileText, ShieldCheck } from "lucide-react";
import HalcyonPortal from "@/components/Portal";
import { UsePatientDashboardStateReturn } from "../hooks/usePatientDashboardState";

interface EncounterDetailModalProps {
  state: UsePatientDashboardStateReturn;
}

function renderFormattedNote(content: string) {
  if (!content) return null;

  const isSoapMarkdown = content.includes("### SUBJECTIVE") || content.includes("### OBJECTIVE") || content.includes("### ASSESSMENT") || content.includes("### PLAN");
  const isSoapLegacy = /^[SOAP]:\s/mi.test(content) || (content.includes("S:") && content.includes("O:") && content.includes("A:") && content.includes("P:"));

  if (isSoapMarkdown || isSoapLegacy) {
    let subjective = "";
    let objective = "";
    let assessment = "";
    let plan = "";

    if (isSoapMarkdown) {
      const s = content.match(/### SUBJECTIVE\n([\s\S]*?)(?=\n\n### OBJECTIVE|\n### OBJECTIVE|$)/i);
      const o = content.match(/### OBJECTIVE\n([\s\S]*?)(?=\n\n### ASSESSMENT|\n### ASSESSMENT|$)/i);
      const a = content.match(/### ASSESSMENT\n([\s\S]*?)(?=\n\n### PLAN|\n### PLAN|$)/i);
      const p = content.match(/### PLAN\n([\s\S]*?)$/i);

      subjective = s ? s[1].trim() : "";
      objective = o ? o[1].trim() : "";
      assessment = a ? a[1].trim() : "";
      plan = p ? p[1].trim() : "";
    } else {
      const s = content.match(/S:\s*([\s\S]*?)(?=\b[OAP]:|$)/i);
      const o = content.match(/O:\s*([\s\S]*?)(?=\b[AP]:|$)/i);
      const a = content.match(/A:\s*([\s\S]*?)(?=\b[P]:|$)/i);
      const p = content.match(/P:\s*([\s\S]*?)$/i);

      subjective = s ? s[1].trim() : "";
      objective = o ? o[1].trim() : "";
      assessment = a ? a[1].trim() : "";
      plan = p ? p[1].trim() : "";
    }

    const sections = [
      { label: "Subjective (S)", text: subjective, badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      { label: "Objective (O)", text: objective, badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
      { label: "Assessment (A)", text: assessment, badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
      { label: "Plan (P)", text: plan, badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    ];

    return (
      <div className="space-y-4 w-full">
        {sections.map((sec, idx) => (
          sec.text ? (
            <div key={idx} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2 overflow-x-auto custom-scrollbar">
              <span className={`inline-block px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${sec.badgeColor}`}>
                {sec.label}
              </span>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words font-medium">
                {sec.text}
              </p>
            </div>
          ) : null
        ))}
      </div>
    );
  }

  return (
    <div className="p-5 rounded-[1.5rem] bg-[var(--input-bg)] border border-[var(--card-border)] w-full overflow-x-auto custom-scrollbar">
      <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words font-medium">
        {content}
      </p>
    </div>
  );
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
                className="p-2 hover:bg-[var(--input-bg)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all active:scale-95"
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
                <div className="p-0 border border-transparent relative group max-h-[350px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                    <Stethoscope className="w-24 h-24" />
                  </div>
                  <div className="w-full relative z-10">
                    {selectedEncounter.clinicalNotes?.[0]?.content ? (
                      renderFormattedNote(selectedEncounter.clinicalNotes[0].content)
                    ) : (
                      <div className="p-6 rounded-3xl bg-[var(--input-bg)]/50 border border-[var(--card-border)]">
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                          No narrative content recorded for this encounter.
                        </p>
                      </div>
                    )}
                  </div>
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
