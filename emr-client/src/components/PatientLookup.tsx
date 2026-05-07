"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { Search, X, User, CheckCircle2, Hash, MapPin, Phone, Activity, ShieldCheck, ChevronRight, Zap } from "lucide-react";
import HalcyonPortal from "./Portal";

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
      <HalcyonPortal>
         <div className="fixed inset-0 z-[9999999] flex items-start justify-center pt-[10vh] p-6 pointer-events-none">
            {/* Subtle Backdrop - No darkening, just focus */}
            <div
               className="absolute inset-0 backdrop-blur-md bg-black/5 animate-in fade-in duration-300 pointer-events-auto"
               onClick={onClose}
            />

            {/* Top-Anchored Command Palette - HARDENED OPAQUE */}
            <div className="relative w-full max-w-2xl bg-[var(--sidebar-bg)] rounded-[2rem] border border-[var(--card-border)] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-10 duration-500 flex flex-col max-h-[70vh] pointer-events-auto">

               {/* Command Search Header - NO LINES */}
               <div className="px-8 py-6 bg-[var(--input-bg)]/20 flex items-center gap-4">
                  <Zap className="w-5 h-5 text-[var(--primary)] animate-pulse" />
                  <div className="flex-1">
                     <input
                        autoFocus
                        type="text"
                        placeholder="SEARCH"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] uppercase tracking-widest focus:outline-none"
                     />
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-[var(--card-border)] rounded-xl transition-all group">
                     <X className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
                  </button>
               </div>

               {/* Tactical Search Registry - NO DIVIDER LINES */}
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {loading ? (
                     <div className="p-12 text-center space-y-4">
                        <Activity className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto opacity-50" />
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Scanning Registry...</p>
                     </div>
                  ) : (
                     <div className="p-3 space-y-2">
                        {filtered.map((p: any) => (
                           <button
                              key={p.patientId}
                              onClick={() => onSelect(p)}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-[var(--primary)]/5 transition-all group border border-transparent hover:border-[var(--primary)]/20 text-left active:scale-[0.99]"
                           >
                              <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[11px] font-bold border border-[var(--card-border)] group-hover:border-[var(--primary)]/50 transition-all text-[var(--text-primary)]">
                                 {p.firstName?.[0]}{p.lastName?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight group-hover:text-[var(--primary)] transition-colors truncate">
                                       {p.firstName} {p.lastName}
                                    </p>
                                    <span className="text-[8px] px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-bold uppercase tracking-widest border border-[var(--primary)]/20">
                                       {p.mrn}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-5 mt-1">
                                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                                       <MapPin className="w-2.5 h-2.5 opacity-50" />
                                       {p.addresses?.find((a: any) => a.isPrimary)?.address?.city || 'UNKNOWN'}
                                    </p>
                                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                                       <Phone className="w-2.5 h-2.5 opacity-50" />
                                       {p.phones?.[0]?.phoneNumber || 'N/A'}
                                    </p>
                                 </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                           </button>
                        ))}

                        {filtered.length === 0 && (
                           <div className="py-24 text-center">
                              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Zero registry matches found</p>
                           </div>
                        )}
                     </div>
                  )}
               </div>

               {/* Tactical Footer Intel */}
               <div className="px-8 py-4 border-t border-[var(--card-border)] bg-[var(--input-bg)]/10 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded bg-[var(--card-border)] text-[8px] font-bold text-[var(--text-muted)] border-b-2 border-black/20">↑↓</kbd>
                        <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Navigate</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded bg-[var(--card-border)] text-[8px] font-bold text-[var(--text-muted)] border-b-2 border-black/20">Enter</kbd>
                        <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Select</span>
                     </div>
                  </div>
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-40">Halcyon // Tactical Registry v1.1</p>
               </div>
            </div>
         </div>
      </HalcyonPortal>
   );
}
