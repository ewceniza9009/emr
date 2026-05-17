import React from "react";
import {
  HeartPulse, Navigation, Brain, Sun, Wind, Timer, HeartHandshake
} from "lucide-react";
import { AssessmentCategory } from "./types";

export const monthNames = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

export const ASSESSMENT_OPTIONS: AssessmentCategory[] = [
  {
    category: "Symptom and Pain",
    icon: React.createElement(HeartPulse, { className: "w-4 h-4" }),
    items: [
      { id: "ESAS", label: "ESAS", fullName: "Edmonton Symptom Assessment", description: "Pain, tiredness, nausea, appetite, well-being" },
      { id: "BPI", label: "BPI", fullName: "Brief Pain Inventory", description: "Pain severity and impact on functions" },
      { id: "MSAS", label: "MSAS", fullName: "Memorial Symptom Scale", description: "Physical and psychological symptom burden" },
      { id: "VICTORIA_BOWEL", label: "Victoria Bowel", fullName: "Victoria Bowel Scale", description: "Assessment of constipation severity" },
    ]
  },
  {
    category: "Functional Status",
    icon: React.createElement(Navigation, { className: "w-4 h-4" }),
    items: [
      { id: "PPS", label: "PPS", fullName: "Palliative Performance Scale", description: "Ambulation, self-care, and intake" },
      { id: "KPS", label: "KPS", fullName: "Karnofsky Performance Scale", description: "Functional impairment classification" },
      { id: "ECOG", label: "ECOG", fullName: "ECOG Performance Status", description: "Impact of disease on daily living" },
      { id: "FAST", label: "FAST", fullName: "Functional Assessment Staging", description: "Alzheimer's and dementia progression" },
    ]
  },
  {
    category: "Psychological & Cognitive",
    icon: React.createElement(Brain, { className: "w-4 h-4" }),
    items: [
      { id: "HADS", label: "HADS", fullName: "Hospital Anxiety & Depression", description: "Detecting anxiety and depression states" },
      { id: "PHQ9", label: "PHQ-9", fullName: "Patient Health Questionnaire-9", description: "Screening and measuring depression severity" },
      { id: "MMSE_MOCA", label: "MMSE/MoCA", fullName: "Mini-Mental / MoCA", description: "Cognitive impairment assessment" },
    ]
  },
  {
    category: "Quality of Life",
    icon: React.createElement(Sun, { className: "w-4 h-4" }),
    items: [
      { id: "MQOL", label: "MQOL", fullName: "McGill Quality of Life", description: "Physical, psychological, existential domains" },
      { id: "FACIT_PAL", label: "FACIT-Pal", description: "Palliative-specific well-being concerns" },
    ]
  },
  {
    category: "Spiritual & Existential",
    icon: React.createElement(Wind, { className: "w-4 h-4" }),
    items: [
      { id: "FICA", label: "FICA", fullName: "FICA Spiritual History", description: "Faith, Importance, Community, Address" },
      { id: "HOPE", label: "HOPE", fullName: "HOPE Questions", description: "Hope, Organized religion, Practices, Effects" },
    ]
  },
  {
    category: "Prognostic Indices",
    icon: React.createElement(Timer, { className: "w-4 h-4" }),
    items: [
      { id: "PPI", label: "PPI", fullName: "Palliative Prognostic Index", description: "Survival prediction based on PPS and clinicals" },
      { id: "PAP", label: "PaP", fullName: "Palliative Prognostic Score", description: "KPS and survival prediction markers" },
    ]
  },
  {
    category: "Caregiver Assessment",
    icon: React.createElement(HeartHandshake, { className: "w-4 h-4" }),
    items: [
      { id: "ZBI", label: "ZBI", fullName: "Zarit Burden Interview", description: "Family caregiver stress and strain" },
      { id: "CSI", label: "CSI", fullName: "Caregiver Strain Index", description: "Physical, financial, and emotional stress" },
    ]
  }
];
