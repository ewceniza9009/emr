"use client";

import { useState, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
import { Search, X, User, CheckCircle2, Hash, MapPin, Phone } from "lucide-react";

const GET_PATIENTS = gql`
  query GetPatients {
    patients {
      items {
        patientId
        mrn
        firstName
        lastName
        dob
        addresses {
          isPrimary
          address {
            city
            state
          }
        }
        phones {
          phoneNumber
        }
      }
    }
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (patient: any) => void;
}

export default function PatientLookup({ open, onClose, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const { data, loading } = useQuery(GET_PATIENTS);

  const patients = data?.patients?.items || [];
  const filtered = useMemo(() => {
    return patients.filter((p: any) => 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase())
    );
  }, [patients, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[80vh]">
        <div className="p-8 border-b border-[var(--card-border)] bg-[var(--input-bg)]/50 flex items-center justify-between">
           <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">Enterprise Patient Lookup</h2>
              <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest mt-1">Select recipient for financial instrumentation</p>
           </div>
           <button onClick={onClose} className="p-3 bg-[var(--card-bg)] rounded-2xl hover:bg-[var(--card-border)] transition-all">
              <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-6 bg-[var(--card-bg)]">
           <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input 
                autoFocus
                type="text"
                placeholder="SEARCH BY NAME, MRN, OR DEMOGRAPHICS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-4 pl-16 pr-6 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-[var(--primary)] transition-all shadow-inner"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
           <table className="w-full">
              <thead className="sticky top-0 bg-[var(--card-bg)] z-10">
                 <tr className="text-left border-b border-[var(--card-border)]">
                    <th className="pb-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Identity</th>
                    <th className="pb-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Medical Record #</th>
                    <th className="pb-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Contact</th>
                    <th className="pb-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Location</th>
                    <th className="pb-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 text-center">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]/50">
                 {loading ? (
                   [1,2,3,4,5].map(i => <tr key={i} className="h-16 animate-pulse bg-[var(--input-bg)]/20" />)
                 ) : filtered.map((p: any) => (
                   <tr key={p.patientId} className="hover:bg-[var(--primary)]/5 transition-colors group cursor-pointer" onClick={() => onSelect(p)}>
                      <td className="py-4 px-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[10px] font-black border border-[var(--card-border)] group-hover:border-[var(--primary)]/50">
                               {p.firstName?.[0]}{p.lastName?.[0]}
                            </div>
                            <div>
                               <p className="text-xs font-bold uppercase">{p.firstName} {p.lastName}</p>
                               <p className="text-[9px] font-black text-[var(--text-muted)] uppercase">DOB: {new Date(p.dob).toLocaleDateString()}</p>
                            </div>
                         </div>
                      </td>
                      <td className="py-4 px-4">
                         <div className="flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{p.mrn}</span>
                         </div>
                      </td>
                      <td className="py-4 px-4">
                         <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{p.phones?.[0]?.phoneNumber || 'N/A'}</span>
                         </div>
                      </td>
                      <td className="py-4 px-4">
                         <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                               {p.addresses?.find((a:any) => a.isPrimary)?.address?.city || 'N/A'}
                            </span>
                         </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                         <button className="px-4 py-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all border border-[var(--primary)]/20">
                            Select Entity
                         </button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
           
           {filtered.length === 0 && !loading && (
             <div className="py-20 text-center">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">No matching entities found in the registry</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
