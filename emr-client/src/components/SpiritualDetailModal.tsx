"use client";

import {
  X,
  Wind,
  Calendar,
  Heart,
  Users,
  Zap,
  MapPin,
  Phone,
} from "lucide-react";
import HalcyonPortal from "./Portal";

interface SpiritualDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  spiritual: {
    spiritualAssessmentId: string;
    faith?: string;
    importance?: string;
    community?: string;
    addressInCare?: string;
    religiousPreference?: string;
    clergyContact?: string;
  } | null;
}

export default function SpiritualDetailModal({ isOpen, onClose, spiritual }: SpiritualDetailModalProps) {
  if (!isOpen || !spiritual) return null;

  const fica = [
    { label: "Faith / Belief", value: spiritual.faith, icon: Wind, color: "text-indigo-400", bg: "bg-indigo-400/10" },
    { label: "Importance / Influence", value: spiritual.importance, icon: Heart, color: "text-rose-400", bg: "bg-rose-400/10" },
    { label: "Community", value: spiritual.community, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Address in Care", value: spiritual.addressInCare, icon: MapPin, color: "text-teal-400", bg: "bg-teal-400/10" },
  ];

  return (
    <HalcyonPortal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 !m-0 !p-0 z-[99999999] flex items-center justify-center p-6 overflow-hidden"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" />

        {/* Modal */}
        <div
          className="relative w-full max-w-xl flex flex-col bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-6 border-b border-[var(--card-border)] shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Wind className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">
                  Spiritual History (FICA)
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    <Calendar className="w-3 h-3" />
                    Clinical Record
                  </span>
                  {spiritual.religiousPreference && (
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest border border-indigo-500/20">
                      {spiritual.religiousPreference}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-indigo-500/40 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar">
            <div className="grid grid-cols-1 gap-4">
              {fica.map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 hover:border-indigo-500/20 transition-all">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg ${item.bg} flex items-center justify-center`}>
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{item.label}</p>
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">
                    {item.value || "Not specified during assessment."}
                  </p>
                </div>
              ))}
            </div>

            {spiritual.clergyContact && (
              <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Clergy Contact</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">{spiritual.clergyContact}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-[var(--card-border)] shrink-0 flex items-center justify-between">
            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Halcyon Clinical OS · Holistic Care
            </p>
            <button
              onClick={onClose}
              className="px-8 py-2 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
