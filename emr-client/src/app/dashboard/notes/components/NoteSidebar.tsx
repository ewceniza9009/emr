"use client";

import React from "react";
import { Search, Plus, ChevronRight } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";

interface NoteSidebarProps {
  state: any; // ReturnType<typeof useNotesState>
}

export function NoteSidebar({ state }: NoteSidebarProps) {
  const {
    groupedList,
    selectedId,
    setSelectedId,
    searchTerm,
    setSearchTerm,
    setIsBookingOpen,
    expandedPatients,
    togglePatient,
    page,
    setPage,
    PAGE_SIZE,
    totalCount,
  } = state;

  return (
    <div className="w-[350px] shrink-0 flex flex-col gap-4 overflow-hidden h-full">
      <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] p-4 flex flex-col gap-4 overflow-hidden h-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-tighter">
              Clinical Notes
            </h2>
            <p className="text-[10px] font-black text-[var(--primary)] tracking-widest uppercase">
              Documentation Registry
            </p>
          </div>
          <PermissionGate permission="scheduling:manage">
            <button
              onClick={() => setIsBookingOpen(true)}
              className="p-3 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-all active:scale-95 animate-pulse"
            >
              <Plus className="w-5 h-5" />
            </button>
          </PermissionGate>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="SEARCH BY MRN OR NAME..."
            className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all uppercase"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-10 custom-scrollbar">
          {groupedList.map((group: any) => {
            const isExpanded = !!expandedPatients[group.patientId];
            return (
              <div
                key={group.patientId}
                className="bg-[var(--input-bg)]/40 border border-[var(--card-border)] rounded-2xl p-3 animate-in fade-in space-y-2"
              >
                {/* Patient Header */}
                <div
                  onClick={() => togglePatient(group.patientId)}
                  className="flex items-center justify-between cursor-pointer select-none group/hdr"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90 text-[var(--primary)]" : "text-[var(--text-muted)] group-hover/hdr:text-[var(--text-primary)]"}`}
                    />
                    <div>
                      <h4 className="text-xs font-black uppercase text-[var(--text-primary)] group-hover/hdr:text-[var(--primary)] transition-colors">
                        {group.firstName} {group.lastName}
                      </h4>
                      <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                        MRN: {group.mrn}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-[var(--primary)]/10 text-[var(--primary)] uppercase tracking-tighter shrink-0">
                    {group.notes.length}{" "}
                    {group.notes.length === 1 ? "visit" : "visits"}
                  </span>
                </div>

                {/* Notes List under Patient */}
                {isExpanded && (
                  <div className="space-y-2 pl-3 border-l-2 border-[var(--card-border)]/40 ml-1.5 animate-in slide-in-from-top-2 duration-300">
                    {group.notes.map((n: any) => (
                      <div
                        key={n.appointmentId}
                        onClick={() => setSelectedId(n.appointmentId)}
                        className={`py-2 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group/note ${
                          selectedId === n.appointmentId
                            ? "bg-[var(--primary)]/15 border-[var(--primary)]/40 border-l-4 border-l-[var(--primary)] pl-2"
                            : "bg-[var(--card-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/20"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                                n.status === "COMPLETED"
                                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              }`}
                            >
                              {n.status === "COMPLETED" ? "LOCKED" : n.status}
                            </span>
                            <span className="text-[8px] font-black text-[var(--text-muted)]">
                              {new Date(n.scheduledStart).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">
                            Clinical Note
                          </span>
                        </div>
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform group-hover/note:translate-x-0.5 ${
                            selectedId === n.appointmentId
                              ? "text-[var(--primary)]"
                              : "text-[var(--text-muted)]"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Footer Pagination */}
        <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between">
          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {totalCount > 0 
              ? `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalCount)} of ${totalCount}`
              : "0 of 0"
            }
          </p>
          <div className="flex gap-1">
             <button 
               disabled={page === 0}
               onClick={() => setPage((p: number) => p - 1)}
               className="px-2.5 py-1 rounded bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] disabled:opacity-40 text-[9px] font-black hover:text-[var(--text-primary)] transition-all"
             >
               PREV
             </button>
             <button 
               disabled={(page + 1) * PAGE_SIZE >= totalCount}
               onClick={() => setPage((p: number) => p + 1)}
               className="px-2.5 py-1 rounded bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] disabled:opacity-40 text-[9px] font-black hover:text-[var(--text-primary)] transition-all"
             >
               NEXT
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
