"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useSession } from "next-auth/react";
import BookingDrawer from "./BookingDrawer";
import {
  ChevronLeft, ChevronRight, Calendar, User, Stethoscope, Shield,
  Users, Filter, Plus, Video, Home, Building2, Activity,
  Navigation, Clock, AlertCircle, Zap, Database, RefreshCw,
  Search, Target, CheckCircle, MapPin
} from "lucide-react";
import { useToast } from "./ToastProvider";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const GRID_CONFIG = {
  START_HOUR: 8,
  END_HOUR: 18,
  TOTAL_MINUTES: 600, // (18 - 8) * 60
  ROW_HEIGHT: 100,
  DAYS: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
};

const POSITION_STYLE: Record<string, any> = {
  nurse: { label: "Nurse", color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/5", border: "border-[var(--primary)]/20", icon: <Users className="w-3.5 h-3.5" /> },
  physician: { label: "Physician", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: <Shield className="w-3.5 h-3.5" /> },
  practitioner: { label: "Practitioner", color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/30", icon: <Stethoscope className="w-3.5 h-3.5" /> },
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
  if (!statusStr) return { label: "SCHED", bg: "bg-[var(--input-bg)]", border: "border-[var(--card-border)]", text: "text-[var(--text-muted)]", dot: "bg-[var(--text-muted)]/40" };
  const s = statusStr.toUpperCase();
  if (s.includes("INPROGRESS")) return { label: "LIVE", bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-700", dot: "bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" };
  if (s.includes("HOLD")) return { label: "HOLD", bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-700", dot: "bg-amber-500 shadow-[0_0_10px_#fbbf24]" };
  if (s.includes("COMPLETE")) return { label: "DONE", bg: "bg-blue-500/15", border: "border-blue-500/40", text: "text-blue-700", dot: "bg-blue-500 shadow-[0_0_10px_#60a5fa]" };
  if (s.includes("CANCEL")) return { label: "CANC", bg: "bg-rose-500/15", border: "border-rose-500/40", text: "text-rose-700", dot: "bg-rose-500 shadow-[0_0_10px_#f43f5e]" };
  return { label: "SCHED", bg: "bg-[var(--input-bg)]", border: "border-[var(--card-border)]", text: "text-[var(--text-muted)]", dot: "bg-[var(--text-muted)]/40" };
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
    onCompleted: () => { refetch(); showToast("Appointment Rescheduled // Vector Updated", "success"); },
    onError: (err) => { refetch(); showToast(`Reschedule Failed: ${err.message}`, "error"); }
  });

  const [updateBlock] = useMutation(UPDATE_SCHEDULE_BLOCK, {
    onCompleted: () => { refetch(); showToast("Busy Block Updated", "success"); },
    onError: (err) => { refetch(); showToast(`Block Update Failed: ${err.message}`, "error"); }
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
      const withinHours = hour >= GRID_CONFIG.START_HOUR && hour < GRID_CONFIG.END_HOUR;
      if (selectedPractitioners.size > 0) {
        const primaryId = (a.practitionerId || a.practitioner?.practitionerId || "")?.toLowerCase().trim();
        const primaryName = (a.practitioner ? `${a.practitioner.firstName} ${a.practitioner.lastName}` : "")?.toLowerCase().trim();
        const isPrimaryMatch = (primaryId && selectedIds.has(primaryId)) || (primaryName && selectedFullNames.has(primaryName));
        const isSupportingMatch = a.supportingClinicians?.some((sc: any) => {
          const scId = (sc.practitionerId || sc.PractitionerId || "")?.toLowerCase().trim();
          const scName = `${sc.firstName} ${sc.lastName}`.toLowerCase().trim();
          return (scId && selectedIds.has(scId)) || (scName && selectedFullNames.has(scName));
        });
        return (isPrimaryMatch || isSupportingMatch) && withinHours;
      }
      const pPosition = (a.practitioner?.position || a.practitioner?.Position || "")?.toLowerCase().trim();
      return pPosition && (selectedPositions.size === 0 || selectedPositions.has(pPosition)) && withinHours;
    });

    let vb = localBlocks.filter((b: any) => {
      const start = new Date(b.startTime);
      const hour = start.getHours();
      const withinHours = hour >= GRID_CONFIG.START_HOUR && hour < GRID_CONFIG.END_HOUR;
      const bPractitioner = b.practitioner || practitioners.find((p: any) => p.practitionerId.toLowerCase().trim() === b.practitionerId.toLowerCase().trim());
      const bName = (bPractitioner ? `${bPractitioner.firstName} ${bPractitioner.lastName}` : "")?.toLowerCase().trim();
      if (bName === "system admin" && b.status === "Blocked") return false;
      if (selectedPractitioners.size > 0) {
        const bId = (b.practitionerId || b.practitioner?.practitionerId || "")?.toLowerCase().trim();
        return ((bId && selectedIds.has(bId)) || (bName && selectedFullNames.has(bName))) && withinHours;
      }
      const pPosition = (b.practitioner?.position || b.practitioner?.Position || "")?.toLowerCase().trim();
      return pPosition && (selectedPositions.size === 0 || selectedPositions.has(pPosition)) && withinHours;
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
          reschedule({ variables: { id: apptId, newStart: newStart.toISOString(), newEnd: newEnd.toISOString() } });
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
          updateBlock({ variables: { id: blockId, newStart: newStart.toISOString(), newEnd: newEnd.toISOString() } });
        }
      });
    }
  };

  const HOURS = useMemo(() => Array.from({ length: GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR }, (_, i) => i + GRID_CONFIG.START_HOUR), [GRID_CONFIG.START_HOUR, GRID_CONFIG.END_HOUR]);

  return (
    <div className="h-[calc(100vh-40px)] flex flex-col bg-[var(--background)] text-[var(--text-primary)] p-6 gap-6 overflow-hidden">

      {/* Professional Header */}
      <div className="shrink-0 flex items-center justify-between bg-[var(--card-bg)] px-8 py-6 rounded-2xl border border-[var(--card-border)] shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-1.5 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_15px_var(--primary-glow)]" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-none">Clinical Scheduling</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                {localAppointments.length} Appointments
              </span>
              <span className="text-xs font-medium text-[var(--text-muted)] border-l border-[var(--card-border)] pl-4">{monthLabel} // Clinical Schedule</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => refetch()} className="p-3 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)] hover:bg-[var(--primary)]/10 transition-all active:scale-95 text-[var(--text-secondary)] hover:text-[var(--primary)]">
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="flex items-center bg-[var(--input-bg)] px-4 py-2 rounded-xl border border-[var(--card-border)]">
            <button onClick={() => setAnchor(new Date(anchor.setDate(anchor.getDate() - 7)))} className="p-2 hover:bg-[var(--primary)]/10 rounded-lg transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ChevronLeft className="w-5 h-5" /></button>
            <span className="px-6 text-sm font-semibold text-[var(--text-primary)]">{monthLabel}</span>
            <button onClick={() => setAnchor(new Date(anchor.setDate(anchor.getDate() + 7)))} className="p-2 hover:bg-[var(--primary)]/10 rounded-lg transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <button onClick={() => { setDrawerPrefill(undefined); setDrawerOpen(true); }}
            className="px-8 h-12 bg-[var(--primary)] hover:opacity-90 rounded-xl text-sm font-bold shadow-lg shadow-[var(--primary-glow)] transition-all text-[var(--text-primary)] active:scale-95">
            New Encounter
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 flex items-center gap-6 bg-[var(--input-bg)] px-6 py-4 rounded-2xl border border-[var(--card-border)]">
        <div className="flex items-center gap-3 px-5 py-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)]">
          <Filter className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Filter By Role</span>
        </div>
        <div className="flex items-center gap-3">
          {apiPositions.map(pos => {
            const style = POSITION_STYLE[pos] ?? { label: pos, color: "text-[var(--text-primary)]", bg: "bg-[var(--input-bg)]", border: "border-[var(--card-border)]" };
            const isActive = selectedPositions.has(pos);
            return (
              <button key={pos} onClick={() => togglePosition(pos)}
                className={`px-5 py-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2.5
                       ${isActive 
                    ? `bg-[var(--primary)]/15 border-[var(--primary)]/30 text-[var(--primary)] shadow-sm` 
                    : "bg-transparent border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]"}`}>
                {style.icon}
                <span className="capitalize">{pos.replace(/_/g, " ")}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 relative max-w-sm ml-6 pl-6 border-l border-[var(--card-border)]">
          <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
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
            className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-12 pr-10 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/40 transition-all appearance-none cursor-pointer shadow-sm"
            value={selectedPractitioners.size === 1 ? Array.from(selectedPractitioners)[0] : ""}
          >
            <option value="" className="bg-[var(--sidebar-bg)]">Filter by Clinical Provider...</option>
            {practitioners.map((p: any) => (
              <option key={p.practitionerId} value={p.practitionerId} className="bg-[var(--sidebar-bg)]">
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] rotate-90 pointer-events-none" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 min-h-0 bg-[var(--background)] rounded-2xl border border-[var(--card-border)] flex flex-col overflow-hidden relative">
        {/* Header Row */}
        <div className="grid grid-cols-[100px_1fr] bg-[var(--card-bg)] border-b border-[var(--card-border)] shrink-0 sticky top-0 z-[60] backdrop-blur-md">
          <div className="flex items-center justify-center border-r border-[var(--card-border)]"><Clock className="w-5 h-5 text-[var(--text-muted)] opacity-50" /></div>
          <div className="grid grid-cols-7 divide-x divide-[var(--card-border)]">
            {weekDates.map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`flex flex-col items-center py-5 transition-all relative ${isToday ? "bg-[var(--primary)]/[0.05]" : ""}`}>
                  {isToday && <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--primary)] shadow-[0_0_15px_var(--primary)]" />}
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>
                    {GRID_CONFIG.DAYS[i]}
                  </span>
                  <div className={`mt-3 w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold transition-all
                    ${isToday ? "bg-[var(--primary)] text-[var(--text-primary)] shadow-lg shadow-[var(--primary-glow)]" : "text-[var(--text-muted)]"}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide relative">
          <div className="flex" style={{ height: `${(GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR) * GRID_CONFIG.ROW_HEIGHT}px` }}>
            <div className="w-[100px] border-r border-[var(--card-border)] bg-[var(--input-bg)] sticky left-0 z-50">
              {HOURS.map(h => (
                <div key={h} className="h-[100px] relative border-t border-[var(--card-border)] first:border-t-0">
                  <span className="absolute top-0 -translate-y-1/2 left-0 right-0 text-center text-[11px] text-[var(--text-muted)] font-bold tracking-tight">
                    {h % 12 || 12} {h < 12 ? "AM" : "PM"}
                  </span>
                </div>
              ))}
              {/* Closing line for the last hour (18:00) */}
              <div className="h-0 border-t border-[var(--card-border)]" />
            </div>

            <div className="flex-1 grid grid-cols-7 relative divide-x divide-[var(--card-border)]">
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
                    {HOURS.map(h => <div key={h} className="h-[100px] border-t border-[var(--card-border)] first:border-t-0" />)}
                    {/* Closing line for the last hour */}
                    <div className="h-0 border-t border-[var(--card-border)]" />

                    {/* Busy Blocks */}
                    {dayBlocks.map((block: any) => {
                      const start = new Date(block.startTime), end = new Date(block.endTime);
                      const startMin = (start.getHours() - GRID_CONFIG.START_HOUR) * 60 + start.getMinutes();
                      const durMin = (end.getTime() - start.getTime()) / 60000;
                      const topPx = startMin * (GRID_CONFIG.ROW_HEIGHT / 60);
                      const heightPx = Math.min(durMin * (GRID_CONFIG.ROW_HEIGHT / 60), (GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR) * GRID_CONFIG.ROW_HEIGHT - topPx);

                      return (
                        <div key={block.blockId} draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("blockId", block.blockId);
                            e.dataTransfer.setData("duration", durMin.toString());
                          }}
                          className="absolute left-1.5 right-1.5 z-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] p-4 flex flex-col gap-2 overflow-hidden cursor-grab active:cursor-grabbing hover:border-[var(--primary)]/40 transition-all"
                          style={{ top: `${topPx}px`, height: `${heightPx}px` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
                              <Shield className="w-4 h-4 text-[var(--text-muted)]" />
                              <span className="text-xs font-bold uppercase tracking-wider">Unavailable</span>
                            </div>
                            <span className="text-[11px] font-bold text-[var(--text-primary)] bg-[var(--input-bg)] px-2 py-1 rounded">
                              {start.getHours() % 12 || 12}:{start.getMinutes().toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Appointment Cards */}
                    {dayAppts.map((appt: any) => {
                      const style = POSITION_STYLE[appt.practitioner?.position.toLowerCase() || "nurse"] ?? POSITION_STYLE.nurse;
                      const start = new Date(appt.scheduledStart), end = new Date(appt.scheduledEnd);
                      const hasConflict = conflicts.has(appt.appointmentId);
                      const startMin = (start.getHours() - GRID_CONFIG.START_HOUR) * 60 + start.getMinutes();
                      let durMin = (end.getTime() - start.getTime()) / 60000;
                      const viewedPractitionerId = selectedPractitioners.size === 1 ? Array.from(selectedPractitioners)[0] : null;
                      const isViewedAsSc = viewedPractitionerId && viewedPractitionerId !== appt.practitionerId && appt.supportingClinicians?.some((sc: any) => sc.practitionerId === viewedPractitionerId);
                      if (isViewedAsSc) durMin = 15;
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
                          {/* Drive Time Indicator */}
                          {driveMin > 0 && modality.label !== "TELEHEALTH" && !isViewedAsSc && (
                            <div className="absolute border-l-8 border-[var(--primary)] bg-[var(--primary)]/[0.12] flex items-start justify-end p-2 z-10 rounded-xl shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.05)]"
                              style={{ 
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                top: `${(startMin - driveMin) * (GRID_CONFIG.ROW_HEIGHT / 60)}px`, 
                                height: `${driveMin * (GRID_CONFIG.ROW_HEIGHT / 60)}px`,
                                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(var(--primary-rgb), 0.05) 10px, rgba(var(--primary-rgb), 0.05) 20px)`
                              }}>
                              <span className="text-[10px] font-black text-white bg-[var(--primary)] px-2.5 py-1.5 rounded-lg shadow-2xl flex items-center gap-2 mt-2 ring-2 ring-white/20">
                                <Navigation className="w-3.5 h-3.5 fill-white" /> {driveMin}m Travel
                              </span>
                            </div>
                          )}

                          <div className={`absolute z-20 group/appt ${hasConflict ? "ring-2 ring-red-500 rounded-xl" : ""}`}
                            style={{ 
                              top: `${topPx}px`, 
                              height: `${heightPx}px`,
                              left: `${leftPct + 0.5}%`,
                              width: `${widthPct - 1}%`
                            }}>

                            <div draggable onDragStart={(e) => { e.dataTransfer.setData("appointmentId", appt.appointmentId); e.dataTransfer.setData("duration", durMin.toString()); }}
                              onClick={() => { setDrawerPrefill(appt.appointmentId); setDrawerOpen(true); }}
                              className={`absolute top-0 left-0 right-0 h-full group-hover/appt:h-auto rounded-xl p-3 border shadow-md transition-all duration-300 ease-out flex flex-col cursor-grab active:cursor-grabbing overflow-hidden bg-[var(--card-bg)]/90 backdrop-blur-lg z-10 group-hover/appt:z-[70] group-hover/appt:shadow-2xl group-hover/appt:translate-y-[-4px]
                                    ${style.bg} ${hasConflict ? "border-red-500/50" : style.border} group-hover/appt:border-[var(--primary)]/40`}>

                              {/* Header Section */}
                              <div className="flex flex-wrap items-center justify-between shrink-0 mb-2 gap-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                  <div className={`px-2 py-1 rounded bg-[var(--input-bg)] border border-[var(--card-border)] text-[10px] font-bold text-[var(--text-secondary)] flex items-center gap-1 shrink-0`}>
                                    {React.cloneElement(modality.icon as React.ReactElement, { className: "w-3 h-3 text-[var(--primary)]" })}
                                    <span className="whitespace-nowrap">{modality.label}</span>
                                  </div>
                                  <div className={`px-2 py-1 rounded ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} text-[10px] font-bold flex items-center gap-1 border shadow-sm shrink-0`}>
                                    <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} /> 
                                    <span className="whitespace-nowrap">{statusConfig.label}</span>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-[var(--text-primary)] shrink-0 ml-auto whitespace-nowrap">
                                  {start.getHours() % 12 || 12}:{start.getMinutes().toString().padStart(2, '0')}
                                </span>
                              </div>

                              {/* Patient Data */}
                              <div className="flex flex-col mb-2">
                                <h4 className="text-sm font-bold text-[var(--text-primary)] tracking-tight group-hover/appt:text-[var(--primary)] transition-colors leading-tight">{appt.patient?.firstName} {appt.patient?.lastName}</h4>
                                <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium leading-tight line-clamp-1">{appt.patient?.addresses?.[0]?.address?.street || "No address provided"}</p>
                              </div>

                              {/* Detailed Hover Info */}
                              <div className="hidden group-hover/appt:flex flex-col gap-4 mt-2 pb-4 border-t border-[var(--card-border)] pt-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                <div className="flex flex-col gap-1">
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Clinical Lead</p>
                                  <p className="text-xs font-semibold text-[var(--text-primary)]">{appt.practitioner?.firstName} {appt.practitioner?.lastName}</p>
                                </div>
                                {appt.supportingClinicians?.length > 0 && (
                                  <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Support Team</p>
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
                                  {appt.practitioner && (
                                    <div className="w-7 h-7 rounded-lg bg-[var(--primary)] border-2 border-[var(--card-bg)] flex items-center justify-center text-[9px] font-bold text-[var(--text-primary)] shadow-sm" title="Primary Clinician">PC</div>
                                  )}
                                  {appt.supportingClinicians?.length > 0 && (
                                    <div className="w-7 h-7 rounded-lg bg-blue-600 border-2 border-[var(--card-bg)] flex items-center justify-center text-[9px] font-bold text-[var(--text-primary)] shadow-sm" title="Supporting Staff">SS</div>
                                  )}
                                </div>
                                <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover/appt:text-[var(--primary)] transition-colors" />
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

      <BookingDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onBooked={() => refetch()} prefillDate={drawerPrefill} appointmentId={drawerPrefill?.length === 36 ? drawerPrefill : undefined} />

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
                className="py-3 rounded-xl bg-[var(--primary)] text-[var(--text-primary)] font-semibold text-sm shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all"
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
