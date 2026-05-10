"use client";

import React, { useState, useEffect, useMemo } from "react";
import HalcyonPortal from "./Portal";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  X, PhoneCall, CheckCircle2, Calendar, Stethoscope, ChevronRight, ChevronLeft,
  ClipboardCheck, ShieldCheck, Activity, User, MapPin, Users, AlertCircle,
  UserPlus, Hash, Target, Zap, PhoneOff, PhoneForwarded, Trash2, Mic, Wifi,
  Smartphone, BrainCircuit, MessageSquare, Clock, Video, Home, Building2, Timer,
  Search, Plus, History, Check, HeartPulse, HeartHandshake, Shield, Edit3, Car, Navigation,
  Sun, Wind, Info, Fingerprint, FileText, CreditCard, Heart, Thermometer, Briefcase,
  FileCheck, Scale, FileSignature, FolderLock,
  CalendarCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";
import {
  BiologicalSex,
  CareModality,
  EnrollmentDisposition,
  CommunicationAbility,
  TechAccessLevel
} from "@/types/enums";

const GET_LEAD_DETAILS = gql`
  query GetLeadDetails($id: UUID!) {
    outreachById(outreachId: $id) {
      patientOutreachId
      firstName
      lastName
      primaryPhone
      primaryEmail
      referralSource
      techAccess
      barriersToCare
      communicationStatus
      status
      nextFollowUpDate
      isDoNotCall
      isOptedOut
      mailingAddress {
        street
        city
        state
        postalCode
      }
      dateOfBirth
      biologicalSex
      genderIdentity
      language
      civilStatus
      otherContacts {
        outreachContactId
        firstName
        lastName
        relationship
        phoneNumber
        isPrimaryContact
      }
      activities {
        outreachActivityId
        activityDate
        outcome
        method
        reason
        notes
      }
    }
  }
`;

const GET_ENROLLMENT_DATA = gql`
  query GetEnrollmentData {
    healthPlans {
      healthPlanId
      name
    }
    outreachScripts {
      outreachScriptId
      scriptTitle
      content
    }
    practitioners {
      practitionerId
      fullName
      firstName
      lastName
      position
      isCareNavigator
      isSupportingClinician
    }
    facilities {
      facilityId
      name
      type
    }
  }
`;

const LOG_OUTREACH_ACTIVITY = gql`
  mutation LogActivity($input: LogOutreachActivityCommandInput!) {
    logOutreachActivity(input: $input)
  }
`;

const ADD_OUTREACH_CONTACT = gql`
  mutation AddContact($input: AddOutreachContactCommandInput!) {
    addOutreachContact(input: $input)
  }
`;

const REMOVE_OUTREACH_CONTACT = gql`
  mutation RemoveContact($input: RemoveOutreachContactCommandInput!) {
    removeOutreachContact(input: $input)
  }
`;

const UPDATE_OUTREACH_LEAD = gql`
  mutation UpdateLead($input: UpdateOutreachLeadCommandInput!) {
    updateOutreachLead(input: $input)
  }
`;

const SEARCH_DIAGNOSIS_LIBRARY = gql`
  query SearchDiagnosisLibrary($term: String!) {
    searchDiagnosisLibrary(term: $term) {
      icd10Code
      description
    }
  }
`;
const UNENROLL_PATIENT = gql`
  mutation UnenrollPatient($input: UnenrollPatientCommandInput!) {
    unenrollPatient(input: $input)
  }
`;

const SEARCH_PATIENTS = gql`
  query SearchPatients($search: String) {
    patients(search: $search) {
      items {
        patientId
        firstName
        lastName
        dob
        mrn
      }
    }
  }
`;

const FINALIZE_ENROLLMENT = gql`
  mutation FinalizeEnrollment($input: FinalizeEnrollmentCommandInput!) {
    finalizeEnrollment(input: $input)
  }
`;

const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

interface Props {
  open: boolean;
  onClose: () => void;
  outreachId: string | null;
}

type TabType = "OUTREACH" | "ADMIN" | "LEGAL" | "CLINICAL" | "LOGISTICS";

