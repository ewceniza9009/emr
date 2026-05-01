"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, gql } from "@apollo/client";
import { 
  Stethoscope, 
  Activity, 
  ClipboardList, 
  FileText, 
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Thermometer,
  Zap
} from "lucide-react";

const COMPLETE_VISIT = gql`
  mutation CompleteGuidedEncounter($input: CompleteGuidedEncounterCommandInput!) {
    completeGuidedEncounter(input: $input)
  }
`;

export default function GuidedVisit() {
  const params = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [visitType, setVisitType] = useState("Routine");
  
  // Clinical State
  const [pps, setPps] = useState(100);
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [esas, setEsas] = useState<any>({
    Pain: 0, Tiredness: 0, Drowsiness: 0, Nausea: 0, Appetite: 0,
    ShortnessOfBreath: 0, Depression: 0, Anxiety: 0, Wellbeing: 0
  });

  const [completeVisit, { loading: completing }] = useMutation(COMPLETE_VISIT);

  const handleComplete = async () => {
    try {
      await completeVisit({
        variables: {
          input: {
            encounterId: "00000000-0000-0000-0000-000000000000", // Placeholder
            type: visitType === "initial" ? "Admission" : "Routine",
            ppsScore: pps,
            subjective: soap.subjective,
            objective: soap.objective,
            assessment: soap.assessment,
            plan: soap.plan,
            pain: parseInt(esas.Pain),
            tiredness: parseInt(esas.Tiredness),
            drowsiness: parseInt(esas.Drowsiness),
            nausea: parseInt(esas.Nausea),
            lackOfAppetite: parseInt(esas.Appetite),
            shortnessOfBreath: parseInt(esas.ShortnessOfBreath),
            depression: parseInt(esas.Depression),
            anxiety: parseInt(esas.Anxiety),
            wellbeing: parseInt(esas.Wellbeing)
          }
        }
      });
      router.push(`/dashboard/patients/${params.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const steps = [
    { id: 1, label: "Type", icon: Calendar },
    { id: 2, label: "Vitals", icon: Thermometer },
    { id: 3, label: "Symptoms", icon: Activity },
    { id: 4, label: "Functional", icon: Zap },
    { id: 5, label: "Documentation", icon: FileText },
    { id: 6, label: "Plan", icon: CheckCircle2 },
  ];

  const esasFields = [
    { key: "Pain", label: "Pain" },
    { key: "Tiredness", label: "Tiredness" },
    { key: "Drowsiness", label: "Drowsiness" },
    { key: "Nausea", label: "Nausea" },
    { key: "Appetite", label: "Appetite" },
    { key: "ShortnessOfBreath", label: "Shortness of Breath" },
    { key: "Depression", label: "Depression" },
    { key: "Anxiety", label: "Anxiety" },
    { key: "Wellbeing", label: "Wellbeing" }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Guided Clinical Encounter</h1>
            <p className="text-slate-400">Recording live assessment for: <span className="text-blue-400 font-mono">PN-2026-0892</span></p>
          </div>
        </div>
        <button onClick={() => router.back()} className="px-4 py-2 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <ChevronLeft className="w-4 h-4" /> Cancel Visit
        </button>
      </div>

      {/* Progress Tracker */}
      <div className="flex items-center justify-between px-4">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center gap-2 transition-all ${currentStep >= step.id ? 'text-blue-400' : 'text-slate-600'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 
                ${currentStep === step.id ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20 scale-110' : 
                  currentStep > step.id ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/5'}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-[2px] flex-1 mx-4 transition-all ${currentStep > step.id ? 'bg-blue-500/40' : 'bg-white/5'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Wizard Content Area */}
      <div className="glass-morphism rounded-[2.5rem] p-12 min-h-[500px] flex flex-col relative overflow-hidden">
        {currentStep === 1 && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Choose Encounter Protocol</h2>
              <p className="text-slate-400">The protocol will guide the assessment depth based on the visit type.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Initial Admission", desc: "Comprehensive assessment and goals of care.", type: "initial" },
                { title: "Routine Follow-up", desc: "Standard symptom tracking and plan adjustments.", type: "routine" },
                { title: "Crisis Intervention", desc: "Urgent management of severe symptoms.", type: "crisis" },
                { title: "Telehealth Consult", desc: "Remote assessment via video link.", type: "tele" },
              ].map((t) => (
                <button 
                  key={t.type} 
                  onClick={() => { setVisitType(t.type); setCurrentStep(2); }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                >
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{t.title}</h3>
                  <p className="text-slate-500 text-sm">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Objective Vitals</h2>
              <p className="text-slate-400">Record current physiological signs.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Blood Pressure", unit: "mmHg", placeholder: "120/80" },
                { label: "Heart Rate", unit: "bpm", placeholder: "72" },
                { label: "Resp. Rate", unit: "breaths/m", placeholder: "16" },
                { label: "Temp", unit: "°C", placeholder: "36.6" },
              ].map((v) => (
                <div key={v.label} className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{v.label}</label>
                  <div className="relative">
                    <input type="text" placeholder={v.placeholder} className="w-full premium-input rounded-xl py-3 px-4 text-white pr-16" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">{v.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-10 flex justify-between">
               <button onClick={() => setCurrentStep(1)} className="px-8 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold hover:text-white transition-all">Back</button>
               <button onClick={() => setCurrentStep(3)} className="premium-button premium-gradient px-12 py-4 rounded-2xl text-white font-bold flex items-center gap-2">Continue <ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Symptom Severity (ESAS)</h2>
              <p className="text-slate-400">Scale of 0 (None) to 10 (Worst Possible).</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {esasFields.map((f) => (
                <div key={f.key} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-300">{f.label}</label>
                    <span className="text-blue-400 font-mono font-bold">{esas[f.key]}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={esas[f.key]}
                    onChange={(e) => setEsas({ ...esas, [f.key]: e.target.value })}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                  />
                </div>
              ))}
            </div>
            <div className="pt-10 flex justify-between">
               <button onClick={() => setCurrentStep(2)} className="px-8 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold hover:text-white transition-all">Back</button>
               <button onClick={() => setCurrentStep(4)} className="premium-button premium-gradient px-12 py-4 rounded-2xl text-white font-bold flex items-center gap-2">Continue <ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Palliative Performance Scale (PPS)</h2>
              <p className="text-slate-400">Select the functional status that best describes the patient.</p>
            </div>
            <div className="space-y-3">
              {[
                { p: 100, label: "100%", desc: "Full ambulation, no evidence of disease." },
                { p: 70, label: "70%", desc: "Reduced ambulation, unable to do normal work." },
                { p: 50, label: "50%", desc: "Mainly sit/lie, unable to do any work." },
                { p: 30, label: "30%", desc: "Totally bed bound, unable to do self-care." },
              ].map((p) => (
                <button 
                  key={p.p} 
                  onClick={() => { setPps(p.p); setCurrentStep(5); }} 
                  className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between group ${pps === p.p ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/5 border-white/10 hover:border-emerald-500/50'}`}
                >
                  <div>
                    <span className={`text-xl font-bold ${pps === p.p ? 'text-emerald-400' : 'text-white'}`}>{p.label}</span>
                    <p className="text-slate-500 text-sm">{p.desc}</p>
                  </div>
                  <ChevronRight className={`w-6 h-6 ${pps === p.p ? 'text-emerald-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
            <div className="pt-10 flex justify-between">
               <button onClick={() => setCurrentStep(3)} className="px-8 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold hover:text-white transition-all">Back</button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Clinical Documentation (SOAP)</h2>
              <p className="text-slate-400">Structured narrative of the encounter.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["subjective", "objective", "assessment", "plan"].map((s) => (
                <div key={s} className="space-y-2 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest capitalize">{s}</label>
                  <textarea 
                    value={(soap as any)[s]} 
                    onChange={(e) => setSoap({...soap, [s]: e.target.value})} 
                    className="w-full premium-input rounded-2xl p-6 text-white min-h-[150px] text-sm" 
                    placeholder={`Enter ${s} documentation...`} 
                  />
                </div>
              ))}
            </div>
            <div className="pt-10 flex justify-between">
               <button onClick={() => setCurrentStep(4)} className="px-8 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold hover:text-white transition-all">Back</button>
               <button onClick={() => setCurrentStep(6)} className="premium-button premium-gradient px-12 py-4 rounded-2xl text-white font-bold flex items-center gap-2">Finalize Visit <ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-white">Visit Protocol Complete</h2>
              <p className="text-slate-400 max-w-md mx-auto text-lg">All clinical assessments, ESAS scores, and SOAP notes are ready for synchronization.</p>
            </div>
            <button 
              onClick={handleComplete}
              disabled={completing}
              className="premium-button premium-gradient px-12 py-5 rounded-3xl text-white font-bold text-xl shadow-2xl shadow-blue-500/40 disabled:opacity-50"
            >
              {completing ? "Synchronizing..." : "Save & Synchronize Record"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
