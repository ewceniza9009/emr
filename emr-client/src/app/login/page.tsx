"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Mail, Loader2, ChevronRight, Activity, TrendingUp, ArrowLeft } from "lucide-react";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid work email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
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
        setError("Invalid credentials. Please verify your email and password.");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#020617] text-slate-200 selection:bg-[var(--primary)] selection:text-white relative overflow-hidden">
      {/* LEFT SIDE: FORM */}
      <div className="w-full lg:w-[45%] flex flex-col p-8 lg:p-24 relative z-20 bg-[#020617] shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="mb-auto">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold mb-12">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <div className="flex items-center gap-3 mb-12 group cursor-default">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-lg shadow-[var(--primary-glow)] animate-halkyone-pulse group-hover:scale-110 transition-transform duration-500">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v9c0 5 9 6 9 6s9-1 9-6V7l-9-5z" />
                <path d="M8 12h3l1-3 2 6 1-3h2" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white tracking-tight leading-none uppercase">HALYONE</h1>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Clinical OS</span>
            </div>
          </div>

          <div className="space-y-2 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="text-slate-400 text-sm font-medium">Enter your credentials to access your clinical workspace.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold animate-shake flex items-center gap-3">
                <div className="w-1 h-full bg-rose-500 rounded-full" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[var(--primary)] transition-colors z-10" />
                <input
                  {...register("email")}
                  type="email"
                  className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-transparent focus:bg-slate-900/80 transition-all placeholder:text-slate-600 hover:border-slate-700 shadow-inner"
                  placeholder="name@halkyone.clinical"
                />
              </div>
              {errors.email && <p className="text-[10px] text-rose-400 ml-1 font-bold">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:text-emerald-400 transition-colors">Forgot?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[var(--primary)] transition-colors z-10" />
                <input
                  {...register("password")}
                  type="password"
                  className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-transparent focus:bg-slate-900/80 transition-all placeholder:text-slate-600 hover:border-slate-700 shadow-inner"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-[10px] text-rose-400 ml-1 font-bold">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="relative flex items-center">
                <input type="checkbox" className="peer w-4 h-4 rounded border-slate-700 bg-slate-900/50 text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer transition-all" id="remember" />
              </div>
              <label htmlFor="remember" className="text-xs font-bold text-slate-400 select-none cursor-pointer hover:text-slate-300 transition-colors">Keep me logged in</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-[var(--primary)] to-emerald-500 hover:from-[var(--primary)] hover:to-emerald-400 text-white font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center group shadow-[0_10px_40px_-10px_var(--primary-glow)] transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_-10px_var(--primary-glow)] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-3 text-sm">
                  Sign in to Workspace
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              )}
            </button>
          </form>

        </div>

        <div className="mt-auto pt-12">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 cursor-pointer transition-colors w-max">
            <Activity className="w-3 h-3" />
            Connection Settings
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: HERO CONTENT */}
      <div className="hidden lg:flex flex-1 relative bg-[#020617] items-center justify-center overflow-hidden">
        {/* Animated Mesh Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[var(--primary)]/20 blur-[120px] animate-pulse mix-blend-screen" style={{ animationDuration: '8s' }} />
          <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse mix-blend-screen" style={{ animationDuration: '12s' }} />
          <div className="absolute top-[30%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[100px] animate-pulse mix-blend-screen" style={{ animationDuration: '10s' }} />
        </div>

        {/* Floating UI Widget - Pinned to absolute top right */}
        <div className="absolute top-12 right-12 z-20 animate-in slide-in-from-right duration-1000 delay-300 group">
          <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 w-72 transform group-hover:-translate-y-2 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] transition-all duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Fidelity</p>
                <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-100">+92% Growth</p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div className="h-full w-[92%] bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_15px_#10b981]" />
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-2xl px-12">


          {/* Testimonial */}
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 relative z-10">
            <div className="w-16 h-1 bg-gradient-to-r from-[var(--primary)] to-emerald-500 rounded-full shadow-[0_0_20px_var(--primary-glow)]" />
            <blockquote className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight drop-shadow-2xl">
              &quot;Halkyone transformed our clinical pipeline from a messy spreadsheet into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">predictable engine.</span>&quot;
            </blockquote>

            <div className="flex items-center gap-5 pt-4">
              <div className="w-14 h-14 rounded-full bg-slate-800/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-sm font-black text-white shadow-xl relative overflow-hidden group-hover:border-white/20 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                MM
              </div>
              <div>
                <p className="text-base font-bold text-white tracking-wide">Victory Sotto</p>
                <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">St. Vincent&apos;s Hospice Clinical Director</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      </div>
    </div>

  );
}

