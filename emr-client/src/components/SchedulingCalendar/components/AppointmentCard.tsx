import React from "react";
import { 
  ClipboardList, 
  MapPin, 
  ChevronRight, 
  Navigation,
  Clock
} from "lucide-react";
import { getModalityConfig, getStatusConfig, POSITION_STYLE, isVisitMoveLocked } from "../constants";
import { Appointment } from "../types";

interface AppointmentCardProps {
  appt: Appointment;
  layoutMode: "absolute" | "list";
  viewedPractitionerId: string | null;
  hasConflict: boolean;
  GRID_CONFIG: {
    START_HOUR: number;
    END_HOUR: number;
    ROW_HEIGHT: number;
    TIMEZONE: string;
  };
  leftPct?: number;
  widthPct?: number;
  topPx?: number;
  heightPx?: number;
  durMin?: number;
  startMin?: number;
  draggingDurationRef: React.MutableRefObject<number>;
  draggingAppointmentIdRef: React.MutableRefObject<string | null>;
  draggingTravelTimeRef: React.MutableRefObject<number>;
  onCardClick: () => void;
}

export default function AppointmentCard({
  appt,
  layoutMode,
  viewedPractitionerId,
  hasConflict,
  GRID_CONFIG,
  leftPct = 0,
  widthPct = 100,
  topPx = 0,
  heightPx = 80,
  durMin = 60,
  startMin = 0,
  draggingDurationRef,
  draggingAppointmentIdRef,
  draggingTravelTimeRef,
  onCardClick,
}: AppointmentCardProps) {
  const style = POSITION_STYLE[appt.practitioner?.position.toLowerCase() || "nurse"] ?? POSITION_STYLE.nurse;
  const start = new Date(appt.scheduledStart);
  const modality = getModalityConfig(appt.modality);
  const statusConfig = getStatusConfig(appt.status);
  const isMoveLocked = isVisitMoveLocked(appt.status);
  const driveMin = appt.travelTimeMinutes || 0;

  const isViewedAsSc =
    !!viewedPractitionerId &&
    viewedPractitionerId !== appt.practitionerId &&
    appt.supportingClinicians?.some((sc) => sc.practitionerId === viewedPractitionerId);

  const isViewedAsAttending =
    !!viewedPractitionerId &&
    viewedPractitionerId !== appt.practitionerId &&
    appt.encounters?.[0]?.practitioner?.practitionerId === viewedPractitionerId;

  if (layoutMode === "list") {
    return (
      <div
        draggable={!isMoveLocked}
        onDragStart={(e) => {
          if (isMoveLocked) {
            e.preventDefault();
            return;
          }
          const duration = (new Date(appt.scheduledEnd).getTime() - new Date(appt.scheduledStart).getTime()) / 60000;
          draggingDurationRef.current = duration;
          draggingAppointmentIdRef.current = appt.appointmentId;
          draggingTravelTimeRef.current = appt.travelTimeMinutes || 0;
          e.dataTransfer.setData("appointmentId", appt.appointmentId);
          e.dataTransfer.setData("duration", duration.toString());
        }}
        onClick={onCardClick}
        className={`text-[10px] px-1.5 py-1 rounded cursor-pointer border flex flex-col gap-0.5 ${statusConfig.label === "DONE" ? "opacity-60 cursor-default" : "hover:-translate-y-[1px] hover:shadow-md"} transition-all ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 truncate">
            <span className="font-bold shrink-0">
              {start.getHours() % 12 || 12}:
              {start.getMinutes().toString().padStart(2, "0")}
              {start.getHours() >= 12 ? "p" : "a"}
            </span>
            <span className="truncate font-semibold text-[var(--text-primary)]">
              {appt.patient?.firstName} {appt.patient?.lastName}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between opacity-80">
          <span className="text-[8px] truncate">
            {appt.practitioner?.firstName} {appt.practitioner?.lastName}
          </span>
          <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      {/* Redesigned Glassmorphic Travel Time Indicator */}
      {driveMin > 0 && modality.label !== "TELEHEALTH" && !isViewedAsSc && (
        <div
          className="absolute z-10 overflow-visible"
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            top: `${(startMin - driveMin) * (GRID_CONFIG.ROW_HEIGHT / 60)}px`,
            height: `${driveMin * (GRID_CONFIG.ROW_HEIGHT / 60)}px`,
            minHeight: "28px",
          }}
        >
          {/* Connector Line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400/30 rounded-full" />

          {/* Tactical Glass Badge */}
          <div className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[var(--card-bg)]/80 backdrop-blur-md border border-[var(--card-border)] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] group/travel transition-all hover:bg-[var(--card-bg)]">
            <div className="w-5 h-5 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Navigation className="w-3 h-3 text-indigo-500 fill-indigo-500/20" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">
                {driveMin}m Transit
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                Clinical Vector
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        className={`absolute z-20 hover:z-[100] group ${hasConflict ? "ring-2 ring-red-500" : ""} ${statusConfig.isLive ? "ring-2 ring-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.2)]" : ""} ${statusConfig.label === "DONE" ? "opacity-60 grayscale-[0.5] pointer-events-none sm:pointer-events-auto" : ""}`}
        style={{
          top: `${topPx}px`,
          height: `${heightPx}px`,
          left: `${leftPct + 0.5}%`,
          width: `${widthPct - 1}%`,
        }}
      >
        <div
          onClick={onCardClick}
          {...(!isMoveLocked ? { draggable: true } : {})}
          onDragStart={(e) => {
            if (isMoveLocked) {
              e.preventDefault();
              return;
            }
            draggingDurationRef.current = durMin;
            draggingAppointmentIdRef.current = appt.appointmentId;
            e.dataTransfer.setData("appointmentId", appt.appointmentId);
            e.dataTransfer.setData("duration", durMin.toString());
          }}
          className={`absolute top-0 left-0 right-0 h-full group-hover:h-auto p-2 border shadow-md transition-all duration-300 ease-out flex flex-col ${statusConfig.label === "DONE" ? "cursor-default select-none" : isMoveLocked ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} overflow-hidden z-10 group-hover:shadow-2xl group-hover:translate-y-[-4px] backdrop-blur-[2px]
                ${
                  isViewedAsAttending
                    ? "bg-sky-500/10 border-sky-400 group-hover:bg-[var(--card-bg)] group-hover:border-sky-500"
                    : isViewedAsSc
                      ? "bg-indigo-500/10 border-indigo-300 group-hover:bg-[var(--card-bg)] group-hover:border-indigo-500"
                      : style.bg.replace("/5", "/10") +
                        " " +
                        style.border +
                        " group-hover:bg-[var(--card-bg)] group-hover:shadow-2xl"
                } group-hover:border-[var(--primary)]/40`}
        >
          {/* Header Section */}
          <div className="flex flex-nowrap items-center justify-between shrink-0 mb-1 gap-1">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <div
                className={`px-2 py-1 ${isViewedAsAttending ? "bg-sky-500/10 border-sky-400/20" : isViewedAsSc ? "bg-indigo-500/10 border-indigo-400/20" : "bg-[var(--input-bg)] border-[var(--card-border)]"} text-[10px] font-bold flex items-center gap-1 shrink-0`}
                title={modality.label}
              >
                {React.cloneElement(modality.icon as React.ReactElement, {
                  className: `w-3 h-3 ${isViewedAsAttending ? "text-sky-400" : isViewedAsSc ? "text-indigo-400" : "text-[var(--primary)]"}`,
                })}
              </div>
              {appt.plannedAssessments && appt.plannedAssessments.length > 0 && (
                <div
                  className={`px-2 py-1 ${isViewedAsAttending ? "bg-sky-500/10 border-sky-400/20 text-sky-400" : isViewedAsSc ? "bg-indigo-500/10 border-indigo-400/20 text-indigo-400" : "bg-[var(--primary)]/15 border-[var(--primary)]/30 text-[var(--primary)]"} text-[9px] font-black flex items-center gap-1.5 shadow-sm shrink-0`}
                  title={`${appt.plannedAssessments.length} Assessments Planned`}
                >
                  <ClipboardList className="w-2.5 h-2.5" />
                  <span>{appt.plannedAssessments.length}</span>
                </div>
              )}
              <div
                className={`px-2 py-1 ${isViewedAsAttending ? "bg-sky-500/20 border-sky-400/30 text-sky-400" : isViewedAsSc ? "bg-indigo-500/20 border-indigo-400/30 text-indigo-400" : statusConfig.bg + " " + statusConfig.border + " " + statusConfig.text} text-[10px] font-bold flex items-center gap-1 border shadow-sm shrink-0`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isViewedAsAttending ? "bg-sky-400" : isViewedAsSc ? "bg-indigo-400" : statusConfig.dot}`}
                />
                <span className="whitespace-nowrap uppercase tracking-widest">
                  {isViewedAsAttending
                    ? "PERFORMED"
                    : isViewedAsSc
                      ? "SUPPORTING"
                      : statusConfig.label}
                </span>
              </div>
            </div>
            <span
              className={`text-xs font-bold ${isViewedAsAttending ? "text-sky-400" : isViewedAsSc ? "text-indigo-400" : "text-[var(--text-primary)]"} shrink-0 ml-auto whitespace-nowrap`}
            >
              {start.getHours() % 12 || 12}:
              {start.getMinutes().toString().padStart(2, "0")}
            </span>
          </div>

          {/* Patient Data */}
          <div className="flex flex-col mb-1">
            <p className="clinical-label mb-1">Patient</p>
            <h4
              className={`text-base font-black ${isViewedAsAttending ? "text-sky-400" : isViewedAsSc ? "text-indigo-400" : "text-[var(--text-primary)]"} tracking-tight group-hover:text-[var(--primary)] transition-colors leading-tight`}
            >
              {appt.patient?.firstName} {appt.patient?.lastName}
            </h4>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin
                className={`w-3 h-3 ${isViewedAsAttending ? "text-sky-500/50" : isViewedAsSc ? "text-indigo-500/50" : "text-[var(--text-muted)]"}`}
              />
              <p
                className={`text-[10px] ${isViewedAsAttending ? "text-sky-400/70" : isViewedAsSc ? "text-indigo-400/70" : "text-[var(--text-muted)]"} font-bold leading-tight line-clamp-1 uppercase tracking-wider`}
              >
                {appt.patient?.addresses?.[0]?.address?.street || "No address recorded"}
              </p>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <p className="clinical-label">
                {isViewedAsAttending ? "Performed By" : "Clinical Lead"}
              </p>
              <p
                className={`text-xs font-semibold ${isViewedAsAttending ? "text-sky-400/90" : isViewedAsSc ? "text-indigo-400/90" : "text-[var(--text-primary)]"}`}
              >
                {isViewedAsAttending && appt.encounters?.[0]?.practitioner
                  ? `${appt.encounters[0].practitioner.firstName} ${appt.encounters[0].practitioner.lastName}`
                  : `${appt.practitioner?.firstName} ${appt.practitioner?.lastName}`}
              </p>
            </div>
          </div>

          {/* Detailed Hover Info */}
          <div className="hidden group-hover:flex flex-col gap-4 mt-2 pb-4 border-t border-[var(--card-border)] pt-4 animate-in fade-in slide-in-from-top-1 duration-300">
            {isViewedAsAttending && (
              <div className="flex flex-col gap-1">
                <p className="clinical-label">Scheduled Lead</p>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  {appt.practitioner?.firstName} {appt.practitioner?.lastName}
                </p>
              </div>
            )}
            {appt.supportingClinicians && appt.supportingClinicians.length > 0 && !isViewedAsAttending && (
              <div className="flex flex-col gap-1">
                <p className="clinical-label">Support Team</p>
                <div className="flex flex-col gap-1">
                  {appt.supportingClinicians.map((sc) => (
                    <p
                      key={sc.practitionerId}
                      className="text-xs font-semibold text-[var(--text-primary)]"
                    >
                      {sc.firstName} {sc.lastName}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Section */}
          <div className="mt-auto pt-2 border-t border-[var(--card-border)] flex items-center justify-between shrink-0">
            <div className="flex -space-x-2">
              {appt.practitionerId === viewedPractitionerId && (
                <div
                  className="w-7 h-7 bg-[var(--primary)] border-2 border-[var(--card-bg)] flex items-center justify-center text-[9px] font-bold text-white shadow-sm rounded-full"
                  title="You are the Primary Lead"
                >
                  YOU
                </div>
              )}
              {isViewedAsSc && (
                <div
                  className="w-7 h-7 bg-sky-600 border-2 border-[var(--card-bg)] flex items-center justify-center text-[9px] font-bold text-white shadow-sm rounded-full"
                  title="You are Supporting"
                >
                  SS
                </div>
              )}
              {isViewedAsAttending && (
                <div
                  className="w-7 h-7 bg-emerald-600 border-2 border-[var(--card-bg)] flex items-center justify-center text-[9px] font-bold text-white shadow-sm rounded-full"
                  title="You performed this encounter"
                >
                  AP
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
          </div>

          {hasConflict && (
            <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse" />
          )}
        </div>
      </div>
    </React.Fragment>
  );
}
