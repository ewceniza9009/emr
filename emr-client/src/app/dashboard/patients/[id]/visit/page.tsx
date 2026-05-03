"use client";

import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  Stethoscope, 
  Activity, 
  ClipboardList, 
  Pill, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  Wind,
  Heart,
  Droplets,
  ShieldCheck,
  Save,
  Search,
  Plus
} from "lucide-react";
import ProblemList from "@/components/ProblemList";
import MedicationRegistry from "@/components/MedicationRegistry";
import { ToastProvider } from "@/components/ToastProvider";

const START_ENCOUNTER = gql`
  mutation StartEncounter($input: CreateClinicalEncounterCommandInput!) {
    createClinicalEncounter(command: $input)
  }
`;

const SAVE_NOTE = gql`
  mutation SaveNote($input: SaveClinicalNoteCommandInput!) {
    saveClinicalNote(command: $input)
  }
`;

const LOG_VITALS = gql`
  mutation LogVitals($input: LogVitalSignCommandInput!) {
    logVitalSign(command: $input)
  }
`;

const LOG_ESAS = gql`
  mutation LogEsas($input: LogEsasAssessmentCommandInput!) {
    logEsasAssessment(command: $input)
  }
`;

const GET_APPOINTMENT_DETAILS = gql`
  query GetAppointmentDetails($id: UUID!) {
    appointment(id: $id) {
      appointmentId
      scheduledStart
      practitioner {
        firstName
        lastName
      }
    }
  }
`;

