"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useSession } from "next-auth/react";
import BookingDrawer from "./BookingDrawer";
import {
  ChevronLeft, ChevronRight, Calendar, User, Stethoscope, Shield,
  Users, Filter, Plus, Video, Home, Building2, Activity,
  Navigation, Clock, AlertCircle, Zap, Database, RefreshCw,
  Search, Target, CheckCircle, MapPin, Phone,
  ClipboardList,
  Trash2
} from "lucide-react";
import { useToast } from "./ToastProvider";
import { formatInTimeZone } from "date-fns-tz";

import { CLINICAL_CONFIG } from "../lib/clinical-config";

const GRID_CONFIG = {
  START_HOUR: CLINICAL_CONFIG.AM_START,
  END_HOUR: CLINICAL_CONFIG.DAY_END,
  TOTAL_MINUTES: (CLINICAL_CONFIG.DAY_END - CLINICAL_CONFIG.AM_START) * 60,
  ROW_HEIGHT: 80,
  DAYS: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
};

const POSITION_STYLE: Record<string, any> = {
  nurse: { label: "Nurse", color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/5", border: "border-[var(--primary)]/20", icon: <Users className="w-3.5 h-3.5" /> },
  physician: { label: "Physician", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: <Shield className="w-3.5 h-3.5" /> },
  practitioner: { label: "Practitioner", color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/30", icon: <Stethoscope className="w-3.5 h-3.5" /> },
  admin: { label: "Admin", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: <Zap className="w-3.5 h-3.5" /> },
};

const getModalityConfig = (modalityStr: string) => {
  if (!modalityStr) return { icon: <Activity className="w-3 h-3" />, label: "UNKNOWN" };
  const m = modalityStr.toUpperCase();
  if (m.includes("HOME")) return { icon: <Home className="w-3 h-3" />, label: "HOME VISIT" };
  if (m.includes("FACILITY")) return { icon: <Building2 className="w-3 h-3" />, label: "FACILITY" };
  if (m.includes("TELEHEALTH") || m.includes("VIDEO")) return { icon: <Video className="w-3 h-3" />, label: "TELEHEALTH" };
  if (m.includes("TELEPHONE")) return { icon: <Activity className="w-3 h-3" />, label: "TELEPHONE" };
  return { icon: <Activity className="w-3 h-3" />, label: modalityStr.replace(/_/g, " ") };
};

const getStatusConfig = (statusStr: string) => {
  if (!statusStr) return { label: "SCHED", bg: "bg-[var(--input-bg)]", border: "border-[var(--card-border)]", text: "text-[var(--text-muted)]", dot: "bg-[var(--text-muted)]/40", isLive: false };

  // Normalize: IN_PROGRESS -> INPROGRESS
  const s = statusStr.toUpperCase().replace(/[^A-Z]/g, "");

  if (["INPROGRESS", "ARRIVED", "STARTED", "LIVE"].includes(s))
    return { label: "LIVE", bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-700", dot: "bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]", isLive: true };
  if (s.includes("HOLD")) return { label: "HOLD", bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-700", dot: "bg-amber-500 shadow-[0_0_10px_#fbbf24]", isLive: false };
  if (s.includes("COMPLETE") || s === "DONE") return { label: "DONE", bg: "bg-blue-500/15", border: "border-blue-500/40", text: "text-blue-700", dot: "bg-blue-500 shadow-[0_0_10px_#60a5fa]", isLive: false };
  if (s.includes("CANCEL")) return { label: "CANC", bg: "bg-rose-500/15", border: "border-rose-500/40", text: "text-rose-700", dot: "bg-rose-500 shadow-[0_0_10px_#f43f5e]", isLive: false };

  return { label: "SCHED", bg: "bg-[var(--input-bg)]", border: "border-[var(--card-border)]", text: "text-[var(--text-muted)]", dot: "bg-[var(--text-muted)]/40", isLive: false };
};

const GET_SCHEDULE_DATA = gql`
  query GetScheduleData($startDate: DateTime!, $endDate: DateTime!) {
    appointments(startDate: $startDate, endDate: $endDate) {
      items {
        appointmentId 
        scheduledStart 
        scheduledEnd 
        modality 
        status 
        travelTimeMinutes 
        distanceInMiles 
        practitionerId 
        plannedAssessments
        practitioner { practitionerId firstName lastName position }
        supportingClinicians { practitionerId firstName lastName position }
        encounters { practitioner { practitionerId firstName lastName position } }
        patient { firstName lastName mrn addresses { isPrimary address { street } } }
      }
    }
    scheduleBlocks(startDate: $startDate, endDate: $endDate) {
      blockId startTime endTime status practitionerId
      practitioner { practitionerId firstName lastName position }
    }
    practitioners {
      practitionerId firstName lastName position
    }
  }
`;

const RESCHEDULE_APPOINTMENT = gql`
  mutation RescheduleAppointment($input: RescheduleAppointmentInput!) {
    rescheduleAppointment(input: $input) {
      appointmentId scheduledStart scheduledEnd travelTimeMinutes distanceInMiles
    }
  }
`;

const UPDATE_SCHEDULE_BLOCK = gql`
  mutation UpdateScheduleBlock($input: UpdateScheduleBlockInput!) {
    updateScheduleBlock(input: $input) {
      blockId startTime endTime
    }
  }
`;

const DELETE_SCHEDULE_BLOCK = gql`
  mutation DeleteScheduleBlock($id: UUID!) {
    deleteScheduleBlock(id: $id)
  }
`;

export default function SchedulingCalendar() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const monthLabel = useMemo(() => {
    return anchor.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [anchor]);

  const formatTimezoneISO = (date: Date, hours: number, mins: number, secs: number) => {
    const d = new Date(date);
    d.setHours(hours, mins, secs, 0);
    return d.toISOString();
  };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPrefill, setDrawerPrefill] = useState<string | undefined>();
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [selectedPractitioners, setSelectedPractitioners] = useState<Set<string>>(new Set());

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    title: string;
    message: string;
  }>({ isOpen: false, onConfirm: () => { }, title: "", message: "" });

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
      const d = new Date(sunday); d.setDate(sunday.getDate() + i); return d;
    });
  }, [anchor]);

  const { data, loading, refetch } = useQuery(GET_SCHEDULE_DATA, {
    variables: {
      startDate: formatTimezoneISO(weekDates[0], 0, 0, 0),
      endDate: formatTimezoneISO(weekDates[6], 23, 59, 59)
    },
    fetchPolicy: "network-only"
  });

  const practitioners = data?.practitioners ?? [];
  const [localAppointments, setLocalAppointments] = useState<any[]>([]);
  const [localBlocks, setLocalBlocks] = useState<any[]>([]);

  const [reschedule] = useMutation(RESCHEDULE_APPOINTMENT, {
    onCompleted: () => { refetch(); showToast("Appointment Rescheduled · Vector Updated", "success"); },
    onError: (err) => { refetch(); showToast(`Reschedule Failed: ${err.message}`, "error"); }
  });

  const [updateBlock] = useMutation(UPDATE_SCHEDULE_BLOCK, {
    onCompleted: () => { refetch(); showToast("Busy Block Updated", "success"); },
    onError: (err) => { refetch(); showToast(`Block Update Failed: ${err.message}`, "error"); }
  });

  const [deleteBlock] = useMutation(DELETE_SCHEDULE_BLOCK, {
    onCompleted: () => { refetch(); showToast("Busy Block Removed", "success"); },
    onError: (err) => { showToast(`Delete Failed: ${err.message}`, "error"); }
  });

  useEffect(() => {
    if (data?.appointments?.items) setLocalAppointments(data.appointments.items);
    if (data?.scheduleBlocks) setLocalBlocks(data.scheduleBlocks);
  }, [data]);

  const apiPositions = useMemo(() =>
    Array.from(new Set(practitioners.map((p: any) => p.position.toLowerCase()))).sort() as string[],
    [practitioners]
  );

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (scrollRef.current && !initializedRef.current) {
      scrollRef.current.scrollTop = 8 * GRID_CONFIG.ROW_HEIGHT;
    }
  }, [practitioners]);

  useEffect(() => {
    if (practitioners.length > 0 && status === "authenticated" && !initializedRef.current) {
      const userPractitionerId = (session?.user as any)?.practitionerId;
      const userName = session?.user?.name?.toLowerCase() || "";

      let targetPractitioner = practitioners.find((p: any) => {
        const pFullName = `${p.firstName} ${p.lastName}`.toLowerCase().trim();
        const sName = userName.trim();
        return (userPractitionerId && p.practitionerId?.toLowerCase() === userPractitionerId?.toLowerCase()) ||
          (sName && (pFullName === sName || sName.includes(pFullName))) ||
          (p.firstName === "System" && p.lastName === "Admin");
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
    const selectedIds = new Set(Array.from(selectedPractitioners).map(id => id.toLowerCase().trim()));
    const selectedFullNames = new Set(
      practitioners
        .filter((p: any) => selectedIds.has(p.practitionerId.toLowerCase().trim()))
        .map((p: any) => `${p.firstName} ${p.lastName}`.toLowerCase().trim())
    );

    let va = localAppointments.filter((a: any) => {
      const start = new Date(a.scheduledStart);
      const hour = start.getHours();

      if (selectedPractitioners.size > 0) {
        const primaryId = (a.practitionerId || a.practitioner?.practitionerId || "")?.toLowerCase().trim();
        const pObj = a.practitioner || practitioners.find((p: any) => p.practitionerId.toLowerCase().trim() === primaryId);
        const primaryName = (pObj ? `${pObj.firstName} ${pObj.lastName}` : "")?.toLowerCase().trim();

        const isPrimaryMatch = (primaryId && selectedIds.has(primaryId)) || (primaryName && selectedFullNames.has(primaryName));
        const isSupportingMatch = a.supportingClinicians?.some((sc: any) => {
          const scId = (sc.practitionerId || sc.PractitionerId || "")?.toLowerCase().trim();
          const scName = (sc.firstName && sc.lastName) ? `${sc.firstName} ${sc.lastName}`.toLowerCase().trim() : "";
          return (scId && selectedIds.has(scId)) || (scName && selectedFullNames.has(scName));
        });
        const encounterPrac = a.encounters?.[0]?.practitioner;
        const encounterPracId = encounterPrac?.practitionerId?.toLowerCase().trim();
        const encounterPracName = encounterPrac ? `${encounterPrac.firstName} ${encounterPrac.lastName}`.toLowerCase().trim() : "";
        const isEncounterMatch = (encounterPracId && selectedIds.has(encounterPracId)) || (encounterPracName && selectedFullNames.has(encounterPracName));

        const isMatch = isPrimaryMatch || isSupportingMatch || isEncounterMatch;
        return isMatch && (hour >= GRID_CONFIG.START_HOUR - 2 && hour < GRID_CONFIG.END_HOUR + 2);
      }
      const pPosition = (a.practitioner?.position || a.practitioner?.Position || "")?.toLowerCase().trim();
      return pPosition && (selectedPositions.size === 0 || selectedPositions.has(pPosition)) && (hour >= GRID_CONFIG.START_HOUR - 2 && hour < GRID_CONFIG.END_HOUR + 2);
    });

    let vb = localBlocks.filter((b: any) => {
      const start = new Date(b.startTime);
      const hour = start.getHours();
      const withinHoursRelaxed = hour >= GRID_CONFIG.START_HOUR - 2 && hour < GRID_CONFIG.END_HOUR + 2;
      const bPractitioner = b.practitioner || practitioners.find((p: any) => p.practitionerId.toLowerCase().trim() === b.practitionerId.toLowerCase().trim());
      const bName = (bPractitioner ? `${bPractitioner.firstName} ${bPractitioner.lastName}` : "")?.toLowerCase().trim();
      if (bName === "system admin" && b.status === "Blocked") return false;
      if (selectedPractitioners.size > 0) {
        const bId = (b.practitionerId || b.practitioner?.practitionerId || "")?.toLowerCase().trim();
        return ((bId && selectedIds.has(bId)) || (bName && selectedFullNames.has(bName))) && withinHoursRelaxed;
      }
      const pPosition = (b.practitioner?.position || b.practitioner?.Position || "")?.toLowerCase().trim();
      return pPosition && (selectedPositions.size === 0 || selectedPositions.has(pPosition)) && withinHoursRelaxed;
    });

    const conf = new Set<string>();
    va.forEach((a1: any) => {
      va.forEach((a2: any) => {
        if (a1.appointmentId !== a2.appointmentId && a1.practitioner?.practitionerId === a2.practitioner?.practitionerId) {
          const s1 = new Date(a1.scheduledStart).getTime(), e1 = new Date(a1.scheduledEnd).getTime();
          const s2 = new Date(a2.scheduledStart).getTime(), e2 = new Date(a2.scheduledEnd).getTime();
          if (s1 < e2 && s2 < e1) conf.add(a1.appointmentId);
        }
      });
    });
    va.forEach((a: any) => {
      localBlocks.forEach((b: any) => {
        if (a.practitioner?.practitionerId === b.practitioner?.practitionerId) {
          const as = new Date(a.scheduledStart).getTime(), ae = new Date(a.scheduledEnd).getTime();
          const bs = new Date(b.startTime).getTime(), be = new Date(b.endTime).getTime();
          if (as < be && bs < ae) conf.add(a.appointmentId);
        }
      });
    });
    return { visibleAppointments: va, visibleBlocks: vb, conflicts: conf };
  }, [localAppointments, localBlocks, selectedPositions, selectedPractitioners, practitioners]);

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
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
    const newStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    newStart.setHours(GRID_CONFIG.START_HOUR, snappedMin, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration * 60000);
    const maxEnd = new Date(newStart);
    maxEnd.setHours(GRID_CONFIG.END_HOUR, 0, 0, 0);
    if (newEnd > maxEnd) return showToast("Out of working hours", "error");

    if (apptId) {
      setConfirmModal({
        isOpen: true,
        title: "Confirm Reschedule",
        message: "Are you sure you want to reschedule this encounter?",
        onConfirm: () => {
          setLocalAppointments(prev => prev.map(a =>
            a.appointmentId === apptId ? { ...a, scheduledStart: newStart.toISOString(), scheduledEnd: newEnd.toISOString() } : a
          ));
          reschedule({
            variables: {
              input: {
                appointmentId: apptId,
                newStart: newStart.toISOString(),
                newEnd: newEnd.toISOString()
              }
            }
          });
        }
      });
    } else if (blockId) {
      setConfirmModal({
        isOpen: true,
        title: "Confirm Block Update",
        message: "Are you sure you want to update this busy block?",
        onConfirm: () => {
          setLocalBlocks(prev => prev.map(b =>
            b.blockId === blockId ? { ...b, startTime: newStart.toISOString(), endTime: newEnd.toISOString() } : b
          ));
          updateBlock({
            variables: {
              input: {
                blockId: blockId,
                newStart: newStart.toISOString(),
                newEnd: newEnd.toISOString()
              }
            }
          });
        }
      });
    }
  };

  const HOURS = useMemo(() => Array.from({ length: GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR }, (_, i) => i + GRID_CONFIG.START_HOUR), [GRID_CONFIG.START_HOUR, GRID_CONFIG.END_HOUR]);

  return (
    <div className="flex-1 min-h-0 flex flex-col text-[var(--text-primary)] gap-3 overflow-hidden">

      {/* Ultra-Compact Tactical Header */}
      <div className="shrink-0 flex flex-col gap-2 bg-[var(--card-bg)] px-4 py-3 rounded-2xl border border-[var(--card-border)] shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-6 bg-[var(--primary)] rounded-full shadow-sm shadow-[var(--primary-glow)]" />
            <h1 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter">Clinical Scheduling</h1>
            <div className="flex items-center gap-3 ml-4 border-l border-[var(--card-border)] pl-4">
              <button onClick={() => setAnchor(new Date(anchor.setDate(anchor.getDate() - 7)))} className="p-1.5 hover:bg-[var(--primary)]/10 rounded-xl text-[var(--text-muted)] transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-black text-[var(--text-primary)] min-w-[140px] text-center tracking-tight">{monthLabel}</span>
              <button onClick={() => setAnchor(new Date(anchor.setDate(anchor.getDate() + 7)))} className="p-1.5 hover:bg-[var(--primary)]/10 rounded-xl text-[var(--text-muted)] transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="p-2 hover:bg-[var(--primary)]/10 rounded-lg text-[var(--text-secondary)]"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
            <button onClick={() => { setDrawerPrefill(undefined); setDrawerOpen(true); }}
              className="px-4 h-9 bg-[var(--primary)] hover:opacity-90 rounded-lg text-xs font-bold text-white transition-all active:scale-95 shadow-sm shadow-[var(--primary-glow)]">
              New Encounter
            </button>
          </div>
        </div>

        <div className="h-px bg-[var(--card-border)] mx-1" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {apiPositions.map(pos => {
              const style = POSITION_STYLE[pos] ?? { label: pos, icon: <Users className="w-3 h-3" /> };
              const isActive = selectedPositions.has(pos);
              return (
                <button key={pos} onClick={() => togglePosition(pos)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-2
                         ${isActive ? `bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)] ring-1 ring-[var(--primary)]/20` : "bg-transparent border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5"}`}>
                  {style.icon}
                  <span className="capitalize">{pos}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 flex items-center gap-4">
            <div className="relative flex-1 max-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)]" />
              <select
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) setSelectedPractitioners(new Set());
                  else {
                    const p = practitioners.find((x: any) => x.practitionerId === id);
                    setSelectedPractitioners(new Set([id]));
                    if (p) setSelectedPositions(new Set([p.position.toLowerCase()]));
                  }
                }}
                className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg pl-8 pr-10 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] outline-none appearance-none cursor-pointer hover:border-[var(--primary)]/30 transition-all"
                value={selectedPractitioners.size === 1 ? Array.from(selectedPractitioners)[0] : ""}
              >
                <option value="" className="bg-[var(--card-bg)] text-[var(--text-primary)]">All Practitioners...</option>
                {practitioners.map((p: any) => (
                  <option key={p.practitionerId} value={p.practitionerId} className="bg-[var(--card-bg)] text-[var(--text-primary)]">
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none rotate-90" />
            </div>

            <div className="h-4 w-px bg-[var(--card-border)]" />

            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Modality:</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 opacity-60">
                  <Home className="w-3 h-3 text-[var(--primary)]" />
                  <span className="text-[10px] font-bold">Home</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                  <Building2 className="w-3 h-3 text-[var(--primary)]" />
                  <span className="text-[10px] font-bold">Facility</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                  <Video className="w-3 h-3 text-[var(--primary)]" />
                  <span className="text-[10px] font-bold">Telehealth</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                  <Phone className="w-3 h-3 text-[var(--primary)]" />
                  <span className="text-[10px] font-bold">Telephone</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 min-h-0 bg-[var(--background)] rounded-2xl border border-[var(--card-border)] flex flex-col overflow-hidden relative">
        {/* Header Row */}
        <div className="grid grid-cols-[80px_1fr] bg-[var(--card-bg)] border-b border-slate-200 dark:border-white/10 shrink-0 sticky top-0 z-[60] backdrop-blur-md">
          <div className="flex items-center justify-center border-r border-slate-200 dark:border-white/10"><Clock className="w-4 h-4 text-[var(--text-muted)] opacity-50" /></div>
          <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-white/10">
            {weekDates.map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`flex flex-col items-center py-2.5 transition-all relative ${isToday ? "bg-[var(--primary)]/[0.05]" : ""}`}>
                  {isToday && <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--primary)] shadow-sm shadow-[var(--primary-glow)]" />}
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isToday ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>
                      {GRID_CONFIG.DAYS[i]}
                    </span>
                    <span className={`text-base font-black tracking-tighter ${isToday ? "text-[var(--primary)] scale-110" : "text-[var(--text-primary)]"} transition-transform`}>
                      {date.getDate()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide relative">
          <div className="flex" style={{ height: `${(GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR) * GRID_CONFIG.ROW_HEIGHT}px` }}>
            <div className="w-[80px] border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[var(--input-bg)] sticky left-0 z-50">
              {HOURS.map(h => (
                <div key={h} className="h-[80px] relative border-t border-slate-200 dark:border-white/10 first:border-t-0">
                  <span className="absolute top-0 left-0 right-0 text-center text-[10px] text-[var(--text-muted)] font-bold tracking-tight pt-1.5">
                    {h % 12 || 12} {h < 12 ? "AM" : "PM"}
                  </span>
                </div>
              ))}
              {/* Closing line for the last hour (18:00) */}
              <div className="h-0 border-t border-slate-200 dark:border-white/10" />
            </div>

            <div className="flex-1 grid grid-cols-7 relative divide-x divide-slate-200 dark:divide-white/10">
              {weekDates.map((d, dayIdx) => {
                const dayAppts = visibleAppointments
                  .filter((a: any) => new Date(a.scheduledStart).toDateString() === d.toDateString())
                  .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
                const dayBlocks = visibleBlocks.filter((b: any) => new Date(b.startTime).toDateString() === d.toDateString());

                return (
                  <div key={dayIdx}
                    className="relative transition-colors hover:bg-[var(--input-bg)]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, d)}
                  >
                    {HOURS.map(h => (
                      <div key={h} className="h-[80px] border-t border-slate-200 dark:border-white/10 first:border-t-0 relative">
                        <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-white/5" />
                      </div>
                    ))}
                    {/* Closing line for the last hour */}
                    <div className="h-0 border-t border-slate-200 dark:border-white/10" />

                    {/* Busy Blocks */}
                    {dayBlocks.map((block: any) => {
                      const start = new Date(block.startTime);
                      const end = new Date(block.endTime);

                      const blockHour = parseInt(formatInTimeZone(start, CLINICAL_CONFIG.TIMEZONE, "H"));
                      const blockMinute = parseInt(formatInTimeZone(start, CLINICAL_CONFIG.TIMEZONE, "m"));

                      const startMin = (blockHour - GRID_CONFIG.START_HOUR) * 60 + blockMinute;
                      const durMin = (end.getTime() - start.getTime()) / 60000;
                      const topPx = startMin * (GRID_CONFIG.ROW_HEIGHT / 60);
                      const heightPx = Math.min(durMin * (GRID_CONFIG.ROW_HEIGHT / 60), (GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR) * GRID_CONFIG.ROW_HEIGHT - topPx);

                      return (
                        <div key={block.blockId} draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("blockId", block.blockId);
                            e.dataTransfer.setData("duration", durMin.toString());
                          }}
                          className="absolute left-1.5 right-1.5 z-10 rounded-xl bg-[var(--input-bg)]/80 border border-[var(--card-border)] p-3 pr-2 flex flex-col gap-2 cursor-grab active:cursor-grabbing hover:bg-[var(--input-bg)] transition-all shadow-sm group/block"
                          style={{ top: `${topPx}px`, height: `${heightPx}px` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 text-[var(--text-muted)]">
                              <Shield className="w-4 h-4 opacity-50 group-hover/block:text-[var(--text-primary)] transition-colors" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Unavailable</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-bold text-[var(--text-primary)] bg-[var(--card-bg)] border border-[var(--card-border)] px-2 py-1 rounded">
                                {blockHour % 12 || 12}:{blockMinute.toString().padStart(2, '0')}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Remove Unavailable Block",
                                    message: "Are you sure you want to delete this busy block? This time will become available for scheduling.",
                                    onConfirm: () => deleteBlock({ variables: { id: block.blockId } })
                                  });
                                }}
                                className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Appointment Cards */}
                    {dayAppts.map((appt: any) => {
                      const style = POSITION_STYLE[appt.practitioner?.position.toLowerCase() || "nurse"] ?? POSITION_STYLE.nurse;
                      const start = new Date(appt.scheduledStart), end = new Date(appt.scheduledEnd);
                      const hasConflict = conflicts.has(appt.appointmentId);

                      const hour = parseInt(formatInTimeZone(start, CLINICAL_CONFIG.TIMEZONE, "H"));
                      const minute = parseInt(formatInTimeZone(start, CLINICAL_CONFIG.TIMEZONE, "m"));

                      const startMin = (hour - GRID_CONFIG.START_HOUR) * 60 + minute;
                      let durMin = (end.getTime() - start.getTime()) / 60000;
                      const viewedPractitionerId = selectedPractitioners.size === 1 ? Array.from(selectedPractitioners)[0] : null;
                      const isViewedAsSc = viewedPractitionerId && viewedPractitionerId !== appt.practitionerId && appt.supportingClinicians?.some((sc: any) => sc.practitionerId === viewedPractitionerId);
                      const isViewedAsAttending = viewedPractitionerId && viewedPractitionerId !== appt.practitionerId && appt.encounters?.[0]?.practitioner?.practitionerId === viewedPractitionerId;
                      if (isViewedAsSc || isViewedAsAttending) durMin = 15;
                      const modality = getModalityConfig(appt.modality);
                      const statusConfig = getStatusConfig(appt.status);
                      const driveMin = appt.travelTimeMinutes || 0;
                      if (startMin < 0 || (startMin / 60 + GRID_CONFIG.START_HOUR) >= GRID_CONFIG.END_HOUR) return null;
                      const topPx = startMin * (GRID_CONFIG.ROW_HEIGHT / 60);
                      const heightPx = Math.min(durMin * (GRID_CONFIG.ROW_HEIGHT / 60), (GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR) * GRID_CONFIG.ROW_HEIGHT - topPx);
                      if (durMin <= 0) return null;

                      const overlaps = dayAppts.filter(other => {
                        if (other.appointmentId === appt.appointmentId) return false;
                        const s1 = new Date(appt.scheduledStart).getTime(), e1 = new Date(appt.scheduledEnd).getTime();
                        const s2 = new Date(other.scheduledStart).getTime(), e2 = new Date(other.scheduledEnd).getTime();
                        return s1 < e2 && s2 < e1;
                      });
                      const overlapIdx = overlaps.length > 0 ? dayAppts.filter(a => {
                        const s1 = new Date(a.scheduledStart).getTime(), e1 = new Date(a.scheduledEnd).getTime();
                        const s2 = new Date(appt.scheduledStart).getTime(), e2 = new Date(appt.scheduledEnd).getTime();
                        return s1 < e2 && s2 < e1;
                      }).indexOf(appt) : 0;

                      const maxOverlapsInGroup = overlaps.length + 1;
                      const widthPct = 100 / maxOverlapsInGroup;
                      const leftPct = overlapIdx * widthPct;

                      return (
                        <React.Fragment key={appt.appointmentId}>
                          {/* Redesigned Glassmorphic Travel Time Indicator */}
                          {driveMin > 0 && modality.label !== "TELEHEALTH" && !isViewedAsSc && (
                            <div className="absolute z-10 overflow-visible"
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                top: `${(startMin - driveMin) * (GRID_CONFIG.ROW_HEIGHT / 60)}px`,
                                height: `${driveMin * (GRID_CONFIG.ROW_HEIGHT / 60)}px`,
                                minHeight: '28px',
                              }}>
                              {/* Connector Line */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400/30 rounded-full" />
                              
                              {/* Tactical Glass Badge */}
                              <div className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] group/travel transition-all hover:bg-white/60 dark:hover:bg-slate-800/60">
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

                          <div className={`absolute z-20 hover:z-[100] group ${hasConflict ? "ring-2 ring-red-500" : ""} ${statusConfig.isLive ? "ring-2 ring-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.2)]" : ""}`}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: `${leftPct + 0.5}%`,
                              width: `${widthPct - 1}%`
                            }}>

                            <div draggable onDragStart={(e) => { e.dataTransfer.setData("appointmentId", appt.appointmentId); e.dataTransfer.setData("duration", durMin.toString()); }}
                              onClick={() => { setDrawerPrefill(appt.appointmentId); setDrawerOpen(true); }}
                              className={`absolute top-0 left-0 right-0 h-full group-hover:h-auto p-2 border shadow-md transition-all duration-300 ease-out flex flex-col cursor-grab active:cursor-grabbing overflow-hidden z-10 group-hover:shadow-2xl group-hover:translate-y-[-4px] backdrop-blur-[2px]
                                    ${isViewedAsAttending ? "bg-sky-500/10 border-sky-400 group-hover:bg-sky-950 group-hover:border-sky-500" : isViewedAsSc ? "bg-indigo-500/10 border-indigo-300 group-hover:bg-indigo-950 group-hover:border-indigo-500" : style.bg.replace('/5', '/10') + " " + style.border + " group-hover:bg-[var(--card-bg)] dark:group-hover:bg-slate-900 group-hover:shadow-2xl"} group-hover:border-[var(--primary)]/40`}>

                              {/* Header Section */}
                              <div className="flex flex-nowrap items-center justify-between shrink-0 mb-1 gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                  <div className={`px-2 py-1 ${isViewedAsAttending ? "bg-sky-500/10 border-sky-400/20" : isViewedAsSc ? "bg-indigo-500/10 border-indigo-400/20" : "bg-[var(--input-bg)] border-[var(--card-border)]"} text-[10px] font-bold flex items-center gap-1 shrink-0`} title={modality.label}>
                                    {React.cloneElement(modality.icon as React.ReactElement, { className: `w-3 h-3 ${isViewedAsAttending ? "text-sky-400" : isViewedAsSc ? "text-indigo-400" : "text-[var(--primary)]"}` })}
                                  </div>
                                  {appt.plannedAssessments?.length > 0 && (
                                    <div className={`px-2 py-1 ${isViewedAsAttending ? "bg-sky-500/10 border-sky-400/20 text-sky-400" : isViewedAsSc ? "bg-indigo-500/10 border-indigo-400/20 text-indigo-400" : "bg-[var(--primary)]/15 border-[var(--primary)]/30 text-[var(--primary)]"} text-[9px] font-black flex items-center gap-1.5 shadow-sm shrink-0`} title={`${appt.plannedAssessments.length} Assessments Planned`}>
                                      <ClipboardList className="w-2.5 h-2.5" />
                                      <span>{appt.plannedAssessments.length}</span>
                                    </div>
                                  )}
                                  <div className={`px-2 py-1 ${isViewedAsAttending ? "bg-sky-500/20 border-sky-400/30 text-sky-400" : isViewedAsSc ? "bg-indigo-500/20 border-indigo-400/30 text-indigo-400" : statusConfig.bg + " " + statusConfig.border + " " + statusConfig.text} text-[10px] font-bold flex items-center gap-1 border shadow-sm shrink-0`}>
                                    <div className={`w-2 h-2 rounded-full ${isViewedAsAttending ? "bg-sky-400" : isViewedAsSc ? "bg-indigo-400" : statusConfig.dot}`} />
                                    <span className="whitespace-nowrap uppercase tracking-widest">{isViewedAsAttending ? "PERFORMED" : isViewedAsSc ? "SUPPORTING" : statusConfig.label}</span>
                                  </div>
                                </div>
                                <span className={`text-xs font-bold ${isViewedAsAttending ? "text-sky-400" : isViewedAsSc ? "text-indigo-400" : "text-[var(--text-primary)]"} shrink-0 ml-auto whitespace-nowrap`}>
                                  {start.getHours() % 12 || 12}:{start.getMinutes().toString().padStart(2, '0')}
                                </span>
                              </div>

                              {/* Patient Data */}
                              <div className="flex flex-col mb-1">
                                <p className="tactical-label mb-1">Patient</p>
                                <h4 className={`text-base font-black ${isViewedAsAttending ? "text-sky-400" : isViewedAsSc ? "text-indigo-400" : "text-[var(--text-primary)]"} tracking-tight group-hover:text-[var(--primary)] transition-colors leading-tight`}>{appt.patient?.firstName} {appt.patient?.lastName}</h4>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <MapPin className={`w-3 h-3 ${isViewedAsAttending ? "text-sky-500/50" : isViewedAsSc ? "text-indigo-500/50" : "text-[var(--text-muted)]"}`} />
                                  <p className={`text-[10px] ${isViewedAsAttending ? "text-sky-400/70" : isViewedAsSc ? "text-indigo-400/70" : "text-[var(--text-muted)]"} font-bold leading-tight line-clamp-1 uppercase tracking-wider`}>{appt.patient?.addresses?.[0]?.address?.street || "No address recorded"}</p>
                                </div>
                                <div className="mt-3 flex flex-col gap-1">
                                  <p className="tactical-label">{isViewedAsAttending ? "Performed By" : "Clinical Lead"}</p>
                                  <p className={`text-xs font-semibold ${isViewedAsAttending ? "text-sky-400/90" : isViewedAsSc ? "text-indigo-400/90" : "text-[var(--text-primary)]"}`}>
                                    {isViewedAsAttending
                                      ? `${appt.encounters[0].practitioner.firstName} ${appt.encounters[0].practitioner.lastName}`
                                      : `${appt.practitioner?.firstName} ${appt.practitioner?.lastName}`}
                                  </p>
                                </div>
                              </div>

                              {/* Detailed Hover Info */}
                              <div className="hidden group-hover:flex flex-col gap-4 mt-2 pb-4 border-t border-[var(--card-border)] pt-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                {isViewedAsAttending && (
                                  <div className="flex flex-col gap-1">
                                    <p className="tactical-label">Scheduled Lead</p>
                                    <p className="text-xs font-semibold text-[var(--text-primary)]">{appt.practitioner?.firstName} {appt.practitioner?.lastName}</p>
                                  </div>
                                )}
                                {appt.supportingClinicians?.length > 0 && !isViewedAsAttending && (
                                  <div className="flex flex-col gap-1">
                                    <p className="tactical-label">Support Team</p>
                                    <div className="flex flex-col gap-1">
                                      {appt.supportingClinicians.map((sc: any) => (
                                        <p key={sc.practitionerId} className="text-xs font-semibold text-[var(--text-primary)]">{sc.firstName} {sc.lastName}</p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Footer Section */}
                              <div className="mt-auto pt-2 border-t border-[var(--card-border)] flex items-center justify-between shrink-0">
                                <div className="flex -space-x-2">
                                  {appt.practitionerId === viewedPractitionerId && (
                                    <div className="w-7 h-7 bg-[var(--primary)] border-2 border-[var(--card-bg)] flex items-center justify-center text-[9px] font-bold text-white shadow-sm rounded-full" title="You are the Primary Lead">YOU</div>
                                  )}
                                  {isViewedAsSc && (
                                    <div className="w-7 h-7 bg-sky-600 border-2 border-[var(--card-bg)] flex items-center justify-center text-[9px] font-bold text-white shadow-sm rounded-full" title="You are Supporting">SS</div>
                                  )}
                                  {isViewedAsAttending && (
                                    <div className="w-7 h-7 bg-emerald-600 border-2 border-[var(--card-bg)] flex items-center justify-center text-[9px] font-bold text-white shadow-sm rounded-full" title="You performed this encounter">AP</div>
                                  )}
                                </div>
                                <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                              </div>

                              {hasConflict && <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse" />}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <BookingDrawer key={drawerPrefill} open={drawerOpen} onClose={() => setDrawerOpen(false)} onBooked={() => refetch()} prefillDate={drawerPrefill} appointmentId={drawerPrefill?.length === 36 ? drawerPrefill : undefined} />

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 max-w-sm w-full space-y-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mx-auto border border-[var(--primary)]/20">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">{confirmModal.title}</h3>
              <p className="text-[var(--text-muted)] text-sm">{confirmModal.message.toLowerCase()}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="py-3 rounded-xl bg-[var(--input-bg)] text-[var(--text-muted)] font-semibold text-sm border border-[var(--card-border)] hover:bg-[var(--primary)]/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

