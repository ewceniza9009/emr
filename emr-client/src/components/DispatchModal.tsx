"use client";

import React from "react";
import { useQuery, gql, useMutation } from "@apollo/client";
import { 
  X, 
  MapPin, 
  Activity, 
  UserCheck, 
  Navigation, 
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Zap,
  Search
} from "lucide-react";
import HalcyonPortal from "./Portal";
import { useToast } from "./ToastProvider";

const GET_SUGGESTIONS = gql`
  query GetSuggestedPractitioners($patientId: UUID!) {
    suggestedPractitioners(patientId: $patientId) {
      practitionerId
      fullName
      position
      activeCases
      isInServiceArea
      matchingZipCodes
    }
  }
`;

const ASSIGN_PRACTITIONER = gql`
  mutation AssignPractitioner($patientId: UUID!, $practitionerId: UUID!) {
    createCareNavigationCase(input: {
      patientId: $patientId
      navigatorId: $practitionerId
      acuityLevel: MODERATE
    })
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess: () => void;
}

export default function DispatchModal({ open, onClose, patientId, patientName, onSuccess }: Props) {
  const { data, loading, error } = useQuery(GET_SUGGESTIONS, {
    variables: { patientId },
    skip: !open
  });

  const { showToast } = useToast();
  const [assigningId, setAssigningId] = React.useState<string | null>(null);

  const [assign, { loading: assigning }] = useMutation(ASSIGN_PRACTITIONER, {
    onCompleted: () => {
      showToast(`Successfully assigned Care Lead to ${patientName}`, "success");
      setAssigningId(null);
      onSuccess();
      onClose();
    },
    onError: (err) => {
      showToast(`Failed to assign Care Lead: ${err.message}`, "error");
      setAssigningId(null);
    }
  });

  const [searchQuery, setSearchQuery] = React.useState("");

  if (!open) return null;

  const suggested = data?.suggestedPractitioners || [];
  const filteredPractitioners = suggested.filter((p: any) => {
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.position.toLowerCase().includes(q)
    );
  });

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
          {/* Header */}
          <div className="p-8 border-b border-[var(--card-border)] bg-gradient-to-r from-[var(--primary)]/5 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20 shadow-lg">
                <Navigation className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Clinical Dispatch Center</h2>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
                  Assigning Care Lead for: <span className="text-[var(--primary)] font-black">{patientName}</span>
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-[var(--input-bg)] rounded-2xl transition-all group">
              <X className="w-6 h-6 text-[var(--text-muted)] group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 max-h-[60vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] animate-pulse">Running Geospatial Matching Algorithm...</p>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold uppercase">Dispatcher Offline: {error.message}</span>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="relative mb-6">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search practitioner by name or position..."
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl px-5 py-3.5 pl-12 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all outline-none"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[var(--text-muted)] uppercase hover:text-[var(--text-primary)] transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid gap-4">
                  {filteredPractitioners.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-[var(--card-border)] rounded-[2rem] text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      No matching practitioners found
                    </div>
                  ) : (
                    filteredPractitioners.map((p: any) => (
                      <button
                        key={p.practitionerId}
                        disabled={assigning}
                        onClick={() => {
                          setAssigningId(p.practitionerId);
                          assign({ variables: { patientId, practitionerId: p.practitionerId } });
                        }}
                        className="group w-full flex items-center justify-between p-5 rounded-3xl bg-[rgba(var(--card-bg-rgb),0.4)] border border-[var(--card-border)] hover:border-[var(--primary)]/40 transition-all hover:shadow-xl hover:shadow-[var(--primary-glow)]/5 text-left relative overflow-hidden"
                      >
                        <div className="flex items-center gap-5 relative z-10">
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black border transition-all ${
                              p.isInServiceArea 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                                : "bg-slate-500/10 border-slate-500/30 text-slate-500"
                            }`}>
                              {p.fullName[0]}
                            </div>
                            {p.isInServiceArea && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[var(--sidebar-bg)] flex items-center justify-center">
                                <MapPin className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{p.fullName}</h3>
                              <span className="px-2 py-0.5 rounded-md bg-[var(--input-bg)] border border-[var(--card-border)] text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">{p.position}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <Activity className="w-3 h-3 text-[var(--primary)]" />
                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase">{p.activeCases} Active Cases</span>
                              </div>
                              {p.isInServiceArea && (
                                <div className="flex items-center gap-1.5 text-emerald-500">
                                  <Zap className="w-3 h-3" />
                                  <span className="text-[9px] font-black uppercase">Service Area Match</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 relative z-10">
                          <div className={`h-8 px-4 rounded-xl flex items-center justify-center text-[9px] font-black uppercase tracking-widest transition-all ${
                            assigningId === p.practitionerId
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : p.activeCases > 15 
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                                : "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                          }`}>
                            {assigningId === p.practitionerId ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                <span>Assigning...</span>
                              </div>
                            ) : p.activeCases > 15 ? (
                              "High Load"
                            ) : (
                              "Assign Now"
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                        </div>

                        {/* Proximity Glow */}
                        {p.isInServiceArea && (
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-8 border-t border-[var(--card-border)] bg-[var(--input-bg)]/30">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Protocol-Driven Selection</h4>
                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wide leading-relaxed">
                  Suggestions are prioritized based on geographic proximity (Service Area Zip Matching) and real-time clinical caseload distribution to prevent provider burnout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
