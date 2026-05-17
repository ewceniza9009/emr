"use client";

import React from "react";
import {
  X,
  Search,
  User,
  MapPin,
  Clock,
  Loader2,
  Navigation,
  Shield,
  Stethoscope,
  Users,
  Zap,
  Activity,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Check,
  Video,
} from "lucide-react";
import Link from "next/link";
import { PermissionGate } from "../PermissionGate";
import HalcyonPortal from "../Portal";
import { ReassignmentBookingDrawerProps } from "./types";
import useReassignmentState from "./hooks/useReassignmentState";
import ProviderCard from "./components/ProviderCard";
import {
  ASSESSMENT_OPTIONS,
  getModalityConfig,
  isAppointmentInProgress,
} from "./constants";

export default function ReassignmentBookingDrawer(
  props: ReassignmentBookingDrawerProps,
) {
  const { open, onClose, appointmentId } = props;
  const state = useReassignmentState(props);

  if (!open) return null;

  if (!state.canAccess) {
    return (
      <HalcyonPortal>
        <div className="fixed inset-0 z-[9999999] flex justify-end">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative h-full w-full max-w-[500px] bg-[var(--card-bg)] p-12 flex flex-col items-center justify-center text-center border-l border-[var(--card-border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Access Restricted
            </h2>
            <p className="mt-2 text-[var(--text-muted)]">
              You do not have the required permissions to reassign appointments.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-[var(--primary)] text-white rounded-lg shadow-lg shadow-[var(--primary-glow)]"
            >
              Close
            </button>
          </div>
        </div>
      </HalcyonPortal>
    );
  }

  const appointment = state.data?.appointment;
  const address = appointment?.patient?.addresses?.find(
    (a: any) => a.isPrimary,
  )?.address;
  const modalityConfig = getModalityConfig(appointment?.modality);
  const isInProgress = isAppointmentInProgress(appointment?.status);
  const isCompleted =
    appointment?.status?.toUpperCase().replace(/[^A-Z]/g, "") === "COMPLETED" ||
    appointment?.status?.toUpperCase().replace(/[^A-Z]/g, "") === "DONE";
  const isLocked = isInProgress || isCompleted;
  const updateDisabled = !state.selectedLeadId || state.updating || isLocked;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[1000] flex justify-end">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative h-full w-full max-w-[800px] bg-[var(--background)] shadow-2xl flex flex-col border-l border-[var(--card-border)] animate-in slide-in-from-right duration-300">
          <div className="p-4 bg-[var(--sidebar-bg)]/80 backdrop-blur-xl border-b border-[var(--card-border)] flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-md font-black text-[var(--text-primary)] uppercase tracking-tight">
                Modify Encounter Details
              </h2>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                Adjust clinical assignments and lifecycle
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isInProgress && appointment?.patient?.patientId && (
                <Link
                  href={`/dashboard/patients/${appointment.patient.patientId}/visit?appointmentId=${appointmentId}`}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center gap-2 animate-pulse"
                >
                  <Video className="w-3.5 h-3.5" />
                  Join Session
                </Link>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-[var(--primary)]/10 rounded-full transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            {/* Appointment Header Data */}
            <div className="p-3 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-sm">
                    <User className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">
                      Patient
                    </span>
                    <p className="text-sm font-black text-[var(--text-primary)] tracking-tight">
                      {appointment?.patient?.fullName || "Loading..."}
                    </p>
                  </div>
                </div>
                {appointment?.status && (
                  <div className="px-2.5 py-1 rounded-md border border-[var(--card-border)] bg-[var(--input-bg)] shadow-sm">
                    <span className="text-[9px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                      {appointment.status.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[var(--primary)]/60" />
                  <div>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">
                      Time Slot
                    </span>
                    <p className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5">
                      {appointment
                        ? new Date(appointment.scheduledStart).toLocaleString(
                            [],
                            { dateStyle: "medium", timeStyle: "short" },
                          )
                        : "..."}
                      {appointment?.scheduledEnd && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] font-black border border-[var(--primary)]/20">
                          {Math.round(
                            (new Date(appointment.scheduledEnd).getTime() -
                              new Date(appointment.scheduledStart).getTime()) /
                              60000,
                          )}
                          m
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[var(--primary)]/60" />
                  <div>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">
                      Location
                    </span>
                    <p className="text-[11px] font-bold text-[var(--text-secondary)] truncate mt-0.5">
                      {address ? `${address.street}, ${address.city}` : "..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Planned Assessments */}
            <div className="p-3 bg-[var(--input-bg)]/40 rounded-xl border border-[var(--card-border)] space-y-3">
              <div className="flex items-center gap-1.5">
                <ClipboardList className="w-3 h-3 text-[var(--primary)]" />
                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  Planned Assessments
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ASSESSMENT_OPTIONS.flatMap((cat) => cat.items).map((item) => {
                  const isSelected = state.plannedAssessments.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        state.setPlannedAssessments((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== item.id)
                            : [...prev, item.id],
                        );
                      }}
                      className={`px-2 py-1 rounded-md border text-[10px] font-bold transition-all ${
                        isSelected
                          ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 text-[var(--primary)]"
                          : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--primary)]/30 hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logistics & Current Assignments */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[var(--input-bg)]/40 rounded-xl border border-[var(--card-border)] space-y-2">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[var(--primary)]" />
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    Modality
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--primary)] shadow-sm">
                    {modalityConfig.icon}
                  </div>
                  <span className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-tight">
                    {modalityConfig.label}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[var(--input-bg)]/40 rounded-xl border border-[var(--card-border)] space-y-2">
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="w-3 h-3 text-[var(--primary)]" />
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    Current Lead
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] shadow-sm">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-[var(--text-primary)] truncate">
                      {appointment?.practitioner?.fullName || "..."}
                    </p>
                    <p className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                      {appointment?.practitioner?.position || "Clinician"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Team Readonly */}
            {appointment?.supportingClinicians?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                    Supporting Team
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appointment.supportingClinicians.map((sc: any) => (
                    <div
                      key={sc.practitionerId}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl"
                    >
                      <div className="w-5 h-5 rounded-md bg-[var(--input-bg)] flex items-center justify-center">
                        <User className="w-3 h-3 text-[var(--text-muted)]" />
                      </div>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                        {sc.fullName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
                  <Zap className="w-4 h-4 text-[var(--primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] animate-pulse">
                  Scanning clinical schedules...
                </span>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Care Navigators Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-[var(--primary)]">
                        02
                      </span>
                      <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">
                        Clinical Lead Assignment
                      </h3>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search Leads..."
                        value={state.leadSearch}
                        onChange={(e) => state.setLeadSearch(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full text-[10px] text-[var(--text-primary)] font-bold focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 transition-all placeholder:text-[var(--text-muted)]/50 w-48 shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {state.cns.map((p: any) => (
                      <ProviderCard
                        key={p.practitionerId}
                        p={p}
                        isSelected={state.selectedLeadId === p.practitionerId}
                        onClick={() => state.setSelectedLeadId(p.practitionerId)}
                        role="CN"
                      />
                    ))}
                  </div>
                </section>

                {/* Supporting Clinicians Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-sky-500">
                        03
                      </span>
                      <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">
                        Supporting Clinicians
                      </h3>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search Support..."
                        value={state.supportSearch}
                        onChange={(e) => state.setSupportSearch(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full text-[10px] text-[var(--text-primary)] font-bold focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 transition-all placeholder:text-[var(--text-muted)]/50 w-48 shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {state.scs.map((p: any) => {
                      const isSelected = state.selectedSupportIds.includes(
                        p.practitionerId,
                      );
                      return (
                        <ProviderCard
                          key={p.practitionerId}
                          p={p}
                          isSelected={isSelected}
                          onClick={() => {
                            state.setSelectedSupportIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== p.practitionerId)
                                : [...prev, p.practitionerId],
                            );
                          }}
                          role="SC"
                        />
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="p-4 bg-[var(--sidebar-bg)] border-t border-[var(--card-border)] space-y-4 shrink-0">
            {/* Encounter Actions */}
            <div className="grid grid-cols-3 gap-2">
              <PermissionGate permission="scheduling:manage">
                <button
                  type="button"
                  disabled={isLocked || state.statusUpdating}
                  onClick={state.handleComplete}
                  className={`p-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)] flex flex-col items-center justify-center gap-1 group transition-all ${
                    isLocked || state.statusUpdating
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-emerald-500/10 hover:border-emerald-500/30"
                  }`}
                  title={
                    isLocked ? "Appointment is already finalized." : undefined
                  }
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-emerald-500">
                    Done
                  </span>
                </button>
              </PermissionGate>

              <PermissionGate permission="scheduling:manage">
                <button
                  type="button"
                  disabled={isLocked || state.statusUpdating}
                  onClick={state.handleCancel}
                  className={`p-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)] flex flex-col items-center justify-center gap-1 group transition-all ${
                    isLocked || state.statusUpdating
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-rose-500/10 hover:border-rose-500/30"
                  }`}
                  title={
                    isLocked
                      ? "Cancel is disabled for active or completed visits."
                      : undefined
                  }
                >
                  <X className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-rose-500">
                    Cancel
                  </span>
                </button>
              </PermissionGate>

              <PermissionGate permission="scheduling:manage">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={state.handleDelete}
                  className={`p-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)] flex flex-col items-center justify-center gap-1 group transition-all ${
                    isLocked
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-red-600/20 hover:border-red-600/50"
                  }`}
                  title={
                    isLocked
                      ? "Delete is disabled for active or completed visits."
                      : undefined
                  }
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-red-600">
                    Delete
                  </span>
                </button>
              </PermissionGate>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--card-border)]">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  Team
                </span>
                <p className="text-[11px] font-black text-[var(--text-primary)] truncate max-w-[200px]">
                  Lead + {state.selectedSupportIds.length} Support
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-all"
                >
                  Close
                </button>
                <PermissionGate permission="scheduling:manage">
                  <button
                    disabled={updateDisabled}
                    onClick={state.handleUpdate}
                    className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg ${
                      updateDisabled
                        ? "bg-[var(--input-bg)] text-[var(--text-muted)] cursor-not-allowed opacity-50"
                        : "bg-[var(--primary)] text-white shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                    title={
                      isLocked
                        ? "Updates are disabled for active or completed visits."
                        : undefined
                    }
                  >
                    {state.updating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Confirm Update
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
          {state.booked && (
            <div className="absolute inset-0 bg-[var(--background)]/95 backdrop-blur-3xl z-[50] flex flex-col items-center justify-center animate-in fade-in duration-500 rounded-l-[2rem] overflow-hidden">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border-4 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <CheckCircle className="w-12 h-12 text-emerald-500 animate-in zoom-in duration-700" />
              </div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight mb-2 uppercase">
                Changes Confirmed
              </h2>
              <p className="text-emerald-500/80 font-bold tracking-widest uppercase text-xs">
                Clinical records synchronized successfully
              </p>
            </div>
          )}
        </div>
      </div>
    </HalcyonPortal>
  );
}
