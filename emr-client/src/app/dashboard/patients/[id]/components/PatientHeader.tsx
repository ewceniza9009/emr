"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  Wind,
  Thermometer,
  ShieldCheck,
  ClipboardList,
  FileText,
  Loader2,
} from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import { UsePatientDashboardStateReturn } from "../hooks/usePatientDashboardState";

interface PatientHeaderProps {
  state: UsePatientDashboardStateReturn;
}

export function PatientHeader({ state }: PatientHeaderProps) {
  const {
    patientId,
    patient,
    vitals,
    isEmergency,
    setShowBenefitClaim,
    handleDownloadDossier,
    downloadingDossier,
    setShowEmergencyDrawer,
  } = state;

  if (!patient) return null;

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--card-border)] pb-4 shrink-0">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/patients"
          className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight uppercase leading-none">
            {patient.firstName} {patient.lastName}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <p className="text-[var(--text-muted)] text-[9px] font-black tracking-[0.2em] uppercase">
              {patient.mrn} • {patient.biologicalSex}
            </p>
            <span className="w-1 h-1 rounded-full bg-[var(--card-border)] hidden sm:block" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/5 border border-rose-500/10">
                <Activity className="w-3 h-3 text-rose-500 animate-pulse" />
                <span className="text-[9px] font-black text-rose-500 uppercase">
                  {vitals.hr} BPM
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                <Wind className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-500 uppercase">
                  {vitals.spo2}% SpO2
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/5 border border-amber-500/10">
                <Thermometer className="w-3 h-3 text-amber-500" />
                <span className="text-[9px] font-black text-amber-500 uppercase">
                  {vitals.temp}°F
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all duration-500 ${
            isEmergency
              ? "bg-red-500/10 border-red-500/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              : "bg-emerald-500/10 border-emerald-500/20"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${isEmergency ? "bg-red-500" : "bg-emerald-500"}`}
          />
          <span
            className={`text-[9px] font-black uppercase tracking-widest ${isEmergency ? "text-red-500" : "text-emerald-500"}`}
          >
            Status: {isEmergency ? "Critical" : "Stable"}
          </span>
        </div>
        <PermissionGate permission="billing:manage">
          <button
            onClick={() => setShowBenefitClaim(true)}
            className="px-6 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Tag Z-Benefit
          </button>
        </PermissionGate>
        <PermissionGate permission="clinical:assessments">
          <Link
            href={`/dashboard/patients/${patientId}/assessment/new`}
            className="px-6 py-2 rounded-xl bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center gap-2 active:scale-95"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Clinical Assessment
          </Link>
        </PermissionGate>
        <PermissionGate permission="docs:view">
          <button
            onClick={handleDownloadDossier}
            disabled={downloadingDossier}
            className="px-6 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {downloadingDossier ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            Clinical Dossier
          </button>
        </PermissionGate>
        <PermissionGate permission="clinical:order">
          <button
            onClick={() => setShowEmergencyDrawer(true)}
            className={`px-6 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
              isEmergency
                ? "bg-red-600 shadow-red-600/30 animate-pulse ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950"
                : "bg-[var(--primary)] shadow-[var(--primary-glow)] hover:opacity-90"
            }`}
          >
            {isEmergency ? "Protocol Active" : "Emergency Action"}
          </button>
        </PermissionGate>
      </div>
    </div>
  );
}
