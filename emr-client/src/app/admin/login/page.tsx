"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Lock, Mail, Loader2, ChevronRight, Zap, Database, Terminal } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter your admin credentials"),
  password: z.string().min(8, "Password must be verified"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("ADMIN_AUTH_FAILED: Invalid security credentials.");
      } else {
        // Force refresh to ensure session is captured correctly
        window.location.href = "/admin/dashboard";
      }
    } catch (err) {
      setError("SYSTEM_FAULT: Clinical server unreachable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--text-muted)] font-sans selection:bg-indigo-500 selection:text-white p-6">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-6 group cursor-pointer active:scale-95 transition-all">
            <Shield className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-2">Setup Portal</h1>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Administrative Access Only</p>
        </div>

        <div className="bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--card-border)] rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Security Protocol</p>
              <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">RSA-4096 · TLS 1.3</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-shake">
                <Zap className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Admin Identifier</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" />
                <input
                  {...register("email")}
                  type="email"
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--background)] transition-all placeholder:text-[var(--text-muted)]/50"
                  placeholder="sysadmin@halkyone.clinical"
                />
              </div>
              {errors.email && <p className="text-[9px] text-rose-400 ml-1 font-black uppercase tracking-widest">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Security Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" />
                <input
                  {...register("password")}
                  type="password"
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50 focus:bg-[var(--background)] transition-all placeholder:text-[var(--text-muted)]/50"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-[9px] text-rose-400 ml-1 font-black uppercase tracking-widest">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center group shadow-2xl shadow-indigo-500/20 transition-all active:scale-[0.98] mt-8"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-3 text-xs">
                  Authorize Connection
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              )}
            </button>
          </form>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6">
          <div className="flex items-center justify-center gap-8 text-[var(--text-muted)] opacity-60">
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">Live Registry</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">Encrypted Link</span>
            </div>
          </div>

          <button
            onClick={() => window.location.href = "/login"}
            className="text-[10px] font-black text-[var(--text-muted)] hover:text-indigo-500 uppercase tracking-widest transition-colors"
          >
            Switch to Clinical Portal
          </button>
        </div>
      </div>
    </div>
  );
}