export default function GuidedVisitPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointmentId");
  
  const { data: apptData } = useQuery(GET_APPOINTMENT_DETAILS, {
    variables: { id: appointmentId },
    skip: !appointmentId
  });

  const appointment = apptData?.appointment;
  const [step, setStep] = useState(1);
  const [encounterId, setEncounterId] = useState<string | null>(null);

  // Form States
  const [vitals, setVitals] = useState({ hr: "", sbp: "", dbp: "", rr: "", temp: "", spo2: "" });
  const [esas, setEsas] = useState({
    pain: 0, tiredness: 0, drowsiness: 0, nausea: 0, 
    appetite: 0, sob: 0, depression: 0, anxiety: 0, wellbeing: 0
  });
  const [note, setNote] = useState({ s: "", o: "", a: "", p: "", signature: "" });

  const [startEncounter, { loading: starting }] = useMutation(START_ENCOUNTER);
  const [saveNote, { loading: savingNote }] = useMutation(SAVE_NOTE);
  const [saveVitals] = useMutation(LOG_VITALS);
  const [saveEsas] = useMutation(LOG_ESAS);

  const handleStart = async () => {
    try {
      const { data } = await startEncounter({
        variables: { 
          input: {
            patientId: params.id, 
            practitionerId: "00000000-0000-0000-0000-000000000000", // Fallback or context provider needed
            appointmentId: appointmentId || null,
            chiefComplaint: appointmentId ? "Scheduled Visit Assessment" : "Ad-hoc Assessment",
            notes: ""
          }
        }
      });
      setEncounterId(data.createClinicalEncounter);
      setStep(2);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinish = async () => {
    try {
      // 1. Save Vitals
      await saveVitals({
        variables: {
          input: {
            encounterId,
            heartRate: parseFloat(vitals.hr),
            bloodPressureSystolic: parseFloat(vitals.sbp),
            bloodPressureDiastolic: parseFloat(vitals.dbp),
            respiratoryRate: parseFloat(vitals.rr),
            temperature: parseFloat(vitals.temp),
            oxygenSaturation: parseFloat(vitals.spo2)
          }
        }
      });

      // 2. Save ESAS
      await saveEsas({
        variables: {
          input: {
            patientId: params.id,
            encounterId,
            pain: esas.pain,
            tiredness: esas.tiredness,
            drowsiness: esas.drowsiness,
            nausea: esas.nausea,
            lackOfAppetite: esas.appetite,
            shortnessOfBreath: esas.sob,
            depression: esas.depression,
            anxiety: esas.anxiety,
            wellbeing: esas.wellbeing
          }
        }
      });

      // 3. Save & Sign Note
      await saveNote({
        variables: {
          input: {
            encounterId,
            authorId: "00000000-0000-0000-0000-000000000000",
            subjective: note.s,
            objective: note.o,
            assessment: note.a,
            plan: note.p,
            signature: note.signature
          }
        }
      });

      router.push(`/dashboard/patients/${params.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const steps = [
    { id: 1, label: "Initialization", icon: Stethoscope },
    { id: 2, label: "Vitals", icon: Activity },
    { id: 3, label: "Symptom Assessment", icon: AlertCircle },
    { id: 4, label: "Clinical Profile", icon: Pill },
    { id: 5, label: "SOAP Documentation", icon: ClipboardList },
    { id: 6, label: "Finish", icon: ShieldCheck },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
              {appointment ? "Scheduled Encounter" : "Clinical Encounter"}
            </h1>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">
              {appointment 
                ? `Visit for ${new Date(appointment.scheduledStart).toLocaleDateString()} with ${appointment.practitioner?.firstName} ${appointment.practitioner?.lastName}`
                : "Guided Palliative Assessment Workflow"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
           <div className={`w-2 h-2 rounded-full ${appointmentId ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]' : 'bg-emerald-500 animate-pulse'} `} />
           <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
             {appointmentId ? `Linked: ${appointmentId.slice(0, 8)}` : 'Live Session'}
           </span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between px-2">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center gap-2 transition-all ${step >= s.id ? 'text-blue-400' : 'text-slate-700'}`}>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all
                  ${step === s.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20 scale-110' : 
                    step > s.id ? 'bg-blue-600/20 border-blue-600/40 text-blue-400' : 'bg-white/5 border-white/5'}`}>
                  <s.icon className="w-5 h-5" />
               </div>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-[2px] flex-1 mx-4 transition-all ${step > s.id ? 'bg-blue-600/40' : 'bg-white/5'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="glass-morphism rounded-[2.5rem] p-12 min-h-[500px] flex flex-col border border-white/5">
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
             <div className="w-24 h-24 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
               <Stethoscope className="w-12 h-12" />
             </div>
             <div className="space-y-3">
               <h2 className="text-3xl font-black text-white">Start New Encounter</h2>
               <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">You are about to initiate a documented clinical visit. This will create a permanent entry in the patient's record.</p>
             </div>
             <button 
               onClick={handleStart}
               disabled={starting}
               className="px-12 py-5 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20 disabled:opacity-50"
             >
               {starting ? "Initializing..." : "Initiate Encounter"}
             </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Step 02: Vital Signs</h2>
              <p className="text-slate-500 text-sm">Record the patient's physiological baseline for this encounter.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Heart className="w-3 h-3 text-rose-500" /> Heart Rate
                 </label>
                 <div className="relative">
                    <input value={vitals.hr} onChange={e => setVitals({...vitals, hr: e.target.value})} placeholder="72" className="w-full premium-input rounded-2xl py-4 px-6 text-xl font-bold text-white" />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xs uppercase">BPM</span>
                 </div>
               </div>
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3 text-blue-500" /> Blood Pressure
                 </label>
                 <div className="flex gap-2">
                    <input value={vitals.sbp} onChange={e => setVitals({...vitals, sbp: e.target.value})} placeholder="120" className="w-full premium-input rounded-2xl py-4 px-6 text-xl font-bold text-white" />
                    <span className="text-slate-700 text-2xl font-black flex items-center">/</span>
                    <input value={vitals.dbp} onChange={e => setVitals({...vitals, dbp: e.target.value})} placeholder="80" className="w-full premium-input rounded-2xl py-4 px-6 text-xl font-bold text-white" />
                 </div>
               </div>
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Thermometer className="w-3 h-3 text-amber-500" /> Temperature
                 </label>
                 <div className="relative">
                    <input value={vitals.temp} onChange={e => setVitals({...vitals, temp: e.target.value})} placeholder="98.6" className="w-full premium-input rounded-2xl py-4 px-6 text-xl font-bold text-white" />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xs uppercase">°F</span>
                 </div>
               </div>
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Wind className="w-3 h-3 text-slate-400" /> Respiratory Rate
                 </label>
                 <div className="relative">
                    <input value={vitals.rr} onChange={e => setVitals({...vitals, rr: e.target.value})} placeholder="16" className="w-full premium-input rounded-2xl py-4 px-6 text-xl font-bold text-white" />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xs uppercase">BPM</span>
                 </div>
               </div>
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Droplets className="w-3 h-3 text-blue-400" /> Oxygen Saturation
                 </label>
                 <div className="relative">
                    <input value={vitals.spo2} onChange={e => setVitals({...vitals, spo2: e.target.value})} placeholder="98" className="w-full premium-input rounded-2xl py-4 px-6 text-xl font-bold text-white" />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xs uppercase">% SpO2</span>
                 </div>
               </div>
            </div>
            <div className="pt-10">
               <button onClick={() => setStep(3)} className="w-full premium-button premium-gradient py-5 rounded-2xl text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3">
                  Continue to ESAS-R Assessment <ChevronRight className="w-5 h-5" />
               </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Step 03: Symptom Assessment (ESAS-R)</h2>
              <p className="text-slate-500 text-sm">Rate each symptom from 0 (Absent) to 10 (Worst Possible).</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
               {[
                 { id: 'pain', label: 'Pain' },
                 { id: 'tiredness', label: 'Tiredness' },
                 { id: 'drowsiness', label: 'Drowsiness' },
                 { id: 'nausea', label: 'Nausea' },
                 { id: 'appetite', label: 'Lack of Appetite' },
                 { id: 'sob', label: 'Shortness of Breath' },
                 { id: 'depression', label: 'Depression' },
                 { id: 'anxiety', label: 'Anxiety' },
                 { id: 'wellbeing', label: 'Overall Wellbeing' },
               ].map((s) => (
                 <div key={s.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-black text-white uppercase tracking-widest">{s.label}</label>
                       <span className={`text-sm font-black px-3 py-1 rounded-lg ${esas[s.id as keyof typeof esas] > 7 ? 'bg-red-500/20 text-red-400' : esas[s.id as keyof typeof esas] > 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {esas[s.id as keyof typeof esas]}
                       </span>
                    </div>
                    <input 
                      type="range" min="0" max="10" step="1" 
                      value={esas[s.id as keyof typeof esas]}
                      onChange={(e) => setEsas({...esas, [s.id]: parseInt(e.target.value)})}
                      className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                    />
                 </div>
               ))}
            </div>
            <div className="pt-10 flex gap-4">
               <button onClick={() => setStep(2)} className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:text-white transition-all">Back</button>
               <button onClick={() => setStep(4)} className="flex-[2] premium-button premium-gradient py-5 rounded-2xl text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3">
                  Continue to Clinical Profile <ChevronRight className="w-5 h-5" />
               </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Step 04: Clinical Profile Review</h2>
              <p className="text-slate-500 text-sm">Review active diagnoses and medications. Note any interventions required.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
               <ToastProvider>
                  <ProblemList patientId={params.id as string} />
                  <MedicationRegistry patientId={params.id as string} />
               </ToastProvider>
            </div>

            <div className="pt-10 flex gap-4">
               <button onClick={() => setStep(3)} className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:text-white transition-all">Back</button>
               <button onClick={() => setStep(5)} className="flex-[2] premium-button premium-gradient py-5 rounded-2xl text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3">
                  Continue to SOAP Note <ChevronRight className="w-5 h-5" />
               </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Step 05: SOAP Documentation</h2>
              <p className="text-slate-500 text-sm">Document your clinical findings and care plan.</p>
            </div>
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">[S] SUBJECTIVE</label>
                    <textarea value={note.s} onChange={e => setNote({...note, s: e.target.value})} placeholder="Patient reports..." className="w-full premium-input rounded-2xl p-6 text-sm text-white min-h-[150px]" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">[O] OBJECTIVE</label>
                    <textarea value={note.o} onChange={e => setNote({...note, o: e.target.value})} placeholder="Observed findings..." className="w-full premium-input rounded-2xl p-6 text-sm text-white min-h-[150px]" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">[A] ASSESSMENT</label>
                    <textarea value={note.a} onChange={e => setNote({...note, a: e.target.value})} placeholder="Clinical interpretation..." className="w-full premium-input rounded-2xl p-6 text-sm text-white min-h-[150px]" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">[P] PLAN</label>
                    <textarea value={note.p} onChange={e => setNote({...note, p: e.target.value})} placeholder="Next steps..." className="w-full premium-input rounded-2xl p-6 text-sm text-white min-h-[150px]" />
                  </div>
               </div>
               
               <div className="p-10 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                    <div>
                      <h4 className="text-white font-bold">E-Signature & Attestation</h4>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Permanent Record Finalization</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sign with Full Name</label>
                    <input value={note.signature} onChange={e => setNote({...note, signature: e.target.value})} placeholder="Dr. Practitioner Name" className="w-full premium-input rounded-xl py-4 px-6 text-white italic font-serif text-lg" />
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed italic">By signing this note, I attest that the information provided is accurate to the best of my knowledge and reflects the clinical encounter conducted with this patient.</p>
               </div>
            </div>
            <div className="pt-4 flex gap-4">
               <button onClick={() => setStep(4)} className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:text-white transition-all">Back</button>
               <button 
                 onClick={handleFinish}
                 disabled={savingNote || !note.signature}
                 className="flex-[2] premium-button premium-gradient py-5 rounded-2xl text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
               >
                  {savingNote ? "Signing Note..." : "Finalize & Save Encounter"} <Save className="w-5 h-5" />
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
