import React from "react";
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  Droplets,
  ChevronRight
} from "lucide-react";

export function StepVitals({ state }: { state: any }) {
  const {
    vitals,
    setVitals,
    setStep,
    prevStep,
    nextStep
  } = state;

  const fields = [
    { id: 'hr', label: 'Heart Rate', icon: Heart, color: 'text-rose-500', unit: 'BPM', placeholder: '72' },
    { id: 'sbp', label: 'Blood Pressure', icon: Activity, color: 'text-blue-500', unit: 'mmHg', double: true },
    { id: 'temp', label: 'Temperature', icon: Thermometer, color: 'text-amber-500', unit: '°F', placeholder: '98.6' },
    { id: 'rr', label: 'Respiratory Rate', icon: Wind, color: 'text-slate-400', unit: 'BPM', placeholder: '16' },
    { id: 'spo2', label: 'O2 Saturation', icon: Droplets, color: 'text-blue-400', unit: '%', placeholder: '98' },
  ];

  const filledCount = [vitals.hr, vitals.sbp && vitals.dbp, vitals.temp, vitals.rr, vitals.spo2].filter(Boolean).length;
  const isValid = filledCount >= 3;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-1">
        <h2 className="text-sm font-bold uppercase tracking-tight">Clinical Encounter Summary</h2>
        <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest font-bold">SOAP Methodology Documentation</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {fields.map((v) => (
          <div key={v.id} className="space-y-3 p-5 rounded-2xl bg-[var(--card-bg,white)] border border-[var(--border-color,rgba(0,0,0,0.08))] shadow-sm hover:shadow-md transition-all group">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2 group-hover:text-[var(--primary)] transition-colors">
              <v.icon className={`w-3.5 h-3.5 ${v.color}`} /> {v.label}
            </label>
            {v.double ? (
              <div className="flex gap-2 items-center">
                <input
                  value={vitals.sbp}
                  onChange={e => setVitals({ ...vitals, sbp: e.target.value })}
                  placeholder="120"
                  className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] rounded-xl py-3 px-4 text-xl font-bold text-[var(--foreground)] focus:border-[var(--primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/20"
                />
                <span className="text-[var(--text-muted)]/20 text-xl font-black">/</span>
                <input
                  value={vitals.dbp}
                  onChange={e => setVitals({ ...vitals, dbp: e.target.value })}
                  placeholder="80"
                  className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] rounded-xl py-3 px-4 text-xl font-bold text-[var(--foreground)] focus:border-[var(--primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/20"
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  value={vitals[v.id as keyof typeof vitals]}
                  onChange={e => setVitals({ ...vitals, [v.id]: e.target.value })}
                  placeholder={v.placeholder}
                  className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] rounded-xl py-3 px-4 text-xl font-bold text-[var(--foreground)] focus:border-[var(--primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{v.unit}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="pt-8 flex gap-4 border-t border-[var(--border-color,rgba(0,0,0,0.05))]">
        <button onClick={() => setStep(prevStep.id)} className="flex-1 py-3.5 rounded-xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-all">Back</button>
        <button
          onClick={() => setStep(nextStep.id)}
          disabled={!isValid}
          className={`flex-1 py-3.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${isValid ? "bg-[var(--primary)] shadow-[var(--primary-glow)] hover:opacity-90" : "bg-slate-700/50 text-white/30 cursor-not-allowed grayscale"}`}
        >
          {isValid ? `Continue to ${nextStep.label}` : "Entry Required (3 min)"} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
