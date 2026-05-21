"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useToast } from "../../ToastProvider";
import { useSettings } from "@/lib/SettingsContext";
import { fromZonedTime } from "date-fns-tz";
import {
  BiologicalSex,
  CareModality,
  EnrollmentDisposition,
  CommunicationAbility,
  TechAccessLevel,
} from "@/types/enums";
import { TabType, TABS } from "../types";
import { formatPhoneNumber } from "../utils";
import {
  GET_LEAD_DETAILS,
  GET_ENROLLMENT_DATA,
  LOG_OUTREACH_ACTIVITY,
  ADD_OUTREACH_CONTACT,
  REMOVE_OUTREACH_CONTACT,
  UPDATE_OUTREACH_CONTACT,
  UPDATE_OUTREACH_LEAD,
  SEARCH_DIAGNOSIS_LIBRARY,
  UNENROLL_PATIENT,
  SEARCH_PATIENTS,
  FINALIZE_ENROLLMENT,
  GET_GEOSPATIAL_AVAILABILITY,
} from "../queries";

export function useEnrollmentState(outreachId: string | null, open: boolean) {
  const router = useRouter();
  const { tenantConfig } = useSettings();
  const { showToast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("OUTREACH");

  // Plan / Facility / Modality
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [modality, setModality] = useState<CareModality>(CareModality.HomeCare);

  // Call state
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

  // Phase 3 Advanced Scheduling State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [period, setPeriod] = useState<"AM" | "PM" | null>("AM");
  const [duration, setDuration] = useState(45);
  const [visitType, setVisitType] = useState("INITIAL_HOSPICE_INTAKE");
  const [supportingClinicianIds, setSupportingClinicianIds] = useState<string[]>([]);
  const [careNavigatorId, setCareNavigatorId] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  // Debounced Scheduling State to prevent excessive geospatial lookups
  const [debouncedDate, setDebouncedDate] = useState(selectedDate);
  const [debouncedPeriod, setDebouncedPeriod] = useState(period);
  const [debouncedDuration, setDebouncedDuration] = useState(duration);
  const [debouncedModality, setDebouncedModality] = useState(modality);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDate(selectedDate);
      setDebouncedPeriod(period);
      setDebouncedDuration(duration);
      setDebouncedModality(modality);
    }, 300);
    return () => clearTimeout(handler);
  }, [selectedDate, period, duration, modality]);

  // Insurance State
  const [memberId, setMemberId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [eligibilityStatus, setEligibilityStatus] = useState<"PENDING" | "VERIFIED" | "ERROR">("PENDING");
  const [isVerifyingInsurance, setIsVerifyingInsurance] = useState(false);
  const [insuranceRef, setInsuranceRef] = useState("");

  // Referral State
  const [referringPhysician, setReferringPhysician] = useState("");
  const [npi, setNpi] = useState("");

  // Clinical State
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState("");
  const [sdohHousing, setSdohHousing] = useState("STABLE");
  const [sdohSupport, setSdohSupport] = useState("ADEQUATE");
  const [acuity, setAcuity] = useState("MODERATE");

  // Address Controlled State
  const [address, setAddress] = useState({ street: "", city: "", state: "", postalCode: "", region: "", country: "Philippines", latitude: null as number | null, longitude: null as number | null });

  // Assessment State
  const [disposition, setDisposition] = useState<EnrollmentDisposition>(EnrollmentDisposition.Cooperative);
  const [techAccess, setTechAccess] = useState<TechAccessLevel>(TechAccessLevel.SmartphoneOnly);
  const [cognitive, setCognitive] = useState("Autonomous");

  const [newContact, setNewContact] = useState({
    firstName: "", lastName: "", relationship: "Spouse", phoneNumber: "", email: "",
  });
  const [isAddingRelative, setIsAddingRelative] = useState(false);
  const [isAddingProxy, setIsAddingProxy] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingDemographics, setIsEditingDemographics] = useState(false);

  // Demographic Capture
  const [patientDob, setPatientDob] = useState("");
  const [patientSex, setPatientSex] = useState<BiologicalSex>(BiologicalSex.Unknown);
  const [genderIdentity, setGenderIdentity] = useState("");
  const [patientLanguage, setPatientLanguage] = useState("English");
  const [civilStatus, setCivilStatus] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [pendingOutcome, setPendingOutcome] = useState<string | null>(null);

  // Enterprise Legal & Consent State
  const [consentTreat, setConsentTreat] = useState(false);
  const [consentHIPAA, setConsentHIPAA] = useState(false);
  const [interpreterRequired, setInterpreterRequired] = useState(false);
  const [preferredContact, setPreferredContact] = useState("PHONE");
  const [scheduleIntakeNow, setScheduleIntakeNow] = useState(true);
  const [communicationStatus, setCommunicationStatus] = useState<CommunicationAbility>(CommunicationAbility.Verbal);
  const [duplicateMatch, setDuplicateMatch] = useState<any>(null);
  const [isConsentSealed, setIsConsentSealed] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState<string | null>(null);
  const [consentToken, setConsentToken] = useState("");
  const [showIcd10Search, setShowIcd10Search] = useState(false);
  const [icd10Results, setIcd10Results] = useState<any[]>([]);
  const [isSearchingIcd10, setIsSearchingIcd10] = useState(false);
  const [legalDocs, setLegalDocs] = useState({ poa: false, advanceDirective: false });

  // Helpers
  const createZonedISO = useCallback(
    (date: Date, hours: number, minutes: number) => {
      const year = date.getFullYear(), month = date.getMonth(), day = date.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
      return fromZonedTime(dateStr, tenantConfig.timezone).toISOString();
    },
    [tenantConfig.timezone],
  );

  // Queries
  const { refetch: searchIcd10 } = useQuery(SEARCH_DIAGNOSIS_LIBRARY, {
    skip: true, variables: { term: primaryDiagnosis },
  });

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (primaryDiagnosis && primaryDiagnosis.length >= 2 && !primaryDiagnosis.includes(" - ")) {
        setIsSearchingIcd10(true);
        try {
          const { data } = await searchIcd10({ term: primaryDiagnosis });
          setIcd10Results(data?.searchDiagnosisLibrary || []);
          setShowIcd10Search(true);
        } catch (err) { console.error("Diagnosis search error:", err); }
        finally { setIsSearchingIcd10(false); }
      } else { setIcd10Results([]); setShowIcd10Search(false); }
    }, 400);
    return () => clearTimeout(handler);
  }, [primaryDiagnosis, searchIcd10]);

  const { data: leadData, loading: leadLoading } = useQuery(GET_LEAD_DETAILS, {
    variables: { id: outreachId }, skip: !outreachId || !open, fetchPolicy: "network-only",
  });
  const lead = leadData?.outreachById?.patientOutreachId === outreachId ? leadData?.outreachById : null;

  useEffect(() => {
    if (lead) {
      if (lead.mailingAddress) setAddress({ street: lead.mailingAddress.street || "", city: lead.mailingAddress.city || "", state: lead.mailingAddress.state || "", postalCode: lead.mailingAddress.postalCode || "", region: lead.mailingAddress.region || "", country: lead.mailingAddress.country || "Philippines", latitude: lead.mailingAddress.latitude ?? null, longitude: lead.mailingAddress.longitude ?? null });
      if (lead.dateOfBirth) setPatientDob(lead.dateOfBirth.split("T")[0]);
      if (lead.biologicalSex) setPatientSex(lead.biologicalSex as BiologicalSex);
      if (lead.genderIdentity) setGenderIdentity(lead.genderIdentity);
      if (lead.language) setPatientLanguage(lead.language);
      if (lead.civilStatus) setCivilStatus(lead.civilStatus);
    }
  }, [lead]);

  const { data: duplicateData } = useQuery(SEARCH_PATIENTS, {
    variables: { search: lead?.lastName }, skip: !lead || !open,
  });

  useEffect(() => {
    if (duplicateData?.patients?.items) {
      const match = duplicateData.patients.items.find((p: any) => p.patientId !== outreachId);
      if (match) setDuplicateMatch(match);
    }
  }, [duplicateData, outreachId]);

  const { data: enrollmentData } = useQuery(GET_ENROLLMENT_DATA, { skip: !open });

  const [logActivity] = useMutation(LOG_OUTREACH_ACTIVITY);
  const [updateLead] = useMutation(UPDATE_OUTREACH_LEAD);
  const [updateContact] = useMutation(UPDATE_OUTREACH_CONTACT);
  const [unenrollPatient, { loading: unenrolling }] = useMutation(UNENROLL_PATIENT);
  const [addContact, { loading: addingContact }] = useMutation(ADD_OUTREACH_CONTACT);
  const [removeContact] = useMutation(REMOVE_OUTREACH_CONTACT);
  const [finalize, { loading: finalizing }] = useMutation(FINALIZE_ENROLLMENT);

  const { data: availabilityData, loading: availabilityLoading } = useQuery(
    GET_GEOSPATIAL_AVAILABILITY,
    {
      variables: {
        patientId: outreachId,
        targetStart: createZonedISO(
          debouncedDate,
          debouncedPeriod === "AM" ? tenantConfig.amStartHour : tenantConfig.pmStartHour, 0,
        ),
        durationMinutes: debouncedDuration,
        modality: debouncedModality === CareModality.HomeCare ? "IN_PERSON_HOME_VISIT"
          : debouncedModality === CareModality.InPatientHospice ? "IN_PERSON_FACILITY"
          : debouncedModality === CareModality.VirtualCare ? "TELEHEALTH_VIDEO"
          : debouncedModality === CareModality.HybridCare ? "TELEHEALTH_AUDIO_ONLY"
          : "IN_PERSON_HOME_VISIT",
      },
      skip: !outreachId || !open || activeTab !== "LOGISTICS",
      fetchPolicy: "network-only",
    },
  );

  const availability = useMemo(() => {
    const map = new Map<string, any>();
    availabilityData?.availableProviders?.forEach((p: any) => { map.set(p.practitionerId, p); });
    return map;
  }, [availabilityData]);

  const selectedLogistics = useMemo(() => {
    if (!careNavigatorId) return null;
    return availability.get(careNavigatorId);
  }, [careNavigatorId, availability]);

  useEffect(() => {
    if (open && outreachId) {
      setActiveTab("OUTREACH");
      setSelectedPlan("");
      setSelectedFacilityId("");
      setModality(CareModality.HomeCare);
      setActiveCall(null);
      setIsAddingContact(false);
      setSelectedScriptId(null);
      setSelectedDate(new Date());
      setViewDate(new Date());
      setPeriod("AM");
      setDuration(45);
      setVisitType("INITIAL_HOSPICE_INTAKE");
      setSupportingClinicianIds([]);
      setCareNavigatorId("");
      setStaffSearch("");
      setMemberId("");
      setGroupId("");
      setEligibilityStatus("PENDING");
      setIsVerifyingInsurance(false);
      setInsuranceRef("");
      setReferringPhysician("");
      setNpi("");
      setPrimaryDiagnosis("");
      setSdohHousing("STABLE");
      setSdohSupport("ADEQUATE");
      setAcuity("MODERATE");
      setAddress({ street: "", city: "", state: "", postalCode: "", region: "", country: "Philippines", latitude: null, longitude: null });
      setDisposition(EnrollmentDisposition.Cooperative);
      setTechAccess(TechAccessLevel.SmartphoneOnly);
      setCognitive("Autonomous");
      setNewContact({ firstName: "", lastName: "", relationship: "Spouse", phoneNumber: "", email: "" });
      setIsAddingRelative(false);
      setIsAddingProxy(false);
      setIsEditingLead(false);
      setEditingContactId(null);
      setIsVerifyingAddress(false);
      setIsEditingAddress(false);
      setIsEditingDemographics(false);
      setPatientDob("");
      setPatientSex(BiologicalSex.Unknown);
      setGenderIdentity("");
      setPatientLanguage("English");
      setCivilStatus("");
      setLogNotes("");
      setFollowUpDate("");
      setShowDispositionModal(false);
      setShowUnenrollModal(false);
      setPendingOutcome(null);
      setConsentTreat(false);
      setConsentHIPAA(false);
      setInterpreterRequired(false);
      setPreferredContact("PHONE");
      setScheduleIntakeNow(true);
      setCommunicationStatus(CommunicationAbility.Verbal);
      setDuplicateMatch(null);
      setIsConsentSealed(false);
      setConsentTimestamp(null);
      setConsentToken("");
      setShowIcd10Search(false);
      setIcd10Results([]);
      setIsSearchingIcd10(false);
      setLegalDocs({ poa: false, advanceDirective: false });
    }
  }, [open, outreachId]);

  const practitioners = enrollmentData?.practitioners || [];
  const scripts = enrollmentData?.outreachScripts || [];
  const activeScript = scripts.find((s: any) => s.outreachScriptId === selectedScriptId) || scripts[0];

  const selfContacts = lead?.otherContacts?.filter((c: any) => c.relationship?.toLowerCase() === "self") || [];
  const relativeContacts = lead?.otherContacts?.filter((c: any) => c.relationship?.toLowerCase() !== "self") || [];

  // Validation
  const validateCurrentStep = () => {
    if (activeTab === "OUTREACH") {
      if (!lead) { showToast("Validation Error: Outreach details are missing", "error"); return false; }
    }
    if (activeTab === "ADMIN") {
      if (!selectedPlan) { showToast("Validation Error: Health Plan is missing", "error"); return false; }
      if (!patientDob) { showToast("Validation Error: Date of Birth is missing", "error"); return false; }
      if (!patientSex || patientSex === BiologicalSex.Unknown) { showToast("Validation Error: Biological Sex is missing", "error"); return false; }
    }
    if (activeTab === "LEGAL") {
      if (!consentTreat) { showToast("Validation Error: Consent to Treat required", "error"); return false; }
      if (!consentHIPAA) { showToast("Validation Error: HIPAA Notice required", "error"); return false; }
    }
    if (activeTab === "CLINICAL") {
      if (!primaryDiagnosis || primaryDiagnosis.trim().length <= 5) {
        showToast("Validation Error: Primary Diagnosis is required", "error");
        return false;
      }
    }
    if (activeTab === "LOGISTICS") {
      if (!careNavigatorId) { showToast("Validation Error: Care Navigator missing", "error"); return false; }
    }
    return true;
  };

  const checkStepCompleteness = (tab: TabType) => {
    switch (tab) {
      case "OUTREACH": return !!lead;
      case "ADMIN": return !!selectedPlan && !!patientDob && !!patientSex && patientSex !== BiologicalSex.Unknown;
      case "LEGAL": return consentTreat && consentHIPAA;
      case "CLINICAL": return !!primaryDiagnosis && primaryDiagnosis.length > 5 && acuity !== "";
      case "LOGISTICS": return !!careNavigatorId;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    const idx = TABS.indexOf(activeTab);
    if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1]);
  };
  const handleBack = () => { const idx = TABS.indexOf(activeTab); if (idx > 0) setActiveTab(TABS[idx - 1]); };

  const handleCall = (contact: any) => {
    setActiveCall({ ...contact, status: "CONNECTING..." });
    setTimeout(() => { setActiveCall((prev: any) => prev ? { ...prev, status: "ON LINE" } : null); }, 1500);
  };

  const handleLogActivity = async (outcome: string) => {
    if (outcome === "CONNECTED") {
      if (!outreachId) return;
      try {
        await logActivity({ variables: { input: { outreachId, method: "TELEPHONE", outcome: "CONNECTED", reason: "Direct connection established", notes: "Enrollment interaction initialized via direct connection.", nextFollowUpDate: null } }, refetchQueries: ["GetLeadDetails", "GetOutreachLeads"] });
        showToast("Connection established. Moving to Admin.", "success");
        setActiveTab("ADMIN");
      } catch (e) { console.error(e); showToast("Failed to log connection", "error"); }
    } else { setPendingOutcome(outcome); setShowDispositionModal(true); }
  };

  const confirmLogActivity = async () => {
    if (!outreachId || !pendingOutcome) return;
    try {
      await logActivity({ variables: { input: { outreachId, method: "TELEPHONE", outcome: pendingOutcome, reason: logNotes, notes: `Enrollment outcome recorded: ${pendingOutcome}`, nextFollowUpDate: followUpDate ? new Date(followUpDate).toISOString() : null } }, refetchQueries: ["GetLeadDetails", "GetOutreachLeads"] });
      showToast(`Disposition logged: ${pendingOutcome}`, "success");
      setLogNotes(""); setFollowUpDate(""); setShowDispositionModal(false);
      if (pendingOutcome === "CONNECTED") setActiveTab("ADMIN");
      setPendingOutcome(null);
    } catch (e) { console.error(e); showToast("Failed to log disposition", "error"); }
  };

  const handleEditContact = (contact: any) => {
    const rawRel = contact.relationship || "Other";
    const normalizedRel = rawRel.toLowerCase().split(/[\s_]+/).map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
    setNewContact({ firstName: contact.firstName, lastName: contact.lastName, relationship: normalizedRel, phoneNumber: contact.phoneNumber, email: contact.email || "" });
    setEditingContactId(contact.outreachContactId);
    setIsAddingContact(true);
  };

  const handleVerifyAddress = () => { setIsVerifyingAddress(true); setTimeout(() => { setIsVerifyingAddress(false); }, 1200); };

  const handleSaveAddress = async (addr: typeof address) => {
    try {
      await handleUpdateLead({
        street: addr.street || null,
        city: addr.city || null,
        state: addr.state || null,
        postalCode: addr.postalCode || null,
        region: addr.region || null,
        country: addr.country || null,
        latitude: addr.latitude,
        longitude: addr.longitude,
      });
      setAddress(addr);
      setIsEditingAddress(false);
      showToast("Address saved", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to save address", "error");
    }
  };

  const handleUpdateLead = async (fields: any) => {
    try { await updateLead({ variables: { input: { patientOutreachId: outreachId, ...fields } } }); }
    catch (e) { console.error(e); }
  };

  const handleAddContact = async () => {
    if (!newContact.firstName || !newContact.phoneNumber) return;
    if (!newContact.phoneNumber) return showToast("Phone is required", "error");
    try {
      const { ...input } = newContact as any;
      await addContact({ variables: { input: { patientOutreachId: outreachId, ...input } }, refetchQueries: ["GetLeadDetails"] });
      setIsAddingContact(false); setIsAddingProxy(false); setIsAddingRelative(false); setEditingContactId(null);
      setNewContact({ firstName: "", lastName: "", relationship: "Family", phoneNumber: "", email: "" });
      showToast("Registered Successfully", "success");
    } catch (e) { console.error(e); }
  };

  const handleUpdateContact = async () => {
    if (!newContact.phoneNumber) return showToast("Phone is required", "error");
    try {
      const { ...input } = newContact as any;
      await updateContact({ variables: { input: { outreachContactId: editingContactId, ...input } }, refetchQueries: ["GetLeadDetails"] });
      setEditingContactId(null); setIsAddingContact(false); setIsAddingProxy(false); setIsAddingRelative(false);
      setNewContact({ firstName: "", lastName: "", relationship: "Family", phoneNumber: "", email: "" });
      showToast("Updated Successfully", "success");
    } catch (e) { console.error(e); }
  };

  const handleUpdateLeadPhone = async () => {
    if (!outreachId || !newContact.phoneNumber) return;
    try {
      await updateLead({ variables: { input: { patientOutreachId: outreachId, primaryPhone: newContact.phoneNumber.replace(/\D/g, "") } }, refetchQueries: [{ query: GET_LEAD_DETAILS, variables: { id: outreachId } }] });
      showToast("Primary phone updated", "success"); setIsEditingLead(false);
    } catch (err) { showToast("Update failed", "error"); }
  };

  const startEditingContact = (contact: any) => {
    setNewContact({ firstName: contact.firstName, lastName: contact.lastName, relationship: contact.relationship, phoneNumber: contact.phoneNumber, email: contact.email || "" });
    setEditingContactId(contact.outreachContactId);
  };

  const handleRemoveContact = async (id: string) => {
    try { await removeContact({ variables: { input: { outreachContactId: id } }, refetchQueries: ["GetLeadDetails"] }); }
    catch (e) { console.error(e); }
  };

  const handleUnenroll = async () => { setShowUnenrollModal(true); };

  const confirmUnenroll = async () => {
    if (!outreachId) return;
    try {
      await unenrollPatient({ variables: { input: { patientOutreachId: outreachId, reason: logNotes || "Manual unenrollment" } }, refetchQueries: ["GetLeadDetails"] });
      showToast("Enrollment reversed successfully", "success"); setLogNotes(""); setShowUnenrollModal(false);
    } catch (e) { console.error(e); showToast("Failed to reverse enrollment", "error"); }
  };

  const handleFinalize = async () => {
    const allSteps = TABS.slice(0, -1);
    for (const tab of allSteps) {
      if (!checkStepCompleteness(tab)) { setActiveTab(tab); showToast(`Finalize Error: ${tab} phase is incomplete`, "error"); return; }
    }
    try {
      const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());
      let orientationIso = new Date().toISOString();
      if (selectedDate) {
        const scheduledDate = new Date(selectedDate);
        const modalityConfig: Record<CareModality, { am: number; pm: number }> = {
          [CareModality.HomeCare]: { am: 9, pm: 14 }, [CareModality.InPatientHospice]: { am: 9, pm: 14 },
          [CareModality.OutpatientClinic]: { am: 9, pm: 14 }, [CareModality.VirtualCare]: { am: 8, pm: 13 },
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
            patientOutreachId: outreachId, modality: modality || "HomeCare", healthPlanId: selectedPlan,
            disposition: disposition || "Cooperative", communicationStatus: communicationStatus || "Verbal",
            techAccess: techAccess || "None", orientationDate: orientationIso,
            supportingClinicianIds: supportingClinicianIds || [], careNavigatorId: careNavigatorId || null,
            dateOfBirth: patientDob && isValidDate(new Date(patientDob)) ? new Date(patientDob).toISOString() : null,
            biologicalSex: patientSex, genderIdentity: genderIdentity || null,
            language: patientLanguage || "English", civilStatus: civilStatus || null,
            consentToTreat: consentTreat, consentHIPAA: consentHIPAA, consentMarketing: false,
            interpreterRequired, preferredContactMethod: preferredContact || "Phone",
            hasPoa: legalDocs.poa, hasAdvanceDirective: legalDocs.advanceDirective,
            facilityId: selectedFacilityId || null, scheduleIntakeNow, durationMinutes: duration,
          },
        },
      });
      if (data?.finalizeEnrollment) {
        showToast("Enrollment successful. Redirecting to registry...", "success");
        router.push(`/dashboard/patients/${data.finalizeEnrollment}`);
      } else {
        showToast("Enrollment successful, but registry ID missing. Redirecting to Patient List.", "info");
        router.push("/dashboard/patients");
      }
    } catch (e) { console.error("[ENROLLMENT ERROR]", e); showToast("Enrollment commit failed. Check clinical telemetry.", "error"); }
  };

  const verifyInsurance = () => {
    if (!selectedPlan || !memberId) { showToast("Plan and Member ID required for verification", "error"); return; }
    setIsVerifyingInsurance(true);
    setTimeout(() => {
      setEligibilityStatus("VERIFIED"); setInsuranceRef(`AUTH-${Math.floor(Math.random() * 1000000)}`);
      setIsVerifyingInsurance(false); showToast("Insurance Eligibility Verified", "success");
    }, 1500);
  };

  return {
    // Core
    router, tenantConfig, showToast, activeTab, setActiveTab, lead, leadData, leadLoading, enrollmentData,

    // Plan / Facility / Modality
    selectedPlan, setSelectedPlan, selectedFacilityId, setSelectedFacilityId, modality, setModality,

    // Call
    activeCall, setActiveCall, isAddingContact, setIsAddingContact, selectedScriptId, setSelectedScriptId,

    // Scheduling
    selectedDate, setSelectedDate, viewDate, setViewDate, period, setPeriod,
    duration, setDuration, visitType, setVisitType,
    supportingClinicianIds, setSupportingClinicianIds, careNavigatorId, setCareNavigatorId,
    staffSearch, setStaffSearch,

    // Insurance
    memberId, setMemberId, groupId, setGroupId,
    eligibilityStatus, setEligibilityStatus, isVerifyingInsurance, insuranceRef,

    // Referral
    referringPhysician, setReferringPhysician, npi, setNpi,

    // Clinical
    primaryDiagnosis, setPrimaryDiagnosis, sdohHousing, setSdohHousing,
    sdohSupport, setSdohSupport, acuity, setAcuity,

    // Address
    address, setAddress,

    // Assessment
    disposition, setDisposition, techAccess, setTechAccess, cognitive, setCognitive,

    // Contact editing
    newContact, setNewContact, isAddingRelative, setIsAddingRelative,
    isAddingProxy, setIsAddingProxy, isEditingLead, setIsEditingLead,
    editingContactId, setEditingContactId, isVerifyingAddress, isEditingAddress, setIsEditingAddress,
    isEditingDemographics, setIsEditingDemographics,

    // Demographics
    patientDob, setPatientDob, patientSex, setPatientSex,
    genderIdentity, setGenderIdentity, patientLanguage, setPatientLanguage,
    civilStatus, setCivilStatus, logNotes, setLogNotes, followUpDate, setFollowUpDate,

    // Modals
    showDispositionModal, setShowDispositionModal, showUnenrollModal, setShowUnenrollModal,
    pendingOutcome, setPendingOutcome,

    // Legal / Consent
    consentTreat, setConsentTreat, consentHIPAA, setConsentHIPAA,
    interpreterRequired, setInterpreterRequired, preferredContact, setPreferredContact,
    scheduleIntakeNow, setScheduleIntakeNow,
    communicationStatus, setCommunicationStatus, duplicateMatch,
    isConsentSealed, setIsConsentSealed, consentTimestamp, setConsentTimestamp,
    consentToken, setConsentToken, legalDocs, setLegalDocs,

    // ICD10
    showIcd10Search, setShowIcd10Search, icd10Results, isSearchingIcd10,

    // Availability
    availability, availabilityLoading, selectedLogistics,

    // Derived
    practitioners, scripts, activeScript, selfContacts, relativeContacts,
    unenrolling, finalizing,

    // Handlers
    checkStepCompleteness, validateCurrentStep,
    handleNext, handleBack, handleCall, handleLogActivity, confirmLogActivity,
    handleEditContact, handleVerifyAddress, handleUpdateLead, handleSaveAddress,
    handleAddContact, handleUpdateContact, handleUpdateLeadPhone,
    startEditingContact, handleRemoveContact,
    handleUnenroll, confirmUnenroll, handleFinalize, verifyInsurance,
  };
}

export type EnrollmentState = ReturnType<typeof useEnrollmentState>;
