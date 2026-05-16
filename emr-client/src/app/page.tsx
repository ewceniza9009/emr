"use client";

import Link from "next/link";
import {
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Activity,
  Map,
  Cpu,
  Lock,
  History,
  Sparkles,
  Globe,
  Key,
  Calendar,
  ChevronRight,
  CreditCard,
  Stethoscope,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Dev from "@/components/Dev";
import changelogData from "@/data/changelog.json";

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const authLink = isAuthenticated ? "/dashboard" : "/login";
  const authLabelNavbar = isAuthenticated ? "Dashboard" : "Launch App";
  const authLabelHero = isAuthenticated
    ? "Enter Workspace"
    : "Initialize Workflow";
  const authLabelFooter = isAuthenticated
    ? "Enter Control Panel"
    : "Launch Control Panel";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Platform", id: "platform" },
    { label: "Architecture", id: "architecture" },
    { label: "Security", id: "security" },
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-slate-400 font-sans selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden">
      {/* ADVANCED AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Core Glow */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-teal-500/10 rounded-[100%] blur-[120px] opacity-70" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-[100%] blur-[80px] opacity-50 mix-blend-screen" />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.015] mix-blend-overlay" />

        {/* Animated Orbs */}
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-teal-600/5 rounded-full blur-[120px]"
        />
      </div>

      {/* LUXURY NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${isScrolled ? "bg-[#020408]/80 backdrop-blur-2xl border-b border-white/5 py-4" : "bg-transparent py-6"}`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-teal-500/20 to-transparent border border-teal-500/20 shadow-[0_0_30px_rgba(20,184,166,0.15)] group-hover:shadow-[0_0_40px_rgba(20,184,166,0.3)] transition-all duration-500">
              <ShieldCheck className="w-6 h-6 text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight leading-none uppercase">
                HALKYONE
              </span>
              <span className="text-[9px] font-black text-teal-500 uppercase tracking-[0.3em] mt-1">
                Clinical OS
              </span>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center gap-10 p-2 px-6 rounded-full bg-white/[0.02] border border-white/5 backdrop-blur-md">
            {navLinks.map((item) => (
              <Link
                key={item.id}
                href={`#${item.id}`}
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors py-2 relative group"
              >
                {item.label}
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-px bg-teal-500 group-hover:w-full transition-all duration-300 opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => setIsChangelogOpen(true)}
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <History className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />{" "}
              Changelog
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href={authLink}
              className="hidden md:flex relative h-12 px-8 items-center justify-center rounded-xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
              <div className="absolute inset-px rounded-[11px] bg-gradient-to-b from-white/20 to-transparent opacity-50" />
              <span className="relative z-10 flex items-center text-[11px] font-black text-white uppercase tracking-[0.2em]">
                {authLabelNavbar}{" "}
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <button
              className="md:hidden w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 pt-28 pb-8 px-6 bg-[#020408]/90 border-b border-white/10 md:hidden flex flex-col"
          >
            <div className="flex flex-col gap-8">
              {navLinks.map((item) => (
                <Link
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xl font-bold uppercase tracking-[0.1em] text-white"
                >
                  {item.label}
                </Link>
              ))}
              <hr className="border-white/5" />
              <button
                onClick={() => {
                  setIsChangelogOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="text-xl font-bold uppercase tracking-[0.1em] text-white flex items-center gap-3 text-left"
              >
                Changelog <History className="w-5 h-5 text-teal-500" />
              </button>
            </div>
            <Link
              href={authLink}
              className="h-16 w-full mt-auto bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(20,184,166,0.4)]"
            >
              {authLabelNavbar}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION - HIGH IMPACT */}
      <section className="relative pt-40 pb-20 md:pt-56 md:pb-32 lg:pt-64 lg:pb-40 px-6">
        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="mb-8 flex flex-col items-center gap-4">
              <Dev className="scale-110">
                {"<DEV>ERWIN WILSON E. CENIZA</DEV>"}
              </Dev>
              <div className="inline-flex items-center gap-3 opacity-60">
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Halkyone OS 2.0 is Live
                </span>
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                  Build {changelogData.build}
                </span>
              </div>
            </div>

            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[120px] font-bold text-white leading-[1.1] tracking-tighter mb-8 drop-shadow-2xl w-full text-center flex flex-col items-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 pb-2 w-full">
                Unified Clinical
              </span>
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-600 animate-gradient-x drop-shadow-[0_0_60px_rgba(45,212,191,0.4)] w-full block mt-2">
                Operations.
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[60%] h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent blur-sm opacity-50" />
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-slate-400 font-medium leading-relaxed mb-12 max-w-4xl">
              Orchestrate your clinical workforce from a single, high-fidelity
              command center. Automate timezone-aware dispatch, enforce strict
              scheduling boundaries, and monitor active patient telemetry with
              absolute precision.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
              <Link
                href={authLink}
                className="w-full sm:w-auto relative h-16 px-12 items-center justify-center rounded-2xl overflow-hidden group shadow-[0_0_40px_rgba(20,184,166,0.3)] hover:shadow-[0_0_60px_rgba(20,184,166,0.5)] transition-all duration-500 hover:-translate-y-1 flex"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500" />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center text-[13px] font-black text-white uppercase tracking-[0.2em]">
                  {authLabelHero}{" "}
                  <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-2 transition-transform" />
                </span>
              </Link>
              <Link
                href="#architecture"
                className="w-full sm:w-auto h-16 px-12 bg-white/[0.03] border border-white/10 text-white text-[13px] font-bold uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center hover:bg-white/[0.08] hover:border-white/20 transition-all backdrop-blur-xl"
              >
                Explore Architecture
              </Link>
            </div>
          </motion.div>
        </div>

        {/* HERO DASHBOARD PREVIEW MOCKUP */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-24 max-w-[1200px] mx-auto relative hidden lg:block"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#020408] via-[#020408]/50 to-transparent z-20 pointer-events-none" />
          <div className="relative rounded-t-[2rem] border border-white/10 border-b-0 bg-[#0a0c12]/90 backdrop-blur-3xl shadow-[0_-20px_60px_-20px_rgba(20,184,166,0.15)] overflow-hidden aspect-[21/11]">
            {/* Mock Window Header */}
            <div className="h-12 border-b border-white/5 flex items-center px-6 bg-white/[0.02]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="mx-auto flex items-center gap-2 px-4 py-1.5 rounded-md bg-black/40 border border-white/5">
                <Lock className="w-3 h-3 text-teal-500" />
                <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                  halkyone.clinical.local/triage
                </span>
              </div>
            </div>

            {/* Mock Content */}
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-64 border-r border-white/5 p-6 flex flex-col gap-2 bg-white/[0.01]">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                  Command Center
                </div>
                {[
                  "Active Triage",
                  "Scheduling Matrix",
                  "Telemetry Hub",
                  "Patient Registry",
                  "Logistics Routing",
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium ${i === 0 ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-slate-400 hover:bg-white/5"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${i === 0 ? "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" : "bg-transparent"}`}
                    />
                    {item}
                  </div>
                ))}
              </div>

              {/* Main Dashboard Area */}
              <div className="flex-1 p-8 flex flex-col gap-8 bg-gradient-to-br from-transparent to-white/[0.01]">
                {/* Header Stats */}
                <div className="grid grid-cols-4 gap-6">
                  {[
                    {
                      label: "Active Critical",
                      val: "3",
                      color: "text-red-400",
                      dot: "bg-red-400",
                    },
                    {
                      label: "Pending Outreach",
                      val: "14",
                      color: "text-amber-400",
                      dot: "bg-amber-400",
                    },
                    {
                      label: "Clinicians Deployed",
                      val: "42",
                      color: "text-teal-400",
                      dot: "bg-teal-400",
                    },
                    {
                      label: "System Sync",
                      val: "12ms",
                      color: "text-emerald-400",
                      dot: "bg-emerald-400",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-24"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${stat.dot} animate-pulse`}
                        />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {stat.label}
                        </span>
                      </div>
                      <span className={`text-2xl font-bold ${stat.color}`}>
                        {stat.val}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-6 h-full pb-8">
                  {/* Live Triage Queue */}
                  <div className="flex-[2] bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-sm font-bold text-white uppercase tracking-widest">
                        Live Triage Telemetry
                      </span>
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold uppercase tracking-wider animate-pulse">
                        Urgent Review
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {[
                        {
                          name: "Patient 8429-A",
                          vitals: "HR: 110 | SpO2: 92%",
                          status: "Critical",
                          time: "2m ago",
                        },
                        {
                          name: "Patient 1093-B",
                          vitals: "HR: 85 | SpO2: 98%",
                          status: "Stable",
                          time: "14m ago",
                        },
                        {
                          name: "Patient 3391-C",
                          vitals: "HR: 72 | SpO2: 99%",
                          status: "Stable",
                          time: "22m ago",
                        },
                      ].map((p, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border ${i === 0 ? "border-red-500/30" : "border-white/5"}`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border ${i === 0 ? "border-red-500/50" : "border-white/10"}`}
                            >
                              <Activity
                                className={`w-4 h-4 ${i === 0 ? "text-red-400 animate-pulse" : "text-teal-400"}`}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">
                                {p.name}
                              </div>
                              <div
                                className={`text-[11px] font-mono mt-1 ${i === 0 ? "text-red-400" : "text-slate-400"}`}
                              >
                                {p.vitals}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              {p.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Appointment Booking Engine */}
                  <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col">
                    <div className="text-sm font-bold text-white uppercase tracking-widest mb-6">
                      Dispatch Engine
                    </div>
                    <div className="flex flex-col gap-4 flex-1">
                      <div className="w-full bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
                        <div className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2">
                          Next Available Slot
                        </div>
                        <div className="text-lg font-bold text-white">
                          14:30 PHT
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Dr. S. Chen • 12km away
                        </div>
                      </div>
                      <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 opacity-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Following Slot
                        </div>
                        <div className="text-lg font-bold text-white">
                          16:00 PHT
                        </div>
                      </div>
                      <div className="mt-auto h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-colors cursor-pointer">
                        View Master Matrix
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* BENTO BOX FEATURES - "ARCHITECTURE" */}
      <section id="architecture" className="py-32 relative px-6 z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col items-center text-center mb-20">
            <span className="text-[11px] font-black text-teal-500 uppercase tracking-[0.4em] mb-4">
              Integrated Infrastructure
            </span>
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">
              Comprehensive Care Management.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 max-w-6xl mx-auto auto-rows-[300px]">
            {/* Box 1: Large Span - Clinical Logistics Map */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-2 relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* High-End Map Mockup */}
              <div className="absolute top-0 right-0 bottom-0 left-1/3 md:left-1/2 overflow-hidden mask-image:linear-gradient(to_left,white,transparent)">
                {/* Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a615_1px,transparent_1px),linear-gradient(to_bottom,#14b8a615_1px,transparent_1px)] bg-[size:2rem_2rem] [transform:perspective(500px)_rotateX(60deg)] origin-bottom" />

                {/* SVG Route */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 400 300"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="routeGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
                      <stop offset="50%" stopColor="#14b8a6" stopOpacity="1" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <motion.path
                    d="M 50 250 Q 150 250 200 150 T 350 50"
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="4"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                  {/* Nodes */}
                  <circle
                    cx="50"
                    cy="250"
                    r="6"
                    fill="#0f172a"
                    stroke="#14b8a6"
                    strokeWidth="3"
                  />
                  <circle
                    cx="350"
                    cy="50"
                    r="6"
                    fill="#10b981"
                    className="animate-pulse"
                  />
                </svg>

                {/* Floating Glass Toast */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(20,184,166,0.2)] flex items-center gap-3 group-hover:scale-105 transition-transform">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-white tracking-widest uppercase">
                    ETA: 12 Mins • Shift Verified
                  </span>
                </div>
              </div>

              <div className="relative z-10 h-full flex flex-col justify-end mt-48 sm:mt-0 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-[#0a0c12] border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                  <Map className="w-8 h-8 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Clinical Logistics Engine
                </h3>
                <p className="text-slate-400 max-w-sm">
                  Geospatial routing recalculates clinician drive times
                  dynamically, strictly enforcing safety limits and shift
                  boundaries across timezones.
                </p>
              </div>
            </motion.div>

            {/* Box 2: Tall - Patient Profile */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:row-span-2 relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group flex flex-col"
            >
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Detailed Patient Card Mockup */}
              <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 shadow-2xl relative overflow-hidden group-hover:border-emerald-500/30 transition-colors mb-auto">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />

                {/* Header Profile */}
                <div className="p-5 border-b border-white/5 flex items-center gap-4 relative z-10">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                      DM
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0a0c12] rounded-full" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      David Martinez
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ID: P-882914-A • ACTIVE
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex flex-col gap-4 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Health Plan
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                      Medicare Advantage
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      HIPAA Consent
                    </span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" /> Executed
                    </span>
                  </div>

                  {/* Miniature ECG */}
                  <div className="mt-2 h-12 w-full relative">
                    <svg
                      className="absolute inset-0 w-full h-full opacity-60"
                      viewBox="0 0 200 40"
                      preserveAspectRatio="none"
                    >
                      <motion.path
                        d="M 0 20 L 50 20 L 60 5 L 70 35 L 80 20 L 200 20"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </svg>
                  </div>

                  {/* Sync Button */}
                  <div className="w-full h-10 mt-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center text-[10px] font-black text-white tracking-[0.2em] uppercase shadow-[0_5px_20px_rgba(16,185,129,0.3)] cursor-pointer">
                    Finalize Registry
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full border border-emerald-500/30 flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-emerald-400 animate-spin" />
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Patient Outreach Terminal
                </h3>
                <p className="text-slate-400 text-sm max-w-[250px]">
                  High-fidelity workstation for rapidly transitioning leads into
                  the registry. Integrates health plan verification and HIPAA
                  consent workflows instantly.
                </p>
              </div>
            </motion.div>

            {/* Box 3: Small - IoT Area Chart */}
            <motion.div
              whileHover={{ y: -5 }}
              className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group flex flex-col justify-between"
            >
              {/* Full background SVG Chart */}
              <div className="absolute inset-0 bottom-1/2 top-0">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />
                <svg
                  className="absolute inset-0 w-full h-full opacity-50 group-hover:opacity-100 transition-opacity"
                  viewBox="0 0 200 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 100 L 0 50 Q 50 20 100 60 T 200 40 L 200 100 Z"
                    fill="url(#blueGrad)"
                  />
                  <path
                    d="M 0 50 Q 50 20 100 60 T 200 40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    filter="url(#glow)"
                  />
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute right-8 top-8 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-[10px] font-bold text-blue-400">
                  98% SpO2
                </div>
              </div>

              <Cpu className="w-8 h-8 text-blue-400 relative z-10" />

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2">
                  Remote Patient Monitoring
                </h3>
                <p className="text-sm text-slate-400">
                  Continuous, real-time vital sign tracking and urgent pain
                  assessment.
                </p>
              </div>
            </motion.div>

            {/* Box 4: Small - Security Radar */}
            <motion.div
              whileHover={{ y: -5 }}
              className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group flex flex-col justify-between"
            >
              {/* Animated Radar/Shield Background */}
              <div className="absolute top-0 right-0 w-48 h-48 translate-x-1/4 -translate-y-1/4 flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-[30px]" />
                <motion.div
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute w-16 h-16 rounded-full border border-amber-500/50"
                />
                <motion.div
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 2, delay: 1, repeat: Infinity }}
                  className="absolute w-16 h-16 rounded-full border border-amber-500/50"
                />
                <ShieldCheck className="w-12 h-12 text-amber-500/30 relative z-10 group-hover:text-amber-400 transition-colors" />
                {/* Laser scan line */}
                <motion.div
                  animate={{ y: [-24, 24, -24] }}
                  transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                  className="absolute w-24 h-0.5 bg-amber-400 shadow-[0_0_10px_#fbbf24] z-20"
                />
              </div>

              <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1 w-max relative z-10">
                <Lock className="w-2 h-2" /> Verified
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2">
                  HIPAA & Compliance
                </h3>
                <p className="text-sm text-slate-400">
                  Enterprise-grade PHI protection and strict regional data
                  isolation.
                </p>
              </div>
            </motion.div>

            {/* Box 5: Identity Vault */}
            <motion.div
              whileHover={{ y: -5 }}
              className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group flex flex-col justify-between"
            >
              <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="flex-1 flex items-center justify-center relative">
                <div className="absolute w-full h-[1px] bg-red-500/10 top-1/2 -translate-y-1/2" />
                <div className="absolute w-[1px] h-full bg-red-500/10 left-1/2 -translate-x-1/2" />

                <div className="w-20 h-20 rounded-2xl bg-[#0a0c12] border border-red-500/30 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(239,68,68,0.15)] group-hover:scale-110 transition-transform">
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <Key className="w-8 h-8 text-red-500" />
                </div>

                <div className="absolute top-4 left-4 text-[8px] font-mono text-red-500/50">
                  ACCESS: DENIED
                </div>
                <div className="absolute bottom-4 right-4 text-[8px] font-mono text-red-500/50">
                  JWT: REVOKED
                </div>
              </div>

              <div className="relative z-10 mt-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  Emergency Protocols
                </h3>
                <p className="text-sm text-slate-400">
                  Instant override capabilities for critical care, ensuring
                  patient safety is never blocked.
                </p>
              </div>
            </motion.div>

            {/* Box 6: Appointment Matrix */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-2 relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group flex flex-col justify-end"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="absolute top-8 right-8 bottom-8 left-1/2 overflow-hidden mask-image:linear-gradient(to_left,white,transparent)">
                <div className="flex flex-col gap-3 w-full h-full justify-center pl-8">
                  {[
                    { time: "14:00", active: false },
                    { time: "14:30", active: true, conflict: false },
                    { time: "15:00", active: true, conflict: true },
                    { time: "15:30", active: false },
                  ].map((slot, i) => (
                    <div
                      key={i}
                      className={`h-12 w-full rounded-xl border flex items-center px-4 gap-4 transition-transform group-hover:-translate-x-2 ${
                        slot.active
                          ? slot.conflict
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-indigo-500/20 border-indigo-500/50"
                          : "bg-white/5 border-white/10 opacity-50"
                      }`}
                    >
                      <span className="text-xs font-mono text-slate-400 w-10">
                        {slot.time}
                      </span>
                      {slot.active && (
                        <div
                          className={`h-2 rounded-full flex-1 ${slot.conflict ? "bg-red-500/50" : "bg-indigo-500/50"}`}
                        />
                      )}
                      {slot.conflict && (
                        <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest animate-pulse">
                          Conflict
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 pointer-events-none w-full sm:w-1/2">
                <div className="w-16 h-16 rounded-2xl bg-[#0a0c12] border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                  <Calendar className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Intelligent Scheduling Engine
                </h3>
                <p className="text-slate-400 max-w-sm">
                  Automatically balances clinician availability, preventing
                  conflicting appointments and managing real-world travel times.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRUST & METRICS */}
      <section
        id="security"
        className="py-32 border-y border-white/[0.05] relative bg-[#010204]"
      >
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8">
                <History className="w-4 h-4 text-teal-400" />
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">
                  Forensic Accountability
                </span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter mb-8 leading-tight">
                Clinical Integrity, <br /> Built on Forensics.
              </h2>
              <p className="text-lg text-slate-400 mb-12 max-w-xl">
                We believe clinical software should be verifiable. Halkyone
                anchors every interaction in a high-fidelity forensic audit
                trail, providing unprecedented context and accountability for
                mission-critical care.
              </p>

              <div className="space-y-6">
                {[
                  {
                    label: "Forensic Depth",
                    val: "Context-Rich",
                    desc: "Record-level metadata for every action",
                  },
                  {
                    label: "Data Integrity",
                    val: "Verifiable",
                    desc: "Immutable system-of-record architecture",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                  >
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {stat.val}
                      </p>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-400">{stat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-full border border-white/5 flex items-center justify-center relative">
                <div className="absolute inset-4 rounded-full border border-dashed border-white/10 animate-[spin_60s_linear_infinite]" />
                <div className="absolute inset-16 rounded-full border border-white/10 animate-[spin_40s_linear_infinite_reverse]" />
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-600/20 to-teal-600/20 blur-2xl absolute" />
                <Globe className="w-24 h-24 text-white opacity-40" />

                {/* Floating Stat Nodes */}
                <div className="absolute top-10 right-10 p-4 rounded-xl bg-[#0a0c12] border border-white/10 shadow-xl backdrop-blur-xl">
                  <p className="text-xs text-slate-400 mb-1">
                    Total Throughput
                  </p>
                  <p className="text-xl font-bold text-teal-400">2.8 TB/s</p>
                </div>
                <div className="absolute bottom-20 left-4 p-4 rounded-xl bg-[#0a0c12] border border-white/10 shadow-xl backdrop-blur-xl">
                  <p className="text-xs text-slate-400 mb-1">Active Clusters</p>
                  <p className="text-xl font-bold text-blue-400">148 Nodes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MASSIVE CTA */}
      <section className="py-40 relative px-6">
        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-teal-500/20 to-blue-600/20 blur-[100px] rounded-full -z-10 opacity-50" />

          <Stethoscope className="w-16 h-16 text-white/50 mx-auto mb-10" />
          <h2 className="text-5xl md:text-8xl font-bold text-white tracking-tighter mb-8">
            Deploy Halkyone.
          </h2>
          <p className="text-xl text-slate-400 mb-16 max-w-2xl mx-auto">
            Step into the future of clinical operations. Fast, beautiful, and
            relentlessly reliable.
          </p>

          <Link
            href={authLink}
            className="inline-flex relative h-20 px-16 items-center justify-center rounded-[2rem] overflow-hidden group shadow-[0_20px_50px_-10px_rgba(20,184,166,0.4)] hover:-translate-y-2 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-blue-500" />
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex items-center text-[15px] font-black text-white uppercase tracking-[0.2em] drop-shadow-lg">
              {authLabelFooter}{" "}
              <ChevronRight className="w-5 h-5 ml-4 group-hover:translate-x-2 transition-transform" />
            </span>
          </Link>
        </div>
      </section>

      {/* MINIMAL FOOTER */}
      <footer className="py-12 border-t border-white/5 px-6 bg-[#010204]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
            <ShieldCheck className="w-6 h-6 text-white" />
            <span className="text-lg font-bold text-white tracking-tighter">
              HALKYONE
            </span>
          </div>
          <div className="flex gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <Link href="#" className="hover:text-white transition-colors">
              Documentation
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              API
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Status
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Security
            </Link>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            © 2026 Halkyone OS.
          </p>
        </div>
      </footer>

      {/* CHANGELOG MODAL (KEPT LEAN & RESPONSIVE) */}
      <AnimatePresence>
        {isChangelogOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChangelogOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a0c12] border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">
                    System Ledger
                  </h2>
                  <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest mt-1">
                    Updates & Patches
                  </p>
                </div>
                <button
                  onClick={() => setIsChangelogOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto pr-4 space-y-8 custom-scrollbar">
                {changelogData.changelog.map((e, i) => (
                  <div
                    key={i}
                    className="pl-6 border-l-2 border-white/10 relative"
                  >
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0a0c12] border-2 border-teal-500" />
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-black text-teal-400 bg-teal-500/10 px-2 py-1 rounded">
                        {e.v}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {e.date}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {e.items.map((d, j) => (
                        <li
                          key={j}
                          className="text-sm text-slate-300 flex gap-2"
                        >
                          <span className="text-teal-500">•</span> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
