"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import BookingDrawer from "@/components/BookingDrawer";
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
  patient: { firstName: string; lastName: string } | null;
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
      patient { firstName lastName }
      practitioner {
        practitionerId
        fullName
        position
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
  CareNavigator: {
    label: "Care Navigator",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: <Users className="w-3.5 h-3.5" />,
  },
  SupportingClinician: {
    label: "Supporting Clinician",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: <Stethoscope className="w-3.5 h-3.5" />,
  },
  Nurse: {
    label: "Nurse",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: <Heart className="w-3.5 h-3.5" />,
  },
  Physician: {
    label: "Physician",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: <Shield className="w-3.5 h-3.5" />,
  },
  Admin: {
    label: "Admin",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    icon: <User className="w-3.5 h-3.5" />,
  },
  SocialWorker: {
    label: "Social Worker",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    icon: <Users className="w-3.5 h-3.5" />,
  },
  Chaplain: {
    label: "Chaplain",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    icon: <Heart className="w-3.5 h-3.5" />,
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
  InPersonHomeVisit: <Home className="w-3 h-3" />,
  InPersonFacility: <Building2 className="w-3 h-3" />,
  TelehealthVideo: <Video className="w-3 h-3" />,
  TelehealthAudioOnly: <Video className="w-3 h-3" />,
};

const MODALITY_LABEL: Record<string, string> = {
  InPersonHomeVisit: "Home Visit",
  InPersonFacility: "Facility",
  TelehealthVideo: "Telehealth",
  TelehealthAudioOnly: "Audio Only",
};

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am → 6pm
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PX_PER_MIN = 56 / 60;

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
          visiblePractitionerIds.has(a.practitioner.practitionerId)
      ),
    [appointments, visiblePractitionerIds]
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
        <button
          onClick={() => { setDrawerPrefill(undefined); setDrawerOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold transition-all">
          <Plus className="w-4 h-4" />
          Book Appointment
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
          <p className="text-slate-500 text-xs">
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

      {/* ── Calendar Grid ── */}
      <div className="glass-morphism rounded-3xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-white/5">
          <div className="p-3" />
          {weekDates.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div
                key={i}
                className={`p-3 text-center border-l border-white/5 ${isToday ? "bg-blue-500/5" : ""}`}
              >
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {DAYS[i]}
                </p>
                <p className={`text-lg font-bold mt-0.5 ${isToday ? "text-blue-400" : "text-white"}`}>
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="relative overflow-y-auto" style={{ maxHeight: "600px" }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-slate-300 text-sm glass-morphism px-4 py-2 rounded-xl">
                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                Loading schedule from API...
              </div>
            </div>
          )}

          <div className="grid grid-cols-8">
            {/* Hour gutter */}
            <div className="border-r border-white/5">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="flex items-start justify-end pr-3 pt-1"
                  style={{ height: "56px" }}
                >
                  <span className="text-[10px] text-slate-600 font-mono">{formatHour(h)}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDates.map((d, dayIdx) => {
              const isToday = d.toDateString() === today.toDateString();
              const dayAppts = visibleAppointments.filter(
                (a) => new Date(a.scheduledStart).toDateString() === d.toDateString()
              );

              // Drop handler — drop an appointment onto a new hour slot
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
                  className={`relative border-l border-white/5 ${isToday ? "bg-blue-500/[0.02]" : ""}`}
                  style={{ height: `${HOURS.length * 56}px` }}
                  onDragOver={e => e.preventDefault()}
                >
                  {/* Hour grid lines — also act as drop zones */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      onDrop={e => handleDrop(e, h)}
                      onDragOver={e => e.preventDefault()}
                      className="absolute left-0 right-0 border-t border-white/[0.04] hover:bg-blue-500/5 transition-colors"
                      style={{ top: `${(h - 7) * 56}px`, height: "56px" }}
                    />
                  ))}

                  {/* Current time indicator */}
                  {isToday && (
                    <div
                      className="absolute left-0 right-0 border-t-2 border-blue-400/70 z-10"
                      style={{
                        top: `${((today.getHours() - 7) * 60 + today.getMinutes()) * PX_PER_MIN}px`,
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-400 -mt-1 -ml-1" />
                    </div>
                  )}

                  {/* Appointments — filtered by API-driven visible practitioners */}
                  {dayAppts.map((appt) => {
                    const pos = appt.practitioner?.position ?? "CareNavigator";
                    const style = getPositionStyle(pos);
                    const top = apptTopOffset(appt.scheduledStart);
                    const height = apptHeight(appt.scheduledStart, appt.scheduledEnd);
                    const patientLabel = appt.patient
                      ? `${appt.patient.firstName} ${appt.patient.lastName}`
                      : "Unknown Patient";

                    return (
                      <div
                        key={appt.appointmentId}
                        draggable
                        onDragStart={() => setDragApptId(appt.appointmentId)}
                        onDragEnd={() => setDragApptId(null)}
                        className={`absolute left-1 right-1 rounded-lg px-1.5 py-1 overflow-hidden cursor-grab active:cursor-grabbing
                          ${style.bg} border ${style.border} hover:brightness-125 transition-all
                          ${dragApptId === appt.appointmentId ? "opacity-50 scale-95" : ""}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`Drag to reschedule · ${patientLabel} · ${appt.practitioner?.fullName}`}
                      >
                        <div className={`flex items-center gap-1 ${style.color}`}>
                          {MODALITY_ICON[appt.modality] ?? <Building2 className="w-3 h-3" />}
                          <p className="text-[10px] font-bold truncate">{patientLabel}</p>
                        </div>
                        {height > 36 && (
                          <p className="text-[9px] text-slate-500 truncate mt-0.5">
                            {appt.practitioner?.fullName}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Legend — built from API positions, not static list ── */}
      {apiPositions.length > 0 && (
        <div className="glass-morphism rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Position Legend · {apiPositions.length} active role{apiPositions.length !== 1 ? "s" : ""} in system
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
      />
    </div>
  );
}
