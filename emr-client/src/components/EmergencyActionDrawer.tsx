"use client";

import { useState } from "react";
import { 
  X, AlertTriangle, PhoneCall, Users, ShieldAlert, 
  Activity, Bell, CheckCircle2, Siren
} from "lucide-react";
import HalcyonPortal from "./Portal";
import { PermissionGate } from "./PermissionGate";

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
        <div className="absolute inset-0 bg-[var(--background)]/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-[450px] bg-[rgba(var(--card-bg-rgb),0.95)] backdrop-blur-2xl shadow-[-50px_0_150px_rgba(239,68,68,0.15)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${open ? "translate-x-0" : "translate-x-full"}`}>

          {/* Crisis Header */}
          <div className="py-6 px-8 border-b border-[var(--card-border)] bg-[rgba(var(--card-bg-rgb),0.5)] flex items-center justify-between shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 relative shadow-inner">
                <Siren className="w-5 h-5 animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none mb-1">
                  Emergency Action
                </h2>
                <p className="text-[8px] font-black text-red-500 dark:text-red-400 uppercase tracking-[0.25em]">
                  Rapid Response Protocol · Active Crisis
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-9 h-9 rounded-xl bg-red-500/5 dark:bg-white/5 border border-red-500/10 dark:border-white/5 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all duration-300 hover:rotate-90 active:scale-95 relative z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {/* Goal of Care Banner (CRITICAL) */}
            <div className={`p-5 rounded-3xl border flex items-center gap-5 transition-all duration-500 relative overflow-hidden group ${
              dnrStatus 
                ? "bg-amber-500/[0.04] border-amber-500/20 dark:border-amber-500/30 shadow-[0_4px_24px_rgba(245,158,11,0.05)]" 
                : "bg-red-500/[0.04] border-red-500/20 dark:border-red-500/30 shadow-[0_4px_24px_rgba(239,68,68,0.05)]"
            }`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
                dnrStatus 
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              }`}>
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">Goal of Care</p>
                <h3 className={`text-[11px] font-black uppercase tracking-[0.05em] leading-none mt-1.5 ${
                  dnrStatus ? "text-amber-500 dark:text-amber-400" : "text-red-500 dark:text-red-400"
                }`}>
                  {dnrStatus ? "DO NOT RESUSCITATE (DNR)" : "FULL CODE PROTOCOL"}
                </h3>
              </div>
            </div>

            {/* Patient Context */}
            <div className="p-6 rounded-[2rem] bg-[rgba(var(--card-bg-rgb),0.5)] border border-[var(--card-border)] space-y-5 shadow-sm">
              <div className="flex items-center gap-4">
                <h3 className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase">Clinical Context</h3>
                <div className="flex-1 h-px bg-[var(--divider-color)]" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[var(--input-bg)]/40 border border-[var(--card-border)]/50 rounded-2xl">
                  <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-60">Patient</p>
                  <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight">{patient.firstName} {patient.lastName}</p>
                </div>
                <div className="p-3 bg-[var(--input-bg)]/40 border border-[var(--card-border)]/50 rounded-2xl">
                  <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-60">MRN</p>
                  <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight font-mono">{patient.mrn}</p>
                </div>
              </div>

              {patient.contacts?.filter((c: any) => c.isPrimaryContact || c.isPoa).map((c: any) => (
                <div key={c.patientContactId} className="p-4 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[6px] font-black text-blue-500 uppercase tracking-widest block mb-0.5">Authorized POA Contact</span>
                      <p className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-tight">{c.firstName} {c.lastName}</p>
                    </div>
                  </div>
                  <a href={`tel:${c.phone}`} className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/20 text-blue-400 hover:border-transparent text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95">
                    <PhoneCall className="w-3 h-3" />
                    {c.phone}
                  </a>
                </div>
              ))}
            </div>

            {/* Action Zone */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <h3 className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase">Crisis Escalation</h3>
                <div className="flex-1 h-px bg-[var(--divider-color)]" />
              </div>

              <PermissionGate permission="clinical:chart">
                <button 
                  onClick={handleEscalate}
                  disabled={protocolStatus === "ACTIVE"}
                  className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 shadow-xl ${
                    protocolStatus === "ACTIVE"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed shadow-none"
                      : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/10 hover:shadow-red-600/20 hover:scale-[1.01] active:scale-[0.99]"
                  }`}
                >
                  {protocolStatus === "ACTIVE" ? <Activity className="w-5 h-5 animate-pulse" /> : <Siren className="w-5 h-5" />}
                  {protocolStatus === "ACTIVE" ? "PROTOCOL ACTIVE" : "ACTIVATE EMERGENCY STATE"}
                </button>
              </PermissionGate>

              <div className="grid grid-cols-2 gap-4">
                <PermissionGate permission="clinical:chart">
                  <button 
                    onClick={handleDispatch}
                    disabled={dispatched}
                    className={`py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2.5 border active:scale-[0.98] ${
                      dispatched 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-none" 
                        : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-primary)] hover:border-emerald-500/30 hover:text-emerald-500 hover:bg-emerald-500/[0.03]"
                    }`}
                  >
                    {dispatched ? <CheckCircle2 className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
                    {dispatched ? "EMS DISPATCHED" : "DISPATCH 911"}
                  </button>
                </PermissionGate>

                <PermissionGate permission="clinical:chart">
                  <button 
                    onClick={handleNotifyTeam}
                    disabled={notified}
                    className={`py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2.5 border active:scale-[0.98] ${
                      notified 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-none" 
                        : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-primary)] hover:border-emerald-500/30 hover:text-emerald-500 hover:bg-emerald-500/[0.03]"
                    }`}
                  >
                    {notified ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    {notified ? "TEAM NOTIFIED" : "NOTIFY TEAM"}
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>

          {/* Resolution Footer */}
          <div className="p-6 bg-[rgba(var(--card-bg-rgb),0.5)] border-t border-[var(--card-border)] shrink-0">
            <button 
              onClick={onClose}
              className="w-full h-12 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--divider-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-[var(--card-border)] shadow-sm active:scale-[0.98]"
            >
              Stand By / Return to Chart
            </button>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}

