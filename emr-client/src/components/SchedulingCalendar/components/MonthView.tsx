import React from "react";
import { Plus, Shield, Clock } from "lucide-react";
import { getStatusConfig } from "../constants";
import AppointmentCard from "./AppointmentCard";
import BusyBlockCard from "./BusyBlockCard";
import { Appointment, ScheduleBlock } from "../types";

interface MonthViewProps {
  monthDates: Date[];
  anchor: Date;
  visibleAppointments: Appointment[];
  visibleBlocks: ScheduleBlock[];
  expandedMonthDay: Date | null;
  setExpandedMonthDay: (date: Date | null) => void;
  dragOverDate: Date | null;
  setDragOverDate: (date: Date | null) => void;
  handleDrop: (e: React.DragEvent, date: Date) => void;
  draggingDurationRef: React.MutableRefObject<number>;
  draggingAppointmentIdRef: React.MutableRefObject<string | null>;
  draggingTravelTimeRef: React.MutableRefObject<number>;
  onCardClick: (apptId: string) => void;
  DAYS: string[];
}

export default function MonthView({
  monthDates,
  anchor,
  visibleAppointments,
  visibleBlocks,
  expandedMonthDay,
  setExpandedMonthDay,
  dragOverDate,
  setDragOverDate,
  handleDrop,
  draggingDurationRef,
  draggingAppointmentIdRef,
  draggingTravelTimeRef,
  onCardClick,
  DAYS,
}: MonthViewProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-7 bg-[var(--card-bg)] border-b border-slate-200 dark:border-white/10 shrink-0 sticky top-0 z-[60] backdrop-blur-md">
        {DAYS.map((day, i) => (
          <div
            key={i}
            className="py-2.5 text-center text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] border-r border-slate-200 dark:border-white/10 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-200 dark:divide-white/10 bg-[var(--card-bg)]/30 min-h-0">
        {monthDates.map((d, i) => {
          const isCurrentMonth = d.getMonth() === anchor.getMonth();
          const isToday = d.toDateString() === new Date().toDateString();
          const dayAppts = visibleAppointments
            .filter((a) => new Date(a.scheduledStart).toDateString() === d.toDateString())
            .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
          const dayBlocks = visibleBlocks
            .filter((b) => new Date(b.startTime).toDateString() === d.toDateString())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          return (
            <div
              key={i}
              className={`p-1.5 flex flex-col gap-1 transition-colors relative ${
                !isCurrentMonth ? "opacity-40 bg-[var(--input-bg)]/30" : ""
              } ${
                dragOverDate?.toDateString() === d.toDateString()
                  ? "bg-[var(--primary)]/15 ring-2 ring-[var(--primary)] shadow-[0_0_25px_var(--primary-glow)]"
                  : "hover:bg-[var(--input-bg)]"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverDate(d);
              }}
              onDrop={(e) => {
                handleDrop(e, d);
                setDragOverDate(null);
              }}
            >
              <div className="flex items-center justify-between px-1 mb-1">
                <span
                  className={`text-xs font-bold ${isToday ? "bg-[var(--primary)] text-white w-5 h-5 rounded-full flex items-center justify-center" : "text-[var(--text-primary)]"}`}
                >
                  {d.getDate()}
                </span>
                {(dayAppts.length > 0 || dayBlocks.length > 0) && (
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold">
                    {dayAppts.length + dayBlocks.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {dayBlocks.slice(0, 2).map((block) => {
                  const start = new Date(block.startTime);
                  const durMin = (new Date(block.endTime).getTime() - new Date(block.startTime).getTime()) / 60000;
                  return (
                    <BusyBlockCard
                      key={block.blockId}
                      block={block}
                      layoutMode="list"
                      durMin={durMin}
                      blockHour={start.getHours()}
                      blockMinute={start.getMinutes()}
                      draggingDurationRef={draggingDurationRef}
                      draggingAppointmentIdRef={draggingAppointmentIdRef}
                      onDeleteBlock={() => {}}
                      setConfirmModal={() => {}}
                    />
                  );
                })}
                {dayAppts
                  .slice(0, Math.max(0, 4 - Math.min(2, dayBlocks.length)))
                  .map((appt) => {
                    return (
                      <AppointmentCard
                        key={appt.appointmentId}
                        appt={appt}
                        layoutMode="list"
                        viewedPractitionerId={null}
                        hasConflict={false}
                        GRID_CONFIG={{
                          START_HOUR: 8,
                          END_HOUR: 17,
                          ROW_HEIGHT: 80,
                          TIMEZONE: "UTC",
                        }}
                        draggingDurationRef={draggingDurationRef}
                        draggingAppointmentIdRef={draggingAppointmentIdRef}
                        draggingTravelTimeRef={draggingTravelTimeRef}
                        onCardClick={() => onCardClick(appt.appointmentId)}
                      />
                    );
                  })}
                {dayAppts.length + dayBlocks.length > 4 && (
                  <div
                    className="text-[10px] text-[var(--text-muted)] font-bold text-center mt-0.5 hover:text-[var(--primary)] cursor-pointer transition-colors"
                    onClick={() => setExpandedMonthDay(d)}
                  >
                    +{dayAppts.length + dayBlocks.length - 4} more
                  </div>
                )}
              </div>

              {/* Floating Popover for Expanded Day */}
              {expandedMonthDay?.toDateString() === d.toDateString() && (
                <div
                  className={`absolute top-0 min-w-[240px] max-w-[320px] max-h-[400px] bg-[var(--card-bg)] shadow-2xl rounded-2xl border border-[var(--card-border)] z-[200] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${i % 7 === 0 ? "left-0" : i % 7 === 6 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--card-border)] bg-[var(--input-bg)]/50 shrink-0 sticky top-0 backdrop-blur-sm z-10">
                    <span
                      className={`text-sm font-black ${isToday ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}
                    >
                      {d.toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMonthDay(null);
                      }}
                      className="w-6 h-6 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-[var(--text-muted)] transition-colors"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
                    {dayBlocks.map((block) => {
                      const start = new Date(block.startTime);
                      const durMin = (new Date(block.endTime).getTime() - new Date(block.startTime).getTime()) / 60000;
                      return (
                        <div
                          key={block.blockId}
                          draggable
                          onDragStart={(e) => {
                            draggingDurationRef.current = durMin;
                            draggingAppointmentIdRef.current = null;
                            draggingTravelTimeRef.current = 0;
                            e.dataTransfer.setData("blockId", block.blockId);
                            e.dataTransfer.setData("duration", durMin.toString());
                            setExpandedMonthDay(null);
                          }}
                          className={`text-xs px-2 py-1.5 rounded truncate border bg-[var(--input-bg)]/80 border-[var(--card-border)] text-[var(--text-muted)] flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-[var(--input-bg)]`}
                        >
                          <Shield className="w-3.5 h-3.5 opacity-50" />
                          <span className="font-bold">
                            {start.getHours() % 12 || 12}:
                            {start.getMinutes().toString().padStart(2, "0")}
                          </span>
                          <span className="truncate">Unavailable</span>
                        </div>
                      );
                    })}
                    {dayAppts.map((appt) => {
                      const statusConfig = getStatusConfig(appt.status);
                      const start = new Date(appt.scheduledStart);
                      return (
                        <div
                          key={appt.appointmentId}
                          draggable
                          onDragStart={(e) => {
                            const isLocked = appt.status === "DONE" || appt.status === "LIVE";
                            if (isLocked) {
                              e.preventDefault();
                              return;
                            }
                            const durMin = (new Date(appt.scheduledEnd).getTime() - new Date(appt.scheduledStart).getTime()) / 60000;
                            draggingDurationRef.current = durMin;
                            draggingAppointmentIdRef.current = appt.appointmentId;
                            e.dataTransfer.setData("appointmentId", appt.appointmentId);
                            e.dataTransfer.setData("duration", durMin.toString());
                            setExpandedMonthDay(null);
                          }}
                          onClick={() => {
                            if (statusConfig.label === "DONE") return;
                            onCardClick(appt.appointmentId);
                            setExpandedMonthDay(null);
                          }}
                          className={`text-xs px-2 py-1.5 rounded cursor-pointer border flex flex-col gap-1 ${statusConfig.label === "DONE" ? "opacity-60 cursor-default" : "hover:-translate-y-[1px] hover:shadow-md"} transition-all ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-bold shrink-0">
                                {start.getHours() % 12 || 12}:
                                {start.getMinutes().toString().padStart(2, "0")}
                                {start.getHours() >= 12 ? "pm" : "am"}
                              </span>
                              <span className="truncate font-semibold text-[var(--text-primary)]">
                                {appt.patient?.firstName} {appt.patient?.lastName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between opacity-90 pl-[52px]">
                            <span className="text-[10px] truncate">
                              {appt.practitioner?.firstName} {appt.practitioner?.lastName}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-widest font-mono">
                                {statusConfig.label}
                              </span>
                              <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {dragOverDate?.toDateString() === d.toDateString() && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-xl shadow-2xl shadow-[var(--primary-glow)] border border-[var(--primary)]/50 font-black text-xs tracking-wider animate-in fade-in zoom-in-95 duration-150">
                    Drop Here
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
