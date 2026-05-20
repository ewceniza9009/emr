import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ToastProvider";
import { useCommandModal } from "@/components/CommandModalProvider";
import { migrateDirectiveType } from "@/lib/clinical-mappings";
import { Stethoscope, ClipboardList, ShieldCheck, Activity, Pill, CheckCircle2, HeartOff, Wind, Zap, FileText, UserCheck, Droplets } from "lucide-react";

// GraphQL Definitions
export const START_ENCOUNTER = gql`
  mutation StartEncounter($input: CreateClinicalEncounterCommandInput!) {
    createClinicalEncounter(input: $input)
  }
`;

export const SAVE_NOTE = gql`
  mutation SaveNote($input: SaveClinicalNoteCommandInput!) {
    saveClinicalNote(input: $input)
  }
`;

export const LOG_VITALS = gql`
  mutation LogVitals($input: LogVitalSignCommandInput!) {
    logVitalSign(input: $input)
  }
`;

export const ADD_DIRECTIVE = gql`
  mutation AddDirective($input: AddAdvanceDirectiveCommandInput!) {
    addAdvanceDirective(input: $input)
  }
`;

export const LOG_ASSESSMENT_RESPONSE = gql`
  mutation LogAssessmentResponse($input: LogAssessmentResponseCommandInput!) {
    logAssessmentResponse(input: $input)
  }
`;

export const GET_PATIENT_CONTEXT = gql`
  query GetPatientContext($id: UUID!) {
    patientById(patientId: $id) {
      patientId
      firstName
      lastName
      mrn
      dob
      biologicalSex
    }
  }
`;

export const GET_APPOINTMENT_DETAILS = gql`
  query GetAppointmentDetails($id: UUID!) {
    appointment(id: $id) {
      appointmentId
      scheduledStart
      visitType
      modality
      practitioner {
        practitionerId
        firstName
        lastName
      }
      supportingClinicians {
        practitionerId
        firstName
        lastName
        position
      }
      plannedAssessments
    }
  }
`;

export const GET_ALL_QUESTIONNAIRES = gql`
  query GetAllQuestionnaires {
    questionnaires {
      questionnaireId
      name
      description
      assessmentType
    }
    smartPhrases {
      shortcut
      label
      templateText
    }
  }
`;

export interface Step {
  id: number;
  label: string;
  icon: any;
  type: string;
  assessmentId?: string;
  assessmentName?: string;
  questionnaireId?: string;
}

