"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Map,
  Activity,
  Lock,
  Cpu,
  ShieldCheck,
  Key,
  Calendar,
} from "lucide-react";

export default function BentoFeatures() {
  return (
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
                        className={`h-2 rounded-full flex-1 ${
                          slot.conflict ? "bg-red-500/50" : "bg-indigo-500/50"
                        }`}
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
  );
}
