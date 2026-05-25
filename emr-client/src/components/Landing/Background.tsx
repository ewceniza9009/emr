"use client";

import React from "react";
import { motion } from "framer-motion";
import BeehiveAnimation from "./BeehiveAnimation";

export default function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Core Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-teal-500/10 rounded-[100%] blur-[120px] opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-[100%] blur-[80px] opacity-50 mix-blend-screen" />

      {/* Interactive Beehive Honeycomb Grid */}
      <BeehiveAnimation />

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.015] mix-blend-overlay" />

      {/* Animated Orbs */}
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-teal-600/5 rounded-full blur-[120px]"
      />
    </div>
  );
}
