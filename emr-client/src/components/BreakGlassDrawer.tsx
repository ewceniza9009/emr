"use client";

import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { 
  X, ShieldAlert, Lock as LockIcon, AlertTriangle, 
  Terminal, ShieldCheck, Loader2, ArrowRight
} from "lucide-react";
import HalcyonPortal from "./Portal";

const ACTIVATE_BREAK_GLASS = gql`
  mutation ActivateBreakGlass($justification: String!) {
    activateBreakGlass(justification: $justification)
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BreakGlassDrawer({ open, onClose, onSuccess }: Props) {
  const [justification, setJustification] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const [activate, { loading }] = useMutation(ACTIVATE_BREAK_GLASS, {
    variables: { justification },
    onCompleted: (data) => {
      if (data.activateBreakGlass) {
        onSuccess();
        onClose();
      }
    }
  });

  if (!open) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-[500px] bg-slate-950 shadow-[-50px_0_150px_rgba(0,0,0,0.5)] 
          flex flex-col transition-transform duration-500 ease-out border-l border-white/10
          ${open ? "translate-x-0" : "translate-x-full"}`}>

          {/* Tactical Header */}
          <div className="h-24 w-full flex items-center justify-between px-8 bg-white/[0.02] border-b border-white/10 shrink-0">
            <div className="flex items-center gap-6">
              <div className="w-1.5 h-12 bg-rose-500 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.4)]" />
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-white tracking-tight uppercase leading-none">
                  Break-Glass Protocol
                </h2>
                <span className="text-[10px] font-black text-rose-500 tracking-[0.2em] mt-2 uppercase">
                  Emergency Authorization Overlook
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white">
              <X className="w-7 h-7" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10">
            {/* Warning Banner */}
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest">Legal & Forensic Warning</h3>
              </div>
              <p className="text-[11px] text-rose-200/70 leading-relaxed font-medium">
                You are about to bypass standard clinical assignment filters. This action will be 
                <span className="text-rose-400 font-bold"> permanently logged</span> in the forensic audit vault. 
                Misuse of the Break-Glass protocol is a violation of HIPAA/GDPR standards and internal clinical policy.
              </p>
            </div>

            {/* Input Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">Required Justification</h3>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="relative group">
                <div className="absolute top-4 left-4 text-slate-500 group-focus-within:text-rose-500 transition-colors">
                  <Terminal className="w-4 h-4" />
                </div>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="State the clinical emergency or operational necessity for this access..."
                  className="w-full h-40 bg-white/[0.03] border border-white/10 rounded-2xl p-4 pl-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all resize-none"
                />
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 font-medium leading-normal italic">
                  By clicking confirm, you attest that this access is medically necessary and you take full legal responsibility for viewing this PHI.
                </p>
              </div>
            </div>

            {/* Authorization Specs */}
            <div className="space-y-4">
               <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">Session Parameters</h3>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Window Duration</p>
                  <p className="text-xs font-black text-white">4 HOURS (UTC)</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Access Scope</p>
                  <p className="text-xs font-black text-white uppercase italic">Full Chart Access</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-8 bg-slate-900/50 border-t border-white/10 shrink-0 space-y-4">
            {!isConfirming ? (
              <button 
                onClick={() => setIsConfirming(true)}
                disabled={justification.length < 10}
                className="w-full h-16 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-rose-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-600/20 active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
              >
                <LockIcon className="w-5 h-5" />
                Initialize Bypass
              </button>
            ) : (
              <div className="flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
                <button 
                  onClick={() => setIsConfirming(false)}
                  className="flex-1 h-16 rounded-2xl bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => activate()}
                  disabled={loading}
                  className="flex-[2] h-16 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Confirm Authorization
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
