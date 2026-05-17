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

  // Robust Clinical Range Validation Helper
  const validateField = (id: string, value: string): boolean => {
    if (!value) return true;
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    
    switch (id) {
      case 'hr': return num >= 30 && num <= 250;
      case 'sbp': return num >= 50 && num <= 280;
      case 'dbp': return num >= 30 && num <= 180;
      case 'temp': return num >= 90 && num <= 110;
      case 'rr': return num >= 4 && num <= 60;
      case 'spo2': return num >= 50 && num <= 100;
      default: return true;
    }
  };

  const isHrValid = validateField('hr', vitals.hr);
  const isSbpValid = validateField('sbp', vitals.sbp);
  const isDbpValid = validateField('dbp', vitals.dbp);
  const isTempValid = validateField('temp', vitals.temp);
  const isRrValid = validateField('rr', vitals.rr);
  const isSpo2Valid = validateField('spo2', vitals.spo2);

  // If one of the BP fields is entered, both must be entered and valid to prevent 1/null
  const isBpCompleteAndValid = 
    (!vitals.sbp && !vitals.dbp) || 
    (!!vitals.sbp && !!vitals.dbp && isSbpValid && isDbpValid);

  const allEnteredAreValid = 
    isHrValid && 
    isBpCompleteAndValid && 
    isTempValid && 
    isRrValid && 
    isSpo2Valid;

  const filledCount = [
    vitals.hr && isHrValid,
    vitals.sbp && vitals.dbp && isSbpValid && isDbpValid,
    vitals.temp && isTempValid,
    vitals.rr && isRrValid,
    vitals.spo2 && isSpo2Valid
  ].filter(Boolean).length;

  const isValid = filledCount >= 3 && allEnteredAreValid;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-1">
        <h2 className="text-sm font-bold uppercase tracking-tight">Clinical Encounter Summary</h2>
        <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest font-bold">SOAP Methodology Documentation</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {fields.map((v) => {
          const hasError = 
            (v.id === 'hr' && !isHrValid) ||
            (v.id === 'sbp' && (!isSbpValid || !isDbpValid || (!vitals.sbp && vitals.dbp) || (vitals.sbp && !vitals.dbp))) ||
            (v.id === 'temp' && !isTempValid) ||
            (v.id === 'rr' && !isRrValid) ||
            (v.id === 'spo2' && !isSpo2Valid);

          return (
            <div key={v.id} className={`space-y-3 p-5 rounded-2xl bg-[var(--card-bg,white)] border transition-all group ${
              hasError 
                ? 'border-red-500/30 bg-red-500/[0.01]' 
                : 'border-[var(--border-color,rgba(0,0,0,0.08))] shadow-sm hover:shadow-md'
            }`}>
              <label className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${
                hasError ? 'text-red-500' : 'text-[var(--text-muted)] group-hover:text-[var(--primary)]'
              }`}>
                <v.icon className={`w-3.5 h-3.5 ${hasError ? 'text-red-500' : v.color}`} /> {v.label}
                {v.id === 'sbp' && (!vitals.sbp || !vitals.dbp) && (vitals.sbp || vitals.dbp) && (
                  <span className="text-[8px] font-black text-red-500 lowercase tracking-normal normal-case">(both BP values required)</span>
                )}
              </label>
              {v.double ? (
                <div className="flex gap-2 items-center">
                  <input
                    value={vitals.sbp}
                    onChange={e => setVitals({ ...vitals, sbp: e.target.value })}
                    placeholder="120"
                    className={`w-full bg-[var(--background)] border ${
                      !isSbpValid ? 'border-red-500/50 focus:border-red-500' : 'border-[var(--border-color,rgba(0,0,0,0.05))] focus:border-[var(--primary)]/50'
                    } rounded-xl py-3 px-4 text-xl font-bold text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--text-muted)]/20`}
                  />
                  <span className="text-[var(--text-muted)]/20 text-xl font-black">/</span>
                  <input
                    value={vitals.dbp}
                    onChange={e => setVitals({ ...vitals, dbp: e.target.value })}
                    placeholder="80"
                    className={`w-full bg-[var(--background)] border ${
                      !isDbpValid ? 'border-red-500/50 focus:border-red-500' : 'border-[var(--border-color,rgba(0,0,0,0.05))] focus:border-[var(--primary)]/50'
                    } rounded-xl py-3 px-4 text-xl font-bold text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--text-muted)]/20`}
                  />
                </div>
              ) : (
                <div className="relative">
                  <input
                    value={vitals[v.id as keyof typeof vitals]}
                    onChange={e => setVitals({ ...vitals, [v.id]: e.target.value })}
                    placeholder={v.placeholder}
                    className={`w-full bg-[var(--background)] border ${
                      ((v.id === 'hr' && !isHrValid) ||
                       (v.id === 'temp' && !isTempValid) ||
                       (v.id === 'rr' && !isRrValid) ||
                       (v.id === 'spo2' && !isSpo2Valid))
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-[var(--border-color,rgba(0,0,0,0.05))] focus:border-[var(--primary)]/50'
                    } rounded-xl py-3 px-4 text-xl font-bold text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--text-muted)]/20`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{v.unit}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="pt-8 flex gap-4 border-t border-[var(--border-color,rgba(0,0,0,0.05))]">
        <button onClick={() => setStep(prevStep.id)} className="flex-1 py-3.5 rounded-xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-all">Back</button>
        <button
          onClick={() => setStep(nextStep.id)}
          disabled={!isValid}
          className={`flex-1 py-3.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${isValid ? "bg-[var(--primary)] shadow-[var(--primary-glow)] hover:opacity-90" : "bg-slate-700/50 text-white/30 cursor-not-allowed grayscale"}`}
        >
          {isValid ? `Continue to ${nextStep.label}` : "Valid Entry Required (3 min)"} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
