"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Plus,
  HelpCircle,
  HeartOff,
  Zap,
  FileText,
  UserCheck
} from "lucide-react";
import { ToastProvider } from "@/components/ToastProvider";
import ProblemList from "@/components/ProblemList";
import MedicationRegistry from "@/components/MedicationRegistry";
import DynamicAssessment from "@/components/DynamicAssessment";

const START_ENCOUNTER = gql`
  mutation StartEncounter($input: CreateClinicalEncounterCommandInput!) {
    createClinicalEncounter(input: $input)
  }
`;

const SAVE_NOTE = gql`
  mutation SaveNote($input: SaveClinicalNoteCommandInput!) {
    saveClinicalNote(input: $input)
  }
`;

const LOG_VITALS = gql`
  mutation LogVitals($input: LogVitalSignCommandInput!) {
    logVitalSign(input: $input)
  }
`;

const ADD_DIRECTIVE = gql`
  mutation AddDirective($input: AddAdvanceDirectiveCommandInput!) {
    addAdvanceDirective(input: $input)
  }
`;

const LOG_ASSESSMENT_RESPONSE = gql`
  mutation LogAssessmentResponse($input: LogAssessmentResponseCommandInput!) {
    logAssessmentResponse(input: $input)
  }
`;

const GET_PATIENT_CONTEXT = gql`
  query GetPatientContext($id: UUID!) {
    patient(id: $id) {
      patientId
      firstName
      lastName
      mrn
      dob
      biologicalSex
    }
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
      plannedAssessments
    }
  }
`;

const GET_QUESTIONNAIRE = gql`
  query GetQuestionnaire($type: AssessmentType!) {
    questionnaireByType(type: $type) {
      questionnaireId
      name
      description
      schemaJson
      questions {
        questionId
        text
        subtext
        type
        optionsJson
      }
    }
  }
`;

const GET_ALL_QUESTIONNAIRES = gql`
  query GetAllQuestionnaires {
    questionnaires {
      questionnaireId
      name
      description
      assessmentType
    }
  }
`;

