"use client";

import React from "react";
import { Lock, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPreview() {
  return (
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
                className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium ${
                  i === 0
                    ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                    : "text-slate-400 hover:bg-white/5"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    i === 0
                      ? "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]"
                      : "bg-transparent"
                  }`}
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
                      className={`flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border ${
                        i === 0 ? "border-red-500/30" : "border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border ${
                            i === 0 ? "border-red-500/50" : "border-white/10"
                          }`}
                        >
                          <Activity
                            className={`w-4 h-4 ${
                              i === 0 ? "text-red-400 animate-pulse" : "text-teal-400"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            {p.name}
                          </div>
                          <div
                            className={`text-[11px] font-mono mt-1 ${
                              i === 0 ? "text-red-400" : "text-slate-400"
                            }`}
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
  );
}
