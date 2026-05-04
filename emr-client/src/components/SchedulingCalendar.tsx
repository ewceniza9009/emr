"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useSession } from "next-auth/react";
import BookingDrawer from "./BookingDrawer";
import {
  ChevronLeft, ChevronRight, Calendar, User, Stethoscope, Shield,
  Users, Filter, Plus, Video, Home, Building2, Activity,
  Navigation, Clock, AlertCircle, Zap, Database, RefreshCw
} from "lucide-react";
import { useToast } from "./ToastProvider";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const GRID_CONFIG = {
  START_HOUR: 8,
  END_HOUR: 18,
  TOTAL_MINUTES: 600, // (18 - 8) * 60
  ROW_HEIGHT: 80,
  DAYS: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
};

const POSITION_STYLE: Record<string, any> = {
  nurse: { label: "Nurse", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: <Users className="w-3.5 h-3.5" /> },
  physician: { label: "Physician", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: <Shield className="w-3.5 h-3.5" /> },
  practitioner: { label: "Practitioner", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: <Stethoscope className="w-3.5 h-3.5" /> },
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
  if (!statusStr) return { label: "SCHED", bg: "bg-[var(--input-bg)]", border: "border-[var(--card-border)]", text: "text-[var(--text-muted)]", dot: "bg-[var(--text-muted)]/20" };
  const s = statusStr.toUpperCase();
  if (s.includes("INPROGRESS")) return { label: "LIVE", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500 animate-pulse" };
  if (s.includes("HOLD")) return { label: "HOLD", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" };
  if (s.includes("COMPLETE")) return { label: "DONE", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" };
  if (s.includes("CANCEL")) return { label: "CANC", bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" };
  return { label: "SCHED", bg: "bg-[var(--input-bg)]", border: "border-[var(--card-border)]", text: "text-[var(--text-muted)]", dot: "bg-[var(--text-muted)]/20" };
};

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const GET_SCHEDULE_DATA = gql`
  query GetScheduleData($startDate: DateTime!, $endDate: DateTime!) {
    appointments(where: { scheduledStart: { gte: $startDate }, scheduledEnd: { lte: $endDate } }) {
      appointmentId scheduledStart scheduledEnd modality status travelTimeMinutes distanceInMiles practitionerId
      practitioner { practitionerId firstName lastName position }
      supportingClinicians { practitionerId firstName lastName position }
      patient { firstName lastName mrn addresses { isPrimary address { street } } }
    }
    scheduleBlocks(where: { startTime: { gte: $startDate }, endTime: { lte: $endDate } }) {
      blockId startTime endTime status practitionerId
      practitioner { practitionerId firstName lastName position }
    }
    practitioners {
      practitionerId firstName lastName position
    }
  }
`;

const RESCHEDULE_APPOINTMENT = gql`
  mutation RescheduleAppointment($id: UUID!, $newStart: DateTime!, $newEnd: DateTime!) {
    rescheduleAppointment(appointmentId: $id, newStart: $newStart, newEnd: $newEnd) {
      appointmentId scheduledStart scheduledEnd travelTimeMinutes distanceInMiles
    }
  }
`;

const UPDATE_SCHEDULE_BLOCK = gql`
  mutation UpdateScheduleBlock($id: UUID!, $newStart: DateTime!, $newEnd: DateTime!) {
    updateScheduleBlock(blockId: $id, newStart: $newStart, newEnd: $newEnd) {
      blockId startTime endTime
    }
  }
`;

export default function SchedulingCalendar() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [anchor, setAnchor] = useState(new Date(2026, 4, 3)); // May 3rd, 2026

  // UTC-Corrected Formatter (Max Compatibility)
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
    setSelectedPractitioners(new Set()); // Clear specific person to show entire role
  };

  const togglePractitioner = (id: string) => {
    setSelectedPractitioners(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const weekDates = useMemo(() => {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
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
    onCompleted: () => { refetch(); showToast("Appointment rescheduled successfully", "success"); },
    onError: (err) => { refetch(); showToast(`Failed to reschedule: ${err.message}`, "error"); }
  });

  const [updateBlock] = useMutation(UPDATE_SCHEDULE_BLOCK, {
    onCompleted: () => { refetch(); showToast("Busy block updated successfully", "success"); },
    onError: (err) => { refetch(); showToast(`Failed to update block: ${err.message}`, "error"); }
  });

  useEffect(() => {
    if (data?.appointments) setLocalAppointments(data.appointments);
    if (data?.scheduleBlocks) setLocalBlocks(data.scheduleBlocks);
  }, [data]);

  const apiPositions = useMemo(() =>
    Array.from(new Set(practitioners.map((p: any) => p.position.toLowerCase()))).sort() as string[],
    [practitioners]
  );

  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && !initializedRef.current) {
      scrollRef.current.scrollTop = 8 * GRID_CONFIG.ROW_HEIGHT;
    }
  }, [practitioners]);

  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (practitioners.length > 0 && status === "authenticated" && !initializedRef.current) {
      const userPractitionerId = (session?.user as any)?.practitionerId;
      const userName = session?.user?.name?.toLowerCase() || "";

      let targetPractitioner = practitioners.find((p: any) => {
        const pFullName = `${p.firstName} ${p.lastName}`.toLowerCase().trim();
        const sName = userName.trim();
        
        return (userPractitionerId && p.practitionerId?.toLowerCase() === userPractitionerId?.toLowerCase()) ||
        (sName && (
          pFullName === sName ||
          sName.includes(pFullName) ||
          sName.includes(p.firstName?.toLowerCase().trim()) ||
          sName.includes(p.lastName?.toLowerCase().trim())
        )) ||
        // HARD FALLBACK: If session is empty but we have a System Admin in the registry, default to them
        (p.firstName === "System" && p.lastName === "Admin");
      });

      // FORCE DEFAULT TO INDIVIDUAL PRACTITIONER - NO "ALL" FALLBACK
      if (targetPractitioner) {
        setSelectedPositions(new Set([targetPractitioner.position.toLowerCase()]));
        setSelectedPractitioners(new Set([targetPractitioner.practitionerId]));
        initializedRef.current = true;
      } else if (practitioners.length > 0) {
        // Fallback: Default to first practitioner in the registry
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
      const withinHours = hour >= GRID_CONFIG.START_HOUR && hour < GRID_CONFIG.END_HOUR;

      // If we've selected specific practitioners, we filter by them
      if (selectedPractitioners.size > 0) {
        const primaryId = (a.practitionerId || a.practitioner?.practitionerId || "")?.toLowerCase().trim();
        const primaryName = (a.practitioner ? `${a.practitioner.firstName} ${a.practitioner.lastName}` : "")?.toLowerCase().trim();
        
        const isPrimaryMatch = (primaryId && selectedIds.has(primaryId)) || 
                               (primaryName && selectedFullNames.has(primaryName)) ||
                               (primaryName === "system admin");
        
        const isSupportingMatch = a.supportingClinicians?.some((sc: any) => {
          const scId = (sc.practitionerId || sc.PractitionerId || "")?.toLowerCase().trim();
          const scName = `${sc.firstName} ${sc.lastName}`.toLowerCase().trim();
          return (scId && selectedIds.has(scId)) || (scName && selectedFullNames.has(scName)) || (scName === "system admin");
        });

        return (isPrimaryMatch || isSupportingMatch) && withinHours;
      }

      // If NO practitioners selected (the "ALL" case), show by role filter
      const pPosition = (a.practitioner?.position || a.practitioner?.Position || "")?.toLowerCase().trim();
      return pPosition && (selectedPositions.size === 0 || selectedPositions.has(pPosition)) && withinHours;
    });

    let vb = localBlocks.filter((b: any) => {
      const start = new Date(b.startTime);
      const hour = start.getHours();
      const withinHours = hour >= GRID_CONFIG.START_HOUR && hour < GRID_CONFIG.END_HOUR;

      const bPractitioner = b.practitioner || practitioners.find((p: any) => p.practitionerId.toLowerCase().trim() === b.practitionerId.toLowerCase().trim());
      const bName = (bPractitioner ? `${bPractitioner.firstName} ${bPractitioner.lastName}` : "")?.toLowerCase().trim();
      
      // HIDE SEEDED OFF-DUTY BLOCKS FOR SYSTEM ADMIN
      if (bName === "system admin" && b.status === "Blocked") return false;

      if (selectedPractitioners.size > 0) {
        const bId = (b.practitionerId || b.practitioner?.practitionerId || "")?.toLowerCase().trim();
        return ((bId && selectedIds.has(bId)) || (bName && selectedFullNames.has(bName)) || (bName === "system admin")) && withinHours;
      }

      const pPosition = (b.practitioner?.position || b.practitioner?.Position || "")?.toLowerCase().trim();
      return pPosition && (selectedPositions.size === 0 || selectedPositions.has(pPosition)) && withinHours;
    });

    const conf = new Set<string>();

    // 1. Appointment vs Appointment Conflicts
    va.forEach((a1: any) => {
      va.forEach((a2: any) => {
        if (a1.appointmentId !== a2.appointmentId && a1.practitioner?.practitionerId === a2.practitioner?.practitionerId) {
          const s1 = new Date(a1.scheduledStart).getTime(), e1 = new Date(a1.scheduledEnd).getTime();
          const s2 = new Date(a2.scheduledStart).getTime(), e2 = new Date(a2.scheduledEnd).getTime();
          if (s1 < e2 && s2 < e1) conf.add(a1.appointmentId);
        }
      });
    });

    // 2. Appointment vs Busy Block Conflicts
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

    if (newEnd > maxEnd) {
      alert("Events cannot extend beyond working hours (6 PM).");
      return;
    }

    if (apptId) {
      setConfirmModal({
        isOpen: true,
        title: "Confirm Reschedule",
        message: "Are you sure you want to move this appointment?",
        onConfirm: () => {
          setLocalAppointments(prev => prev.map(a =>
            a.appointmentId === apptId
              ? { ...a, scheduledStart: newStart.toISOString(), scheduledEnd: newEnd.toISOString() }
              : a
          ));
          reschedule({ variables: { id: apptId, newStart: newStart.toISOString(), newEnd: newEnd.toISOString() } });
        }
      });
    } else if (blockId) {
      setConfirmModal({
        isOpen: true,
        title: "Confirm Block Update",
        message: "Are you sure you want to reschedule this busy block?",
        onConfirm: () => {
          setLocalBlocks(prev => prev.map(b =>
            b.blockId === blockId
              ? { ...b, startTime: newStart.toISOString(), endTime: newEnd.toISOString() }
              : b
          ));
          updateBlock({ variables: { id: blockId, newStart: newStart.toISOString(), newEnd: newEnd.toISOString() } });
        }
      });
    }
  };

  const HOURS = useMemo(() => Array.from({ length: GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR }, (_, i) => i + GRID_CONFIG.START_HOUR), [GRID_CONFIG.START_HOUR, GRID_CONFIG.END_HOUR]);

  return (
    <div className="h-[calc(100vh-20px)] flex flex-col bg-[var(--background)] text-[var(--text-primary)] p-4 gap-4 overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl transition-colors duration-500">

      {/* ── HEADER ── */}
      <div className="shrink-0 flex items-center justify-between bg-[var(--card-bg)] backdrop-blur-md px-6 py-3 rounded-2xl border border-[var(--card-border)] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary-glow)]">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Clinical Schedule</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">{localAppointments.length} Active Encounters</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="p-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)] hover:bg-[var(--primary-glow)] active:scale-95 transition-all group">
            <RefreshCw className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
          </button>
          <div className="flex items-center bg-[var(--input-bg)] px-2 py-1 rounded-xl border border-[var(--card-border)]">
            <button onClick={() => setAnchor(new Date(anchor.setDate(anchor.getDate() - 7)))} className="p-1.5 hover:bg-[var(--primary-glow)] rounded-lg transition-all"><ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" /></button>
            <span className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">MAY 2026</span>
            <button onClick={() => setAnchor(new Date(anchor.setDate(anchor.getDate() + 7)))} className="p-1.5 hover:bg-[var(--primary-glow)] rounded-lg transition-all"><ChevronRight className="w-4 h-4 text-[var(--text-muted)]" /></button>
          </div>
          <button onClick={() => { setDrawerPrefill(undefined); setDrawerOpen(true); }}
            className="px-6 py-2.5 bg-[var(--primary)] hover:opacity-90 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all text-white">
            New Encounter
          </button>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="shrink-0 flex items-center gap-4 bg-[var(--card-bg)] px-4 py-2 rounded-xl border border-[var(--card-border)]">
        <div className="px-4 py-1.5 bg-[var(--input-bg)] rounded-lg border border-[var(--card-border)] flex items-center gap-2">
          <Filter className="w-3 h-3 text-[var(--text-muted)]" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Clinical Roles</span>
        </div>
        <div className="flex items-center gap-1">
          {apiPositions.map(pos => {
            const style = POSITION_STYLE[pos] ?? { label: pos, color: "text-[var(--text-primary)]", bg: "bg-[var(--input-bg)]", border: "border-[var(--card-border)]" };
            return (
              <button key={pos} onClick={() => togglePosition(pos)}
                className={`px-4 py-2 rounded-xl border font-black text-[10px] tracking-widest transition-all duration-300
                      ${selectedPositions.has(pos)
                    ? `${style.bg} ${style.border} ${style.color} shadow-lg shadow-[var(--primary-glow)] scale-105`
                    : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--primary-glow)]/10 hover:text-[var(--text-secondary)]"}`}>
                <div className="flex items-center gap-2">
                  {style.icon}
                  <span className="uppercase">{pos.replace(/_/g, " ")}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Practitioner Combo Box ── */}
        <div className="flex-1 relative max-w-xs border-l border-[var(--card-border)] ml-4 pl-4">
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
            className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer pr-10"
            value={selectedPractitioners.size === 1 ? Array.from(selectedPractitioners)[0] : ""}
          >
            <option value="" className="bg-[var(--card-bg)] text-[var(--text-muted)] italic">Select Practitioner...</option>
            {practitioners
              .map((p: any) => (
                <option key={p.practitionerId} value={p.practitionerId} className="bg-[var(--card-bg)] text-[var(--text-primary)]">
                  {p.firstName} {p.lastName} ({p.position})
                </option>
              ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
            <ChevronRight className="w-3 h-3 text-[var(--text-muted)] rotate-90" />
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="flex-1 min-h-0 bg-[var(--background)] rounded-2xl border border-[var(--card-border)] flex flex-col overflow-hidden">
        <div className="grid grid-cols-[80px_1fr] bg-[var(--card-bg)] border-b border-[var(--card-border)] shrink-0 sticky top-0 z-50">
          <div className="flex items-center justify-center border-r border-[var(--card-border)]"><Clock className="w-4 h-4 text-[var(--text-muted)] opacity-20" /></div>
          <div className="grid grid-cols-7">
            {weekDates.map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`flex-1 flex flex-col items-center py-4 border-l border-white/5 first:border-l-0 transition-all
                  ${isToday ? "bg-[var(--primary)]/[0.03] relative" : ""}`}>
                  {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--primary)] shadow-[0_0_15px_var(--primary-glow)]" />}
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>
                    {GRID_CONFIG.DAYS[i]}
                  </span>
                  <div className={`mt-2 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition-all
                    ${isToday ? "bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary-glow)]" : "text-[var(--text-primary)]"}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-hide relative"
        >
          <div className="flex" style={{ height: `${(GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR + 1) * GRID_CONFIG.ROW_HEIGHT}px` }}>
            <div className="w-[80px] border-r border-[var(--card-border)] bg-[var(--background)] sticky left-0 z-20">
              {HOURS.map(h => (
                <div key={h} className="h-[80px] flex items-start justify-center pt-3 border-b border-[var(--card-border)] opacity-20">
                  <span className="text-[10px] text-[var(--text-primary)] font-bold uppercase tracking-wider">{h % 12 || 12} {h < 12 ? "AM" : "PM"}</span>
                </div>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-7 relative">
              {weekDates.map((d, dayIdx) => {
                const dayAppts = visibleAppointments.filter((a: any) => new Date(a.scheduledStart).toDateString() === d.toDateString());
                const dayBlocks = visibleBlocks.filter((b: any) => new Date(b.startTime).toDateString() === d.toDateString());

                return (
                  <div key={dayIdx}
                    className="relative border-l border-[var(--card-border)] first:border-l-0 transition-colors hover:bg-[var(--primary-glow)]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, d)}
                  >
                    {HOURS.map(h => <div key={h} className="h-[80px] border-b border-[var(--card-border)] opacity-20" />)}

                    {/* Schedule Blocks (Busy) */}
                    {dayBlocks.map((block: any) => {
                      const start = new Date(block.startTime), end = new Date(block.endTime);
                      const startMin = (start.getHours() - GRID_CONFIG.START_HOUR) * 60 + start.getMinutes();
                      const durMin = (end.getTime() - start.getTime()) / 60000;

                      const top = (startMin / GRID_CONFIG.TOTAL_MINUTES) * 100;
                      // Clamp height so it doesn't spill over the grid
                      const height = Math.min(durMin / GRID_CONFIG.TOTAL_MINUTES * 100, 100 - top);

                      return (
                        <div key={block.blockId} draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("blockId", block.blockId);
                            e.dataTransfer.setData("duration", durMin.toString());
                          }}
                          className="absolute left-1.5 right-1.5 z-0 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] backdrop-blur-sm p-3 flex flex-col gap-2 overflow-hidden cursor-grab active:cursor-grabbing hover:border-[var(--text-muted)] transition-all shadow-sm"
                          style={{ top: `${top}%`, height: `${height}%` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">BUSY BLOCK</span>
                            </div>
                            <span className="text-[8px] font-black text-[var(--text-muted)] bg-[var(--card-bg)] px-1.5 py-0.5 rounded border border-[var(--card-border)] uppercase">
                              {start.getHours() % 12 || 12}:{start.getMinutes().toString().padStart(2, '0')} - {end.getHours() % 12 || 12}:{end.getMinutes().toString().padStart(2, '0')}
                            </span>
                          </div>
                          <p className="text-[10px] font-black text-[var(--text-primary)] uppercase truncate tracking-wide">OFF-DUTY / BLOCKED</p>
                          <div className="mt-auto flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-slate-500 flex items-center justify-center text-[7px] font-black text-white">{block.practitioner?.firstName?.[0]}{block.practitioner?.lastName?.[0]}</div>
                            <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase truncate">{block.practitioner?.firstName} {block.practitioner?.lastName}</span>
                          </div>
                        </div>
                      );
                    })}

                    {dayAppts.map((appt: any) => {
                      const style = POSITION_STYLE[appt.practitioner?.position.toLowerCase() || "nurse"] ?? POSITION_STYLE.nurse;
                      const start = new Date(appt.scheduledStart), end = new Date(appt.scheduledEnd);
                      const hasConflict = conflicts.has(appt.appointmentId);

                      const startMin = (start.getHours() - GRID_CONFIG.START_HOUR) * 60 + start.getMinutes();
                      let durMin = (end.getTime() - start.getTime()) / 60000;

                      // Logic: If a specific provider is selected and they are an SC, only show a 15m slice
                      const viewedPractitionerId = selectedPractitioners.size === 1 ? Array.from(selectedPractitioners)[0] : null;
                      const isViewedAsSc = viewedPractitionerId &&
                        viewedPractitionerId !== appt.practitionerId &&
                        appt.supportingClinicians?.some((sc: any) => sc.practitionerId === viewedPractitionerId);

                      if (isViewedAsSc) {
                        durMin = 15; // Only show their duration on the block (15m)
                      }

                      const modality = getModalityConfig(appt.modality);
                      const statusConfig = getStatusConfig(appt.status);

                      // Strictly mapped to backend routing data. 0 means 0.
                      const driveMin = appt.travelTimeMinutes || 0;
                      const hasCn = appt.practitionerId !== null;
                      const hasSc = (appt.supportingClinicians?.length > 0) || (appt.supportingPractitionerIds?.length > 0);

                      if (startMin < 0 || startMin >= GRID_CONFIG.TOTAL_MINUTES) return null;

                      const top = (startMin / GRID_CONFIG.TOTAL_MINUTES) * 100;
                      // Clamp height so it doesn't spill over the grid
                      const height = Math.min(durMin / GRID_CONFIG.TOTAL_MINUTES * 100, 100 - top);

                      if (durMin <= 0) return null;

                      return (
                        <React.Fragment key={appt.appointmentId}>
                          {/* Drive Time Visualization (Hide for SCs) */}
                          {driveMin > 0 && modality.label !== "TELEHEALTH" && hasCn && !isViewedAsSc && (
                            <div className="absolute left-4 right-4 border-l-2 border-dashed border-blue-500/50 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(59,130,246,0.1)_4px,rgba(59,130,246,0.1)_8px)] flex items-start justify-end p-1 z-0 rounded-t-lg"
                              style={{ top: `${((startMin - driveMin) / GRID_CONFIG.TOTAL_MINUTES) * 100}%`, height: `${(driveMin / GRID_CONFIG.TOTAL_MINUTES) * 100}%` }}>
                              <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest bg-[#0a0b10] px-1 py-0.5 rounded shadow-xl -mt-1 border border-blue-500/20">
                                <Navigation className="inline w-2 h-2 mr-0.5" /> {driveMin}m Drive
                              </span>
                            </div>
                          )}

                          {/* Appointment Card Wrapper - Dictates Grid Position */}
                          <div className={`absolute left-1 right-1 z-20 group/appt ${hasConflict ? "ring-2 ring-rose-500 rounded-xl" : ""}`}
                            style={{ top: `${top}%`, height: `${height}%` }}>

                            {/* Expandable Inner Card */}
                            <div draggable onDragStart={(e) => {
                              e.dataTransfer.setData("appointmentId", appt.appointmentId);
                              e.dataTransfer.setData("duration", durMin.toString());
                            }}
                              onClick={() => { setDrawerPrefill(appt.appointmentId); setDrawerOpen(true); }}
                              className={`absolute top-0 left-0 right-0 min-h-full max-h-full group-hover/appt:max-h-[400px] rounded-lg p-1.5 border shadow-lg transition-all duration-300 flex flex-col cursor-grab active:cursor-grabbing overflow-hidden bg-[var(--card-bg)] z-10 group-hover/appt:z-50
                                    ${style.bg} backdrop-blur-xl ${hasConflict ? "border-rose-500/50 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : style.border}`}>

                              {/* Header: Modality & Time */}
                              <div className="flex items-center justify-between shrink-0 mb-0.5">
                                <div className="flex items-center gap-1.5">
                                  <div className={`px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-widest flex items-center gap-1 ${style.color} bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm`}>
                                    {modality.icon}
                                    <span className="truncate">{modality.label}</span>
                                  </div>
                                  <div className={`px-1 py-0.5 rounded ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} text-[7px] font-black uppercase tracking-widest flex items-center gap-1 border`}>
                                    <div className={`w-1 h-1 rounded-full ${statusConfig.dot}`} /> {statusConfig.label}
                                  </div>
                                </div>
                                <span className="text-[8px] font-black text-[var(--text-muted)] bg-[var(--input-bg)] px-1 py-0.5 rounded border border-[var(--card-border)]">
                                  {start.getHours() % 12 || 12}:{start.getMinutes().toString().padStart(2, '0')}
                                </span>
                              </div>

                              {/* Patient Identity & Micro Avatars (Always Visible) */}
                              <div className="flex items-center justify-between shrink-0 mb-0.5">
                                <div className="flex flex-col truncate">
                                  <span className="text-[10px] leading-tight font-black text-[var(--text-primary)] uppercase truncate" title={`${appt.patient?.firstName} ${appt.patient?.lastName}`}>{appt.patient?.firstName} {appt.patient?.lastName}</span>
                                  {modality.label !== "TELEHEALTH" && appt.patient?.addresses?.[0]?.address?.street && (
                                    <span className="text-[8px] font-bold text-[var(--text-muted)] truncate mt-0.5" title={appt.patient.addresses[0].address.street}>
                                      {appt.patient.addresses[0].address.street}
                                    </span>
                                  )}
                                </div>
                                {/* The "Hint" of CN and SC */}
                                <div className="flex -space-x-1 shrink-0 ml-1">
                                  {appt.practitioner && (
                                    <div className="w-3.5 h-3.5 rounded-full bg-purple-600 border border-[var(--sidebar-bg)] flex items-center justify-center text-[5px] font-black text-white shadow-md" title="Care Navigator (Primary)">CN</div>
                                  )}
                                  {appt.supportingClinicians?.length > 0 && (
                                    <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-[var(--sidebar-bg)] flex items-center justify-center text-[5px] font-black text-white shadow-md" title="Supporting Clinician">SC</div>
                                  )}
                                </div>
                              </div>

                              {/* Expanded Hover Info (Revealed on hover via max-h expansion) */}
                              <div className="mt-2 pt-2 border-t border-[var(--card-border)] flex flex-col gap-1.5 shrink-0 opacity-0 group-hover/appt:opacity-100 transition-opacity delay-75">
                                {modality.label !== "TELEHEALTH" && (
                                  <p className="text-[8px] font-bold text-[var(--text-muted)] truncate flex items-center gap-1.5">
                                    <Home className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                    <span className={`truncate ${appt.patient?.addresses?.[0]?.address?.street ? "text-[var(--text-secondary)]" : "text-rose-500"}`}>
                                      {appt.patient?.addresses?.[0]?.address?.street || "NO ADDRESS ON FILE"}
                                    </span>
                                  </p>
                                )}
                                <div className="flex flex-col gap-1 mt-1 bg-[var(--input-bg)] p-1.5 rounded border border-[var(--card-border)]">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-purple-600 border border-[var(--sidebar-bg)] flex items-center justify-center text-[5px] font-black text-white shrink-0">CN</div>
                                    {(() => {
                                      const cn = appt.practitioner || practitioners.find((pr: any) => pr.practitionerId?.toLowerCase() === appt.practitionerId?.toLowerCase());
                                      const name = cn ? `${cn.firstName} ${cn.lastName}`.trim() : "";
                                      return (
                                        <span className={`text-[8px] font-black uppercase truncate ${name ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                                          {name || "UNASSIGNED"}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-blue-600 border border-[var(--sidebar-bg)] flex items-center justify-center text-[5px] font-black text-white shrink-0">SC</div>
                                    {(() => {
                                      const sc = appt.supportingClinicians?.[0] || practitioners.find((pr: any) => appt.supportingPractitionerIds?.some((id: string) => id?.toLowerCase() === pr.practitionerId?.toLowerCase()));
                                      const name = sc ? `${sc.firstName} ${sc.lastName}`.trim() : "";
                                      return (
                                        <span className={`text-[8px] font-black uppercase truncate ${name ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                                          {name || "UNASSIGNED"}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>

                              {hasConflict && <div className="absolute inset-0 bg-rose-500/10 pointer-events-none animate-pulse" />}
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

      <BookingDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onBooked={() => refetch()} prefillDate={drawerPrefill} appointmentId={drawerPrefill?.length === 36 ? drawerPrefill : undefined} />

      {/* ── Confirmation Modal ── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] p-8 max-w-sm w-full space-y-6 shadow-2xl scale-in-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto border border-blue-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">{confirmModal.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm">{confirmModal.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="py-4 rounded-xl bg-[var(--input-bg)] text-[var(--text-muted)] font-bold hover:bg-[var(--primary-glow)]/10 transition-all uppercase text-[10px] tracking-widest border border-[var(--card-border)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="py-4 rounded-xl bg-[var(--primary)] text-white font-bold hover:opacity-90 transition-all shadow-xl shadow-[var(--primary-glow)] uppercase text-[10px] tracking-widest"
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
