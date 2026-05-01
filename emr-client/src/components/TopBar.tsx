"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, User } from "lucide-react";

export function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-slate-900 sticky top-0 z-40">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search patients, MRNs, or cases..."
            className="w-full premium-input rounded-2xl py-2.5 pl-12 pr-4 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
        </button>

        <div className="flex items-center gap-4 pl-6 border-l border-white/5">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">
              {session?.user?.name || "Practitioner"}
            </p>
            <p className="text-xs text-slate-400 capitalize">
              {session?.user?.role || "System Admin"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shadow-inner overflow-hidden">
             <User className="text-slate-400 w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
}
