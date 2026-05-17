"use client";

import React from "react";
import HalcyonPortal from "../Portal";
import { Activity, AlertCircle } from "lucide-react";
import { useEnrollmentState } from "./hooks/useEnrollmentState";
import DrawerHeader from "./components/DrawerHeader";
import DrawerFooter from "./components/DrawerFooter";
import OutreachTab from "./tabs/OutreachTab";
import AdminTab from "./tabs/AdminTab";
import LegalTab from "./tabs/LegalTab";
import ClinicalTab from "./tabs/ClinicalTab";
import LogisticsTab from "./tabs/LogisticsTab";
import TelemetryPanel from "./panels/TelemetryPanel";

interface Props {
  open: boolean;
  onClose: () => void;
  outreachId: string | null;
}

export default function EnrollmentDrawer({ open, onClose, outreachId }: any) {
  const state = useEnrollmentState(outreachId, open);
  const { lead, leadLoading, activeTab, duplicateMatch } = state;

  if (!open) return null;

  return (
    <HalcyonPortal>
      <style jsx global>{`
        select option {
          background-color: var(--sidebar-bg, #121212) !important;
          color: var(--text-primary, #e2e8f0) !important;
        }
        select:focus option {
          background-color: var(--card-bg, #1a1a1a) !important;
        }
      `}</style>
      <div className="fixed inset-0 z-[9999999] flex justify-end">
        <div
          className="absolute inset-0 bg-black/10 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          className={`relative h-full bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] flex flex-col shadow-2xl transition-all duration-500 ease-in-out w-full max-w-[1100px]`}
        >
          {/* Enrollment Header */}
          <DrawerHeader state={state} lead={lead} onClose={onClose} />

          {/* Clinical Workspace */}
          <div className="flex-1 flex flex-row overflow-hidden">
            {leadLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[var(--primary)] animate-spin opacity-50" />
              </div>
            ) : !lead ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4 opacity-40">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">
                  Lead Not Found
                </p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                  Mission Aborted · Verify Registry ID
                </p>
              </div>
            ) : (
              <>
                {/* LEFT MAIN PANEL */}
                <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-6 scrollbar-hide border-r border-[var(--card-border)] bg-[var(--sidebar-bg)]">
                  {/* DUPLICATE CONFLICT ALERT */}
                  {duplicateMatch && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex items-center justify-between animate-in zoom-in-95 duration-500 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500">
                          <AlertCircle className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest leading-none">
                            Registry Conflict Detected
                          </p>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1.5 uppercase tracking-tight">
                            Patient already exists with MRN:{" "}
                            <span className="text-rose-500/80 font-black">
                              {duplicateMatch.mrn}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          state.router.push(
                            `/dashboard/patients/${duplicateMatch.patientId}`,
                          )
                        }
                        className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                      >
                        View Existing File
                      </button>
                    </div>
                  )}

                  {activeTab === "OUTREACH" && <OutreachTab state={state} />}
                  {activeTab === "LEGAL" && <LegalTab state={state} />}
                  {activeTab === "ADMIN" && <AdminTab state={state} />}
                  {activeTab === "CLINICAL" && <ClinicalTab state={state} />}
                  {activeTab === "LOGISTICS" && <LogisticsTab state={state} />}
                </div>

                {/* RIGHT TELEMETRY PANEL */}
                <TelemetryPanel state={state} />
              </>
            )}
          </div>

          {/* STICKY FOOTER CONTROLS */}
          {lead && <DrawerFooter state={state} />}
        </div>
      </div>
    </HalcyonPortal>
  );
}
