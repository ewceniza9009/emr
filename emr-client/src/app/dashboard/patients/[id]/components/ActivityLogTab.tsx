"use client";

import React from "react";
import { Activity, ArrowUpDown, CheckCircle2 } from "lucide-react";
import { UsePatientDashboardStateReturn } from "../hooks/usePatientDashboardState";

interface ActivityLogTabProps {
  state: UsePatientDashboardStateReturn;
}

export function ActivityLogTab({ state }: ActivityLogTabProps) {
  const {
    patient,
    historySortOrder,
    setHistorySortOrder,
    setSelectedEncounter,
  } = state;

  if (!patient) return null;

  const sortedEncounters = [...(patient.encounters || [])].sort((a: any, b: any) => {
    const dateA = new Date(a.encounterDate).getTime();
    const dateB = new Date(b.encounterDate).getTime();
    return historySortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[var(--card-bg)] rounded-[1.5rem] p-6 border border-[var(--card-border)] shadow-xl min-h-[500px]">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-3">
            <Activity className="w-4 h-4 text-[var(--primary)]" />
            Clinical Activity Log
          </h2>
          <button
            onClick={() =>
              setHistorySortOrder(historySortOrder === "desc" ? "asc" : "desc")
            }
            className="px-4 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest active:scale-95"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--primary)]" />
            Sort: {historySortOrder === "desc" ? "Newest First" : "Oldest First"}
          </button>
        </div>
        <div className="space-y-1 relative">
          <div className="absolute left-[19px] top-0 w-px h-full bg-[var(--card-border)]" />
          {sortedEncounters.length > 0 ? (
            sortedEncounters.map((evt: any) => {
              const noteContent =
                evt.clinicalNotes?.[0]?.content ||
                "System generated encounter record. No clinical narrative was documented for this session.";

              // Helper to parse SOAP notes
              const isSoapMarkdown = noteContent.includes("### SUBJECTIVE") || noteContent.includes("### OBJECTIVE") || noteContent.includes("### ASSESSMENT") || noteContent.includes("### PLAN");
              const isSoapLegacy = /^[SOAP]:\s/mi.test(noteContent) || (noteContent.includes("S:") && noteContent.includes("O:") && noteContent.includes("A:") && noteContent.includes("P:"));

              let parsedSoap = null;
              if (isSoapMarkdown || isSoapLegacy) {
                let subjective = "";
                let objective = "";
                let assessment = "";
                let plan = "";

                if (isSoapMarkdown) {
                  const s = noteContent.match(/### SUBJECTIVE\n([\s\S]*?)(?=\n\n### OBJECTIVE|\n### OBJECTIVE|$)/i);
                  const o = noteContent.match(/### OBJECTIVE\n([\s\S]*?)(?=\n\n### ASSESSMENT|\n### ASSESSMENT|$)/i);
                  const a = noteContent.match(/### ASSESSMENT\n([\s\S]*?)(?=\n\n### PLAN|\n### PLAN|$)/i);
                  const p = noteContent.match(/### PLAN\n([\s\S]*?)$/i);

                  subjective = s ? s[1].trim() : "";
                  objective = o ? o[1].trim() : "";
                  assessment = a ? a[1].trim() : "";
                  plan = p ? p[1].trim() : "";
                } else {
                  const s = noteContent.match(/S:\s*([\s\S]*?)(?=\b[OAP]:|$)/i);
                  const o = noteContent.match(/O:\s*([\s\S]*?)(?=\b[AP]:|$)/i);
                  const a = noteContent.match(/A:\s*([\s\S]*?)(?=\b[P]:|$)/i);
                  const p = noteContent.match(/P:\s*([\s\S]*?)$/i);

                  subjective = s ? s[1].trim() : "";
                  objective = o ? o[1].trim() : "";
                  assessment = a ? a[1].trim() : "";
                  plan = p ? p[1].trim() : "";
                }
                parsedSoap = { subjective, objective, assessment, plan };
              }

              const cleanPreview = parsedSoap
                ? [
                    parsedSoap.subjective && `Subjective: ${parsedSoap.subjective}`,
                    parsedSoap.objective && `Objective: ${parsedSoap.objective}`,
                    parsedSoap.assessment && `Assessment: ${parsedSoap.assessment}`,
                    parsedSoap.plan && `Plan: ${parsedSoap.plan}`,
                  ]
                    .filter(Boolean)
                    .join(". ")
                : noteContent;

              return (
                <div
                  key={evt.encounterId}
                  onClick={() => setSelectedEncounter(evt)}
                  className="flex gap-6 relative z-10 group cursor-pointer hover:bg-[var(--primary)]/[0.01] p-3 -ml-3 rounded-2xl border border-transparent hover:border-[var(--card-border)] hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] group-hover:border-[var(--primary)] group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)] transition-all shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="text-xs font-black uppercase text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                          {evt.type?.replace(/_/g, " ")}
                        </h4>
                        {parsedSoap && (
                          <div className="flex items-center gap-1">
                            {parsedSoap.subjective && (
                              <span className="px-1.5 py-0.5 rounded-[0.25rem] text-[7px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                S
                              </span>
                            )}
                            {parsedSoap.objective && (
                              <span className="px-1.5 py-0.5 rounded-[0.25rem] text-[7px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                O
                              </span>
                            )}
                            {parsedSoap.assessment && (
                              <span className="px-1.5 py-0.5 rounded-[0.25rem] text-[7px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                A
                              </span>
                            )}
                            {parsedSoap.plan && (
                              <span className="px-1.5 py-0.5 rounded-[0.25rem] text-[7px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                P
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                        {new Date(evt.encounterDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="relative h-[36px] overflow-hidden mt-1.5">
                      <p className="text-[11px] text-[var(--text-secondary)] italic leading-relaxed whitespace-pre-wrap">
                        {cleanPreview}
                      </p>
                      <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-[var(--card-bg)] to-transparent pointer-events-none" />
                    </div>

                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-px flex-1 bg-[var(--primary)]/10" />
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                        Click for Full Narrative
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] text-[var(--text-muted)] italic pl-12 py-6">
              No clinical encounters logged for this patient.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
