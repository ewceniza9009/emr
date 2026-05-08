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
import { useRouter } from "next/navigation";
import Link from "next/link";

import UploadDocumentDrawer from "@/components/UploadDocumentDrawer";

const GET_TRIAGE_WORKLIST = gql`
  query GetTriageWorklist($search: String) {
    triageWorklist(search: $search) {
      items {
        patientId
        mrn
        firstName
        lastName
        latestPainScore
        latestWellbeingScore
        advanceDirectiveType
        isAlert
      }
      totalCount
    }
  }
`;

export default function TriageDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const { data, loading, refetch } = useQuery(GET_TRIAGE_WORKLIST, {
    variables: { search: searchQuery || undefined }
  });

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-700">
      <div className="relative">
        <AlertTriangle className="w-16 h-16 text-amber-500 animate-pulse" />
        <div className="absolute inset-0 bg-amber-500/20 blur-2xl animate-pulse rounded-full" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.4em]">Analyzing Clinical Urgency</p>
        <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">Sorting Critical Vectors</p>
      </div>
    </div>
  );

  const triageItems = data?.triageWorklist?.items || [];

  const handleLogDnr = (patientId: string) => {
    setSelectedPatientId(patientId);
    setIsUploadOpen(true);
  };

  const alertCount = triageItems.filter((i: any) => i.isAlert).length;
  const stableCount = triageItems.length - alertCount;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <UploadDocumentDrawer 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        patientId={selectedPatientId}
        onSuccess={() => refetch()}
      />
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Clinical Triage Command</h1>
          <p className="text-sm text-[var(--text-secondary)]">Prioritizing patients by symptom burden and urgency.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600">
            <div className="text-[9px] uppercase font-black tracking-widest leading-none mb-1">High Severity</div>
            <div className="text-lg font-black leading-none">{alertCount} Patients</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">
            <div className="text-[9px] uppercase font-black tracking-widest leading-none mb-1">Stable</div>
            <div className="text-lg font-black leading-none">{stableCount} Patients</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Triage List & Facility Outreach */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Triage Worklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-morphism rounded-2xl overflow-hidden border border-[var(--card-border)]">
            <div className="px-6 py-3 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Symptom Triage Worklist
              </h2>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-lg bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all border border-[var(--card-border)]">
                   <Filter className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest border-b border-[var(--card-border)]">
                    <th className="px-8 py-2">Patient</th>
                    <th className="px-8 py-2 text-center">Burden</th>
                    <th className="px-8 py-2 text-center">Directive</th>
                    <th className="px-8 py-2">Status</th>
                    <th className="px-8 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {triageItems.map((p: any) => (
                    <tr 
                      key={p.patientId} 
                      className="group hover:bg-[var(--primary-glow)] transition-colors cursor-pointer active:scale-[0.995]"
                    >
                      <td className="px-8 py-2.5" onClick={() => router.push(`/dashboard/patients/${p.patientId}`)}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${p.isAlert ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <div>
                            <p className="text-[var(--text-primary)] font-semibold">{p.firstName} {p.lastName}</p>
                            <p className="text-[var(--text-muted)] text-[10px] font-mono">{p.mrn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center" onClick={() => router.push(`/dashboard/patients/${p.patientId}`)}>
                        <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border 
                          ${p.latestPainScore > 7 ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                          Pain: {p.latestPainScore}/10
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center" onClick={() => router.push(`/dashboard/patients/${p.patientId}`)}>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border 
                          ${p.advanceDirectiveType !== 'None' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--card-border)]'}`}>
                          {p.advanceDirectiveType}
                        </span>
                      </td>
                      <td className="px-8 py-2.5" onClick={() => router.push(`/dashboard/patients/${p.patientId}`)}>
                        <span className="text-[var(--text-muted)] text-xs italic">
                           {p.isAlert ? 'Urgent Review Needed' : 'Stable'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            href={`/dashboard/patients/${p.patientId}/visit`} 
                            className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all inline-block"
                            title="Start Guided Visit"
                          >
                            <Stethoscope className="w-4 h-4" />
                          </Link>
                          <Link 
                            href={`/dashboard/patients/${p.patientId}`} 
                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all inline-block"
                            title="View Profile"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

              {/* Facility Outreach Side Panel */}
        <div className="space-y-4">
          <div className="glass-morphism rounded-2xl p-4 border border-[var(--card-border)]">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Facility Outreach
            </h2>
            <div className="space-y-4">
              {[
                { name: "Manila Medical Center", patients: 12, crisis: 2 },
                { name: "QC Care Home", patients: 8, crisis: 0 },
                { name: "St. Lukes Hospital", patients: 5, crisis: 1 },
              ].map((f) => (
                <div 
                  key={f.name} 
                  onClick={() => router.push("/dashboard/navigation")}
                  className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-emerald-500/30 transition-all cursor-pointer group active:scale-[0.98]"
                >
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
            <button 
              onClick={() => router.push("/dashboard/navigation")}
              className="w-full mt-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Building2 className="w-4 h-4" />
              Manage All Facilities
            </button>
          </div>

          <div className="glass-morphism rounded-2xl p-4 border border-[var(--card-border)] shadow-lg">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-500" />
              Missing Directives
            </h2>
            <p className="text-[var(--text-muted)] text-[10px] mb-4 leading-relaxed italic">The following patients are in high-risk groups but lack a documented Advance Directive.</p>
            <div className="space-y-3">
              {(triageItems.filter((p: any) => p.advanceDirectiveType === 'None').slice(0, 4)).map((p: any) => (
                <div key={p.patientId} className="flex items-center justify-between text-sm group p-1 hover:bg-[var(--primary)]/5 rounded-lg transition-all">
                   <span 
                    onClick={() => router.push(`/dashboard/patients/${p.patientId}`)}
                    className="text-[var(--text-primary)] font-medium cursor-pointer hover:text-[var(--primary)] transition-colors"
                   >
                     {p.firstName} {p.lastName}
                   </span>
                   <button 
                    onClick={() => handleLogDnr(p.patientId)}
                    className="text-blue-500 font-bold text-[10px] uppercase tracking-widest hover:underline hover:text-blue-400 transition-all"
                   >
                    Log DNR
                   </button>
                </div>
              ))}
              {triageItems.filter((p: any) => p.advanceDirectiveType === 'None').length === 0 && (
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest text-center py-4">All high-risk records validated.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

