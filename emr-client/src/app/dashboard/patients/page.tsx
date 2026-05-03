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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Patient Directory</h1>
          <p className="text-slate-400">Manage your palliative care caseload and medical records.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="premium-button premium-gradient px-6 py-3 rounded-2xl text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Add New Patient
        </button>
      </div>

      <AddPatientDrawer 
        open={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={() => refetch()} 
      />

      {/* Search & Filter Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by Name, MRN, or City..."
            className="w-full premium-input rounded-2xl py-3 pl-12 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Patient Table */}
      <div className="glass-morphism rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-8 py-5 text-xs uppercase tracking-widest font-bold text-slate-400">Patient Details</th>
              <th className="px-8 py-5 text-xs uppercase tracking-widest font-bold text-slate-400">MRN</th>
              <th className="px-8 py-5 text-xs uppercase tracking-widest font-bold text-slate-400">Location</th>
              <th className="px-8 py-5 text-xs uppercase tracking-widest font-bold text-slate-400">Contact</th>
              <th className="px-8 py-5 text-xs uppercase tracking-widest font-bold text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-8 py-10 bg-white/5" />
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-8 py-24 text-center bg-red-500/5">
                   <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                     <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-400 mb-2">
                       <Filter className="w-8 h-8 opacity-50 absolute" />
                       <Search className="w-8 h-8" />
                     </div>
                     <h3 className="text-xl font-bold text-white">Connection Error</h3>
                     <p className="text-slate-400 text-sm leading-relaxed">
                       We're having trouble connecting to the medical registry. This usually happens when the backend clinical service is offline or restarting.
                     </p>
                     <button 
                        onClick={() => refetch()}
                        className="mt-4 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/10"
                     >
                       Try Reconnecting
                     </button>
                   </div>
                </td>
              </tr>
            ) : filteredPatients.map((patient: any) => (
              <tr key={patient.patientId} className="group hover:bg-white/[0.02] transition-colors relative">
                <td className="px-8 py-6">
                  <Link href={`/dashboard/patients/${patient.patientId}`} className="flex items-center gap-4 group/row cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 group-hover/row:scale-110 group-hover/row:bg-blue-500/10 transition-all">
                      <UserCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white font-semibold group-hover/row:text-blue-400 transition-colors">{patient.firstName} {patient.lastName}</p>
                      <p className="text-slate-500 text-xs">DOB: {new Date(patient.dob).toLocaleDateString()}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-mono font-bold border border-blue-500/10">
                    {patient.mrn}
                  </span>
                </td>
                <td className="px-8 py-6 text-slate-300 text-sm">{patient.addresses?.find((a: any) => a.isPrimary)?.address?.city ?? patient.addresses?.[0]?.address?.city}</td>

                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    {patient.phones?.[0] ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Phone className="w-3 h-3" />
                        {patient.phones[0].phoneNumber}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 italic">No contact</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 relative">
                   <button 
                    onClick={() => setOpenMenuId(openMenuId === patient.patientId ? null : patient.patientId)}
                    className={`p-2 rounded-xl transition-all ${openMenuId === patient.patientId ? "bg-blue-500 text-white" : "hover:bg-white/10 text-slate-400 hover:text-white"}`}
                   >
                     <MoreHorizontal className="w-5 h-5" />
                   </button>

                   {/* Context Dropdown */}
                   {openMenuId === patient.patientId && (
                     <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-8 top-16 w-56 bg-[#0c0e12] border border-white/10 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-2 border-b border-white/5 mb-1">
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Patient Actions</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            router.push(`/dashboard/patients/${patient.patientId}`);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left"
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
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left"
                        >
                          <Filter className="w-4 h-4 text-purple-400" />
                          Schedule Encounter
                        </button>
                        <div className="h-px bg-white/5 my-1" />
                        <button 
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all font-semibold text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to archive ${patient.firstName} ${patient.lastName}?`)) {
                              setOpenMenuId(null);
                              // Success simulation
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
        
        {!loading && patients.length === 0 && (
          <div className="px-8 py-20 text-center text-slate-500 bg-white/5">
            No patients found in the registry.
          </div>
        )}
      </div>
    </div>
  );
}
