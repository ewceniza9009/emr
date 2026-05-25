"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Map,
  Activity,
  Lock,
  Cpu,
  ShieldCheck,
  Calendar,
  Sparkles,
  Database,
  WifiOff,
  BellRing,
  Navigation,
  MessageSquare,
  Truck,
} from "lucide-react";

export default function BentoFeatures() {
  return (
    <section id="architecture" className="py-32 relative px-6 z-10">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center text-center mb-20">
          <span className="text-[11px] font-black text-teal-500 uppercase tracking-[0.4em] mb-4">
            Clinical OS capabilities
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">
            Next-Gen Care Delivery
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Card 1: Visit Radar & Logistics Map (Col Span 2) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group min-h-[340px]"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Visit Radar Map Mockup */}
            <div className="absolute top-0 right-0 bottom-0 left-1/3 md:left-1/2 overflow-hidden mask-image:linear-gradient(to_left,white,transparent)">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a615_1px,transparent_1px),linear-gradient(to_bottom,#14b8a615_1px,transparent_1px)] bg-[size:2rem_2rem] [transform:perspective(500px)_rotateX(60deg)] origin-bottom" />
              
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
                    <stop offset="50%" stopColor="#14b8a6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  {/* Privacy mask pattern */}
                  <radialGradient id="privacyGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                  </radialGradient>
                </defs>
                
                {/* 500m Privacy Mask Circle */}
                <circle cx="220" cy="120" r="60" fill="url(#privacyGlow)" stroke="rgba(20,184,166,0.3)" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="220" cy="120" r="3" fill="#14b8a6" />

                <motion.path
                  d="M 50 250 Q 150 240 220 120 T 350 50"
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="4"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
                
                {/* Pulsing Clinician Marker */}
                <circle cx="160" cy="210" r="6" fill="#10b981" className="animate-pulse" />
              </svg>

              {/* Floating Glass Toast */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(20,184,166,0.2)] flex items-center gap-3 group-hover:scale-105 transition-transform">
                <Navigation className="w-3.5 h-3.5 text-teal-400 animate-bounce" />
                <span className="text-[9px] font-mono font-black text-white tracking-widest uppercase">
                  Radar Active • 500m Masked
                </span>
              </div>
            </div>

            <div className="relative z-10 h-full flex flex-col justify-end mt-48 sm:mt-0 pointer-events-none">
              <div className="w-14 h-14 rounded-2xl bg-[#0a0c12] border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                <Map className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Visit Radar & Logistics
              </h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Real-time clinician route streaming utilizing SignalR coordinates, integrated with a dynamic 500m geofenced privacy mask.
              </p>
            </div>
          </motion.div>

          {/* Card 2: One-Click Triage Workspace (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group min-h-[340px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* High-Fidelity Triage Alert Action Card */}
            <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 p-4 relative overflow-hidden group-hover:border-rose-500/30 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded tracking-widest uppercase">
                  Critical Alert
                </span>
                <span className="text-[10px] text-slate-400 font-mono">SpO2: 82%</span>
              </div>

              <p className="text-xs text-white font-bold mb-3">Hypoxia Event: Robert Carter</p>

              {/* Action buttons grid */}
              <div className="grid grid-cols-3 gap-2">
                <button className="h-8 bg-rose-500/20 hover:bg-rose-500/40 text-[9px] font-black text-rose-300 rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border border-rose-500/30">
                  Claim
                </button>
                <button className="h-8 bg-teal-500/20 hover:bg-teal-500/40 text-[9px] font-black text-teal-300 rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border border-teal-500/30">
                  <MessageSquare className="w-3 h-3" /> Chat
                </button>
                <button className="h-8 bg-emerald-500/20 hover:bg-emerald-500/40 text-[9px] font-black text-emerald-300 rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border border-emerald-500/30">
                  <Truck className="w-3 h-3" /> Dispatch
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-6">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                <BellRing className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                One-Click Triage Workspace
              </h3>
              <p className="text-xs text-slate-400">
                Instantly intercept critical vital threshold breaches. Claim tickets, trigger video chats, or dispatch field coordinators immediately.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Patient Outreach & Record Registry (Col Span 1 - Row Span 2) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:row-span-2 relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group flex flex-col justify-between min-h-[400px]"
          >
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Detailed Patient Card Mockup */}
            <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 shadow-2xl relative overflow-hidden group-hover:border-emerald-500/30 transition-colors mb-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />

              {/* Header Profile */}
              <div className="p-4 border-b border-white/5 flex items-center gap-3 relative z-10">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    DM
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0a0c12] rounded-full" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">David Martinez</div>
                  <div className="text-[9px] text-slate-400 font-mono">ID: P-882914-A • ACTIVE</div>
                </div>
              </div>

              {/* Body Details */}
              <div className="p-4 flex flex-col gap-3 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Health Plan</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Medicare</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Directives</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">DNR/Comfort</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">HIPAA Consent</span>
                  <span className="text-[10px] font-bold text-white flex items-center gap-1"><Lock className="w-2.5 h-2.5 text-emerald-400" /> Signed</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full border border-emerald-500/30 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full border-t-2 border-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Unified Clinical Record
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed max-w-[280px]">
                High-density registry integrating palliative comfort care plans, active daily Breakthrough Pharmacy regimes, advance directives, and verified insurance metadata.
              </p>
            </div>
          </motion.div>

          {/* Card 4: Generative AI SOAP Assist (Col Span 2) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group min-h-[340px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Split Screen AI Note Drafting Mockup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
              
              {/* Left Side: ESAS-R input burden */}
              <div className="rounded-xl bg-white/[0.01] border border-white/5 p-3 flex flex-col gap-2">
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Symptom Burden (ESAS-R)</div>
                <div className="flex items-center justify-between text-xs text-white">
                  <span>Pain</span>
                  <span className="font-bold text-amber-400">8/10</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full"><div className="w-[80%] bg-amber-400 h-full rounded-full" /></div>
                
                <div className="flex items-center justify-between text-xs text-white">
                  <span>Dyspnea</span>
                  <span className="font-bold text-rose-400">9/10</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full"><div className="w-[90%] bg-rose-400 h-full rounded-full" /></div>
              </div>

              {/* Right Side: AI SOAP Note generation */}
              <div className="rounded-xl bg-white/[0.02] border border-white/10 p-3 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-1 right-2 flex items-center gap-1 text-[8px] font-bold text-teal-400">
                  <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} /> Draft Ready
                </div>
                <div className="text-[9px] font-mono text-slate-300 leading-normal">
                  <span className="text-teal-400 font-bold">O:</span> Heart rate 112 bpm, SpO2 88%. Dyspnea evident at rest.
                  <br />
                  <span className="text-teal-400 font-bold">A:</span> Acute dyspnea secondary to COPD exacerbation.
                </div>
                <div className="flex gap-1.5 mt-2">
                  <span className="text-[8px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">R06.02 Dyspnea</span>
                  <span className="text-[8px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">G89.3 Pain</span>
                </div>
              </div>

            </div>

            <div className="relative z-10 pointer-events-none mt-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Generative AI SOAP Assist
              </h3>
              <p className="text-xs text-slate-400">
                Leverage lightweight LLM integrations to analyze telemetry trends and ESAS-R symptom logs, auto-drafting structured clinical notes and suggesting matching ICD-10 diagnostic codes.
              </p>
            </div>
          </motion.div>

          {/* Card 5: SQLite Offline Caching (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group min-h-[340px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Offline sync queue simulation */}
            <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 p-4 relative overflow-hidden group-hover:border-indigo-500/30 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold">
                  <WifiOff className="w-3.5 h-3.5 text-indigo-400" /> Connectivity: Offline
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-center text-[10px] text-white">
                  <span>Vitals Log Sync</span>
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Queued (Local)</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-white">
                  <span>Chat Message Sync</span>
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Queued (Local)</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Database className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                True SQLite Offline Cache
              </h3>
              <p className="text-xs text-slate-400">
                Keeps patient portal transactions, vital logging, and chat logs resilient. Transactions are persisted inside SQLite caches and synchronized automatically when network connections are restored.
              </p>
            </div>
          </motion.div>

          {/* Card 6: Intelligent Scheduling Engine (Col Span 2) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group min-h-[340px] flex flex-col justify-end"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

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
                          : "bg-purple-500/20 border-purple-500/50"
                        : "bg-white/5 border-white/10 opacity-50"
                    }`}
                  >
                    <span className="text-xs font-mono text-slate-400 w-10">
                      {slot.time}
                    </span>
                    {slot.active && (
                      <div
                        className={`h-2 rounded-full flex-1 ${
                          slot.conflict ? "bg-red-500/50" : "bg-purple-500/50"
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
              <div className="w-14 h-14 rounded-2xl bg-[#0a0c12] border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Intelligent Scheduling Engine
              </h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Automatically resolves booking conflicts, overlays driving route constraints, and schedules visits sequentially to protect practitioner dispatch availability.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
