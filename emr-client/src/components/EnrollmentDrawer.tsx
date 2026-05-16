"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import HalcyonPortal from "./Portal";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  X,
  PhoneCall,
  CheckCircle2,
  Calendar,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  ClipboardCheck,
  ShieldCheck,
  Activity,
  User,
  MapPin,
  Users,
  AlertCircle,
  PhoneOff,
  PhoneForwarded,
  Trash2,
  Smartphone,
  MessageSquare,
  Clock,
  Video,
  Home,
  Building2,
  Timer,
  Search,
  History,
  Check,
  HeartPulse,
  HeartHandshake,
  Shield,
  Edit3,
  Car,
  Navigation,
  Sun,
  Wind,
  Fingerprint,
  CreditCard,
  Briefcase,
  FileCheck,
  Scale,
  FileSignature,
  FolderLock,
  CalendarCheck,
  Pencil,
  Heart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";
import { PermissionGate } from "./PermissionGate";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useSettings } from "@/lib/SettingsContext";
import { addMinutes } from "date-fns";
import {
  BiologicalSex,
  CareModality,
  EnrollmentDisposition,
  CommunicationAbility,
  TechAccessLevel,
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

const UPDATE_OUTREACH_CONTACT = gql`
  mutation UpdateContact($input: UpdateOutreachContactCommandInput!) {
    updateOutreachContact(input: $input)
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
      diagnosisId: icd10Code
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

const GET_GEOSPATIAL_AVAILABILITY = gql`
  query GetGeospatialAvailability(
    $patientId: UUID!
    $targetStart: DateTime!
    $durationMinutes: Int!
    $modality: AppointmentModality!
  ) {
    availableProviders(
      patientId: $patientId
      targetStart: $targetStart
      durationMinutes: $durationMinutes
      modality: $modality
    ) {
      practitionerId
      fullName
      role
      distanceInMiles
      travelTimeInMinutes
      shiftStart
      shiftEnd
    }
  }
`;

const monthNames = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

interface Props {
  open: boolean;
  onClose: () => void;
  outreachId: string | null;
}

type TabType = "OUTREACH" | "ADMIN" | "LEGAL" | "CLINICAL" | "LOGISTICS";

const RELATIONSHIP_LABELS: Record<string, string> = {
  Spouse: "Spouse",
  Child: "Child",
  Parent: "Parent",
  Sibling: "Sibling",
  Relative: "Relative",
  Friend: "Friend",
  Family: "Family",
  Lawyer: "Lawyer",
  LegalRepresentative: "Legal Representative",
  Self: "Self",
  Other: "Other",
};

export default function EnrollmentDrawer({ open, onClose, outreachId }: any) {
  const router = useRouter();
  const { tenantConfig } = useSettings();
  const [activeTab, setActiveTab] = useState<TabType>("OUTREACH");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [modality, setModality] = useState<CareModality>(CareModality.HomeCare);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
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
  const [eligibilityStatus, setEligibilityStatus] = useState<
    "PENDING" | "VERIFIED" | "ERROR"
  >("PENDING");
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
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });

  // Assessment State
  const [disposition, setDisposition] = useState<EnrollmentDisposition>(
    EnrollmentDisposition.Cooperative,
  );
  const [techAccess, setTechAccess] = useState<TechAccessLevel>(
    TechAccessLevel.SmartphoneOnly,
  );
  const [cognitive, setCognitive] = useState("Autonomous");

  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    relationship: "Spouse",
    phoneNumber: "",
    email: "",
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
  const [patientSex, setPatientSex] = useState<BiologicalSex>(
    BiologicalSex.Unknown,
  );
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
  const [communicationStatus, setCommunicationStatus] =
    useState<CommunicationAbility>(CommunicationAbility.Verbal);
  const [duplicateMatch, setDuplicateMatch] = useState<any>(null);
  const [isConsentSealed, setIsConsentSealed] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState<string | null>(null);
  const [consentToken, setConsentToken] = useState("");
  const [showIcd10Search, setShowIcd10Search] = useState(false);
  const [icd10Results, setIcd10Results] = useState<any[]>([]);
  const [isSearchingIcd10, setIsSearchingIcd10] = useState(false);

  const createZonedISO = useCallback(
    (date: Date, hours: number, minutes: number) => {
      const year = date.getFullYear(),
        month = date.getMonth(),
        day = date.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
      return fromZonedTime(dateStr, tenantConfig.timezone).toISOString();
    },
    [tenantConfig.timezone],
  );

  const formatPhoneNumber = (val: string) => {
    const digits = val?.replace(/\D/g, "").slice(0, 10) || "";
    if (digits.length === 0) return "";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const { refetch: searchIcd10 } = useQuery(SEARCH_DIAGNOSIS_LIBRARY, {
    skip: true,
    variables: { term: primaryDiagnosis },
  });

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (
        primaryDiagnosis &&
        primaryDiagnosis.length >= 2 &&
        !primaryDiagnosis.includes(" - ")
      ) {
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
    advanceDirective: false,
  });

  const { data: leadData, loading: leadLoading } = useQuery(GET_LEAD_DETAILS, {
    variables: { id: outreachId },
    skip: !outreachId || !open,
    fetchPolicy: "network-only",
  });

  const lead = leadData?.outreachById;

  useEffect(() => {
    if (lead) {
      if (lead.mailingAddress) {
        setAddress({
          street: lead.mailingAddress.street || "",
          city: lead.mailingAddress.city || "",
          state: lead.mailingAddress.state || "",
          postalCode: lead.mailingAddress.postalCode || "",
        });
      }
      if (lead.dateOfBirth) {
        setPatientDob(lead.dateOfBirth.split("T")[0]);
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
  }, [lead]);

  const { data: duplicateData } = useQuery(SEARCH_PATIENTS, {
    variables: {
      search: lead?.lastName,
    },
    skip: !lead || !open,
  });

  useEffect(() => {
    if (duplicateData?.patients?.items) {
      const match = duplicateData.patients.items.find(
        (p: any) => p.patientId !== outreachId,
      );
      if (match) setDuplicateMatch(match);
    }
  }, [duplicateData, outreachId]);

  const { data: enrollmentData } = useQuery(GET_ENROLLMENT_DATA, {
    skip: !open,
  });

  const [logActivity] = useMutation(LOG_OUTREACH_ACTIVITY);
  const [updateLead] = useMutation(UPDATE_OUTREACH_LEAD);
  const [updateContact] = useMutation(UPDATE_OUTREACH_CONTACT);
  const [unenrollPatient, { loading: unenrolling }] =
    useMutation(UNENROLL_PATIENT);
  const [addContact, { loading: addingContact }] =
    useMutation(ADD_OUTREACH_CONTACT);
  const [removeContact] = useMutation(REMOVE_OUTREACH_CONTACT);
  const [finalize, { loading: finalizing }] = useMutation(FINALIZE_ENROLLMENT);
  const { showToast } = useToast();

  const { data: availabilityData, loading: availabilityLoading } = useQuery(
    GET_GEOSPATIAL_AVAILABILITY,
    {
      variables: {
        patientId: outreachId,
        targetStart: createZonedISO(
          selectedDate,
          period === "AM" ? tenantConfig.amStartHour : tenantConfig.pmStartHour,
          0,
        ),
        durationMinutes: duration,
        modality:
          modality === CareModality.HomeCare
            ? "IN_PERSON_HOME_VISIT"
            : modality === CareModality.InPatientHospice
              ? "IN_PERSON_FACILITY"
              : modality === CareModality.VirtualCare
                ? "TELEHEALTH_VIDEO"
                : modality === CareModality.HybridCare
                  ? "TELEHEALTH_AUDIO_ONLY"
                  : "IN_PERSON_HOME_VISIT",
      },
      skip: !outreachId || !open || activeTab !== "LOGISTICS",
      fetchPolicy: "network-only",
    },
  );

  const availability = useMemo(() => {
    const map = new Map<string, any>();
    availabilityData?.availableProviders?.forEach((p: any) => {
      map.set(p.practitionerId, p);
    });
    return map;
  }, [availabilityData]);

  const selectedLogistics = useMemo(() => {
    const targetId = primaryClinicianId || careNavigatorId;
    if (!targetId) return null;
    return availability.get(targetId);
  }, [primaryClinicianId, careNavigatorId, availability]);

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
  const activeScript =
    scripts.find((s: any) => s.outreachScriptId === selectedScriptId) ||
    scripts[0];

  const selfContacts =
    lead?.otherContacts?.filter(
      (c: any) => c.relationship?.toLowerCase() === "self",
    ) || [];
  const relativeContacts =
    lead?.otherContacts?.filter(
      (c: any) => c.relationship?.toLowerCase() !== "self",
    ) || [];

  const TABS: TabType[] = [
    "OUTREACH",
    "ADMIN",
    "LEGAL",
    "CLINICAL",
    "LOGISTICS",
  ];

  const validateCurrentStep = () => {
    if (activeTab === "ADMIN") {
      if (!selectedPlan) {
        showToast("Validation Error: Health Plan is missing", "error");
        return false;
      }
      if (!patientDob) {
        showToast("Validation Error: Date of Birth is missing", "error");
        return false;
      }
      if (!patientSex || patientSex === BiologicalSex.Unknown) {
        showToast("Validation Error: Biological Sex is missing", "error");
        return false;
      }
    }
    if (activeTab === "LEGAL") {
      if (!consentTreat) {
        showToast("Validation Error: Consent to Treat required", "error");
        return false;
      }
      if (!consentHIPAA) {
        showToast("Validation Error: HIPAA Notice required", "error");
        return false;
      }
    }
    if (activeTab === "LOGISTICS") {
      if (!careNavigatorId) {
        showToast("Validation Error: Care Navigator missing", "error");
        return false;
      }
      if (!primaryClinicianId) {
        showToast("Validation Error: Primary Clinician missing", "error");
        return false;
      }
    }
    return true;
  };

  const checkStepCompleteness = (tab: TabType) => {
    switch (tab) {
      case "OUTREACH":
        return !!lead;
      case "ADMIN":
        return (
          !!selectedPlan &&
          !!patientDob &&
          !!patientSex &&
          patientSex !== BiologicalSex.Unknown
        );
      case "LEGAL":
        return consentTreat && consentHIPAA;
      case "CLINICAL":
        return (
          !!primaryDiagnosis && primaryDiagnosis.length > 5 && acuity !== ""
        );
      case "LOGISTICS":
        return !!careNavigatorId && !!primaryClinicianId;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const idx = TABS.indexOf(activeTab);
    if (idx < TABS.length - 1) {
      setActiveTab(TABS[idx + 1]);
    }
  };

  const handleBack = () => {
    const idx = TABS.indexOf(activeTab);
    if (idx > 0) setActiveTab(TABS[idx - 1]);
  };

  const handleCall = (contact: any) => {
    setActiveCall({ ...contact, status: "CONNECTING..." });
    setTimeout(() => {
      setActiveCall((prev: any) =>
        prev ? { ...prev, status: "ON LINE" } : null,
      );
    }, 1500);
  };

  const handleLogActivity = async (outcome: string) => {
    if (outcome === "CONNECTED") {
      if (!outreachId) return;
      try {
        await logActivity({
          variables: {
            input: {
              outreachId: outreachId,
              method: "TELEPHONE",
              outcome: "CONNECTED",
              reason: "Direct connection established",
              notes:
                "Enrollment interaction initialized via direct connection.",
              nextFollowUpDate: null,
            },
          },
          refetchQueries: ["GetLeadDetails", "GetOutreachLeads"],
        });
        showToast("Connection established. Moving to Admin.", "success");
        setActiveTab("ADMIN");
      } catch (e) {
        console.error(e);
        showToast("Failed to log connection", "error");
      }
    } else {
      setPendingOutcome(outcome);
      setShowDispositionModal(true);
    }
  };

  const confirmLogActivity = async () => {
    if (!outreachId || !pendingOutcome) return;
    try {
      await logActivity({
        variables: {
          input: {
            outreachId: outreachId,
            method: "TELEPHONE",
            outcome: pendingOutcome,
            reason: logNotes,
            notes: `Enrollment outcome recorded: ${pendingOutcome}`,
            nextFollowUpDate: followUpDate
              ? new Date(followUpDate).toISOString()
              : null,
          },
        },
        refetchQueries: ["GetLeadDetails", "GetOutreachLeads"],
      });

      showToast(`Disposition logged: ${pendingOutcome}`, "success");
      setLogNotes("");
      setFollowUpDate("");
      setShowDispositionModal(false);

      if (pendingOutcome === "CONNECTED") {
        setActiveTab("ADMIN");
      }
      setPendingOutcome(null);
    } catch (e) {
      console.error(e);
      showToast("Failed to log disposition", "error");
    }
  };

  const handleEditContact = (contact: any) => {
    // Robust normalization: Convert to PascalCase to match dropdown values
    const rawRel = contact.relationship || "Other";
    const normalizedRel = rawRel
      .toLowerCase()
      .split(/[\s_]+/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

    setNewContact({
      firstName: contact.firstName,
      lastName: contact.lastName,
      relationship: normalizedRel,
      phoneNumber: contact.phoneNumber,
      email: contact.email || "",
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
          input: { patientOutreachId: outreachId, ...fields },
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.firstName || !newContact.phoneNumber) return;
    if (!newContact.phoneNumber) return showToast("Phone is required", "error");
    try {
      const { ...input } = newContact as any;
      await addContact({
        variables: { input: { patientOutreachId: outreachId, ...input } },
        refetchQueries: ["GetLeadDetails"],
      });
      setIsAddingContact(false);
      setIsAddingProxy(false);
      setIsAddingRelative(false);
      setEditingContactId(null);
      setNewContact({
        firstName: "",
        lastName: "",
        relationship: "Family",
        phoneNumber: "",
        email: "",
      });
      showToast("Registered Successfully", "success");
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateContact = async () => {
    if (!newContact.phoneNumber) return showToast("Phone is required", "error");
    try {
      const { ...input } = newContact as any;
      await updateContact({
        variables: { input: { outreachContactId: editingContactId, ...input } },
        refetchQueries: ["GetLeadDetails"],
      });
      setEditingContactId(null);
      setIsAddingContact(false);
      setIsAddingProxy(false);
      setIsAddingRelative(false);
      setNewContact({
        firstName: "",
        lastName: "",
        relationship: "Family",
        phoneNumber: "",
        email: "",
      });
      showToast("Updated Successfully", "success");
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLeadPhone = async () => {
    if (!outreachId || !newContact.phoneNumber) return;
    try {
      await updateLead({
        variables: {
          input: {
            patientOutreachId: outreachId,
            primaryPhone: newContact.phoneNumber.replace(/\D/g, ""),
          },
        },
        refetchQueries: [
          { query: GET_LEAD_DETAILS, variables: { id: outreachId } },
        ],
      });
      showToast("Primary phone updated", "success");
      setIsEditingLead(false);
    } catch (err) {
      showToast("Update failed", "error");
    }
  };

  const startEditingContact = (contact: any) => {
    setNewContact({
      firstName: contact.firstName,
      lastName: contact.lastName,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber,
      email: contact.email || "",
    });
    setEditingContactId(contact.outreachContactId);
  };

  const handleRemoveContact = async (id: string) => {
    try {
      await removeContact({
        variables: { input: { outreachContactId: id } },
        refetchQueries: ["GetLeadDetails"],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnenroll = async () => {
    setShowUnenrollModal(true);
  };

  const confirmUnenroll = async () => {
    if (!outreachId) return;
    try {
      await unenrollPatient({
        variables: {
          input: {
            patientOutreachId: outreachId,
            reason: logNotes || "Manual unenrollment",
          },
        },
        refetchQueries: ["GetLeadDetails"],
      });
      showToast("Enrollment reversed successfully", "success");
      setLogNotes("");
      setShowUnenrollModal(false);
    } catch (e) {
      console.error(e);
      showToast("Failed to reverse enrollment", "error");
    }
  };

  const handleFinalize = async () => {
    // Perform exhaustive validation across all critical steps
    const allSteps = TABS.slice(0, -1); // Check all steps except the final one
    for (const tab of allSteps) {
      if (!checkStepCompleteness(tab)) {
        setActiveTab(tab);
        showToast(`Finalize Error: ${tab} phase is incomplete`, "error");
        return;
      }
    }

    try {
      const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());

      let orientationIso = new Date().toISOString();
      if (selectedDate) {
        const scheduledDate = new Date(selectedDate);

        // Define modality-aware scheduling configurations
        const modalityConfig: Record<CareModality, { am: number; pm: number }> =
          {
            [CareModality.HomeCare]: { am: 9, pm: 14 },
            [CareModality.InPatientHospice]: { am: 9, pm: 14 },
            [CareModality.OutpatientClinic]: { am: 9, pm: 14 },
            [CareModality.VirtualCare]: { am: 8, pm: 13 },
            [CareModality.HybridCare]: { am: 8, pm: 13 },
          };

        const config =
          modalityConfig[modality] || modalityConfig[CareModality.HomeCare];
        const hour = period === "AM" ? config.am : config.pm;

        scheduledDate.setHours(hour, 0, 0, 0);
        if (isValidDate(scheduledDate))
          orientationIso = scheduledDate.toISOString();
      }

      const { data } = await finalize({
        variables: {
          input: {
            patientOutreachId: outreachId,
            modality: modality || "HomeCare",
            healthPlanId: selectedPlan,
            disposition: disposition || "Cooperative",
            communicationStatus: communicationStatus || "Verbal",
            techAccess: techAccess || "None",
            orientationDate: orientationIso,
            primaryClinicianId: primaryClinicianId || null,
            careNavigatorId: careNavigatorId || null,
            dateOfBirth:
              patientDob && isValidDate(new Date(patientDob))
                ? new Date(patientDob).toISOString()
                : null,
            biologicalSex: patientSex,
            genderIdentity: genderIdentity || null,
            language: patientLanguage || "English",
            civilStatus: civilStatus || null,
            consentToTreat: consentTreat,
            consentHIPAA: consentHIPAA,
            consentMarketing: false,
            interpreterRequired: interpreterRequired,
            preferredContactMethod: preferredContact || "Phone",
            hasPoa: legalDocs.poa,
            hasAdvanceDirective: legalDocs.advanceDirective,
            facilityId: selectedFacilityId || null,
            scheduleIntakeNow: scheduleIntakeNow,
            durationMinutes: duration,
          },
        },
      });
      if (data?.finalizeEnrollment) {
        showToast(
          "Enrollment successful. Transitioning to registry...",
          "success",
        );
        // Ensure navigation is initialized before unmounting
        router.push(`/dashboard/patients/${data.finalizeEnrollment}`);

        // Small delay to allow router to handle the request before unmounting the drawer
        setTimeout(() => {
          onClose();
        }, 100);
      } else {
        showToast(
          "Enrollment successful, but registry ID missing. Redirecting to Patient List.",
          "info",
        );
        router.push("/dashboard/patients");
        onClose();
      }
    } catch (e) {
      console.error("[ENROLLMENT ERROR]", e);
      showToast("Enrollment commit failed. Check clinical telemetry.", "error");
    }
  };

  const verifyInsurance = () => {
    if (!selectedPlan || !memberId) {
      showToast("Plan and Member ID required for verification", "error");
      return;
    }
    setIsVerifyingInsurance(true);
    setTimeout(() => {
      setEligibilityStatus("VERIFIED");
      setInsuranceRef(`AUTH-${Math.floor(Math.random() * 1000000)}`);
      setIsVerifyingInsurance(false);
      showToast("Insurance Eligibility Verified", "success");
    }, 1500);
  };

  const renderCalendar = () => {
    const days = [];
    const count = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      0,
    ).getDate();
    const first = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      1,
    ).getDay();
    const today = new Date();

    const headers = ["S", "M", "T", "W", "T", "F", "S"];
    const headerRow = headers.map((h, idx) => (
      <div
        key={`header-${h}-${idx}`}
        className="h-10 flex items-center justify-center text-[9px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-[0.2em]"
      >
        {h}
      </div>
    ));

    for (let i = 0; i < first; i++)
      days.push(<div key={`empty-${i}`} className="h-12" />);
    for (let d = 1; d <= count; d++) {
      const isSelected =
        selectedDate.getDate() === d &&
        selectedDate.getMonth() === viewDate.getMonth() &&
        selectedDate.getFullYear() === viewDate.getFullYear();
      const isToday =
        today.getDate() === d &&
        today.getMonth() === viewDate.getMonth() &&
        today.getFullYear() === viewDate.getFullYear();

      days.push(
        <button
          key={d}
          type="button"
          onClick={() =>
            setSelectedDate(
              new Date(viewDate.getFullYear(), viewDate.getMonth(), d),
            )
          }
          className={`h-12 w-full rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 relative
            ${isSelected ? "bg-teal-500 text-black shadow-lg shadow-teal-500/30" : "text-[var(--text-primary)] hover:bg-[var(--card-bg)] hover:text-teal-500"}`}
        >
          {d}
          {isToday && !isSelected && (
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          )}
        </button>,
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
        <div
          className="absolute inset-0 bg-black/10 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          className={`relative h-full bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] flex flex-col shadow-2xl transition-all duration-500 ease-in-out w-full max-w-[1100px]`}
        >
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
                  Enrollment
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.1em]">
                    {lead?.firstName} {lead?.lastName}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Stepper Navigation */}
            <div className="flex-1 flex justify-center px-4">
              <div className="flex bg-[var(--input-bg)]/50 rounded-2xl p-2 border border-[var(--card-border)] backdrop-blur-sm shadow-inner">
                {(
                  [
                    "OUTREACH",
                    "ADMIN",
                    "LEGAL",
                    "CLINICAL",
                    "LOGISTICS",
                  ] as TabType[]
                ).map((tab, idx) => {
                  const isActive = activeTab === tab;
                  const isComplete = checkStepCompleteness(tab);
                  const isLocked =
                    idx > 0 &&
                    !TABS.slice(0, idx).every((t) => checkStepCompleteness(t));

                  return (
                    <button
                      key={tab}
                      onClick={() => !isLocked && setActiveTab(tab)}
                      disabled={isLocked}
                      className={`relative px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 group/tab
                      ${isActive ? "bg-[var(--primary)] text-black shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]" : isLocked ? "opacity-30 cursor-not-allowed grayscale" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"}`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] transition-all
                      ${isActive ? "border-black/20 bg-black/5" : isComplete ? "bg-teal-500/20 border-teal-500/40 text-teal-500" : isLocked ? "border-[var(--card-border)]/30 opacity-50" : "border-[var(--card-border)]"}`}
                      >
                        {isComplete && !isActive ? (
                          <Check className="w-2.5 h-2.5" />
                        ) : isLocked ? (
                          <FolderLock className="w-2.5 h-2.5" />
                        ) : (
                          `0${idx + 1}`
                        )}
                      </span>
                      {tab}
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-black/40" />
                      )}
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
              <div className="flex-1 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[var(--primary)] animate-spin opacity-50" />
              </div>
            ) : !lead ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4 opacity-40">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">
                  Lead Not Found
                </p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                  Mission Aborted · Verify Registry ID
                </p>
              </div>
            ) : (
              <>
                {/* LEFT MAIN PANEL */}
                <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-6 scrollbar-hide border-r border-[var(--card-border)] bg-[var(--sidebar-bg)]">
                  {/* DUPLICATE CONFLICT ALERT */}
                  {duplicateMatch && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex items-center justify-between animate-in zoom-in-95 duration-500 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500">
                          <AlertCircle className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest leading-none">
                            Registry Conflict Detected
                          </p>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1.5 uppercase tracking-tight">
                            Patient already exists with MRN:{" "}
                            <span className="text-rose-500/80 font-black">
                              {duplicateMatch.mrn}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/patients/${duplicateMatch.patientId}`,
                          )
                        }
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
                            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white">
                              <PhoneForwarded className="w-5 h-5 animate-bounce" />
                            </div>
                            <div>
                              <p className="text-white font-black text-[10px] uppercase tracking-widest leading-none">
                                {activeCall.status}
                              </p>
                              <p className="text-teal-100 text-[11px] font-bold mt-1.5 opacity-80">
                                {activeCall.phone || activeCall.phoneNumber}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveCall(null)}
                            className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                          >
                            <PhoneOff className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* DEMOGRAPHIC IDENTITY HUD */}
                      <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] space-y-3 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-[var(--primary-glow)]">
                            {lead.firstName?.[0] || "?"}
                            {lead.lastName?.[0] || "?"}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
                              {lead.firstName || "Unknown"}{" "}
                              {lead.lastName || "Patient"}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest opacity-80">
                                {lead.referralSource || "Internal Lead"}
                              </p>
                              <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                {patientDob
                                  ? `${new Date(patientDob).toLocaleDateString()} (${Math.floor((new Date().getTime() - new Date(patientDob).getTime()) / 31557600000)}Y)`
                                  : "DOB: --"}
                              </p>
                              {(patientSex || genderIdentity) && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                    {patientSex}
                                    {genderIdentity
                                      ? ` (${genderIdentity})`
                                      : ""}
                                  </p>
                                </>
                              )}
                              {patientLanguage && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                    {patientLanguage}
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {lead.isDoNotCall && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Do Not
                                  Call
                                </span>
                              )}
                              {lead.isOptedOut && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <X className="w-2.5 h-2.5" /> Marketing
                                  Opt-Out
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border
                                    ${
                                      lead.status === "ENROLLED"
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                        : lead.status === "REFUSED" ||
                                            lead.status === "DO_NOT_CALL"
                                          ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                                          : "bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]"
                                    }`}
                              >
                                Status: {lead.status?.replaceAll("_", " ")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CALL SCRIPT HUD */}
                        <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-4 shadow-inner">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-[0.2em]">
                              Active Interaction Script
                            </p>
                            <select
                              className="bg-transparent border-none text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest outline-none cursor-pointer [color-scheme:dark]"
                              value={selectedScriptId || ""}
                              onChange={(e) =>
                                setSelectedScriptId(e.target.value)
                              }
                            >
                              {scripts.map((s: any) => (
                                <option
                                  key={s.outreachScriptId}
                                  value={s.outreachScriptId}
                                >
                                  {s.scriptTitle}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed italic opacity-80">
                            {activeScript?.content
                              ? activeScript.content
                                  .replace("{firstName}", lead.firstName)
                                  .replace("{lastName}", lead.lastName)
                                  .replaceAll("deployment", "home visit")
                              : `"Hello ${lead.firstName}, I'm calling from Halkyone Health..."`}
                          </p>
                        </div>
                      </div>

                      {/* 1. IDENTITY HUB & PROXY REGISTRY (PORTED FROM PROFILE) */}
                      <div className="flex flex-col gap-4 shrink-0">
                        {/* Identity Hub: Self Identity */}
                        <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-4 space-y-3 shadow-inner relative group/registry">
                          <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight">
                              Identity Hub
                            </h2>
                            <button
                              onClick={() =>
                                setIsAddingRelative(!isAddingRelative)
                              }
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${isAddingRelative ? "bg-rose-500 text-white" : "bg-[var(--primary)] text-black hover:bg-[var(--primary)]/80"}`}
                            >
                              {isAddingRelative ? "Cancel" : "+ Add Channel"}
                            </button>
                          </div>

                          {isAddingRelative && (
                            <div className="bg-white/[0.02] border border-[var(--card-border)] rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-[var(--primary)]/50"
                                  value={newContact.phoneNumber}
                                  onChange={(e) =>
                                    setNewContact({
                                      ...newContact,
                                      phoneNumber: formatPhoneNumber(
                                        e.target.value,
                                      ),
                                      firstName: lead.firstName,
                                      lastName: lead.lastName,
                                      relationship: "Self",
                                    })
                                  }
                                  placeholder="(XXX) XXX-XXXX"
                                />
                                <input
                                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-[var(--primary)]/50"
                                  value={newContact.email}
                                  onChange={(e) =>
                                    setNewContact({
                                      ...newContact,
                                      email: e.target.value,
                                    })
                                  }
                                  placeholder="Email"
                                />
                              </div>
                              <button
                                onClick={
                                  editingContactId
                                    ? handleUpdateContact
                                    : handleAddContact
                                }
                                className="w-full py-2 rounded-lg bg-[var(--primary)] text-black text-[8px] font-black uppercase tracking-widest shadow-lg"
                              >
                                Commit Registry
                              </button>
                            </div>
                          )}

                          <div className="bg-white/[0.015] border border-[var(--card-border)] rounded-xl overflow-hidden p-2 space-y-2">
                            {/* Primary Channel */}
                            {isEditingLead ? (
                              <div className="p-4 rounded-xl border border-[var(--primary)]/40 bg-[var(--primary)]/[0.04] space-y-3 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1">
                                  <label className="text-[7px] font-black text-[var(--primary)] uppercase tracking-widest ml-1">
                                    Edit Primary Phone
                                  </label>
                                  <input
                                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                    value={newContact.phoneNumber}
                                    onChange={(e) =>
                                      setNewContact({
                                        ...newContact,
                                        phoneNumber: formatPhoneNumber(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    placeholder="(XXX) XXX-XXXX"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setIsEditingLead(false)}
                                    className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-[var(--text-muted)] hover:bg-white/5"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleUpdateLeadPhone}
                                    className="px-5 py-1.5 rounded-lg bg-[var(--primary)] text-black text-[8px] font-black uppercase tracking-widest shadow-lg"
                                  >
                                    Save Primary
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--primary)]/[0.03] border border-[var(--primary)]/10 hover:border-[var(--primary)]/40 transition-all group relative">
                                <div className="flex items-center gap-3 min-w-0">
                                  <PhoneCall className="w-4 h-4 text-[var(--primary)] shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider leading-none truncate">
                                      {formatPhoneNumber(lead.primaryPhone) ||
                                        "NO PHONE"}
                                    </p>
                                    <span className="text-[6px] font-black text-[var(--primary)] uppercase mt-1 block tracking-widest">
                                      PRIMARY CONTACT
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setNewContact({
                                        firstName: lead.firstName,
                                        lastName: lead.lastName,
                                        phoneNumber: lead.primaryPhone,
                                        relationship: "Self",
                                        email: lead.primaryEmail || "",
                                      });
                                      setIsEditingLead(true);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all shrink-0"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleCall({ phone: lead.primaryPhone })
                                    }
                                    className="p-2 rounded-lg bg-[var(--primary)] text-black shadow-lg shrink-0"
                                  >
                                    <PhoneCall className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Secondary Channels */}
                            {selfContacts.map((contact: any) => (
                              <div key={contact.outreachContactId}>
                                {editingContactId ===
                                contact.outreachContactId ? (
                                  <div className="p-3 rounded-lg border border-[var(--primary)]/40 bg-[var(--primary)]/[0.04] space-y-3 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                        value={newContact.phoneNumber}
                                        onChange={(e) =>
                                          setNewContact({
                                            ...newContact,
                                            phoneNumber: formatPhoneNumber(
                                              e.target.value,
                                            ),
                                            firstName: lead.firstName,
                                            lastName: lead.lastName,
                                            relationship: "Self",
                                          })
                                        }
                                        placeholder="(XXX) XXX-XXXX"
                                      />
                                      <input
                                        className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                        value={newContact.email}
                                        onChange={(e) =>
                                          setNewContact({
                                            ...newContact,
                                            email: e.target.value,
                                          })
                                        }
                                        placeholder="Email"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() =>
                                          setEditingContactId(null)
                                        }
                                        className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-[var(--text-muted)] hover:bg-white/5"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={handleUpdateContact}
                                        className="px-5 py-1.5 rounded-lg bg-[var(--primary)] text-black text-[8px] font-black uppercase tracking-widest shadow-lg"
                                      >
                                        Commit Sync
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all group relative">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider leading-none truncate">
                                          {formatPhoneNumber(
                                            contact.phoneNumber,
                                          )}
                                        </p>
                                        <span className="text-[6px] font-black text-[var(--text-muted)] uppercase mt-1 block tracking-widest">
                                          SECONDARY CONTACT
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                                        <button
                                          onClick={() =>
                                            startEditingContact(contact)
                                          }
                                          className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleRemoveContact(
                                              contact.outreachContactId,
                                            )
                                          }
                                          className="p-1.5 rounded-lg bg-white/5 text-rose-500/50 hover:text-rose-500 transition-all"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleCall({
                                            phone: contact.phoneNumber,
                                          })
                                        }
                                        className="p-2 rounded-lg bg-white/10 text-[var(--text-primary)] hover:bg-[var(--primary)] hover:text-black transition-all shadow-lg"
                                      >
                                        <PhoneCall className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* Proxy Registry */}
                        <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-4 space-y-3 shadow-inner overflow-hidden flex flex-col">
                          <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight">
                              Proxy Registry
                            </h2>
                            <button
                              onClick={() => {
                                setNewContact({
                                  firstName: "",
                                  lastName: "",
                                  relationship: "Relative",
                                  phoneNumber: "",
                                  email: "",
                                });
                                setIsAddingProxy(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-[8px] font-black uppercase tracking-widest hover:bg-[var(--primary)] hover:text-black transition-all border border-[var(--primary)]/20 shadow-sm"
                            >
                              + Add Proxy
                            </button>
                          </div>

                          <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            {isAddingProxy && (
                              <div className="p-4 rounded-xl border border-[var(--primary)]/40 bg-[var(--primary)]/[0.04] space-y-3 animate-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                    value={newContact.firstName}
                                    onChange={(e) =>
                                      setNewContact({
                                        ...newContact,
                                        firstName: e.target.value,
                                      })
                                    }
                                    placeholder="First Name"
                                  />
                                  <input
                                    className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                    value={newContact.lastName}
                                    onChange={(e) =>
                                      setNewContact({
                                        ...newContact,
                                        lastName: e.target.value,
                                      })
                                    }
                                    placeholder="Last Name"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <select
                                    className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-2 text-[9px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-[var(--primary)]/50 [color-scheme:dark]"
                                    value={newContact.relationship}
                                    onChange={(e) =>
                                      setNewContact({
                                        ...newContact,
                                        relationship: e.target.value,
                                      })
                                    }
                                  >
                                    {Object.entries(RELATIONSHIP_LABELS)
                                      .filter(([k]) => k !== "Self")
                                      .map(([k, v]) => (
                                        <option key={k} value={k}>
                                          {v.toUpperCase()}
                                        </option>
                                      ))}
                                  </select>
                                  <input
                                    className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                    value={newContact.phoneNumber}
                                    onChange={(e) =>
                                      setNewContact({
                                        ...newContact,
                                        phoneNumber: formatPhoneNumber(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    placeholder="(XXX) XXX-XXXX"
                                  />
                                </div>
                                <input
                                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                  value={newContact.email}
                                  onChange={(e) =>
                                    setNewContact({
                                      ...newContact,
                                      email: e.target.value,
                                    })
                                  }
                                  placeholder="Email Address"
                                />
                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => setIsAddingProxy(false)}
                                    className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-[var(--text-muted)] hover:bg-white/5"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleAddContact}
                                    className="px-5 py-1.5 rounded-lg bg-[var(--primary)] text-black text-[8px] font-black uppercase tracking-widest shadow-lg"
                                  >
                                    Commit Proxy
                                  </button>
                                </div>
                              </div>
                            )}
                            {relativeContacts.map((contact: any) => (
                              <div key={contact.outreachContactId}>
                                {editingContactId ===
                                contact.outreachContactId ? (
                                  <div className="p-4 rounded-xl border border-[var(--primary)]/40 bg-[var(--primary)]/[0.02] space-y-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                        value={newContact.firstName}
                                        onChange={(e) =>
                                          setNewContact({
                                            ...newContact,
                                            firstName: e.target.value,
                                          })
                                        }
                                        placeholder="First Name"
                                      />
                                      <input
                                        className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                        value={newContact.lastName}
                                        onChange={(e) =>
                                          setNewContact({
                                            ...newContact,
                                            lastName: e.target.value,
                                          })
                                        }
                                        placeholder="Last Name"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <select
                                        className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-2 text-[9px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-[var(--primary)]/50 [color-scheme:dark]"
                                        value={newContact.relationship}
                                        onChange={(e) =>
                                          setNewContact({
                                            ...newContact,
                                            relationship: e.target.value,
                                          })
                                        }
                                      >
                                        {Object.entries(
                                          RELATIONSHIP_LABELS,
                                        ).map(([k, v]) => (
                                          <option key={k} value={k}>
                                            {v.toUpperCase()}
                                          </option>
                                        ))}
                                      </select>
                                      <input
                                        className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                        value={newContact.phoneNumber}
                                        onChange={(e) =>
                                          setNewContact({
                                            ...newContact,
                                            phoneNumber: formatPhoneNumber(
                                              e.target.value,
                                            ),
                                          })
                                        }
                                        placeholder="(XXX) XXX-XXXX"
                                      />
                                    </div>
                                    <input
                                      className="w-full bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                      value={newContact.email}
                                      onChange={(e) =>
                                        setNewContact({
                                          ...newContact,
                                          email: e.target.value,
                                        })
                                      }
                                      placeholder="Email Address"
                                    />
                                    <div className="flex justify-end gap-2 pt-1">
                                      <button
                                        onClick={() =>
                                          setEditingContactId(null)
                                        }
                                        className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-[var(--text-muted)] hover:bg-white/5"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={handleUpdateContact}
                                        className="px-5 py-1.5 rounded-lg bg-[var(--primary)] text-black text-[8px] font-black uppercase tracking-widest shadow-lg"
                                      >
                                        Commit Sync
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="group relative flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[var(--primary)]/30 transition-all">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 font-black text-xs shadow-inner shrink-0">
                                        {contact.firstName[0]}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight truncate">
                                          {contact.firstName} {contact.lastName}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[8px] font-black text-slate-400 tracking-tight shrink-0">
                                            {formatPhoneNumber(
                                              contact.phoneNumber,
                                            )}
                                          </span>
                                          {contact.email && (
                                            <>
                                              <span className="w-1 h-1 rounded-full bg-white/10" />
                                              <span className="text-[8px] font-bold text-slate-500 lowercase truncate">
                                                {contact.email}
                                              </span>
                                            </>
                                          )}
                                          <span className="text-[6px] font-black text-[var(--primary)]/50 uppercase tracking-widest italic truncate opacity-70">
                                            /{" "}
                                            {RELATIONSHIP_LABELS[
                                              contact.relationship
                                            ] || contact.relationship}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                                        <button
                                          onClick={() =>
                                            startEditingContact(contact)
                                          }
                                          className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all shadow-sm"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleRemoveContact(
                                              contact.outreachContactId,
                                            )
                                          }
                                          className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-rose-500 transition-all shadow-sm"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleCall({
                                            phone: contact.phoneNumber,
                                          })
                                        }
                                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-[var(--primary)] hover:text-black transition-all shadow-lg"
                                      >
                                        <PhoneCall className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                            {relativeContacts.length === 0 &&
                              !isAddingProxy && (
                                <div className="flex flex-col items-center justify-center py-4 opacity-20">
                                  <Users className="w-6 h-6 mb-1" />
                                  <p className="text-[7px] font-black uppercase tracking-widest">
                                    No Registered Proxies
                                  </p>
                                </div>
                              )}
                          </div>
                        </section>
                      </div>

                      {/* MISSION RESULT SECTION - STICKY FOOTER ACTION */}
                      <div className="sticky bottom-0 z-20 -mx-5 -mb-5 p-5 mt-auto bg-gradient-to-t from-[var(--sidebar-bg)] via-[var(--sidebar-bg)] to-transparent border-t border-[var(--card-border)] backdrop-blur-md space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                            Quick Disposition Action
                          </p>
                          <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-teal-500/50" />
                            <div className="w-1 h-1 rounded-full bg-teal-500/30" />
                            <div className="w-1 h-1 rounded-full bg-teal-500/10" />
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            {
                              id: "CONNECTED",
                              label: "Connected",
                              c: "bg-teal-500/10 border-teal-500/30 text-teal-500 hover:bg-teal-500 hover:text-black hover:border-transparent hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]",
                            },
                            {
                              id: "NO_ANSWER",
                              label: "No Answer",
                              c: "hover:text-amber-500",
                            },
                            {
                              id: "VOICEMAIL",
                              label: "Voicemail",
                              c: "hover:text-amber-500",
                            },
                            {
                              id: "BUSY",
                              label: "Busy",
                              c: "hover:text-amber-500",
                            },
                            {
                              id: "WRONG_NUMBER",
                              label: "Wrong #",
                              c: "hover:text-rose-500",
                            },
                            {
                              id: "DISCONNECTED",
                              label: "Disconnect",
                              c: "hover:text-rose-500",
                            },
                            {
                              id: "DNC",
                              label: "DNC",
                              c: "hover:text-rose-600",
                            },
                            {
                              id: "OPT_OUT",
                              label: "Opt Out",
                              c: "hover:text-rose-700",
                            },
                            {
                              id: "CALL_BACK",
                              label: "Recall",
                              c: "hover:text-[var(--primary)]",
                            },
                          ].map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => handleLogActivity(btn.id)}
                              className={`h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest transition-all active:scale-95 hover:bg-[var(--card-bg)] hover:border-[var(--primary)]/30 ${btn.c}`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* UNENROLL REASON MODAL */}
                      {showUnenrollModal && (
                        <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4">
                          <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                            onClick={() => setShowUnenrollModal(false)}
                          />
                          <div className="relative w-full max-w-md bg-[var(--sidebar-bg)] border border-rose-500/30 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                                  <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
                                    Reverse Enrollment
                                  </h3>
                                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest opacity-60">
                                    High-Authority Action
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowUnenrollModal(false)}
                                className="text-[var(--text-muted)] hover:text-rose-500"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="space-y-6">
                              <p className="text-[10px] font-medium text-[var(--text-secondary)] leading-relaxed">
                                You are about to deactivate this clinical record
                                and return the patient to lead status. Please
                                provide a forensic reason for this reversal.
                              </p>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                  Reversal Reason / Notes
                                </label>
                                <textarea
                                  value={logNotes}
                                  onChange={(e) => setLogNotes(e.target.value)}
                                  placeholder="e.g., Admitted in error, duplicate record, or patient request..."
                                  rows={4}
                                  className="w-full bg-[var(--input-bg)] border border-rose-500/20 rounded-2xl px-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-rose-500/50 resize-none shadow-inner"
                                />
                              </div>

                              <div className="flex gap-3 pt-2">
                                <button
                                  onClick={() => setShowUnenrollModal(false)}
                                  className="flex-1 h-12 rounded-xl bg-white/5 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                  Abort
                                </button>
                                <PermissionGate permission="patients:enrollment">
                                  <button
                                    onClick={confirmUnenroll}
                                    disabled={!logNotes}
                                    className="flex-[2] h-12 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all active:scale-95 disabled:opacity-20"
                                  >
                                    Commit Reversal
                                  </button>
                                </PermissionGate>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {showDispositionModal && (
                        <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4">
                          <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setShowDispositionModal(false)}
                          />
                          <div className="relative w-full max-w-md bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
                                  <ClipboardCheck className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
                                    Capture Disposition
                                  </h3>
                                  <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest opacity-60">
                                    Status: {pendingOutcome}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowDispositionModal(false)}
                                className="text-[var(--text-muted)] hover:text-rose-500"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="space-y-6">
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                  Interaction Notes / Reason
                                </label>
                                <textarea
                                  value={logNotes}
                                  onChange={(e) => setLogNotes(e.target.value)}
                                  placeholder="Provide clinical context or specific outcome reason..."
                                  rows={4}
                                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl px-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 resize-none shadow-inner"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                  Next Follow-Up Plan
                                </label>
                                <div className="relative">
                                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--primary)] opacity-40" />
                                  <input
                                    type="date"
                                    value={followUpDate}
                                    onChange={(e) =>
                                      setFollowUpDate(e.target.value)
                                    }
                                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-11 pr-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 [color-scheme:dark]"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-3 pt-2">
                                <button
                                  onClick={() => setShowDispositionModal(false)}
                                  className="flex-1 h-12 rounded-xl bg-white/5 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                  Abort
                                </button>
                                <PermissionGate permission="outreach:manage">
                                  <button
                                    onClick={confirmLogActivity}
                                    className="flex-[2] h-12 rounded-xl bg-[var(--primary)] text-black text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.4)] transition-all active:scale-95"
                                  >
                                    Commit Disposition
                                  </button>
                                </PermissionGate>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "LEGAL" && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      {/* LEGAL DOCUMENT VAULT */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <FolderLock className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Legal Document Vault
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            {
                              id: "hipaa",
                              label: "HIPAA Notice",
                              sub: "Privacy practices tagged",
                              state: consentHIPAA,
                              set: setConsentHIPAA,
                              icon: <ShieldCheck className="w-4 h-4" />,
                            },
                            {
                              id: "poa",
                              label: "Power of Attorney",
                              sub: "Legal representative verified",
                              state: legalDocs.poa,
                              set: (v: boolean) =>
                                setLegalDocs((p) => ({ ...p, poa: v })),
                              icon: <Scale className="w-4 h-4" />,
                            },
                            {
                              id: "treat",
                              label: "Consent to Treat",
                              sub: "Clinical authorization tagged",
                              state: consentTreat,
                              set: setConsentTreat,
                              icon: <Heart className="w-4 h-4" />,
                            },
                            {
                              id: "adv",
                              label: "Advance Directive",
                              sub: "Living will / Proxy verified",
                              state: legalDocs.advanceDirective,
                              set: (v: boolean) =>
                                setLegalDocs((p) => ({
                                  ...p,
                                  advanceDirective: v,
                                })),
                              icon: <FileSignature className="w-4 h-4" />,
                            },
                          ].map((c) => (
                            <button
                              key={c.id}
                              onClick={() => c.set(!c.state)}
                              className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 group relative overflow-hidden
                              ${c.state ? "bg-teal-500/10 border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.1)]" : "bg-[var(--input-bg)] border-[var(--card-border)] opacity-60 hover:opacity-100"}`}
                            >
                              <div className="flex items-center justify-between">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                  ${c.state ? "bg-teal-500 text-black" : "bg-[var(--card-bg)] text-[var(--text-muted)]"}`}
                                >
                                  {c.icon}
                                </div>
                                {c.state && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                                )}
                              </div>
                              <div className="text-left">
                                <p
                                  className={`text-[10px] font-black uppercase tracking-widest ${c.state ? "text-teal-500" : "text-[var(--text-primary)]"}`}
                                >
                                  {c.label}
                                </p>
                                <p className="text-[8px] font-bold text-[var(--text-muted)] mt-0.5 uppercase tracking-tight">
                                  {c.sub}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* DIGITAL CONSENT SEAL */}
                        <div className="mt-8 bg-gradient-to-br from-teal-500/5 to-transparent border border-teal-500/20 rounded-3xl p-8 relative overflow-hidden group/seal">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/seal:opacity-30 transition-opacity">
                            <Fingerprint className="w-24 h-24 text-teal-500" />
                          </div>

                          <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                                <Shield className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">
                                  Digital Consent Handshake
                                </h4>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight mt-1 opacity-60">
                                  Authorize clinical data ingestion and
                                  treatment protocol.
                                </p>
                              </div>
                            </div>

                            {isConsentSealed ? (
                              <div className="bg-teal-500 rounded-2xl p-5 flex items-center justify-between shadow-xl shadow-teal-500/20 animate-in zoom-in duration-500">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white">
                                    <FileCheck className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-black font-black text-[10px] uppercase tracking-widest">
                                      Seal Established
                                    </p>
                                    <p className="text-teal-900 text-[8px] font-bold uppercase tracking-tight mt-0.5 opacity-70">
                                      Token: {consentToken}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-black font-black text-[10px] uppercase tracking-tight">
                                    {consentTimestamp}
                                  </p>
                                  <p className="text-teal-900 text-[8px] font-bold uppercase tracking-widest mt-0.5">
                                    Verified
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <PermissionGate permission="patients:enrollment">
                                <button
                                  onClick={() => {
                                    setIsConsentSealed(true);
                                    setConsentTimestamp(
                                      new Date().toLocaleString(),
                                    );
                                    setConsentToken(
                                      `HAL-${Math.random().toString(36).substring(7).toUpperCase()}`,
                                    );
                                    setConsentTreat(true);
                                    setConsentHIPAA(true);
                                    showToast(
                                      "Clinical Consent Seal Established",
                                      "success",
                                    );
                                  }}
                                  className="w-full h-16 rounded-2xl bg-[var(--sidebar-bg)] border border-teal-500/30 text-teal-500 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-teal-500/10 transition-all flex items-center justify-center gap-4 group/btn shadow-inner"
                                >
                                  <Fingerprint className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                  Establish Digital Seal
                                </button>
                              </PermissionGate>
                            )}

                            <p className="text-[8px] font-medium text-[var(--text-muted)] leading-relaxed italic opacity-40 px-2">
                              By establishing this seal, the practitioner
                              verifies that verbal or written consent has been
                              obtained from the patient or legal representative
                              according to clinical protocol HAL-PR-01.
                            </p>
                          </div>
                        </div>
                      </section>

                      {/* COMMUNICATION PREFERENCES */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Communication Modality
                          </h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Preferred Method
                              </label>
                              <select
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] [color-scheme:dark]"
                                value={preferredContact}
                                onChange={(e) =>
                                  setPreferredContact(e.target.value)
                                }
                              >
                                <option value="PHONE">TELEPHONE</option>
                                <option value="SMS">SMS / TEXT</option>
                                <option value="EMAIL">ELECTRONIC MAIL</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Language Modality
                              </label>
                              <button
                                onClick={() =>
                                  setInterpreterRequired(!interpreterRequired)
                                }
                                className={`w-full h-[41px] rounded-xl flex items-center justify-center border text-[9px] font-black uppercase tracking-widest transition-all
                                ${interpreterRequired ? "bg-rose-500/10 border-rose-500 text-rose-500" : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]"}`}
                              >
                                {interpreterRequired
                                  ? "INTERPRETER REQUIRED"
                                  : "NO INTERPRETER"}
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
                      {/* DEMOGRAPHICS SECTION - ALWAYS EDITABLE IN ENROLLMENT */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Patient Demographics
                          </h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Date of Birth
                              </label>
                              <input
                                type="date"
                                value={patientDob}
                                onChange={(e) => setPatientDob(e.target.value)}
                                onClick={(e) => e.currentTarget.showPicker()}
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Biological Sex
                              </label>
                              <select
                                value={patientSex}
                                onChange={(e) =>
                                  setPatientSex(e.target.value as BiologicalSex)
                                }
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none [color-scheme:dark]"
                              >
                                <option value="">Select...</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                                <option value="UNKNOWN">Unknown</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Gender Identity
                              </label>
                              <input
                                type="text"
                                value={genderIdentity}
                                onChange={(e) =>
                                  setGenderIdentity(e.target.value)
                                }
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                placeholder="Identity..."
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Primary Language
                              </label>
                              <input
                                type="text"
                                value={patientLanguage}
                                onChange={(e) =>
                                  setPatientLanguage(e.target.value)
                                }
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                placeholder="Language..."
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                              Clinical Facility / Location
                            </label>
                            <div className="relative group/facility">
                              <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/facility:text-[var(--primary)] transition-colors" />
                              <select
                                value={selectedFacilityId}
                                onChange={(e) =>
                                  setSelectedFacilityId(e.target.value)
                                }
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-10 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/40 transition-all appearance-none [color-scheme:dark]"
                              >
                                <option value="">
                                  PRIVATE RESIDENCE / HOME CARE
                                </option>
                                {(enrollmentData?.facilities || []).map(
                                  (f: any) => (
                                    <option
                                      key={f.facilityId}
                                      value={f.facilityId}
                                    >
                                      {f.name} ({f.type})
                                    </option>
                                  ),
                                )}
                              </select>
                              <ChevronRight className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] rotate-90 pointer-events-none" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                              Marital / Civil Status
                            </label>
                            <select
                              value={civilStatus}
                              onChange={(e) => setCivilStatus(e.target.value)}
                              className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none [color-scheme:dark]"
                            >
                              <option value="">Select...</option>
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Divorced">Divorced</option>
                              <option value="Widowed">Widowed</option>
                              <option value="Common Law">Common Law</option>
                            </select>
                          </div>
                        </div>
                      </section>
                      {/* Address Management HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Deployment Destination
                          </h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner relative group/address">
                          {!isEditingAddress ? (
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider">
                                    {address.street || "NO STREET SPECIFIED"}
                                  </p>
                                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                    {address.city}, {address.state}{" "}
                                    {address.postalCode}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setIsEditingAddress(true)}
                                  className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--primary)] opacity-0 group-hover/address:opacity-100 transition-all"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={handleVerifyAddress}
                                className="w-full h-10 bg-transparent border border-[var(--primary)]/30 text-[var(--primary)] font-black text-[9px] uppercase tracking-[0.2em] rounded-xl hover:bg-[var(--primary)]/5 transition-all"
                              >
                                {isVerifyingAddress
                                  ? "SCRUBBING GEODATA..."
                                  : "Verify & Standardize Address"}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-5 animate-in fade-in duration-300">
                              <div className="space-y-1.5">
                                <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                  Street Address
                                </label>
                                <input
                                  type="text"
                                  value={address.street}
                                  onChange={(e) =>
                                    setAddress({
                                      ...address,
                                      street: e.target.value,
                                    })
                                  }
                                  className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                  placeholder="Street..."
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                    City / Region
                                  </label>
                                  <input
                                    type="text"
                                    value={address.city}
                                    onChange={(e) =>
                                      setAddress({
                                        ...address,
                                        city: e.target.value,
                                      })
                                    }
                                    className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                    placeholder="City..."
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                    Postal Code
                                  </label>
                                  <input
                                    type="text"
                                    value={address.postalCode}
                                    onChange={(e) =>
                                      setAddress({
                                        ...address,
                                        postalCode: e.target.value,
                                      })
                                    }
                                    className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                    placeholder="Zip..."
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setIsEditingAddress(false)}
                                  className="flex-1 h-9 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] font-bold text-[9px] uppercase tracking-widest rounded-xl"
                                >
                                  Discard
                                </button>
                                <button
                                  onClick={() => setIsEditingAddress(false)}
                                  className="flex-1 h-9 bg-teal-500 text-black font-bold text-[9px] uppercase tracking-widest rounded-xl"
                                >
                                  Commit Change
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Insurance Vault */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Financial Coverage Vault
                          </h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Health Plan Assignment
                              </label>
                              <select
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 [color-scheme:dark]"
                                value={selectedPlan}
                                onChange={(e) =>
                                  setSelectedPlan(e.target.value)
                                }
                              >
                                <option value="">Select Plan...</option>
                                {enrollmentData?.healthPlans?.map((p: any) => (
                                  <option
                                    key={p.healthPlanId}
                                    value={p.healthPlanId}
                                  >
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Eligibility Status
                              </label>
                              <div
                                className={`w-full h-[41px] rounded-xl flex items-center justify-center border text-[9px] font-black uppercase tracking-widest
                                    ${eligibilityStatus === "VERIFIED" ? "bg-teal-500/10 border-teal-500/30 text-teal-500" : "bg-amber-500/10 border-amber-500/30 text-amber-500"}`}
                              >
                                {eligibilityStatus}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Member ID
                              </label>
                              <input
                                type="text"
                                value={memberId}
                                onChange={(e) => setMemberId(e.target.value)}
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                placeholder="ID..."
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Next Follow-Up (Due Date)
                              </label>
                              <div className="relative group/date">
                                <Calendar className="w-3.5 h-3.5 absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover/date:text-[var(--primary)] transition-colors pointer-events-none" />
                                <input
                                  type="date"
                                  value={followUpDate}
                                  onChange={(e) =>
                                    setFollowUpDate(e.target.value)
                                  }
                                  onClick={(e) => e.currentTarget.showPicker()}
                                  className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Communication Status
                              </label>
                              <select
                                value={communicationStatus}
                                onChange={(e) =>
                                  setCommunicationStatus(
                                    e.target.value as CommunicationAbility,
                                  )
                                }
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none"
                              >
                                <option value="Verbal">Verbal</option>
                                <option value="NonVerbal">Non-Verbal</option>
                                <option value="Aphasic">Aphasic</option>
                                <option value="SpeechImpaired">
                                  Speech Impaired
                                </option>
                                <option value="CognitiveImpairment">
                                  Cognitive Impairment
                                </option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Group Number
                              </label>

                              <input
                                type="text"
                                value={groupId}
                                onChange={(e) => setGroupId(e.target.value)}
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                placeholder="GROUP..."
                              />
                            </div>
                          </div>
                          <PermissionGate permission="patients:enrollment">
                            <button
                              onClick={verifyInsurance}
                              disabled={
                                isVerifyingInsurance ||
                                eligibilityStatus === "VERIFIED"
                              }
                              className={`w-full h-11 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-2
                                ${eligibilityStatus === "VERIFIED" ? "bg-teal-500/10 border border-teal-500/30 text-teal-500 cursor-default" : "bg-[var(--primary)] text-black hover:scale-[1.01] active:scale-[0.98]"}`}
                            >
                              {isVerifyingInsurance ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                  Pinging Payer Gateway...
                                </>
                              ) : eligibilityStatus === "VERIFIED" ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Verified: {insuranceRef}
                                </>
                              ) : (
                                "Verify Eligibility Status"
                              )}
                            </button>
                          </PermissionGate>
                        </div>
                      </section>

                      {/* Referral HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Referral source details
                          </h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-6 border border-[var(--card-border)] space-y-6 shadow-inner">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                              Referring Physician / Facility
                            </label>
                            <div className="relative group/doc">
                              <Stethoscope className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/doc:text-[var(--primary)] transition-colors" />
                              <input
                                type="text"
                                value={referringPhysician}
                                onChange={(e) =>
                                  setReferringPhysician(e.target.value)
                                }
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl py-3.5 pl-11 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all"
                                placeholder="ENTER PRACTITIONER NAME..."
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                NPI Number (Registry ID)
                              </label>
                              <div className="relative group/npi">
                                <Fingerprint className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/npi:text-[var(--primary)] transition-colors" />
                                <input
                                  type="text"
                                  value={npi}
                                  onChange={(e) => setNpi(e.target.value)}
                                  className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-11 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all"
                                  placeholder="10-DIGIT IDENTIFIER..."
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Referral Receipt Date
                              </label>
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
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Clinical Intake Triage
                          </h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-6 border border-[var(--card-border)] space-y-6 shadow-inner">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                              Primary Diagnosis (ICD-10 Search)
                            </label>
                            <div className="relative group/icd10">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/icd10:text-[var(--primary)] transition-colors" />
                              <input
                                type="text"
                                value={primaryDiagnosis}
                                onChange={(e) =>
                                  setPrimaryDiagnosis(e.target.value)
                                }
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
                                        setPrimaryDiagnosis(
                                          `${res.icd10Code} - ${res.description}`,
                                        );
                                        setShowIcd10Search(false);
                                      }}
                                      className="w-full px-4 py-3 text-left hover:bg-[var(--primary)]/10 transition-colors border-b border-[var(--card-border)] last:border-0 group/item"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-[var(--primary)]">
                                          {res.icd10Code}
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover/item:opacity-100 transition-all" />
                                      </div>
                                      <p className="text-[9px] font-bold text-[var(--text-primary)] mt-1 line-clamp-1">
                                        {res.description}
                                      </p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {["LOW", "MODERATE", "HIGH"].map((v) => (
                              <button
                                key={v}
                                onClick={() => setAcuity(v)}
                                className={`h-10 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all
                                    ${acuity === v ? "bg-rose-500/10 border-rose-500 text-rose-500" : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]"}`}
                              >
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
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Social Determinants (SDoH)
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                              Housing Stability
                            </label>
                            <div className="space-y-1.5">
                              {["STABLE", "AT_RISK", "UNSTABLE"].map((v) => (
                                <button
                                  key={v}
                                  onClick={() => setSdohHousing(v)}
                                  className={`w-full h-8 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${sdohHousing === v ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--input-bg)]"}`}
                                >
                                  {v.replace("_", " ")}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                              Social Support
                            </label>
                            <div className="space-y-1.5">
                              {["ADEQUATE", "LIMITED", "NONE"].map((v) => (
                                <button
                                  key={v}
                                  onClick={() => setSdohSupport(v)}
                                  className={`w-full h-8 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${sdohSupport === v ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--input-bg)]"}`}
                                >
                                  {v}
                                </button>
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
                          <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] border-l-2 border-[var(--primary)] pl-3">
                            Visit Modality
                          </h3>
                        </div>
                        <div className="grid grid-cols-4 gap-2.5">
                          {[
                            {
                              id: "HomeCare",
                              label: "Home Visit",
                              icon: <Home className="w-4 h-4" />,
                            },
                            {
                              id: "InPatientHospice",
                              label: "Facility",
                              icon: <Building2 className="w-4 h-4" />,
                            },
                            {
                              id: "VirtualCare",
                              label: "Video Call",
                              icon: <Video className="w-4 h-4" />,
                            },
                            {
                              id: "HybridCare",
                              label: "Audio Only",
                              icon: <PhoneCall className="w-4 h-4" />,
                            },
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setModality(m.id as CareModality)}
                              className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-2xl border text-[9px] font-bold transition-all
                                     ${modality === m.id ? "bg-[var(--primary)] border-transparent text-black shadow-lg shadow-[var(--primary-glow)]" : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)]"}`}
                            >
                              {m.icon}
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* 01-B: VISIT DURATION */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] border-l-2 border-[var(--primary)] pl-3">
                            Visit Duration
                          </h3>
                        </div>
                        <div className="flex bg-[var(--input-bg)] rounded-2xl p-1.5 border border-[var(--card-border)] shadow-inner">
                          {[30, 45, 60, 90, 120].map((d) => (
                            <button
                              key={d}
                              onClick={() => setDuration(d)}
                              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all
                                ${duration === d ? "bg-[var(--primary)] text-black shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                            >
                              {d} MIN
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* 02: CLINICAL TEAM ASSIGNMENT */}
                      <section className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] border-l-2 border-[var(--primary)] pl-3">
                              Clinical Team assignment
                            </h3>
                          </div>
                          <div className="relative group">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                              placeholder="Filter Practitioners..."
                              value={staffSearch}
                              onChange={(e) => setStaffSearch(e.target.value)}
                              className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full py-1.5 pl-9 pr-4 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/40 w-32 focus:w-48 transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-5">
                          {/* Care Navigator Selection */}
                          <div>
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 px-1">
                              Care Navigator Assignment
                            </p>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-hide">
                              {availabilityLoading &&
                              practitioners.length === 0 ? (
                                <div className="col-span-2 py-4 flex flex-col items-center justify-center opacity-30">
                                  <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-2" />
                                  <p className="text-[8px] font-bold uppercase tracking-widest">
                                    Scanning Availability...
                                  </p>
                                </div>
                              ) : (
                                practitioners
                                  .filter(
                                    (p: any) =>
                                      p.isCareNavigator &&
                                      (!staffSearch ||
                                        p.fullName
                                          .toLowerCase()
                                          .includes(staffSearch.toLowerCase())),
                                  )
                                  .map((p: any) => {
                                    const avail = availability.get(
                                      p.practitionerId,
                                    );
                                    const isSelected =
                                      careNavigatorId === p.practitionerId;
                                    return (
                                      <button
                                        key={p.practitionerId}
                                        onClick={() =>
                                          setCareNavigatorId(p.practitionerId)
                                        }
                                        className={`p-3 rounded-xl border text-left transition-all group relative overflow-hidden ${isSelected ? "bg-teal-500/10 border-teal-500 shadow-sm" : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-teal-500/30"}`}
                                      >
                                        <div className="flex justify-between items-start gap-2">
                                          <div className="min-w-0 flex-1">
                                            <p
                                              className={`text-[10px] font-black truncate leading-tight ${isSelected ? "text-teal-500" : "text-[var(--text-primary)]"}`}
                                            >
                                              {p.fullName}
                                            </p>
                                            <p className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1 opacity-60">
                                              Patient Navigation
                                            </p>
                                          </div>
                                          {avail && (
                                            <div
                                              className={`flex flex-col items-end shrink-0 ${isSelected ? "text-teal-500" : "text-[var(--text-primary)]"}`}
                                            >
                                              <span className="text-[10px] font-black leading-none">
                                                {avail.travelTimeInMinutes}M
                                              </span>
                                              <span className="text-[7px] font-bold opacity-50 mt-1 uppercase tracking-tighter">
                                                {avail.distanceInMiles.toFixed(
                                                  1,
                                                )}
                                                MI
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        {!avail && !availabilityLoading && (
                                          <div className="mt-2 flex items-center gap-1 opacity-30">
                                            <Car className="w-2 h-2" />
                                            <span className="text-[7px] font-bold uppercase tracking-tighter">
                                              Scan Unavailable
                                            </span>
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })
                              )}
                            </div>
                          </div>

                          {/* Primary Lead Selection */}
                          <div>
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 px-1">
                              Primary Clinician Lead
                            </p>
                            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto scrollbar-hide">
                              {availabilityLoading &&
                              practitioners.length === 0 ? (
                                <div className="col-span-2 py-4 flex flex-col items-center justify-center opacity-30">
                                  <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-2" />
                                  <p className="text-[8px] font-bold uppercase tracking-widest">
                                    Scanning Availability...
                                  </p>
                                </div>
                              ) : (
                                practitioners
                                  .filter(
                                    (p: any) =>
                                      p.isSupportingClinician &&
                                      (!staffSearch ||
                                        p.fullName
                                          .toLowerCase()
                                          .includes(staffSearch.toLowerCase())),
                                  )
                                  .map((p: any) => {
                                    const avail = availability.get(
                                      p.practitionerId,
                                    );
                                    const isSelected =
                                      primaryClinicianId === p.practitionerId;
                                    return (
                                      <button
                                        key={p.practitionerId}
                                        onClick={() =>
                                          setPrimaryClinicianId(
                                            p.practitionerId,
                                          )
                                        }
                                        className={`p-3 rounded-xl border text-left transition-all group relative overflow-hidden ${isSelected ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm" : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/30"}`}
                                      >
                                        <div className="flex justify-between items-start gap-2">
                                          <div className="min-w-0 flex-1">
                                            <p
                                              className={`text-[10px] font-black truncate leading-tight ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}
                                            >
                                              {p.fullName}
                                            </p>
                                            <p className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1 opacity-60">
                                              Lead Practitioner
                                            </p>
                                          </div>
                                          {avail && (
                                            <div
                                              className={`flex flex-col items-end shrink-0 ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}
                                            >
                                              <span className="text-[10px] font-black leading-none">
                                                {avail.travelTimeInMinutes}M
                                              </span>
                                              <span className="text-[7px] font-bold opacity-50 mt-1 uppercase tracking-tighter">
                                                {avail.distanceInMiles.toFixed(
                                                  1,
                                                )}
                                                MI
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        {!avail && !availabilityLoading && (
                                          <div className="mt-2 flex items-center gap-1 opacity-30">
                                            <Car className="w-2 h-2" />
                                            <span className="text-[7px] font-bold uppercase tracking-tighter">
                                              Scan Unavailable
                                            </span>
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })
                              )}
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}
                </div>

                {/* RIGHT TELEMETRY PANEL */}
                <div className="w-[380px] flex flex-col bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] relative">
                  <div className="flex-1 relative overflow-hidden flex flex-col">
                    {(activeTab !== "LOGISTICS" ||
                      !checkStepCompleteness("CLINICAL")) && (
                      <div className="absolute inset-0 z-[60] bg-[var(--sidebar-bg)]/80 backdrop-blur-sm flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-300">
                        <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
                          <FolderLock className="w-8 h-8" />
                        </div>
                        <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em] mb-3">
                          {!checkStepCompleteness("CLINICAL")
                            ? "Clinical Block"
                            : "Logistics Gate"}
                        </h3>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-relaxed opacity-60 max-w-[200px]">
                          {!checkStepCompleteness("CLINICAL")
                            ? "Complete Clinical Intake to Unlock Scheduling"
                            : "Advance to the Logistics phase to enable scheduling controls"}
                        </p>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                      {/* TOP METRICS (2-COLUMN) - Luxury Upgrade */}
                      <div className="grid grid-cols-2 gap-5 pb-8 border-b border-[var(--card-border)] shrink-0 relative">
                        <div className="absolute -bottom-px left-0 w-1/2 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

                        <div className="space-y-2 group/metric">
                          <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] group-hover/metric:text-teal-500 transition-colors">
                            <Navigation className="w-3.5 h-3.5" />
                            Travel Distance
                          </div>
                          <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">
                            {selectedLogistics ? (
                              <>
                                {selectedLogistics.distanceInMiles.toFixed(1)}
                                <span className="text-xs font-bold opacity-30 ml-1.5 tracking-widest uppercase">
                                  MI
                                </span>
                              </>
                            ) : !careNavigatorId && !primaryClinicianId ? (
                              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 flex items-center gap-1.5 h-9">
                                <Users className="w-3.5 h-3.5" /> Select Team
                              </span>
                            ) : (
                              <div className="flex items-baseline gap-1.5 h-9">
                                <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">
                                  Calculating...
                                </span>
                              </div>
                            )}
                          </p>
                        </div>

                        <div className="space-y-2 group/metric">
                          <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] group-hover/metric:text-teal-500 transition-colors">
                            <Timer className="w-3.5 h-3.5" />
                            Duration
                          </div>
                          <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">
                            {selectedLogistics ? (
                              <>
                                {selectedLogistics.travelTimeInMinutes}
                                <span className="text-xs font-bold opacity-30 ml-1.5 tracking-widest uppercase">
                                  MIN
                                </span>
                              </>
                            ) : !careNavigatorId && !primaryClinicianId ? (
                              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 flex items-center gap-1.5 h-9">
                                <Clock className="w-3.5 h-3.5" /> Awaiting
                                Choice
                              </span>
                            ) : (
                              <div className="flex items-baseline gap-1.5 h-9">
                                <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">
                                  Syncing...
                                </span>
                              </div>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* LOCATION DETAILS (FULL WIDTH) */}
                      <div className="bg-[var(--input-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-inner">
                        <h3 className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> Location Details
                        </h3>
                        <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight leading-relaxed">
                          {lead.mailingAddress?.street}
                          <br />
                          <span className="opacity-60">
                            {lead.mailingAddress?.city},{" "}
                            {lead.mailingAddress?.state}{" "}
                            {lead.mailingAddress?.postalCode}
                          </span>
                        </p>
                      </div>

                      {/* SCHEDULING STRATEGY TOGGLE */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">
                            Scheduling Strategy
                          </p>
                          <span
                            className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${scheduleIntakeNow ? "bg-teal-500/10 border-teal-500/30 text-teal-500" : "bg-amber-500/10 border-amber-500/30 text-amber-500"}`}
                          >
                            {scheduleIntakeNow
                              ? "Instant Intake"
                              : "Schedule Later"}
                          </span>
                        </div>

                        <div className="flex bg-[var(--input-bg)] rounded-2xl p-1.5 border border-[var(--card-border)] shadow-inner">
                          <button
                            onClick={() => setScheduleIntakeNow(true)}
                            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                          ${scheduleIntakeNow ? "bg-teal-500 text-black shadow-lg shadow-teal-500/20" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                            Book Now
                          </button>
                          <button
                            onClick={() => setScheduleIntakeNow(false)}
                            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                          ${!scheduleIntakeNow ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
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
                              <span className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em]">
                                {monthNames[viewDate.getMonth()]}
                              </span>
                              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">
                                {viewDate.getFullYear()}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  setViewDate(
                                    new Date(
                                      viewDate.getFullYear(),
                                      viewDate.getMonth() - 1,
                                    ),
                                  )
                                }
                                className="w-9 h-9 flex items-center justify-center hover:bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] transition-all text-[var(--text-muted)] hover:text-[var(--primary)]"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setViewDate(
                                    new Date(
                                      viewDate.getFullYear(),
                                      viewDate.getMonth() + 1,
                                    ),
                                  )
                                }
                                className="w-9 h-9 flex items-center justify-center hover:bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] transition-all text-[var(--text-muted)] hover:text-[var(--primary)]"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-7 gap-1.5 relative z-10">
                            {renderCalendar()}
                          </div>
                        </div>

                        <div className="flex bg-[var(--input-bg)]/50 rounded-2xl p-2 border border-[var(--card-border)] gap-2 shadow-inner">
                          {(["AM", "PM"] as const).map((p) => (
                            <button
                              key={p}
                              onClick={() => setPeriod(p)}
                              className={`flex-1 py-4 rounded-xl text-[11px] font-black tracking-[0.3em] transition-all uppercase flex items-center justify-center gap-3
                            ${period === p ? "bg-teal-500 text-black shadow-[0_0_25px_rgba(20,184,166,0.3)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"}`}
                            >
                              {p === "AM" ? (
                                <Sun className="w-4 h-4" />
                              ) : (
                                <Wind className="w-4 h-4" />
                              )}
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
                              <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                                No Activity Logged
                              </p>
                            </div>
                          ) : (
                            lead.activities.map((a: any) => (
                              <div
                                key={a.outreachActivityId}
                                className="flex gap-4 group/item"
                              >
                                <div className="flex flex-col items-center pt-1.5">
                                  <div
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${a.outcome === "CONNECTED" ? "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.6)]" : "bg-[var(--card-border)] group-hover/item:bg-[var(--text-muted)]"}`}
                                  />
                                  <div className="w-px flex-1 bg-gradient-to-b from-[var(--card-border)] to-transparent my-2" />
                                </div>
                                <div className="pb-5 border-b border-[var(--card-border)]/30 flex-1 group-hover/item:border-[var(--primary)]/20 transition-colors">
                                  <div className="flex justify-between items-center mb-2">
                                    <p
                                      className={`text-[10px] font-black uppercase tracking-widest ${a.outcome === "CONNECTED" ? "text-teal-500" : "text-[var(--text-primary)]"}`}
                                    >
                                      {a.outcome.replace("_", " ")}
                                    </p>
                                    <p className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-0.5 rounded-md border border-[var(--card-border)]">
                                      {new Date(
                                        a.activityDate,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {a.reason && (
                                    <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.1em] mb-1.5">
                                      {a.reason}
                                    </p>
                                  )}
                                  <div className="relative">
                                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic opacity-80 pl-3 border-l-2 border-[var(--card-border)]">
                                      {a.notes}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STICKY FOOTER CONTROLS - Contextual Sidebar Dock */}
                  <div className="p-5 border-t border-[var(--card-border)] bg-[var(--sidebar-bg)]/95 backdrop-blur-3xl shrink-0 relative z-[70]">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />

                    <div className="flex flex-col gap-3">
                      {leadData?.outreachById?.status === "ENROLLED" ? (
                        <PermissionGate permission="patients:enrollment">
                          <button
                            onClick={handleUnenroll}
                            disabled={unenrolling}
                            className="w-full h-11 bg-rose-500 rounded-xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2 group"
                          >
                            <Trash2 className="w-3.5 h-3.5 group-hover:shake" />
                            {unenrolling
                              ? "REVERSING..."
                              : "REVERSE ENROLLMENT"}
                          </button>
                        </PermissionGate>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <button
                              onClick={handleBack}
                              disabled={activeTab === "OUTREACH"}
                              className={`w-24 h-11 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2
                                ${activeTab === "OUTREACH" ? "opacity-20 cursor-not-allowed bg-transparent border-[var(--card-border)] text-[var(--text-muted)]" : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/50"}`}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              Back
                            </button>

                            {activeTab === "LOGISTICS" ? (
                              <PermissionGate permission="patients:enrollment">
                                <button
                                  onClick={handleFinalize}
                                  disabled={finalizing}
                                  className="flex-1 h-11 bg-gradient-to-br from-[var(--primary)] to-teal-500 rounded-xl text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[var(--primary-glow)] hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2 group overflow-hidden relative"
                                >
                                  <ShieldCheck className="w-4 h-4 relative z-10" />
                                  <span className="relative z-10">
                                    {finalizing ? "ENROLLING..." : "ENROLL"}
                                  </span>
                                </button>
                              </PermissionGate>
                            ) : (
                              <button
                                onClick={handleNext}
                                className="flex-1 h-11 bg-[var(--primary)] rounded-xl text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[var(--primary-glow)] hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2 group"
                              >
                                <span>Next Step</span>
                                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
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
