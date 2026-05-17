"use client";

import React from "react";
import {
  PhoneCall,
  PhoneOff,
  PhoneForwarded,
  Voicemail,
  Clock,
  UserX,
  Ban,
  UserMinus,
} from "lucide-react";
import { EnrollmentState } from "../../../hooks/useEnrollmentState";

interface QuickDispositionFooterProps {
  state: EnrollmentState;
}

export default function QuickDispositionFooter({ state }: QuickDispositionFooterProps) {
  const buttons = [
    {
      id: "CONNECTED",
      label: "Connected",
      icon: <PhoneCall className="w-3 h-3" />,
      c: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    },
    {
      id: "NO_ANSWER",
      label: "No Answer",
      icon: <PhoneOff className="w-3 h-3" />,
      c: "bg-amber-500/5 border-amber-500/20 text-amber-500/80 hover:bg-amber-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]",
    },
    {
      id: "VOICEMAIL",
      label: "Voicemail",
      icon: <Voicemail className="w-3 h-3" />,
      c: "bg-indigo-500/5 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]",
    },
    {
      id: "BUSY",
      label: "Busy",
      icon: <Clock className="w-3 h-3" />,
      c: "bg-sky-500/5 border-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(14,165,233,0.25)]",
    },
    {
      id: "WRONG_NUMBER",
      label: "Wrong #",
      icon: <UserX className="w-3 h-3" />,
      c: "bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(244,63,94,0.25)]",
    },
    {
      id: "DISCONNECTED",
      label: "Disconnect",
      icon: <PhoneOff className="w-3 h-3" />,
      c: "bg-zinc-500/5 border-zinc-500/20 text-zinc-400 hover:bg-zinc-600 hover:text-white hover:border-transparent hover:shadow-[0_0_15px_rgba(113,113,122,0.25)]",
    },
    {
      id: "DNC",
      label: "DNC",
      icon: <Ban className="w-3 h-3" />,
      c: "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white hover:border-transparent hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    },
    {
      id: "OPT_OUT",
      label: "Opt Out",
      icon: <UserMinus className="w-3 h-3" />,
      c: "bg-rose-950/20 border-rose-800/30 text-rose-400 hover:bg-rose-600 hover:text-white hover:border-transparent hover:shadow-[0_0_15px_rgba(225,29,72,0.3)]",
    },
    {
      id: "CALL_BACK",
      label: "Recall",
      icon: <PhoneForwarded className="w-3 h-3" />,
      c: "bg-cyan-500/5 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]",
    },
  ];

  return (
    <div className="sticky bottom-0 z-20 -mx-5 -mb-5 p-5 mt-auto bg-gradient-to-t from-[var(--sidebar-bg)] via-[var(--sidebar-bg)] to-transparent border-t border-[var(--card-border)] backdrop-blur-md space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
          Quick Disposition Action
        </p>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-teal-500/50" />
          <div className="w-1 h-1 rounded-full bg-teal-500/30" />
          <div className="w-1 h-1 rounded-full bg-teal-500/10" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => state.handleLogActivity(btn.id)}
            className={`h-8 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] text-[8px] font-black text-[var(--text-muted)] uppercase tracking-wider transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 px-3.5 shadow-inner hover:scale-[1.02] ${btn.c}`}
          >
            {btn.icon}
            <span>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
