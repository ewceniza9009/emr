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
  BarChart3,
  Globe,
  Database,
  Cpu,
  Fingerprint
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8 }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-400 font-sans selection:bg-[var(--primary)] selection:text-white overflow-x-hidden">
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--primary)]/5 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${isScrolled ? "bg-black/60 backdrop-blur-2xl border-white/10 py-3" : "bg-transparent border-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-lg shadow-[var(--primary-glow)] animate-halcyon-pulse group-hover:scale-110 transition-transform duration-500">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v9c0 5 9 6 9 6s9-1 9-6V7l-9-5z" />
                <path d="M8 12h3l1-3 2 6 1-3h2" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight leading-none uppercase">HALCYON</span>
              <span className="text-[8px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] mt-1">Clinical OS</span>
            </div>
          </motion.div>

          <div className="hidden lg:flex items-center gap-10">
            {[
              { label: 'Features', id: 'engine' },
              { label: 'Workflows', id: 'network' },
              { label: 'Platform & Safety', id: 'security' }
            ].map((item) => (
              <Link key={item.id} href={`#${item.id}`} className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/admin" className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-all mr-2">
              Admin Portal
            </Link>
            <Link href="/login" className="h-11 px-8 bg-gradient-to-r from-[var(--primary)] to-emerald-500 hover:from-[var(--primary)] hover:to-emerald-400 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl flex items-center justify-center shadow-[0_10px_40px_-10px_var(--primary-glow)] transition-all hover:scale-[1.02] active:scale-[0.98] group">
              Launch App
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-48 pb-32 lg:pt-64 lg:pb-56 overflow-hidden">
        {/* MOVING LIGHT BEAMS */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] w-[1px] h-[150%] bg-white/20 rotate-[35deg] blur-[80px]"
          />
          <motion.div
            animate={{
              x: [0, -150, 0],
              opacity: [0.05, 0.2, 0.05]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] right-[20%] w-[1px] h-[150%] bg-[var(--primary)]/30 rotate-[35deg] blur-[100px]"
          />
        </div>

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.03] border border-white/10 mb-12 backdrop-blur-2xl shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary)] animate-pulse" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">System Status: Online</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-7xl lg:text-[110px] font-bold text-white leading-[1] tracking-tight mb-8 max-w-6xl drop-shadow-2xl">
              <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">The future of</span> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-emerald-400 animate-gradient-x drop-shadow-[0_0_40px_var(--primary-glow)]">clinical operations.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl lg:text-2xl text-slate-400 font-medium leading-relaxed mb-16 max-w-3xl">
              A beautifully engineered clinical operating system designed to unify workflows and empower high-performance medical teams.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-6">
              <Link href="/login" className="h-16 px-12 bg-gradient-to-r from-[var(--primary)] to-emerald-500 hover:from-[var(--primary)] hover:to-emerald-400 text-white text-[12px] font-bold uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center group shadow-[0_10px_40px_-10px_var(--primary-glow)] transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_-10px_var(--primary-glow)] active:scale-[0.98]">
                Get Started
                <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link href="#engine" className="h-16 px-12 bg-slate-900/40 border border-slate-800 text-white text-[12px] font-bold uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center hover:bg-slate-800/60 hover:border-slate-700 transition-all backdrop-blur-md shadow-inner">
                See Features
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* HERO VISUAL DECOR */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] opacity-20 pointer-events-none">
          <div className="absolute inset-0 border border-white/[0.03] rounded-full" />
          <div className="absolute inset-[15%] border border-white/[0.03] rounded-full" />
          <div className="absolute inset-[30%] border border-white/[0.03] rounded-full" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </section>

      {/* FEATURE CLUSTERS */}
      <section id="engine" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-3 mb-8">
                <div className="w-12 h-px bg-[var(--primary)]" />
                <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.4em]">Core Architecture</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-8">
                Distributed data. <br />Centralized control.
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-12">
                Halcyon's core engine handles complex clinical synchronization at scale, ensuring your providers stay connected across disparate clinical environments and geospatial boundaries.
              </p>

              <div className="grid grid-cols-2 gap-8">
                {[
                  { label: "Uptime SLA", val: "99.999%", icon: Zap },
                  { label: "Sync Latency", val: "<40ms", icon: Activity },
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5">
                    <item.icon className="w-5 h-5 text-[var(--primary)] mb-4" />
                    <p className="text-2xl font-bold text-white mb-1">{item.val}</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-blue-600/20 rounded-[3rem] blur-3xl opacity-30" />
              <div className="relative h-full w-full bg-white/[0.01] border border-white/10 rounded-[3rem] p-8 backdrop-blur-3xl overflow-hidden flex items-center justify-center">
                <div className="relative w-full h-full border border-white/5 rounded-2xl flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border border-[var(--primary)]/30 flex items-center justify-center animate-[spin_20s_linear_infinite]">
                    <div className="w-4 h-4 rounded-full bg-[var(--primary)] absolute top-0 shadow-[0_0_15px_var(--primary-glow)]" />
                  </div>
                  <div className="w-32 h-32 rounded-full border border-blue-500/30 flex items-center justify-center animate-[spin_15s_linear_infinite_reverse]">
                    <div className="w-3 h-3 rounded-full bg-blue-500 absolute bottom-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                  </div>
                  <ShieldCheck className="w-16 h-16 text-white opacity-20 absolute" />
                </div>

                {/* DATA STREAM DECOR */}
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="h-full w-1/2 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent"
                    />
                  </div>
                  <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.3em] mt-4 text-center">Encrypted Telemetry Stream</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section id="network" className="py-32 border-y border-white/[0.03] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-24">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5em] mb-6 block">Capability Matrix</span>
            <h2 className="text-5xl font-bold text-white tracking-tighter">Unified clinical workflows.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Tactical Navigation", desc: "Real-time geospatial provider tracking.", icon: Map },
              { title: "Revenue Cycle", desc: "Deep integration with billing registries.", icon: CreditCard },
              { title: "Node Telemetry", desc: "Low-latency clinical IoT connectivity.", icon: Cpu },
              { title: "Identity Vault", desc: "Level 1 security for patient records.", icon: Fingerprint }
            ].map((card, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-[var(--primary)]/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-[var(--primary)]/10 transition-all">
                  <card.icon className="w-6 h-6 text-slate-400 group-hover:text-[var(--primary)]" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">{card.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">{card.desc}</p>
                <div className="h-px w-8 bg-white/10 group-hover:w-full group-hover:bg-[var(--primary)] transition-all duration-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST & INFRASTRUCTURE */}
      <section id="security" className="py-48 overflow-hidden relative">
        <div className="absolute inset-0 bg-[var(--primary)]/[0.02] -skew-y-6 translate-y-32" />
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="flex flex-col items-center text-center">
            <Globe className="w-12 h-12 text-[var(--primary)] opacity-20 mb-12 animate-pulse" />
            <h2 className="text-5xl lg:text-7xl font-bold text-white tracking-tighter mb-16 max-w-4xl">
              Engineered for the <span className="text-slate-700 italic">mission critical.</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-16 w-full max-w-5xl">
              {[
                { label: "Active Deployments", val: "148" },
                { label: "Data Throughput", val: "2.8 TB/s" },
                { label: "Security Layer", val: "AES-256" }
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-4xl font-bold text-white mb-3 tracking-tighter">{stat.val}</p>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-40 relative">
        <div className="max-w-4xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative rounded-[3rem] p-16 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-blue-800 opacity-90" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-8">Ready to modernize?</h2>
              <p className="text-white/70 text-lg mb-12 font-medium">Join the fleet of high-performance clinical teams running on Halcyon.</p>
              <Link href="/login" className="h-16 px-12 bg-gradient-to-r from-[var(--primary)] to-emerald-500 hover:from-[var(--primary)] hover:to-emerald-400 text-white text-[12px] font-bold uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center group shadow-[0_10px_40px_-10px_var(--primary-glow)] transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_-10px_var(--primary-glow)] active:scale-[0.98]">
                Get Started Now
                <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tighter block leading-none">Halcyon</span>
              <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">Next-Gen Protocol</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-10 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
            {['Status', 'Security', 'Privacy', 'Network', 'API', 'Legal'].map(link => (
              <Link key={link} href="#" className="hover:text-[var(--primary)] transition-colors tracking-[0.2em]">{link}</Link>
            ))}
            <Link href="/admin" className="text-indigo-950 hover:text-indigo-500 transition-colors tracking-[0.2em]">Admin Portal</Link>
          </div>

          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-800 uppercase tracking-widest leading-relaxed">
              � 2026 Halcyon Clinical Technologies <br />
              All Vector Units Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

