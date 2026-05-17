"use client";

import React from "react";
import { History, Globe } from "lucide-react";

export default function Metrics() {
  return (
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
  );
}
