"use client";

import { useState } from "react";
import { X, Search, Users, User, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import HalcyonPortal from "./Portal";
import { formatEnum, formatClinicalDate } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  facility: any | null;
}

export default function FacilityResidentsDrawer({ open, onClose, facility }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!open || !facility) return null;

  const residents = facility.residents || [];

  // Filter residents by name or MRN
  const filteredResidents = residents.filter((r: any) => {
    const fullName = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
    const mrn = (r.mrn || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || mrn.includes(query);
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getAge = (dobString?: string) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusStyle = (status?: string) => {
    const normalized = (status || "").toUpperCase();
    if (normalized === "SCHEDULED") {
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
    if (normalized === "INPROGRESS") {
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
    if (normalized === "COMPLETED") {
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
    if (normalized === "NOSHOW") {
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    }
    return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  };

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300"
          onClick={onClose}
        />

        {/* Drawer Container */}
        <div
          className="relative h-full w-full max-w-[550px] bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        >
          {/* Header */}
          <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">
                  Facility Residents
                </h2>
                <span className="text-[10px] font-black text-[var(--primary)] tracking-[0.2em] mt-1.5 uppercase">
                  {facility.name}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--primary)]/10 rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Subheader / Metadata */}
          <div className="px-8 py-4 bg-white/[0.01] border-b border-[var(--card-border)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                Active Registry
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] text-[var(--text-primary)] text-[9px] font-black uppercase tracking-widest border border-[var(--card-border)] shadow-sm">
              {residents.length} Residents Total
            </span>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-[var(--card-border)] shrink-0">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
              <input
                type="text"
                placeholder="Search residents by name or MRN..."
                className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all placeholder:text-[var(--text-muted)]/50 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Residents List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {filteredResidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[var(--primary)]/5 border border-[var(--card-border)] flex items-center justify-center">
                  <User className="w-8 h-8 text-[var(--text-muted)] opacity-40" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                    No Residents Detected
                  </h3>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">
                    {searchQuery ? "Try refining your search query" : "This facility currently has no residents registered"}
                  </p>
                </div>
              </div>
            ) : (
              filteredResidents.map((resident: any) => {
                const age = getAge(resident.dob);
                return (
                  <div
                    key={resident.patientId}
                    className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--primary)]/20 transition-all duration-300 flex items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-xs font-black border border-[var(--primary)]/20 shadow-inner shrink-0">
                        {getInitials(resident.firstName, resident.lastName)}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight truncate max-w-[200px]">
                            {resident.firstName} {resident.lastName}
                          </p>
                          {resident.mrn && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--card-border)]">
                              {resident.mrn}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">
                          {resident.dob && <span>DOB: {formatClinicalDate(resident.dob)}</span>}
                          {age !== null && (
                            <>
                              <span className="text-[var(--card-border)]">·</span>
                              <span>{age} Yrs</span>
                            </>
                          )}
                          {resident.biologicalSex && (
                            <>
                              <span className="text-[var(--card-border)]">·</span>
                              <span>{resident.biologicalSex}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {resident.visitStatus && (
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border text-center self-end ${getStatusStyle(resident.visitStatus)}`}>
                          {formatEnum(resident.visitStatus)}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/schedule?patientId=${resident.patientId}`}
                          className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 hover:border-emerald-500 shadow-sm"
                          title="Schedule Encounter"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/dashboard/patients/${resident.patientId}`}
                          className="px-3 py-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all border border-[var(--primary)]/20 hover:border-[var(--primary)] shadow-sm flex items-center gap-1.5"
                          title="View Patient Chart"
                        >
                          <span>Chart</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
