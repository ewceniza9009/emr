import React, { useState } from "react";
import { Plus, Search, ClipboardList, CheckCircle2 } from "lucide-react";

export function AssessmentSelectionModal({ isOpen, onClose, onSelect, selectedIds, questionnaires, loading }: any) {
  const [search, setSearch] = useState("");

  const filtered = questionnaires.filter((q: any) =>
    q.name.toLowerCase().includes(search.toLowerCase()) ||
    q.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[var(--card-bg)] border border-[var(--border-color,rgba(0,0,0,0.1))] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-[var(--border-color,rgba(0,0,0,0.05))] space-y-5 bg-[var(--background)]/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight">Assessments</h3>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.3em] font-bold mt-1">Select clinical instruments to add to encounter</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search registry by code or description..."
              className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] rounded-xl py-3 pl-11 pr-4 text-sm focus:border-[var(--primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-[var(--background)]">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-3 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Syncing Registry...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((q: any) => {
                const isSelected = selectedIds.includes(q.questionnaireId) || selectedIds.includes(q.assessmentType);
                return (
                  <button
                    key={q.questionnaireId}
                    disabled={isSelected}
                    onClick={() => onSelect(q)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group
                      ${isSelected
                        ? 'bg-[var(--primary)]/5 border-[var(--primary)]/20 opacity-60 cursor-not-allowed'
                        : 'bg-[var(--card-bg)] border-[var(--border-color,rgba(0,0,0,0.05))] hover:border-[var(--primary)]/40 hover:shadow-md'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:border-[var(--primary)]/20'}`}>
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold uppercase tracking-tight ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>{q.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1 font-medium">{q.description}</p>
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-[var(--primary)]/10 rounded-full border border-[var(--primary)]/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest">Added</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border border-[var(--border-color,rgba(0,0,0,0.1))] flex items-center justify-center text-[var(--text-muted)] group-hover:border-[var(--primary)]/40 group-hover:text-[var(--primary)] transition-all">
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
