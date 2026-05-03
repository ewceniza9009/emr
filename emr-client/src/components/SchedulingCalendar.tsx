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
  nurse: { label: "Nurse", color: "text-[#00F2FF]", bg: "bg-sky-500/20", border: "border-sky-400/50", icon: <Users className="w-4 h-4" /> },
  physician: { label: "Physician", color: "text-[#FFB800]", bg: "bg-amber-500/20", border: "border-amber-400/50", icon: <Shield className="w-4 h-4" /> },
  practitioner: { label: "Practitioner", color: "text-[#B066FF]", bg: "bg-purple-500/20", border: "border-purple-400/50", icon: <Stethoscope className="w-4 h-4" /> },
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
    if (!statusStr) return { label: "SCHED", bg: "bg-white/5", border: "border-white/10", text: "text-white/40", dot: "bg-white/20" };
    const s = statusStr.toUpperCase();
    if (s.includes("INPROGRESS")) return { label: "LIVE", bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-400", dot: "bg-emerald-400 animate-pulse" };
    if (s.includes("HOLD")) return { label: "HOLD", bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-400", dot: "bg-amber-400" };
    if (s.includes("COMPLETE")) return { label: "DONE", bg: "bg-blue-500/20", border: "border-blue-500/50", text: "text-blue-400", dot: "bg-blue-400" };
    if (s.includes("CANCEL")) return { label: "CANC", bg: "bg-rose-500/20", border: "border-rose-500/50", text: "text-rose-400", dot: "bg-rose-400" };
    return { label: "SCHED", bg: "bg-white/5", border: "border-white/10", text: "text-white/40", dot: "bg-white/20" };
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPrefill, setDrawerPrefill] = useState<string | undefined>();
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [selectedPractitioners, setSelectedPractitioners] = useState<Set<string>>(new Set());
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    title: string;
    message: string;
  }>({ isOpen: false, onConfirm: () => {}, title: "", message: "" });

  const togglePosition = (pos: string) => {
    setSelectedPositions(prev => {
        const n = new Set(prev);
        if (n.has(pos)) n.delete(pos);
        else n.add(pos);
        return n;
    });
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
        startDate: weekDates[0].toISOString(), 
        endDate: new Date(weekDates[6].getTime() + 86400000).toISOString() 
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

  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (practitioners.length > 0 && status === "authenticated" && !initializedRef.current) {
      const userPractitionerId = (session?.user as any)?.practitionerId;
      const userName = session?.user?.name?.toLowerCase() || "";
      
      let targetPractitioner = practitioners.find((p: any) => 
        (userPractitionerId && p.practitionerId === userPractitionerId) ||
        (userName && (
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(userName) ||
          userName.includes(p.firstName.toLowerCase()) ||
          userName.includes(p.lastName.toLowerCase())
        ))
      );
      
      if (targetPractitioner) {
        setSelectedPositions(new Set([targetPractitioner.position.toLowerCase()]));
        setSelectedPractitioners(new Set([targetPractitioner.practitionerId]));
        initializedRef.current = true;
      } else if (practitioners.length > 5) { 
        // Only fallback to "All" if we have a significant list and still no match
        setSelectedPositions(new Set(apiPositions));
        initializedRef.current = true;
      }
    }
  }, [practitioners, status, session, apiPositions]);

  const { visibleAppointments, visibleBlocks, conflicts } = useMemo(() => {
    let va = localAppointments.filter((a: any) => {
        const start = new Date(a.scheduledStart);
        const hour = start.getHours();
        return selectedPositions.has(a.practitioner?.position.toLowerCase()) && 
               hour >= GRID_CONFIG.START_HOUR && hour < GRID_CONFIG.END_HOUR;
    });

    let vb = localBlocks.filter((b: any) => {
        const start = new Date(b.startTime);
        const hour = start.getHours();
        return selectedPositions.has(b.practitioner?.position.toLowerCase()) && 
               hour >= GRID_CONFIG.START_HOUR && hour < GRID_CONFIG.END_HOUR;
    });
    
    if (selectedPractitioners.size > 0) {
      va = va.filter((a: any) => selectedPractitioners.has(a.practitionerId));
      vb = vb.filter((b: any) => selectedPractitioners.has(b.practitionerId));
    }

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

  const HOURS = useMemo(() => Array.from({ length: GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR + 1 }, (_, i) => i + GRID_CONFIG.START_HOUR), []);

  return (
    <div className="h-[calc(100vh-40px)] flex flex-col bg-[#050608] text-white p-6 gap-6 overflow-hidden">
      
      {/* ── HEADER ── */}
      <div className="shrink-0 flex items-center justify-between bg-[#0a0b10] p-4 rounded-[2rem] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-xl font-black uppercase tracking-tighter text-white">Clinical Grid</h1>
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase">{localAppointments.length} Records In-Memory</span>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => refetch()} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 active:scale-95 transition-all">
                <RefreshCw className="w-6 h-6 text-blue-400" />
            </button>
            <div className="flex items-center bg-white/5 p-2 rounded-[1.5rem] border border-white/10">
                <button onClick={() => setAnchor(new Date(anchor.setDate(anchor.getDate() - 7)))} className="p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronLeft className="w-6 h-6 text-white/50" /></button>
                <span className="px-8 text-xs font-black uppercase tracking-[0.3em] text-white">MAY 2026</span>
                <button onClick={() => setAnchor(new Date(anchor.setDate(anchor.getDate() + 7)))} className="p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronRight className="w-6 h-6 text-white/50" /></button>
            </div>
            <button onClick={() => { setDrawerPrefill(undefined); setDrawerOpen(true); }} 
                className="px-12 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all">
                New Encounter
            </button>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="shrink-0 flex items-center gap-4 bg-[#0a0b10] p-4 rounded-[2rem] border border-white/10">
        <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
            <Filter className="w-4 h-4 text-white/30" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Active Units</span>
        </div>
        {apiPositions.map(pos => {
            const style = POSITION_STYLE[pos] ?? { label: pos, color: "text-white", bg: "bg-white/5", border: "border-white/10" };
            return (
                <button key={pos} onClick={() => togglePosition(pos)}
                  className={`px-4 py-1.5 rounded-lg border font-bold text-[10px] tracking-widest transition-all
                    ${selectedPositions.has(pos) 
                      ? `${style.bg} ${style.border} ${style.color} shadow-[0_0_15px_rgba(0,0,0,0.3)]` 
                      : "bg-white/[0.02] border-white/5 text-white/30 hover:bg-white/[0.05] hover:border-white/10"}`}>
                  <div className="flex items-center gap-2">
                    {style.icon}
                    <span className="uppercase">{pos.replace(/_/g, " ")}</span>
                  </div>
                </button>
            );
        })}

      {/* ── Practitioner Combo Box ── */}
      <div className="flex-1 relative max-w-xs border-l border-white/10 ml-4 pl-4">
        <select 
          onChange={(e) => {
            const id = e.target.value;
            if (id === "all") setSelectedPractitioners(new Set());
            else setSelectedPractitioners(new Set([id]));
          }}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
          value={selectedPractitioners.size === 1 ? Array.from(selectedPractitioners)[0] : "all"}
        >
          <option value="all" className="bg-[#0a0b10] text-white/50">ALL SELECTED PROVIDERS</option>
          {practitioners
            .filter((p: any) => selectedPositions.has(p.position.toLowerCase()))
            .map((p: any) => (
              <option key={p.practitionerId} value={p.practitionerId} className="bg-[#0a0b10] text-white">
                {p.firstName} {p.lastName} ({p.position})
              </option>
            ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronRight className="w-3 h-3 text-white/30 rotate-90" />
        </div>
      </div>
    </div>

      {/* ── GRID ── */}
      <div className="flex-1 min-h-0 bg-[#0a0b10] rounded-[3rem] border border-white/10 flex flex-col overflow-hidden">
        <div className="grid grid-cols-[100px_1fr] bg-[#0c0d15] border-b border-white/10 shrink-0 sticky top-0 z-50">
          <div className="flex items-center justify-center border-r border-white/10"><Clock className="w-5 h-5 text-white/10" /></div>
          <div className="grid grid-cols-7">
            {weekDates.map((d, i) => (
                <div key={i} className={`py-4 text-center border-l border-white/10 first:border-l-0 ${d.toDateString() === new Date(2026, 4, 3).toDateString() ? "bg-blue-600/10" : ""}`}>
                    <p className={`text-[9px] font-black uppercase mb-1 tracking-[0.2em] ${i === 0 ? "text-blue-400" : "text-white/20"}`}>{GRID_CONFIG.DAYS[i]}</p>
                    <span className={`text-2xl font-black ${i === 0 ? "text-white" : "text-white/40"}`}>{d.getDate()}</span>
                </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide relative">
          <div className="flex" style={{ height: `${(GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR + 1) * GRID_CONFIG.ROW_HEIGHT}px` }}>
            <div className="w-[100px] border-r border-white/10 bg-[#0a0b10]/40 sticky left-0 z-20">
              {HOURS.map(h => (
                <div key={h} className="h-[80px] flex items-start justify-center pt-4 border-b border-white/[0.04]">
                  <span className="text-[11px] text-white/40 font-black uppercase tracking-widest">{h % 12 || 12} {h < 12 ? "AM" : "PM"}</span>
                </div>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-7 relative">
              {weekDates.map((d, dayIdx) => {
                const dayAppts = visibleAppointments.filter((a: any) => new Date(a.scheduledStart).toDateString() === d.toDateString());
                const dayBlocks = visibleBlocks.filter((b: any) => new Date(b.startTime).toDateString() === d.toDateString());

                return (
                  <div key={dayIdx} 
                    className="relative border-l border-white/10 first:border-l-0 transition-colors hover:bg-white/[0.02]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, d)}
                  >
                    {HOURS.map(h => <div key={h} className="h-[80px] border-b border-white/[0.04]" />)}

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
                          className="absolute left-1.5 right-1.5 z-0 rounded-xl bg-slate-950/40 border border-slate-800/30 backdrop-blur-sm p-3 flex flex-col gap-2 overflow-hidden cursor-grab active:cursor-grabbing hover:border-slate-500 transition-all"
                          style={{ top: `${top}%`, height: `${height}%` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BUSY BLOCK</span>
                            </div>
                            <span className="text-[8px] font-black text-slate-600 bg-black/20 px-1.5 py-0.5 rounded border border-white/5 uppercase">
                                {start.getHours() % 12 || 12}:{start.getMinutes().toString().padStart(2, '0')} - {end.getHours() % 12 || 12}:{end.getMinutes().toString().padStart(2, '0')}
                            </span>
                          </div>
                          <p className="text-[10px] font-black text-slate-200 uppercase truncate tracking-wide">OFF-DUTY / BLOCKED</p>
                          <div className="mt-auto flex items-center gap-2">
                             <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[7px] font-black text-white">{block.practitioner?.firstName?.[0]}{block.practitioner?.lastName?.[0]}</div>
                             <span className="text-[8px] font-bold text-slate-500 uppercase truncate">{block.practitioner?.firstName} {block.practitioner?.lastName}</span>
                          </div>
                        </div>
                      );
                    })}

                    {dayAppts.map((appt: any) => {
                        const style = POSITION_STYLE[appt.practitioner?.position.toLowerCase() || "nurse"] ?? POSITION_STYLE.nurse;
                        const start = new Date(appt.scheduledStart), end = new Date(appt.scheduledEnd);
                        const hasConflict = conflicts.has(appt.appointmentId);
                        
                        const startMin = (start.getHours() - GRID_CONFIG.START_HOUR) * 60 + start.getMinutes();
                        const durMin = (end.getTime() - start.getTime()) / 60000;
                        
                        const modality = getModalityConfig(appt.modality);
                        const statusConfig = getStatusConfig(appt.status);
                        
                        // Strictly mapped to backend routing data. 0 means 0.
                        const driveMin = appt.travelTimeMinutes || 0;
                        const hasCn = (appt.supportingClinicians?.length > 0) || (appt.supportingPractitionerIds?.length > 0);

                        if (startMin < 0 || startMin >= GRID_CONFIG.TOTAL_MINUTES) return null;

                        const top = (startMin / GRID_CONFIG.TOTAL_MINUTES) * 100;
                        // Clamp height so it doesn't spill over the grid
                        const height = Math.min(durMin / GRID_CONFIG.TOTAL_MINUTES * 100, 100 - top);

                        if (durMin <= 0) return null;

                        return (
                          <React.Fragment key={appt.appointmentId}>
                            {/* Drive Time Visualization */}
                            {driveMin > 0 && modality.label !== "TELEHEALTH" && hasCn && (
                                <div className="absolute left-4 right-4 border-l-2 border-dashed border-blue-500/50 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(59,130,246,0.1)_4px,rgba(59,130,246,0.1)_8px)] flex items-start justify-end p-1 z-0 rounded-t-lg"
                                     style={{ top: `${((startMin - driveMin) / GRID_CONFIG.TOTAL_MINUTES) * 100}%`, height: `${(driveMin / GRID_CONFIG.TOTAL_MINUTES) * 100}%` }}>
                                     <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest bg-[#0a0b10] px-1 py-0.5 rounded shadow-xl -mt-1 border border-blue-500/20">
                                        <Navigation className="inline w-2 h-2 mr-0.5"/> {driveMin}m Drive
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
                                className={`absolute top-0 left-0 right-0 min-h-full max-h-full group-hover/appt:max-h-[400px] rounded-lg p-1.5 border shadow-lg transition-all duration-300 flex flex-col cursor-grab active:cursor-grabbing overflow-hidden bg-[#0c0d15] z-10 group-hover/appt:z-50
                                    ${style.bg} backdrop-blur-xl ${hasConflict ? "border-rose-500/50 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : style.border}`}>
                                
                                {/* Header: Modality & Time */}
                                <div className="flex items-center justify-between shrink-0 mb-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-widest flex items-center gap-1 ${style.color} bg-black/40 border border-white/10 shadow-sm`}>
                                            {modality.icon}
                                            <span className="truncate">{modality.label}</span>
                                        </div>
                                        <div className={`px-1 py-0.5 rounded ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} text-[7px] font-black uppercase tracking-widest flex items-center gap-1 border`}>
                                            <div className={`w-1 h-1 rounded-full ${statusConfig.dot}`} /> {statusConfig.label}
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-black text-white/40 bg-black/20 px-1 py-0.5 rounded border border-white/5">
                                        {start.getHours() % 12 || 12}:{start.getMinutes().toString().padStart(2, '0')}
                                    </span>
                                </div>

                                {/* Patient Identity & Micro Avatars (Always Visible) */}
                                <div className="flex items-center justify-between shrink-0 mb-0.5">
                                    <div className="flex flex-col truncate">
                                        <span className="text-[10px] leading-tight font-black text-white uppercase truncate" title={`${appt.patient?.firstName} ${appt.patient?.lastName}`}>{appt.patient?.firstName} {appt.patient?.lastName}</span>
                                        {modality.label !== "TELEHEALTH" && appt.patient?.addresses?.[0]?.address?.street && (
                                            <span className="text-[8px] font-bold text-white/40 truncate mt-0.5" title={appt.patient.addresses[0].address.street}>
                                                {appt.patient.addresses[0].address.street}
                                            </span>
                                        )}
                                    </div>
                                    {/* The "Hint" of CN and SC */}
                                    <div className="flex -space-x-1 shrink-0 ml-1">
                                        {appt.supportingClinicians?.length > 0 && (
                                            <div className="w-3.5 h-3.5 rounded-full bg-purple-600 border border-[#0a0b10] flex items-center justify-center text-[5px] font-black text-white shadow-md">CN</div>
                                        )}
                                        {appt.practitioner && (
                                            <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-[#0a0b10] flex items-center justify-center text-[5px] font-black text-white shadow-md">SC</div>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Hover Info (Revealed on hover via max-h expansion) */}
                                <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1.5 shrink-0 opacity-0 group-hover/appt:opacity-100 transition-opacity delay-75">
                                    {modality.label !== "TELEHEALTH" && (
                                        <p className="text-[8px] font-bold text-white/60 truncate flex items-center gap-1.5">
                                            <Home className="w-2.5 h-2.5 text-white/40 shrink-0" />
                                            <span className={`truncate ${appt.patient?.addresses?.[0]?.address?.street ? "text-white/80" : "text-rose-400"}`}>
                                                {appt.patient?.addresses?.[0]?.address?.street || "NO ADDRESS ON FILE"}
                                            </span>
                                        </p>
                                    )}
                                    <div className="flex flex-col gap-1 mt-1 bg-black/20 p-1.5 rounded border border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-purple-600 border border-white/10 flex items-center justify-center text-[5px] font-black text-white shrink-0">CN</div>
                                            {(() => {
                                                const cn = appt.supportingClinicians?.[0] || practitioners.find((pr: any) => appt.supportingPractitionerIds?.some((id: string) => id?.toLowerCase() === pr.practitionerId?.toLowerCase()));
                                                const name = cn ? `${cn.firstName} ${cn.lastName}`.trim() : "";
                                                return (
                                                    <span className={`text-[8px] font-black uppercase truncate ${name ? "text-white/90" : "text-white/50"}`}>
                                                        {name || "UNASSIGNED"}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-blue-600 border border-white/10 flex items-center justify-center text-[5px] font-black text-white shrink-0">SC</div>
                                            {(() => {
                                                const p = appt.practitioner || practitioners.find((pr: any) => pr.practitionerId?.toLowerCase() === appt.practitionerId?.toLowerCase());
                                                const name = p ? `${p.firstName} ${p.lastName}`.trim() : "";
                                                return (
                                                    <span className={`text-[8px] font-black uppercase truncate ${name ? "text-white/90" : "text-white/50"}`}>
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

      <BookingDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onBooked={() => {}} prefillDate={drawerPrefill} appointmentId={drawerPrefill?.length === 36 ? drawerPrefill : undefined} />

      {/* ── Confirmation Modal ── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#0c0d15] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full space-y-6 shadow-2xl scale-in-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto border border-blue-500/20">
               <AlertCircle className="w-8 h-8" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">{confirmModal.title}</h3>
              <p className="text-slate-400 text-sm">{confirmModal.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="py-4 rounded-xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-all uppercase text-[10px] tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 uppercase text-[10px] tracking-widest"
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
