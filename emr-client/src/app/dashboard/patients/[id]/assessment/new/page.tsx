"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, gql } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { 
  Save, 
  X, 
  Activity, 
  Stethoscope, 
  MessageSquare, 
  AlertCircle,
  Thermometer,
  Wind,
  Scale,
  Droplets
} from "lucide-react";
import Link from "next/link";
import EsasScoring from "@/components/EsasScoring";
import PpsSelector from "@/components/PpsSelector";
import * as signalR from "@microsoft/signalr";

const CREATE_ENCOUNTER = gql`
  mutation CreateEncounter($input: CreateClinicalEncounterCommandInput!) {
    createClinicalEncounter(input: $input)
  }
`;

const LOG_ESAS_ASSESSMENT = gql`
  mutation LogEsasAssessment($input: LogEsasAssessmentCommandInput!) {
    logEsasAssessment(input: $input)
  }
`;

const LOG_VITAL_SIGN = gql`
  mutation LogVitalSign($input: LogVitalSignCommandInput!) {
    logVitalSign(input: $input)
  }
`;

export default function NewAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [esasScores, setEsasScores] = useState<Record<string, number>>({});
  const [ppsScore, setPpsScore] = useState<number>(100);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      patientId: params.id,
      encounterDate: new Date().toISOString(),
      chiefComplaint: "",
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
      temperature: 36.5,
      heartRate: 80,
      respiratoryRate: 18,
      systolicBp: 120,
      diastolicBp: 80,
      weight: 70.0,
      oxygenSaturation: 98
    }
  });

  const [createEncounter] = useMutation(CREATE_ENCOUNTER);
  const [logEsas] = useMutation(LOG_ESAS_ASSESSMENT);
  const [logVital] = useMutation(LOG_VITAL_SIGN);

  const [isIotActive, setIsIotActive] = useState(false);
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);
  
  const telemetryEnabledRef = useRef(telemetryEnabled);
  useEffect(() => {
    telemetryEnabledRef.current = telemetryEnabled;
  }, [telemetryEnabled]);

  // IoT Telemetry Integration
  useEffect(() => {
    if (!params.id) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(process.env.NEXT_PUBLIC_SIGNALR_ENDPOINT || "http://localhost:34732/hubs/telemetry")
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        await connection.invoke("JoinPatientStream", params.id);

        connection.on("ReceiveVitals", (data: any) => {
          setIsIotActive(true);
          if (telemetryEnabledRef.current) {
            if (data.heartRate) setValue("heartRate", data.heartRate);
            if (data.spO2) setValue("oxygenSaturation", data.spO2);
            if (data.temperature) setValue("temperature", data.temperature);
          }
        });
      } catch (err) {
        console.error("SignalR Connection Error (Assessment): ", err);
      }
    };

    startConnection();
    return () => { connection.stop(); };
  }, [params.id, setValue]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // 1. Create Encounter with PPS
      const { data: encounterData } = await createEncounter({
        variables: {
          input: {
            patientId: data.patientId,
            practitionerId: session?.user?.practitionerId || "00000000-0000-0000-0000-000000000000",
            chiefComplaint: data.chiefComplaint || "Routine Assessment",
            notes: `${data.subjective}\n\n${data.objective}\n\n${data.assessment}\n\n${data.plan}`,
            ppsScore: ppsScore
          }
        }
      });

      const encounterId = encounterData.createClinicalEncounter;

      // 2. Log ESAS if scores changed
      if (Object.keys(esasScores).length > 0) {
        await logEsas({
          variables: {
            input: {
              patientId: data.patientId,
              encounterId: encounterId,
              pain: esasScores.pain || 0,
              tiredness: esasScores.tiredness || 0,
              drowsiness: esasScores.drowsiness || 0,
              nausea: esasScores.nausea || 0,
              lackOfAppetite: esasScores.appetite || 0,
              shortnessOfBreath: esasScores.shortnessOfBreath || 0,
              depression: esasScores.depression || 0,
              anxiety: esasScores.anxiety || 0,
              wellbeing: esasScores.wellbeing || 0,
            }
          }
        });
      }

      // 3. Log Vitals
      await logVital({
        variables: {
          input: {
            patientId: data.patientId,
            encounterId: encounterId,
            heartRate: parseFloat(data.heartRate),
            bloodPressureSystolic: parseFloat(data.systolicBp),
            bloodPressureDiastolic: parseFloat(data.diastolicBp),
            respiratoryRate: parseFloat(data.respiratoryRate),
            temperature: parseFloat(data.temperature),
            oxygenSaturation: parseFloat(data.oxygenSaturation),
            weight: parseFloat(data.weight)
          }
        }
      });

      router.push(`/dashboard/patients/${params.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl premium-gradient flex items-center justify-center text-white shadow-lg">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">New Clinical Assessment</h1>
            <p className="text-[var(--text-muted)] text-sm">Documenting follow-up care for Patient Record</p>
          </div>
        </div>
        <Link href={`/dashboard/patients/${params.id}`} className="p-2 rounded-xl hover:bg-[var(--primary)]/10 text-[var(--text-muted)] transition-all">
          <X className="w-6 h-6" />
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} method="POST" className="space-y-6">
        {/* Vitals Section */}
        <div className="glass-morphism rounded-3xl p-8 border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tight">
              <Activity className="w-5 h-5 text-blue-500" />
              Vitals & Physical Signs
            </h2>
            <button
              type="button"
              onClick={async () => {
                const newState = !telemetryEnabled;
                setTelemetryEnabled(newState);
                
                // If turning on and no active IoT stream detected, force initialization
                if (newState && !isIotActive) {
                  try {
                    await createEncounter({
                      variables: {
                        input: {
                          patientId: params.id as string,
                          practitionerId: session?.user?.practitionerId || (process.env.NODE_ENV === 'development' ? "c79b9090-6725-460d-8531-1554c46f6f96" : "00000000-0000-0000-0000-000000000000"),
                          chiefComplaint: "Live Telemetry Bridge Handshake",
                          notes: "System initialization to connect IoT telemetry for clinical assessment.",
                          ppsScore: 100
                        }
                      }
                    });
                  } catch (e) { console.error(e); }
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer group ${
                telemetryEnabled
                  ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                  : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/50"
              }`}
              title="Toggle Live Telemetry Link"
            >
               <div className={`w-2 h-2 rounded-full ${
                 telemetryEnabled 
                   ? (isIotActive ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" : "bg-amber-500 animate-pulse") 
                   : "bg-[var(--text-muted)] opacity-50"
               }`} />
               <span className={`text-[10px] font-black uppercase tracking-widest ${
                 telemetryEnabled 
                   ? (isIotActive ? "text-emerald-500" : "text-amber-500") 
                   : "text-[var(--text-muted)]"
               }`}>
                 {telemetryEnabled ? (isIotActive ? "Live IoT Stream ON" : "Initializing Link...") : "Telemetry Link OFF"}
               </span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="space-y-1">
              <label className="tactical-label">Heart Rate</label>
              <div className="relative">
                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input {...register("heartRate")} type="number" className="w-full premium-input rounded-xl py-3 pl-10 text-[var(--text-primary)] font-bold" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="tactical-label">Temp (°C)</label>
              <div className="relative">
                <Thermometer className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input {...register("temperature")} type="number" step="0.1" className="w-full premium-input rounded-xl py-3 pl-10 text-[var(--text-primary)] font-bold" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="tactical-label">Respi (RR)</label>
              <div className="relative">
                <Wind className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input {...register("respiratoryRate")} type="number" className="w-full premium-input rounded-xl py-3 pl-10 text-[var(--text-primary)] font-bold" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="tactical-label">SpO2 (%)</label>
              <div className="relative">
                <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input {...register("oxygenSaturation")} type="number" className="w-full premium-input rounded-xl py-3 pl-10 text-[var(--text-primary)] font-bold" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="tactical-label">Weight (kg)</label>
              <div className="relative">
                <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input {...register("weight")} type="number" step="0.1" className="w-full premium-input rounded-xl py-3 pl-10 text-[var(--text-primary)] font-bold" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="tactical-label">BP (SYS/DIA)</label>
              <div className="flex items-center gap-2">
                <input {...register("systolicBp")} type="number" className="w-full premium-input rounded-xl py-3 text-center text-[var(--text-primary)] font-bold" placeholder="120" />
                <span className="text-[var(--text-muted)] opacity-40">/</span>
                <input {...register("diastolicBp")} type="number" className="w-full premium-input rounded-xl py-3 text-center text-[var(--text-primary)] font-bold" placeholder="80" />
              </div>
            </div>
          </div>
        </div>

        {/* Functional Assessment */}
        <PpsSelector onScoreChange={setPpsScore} />

        {/* Symptom Assessment */}
        <EsasScoring onScoreChange={setEsasScores} />

        {/* SOAP Note Section */}
        <div className="glass-morphism rounded-3xl p-8 border border-[var(--card-border)] bg-[var(--card-bg)]">
          <h2 className="text-sm font-black text-[var(--text-primary)] mb-6 flex items-center gap-3 uppercase tracking-tight">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            Clinical Documentation (SOAP)
          </h2>
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="tactical-label">Chief Complaint</label>
              <input {...register("chiefComplaint")} className="w-full premium-input rounded-xl py-3 px-4 text-[var(--text-primary)] font-bold" placeholder="Reason for today's visit..." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="tactical-label">Subjective Findings</label>
                <textarea {...register("subjective")} className="w-full premium-input rounded-xl py-3 px-4 text-[var(--text-primary)] font-medium min-h-[120px]" placeholder="Patient's self-reported symptoms..." />
              </div>
              <div className="space-y-1">
                <label className="tactical-label">Objective Findings</label>
                <textarea {...register("objective")} className="w-full premium-input rounded-xl py-3 px-4 text-[var(--text-primary)] font-medium min-h-[120px]" placeholder="Physical exam and clinical data..." />
              </div>
            </div>

            <div className="space-y-1">
              <label className="tactical-label">Assessment & Clinical Plan</label>
              <textarea {...register("plan")} className="w-full premium-input rounded-xl py-3 px-4 text-[var(--text-primary)] font-medium min-h-[150px]" placeholder="Diagnosis and next steps in care..." />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-4 pt-4">
           <Link href={`/dashboard/patients/${params.id}`} className="px-8 py-3 rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold transition-all">
             Discard
           </Link>
           <button 
             type="submit" 
             disabled={isSubmitting}
             className="premium-button premium-gradient px-10 py-4 rounded-2xl text-white font-black flex items-center gap-3 shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95 transition-all"
           >
             {isSubmitting ? "Saving Record..." : <><Save className="w-5 h-5" /> Save & Finalize Encounter</>}
           </button>
        </div>
      </form>
    </div>
  );
}
