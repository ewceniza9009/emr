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
  History,
  ClipboardList
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useDebounce } from "@/hooks/useDebounce";

import UploadDocumentDrawer from "@/components/UploadDocumentDrawer";
import TriageNoteDrawer from "@/components/TriageNoteDrawer";
import TriageFilterPopover, { TriageFilters } from "@/components/TriageFilterPopover";
import { Skeleton } from "@/components/ui/skeleton";

const GET_TRIAGE_DASHBOARD_DATA = gql`
  query GetTriageDashboardData($search: String, $isAlert: Boolean, $directiveTypes: [String!]) {
    triageWorklist(search: $search, isAlert: $isAlert, directiveTypes: $directiveTypes) {
      items {
        patientId
        mrn
        firstName
        lastName
        latestPainScore
        latestWellbeingScore
        advanceDirectiveType
        isAlert
        triageNote
      }
      totalCount
    }
    facilityOutreach {
      facilityId
      name
      patientCount
      crisisCount
    }
  }
`;

export default function TriageDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTriageNoteOpen, setIsTriageNoteOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");

  const [filters, setFilters] = useState<TriageFilters>({ isAlert: null, directiveTypes: [] });

  const { data, loading, refetch, networkStatus } = useQuery(GET_TRIAGE_DASHBOARD_DATA, {
    variables: {
      search: debouncedSearch || undefined,
      isAlert: filters.isAlert,
      directiveTypes: filters.directiveTypes
    },
    notifyOnNetworkStatusChange: true
  });

  const isInitialLoading = networkStatus === 1; // Initial load only

  if (isInitialLoading) return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {/* Header & Stats Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 opacity-50" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-16 w-36 rounded-2xl shadow-lg shadow-white/5" />
          <Skeleton className="h-16 w-36 rounded-2xl shadow-lg shadow-white/5" />
        </div>
      </div>
  
      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-morphism rounded-2xl overflow-hidden border border-[var(--card-border)]">
            <div className="px-6 py-4 border-b border-[var(--card-border)]">
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="p-6 space-y-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-3 w-24 opacity-50" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-28 rounded-full" />
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-morphism rounded-2xl p-6 border border-[var(--card-border)]">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const triageItems = data?.triageWorklist?.items || [];
  const facilityOutreach = data?.facilityOutreach || [];

  const handleLogDnr = (patientId: string) => {
    setSelectedPatientId(patientId);
    setIsUploadOpen(true);
  };

  const handleTriageNote = (patientId: string, name: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(name);
    setIsTriageNoteOpen(true);
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
      <TriageNoteDrawer
        isOpen={isTriageNoteOpen}
        onClose={() => setIsTriageNoteOpen(false)}
        patientId={selectedPatientId}
        patientName={selectedPatientName}
        onSuccess={() => refetch()}
      />
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Clinical Priority Overview</h1>
          <p className="text-sm text-[var(--text-secondary)]">Managing patient urgency based on symptom burden and clinical alerts.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600">
            <div className="text-[9px] uppercase font-black tracking-widest leading-none mb-1">Critical Symptom Burden</div>
            <div className="text-lg font-black leading-none">{alertCount} Patients</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">
            <div className="text-[9px] uppercase font-black tracking-widest leading-none mb-1">Clinical Stability</div>
            <div className="text-lg font-black leading-none">{stableCount} Patients</div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] transition-all ${loading ? "animate-pulse text-amber-500" : ""}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search priority queue by name or MRN..."
            className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-bold placeholder:text-[var(--text-muted)] focus:outline-none focus:border-amber-500/50 transition-all uppercase tracking-widest"
          />
          {loading && !isInitialLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Triage List & Facility Outreach */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Triage Worklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-morphism rounded-2xl border border-[var(--card-border)] relative">
            <div className="px-6 py-3 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Priority Patient Queue
              </h2>
              <div className="flex gap-2">
                <TriageFilterPopover 
                  onFilterChange={setFilters}
                  currentFilters={filters}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest border-b border-[var(--card-border)]">
                    <th className="px-8 py-4">Patient Identity</th>
                    <th className="px-8 py-4 text-center">Symptom Burden</th>
                    <th className="px-8 py-4">Clinical Narrative</th>
                    <th className="px-8 py-4 text-center">Advance Directive</th>
                    <th className="px-8 py-4 text-right">Care Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {triageItems.map((p: any) => (
                    <tr
                      key={p.patientId}
                      className="group hover:bg-[var(--primary-glow)] transition-colors cursor-pointer active:scale-[0.995]"
                    >
                      <td className="px-8 py-5" onClick={() => router.push(`/dashboard/patients/${p.patientId}`)}>
                        <div className="flex items-center gap-4">
                          <div className={`w-2.5 h-2.5 rounded-full ${p.isAlert ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'}`} />
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)] tracking-tight group-hover:text-[var(--primary)] transition-colors">{p.firstName} {p.lastName}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono opacity-60">MRN: {p.mrn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center" onClick={() => router.push(`/dashboard/patients/${p.patientId}`)}>
                        <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-xl text-[11px] font-black tracking-tight border shadow-sm
                          ${p.latestPainScore > 7 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                          Pain Score: {p.latestPainScore}/10
                        </div>
                      </td>
                      <td className="px-8 py-5" onClick={() => router.push(`/dashboard/patients/${p.patientId}`)}>
                        <div className="max-w-[200px] space-y-1">
                          <p className="text-[10px] text-[var(--text-primary)] font-medium line-clamp-2 italic opacity-80">
                            {p.triageNote || (p.isAlert ? "Patient reporting breakthrough pain. Requires symptom review." : "Clinical status remains stable based on last encounter.")}
                          </p>
                          <div className="flex items-center gap-2 opacity-40">
                             <History className="w-2.5 h-2.5" />
                             <span className="text-[9px] font-bold uppercase tracking-widest">{p.triageNote ? "Triage Note Active" : "Last Note: 2h ago"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center" onClick={() => router.push(`/dashboard/patients/${p.patientId}`)}>
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm
                          ${p.advanceDirectiveType !== 'None' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--card-border)] opacity-40'}`}>
                          {p.advanceDirectiveType}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleTriageNote(p.patientId, `${p.firstName} ${p.lastName}`); }}
                            className="p-2.5 rounded-xl bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-black transition-all border border-amber-500/10 shadow-sm"
                            title="Add Triage Note"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleLogDnr(p.patientId); }}
                            className="p-2.5 rounded-xl bg-blue-500/5 text-blue-400 hover:bg-blue-500 hover:text-white transition-all border border-blue-500/10 shadow-sm"
                            title="Update Advance Directive"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/dashboard/patients/${p.patientId}/visit`}
                            className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 shadow-sm"
                            title="Start Clinical Encounter"
                          >
                            <Stethoscope className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/patients/${p.patientId}`}
                            className="p-2.5 rounded-xl bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all border border-white/5 shadow-sm"
                            title="View Patient Record"
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
              {facilityOutreach.map((f: any) => (
                <div
                  key={f.facilityId}
                  onClick={() => router.push("/dashboard/navigation")}
                  className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-emerald-500/30 transition-all cursor-pointer group active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[var(--text-primary)] font-bold text-sm group-hover:text-emerald-400 transition-colors">{f.name}</h3>
                    <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                  <div className="flex gap-3">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">{f.patientCount} Patients</div>
                    {f.crisisCount > 0 && (
                      <div className="text-[10px] text-red-500 uppercase tracking-wider font-bold">{f.crisisCount} In Crisis</div>
                    )}
                  </div>
                </div>
              ))}
              {facilityOutreach.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-[var(--text-muted)] text-xs italic">No active facility outreach programs found.</p>
                </div>
              )}
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