export default function EnrollmentDrawer({ open, onClose, outreachId }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("OUTREACH");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [modality, setModality] = useState<CareModality>(CareModality.HomeCare);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

  // Phase 3 Advanced Scheduling State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [period, setPeriod] = useState<"AM" | "PM" | null>("AM");
  const [duration, setDuration] = useState(45);
  const [visitType, setVisitType] = useState("INITIAL_HOSPICE_INTAKE");
  const [primaryClinicianId, setPrimaryClinicianId] = useState("");
  const [careNavigatorId, setCareNavigatorId] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  // Insurance State (Industry Level)
  const [memberId, setMemberId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [eligibilityStatus, setEligibilityStatus] = useState<"PENDING" | "VERIFIED" | "ERROR">("PENDING");

  // Referral State
  const [referringPhysician, setReferringPhysician] = useState("");
  const [npi, setNpi] = useState("");

  // Clinical State
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState("");
  const [sdohHousing, setSdohHousing] = useState("STABLE");
  const [sdohSupport, setSdohSupport] = useState("ADEQUATE");
  const [acuity, setAcuity] = useState("MODERATE");

  // Address Controlled State
  const [address, setAddress] = useState({
    street: "", city: "", state: "", postalCode: ""
  });

  // Assessment State
  const [disposition, setDisposition] = useState<EnrollmentDisposition>(EnrollmentDisposition.Cooperative);
  const [techAccess, setTechAccess] = useState<TechAccessLevel>(TechAccessLevel.SmartphoneOnly);
  const [cognitive, setCognitive] = useState("Autonomous");

  const [newContact, setNewContact] = useState({
    firstName: "", lastName: "", relationship: "Spouse", phoneNumber: ""
  });
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingDemographics, setIsEditingDemographics] = useState(false);

  // Demographic Capture
  const [patientDob, setPatientDob] = useState("");
  const [patientSex, setPatientSex] = useState<BiologicalSex>(BiologicalSex.UNKNOWN);
  const [genderIdentity, setGenderIdentity] = useState("");
  const [patientLanguage, setPatientLanguage] = useState("English");
  const [civilStatus, setCivilStatus] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // Enterprise Legal & Consent State
  const [consentTreat, setConsentTreat] = useState(false);
  const [consentHIPAA, setConsentHIPAA] = useState(false);
  const [interpreterRequired, setInterpreterRequired] = useState(false);
  const [preferredContact, setPreferredContact] = useState("PHONE");
  const [scheduleIntakeNow, setScheduleIntakeNow] = useState(true);
  const [communicationStatus, setCommunicationStatus] = useState<CommunicationAbility>(CommunicationAbility.Verbal);
  const [duplicateMatch, setDuplicateMatch] = useState<any>(null);
  const [showIcd10Search, setShowIcd10Search] = useState(false);
  const [icd10Results, setIcd10Results] = useState<any[]>([]);
  const [isSearchingIcd10, setIsSearchingIcd10] = useState(false);

  const { refetch: searchIcd10 } = useQuery(SEARCH_DIAGNOSIS_LIBRARY, {
    skip: true,
    variables: { term: primaryDiagnosis }
  });

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (primaryDiagnosis && primaryDiagnosis.length >= 2 && !primaryDiagnosis.includes(" - ")) {
        setIsSearchingIcd10(true);
        try {
          const { data } = await searchIcd10({ term: primaryDiagnosis });
          setIcd10Results(data?.searchDiagnosisLibrary || []);
          setShowIcd10Search(true);
        } catch (err) {
          console.error("Diagnosis search error:", err);
        } finally {
          setIsSearchingIcd10(false);
        }
      } else {
        setIcd10Results([]);
        setShowIcd10Search(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [primaryDiagnosis, searchIcd10]);

  const [legalDocs, setLegalDocs] = useState({
    poa: false,
    advanceDirective: false
  });

  const { data: leadData, loading: leadLoading } = useQuery(GET_LEAD_DETAILS, {
    variables: { id: outreachId },
    skip: !outreachId || !open,
    fetchPolicy: "network-only"
  });

  const lead = leadData?.outreachById;

  useEffect(() => {
    if (lead) {
      if (lead.mailingAddress) {
        setAddress({
          street: lead.mailingAddress.street || "",
          city: lead.mailingAddress.city || "",
          state: lead.mailingAddress.state || "",
          postalCode: lead.mailingAddress.postalCode || ""
        });
      }
      if (lead.dateOfBirth) {
        setPatientDob(lead.dateOfBirth.split('T')[0]);
      }
      if (lead.biologicalSex) {
        setPatientSex(lead.biologicalSex as BiologicalSex);
      }
      if (lead.genderIdentity) {
        setGenderIdentity(lead.genderIdentity);
      }
      if (lead.language) {
        setPatientLanguage(lead.language);
      }
      if (lead.civilStatus) {
        setCivilStatus(lead.civilStatus);
      }
    }
  }, [leadData]);

  const { data: duplicateData } = useQuery(SEARCH_PATIENTS, {
    variables: {
      search: lead?.lastName
    },
    skip: !lead || !open,
    onCompleted: (data) => {
      const match = data?.patients?.items?.find((p: any) => p.patientId !== outreachId);
      if (match) setDuplicateMatch(match);
    }
  });

  const { data: enrollmentData } = useQuery(GET_ENROLLMENT_DATA, { skip: !open });

  const [logActivity] = useMutation(LOG_OUTREACH_ACTIVITY);
  const [updateLead] = useMutation(UPDATE_OUTREACH_LEAD);
  const [unenrollPatient, { loading: unenrolling }] = useMutation(UNENROLL_PATIENT);
  const [addContact, { loading: addingContact }] = useMutation(ADD_OUTREACH_CONTACT);
  const [removeContact] = useMutation(REMOVE_OUTREACH_CONTACT);
  const [finalize, { loading: finalizing }] = useMutation(FINALIZE_ENROLLMENT);
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      setActiveTab("OUTREACH");
      setActiveCall(null);
      setIsAddingContact(false);
      setPrimaryClinicianId("");
      setCareNavigatorId("");
    }
  }, [open, outreachId]);

  const practitioners = enrollmentData?.practitioners || [];
  const scripts = enrollmentData?.outreachScripts || [];
  const activeScript = scripts.find((s: any) => s.outreachScriptId === selectedScriptId) || scripts[0];

  const handleCall = (contact: any) => {
    setActiveCall({ ...contact, status: 'CONNECTING...' });
    setTimeout(() => {
      setActiveCall((prev: any) => prev ? { ...prev, status: 'ON LINE' } : null);
    }, 1500);
  };

  const handleLogActivity = async (outcome: string) => {
    if (!outreachId) return;
    try {
      await logActivity({
        variables: {
          input: {
            outreachId: outreachId,
            method: "TELEPHONE",
            outcome: outcome,
            reason: logNotes,
            notes: `Enrollment outcome recorded: ${outcome}`,
            nextFollowUpDate: followUpDate ? new Date(followUpDate).toISOString() : null
          }
        },
        refetchQueries: ["GetLeadDetails", "GetOutreachLeads"]
      });

      setLogNotes("");
      setFollowUpDate("");

      if (outcome === "CONNECTED") {
        setActiveTab("ADMIN");
      }
    } catch (e) { console.error(e); }
  };

  const handleEditContact = (contact: any) => {
    setNewContact({
      firstName: contact.firstName,
      lastName: contact.lastName,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber
    });
    setEditingContactId(contact.outreachContactId);
    setIsAddingContact(true);
  };

  const handleVerifyAddress = () => {
    setIsVerifyingAddress(true);
    setTimeout(() => {
      setIsVerifyingAddress(false);
    }, 1200);
  };

  const handleUpdateLead = async (fields: any) => {
    try {
      await updateLead({
        variables: {
          input: { patientOutreachId: outreachId, ...fields }
        }
      });
    } catch (e) { console.error(e); }
  };

  const handleAddContact = async () => {
    if (!newContact.firstName || !newContact.phoneNumber) return;
    try {
      if (editingContactId) {
        await removeContact({
          variables: { input: { outreachContactId: editingContactId } }
        });
      }
      await addContact({
        variables: {
          input: { patientOutreachId: outreachId, ...newContact }
        },
        refetchQueries: ["GetLeadDetails"]
      });
      setIsAddingContact(false);
      setEditingContactId(null);
      setNewContact({ firstName: "", lastName: "", relationship: "Family", phoneNumber: "" });
    } catch (e) { console.error(e); }
  };


  const handleRemoveContact = async (id: string) => {
    try {
      await removeContact({
        variables: { input: { outreachContactId: id } },
        refetchQueries: ["GetLeadDetails"]
      });
    } catch (e) { console.error(e); }
  };

  const handleUnenroll = async () => {
    if (!outreachId) return;
    if (!confirm("Are you sure you want to reverse this enrollment? This will deactivate the patient record and close all associated care cases.")) return;

    try {
      await unenrollPatient({
        variables: {
          input: {
            patientOutreachId: outreachId,
            reason: logNotes || "Manual unenrollment"
          }
        },
        refetchQueries: ["GetLeadDetails"]
      });
      showToast("Enrollment reversed successfully", "success");
      setLogNotes("");
    } catch (e) {
      console.error(e);
      showToast("Failed to reverse enrollment", "error");
    }
  };

  const handleFinalize = async () => {
    try {
      const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());

      let orientationIso = new Date().toISOString();
      if (selectedDate) {
        const scheduledDate = new Date(selectedDate);

        // Define modality-aware scheduling configurations
        const modalityConfig: Record<CareModality, { am: number; pm: number }> = {
          [CareModality.HomeCare]: { am: 9, pm: 14 },
          [CareModality.InPatientHospice]: { am: 9, pm: 14 },
          [CareModality.OutpatientClinic]: { am: 9, pm: 14 },
          [CareModality.VirtualCare]: { am: 8, pm: 13 },
          [CareModality.HybridCare]: { am: 8, pm: 13 },
        };

        const config = modalityConfig[modality] || modalityConfig[CareModality.HomeCare];
        const hour = period === "AM" ? config.am : config.pm;

        scheduledDate.setHours(hour, 0, 0, 0);
        if (isValidDate(scheduledDate)) orientationIso = scheduledDate.toISOString();
      }

      const { data } = await finalize({
        variables: {
          input: {
            patientOutreachId: outreachId,
            modality: modality,
            healthPlanId: selectedPlan,
            disposition: disposition,
            communicationStatus: communicationStatus,
            techAccess: techAccess,
            orientationDate: orientationIso,
            primaryClinicianId: primaryClinicianId,
            careNavigatorId: careNavigatorId,
            dateOfBirth: (patientDob && isValidDate(new Date(patientDob))) ? new Date(patientDob).toISOString() : null,
            biologicalSex: patientSex,
            genderIdentity: genderIdentity,
            language: patientLanguage,
            civilStatus: civilStatus,
            consentToTreat: consentTreat,
            consentHIPAA: consentHIPAA,
            consentMarketing: false,
            interpreterRequired: interpreterRequired,
            preferredContactMethod: preferredContact,
            hasPoa: legalDocs.poa,
            hasAdvanceDirective: legalDocs.advanceDirective,
            facilityId: selectedFacilityId || null,
            scheduleIntakeNow: scheduleIntakeNow
          }
        }
      });
      if (data?.finalizeEnrollment) {
        onClose();
        router.push(`/dashboard/patients/${data.finalizeEnrollment}`);
      }
    } catch (e) {
      console.error(e);
      showToast("Enrollment commit failed. Check clinical telemetry.", "error");
    }
  };

  const verifyInsurance = () => {
    setEligibilityStatus("VERIFIED");
    // Mock simulation
  };

  const renderCalendar = () => {
    const days = [];
    const count = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const today = new Date();

    const headers = ["S", "M", "T", "W", "T", "F", "S"];
    const headerRow = headers.map((h, idx) => (
      <div key={`header-${h}-${idx}`} className="h-10 flex items-center justify-center text-[9px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-[0.2em]">{h}</div>
    ));

    for (let i = 0; i < first; i++) days.push(<div key={`empty-${i}`} className="h-12" />);
    for (let d = 1; d <= count; d++) {
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getFullYear() === viewDate.getFullYear();
      const isToday = today.getDate() === d && today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();

      days.push(
        <button
          key={d}
          type="button"
          onClick={() => setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))}
          className={`h-12 w-full rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 relative
            ${isSelected ? "bg-teal-500 text-black shadow-lg shadow-teal-500/30" : "text-[var(--text-primary)] hover:bg-[var(--card-bg)] hover:text-teal-500"}`}
        >
          {d}
          {isToday && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
        </button>
      );
    }
    return [...headerRow, ...days];
  };

  if (!open) return null;

  return (
    <HalcyonPortal>
      <style jsx global>{`
        select option {
          background-color: var(--sidebar-bg, #121212) !important;
          color: var(--text-primary, #e2e8f0) !important;
        }
        select:focus option {
          background-color: var(--card-bg, #1a1a1a) !important;
        }
      `}</style>
      <div className="fixed inset-0 z-[9999999] flex justify-end">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative h-full bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] flex flex-col shadow-2xl transition-all duration-500 ease-in-out w-full max-w-[1100px]`}>

          {/* Enrollment Header - Professional Layout */}
          <div className="h-28 flex items-center justify-between px-10 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)]/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-50" />
                  <HeartPulse className="w-6 h-6 relative z-10" />
                </div>
              </div>
              <div>
                <h2 className="text-[13px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em] leading-none">
                  Enrollment Workstation
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">Patient Enrollment</p>
                  <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                  <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.1em]">{lead?.firstName} {lead?.lastName}</p>
                </div>
              </div>
            </div>

            {/* Progress Stepper Navigation */}
            <div className="flex-1 flex justify-center px-4">
              <div className="flex bg-[var(--input-bg)]/50 rounded-2xl p-2 border border-[var(--card-border)] backdrop-blur-sm shadow-inner">
                {(["OUTREACH", "ADMIN", "LEGAL", "CLINICAL", "LOGISTICS"] as TabType[]).map((tab, idx) => {
                  const isActive = activeTab === tab;
                  const isComplete = (tab === "OUTREACH" && leadData) ||
                    (tab === "ADMIN" && selectedPlan) ||
                    (tab === "LEGAL" && consentTreat && consentHIPAA) ||
                    (tab === "LOGISTICS" && primaryClinicianId);

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`relative px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 group/tab
                      ${isActive ? "bg-[var(--primary)] text-black shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"}`}
                    >
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] transition-all
                      ${isActive ? "border-black/20 bg-black/5" : isComplete ? "bg-teal-500/20 border-teal-500/40 text-teal-500" : "border-[var(--card-border)]"}`}>
                        {isComplete && !isActive ? <Check className="w-2.5 h-2.5" /> : `0${idx + 1}`}
                      </span>
                      {tab}
                      {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-black/40" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center group shrink-0"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Clinical Workspace */}
          <div className="flex-1 flex flex-row overflow-hidden">
            {leadLoading ? (
              <div className="flex-1 flex items-center justify-center"><Activity className="w-5 h-5 text-[var(--primary)] animate-spin opacity-50" /></div>
            ) : !lead ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4 opacity-40">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">Lead Not Found</p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Mission Aborted · Verify Registry ID</p>
              </div>
            ) : (
              <>
                {/* LEFT MAIN PANEL */}
                <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-8 scrollbar-hide border-r border-[var(--card-border)] bg-[var(--sidebar-bg)]">

                  {/* DUPLICATE CONFLICT ALERT */}
                  {duplicateMatch && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex items-center justify-between animate-in zoom-in-95 duration-500 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500">
                          <AlertCircle className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest leading-none">Registry Conflict Detected</p>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1.5 uppercase tracking-tight">
                            Patient already exists with MRN: <span className="text-rose-500/80 font-black">{duplicateMatch.mrn}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/patients/${duplicateMatch.patientId}`)}
                        className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                      >
                        View Existing File
                      </button>
                    </div>
                  )}

                  {activeTab === "OUTREACH" && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {/* Active Call HUD */}
                      {activeCall && (
                        <div className="bg-teal-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-teal-900/40 animate-pulse ring-1 ring-teal-400/50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white"><PhoneForwarded className="w-5 h-5 animate-bounce" /></div>
                            <div><p className="text-white font-black text-[10px] uppercase tracking-widest leading-none">{activeCall.status}</p><p className="text-teal-100 text-[11px] font-bold mt-1.5 opacity-80">{activeCall.phone || activeCall.phoneNumber}</p></div>
                          </div>
                          <button onClick={() => setActiveCall(null)} className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"><PhoneOff className="w-4 h-4" /></button>
                        </div>
                      )}

                      {/* DEMOGRAPHIC IDENTITY HUD */}
                      <div className="bg-[var(--card-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-4 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-[var(--primary-glow)]">
                            {lead.firstName?.[0] || "?"}{lead.lastName?.[0] || "?"}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">{lead.firstName || "Unknown"} {lead.lastName || "Patient"}</h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest opacity-80">{lead.referralSource || "Internal Lead"}</p>
                              <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                {patientDob ? `${new Date(patientDob).toLocaleDateString()} (${Math.floor((new Date().getTime() - new Date(patientDob).getTime()) / 31557600000)}Y)` : "DOB: --"}
                              </p>
                              {(patientSex || genderIdentity) && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                    {patientSex}{genderIdentity ? ` (${genderIdentity})` : ''}
                                  </p>
                                </>
                              )}
                              {patientLanguage && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{patientLanguage}</p>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {lead.isDoNotCall && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Do Not Call
                                </span>
                              )}
                              {lead.isOptedOut && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <X className="w-2.5 h-2.5" /> Marketing Opt-Out
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border
                                    ${lead.status === 'ENROLLED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                                  lead.status === 'REFUSED' || lead.status === 'DO_NOT_CALL' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                                    'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'}`}>
                                Status: {lead.status?.replaceAll('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CALL SCRIPT HUD */}
                        <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-4 shadow-inner">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-[0.2em]">Active Interaction Script</p>
                            <select
                              className="bg-transparent border-none text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest outline-none cursor-pointer [color-scheme:dark]"
                              value={selectedScriptId || ""}
                              onChange={e => setSelectedScriptId(e.target.value)}
                            >
                              {scripts.map((s: any) => <option key={s.outreachScriptId} value={s.outreachScriptId}>{s.scriptTitle}</option>)}
                            </select>
                          </div>
                          <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed italic opacity-80">
                            {activeScript?.content ? activeScript.content.replace("{firstName}", lead.firstName).replace("{lastName}", lead.lastName).replaceAll("deployment", "home visit") : `"Hello ${lead.firstName}, I'm calling from Halcyon Health..."`}
                          </p>
                        </div>
                      </div>

                      {/* COMMUNICATION CHANNELS */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Contact Channels</p>
                          <button onClick={() => setIsAddingContact(!isAddingContact)} className={`text-[9px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1.5 transition-colors ${isAddingContact ? 'text-rose-500' : 'text-[var(--primary)]'}`}>
                            {isAddingContact ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            {isAddingContact ? 'Abort' : 'Add Contact'}
                          </button>
                        </div>

                        {isAddingContact && (
                          <div className="bg-[var(--input-bg)] border border-[var(--primary)]/30 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-2"><input placeholder="First Name" className="bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-lg px-3 py-2 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" value={newContact.firstName} onChange={e => setNewContact({ ...newContact, firstName: e.target.value })} /><input placeholder="Last Name" className="bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-lg px-3 py-2 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" value={newContact.lastName} onChange={e => setNewContact({ ...newContact, lastName: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-2">
                              <select className="bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-lg px-3 py-2 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 [color-scheme:dark]" value={newContact.relationship} onChange={e => setNewContact({ ...newContact, relationship: e.target.value })}>
                                <option value="Spouse">SPOUSE</option>
                                <option value="Child">CHILD</option>
                                <option value="Parent">PARENT</option>
                                <option value="Sibling">SIBLING</option>
                                <option value="Relative">RELATIVE</option>
                                <option value="Friend">FRIEND</option>
                                <option value="Family">FAMILY</option>
                                <option value="Lawyer">LAWYER</option>
                                <option value="LegalRepresentative">LEGAL REPRESENTATIVE</option>
                                <option value="Other">OTHER</option>
                              </select>
                              <input placeholder="Phone" className="bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-lg px-3 py-2 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" value={newContact.phoneNumber} onChange={e => setNewContact({ ...newContact, phoneNumber: e.target.value })} />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setIsAddingContact(false)} className="flex-1 h-8 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] font-bold text-[9px] uppercase tracking-widest rounded-lg">Cancel</button>
                              <button onClick={handleAddContact} disabled={addingContact} className="flex-1 h-8 bg-teal-500 text-black font-bold text-[9px] uppercase tracking-widest rounded-lg shadow-lg">Commit Contact</button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleCall({ phone: lead.primaryPhone })} className="flex items-center justify-between p-4 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/10 hover:bg-[var(--primary)]/10 transition-all group">
                            <div className="flex items-center gap-3"><PhoneCall className="w-4 h-4 text-[var(--primary)]" /><div className="text-left"><p className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-widest leading-none">Primary</p><p className="text-[10px] font-bold text-[var(--text-secondary)] mt-1">{lead.primaryPhone || "No Phone"}</p></div></div>
                          </button>
                          {lead.otherContacts?.map((c: any) => (
                            <div key={c.outreachContactId} className="flex items-center justify-between p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] group">
                              <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[var(--card-bg)] flex items-center justify-center text-[var(--text-muted)]"><User className="w-3.5 h-3.5" /></div><div className="text-left"><p className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-widest leading-none">{c.firstName} {c.lastName}</p><p className="text-[10px] font-bold text-[var(--text-muted)] mt-1">{c.relationship}</p></div></div>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => handleCall(c)} className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center border border-teal-500/20"><PhoneCall className="w-3 h-3" /></button>
                                <button onClick={() => handleEditContact(c)} className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20"><Edit3 className="w-3 h-3" /></button>
                                <button onClick={() => handleRemoveContact(c.outreachContactId)} className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* MISSION RESULT SECTION */}
                      <div className="pt-5 border-t border-[var(--card-border)] space-y-4">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] text-center">Quick Disposition Log</p>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: "CONNECTED", label: "Connected", c: "bg-teal-500/5 border-teal-500/20 text-teal-500/70 hover:bg-teal-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(20,184,166,0.4)]" },
                            { id: "NO_ANSWER", label: "No Answer", c: "hover:text-amber-500" },
                            { id: "VOICEMAIL", label: "Voicemail", c: "hover:text-amber-500" },
                            { id: "BUSY", label: "Busy", c: "hover:text-amber-500" },
                            { id: "WRONG_NUMBER", label: "Wrong #", c: "hover:text-rose-500" },
                            { id: "DISCONNECTED", label: "Disconnected", c: "hover:text-rose-500" },
                            { id: "DNC", label: "Do Not Call", c: "hover:text-rose-600" },
                            { id: "OPT_OUT", label: "Opt Out", c: "hover:text-rose-700" },
                            { id: "CALL_BACK", label: "Call Back", c: "hover:text-[var(--primary)]" }
                          ].map(btn => (
                            <button key={btn.id} onClick={() => handleLogActivity(btn.id)} className={`h-11 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest transition-all active:scale-95 hover:bg-[var(--card-bg)] hover:border-[var(--primary)]/30 ${btn.c}`}>
                              {btn.label}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Interaction Notes / Reason</label>
                            <input
                              value={logNotes}
                              onChange={e => setLogNotes(e.target.value)}
                              placeholder="Specific reason for disposition..."
                              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Next Follow-Up (Due Date)</label>
                            <input
                              type="date"
                              value={followUpDate}
                              onChange={e => setFollowUpDate(e.target.value)}
                              onClick={(e) => e.currentTarget.showPicker()}
                              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "LEGAL" && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      {/* LEGAL DOCUMENT VAULT */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <FolderLock className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Legal Document Vault</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: "hipaa", label: "HIPAA Notice", sub: "Privacy practices tagged", state: consentHIPAA, set: setConsentHIPAA, icon: <ShieldCheck className="w-4 h-4" /> },
                            { id: "poa", label: "Power of Attorney", sub: "Legal representative verified", state: legalDocs.poa, set: (v: boolean) => setLegalDocs(p => ({ ...p, poa: v })), icon: <Scale className="w-4 h-4" /> },
                            { id: "treat", label: "Consent to Treat", sub: "Clinical authorization tagged", state: consentTreat, set: setConsentTreat, icon: <Heart className="w-4 h-4" /> },
                            { id: "adv", label: "Advance Directive", sub: "Living will / Proxy verified", state: legalDocs.advanceDirective, set: (v: boolean) => setLegalDocs(p => ({ ...p, advanceDirective: v })), icon: <FileSignature className="w-4 h-4" /> }
                          ].map(c => (
                            <button key={c.id} onClick={() => c.set(!c.state)} className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 group relative overflow-hidden
                              ${c.state ? 'bg-teal-500/10 border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.1)]' : 'bg-[var(--input-bg)] border-[var(--card-border)] opacity-60 hover:opacity-100'}`}>
                              <div className="flex items-center justify-between">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                  ${c.state ? 'bg-teal-500 text-black' : 'bg-[var(--card-bg)] text-[var(--text-muted)]'}`}>
                                  {c.icon}
                                </div>
                                {c.state && <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />}
                              </div>
                              <div className="text-left">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${c.state ? 'text-teal-500' : 'text-[var(--text-primary)]'}`}>{c.label}</p>
                                <p className="text-[8px] font-bold text-[var(--text-muted)] mt-0.5 uppercase tracking-tight">{c.sub}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* COMMUNICATION PREFERENCES */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Communication Modality</h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Preferred Method</label>
                              <select className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] [color-scheme:dark]" value={preferredContact} onChange={e => setPreferredContact(e.target.value)}>
                                <option value="PHONE">TELEPHONE</option>
                                <option value="SMS">SMS / TEXT</option>
                                <option value="EMAIL">ELECTRONIC MAIL</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Language Modality</label>
                              <button onClick={() => setInterpreterRequired(!interpreterRequired)} className={`w-full h-[41px] rounded-xl flex items-center justify-center border text-[9px] font-black uppercase tracking-widest transition-all
                                ${interpreterRequired ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]'}`}>
                                {interpreterRequired ? "INTERPRETER REQUIRED" : "NO INTERPRETER"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === "ADMIN" && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      {/* Patient Demographics */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Patient Demographics</h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner relative group/demo">
                          {!isEditingDemographics ? (
                            <div className="space-y-6">
                              <div className="flex items-start justify-between">
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 flex-1">
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Date of Birth</p>
                                    <p className="text-[10px] font-black text-[var(--text-primary)]">{patientDob || "NOT SPECIFIED"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Biological Sex</p>
                                    <p className="text-[10px] font-black text-[var(--text-primary)]">{patientSex || "NOT SPECIFIED"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Gender Identity</p>
                                    <p className="text-[10px] font-black text-[var(--text-primary)]">{genderIdentity || "NOT SPECIFIED"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Primary Language</p>
                                    <p className="text-[10px] font-black text-[var(--text-primary)]">{patientLanguage || "NOT SPECIFIED"}</p>
                                  </div>
                                </div>
                                <button onClick={() => setIsEditingDemographics(true)} className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--primary)] opacity-0 group-hover/demo:opacity-100 transition-all">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="pt-4 border-t border-[var(--card-border)]/50">
                                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Civil Status</p>
                                <p className="text-[10px] font-black text-[var(--text-primary)]">{civilStatus || "NOT SPECIFIED"}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-5 animate-in fade-in duration-300">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Date of Birth</label>
                                  <input type="date" value={patientDob} onChange={e => setPatientDob(e.target.value)} onClick={(e) => e.currentTarget.showPicker()} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Biological Sex</label>
                                  <select value={patientSex} onChange={e => setPatientSex(e.target.value as BiologicalSex)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none">
                                    <option value={BiologicalSex.UNKNOWN}>Select...</option>
                                    <option value={BiologicalSex.MALE}>Male</option>
                                    <option value={BiologicalSex.FEMALE}>Female</option>
                                    <option value={BiologicalSex.OTHER}>Other</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Gender Identity</label>
                                  <input type="text" value={genderIdentity} onChange={e => setGenderIdentity(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="Identity..." />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Primary Language</label>
                                  <input type="text" value={patientLanguage} onChange={e => setPatientLanguage(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="Language..." />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Marital / Civil Status</label>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Clinical Facility / Location</label>
                                  <div className="relative group/facility">
                                    <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/facility:text-[var(--primary)] transition-colors" />
                                    <select
                                      value={selectedFacilityId}
                                      onChange={e => setSelectedFacilityId(e.target.value)}
                                      className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-10 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/40 transition-all appearance-none"
                                    >
                                      <option value="">PRIVATE RESIDENCE / HOME CARE</option>
                                      {(enrollmentData?.facilities || []).map((f: any) => (
                                        <option key={f.facilityId} value={f.facilityId}>{f.name} ({f.type})</option>
                                      ))}
                                    </select>
                                    <ChevronRight className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] rotate-90 pointer-events-none" />
                                  </div>
                                </div>
                                <select value={civilStatus} onChange={e => setCivilStatus(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none">
                                  <option value="">Select...</option>
                                  <option value="Single">Single</option>
                                  <option value="Married">Married</option>
                                  <option value="Divorced">Divorced</option>
                                  <option value="Widowed">Widowed</option>
                                  <option value="Common Law">Common Law</option>
                                </select>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <button onClick={() => setIsEditingDemographics(false)} className="flex-1 h-9 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] font-bold text-[9px] uppercase tracking-widest rounded-xl">Discard</button>
                                <button onClick={() => setIsEditingDemographics(false)} className="flex-1 h-9 bg-teal-500 text-black font-bold text-[9px] uppercase tracking-widest rounded-xl">Update Identity</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                      {/* Address Management HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Deployment Destination</h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner relative group/address">
                          {!isEditingAddress ? (
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider">{address.street || "NO STREET SPECIFIED"}</p>
                                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{address.city}, {address.state} {address.postalCode}</p>
                                </div>
                                <button onClick={() => setIsEditingAddress(true)} className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--primary)] opacity-0 group-hover/address:opacity-100 transition-all">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                              <button onClick={handleVerifyAddress} className="w-full h-10 bg-transparent border border-[var(--primary)]/30 text-[var(--primary)] font-black text-[9px] uppercase tracking-[0.2em] rounded-xl hover:bg-[var(--primary)]/5 transition-all">
                                {isVerifyingAddress ? "SCRUBBING GEODATA..." : "Verify & Standardize Address"}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-5 animate-in fade-in duration-300">
                              <div className="space-y-1.5">
                                <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Street Address</label>
                                <input type="text" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="Street..." />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">City / Region</label>
                                  <input type="text" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="City..." />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Postal Code</label>
                                  <input type="text" value={address.postalCode} onChange={e => setAddress({ ...address, postalCode: e.target.value })} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="Zip..." />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setIsEditingAddress(false)} className="flex-1 h-9 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] font-bold text-[9px] uppercase tracking-widest rounded-xl">Discard</button>
                                <button onClick={() => setIsEditingAddress(false)} className="flex-1 h-9 bg-teal-500 text-black font-bold text-[9px] uppercase tracking-widest rounded-xl">Commit Change</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Insurance Vault */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Financial Coverage Vault</h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Health Plan Assignment</label>
                              <select className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 [color-scheme:dark]" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
                                <option value="">Select Plan...</option>
                                {enrollmentData?.healthPlans?.map((p: any) => <option key={p.healthPlanId} value={p.healthPlanId}>{p.name}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Eligibility Status</label>
                              <div className={`w-full h-[41px] rounded-xl flex items-center justify-center border text-[9px] font-black uppercase tracking-widest
                                    ${eligibilityStatus === 'VERIFIED' ? 'bg-teal-500/10 border-teal-500/30 text-teal-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                                {eligibilityStatus}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Member ID</label>
                              <input type="text" value={memberId} onChange={e => setMemberId(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="ID..." />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Next Follow-Up (Due Date)</label>
                              <div className="relative group/date">
                                <Calendar className="w-3.5 h-3.5 absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover/date:text-[var(--primary)] transition-colors pointer-events-none" />
                                <input
                                  type="date"
                                  value={followUpDate}
                                  onChange={e => setFollowUpDate(e.target.value)}
                                  onClick={(e) => e.currentTarget.showPicker()}
                                  className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Communication Status</label>
                              <select value={communicationStatus} onChange={e => setCommunicationStatus(e.target.value as CommunicationAbility)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none">
                                <option value="Verbal">Verbal</option>
                                <option value="NonVerbal">Non-Verbal</option>
                                <option value="Aphasic">Aphasic</option>
                                <option value="SpeechImpaired">Speech Impaired</option>
                                <option value="CognitiveImpairment">Cognitive Impairment</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Group Number</label>

                              <input type="text" value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="GROUP..." />
                            </div>
                          </div>
                          <button onClick={verifyInsurance} className="w-full h-10 bg-[var(--primary)] text-black font-black text-[9px] uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-[var(--primary-glow)] active:scale-95 transition-all">Verify Eligibility Status</button>
                        </div>
                      </section>

                      {/* Referral HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Referral source details</h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-6 border border-[var(--card-border)] space-y-6 shadow-inner">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Referring Physician / Facility</label>
                            <div className="relative group/doc">
                              <Stethoscope className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/doc:text-[var(--primary)] transition-colors" />
                              <input
                                type="text"
                                value={referringPhysician}
                                onChange={e => setReferringPhysician(e.target.value)}
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl py-3.5 pl-11 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all"
                                placeholder="ENTER PRACTITIONER NAME..."
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">NPI Number (Registry ID)</label>
                              <div className="relative group/npi">
                                <Fingerprint className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/npi:text-[var(--primary)] transition-colors" />
                                <input
                                  type="text"
                                  value={npi}
                                  onChange={e => setNpi(e.target.value)}
                                  className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-11 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all"
                                  placeholder="10-DIGIT IDENTIFIER..."
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Referral Receipt Date</label>
                              <div className="relative group/date">
                                <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover/date:text-[var(--primary)] transition-colors pointer-events-none" />
                                <input
                                  type="date"
                                  onClick={(e) => e.currentTarget.showPicker()}
                                  className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-11 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all appearance-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === "CLINICAL" && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      {/* Clinical Intake HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <HeartPulse className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Clinical Intake Triage</h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-6 border border-[var(--card-border)] space-y-6 shadow-inner">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Primary Diagnosis (ICD-10 Search)</label>
                            <div className="relative group/icd10">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/icd10:text-[var(--primary)] transition-colors" />
                              <input
                                type="text"
                                value={primaryDiagnosis}
                                onChange={e => setPrimaryDiagnosis(e.target.value)}
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-10 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/40 transition-all"
                                placeholder="Search codes (e.g. I50.9)..."
                              />
                              {isSearchingIcd10 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}

                              {showIcd10Search && icd10Results.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                  {icd10Results.map((res: any, idx: number) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setPrimaryDiagnosis(`${res.icd10Code} - ${res.description}`);
                                        setShowIcd10Search(false);
                                      }}
                                      className="w-full px-4 py-3 text-left hover:bg-[var(--primary)]/10 transition-colors border-b border-[var(--card-border)] last:border-0 group/item"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-[var(--primary)]">{res.icd10Code}</span>
                                        <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover/item:opacity-100 transition-all" />
                                      </div>
                                      <p className="text-[9px] font-bold text-[var(--text-primary)] mt-1 line-clamp-1">{res.description}</p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {["LOW", "MODERATE", "HIGH"].map(v => (
                              <button key={v} onClick={() => setAcuity(v)} className={`h-10 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all
                                    ${acuity === v ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]'}`}>
                                {v} ACUITY
                              </button>
                            ))}
                          </div>
                        </div>
                      </section>

                      {/* SDoH HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <HeartHandshake className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Social Determinants (SDoH)</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Housing Stability</label>
                            <div className="space-y-1.5">
                              {["STABLE", "AT_RISK", "UNSTABLE"].map(v => (
                                <button key={v} onClick={() => setSdohHousing(v)} className={`w-full h-8 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${sdohHousing === v ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--input-bg)]'}`}>{v.replace('_', ' ')}</button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Social Support</label>
                            <div className="space-y-1.5">
                              {["ADEQUATE", "LIMITED", "NONE"].map(v => (
                                <button key={v} onClick={() => setSdohSupport(v)} className={`w-full h-8 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${sdohSupport === v ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--input-bg)]'}`}>{v}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === "LOGISTICS" && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      {/* 01: VISIT MODALITY */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center font-black">01</span>
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Visit Modality</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-2.5">
                          {[
                            { id: "HomeCare", label: "Home Visit", icon: <Home className="w-4 h-4" /> },
                            { id: "InPatientHospice", label: "Facility", icon: <Building2 className="w-4 h-4" /> },
                            { id: "VirtualCare", label: "Video Call", icon: <Video className="w-4 h-4" /> },
                            { id: "HybridCare", label: "Audio Only", icon: <PhoneCall className="w-4 h-4" /> },
                          ].map((m) => (
                            <button key={m.id} onClick={() => setModality(m.id as CareModality)} className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-2xl border text-[9px] font-bold transition-all
                                     ${modality === m.id ? "bg-[var(--primary)] border-transparent text-black shadow-lg shadow-[var(--primary-glow)]" : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)]"}`}>
                              {m.icon}
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* 02: CLINICAL TEAM ASSIGNMENT */}
                      <section className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center font-black">02</span>
                            <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Clinical Team assignment</h3>
                          </div>
                          <div className="relative group">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input placeholder="Filter Practitioners..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full py-1.5 pl-9 pr-4 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/40 w-32 focus:w-48 transition-all" />
                          </div>
                        </div>

                        <div className="space-y-5">
                          {/* Care Navigator Selection */}
                          <div>
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 px-1">02-A • Care Navigator Assignment</p>
                            <div className="grid grid-cols-3 gap-2">
                              {practitioners
                                .filter((p: any) => p.isCareNavigator && (!staffSearch || p.fullName.toLowerCase().includes(staffSearch.toLowerCase())))
                                .slice(0, 3)
                                .map((p: any) => (
                                  <button key={p.practitionerId} onClick={() => setCareNavigatorId(p.practitionerId)} className={`p-3 rounded-xl border text-left transition-all group relative overflow-hidden ${careNavigatorId === p.practitionerId ? 'bg-teal-500/10 border-teal-500 shadow-sm' : 'bg-[var(--input-bg)] border-[var(--card-border)] hover:border-teal-500/30'}`}>
                                    <p className={`text-[10px] font-black truncate leading-none ${careNavigatorId === p.practitionerId ? 'text-teal-500' : 'text-[var(--text-primary)]'}`}>{p.fullName}</p>
                                    <p className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1.5 opacity-60">Patient Navigation</p>
                                  </button>
                                ))}
                            </div>
                          </div>

                          {/* Primary Lead Selection */}
                          <div>
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 px-1">02-B • Primary Clinician Lead</p>
                            <div className="grid grid-cols-3 gap-2">
                              {practitioners
                                .filter((p: any) => p.isSupportingClinician && (!staffSearch || p.fullName.toLowerCase().includes(staffSearch.toLowerCase())))
                                .slice(0, 3)
                                .map((p: any) => (
                                  <button key={p.practitionerId} onClick={() => setPrimaryClinicianId(p.practitionerId)} className={`p-3 rounded-xl border text-left transition-all group relative overflow-hidden ${primaryClinicianId === p.practitionerId ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm' : 'bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/30'}`}>
                                    <p className={`text-[10px] font-black truncate leading-none ${primaryClinicianId === p.practitionerId ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>{p.fullName}</p>
                                    <p className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1.5 opacity-60">Lead Practitioner</p>
                                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[var(--card-border)] opacity-60">
                                      <Car className="w-2 h-2" /><span className="text-[7px] font-bold uppercase tracking-tighter">20m • 2.6mi</span>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}
                </div>

                {/* RIGHT TELEMETRY PANEL */}
                <div className="w-[380px] flex flex-col bg-[var(--sidebar-bg)] p-6 space-y-6 overflow-y-auto scrollbar-hide">

                  {/* TOP METRICS (2-COLUMN) - Luxury Upgrade */}
                  <div className="grid grid-cols-2 gap-5 pb-8 border-b border-[var(--card-border)] shrink-0 relative">
                    <div className="absolute -bottom-px left-0 w-1/2 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

                    <div className="space-y-2 group/metric">
                      <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] group-hover/metric:text-teal-500 transition-colors">
                        <Navigation className="w-3.5 h-3.5" />
                        Travel Distance
                      </div>
                      <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">2.6<span className="text-xs font-bold opacity-30 ml-1.5 tracking-widest">MI</span></p>
                    </div>

                    <div className="space-y-2 group/metric">
                      <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] group-hover/metric:text-teal-500 transition-colors">
                        <Timer className="w-3.5 h-3.5" />
                        Duration
                      </div>
                      <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">20<span className="text-xs font-bold opacity-30 ml-1.5 tracking-widest">MIN</span></p>
                    </div>
                  </div>

                  {/* LOCATION DETAILS (FULL WIDTH) */}
                  <div className="bg-[var(--input-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-inner">
                    <h3 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><MapPin className="w-3 h-3" /> Location Details</h3>
                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight leading-relaxed">
                      {lead.mailingAddress?.street}<br />
                      <span className="opacity-60">{lead.mailingAddress?.city}, {lead.mailingAddress?.state} {lead.mailingAddress?.postalCode}</span>
                    </p>
                  </div>

                  {/* SCHEDULING STRATEGY TOGGLE */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Scheduling Strategy</p>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${scheduleIntakeNow ? 'bg-teal-500/10 border-teal-500/30 text-teal-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                        {scheduleIntakeNow ? "Instant Intake" : "Schedule Later"}
                      </span>
                    </div>

                    <div className="flex bg-[var(--input-bg)] rounded-2xl p-1.5 border border-[var(--card-border)] shadow-inner">
                      <button
                        onClick={() => setScheduleIntakeNow(true)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                          ${scheduleIntakeNow ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        Book Now
                      </button>
                      <button
                        onClick={() => setScheduleIntakeNow(false)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                          ${!scheduleIntakeNow ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Later
                      </button>
                    </div>
                  </div>

                  {/* SCHEDULING ENGINE (FULL WIDTH) */}
                  <div className="space-y-4">
                    <div className="bg-[var(--input-bg)]/30 rounded-[2.5rem] border border-[var(--card-border)] p-6 space-y-5 shadow-inner backdrop-blur-sm relative overflow-hidden group/cal">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                      <div className="flex items-center justify-between px-2 relative z-10">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em]">{monthNames[viewDate.getMonth()]}</span>
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">{viewDate.getFullYear()}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] transition-all text-[var(--text-muted)] hover:text-[var(--primary)]"><ChevronLeft className="w-4 h-4" /></button>
                          <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="w-9 h-9 flex items-center justify-center hover:bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] transition-all text-[var(--text-muted)] hover:text-[var(--primary)]"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 relative z-10">{renderCalendar()}</div>
                    </div>

                    <div className="flex bg-[var(--input-bg)]/50 rounded-2xl p-2 border border-[var(--card-border)] gap-2 shadow-inner">
                      {(["AM", "PM"] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`flex-1 py-4 rounded-xl text-[11px] font-black tracking-[0.3em] transition-all uppercase flex items-center justify-center gap-3
                            ${period === p ? "bg-teal-500 text-black shadow-[0_0_25px_rgba(20,184,166,0.3)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"}`}
                        >
                          {p === "AM" ? <Sun className="w-4 h-4" /> : <Wind className="w-4 h-4" />}
                          {p === "AM" ? "Morning" : "Afternoon"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ENGAGEMENT TIMELINE - Layout Refinement */}
                  <div className="flex-1 space-y-5 overflow-hidden flex flex-col pt-6 border-t border-[var(--card-border)] relative">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--primary)]/10 to-transparent" />

                    <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                      <div className="w-6 h-6 rounded-lg bg-[var(--primary)]/5 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/10">
                        <History className="w-3.5 h-3.5" />
                      </div>
                      Interaction History
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-3 space-y-6 scrollbar-hide">
                      {lead.activities?.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--card-border)] flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Activity Logged</p>
                        </div>
                      ) : lead.activities.map((a: any) => (
                        <div key={a.outreachActivityId} className="flex gap-4 group/item">
                          <div className="flex flex-col items-center pt-1.5">
                            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${a.outcome === 'CONNECTED' ? 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.6)]' : 'bg-[var(--card-border)] group-hover/item:bg-[var(--text-muted)]'}`} />
                            <div className="w-px flex-1 bg-gradient-to-b from-[var(--card-border)] to-transparent my-2" />
                          </div>
                          <div className="pb-5 border-b border-[var(--card-border)]/30 flex-1 group-hover/item:border-[var(--primary)]/20 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <p className={`text-[10px] font-black uppercase tracking-widest ${a.outcome === 'CONNECTED' ? 'text-teal-500' : 'text-[var(--text-primary)]'}`}>{a.outcome.replace('_', ' ')}</p>
                              <p className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-0.5 rounded-md border border-[var(--card-border)]">{new Date(a.activityDate).toLocaleDateString()}</p>
                            </div>
                            {a.reason && (
                              <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.1em] mb-1.5">{a.reason}</p>
                            )}
                            <div className="relative">
                              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic opacity-80 pl-3 border-l-2 border-[var(--card-border)]">
                                {a.notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="pt-6 border-t border-[var(--card-border)] space-y-4 shrink-0 relative">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />

                    {/* ENROLLMENT SUMMARY */}
                    {lead?.status !== 'ENROLLED' && (
                      <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4 text-teal-500" />
                          <p className="text-[9px] font-black text-teal-500 uppercase tracking-widest">Enrollment Orchestration</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest opacity-60">
                            <span>Clinical Tasks</span>
                            <span className="text-teal-500">+ 3 Initial</span>
                          </div>
                          <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest opacity-60">
                            <span>Care Management Case</span>
                            <span className="text-teal-500">Scheduled</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {lead?.status === 'ENROLLED' ? (
                      <button
                        onClick={handleUnenroll}
                        disabled={unenrolling}
                        className="w-full h-14 bg-rose-500 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.4em] shadow-xl shadow-rose-500/20 hover:bg-rose-600 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 group"
                      >
                        <Trash2 className="w-4 h-4 group-hover:shake" />
                        {unenrolling ? "REVERSING..." : "REVERSE ENROLLMENT"}
                      </button>
                    ) : (
                      <button
                        onClick={handleFinalize}
                        disabled={finalizing || !primaryClinicianId || !selectedPlan || !consentTreat || !consentHIPAA || !patientDob}
                        className="w-full h-14 bg-gradient-to-r from-[var(--primary)] to-teal-500 rounded-2xl text-black font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-[var(--primary-glow)] hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 group overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <ShieldCheck className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">{finalizing ? "ENROLLING..." : "COMMIT ENROLLMENT"}</span>
                      </button>
                    )}
                    <div className="flex flex-col items-center gap-1.5 opacity-40">
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Halcyon OS · System ID 09-E</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-teal-500" />
                        <div className="w-1 h-1 rounded-full bg-teal-500/50" />
                        <div className="w-1 h-1 rounded-full bg-teal-500/20" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}


