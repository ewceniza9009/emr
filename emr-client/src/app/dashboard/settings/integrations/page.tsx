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

export default function IntegrationsPage() {
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Integration Ecosystem</h1>
          <p className="text-slate-400">Managing bidirectional data flows with Elation and CareSource.</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="premium-button premium-gradient px-8 py-3 rounded-2xl text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          <RefreshCcw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? "Syncing Elation..." : "Global Sync"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((p) => (
          <div key={p.name} className="glass-morphism rounded-3xl p-8 border border-white/5 relative group hover:border-blue-500/30 transition-all">
            <div className={`w-14 h-14 rounded-2xl bg-${p.color}-500/10 flex items-center justify-center text-${p.color}-400 mb-6`}>
              <p.icon className="w-8 h-8" />
            </div>
            <div className="space-y-1 mb-6">
              <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{p.name}</h2>
              <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">{p.type}</p>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Last Sync</span>
                <span className="text-white text-sm font-medium">{p.lastSync}</span>
              </div>
            </div>

            <button className="w-full mt-8 py-3 rounded-xl bg-white/5 text-slate-300 font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2">
               Configure Settings <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Sync Log Area */}
      <div className="glass-morphism rounded-[2rem] p-10 space-y-6">
         <h2 className="text-2xl font-bold text-white flex items-center gap-3">
           <RefreshCcw className="w-6 h-6 text-blue-400" />
           Recent Sync Activity
         </h2>
         <div className="space-y-4">
           {[
             { msg: "Successfully pulled 12 patient demographics from Elation Health", time: "10 mins ago", status: "success" },
             { msg: "Pushed 3 Palliative SOAP notes to Elation Chart", time: "2 hours ago", status: "success" },
             { msg: "CareSource Eligibility check failed for MRN: PN-2026-9821", time: "5 hours ago", status: "error" },
           ].map((log, i) => (
             <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className={`mt-1 ${log.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                   {log.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                   <p className="text-white font-medium text-sm">{log.msg}</p>
                   <p className="text-slate-500 text-[10px] mt-1 uppercase font-bold tracking-widest">{log.time}</p>
                </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
