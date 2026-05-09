"use client";

import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { 
  Zap, 
  RefreshCcw, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ShieldCheck,
  Building2,
  ChevronRight
} from "lucide-react";

const SYNC_ALL = gql`
  mutation SyncAllPartners {
    syncAllPartners
  }
`;

export default function IntegrationsSync() {
  const [syncAll, { loading: isSyncing }] = useMutation(SYNC_ALL);

  const partners = [
    { 
      name: "Elation Health", 
      type: "EHR Integration", 
      status: "Active", 
      lastSync: "2 hours ago",
      icon: Database,
      color: "blue"
    },
    { 
      name: "CareSource", 
      type: "Payor Engine", 
      status: "Configured", 
      lastSync: "Today, 10:00 AM",
      icon: ShieldCheck,
      color: "emerald"
    },
    { 
      name: "Surescripts", 
      type: "E-Prescribing", 
      status: "Pending Setup", 
      lastSync: "N/A",
      icon: Zap,
      color: "amber"
    }
  ];

  const handleSync = async () => {
    try {
      await syncAll();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em]">Integration Ecosystem</h1>
          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase mt-1">Managing bidirectional data flows with Elation and CareSource.</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="bg-[var(--primary)] px-8 py-3 rounded-2xl text-[var(--sidebar-bg)] font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[var(--primary-glow)] disabled:opacity-50 transition-all active:scale-95"
        >
          <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? "Syncing Protocols..." : "Global Sync"}
        </button>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {partners.map((p, idx) => (
            <div key={idx} className="group relative bg-[var(--card-bg)]/80 border border-[var(--card-border)] rounded-3xl p-8 hover:border-[var(--primary)]/30 transition-all shadow-xl hover:shadow-[var(--primary-glow)]/5">
               <div className={`w-14 h-14 rounded-2xl bg-${p.color}-500/10 flex items-center justify-center text-${p.color}-400 mb-6`}>
              <p.icon className="w-8 h-8" />
            </div>
              <div className="space-y-1 mb-6">
                <h2 className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors uppercase tracking-tight">{p.name}</h2>
                <p className="text-[var(--text-muted)] text-[9px] uppercase font-black tracking-widest">{p.type}</p>
              </div>
            
            <div className="space-y-4 pt-4 border-t border-[var(--card-border)]">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase">Status</span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase">Last Sync</span>
                <span className="text-[var(--text-primary)] text-[10px] font-black uppercase">{p.lastSync}</span>
              </div>
            </div>

            <button className="w-full mt-8 py-3 rounded-xl bg-[var(--input-bg)] text-[var(--text-muted)] font-black text-[9px] uppercase tracking-widest hover:bg-[var(--primary)] hover:text-[var(--sidebar-bg)] transition-all flex items-center justify-center gap-2">
               Configure Segment <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Sync Log Area */}
      <div className="bg-[var(--card-bg)]/80 rounded-[2rem] p-10 space-y-6 border border-[var(--card-border)]">
         <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-widest">
           <RefreshCcw className="w-5 h-5 text-[var(--primary)]" />
           Recent Sync Activity
         </h2>
         <div className="space-y-4">
           {[
             { msg: "Successfully pulled 12 patient demographics from Elation Health", time: "10 mins ago", status: "success" },
             { msg: "Pushed 3 Palliative SOAP notes to Elation Chart", time: "2 hours ago", status: "success" },
             { msg: "CareSource Eligibility check failed for MRN: PN-2026-9821", time: "5 hours ago", status: "error" },
            ].map((log, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-[var(--input-bg)]/50 border border-[var(--card-border)]">
                 <div className={`mt-1 ${log.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {log.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                 </div>
                 <div className="flex-1">
                    <p className="text-[var(--text-primary)] font-bold text-[11px] tracking-tight">{log.msg}</p>
                    <p className="text-[var(--text-muted)] text-[8px] mt-1 uppercase font-black tracking-[0.2em]">{log.time}</p>
                 </div>
              </div>
           ))}
         </div>
      </div>
    </div>
  );
}