export function useGuidedVisitState() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const appointmentId = searchParams.get("appointmentId");
  const { showToast } = useToast();
  const { confirm, alert } = useCommandModal();

  const patientId = params.id as string;

  // GraphQL Queries
  const { data: patientData, loading: loadingPatient } = useQuery(GET_PATIENT_CONTEXT, {
    variables: { id: patientId }
  });

  const { data: apptData, loading: loadingAppt } = useQuery(GET_APPOINTMENT_DETAILS, {
    variables: { id: appointmentId },
    skip: !appointmentId
  });

  const { data: allQuestionnairesData } = useQuery(GET_ALL_QUESTIONNAIRES);

  // Mutations
  const [startEncounter, { loading: starting }] = useMutation(START_ENCOUNTER);
  const [saveNote, { loading: savingNote }] = useMutation(SAVE_NOTE);
  const [saveVitals] = useMutation(LOG_VITALS);
  const [addDirective] = useMutation(ADD_DIRECTIVE);
  const [logAssessmentResponse] = useMutation(LOG_ASSESSMENT_RESPONSE);

  const patient = patientData?.patientById;
  const appointment = apptData?.appointment;
  const allQuestionnaires = useMemo(() => allQuestionnairesData?.questionnaires || [], [allQuestionnairesData?.questionnaires]);
  const smartPhrases = allQuestionnairesData?.smartPhrases || [];

  // Reactive Workflow States
  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const lastValidIndex = useRef(0);

  const [vitals, setVitals] = useState({ hr: "", sbp: "", dbp: "", rr: "", temp: "", spo2: "" });
  const [directives, setDirectives] = useState<{ type: string, notes: string }[]>([]);
  const [note, setNote] = useState({ s: "", o: "", a: "", p: "", signature: "" });
  const [assessmentResults, setAssessmentResults] = useState<Record<string, any>>({});
  const [activeAssessments, setActiveAssessments] = useState<any[]>([]);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [skippingAssessment, setSkippingAssessment] = useState<{ id: string, name: string } | null>(null);
  const [executingAssessment, setExecutingAssessment] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  const persistenceKey = `halkyone-visit-persist-${patientId}-${appointmentId || 'adhoc'}`;

  // 1. Restore local persistence on mount
  useEffect(() => {
    const saved = localStorage.getItem(persistenceKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.vitals) setVitals(parsed.vitals);
        if (parsed.note) setNote(parsed.note);
        if (parsed.assessmentResults) setAssessmentResults(parsed.assessmentResults);
        if (parsed.encounterId) setEncounterId(parsed.encounterId);
        if (parsed.activeAssessments) setActiveAssessments(parsed.activeAssessments);
        if (parsed.step) setStep(parsed.step);
        if (parsed.maxStepReached) setMaxStepReached(parsed.maxStepReached);

        if (parsed.directives) {
          setDirectives(parsed.directives.map((d: any) => ({
            ...d,
            type: migrateDirectiveType(d.type)
          })));
        }
        console.log("Mission Continuity: Restored session data.");
      } catch (e) {
        console.error("Persistence Restore Failed", e);
      }
    }
    setIsHydrated(true);
  }, [persistenceKey]);

  // 2. Save to persistence on changes
  useEffect(() => {
    if (!isHydrated) return;
    const state = { vitals, directives, note, assessmentResults, encounterId, step, maxStepReached, activeAssessments };
    localStorage.setItem(persistenceKey, JSON.stringify(state));
  }, [vitals, directives, note, assessmentResults, encounterId, step, maxStepReached, activeAssessments, isHydrated, persistenceKey]);

  const clearPersistence = () => localStorage.removeItem(persistenceKey);

  // 3. Sync initial planned assessments from appointment plan
  useEffect(() => {
    if (!isHydrated || activeAssessments.length > 0 || !appointment?.plannedAssessments) return;
    const planned = appointment.plannedAssessments;
    const stubs = planned.map((code: string) => ({
      name: code,
      assessmentType: code,
      isStub: true
    }));
    setActiveAssessments(stubs);
  }, [appointment, isHydrated, activeAssessments.length]);

  // 4. Hydrate stubs from full questionnaire list
  useEffect(() => {
    if (!isHydrated || allQuestionnaires.length === 0 || activeAssessments.length === 0) return;
    const hydrated = activeAssessments.map(a => {
      if (!a.isStub) return a;
      const match = allQuestionnaires.find((q: any) => q.assessmentType === a.assessmentType || q.name === a.name);
      return match ? { ...match, isStub: false, questionnaireId: match.questionnaireId } : a;
    });

    const uniqueMap = new Map();
    hydrated.forEach(a => {
      const id = a.questionnaireId || a.assessmentType;
      uniqueMap.set(id, a);
    });
    const unique = Array.from(uniqueMap.values());

    if (JSON.stringify(unique) !== JSON.stringify(activeAssessments)) {
      setActiveAssessments(unique);
    }
  }, [allQuestionnaires, activeAssessments, isHydrated]);

  // Compute dynamic rail navigator steps
  const steps = useMemo<Step[]>(() => {
    const s: Step[] = [
      { id: 1, label: "Start", icon: Stethoscope, type: "INIT" },
      { id: 2, label: "Plan", icon: ShieldCheck, type: "DIRECTIVES" },
      { id: 3, label: "Vitals", icon: Activity, type: "VITALS" },
    ];

    const getStableId = (item: any) => {
      const seed = item.questionnaireId || item.assessmentType || "unknown";
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      return 1000 + Math.abs(hash % 9000);
    };

    activeAssessments.forEach((p: any) => {
      s.push({
        id: getStableId(p),
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
  }, [activeAssessments, navSearch]);

  // Track max step
  useEffect(() => {
    const idx = steps.findIndex(s => s.id === step);
    if (idx >= 0) {
      lastValidIndex.current = idx;
      if (idx > steps.findIndex(s => s.id === maxStepReached)) {
        setMaxStepReached(step);
      }
    }
  }, [steps, step, maxStepReached]);

  // Handle deleted assessments fallback
  useEffect(() => {
    const stepExists = steps.some(s => s.id === step);
    if (!stepExists && steps.length > 0) {
      const fallbackIndex = Math.min(lastValidIndex.current, steps.length - 1);
      setStep(steps[fallbackIndex].id);
    }
  }, [steps, step]);

  const currentStepIndex = steps.findIndex(s => s.id === step);
  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];
  const prevStep = steps[currentStepIndex - 1];

  const handleStart = async () => {
    const clinicianId = session?.user?.practitionerId || session?.user?.id;

    if (!clinicianId) {
      console.error("Clinical Identity Missing: Encounter initialization aborted.");
      await alert({
        title: "Identity Required",
        message: "Clinician Identity Required: Please ensure you are logged in with a valid practitioner account to start an encounter.",
        type: "danger"
      });
      return;
    }

    try {
      const { data } = await startEncounter({
        variables: {
          input: {
            patientId,
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

      // 2. Save Directives
      for (const d of directives) {
        await addDirective({
          variables: {
            input: {
              patientId,
              type: migrateDirectiveType(d.type),
              notes: d.notes,
              effectiveDate: new Date().toISOString()
            }
          }
        });
      }

      // 2.5. Save Skipped Assessments
      const skippedAssessments = activeAssessments.filter(a => {
        const res = assessmentResults[a.assessmentType];
        return res?.skipped === true;
      });

      for (const a of skippedAssessments) {
        const res = assessmentResults[a.assessmentType];
        await logAssessmentResponse({
          variables: {
            input: {
              questionnaireId: a.questionnaireId,
              patientId,
              encounterId,
              assessorId: session?.user?.practitionerId || session?.user?.id || "00000000-0000-0000-0000-000000000000",
              answersJson: JSON.stringify({ skipped: true, reason: res.reason }),
              totalScore: null
            }
          }
        });
      }

      // 3. Save & Sign SOAP Note
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

      showToast("Clinical encounter finalized successfully", "success");
      router.push(`/dashboard/patients/${patientId}`);
      clearPersistence();
    } catch (err) {
      showToast("Failed to save clinical note. Please try again.", "error");
    }
  };

  return {
    patientId,
    appointmentId,
    patient,
    appointment,
    allQuestionnaires,
    smartPhrases,
    step,
    setStep,
    maxStepReached,
    encounterId,
    setEncounterId,
    isHydrated,
    vitals,
    setVitals,
    directives,
    setDirectives,
    note,
    setNote,
    assessmentResults,
    setAssessmentResults,
    activeAssessments,
    setActiveAssessments,
    isAssessmentModalOpen,
    setIsAssessmentModalOpen,
    skippingAssessment,
    setSkippingAssessment,
    executingAssessment,
    setExecutingAssessment,
    navSearch,
    setNavSearch,
    steps,
    currentStepIndex,
    currentStep,
    nextStep,
    prevStep,
    starting,
    savingNote,
    handleStart,
    handleFinish,
    clearPersistence,
    confirm,
    alert,
    persistenceKey,
    logAssessmentResponse,
    allQuestionnairesData
  };
}
