"use client";

import { useState } from "react";
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

  const { register, handleSubmit, formState: { errors } } = useForm({
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

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // 1. Create Encounter with PPS
      const { data: encounterData } = await createEncounter({
        variables: {
          input: {
            patientId: data.patientId,
            practitionerId: session?.user?.practitionerId || "00000000-0000-0000-0000-000000000000",
            chiefComplaint: data.chiefComplaint,
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
            <h1 className="text-sm font-bold text-white uppercase tracking-tight">New Clinical Assessment</h1>
            <p className="text-slate-400 text-sm">Documenting follow-up care for Patient Record</p>
          </div>
        </div>
        <Link href={`/dashboard/patients/${params.id}`} className="p-2 rounded-xl hover:bg-white/5 text-slate-400">
          <X className="w-6 h-6" />
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} method="POST" className="space-y-6">
        {/* Vitals Section */}
        <div className="glass-morphism rounded-3xl p-8 border border-blue-500/10">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
            <Activity className="w-5 h-5 text-blue-400" />
            Vitals & Physical Signs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Heart Rate</label>
              <div className="relative">
                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input {...register("heartRate")} type="number" className="w-full premium-input rounded-xl py-3 pl-10 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Temp (°C)</label>
              <div className="relative">
                <Thermometer className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input {...register("temperature")} type="number" step="0.1" className="w-full premium-input rounded-xl py-3 pl-10 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Respi (RR)</label>
              <div className="relative">
                <Wind className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input {...register("respiratoryRate")} type="number" className="w-full premium-input rounded-xl py-3 pl-10 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">SpO2 (%)</label>
              <div className="relative">
                <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input {...register("oxygenSaturation")} type="number" className="w-full premium-input rounded-xl py-3 pl-10 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Weight (kg)</label>
              <div className="relative">
                <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input {...register("weight")} type="number" step="0.1" className="w-full premium-input rounded-xl py-3 pl-10 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">BP (SYS/DIA)</label>
              <div className="flex items-center gap-2">
                <input {...register("systolicBp")} type="number" className="w-full premium-input rounded-xl py-3 text-center text-white" placeholder="120" />
                <span className="text-slate-600">/</span>
                <input {...register("diastolicBp")} type="number" className="w-full premium-input rounded-xl py-3 text-center text-white" placeholder="80" />
              </div>
            </div>
          </div>
        </div>

        {/* Functional Assessment */}
        <PpsSelector onScoreChange={setPpsScore} />

        {/* Symptom Assessment */}
        <EsasScoring onScoreChange={setEsasScores} />

        {/* SOAP Note Section */}
        <div className="glass-morphism rounded-3xl p-8">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Clinical Documentation (SOAP)
          </h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Chief Complaint</label>
              <input {...register("chiefComplaint")} className="w-full premium-input rounded-xl py-3 px-4 text-white" placeholder="Reason for today's visit..." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Subjective Findings</label>
                <textarea {...register("subjective")} className="w-full premium-input rounded-xl py-3 px-4 text-white min-h-[120px]" placeholder="Patient's self-reported symptoms..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Objective Findings</label>
                <textarea {...register("objective")} className="w-full premium-input rounded-xl py-3 px-4 text-white min-h-[120px]" placeholder="Physical exam and clinical data..." />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Assessment & Clinical Plan</label>
              <textarea {...register("plan")} className="w-full premium-input rounded-xl py-3 px-4 text-white min-h-[150px]" placeholder="Diagnosis and next steps in care..." />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-4 pt-4">
           <Link href={`/dashboard/patients/${params.id}`} className="px-8 py-3 rounded-2xl text-slate-400 hover:text-white font-medium transition-all">
             Discard
           </Link>
           <button 
             type="submit" 
             disabled={isSubmitting}
             className="premium-button premium-gradient px-10 py-4 rounded-2xl text-white font-bold flex items-center gap-2 shadow-xl shadow-blue-500/20 disabled:opacity-50"
           >
             {isSubmitting ? "Saving Record..." : <><Save className="w-5 h-5" /> Save & Finalize Encounter</>}
           </button>
        </div>
      </form>
    </div>
  );
}
