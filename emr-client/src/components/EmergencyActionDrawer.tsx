"use client";

import { useState } from "react";
import { 
  X, AlertTriangle, PhoneCall, Users, ShieldAlert, 
  Activity, Bell, CheckCircle2, Siren
} from "lucide-react";
import HalcyonPortal from "./Portal";

interface Props {
  open: boolean;
  onClose: () => void;
  patient: any;
  onEscalate: () => void;
}

export default function EmergencyActionDrawer({ open, onClose, patient, onEscalate }: Props) {
  const [protocolStatus, setProtocolStatus] = useState<"IDLE" | "ACTIVE" | "RESOLVED">("IDLE");
  const [dispatched, setDispatched] = useState(false);
  const [notified, setNotified] = useState(false);

  const handleEscalate = () => {
    setProtocolStatus("ACTIVE");
    onEscalate();
  };

  const handleDispatch = () => {
    setDispatched(true);
    // Simulation: Log timestamp for EMS
    console.log(`[EMERGENCY] EMS Dispatched at ${new Date().toLocaleTimeString()}`);
  };

  const handleNotifyTeam = () => {
    setNotified(true);
    console.log(`[EMERGENCY] Care Team Notified`);
  };

  if (!open) return null;

  const dnrStatus = patient?.advanceDirectives?.some((d: any) => d.type === 'DNR' && d.isActive);

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-red-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-[450px] bg-slate-950 shadow-[-50px_0_150px_rgba(239,68,68,0.2)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-red-500/30
          ${open ? "translate-x-0" : "translate-x-full"}`}>

          {/* Crisis Header */}
          <div className="h-24 w-full flex items-center justify-between px-8 bg-red-500/10 border-b border-red-500/20 shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent animate-pulse" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-1.5 h-12 bg-red-500 rounded-full shadow-[0_0_25px_rgba(239,68,68,0.5)]" />
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none italic">
                  Emergency Action
                </h2>
                <span className="text-[10px] font-black text-red-400 tracking-[0.2em] mt-2 uppercase">
                  Rapid Response Protocol // Active Crisis
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-red-400 hover:text-white relative z-10">
              <X className="w-7 h-7" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {/* Goal of Care Banner (CRITICAL) */}
            <div className={`p-6 rounded-2xl border flex items-center gap-6 transition-all duration-500 ${
              dnrStatus 
                ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.1)]" 
                : "bg-red-500/10 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]"
            }`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                dnrStatus ? "bg-amber-500 text-amber-950" : "bg-red-500 text-white"
              }`}>
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Goal of Care</p>
                <h3 className={`text-xl font-black uppercase tracking-tighter ${
                  dnrStatus ? "text-amber-400" : "text-red-400"
                }`}>
                  {dnrStatus ? "DO NOT RESUSCITATE (DNR)" : "FULL CODE PROTOCOL"}
                </h3>
              </div>
            </div>

            {/* Patient Context */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">Clinical Context</h3>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Patient</p>
                  <p className="text-sm font-black text-white uppercase">{patient.firstName} {patient.lastName}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">MRN</p>
                  <p className="text-sm font-black text-white uppercase">{patient.mrn}</p>
                </div>
              </div>

              {patient.contacts?.filter((c: any) => c.isPrimaryContact || c.isPoa).map((c: any) => (
                <div key={c.patientContactId} className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Authorized Contact (POA)
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-black text-white uppercase">{c.firstName} {c.lastName}</p>
                    <p className="text-xs font-black text-blue-400">{c.phone}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Zone */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">Crisis Escalation</h3>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button 
                onClick={handleEscalate}
                disabled={protocolStatus === "ACTIVE"}
                className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl ${
                  protocolStatus === "ACTIVE"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20 active:scale-[0.98]"
                }`}
              >
                {protocolStatus === "ACTIVE" ? <Activity className="w-5 h-5 animate-pulse" /> : <Siren className="w-5 h-5" />}
                {protocolStatus === "ACTIVE" ? "PROTOCOL ACTIVE" : "ACTIVATE EMERGENCY STATE"}
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleDispatch}
                  disabled={dispatched}
                  className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 border ${
                    dispatched 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  {dispatched ? <CheckCircle2 className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
                  {dispatched ? "EMS DISPATCHED" : "DISPATCH 911"}
                </button>

                <button 
                  onClick={handleNotifyTeam}
                  disabled={notified}
                  className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 border ${
                    notified 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  {notified ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  {notified ? "TEAM NOTIFIED" : "NOTIFY TEAM"}
                </button>
              </div>
            </div>
          </div>

          {/* Resolution Footer */}
          <div className="p-8 bg-slate-900/50 border-t border-white/10 shrink-0">
            <button 
              onClick={onClose}
              className="w-full h-14 rounded-xl bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2 border border-white/5"
            >
              Stand By / Return to Chart
            </button>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
