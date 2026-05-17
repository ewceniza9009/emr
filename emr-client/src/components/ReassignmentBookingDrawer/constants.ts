import React from "react";
import {
  HeartPulse,
  Navigation,
  Brain,
  Sun,
  Wind,
  Timer,
  HeartHandshake,
  Activity,
  Home,
  Building2,
  Video,
  Phone,
} from "lucide-react";

export const ASSESSMENT_OPTIONS = [
  {
    category: "Symptom and Pain",
    icon: React.createElement(HeartPulse, { className: "w-3.5 h-3.5" }),
    items: [
      { id: "ESAS", label: "ESAS" },
      { id: "BPI", label: "BPI" },
      { id: "MSAS", label: "MSAS" },
      { id: "VICTORIA_BOWEL", label: "Victoria Bowel" },
    ],
  },
  {
    category: "Functional Status",
    icon: React.createElement(Navigation, { className: "w-3.5 h-3.5" }),
    items: [
      { id: "PPS", label: "PPS" },
      { id: "KPS", label: "KPS" },
      { id: "ECOG", label: "ECOG" },
      { id: "FAST", label: "FAST" },
    ],
  },
  {
    category: "Psychological & Cognitive",
    icon: React.createElement(Brain, { className: "w-3.5 h-3.5" }),
    items: [
      { id: "HADS", label: "HADS" },
      { id: "PHQ9", label: "PHQ-9" },
      { id: "MMSE_MOCA", label: "MMSE/MoCA" },
    ],
  },
  {
    category: "Quality of Life",
    icon: React.createElement(Sun, { className: "w-3.5 h-3.5" }),
    items: [
      { id: "MQOL", label: "MQOL" },
      { id: "FACIT_PAL", label: "FACIT-Pal" },
    ],
  },
  {
    category: "Spiritual & Existential",
    icon: React.createElement(Wind, { className: "w-3.5 h-3.5" }),
    items: [
      { id: "FICA", label: "FICA" },
      { id: "HOPE", label: "HOPE" },
    ],
  },
  {
    category: "Prognostic Indices",
    icon: React.createElement(Timer, { className: "w-3.5 h-3.5" }),
    items: [
      { id: "PPI", label: "PPI" },
      { id: "PAP", label: "PaP" },
    ],
  },
  {
    category: "Caregiver Assessment",
    icon: React.createElement(HeartHandshake, { className: "w-3.5 h-3.5" }),
    items: [
      { id: "ZBI", label: "ZBI" },
      { id: "CSI", label: "CSI" },
    ],
  },
];

export const getModalityConfig = (modalityStr: string) => {
  if (!modalityStr)
    return { icon: React.createElement(Activity, { className: "w-4 h-4" }), label: "UNKNOWN" };
  const m = modalityStr.toUpperCase();
  if (m.includes("HOME"))
    return { icon: React.createElement(Home, { className: "w-4 h-4" }), label: "HOME VISIT" };
  if (m.includes("FACILITY"))
    return { icon: React.createElement(Building2, { className: "w-4 h-4" }), label: "FACILITY" };
  if (m.includes("TELEHEALTH") || m.includes("VIDEO"))
    return { icon: React.createElement(Video, { className: "w-4 h-4" }), label: "TELEHEALTH" };
  if (m.includes("TELEPHONE"))
    return { icon: React.createElement(Phone, { className: "w-4 h-4" }), label: "TELEPHONE" };
  return {
    icon: React.createElement(Activity, { className: "w-4 h-4" }),
    label: modalityStr.replace(/_/g, " "),
  };
};

export const isAppointmentInProgress = (statusStr?: string | null) => {
  if (!statusStr) return false;
  const normalizedStatus = statusStr.toUpperCase().replace(/[^A-Z]/g, "");
  return ["INPROGRESS", "ARRIVED", "STARTED", "LIVE"].includes(
    normalizedStatus,
  );
};
