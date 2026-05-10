"use client";

import React, { useState, useRef, useEffect } from "react";
import { Filter, Check, X, Target, PhoneCall, Clock, ChevronDown, UserSearch } from "lucide-react";

interface OutreachFilterPopoverProps {
  onFilterChange: (filters: OutreachFilters) => void;
  currentFilters: OutreachFilters;
}

export interface OutreachFilters {
  statuses: string[];
  callAttempts: number | null;
  urgency: string | null;
}

const OutreachFilterPopover: React.FC<OutreachFilterPopoverProps> = ({ onFilterChange, currentFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stagedFilters, setStagedFilters] = useState<OutreachFilters>(currentFilters);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync staged filters when popover opens
  useEffect(() => {
    if (isOpen) {
      setStagedFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleStatus = (status: string) => {
    const newStatuses = stagedFilters.statuses.includes(status)
      ? stagedFilters.statuses.filter(s => s !== status)
      : [...stagedFilters.statuses, status];
    setStagedFilters({ ...stagedFilters, statuses: newStatuses });
  };

  const toggleCallAttempts = (count: number) => {
    setStagedFilters({
      ...stagedFilters,
      callAttempts: stagedFilters.callAttempts === count ? null : count
    });
  };

  const handleApply = () => {
    onFilterChange(stagedFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = { statuses: [], callAttempts: null, urgency: null };
    setStagedFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsOpen(false);
  };

  const activeCount = stagedFilters.statuses.length + (currentFilters.callAttempts !== null ? 1 : 0);
  const currentActiveCount = currentFilters.statuses.length + (currentFilters.callAttempts !== null ? 1 : 0);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-xl transition-all border flex items-center gap-2 group ${isOpen || currentActiveCount > 0
            ? "bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-lg shadow-blue-500/10"
            : "hover:bg-white/5 border-white/5 text-[var(--text-muted)]"
          }`}
      >
        <Filter className={`w-4 h-4 ${currentActiveCount > 0 ? "animate-pulse" : ""}`} />
        {currentActiveCount > 0 && (
          <span className="flex items-center justify-center bg-blue-500 text-white text-[9px] font-black w-4 h-4 rounded-full">
            {currentActiveCount}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 backdrop-blur-xl">
          <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Target className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-tighter">Outreach Logic</h3>
            </div>
            {currentActiveCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="p-6 space-y-8">
            {/* Enrollment Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <UserSearch className="w-3 h-3 text-[var(--text-muted)]" />
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Lead Status (Multi)</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "LEAD",
                  "CONTACTED",
                  "INTERESTED",
                  "REFUSED",
                  "DO_NOT_CALL",
                  "ENROLLED"
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${stagedFilters.statuses.includes(s)
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-sm"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-blue-500/20"
                      }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-tight">
                      {s.replace('_', ' ')}
                    </span>
                    {stagedFilters.statuses.includes(s) && <Check className="w-2.5 h-2.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Engagement Level */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <PhoneCall className="w-3 h-3 text-[var(--text-muted)]" />
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Call Attempts</label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0, 2, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => toggleCallAttempts(count)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${stagedFilters.callAttempts === count
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-sm"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-amber-500/20"
                      }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-tight">{count === 0 ? '0' : count === 2 ? '1-2' : '3+'}</span>
                    {stagedFilters.callAttempts === count && <Check className="w-2.5 h-2.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/[0.02] border-t border-[var(--card-border)]">
            <button
              onClick={handleApply}
              className="w-full py-4 bg-[var(--foreground)] text-[var(--background)] text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:opacity-90 transition-all shadow-xl"
            >
              Apply Filter Set
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutreachFilterPopover;
