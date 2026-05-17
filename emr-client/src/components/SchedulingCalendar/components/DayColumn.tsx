import React from "react";
import { Clock } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import AppointmentCard from "./AppointmentCard";
import BusyBlockCard from "./BusyBlockCard";
import { CalendarView, GridConfig, Appointment, ScheduleBlock, ConfirmModalState } from "../types";

interface DayColumnProps {
  colItem: Date | any;
  view: CalendarView;
  targetDate: Date;
  dayAppts: Appointment[];
  dayBlocks: ScheduleBlock[];
  GRID_CONFIG: GridConfig;
  HOURS: number[];
  conflicts: Set<string>;
  dragOverColKey: string | null;
  dragOverTime: string | null;
  dragOverConflict: boolean;
  setDragOverColKey: (val: string | null) => void;
  setDragOverTime: (val: string | null) => void;
  setDragOverConflict: (val: boolean) => void;
  getDropTimeFromEvent: (e: React.DragEvent, d: Date) => Date;
  checkTimeConflict: (start: Date, end: Date, pracId?: string, exclId?: string) => boolean;
  handleDrop: (e: React.DragEvent, d: Date, pId?: string) => void;
  draggingDurationRef: React.MutableRefObject<number>;
  draggingAppointmentIdRef: React.MutableRefObject<string | null>;
  draggingTravelTimeRef: React.MutableRefObject<number>;
  viewedPractitionerId: string | null;
  onCardClick: (apptId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function DayColumn({
  colItem,
  view,
  targetDate,
  dayAppts,
  dayBlocks,
  GRID_CONFIG,
  HOURS,
  conflicts,
  dragOverColKey,
  dragOverTime,
  dragOverConflict,
  setDragOverColKey,
  setDragOverTime,
  setDragOverConflict,
  getDropTimeFromEvent,
  checkTimeConflict,
  handleDrop,
  draggingDurationRef,
  draggingAppointmentIdRef,
  draggingTravelTimeRef,
  viewedPractitionerId,
  onCardClick,
  onDeleteBlock,
  setConfirmModal,
  showToast,
}: DayColumnProps) {
  const colKey = view === "week" ? (colItem as Date).toISOString() : (colItem as any).practitionerId;
  const isDragOver = dragOverColKey === colKey;

  return (
    <div
      className={`relative transition-colors ${
        isDragOver
          ? dragOverConflict
            ? "bg-red-500/10 ring-2 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
            : "bg-[var(--primary)]/10 ring-2 ring-[var(--primary)] shadow-[0_0_30px_var(--primary-glow)]"
          : "hover:bg-[var(--input-bg)]"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverColKey(colKey);
        const dropStart = getDropTimeFromEvent(e, targetDate);
        const dropEnd = new Date(dropStart.getTime() + draggingDurationRef.current * 60000);
        const pracId = view === "team" ? (colItem as any).practitionerId : undefined;
        setDragOverTime(
          `${dropStart.getHours() % 12 || 12}:${dropStart.getMinutes().toString().padStart(2, "0")} ${dropStart.getHours() >= 12 ? "PM" : "AM"}`
        );
        setDragOverConflict(
          checkTimeConflict(dropStart, dropEnd, pracId, draggingAppointmentIdRef.current ?? undefined)
        );
      }}
      onDrop={(e) => {
        const dropStart = getDropTimeFromEvent(e, targetDate);
        const dropEnd = new Date(dropStart.getTime() + draggingDurationRef.current * 60000);
        const pracId = view === "team" ? (colItem as any).practitionerId : undefined;
        if (
          checkTimeConflict(dropStart, dropEnd, pracId, draggingAppointmentIdRef.current ?? undefined)
        ) {
          showToast("Time slot conflicts with an existing appointment or block.", "error");
          setDragOverColKey(null);
          setDragOverTime(null);
          setDragOverConflict(false);
          return;
        }
        handleDrop(e, targetDate, view === "team" ? colItem.practitionerId : undefined);
        setDragOverColKey(null);
        setDragOverTime(null);
        setDragOverConflict(false);
      }}
    >
      {HOURS.map((h) => (
        <div
          key={h}
          className="h-[80px] border-t border-slate-200 dark:border-white/10 first:border-t-0 relative"
        >
          <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-white/5" />
        </div>
      ))}
      <div className="h-0 border-t border-slate-200 dark:border-white/10" />

      {/* Busy Blocks */}
      {dayBlocks.map((block) => {
        const start = new Date(block.startTime);
        const end = new Date(block.endTime);

        const blockHour = parseInt(formatInTimeZone(start, GRID_CONFIG.TIMEZONE, "H"));
        const blockMinute = parseInt(formatInTimeZone(start, GRID_CONFIG.TIMEZONE, "m"));

        const startMin = (blockHour - GRID_CONFIG.START_HOUR) * 60 + blockMinute;
        const durMin = (end.getTime() - start.getTime()) / 60000;
        const topPx = startMin * (GRID_CONFIG.ROW_HEIGHT / 60);
        const heightPx = Math.min(
          durMin * (GRID_CONFIG.ROW_HEIGHT / 60),
          (GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR) * GRID_CONFIG.ROW_HEIGHT - topPx
        );

        return (
          <BusyBlockCard
            key={block.blockId}
            block={block}
            layoutMode="absolute"
            topPx={topPx}
            heightPx={heightPx}
            durMin={durMin}
            blockHour={blockHour}
            blockMinute={blockMinute}
            draggingDurationRef={draggingDurationRef}
            draggingAppointmentIdRef={draggingAppointmentIdRef}
            onDeleteBlock={onDeleteBlock}
            setConfirmModal={setConfirmModal}
          />
        );
      })}

      {/* Appointment Cards */}
      {dayAppts.map((appt) => {
        const start = new Date(appt.scheduledStart);
        const end = new Date(appt.scheduledEnd);
        const hasConflict = conflicts.has(appt.appointmentId);

        const hour = parseInt(formatInTimeZone(start, GRID_CONFIG.TIMEZONE, "H"));
        const minute = parseInt(formatInTimeZone(start, GRID_CONFIG.TIMEZONE, "m"));

        const startMin = (hour - GRID_CONFIG.START_HOUR) * 60 + minute;
        let durMin = (end.getTime() - start.getTime()) / 60000;

        const isViewedAsSc =
          viewedPractitionerId &&
          viewedPractitionerId !== appt.practitionerId &&
          appt.supportingClinicians?.some((sc) => sc.practitionerId === viewedPractitionerId);

        const isViewedAsAttending =
          viewedPractitionerId &&
          viewedPractitionerId !== appt.practitionerId &&
          appt.encounters?.[0]?.practitioner?.practitionerId === viewedPractitionerId;

        if (isViewedAsSc || isViewedAsAttending) {
          durMin = 15;
        }

        if (startMin < 0 || startMin / 60 + GRID_CONFIG.START_HOUR >= GRID_CONFIG.END_HOUR) {
          return null;
        }

        const topPx = startMin * (GRID_CONFIG.ROW_HEIGHT / 60);
        const heightPx = Math.min(
          durMin * (GRID_CONFIG.ROW_HEIGHT / 60),
          (GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR) * GRID_CONFIG.ROW_HEIGHT - topPx
        );

        if (durMin <= 0) return null;

        const overlaps = dayAppts.filter((other) => {
          if (other.appointmentId === appt.appointmentId) return false;
          const s1 = new Date(appt.scheduledStart).getTime(),
            e1 = new Date(appt.scheduledEnd).getTime();
          const s2 = new Date(other.scheduledStart).getTime(),
            e2 = new Date(other.scheduledEnd).getTime();
          return s1 < e2 && s2 < e1;
        });

        const overlapIdx =
          overlaps.length > 0
            ? dayAppts
                .filter((a) => {
                  const s1 = new Date(a.scheduledStart).getTime(),
                    e1 = new Date(a.scheduledEnd).getTime();
                  const s2 = new Date(appt.scheduledStart).getTime(),
                    e2 = new Date(appt.scheduledEnd).getTime();
                  return s1 < e2 && s2 < e1;
                })
                .indexOf(appt)
            : 0;

        const maxOverlapsInGroup = overlaps.length + 1;
        const widthPct = 100 / maxOverlapsInGroup;
        const leftPct = overlapIdx * widthPct;

        return (
          <AppointmentCard
            key={appt.appointmentId}
            appt={appt}
            layoutMode="absolute"
            viewedPractitionerId={viewedPractitionerId}
            hasConflict={hasConflict}
            GRID_CONFIG={GRID_CONFIG}
            leftPct={leftPct}
            widthPct={widthPct}
            topPx={topPx}
            heightPx={heightPx}
            durMin={durMin}
            startMin={startMin}
            draggingDurationRef={draggingDurationRef}
            draggingAppointmentIdRef={draggingAppointmentIdRef}
            draggingTravelTimeRef={draggingTravelTimeRef}
            onCardClick={() => onCardClick(appt.appointmentId)}
          />
        );
      })}

      {isDragOver && dragOverTime && (
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 z-50 mt-2 px-4 py-2 rounded-xl shadow-2xl font-black text-xs tracking-wider whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 border ${
            dragOverConflict
              ? "bg-red-500 text-white border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              : "bg-[var(--primary)] text-white border-[var(--primary)]/50 shadow-[var(--primary-glow)]"
          }`}
        >
          <Clock className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
          {dragOverTime} · {draggingDurationRef.current}m
          {dragOverConflict && <span className="ml-2">⚠ Conflict</span>}
        </div>
      )}
    </div>
  );
}
