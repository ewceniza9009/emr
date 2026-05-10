"use client";

import React, { useState, useRef, useEffect } from "react";
import { Filter, Check, X, CreditCard, Clock, Calendar, ChevronDown, Receipt } from "lucide-react";

interface BillingFilterPopoverProps {
  onFilterChange: (filters: BillingFilters) => void;
  currentFilters: BillingFilters;
  activeTab: string;
}

export interface BillingFilters {
  invoiceStatuses: string[];
  claimStatuses: string[];
  period: string;
}

const BillingFilterPopover: React.FC<BillingFilterPopoverProps> = ({ onFilterChange, currentFilters, activeTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stagedFilters, setStagedFilters] = useState<BillingFilters>(currentFilters);
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

  const toggleInvoiceStatus = (status: string) => {
    const newStatuses = stagedFilters.invoiceStatuses.includes(status)
      ? stagedFilters.invoiceStatuses.filter(s => s !== status)
      : [...stagedFilters.invoiceStatuses, status];
    setStagedFilters({ ...stagedFilters, invoiceStatuses: newStatuses });
  };

  const toggleClaimStatus = (status: string) => {
    const newStatuses = stagedFilters.claimStatuses.includes(status)
      ? stagedFilters.claimStatuses.filter(s => s !== status)
      : [...stagedFilters.claimStatuses, status];
    setStagedFilters({ ...stagedFilters, claimStatuses: newStatuses });
  };

  const handleApply = () => {
    onFilterChange(stagedFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = { invoiceStatuses: [], claimStatuses: [], period: "All Time" };
    setStagedFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsOpen(false);
  };

  const currentActiveCount = (stagedFilters.period !== "All Time" ? 1 : 0) + 
                            (activeTab === "invoices" ? currentFilters.invoiceStatuses.length : currentFilters.claimStatuses.length);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-xl transition-all border flex items-center gap-2 group ${
          isOpen || currentActiveCount > 0 
            ? "bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-lg shadow-blue-500/10" 
            : "hover:bg-white/5 border-white/5 text-[var(--text-muted)]"
        }`}
      >
        <Filter className={`w-4 h-4 ${currentActiveCount > 0 ? "animate-pulse" : ""}`} />
        <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
        {currentActiveCount > 0 && (
          <span className="flex items-center justify-center bg-blue-500 text-white text-[9px] font-black w-4 h-4 rounded-full ml-1">
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
                <Receipt className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-tighter">Billing Logic</h3>
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
            {/* Period Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Temporal Period</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["All Time", "Current Month", "Last 30 Days", "Last Quarter"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setStagedFilters({ ...stagedFilters, period: p })}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      stagedFilters.period === p 
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-sm" 
                        : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-blue-500/20"
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-tight">{p}</span>
                    {stagedFilters.period === p && <Check className="w-2.5 h-2.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Section (Contextual) */}
            {activeTab === "invoices" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-1">
                  <CreditCard className="w-3 h-3 text-[var(--text-muted)]" />
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Invoice Status (Multi)</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["DRAFT", "ISSUED", "PAID", "OVERDUE", "CANCELLED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleInvoiceStatus(s)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        stagedFilters.invoiceStatuses.includes(s)
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-sm" 
                          : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-emerald-500/20"
                      }`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-tight">{s}</span>
                      {stagedFilters.invoiceStatuses.includes(s) && <Check className="w-2.5 h-2.5" />}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 ml-1">
                  <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Claim Status (Multi)</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["PENDING", "SUBMITTED", "APPROVED", "REJECTED", "PAID"].map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleClaimStatus(s)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        stagedFilters.claimStatuses.includes(s)
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-sm" 
                          : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-amber-500/20"
                      }`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-tight">{s}</span>
                      {stagedFilters.claimStatuses.includes(s) && <Check className="w-2.5 h-2.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

export default BillingFilterPopover;
