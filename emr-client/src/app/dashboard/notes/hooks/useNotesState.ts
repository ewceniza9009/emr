"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ToastProvider";
import {
  GET_NOTES_DATA,
  GET_PATIENT_CLINICAL_DETAILS,
  START_ENCOUNTER,
  SAVE_NOTE,
  GENERATE_AI_SOAP_DRAFT
} from "../graphql/queries";

export type NoteField = "narrative" | "subjective" | "objective" | "assessment" | "plan";

// Helper function to get caret coordinates inside textarea
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const div = document.createElement("div");
  const style = window.getComputedStyle(element);
  
  const properties = [
    "direction", "boxSizing", "width", "height", "overflowX", "overflowY",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "borderStyle", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize",
    "lineHeight", "fontFamily", "textAlign", "textTransform", "textIndent",
    "textDecoration", "letterSpacing", "wordSpacing"
  ];

  properties.forEach(prop => {
    (div.style as any)[prop] = (style as any)[prop];
  });

  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  
  const borderLeft = parseFloat(style.borderLeftWidth || "0");
  const borderTop = parseFloat(style.borderTopWidth || "0");
  
  div.style.width = `${element.clientWidth}px`;

  div.textContent = element.value.substring(0, position);

  const span = document.createElement("span");
  span.textContent = element.value.substring(position, position + 1) || ".";
  div.appendChild(span);

  document.body.appendChild(div);
  
  const top = span.offsetTop + borderTop - element.scrollTop;
  const left = span.offsetLeft + borderLeft - element.scrollLeft;

  document.body.removeChild(div);
  return { top, left };
}

