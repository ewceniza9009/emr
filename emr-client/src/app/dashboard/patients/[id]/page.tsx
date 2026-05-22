"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Activity,
  History,
  Calendar,
  Truck,
  CheckCircle2,
  ShieldAlert,
  Lock as LockIcon,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/PermissionGate";

// Hooks & Sub-components
import { usePatientDashboardState } from "./hooks/usePatientDashboardState";
import { PatientHeader } from "./components/PatientHeader";
import { CoreIdentityCard } from "./components/CoreIdentityCard";
import { ClinicalSnapshotTab } from "./components/ClinicalSnapshotTab";
import { ActivityLogTab } from "./components/ActivityLogTab";
import { VisitScheduleTab } from "./components/VisitScheduleTab";
import { LogisticsFleetTab } from "./components/LogisticsFleetTab";
import { CoordinationRecordsTab } from "./components/CoordinationRecordsTab";
import { EncounterDetailModal } from "./components/EncounterDetailModal";

// Dynamic Drawers & Modals
const BookingDrawer = dynamic(() => import("@/components/BookingDrawer"));
const AddContactDrawer = dynamic(() => import("@/components/AddContactDrawer"));
const EditDemographicsDrawer = dynamic(() => import("@/components/EditDemographicsDrawer"));
const EditCommunicationsDrawer = dynamic(() => import("@/components/EditCommunicationsDrawer"));
const VisitSummaryDrawer = dynamic(() => import("@/components/VisitSummaryDrawer"));
const EmergencyActionDrawer = dynamic(() => import("@/components/EmergencyActionDrawer"));
const BreakGlassDrawer = dynamic(() => import("@/components/BreakGlassDrawer"));
const BenefitClaimDrawer = dynamic(() => import("@/components/BenefitClaimDrawer"));