export default function GuidedVisitPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const appointmentId = searchParams.get("appointmentId");

  const { data: patientData } = useQuery(GET_PATIENT_CONTEXT, {
    variables: { id: params.id }
  });

  const { data: apptData } = useQuery(GET_APPOINTMENT_DETAILS, {
    variables: { id: appointmentId },
    skip: !appointmentId
  });

  const patient = patientData?.patient;
  const appointment = apptData?.appointment;

  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const lastValidIndex = useRef(0);

  // Form States
  const [vitals, setVitals] = useState({ hr: "", sbp: "", dbp: "", rr: "", temp: "", spo2: "" });
  const [directives, setDirectives] = useState<{ type: string, notes: string }[]>([]);
  const [note, setNote] = useState({ s: "", o: "", a: "", p: "", signature: "" });
  const [assessmentResults, setAssessmentResults] = useState<Record<string, any>>({});
  const [activeAssessments, setActiveAssessments] = useState<any[]>([]);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  // Persistence Key
  const persistenceKey = `halcyon-visit-persist-${params.id}-${appointmentId || 'adhoc'}`;

  // 1. Load Persisted State on Mount
  useEffect(() => {
    const saved = localStorage.getItem(persistenceKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.vitals) setVitals(data.vitals);
        if (data.directives) setDirectives(data.directives);
        if (data.note) setNote(data.note);
        if (data.assessmentResults) setAssessmentResults(data.assessmentResults);
        if (data.encounterId) setEncounterId(data.encounterId);
        if (data.activeAssessments) setActiveAssessments(data.activeAssessments);
        if (data.step) setStep(data.step);
        if (data.maxStepReached) setMaxStepReached(data.maxStepReached);
        console.log("Mission Continuity: Restored session data.");
      } catch (e) {
        console.error("Persistence Restore Failed", e);
      }
    }
    setIsHydrated(true);
  }, [persistenceKey]);

  // 2. Persist State on Change - Protected by isHydrated
  useEffect(() => {
    if (!isHydrated) return;
    const state = { vitals, directives, note, assessmentResults, encounterId, step, maxStepReached, activeAssessments };
    localStorage.setItem(persistenceKey, JSON.stringify(state));
  }, [vitals, directives, note, assessmentResults, encounterId, step, maxStepReached, activeAssessments, isHydrated, persistenceKey]);

  // 3. Clear on Completion
  const clearPersistence = () => localStorage.removeItem(persistenceKey);

  const { data: allQuestionnairesData } = useQuery(GET_ALL_QUESTIONNAIRES);
  const allQuestionnaires = allQuestionnairesData?.questionnaires || [];

   // Sync planned assessments into active state - Improved for immediate visibility
   useEffect(() => {
     if (!appointment?.plannedAssessments || (isHydrated && activeAssessments.length > 0)) return;
     
     const planned = appointment.plannedAssessments;
     if (activeAssessments.length === 0) {
       // Create initial stubs for immediate rail visibility
       const stubs = planned.map((code: string) => {
         const fullMatch = allQuestionnaires.find((q: any) => q.assessmentType === code || q.name === code);
         return {
           questionnaireId: fullMatch?.questionnaireId || code,
           name: fullMatch?.name || code,
           assessmentType: fullMatch?.assessmentType || code,
           isStub: !fullMatch
         };
       });
       setActiveAssessments(stubs);
     } else if (allQuestionnaires.length > 0) {
       // Hydrate stubs when metadata arrives
       const hydrated = activeAssessments.map(a => {
         if (!a.isStub) return a;
         const match = allQuestionnaires.find((q: any) => q.assessmentType === a.assessmentType || q.name === a.name);
         return match ? { ...match, isStub: false } : a;
       });
       if (JSON.stringify(hydrated) !== JSON.stringify(activeAssessments)) {
         setActiveAssessments(hydrated);
       }
     }
   }, [allQuestionnaires, appointment, activeAssessments.length, isHydrated]);

  const [startEncounter, { loading: starting }] = useMutation(START_ENCOUNTER);
  const [saveNote, { loading: savingNote }] = useMutation(SAVE_NOTE);
  const [saveVitals] = useMutation(LOG_VITALS);
  const [addDirective] = useMutation(ADD_DIRECTIVE);
  const [logAssessmentResponse] = useMutation(LOG_ASSESSMENT_RESPONSE);

  interface Step {
    id: number;
    label: string;
    icon: any;
    type: string;
    assessmentId?: string;
    assessmentName?: string;
    questionnaireId?: string;
  }

  const steps = useMemo<Step[]>(() => {
    const s: Step[] = [
      { id: 1, label: "Start", icon: Stethoscope, type: "INIT" },
      { id: 2, label: "Plan", icon: ShieldCheck, type: "DIRECTIVES" },
      { id: 3, label: "Vitals", icon: Activity, type: "VITALS" },
    ];

    const planned = appointment?.plannedAssessments || [];

    // Add dynamically picked assessments
    activeAssessments.forEach((p: any, idx: number) => {
      s.push({
        id: 100 + idx,
        label: p.name,
        icon: ClipboardList,
        type: "ASSESSMENT_WRAPPER",
        assessmentId: p.assessmentType,
        assessmentName: p.name,
        questionnaireId: p.questionnaireId
      });
    });

    s.push({ id: 90, label: "Clinical", icon: Pill, type: "CLINICAL" });
    s.push({ id: 91, label: "SOAP Note", icon: ClipboardList, type: "NOTE" });
    s.push({ id: 92, label: "Finish", icon: CheckCircle2, type: "FINISH" });

    if (navSearch) {
      return s.filter(step =>
        step.label.toLowerCase().includes(navSearch.toLowerCase()) ||
        step.type === "INIT" ||
        step.type === "FINISH"
      );
    }

    return s;
  }, [appointment, activeAssessments, navSearch]);
  
  // Track last valid index and max step for smart navigation
  useEffect(() => {
    const idx = steps.findIndex(s => s.id === step);
    if (idx >= 0) {
      lastValidIndex.current = idx;
      if (idx > steps.findIndex(s => s.id === maxStepReached)) {
        setMaxStepReached(step);
      }
    }
  }, [steps, step, maxStepReached]);
  
  // Validation hook to prevent stale steps when assessments are removed
  useEffect(() => {
    const stepExists = steps.some(s => s.id === step);
    if (!stepExists && steps.length > 0) {
      // If our step is gone, use the last known index to find the next valid neighbor
      const fallbackIndex = Math.min(lastValidIndex.current, steps.length - 1);
      setStep(steps[fallbackIndex].id);
    }
  }, [steps, step]);

  const currentStepIndex = steps.findIndex(s => s.id === step);
  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];
  const prevStep = steps[currentStepIndex - 1];

  const { data: questionnaireData, loading: loadingQuestionnaire } = useQuery(GET_QUESTIONNAIRE, {
    variables: { type: currentStep?.assessmentId },
    skip: (currentStep?.type !== "ASSESSMENT" && currentStep?.type !== "ASSESSMENT_WRAPPER") || !currentStep?.assessmentId
  });

  const [executingAssessment, setExecutingAssessment] = useState(false);

  const handleStart = async () => {
    // Development Fallback: Prioritize session ID, but fallback to static Admin ID in dev environments
    const clinicianId = session?.user?.practitionerId || 
      (process.env.NODE_ENV === 'development' ? "c79b9090-6725-460d-8531-1554c46f6f96" : null);
    
    if (!clinicianId || clinicianId === "00000000-0000-0000-0000-000000000000") {
      console.error("Clinical Identity Missing: Encounter initialization aborted to prevent audit failure.");
      alert("Clinician Identity Required: Please ensure you are logged in with a valid practitioner account.");
      return;
    }

    try {
      const { data } = await startEncounter({
        variables: {
          input: {
            patientId: params.id,
            practitionerId: clinicianId,
            appointmentId: appointmentId || null,
            chiefComplaint: appointmentId ? "Scheduled Visit Assessment" : "Ad-hoc Assessment",
            notes: ""
          }
        }
      });
      setEncounterId(data.createClinicalEncounter);
      setStep(nextStep.id);
    } catch (err) {
      console.error("Encounter Initialization Error:", err);
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

      // All Assessments are saved immediately during the workflow via logAssessmentResponse mutation.

      // 4. Save Directives
      for (const d of directives) {
        await addDirective({
          variables: {
            input: {
              patientId: params.id,
              type: d.type,
              notes: d.notes,
              effectiveDate: new Date().toISOString()
            }
          }
        });
      }

      // 5. Save & Sign Note
      await saveNote({
        variables: {
          input: {
            encounterId,
            authorId: session?.user?.practitionerId || "00000000-0000-0000-0000-000000000000",
            subjective: note.s,
            objective: note.o,
            assessment: note.a,
            plan: note.p,
            signature: note.signature
          }
        }
      });

      router.push(`/dashboard/patients/${params.id}`);
      clearPersistence();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans transition-colors duration-300">
      {/* Premium Clinical Header - Compact */}
      <div className="h-16 border-b border-[var(--border-color,rgba(0,0,0,0.05))] bg-[var(--card-bg)] flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/patients/${params.id}`)}
            className="p-2 rounded-xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/30 transition-all group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tight uppercase">
              {patient?.firstName} {patient?.lastName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black text-[var(--primary)] bg-[var(--primary)]/5 px-2 py-0.5 rounded-lg border border-[var(--primary)]/20 uppercase tracking-widest">
                MRN: {patient?.mrn || 'PENDING'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-bold">
                {patient?.biologicalSex} • {patient?.dob && new Date(patient.dob).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>        <div className="flex items-center gap-8">
          {encounterId && (
            <div className="flex items-center gap-2.5 px-4 py-1.5 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary)] animate-pulse" />
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.2em]">Live Session</span>
            </div>
          )}
          <div className="flex items-center gap-4 border-l border-[var(--border-color,rgba(0,0,0,0.05))] pl-8">
            <div className="text-right">
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1.5">Practitioner</p>
              <p className="text-xs font-black uppercase tracking-tight">{session?.user?.name || "System Admin"}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] flex items-center justify-center shadow-sm">
              <Stethoscope className="w-5 h-5 text-[var(--primary)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
        {/* Top Sequence Navigator - Scalable Rail */}
        <div className="h-16 border-b border-[var(--border-color,rgba(0,0,0,0.05))] bg-[var(--card-bg)] flex items-center px-8 z-30">
          <div className="flex-1 overflow-x-auto no-scrollbar py-2">
            <div className="flex items-center gap-2 min-w-max mx-auto px-4">
              {steps.map((s, idx) => {
                const isActive = step === s.id;
                const isCompleted = currentStepIndex > idx;
                const isUnlocked = idx <= steps.findIndex(st => st.id === maxStepReached);
                
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <button
                      onClick={() => (isUnlocked || isActive) && setStep(s.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${isActive
                        ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 scale-105"
                        : isUnlocked
                          ? "text-[var(--primary)] hover:bg-[var(--primary)]/5"
                          : "text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-black ${isActive ? "bg-white text-[var(--primary)] border-white" : "border-current"
                        }`}>
                        {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : String(idx + 1).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
                    </button>
                    {idx < steps.length - 1 && (
                      <div className="w-6 h-[1px] bg-[var(--border-color,rgba(0,0,0,0.1))]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => setIsAssessmentModalOpen(true)}
            className="ml-4 p-2 rounded-full border border-dashed border-[var(--border-color,rgba(0,0,0,0.2))] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all"
            title="Add Protocol"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div className="max-w-4xl mx-auto p-10 h-full">
            <div className="flex-1 rounded-xl p-6 border border-white/5 bg-[var(--card-bg)] shadow-xl overflow-y-auto">
              {currentStep?.type === "INIT" && (
                <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
                  <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-sm font-bold uppercase tracking-tight">Ready to Begin</h2>
                    <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-1">Select Start to establish clinical session</p>
                  </div>

                  <button
                    onClick={handleStart}
                    disabled={starting || (!session?.user?.practitionerId && process.env.NODE_ENV !== 'development')}
                    className={`w-full max-w-[220px] py-3.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                      (!session?.user?.practitionerId && process.env.NODE_ENV !== 'development') || starting 
                        ? "bg-slate-700/50 text-white/30 cursor-not-allowed grayscale" 
                        : "bg-[var(--primary)] shadow-[var(--primary-glow)] hover:opacity-90 active:scale-[0.98]"
                    }`}
                  >
                    {(!session?.user?.practitionerId && process.env.NODE_ENV !== 'development') ? "Identifying..." : (starting ? "Establishing..." : "Start Encounter")} <ChevronRight className="w-4 h-4" />
                  </button>

                  {appointment?.plannedAssessments?.length > 0 && (
                    <div className="w-full max-w-sm pt-12 border-t border-[var(--border-color,rgba(0,0,0,0.05))] space-y-6">
                      <p className="text-center text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.5em]">Clinical Plan</p>
                      <div className="grid grid-cols-2 gap-4">
                        {appointment.plannedAssessments.map((code: string) => (
                          <div key={code} className="flex flex-col items-center gap-2 group cursor-default">
                            <div className="w-8 h-8 rounded-full bg-[var(--primary)]/5 border border-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-all">
                              <ClipboardList className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest group-hover:text-[var(--foreground)] transition-colors">{code}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep?.type === "DIRECTIVES" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold uppercase tracking-tight">Legal Directives</h2>
                    <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-bold">Advance Care Planning</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: "DNR", label: "DNR", icon: HeartOff, desc: "Do Not Resuscitate" },
                      { id: "DNI", label: "DNI", icon: Wind, desc: "Do Not Intubate" },
                      { id: "FULLCODE", label: "FULLCODE", icon: Zap, desc: "Full Resuscitation" },
                      { id: "LIVINGWILL", label: "LIVINGWILL", icon: FileText, desc: "Advance Directive" },
                      { id: "HEALTHCAREPROXY", label: "HEALTHCAREPROXY", icon: UserCheck, desc: "Medical POA" },
                    ].map((item) => (
                      <button 
                        key={item.id} 
                        onClick={() => {
                          if (directives.some(d => d.type === item.id)) {
                            setDirectives(directives.filter(d => d.type !== item.id));
                          } else {
                            setDirectives([...directives, { type: item.id, notes: "" }]);
                          }
                        }} 
                        className={`p-5 rounded-2xl border transition-all flex items-center justify-between group
                          ${directives.some(d => d.type === item.id) 
                            ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 shadow-sm' 
                            : 'bg-[var(--background)]/5 border-[var(--border-color,rgba(0,0,0,0.05))] hover:border-[var(--primary)]/20'
                          }`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            directives.some(d => d.type === item.id) 
                              ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' 
                              : 'bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)]'
                          }`}>
                            <item.icon className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className={`text-sm font-bold uppercase tracking-tight ${
                              directives.some(d => d.type === item.id) ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
                            }`}>{item.label}</p>
                            <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-black mt-1">
                              {item.desc} • {directives.some(d => d.type === item.id) ? 'Active' : 'Unset'}
                            </p>
                          </div>
                        </div>
                        {directives.some(d => d.type === item.id) 
                          ? <CheckCircle2 className="w-6 h-6 text-[var(--primary)]" /> 
                          : <div className="w-6 h-6 rounded-full border border-[var(--border-color,rgba(0,0,0,0.1))]" />
                        }
                      </button>
                    ))}
                  </div>

                  <div className="pt-8 flex gap-4 border-t border-[var(--border-color,rgba(0,0,0,0.05))]">
                    <button onClick={() => setStep(prevStep.id)} className="flex-1 py-3.5 rounded-xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-all">Back</button>
                    <button onClick={() => setStep(nextStep.id)} className="flex-1 py-3.5 rounded-xl bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                      Continue to {nextStep.label} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {currentStep?.type === "VITALS" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold uppercase tracking-tight">Clinical Encounter Summary</h2>
                    <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest font-bold">SOAP Methodology Documentation</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'hr', label: 'Heart Rate', icon: Heart, color: 'text-rose-500', unit: 'BPM', placeholder: '72' },
                      { id: 'sbp', label: 'Blood Pressure', icon: Activity, color: 'text-blue-500', unit: 'mmHg', double: true },
                      { id: 'temp', label: 'Temperature', icon: Thermometer, color: 'text-amber-500', unit: '°F', placeholder: '98.6' },
                      { id: 'rr', label: 'Respiratory Rate', icon: Wind, color: 'text-slate-400', unit: 'BPM', placeholder: '16' },
                      { id: 'spo2', label: 'O2 Saturation', icon: Droplets, color: 'text-blue-400', unit: '%', placeholder: '98' },
                    ].map((v) => (
                      <div key={v.id} className="space-y-3 p-5 rounded-2xl bg-[var(--card-bg,white)] border border-[var(--border-color,rgba(0,0,0,0.08))] shadow-sm hover:shadow-md transition-all group">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2 group-hover:text-[var(--primary)] transition-colors">
                          <v.icon className={`w-3.5 h-3.5 ${v.color}`} /> {v.label}
                        </label>
                        {v.double ? (
                          <div className="flex gap-2 items-center">
                            <input value={vitals.sbp} onChange={e => setVitals({ ...vitals, sbp: e.target.value })} placeholder="120" className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] rounded-xl py-3 px-4 text-xl font-bold text-[var(--foreground)] focus:border-[var(--primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/20" />
                            <span className="text-[var(--text-muted)]/20 text-xl font-black">/</span>
                            <input value={vitals.dbp} onChange={e => setVitals({ ...vitals, dbp: e.target.value })} placeholder="80" className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] rounded-xl py-3 px-4 text-xl font-bold text-[var(--foreground)] focus:border-[var(--primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/20" />
                          </div>
                        ) : (
                          <div className="relative">
                            <input value={vitals[v.id as keyof typeof vitals]} onChange={e => setVitals({ ...vitals, [v.id]: e.target.value })} placeholder={v.placeholder} className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] rounded-xl py-3 px-4 text-xl font-bold text-[var(--foreground)] focus:border-[var(--primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/20" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{v.unit}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="pt-8 flex gap-4 border-t border-[var(--border-color,rgba(0,0,0,0.05))]">
                    <button onClick={() => setStep(prevStep.id)} className="flex-1 py-3.5 rounded-xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-all">Back</button>
                    {(() => {
                      const filledCount = [vitals.hr, vitals.sbp && vitals.dbp, vitals.temp, vitals.rr, vitals.spo2].filter(Boolean).length;
                      const isValid = filledCount >= 3;
                      return (
                        <button 
                          onClick={() => setStep(nextStep.id)} 
                          disabled={!isValid}
                          className={`flex-1 py-3.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${isValid ? "bg-[var(--primary)] shadow-[var(--primary-glow)] hover:opacity-90" : "bg-slate-700/50 text-white/30 cursor-not-allowed grayscale"}`}
                        >
                          {isValid ? `Continue to ${nextStep.label}` : "Entry Required (3 min)"} <ChevronRight className="w-4 h-4" />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              )}

              {currentStep?.type === "ASSESSMENT_WRAPPER" && (
                <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                  {!executingAssessment ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12">
                      <div className="w-24 h-24 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <ClipboardList className="w-12 h-12" />
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">{currentStep.label}</h2>
                        <p className="text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed text-sm">
                          {questionnaireData?.questionnaireByType?.description || "Select an action to proceed with this clinical protocol."}
                        </p>
                      </div>

                      <div className="w-full max-w-[280px] space-y-2">
                        <button
                          onClick={() => setExecutingAssessment(true)}
                          className="w-full py-3.5 rounded-xl bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary-glow)]"
                        >
                          Start Assessment <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="flex gap-4">
                          <button
                            onClick={() => setStep(nextStep.id)}
                            className="flex-1 py-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-all"
                          >
                            Skip
                          </button>
                          <button
                            onClick={() => {
                              setActiveAssessments(prev => prev.filter(a => a.assessmentType !== currentStep.assessmentId));
                              // When removing, it is safer to drop back to the previous stable step 
                              // rather than jumping into the next assessment unprepared.
                              setStep(prevStep.id);
                            }}
                            className="flex-1 py-3.5 rounded-xl bg-rose-500/10 border border-rose-500/10 text-rose-400 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    loadingQuestionnaire ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-6">
                        <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Loading protocol metadata...</p>
                      </div>
                    ) : questionnaireData?.questionnaireByType ? (
                      <DynamicAssessment
                        questionnaire={questionnaireData.questionnaireByType}
                        initialAnswers={assessmentResults[currentStep.assessmentId!]?.answers || {}}
                        onPartialUpdate={(answers) => {
                          setAssessmentResults(prev => ({
                            ...prev,
                            [currentStep.assessmentId!]: { ...prev[currentStep.assessmentId!], answers }
                          }));
                        }}
                        onBack={() => setExecutingAssessment(false)}
                        onComplete={async (answers, score) => {
                          try {
                            await logAssessmentResponse({
                              variables: {
                                input: {
                                  questionnaireId: questionnaireData.questionnaireByType.questionnaireId,
                                  patientId: params.id,
                                  encounterId: encounterId,
                                  assessorId: session?.user?.practitionerId || session?.user?.id,
                                  answersJson: JSON.stringify(answers),
                                  totalScore: score
                                }
                              }
                            });
                            setAssessmentResults(prev => ({ 
                              ...prev, 
                              [currentStep.assessmentId!]: { answers, score, completed: true } 
                            }));
                            setExecutingAssessment(false);
                            setStep(nextStep.id);
                          } catch (err) {
                            console.error("Failed to save assessment response", err);
                          }
                        }}
                      />
                    ) : (
                      <div className="p-16 bg-[var(--card-bg)] border border-[var(--border-color,rgba(0,0,0,0.1))] rounded-[2rem] text-center space-y-6">
                        <HelpCircle className="w-10 h-10 text-blue-400 mx-auto" />
                        <p className="text-[var(--text-muted)] italic text-xs">Protocol metadata missing in backend.</p>
                        <button onClick={() => setExecutingAssessment(false)} className="px-6 py-3 rounded-xl bg-[var(--background)] text-[var(--text-muted)] font-bold text-xs">Cancel</button>
                      </div>
                    )
                  )}
                </div>
              )}

              {currentStep?.type === "CLINICAL" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">Profile Reconnaissance</h2>
                    <p className="text-[var(--text-muted)] text-sm">Audit active diagnoses and therapeutic medications.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-12">
                    <ToastProvider>
                      <ProblemList patientId={params.id as string} />
                      <MedicationRegistry patientId={params.id as string} />
                    </ToastProvider>
                  </div>

                  <div className="pt-6 flex gap-2 border-t border-[var(--border-color,rgba(0,0,0,0.05))]">
                    <button onClick={() => setStep(prevStep.id)} className="flex-1 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-bold text-[9px] hover:text-[var(--foreground)] transition-all uppercase tracking-widest">Back</button>
                    <button onClick={() => setStep(nextStep.id)} className="flex-[2] py-2 rounded-lg bg-[var(--primary)] text-white font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                      Continue to Final SOAP <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {currentStep?.type === "FINISH" && (
                <div className="space-y-12 animate-in fade-in zoom-in duration-500">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">Visit Summary</h2>
                      <p className="text-[var(--text-muted)] text-sm">Review all captured data before final submission.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Vitals Summary */}
                    <div className="p-8 rounded-[2rem] bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] space-y-6">
                      <div className="flex items-center gap-3 border-b border-[var(--border-color,rgba(0,0,0,0.05))] pb-4">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest">Biometric Data</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(vitals).map(([k, v]) => (
                          <div key={k}>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{k}</p>
                            <p className="text-lg font-bold text-[var(--foreground)]">{v || '--'}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assessments Summary */}
                    <div className="p-8 rounded-[2rem] bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] space-y-6">
                      <div className="flex items-center gap-3 border-b border-[var(--border-color,rgba(0,0,0,0.05))] pb-4">
                        <ClipboardList className="w-5 h-5 text-blue-400" />
                        <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest">Assessment Scores</h4>
                      </div>
                      <div className="space-y-4">
                        {Object.entries(assessmentResults).map(([k, v]: [string, any]) => (
                          <div key={k} className="flex items-center justify-between">
                            <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">{k}</p>
                            <p className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 font-black text-sm">
                              {typeof v === 'object' ? (v.score !== undefined ? v.score : 'N/A') : v}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-[var(--foreground)] tracking-tight uppercase">Ready for Finalization</p>
                      <p className="text-[10px] text-[var(--text-muted)] max-w-sm leading-relaxed">Proceeding will sign the clinical note and archive the encounter.</p>
                    </div>
                    <button
                      onClick={() => setStep(steps.find(s => s.type === 'NOTE')?.id || 91)}
                      className="px-8 py-3.5 rounded-xl bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      Sign & Close <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {currentStep?.type === "NOTE" && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">Clinical Documentation</h2>
                    <p className="text-[var(--text-muted)] text-sm">Synthesize encounter findings into a permanent SOAP record.</p>
                  </div>
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        { id: 's', label: 'Subjective', placeholder: 'Patient reports... symptoms, history, concerns.' },
                        { id: 'o', label: 'Objective', placeholder: 'Clinical findings... vitals, physical exam, observations.' },
                        { id: 'a', label: 'Assessment', placeholder: 'Clinical reasoning... diagnosis, status, progress.' },
                        { id: 'p', label: 'Plan', placeholder: 'Care strategy... medications, follow-up, interventions.' },
                      ].map((section) => (
                        <div key={section.id} className="space-y-2">
                          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                            <span className="w-4 h-4 rounded bg-[var(--primary)] text-white flex items-center justify-center text-[9px]">{section.id.toUpperCase()}</span>
                            {section.label}
                          </label>
                          <textarea
                            value={note[section.id as keyof typeof note]}
                            onChange={e => setNote({ ...note, [section.id]: e.target.value })}
                            placeholder={section.placeholder}
                            className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] rounded-xl p-4 text-sm min-h-[120px] focus:border-[var(--primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/20 leading-relaxed text-[var(--foreground)]"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="p-8 bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] rounded-2xl space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Sign with Legal Identity</label>
                        <input value={note.signature} onChange={e => setNote({ ...note, signature: e.target.value })} placeholder="Practitioner Signature" className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] rounded-xl py-4 px-6 text-[var(--foreground)] italic font-serif text-xl focus:border-[var(--primary)]/50 outline-none transition-all" />
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed italic">By finalizing this record, I attest that the clinical data documented reflects the true status of the encounter and the patient's condition.</p>
                    </div>
                  </div>
                  <div className="pt-6 flex gap-2 border-t border-[var(--border-color,rgba(0,0,0,0.05))]">
                    <button onClick={() => setStep(prevStep.id)} className="flex-1 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-bold text-[9px] hover:text-[var(--foreground)] transition-all uppercase tracking-widest">Back</button>
                    <button
                      onClick={handleFinish}
                      disabled={savingNote || !note.signature}
                      className="flex-[2] py-2 rounded-lg bg-[var(--primary)] text-white font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                    >
                      {savingNote ? "Securing..." : "Finalize & Save Encounter"} <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {/* Assessment Selection Modal */}
      {isAssessmentModalOpen && (
        <AssessmentSelectionModal
          isOpen={isAssessmentModalOpen}
          onClose={() => setIsAssessmentModalOpen(false)}
          onSelect={(q: any) => {
            if (!activeAssessments.some(a => a.questionnaireId === q.questionnaireId)) {
              setActiveAssessments([...activeAssessments, q]);
            }
            setIsAssessmentModalOpen(false);
          }}
          selectedIds={activeAssessments.map(a => a.questionnaireId)}
          questionnaires={allQuestionnaires}
          loading={!allQuestionnairesData}
        />
      )}
    </div>
  );
}

function AssessmentSelectionModal({ isOpen, onClose, onSelect, selectedIds, questionnaires, loading }: any) {
  const [search, setSearch] = useState("");

  const filtered = questionnaires.filter((q: any) =>
    q.name.toLowerCase().includes(search.toLowerCase()) ||
    q.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[var(--card-bg)] border border-[var(--border-color,rgba(0,0,0,0.1))] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-[var(--border-color,rgba(0,0,0,0.05))] space-y-5 bg-[var(--background)]/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight">Assessments</h3>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.3em] font-bold mt-1">Select clinical instruments to add to encounter</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search registry by code or description..."
              className="w-full bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] rounded-xl py-3 pl-11 pr-4 text-sm focus:border-[var(--primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-[var(--background)]">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-3 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Syncing Registry...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((q: any) => {
                const isSelected = selectedIds.includes(q.questionnaireId);
                return (
                  <button
                    key={q.questionnaireId}
                    disabled={isSelected}
                    onClick={() => onSelect(q)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group
                      ${isSelected
                        ? 'bg-[var(--primary)]/5 border-[var(--primary)]/20 opacity-60 cursor-not-allowed'
                        : 'bg-[var(--card-bg)] border-[var(--border-color,rgba(0,0,0,0.05))] hover:border-[var(--primary)]/40 hover:shadow-md'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.05))] text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:border-[var(--primary)]/20'}`}>
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold uppercase tracking-tight ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>{q.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1 font-medium">{q.description}</p>
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-[var(--primary)]/10 rounded-full border border-[var(--primary)]/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest">Added</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border border-[var(--border-color,rgba(0,0,0,0.1))] flex items-center justify-center text-[var(--text-muted)] group-hover:border-[var(--primary)]/40 group-hover:text-[var(--primary)] transition-all">
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
