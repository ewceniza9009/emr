"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-12 border-t border-white/5 px-6 bg-[#010204]">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
          <ShieldCheck className="w-6 h-6 text-white" />
          <span className="text-lg font-bold text-white tracking-tighter">
            HALKYONE
          </span>
        </div>
        <div className="flex gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <Link href="/docs" className="hover:text-white transition-colors">
            Documentation
          </Link>
          <Link href="/api-docs" className="hover:text-white transition-colors">
            API
          </Link>
          <Link href="/status" className="hover:text-white transition-colors">
            Status
          </Link>
          <Link href="/security" className="hover:text-white transition-colors">
            Security
          </Link>
        </div>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          © 2026 Halkyone OS.
        </p>
      </div>
    </footer>
  );
}
