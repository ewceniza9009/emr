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
  remember: z.boolean().optional(),
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
        remember: data.remember ? "true" : "false",
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
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--text-secondary)] selection:bg-teal-500/30 selection:text-white relative overflow-hidden">
      {/* LEFT SIDE: FORM */}
      <div className="w-full lg:w-[45%] flex flex-col p-8 lg:p-24 relative z-20 bg-[var(--background)] shadow-[20px_0_50px_rgba(0,0,0,0.15)] dark:shadow-[20px_0_50px_rgba(0,0,0,0.5)] border-r border-[var(--divider-color)]">
        <div className="mb-auto">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-slate-500 hover:text-[var(--text-primary)] transition-colors text-xs font-bold mb-12">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <div className="flex items-center gap-4 mb-12 group cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-[0_10px_30px_rgba(20,184,166,0.3)] group-hover:scale-110 transition-transform duration-500">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight leading-none uppercase">HALKYONE</h1>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.2em] mt-1">Clinical OS</span>
            </div>
          </div>

          <div className="space-y-2 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">Welcome back</h2>
            <p className="text-[var(--text-muted)] text-sm font-medium">Enter your credentials to access your clinical workspace.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold animate-shake flex items-center gap-3">
                <div className="w-1 h-full bg-rose-500 rounded-full" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Email address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[var(--primary)] transition-colors z-10" />
                <input
                  {...register("email")}
                  type="email"
                  className="w-full bg-[var(--input-bg)] border border-slate-300 dark:border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent focus:bg-[var(--input-bg)] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 hover:border-slate-400 dark:hover:border-white/20 shadow-inner"
                  placeholder="name@halkyone.clinical"
                />
              </div>
              {errors.email && <p className="text-[10px] text-rose-400 ml-1 font-bold">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Password</label>
                <button type="button" className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:text-emerald-400 transition-colors">Forgot?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[var(--primary)] transition-colors z-10" />
                <input
                  {...register("password")}
                  type="password"
                  className="w-full bg-[var(--input-bg)] border border-slate-300 dark:border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent focus:bg-[var(--input-bg)] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 hover:border-slate-400 dark:hover:border-white/20 shadow-inner"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-[10px] text-rose-400 ml-1 font-bold">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="relative flex items-center">
                  <input 
                  {...register("remember")}
                  type="checkbox" 
                  className="peer w-4 h-4 rounded border-white/10 bg-white/[0.02] text-teal-500 focus:ring-teal-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer transition-all" 
                  id="remember" 
                />
              </div>
              <label htmlFor="remember" className="text-xs font-bold text-slate-400 select-none cursor-pointer hover:text-slate-300 transition-colors">Keep me logged in</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center group shadow-[0_10px_40px_-10px_rgba(20,184,166,0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_-10px_rgba(20,184,166,0.6)] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-3 text-sm">
                  Access Workspace
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              )}
            </button>
          </form>

        </div>

        <div className="mt-auto pt-12">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 cursor-pointer transition-colors w-max">
            <Activity className="w-3 h-3" />
            System Status
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: HERO CONTENT */}
      <div className="hidden lg:flex flex-1 relative bg-[#020408] items-center justify-center overflow-hidden">
        {/* Animated Mesh Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a610_1px,transparent_1px),linear-gradient(to_bottom,#14b8a610_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-teal-500/20 blur-[120px] animate-pulse mix-blend-screen" style={{ animationDuration: '8s' }} />
          <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse mix-blend-screen" style={{ animationDuration: '12s' }} />
        </div>

        {/* Floating UI Widget - Live Sync */}
        {/* Floating UI Widget - Pinned to absolute top right */}
        <div className="absolute top-12 right-12 z-20 animate-in slide-in-from-right duration-1000 delay-300 group">
          <div className="bg-[#0a0c12]/80 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 w-72 transform group-hover:-translate-y-2 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] transition-all duration-500 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none" />
             
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#0a0c12] border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
                <TrendingUp className="w-5 h-5 text-emerald-400 relative z-10" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Care Delivery</p>
                <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-100">+92% Efficiency</p>
              </div>
            </div>
            
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden backdrop-blur-sm relative z-10 border border-white/5 mt-2">
              <div className="h-full w-[92%] bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full shadow-[0_0_15px_#10b981]" />
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-2xl px-12">
          {/* Testimonial */}
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 relative z-10">
            <div className="w-16 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-[0_0_20px_rgba(20,184,166,0.5)]" />
            <blockquote className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight drop-shadow-2xl">
              &quot;Halkyone eliminated our logistical bottlenecks. Our clinicians now spend zero time on routing and <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">100% of their time on patient care.</span>&quot;
            </blockquote>

            <div className="flex items-center gap-5 pt-4">
              <div className="w-14 h-14 rounded-full bg-[#0a0c12] border border-white/10 flex items-center justify-center text-sm font-black text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
                SC
              </div>
              <div>
                <p className="text-base font-bold text-white tracking-wide">Dr. Sarah Chen</p>
                <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">Chief Medical Officer, Pacific Health Partners</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#020408]/50 to-transparent pointer-events-none" />
      </div>
    </div>

  );
}

