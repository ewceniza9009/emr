"use client";

import { useState, Suspense, useEffect } from "react";
import { useMutation, gql } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Key, CheckCircle, Activity, ArrowRight, UserCheck } from "lucide-react";
import Link from "next/link";

const COMPLETE_ONBOARDING = gql`
  mutation CompleteOnboarding($token: String!, $password: String!) {
    completePractitionerOnboarding(token: $token, password: $password)
  }
`;

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [complete, { loading, data, error }] = useMutation(COMPLETE_ONBOARDING);

  useEffect(() => {
    if (data?.completePractitionerOnboarding) {
      setIsSuccess(true);
    } else if (data && !data.completePractitionerOnboarding) {
      setErrorMsg("The invitation token is invalid or has expired. Please contact your administrator.");
    }
  }, [data]);

  useEffect(() => {
    if (error) setErrorMsg(error.message);
  }, [error]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    setErrorMsg("");
    await complete({ variables: { token, password } });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20 text-rose-500">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">Access Forbidden</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            This terminal requires a valid cryptographic invitation token to initialize clinician onboarding.
          </p>
          <Link href="/login" className="block w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all">
            Return to Base
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-[2.5rem] p-12 text-center space-y-8 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-500/20 text-emerald-500 relative">
            <CheckCircle className="w-12 h-12" />
            <div className="absolute inset-0 rounded-[2rem] bg-emerald-500/20 animate-ping opacity-20" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Onboarding Complete</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your clinical identity has been successfully verified and linked to the master registry.
            </p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            Authenticate Session <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-4 mb-12 animate-in fade-in slide-in-from-top duration-1000">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-[0.2em]">Halcyon</h1>
            <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-[0.4em]">Clinical OS Onboarding</p>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          <div className="space-y-2">
            <div className="flex items-center gap-3 text-blue-500 mb-2">
              <UserCheck className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Identity Verified</span>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Initialize Account</h2>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Create a secure passphrase to activate your clinician credentials and access the master clinical registry.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Passphrase</label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="Enter secure password..."
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-950 transition-all placeholder:text-slate-700"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Identity</label>
                <div className="relative group">
                  <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="Repeat passphrase..."
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-950 transition-all placeholder:text-slate-700"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3 animate-shake">
                <Shield className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <span className="text-[10px] font-bold text-rose-500 leading-normal uppercase">{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {loading ? <Activity className="w-5 h-5 animate-spin" /> : <>Activate Clinical Profile <ArrowRight className="w-4 h-4" /></>}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-all duration-300 group-hover:translate-x-full" />
            </button>
          </form>

          <div className="text-center">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
              Secured by Halcyon Cryptographic Identity Protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
