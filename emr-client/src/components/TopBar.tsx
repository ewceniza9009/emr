"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, User } from "lucide-react";

export function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)] sticky top-0 z-40 transition-colors duration-500">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
          <input 
            type="text" 
            placeholder="Search patients, MRNs, or cases..."
            className="w-full premium-input rounded-xl py-1.5 pl-10 pr-4 text-xs focus:ring-4 focus:ring-[var(--primary-glow)] focus:border-[var(--primary)] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-[var(--primary-glow)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-[var(--sidebar-bg)]"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[var(--card-border)]">
          <div className="text-right">
            <p className="text-xs font-bold text-[var(--text-primary)] tracking-tight leading-none">
              {session?.user?.name || "Practitioner"}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] capitalize tracking-widest mt-0.5">
              {session?.user?.role || "System Admin"}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center shadow-inner overflow-hidden">
             <User className="text-[var(--text-muted)] w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
