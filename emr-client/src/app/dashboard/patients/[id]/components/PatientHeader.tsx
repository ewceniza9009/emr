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
  MessageSquare,
  AlertTriangle,
  Video,
} from "lucide-react";
import dynamic from "next/dynamic";
import { PermissionGate } from "@/components/PermissionGate";
import { UsePatientDashboardStateReturn } from "../hooks/usePatientDashboardState";
import { CareThreadChat } from "./CareThreadChat";

const TelehealthModal = dynamic(() => import("@/components/TelehealthModal"));

interface PatientHeaderProps {
  state: UsePatientDashboardStateReturn;
}

export function PatientHeader({ state }: PatientHeaderProps) {
  const [showTelehealth, setShowTelehealth] = React.useState(false);
  const {
    patientId,
    patient,
    vitals,
    isEmergency,
    setShowBenefitClaim,
    handleDownloadDossier,
    downloadingDossier,
    setShowEmergencyDrawer,
    session,
  } = state;

  if (!patient) return null;

  const isAdmin = session?.user?.role === "Admin" || (session?.user as any)?.roles?.includes("Admin");
  
  const isPrimaryNavigator = 
    patient?.primaryCareNavigatorName && 
    session?.user?.name && 
    session.user.name.toLowerCase() === patient.primaryCareNavigatorName.toLowerCase();
    
  const isDispatched = 
    patient?.encounters?.some(
      (e: any) => e.practitioner?.practitionerId === (session?.user as any)?.practitionerId
    ) || false;

  const canChat = isAdmin || isPrimaryNavigator || isDispatched;

  return (
    <div className="relative z-[60] flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--card-border)] pb-4 shrink-0">
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
          <div className="group relative flex items-center justify-center hover:z-[60]">
            <button
              onClick={() => setShowBenefitClaim(true)}
              className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all flex items-center justify-center p-0 active:scale-95"
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-200 z-50 flex flex-col items-center">
              <div className="w-1.5 h-1.5 bg-slate-950 border-l border-t border-slate-800/80 rotate-45 -mb-1 shrink-0 z-10" />
              <div className="bg-slate-950 border border-slate-800/80 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap">
                Tag Z-Benefit Plan
              </div>
            </div>
          </div>
        </PermissionGate>
        <PermissionGate permission="clinical:assessments">
          <div className="group relative flex items-center justify-center hover:z-[60]">
            <Link
              href={`/dashboard/patients/${patientId}/assessment/new`}
              className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500/20 transition-all flex items-center justify-center p-0 active:scale-95"
            >
              <ClipboardList className="w-5 h-5 shrink-0" />
            </Link>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-200 z-50 flex flex-col items-center">
              <div className="w-1.5 h-1.5 bg-slate-950 border-l border-t border-slate-800/80 rotate-45 -mb-1 shrink-0 z-10" />
              <div className="bg-slate-950 border border-slate-800/80 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap">
                Start Clinical Assessment
              </div>
            </div>
          </div>
        </PermissionGate>
        {canChat && <CareThreadChat patientId={patientId} />}
        <div className="group relative flex items-center justify-center hover:z-[60]">
          <button
            onClick={() => setShowTelehealth(true)}
            className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all flex items-center justify-center p-0 active:scale-95 animate-pulse"
          >
            <Video className="w-5 h-5 shrink-0" />
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-200 z-50 flex flex-col items-center">
            <div className="w-1.5 h-1.5 bg-slate-950 border-l border-t border-slate-800/80 rotate-45 -mb-1 shrink-0 z-10" />
            <div className="bg-slate-950 border border-slate-800/80 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap">
              Launch Telehealth Visit
            </div>
          </div>
        </div>
        <PermissionGate permission="docs:view">
          <div className="group relative flex items-center justify-center hover:z-[60]">
            <button
              onClick={handleDownloadDossier}
              disabled={downloadingDossier}
              className="w-10 h-10 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-400 hover:bg-slate-500/20 transition-all flex items-center justify-center p-0 disabled:opacity-50 active:scale-95"
            >
              {downloadingDossier ? (
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              ) : (
                <FileText className="w-5 h-5 shrink-0" />
              )}
            </button>
            <div className="absolute top-full right-0 mt-2.5 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-200 z-50 flex flex-col items-end">
              <div className="w-1.5 h-1.5 bg-slate-950 border-l border-t border-slate-800/80 rotate-45 -mb-1 shrink-0 z-10 mr-[17px]" />
              <div className="bg-slate-950 border border-slate-800/80 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap">
                {downloadingDossier ? "Generating Dossier..." : "Download Clinical Dossier"}
              </div>
            </div>
          </div>
        </PermissionGate>
        <PermissionGate permission="clinical:order">
          <div className="group relative flex items-center justify-center hover:z-[60]">
            <button
              onClick={() => setShowEmergencyDrawer(true)}
              className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center p-0 active:scale-95 ${
                isEmergency
                  ? "bg-red-600 border border-transparent text-white shadow-lg shadow-red-600/30 animate-pulse ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950"
                  : "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20"
              }`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </button>
            <div className="absolute top-full right-0 mt-2.5 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-200 z-50 flex flex-col items-end">
              <div className={`w-1.5 h-1.5 border-l border-t rotate-45 -mb-1 shrink-0 z-10 mr-[17px] ${
                isEmergency 
                  ? "bg-red-950 border-red-800/80" 
                  : "bg-slate-950 border-slate-800/80"
              }`} />
              <div className={`border text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap ${
                isEmergency 
                  ? "bg-red-950 border-red-800/80 text-red-400" 
                  : "bg-slate-950 border-slate-800/80"
              }`}>
                {isEmergency ? "Emergency Protocol Active" : "Trigger Emergency Action"}
              </div>
            </div>
          </div>
        </PermissionGate>
      </div>

      <TelehealthModal
        isOpen={showTelehealth}
        onClose={() => setShowTelehealth(false)}
        patientName={`${patient.firstName} ${patient.lastName}`}
      />
    </div>
  );
}
