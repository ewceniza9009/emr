"use client";

import { useQuery, gql } from "@apollo/client";
import { 
  X, 
  FileText, 
  Activity, 
  ShieldCheck, 
  Heart, 
  Download,
  Calendar,
  User,
  ClipboardList,
  AlertCircle,
  Thermometer,
  Wind,
  Droplets,
  Zap,
  Clock
} from "lucide-react";
import AuraPortal from "./Portal";
import { useEffect, useState } from "react";

const GET_VISIT_SUMMARY = gql`
  query GetVisitSummary($patientId: UUID!, $appointmentId: UUID!) {
    appointment(id: $appointmentId) {
      scheduledStart
      scheduledEnd
      practitioner {
        firstName
        lastName
      }
    }
    encounters: encountersByPatient(patientId: $patientId, where: { appointmentId: { eq: $appointmentId } }) {
      encounterId
      type
      status
      encounterDate
      admittedAt
      dischargedAt
      practitioner {
        firstName
        lastName
        position
      }
      clinicalNotes {
        type
        content
      }
      vitalSigns {
        heartRate
        bloodPressureSystolic
        bloodPressureDiastolic
        temperature
        oxygenSaturation
        recordedAt
      }
    }
    esasHistory: esasHistoryByPatient(patientId: $patientId) {
      encounterId
      pain
      tiredness
      drowsiness
      nausea
      lackOfAppetite
      shortnessOfBreath
      depression
      anxiety
      wellbeing
      assessedAt
    }
  }
`;

interface VisitSummaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  appointmentId: string;
}

export default function VisitSummaryDrawer({ isOpen, onClose, patientId, appointmentId }: VisitSummaryDrawerProps) {
  const { data, loading, error } = useQuery(GET_VISIT_SUMMARY, {
    variables: { patientId, appointmentId },
    skip: !isOpen || !patientId || !appointmentId
  });

  const encounter = data?.encounters?.[0];
  const esas = data?.esasHistory?.find((e: any) => e.encounterId === encounter?.encounterId);

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/clinical/export/encounter/${appointmentId}`);
      if (!response.ok) throw new Error("Failed to export PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `encounter_summary_${appointmentId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Error exporting clinical summary. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AuraPortal>
      <div className="fixed inset-0 !m-0 !p-0 z-[9999999] flex justify-end overflow-hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={onClose}
        />
        
        {/* Drawer */}
        <div className="relative w-full max-w-2xl bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] shadow-[-50px_0_150px_rgba(0,0,0,0.3)] h-full flex flex-col animate-in slide-in-from-right duration-500">
          {/* Header */}
          <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0 backdrop-blur-md">
            <div className="flex items-center gap-6">
              <div className="w-1.5 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_20px_var(--primary-glow)]" />
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight leading-none uppercase">Visit Summary</h2>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" /> 
                  {data?.appointment ? new Date(data.appointment.scheduledStart).toLocaleDateString(undefined, { dateStyle: 'full' }) : 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleDownloadPdf}
                disabled={downloading || !encounter}
                className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {downloading ? <Zap className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export Summary
              </button>
              <button 
                onClick={onClose}
                className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar scrollbar-hide">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Zap className="w-10 h-10 text-[var(--primary)] animate-pulse" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Retrieving Clinical Record...</p>
              </div>
            ) : encounter ? (
              <>
                {/* Provider Info */}
                <div className="flex items-center gap-6 p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center shadow-lg shadow-[var(--primary-glow)]">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Attending Practitioner</p>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase">{encounter.practitioner?.firstName} {encounter.practitioner?.lastName}</h3>
                    <p className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-tighter italic">{encounter.practitioner?.position}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Session Duration</p>
                    <p className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-end gap-2">
                      <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                      {encounter.admittedAt && encounter.dischargedAt ? 
                        `${Math.round((new Date(encounter.dischargedAt).getTime() - new Date(encounter.admittedAt).getTime()) / 60000)} minutes` : 
                        'Not recorded'}
                    </p>
                  </div>
                </div>

                {/* Vitals Grid */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-[var(--primary)]" />
                      Physiological Markers
                    </h4>
                    <div className="flex-1 h-px bg-[var(--card-border)]" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Heart Rate', value: encounter.vitalSigns?.[0]?.heartRate, unit: 'BPM', icon: Heart, color: 'text-rose-500' },
                      { label: 'Blood Pressure', value: encounter.vitalSigns?.[0]?.bloodPressureSystolic ? `${encounter.vitalSigns[0].bloodPressureSystolic}/${encounter.vitalSigns[0].bloodPressureDiastolic}` : null, unit: 'mmHg', icon: Activity, color: 'text-blue-500' },
                      { label: 'Temperature', value: encounter.vitalSigns?.[0]?.temperature, unit: '°F', icon: Thermometer, color: 'text-amber-500' },
                      { label: 'Oxygen Sat', value: encounter.vitalSigns?.[0]?.oxygenSaturation, unit: '%', icon: Wind, color: 'text-emerald-500' },
                    ].map((v, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--primary)]/30 transition-all">
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <v.icon className={`w-3 h-3 ${v.color}`} /> {v.label}
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-[var(--text-primary)]">{v.value || '--'}</span>
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{v.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ESAS Summary */}
                {esas && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        Symptom Burden (ESAS-R)
                      </h4>
                      <div className="flex-1 h-px bg-[var(--card-border)]" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Pain', value: esas.pain },
                        { label: 'Anxiety', value: esas.anxiety },
                        { label: 'Nausea', value: esas.nausea },
                        { label: 'Shortness of Breath', value: esas.shortnessOfBreath },
                        { label: 'Lack of Appetite', value: esas.lackOfAppetite },
                        { label: 'Wellbeing', value: esas.wellbeing },
                      ].map((s, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between">
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{s.label}</span>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${s.value > 7 ? 'bg-rose-500/10 text-rose-500' : s.value > 3 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {s.value}/10
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SOAP Notes */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      Clinical Documentation (SOAP)
                    </h4>
                    <div className="flex-1 h-px bg-[var(--card-border)]" />
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {encounter.clinicalNotes?.map((note: any, i: number) => (
                      <div key={i} className="space-y-2">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                          [{note.type.charAt(0)}] {note.type}
                        </p>
                        <div className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[13px] text-[var(--text-secondary)] italic leading-relaxed">
                          {note.content || 'No narrative provided.'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attestation */}
                <div className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Electronic Attestation</p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">
                      This clinical record was electronically signed by {encounter.practitioner?.firstName} {encounter.practitioner?.lastName} on {new Date(encounter.dischargedAt || encounter.encounterDate).toLocaleString()}.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500/30" />
                <div>
                  <p className="text-sm font-black text-[var(--text-primary)] uppercase">Encounter Data Missing</p>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-2">
                    No clinical documentation could be retrieved for this appointment ID.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuraPortal>
  );
}
