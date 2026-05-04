"use client";

import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Stethoscope, 
  Building2, 
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  History
} from "lucide-react";
import Link from "next/link";

const GET_TRIAGE_WORKLIST = gql`
  query GetTriageWorklist {
    triageWorklist {
      patientId
      mrn
      firstName
      lastName
      latestPainScore
      latestWellbeingScore
      advanceDirectiveType
      isAlert
    }
  }
`;

export default function TriageDashboard() {
  const { data, loading } = useQuery(GET_TRIAGE_WORKLIST);
  const triageItems = data?.triageWorklist || [];

  const alertCount = triageItems.filter((i: any) => i.isAlert).length;
  const stableCount = triageItems.length - alertCount;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Clinical Triage Command</h1>
          <p className="text-[var(--text-secondary)]">Prioritizing patients by symptom burden and urgency.</p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600">
            <div className="text-[10px] uppercase font-black tracking-widest">High Severity</div>
            <div className="text-xl font-black">{alertCount} Patients</div>
          </div>
          <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">
            <div className="text-[10px] uppercase font-black tracking-widest">Stable</div>
            <div className="text-xl font-black">{stableCount} Patients</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Triage List & Facility Outreach */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Triage Worklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-morphism rounded-3xl overflow-hidden border border-[var(--card-border)]">
            <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Symptom Triage Worklist
              </h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all border border-[var(--card-border)]">
                   <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest border-b border-[var(--card-border)]">
                    <th className="px-8 py-4">Patient</th>
                    <th className="px-8 py-4 text-center">Burden</th>
                    <th className="px-8 py-4 text-center">Directive</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {triageItems.map((p: any) => (
                    <tr key={p.patientId} className="group hover:bg-[var(--primary-glow)] transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${p.isAlert ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <div>
                            <p className="text-[var(--text-primary)] font-semibold">{p.firstName} {p.lastName}</p>
                            <p className="text-[var(--text-muted)] text-[10px] font-mono">{p.mrn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border 
                          ${p.latestPainScore > 7 ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                          Pain: {p.latestPainScore}/10
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border 
                          ${p.advanceDirectiveType !== 'None' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--card-border)]'}`}>
                          {p.advanceDirectiveType}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[var(--text-muted)] text-xs italic">
                           {p.isAlert ? 'Urgent Review Needed' : 'Stable'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link href={`/dashboard/patients/${p.patientId}`} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all inline-block">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Facility Outreach Side Panel */}
        <div className="space-y-6">
          <div className="glass-morphism rounded-3xl p-6 border border-[var(--card-border)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Facility Outreach
            </h2>
            <div className="space-y-4">
              {[
                { name: "Manila Medical Center", patients: 12, crisis: 2 },
                { name: "QC Care Home", patients: 8, crisis: 0 },
                { name: "St. Lukes Hospital", patients: 5, crisis: 1 },
              ].map((f) => (
                <div key={f.name} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-emerald-500/30 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[var(--text-primary)] font-bold text-sm group-hover:text-emerald-400 transition-colors">{f.name}</h3>
                    <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                  <div className="flex gap-3">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">{f.patients} Patients</div>
                    {f.crisis > 0 && (
                      <div className="text-[10px] text-red-500 uppercase tracking-wider font-bold">{f.crisis} In Crisis</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4" />
              Manage All Facilities
            </button>
          </div>

          <div className="glass-morphism rounded-3xl p-6 border border-[var(--card-border)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-500" />
              Missing Directives
            </h2>
            <p className="text-[var(--text-muted)] text-xs mb-4">The following patients are in high-risk groups but lack a documented Advance Directive.</p>
            <div className="space-y-3">
              {["Juan Dela Cruz", "Maria Santos"].map(name => (
                <div key={name} className="flex items-center justify-between text-sm">
                   <span className="text-[var(--text-primary)] font-medium">{name}</span>
                   <button className="text-blue-500 font-bold text-xs hover:underline">Log DNR</button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
