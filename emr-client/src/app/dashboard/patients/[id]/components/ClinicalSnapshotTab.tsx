"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Activity, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UsePatientDashboardStateReturn } from "../hooks/usePatientDashboardState";

// Dynamic Clinical Components
const SymptomTrendChart = dynamic(
  () => import("@/components/SymptomTrendChart"),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
  },
);
const VitalsTrendChart = dynamic(
  () => import("@/components/VitalsTrendChart"),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
  },
);
const MedicationRegistry = dynamic(
  () => import("@/components/MedicationRegistry"),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
  },
);
const VitalSignTimeline = dynamic(
  () => import("@/components/VitalSignTimeline"),
  {
    loading: () => <Skeleton className="h-48 w-full" />,
  },
);
const ProblemList = dynamic(() => import("@/components/ProblemList"), {
  loading: () => <Skeleton className="h-40 w-full" />,
});
const AllergyRegistry = dynamic(() => import("@/components/AllergyRegistry"), {
  loading: () => <Skeleton className="h-24 w-full" />,
});

interface ClinicalSnapshotTabProps {
  state: UsePatientDashboardStateReturn;
}

export function ClinicalSnapshotTab({ state }: ClinicalSnapshotTabProps) {
  const { patientId, summaryData } = state;

  const vitalsVanes = summaryData?.patientClinicalSummary?.recentVitals?.slice(0, 5) || [
    { type: "Pain", value: "--", unit: "/10" },
    { type: "Anxiety", value: "--", unit: "/10" },
    { type: "BP", value: "--", unit: "mmHg" },
    { type: "SpO2", value: "--", unit: "%" },
    { type: "Weight", value: "--", unit: "kg" },
  ];

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {vitalsVanes.map((v: any, i: number) => (
          <div
            key={i}
            className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--card-border)] shadow-md"
          >
            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">
              {v.type}
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-lg font-black text-[var(--text-primary)] ${
                  v.type === "SpO2" ? "text-emerald-500" : ""
                }`}
              >
                {v.value}
              </span>
              <span className="text-[9px] font-black text-[var(--text-muted)]">
                {v.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <AllergyRegistry patientId={patientId} />
      <MedicationRegistry patientId={patientId} />
      <ProblemList patientId={patientId} />
      <VitalSignTimeline patientId={patientId} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--card-border)] shadow-xl">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tight mb-4">
            <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
            Symptom Trajectory (ESAS)
          </h2>
          <SymptomTrendChart patientId={patientId} />
        </div>

        <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--card-border)] shadow-xl">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tight mb-4">
            <Activity className="w-4 h-4 text-emerald-500" />
            Vital Signs Telemetry Trends
          </h2>
          <VitalsTrendChart patientId={patientId} />
        </div>
      </div>
    </div>
  );
}
