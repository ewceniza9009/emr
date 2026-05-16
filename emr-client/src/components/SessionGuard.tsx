"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, RefreshCcw, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useToast } from "./ToastProvider";

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [isExpiring, setIsExpiring] = useState(false);
  
  const resetTimer = () => {
    setIsExpiring(false);
  };

  useEffect(() => {
    if (isExpiring) return;

    // INCREASED: Now triggers after 2 hours instead of 5 minutes
    const timer = setTimeout(() => {
      setIsExpiring(true);
      showToast("Security Alert: Clinical session nearing expiry.", "error");
    }, 7200000); 

    return () => clearTimeout(timer);
  }, [isExpiring, showToast]);

  if (isExpiring) {
    return (
      <>
        {children}
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="glass-morphism max-w-md w-full rounded-[2.5rem] border border-blue-500/20 p-12 text-center space-y-8 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto border border-blue-500/20 animate-pulse">
               <ShieldAlert className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Session Security</h1>
              <p className="text-[var(--text-secondary)]">Your secure clinical session is about to expire for patient safety. Please re-authenticate to preserve progress.</p>
            </div>
            <div className="flex flex-col gap-4">
               <button 
                 onClick={resetTimer}
                 className="w-full py-4 rounded-2xl premium-gradient text-white font-bold shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
               >
                 <RefreshCcw className="w-4 h-4" /> Extend Session
               </button>
               <button 
                 onClick={() => signOut({ callbackUrl: "/login" })}
                 className="w-full py-4 rounded-2xl bg-white/5 text-slate-400 font-bold hover:text-[var(--text-primary)] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
               >
                 <LogOut className="w-4 h-4" /> Secure Logout
               </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}

