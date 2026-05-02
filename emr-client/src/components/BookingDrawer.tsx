"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import { 
  X, Calendar, Clock, User, MapPin, Video, Home, 
  Building2, CheckCircle, Car, Search, ChevronRight, 
  Stethoscope, Shield, Users, Info, ChevronLeft,
  Timer, Zap, Navigation, Check, Activity, Target, Phone, Edit3
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
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [practitionerId, setPractitionerId] = useState("");
  const [supportingIds, setSupportingIds] = useState<string[]>([]);
  
  const [patientSearch, setPatientSearch] = useState("");
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
      setModality(a.modality);
      const start = new Date(a.scheduledStart);
      const end = new Date(a.scheduledEnd);
      setSelectedDate(start);
      setPeriod(start.getHours() < 12 ? "AM" : "PM");
      setDuration(Math.round((end.getTime() - start.getTime()) / 60000));
      setPatientSearch(`${a.patient?.firstName} ${a.patient?.lastName}`);
    }
  }, [appointmentData]);

  // Slot Availability Checks
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

  const practitioners = useMemo(() => {
    return (practitionerData?.practitioners ?? []).map((p: any) => ({
        ...p,
        displayFull: p.fullName || `${p.firstName} ${p.lastName}`.trim() || "Unknown Clinician"
    }));
  }, [practitionerData]);

  const amAvailable = (amData?.availableProviders?.filter((p: any) => p.role === "CareNavigator").length ?? 0) > 0;
  const pmAvailable = (pmData?.availableProviders?.filter((p: any) => p.role === "CareNavigator").length ?? 0) > 0;

  const currentGeoData = period === "AM" ? amData : pmData;

  const patients = patientData?.patients ?? [];
  
  // GROUP SLOTS BY PRACTITIONER
  const practitionerSlots = useMemo(() => {
    const map = new Map<string, any[]>();
    currentGeoData?.availableProviders?.forEach((slot: any) => {
        const existing = map.get(slot.practitionerId) || [];
        map.set(slot.practitionerId, [...existing, slot]);
    });
    return map;
  }, [currentGeoData]);

  // TRACK SELECTED SLOT PER PRACTITIONER
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const careNavigators = useMemo(() => practitioners.filter((p: any) => 
    p.isCareNavigator && (practitionerSlots.has(p.practitionerId) || practitionerId === p.practitionerId)
  ), [practitioners, practitionerSlots, practitionerId]);
  const supportingClinicians = useMemo(() => practitioners.filter((p: any) => p.isSupportingClinician), [practitioners]);

  const selectedSlot = useMemo(() => {
    // 1. If we are in edit mode and haven't selected a NEW slot yet, show the persisted data
    if (appointmentId && !selectedSlotId && appointmentData?.appointment) {
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
    return slots.find(s => s.shiftStart === selectedSlotId) || slots[0];
  }, [practitionerId, selectedSlotId, practitionerSlots]);

  const [book, { loading: bookingLoading }] = useMutation(BOOK_APPOINTMENT, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      setBooked(true);
      setTimeout(() => {
        setBooked(false);
        onBooked();
        onClose();
      }, 1500);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !practitionerId || !selectedSlot) {
        console.error("Missing required deployment data", { patientId, practitionerId, slot: selectedSlot });
        return;
    }
    
    book({ variables: { input: { 
      appointmentId,
      patientId, 
      practitionerId, 
      supportingPractitionerIds: supportingIds,
      scheduledStart: selectedSlot.shiftStart, 
      scheduledEnd: selectedSlot.shiftEnd, 
      modality,
      travelTimeMinutes: selectedSlot.travelTimeInMinutes,
      distanceInMiles: selectedSlot.distanceInMiles
    } } });
  };

  const toggleSupporting = (id: string) => {
    setSupportingIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  const renderCalendar = () => {
    const days = [];
    const count = daysInMonth(viewDate);
    const first = firstDayOfMonth(viewDate);
    for (let i = 0; i < first; i++) days.push(<div key={`empty-${i}`} className="h-10" />);
    for (let d = 1; d <= count; d++) {
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getFullYear() === viewDate.getFullYear();
      days.push(
        <button key={d} type="button" onClick={() => {
            setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
            setPeriod(null); // Reset slot on date change
            setPractitionerId("");
        }}
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
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose} />

      <div className={`relative h-full w-full max-w-[1200px] bg-[#050608] shadow-[-50px_0_150px_rgba(0,0,0,1)] 
        flex flex-col transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) 
        ${open ? "translate-x-0" : "translate-x-full"}`}>

        <div className="h-16 w-full flex items-center justify-between px-8 bg-[#08090d] border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-1 h-6 bg-blue-600 rounded-full" />
            <div className="flex items-baseline gap-3">
                <h2 className="text-base font-black text-white tracking-tighter uppercase">GEOSPATIAL SCHEDULER</h2>
                <span className="text-[9px] font-black text-blue-500/40 uppercase tracking-widest border-l border-white/10 pl-3">Clinical Deployment System</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 rounded-full border border-emerald-500/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">System Active</span>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-600 hover:text-white">
                <X className="w-4 h-4" />
              </button>
          </div>
        </div>

        <div className="flex-1 flex flex-row overflow-hidden">
          <div className="flex-1 flex flex-col border-r border-white/5 bg-[#050608] overflow-hidden">
            <form id="appointment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pt-4 space-y-8 scrollbar-hide">
              <section className="space-y-3">
                <div className="flex items-center gap-3 opacity-20">
                  <span className="text-[9px] font-black text-white">01</span>
                  <div className="flex-1 h-px bg-white" />
                  <span className="text-[8px] font-black text-white tracking-widest uppercase">Target Lookup</span>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-700" />
                  <input required value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setShowPatientResults(true); }}
                    placeholder="ENTER NAME OR MRN..."
                    className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-xs font-bold placeholder:text-slate-800
                      focus:outline-none focus:border-blue-500/30 transition-all uppercase"
                  />
                  {showPatientResults && patientSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#0e1015] border border-white/10 rounded-lg overflow-hidden z-[1001] max-h-40 overflow-y-auto shadow-2xl">
                      {patients.filter((p: any) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase())).map((p: any) => (
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
                          className="w-full px-4 py-2.5 text-left hover:bg-blue-600/10 border-b border-white/5 group">
                          <span className="font-black text-white text-xs uppercase">{p.firstName} {p.lastName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {patientId && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1 group">
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Street Address</label>
                        <div className="flex items-center bg-white/[0.01] border border-white/5 rounded-lg px-3 py-2">
                          <input value={patientAddress.street} onChange={e => setPatientAddress({...patientAddress, street: e.target.value})}
                              className="w-full bg-transparent text-white text-[10px] font-bold focus:outline-none" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1 group">
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">City</label>
                        <div className="flex items-center bg-white/[0.01] border border-white/5 rounded-lg px-3 py-2">
                          <input value={patientAddress.city} onChange={e => setPatientAddress({...patientAddress, city: e.target.value})}
                              className="w-full bg-transparent text-white text-[10px] font-bold focus:outline-none" />
                        </div>
                      </div>
                      <div className="space-y-1 group">
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">State</label>
                        <div className="flex items-center bg-white/[0.01] border border-white/5 rounded-lg px-3 py-2">
                          <input value={patientAddress.state} onChange={e => setPatientAddress({...patientAddress, state: e.target.value})}
                              className="w-full bg-transparent text-white text-[10px] font-bold focus:outline-none" />
                        </div>
                      </div>
                      <div className="space-y-1 group">
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Zip</label>
                        <div className="flex items-center bg-white/[0.01] border border-white/5 rounded-lg px-3 py-2">
                          <input value={patientAddress.postalCode} onChange={e => setPatientAddress({...patientAddress, postalCode: e.target.value})}
                              className="w-full bg-transparent text-white text-[10px] font-bold focus:outline-none" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Modality</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: "IN_PERSON_HOME_VISIT", label: "HOME" },
                          { id: "IN_PERSON_FACILITY", label: "FACILITY" },
                          { id: "TELEHEALTH_VIDEO", label: "VIDEO" },
                          { id: "TELEPHONE", label: "PHONE" },
                        ].map((m) => (
                          <button key={m.id} type="button" onClick={() => { setModality(m.id); setPeriod(null); }}
                            className={`px-2 py-1.5 rounded-lg border text-[9px] font-black transition-all
                              ${modality === m.id ? "bg-blue-600 border-blue-500 text-white" : "bg-white/[0.02] border-white/5 text-slate-500"}`}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {!patientId || !period ? (
                <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
                        {!patientId ? "Awaiting Patient" : "Awaiting Slot Selection"}
                    </p>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <section className="space-y-3">
                    <div className="flex items-center gap-3 opacity-20">
                      <span className="text-[9px] font-black text-white">02</span>
                      <div className="flex-1 h-px bg-white" />
                      <span className="text-[8px] font-black text-white tracking-widest uppercase">Primary Navigator</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {careNavigators.map((p: any) => {
                        const slots = practitionerSlots.get(p.practitionerId) || [];
                        const isSelected = practitionerId === p.practitionerId;
                        return (
                          <div key={p.practitionerId} className={`p-3 rounded-xl border transition-all cursor-pointer
                            ${isSelected ? "bg-blue-600/10 border-blue-500/40" : "bg-white/[0.01] border-white/5"}`}
                            onClick={() => { setPractitionerId(p.practitionerId); setSelectedSlotId(slots[0]?.shiftStart); }}>
                            <p className={`text-[10px] font-black uppercase truncate ${isSelected ? "text-white" : "text-slate-500"}`}>{p.displayFull}</p>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center gap-3 opacity-20">
                      <span className="text-[9px] font-black text-white">03</span>
                      <div className="flex-1 h-px bg-white" />
                      <span className="text-[8px] font-black text-white tracking-widest uppercase">Supporting Staff</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {supportingClinicians.map((p: any) => {
                        const isSelected = supportingIds.includes(p.practitionerId);
                        return (
                          <label key={p.practitionerId} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                            ${isSelected ? "bg-purple-600/10 border-purple-500/40" : "bg-white/[0.01] border-white/5"}`}>
                            <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1.5 uppercase tracking-tighter">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                                ${isSelected ? "border-purple-500 bg-purple-500" : "border-white/10"}`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleSupporting(p.practitionerId)} />
                              {p.displayFull}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}
            </form>
          </div>

          <div className="w-[340px] flex flex-col bg-[#08090d] p-6 space-y-6 overflow-y-auto scrollbar-hide">
              <section className="space-y-3">
                  <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">CALENDAR</h3>
                  <div className="glass-morphism rounded-xl border border-white/5 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{monthNames[viewDate.getMonth()]} // {viewDate.getFullYear()}</span>
                          <div className="flex gap-1">
                              <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1 hover:bg-white/5 rounded border border-white/5"><ChevronLeft className="w-3 h-3 text-slate-600" /></button>
                              <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1 hover:bg-white/5 rounded border border-white/5"><ChevronRight className="w-3 h-3 text-slate-600" /></button>
                          </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                          {renderCalendar()}
                      </div>
                  </div>
                  
                  {patientId && (
                    <div className="flex bg-white/[0.03] rounded-lg p-1 border border-white/5 gap-1">
                        {(amAvailable || amLoading) && (
                            <button type="button" onClick={() => setPeriod("AM")}
                                className={`flex-1 py-2 rounded text-[9px] font-black tracking-widest transition-all
                                    ${period === "AM" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
                                    {amLoading ? <Activity className="w-3 h-3 animate-spin" /> : "AM"}
                            </button>
                        )}
                        {(pmAvailable || pmLoading) && (
                            <button type="button" onClick={() => setPeriod("PM")}
                                className={`flex-1 py-2.5 rounded-lg text-[10px] font-black tracking-widest transition-all duration-300 flex items-center justify-center gap-2
                                    ${period === "PM" ? "bg-blue-600 text-white shadow-lg" : "text-slate-600 hover:text-slate-400"}`}>
                                    {pmLoading ? <Activity className="w-3 h-3 animate-spin" /> : "PM SLOT"}
                            </button>
                        )}
                        {!amAvailable && !pmAvailable && !amLoading && !pmLoading && (
                            <div className="flex-1 py-2.5 text-center text-[8px] font-black text-rose-500 uppercase tracking-widest">
                                No Availability for this Date
                            </div>
                        )}
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-2">Duration Control (Minutes)</label>
                    <input type="range" min="15" max="60" step="15" value={duration} onChange={e => setDuration(parseInt(e.target.value))}
                        className="w-full accent-blue-600 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between mt-2">
                        <span className="text-[9px] font-black text-slate-700 tracking-widest">15M</span>
                        <span className="text-[10px] font-black text-white tracking-widest">{duration} MINUTES</span>
                        <span className="text-[9px] font-black text-slate-700 tracking-widest">60M</span>
                    </div>
                  </div>
              </section>

              <section className="space-y-4">
                  <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ENGINE PROPOSAL</h3>
                  <div className={`p-8 rounded-[2.5rem] border-2 border-dashed transition-all duration-700
                      ${selectedSlot?.shiftStart ? "bg-blue-600 border-transparent shadow-2xl shadow-blue-600/30" : "bg-white/[0.01] border-white/5 opacity-10"}`}>
                      {selectedSlot?.shiftStart ? (
                          <div className="space-y-4">
                              <p className="text-[8px] font-black text-blue-100 uppercase tracking-widest">Optimized ETA</p>
                              <h4 className="text-6xl font-black text-white tracking-tighter leading-none">
                                  {new Date(selectedSlot.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </h4>
                              <div className="pt-6 flex items-center justify-between border-t border-white/20 mt-4">
                                  <div className="text-center">
                                      <p className="text-[8px] font-black text-blue-100/60 uppercase">Drive</p>
                                      <p className="text-lg font-black text-white">{selectedSlot.travelTimeInMinutes}M</p>
                                  </div>
                                  <div className="text-center">
                                      <p className="text-[8px] font-black text-blue-100/60 uppercase">Dist</p>
                                      <p className="text-lg font-black text-white">{selectedSlot.distanceInMiles.toFixed(1)}M</p>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-10 opacity-40">
                              <Zap className="w-8 h-8 text-slate-700 mx-auto mb-4" />
                              <p className="text-[9px] font-black text-slate-700 uppercase">Awaiting Selection</p>
                          </div>
                      )}
                  </div>
              </section>

              <div className="mt-auto pt-6 pb-6">
                  <button type="submit" form="appointment-form" disabled={bookingLoading || !selectedSlot?.shiftStart}
                      className="group w-full py-6 rounded-[2rem] bg-blue-600 hover:bg-blue-500 disabled:opacity-5
                          text-white font-black text-sm uppercase tracking-[0.4em] transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98]">
                      <Navigation className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      <span>{bookingLoading ? "DEPLOYING..." : "DEPLOY"}</span>
                  </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}