export function useNotesState() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  
  const { data, loading } = useQuery(GET_NOTES_DATA);
  const [startEncounter] = useMutation(START_ENCOUNTER);
  const [saveNote] = useMutation(SAVE_NOTE);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [narrative, setNarrative] = useState("");
  const [noteFormat, setNoteFormat] = useState<"narrative" | "soap">("soap");
  
  // SOAP State
  const [soapSubjective, setSoapSubjective] = useState("");
  const [soapObjective, setSoapObjective] = useState("");
  const [soapAssessment, setSoapAssessment] = useState("");
  const [soapPlan, setSoapPlan] = useState("");
  const [activeField, setActiveField] = useState<NoteField>("subjective");

  const [showSmartPhrases, setShowSmartPhrases] = useState(false);
  const [phraseFilter, setPhraseFilter] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [lastValue, setLastValue] = useState<string | null>(null);
  const [lastCursor, setLastCursor] = useState<number | null>(null);
  const [showUndoBanner, setShowUndoBanner] = useState(false);
  const [noteCache, setNoteCache] = useState<Record<string, string>>({});
  const [encounterCache, setEncounterCache] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [icdSearch, setIcdSearch] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loadAiDraft] = useLazyQuery(GENERATE_AI_SOAP_DRAFT, {
    fetchPolicy: "network-only"
  });
  
  // Collapsible patients list
  const [expandedPatients, setExpandedPatients] = useState<Record<string, boolean>>({});

  // Refs for each textarea
  const narrativeRef = useRef<HTMLTextAreaElement>(null);
  const subjectiveRef = useRef<HTMLTextAreaElement>(null);
  const objectiveRef = useRef<HTMLTextAreaElement>(null);
  const assessmentRef = useRef<HTMLTextAreaElement>(null);
  const planRef = useRef<HTMLTextAreaElement>(null);

  const appointmentsData = data?.appointments?.items || [];
  const appointments = appointmentsData
    .filter((n: any) =>
      `${n.patient?.firstName} ${n.patient?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.patient?.mrn?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());

  const smartPhrases = data?.smartPhrases || [];
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const selectedNote = appointments.find((a: any) => a.appointmentId === selectedId);

  // Group appointments by patient ID
  const groupedPatients: Record<string, {
    patientId: string;
    firstName: string;
    lastName: string;
    mrn: string;
    notes: any[];
  }> = {};

  appointments.forEach((appt: any) => {
    if (!appt.patient) return;
    const pid = appt.patientId;
    if (!groupedPatients[pid]) {
      groupedPatients[pid] = {
        patientId: pid,
        firstName: appt.patient.firstName,
        lastName: appt.patient.lastName,
        mrn: appt.patient.mrn,
        notes: []
      };
    }
    groupedPatients[pid].notes.push(appt);
  });

  const groupedList = Object.values(groupedPatients);

  // Lazy load patient clinical details for the side-panel
  const [loadClinicalDetails, { data: clinicalDetails, loading: loadingDetails }] = useLazyQuery(
    GET_PATIENT_CLINICAL_DETAILS
  );

  useEffect(() => {
    if (selectedNote?.patientId) {
      loadClinicalDetails({
        variables: { patientId: selectedNote.patientId }
      });
    }
  }, [selectedId, selectedNote, loadClinicalDetails]);

  // Load cache
  useEffect(() => {
    const saved = localStorage.getItem("halcyon_notes_cache");
    if (saved) {
      try {
        setNoteCache(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load notes cache", e);
      }
    }
  }, []);

  // Save cache
  useEffect(() => {
    if (Object.keys(noteCache).length > 0) {
      localStorage.setItem("halcyon_notes_cache", JSON.stringify(noteCache));
      setLastSaved(new Date());
    }
  }, [noteCache]);

  const updateMergedNarrative = (s: string, o: string, a: string, p: string) => {
    const merged = `### SUBJECTIVE\n${s}\n\n### OBJECTIVE\n${o}\n\n### ASSESSMENT\n${a}\n\n### PLAN\n${p}`;
    setNarrative(merged);
    if (selectedId) {
      setNoteCache(prev => ({ ...prev, [selectedId]: merged }));
    }
  };

  // Switch note content
  useEffect(() => {
    if (selectedId) {
      const rawContent = noteCache[selectedId] || "";
      setNarrative(rawContent);

      if (rawContent.includes("### SUBJECTIVE") || rawContent.includes("### OBJECTIVE") || rawContent.includes("### ASSESSMENT") || rawContent.includes("### PLAN")) {
        const s = rawContent.match(/### SUBJECTIVE\n([\s\S]*?)(?=\n\n### OBJECTIVE|\n### OBJECTIVE|$)/i);
        const o = rawContent.match(/### OBJECTIVE\n([\s\S]*?)(?=\n\n### ASSESSMENT|\n### ASSESSMENT|$)/i);
        const a = rawContent.match(/### ASSESSMENT\n([\s\S]*?)(?=\n\n### PLAN|\n### PLAN|$)/i);
        const p = rawContent.match(/### PLAN\n([\s\S]*?)$/i);

        setSoapSubjective(s ? s[1].trim() : "");
        setSoapObjective(o ? o[1].trim() : "");
        setSoapAssessment(a ? a[1].trim() : "");
        setSoapPlan(p ? p[1].trim() : "");
        setNoteFormat("soap");
      } else {
        setNoteFormat("narrative");
        setSoapSubjective("");
        setSoapObjective("");
        setSoapAssessment("");
        setSoapPlan("");
      }
    }
  }, [selectedId, noteCache]);

  useEffect(() => {
    if (appointments.length > 0 && !selectedId) {
      setSelectedId(appointments[0].appointmentId);
    }
  }, [appointments, selectedId]);

  // Auto-expand patient card holding the active note
  useEffect(() => {
    if (selectedNote?.patientId) {
      setExpandedPatients(prev => ({ ...prev, [selectedNote.patientId]: true }));
    }
  }, [selectedNote]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const getActiveRef = () => {
    if (noteFormat === "narrative") return narrativeRef;
    if (activeField === "subjective") return subjectiveRef;
    if (activeField === "objective") return objectiveRef;
    if (activeField === "assessment") return assessmentRef;
    return planRef;
  };

  const getActiveValue = () => {
    if (noteFormat === "narrative") return narrative;
    if (activeField === "subjective") return soapSubjective;
    if (activeField === "objective") return soapObjective;
    if (activeField === "assessment") return soapAssessment;
    return soapPlan;
  };

  const setActiveValue = (val: string) => {
    if (noteFormat === "narrative") {
      setNarrative(val);
      if (selectedId) setNoteCache(prev => ({ ...prev, [selectedId]: val }));
    } else {
      let nextS = soapSubjective;
      let nextO = soapObjective;
      let nextA = soapAssessment;
      let nextP = soapPlan;

      if (activeField === "subjective") { nextS = val; setSoapSubjective(val); }
      else if (activeField === "objective") { nextO = val; setSoapObjective(val); }
      else if (activeField === "assessment") { nextA = val; setSoapAssessment(val); }
      else if (activeField === "plan") { nextP = val; setSoapPlan(val); }

      updateMergedNarrative(nextS, nextO, nextA, nextP);
    }
  };

  const handleUndo = () => {
    if (lastValue === null) return;
    setActiveValue(lastValue);
    const pos = lastCursor ?? 0;
    setLastValue(null);
    setLastCursor(null);
    setShowUndoBanner(false);

    setTimeout(() => {
      const activeRef = getActiveRef();
      if (activeRef.current) {
        activeRef.current.focus();
        activeRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    
    setActiveValue(value);

    if (showUndoBanner) {
      setShowUndoBanner(false);
    }

    const textBeforeCursor = value.slice(0, selectionStart);
    const lastSlashIdx = textBeforeCursor.lastIndexOf("/");

    if (lastSlashIdx !== -1) {
      const segment = textBeforeCursor.slice(lastSlashIdx);
      if (segment.startsWith("/") && !segment.includes(" ")) {
        setShowSmartPhrases(true);
        setPhraseFilter(segment.slice(1).toLowerCase());
        setSelectedIndex(0);

        const activeRef = getActiveRef();
        if (activeRef.current) {
          const coords = getCaretCoordinates(activeRef.current, selectionStart);
          setPopupPosition({
            top: coords.top + 24,
            left: Math.min(coords.left, activeRef.current.clientWidth - 330)
          });
        }
      } else {
        setShowSmartPhrases(false);
      }
    } else {
      setShowSmartPhrases(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (!showSmartPhrases) return;
    const activeRef = getActiveRef();
    if (activeRef.current && activeRef.current === e.currentTarget) {
      const selectionStart = activeRef.current.selectionStart;
      const textBeforeCursor = activeRef.current.value.slice(0, selectionStart);
      const lastSlashIdx = textBeforeCursor.lastIndexOf("/");
      if (lastSlashIdx !== -1) {
        const coords = getCaretCoordinates(activeRef.current, selectionStart);
        setPopupPosition({
          top: coords.top + 24,
          left: Math.min(coords.left, activeRef.current.clientWidth - 330)
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      if (lastValue !== null) {
        e.preventDefault();
        handleUndo();
        return;
      }
    }

    if (!showSmartPhrases) return;

    const filtered = smartPhrases.filter((p: any) => p.shortcut.toLowerCase().includes(phraseFilter));

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (filtered.length > 0) {
        e.preventDefault();
        selectPhrase(filtered[selectedIndex].templateText);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowSmartPhrases(false);
    }
  };

  const selectPhrase = (phrase: string) => {
    const activeRef = getActiveRef();
    if (!activeRef.current) return;

    const value = getActiveValue();
    const cursor = activeRef.current.selectionStart;
    const textBeforeCursor = value.slice(0, cursor);
    const lastSlashIdx = textBeforeCursor.lastIndexOf("/");

    if (lastSlashIdx !== -1) {
      setLastValue(value);
      setLastCursor(cursor);
      setShowUndoBanner(true);

      const newText = value.slice(0, lastSlashIdx) + phrase + value.slice(cursor);
      setActiveValue(newText);

      setTimeout(() => {
        if (activeRef.current) {
          activeRef.current.focus();
          const newPos = lastSlashIdx + phrase.length;
          activeRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
    setShowSmartPhrases(false);
  };

  const handleSave = async (finalize: boolean) => {
    if (!selectedId || !selectedNote) return;

    setIsSyncing(true);
    try {
      let encounterId = encounterCache[selectedId];

      if (!encounterId) {
        const { data: startData } = await startEncounter({
          variables: {
            input: {
              patientId: selectedNote.patientId,
              practitionerId: (session?.user as any)?.practitionerId || "00000000-0000-0000-0000-000000000000",
              appointmentId: selectedId,
              chiefComplaint: "Clinical Documentation Update",
              notes: ""
            }
          }
        });
        encounterId = startData.createClinicalEncounter;
        setEncounterCache(prev => ({ ...prev, [selectedId]: encounterId }));
      }

      await saveNote({
        variables: {
          input: {
            encounterId,
            authorId: (session?.user as any)?.practitionerId || "00000000-0000-0000-0000-000000000000",
            content: narrative,
            signature: finalize ? (session?.user?.name || "Digitally Signed") : null
          }
        }
      });

      showToast(finalize ? "Note Finalized & Locked" : "Progress Note Synced", "success");
      
      if (finalize) {
        selectedNote.status = 'FINISHED';
      }
    } catch (err) {
      showToast("Sync Failed. Check Connection.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedId) return;
    try {
      window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:34732'}/api/clinical/export/encounter/${selectedId}`, '_blank');
    } catch (err) {
      showToast("FAILED TO GENERATE PDF", "error");
    }
  };

  const handleAiAssist = async () => {
    if (!selectedNote?.patientId) return;
    setIsSyncing(true);
    try {
      const { data: aiData } = await loadAiDraft({
        variables: { patientId: selectedNote.patientId }
      });
      if (aiData?.generateAiSoapDraft) {
        const draft = aiData.generateAiSoapDraft;
        setSoapSubjective(draft.subjective || "");
        setSoapObjective(draft.objective || "");
        setSoapAssessment(draft.assessment || "");
        setSoapPlan(draft.plan || "");
        setNoteFormat("soap");
        updateMergedNarrative(
          draft.subjective || "",
          draft.objective || "",
          draft.assessment || "",
          draft.plan || ""
        );
        showToast("AI Charting Draft generated successfully!", "success");

        if (draft.suggestedIcdCodes && draft.suggestedIcdCodes.length > 0) {
          draft.suggestedIcdCodes.forEach((code: string, idx: number) => {
            const desc = draft.suggestedIcdDescriptions[idx] || "Suggested Diagnosis";
            insertDiagnosis({ code, desc });
          });
        }
      }
    } catch (e: any) {
      console.error(e);
      showToast("AI generation failed. Please try again.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const togglePatient = (patientId: string) => {
    setExpandedPatients(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };

  const insertVitals = (v: any) => {
    if (!v) return;
    const vitalsStr = `Vitals recorded at ${new Date(v.recordedAt).toLocaleTimeString()}:\n` +
      `- HR: ${v.heartRate || "--"} bpm | BP: ${v.bloodPressureSystolic || "--"}/${v.bloodPressureDiastolic || "--"} mmHg\n` +
      `- RR: ${v.respiratoryRate || "--"} rpm | SpO2: ${v.oxygenSaturation || "--"}%\n` +
      `- Temp: ${v.temperature || "--"} °F | Wt: ${v.weight || "--"} kg`;

    if (noteFormat === "soap") {
      setSoapObjective(prev => (prev ? prev + "\n" : "") + vitalsStr);
      updateMergedNarrative(soapSubjective, (soapObjective ? soapObjective + "\n" : "") + vitalsStr, soapAssessment, soapPlan);
    } else {
      setNarrative(prev => (prev ? prev + "\n\n" : "") + vitalsStr);
    }
    showToast("Vitals inserted into objective findings", "success");
  };

  const insertMedications = (prescriptions: any[]) => {
    if (!prescriptions || prescriptions.length === 0) return;
    const medsStr = "Active Prescriptions:\n" + prescriptions.map(p => 
      `- ${p.medication?.name || "Unspecified"} ${p.medication?.strength || ""} (Dose: ${p.dose || "--"}, Freq: ${p.frequency || "--"}, Route: ${p.route || "--"})`
    ).join("\n");

    if (noteFormat === "soap") {
      setSoapPlan(prev => (prev ? prev + "\n" : "") + medsStr);
      updateMergedNarrative(soapSubjective, soapObjective, soapAssessment, (soapPlan ? soapPlan + "\n" : "") + medsStr);
    } else {
      setNarrative(prev => (prev ? prev + "\n\n" : "") + medsStr);
    }
    showToast("Medication registry inserted into treatment plan", "success");
  };

  const insertAllergies = (allergies: any[]) => {
    if (!allergies || allergies.length === 0) return;
    const allergiesStr = "Documented Allergies:\n" + allergies.map(a => 
      `- ${a.allergen} (Severity: ${a.severity || "--"}, Rx: ${a.reaction || "None specified"})`
    ).join("\n");

    if (noteFormat === "soap") {
      setSoapSubjective(prev => (prev ? prev + "\n" : "") + allergiesStr);
      updateMergedNarrative((soapSubjective ? soapSubjective + "\n" : "") + allergiesStr, soapObjective, soapAssessment, soapPlan);
    } else {
      setNarrative(prev => (prev ? prev + "\n\n" : "") + allergiesStr);
    }
    showToast("Allergy alerts inserted into subjective narrative", "success");
  };

  const insertDiagnosis = (item: any) => {
    const diagStr = `- ICD-10 ${item.code}: ${item.desc}`;
    if (noteFormat === "soap") {
      setSoapAssessment(prev => (prev ? prev + "\n" : "") + diagStr);
      updateMergedNarrative(soapSubjective, soapObjective, (soapAssessment ? soapAssessment + "\n" : "") + diagStr, soapPlan);
    } else {
      setNarrative(prev => (prev ? prev + "\n\n" : "") + diagStr);
    }
    showToast(`Diagnoses ${item.code} recorded`, "success");
  };

  return {
    // Queries data
    loading,
    smartPhrases,
    selectedId,
    setSelectedId,
    selectedNote,
    groupedList,
    
    // Editor text states
    narrative,
    noteFormat,
    setNoteFormat,
    soapSubjective,
    soapObjective,
    soapAssessment,
    soapPlan,
    activeField,
    setActiveField,
    
    // Actions & Handlers
    handleTextChange,
    handleKeyDown,
    selectPhrase,
    handleSave,
    handleDownload,
    handleAiAssist,
    isSyncing,
    lastSaved,
    
    // Search / Dialog states
    searchTerm,
    setSearchTerm,
    icdSearch,
    setIcdSearch,
    isBookingOpen,
    setIsBookingOpen,
    
    // Collapsible patient list
    expandedPatients,
    togglePatient,

    // Right side helper functions
    clinicalDetails,
    loadingDetails,
    insertVitals,
    insertMedications,
    insertAllergies,
    insertDiagnosis,
    
    // Smart phrase popup state
    showSmartPhrases,
    setShowSmartPhrases,
    phraseFilter,
    selectedIndex,
    setSelectedIndex,
    popupPosition,
    showUndoBanner,
    setShowUndoBanner,
    handleUndo,
    handleScroll,

    // Refs
    refs: {
      narrativeRef,
      subjectiveRef,
      objectiveRef,
      assessmentRef,
      planRef
    }
  };
}
