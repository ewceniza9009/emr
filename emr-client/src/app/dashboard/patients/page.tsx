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

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AddPatientDrawer from "@/components/AddPatientDrawer";

const GET_PATIENTS = gql`
  query GetPatients {
    patients {
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
    }
  }
`;

export default function PatientsPage() {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const { data, loading, error, refetch } = useQuery(GET_PATIENTS);

  const patients = data?.patients || [];

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const query = searchQuery.toLowerCase();
    return patients.filter((p: any) => 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
      p.mrn.toLowerCase().includes(query) ||
      p.addresses?.some((a: any) => a.address?.city?.toLowerCase().includes(query))
    );
  }, [patients, searchQuery]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Patient Registry</h1>
          <p className="text-sm text-[var(--text-secondary)]">Master record of all patients under clinical supervision.</p>
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
          <h2 className="text-base font-bold text-[var(--text-primary)]">Active Clinical Roster</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--input-bg)] border-b border-[var(--card-border)]">
                <th className="px-8 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Patient Details</th>
                <th className="px-8 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest text-center">MRN</th>
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
                  <td colSpan={5} className="px-8 py-24 text-center bg-red-500/5">
                     <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                       <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-600 mb-2 border border-red-500/20">
                         <Filter className="w-8 h-8 opacity-50 absolute" />
                         <Search className="w-8 h-8" />
                       </div>
                       <h3 className="text-xl font-bold text-[var(--text-primary)]">Connection Error</h3>
                       <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                         We're having trouble connecting to the medical registry. This usually happens when the backend clinical service is offline or restarting.
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
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to archive ${patient.firstName} ${patient.lastName}?`)) {
                                setOpenMenuId(null);
                                alert("Patient archived successfully.");
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
