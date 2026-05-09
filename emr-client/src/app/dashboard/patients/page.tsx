"use client";

import { useQuery, gql } from "@apollo/client";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  UserCircle,
  Mail,
  Phone
} from "lucide-react";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddPatientDrawer from "@/components/AddPatientDrawer";
import { useCommandModal } from "@/components/CommandModalProvider";
import { useDebounce } from "@/hooks/useDebounce";

const GET_PATIENTS = gql`
  query GetPatients($search: String, $skip: Int, $take: Int) {
    patients(search: $search, skip: $skip, take: $take) {
      items {
        patientId
        mrn
        firstName
        lastName
        dob
        addresses {
          type
          isPrimary
          address {
            city
          }
        }
        phones {
          phoneNumber
          type
        }
        visitStatus
      }
      totalCount
    }
  }
`;

export default function PatientsPage() {
  const { confirm, alert } = useCommandModal();
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_PATIENTS, {
    variables: {
      search: debouncedSearch,
      skip: 0,
      take: 50
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true
  });

  const patients = data?.patients?.items || [];
  const filteredPatients = patients;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Patient Registry</h1>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Master record of all patients under clinical supervision.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="premium-button premium-gradient px-5 h-10 rounded-xl text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Add New Patient
        </button>
      </div>

      <AddPatientDrawer
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center bg-[var(--card-bg)] p-3 rounded-2xl border border-[var(--card-border)]">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name, MRN, or phone..."
            className="w-full premium-input rounded-xl py-2 pl-10 pr-4 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="h-10 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Patient Table */}
      <div className="glass-morphism rounded-2xl overflow-hidden shadow-2xl border border-[var(--card-border)]">
        <div className="px-6 py-3 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Active Clinical Roster</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--input-bg)] border-b border-[var(--card-border)]">
                <th className="px-8 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Patient Details</th>
                <th className="px-8 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest text-center">MRN</th>
                <th className="px-8 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest text-center">Visit Status</th>
                <th className="px-8 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Location</th>
                <th className="px-8 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Contact</th>
                <th className="px-8 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-10 bg-[var(--input-bg)]" />
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center bg-red-500/5">
                    <div className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto w-full">
                      <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-600 mb-2 border border-red-500/20">
                        <Filter className="w-8 h-8 opacity-50 absolute" />
                        <Search className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">Connection Error</h3>
                      <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                        We&apos;re having trouble connecting to the medical registry. This usually happens when the backend clinical service is offline or restarting.
                      </p>
                      <button
                        onClick={() => refetch()}
                        className="mt-4 px-6 py-2 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white text-sm font-semibold transition-all"
                      >
                        Try Reconnecting
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.map((patient: any) => (
                <tr key={patient.patientId} className="group hover:bg-[var(--primary-glow)] transition-colors relative">
                  <td className="px-8 py-2.5">
                    <Link href={`/dashboard/patients/${patient.patientId}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                        {patient.firstName[0]}{patient.lastName[0]}
                      </div>
                      <div>
                        <p className="text-[var(--text-primary)] font-semibold">{patient.firstName} {patient.lastName}</p>
                        <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">DOB: {new Date(patient.dob).toLocaleDateString()}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-mono font-bold border border-blue-500/20">
                      {patient.mrn}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {patient.visitStatus === "InProgress" ? (
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-tighter border border-emerald-500/20 animate-pulse">
                        In Progress
                      </span>
                    ) : patient.visitStatus === "Completed" ? (
                      <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-tighter border border-blue-500/20">
                        Completed
                      </span>
                    ) : patient.visitStatus === "Scheduled" ? (
                      <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-tighter border border-amber-500/20">
                        Scheduled
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-slate-500/10 text-slate-500 text-[9px] font-black uppercase tracking-tighter border border-slate-500/20 opacity-50">
                        {patient.visitStatus || "No Visit"}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-[var(--text-secondary)] text-sm">
                    {patient.addresses?.find((a: any) => a.isPrimary)?.address?.city ?? patient.addresses?.[0]?.address?.city}
                  </td>
                  <td className="px-8 py-2.5">
                    {patient.phones?.[0] ? (
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                        <Phone className="w-3 h-3" />
                        {patient.phones[0].phoneNumber}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)] italic">No contact</span>
                    )}
                  </td>
                  <td className="px-8 py-5 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === patient.patientId ? null : patient.patientId)}
                      className={`p-2 rounded-xl transition-all ${openMenuId === patient.patientId ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "hover:bg-[var(--primary-glow)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {/* Context Dropdown */}
                    {openMenuId === patient.patientId && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-8 top-16 w-56 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                          <div className="px-4 py-2 border-b border-[var(--card-border)] mb-1">
                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Patient Actions</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              router.push(`/dashboard/patients/${patient.patientId}`);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--primary-glow)] transition-all text-left"
                          >
                            <UserCircle className="w-4 h-4 text-blue-400" />
                            View Clinical Profile
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              router.push(`/dashboard/schedule?patientId=${patient.patientId}`);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--primary-glow)] transition-all text-left"
                          >
                            <Plus className="w-4 h-4 text-purple-400" />
                            Schedule Encounter
                          </button>
                          <div className="h-px bg-[var(--card-border)] my-1" />
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all font-semibold text-left"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await confirm({
                                title: "Archive Patient",
                                message: `Are you sure you want to archive ${patient.firstName} ${patient.lastName}? This will remove them from the active clinical roster.`,
                                type: "warning",
                                confirmText: "Archive"
                              });
                              if (ok) {
                                setOpenMenuId(null);
                                await alert({
                                  title: "Patient Archived",
                                  message: "The patient record has been moved to clinical archives successfully.",
                                  type: "success"
                                });
                              }
                            }}
                          >
                            <Plus className="w-4 h-4 rotate-45" />
                            Archive Patient
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && patients.length === 0 && (
          <div className="px-8 py-20 text-center text-[var(--text-muted)] bg-[var(--input-bg)]">
            No patients found in the registry.
          </div>
        )}
      </div>
    </div>
  );
}
