"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useCommandModal } from "./CommandModalProvider";
import { format, addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import Link from "next/link";
import {
  X, Calendar, Clock, User, MapPin, Video, Home,
  Building2, CheckCircle, Car, Search, ChevronRight,
  Stethoscope, Shield, Users, Info, ChevronLeft,
  Timer, Zap, Navigation, Check, Activity, Target, Phone, Edit3, AlertCircle,
  Brain, HeartPulse, HeartHandshake, Wind, Sprout, Sun, Star, ListChecks, ClipboardList
} from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";
import HalcyonPortal from "./Portal";

const BOOK_APPOINTMENT = gql`
  mutation BookAppointment($input: BookAppointmentInput!) {
    bookAppointment(input: $input) {
      appointmentId
      scheduledStart
      scheduledEnd
      modality
      status
      travelTimeMinutes
      distanceInMiles
      plannedAssessments
    }
  }
`;

const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($id: UUID!) {
    deleteAppointment(id: $id)
  }
`;

const CREATE_SCHEDULE_BLOCK = gql`
  mutation CreateScheduleBlock($input: CreateScheduleBlockInput!) {
    createScheduleBlock(input: $input) {
      blockId
      startTime
      endTime
      status
    }
  }
`;

const GET_PATIENTS = gql`
  query GetPatients {
    patients {
      items {
        patientId
        firstName
        lastName
        mrn
        addresses {
          isPrimary
          address {
            street
            city
            state
            postalCode
          }
        }
      }
    }
  }
`;

const GET_PRACTITIONERS = gql`
  query GetPractitioners {
    practitioners {
      practitionerId
      firstName
      lastName
      fullName
      position
      isCareNavigator
      isSupportingClinician
    }
  }
`;

const GET_APPOINTMENT = gql`
  query GetAppointment($id: UUID!) {
    appointment(id: $id) {
      appointmentId
      patientId
      practitionerId
      practitioner { practitionerId firstName lastName position }
      supportingClinicians { practitionerId firstName lastName position }
      scheduledStart
      scheduledEnd
      modality
      status
      travelTimeMinutes
      distanceInMiles
      plannedAssessments
      patient {
        firstName
        lastName
        addresses {
          isPrimary
          address {
            street
            city
            state
            postalCode
          }
        }
      }
    }
  }
`;

const GET_GEOSPATIAL_AVAILABILITY = gql`
  query GetGeospatialAvailability(
    $patientId: UUID!
    $targetStart: DateTime!
    $durationMinutes: Int!
    $modality: AppointmentModality!
    $appointmentId: UUID
  ) {
    availableProviders(
      patientId: $patientId
      targetStart: $targetStart
      durationMinutes: $durationMinutes
      modality: $modality
      appointmentId: $appointmentId
    ) {
      practitionerId
      fullName
      role
      distanceInMiles
      travelTimeInMinutes
      shiftStart
      shiftEnd
    }
  }
`;

const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

const ASSESSMENT_OPTIONS = [
  {
    category: "Symptom and Pain",
    icon: <HeartPulse className="w-4 h-4" />,
    items: [
      { id: "ESAS", label: "ESAS", fullName: "Edmonton Symptom Assessment", description: "Pain, tiredness, nausea, appetite, well-being" },
      { id: "BPI", label: "BPI", fullName: "Brief Pain Inventory", description: "Pain severity and impact on functions" },
      { id: "MSAS", label: "MSAS", fullName: "Memorial Symptom Scale", description: "Physical and psychological symptom burden" },
      { id: "VICTORIA_BOWEL", label: "Victoria Bowel", fullName: "Victoria Bowel Scale", description: "Assessment of constipation severity" },
    ]
  },
  {
    category: "Functional Status",
    icon: <Navigation className="w-4 h-4" />,
    items: [
      { id: "PPS", label: "PPS", fullName: "Palliative Performance Scale", description: "Ambulation, self-care, and intake" },
      { id: "KPS", label: "KPS", fullName: "Karnofsky Performance Scale", description: "Functional impairment classification" },
      { id: "ECOG", label: "ECOG", fullName: "ECOG Performance Status", description: "Impact of disease on daily living" },
      { id: "FAST", label: "FAST", fullName: "Functional Assessment Staging", description: "Alzheimer's and dementia progression" },
    ]
  },
  {
    category: "Psychological & Cognitive",
    icon: <Brain className="w-4 h-4" />,
    items: [
      { id: "HADS", label: "HADS", fullName: "Hospital Anxiety & Depression", description: "Detecting anxiety and depression states" },
      { id: "PHQ9", label: "PHQ-9", fullName: "Patient Health Questionnaire-9", description: "Screening and measuring depression severity" },
      { id: "MMSE_MOCA", label: "MMSE/MoCA", fullName: "Mini-Mental / MoCA", description: "Cognitive impairment assessment" },
    ]
  },
  {
    category: "Quality of Life",
    icon: <Sun className="w-4 h-4" />,
    items: [
      { id: "MQOL", label: "MQOL", fullName: "McGill Quality of Life", description: "Physical, psychological, existential domains" },
      { id: "FACIT_PAL", label: "FACIT-Pal", description: "Palliative-specific well-being concerns" },
    ]
  },
  {
    category: "Spiritual & Existential",
    icon: <Wind className="w-4 h-4" />,
    items: [
      { id: "FICA", label: "FICA", fullName: "FICA Spiritual History", description: "Faith, Importance, Community, Address" },
      { id: "HOPE", label: "HOPE", fullName: "HOPE Questions", description: "Hope, Organized religion, Practices, Effects" },
    ]
  },
  {
    category: "Prognostic Indices",
    icon: <Timer className="w-4 h-4" />,
    items: [
      { id: "PPI", label: "PPI", fullName: "Palliative Prognostic Index", description: "Survival prediction based on PPS and clinicals" },
      { id: "PAP", label: "PaP", fullName: "Palliative Prognostic Score", description: "KPS and survival prediction markers" },
    ]
  },
  {
    category: "Caregiver Assessment",
    icon: <HeartHandshake className="w-4 h-4" />,
    items: [
      { id: "ZBI", label: "ZBI", fullName: "Zarit Burden Interview", description: "Family caregiver stress and strain" },
      { id: "CSI", label: "CSI", fullName: "Caregiver Strain Index", description: "Physical, financial, and emotional stress" },
    ]
  }
];

interface Props {
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
  prefillDate?: string;
  appointmentId?: string;
  patientId?: string;
}

export default function BookingDrawer({ open, onClose, onBooked, prefillDate, appointmentId, patientId: propPatientId }: Props) {
  const { confirm, alert } = useCommandModal();
  const { data: session } = useSession();
  const [patientId, setPatientId] = useState("");
  const [patientAddress, setPatientAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: ""
  });
  const [practitionerId, setPractitionerId] = useState("");
  const [supportingIds, setSupportingIds] = useState<string[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [period, setPeriod] = useState<"AM" | "PM" | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(prefillDate || Date.now());
    return isNaN(d.getTime()) ? new Date() : d;
  });
  const [viewDate, setViewDate] = useState(() => {
    return isNaN(selectedDate.getTime()) ? new Date() : new Date(selectedDate);
  });
  const [duration, setDuration] = useState(60);
  const [modality, setModality] = useState("IN_PERSON_HOME_VISIT");
  const [visitType, setVisitType] = useState("ROUTINE_SYMPTOM_MANAGEMENT");
  const [booked, setBooked] = useState(false);
  const [cnSearch, setCnSearch] = useState("");
  const [scSearch, setScSearch] = useState("");
  const [plannedAssessments, setPlannedAssessments] = useState<string[]>([]);
  const [isBlockMode, setIsBlockMode] = useState(false);
  const [blockStatus, setBlockStatus] = useState("BLOCKED");
  const [startHour, setStartHour] = useState(8);
  const [startMinute, setStartMinute] = useState(0);
  const { tenantConfig, isLoaded } = useSettings();

  const clinicalConfig = useMemo(() => ({
    AM_START: tenantConfig.amStartHour,
    PM_START: tenantConfig.pmStartHour,
    DAY_END: tenantConfig.dayEndHour,
    CUTOFF_HOUR: tenantConfig.pmStartHour,
    TIMEZONE: tenantConfig.timezone,
    ENGINE_SAFETY_DRIVE_MINS: tenantConfig.engineSafetyDriveMins,
    ENGINE_SAFETY_DIST_KM: tenantConfig.engineSafetyDistKm,
    IOT_SYNC_INTERVAL_MS: tenantConfig.iotSyncIntervalMs,
    URGENT_PAIN_THRESHOLD: tenantConfig.urgentPainThreshold,
    URGENT_WELLBEING_THRESHOLD: tenantConfig.urgentWellbeingThreshold
  }), [tenantConfig]);

  const createZonedISO = useCallback((date: Date, hours: number, minutes: number) => {
    const year = date.getFullYear(), month = date.getMonth(), day = date.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    return fromZonedTime(dateStr, clinicalConfig.TIMEZONE).toISOString();
  }, [clinicalConfig.TIMEZONE]);

  const formatForEngine = useCallback((date: Date, hours: number) => {
    const d = new Date(date);
    d.setHours(hours, 0, 0, 0);
    const offset = -d.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const offH = pad(Math.floor(Math.abs(offset) / 60));
    const offM = pad(Math.abs(offset) % 60);
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(hours);
    return `${y}-${m}-${day}T${h}:00:00${sign}${offH}:${offM}`;
  }, []);

  useEffect(() => {
    if (open && !appointmentId && !prefillDate && !propPatientId) {
      setPatientId("");
      setPatientSearch("");
      setPatientAddress({ street: "", city: "", state: "", postalCode: "" });
      setPractitionerId("");
      setSupportingIds([]);
      setPlannedAssessments([]);
      setPeriod(null);
      setModality("IN_PERSON_HOME_VISIT");
      setDuration(60);
      setBooked(false);
      setIsEditingAddress(false);
      setShowPatientResults(false);
      setIsBlockMode(false);
      setBlockStatus("BLOCKED");
      setStartHour(8);
      setStartMinute(0);
      const now = new Date();
      setSelectedDate(now);
      setViewDate(now);
    }
  }, [open, appointmentId, prefillDate, propPatientId]);

  useEffect(() => {
    if (open && propPatientId && !appointmentId) {
      setPatientId(propPatientId);
    }
  }, [open, propPatientId, appointmentId]);

  const [debouncedDuration, setDebouncedDuration] = useState(duration);
  const [debouncedDate, setDebouncedDate] = useState(selectedDate);
  const [debouncedModality, setDebouncedModality] = useState(modality);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDuration(duration);
      setDebouncedDate(selectedDate);
      setDebouncedModality(modality);
    }, 300);
    return () => clearTimeout(handler);
  }, [duration, selectedDate, modality]);

  useEffect(() => {
    if (appointmentId) {
      setPatientId("");
      setPatientSearch("");
      setPractitionerId("");
      setSupportingIds([]);
      setPlannedAssessments([]);
      setPeriod(null);
      setBooked(false);
    }
  }, [appointmentId]);

  const { data: patientData } = useQuery(GET_PATIENTS, { skip: !open });
  const { data: practitionerData } = useQuery(GET_PRACTITIONERS, { skip: !open });

  const { data: appointmentData } = useQuery(GET_APPOINTMENT, {
    variables: { id: appointmentId },
    skip: !appointmentId || !open
  });

  useEffect(() => {
    if (appointmentData?.appointment) {
      const a = appointmentData.appointment;
      setPatientId(a.patientId);
      setPatientAddress({
        street: a.patient?.addresses?.find((x: any) => x.isPrimary)?.address?.street || a.patient?.addresses?.[0]?.address?.street || "",
        city: a.patient?.addresses?.find((x: any) => x.isPrimary)?.address?.city || a.patient?.addresses?.[0]?.address?.city || "",
        state: a.patient?.addresses?.find((x: any) => x.isPrimary)?.address?.state || a.patient?.addresses?.[0]?.address?.state || "",
        postalCode: a.patient?.addresses?.find((x: any) => x.isPrimary)?.address?.postalCode || a.patient?.addresses?.[0]?.address?.postalCode || ""
      });
      setPractitionerId(a.practitionerId || "");
      const rawSupporting = a.supportingClinicians?.map((s: any) => s.practitionerId) || [];
      setSupportingIds(rawSupporting);
      setModality(a.modality);
      const start = new Date(a.scheduledStart);
      setSelectedDate(start);
      setPeriod(start.getHours() < 12 ? "AM" : "PM");
      setDuration(Math.round((new Date(a.scheduledEnd).getTime() - start.getTime()) / 60000));
      setVisitType(a.visitType || "ROUTINE_SYMPTOM_MANAGEMENT");
      setPlannedAssessments(a.plannedAssessments || []);
      setPatientSearch(`${a.patient?.firstName} ${a.patient?.lastName}`);
      setIsEditingAddress(false);
    }
  }, [appointmentData]);

  const { data: amData, loading: amLoading } = useQuery(GET_GEOSPATIAL_AVAILABILITY, {
    variables: {
      patientId,
      targetStart: formatForEngine(debouncedDate, clinicalConfig.AM_START),
      modality: debouncedModality,
      durationMinutes: debouncedDuration,
      appointmentId: appointmentId || null
    },
    skip: !patientId || !open
  });

  const { data: pmData, loading: pmLoading } = useQuery(GET_GEOSPATIAL_AVAILABILITY, {
    variables: {
      patientId,
      targetStart: formatForEngine(debouncedDate, clinicalConfig.PM_START),
      modality: debouncedModality,
      durationMinutes: debouncedDuration,
      appointmentId: appointmentId || null
    },
    skip: !patientId || !open
  });

  const currentGeoData = period === "AM" ? amData : pmData;

  useEffect(() => {
    if (currentGeoData?.availableProviders?.length > 0 && !practitionerId) {
      const userPracId = (session?.user as any)?.practitionerId;
      const me = currentGeoData.availableProviders.find((p: any) => p.practitionerId?.toLowerCase() === userPracId?.toLowerCase());

      if (me) {
        setPractitionerId(me.practitionerId);
      } else {
        const best = [...currentGeoData.availableProviders]
          .filter(p => p.role === "CareNavigator")
          .sort((a, b) => a.travelTimeInMinutes - b.travelTimeInMinutes)[0];
        if (best) setPractitionerId(best.practitionerId);
        else {
          const fallback = [...currentGeoData.availableProviders]
            .sort((a, b) => a.travelTimeInMinutes - b.travelTimeInMinutes)[0];
          if (fallback) setPractitionerId(fallback.practitionerId);
        }
      }
    }
  }, [currentGeoData, practitionerId, session]);

  const practitionerSlots = useMemo(() => {
    const map = new Map<string, any[]>();
    currentGeoData?.availableProviders?.forEach((slot: any) => {
      const start = new Date(slot.shiftStart);
      const end = new Date(slot.shiftEnd);
      const isWithinClinicalHours = start.getHours() >= clinicalConfig.AM_START && end.getHours() <= clinicalConfig.DAY_END;
      const isAM = start.getHours() < clinicalConfig.CUTOFF_HOUR;
      const isCorrectPeriod = period === "AM" ? isAM : !isAM;
      if (isWithinClinicalHours && isCorrectPeriod) {
        const existing = map.get(slot.practitionerId) || [];
        map.set(slot.practitionerId, [...existing, slot]);
      }
    });
    return map;
  }, [currentGeoData, period, clinicalConfig.AM_START, clinicalConfig.CUTOFF_HOUR, clinicalConfig.DAY_END]);

  const displayCns = useMemo(() => {
    const geoProviders = currentGeoData?.availableProviders || [];
    const allPractitioners = practitionerData?.practitioners || [];
    const combined = allPractitioners.filter((p: any) =>
      (p.isCareNavigator || p.practitionerId?.toLowerCase() === practitionerId?.toLowerCase()) &&
      !supportingIds.some(id => id?.toLowerCase() === p.practitionerId?.toLowerCase())
    ).sort((a: any, b: any) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));
    const filtered = combined.filter((p: any) =>
      !cnSearch ||
      p.firstName?.toLowerCase().includes(cnSearch.toLowerCase()) ||
      p.lastName?.toLowerCase().includes(cnSearch.toLowerCase()) ||
      p.fullName?.toLowerCase().includes(cnSearch.toLowerCase())
    );
    return filtered.map((p: any) => {
      const geo = geoProviders.find((g: any) => g.practitionerId?.toLowerCase() === p.practitionerId?.toLowerCase());
      const isExistingLead = appointmentData?.appointment?.practitionerId?.toLowerCase() === p.practitionerId?.toLowerCase();

      return {
        ...p,
        ...geo,
        travelTimeInMinutes: isExistingLead ? (appointmentData.appointment.travelTimeMinutes ?? geo?.travelTimeInMinutes) : geo?.travelTimeInMinutes,
        distanceInMiles: isExistingLead ? (appointmentData.appointment.distanceInMiles ?? geo?.distanceInMiles) : geo?.distanceInMiles
      };
    });
  }, [currentGeoData, practitionerData, practitionerId, supportingIds, appointmentData, cnSearch]);

  const displayScs = useMemo(() => {
    const geoProviders = currentGeoData?.availableProviders || [];
    const allPractitioners = practitionerData?.practitioners || [];
    const combined = allPractitioners.filter((p: any) =>
      (p.isSupportingClinician || supportingIds.some(id => id?.toLowerCase() === p.practitionerId?.toLowerCase())) &&
      p.practitionerId?.toLowerCase() !== practitionerId?.toLowerCase() &&
      p.position?.toLowerCase() !== "admin"
    ).sort((a: any, b: any) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));
    const filtered = combined.filter((p: any) =>
      !scSearch ||
      p.firstName?.toLowerCase().includes(scSearch.toLowerCase()) ||
      p.lastName?.toLowerCase().includes(scSearch.toLowerCase()) ||
      p.fullName?.toLowerCase().includes(scSearch.toLowerCase())
    );
    return filtered.map((p: any) => {
      const geo = geoProviders.find((g: any) => g.practitionerId?.toLowerCase() === p.practitionerId?.toLowerCase());
      return { ...p, ...geo };
    });
  }, [currentGeoData, practitionerData, practitionerId, supportingIds, scSearch]);

  const selectedSlot = useMemo(() => {
    const isEditingExisting = !!appointmentId && !!appointmentData?.appointment;
    const samePractitioner = isEditingExisting && appointmentData.appointment.practitionerId === practitionerId;

    if (samePractitioner) {
      const a = appointmentData.appointment;
      return {
        shiftStart: a.scheduledStart,
        shiftEnd: a.scheduledEnd,
        travelTimeInMinutes: a.travelTimeMinutes || 0,
        distanceInMiles: a.distanceInMiles || 0
      };
    }

    if (!practitionerId) return null;

    const slots = practitionerSlots.get(practitionerId) || [];
    if (slots.length === 0) {
      const fallbackHour = period === "AM" ? clinicalConfig.AM_START : clinicalConfig.PM_START;
      const startISO = createZonedISO(selectedDate, fallbackHour, 0);
      return {
        shiftStart: startISO,
        shiftEnd: addMinutes(new Date(startISO), duration).toISOString(),
        travelTimeInMinutes: null,
        distanceInMiles: null
      };
    }
    return slots[0];
  }, [practitionerId, practitionerSlots, appointmentId, appointmentData, period, selectedDate, duration, clinicalConfig.AM_START, clinicalConfig.PM_START, createZonedISO]);

  const [book, { loading: bookingLoading }] = useMutation(BOOK_APPOINTMENT, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      setBooked(true);
      setTimeout(() => { setBooked(false); onBooked(); onClose(); }, 1500);
    },
  });

  const [createBlock, { loading: blockLoading }] = useMutation(CREATE_SCHEDULE_BLOCK, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      setBooked(true);
      setTimeout(() => { setBooked(false); onBooked(); onClose(); }, 1500);
    },
  });

  const [deleteAppt] = useMutation(DELETE_APPOINTMENT, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      setBooked(true);
      setTimeout(() => { setBooked(false); onBooked(); onClose(); }, 1500);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!practitionerId) return;

    const baseSlot = isBlockMode ? null : selectedSlot;

    const slot = {
      shiftStart: baseSlot?.shiftStart || createZonedISO(
        selectedDate,
        isBlockMode ? startHour : (period === "AM" ? clinicalConfig.AM_START : clinicalConfig.PM_START),
        isBlockMode ? startMinute : 0
      ),
      shiftEnd: "",
      travelTimeInMinutes: baseSlot?.travelTimeInMinutes || 0,
      distanceInMiles: baseSlot?.distanceInMiles || 0
    };

    slot.shiftEnd = addMinutes(new Date(slot.shiftStart), duration).toISOString();

    if (isBlockMode) {
      createBlock({
        variables: {
          input: {
            practitionerId,
            startTime: slot.shiftStart,
            endTime: slot.shiftEnd,
            status: blockStatus
          }
        }
      });
      return;
    }

    if (!patientId) return;

    const clinicalHour = parseInt(formatInTimeZone(new Date(slot.shiftStart), clinicalConfig.TIMEZONE, "H"));
    const isSlotAM = clinicalHour < clinicalConfig.CUTOFF_HOUR;

    if (period === "AM" && !isSlotAM) return;
    if (period === "PM" && isSlotAM) return;

    book({
      variables: {
        input: {
          appointmentId: appointmentId || null,
          patientId,
          practitionerId,
          supportingPractitionerIds: supportingIds,
          scheduledStart: slot.shiftStart,
          scheduledEnd: slot.shiftEnd,
          modality,
          visitType,
          plannedAssessments,
          travelTimeMinutes: slot.travelTimeInMinutes,
          distanceInMiles: slot.distanceInMiles
        }
      }
    });
  };

  const renderCalendar = () => {
    const days = [];
    const count = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    for (let i = 0; i < first; i++) days.push(<div key={`empty-${i}`} className="h-10" />);
    for (let d = 1; d <= count; d++) {
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === viewDate.getMonth();
      days.push(
        <button key={d} type="button" onClick={() => { setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d)); setPeriod(null); setPractitionerId(""); }}
          className={`h-10 w-full rounded-2xl text-xs font-semibold transition-all flex items-center justify-center
            ${isSelected ? "bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
          {d}
        </button>
      );
    }
    return days;
  };

  if (!open) return null;

  const status = appointmentData?.appointment?.status?.toUpperCase();
  const isLive = status === "LIVE" || status?.includes("PROGRESS");
  const isCompleted = status === "COMPLETED";
  const isLocked = isLive || isCompleted;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 !m-0 !p-0 z-[9999999] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-black/5 backdrop-blur-sm" onClick={onClose} />

        <div className={`relative h-full w-full max-w-[900px] bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
          flex flex-col transition-transform duration-300 ease-out 
          ${open ? "translate-x-0" : "translate-x-full"}`}>

          <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0 backdrop-blur-md">
            <div className="flex items-center gap-6">
              <div className="w-1.5 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_20px_var(--primary-glow)]" />
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight leading-none">Schedule Appointment</h2>
                <span className="text-xs font-medium text-[var(--text-muted)] mt-1.5">Configure encounter details and clinical team</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {appointmentId && (() => {
                  const status = appointmentData?.appointment?.status?.toUpperCase();
                  return (status === "LIVE" || status?.includes("PROGRESS")) && (
                    <Link
                      href={`/dashboard/patients/${appointmentData?.appointment?.patientId}/visit?appointmentId=${appointmentId}`}
                      className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center gap-2 animate-pulse"
                    >
                      <Video className="w-4 h-4" />
                      Join Session
                    </Link>
                  );
                })()}
              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)]">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Booking Engine Active</span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--input-bg)] rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] px-8 py-3 border-b border-[var(--card-border)] flex items-center gap-6 shrink-0">
            <div className="flex bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--card-border)]">
              <button type="button" onClick={() => setIsBlockMode(false)}
                className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${!isBlockMode ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                Appointment
              </button>
              <button type="button" onClick={() => setIsBlockMode(true)}
                className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${isBlockMode ? "bg-amber-500 text-white shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                Busy Block
              </button>
            </div>
            {isBlockMode && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Reason:</span>
                <select value={blockStatus} onChange={e => setBlockStatus(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-amber-500 outline-none cursor-pointer">
                  <option value="BLOCKED">Unavailable / Personal</option>
                  <option value="AVAILABLE">Available for Booking</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-row overflow-hidden">
            <div className="flex-1 flex flex-col border-r border-[var(--card-border)] bg-[var(--sidebar-bg)] overflow-hidden">
              <form id="appointment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pt-4 space-y-6 scrollbar-hide">
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">01</span>
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{isBlockMode ? "Scheduling Details" : "Patient Selection"}</h3>
                    <div className="flex-1 h-px bg-[var(--card-border)]" />
                  </div>

                  {!isBlockMode && (
                    <div className="relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                      <input required={!isBlockMode} value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setShowPatientResults(true); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        placeholder="Search by MRN or patient name..."
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-14 pr-6 py-4 text-[var(--text-primary)] text-sm font-medium placeholder:text-[var(--text-muted)]
                          focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all shadow-sm"
                      />
                      {showPatientResults && patientSearch && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden z-[1001] max-h-60 overflow-y-auto shadow-2xl backdrop-blur-2xl">
                          {patientData?.patients?.items?.filter((p: any) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase())).map((p: any) => (
                            <button key={p.patientId} type="button" onClick={() => {
                              setPatientId(p.patientId);
                              setPatientSearch(`${p.firstName} ${p.lastName}`);
                              setPatientAddress({
                                street: p.addresses?.find((x: any) => x.isPrimary)?.address?.street || p.addresses?.[0]?.address?.street || "",
                                city: p.addresses?.find((x: any) => x.isPrimary)?.address?.city || p.addresses?.[0]?.address?.city || "",
                                state: p.addresses?.find((x: any) => x.isPrimary)?.address?.state || p.addresses?.[0]?.address?.state || "",
                                postalCode: p.addresses?.find((x: any) => x.isPrimary)?.address?.postalCode || p.addresses?.[0]?.address?.postalCode || ""
                              });
                              setShowPatientResults(false);
                              setIsEditingAddress(false);
                            }}
                              className="w-full px-6 py-4 text-left hover:bg-[var(--primary)]/10 border-b border-[var(--card-border)] transition-colors flex items-center justify-between group">
                              <span className="font-semibold text-[var(--text-primary)] text-sm">{p.firstName} {p.lastName}</span>
                              <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--primary)]">{p.mrn}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {(patientId || isBlockMode) && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <MapPin className="w-4 h-4 text-[var(--primary)]" />
                          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Service Location</span>
                        </div>
                        {!isBlockMode ? (
                          <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 relative group/addr space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Patient Primary Address</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={(() => {
                                  const activePractitioner = practitionerId
                                    ? displayCns.find((p: any) => p.practitionerId?.toLowerCase() === practitionerId.toLowerCase()) || displayScs.find((p: any) => p.practitionerId?.toLowerCase() === practitionerId.toLowerCase())
                                    : null;
                                  const mins = activePractitioner?.travelTimeInMinutes ?? 0;
                                  return "flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all group/travel";
                                })()}>
                                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                    <Navigation className="w-3 h-3 text-indigo-500 fill-indigo-500/20" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">
                                      {(() => {
                                        const activePractitioner = practitionerId
                                          ? displayCns.find((p: any) => p.practitionerId?.toLowerCase() === practitionerId.toLowerCase()) || displayScs.find((p: any) => p.practitionerId?.toLowerCase() === practitionerId.toLowerCase())
                                          : null;
                                        return activePractitioner?.travelTimeInMinutes != null ? `${activePractitioner.travelTimeInMinutes}m` : "0m";
                                      })()} Transit
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">Clinical Vector</span>
                                  </div>
                                </div>
                                <button type="button" onClick={() => setIsEditingAddress(!isEditingAddress)}
                                  className={`p-2.5 rounded-xl border transition-all ${isEditingAddress ? "bg-[var(--primary)] text-white border-transparent" : "bg-white/5 hover:bg-white/10 border-white/10 text-[var(--text-muted)]"}`}>
                                  {isEditingAddress ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {isEditingAddress ? (
                              <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Street Address</label>
                                  <input autoFocus value={patientAddress.street} onChange={e => setPatientAddress({ ...patientAddress, street: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">City</label>
                                    <input value={patientAddress.city} onChange={e => setPatientAddress({ ...patientAddress, city: e.target.value })}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all" />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">State</label>
                                    <input value={patientAddress.state} onChange={e => setPatientAddress({ ...patientAddress, state: e.target.value })}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all" />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Zip Code</label>
                                    <input value={patientAddress.postalCode} onChange={e => setPatientAddress({ ...patientAddress, postalCode: e.target.value })}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Street Address</label>
                                  <p className="text-sm font-semibold text-[var(--text-primary)]">{patientAddress.street || "No address recorded"}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">City</label>
                                    <p className="text-[13px] font-medium text-[var(--text-secondary)]">{patientAddress.city || "--"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">State</label>
                                    <p className="text-[13px] font-medium text-[var(--text-secondary)]">{patientAddress.state || "--"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Zip Code</label>
                                    <p className="text-[13px] font-medium text-[var(--text-secondary)]">{patientAddress.postalCode || "--"}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                            <Info className="w-4 h-4 text-amber-500" />
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest leading-relaxed">
                              Blocks do not require a patient record. You are reserving this time as &apos;Unavailable&apos;.
                            </p>
                          </div>
                        )}
                      </div>

                      {!isBlockMode && (
                        <>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                              <Activity className="w-4 h-4 text-[var(--primary)]" />
                              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Visit Modality</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                              {[
                                { id: "IN_PERSON_HOME_VISIT", label: "Home Visit", icon: <Home className="w-3.5 h-3.5" /> },
                                { id: "IN_PERSON_FACILITY", label: "Facility", icon: <Building2 className="w-3.5 h-3.5" /> },
                                { id: "TELEHEALTH_VIDEO", label: "Video Call", icon: <Video className="w-3.5 h-3.5" /> },
                                { id: "TELEPHONE", label: "Audio Only", icon: <Phone className="w-3.5 h-3.5" /> },
                              ].map((m) => (
                                <button key={m.id} type="button" onClick={() => { setModality(m.id); setPeriod(null); }}
                                  className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border text-[10px] font-bold transition-all
                                          ${modality === m.id ? "bg-[var(--primary)] border-transparent text-white shadow-lg shadow-[var(--primary-glow)]" : "bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10"}`}>
                                  {React.cloneElement(m.icon as React.ReactElement, { className: "w-4 h-4 shrink-0" })}
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                              <Stethoscope className="w-4 h-4 text-[var(--primary)]" />
                              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Visit Type</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { id: "INITIAL_HOSPICE_INTAKE", label: "Initial Intake", icon: <Zap className="w-3 h-3" /> },
                                { id: "ROUTINE_SYMPTOM_MANAGEMENT", label: "Routine Management", icon: <Activity className="w-3 h-3" /> },
                                { id: "BEREAVEMENT_FOLLOW_UP", label: "Bereavement", icon: <Shield className="w-3 h-3" /> },
                                { id: "EMERGENCY_TRIAGE", label: "Emergency", icon: <AlertCircle className="w-3 h-3" /> },
                                { id: "ADVANCE_CARE_PLANNING", label: "Advance Care", icon: <Target className="w-3 h-3" /> },
                                { id: "SPIRITUAL_ASSESSMENT", label: "Spiritual", icon: <Activity className="w-3 h-3" /> },
                                { id: "PSYCHOSOCIAL_ASSESSMENT", label: "Psychosocial", icon: <Users className="w-3 h-3" /> },
                              ].map((t) => (
                                <button key={t.id} type="button" onClick={() => setVisitType(t.id)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold transition-all
                                          ${visitType === t.id ? "bg-[var(--primary)] border-transparent text-white shadow-lg shadow-[var(--primary-glow)]" : "bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10"}`}>
                                  {t.icon}
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-4 h-4 text-[var(--primary)]" />
                          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Time & Duration</span>
                        </div>
                        <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-6 space-y-6">
                          {isBlockMode ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Start Time</label>
                                <div className="flex items-center gap-2">
                                  <select value={startHour} onChange={e => setStartHour(parseInt(e.target.value))}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all appearance-none cursor-pointer">
                                    {Array.from({ length: 24 }, (_, i) => (
                                      <option key={i} value={i} className="bg-[var(--sidebar-bg)]">{i % 12 || 12}:00 {i < 12 ? "AM" : "PM"}</option>
                                    ))}
                                  </select>
                                  <select value={startMinute} onChange={e => setStartMinute(parseInt(e.target.value))}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all appearance-none cursor-pointer">
                                    {[0, 15, 30, 45].map(m => (
                                      <option key={m} value={m} className="bg-[var(--sidebar-bg)]">{m.toString().padStart(2, '0')}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Duration (Min)</label>
                                <input type="number" step="15" min="15" value={duration} onChange={e => setDuration(parseInt(e.target.value))}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                  <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Scheduled Time</p>
                                  <p className="text-sm font-bold text-[var(--text-primary)]">
                                    {selectedSlot?.shiftStart ? format(new Date(selectedSlot.shiftStart), "hh:mm a") : (period ? (period === "AM" ? "08:00 AM (Target)" : "01:00 PM (Target)") : "Select Window")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 pr-2">
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Encounter Date</p>
                                  <p className="text-xs font-bold text-[var(--text-secondary)]">
                                    {format(selectedDate, "EEE, MMM do")}
                                  </p>
                                </div>
                                <div className="w-px h-8 bg-[var(--card-border)]" />
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Window</p>
                                  <p className={`text-xs font-bold ${period ? "text-[var(--primary)]" : "text-rose-500"}`}>
                                    {period ? (period === "AM" ? "MORNING" : "AFTERNOON") : "PENDING"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {!isBlockMode && (!patientId || !period) ? (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-[var(--text-muted)] opacity-30" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-muted)]">
                      {!patientId ? "Select a patient to begin scheduling" : "Choose a time slot to see available clinicians"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">02</span>
                          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{isBlockMode ? "Assign Clinician" : "Clinical Lead Assignment"}</h3>
                        </div>
                        <div className="relative group">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                          <input
                            type="text"
                            placeholder="Search Leads..."
                            value={cnSearch}
                            onChange={(e) => setCnSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/40 w-32 focus:w-48 transition-all"
                          />
                        </div>
                      </div>
                      <div className="max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {displayCns.map((p: any) => {
                            const pid = p.practitionerId;
                            const isPrimary = practitionerId?.toLowerCase() === pid?.toLowerCase();
                            const isSupporting = supportingIds.some((id: string) => id?.toLowerCase() === pid?.toLowerCase());
                            return (
                              <div key={pid} className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group
                                  ${isPrimary || isSupporting ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 shadow-sm" : "bg-white/5 border-white/10 hover:border-white/30"}`}
                                onClick={() => {
                                  if (!pid) return;
                                  if (isSupporting) {
                                    setPractitionerId(pid);
                                    setSupportingIds(prev => prev.filter(id => id?.toLowerCase() !== pid.toLowerCase()));
                                  } else if (isPrimary) {
                                    setPractitionerId("");
                                  } else {
                                    setPractitionerId(pid);
                                    setSupportingIds(prev => prev.filter(id => id?.toLowerCase() !== pid.toLowerCase()));
                                  }
                                }}>
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isPrimary || isSupporting ? "bg-[var(--primary)] text-white" : "bg-white/10 text-slate-500"}`}>
                                    <User className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-[13px] font-semibold truncate ${isPrimary || isSupporting ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                                      {p.firstName ? `${p.firstName} ${p.lastName}` : (p.fullName || p.FullName || "Provider")}
                                    </p>
                                    <p className="text-[10px] font-medium text-[var(--text-muted)] mt-0.5 uppercase tracking-tighter">
                                      {isPrimary ? `${p.position} (Lead)` : isSupporting ? `${p.position} (Support)` : p.position}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="flex flex-col items-end gap-0.5">
                                    {p.travelTimeInMinutes != null || p.distanceInMiles != null ? (
                                      <>
                                        <div className="flex items-center gap-1.5">
                                          <Car className={`w-3 h-3 ${isPrimary || isSupporting ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`} />
                                          <span className={`text-[11px] font-bold ${isPrimary || isSupporting ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                                            {isPrimary || isSupporting
                                              ? (selectedSlot?.travelTimeInMinutes != null ? `${selectedSlot.travelTimeInMinutes}m` : "0m")
                                              : (p.travelTimeInMinutes != null ? `${p.travelTimeInMinutes}m` : "0m")}
                                          </span>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-tight ${isPrimary || isSupporting ? "text-[var(--primary)]" : "text-[var(--text-muted)]"} opacity-70`}>
                                          {isPrimary || isSupporting
                                            ? (selectedSlot?.distanceInMiles != null ? `${selectedSlot.distanceInMiles.toFixed(1)}mi` : "0.0mi")
                                            : (p.distanceInMiles != null ? `${p.distanceInMiles.toFixed(1)}mi` : "0.0mi")}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[9px] font-semibold text-rose-500/80 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/10 uppercase">
                                        N/A
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">03</span>
                          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Supporting Clinicians</h3>
                        </div>
                        <div className="relative group">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                          <input
                            type="text"
                            placeholder="Search Support..."
                            value={scSearch}
                            onChange={(e) => setScSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/40 w-32 focus:w-48 transition-all"
                          />
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {displayScs.map((p: any) => {
                            const pid = p.practitionerId;
                            const isPrimary = practitionerId?.toLowerCase() === pid?.toLowerCase();
                            const isSupporting = supportingIds.some((id: string) => id?.toLowerCase() === pid?.toLowerCase());
                            return (
                              <div key={pid} className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group
                                ${isPrimary || isSupporting ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 shadow-sm" : "bg-white/5 border-white/10 hover:border-white/30"}`}
                                onClick={() => {
                                  if (!pid) return;
                                  if (isPrimary) {
                                    setPractitionerId("");
                                    setSupportingIds(prev => [...prev, pid]);
                                  } else if (isSupporting) {
                                    setSupportingIds(prev => prev.filter(id => id?.toLowerCase() !== pid.toLowerCase()));
                                  } else {
                                    setSupportingIds(prev => [...prev, pid]);
                                    if (practitionerId?.toLowerCase() === pid.toLowerCase()) setPractitionerId("");
                                  }
                                }}>
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isPrimary || isSupporting ? "bg-[var(--primary)] text-white" : "bg-white/10 text-slate-500"}`}>
                                    <Stethoscope className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-[13px] font-semibold truncate ${isPrimary || isSupporting ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                                      {p.firstName ? `${p.firstName} ${p.lastName}` : (p.fullName || p.FullName || "Provider")}
                                    </p>
                                    <p className="text-[10px] font-medium text-[var(--text-muted)] mt-0.5 uppercase tracking-tighter">
                                      {isPrimary ? `${p.position} (Lead)` : isSupporting ? `${p.position} (Support)` : p.position}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                    {!isBlockMode && (
                      <section className="space-y-6">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">04</span>
                          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Palliative Assessment Selection</h3>
                          <div className="flex-1 h-px bg-[var(--card-border)]" />
                        </div>

                        <div className="space-y-8 pb-10">
                          {ASSESSMENT_OPTIONS.map((cat) => (
                            <div key={cat.category} className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--primary)]/10 rounded-lg text-[var(--primary)]">
                                  {cat.icon}
                                </div>
                                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{cat.category}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {cat.items.map((item) => {
                                  const isSelected = plannedAssessments.includes(item.id);
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => {
                                        setPlannedAssessments(prev =>
                                          isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                        );
                                      }}
                                      className={`flex flex-col p-3 rounded-xl border text-left transition-all group
                                        ${isSelected
                                          ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 shadow-sm"
                                          : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/[0.07]"}`}
                                    >
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-xs font-bold ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                                          {item.label}
                                        </span>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all
                                          ${isSelected ? "bg-[var(--primary)] border-transparent" : "border-white/20 group-hover:border-white/40"}`}>
                                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                        </div>
                                      </div>
                                      <p className="text-[10px] font-medium text-[var(--text-muted)] leading-tight">
                                        {item.fullName || item.description}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </form>
            </div>

            <div className="w-[360px] flex flex-col bg-[var(--sidebar-bg)] p-6 space-y-6 overflow-y-auto scrollbar-hide border-l border-[var(--card-border)]">
              <section className="space-y-6">
                <div className="grid grid-cols-3 gap-4 pb-6 border-b border-white/5">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Travel</p>
                    <p className="text-base font-bold text-[var(--text-primary)]">{selectedSlot?.travelTimeInMinutes || "0"}m</p>
                  </div>
                  <div className="space-y-1.5 border-l border-white/5 pl-4">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Distance</p>
                    <p className="text-base font-bold text-[var(--text-primary)]">{selectedSlot?.distanceInMiles?.toFixed(1) || "0.0"}mi</p>
                  </div>
                  <div className="space-y-1.5 border-l border-white/5 pl-4">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Duration</p>
                    <p className="text-base font-bold text-[var(--text-primary)]">{duration}m</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Encounter Date</h3>
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {isNaN(viewDate.getTime()) ? "Select Date" : `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
                      </span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1.5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1.5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                      </div>
                    </div>
                    <div className={`grid grid-cols-7 gap-1 ${isLocked ? "pointer-events-none opacity-50" : ""}`}>
                      {renderCalendar()}
                    </div>
                  </div>
                </div>
                 {patientId && (
                  <div className={`flex bg-[var(--input-bg)] rounded-2xl p-1.5 border border-[var(--card-border)] gap-1.5 shadow-inner ${isLocked ? "pointer-events-none opacity-50" : ""}`}>
                    <button type="button" onClick={() => { if (period !== "AM") { setPeriod("AM"); setPractitionerId(""); setSupportingIds([]); } }}
                      className={`flex-1 py-3.5 rounded-xl text-[10px] font-bold tracking-widest transition-all
                                   ${period === "AM" ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"}`}>
                      {amLoading ? <Activity className="w-4 h-4 animate-spin mx-auto" /> : "MORNING SLOT"}
                    </button>
                    <button type="button" onClick={() => { if (period !== "PM") { setPeriod("PM"); setPractitionerId(""); setSupportingIds([]); } }}
                      className={`flex-1 py-3.5 rounded-xl text-[10px] font-bold tracking-widest transition-all
                                   ${period === "PM" ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"}`}>
                      {pmLoading ? <Activity className="w-4 h-4 animate-spin mx-auto" /> : "AFTERNOON SLOT"}
                    </button>
                  </div>
                )}
                <div className="pt-4 px-2">
                  <div className="flex justify-between items-baseline mb-4">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Encounter Duration</label>
                    <span className="text-lg font-bold text-[var(--primary)]">{duration} <span className="text-xs text-[var(--text-muted)]">mins</span></span>
                  </div>
                  <input type="range" min="15" max="60" step="15" value={duration}
                    disabled={isLocked}
                    onChange={e => setDuration(parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none transition-colors accent-[var(--primary)] bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer disabled:opacity-30" />
                  <div className="flex justify-between mt-4 text-[9px] font-bold text-[var(--text-muted)] tracking-widest uppercase">
                    <span>15m</span>
                    <span>Standard Visit</span>
                    <span>60m</span>
                  </div>
                </div>
              </section>

              {plannedAssessments.length > 0 && (
                <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Planned Assessments</h3>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/20">
                      {plannedAssessments.length} Total
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plannedAssessments.map(id => {
                      const category = ASSESSMENT_OPTIONS.find(cat => cat.items.some(i => i.id === id));
                      const item = category?.items.find(i => i.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl hover:bg-[var(--input-bg)]/80 transition-colors group">
                          <div className="text-[var(--primary)] group-hover:scale-110 transition-transform">
                            {category?.icon}
                          </div>
                          <span className="text-[10px] font-bold text-[var(--text-primary)]">{item?.label || id}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Encounter Summary</h3>
                  {selectedSlot?.shiftStart && (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider
                                ${(modality.includes("TELEHEALTH") || modality.includes("VIDEO")) ? "bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]" :
                        selectedSlot.travelTimeInMinutes < 15 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                          selectedSlot.travelTimeInMinutes < 30 ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                            "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}>
                      <Timer className="w-3 h-3" />
                      {modality.includes("TELE") ? "Virtual Sync" : selectedSlot.travelTimeInMinutes < 15 ? "Efficient Window" : "Transit Warning"}
                    </div>
                  )}
                </div>
                <div className={`p-6 rounded-3xl border-2 transition-all duration-500 relative overflow-hidden group
                        ${selectedSlot?.shiftStart ? "bg-[var(--primary)]/5 border-[var(--primary)]/30" : "bg-white/[0.01] border-white/5 opacity-20"}`}>
                  {selectedSlot?.shiftStart ? (
                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Scheduled Time</p>
                          <div className="flex items-baseline gap-2">
                            <h4 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                              {new Date(selectedSlot.shiftStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </h4>
                          </div>
                        </div>
                      </div>
                      <div className="pt-6 flex items-center justify-between border-t border-white/5">
                        <div className="text-left space-y-1">
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Travel Time</p>
                          <p className="text-sm font-bold text-[var(--text-primary)]">{selectedSlot?.travelTimeInMinutes != null ? selectedSlot.travelTimeInMinutes : "0"}<span className="text-xs ml-1 opacity-60">m</span></p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Distance</p>
                          <p className="text-sm font-bold text-[var(--text-primary)]">{selectedSlot?.distanceInMiles != null ? selectedSlot.distanceInMiles.toFixed(1) : "0.0"}<span className="text-xs ml-1 opacity-60">mi</span></p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-6 h-6 text-slate-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-500">Awaiting Time Selection</p>
                    </div>
                  )}
                </div>
              </section>

              <div className="mt-auto pt-8 space-y-6">
                {appointmentId && (
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" disabled={isLocked} onClick={async () => {
                      await alert({
                        title: "Appointment Completed",
                        message: "The encounter has been successfully finalized in the clinical record.",
                        type: "success"
                      });
                    }} className="p-3 bg-[var(--input-bg)] hover:bg-emerald-500/10 rounded-xl border border-[var(--card-border)] hover:border-emerald-500/30 flex flex-col items-center justify-center gap-1.5 group transition-all disabled:opacity-20">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-emerald-500">Done</span>
                    </button>
                    <button type="button" disabled={isLocked} onClick={async () => {
                      const ok = await confirm({
                        title: "Cancel Appointment",
                        message: "Are you sure you want to cancel this scheduled encounter?",
                        type: "warning"
                      });
                      if (ok) {
                      }
                    }} className="p-3 bg-[var(--input-bg)] hover:bg-rose-500/10 rounded-xl border border-[var(--card-border)] hover:border-rose-500/30 flex flex-col items-center justify-center gap-1.5 group transition-all disabled:opacity-20">
                      <X className="w-4 h-4 text-rose-500" />
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-rose-500">Cancel</span>
                    </button>
                    <button type="button" disabled={isLocked} onClick={async () => {
                      const ok = await confirm({
                        title: "Delete Appointment",
                        message: "Are you sure you want to permanently delete this appointment record? This action cannot be undone.",
                        type: "danger"
                      });
                      if (ok && appointmentId) {
                        try {
                          await deleteAppt({ variables: { id: appointmentId } });
                        } catch (err) {
                          alert({ title: "Error", message: "Failed to delete appointment.", type: "danger" });
                        }
                      }
                    }} className="p-3 bg-[var(--input-bg)] hover:bg-red-600/20 rounded-xl border border-[var(--card-border)] hover:border-red-600/50 flex flex-col items-center justify-center gap-1.5 group transition-all disabled:opacity-20">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-red-600">Delete</span>
                    </button>
                  </div>
                )}
                {isLocked && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-relaxed">
                      Encounter Lock Active: Time and modification controls are restricted for {isLive ? "active" : "finalized"} visits.
                    </p>
                  </div>
                )}
                <button type="submit" form="appointment-form" disabled={bookingLoading || !selectedSlot?.shiftStart || isLocked}
                  className="w-full h-14 bg-[var(--primary)] hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed
                            text-white font-bold text-sm shadow-xl shadow-[var(--primary-glow)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 rounded-2xl">
                  {bookingLoading ? (
                    <Activity className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>{appointmentId ? "Update Appointment" : "Schedule Appointment"}</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] font-bold text-[var(--text-muted)] text-center uppercase tracking-widest opacity-50">
                  Authorized Clinical Staff Only
                </p>
              </div>
            </div>
          </div>

          {booked && (
            <div className="absolute inset-0 bg-[var(--background)]/95 backdrop-blur-3xl z-[1000000] flex flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border-4 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <CheckCircle className="w-12 h-12 text-emerald-500 animate-in zoom-in duration-700" />
              </div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight mb-2 uppercase">Schedule Confirmed</h2>
              <p className="text-emerald-500/80 font-bold tracking-widest uppercase text-xs">Patient records synchronized successfully</p>
            </div>
          )}
        </div>
      </div>
    </HalcyonPortal>
  );
}