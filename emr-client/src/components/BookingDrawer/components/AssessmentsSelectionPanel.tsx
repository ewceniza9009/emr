import React from "react";
import { Check } from "lucide-react";
import { UseBookingStateReturn } from "../hooks/useBookingState";
import { ASSESSMENT_OPTIONS } from "../constants";

interface AssessmentsSelectionPanelProps {
  state: UseBookingStateReturn;
}

export function AssessmentsSelectionPanel({ state }: AssessmentsSelectionPanelProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">04</span>
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Palliative Assessment Selection</h3>
        <div className="flex-1 h-px bg-[var(--card-border)]" />
      </div>

      <div className="space-y-8 pb-10">
        {ASSESSMENT_OPTIONS.map((cat) => (
          <div key={cat.category} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)]/10 rounded-lg text-[var(--primary)]">
                {cat.icon}
              </div>
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{cat.category}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cat.items.map((item) => {
                const isSelected = state.plannedAssessments.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      state.setPlannedAssessments(prev =>
                        isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id]
                      );
                    }}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-all group
                      ${isSelected
                        ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 shadow-sm"
                        : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/[0.07]"}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                        {item.label}
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all
                        ${isSelected ? "bg-[var(--primary)] border-transparent" : "border-white/20 group-hover:border-white/40"}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                    <p className="text-[10px] font-medium text-[var(--text-muted)] leading-tight">
                      {item.fullName || item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
