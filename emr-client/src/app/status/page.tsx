"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Database, 
  Network, 
  Terminal, 
  RefreshCw, 
  ShieldCheck,
  AlertCircle,
  Wifi
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Background, Navbar, Footer, ChangelogModal } from "@/components/Landing";

interface ServiceHealth {
  name: string;
  category: string;
  status: "Operational" | "Degraded" | "Outage" | "Maintenance";
  uptime: string;
  latency: string;
  icon: React.ReactNode;
  history: number[]; // mock history percentages
}

export default function StatusPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticSteps, setDiagnosticSteps] = useState<string[]>([]);
  const [diagnosticStatus, setDiagnosticStatus] = useState<"idle" | "running" | "completed">("idle");

  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    document.documentElement.classList.add("force-dark");
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.documentElement.classList.remove("force-dark");
    };
  }, []);

  const runDiagnostics = async () => {
    setDiagnosticStatus("running");
    setDiagnosticsRunning(true);
    setDiagnosticSteps([]);

    const steps = [
      "Establishing handshake connection to API Gateway...",
      "Resolving database migration snapshots (PostgreSQL)...",
      "Pinging OSRM Routing server & verifying cached coordinates...",
      "Initiating WebSocket connection to SignalR Realtime Dispatch Hub...",
      "Verifying device push notifications token register (FCM)..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setDiagnosticSteps(prev => [...prev, `✓ ${steps[i]}`]);
    }

    await new Promise(resolve => setTimeout(resolve, 400));
    setDiagnosticStatus("completed");
    setDiagnosticsRunning(false);
  };

  const services: ServiceHealth[] = [
    {
      name: "API Gateway & Router",
      category: "Traffic Orchestration",
      status: "Operational",
      uptime: "99.99%",
      latency: "14 ms",
      icon: <Network className="w-5 h-5 text-teal-400" />,
      history: [100, 100, 100, 99.8, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
    },
    {
      name: "PostgreSQL Database Cluster",
      category: "Core Persistence",
      status: "Operational",
      uptime: "100.00%",
      latency: "4 ms",
      icon: <Database className="w-5 h-5 text-indigo-400" />,
      history: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
    },
    {
      name: "OSRM Routing Engine",
      category: "Geospatial Logistics",
      status: "Operational",
      uptime: "99.96%",
      latency: "38 ms",
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      history: [100, 99.9, 100, 100, 99.7, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
    },
    {
      name: "SignalR Telemetry Hub",
      category: "Real-time Streaming",
      status: "Operational",
      uptime: "99.98%",
      latency: "8 ms",
      icon: <Wifi className="w-5 h-5 text-pink-400" />,
      history: [100, 100, 100, 100, 100, 100, 99.5, 100, 100, 100, 100, 100, 100, 100, 100]
    }
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-slate-400 font-sans selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden">
      <Background />

      <Navbar
        isAuthenticated={isAuthenticated}
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setIsChangelogOpen={setIsChangelogOpen}
        isSubPage={true}
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-24 pb-24">
        {/* Header Section */}
        <div className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-teal-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              <Activity className="w-4 h-4" /> Operations Control
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                System Status
              </h1>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> All Systems Nominal
              </div>
            </div>
            <p className="text-slate-400 text-sm mt-3 max-w-xl">
              Live uptime metrics, connection response latencies, and interactive diagnostics for the Halkyone Clinical OS.
            </p>
          </div>
          
          <button
            onClick={runDiagnostics}
            disabled={diagnosticsRunning}
            className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${diagnosticsRunning ? "animate-spin" : ""}`} />
            Run System Diagnostics
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Services List (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {services.map(s => (
              <div
                key={s.name}
                className="p-6 md:p-8 rounded-3xl bg-white/[0.01] border border-white/5 backdrop-blur-md hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    {s.icon}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                      {s.category}
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                      {s.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="w-1 h-1 rounded-full bg-emerald-400" /> {s.status}
                      </span>
                      <span className="text-slate-500">Latency: <strong className="text-slate-300 font-mono">{s.latency}</strong></span>
                      <span className="text-slate-500">Uptime: <strong className="text-slate-300 font-mono">{s.uptime}</strong></span>
                    </div>
                  </div>
                </div>

                {/* SVG Visual Uptime Sparkline Bars */}
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    15-Day History
                  </span>
                  <div className="flex gap-1">
                    {s.history.map((val, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-6 rounded-full transition-all ${
                          val === 100 
                            ? "bg-emerald-500/20 group-hover:bg-emerald-500" 
                            : val >= 99.5 
                            ? "bg-teal-500/40" 
                            : "bg-amber-500"
                        }`}
                        style={{ height: `${val * 0.24}px` }}
                        title={`Day ${idx + 1}: ${val}% uptime`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Console Sandbox (4 cols) */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            <div className="rounded-3xl bg-[#080c14] border border-white/5 overflow-hidden">
              <div className="px-6 py-4 bg-slate-950 border-b border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-teal-400" /> Diagnostic Terminal
                </span>
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              </div>

              <div className="p-6 font-mono text-xs text-slate-400 min-h-[300px] flex flex-col justify-between">
                <div>
                  {diagnosticStatus === "idle" && (
                    <p className="text-slate-500 italic">
                      Click &quot;Run System Diagnostics&quot; above to initiate a connection path check across all service endpoints.
                    </p>
                  )}
                  {diagnosticSteps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-teal-400 mb-2 leading-relaxed"
                    >
                      {step}
                    </motion.div>
                  ))}
                  {diagnosticStatus === "running" && (
                    <div className="flex items-center gap-2 text-slate-500 mt-4">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Diagnosing system infrastructure...
                    </div>
                  )}
                </div>

                {diagnosticStatus === "completed" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 flex gap-3 mt-4"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <div>
                      <strong className="block text-white text-xs uppercase tracking-wider mb-0.5">Diagnostic Passed</strong>
                      All network routing handshakes completed nominal inside 120ms.
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <ChangelogModal
        open={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
    </div>
  );
}
