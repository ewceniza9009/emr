"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, User } from "lucide-react";

export function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900 sticky top-0 z-40">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search patients, MRNs, or cases..."
            className="w-full premium-input rounded-xl py-1.5 pl-10 pr-4 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#0f172a]"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/5">
          <div className="text-right">
            <p className="text-xs font-bold text-white tracking-tight leading-none">
              {session?.user?.name || "Practitioner"}
            </p>
            <p className="text-[10px] text-slate-500 capitalize tracking-widest mt-0.5">
              {session?.user?.role || "System Admin"}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center shadow-inner overflow-hidden">
             <User className="text-slate-500 w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
