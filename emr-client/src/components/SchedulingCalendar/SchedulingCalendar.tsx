"use client";

import React from "react";
import { Clock } from "lucide-react";
import BookingDrawer from "../BookingDrawer";
import ReassignmentBookingDrawer from "../ReassignmentBookingDrawer";
import { useToast } from "../ToastProvider";
import { useSchedulingState } from "./hooks/useSchedulingState";
import CalendarHeader from "./components/CalendarHeader";
import CalendarSkeleton from "./components/CalendarSkeleton";
import RecalculateModal from "./components/RecalculateModal";
import MonthView from "./components/MonthView";
import DayColumn from "./components/DayColumn";
import { Appointment, ScheduleBlock } from "./types";

export default function SchedulingCalendar() {
  const { showToast } = useToast();
  const state = useSchedulingState();

  if (state.loading && !state.localAppointments.length && !state.localBlocks.length) {
    return <CalendarSkeleton />;
  }

  const viewedPractitionerId =
    state.selectedPractitioners.size === 1
      ? Array.from(state.selectedPractitioners)[0]
      : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col text-[var(--text-primary)] gap-3 overflow-hidden">
      {/* 1. Header ribbon controls */}
      <CalendarHeader
        view={state.view}
        setView={state.setView}
        anchor={state.anchor}
        setAnchor={state.setAnchor}
        monthLabel={state.monthLabel}
        loading={state.loading}
        refetch={state.refetch}
        setDrawerOpen={state.setDrawerOpen}
        apiPositions={state.apiPositions}
        selectedPositions={state.selectedPositions}
        togglePosition={state.togglePosition}
        practitioners={state.practitioners}
        selectedPractitioners={state.selectedPractitioners}
        setSelectedPractitioners={state.setSelectedPractitioners}
        setSelectedPositions={state.setSelectedPositions}
      />

      {/* 2. Calendar Grid */}
      <div className="flex-1 min-h-0 bg-[var(--background)] rounded-2xl border border-[var(--card-border)] flex flex-col overflow-hidden relative">
        {state.view === "month" ? (
          <MonthView
            monthDates={state.monthDates}
            anchor={state.anchor}
            visibleAppointments={state.visibleAppointments}
            visibleBlocks={state.visibleBlocks}
            expandedMonthDay={state.expandedMonthDay}
            setExpandedMonthDay={state.setExpandedMonthDay}
            dragOverDate={state.dragOverDate}
            setDragOverDate={state.setDragOverDate}
            handleDrop={state.handleDrop}
            draggingDurationRef={state.draggingDurationRef}
            draggingAppointmentIdRef={state.draggingAppointmentIdRef}
            draggingTravelTimeRef={state.draggingTravelTimeRef}
            onCardClick={(apptId) => {
              state.setReassignApptId(apptId);
              state.setReassignOpen(true);
            }}
            DAYS={state.GRID_CONFIG.DAYS}
          />
        ) : (
          <>
            {/* Header Columns Row */}
            <div className="grid grid-cols-[80px_1fr] bg-[var(--card-bg)] border-b border-slate-200 dark:border-white/10 shrink-0 sticky top-0 z-[60] backdrop-blur-md">
              <div className="flex items-center justify-center border-r border-slate-200 dark:border-white/10">
                <Clock className="w-4 h-4 text-[var(--text-muted)] opacity-50" />
              </div>
              <div
                className="grid divide-x divide-slate-200 dark:divide-white/10"
                style={{
                  gridTemplateColumns: `repeat(${state.view === "week" ? 7 : Math.max(1, state.displayPractitioners.length)}, minmax(0, 1fr))`,
                }}
              >
                {state.view === "week"
                  ? state.weekDates.map((date, i) => {
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                        <div
                          key={i}
                          className={`flex flex-col items-center py-2.5 transition-all relative ${isToday ? "bg-[var(--primary)]/[0.05]" : ""}`}
                        >
                          {isToday && (
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--primary)] shadow-sm shadow-[var(--primary-glow)]" />
                          )}
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className={`text-[9px] font-black uppercase tracking-[0.2em] ${isToday ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
                            >
                              {state.GRID_CONFIG.DAYS[i]}
                            </span>
                            <span
                              className={`text-base font-black tracking-tighter ${isToday ? "text-[var(--primary)] scale-110" : "text-[var(--text-primary)]"} transition-transform`}
                            >
                              {date.getDate()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  : state.displayPractitioners.map((p: any) => (
                      <div
                        key={p.practitionerId}
                        className="flex flex-col items-center justify-center py-2 transition-all relative"
                      >
                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                          {p.position}
                        </span>
                        <span className="text-sm font-black text-[var(--text-primary)] tracking-tight truncate w-full text-center px-2">
                          {p.firstName} {p.lastName}
                        </span>
                      </div>
                    ))}
              </div>
            </div>

            {/* Scrollable Time Ribbon and Grid Body */}
            <div ref={state.scrollRef} className="flex-1 overflow-y-auto scrollbar-hide relative">
              <div
                className="flex"
                style={{
                  height: `${(state.GRID_CONFIG.END_HOUR - state.GRID_CONFIG.START_HOUR) * state.GRID_CONFIG.ROW_HEIGHT}px`,
                }}
              >
                {/* Time Sidebar column */}
                <div className="w-[80px] border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[var(--input-bg)] sticky left-0 z-50">
                  {state.HOURS.map((h) => (
                    <div
                      key={h}
                      className="h-[80px] relative border-t border-slate-200 dark:border-white/10 first:border-t-0"
                    >
                      <span className="absolute top-0 left-0 right-0 text-center text-[10px] text-[var(--text-muted)] font-bold tracking-tight pt-1.5">
                        {h % 12 || 12} {h < 12 ? "AM" : "PM"}
                      </span>
                    </div>
                  ))}
                  <div className="h-0 border-t border-slate-200 dark:border-white/10" />
                </div>

                {/* Day/Practitioner Columns grid */}
                <div
                  className="flex-1 grid relative divide-x divide-slate-200 dark:divide-white/10"
                  style={{
                    gridTemplateColumns: `repeat(${state.view === "week" ? 7 : Math.max(1, state.displayPractitioners.length)}, minmax(0, 1fr))`,
                  }}
                >
                  {(state.view === "week" ? state.weekDates : state.displayPractitioners).map(
                    (colItem: any) => {
                      let dayAppts: Appointment[] = [];
                      let dayBlocks: ScheduleBlock[] = [];
                      let targetDate: Date;

                      if (state.view === "week") {
                        const d = colItem as Date;
                        targetDate = d;
                        dayAppts = state.visibleAppointments.filter(
                          (a) => new Date(a.scheduledStart).toDateString() === d.toDateString()
                        );
                        dayBlocks = state.visibleBlocks.filter(
                          (b) => new Date(b.startTime).toDateString() === d.toDateString()
                        );
                      } else {
                        const p = colItem as any;
                        targetDate = state.anchor;
                        dayAppts = state.visibleAppointments.filter((a) => {
                          if (new Date(a.scheduledStart).toDateString() !== state.anchor.toDateString()) {
                            return false;
                          }
                          const primaryId = (a.practitionerId || a.practitioner?.practitionerId || "").toLowerCase();
                          const pId = p.practitionerId.toLowerCase();
                          const isPrimary = primaryId === pId;
                          const isSupporting = a.supportingClinicians?.some(
                            (sc) => sc.practitionerId?.toLowerCase() === pId
                          );
                          const isEncounter =
                            a.encounters?.[0]?.practitioner?.practitionerId?.toLowerCase() === pId;
                          return isPrimary || isSupporting || isEncounter;
                        });
                        dayBlocks = state.visibleBlocks.filter((b) => {
                          if (new Date(b.startTime).toDateString() !== state.anchor.toDateString()) {
                            return false;
                          }
                          const bId = (b.practitionerId || b.practitioner?.practitionerId || "").toLowerCase();
                          return bId === p.practitionerId.toLowerCase();
                        });
                      }

                      dayAppts = dayAppts.sort(
                        (a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
                      );

                      return (
                        <DayColumn
                          key={state.view === "week" ? (colItem as Date).toISOString() : (colItem as any).practitionerId}
                          colItem={colItem}
                          view={state.view}
                          targetDate={targetDate}
                          dayAppts={dayAppts}
                          dayBlocks={dayBlocks}
                          GRID_CONFIG={state.GRID_CONFIG}
                          HOURS={state.HOURS}
                          conflicts={state.conflicts}
                          dragOverColKey={state.dragOverColKey}
                          dragOverTime={state.dragOverTime}
                          dragOverConflict={state.dragOverConflict}
                          setDragOverColKey={state.setDragOverColKey}
                          setDragOverTime={state.setDragOverTime}
                          setDragOverConflict={state.setDragOverConflict}
                          getDropTimeFromEvent={state.getDropTimeFromEvent}
                          checkTimeConflict={state.checkTimeConflict}
                          handleDrop={state.handleDrop}
                          draggingDurationRef={state.draggingDurationRef}
                          draggingAppointmentIdRef={state.draggingAppointmentIdRef}
                          draggingTravelTimeRef={state.draggingTravelTimeRef}
                          viewedPractitionerId={viewedPractitionerId}
                          onCardClick={(apptId) => {
                            state.setReassignApptId(apptId);
                            state.setReassignOpen(true);
                          }}
                          onDeleteBlock={(blockId) =>
                            state.deleteBlock({
                              variables: { id: blockId },
                            })
                          }
                          setConfirmModal={state.setConfirmModal}
                          showToast={showToast}
                        />
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Booking Drawer */}
      <BookingDrawer
        key={state.drawerPrefill}
        open={state.drawerOpen}
        onClose={() => state.setDrawerOpen(false)}
        onBooked={() => state.refetch()}
        prefillDate={state.drawerPrefill}
        appointmentId={state.drawerPrefill?.length === 36 ? state.drawerPrefill : undefined}
      />

      {/* 4. Reassignment Drawer */}
      {state.reassignApptId && (
        <ReassignmentBookingDrawer
          open={state.reassignOpen}
          onClose={() => state.setReassignOpen(false)}
          onSuccess={() => state.refetch()}
          appointmentId={state.reassignApptId}
          userRoles={(state.session?.user as any)?.roles || []}
        />
      )}

      {/* 5. Confirmation Recalculate Modal */}
      <RecalculateModal
        confirmModal={state.confirmModal}
        onClose={() => state.setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
