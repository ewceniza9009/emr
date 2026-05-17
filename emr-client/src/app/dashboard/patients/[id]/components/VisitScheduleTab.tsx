"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Plus, Clock, User, ClipboardList, MapPin, Stethoscope } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import { UsePatientDashboardStateReturn } from "../hooks/usePatientDashboardState";

interface VisitScheduleTabProps {
  state: UsePatientDashboardStateReturn;
}

export function VisitScheduleTab({ state }: VisitScheduleTabProps) {
  const {
    patientId,
    apptData,
    setDrawerOpen,
    setSummaryAppointmentId,
    setIsSummaryOpen,
  } = state;

  const appointments = [...(apptData?.appointments?.items || [])].sort(
    (a: any, b: any) =>
      new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime(),
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[var(--card-bg)] rounded-[1.5rem] p-6 border border-[var(--card-border)] shadow-xl min-h-[500px]">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-3">
            <Calendar className="w-4 h-4 text-[var(--primary)]" />
            Patient Visit Registry
          </h2>
          <PermissionGate permission="scheduling:manage">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Schedule Visit
            </button>
          </PermissionGate>
        </div>
        <div className="space-y-4">
          {appointments.length > 0 ? (
            appointments.map((appt: any) => {
              const statusUpper = appt.status?.toUpperCase() || "";
              const isActive = statusUpper.includes("PROGRESS") || statusUpper === "LIVE";
              const isDone = statusUpper.includes("COMPLETE") || statusUpper === "DONE";

              return (
                <div
                  key={appt.appointmentId}
                  className="p-6 rounded-[2rem] border border-[var(--card-border)] bg-[var(--input-bg)]/50 flex flex-col md:flex-row md:items-center justify-between hover:border-[var(--primary)]/30 transition-all gap-4 group"
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? "bg-[var(--primary)] text-white animate-pulse" : "bg-[var(--card-border)] text-[var(--text-muted)]"
                      }`}
                    >
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h4 className="text-sm font-black uppercase">
                          {new Date(appt.scheduledStart).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            isActive ? "bg-emerald-500 text-white" : "bg-[var(--card-border)] text-[var(--text-muted)]"
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(appt.scheduledStart).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                          <User className="w-3.5 h-3.5" />
                          {appt.practitioner
                            ? `${appt.practitioner.firstName} ${appt.practitioner.lastName}`
                            : "Unassigned"}
                        </span>
                      </div>
                      {(appt.visitType || appt.modality) && (
                        <div className="flex items-center gap-2 mt-2">
                          {appt.visitType && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-[8px] font-black uppercase tracking-wider">
                              <ClipboardList className="w-2.5 h-2.5" />
                              {appt.visitType.replace(/_/g, " ")}
                            </span>
                          )}
                          {appt.modality && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[8px] font-black uppercase tracking-wider">
                              <MapPin className="w-2.5 h-2.5" />
                              {appt.modality.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                    {isDone ? (
                      <PermissionGate permission="clinical:view">
                        <button
                          onClick={() => {
                            setSummaryAppointmentId(appt.appointmentId);
                            setIsSummaryOpen(true);
                          }}
                          className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95"
                        >
                          <ClipboardList className="w-4 h-4" /> View Summary
                        </button>
                      </PermissionGate>
                    ) : (
                      <PermissionGate permission="clinical:chart">
                        <Link
                          href={`/dashboard/patients/${patientId}/visit?appointmentId=${appt.appointmentId}`}
                          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95 ${
                            isActive
                              ? "bg-rose-500 text-white shadow-rose-500/30 animate-pulse hover:bg-rose-600"
                              : "bg-[var(--primary)] text-white shadow-[var(--primary-glow)] hover:opacity-90"
                          }`}
                        >
                          <Stethoscope className="w-4 h-4" />
                          {isActive ? "Join Session" : "Start Visit"}
                        </Link>
                      </PermissionGate>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] text-[var(--text-muted)] italic py-6">
              No appointments registered for this patient.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
