"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface DevProps {
  children: React.ReactNode;
  className?: string;
}

export const Dev = ({ children, className = "" }: DevProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`inline-flex items-center group cursor-default select-none ${className}`}
    >
      <div className="relative overflow-hidden group px-4 py-1.5 rounded-lg transition-all duration-500 hover:bg-white/[0.02]">
        {/* LUXURY: Subtle Inner Border Animation */}
        <div className="absolute inset-0 rounded-lg border border-white/[0.05] group-hover:border-[var(--primary)]/20 transition-colors duration-700" />
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative flex items-center gap-3">
          {/* LUXURY: Precision Dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary-glow)] opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <code className="text-[11px] md:text-xs font-black text-slate-300 tracking-[0.15em] font-mono group-hover:text-white transition-colors duration-300">
            {children}
          </code>
        </div>
      </div>
    </motion.div>
  );
};

export default Dev;
