"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import {
  X, Calendar, Clock, User, MapPin, Video, Home,
  Building2, CheckCircle, Car, Search, ChevronRight,
  Stethoscope, Shield, Users, Info, ChevronLeft,
  Timer, Zap, Navigation, Check, Activity, Target, Phone, Edit3, Radar, AlertCircle
} from "lucide-react";

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
    }
  }
`;

const GET_PATIENTS = gql`
  query GetPatients {
    patients {
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
  ) {
    availableProviders(
      patientId: $patientId
      targetStart: $targetStart
      durationMinutes: $durationMinutes
      modality: $modality
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

// NO MANUAL PERSONNEL - PURELY API DRIVEN
const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

interface Props {
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
  prefillDate?: string;
  appointmentId?: string;
}

export default function BookingDrawer({ open, onClose, onBooked, prefillDate, appointmentId }: Props) {
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
  const [selectedDate, setSelectedDate] = useState(new Date(prefillDate || Date.now()));
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const [duration, setDuration] = useState(60);
  const [modality, setModality] = useState("IN_PERSON_HOME_VISIT");
  const [booked, setBooked] = useState(false);

  const { data: patientData } = useQuery(GET_PATIENTS, { skip: !open });
  const { data: practitionerData } = useQuery(GET_PRACTITIONERS, { skip: !open });

  const { data: appointmentData } = useQuery(GET_APPOINTMENT, {
    variables: { id: appointmentId },
    skip: !appointmentId || !open
  });

  // Sync edit data
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
      setPractitionerId(a.practitionerId);
      setSupportingIds(a.supportingClinicians?.map((s: any) => s.practitionerId) || []);
      setModality(a.modality);
      const start = new Date(a.scheduledStart);
      setSelectedDate(start);
      setPeriod(start.getHours() < 12 ? "AM" : "PM");
      setDuration(Math.round((new Date(a.scheduledEnd).getTime() - start.getTime()) / 60000));
      setPatientSearch(`${a.patient?.firstName} ${a.patient?.lastName}`);
    }
  }, [appointmentData]);

  const { data: amData, loading: amLoading } = useQuery(GET_GEOSPATIAL_AVAILABILITY, {
    variables: {
      patientId,
      targetStart: new Date(new Date(selectedDate).setHours(8, 0, 0, 0)).toISOString(),
      modality,
      durationMinutes: duration
    },
    skip: !patientId || !open
  });

  const { data: pmData, loading: pmLoading } = useQuery(GET_GEOSPATIAL_AVAILABILITY, {
    variables: {
      patientId,
      targetStart: new Date(new Date(selectedDate).setHours(13, 0, 0, 0)).toISOString(),
      modality,
      durationMinutes: duration
    },
    skip: !patientId || !open
  });

  const currentGeoData = period === "AM" ? amData : pmData;

  // Auto-select best practitioner when slot is chosen
  useEffect(() => {
    if (currentGeoData?.availableProviders?.length > 0 && !practitionerId) {
      const best = [...currentGeoData.availableProviders]
        .filter(p => p.role === "CareNavigator")
        .sort((a, b) => a.travelTimeInMinutes - b.travelTimeInMinutes)[0];
      if (best) setPractitionerId(best.practitionerId);
    }
  }, [currentGeoData, practitionerId]);

  const practitionerSlots = useMemo(() => {
    const map = new Map<string, any[]>();
    currentGeoData?.availableProviders?.forEach((slot: any) => {
      const existing = map.get(slot.practitionerId) || [];
      map.set(slot.practitionerId, [...existing, slot]);
    });
    return map;
  }, [currentGeoData]);

  const displayCns = useMemo(() => {
    const geoCns = currentGeoData?.availableProviders?.filter((p: any) => p.role === "CareNavigator") || [];
    const allCns = practitionerData?.practitioners?.filter((p: any) => p.position?.toLowerCase() === "nurse" || p.isCareNavigator) || [];
    // Prioritize allCns for full profile data, but keep geoCns availability
    const combined = Array.from(new Map([...allCns, ...geoCns].map(p => {
        const profile = allCns.find((x: any) => x.practitionerId?.toLowerCase() === p.practitionerId?.toLowerCase());
        return [p.practitionerId?.toLowerCase(), { ...profile, ...p }];
    })).values());
    return combined;
  }, [currentGeoData, practitionerData]);

  const displayScs = useMemo(() => {
    const geoScs = currentGeoData?.availableProviders?.filter((p: any) => p.role !== "CareNavigator") || [];
    const allScs = practitionerData?.practitioners?.filter((p: any) => p.position?.toLowerCase() !== "nurse" || p.isSupportingClinician) || [];
    // Prioritize allScs for full profile data, but keep geoScs availability
    const combined = Array.from(new Map([...allScs, ...geoScs].map(p => {
        const profile = allScs.find((x: any) => x.practitionerId?.toLowerCase() === p.practitionerId?.toLowerCase());
        return [p.practitionerId?.toLowerCase(), { ...profile, ...p }];
    })).values());
    return combined;
  }, [currentGeoData, practitionerData]);

  const selectedSlot = useMemo(() => {
    if (appointmentId && !practitionerId && appointmentData?.appointment) {
      const a = appointmentData.appointment;
      return { shiftStart: a.scheduledStart, shiftEnd: a.scheduledEnd, travelTimeInMinutes: a.travelTimeMinutes || 0, distanceInMiles: a.distanceInMiles || 0 };
    }
    if (!practitionerId) return null;
    const slots = practitionerSlots.get(practitionerId) || [];
    return slots[0]; // Take the most optimized slot
  }, [practitionerId, practitionerSlots, appointmentId, appointmentData]);

  const [book, { loading: bookingLoading }] = useMutation(BOOK_APPOINTMENT, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      setBooked(true);
      setTimeout(() => { setBooked(false); onBooked(); onClose(); }, 1500);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !practitionerId || !selectedSlot) return;
    book({
      variables: {
        input: {
          appointmentId: appointmentId || null, 
          patientId, 
          practitionerId, 
          supportingPractitionerIds: supportingIds,
          scheduledStart: selectedSlot.shiftStart, 
          scheduledEnd: selectedSlot.shiftEnd,
          modality, 
          travelTimeMinutes: selectedSlot.travelTimeInMinutes, 
          distanceInMiles: selectedSlot.distanceInMiles
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
          className={`h-10 w-full rounded-2xl text-xs font-black transition-all flex items-center justify-center
            ${isSelected ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" : "text-slate-500 hover:text-white"}`}>
          {d}
        </button>
      );
    }
    return days;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 !m-0 !p-0 z-[999999] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={onClose} />

      <div className={`relative h-full w-full max-w-[900px] bg-[#050608] shadow-[-50px_0_150px_rgba(0,0,0,1)] 
        flex flex-col transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) 
        ${open ? "translate-x-0" : "translate-x-full"}`}>

        <div className="h-20 w-full flex items-center justify-between px-8 bg-[#08090d]/80 border-b border-white/5 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="w-1.5 h-10 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">CLINICAL DISPATCH</h2>
              <span className="text-[10px] font-black text-blue-500 tracking-[0.2em] mt-1 uppercase">Provider Sync // Geospatial Scheduler</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Real-Time Sync Active</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-row overflow-hidden">
          <div className="flex-1 flex flex-col border-r border-white/5 bg-[#050608] overflow-hidden">
            <form id="appointment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pt-4 space-y-6 scrollbar-hide">
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-blue-500 bg-blue-500/10 w-8 h-8 rounded-lg flex items-center justify-center">01</span>
                  <h3 className="text-xs font-black text-white tracking-[0.3em] uppercase">Patient Search</h3>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                  <input required value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setShowPatientResults(true); }}
                    placeholder="SEARCH FOR MRN OR NAME..."
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-14 pr-6 py-3 text-white text-xs font-black placeholder:text-slate-800
                      focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all uppercase tracking-wider"
                  />
                  {showPatientResults && patientSearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0e1015] border border-white/10 rounded-2xl overflow-hidden z-[1001] max-h-60 overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                      {patientData?.patients?.filter((p: any) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase())).map((p: any) => (
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
                        }}
                          className="w-full px-6 py-4 text-left hover:bg-blue-600/20 border-b border-white/5 transition-colors flex items-center justify-between group">
                          <span className="font-black text-white text-sm uppercase tracking-widest">{p.firstName} {p.lastName}</span>
                          <span className="text-[10px] font-mono text-slate-600 group-hover:text-blue-400">{p.mrn}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {patientId && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Location Verified</span>
                      </div>
                      <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 relative group/addr">
                        <button type="button" onClick={() => setIsEditingAddress(!isEditingAddress)}
                          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-blue-600/20 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all opacity-0 group-hover/addr:opacity-100">
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Street Address</label>
                          {isEditingAddress ? (
                            <input autoFocus value={patientAddress.street} onChange={e => setPatientAddress({ ...patientAddress, street: e.target.value })}
                              onBlur={() => setIsEditingAddress(false)}
                              className="w-full bg-blue-600/10 border border-blue-500/30 rounded-lg px-3 py-1.5 text-xs font-bold text-white uppercase outline-none" />
                          ) : (
                            <p className="text-xs font-bold text-white uppercase">{patientAddress.street || "Unknown"}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1"><label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">City</label><p className="text-[10px] font-bold text-slate-300 uppercase">{patientAddress.city}</p></div>
                          <div className="space-y-1"><label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Region</label><p className="text-[10px] font-bold text-slate-300 uppercase">{patientAddress.state}</p></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Visit Modality</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: "IN_PERSON_HOME_VISIT", label: "HOME VISIT", icon: <Home className="w-4 h-4" /> },
                          { id: "IN_PERSON_FACILITY", label: "FACILITY", icon: <Building2 className="w-4 h-4" /> },
                          { id: "TELEHEALTH_VIDEO", label: "VIDEO CALL", icon: <Video className="w-4 h-4" /> },
                          { id: "TELEPHONE", label: "AUDIO ONLY", icon: <Phone className="w-4 h-4" /> },
                        ].map((m) => (
                          <button key={m.id} type="button" onClick={() => { setModality(m.id); setPeriod(null); }}
                            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-[8px] font-black transition-all whitespace-nowrap
                                    ${modality === m.id ? "bg-blue-600 border-transparent text-white shadow-lg shadow-blue-600/20" : "bg-white/[0.02] border-white/10 text-slate-500 hover:text-slate-300"}`}>
                            {React.cloneElement(m.icon as React.ReactElement, { className: "w-3 h-3 shrink-0" })}
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {!patientId || !period ? (
                <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] group">
                  <Radar className="w-12 h-12 text-slate-800 mx-auto mb-6 group-hover:text-blue-500/20 transition-colors" />
                  <p className="text-xs font-black text-slate-700 uppercase tracking-[0.4em] animate-pulse">
                    {!patientId ? "Scanning for Target" : "Select Time Window"}
                  </p>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <section className="space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-purple-500 bg-purple-500/10 w-8 h-8 rounded-lg flex items-center justify-center">02</span>
                      <h3 className="text-xs font-black text-white tracking-[0.3em] uppercase">Care Navigator (CN)</h3>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {displayCns.map((p: any) => {
                        const isSelected = supportingIds.some((id: string) => id?.toLowerCase() === p.practitionerId?.toLowerCase());
                        return (
                          <div key={p.practitionerId} className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group
                            ${isSelected ? "bg-purple-600/10 border-purple-500 shadow-xl shadow-purple-500/10" : "bg-white/[0.01] border-white/5 hover:border-white/20"}`}
                            onClick={() => {
                              if (isSelected) setSupportingIds(supportingIds.filter((id: string) => id?.toLowerCase() !== p.practitionerId?.toLowerCase()));
                              else setSupportingIds([p.practitionerId]);
                            }}>
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isSelected ? "bg-purple-500 text-white" : "bg-white/5 text-slate-600"}`}>
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <p className={`text-xs font-black uppercase ${isSelected ? "text-white" : "text-slate-400"}`}>
                                  {p.firstName ? `${p.firstName} ${p.lastName}` : (p.fullName || p.FullName || "Unnamed Provider")}
                                </p>
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Care Navigator</p>
                              </div>
                            </div>
                             <div className="text-right">
                                <div className="flex items-center gap-1.5 justify-end">
                                    {p.travelTimeInMinutes !== undefined ? (
                                      <>
                                        <Car className={`w-3 h-3 ${isSelected ? "text-purple-400" : "text-slate-700"}`} />
                                        <span className={`text-xs font-black ${isSelected ? "text-white" : "text-slate-600"}`}>
                                          {isSelected 
                                            ? (appointmentData?.appointment?.travelTimeMinutes ? `${appointmentData.appointment.travelTimeMinutes}m` : "--")
                                            : (p.travelTimeInMinutes ? `${p.travelTimeInMinutes}m` : "--")}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[8px] font-black text-rose-500/60 uppercase tracking-tighter bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                        Busy / Off-Duty
                                      </span>
                                    )}
                                </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-blue-500 bg-blue-500/10 w-8 h-8 rounded-lg flex items-center justify-center">03</span>
                      <h3 className="text-xs font-black text-white tracking-[0.3em] uppercase">Supporting Clinician (SC)</h3>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {displayScs.map((p: any) => {
                        const isSelected = practitionerId?.toLowerCase() === p.practitionerId?.toLowerCase();
                        return (
                          <div key={p.practitionerId} className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group
                            ${isSelected ? "bg-blue-600/10 border-blue-500 shadow-xl shadow-blue-500/10" : "bg-white/[0.01] border-white/5 hover:border-white/20"}`}
                            onClick={() => {
                              if (isSelected) setPractitionerId("");
                              else {
                                setPractitionerId(p.practitionerId);
                              }
                            }}>
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isSelected ? "bg-blue-500 text-white" : "bg-white/5 text-slate-600"}`}>
                                <Stethoscope className="w-4 h-4" />
                              </div>
                              <div>
                                <p className={`text-xs font-black uppercase ${isSelected ? "text-white" : "text-slate-400"}`}>
                                  {p.firstName ? `${p.firstName} ${p.lastName}` : (p.fullName || p.FullName || "Unnamed Provider")}
                                </p>
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Supporting Clinician</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}
            </form>
          </div>

          <div className="w-[380px] flex flex-col bg-[#08090d] p-10 space-y-10 overflow-y-auto scrollbar-hide border-l border-white/5">
            <section className="space-y-6">
              <div className="grid grid-cols-3 gap-4 pb-6 border-b border-white/5">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Transit</p>
                  <p className="text-sm font-black text-white uppercase">{selectedSlot?.travelTimeInMinutes || "--"}M</p>
                </div>
                <div className="space-y-1 border-l border-white/5 pl-4">
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Radius</p>
                  <p className="text-sm font-black text-white uppercase">{selectedSlot?.distanceInMiles?.toFixed(1) || "--"}M</p>
                </div>
                <div className="space-y-1 border-l border-white/5 pl-4">
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Duration</p>
                  <p className="text-sm font-black text-white uppercase">{duration}M</p>
                </div>
              </div>

              <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Temporal Selection</h3>
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{monthNames[viewDate.getMonth()]} // {viewDate.getFullYear()}</span>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1.5 hover:bg-white/5 rounded-lg border border-white/5 transition-colors"><ChevronLeft className="w-3.5 h-3.5 text-slate-500" /></button>
                    <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1.5 hover:bg-white/5 rounded-lg border border-white/5 transition-colors"><ChevronRight className="w-3.5 h-3.5 text-slate-500" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendar()}
                </div>
              </div>

              {patientId && (
                <div className="flex bg-white/[0.02] rounded-xl p-1 border border-white/10 gap-1">
                  <button type="button" onClick={() => { setPeriod("AM"); setPractitionerId(""); }}
                    className={`flex-1 py-3 rounded-lg text-[9px] font-black tracking-[0.3em] transition-all
                                ${period === "AM" ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" : "text-slate-600 hover:text-slate-400"}`}>
                    {amLoading ? <Activity className="w-3 h-3 animate-spin mx-auto" /> : "AM SLOT"}
                  </button>
                  <button type="button" onClick={() => { setPeriod("PM"); setPractitionerId(""); }}
                    className={`flex-1 py-3 rounded-lg text-[9px] font-black tracking-[0.3em] transition-all
                                ${period === "PM" ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" : "text-slate-600 hover:text-slate-400"}`}>
                    {pmLoading ? <Activity className="w-3 h-3 animate-spin mx-auto" /> : "PM SLOT"}
                  </button>
                </div>
              )}

              <div className="pt-4 px-2">
                <div className="flex justify-between items-baseline mb-4">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Duration Profile</label>
                  <span className="text-lg font-black text-blue-500">{duration} <span className="text-[10px] text-slate-600">MINS</span></span>
                </div>
                <input type="range" min="15" max="60" step="15" value={duration}
                  onChange={e => setDuration(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none transition-colors accent-blue-600 bg-white/5 cursor-pointer hover:bg-white/10" />
                <div className="flex justify-between mt-3 text-[9px] font-black text-slate-700 tracking-widest uppercase">
                  <span>15m</span>
                  <span>Clinical Norm</span>
                  <span>60m</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Engine Proposal</h3>
                {selectedSlot?.shiftStart && (
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest
                              ${(modality.includes("TELEHEALTH") || modality.includes("VIDEO")) ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" :
                      selectedSlot.travelTimeInMinutes < 15 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        selectedSlot.travelTimeInMinutes < 30 ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                          "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}>
                    {(modality.includes("TELEHEALTH") || modality.includes("VIDEO")) ? <Activity className="w-2 h-2" /> : <Navigation className="w-2 h-2" />}
                    {(modality.includes("TELEHEALTH") || modality.includes("VIDEO")) ? "Network: High" :
                      selectedSlot.travelTimeInMinutes < 15 ? "Confidence: High" :
                        selectedSlot.travelTimeInMinutes < 30 ? "Traffic: Moderate" : "Congestion: Heavy"}
                  </div>
                )}
              </div>

              <div className={`p-10 rounded-[3rem] border-2 transition-all duration-1000 relative overflow-hidden group
                      ${selectedSlot?.shiftStart ? "bg-blue-600 border-transparent shadow-[0_20px_60px_rgba(37,99,235,0.3)]" : "bg-white/[0.01] border-white/5 opacity-20"}`}>

                {/* Simulated Deployment Radar Map */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.1)_100%)]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/20 rounded-full animate-pulse" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-white/10 rounded-full" />
                  {(modality.includes("TELEHEALTH") || modality.includes("VIDEO")) ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-cyan-500/20 animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/10 rotate-45" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/10 -rotate-45" />
                    </>
                  )}
                </div>

                {selectedSlot?.shiftStart ? (
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-2">
                      {(modality.includes("TELEHEALTH") || modality.includes("VIDEO")) ? <Video className="w-3 h-3 text-cyan-100" /> : <Zap className="w-3 h-3 text-blue-100 animate-pulse" />}
                      <p className="text-[8px] font-black text-blue-100 uppercase tracking-[0.2em]">
                        {(modality.includes("TELEHEALTH") || modality.includes("VIDEO")) ? "Virtual Deployment" : "Optimized Deployment"}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1 mb-1">
                        <h4 className="text-2xl font-black text-white tracking-tighter leading-none">
                          {new Date(selectedSlot.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                        </h4>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{new Date(selectedSlot.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[1]}</span>
                      </div>
                      <p className="text-[8px] font-black text-blue-100/50 uppercase tracking-widest">Target Connection Time</p>
                    </div>
                    <div className="pt-8 flex items-center justify-between border-t border-white/20 mt-6">
                      {(modality.includes("TELEHEALTH") || modality.includes("VIDEO")) ? (
                        <div className="w-full text-center">
                          <p className="text-[10px] font-black text-blue-100/40 uppercase tracking-widest mb-1">Link Latency</p>
                          <p className="text-2xl font-black text-white leading-none">0.02<span className="text-xs ml-1 opacity-60">ms</span></p>
                        </div>
                      ) : (
                        <>
                          <div className="text-left">
                            <p className="text-[10px] font-black text-blue-100/40 uppercase tracking-widest mb-1">Travel</p>
                            <p className="text-2xl font-black text-white leading-none">{selectedSlot.travelTimeInMinutes}<span className="text-xs ml-1 opacity-60">M</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-blue-100/40 uppercase tracking-widest mb-1">Range</p>
                            <p className="text-2xl font-black text-white leading-none">{selectedSlot.distanceInMiles.toFixed(1)}<span className="text-xs ml-1 opacity-60">M</span></p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 opacity-50 relative z-10">
                    <Radar className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Scanning Grid...</p>
                  </div>
                )}
              </div>
            </section>

            <div className="mt-auto pt-10">
              {appointmentId && (
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <button type="button" onClick={() => alert("Marked as Completed")} className="p-4 bg-white/[0.02] hover:bg-blue-500/10 rounded-2xl border border-white/5 hover:border-blue-500/30 flex flex-col items-center justify-center gap-2 group transition-all">
                    <CheckCircle className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/50 group-hover:text-blue-400">Done</span>
                  </button>
                  <button type="button" onClick={() => alert("Placed on Hold")} className="p-4 bg-white/[0.02] hover:bg-amber-500/10 rounded-2xl border border-white/5 hover:border-amber-500/30 flex flex-col items-center justify-center gap-2 group transition-all">
                    <Clock className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/50 group-hover:text-amber-400">Hold</span>
                  </button>
                  <button type="button" onClick={() => alert("Appointment Cancelled")} className="p-4 bg-white/[0.02] hover:bg-rose-500/10 rounded-2xl border border-white/5 hover:border-rose-500/30 flex flex-col items-center justify-center gap-2 group transition-all">
                    <X className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/50 group-hover:text-rose-400">Cancel</span>
                  </button>
                  <button type="button" onClick={() => alert("Permanent Delete")} className="p-4 bg-white/[0.02] hover:bg-red-600/20 rounded-2xl border border-white/5 hover:border-red-600/50 flex flex-col items-center justify-center gap-2 group transition-all">
                    <AlertCircle className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/50 group-hover:text-red-500">Delete</span>
                  </button>
                </div>
              )}

              <button type="submit" form="appointment-form" disabled={bookingLoading || !selectedSlot?.shiftStart}
                className="group w-full py-5 rounded-[2rem] bg-blue-600 hover:bg-blue-500 disabled:opacity-10 disabled:cursor-not-allowed
                          text-white font-black text-sm uppercase tracking-[0.4em] transition-all shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center justify-center gap-4 active:scale-[0.98]">
                {bookingLoading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Navigation className="w-5 h-5 group-hover:translate-x-1.5 group-hover:-translate-y-1.5 transition-transform duration-500" />
                    <span>{appointmentId ? "UPDATE SCHEDULE" : "CONFIRM SCHEDULE"}</span>
                  </>
                )}
              </button>
              <p className="text-[9px] font-black text-slate-700 text-center uppercase tracking-widest mt-6 opacity-40">
                Authorized Clinical Dispatch Only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}