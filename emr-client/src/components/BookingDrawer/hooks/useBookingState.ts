import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useCommandModal } from "../../CommandModalProvider";
import { useToast } from "../../ToastProvider";
import { useSettings } from "@/lib/SettingsContext";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { addMinutes } from "date-fns";
import {
  BOOK_APPOINTMENT,
  DELETE_APPOINTMENT,
  CREATE_SCHEDULE_BLOCK,
  GET_PATIENTS,
  GET_PRACTITIONERS,
  GET_APPOINTMENT,
  GET_GEOSPATIAL_AVAILABILITY
} from "../queries";

interface UseBookingStateProps {
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
  prefillDate?: string;
  appointmentId?: string;
  patientId: string;
  setPatientId: React.Dispatch<React.SetStateAction<string>>;
  propPatientId?: string;
}

export function useBookingState({
  open,
  onClose,
  onBooked,
  prefillDate,
  appointmentId,
  patientId,
  setPatientId,
  propPatientId
}: UseBookingStateProps) {
  const { confirm } = useCommandModal();
  const { showToast } = useToast();
  const { data: session } = useSession();
  
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
    const valid = isNaN(d.getTime()) ? new Date() : d;
    if (valid.getDay() === 0) {
      valid.setDate(valid.getDate() + 1);
    }
    return valid;
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
  const { tenantConfig } = useSettings();

  const clinicalConfig = useMemo(() => {
    const rawTz = tenantConfig.timezone || "UTC";
    const normalizedTz = rawTz.includes("(")
      ? rawTz.split("(")[0].trim()
      : rawTz;
    return {
      AM_START: tenantConfig.amStartHour,
      PM_START: tenantConfig.pmStartHour,
      DAY_END: tenantConfig.dayEndHour,
      CUTOFF_HOUR: tenantConfig.pmStartHour,
      TIMEZONE: normalizedTz,
      ENGINE_SAFETY_DRIVE_MINS: tenantConfig.engineSafetyDriveMins,
      ENGINE_SAFETY_DIST_KM: tenantConfig.engineSafetyDistKm,
      IOT_SYNC_INTERVAL_MS: tenantConfig.iotSyncIntervalMs,
      URGENT_PAIN_THRESHOLD: tenantConfig.urgentPainThreshold,
      URGENT_WELLBEING_THRESHOLD: tenantConfig.urgentWellbeingThreshold
    };
  }, [tenantConfig]);

  const createZonedISO = useCallback((date: Date, hours: number, minutes: number) => {
    try {
      const d = (date && !isNaN(date.getTime())) ? date : new Date();
      const h = isNaN(hours) ? 0 : hours;
      const m = isNaN(minutes) ? 0 : minutes;

      const year = d.getFullYear(), month = d.getMonth(), day = d.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      
      const zoned = fromZonedTime(dateStr, clinicalConfig.TIMEZONE || 'UTC');
      if (isNaN(zoned.getTime())) return new Date().toISOString();
      return zoned.toISOString();
    } catch (e) {
      console.error("Tactical Date Failure:", e);
      return new Date().toISOString();
    }
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
      if (now.getDay() === 0) {
        now.setDate(now.getDate() + 1);
      }
      setSelectedDate(now);
      setViewDate(now);
    }
  }, [open, appointmentId, prefillDate, propPatientId, setPatientId]);

  useEffect(() => {
    if (open && propPatientId && !appointmentId) {
      setPatientId(propPatientId);
    }
  }, [open, propPatientId, appointmentId, setPatientId]);

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
  }, [appointmentId, setPatientId]);

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
      if (a.modality) {
        const m = a.modality.toUpperCase();
        if (m.includes("HOME")) setModality("IN_PERSON_HOME_VISIT");
        else if (m.includes("FACILITY")) setModality("IN_PERSON_FACILITY");
        else if (m.includes("VIDEO") || m.includes("TELEHEALTH")) setModality("TELEHEALTH_VIDEO");
        else if (m.includes("PHONE") || m.includes("AUDIO")) setModality("TELEPHONE");
        else setModality(a.modality);
      }
      
      const start = new Date(a.scheduledStart);
      setSelectedDate(start);
      setPeriod(start.getHours() < 12 ? "AM" : "PM");
      setDuration(Math.round((new Date(a.scheduledEnd).getTime() - start.getTime()) / 60000));
      
      if (a.visitType) {
        const normalized = a.visitType.split(/(?=[A-Z])/).join('_').toUpperCase().replace(/^_/, "");
        setVisitType(normalized);
      } else {
        setVisitType("ROUTINE_SYMPTOM_MANAGEMENT");
      }
      setPlannedAssessments(a.plannedAssessments || []);
      setPatientSearch(`${a.patient?.firstName} ${a.patient?.lastName}`);
      setIsEditingAddress(false);
    }
  }, [appointmentData, setPatientId]);

  const { data: availabilityData, loading: availabilityLoading } = useQuery(GET_GEOSPATIAL_AVAILABILITY, {
    variables: {
      patientId,
      targetStart: createZonedISO(debouncedDate, clinicalConfig.AM_START, 0),
      modality: debouncedModality,
      durationMinutes: debouncedDuration,
      appointmentId: appointmentId || null
    },
    skip: !patientId || !open,
    fetchPolicy: "network-only"
  });

  useEffect(() => {
    if (availabilityData?.availableProviders?.length > 0 && !practitionerId) {
      const userPracId = (session?.user as any)?.practitionerId;
      const me = availabilityData.availableProviders.find((p: any) => p.practitionerId?.toLowerCase() === userPracId?.toLowerCase());

      if (me) {
        setPractitionerId(me.practitionerId);
      } else {
        const best = [...availabilityData.availableProviders]
          .filter(p => p.role === "CareNavigator")
          .sort((a, b) => a.travelTimeInMinutes - b.travelTimeInMinutes)[0];
        if (best) setPractitionerId(best.practitionerId);
        else {
          const fallback = [...availabilityData.availableProviders]
            .sort((a, b) => a.travelTimeInMinutes - b.travelTimeInMinutes)[0];
          if (fallback) setPractitionerId(fallback.practitionerId);
        }
      }
    }
  }, [availabilityData, practitionerId, session]);

  const practitionerSlots = useMemo(() => {
    const map = new Map<string, any[]>();
    availabilityData?.availableProviders?.forEach((slot: any) => {
      const existing = map.get(slot.practitionerId) || [];
      map.set(slot.practitionerId, [...existing, slot]);
    });
    return map;
  }, [availabilityData]);

  const displayCns = useMemo(() => {
    const geoProviders = availabilityData?.availableProviders || [];
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

    if (availabilityLoading && availabilityData?.availableProviders?.length === 0) return [];

    const withGeo = filtered.map((p: any) => {
      const geo = geoProviders.find((g: any) => {
        if (g.practitionerId?.toLowerCase() !== p.practitionerId?.toLowerCase()) return false;
        const slotHour = parseInt(formatInTimeZone(new Date(g.shiftStart), clinicalConfig.TIMEZONE, "H"));
        return period === "AM" ? slotHour < clinicalConfig.CUTOFF_HOUR : slotHour >= clinicalConfig.CUTOFF_HOUR;
      });
        
      const isExistingLead = appointmentData?.appointment?.practitionerId?.toLowerCase() === p.practitionerId?.toLowerCase();

      return {
        ...p,
        ...geo,
        hasRealSlot: !!geo,
        travelTimeInMinutes: isExistingLead ? (appointmentData.appointment.travelTimeMinutes ?? geo?.travelTimeInMinutes) : geo?.travelTimeInMinutes,
        distanceInMiles: isExistingLead ? (appointmentData.appointment.distanceInMiles ?? geo?.distanceInMiles) : geo?.distanceInMiles
      };
    });
    return withGeo.filter((p: any) => p.hasRealSlot || p.practitionerId?.toLowerCase() === practitionerId?.toLowerCase());
  }, [availabilityData, practitionerData, practitionerId, supportingIds, appointmentData, cnSearch, period, clinicalConfig, availabilityLoading]);

  const displayScs = useMemo(() => {
    const geoProviders = availabilityData?.availableProviders || [];
    const allPractitioners = practitionerData?.practitioners || [];
    
    const combined = allPractitioners.filter((p: any) =>
      (p.isSupportingClinician || p.isCareNavigator || supportingIds.some(id => id?.toLowerCase() === p.practitionerId?.toLowerCase())) &&
      p.practitionerId?.toLowerCase() !== practitionerId?.toLowerCase()
    ).sort((a: any, b: any) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));

    const filtered = combined.filter((p: any) =>
      !scSearch ||
      p.firstName?.toLowerCase().includes(scSearch.toLowerCase()) ||
      p.lastName?.toLowerCase().includes(scSearch.toLowerCase()) ||
      p.fullName?.toLowerCase().includes(scSearch.toLowerCase())
    );

    if (availabilityLoading && availabilityData?.availableProviders?.length === 0) return [];

    const withGeo = filtered.map((p: any) => {
      const geo = geoProviders.find((g: any) => {
        if (g.practitionerId?.toLowerCase() !== p.practitionerId?.toLowerCase()) return false;
        const slotHour = parseInt(formatInTimeZone(new Date(g.shiftStart), clinicalConfig.TIMEZONE, "H"));
        return period === "AM" ? slotHour < clinicalConfig.CUTOFF_HOUR : slotHour >= clinicalConfig.CUTOFF_HOUR;
      });
      return {
        ...p,
        ...geo,
        hasRealSlot: !!geo
      };
    });
    return withGeo.filter((p: any) => p.hasRealSlot || supportingIds.some(id => id?.toLowerCase() === p.practitionerId?.toLowerCase()));
  }, [availabilityData, practitionerData, practitionerId, supportingIds, scSearch, period, clinicalConfig, availabilityLoading]);

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
      const startISO = appointmentId && appointmentData?.appointment
        ? appointmentData.appointment.scheduledStart
        : createZonedISO(selectedDate, fallbackHour, 0);
      return {
        shiftStart: startISO,
        shiftEnd: addMinutes(new Date(startISO), duration).toISOString(),
        travelTimeInMinutes: null,
        distanceInMiles: null
      };
    }

    if (isEditingExisting) {
      const exactMatch = slots.find(s => s.shiftStart === appointmentData.appointment.scheduledStart);
      if (exactMatch) return exactMatch;
    }

    const periodSlots = slots.filter(s => {
      try {
        const d = new Date(s.shiftStart);
        if (isNaN(d.getTime())) return false;
        const hour = parseInt(formatInTimeZone(d, clinicalConfig.TIMEZONE || 'UTC', "H"));
        return period === "AM" ? hour < clinicalConfig.CUTOFF_HOUR : hour >= clinicalConfig.CUTOFF_HOUR;
      } catch { return false; }
    });

    if (periodSlots.length > 0) {
      return periodSlots.reduce((prev: any, curr: any) => {
        const getHour = (iso: string) => {
          try {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return 0;
            return parseInt(formatInTimeZone(d, clinicalConfig.TIMEZONE || 'UTC', "H"));
          } catch { return 0; }
        };
        const currHour = getHour(curr.shiftStart);
        const prevHour = getHour(prev.shiftStart);
        return Math.abs(currHour - startHour) < Math.abs(prevHour - startHour) ? curr : prev;
      });
    }

    return slots[0];
  }, [practitionerId, practitionerSlots, appointmentId, appointmentData, period, selectedDate, duration, clinicalConfig.AM_START, clinicalConfig.PM_START, clinicalConfig.CUTOFF_HOUR, clinicalConfig.TIMEZONE, startHour, createZonedISO]);

  const [book, { loading: bookingLoading }] = useMutation(BOOK_APPOINTMENT, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      setBooked(true);
      setTimeout(() => { setBooked(false); onBooked(); onClose(); }, 1500);
    },
    onError: async (err) => {
      if (err.message.includes("Logistics Violation")) {
        const ok = await confirm({
          title: "Logistics Violation",
          message: `${err.message} Would you like to force this booking anyway?`,
          confirmText: "Force Book",
          cancelText: "Go Back",
          type: "warning",
        });

        if (ok) {
          try {
            const baseSlot = isBlockMode ? null : selectedSlot;
            const slotStart = baseSlot?.shiftStart || createZonedISO(
              selectedDate,
              period === "AM" ? clinicalConfig.AM_START : clinicalConfig.PM_START,
              0
            );
            const slotEnd = addMinutes(new Date(slotStart), duration).toISOString();

            await book({
              variables: {
                input: {
                  appointmentId: appointmentId || null,
                  patientId,
                  practitionerId,
                  supportingPractitionerIds: supportingIds,
                  scheduledStart: slotStart,
                  scheduledEnd: slotEnd,
                  modality,
                  visitType,
                  plannedAssessments,
                  travelTimeMinutes: baseSlot?.travelTimeInMinutes || 0,
                  distanceInMiles: baseSlot?.distanceInMiles || 0,
                  overrideLogistics: true
                }
              }
            });
          } catch (retryErr: any) {
            showToast(retryErr.message, "error");
          }
        }
      } else {
        showToast(err.message, "error");
      }
    },
  });

  const [createBlock, { loading: blockLoading }] = useMutation(CREATE_SCHEDULE_BLOCK, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      setBooked(true);
      setTimeout(() => { setBooked(false); onBooked(); onClose(); }, 1500);
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const [deleteAppt] = useMutation(DELETE_APPOINTMENT, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      setBooked(true);
      setTimeout(() => { setBooked(false); onBooked(); onClose(); }, 1500);
    },
    onError: (err) => showToast(err.message, "error"),
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

  return {
    session,
    patientAddress,
    setPatientAddress,
    practitionerId,
    setPractitionerId,
    supportingIds,
    setSupportingIds,
    patientSearch,
    setPatientSearch,
    isEditingAddress,
    setIsEditingAddress,
    showPatientResults,
    setShowPatientResults,
    period,
    setPeriod,
    selectedDate,
    setSelectedDate,
    viewDate,
    setViewDate,
    duration,
    setDuration,
    modality,
    setModality,
    visitType,
    setVisitType,
    booked,
    setBooked,
    cnSearch,
    setCnSearch,
    scSearch,
    setScSearch,
    plannedAssessments,
    setPlannedAssessments,
    isBlockMode,
    setIsBlockMode,
    blockStatus,
    setBlockStatus,
    startHour,
    setStartHour,
    startMinute,
    setStartMinute,
    clinicalConfig,
    createZonedISO,
    formatForEngine,
    patientData,
    practitionerData,
    appointmentData,
    availabilityData,
    availabilityLoading,
    practitionerSlots,
    displayCns,
    displayScs,
    selectedSlot,
    bookingLoading,
    blockLoading,
    handleSubmit,
    deleteAppt
  };
}
export type UseBookingStateReturn = ReturnType<typeof useBookingState>;
