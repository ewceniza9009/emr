"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import BookingDrawer from "./BookingDrawer";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Stethoscope,
  Heart,
  Shield,
  Users,
  Filter,
  Plus,
  Video,
  Home,
  Building2,
  CheckCircle,
  Activity,
  Info,
  MapPin,
  Car,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

// This type is a UI-only concern — it maps whatever string the API returns
// to a visual style. It is NOT the source of truth for what positions exist.
type PositionStyle = {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
};

type AppointmentModality =
  | "InPersonFacility"
  | "InPersonHomeVisit"
  | "TelehealthVideo"
  | "TelehealthAudioOnly";

interface CalendarAppointment {
  appointmentId: string;
  scheduledStart: string;
  scheduledEnd: string;
  modality: AppointmentModality;
  status: string;
  travelTimeMinutes: number | null;
  distanceInMiles: number | null;
  patient: { firstName: string; lastName: string; address: string | null } | null;
  practitioner: { practitionerId: string; fullName: string; position: string } | null;
}

interface CalendarPractitioner {
  practitionerId: string;
  fullName: string;
  position: string; // Raw string from API — source of truth
  userId: string;
  isActive: boolean;
}

// ─── GraphQL — API is the source of truth ─────────────────────────────────────

const GET_SCHEDULE_DATA = gql`
  query GetScheduleData($startDate: DateTime!, $endDate: DateTime!) {
    appointments(
      where: {
        scheduledStart: { gte: $startDate }
        scheduledEnd: { lte: $endDate }
      }
    ) {
      appointmentId
      scheduledStart
      scheduledEnd
      modality
      status
      practitioner {
        practitionerId
        fullName
        position
      }
      travelTimeMinutes
      distanceInMiles
      patient { 
        firstName 
        lastName 
        address
      }
    }
    practitioners(where: { isActive: { eq: true } }) {
      practitionerId
      fullName
      position
      userId
      isActive
    }
  }
`;

// ─── UI-ONLY: Visual style lookup per position string ────────────────────────
// This is presentation only. The list of valid positions is ALWAYS derived
// from the API response, never from the keys of this map.

const POSITION_STYLE: Record<string, PositionStyle> = {
  CARE_NAVIGATOR: {
    label: "Care Navigator",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: <Users className="w-3.5 h-3.5" />,
  },
  SUPPORTING_CLINICIAN: {
    label: "Supporting Clinician",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: <Stethoscope className="w-3.5 h-3.5" />,
  },
  PHYSICIAN: {
    label: "Physician",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: <Shield className="w-3.5 h-3.5" />,
  },
};

// Fallback for any position the API returns that isn't in the style map yet
const FALLBACK_STYLE: PositionStyle = {
  label: "Provider",
  color: "text-slate-300",
  bg: "bg-white/5",
  border: "border-white/10",
  icon: <User className="w-3.5 h-3.5" />,
};

function getPositionStyle(position: string): PositionStyle {
  return POSITION_STYLE[position] ?? FALLBACK_STYLE;
}

// ─── Modality helpers ─────────────────────────────────────────────────────────

const MODALITY_ICON: Record<string, React.ReactNode> = {
  IN_PERSON_HOME_VISIT: <Home className="w-3 h-3" />,
  IN_PERSON_FACILITY: <Building2 className="w-3 h-3" />,
  TELEHEALTH_VIDEO: <Video className="w-3 h-3" />,
  TELEHEALTH_AUDIO_ONLY: <Video className="w-3 h-3" />,
};

const MODALITY_LABEL: Record<string, string> = {
  IN_PERSON_HOME_VISIT: "Home Visit",
  IN_PERSON_FACILITY: "Facility",
  TELEHEALTH_VIDEO: "Telehealth",
  TELEHEALTH_AUDIO_ONLY: "Audio Only",
};

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7am → 10pm
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PX_PER_MIN = 64 / 60; // Slightly taller rows for better visibility

