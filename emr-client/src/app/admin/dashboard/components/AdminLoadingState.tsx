import { Shield } from "lucide-react";

export default function AdminLoadingState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative flex flex-col items-center space-y-10">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl border border-white/5 bg-white/[0.02] rotate-45 animate-[spin_10s_linear_infinite] backdrop-blur-sm" />
          <div className="w-24 h-24 rounded-3xl border border-[var(--primary)]/20 absolute inset-0 -rotate-45 animate-[spin_15s_linear_infinite_reverse]" />
          <Shield className="w-8 h-8 text-[var(--primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]" />
        </div>
        <div className="flex flex-col items-center space-y-3">
          <div className="h-[2px] w-48 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
          <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.5em] animate-pulse">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
