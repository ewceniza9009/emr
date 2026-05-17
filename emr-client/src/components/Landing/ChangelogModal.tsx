"use client";

import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import changelogData from "@/data/changelog.json";

interface ChangelogModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangelogModal({ open, onClose }: ChangelogModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-[#0a0c12] border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">
                  System Ledger
                </h2>
                <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest mt-1">
                  Updates & Patches
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto pr-4 space-y-8 custom-scrollbar">
              {changelogData.changelog.map((e: any, i: number) => (
                <div
                  key={i}
                  className="pl-6 border-l-2 border-white/10 relative"
                >
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0a0c12] border-2 border-teal-500" />
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-black text-teal-400 bg-teal-500/10 px-2 py-1 rounded">
                      {e.v}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {e.date}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {e.items.map((d: string, j: number) => (
                      <li
                        key={j}
                        className="text-sm text-slate-300 flex gap-2"
                      >
                        <span className="text-teal-500">•</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