function getWeekDates(anchor: Date): Date[] {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatHour(h: number) {
  return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

function apptTopOffset(start: string) {
  const d = new Date(start);
  return ((d.getHours() - 7) * 60 + d.getMinutes()) * PX_PER_MIN;
}

function apptHeight(start: string, end: string) {
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
  return Math.max(diff * PX_PER_MIN, 28);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SchedulingCalendar() {
  const [anchor, setAnchor] = useState(new Date());
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [drawerPrefill, setDrawerPrefill] = useState<string | undefined>();
  const [dragApptId, setDragApptId]     = useState<string | null>(null);

  // selectedPositions starts empty — populated once API responds
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [selectedModalities, setSelectedModalities] = useState<Set<string>>(new Set(["IN_PERSON_HOME_VISIT", "IN_PERSON_FACILITY", "TELEHEALTH_VIDEO", "TELEHEALTH_AUDIO_ONLY"]));
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(null);
  const [initialised, setInitialised] = useState(false);

  const RESCHEDULE_APPT = gql`
    mutation RescheduleAppointment($appointmentId: UUID!, $newStart: DateTime!, $newEnd: DateTime!) {
      rescheduleAppointment(appointmentId: $appointmentId, newStart: $newStart, newEnd: $newEnd) {
        appointmentId scheduledStart scheduledEnd
      }
    }
  `;
  const [reschedule] = useMutation(RESCHEDULE_APPT, { refetchQueries: ["GetScheduleData"] });

  const weekDates = useMemo(() => getWeekDates(anchor), [anchor]);
  const startDate = weekDates[0].toISOString();
  const endDate = new Date(weekDates[6].getTime() + 86_400_000).toISOString();

  const { data, loading, error } = useQuery(GET_SCHEDULE_DATA, {
    variables: { startDate, endDate },
  });

  const practitioners: CalendarPractitioner[] = data?.practitioners ?? [];
  const appointments: CalendarAppointment[] = data?.appointments ?? [];

  useEffect(() => {
    if (data) {
        console.log(">>> CALENDAR DATA LOADED", {
            practitionerCount: practitioners.length,
            appointmentCount: appointments.length,
            practitionerIds: practitioners.map(p => p.practitionerId),
            firstApptPractitioner: appointments[0]?.practitioner
        });
    }
  }, [data, practitioners, appointments]);

  // ── Derive distinct positions from the API response (source of truth) ──────
  const apiPositions = useMemo(
    () => Array.from(new Set(practitioners.map((p) => p.position))).sort(),
    [practitioners]
  );

  // On first successful load, select ALL positions that actually exist in the DB
  useEffect(() => {
    if (!initialised && apiPositions.length > 0) {
      setSelectedPositions(new Set(apiPositions));
      setInitialised(true);
    }
  }, [apiPositions, initialised]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const visiblePractitioners = useMemo(
    () =>
      practitioners.filter(
        (p) =>
          selectedPositions.has(p.position) &&
          (!selectedPractitionerId || p.practitionerId === selectedPractitionerId)
      ),
    [practitioners, selectedPositions, selectedPractitionerId]
  );

  const visiblePractitionerIds = useMemo(
    () => new Set(visiblePractitioners.map((p) => p.practitionerId)),
    [visiblePractitioners]
  );

  const visibleAppointments = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.practitioner != null &&
          visiblePractitionerIds.has(a.practitioner.practitionerId) &&
          selectedModalities.has(a.modality)
      ),
    [appointments, visiblePractitionerIds, selectedModalities]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const togglePosition = (pos: string) => {
    setSelectedPositions((prev) => {
      const next = new Set(prev);
      next.has(pos) ? next.delete(pos) : next.add(pos);
      return next;
    });
  };

  const today = new Date();
  const monthLabel = weekDates[0].toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            Clinical Schedule
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Weekly view ·{" "}
            {loading
              ? "Loading..."
              : `${visiblePractitioners.length} provider${visiblePractitioners.length !== 1 ? "s" : ""} shown`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            {Object.entries(MODALITY_LABEL).map(([key, label]) => {
              const active = selectedModalities.has(key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedModalities(prev => {
                      const next = new Set(prev);
                      next.has(key) ? next.delete(key) : next.add(key);
                      return next;
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5
                    ${active ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-400"}`}
                >
                  {MODALITY_ICON[key]}
                  {label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => { setDrawerPrefill(undefined); setDrawerOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Book Appointment
          </button>
        </div>
      </div>

      {/* ── Week Navigator ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const d = new Date(anchor);
            d.setDate(d.getDate() - 7);
            setAnchor(d);
          }}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-white font-bold">{monthLabel}</p>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">
            {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
            {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => {
            const d = new Date(anchor);
            d.setDate(d.getDate() + 7);
            setAnchor(d);
          }}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Filters — positions come from API, never hardcoded ── */}
      <div className="glass-morphism rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Filter className="w-3.5 h-3.5" />
            Filter by Position
          </div>
          {!loading && (
            <span className="text-[10px] text-slate-600 font-mono">
              {apiPositions.length} ROLE{apiPositions.length !== 1 ? "S" : ""} IN SYSTEM
            </span>
          )}
        </div>

        {/* Position chips — rendered only from API data */}
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {loading && !initialised && (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-24 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}
          {apiPositions.map((pos) => {
            const style = getPositionStyle(pos);
            const active = selectedPositions.has(pos);
            const count = practitioners.filter((p) => p.position === pos).length;
            return (
              <button
                key={pos}
                onClick={() => togglePosition(pos)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all
                  ${active
                    ? `${style.bg} ${style.border} ${style.color}`
                    : "bg-white/5 border-white/5 text-slate-600 hover:text-slate-400"
                  }`}
              >
                {style.icon}
                {style.label}
                <span
                  className={`ml-1 px-1 rounded text-[10px] font-mono
                    ${active ? "bg-white/10" : "bg-white/5 text-slate-700"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
          {error && (
            <span className="text-xs text-red-400">Failed to load positions from API.</span>
          )}
        </div>

        {/* Provider quick-select — derived from filtered practitioners */}
        {visiblePractitioners.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            <button
              onClick={() => setSelectedPractitionerId(null)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all
                ${!selectedPractitionerId ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              All
            </button>
            {visiblePractitioners.map((p) => {
              const style = getPositionStyle(p.position);
              const isActive = selectedPractitionerId === p.practitionerId;
              return (
                <button
                  key={p.practitionerId}
                  onClick={() =>
                    setSelectedPractitionerId(isActive ? null : p.practitionerId)
                  }
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all
                    ${isActive ? `${style.bg} ${style.color}` : "text-slate-500 hover:text-slate-300"}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                      ${isActive ? style.color.replace("text-", "bg-") : "bg-slate-600"}`}
                  />
                  {p.fullName}
                  <span className="text-[9px] opacity-60 font-normal">
                    {getPositionStyle(p.position).label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Calendar Grid ── */}
      <div className="glass-morphism rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        {/* Day Headers */}
        <div className="grid grid-cols-[64px_1fr] bg-[#08090d]/80 border-b border-white/5">
          <div className="border-r border-white/5" />
          <div className="grid grid-cols-7">
            {weekDates.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div key={i} className="py-4 text-center border-l border-white/5 first:border-l-0">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? "text-blue-400" : "text-slate-500"}`}>
                    {DAYS[i]}
                  </p>
                  <p className={`text-lg font-bold mt-0.5 ${isToday ? "text-blue-400" : "text-white"}`}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Grid */}
        <div className="relative overflow-y-auto" style={{ maxHeight: "600px" }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-slate-300 text-sm glass-morphism px-4 py-2 rounded-xl">
                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                Loading schedule...
              </div>
            </div>
          )}

          <div className="flex">
            {/* Hour gutter */}
            <div className="border-r border-white/5 w-16 bg-[#08090d]/50 shrink-0">
              {HOURS.map((h) => (
                <div key={h} className="flex items-start justify-end pr-3 pt-2" style={{ height: "64px" }}>
                  <span className="text-[10px] text-slate-500 font-mono font-black">{formatHour(h)}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex-1 grid grid-cols-7">
              {weekDates.map((d, dayIdx) => {
                const isToday = d.toDateString() === today.toDateString();
                const dayAppts = visibleAppointments.filter(
                  (a) => new Date(a.scheduledStart).toDateString() === d.toDateString()
                );

                const handleDrop = (e: React.DragEvent, hour: number) => {
                  e.preventDefault();
                  if (!dragApptId) return;
                  const appt = visibleAppointments.find(a => a.appointmentId === dragApptId);
                  if (!appt) return;
                  const dur = new Date(appt.scheduledEnd).getTime() - new Date(appt.scheduledStart).getTime();
                  const newStart = new Date(d);
                  newStart.setHours(hour, 0, 0, 0);
                  const newEnd = new Date(newStart.getTime() + dur);
                  reschedule({ variables: { appointmentId: dragApptId, newStart: newStart.toISOString(), newEnd: newEnd.toISOString() } });
                  setDragApptId(null);
                };

                return (
                  <div
                    key={dayIdx}
                    className={`relative border-l border-white/5 first:border-l-0 ${isToday ? "bg-blue-500/[0.02]" : ""}`}
                    style={{ height: `${HOURS.length * 64}px` }}
                    onDragOver={e => e.preventDefault()}
                  >
                    {/* Hour grid lines */}
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        onDrop={e => handleDrop(e, h)}
                        onDragOver={e => e.preventDefault()}
                        onClick={() => {
                          const prefill = new Date(d);
                          prefill.setHours(h, 0, 0, 0);
                          setDrawerPrefill(prefill.toISOString());
                          setDrawerOpen(true);
                        }}
                        className="absolute left-0 right-0 border-t border-white/[0.04] hover:bg-blue-500/5 transition-colors cursor-crosshair group/hour"
                        style={{ top: `${(h - 7) * 64}px`, height: "64px" }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/hour:opacity-100 transition-opacity">
                          <Plus className="w-4 h-4 text-blue-500/30" />
                        </div>
                      </div>
                    ))}

                    {/* Today indicator */}
                    {isToday && (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-blue-400/70 z-10"
                        style={{ top: `${((today.getHours() - 7) * 60 + today.getMinutes()) * (64/60)}px` }}
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-400 -mt-1 -ml-1" />
                      </div>
                    )}

                    {/* Appointments */}
                    {(() => {
                      const sortedAppts = [...dayAppts].sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
                      const columns: CalendarAppointment[][] = [];
                      sortedAppts.forEach(appt => {
                        let placed = false;
                        for (let col of columns) {
                          if (new Date(appt.scheduledStart) >= new Date(col[col.length - 1].scheduledEnd)) {
                            col.push(appt);
                            placed = true;
                            break;
                          }
                        }
                        if (!placed) columns.push([appt]);
                      });

                      return sortedAppts.map((appt) => {
                        const style = getPositionStyle(appt.practitioner?.position ?? "CARE_NAVIGATOR");
                        const top = ((new Date(appt.scheduledStart).getHours() - 7) * 60 + new Date(appt.scheduledStart).getMinutes()) * (64/60);
                        const durationMinutes = (new Date(appt.scheduledEnd).getTime() - new Date(appt.scheduledStart).getTime()) / 60000;
                        const height = Math.max(durationMinutes * (64/60), 32);
                        const patientLabel = appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : "Unknown Patient";
                        const colIdx = columns.findIndex(col => col.includes(appt));
                        const widthPercent = 100 / columns.length;

                        return (
                          <div
                            key={appt.appointmentId}
                            draggable
                            onDragStart={() => setDragApptId(appt.appointmentId)}
                            onDragEnd={() => setDragApptId(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrawerPrefill(appt.appointmentId);
                              setDrawerOpen(true);
                            }}
                            className={`absolute rounded-xl px-3 py-2 overflow-hidden cursor-pointer hover:scale-[1.02] ${style.bg} border-2 ${style.border} hover:brightness-125 transition-all shadow-xl group/appt ${dragApptId === appt.appointmentId ? "opacity-50" : ""}`}
                            style={{ 
                              top: `${top}px`, 
                              height: `${height}px`,
                              left: `${colIdx * widthPercent + 1}%`,
                              width: `${widthPercent - 2}%`,
                              zIndex: 20
                            }}
                          >
                            <div className="flex flex-col h-full">
                              <div className="flex items-center justify-between mb-1">
                                <div className={`flex items-center gap-2 ${style.color}`}>
                                  {MODALITY_ICON[appt.modality] ?? <Building2 className="w-4 h-4" />}
                                  <p className="text-[11px] font-black uppercase tracking-tight truncate">{patientLabel}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {appt.status === "Scheduled" && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                                  {appt.status === "InProgress" && <Activity className="w-3 h-3 text-blue-500 animate-pulse" />}
                                  {appt.status === "OnHold" && <Info className="w-3 h-3 text-amber-500" />}
                                </div>
                              </div>
                              {height > 40 && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 opacity-60">
                                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                    <p className="text-[9px] font-bold text-slate-300 truncate uppercase">{appt.patient?.address || "No Address"}</p>
                                  </div>
                                  {appt.travelTimeMinutes && (
                                    <div className="flex items-center gap-1.5">
                                      <Car className="w-2.5 h-2.5 text-blue-400" />
                                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                        {Math.round(appt.travelTimeMinutes)}M DRIVE ({appt.distanceInMiles?.toFixed(1)}M)
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="mt-auto flex items-center gap-1.5 opacity-40 group-hover/appt:opacity-100 transition-opacity">
                                <User className="w-2.5 h-2.5" />
                                <p className="text-[8px] font-black uppercase tracking-tighter truncate">{appt.practitioner?.fullName}</p>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      {apiPositions.length > 0 && (
        <div className="glass-morphism rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Position Legend · {apiPositions.length} active roles in system
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {apiPositions.map((pos) => {
              const style = getPositionStyle(pos);
              return (
                <div key={pos} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${style.color.replace("text-", "bg-")}`} />
                  <span className="text-xs text-slate-400">{style.label}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-4 ml-auto text-[10px] text-slate-600">
              <span className="flex items-center gap-1"><Home className="w-3 h-3" /> Home Visit</span>
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> Facility</span>
              <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Telehealth</span>
            </div>
          </div>
        </div>
      )}
      <BookingDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onBooked={() => {}}
        prefillDate={drawerPrefill}
        appointmentId={drawerPrefill?.length === 36 ? drawerPrefill : undefined}
      />
    </div>
  );
}
