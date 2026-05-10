"use client";

import React, { useState, useRef, useEffect } from "react";
import { Filter, Check, X, Users, Shield, UserCircle, ChevronDown } from "lucide-react";

interface PatientFilterPopoverProps {
  onFilterChange: (filters: PatientFilters) => void;
  currentFilters: PatientFilters;
}

export interface PatientFilters {
  directiveTypes: string[];
  biologicalSex: string | null;
  visitStatuses: string[];
}

const PatientFilterPopover: React.FC<PatientFilterPopoverProps> = ({ onFilterChange, currentFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stagedFilters, setStagedFilters] = useState<PatientFilters>(currentFilters);
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

  const toggleSex = (value: string) => {
    setStagedFilters({
      ...stagedFilters,
      biologicalSex: stagedFilters.biologicalSex === value ? null : value
    });
  };

  const toggleDirective = (type: string) => {
    const newTypes = stagedFilters.directiveTypes.includes(type)
      ? stagedFilters.directiveTypes.filter(t => t !== type)
      : [...stagedFilters.directiveTypes, type];
    setStagedFilters({ ...stagedFilters, directiveTypes: newTypes });
  };

  const toggleVisitStatus = (status: string) => {
    const newStatuses = stagedFilters.visitStatuses.includes(status)
      ? stagedFilters.visitStatuses.filter(s => s !== status)
      : [...stagedFilters.visitStatuses, status];
    setStagedFilters({ ...stagedFilters, visitStatuses: newStatuses });
  };

  const handleApply = () => {
    onFilterChange(stagedFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = { biologicalSex: null, directiveTypes: [], visitStatuses: [] };
    setStagedFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsOpen(false);
  };

  const currentActiveCount = (currentFilters.biologicalSex !== null ? 1 : 0) +
    currentFilters.directiveTypes.length +
    currentFilters.visitStatuses.length;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-xl transition-all border flex items-center gap-2 group ${isOpen || currentActiveCount > 0
            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500 shadow-lg shadow-indigo-500/10"
            : "hover:bg-white/5 border-white/5 text-[var(--text-muted)]"
          }`}
      >
        <Filter className={`w-4 h-4 ${currentActiveCount > 0 ? "animate-pulse" : ""}`} />
        {currentActiveCount > 0 && (
          <span className="flex items-center justify-center bg-indigo-500 text-white text-[9px] font-black w-4 h-4 rounded-full">
            {currentActiveCount}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 backdrop-blur-xl">
          <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-tighter">Registry Logic</h3>
            </div>
            {currentActiveCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-red-500 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          <div className="p-6 space-y-8 overflow-y-auto max-h-[60vh]">
            {/* Demographic Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <UserCircle className="w-3 h-3 text-[var(--text-muted)]" />
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Biological Sex</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["Male", "Female"].map((sex) => (
                  <button
                    key={sex}
                    onClick={() => toggleSex(sex)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${stagedFilters.biologicalSex === sex
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500 shadow-sm"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-indigo-500/20"
                      }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-tight">{sex}</span>
                    {stagedFilters.biologicalSex === sex && <Check className="w-2.5 h-2.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Visit Status Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Visit Status (Multi)</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["Scheduled", "InProgress", "Completed", "NoShow", "No Visit"].map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleVisitStatus(status)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${stagedFilters.visitStatuses.includes(status)
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-sm"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-emerald-500/20"
                      }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-tight">{status.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {stagedFilters.visitStatuses.includes(status) && <Check className="w-2.5 h-2.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Directives Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <Shield className="w-3 h-3 text-[var(--text-muted)]" />
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Directives (Multi)</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["DNR", "FullCode", "HealthcareProxy", "None"].map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleDirective(type)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${stagedFilters.directiveTypes.includes(type)
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-sm"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-blue-500/20"
                      }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-tight">{type === 'None' ? 'Missing' : type}</span>
                    {stagedFilters.directiveTypes.includes(type) && <Check className="w-2.5 h-2.5" />}
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

export default PatientFilterPopover;
