"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import { X, Calendar, Clock, User, MapPin, Video, Home, Building2, CheckCircle } from "lucide-react";

const BOOK_APPOINTMENT = gql`
  mutation BookAppointment($input: BookAppointmentInput!) {
    bookAppointment(input: $input) {
      appointmentId
      scheduledStart
      scheduledEnd
      modality
      status
    }
  }
`;

const GET_MODALITY_ENUM = gql`
  query GetModalityEnum {
    __type(name: "AppointmentModality") {
      enumValues {
        name
      }
    }
  }
`;

const MODALITY_STYLE: Record<string, { label: string; icon: React.ReactNode }> = {
  InPersonHomeVisit: { label: "Home Visit", icon: <Home className="w-4 h-4" /> },
  InPersonFacility: { label: "Facility", icon: <Building2 className="w-4 h-4" /> },
  TelehealthVideo: { label: "Telehealth", icon: <Video className="w-4 h-4" /> },
  TelehealthAudioOnly: { label: "Audio Only", icon: <Video className="w-4 h-4" /> },
};

const FALLBACK_MODALITY = { label: "Other", icon: <Building2 className="w-4 h-4" /> };

const DURATIONS = [30, 45, 60, 90];

interface Props {
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
  prefillDate?: string;
}

export default function BookingDrawer({ open, onClose, onBooked, prefillDate }: Props) {
  const [patientId, setPatientId] = useState("");
  const [practitionerId, setPractitionerId] = useState("");
  const [date, setDate] = useState(prefillDate?.slice(0, 10) ?? "");
  const [time, setTime] = useState(prefillDate ? new Date(prefillDate).toTimeString().slice(0, 5) : "09:00");
  const [duration, setDuration] = useState(60);
  const [modality, setModality] = useState("");
  const [booked, setBooked] = useState(false);

  const { data: enumData, loading: enumLoading } = useQuery(GET_MODALITY_ENUM, { skip: !open });
  const apiModalities: string[] = enumData?.__type?.enumValues?.map((v: { name: string }) => v.name) ?? [];

  useEffect(() => {
    if (apiModalities.length > 0 && !modality) setModality(apiModalities[0]);
  }, [apiModalities, modality]);

  const [book, { loading }] = useMutation(BOOK_APPOINTMENT, {
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
    const start = new Date(`${date}T${time}`).toISOString();
    const end = new Date(new Date(`${date}T${time}`).getTime() + duration * 60000).toISOString();
    book({ variables: { input: { patientId, practitionerId, scheduledStart: start, scheduledEnd: end, modality } } });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-[#0f1117] border-l border-white/10 z-50
        shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>

        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" /> Book Appointment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Schedule a new clinical visit</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form id="appointment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Patient ID
            </label>
            <input
              required value={patientId} onChange={e => setPatientId(e.target.value)}
              placeholder="Enter Patient UUID"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm
                placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Care Navigator / Provider ID
            </label>
            <input
              required value={practitionerId} onChange={e => setPractitionerId(e.target.value)}
              placeholder="Enter Practitioner UUID"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm
                placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date
              </label>
              <input
                type="date" required value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm
                  focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Time
              </label>
              <input
                type="time" required value={time} onChange={e => setTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm
                  focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map(d => (
                <button type="button" key={d} onClick={() => setDuration(d)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all
                    ${duration === d ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300"}`}>
                  {d}m
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Modality
            </label>
            <div className="grid grid-cols-3 gap-2">
              {enumLoading && ["", "", ""].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
              {apiModalities.map(value => {
                const style = MODALITY_STYLE[value] ?? FALLBACK_MODALITY;
                return (
                  <button type="button" key={value} onClick={() => setModality(value)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold border transition-all
                      ${modality === value ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300"}`}>
                    {style.icon}
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-white/10">
          {booked ? (
            <div className="flex items-center justify-center gap-2 py-3 text-emerald-400 font-bold">
              <CheckCircle className="w-5 h-5" /> Appointment Booked!
            </div>
          ) : (
            <button
              type="submit"
              form="appointment-form"
              disabled={loading || !patientId || !practitionerId || !date}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-40
                text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Calendar className="w-4 h-4" />}
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}