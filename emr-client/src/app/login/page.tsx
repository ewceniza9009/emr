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
    <div className="min-h-screen flex bg-[#020617] text-slate-200 selection:bg-[var(--primary)] selection:text-white">
      {/* LEFT SIDE: FORM */}
      <div className="w-full lg:w-[45%] flex flex-col p-8 lg:p-24 relative z-10">
        <div className="mb-auto">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold mb-12">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-[0_0_20px_var(--primary-glow)]">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v9c0 5 9 6 9 6s9-1 9-6V7l-9-5z" />
                <path d="M8 12h3l1-3 2 6 1-3h2" />
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">Aura</h1>
          </div>

          <div className="space-y-2 mb-10">
            <h2 className="text-4xl font-black text-white tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm font-medium">Enter your credentials to access your workspace.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-sm">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  {...register("email")}
                  type="email"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-white focus:outline-none focus:border-[var(--primary)]/50 focus:bg-slate-900 transition-all placeholder:text-slate-700"
                  placeholder="name@aura.clinical"
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-400 ml-1 font-bold">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest hover:underline">Forgot?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  {...register("password")}
                  type="password"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-white focus:outline-none focus:border-[var(--primary)]/50 focus:bg-slate-900 transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-[10px] text-red-400 ml-1 font-bold">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-[var(--primary)] focus:ring-[var(--primary)]" id="remember" />
              <label htmlFor="remember" className="text-xs font-bold text-slate-400 select-none cursor-pointer">Keep me logged in</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center group shadow-xl shadow-[var(--primary-glow)] transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-3 text-sm">
                  Sign in to Workspace
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-xs font-bold text-slate-500">
              Don't have an account? <button className="text-[var(--primary)] hover:underline">Register now!</button>
            </p>
          </div>
        </div>

        <div className="mt-auto pt-12">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase tracking-widest">
            <Activity className="w-3 h-3" />
            Connection Settings
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: HERO CONTENT */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 items-center justify-center overflow-hidden border-l border-white/5">
        <div className="absolute inset-0 z-0">
          <Image
            src="/aura_login_hero_v2_1777967769038.png"
            alt="Hero"
            fill
            className="object-cover opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#020617]/40 to-[#020617]" />
        </div>

        <div className="relative z-10 w-full max-w-2xl px-12">
          {/* Floating UI Widget */}
          <div className="absolute -top-40 right-0 animate-in slide-in-from-right duration-1000">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl flex flex-col gap-4 w-72">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Fidelity</p>
                  <p className="text-xl font-black text-white">+92% Growth</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-[92%] bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="space-y-12">
            <div className="w-12 h-1 bg-[var(--primary)] rounded-full" />
            <blockquote className="text-5xl font-black text-white leading-tight tracking-tight">
              "Aura transformed our <span className="text-[var(--primary)]">clinical pipeline</span> from a messy spreadsheet into a <span className="text-blue-500">predictable engine</span>."
            </blockquote>
            
            <div className="flex items-center gap-4 pt-4">
              <div className="w-14 h-14 rounded-full bg-[var(--primary)] flex items-center justify-center text-xl font-black text-white shadow-xl shadow-[var(--primary-glow)]">
                HG
              </div>
              <div>
                <p className="text-lg font-black text-white uppercase leading-none">Harold Glenn Minerva</p>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">CEO at BlockSpace Inc.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      </div>
    </div>
  );
}
