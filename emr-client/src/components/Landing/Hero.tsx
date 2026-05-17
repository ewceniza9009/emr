"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Dev from "@/components/Dev";

interface HeroProps {
  isAuthenticated: boolean;
  version: string;
  build: string;
}

export default function Hero({ isAuthenticated, version, build }: HeroProps) {
  const authLink = isAuthenticated ? "/dashboard" : "/login";
  const authLabelHero = isAuthenticated ? "Enter Workspace" : "Initialize Workflow";

  return (
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
                Halkyone OS {version} is Live
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                Build {build}
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
    </section>
  );
}
