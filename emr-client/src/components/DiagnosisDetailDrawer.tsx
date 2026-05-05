import { X, ClipboardList, Calendar, Activity, ShieldCheck, AlertCircle, Info, Tag } from "lucide-react";
import AuraPortal from "./Portal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  diagnosis: any;
}

export default function DiagnosisDetailDrawer({ isOpen, onClose, diagnosis }: Props) {
  if (!isOpen || !diagnosis) return null;

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
                  <div className="w-1.5 h-10 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
                  <div className="flex flex-col">
                    <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">Condition Details</h2>
                    <span className="text-[10px] font-black text-blue-500 tracking-[0.2em] mt-1 uppercase">Clinical Registry // {diagnosis.icd10Code}</span>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-[var(--text-primary)]">
                  <X className="w-6 h-6" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                {/* Core Diagnosis Data */}
                <section className="space-y-6">
                   <div className="flex items-center gap-4">
                      <h3 className="text-[10px] font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Diagnostic Profile</h3>
                      <div className="flex-1 h-px bg-[var(--card-border)]" />
                   </div>

                   <div className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Tag className="w-5 h-5 text-blue-500" />
                            <span className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">{diagnosis.icd10Code}</span>
                         </div>
                         {diagnosis.isPrimary && (
                           <span className="px-3 py-1 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                             Primary Condition
                           </span>
                         )}
                      </div>
                      <p className="text-sm font-bold text-[var(--text-primary)] leading-relaxed">
                         {diagnosis.description}
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-slate-500/5 border border-[var(--card-border)]">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Diagnosed On</label>
                         <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-slate-500" />
                            <span className="text-sm font-black text-[var(--text-primary)]">
                               {new Date(diagnosis.diagnosedAt).toLocaleDateString()}
                            </span>
                         </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-slate-500/5 border border-[var(--card-border)]">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Record Status</label>
                         <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-black text-emerald-400 uppercase">Active</span>
                         </div>
                      </div>
                   </div>
                </section>

                {/* Audit Information */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <AlertCircle className="w-4 h-4" />
                      Clinical Verification
                   </div>
                   <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                      <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
                        This diagnosis has been verified against clinical documentation and is currently listed as an active condition in the patient's longitudinal record. Any changes to this status should be audited by the attending clinician.
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
                  className="flex-1 h-14 bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-3"
                >
                  Mark Inactive
                </button>
             </div>
          </div>
        </div>
      </div>
    </AuraPortal>
  );
}
