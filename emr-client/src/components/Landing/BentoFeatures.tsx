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
  Sparkles,
  Database,
  Fingerprint,
  MessageSquare,
  Truck,
  WifiOff,
  ClipboardList,
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

        {/* 3x3 Perfectly Balanced Grid (9 Column Units Total) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* ================= ROW 1 (3 Units) ================= */}
          {/* Card 1: Large Span - Clinical Logistics Map (Col Span 2) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[300px] flex flex-col justify-between"
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
                  <radialGradient id="radarPrivacy" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                  </radialGradient>
                </defs>
                
                {/* 500m Privacy Mask Overlay */}
                <circle cx="210" cy="130" r="50" fill="url(#radarPrivacy)" stroke="rgba(20,184,166,0.4)" strokeWidth="1.5" strokeDasharray="5 5" />
                <circle cx="210" cy="130" r="3.5" fill="#14b8a6" />

                <motion.path
                  d="M 50 250 Q 150 250 210 130 T 350 50"
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
                  ETA: 12 Mins • Radar Enabled (500m Masked)
                </span>
              </div>
            </div>

            <div className="relative z-10 h-full flex flex-col justify-end pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-[#0a0c12] border border-white/10 flex items-center justify-center mb-4 shadow-2xl">
                <Map className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                Clinical Logistics & Visit Radar
              </h3>
              <p className="text-slate-400 text-xs max-w-sm">
                Geospatial routing recalculates clinician drive times dynamically with SignalR route tracking, including a 500m geofenced privacy mask.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Patient Outreach Terminal (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[300px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Detailed Patient Card Mockup */}
            <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 shadow-2xl relative overflow-hidden group-hover:border-emerald-500/30 transition-colors">
              {/* Header Profile */}
              <div className="p-3 border-b border-white/5 flex items-center gap-3 relative z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  DM
                </div>
                <div>
                  <div className="text-xs font-bold text-white">David Martinez</div>
                  <div className="text-[8px] text-slate-400 font-mono">ID: P-882914-A</div>
                </div>
              </div>

              {/* Body Details */}
              <div className="p-3 flex flex-col gap-1.5 relative z-10">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 uppercase tracking-widest text-[8px] font-bold">Health Plan</span>
                  <span className="font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Medicare</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 uppercase tracking-widest text-[8px] font-bold">Consent</span>
                  <span className="font-bold text-white flex items-center gap-0.5"><Lock className="w-2.5 h-2.5 text-emerald-400" /> Executed</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-1">
                Patient Outreach Terminal
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                High-fidelity workstation for rapidly transitioning leads into the registry. Integrates health plan verification and HIPAA consent workflows instantly.
              </p>
            </div>
          </motion.div>

          {/* ================= ROW 2 (3 Units) ================= */}
          {/* Card 3: Small - RPM & One-Click Triage (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[300px] flex flex-col justify-between"
          >
            {/* Full background SVG Chart */}
            <div className="absolute inset-0 bottom-1/2 top-0">
              <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 to-transparent" />
              <svg
                className="absolute inset-0 w-full h-full opacity-50 group-hover:opacity-100 transition-opacity"
                viewBox="0 0 200 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 100 L 0 50 Q 50 20 100 60 T 200 40 L 200 100 Z"
                  fill="url(#redGrad)"
                />
                <path
                  d="M 0 50 Q 50 20 100 60 T 200 40"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  filter="url(#glow)"
                />
                <defs>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Triage Alerts and Action buttons */}
              <div className="absolute right-8 top-6 flex flex-col gap-1 items-end">
                <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 rounded text-[8px] font-black text-rose-400 animate-pulse tracking-wide">
                  SpO2: 82% Critical ⚠️
                </span>
                <div className="flex gap-1 scale-75 origin-right">
                  <span className="px-1.5 py-0.5 bg-rose-500/30 text-[8px] font-black text-rose-300 rounded border border-rose-500/30 cursor-pointer">Claim</span>
                  <span className="px-1.5 py-0.5 bg-teal-500/30 text-[8px] font-black text-teal-300 rounded border border-teal-500/30 cursor-pointer flex items-center gap-0.5"><MessageSquare className="w-2 h-2" /> Chat</span>
                  <span className="px-1.5 py-0.5 bg-emerald-500/30 text-[8px] font-black text-emerald-300 rounded border border-emerald-500/30 cursor-pointer flex items-center gap-0.5"><Truck className="w-2 h-2" /> Dispatch</span>
                </div>
              </div>
            </div>

            <Cpu className="w-8 h-8 text-rose-400 relative z-10" />

            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-1">
                Remote Patient Monitoring
              </h3>
              <p className="text-xs text-slate-400">
                Continuous vital sign tracking with integrated One-Click Triage alerts to claim, chat, or dispatch clinicians directly from critical breaches.
              </p>
            </div>
          </motion.div>

          {/* Card 4: Small - HIPAA & Compliance (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[300px] flex flex-col justify-between"
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
              <h3 className="text-xl font-bold text-white mb-1">
                HIPAA & Compliance
              </h3>
              <p className="text-xs text-slate-400">
                Enterprise-grade PHI protection, regional data isolation, and robust system configurations ensuring strict compliance.
              </p>
            </div>
          </motion.div>

          {/* Card 5: Emergency Protocols & SQLite Cache (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[300px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="flex-1 flex items-center justify-center relative">
              <div className="absolute w-full h-[1px] bg-red-500/10 top-1/2 -translate-y-1/2" />
              <div className="absolute w-[1px] h-full bg-red-500/10 left-1/2 -translate-x-1/2" />

              <div className="w-16 h-16 rounded-2xl bg-[#0a0c12] border border-red-500/30 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(239,68,68,0.15)] group-hover:scale-110 transition-transform">
                <Key className="w-6 h-6 text-red-500" />
              </div>

              <div className="absolute top-4 left-4 text-[8px] font-mono text-red-500/50">
                ACCESS: DENIED
              </div>
              <div className="absolute bottom-4 right-4 text-[8px] font-mono text-indigo-400/60 flex items-center gap-0.5">
                <Database className="w-2 h-2 animate-pulse" /> SQLITE CACHE
              </div>
            </div>

            <div className="relative z-10 mt-2">
              <h3 className="text-xl font-bold text-white mb-1">
                Emergency Protocols
              </h3>
              <p className="text-xs text-slate-400">
                Instant override capabilities for critical care, backed by a local SQLite offline cache to queue transactions when connections fail.
              </p>
            </div>
          </motion.div>

          {/* ================= ROW 3 (3 Units) ================= */}
          {/* Card 6: Intelligent Scheduling Engine (Col Span 2) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[300px] flex flex-col justify-end"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="absolute top-8 right-8 bottom-8 left-1/2 overflow-hidden mask-image:linear-gradient(to_left,white,transparent)">
              <div className="flex flex-col gap-2.5 w-full h-full justify-center pl-8">
                {[
                  { time: "14:00", active: false },
                  { time: "14:30", active: true, conflict: false },
                  { time: "15:00", active: true, conflict: true },
                  { time: "15:30", active: false },
                ].map((slot, i) => (
                  <div
                    key={i}
                    className={`h-10 w-full rounded-xl border flex items-center px-4 gap-4 transition-transform group-hover:-translate-x-2 ${
                      slot.active
                        ? slot.conflict
                          ? "bg-red-500/10 border-red-500/30 animate-pulse"
                          : "bg-indigo-500/20 border-indigo-500/50"
                        : "bg-white/5 border-white/10 opacity-50"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-slate-400 w-10">
                      {slot.time}
                    </span>
                    {slot.active && (
                      <div
                        className={`h-1.5 rounded-full flex-1 ${
                          slot.conflict ? "bg-red-500/50" : "bg-indigo-500/50"
                        }`}
                      />
                    )}
                    {slot.conflict && (
                      <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest">
                        Conflict
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pointer-events-none w-full sm:w-1/2">
              <div className="w-12 h-12 rounded-xl bg-[#0a0c12] border border-white/10 flex items-center justify-center mb-4 shadow-2xl">
                <Calendar className="w-6 h-6 text-indigo-400 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                Intelligent Scheduling Engine
              </h3>
              <p className="text-slate-400 text-xs max-w-sm">
                Automatically balances clinician availability, preventing conflicting appointments and managing real-world travel times.
              </p>
            </div>
          </motion.div>

          {/* Card 7: Patient Clinical Records & AI Assist (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[300px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* AI Note Drafting Mini UI Mockup */}
            <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 p-3.5 relative overflow-hidden group-hover:border-teal-500/30 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] font-black text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded tracking-widest uppercase flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} /> AI SOAP Assist
                </span>
                <span className="text-[8px] font-mono text-emerald-400">Drafted</span>
              </div>
              
              <p className="text-[9px] font-mono text-slate-300 leading-normal mb-1">
                <span className="text-teal-400 font-bold">O:</span> SpO2 88%, HR 112 bpm.
                <br />
                <span className="text-teal-400 font-bold">A:</span> Exacerbation. COPD/Dyspnea.
              </p>
              
              <div className="flex gap-1 mt-1">
                <span className="text-[7px] font-bold text-slate-400 bg-white/5 px-1 py-0.2 rounded">R06.02 Dyspnea</span>
                <span className="text-[7px] font-bold text-slate-400 bg-white/5 px-1 py-0.2 rounded">G89.3 Pain</span>
              </div>
            </div>

            <div className="relative z-10 mt-2">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
                <ClipboardList className="w-5 h-5 text-teal-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Patient Clinical Records
              </h3>
              <p className="text-xs text-slate-400">
                Palliative symptom checklists (ESAS-R), Breakthrough Meds tracking, and auto-drafted clinical SOAP notes.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
