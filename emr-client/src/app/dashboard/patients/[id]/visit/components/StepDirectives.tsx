import React from "react";
import {
  HeartOff,
  Wind,
  Zap,
  FileText,
  UserCheck,
  Droplets,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

export function StepDirectives({ state }: { state: any }) {
  const {
    directives,
    setDirectives,
    setStep,
    prevStep,
    nextStep
  } = state;

  const directiveItems = [
    { id: "DNR", label: "DNR", icon: HeartOff, desc: "Do Not Resuscitate" },
    { id: "DNI", label: "DNI", icon: Wind, desc: "Do Not Intubate" },
    { id: "FULL_CODE", label: "Full Code", icon: Zap, desc: "Full Resuscitation" },
    { id: "LIVING_WILL", label: "Living Will", icon: FileText, desc: "Advance Directive" },
    { id: "HEALTHCARE_PROXY", label: "Healthcare Proxy", icon: UserCheck, desc: "Medical POA" },
    { id: "COMFORT_MEASURES_ONLY", label: "Comfort Only", icon: Droplets, desc: "Comfort Measures" },
  ];

  const handleToggleDirective = (itemId: string) => {
    if (directives.some((d: any) => d.type === itemId)) {
      setDirectives(directives.filter((d: any) => d.type !== itemId));
    } else {
      setDirectives([...directives, { type: itemId, notes: "" }]);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-1">
        <h2 className="text-sm font-bold uppercase tracking-tight">Legal Directives</h2>
        <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-bold">Advance Care Planning</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {directiveItems.map((item) => {
          const isActive = directives.some((d: any) => d.type === item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleToggleDirective(item.id)}
              className={`p-5 rounded-2xl border transition-all flex items-center justify-between group
                ${isActive
                  ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 shadow-sm'
                  : 'bg-[var(--background)]/5 border-[var(--border-color,rgba(0,0,0,0.05))] hover:border-[var(--primary)]/20'
                }`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isActive
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                  : 'bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)]'
                  }`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold uppercase tracking-tight ${isActive ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
                    }`}>{item.label}</p>
                  <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-black mt-1">
                    {item.desc} • {isActive ? 'Active' : 'Unset'}
                  </p>
                </div>
              </div>
              {isActive
                ? <CheckCircle2 className="w-6 h-6 text-[var(--primary)]" />
                : <div className="w-6 h-6 rounded-full border border-[var(--border-color,rgba(0,0,0,0.1))]" />
              }
            </button>
          );
        })}
      </div>

      <div className="pt-8 flex gap-4 border-t border-[var(--border-color,rgba(0,0,0,0.05))]">
        <button onClick={() => setStep(prevStep.id)} className="flex-1 py-3.5 rounded-xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-all">Back</button>
        <button onClick={() => setStep(nextStep.id)} className="flex-1 py-3.5 rounded-xl bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] flex items-center justify-center gap-2 hover:opacity-90 transition-all">
          Continue to {nextStep.label} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
