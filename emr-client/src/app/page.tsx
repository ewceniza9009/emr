"use client";

import Link from "next/link";
import { 
  ShieldCheck, 
  Activity, 
  Map, 
  CreditCard, 
  ChevronRight, 
  ArrowRight, 
  Zap, 
  Lock,
  BarChart3
} from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-400 font-sans selection:bg-[var(--primary)] selection:text-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.03] bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-lg shadow-[var(--primary-glow)]/20">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Aura</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-white transition-colors">Features</Link>
            <Link href="#solutions" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-white transition-colors">Solutions</Link>
            <Link href="#security" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-white transition-colors">Security</Link>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/login" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-white transition-colors">Sign In</Link>
            <Link href="/login" className="h-9 px-4 bg-[var(--primary)] text-white text-[11px] font-semibold uppercase tracking-wider rounded-lg flex items-center justify-center hover:bg-[var(--primary)]/90 transition-all">
              Request Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary)]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] mb-8">
            <Zap className="w-3 h-3 text-[var(--primary)]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next-Gen Clinical OS</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-8 max-w-4xl mx-auto">
            The platform for <span className="text-slate-500">high-fidelity</span> <br />
            clinical logistics.
          </h1>
          
          <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
            Streamline patient outreach, care navigation, and billing into a unified, secure operating system designed for modern healthcare teams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto h-12 px-8 bg-white text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all">
              Start Building
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Link>
            <Link href="#features" className="w-full sm:w-auto h-12 px-8 bg-white/[0.03] border border-white/[0.05] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center hover:bg-white/[0.08] transition-all">
              View Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: "Care Navigation",
                desc: "Real-time geospatial coordination for providers and patients.",
                icon: Map
              },
              {
                title: "Revenue Cycle",
                desc: "Automated claim submission and invoice tracking.",
                icon: CreditCard
              },
              {
                title: "Vital Telemetry",
                desc: "Direct integration with clinical hardware monitoring.",
                icon: Activity
              }
            ].map((feature, i) => (
              <div key={i} className="group">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6 group-hover:border-[var(--primary)]/30 transition-all">
                  <feature.icon className="w-5 h-5 text-slate-400 group-hover:text-[var(--primary)] transition-colors" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">{feature.desc}</p>
                <Link href="/login" className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider inline-flex items-center gap-1.5 hover:gap-2.5 transition-all">
                  Explore <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="py-32 bg-white/[0.01] border-y border-white/[0.03]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col items-center text-center gap-12">
            <div className="w-10 h-1 bg-[var(--primary)]/20 rounded-full" />
            <blockquote className="text-3xl font-medium text-white leading-snug tracking-tight">
              "Aura transformed our clinical pipeline from a messy spreadsheet into a predictable engine. It's the only OS we trust for our specialized services."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/[0.05] flex items-center justify-center text-sm font-bold text-white">
                MM
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white leading-none">Michael McDonald</p>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1.5">St. James Clinical Director</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: "Providers", val: "2.4k" },
              { label: "Claims", val: "$1.2B" },
              { label: "Nodes", val: "14" },
              { label: "Security", val: "Level 1" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-white mb-2">{stat.val}</p>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Aura</span>
          </div>
          
          <div className="flex items-center gap-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Security</Link>
          </div>

          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
            © 2026 Aura Clinical Technologies
          </p>
        </div>
      </footer>
    </div>
  );
}