export default function PatientDetailPage() {
  const state = usePatientDashboardState();

  const {
    patientId,
    patient,
    loading,
    error,
    refetch,
    activeTab,
    setActiveTab,
    drawerOpen,
    setDrawerOpen,
    showAddContact,
    setShowAddContact,
    showEditDemographics,
    setShowEditDemographics,
    showEditCommunications,
    setShowEditCommunications,
    editingContact,
    setEditingContact,
    summaryAppointmentId,
    setSummaryAppointmentId,
    isSummaryOpen,
    setIsSummaryOpen,
    showEmergencyDrawer,
    setShowEmergencyDrawer,
    isEmergency,
    setIsEmergency,
    showBreakGlass,
    setShowBreakGlass,
    showBenefitClaim,
    setShowBenefitClaim,
    refetchAppts,
  } = state;

  if (loading) {
    return (
      <div className="p-4 space-y-6 animate-in fade-in duration-700">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-80" />
              <div className="flex gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-48 opacity-50" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-36 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Col Skeletons */}
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-[2rem] shadow-lg shadow-white/5" />
            <Skeleton className="h-64 w-full rounded-[2rem] shadow-lg shadow-white/5" />
            <Skeleton className="h-48 w-full rounded-[2rem] shadow-lg shadow-white/5" />
          </div>
          {/* Main Content Skeleton */}
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-14 w-full max-w-2xl rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-[600px] w-full rounded-[2.5rem] shadow-xl shadow-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col gap-2">
          <div className="text-rose-500 font-black uppercase tracking-[0.4em] flex items-center gap-3 text-lg">
            <ShieldAlert className="w-6 h-6" />
            Security Access Violation
          </div>
          <div className="h-1 w-32 bg-rose-500/20 rounded-full" />
        </div>

        <div className="p-8 bg-slate-950 border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
            <LockIcon className="w-64 h-64" />
          </div>

          <div className="relative z-10 space-y-6 max-w-2xl">
            <h3 className="text-xl font-bold text-white tracking-tight uppercase">
              Patient record is restricted
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your current session does not have an active clinical assignment
              for this patient. To protect patient privacy, full chart access is
              restricted to the assigned Care Team.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-3">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Option 01
                </div>
                <h4 className="text-xs font-black text-white uppercase italic">
                  Contact Care Coordination
                </h4>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Request to be added to the Care Navigation Team for this
                  patient via the Registry Manager.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col gap-3">
                <div className="text-xs font-black text-rose-500 uppercase tracking-widest">
                  Option 02 (Emergency)
                </div>
                <h4 className="text-xs font-black text-rose-400 uppercase italic">
                  Activate Break-Glass Protocol
                </h4>
                <p className="text-[10px] text-rose-500/60 leading-normal">
                  Override restrictions immediately with mandatory forensic
                  justification and auditing.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-6">
              <button
                onClick={() => setShowBreakGlass(true)}
                className="px-8 py-3 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition-all flex items-center gap-3 active:scale-95"
              >
                <Zap className="w-4 h-4" />
                Initialize Emergency Bypass
              </button>

              <Link
                href="/dashboard/patients"
                className="px-8 py-3 rounded-xl bg-white/[0.05] text-slate-400 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all"
              >
                Return to Registry
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl max-w-fit">
          <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
            Diagnostic Payload: {error.message}
          </p>
        </div>

        <BreakGlassDrawer
          open={showBreakGlass}
          onClose={() => setShowBreakGlass(false)}
          onSuccess={() => refetch()}
        />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-10 text-[var(--text-primary)] font-black uppercase tracking-widest">
        Patient record not found in registry.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700 h-full flex flex-col">
      {/* Header Section */}
      <PatientHeader state={state} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
        {/* Left Column: Bio Snapshot */}
        <CoreIdentityCard state={state} />

        {/* Center/Right Column: High-Density Clinical Tabs */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-0.5 p-1 bg-slate-200/50 dark:bg-neutral-900/60 backdrop-blur-md rounded-full border border-slate-300/40 dark:border-neutral-800/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] w-fit flex-wrap">
            <button
              onClick={() => setActiveTab("snapshot")}
              className={`relative px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group/tab border border-transparent active:scale-95
                           ${activeTab === "snapshot" 
                             ? "bg-white dark:bg-white/10 text-[var(--primary)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] border-slate-200/50 dark:border-white/5" 
                             : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-white/[0.02]"}`}
            >
              <Activity className={`w-3.5 h-3.5 transition-colors ${activeTab === "snapshot" ? "text-[var(--primary)]" : "text-slate-400 dark:text-neutral-500 group-hover/tab:text-slate-700 dark:group-hover/tab:text-neutral-300"}`} />
              <span>Clinical Snapshot</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`relative px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group/tab border border-transparent active:scale-95
                           ${activeTab === "history" 
                             ? "bg-white dark:bg-white/10 text-[var(--primary)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] border-slate-200/50 dark:border-white/5" 
                             : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-white/[0.02]"}`}
            >
              <History className={`w-3.5 h-3.5 transition-colors ${activeTab === "history" ? "text-[var(--primary)]" : "text-slate-400 dark:text-neutral-500 group-hover/tab:text-slate-700 dark:group-hover/tab:text-neutral-300"}`} />
              <span>Historical Activity</span>
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`relative px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group/tab border border-transparent active:scale-95
                           ${activeTab === "activity" 
                             ? "bg-white dark:bg-white/10 text-[var(--primary)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] border-slate-200/50 dark:border-white/5" 
                             : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-white/[0.02]"}`}
            >
              <Calendar className={`w-3.5 h-3.5 transition-colors ${activeTab === "activity" ? "text-[var(--primary)]" : "text-slate-400 dark:text-neutral-500 group-hover/tab:text-slate-700 dark:group-hover/tab:text-neutral-300"}`} />
              <span>Visit Schedule</span>
            </button>
            <button
              onClick={() => setActiveTab("logistics")}
              className={`relative px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group/tab border border-transparent active:scale-95
                           ${activeTab === "logistics" 
                             ? "bg-white dark:bg-white/10 text-[var(--primary)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] border-slate-200/50 dark:border-white/5" 
                             : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-white/[0.02]"}`}
            >
              <Truck className={`w-3.5 h-3.5 transition-colors ${activeTab === "logistics" ? "text-[var(--primary)]" : "text-slate-400 dark:text-neutral-500 group-hover/tab:text-slate-700 dark:group-hover/tab:text-neutral-300"}`} />
              <span>Logistics & Fleet</span>
            </button>
            <button
              onClick={() => setActiveTab("coordination")}
              className={`relative px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group/tab border border-transparent active:scale-95
                           ${activeTab === "coordination" 
                             ? "bg-white dark:bg-white/10 text-[var(--primary)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] border-slate-200/50 dark:border-white/5" 
                             : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-white/[0.02]"}`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 transition-colors ${activeTab === "coordination" ? "text-[var(--primary)]" : "text-slate-400 dark:text-neutral-500 group-hover/tab:text-slate-700 dark:group-hover/tab:text-neutral-300"}`} />
              <span>Coordination & Records</span>
            </button>
          </div>

          <div className="min-h-[600px]">
            {activeTab === "snapshot" && <ClinicalSnapshotTab state={state} />}
            {activeTab === "history" && <ActivityLogTab state={state} />}
            {activeTab === "activity" && <VisitScheduleTab state={state} />}
            {activeTab === "logistics" && <LogisticsFleetTab state={state} />}
            {activeTab === "coordination" && <CoordinationRecordsTab state={state} />}
          </div>
        </div>
      </div>

      {/* Booking Drawer */}
      <BookingDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          refetchAppts();
        }}
        onBooked={() => {
          setDrawerOpen(false);
          refetchAppts();
        }}
        patientId={patientId}
      />

      {/* Add Contact Drawer */}
      <AddContactDrawer
        isOpen={showAddContact}
        onClose={() => {
          setShowAddContact(false);
          setEditingContact(null);
        }}
        onSuccess={async () => {
          await refetch();
          setShowAddContact(false);
          setEditingContact(null);
        }}
        patientId={patientId}
        initialData={editingContact}
        existingPoaFile={
          editingContact
            ? (patient.documents || []).find(
                (d: any) =>
                  d.patientContactId === editingContact.patientContactId &&
                  (d.documentType === "POA" ||
                    d.title?.toUpperCase().includes("POA")),
              )?.title
            : undefined
        }
      />

      {/* Edit Identity Drawers */}
      <EditDemographicsDrawer
        open={showEditDemographics}
        onClose={() => setShowEditDemographics(false)}
        onSuccess={() => refetch()}
        patient={patient}
      />
      <EditCommunicationsDrawer
        open={showEditCommunications}
        onClose={() => setShowEditCommunications(false)}
        onSuccess={() => refetch()}
        patient={patient}
      />

      {/* Visit Summary Drawer */}
      <VisitSummaryDrawer
        isOpen={isSummaryOpen}
        onClose={() => {
          setIsSummaryOpen(false);
          setSummaryAppointmentId(null);
        }}
        patientId={patientId}
        appointmentId={summaryAppointmentId ?? ""}
      />

      {/* Emergency Drawer */}
      <EmergencyActionDrawer
        open={showEmergencyDrawer}
        onClose={() => setShowEmergencyDrawer(false)}
        patient={patient}
        onEscalate={() => setIsEmergency(true)}
      />

      {/* Break Glass restricted bypass */}
      <BreakGlassDrawer
        open={showBreakGlass}
        onClose={() => setShowBreakGlass(false)}
        onSuccess={() => refetch()}
      />

      {/* Z-Benefit tagger */}
      <BenefitClaimDrawer
        open={showBenefitClaim}
        onClose={() => setShowBenefitClaim(false)}
        initialData={{ patientId }}
        onSuccess={() => {
          setShowBenefitClaim(false);
          refetch();
        }}
      />

      {/* Encounter Detail Modal */}
      <EncounterDetailModal state={state} />
    </div>
  );
}
