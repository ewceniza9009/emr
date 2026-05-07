"use client";

import { useQuery, gql } from "@apollo/client";
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  History,
  User,
  Activity,
  ClipboardList,
  Stethoscope,
  Mail,
  Phone,
  Calendar,
  Wind,
  Thermometer,
  ShieldCheck,
  FileText,
  Heart,
  AlertCircle,
  Droplets,
  Zap,
  Clock
} from "lucide-react";
import { useCommandModal } from "./CommandModalProvider";
import HalcyonPortal from "./Portal";
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
    assessmentResponses: assessmentResponsesByEncounter(appointmentId: $appointmentId) {
      assessmentResponseId
      totalScore
      questionnaire {
        name
        description
      }
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
  const { alert } = useCommandModal();
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clinical/export/encounter/${appointmentId}`);
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
      await alert({
        title: "Export Failed",
        message: "An error occurred while generating the clinical summary PDF. Please check connection and try again.",
        type: "danger"
      });
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <HalcyonPortal>
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
                <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight leading-none uppercase">Visit Summary</h2>
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
          <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-[var(--primary)]/10 flex items-center justify-center relative">
                  <Zap className="w-8 h-8 text-[var(--primary)] animate-pulse" />
                  <div className="absolute inset-0 rounded-3xl border-2 border-[var(--primary)]/20 animate-ping" />
                </div>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] animate-pulse">Retrieving Encrypted Clinical Record...</p>
              </div>
            ) : encounter ? (
              <>
                {/* Executive Summary Header */}
                <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-[var(--input-bg)] border border-[var(--card-border)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-[60px] rounded-full -mr-16 -mt-16" />
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-teal-400 text-white flex items-center justify-center shadow-2xl shadow-[var(--primary-glow)] shrink-0">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest px-2 py-0.5 rounded-md bg-[var(--primary)]/10">Attending Practitioner</span>
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase truncate">{encounter.practitioner?.firstName} {encounter.practitioner?.lastName}</h3>
                    <p className="text-xs font-medium text-[var(--text-muted)] italic">{encounter.practitioner?.position}</p>
                  </div>
                  <div className="hidden md:block text-right shrink-0">
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Encounter ID</p>
                    <p className="text-[11px] font-mono font-bold text-[var(--text-primary)] opacity-50">{encounter.encounterId.slice(0, 13).toUpperCase()}</p>
                  </div>
                </div>

                {/* Metrics Matrix */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em] flex items-center gap-2.5">
                      <Activity className="w-4 h-4 text-[var(--primary)]" />
                      Vital Signs Registry
                    </h4>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--card-border)] to-transparent" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Heart Rate', value: encounter.vitalSigns?.[0]?.heartRate, unit: 'BPM', icon: Heart, color: 'text-rose-500', glow: 'shadow-rose-500/20' },
                      { label: 'BP', value: encounter.vitalSigns?.[0]?.bloodPressureSystolic ? `${encounter.vitalSigns[0].bloodPressureSystolic}/${encounter.vitalSigns[0].bloodPressureDiastolic}` : null, unit: 'mmHg', icon: Activity, color: 'text-blue-500', glow: 'shadow-blue-500/20' },
                      { label: 'Body Temp', value: encounter.vitalSigns?.[0]?.temperature, unit: 'Â°F', icon: Thermometer, color: 'text-amber-500', glow: 'shadow-amber-500/20' },
                      { label: 'Oxygen Sat', value: encounter.vitalSigns?.[0]?.oxygenSaturation, unit: '% SpO2', icon: Wind, color: 'text-emerald-500', glow: 'shadow-emerald-500/20' },
                    ].map((v, i) => (
                      <div key={i} className="p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--primary)]/40 transition-all duration-300 group/v">
                        <div className="flex items-center gap-2 mb-3">
                          <v.icon className={`w-3.5 h-3.5 ${v.color} group-hover/v:scale-110 transition-transform`} />
                          <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">{v.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold text-[var(--text-primary)]">{v.value || '0'}</span>
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{v.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Clinical Assessments */}
                {data?.assessmentResponses?.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em] flex items-center gap-2.5">
                        <ClipboardList className="w-4 h-4 text-blue-400" />
                        Clinical Assessments
                      </h4>
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--card-border)] to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.assessmentResponses.map((res: any) => (
                        <div key={res.assessmentResponseId} className="p-6 rounded-[2rem] bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-blue-500/30 transition-all group">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{res.questionnaire?.name}</h5>
                            {res.totalScore !== null && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[9px] font-black">Score: {res.totalScore}</span>
                            )}
                          </div>
                          <p className="text-[9px] text-[var(--text-muted)] italic line-clamp-1">{res.questionnaire?.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symptom Burden Analysis */}
                {esas && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em] flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Symptom Burden analysis
                      </h4>
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--card-border)] to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 bg-[var(--input-bg)] p-8 rounded-[2.5rem] border border-[var(--card-border)]">
                      {[
                        { label: 'Pain', value: esas.pain },
                        { label: 'Tiredness', value: esas.tiredness },
                        { label: 'Drowsiness', value: esas.drowsiness },
                        { label: 'Nausea', value: esas.nausea },
                        { label: 'Appetite', value: esas.lackOfAppetite },
                        { label: 'Shortness of Breath', value: esas.shortnessOfBreath },
                        { label: 'Depression', value: esas.depression },
                        { label: 'Anxiety', value: esas.anxiety },
                        { label: 'Overall Wellbeing', value: esas.wellbeing },
                      ].map((s, i) => (
                        <div key={i} className="space-y-2.5">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{s.label}</span>
                            <span className={`text-[10px] font-black ${s.value > 7 ? 'text-rose-500' : s.value > 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {s.value}/10
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--card-border)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${s.value > 7 ? 'bg-rose-500' : s.value > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${s.value * 10}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Documentation */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em] flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Clinical Documentation
                    </h4>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--card-border)] to-transparent" />
                  </div>
                  <div className="space-y-8">
                    {encounter.clinicalNotes?.map((note: any, i: number) => (
                      <div key={i} className="relative pl-8 border-l border-[var(--card-border)] py-1">
                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{note.type}</p>
                          <div className="p-8 rounded-[2rem] bg-[var(--input-bg)] border border-[var(--card-border)] shadow-sm hover:border-blue-500/30 transition-all duration-300">
                            <p className="text-[14px] text-[var(--text-secondary)] leading-[1.8] italic font-medium opacity-90">
                              {note.content || 'System generated clinical narrative pending clinician finalization.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certification */}
                <div className="p-10 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full -mr-24 -mb-24" />
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Electronic certification</p>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed italic font-medium">
                      I hereby certify that the clinical services described herein were personally rendered by me or under my direct supervision. This clinical record was electronically signed by <span className="text-[var(--text-primary)] font-bold not-italic">{encounter.practitioner?.firstName} {encounter.practitioner?.lastName}</span> on {new Date(encounter.dischargedAt || encounter.encounterDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.
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
    </HalcyonPortal>
  );
}

