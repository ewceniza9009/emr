"use client";

import React from "react";
import Link from "next/link";
import { Stethoscope, ChevronRight } from "lucide-react";

interface CTAProps {
  isAuthenticated: boolean;
}

export default function CTA({ isAuthenticated }: CTAProps) {
  const authLink = isAuthenticated ? "/dashboard" : "/login";
  const authLabelFooter = isAuthenticated ? "Enter Control Panel" : "Launch Control Panel";

  return (
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
  );
}
