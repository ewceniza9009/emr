"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, User, ShieldCheck, Zap, Activity, Moon, Sun, Settings, Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PatientLookup from "./PatientLookup";
import { NotificationCenter } from "./NotificationCenter";
import { ChatInbox } from "./ChatInbox";
import { useSidebar } from "@/lib/SidebarContext";

export function TopBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
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
    <header className="h-14 flex items-center justify-between gap-3 px-4 lg:px-8 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)] sticky top-0 z-[55] transition-all duration-300">
      {/* Mobile Sidebar Trigger + Clinical Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-primary)] hover:border-[var(--primary)]/50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative group flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
          </div>
          <input
            type="text"
            readOnly
            aria-label="Search patients, MRN, or leads"
            onClick={() => setIsLookupOpen(true)}
            placeholder="Search patients, MRN, or leads..."
            className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-2 pl-11 pr-16 text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] transition-all cursor-pointer"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider border border-[var(--card-border)] rounded px-1.5 py-0.5 uppercase">Alt + K</span>
          </div>
        </div>
      </div>

      <PatientLookup
        open={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onSelect={(item) => {
          if (item.type === 'LEAD') {
            router.push(`/dashboard/outreach/${item.id}/enroll`);
          } else {
            router.push(`/dashboard/patients/${item.id}`);
          }
          setIsLookupOpen(false);
        }}
      />

      <div className="flex items-center gap-8">

        {/* Notifications & User */}
        <div className="flex items-center gap-4">
          <ThemeToggle variant="topbar" />
          <ChatInbox />
          <NotificationCenter />


          <div className="flex items-center gap-4 pl-4 border-l border-[var(--card-border)]">
            <div className="text-right">
              <p className="text-[12px] font-bold text-[var(--text-primary)] tracking-tight leading-none uppercase">
                {session?.user?.name || "AUTHENTICATED USER"}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <ShieldCheck className="w-2.5 h-2.5 text-[var(--primary)]" />
                <p className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] opacity-80">
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

