import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useToast } from "../../ToastProvider";
import { useSettings } from "@/lib/SettingsContext";
import { 
  GET_SCHEDULE_DATA, 
  RESCHEDULE_APPOINTMENT, 
  UPDATE_SCHEDULE_BLOCK, 
  DELETE_SCHEDULE_BLOCK 
} from "../queries";
import { isVisitMoveLocked } from "../constants";
import { CalendarView, GridConfig, Appointment, ScheduleBlock, Practitioner, ConfirmModalState } from "../types";

export function useSchedulingState() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const { tenantConfig } = useSettings();

  const GRID_CONFIG: GridConfig = useMemo(() => {
    const rawTz = tenantConfig.timezone || "UTC";
    const normalizedTz = rawTz.includes("(") ? rawTz.split("(")[0].trim() : rawTz;

    return {
      START_HOUR: tenantConfig.amStartHour,
      END_HOUR: tenantConfig.dayEndHour,
      TOTAL_MINUTES: (tenantConfig.dayEndHour - tenantConfig.amStartHour) * 60,
      ROW_HEIGHT: 80,
      DAYS: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      TIMEZONE: normalizedTz,
    };
  }, [tenantConfig]);

  const [anchor, setAnchor] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const monthLabel = useMemo(() => {
    return anchor.toLocaleString("default", { month: "long", year: "numeric" });
  }, [anchor]);

  const formatTimezoneISO = (
    date: Date,
    hours: number,
    mins: number,
    secs: number,
  ) => {
    const d = new Date(date);
    d.setHours(hours, mins, secs, 0);
    return d.toISOString();
  };

  const [view, setView] = useState<CalendarView>("week");
  const [expandedMonthDay, setExpandedMonthDay] = useState<Date | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [drawerPrefill, setDrawerPrefill] = useState<string | undefined>();
  const [reassignApptId, setReassignApptId] = useState<string | null>(null);

  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);
  const [dragOverTime, setDragOverTime] = useState<string | null>(null);
  const [dragOverConflict, setDragOverConflict] = useState(false);

  const draggingDurationRef = useRef<number>(0);
  const draggingAppointmentIdRef = useRef<string | null>(null);
  const draggingTravelTimeRef = useRef<number>(0);

  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [selectedPractitioners, setSelectedPractitioners] = useState<Set<string>>(new Set());

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    onConfirm: () => {},
    title: "",
    message: "",
  });

  const togglePosition = (pos: string) => {
    setSelectedPositions(new Set([pos]));
    setSelectedPractitioners(new Set());
  };

  const weekDates = useMemo(() => {
    const start = new Date(anchor);
    const day = start.getDay();
    const diff = start.getDate() - day;
    const sunday = new Date(start.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, [anchor]);

  const monthDates = useMemo(() => {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const startDay = start.getDay();
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - startDay);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [anchor]);

  const activeDates = view === "month" ? monthDates : weekDates;

  const { data, loading, refetch } = useQuery(GET_SCHEDULE_DATA, {
    variables: {
      startDate: formatTimezoneISO(activeDates[0], 0, 0, 0),
      endDate: formatTimezoneISO(activeDates[activeDates.length - 1], 23, 59, 59),
    },
    fetchPolicy: "network-only",
  });

  const practitioners = useMemo(
    () => (data?.practitioners as Practitioner[]) ?? [],
    [data?.practitioners],
  );

  const displayPractitioners = useMemo(() => {
    let pList = practitioners;
    if (selectedPractitioners.size > 0) {
      pList = pList.filter((p) => selectedPractitioners.has(p.practitionerId));
    } else if (selectedPositions.size > 0) {
      pList = pList.filter((p) => selectedPositions.has(p.position.toLowerCase()));
    }
    return [...pList].sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [practitioners, selectedPractitioners, selectedPositions]);

  const [localAppointments, setLocalAppointments] = useState<Appointment[]>([]);
  const [localBlocks, setLocalBlocks] = useState<ScheduleBlock[]>([]);

  const [reschedule] = useMutation(RESCHEDULE_APPOINTMENT, {
    onCompleted: () => {
      refetch();
      showToast("Appointment Rescheduled · Clinical Records Updated", "success");
    },
    onError: (err) => {
      refetch();
      showToast(`Reschedule Failed: ${err.message}`, "error");
    },
  });

  const [updateBlock] = useMutation(UPDATE_SCHEDULE_BLOCK, {
    onCompleted: () => {
      refetch();
      showToast("Busy Block Updated", "success");
    },
    onError: (err) => {
      refetch();
      showToast(`Block Update Failed: ${err.message}`, "error");
    },
  });

  const [deleteBlock] = useMutation(DELETE_SCHEDULE_BLOCK, {
    onCompleted: () => {
      refetch();
      showToast("Busy Block Removed", "success");
    },
    onError: (err) => {
      showToast(`Delete Failed: ${err.message}`, "error");
    },
  });

  useEffect(() => {
    if (data?.appointments?.items) {
      setLocalAppointments(data.appointments.items);
    }
    if (data?.scheduleBlocks) {
      setLocalBlocks(data.scheduleBlocks);
    }
  }, [data]);

  const apiPositions = useMemo(
    () =>
      Array.from(
        new Set(practitioners.map((p) => p.position.toLowerCase())),
      ).sort() as string[],
    [practitioners],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const clearDrag = () => {
      setDragOverDate(null);
      setDragOverColKey(null);
      setDragOverTime(null);
      setDragOverConflict(false);
    };
    window.addEventListener("dragend", clearDrag);
    return () => window.removeEventListener("dragend", clearDrag);
  }, []);

  useEffect(() => {
    if (scrollRef.current && !initializedRef.current) {
      scrollRef.current.scrollTop = 8 * GRID_CONFIG.ROW_HEIGHT;
    }
  }, [practitioners, GRID_CONFIG.ROW_HEIGHT]);

  useEffect(() => {
    if (
      practitioners.length > 0 &&
      status === "authenticated" &&
      !initializedRef.current
    ) {
      const userPractitionerId = (session?.user as any)?.practitionerId;
      const userName = session?.user?.name?.toLowerCase() || "";

      const targetPractitioner = practitioners.find((p) => {
        const pFullName = `${p.firstName} ${p.lastName}`.toLowerCase().trim();
        const sName = userName.trim();
        return (
          (userPractitionerId &&
            p.practitionerId?.toLowerCase() ===
              userPractitionerId?.toLowerCase()) ||
          (sName && (pFullName === sName || sName.includes(pFullName))) ||
          (p.firstName === "System" && p.lastName === "Admin")
        );
      });

      if (targetPractitioner) {
        setSelectedPositions(new Set([targetPractitioner.position.toLowerCase()]));
        setSelectedPractitioners(new Set([targetPractitioner.practitionerId]));
        initializedRef.current = true;
      } else if (practitioners.length > 0) {
        setSelectedPositions(new Set([practitioners[0].position.toLowerCase()]));
        setSelectedPractitioners(new Set([practitioners[0].practitionerId]));
        initializedRef.current = true;
      }
    }
  }, [practitioners, status, session, apiPositions]);

  const { visibleAppointments, visibleBlocks, conflicts } = useMemo(() => {
    const selectedIds = new Set(
      Array.from(selectedPractitioners).map((id) => id.toLowerCase().trim()),
    );
    const selectedFullNames = new Set(
      practitioners
        .filter((p) => selectedIds.has(p.practitionerId.toLowerCase().trim()))
        .map((p) => `${p.firstName} ${p.lastName}`.toLowerCase().trim()),
    );

    const va = localAppointments.filter((a) => {
      const start = new Date(a.scheduledStart);
      const hour = start.getHours();

      if (selectedPractitioners.size > 0) {
        const primaryId = (a.practitionerId || a.practitioner?.practitionerId || "")
          ?.toLowerCase()
          .trim();
        const pObj =
          a.practitioner ||
          practitioners.find((p) => p.practitionerId.toLowerCase().trim() === primaryId);
        const primaryName = (pObj ? `${pObj.firstName} ${pObj.lastName}` : "")
          ?.toLowerCase()
          .trim();

        const isPrimaryMatch =
          (primaryId && selectedIds.has(primaryId)) ||
          (primaryName && selectedFullNames.has(primaryName));
        const isSupportingMatch = a.supportingClinicians?.some((sc) => {
          const scId = (sc.practitionerId || sc.practitionerId || "")
            ?.toLowerCase()
            .trim();
          const scName =
            sc.firstName && sc.lastName
              ? `${sc.firstName} ${sc.lastName}`.toLowerCase().trim()
              : "";
          return (
            (scId && selectedIds.has(scId)) ||
            (scName && selectedFullNames.has(scName))
          );
        });
        const encounterPrac = a.encounters?.[0]?.practitioner;
        const encounterPracId = encounterPrac?.practitionerId
          ?.toLowerCase()
          .trim();
        const encounterPracName = encounterPrac
          ? `${encounterPrac.firstName} ${encounterPrac.lastName}`
              .toLowerCase()
              .trim()
          : "";
        const isEncounterMatch =
          (encounterPracId && selectedIds.has(encounterPracId)) ||
          (encounterPracName && selectedFullNames.has(encounterPracName));

        const isMatch = isPrimaryMatch || isSupportingMatch || isEncounterMatch;
        return (
          isMatch &&
          hour >= GRID_CONFIG.START_HOUR - 2 &&
          hour < GRID_CONFIG.END_HOUR + 2
        );
      }
      const pPosition = (a.practitioner?.position || a.practitioner?.position || "")
        ?.toLowerCase()
        .trim();
      return (
        pPosition &&
        (selectedPositions.size === 0 || selectedPositions.has(pPosition)) &&
        hour >= GRID_CONFIG.START_HOUR - 2 &&
        hour < GRID_CONFIG.END_HOUR + 2
      );
    });

    const vb = localBlocks.filter((b) => {
      const start = new Date(b.startTime);
      const hour = start.getHours();
      const withinHoursRelaxed =
        hour >= GRID_CONFIG.START_HOUR - 2 && hour < GRID_CONFIG.END_HOUR + 2;
      const bPractitioner =
        b.practitioner ||
        practitioners.find(
          (p) => p.practitionerId.toLowerCase().trim() === b.practitionerId.toLowerCase().trim(),
        );
      const bName = (
        bPractitioner ? `${bPractitioner.firstName} ${bPractitioner.lastName}` : ""
      )
        ?.toLowerCase()
        .trim();
      if (bName === "system admin" && b.status === "Blocked") return false;
      if (selectedPractitioners.size > 0) {
        const bId = (b.practitionerId || b.practitioner?.practitionerId || "")
          ?.toLowerCase()
          .trim();
        return (
          ((bId && selectedIds.has(bId)) ||
            (bName && selectedFullNames.has(bName))) &&
          withinHoursRelaxed
        );
      }
      const pPosition = (b.practitioner?.position || b.practitioner?.position || "")
        ?.toLowerCase()
        .trim();
      return (
        pPosition &&
        (selectedPositions.size === 0 || selectedPositions.has(pPosition)) &&
        withinHoursRelaxed
      );
    });

    const conf = new Set<string>();
    va.forEach((a1) => {
      va.forEach((a2) => {
        if (
          a1.appointmentId !== a2.appointmentId &&
          a1.practitioner?.practitionerId === a2.practitioner?.practitionerId
        ) {
          const s1 = new Date(a1.scheduledStart).getTime(),
            e1 = new Date(a1.scheduledEnd).getTime();
          const s2 = new Date(a2.scheduledStart).getTime(),
            e2 = new Date(a2.scheduledEnd).getTime();

          if (s1 < e2 && s2 < e1) {
            conf.add(a1.appointmentId);
            conf.add(a2.appointmentId);
          }

          if (s1 < s2) {
            const t2 = a2.travelTimeMinutes || 0;
            const logisticsStart2 = s2 - t2 * 60000;
            if (e1 > logisticsStart2) {
              conf.add(a1.appointmentId);
              conf.add(a2.appointmentId);
            }
          }
        }
      });
    });
    va.forEach((a) => {
      localBlocks.forEach((b) => {
        if (a.practitioner?.practitionerId === b.practitioner?.practitionerId) {
          const as = new Date(a.scheduledStart).getTime(),
            ae = new Date(a.scheduledEnd).getTime();
          const bs = new Date(b.startTime).getTime(),
            be = new Date(b.endTime).getTime();
          if (as < be && bs < ae) conf.add(a.appointmentId);
        }
      });
    });
    return { visibleAppointments: va, visibleBlocks: vb, conflicts: conf };
  }, [
    localAppointments,
    localBlocks,
    selectedPositions,
    selectedPractitioners,
    practitioners,
    GRID_CONFIG.START_HOUR,
    GRID_CONFIG.END_HOUR,
  ]);

  const getDropTimeFromEvent = useCallback((e: React.DragEvent, targetDate: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const pct = y / rect.height;
    const startMin = pct * GRID_CONFIG.TOTAL_MINUTES;
    const snapped = Math.round(startMin / 15) * 15;
    const d = new Date(targetDate);
    d.setHours(GRID_CONFIG.START_HOUR, snapped, 0, 0);
    return d;
  }, [GRID_CONFIG.START_HOUR, GRID_CONFIG.TOTAL_MINUTES]);

  const checkTimeConflict = useCallback((
    start: Date,
    end: Date,
    practitionerId?: string,
    excludeAppointmentId?: string,
  ) => {
    const targetPracId = practitionerId || (selectedPractitioners.size === 1 ? Array.from(selectedPractitioners)[0] : null);
    if (!targetPracId) return false;
    const items = [
      ...localAppointments.filter((a) => a.appointmentId !== excludeAppointmentId),
      ...localBlocks,
    ];
    for (const item of items) {
      const itemPracId = item.practitionerId || item.practitioner?.practitionerId;
      if (itemPracId?.toLowerCase() !== targetPracId.toLowerCase()) continue;
      const itemStart = new Date((item as any).scheduledStart || (item as any).startTime).getTime();
      const itemEnd = new Date((item as any).scheduledEnd || (item as any).endTime).getTime();
      const newStart = start.getTime();
      const newEnd = end.getTime();
      if (newStart < itemEnd && itemStart < newEnd) return true;
    }
    return false;
  }, [localAppointments, localBlocks, selectedPractitioners]);

  const handleDrop = (e: React.DragEvent, targetDate: Date, targetPractitionerId?: string) => {
    e.preventDefault();
    const apptId = e.dataTransfer.getData("appointmentId");
    const blockId = e.dataTransfer.getData("blockId");
    const duration = parseInt(e.dataTransfer.getData("duration"));
    if ((!apptId && !blockId) || isNaN(duration)) return;
    const columnRect = e.currentTarget.getBoundingClientRect();
    const dropY = e.clientY - columnRect.top;
    const pct = dropY / columnRect.height;
    const startMin = pct * GRID_CONFIG.TOTAL_MINUTES;
    const snappedMin = Math.round(startMin / 15) * 15;
    const newStart = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );
    newStart.setHours(GRID_CONFIG.START_HOUR, snappedMin, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration * 60000);
    const maxEnd = new Date(newStart);
    maxEnd.setHours(GRID_CONFIG.END_HOUR, 0, 0, 0);
    if (newEnd > maxEnd) return showToast("Out of working hours", "error");

    if (apptId) {
      const appointment = localAppointments.find((a) => a.appointmentId === apptId);
      if (isVisitMoveLocked(appointment?.status)) {
        return showToast("Completed or active visits cannot be rescheduled.", "error");
      }
      if (view === "team" && targetPractitionerId) {
        if (appointment?.practitionerId !== targetPractitionerId) {
          return showToast("To reassign practitioner, click the appointment and use Reassign.", "error");
        }
      }

      setConfirmModal({
        isOpen: true,
        title: "Reschedule Encounter",
        message: `Travel time may change with the new time slot. Do you want to recalculate or keep the current travel time?`,
        onConfirm: (recalculateTravelTime: boolean) => {
          setLocalAppointments((prev) =>
            prev.map((a) =>
              a.appointmentId === apptId
                ? {
                    ...a,
                    scheduledStart: newStart.toISOString(),
                    scheduledEnd: newEnd.toISOString(),
                  }
                : a,
            ),
          );
          reschedule({
            variables: {
              input: {
                appointmentId: apptId,
                newStart: newStart.toISOString(),
                newEnd: newEnd.toISOString(),
                recalculateTravelTime,
              },
            },
          });
        },
      });
    } else if (blockId) {
      setConfirmModal({
        isOpen: true,
        title: "Confirm Block Update",
        message: "Are you sure you want to update this busy block?",
        onConfirm: () => {
          setLocalBlocks((prev) =>
            prev.map((b) =>
              b.blockId === blockId
                ? {
                    ...b,
                    startTime: newStart.toISOString(),
                    endTime: newEnd.toISOString(),
                  }
                : b,
            ),
          );
          updateBlock({
            variables: {
              input: {
                blockId: blockId,
                newStart: newStart.toISOString(),
                newEnd: newEnd.toISOString(),
              },
            },
          });
        },
      });
    }
  };

  const HOURS = useMemo(
    () =>
      Array.from(
        { length: GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR },
        (_, i) => i + GRID_CONFIG.START_HOUR,
      ),
    [GRID_CONFIG.START_HOUR, GRID_CONFIG.END_HOUR],
  );

  return {
    session,
    status,
    GRID_CONFIG,
    anchor,
    setAnchor,
    monthLabel,
    view,
    setView,
    expandedMonthDay,
    setExpandedMonthDay,
    drawerOpen,
    setDrawerOpen,
    reassignOpen,
    setReassignOpen,
    drawerPrefill,
    setDrawerPrefill,
    reassignApptId,
    setReassignApptId,
    dragOverDate,
    setDragOverDate,
    dragOverColKey,
    setDragOverColKey,
    dragOverTime,
    setDragOverTime,
    dragOverConflict,
    setDragOverConflict,
    draggingDurationRef,
    draggingAppointmentIdRef,
    draggingTravelTimeRef,
    selectedPositions,
    setSelectedPositions,
    selectedPractitioners,
    setSelectedPractitioners,
    confirmModal,
    setConfirmModal,
    togglePosition,
    weekDates,
    monthDates,
    activeDates,
    practitioners,
    displayPractitioners,
    localAppointments,
    setLocalAppointments,
    localBlocks,
    setLocalBlocks,
    loading,
    refetch,
    apiPositions,
    scrollRef,
    visibleAppointments,
    visibleBlocks,
    conflicts,
    reschedule,
    updateBlock,
    deleteBlock,
    getDropTimeFromEvent,
    checkTimeConflict,
    handleDrop,
    HOURS,
  };
}
