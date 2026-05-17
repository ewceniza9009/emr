import React from "react";
import { Users, Shield, Stethoscope, Zap, Home, Building2, Video, Activity } from "lucide-react";

export const POSITION_STYLE: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  nurse: {
    label: "Nurse",
    color: "text-[var(--primary)]",
    bg: "bg-[var(--primary)]/5",
    border: "border-[var(--primary)]/20",
    icon: React.createElement(Users, { className: "w-3.5 h-3.5" }),
  },
  physician: {
    label: "Physician",
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: React.createElement(Shield, { className: "w-3.5 h-3.5" }),
  },
  practitioner: {
    label: "Practitioner",
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: React.createElement(Stethoscope, { className: "w-3.5 h-3.5" }),
  },
  admin: {
    label: "Admin",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: React.createElement(Zap, { className: "w-3.5 h-3.5" }),
  },
};

export const getModalityConfig = (modalityStr: string) => {
  if (!modalityStr)
    return { icon: React.createElement(Activity, { className: "w-3 h-3" }), label: "UNKNOWN" };
  const m = modalityStr.toUpperCase();
  if (m.includes("HOME"))
    return { icon: React.createElement(Home, { className: "w-3 h-3" }), label: "HOME VISIT" };
  if (m.includes("FACILITY"))
    return { icon: React.createElement(Building2, { className: "w-3 h-3" }), label: "FACILITY" };
  if (m.includes("TELEHEALTH") || m.includes("VIDEO"))
    return { icon: React.createElement(Video, { className: "w-3 h-3" }), label: "TELEHEALTH" };
  if (m.includes("TELEPHONE"))
    return { icon: React.createElement(Activity, { className: "w-3 h-3" }), label: "TELEPHONE" };
  return {
    icon: React.createElement(Activity, { className: "w-3 h-3" }),
    label: modalityStr.replace(/_/g, " "),
  };
};

export const getStatusConfig = (statusStr: string) => {
  if (!statusStr)
    return {
      label: "SCHED",
      bg: "bg-[var(--input-bg)]",
      border: "border-[var(--card-border)]",
      text: "text-[var(--text-muted)]",
      dot: "bg-[var(--text-muted)]/40",
      isLive: false,
    };

  // Normalize: IN_PROGRESS -> INPROGRESS
  const s = statusStr.toUpperCase().replace(/[^A-Z]/g, "");

  if (["INPROGRESS", "ARRIVED", "STARTED", "LIVE"].includes(s))
    return {
      label: "LIVE",
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/40",
      text: "text-emerald-700",
      dot: "bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]",
      isLive: true,
    };
  if (s.includes("HOLD"))
    return {
      label: "HOLD",
      bg: "bg-amber-500/15",
      border: "border-amber-500/40",
      text: "text-amber-700",
      dot: "bg-amber-500 shadow-[0_0_10px_#fbbf24]",
      isLive: false,
    };
  if (s.includes("COMPLETE") || s === "DONE")
    return {
      label: "DONE",
      bg: "bg-blue-500/15",
      border: "border-blue-500/40",
      text: "text-blue-700",
      dot: "bg-blue-500 shadow-[0_0_10px_#60a5fa]",
      isLive: false,
    };
  if (s.includes("CANCEL"))
    return {
      label: "CANC",
      bg: "bg-rose-500/15",
      border: "border-rose-500/40",
      text: "text-rose-700",
      dot: "bg-rose-500 shadow-[0_0_10px_#f43f5e]",
      isLive: false,
    };

  return {
    label: "SCHED",
    bg: "bg-[var(--input-bg)]",
    border: "border-[var(--card-border)]",
    text: "text-[var(--text-muted)]",
    dot: "bg-[var(--text-muted)]/40",
    isLive: false,
  };
};

export const isVisitMoveLocked = (statusStr?: string | null) => {
  const statusConfig = getStatusConfig(statusStr || "");
  return statusConfig.isLive || statusConfig.label === "DONE";
};
