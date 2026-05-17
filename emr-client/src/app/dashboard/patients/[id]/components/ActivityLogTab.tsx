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
              const note =
                evt.clinicalNotes?.[0]?.content ||
                "System generated encounter record. No clinical narrative was documented for this session.";
              return (
                <div
                  key={evt.encounterId}
                  onClick={() => setSelectedEncounter(evt)}
                  className="flex gap-6 relative z-10 group cursor-pointer hover:bg-[var(--primary)]/[0.02] p-2 -ml-2 rounded-xl transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] group-hover:border-[var(--primary)] group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)] transition-all shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                        {evt.type?.replace(/_/g, " ")}
                      </h4>
                      <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                        {new Date(evt.encounterDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      className="text-[11px] text-[var(--text-secondary)] mt-1 italic group-hover:text-[var(--text-primary)] transition-colors relative whitespace-pre-wrap"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {note}
                    </p>
                    <div className="mt-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
