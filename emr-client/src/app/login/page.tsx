"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Mail, Loader2, ChevronRight } from "lucide-react";
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
        // Force a full refresh to ensure all session providers (NextAuth, Apollo) 
        // and middleware pick up the new authentication cookies immediately.
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login_hero_bg_1777643570566.png"
          alt="Login Background"
          fill
          style={{ objectFit: 'cover' }}
          className="opacity-10 scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[var(--background)] to-teal-950/20" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="glass-morphism rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] premium-gradient mb-6 shadow-xl shadow-[var(--primary-glow)] relative group cursor-pointer overflow-hidden">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v9c0 5 9 6 9 6s9-1 9-6V7l-9-5z" />
                <path d="M8 12h3l1-3 2 6 1-3h2" className="animate-[pulse_2s_infinite]" />
              </svg>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Aura</h1>
            <p className="text-[var(--primary)] font-black tracking-[0.4em] uppercase text-[10px]">Clinical OS // Authorized Portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  {...register("email")}
                  type="email"
                  className="w-full premium-input rounded-xl py-3 pl-12 pr-4 text-white"
                  placeholder="name@palliative.emr"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  {...register("password")}
                  type="password"
                  className="w-full premium-input rounded-xl py-3 pl-12 pr-4 text-white"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full premium-button premium-gradient rounded-xl py-5 text-white font-black uppercase tracking-[0.2em] flex items-center justify-center group shadow-xl shadow-[var(--primary-glow)]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  INITIALIZE SESSION
                  <ChevronRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">
              Authorized Personnel Only. Access is monitored for HIPAA compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
