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

const GET_PATIENTS = gql`
  query GetPatients {
    patients {
      patientId
      mrn
      firstName
      lastName
      dob
      city
      phones {
        phoneNumber
        type
      }
    }
  }
`;

export default function PatientsPage() {
  const { data, loading, error } = useQuery(GET_PATIENTS);

  const patients = data?.patients || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Patient Directory</h1>
          <p className="text-slate-400">Manage your palliative care caseload and medical records.</p>
        </div>
        <button className="premium-button premium-gradient px-6 py-3 rounded-2xl text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20">
          <Plus className="w-5 h-5" />
          Add New Patient
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by Name, MRN, or City..."
            className="w-full premium-input rounded-2xl py-3 pl-12 pr-4"
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
                <td colSpan={5} className="px-8 py-20 text-center text-red-400 bg-red-500/5">
                   Failed to load patients. Please ensure the backend is running.
                </td>
              </tr>
            ) : patients.map((patient: any) => (
              <tr key={patient.patientId} className="group hover:bg-white/[0.02] transition-colors">
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
                <td className="px-8 py-6 text-slate-300 text-sm">{patient.city}</td>
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
                <td className="px-8 py-6">
                   <button className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                     <MoreHorizontal className="w-5 h-5" />
                   </button>
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
