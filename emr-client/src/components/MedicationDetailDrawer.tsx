import { X, Pill, Clock, Activity, ShieldCheck, Calendar, Info, Beaker } from "lucide-react";
import AuraPortal from "./Portal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prescription: any;
}

export default function MedicationDetailDrawer({ isOpen, onClose, prescription }: Props) {
  if (!isOpen || !prescription) return null;

  return (
    <AuraPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-[500px] bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

          <div className="relative flex-1 flex flex-col overflow-hidden">
             {/* Header */}
             <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-1.5 h-10 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                  <div className="flex flex-col">
                    <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">Prescription Details</h2>
                    <span className="text-[10px] font-black text-emerald-500 tracking-[0.2em] mt-1 uppercase">Order Verification // {prescription.medication.name}</span>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-[var(--text-primary)]">
                  <X className="w-6 h-6" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                {/* Core Medication Identity */}
                <section className="space-y-6">
                   <div className="flex items-center gap-4">
                      <h3 className="text-[10px] font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Pharmacological Profile</h3>
                      <div className="flex-1 h-px bg-[var(--card-border)]" />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Substance</label>
                         <div className="flex items-center gap-3">
                            <Pill className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-black text-[var(--text-primary)] uppercase">{prescription.medication.name}</span>
                         </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Strength</label>
                         <div className="flex items-center gap-3">
                            <Beaker className="w-5 h-5 text-blue-500" />
                            <span className="text-sm font-black text-[var(--text-primary)]">{prescription.medication.strength}</span>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-500/5 border border-[var(--card-border)] text-center">
                         <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Dose</div>
                         <div className="text-xs font-black text-[var(--text-primary)]">{prescription.dose}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-500/5 border border-[var(--card-border)] text-center">
                         <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Route</div>
                         <div className="text-xs font-black text-[var(--text-primary)] uppercase">{prescription.route}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-500/5 border border-[var(--card-border)] text-center">
                         <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Freq</div>
                         <div className="text-xs font-black text-[var(--text-primary)] uppercase">{prescription.frequency}</div>
                      </div>
                   </div>
                </section>

                {/* Status & History */}
                <section className="space-y-6">
                   <div className="flex items-center gap-4">
                      <h3 className="text-[10px] font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Clinical Status</h3>
                      <div className="flex-1 h-px bg-[var(--card-border)]" />
                   </div>

                   <div className={`p-6 rounded-2xl border flex items-center justify-between ${prescription.isActive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${prescription.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                            {prescription.isActive ? <Activity className="w-5 h-5" /> : <X className="w-5 h-5" />}
                         </div>
                         <div>
                            <div className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight">{prescription.isActive ? 'Actively Prescribed' : 'Discontinued'}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pharmacological Status</div>
                         </div>
                      </div>
                      <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 px-3 py-1 rounded-md">
                         Verified
                      </div>
                   </div>
                </section>

                {/* Administration Logic */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <Info className="w-4 h-4" />
                      Administration Protocol
                   </div>
                   <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                      <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
                        Standard administration protocol applies. Monitor for breakthrough symptoms and report adverse reactions immediately. Ensure MAR (Medication Administration Record) is updated post-administration.
                      </p>
                   </div>
                </section>
             </div>

             {/* Footer Actions */}
             <div className="p-8 bg-[var(--sidebar-bg)] border-t border-[var(--card-border)] shrink-0 flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 h-14 bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                >
                  Close
                </button>
                <button 
                  className="flex-1 h-14 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-3"
                >
                  Discontinue
                </button>
             </div>
          </div>
        </div>
      </div>
    </AuraPortal>
  );
}
