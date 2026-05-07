"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, User, Shield, Zap, Activity, Moon, Sun } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PatientLookup from "./PatientLookup";

export function TopBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsLookupOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="h-14 flex items-center justify-between px-8 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)] sticky top-0 z-[90] transition-all duration-500">
      {/* Tactical Search Vector */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
          </div>
          <input
            type="text"
            readOnly
            onClick={() => setIsLookupOpen(true)}
            placeholder="SEARCH"
            className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-2 pl-14 pr-4 text-[9px] font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] tracking-[0.1em] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] transition-all uppercase cursor-pointer"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-[8px] font-bold text-[var(--text-muted)] tracking-widest border border-[var(--card-border)] rounded px-1.5 py-0.5 uppercase">Alt + K</span>
          </div>
        </div>
      </div>

      <PatientLookup
        open={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onSelect={(patient) => {
          router.push(`/dashboard/patients/${patient.patientId}`);
          setIsLookupOpen(false);
        }}
      />

      <div className="flex items-center gap-8">

        {/* Notifications & User */}
        <div className="flex items-center gap-4">
          <ThemeToggle variant="topbar" />
          <button className="relative p-2.5 rounded-xl hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all group active:scale-95">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--sidebar-bg)]"></span>
            <div className="absolute inset-0 bg-[var(--primary)]/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
          </button>

          <div className="flex items-center gap-4 pl-4 border-l border-[var(--card-border)]">
            <div className="text-right">
              <p className="text-[12px] font-bold text-[var(--text-primary)] tracking-tighter leading-none uppercase">
                {session?.user?.name || "AUTHENTICATED USER"}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <Shield className="w-2 h-2 text-[var(--primary)]" />
                <p className="text-[8px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] opacity-80">
                  {session?.user?.role || "Authorized Clinician"}
                </p>
              </div>
            </div>
            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center shadow-lg overflow-hidden group-hover:border-[var(--primary)]/30 transition-all">
                <User className="text-[var(--text-muted)] w-5 h-5 group-hover:text-[var(--primary)] transition-colors" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[var(--sidebar-bg)]" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
