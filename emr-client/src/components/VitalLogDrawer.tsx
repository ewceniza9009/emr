"use client";

import { X, Activity, Calendar, Clock, Heart, Wind, Droplets, Scale, Thermometer } from "lucide-react";
import AuraPortal from "./Portal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  encounters: any[];
}

export default function VitalLogDrawer({ isOpen, onClose, encounters }: Props) {
  if (!isOpen) return null;

  return (
    <AuraPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-2xl bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

          <div className="p-8 border-b border-[var(--card-border)] flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-500" />
                Complete Vital History
              </h2>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Full longitudinal clinical log</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-xl bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {encounters.map((e: any, idx) => (
              <div key={e.encounterId} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest">
                    Log Entry #{encounters.length - idx}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(e.encounterDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(e.encounterDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {e.vitalSigns?.map((v: any, vIdx: number) => (
                    <div key={vIdx} className="col-span-full grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 rounded-3xl p-6 border border-white/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                          <Heart className="w-3 h-3 text-rose-500" /> Heart Rate
                        </div>
                        <p className="text-xl font-black text-[var(--text-primary)]">{v.heartRate || '--'} <span className="text-[10px] text-slate-500">BPM</span></p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                          <Activity className="w-3 h-3 text-blue-500" /> Blood Pressure
                        </div>
                        <p className="text-xl font-black text-[var(--text-primary)]">{v.bloodPressureSystolic}/{v.bloodPressureDiastolic} <span className="text-[10px] text-slate-500">mmHg</span></p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                          <Wind className="w-3 h-3 text-emerald-500" /> Resp. Rate
                        </div>
                        <p className="text-xl font-black text-[var(--text-primary)]">{v.respiratoryRate || '--'} <span className="text-[10px] text-slate-500">RR</span></p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                          <Droplets className="w-3 h-3 text-cyan-500" /> O2 Saturation
                        </div>
                        <p className="text-xl font-black text-[var(--text-primary)] text-emerald-400">{v.oxygenSaturation}%</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                          <Thermometer className="w-3 h-3 text-amber-500" /> Temperature
                        </div>
                        <p className="text-xl font-black text-[var(--text-primary)]">{v.temperature}°F</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                          <Scale className="w-3 h-3 text-indigo-500" /> Weight
                        </div>
                        <p className="text-xl font-black text-[var(--text-primary)]">{v.weight} <span className="text-[10px] text-slate-500">kg</span></p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-white/5 w-full my-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuraPortal>
  );
}
