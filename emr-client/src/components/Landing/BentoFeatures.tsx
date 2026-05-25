"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Map,
  Activity,
  Lock,
  Calendar,
  Sparkles,
  Database,
  WifiOff,
  BellRing,
  Navigation,
  MessageSquare,
  Truck,
  Smartphone,
  Fingerprint,
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
          
          {/* ROW 1 */}
          {/* Card 1: Visit Radar & Logistics Map (Col Span 2) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[360px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Visit Radar Map Mockup with route and geofence mask */}
            <div className="absolute top-0 right-0 bottom-0 left-1/3 md:left-1/2 overflow-hidden mask-image:linear-gradient(to_left,white,transparent)">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a615_1px,transparent_1px),linear-gradient(to_bottom,#14b8a615_1px,transparent_1px)] bg-[size:2rem_2rem] [transform:perspective(500px)_rotateX(60deg)] origin-bottom" />
              
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
                    <stop offset="50%" stopColor="#14b8a6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  <radialGradient id="privacyGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                  </radialGradient>
                </defs>
                
                {/* 500m Privacy Mask Circle */}
                <circle cx="220" cy="120" r="55" fill="url(#privacyGlow)" stroke="rgba(20,184,166,0.3)" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="220" cy="120" r="3" fill="#14b8a6" />

                {/* Animated Path */}
                <motion.path
                  d="M 50 250 Q 150 240 220 120 T 350 50"
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="3.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Pulsing Clinician Marker */}
                <motion.circle 
                  cx="160" 
                  cy="210" 
                  r="6" 
                  fill="#10b981" 
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </svg>

              {/* Floating Glass Toast */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(20,184,166,0.2)] flex items-center gap-3 group-hover:scale-105 transition-transform">
                <Navigation className="w-3.5 h-3.5 text-teal-400 animate-bounce" />
                <span className="text-[9px] font-mono font-black text-white tracking-widest uppercase">
                  Radar Active • 500m Masked
                </span>
              </div>
            </div>

            <div className="relative z-10 h-full flex flex-col justify-end mt-48 sm:mt-0 pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-[#0a0c12] border border-white/10 flex items-center justify-center mb-4 shadow-2xl">
                <Map className="w-6 h-6 text-teal-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Visit Radar & Logistics
              </h3>
              <p className="text-slate-400 text-xs max-w-sm">
                Real-time clinician route streaming utilizing SignalR coordinates, integrated with a dynamic 500m geofenced privacy mask to secure practitioner locations.
              </p>
            </div>
          </motion.div>

          {/* Card 2: One-Click Triage Workspace (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[360px] flex flex-col justify-between"
          >
            {/* Pulsing red beacon glow behind triage alert */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* High-Fidelity Triage Alert Action Card */}
            <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 p-4 relative overflow-hidden group-hover:border-rose-500/30 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded tracking-widest uppercase animate-pulse">
                  Critical Alert
                </span>
                {/* Fluctuate SpO2 text */}
                <motion.span 
                  animate={{ opacity: [1, 0.4, 1] }} 
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-[10px] text-rose-400 font-mono font-bold"
                >
                  SpO2: 82% ⚠️
                </motion.span>
              </div>

              <p className="text-xs text-white font-bold mb-3">Hypoxia Event: Robert Carter</p>

              {/* Action buttons grid */}
              <div className="grid grid-cols-3 gap-2">
                <span className="h-8 bg-rose-500/20 text-[9px] font-black text-rose-300 rounded-lg uppercase tracking-wider flex items-center justify-center border border-rose-500/30 cursor-pointer hover:bg-rose-500/30 transition-colors">
                  Claim
                </span>
                <span className="h-8 bg-teal-500/20 text-[9px] font-black text-teal-300 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1 border border-teal-500/30 cursor-pointer hover:bg-teal-500/30 transition-colors">
                  <MessageSquare className="w-3 h-3" /> Chat
                </span>
                <span className="h-8 bg-emerald-500/20 text-[9px] font-black text-emerald-300 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30 transition-colors">
                  <Truck className="w-3 h-3" /> Dispatch
                </span>
              </div>
            </div>

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                <BellRing className="w-5 h-5 text-rose-400 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                One-Click Triage Workspace
              </h3>
              <p className="text-xs text-slate-400">
                Instantly intercept critical vital threshold breaches. Claim tickets, trigger video chats, or dispatch field coordinators immediately from the telemetry console.
              </p>
            </div>
          </motion.div>

          {/* ROW 2 */}
          {/* Card 3: Patient Outreach & Record Registry (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[360px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Detailed Patient Card Mockup with Animated ECG */}
            <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 shadow-2xl relative overflow-hidden group-hover:border-emerald-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />

              {/* Header Profile */}
              <div className="p-4 border-b border-white/5 flex items-center gap-3 relative z-10">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    DM
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0a0c12] rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">David Martinez</div>
                  <div className="text-[9px] text-slate-400 font-mono">ID: P-882914-A • ACTIVE</div>
                </div>
              </div>

              {/* Miniature Running ECG Wave */}
              <div className="h-6 w-full relative px-4 overflow-hidden border-b border-white/5 bg-black/20">
                <svg className="absolute inset-0 w-full h-full opacity-70" viewBox="0 0 200 30" preserveAspectRatio="none">
                  <motion.path
                    d="M 0 15 L 50 15 L 60 5 L 70 25 L 80 15 L 120 15 L 130 5 L 140 25 L 150 15 L 200 15"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                  />
                </svg>
              </div>

              {/* Body Details */}
              <div className="p-3 flex flex-col gap-1.5 relative z-10">
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

            <div className="relative z-10 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-1">
                Unified Clinical Record
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                High-density registry integrating palliative comfort care plans, active daily Breakthrough Pharmacy regimes, advance directives, and insurance metadata.
              </p>
            </div>
          </motion.div>

          {/* Card 4: Generative AI SOAP Assist (Col Span 2) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[360px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Split Screen AI Note Drafting Mockup with glowing effects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              
              {/* Left Side: ESAS-R input burden */}
              <div className="rounded-xl bg-white/[0.01] border border-white/5 p-3 flex flex-col gap-2">
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Symptom Burden (ESAS-R)</div>
                <div className="flex items-center justify-between text-xs text-white">
                  <span>Pain</span>
                  <span className="font-bold text-amber-400">8/10</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full"><motion.div initial={{ width: 0 }} whileInView={{ width: "80%" }} transition={{ duration: 1.5 }} className="bg-amber-400 h-full rounded-full" /></div>
                
                <div className="flex items-center justify-between text-xs text-white">
                  <span>Dyspnea</span>
                  <span className="font-bold text-rose-400">9/10</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full"><motion.div initial={{ width: 0 }} whileInView={{ width: "90%" }} transition={{ duration: 1.5 }} className="bg-rose-400 h-full rounded-full" /></div>
              </div>

              {/* Right Side: AI SOAP Note generation with typing simulation */}
              <div className="rounded-xl bg-white/[0.02] border border-white/10 p-3 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[8px] font-bold text-teal-400">
                  <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} /> Draft Ready
                </div>
                <div className="text-[9px] font-mono text-slate-300 leading-normal">
                  <span className="text-teal-400 font-bold">O:</span> Heart rate 112 bpm, SpO2 88%. Dyspnea evident at rest.
                  <br />
                  <span className="text-teal-400 font-bold">A:</span> Acute dyspnea secondary to COPD exacerbation.
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-1.5 h-3 bg-teal-400 ml-0.5 align-middle"
                  />
                </div>
                <div className="flex gap-1.5 mt-2">
                  <span className="text-[8px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">R06.02 Dyspnea</span>
                  <span className="text-[8px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">G89.3 Pain</span>
                </div>
              </div>

            </div>

            <div className="relative z-10 pointer-events-none mt-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Generative AI SOAP Assist
              </h3>
              <p className="text-xs text-slate-400">
                Leverage lightweight LLM integrations to analyze telemetry trends and ESAS-R symptom logs, auto-drafting structured clinical notes and suggesting matching ICD-10 diagnostic codes.
              </p>
            </div>
          </motion.div>

          {/* ROW 3 */}
          {/* Card 5: Mobile Patient Comfort Portal (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[360px] flex flex-col justify-between"
          >
            {/* Animated scanning rings for Biometrics */}
            <div className="absolute top-4 right-4 w-28 h-28 flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-[20px]" />
              <motion.div
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-12 h-12 rounded-full border border-emerald-500/30"
              />
              <motion.div
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 2.5, delay: 1.25, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-12 h-12 rounded-full border border-emerald-500/30"
              />
              <Fingerprint className="w-8 h-8 text-emerald-400/20 relative z-10 group-hover:text-emerald-400 transition-colors duration-500" />
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Mobile UI mockup details */}
            <div className="w-[85%] rounded-2xl bg-white/[0.02] border border-white/10 p-4 relative overflow-hidden group-hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-white flex items-center gap-1">
                  Comfort Portal
                </span>
                <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-wider">DFUTB Verified</span>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex justify-between items-center text-[10px] text-white">
                  <span>Rescue Regimen</span>
                  <span className="text-[9px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded animate-pulse">Active</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-white">
                  <span>Clinician Chat</span>
                  <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">Seen ✓✓</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Comfort Care Mobile App
              </h3>
              <p className="text-xs text-slate-400">
                Dignity-first patient portal enabling passwordless biometric logins, breakthrough medication regimen requests, and instant secure patient-clinician chat channels.
              </p>
            </div>
          </motion.div>

          {/* Card 6: SQLite Offline Caching (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[360px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Offline sync queue simulation */}
            <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 p-4 relative overflow-hidden group-hover:border-indigo-500/30 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold">
                  <WifiOff className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Connectivity: Offline
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
                <Database className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                True SQLite Offline Cache
              </h3>
              <p className="text-xs text-slate-400">
                Keeps patient mobile transactions resilient. Logs and chat records are safely queued locally inside SQLite DBs, synchronizing immediately once connections re-establish.
              </p>
            </div>
          </motion.div>

          {/* Card 7: Intelligent Scheduling Engine (Col Span 1) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="relative p-8 rounded-[2rem] bg-[#050914] border border-white/10 overflow-hidden group h-[360px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Micro scheduling preview with conflict warning blinker */}
            <div className="w-full flex flex-col gap-1.5 rounded-2xl bg-white/[0.02] border border-white/10 p-3 relative overflow-hidden group-hover:border-purple-500/30 transition-colors">
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                <span>15:00 Slot</span>
                <span className="text-[8px] font-bold text-rose-400 uppercase tracking-wider animate-pulse">Conflict Resolved</span>
              </div>
              <div className="h-1.5 bg-red-500/20 rounded-full w-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  whileInView={{ width: "100%" }} 
                  transition={{ duration: 2 }}
                  className="h-full bg-purple-500 rounded-full" 
                />
              </div>
            </div>

            <div className="relative z-10 pointer-events-none mt-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-purple-400 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Intelligent Scheduling
              </h3>
              <p className="text-xs text-slate-400">
                Automatically resolves booking conflicts, overlays driving route constraints, and coordinates sequential visits to optimize field clinician schedules.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
