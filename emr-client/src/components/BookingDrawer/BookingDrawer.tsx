"use client";

import React, { useState } from "react";
import { CheckCircle, Search, Calendar } from "lucide-react";
import HalcyonPortal from "../Portal";
import { Props } from "./types";
import { useBookingState } from "./hooks/useBookingState";
import { DrawerHeader } from "./components/DrawerHeader";
import { ServiceLocationPanel } from "./components/ServiceLocationPanel";
import { CalendarSelector } from "./components/CalendarSelector";
import { ClinicianSelectionPanel } from "./components/ClinicianSelectionPanel";
import { AssessmentsSelectionPanel } from "./components/AssessmentsSelectionPanel";
import { EncounterSummaryPanel } from "./components/EncounterSummaryPanel";

export default function BookingDrawer({
  open,
  onClose,
  onBooked,
  prefillDate,
  appointmentId,
  patientId: propPatientId
}: Props) {
  const [localPatientId, setLocalPatientId] = useState("");

  const state = useBookingState({
    open,
    onClose,
    onBooked,
    prefillDate,
    appointmentId,
    patientId: localPatientId,
    setPatientId: setLocalPatientId,
    propPatientId
  });

  if (!open) return null;

  const apptStatus = state.appointmentData?.appointment?.status || "";
  const isLocked = apptStatus.toUpperCase().includes("COMPLETED") || apptStatus.toUpperCase().includes("FINALIZED");

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[1000] flex justify-end">
        <div onClick={onClose} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
        <div className="relative w-full max-w-[1200px] h-full bg-[var(--background)] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-500">
          <DrawerHeader state={state} appointmentId={appointmentId} onClose={onClose} />

          <div className="flex-1 flex flex-row overflow-hidden">
            <div className="flex-1 flex flex-col border-r border-[var(--card-border)] bg-[var(--sidebar-bg)] overflow-hidden">
              <form id="appointment-form" onSubmit={state.handleSubmit} className="flex-1 overflow-y-auto p-6 pt-4 space-y-6 scrollbar-hide">
                <ServiceLocationPanel state={state} patientId={localPatientId} setPatientId={setLocalPatientId} />

                {!state.isBlockMode && (!localPatientId || !state.period) ? (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-[var(--text-muted)] opacity-30" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-muted)]">
                      {!localPatientId ? "Select a patient to begin scheduling" : "Choose a time slot to see available clinicians"}
                    </p>
                  </div>
                ) : (
                  <>
                    <ClinicianSelectionPanel state={state} />
                    {!state.isBlockMode && <AssessmentsSelectionPanel state={state} />}
                  </>
                )}
              </form>
            </div>

            {/* Encounter Summary Sidebar with embedded calendar picker */}
            <div className="w-[360px] flex flex-col bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] overflow-y-auto custom-scrollbar p-6 space-y-6 shrink-0">
              <CalendarSelector state={state} patientId={localPatientId} isLocked={isLocked} />
              <EncounterSummaryPanel
                state={state}
                appointmentId={appointmentId}
                isLocked={isLocked}
                bookingLoading={state.bookingLoading || state.blockLoading}
              />
            </div>
          </div>

          {state.booked && (
            <div className="absolute inset-0 bg-[var(--background)]/95 backdrop-blur-3xl z-[1000000] flex flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border-4 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <CheckCircle className="w-12 h-12 text-emerald-500 animate-in zoom-in duration-700" />
              </div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight mb-2 uppercase">Schedule Confirmed</h2>
              <p className="text-emerald-500/80 font-bold tracking-widest uppercase text-xs">Patient records synchronized successfully</p>
            </div>
          )}
        </div>
      </div>
    </HalcyonPortal>
  );
}
