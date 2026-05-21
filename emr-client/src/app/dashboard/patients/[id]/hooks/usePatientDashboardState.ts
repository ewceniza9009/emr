"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import * as signalR from "@microsoft/signalr";
import { useRecentlyBrowsed } from "@/hooks/useRecentlyBrowsed";
import { useCommandModal } from "@/components/CommandModalProvider";

export const CREATE_ENCOUNTER = gql`
  mutation CreateEncounter($input: CreateClinicalEncounterCommandInput!) {
    createClinicalEncounter(input: $input)
  }
`;

export const UPDATE_PATIENT = gql`
  mutation UpdatePatientDemographics($command: UpdatePatientCommandInput!) {
    updatePatientDemographics(command: $command)
  }
`;

export const GET_PATIENT_DETAILS = gql`
  query GetPatientDetails($id: UUID!) {
    patientById(patientId: $id) {
      patientId
      mrn
      firstName
      lastName
      primaryCareNavigatorName
      dob
      deviceSignature
      biologicalSex
      addresses {
        isPrimary
        address {
          street
          city
          state
          postalCode
          region
          country
          latitude
          longitude
        }
      }
      phones {
        phoneNumber
        type
        isPrimary
      }
      emails {
        emailAddress
        type
        isPrimary
      }
      civilStatus
      religion
      occupation
      placeOfBirth
      nationality
      language
      biologicalSex
      genderIdentity
      contacts {
        patientContactId
        firstName
        lastName
        relationship
        phone
        email
        isPoa
        isLegalGuardian
        isPrimaryContact
        notes
      }
      documents {
        patientDocumentId
        title
        documentType
        storageUrl
        uploadedAt
        patientContactId
      }
      encounters {
        encounterId
        type
        status
        encounterDate
        practitioner {
          practitionerId
          firstName
          lastName
        }
        clinicalNotes {
          noteId
          content
          type
        }
      }
    }
  }
`;

export const GET_PATIENT_APPOINTMENTS = gql`
  query GetPatientAppointments($id: UUID!) {
    appointments(patientId: $id) {
      items {
        appointmentId
        scheduledStart
        scheduledEnd
        status
        modality
        visitType
        practitioner {
          practitionerId
          firstName
          lastName
        }
        encounters {
          encounterId
          practitioner {
            practitionerId
            firstName
            lastName
          }
        }
      }
    }
  }
`;

export const GET_CLINICAL_SUMMARY = gql`
  query GetClinicalSummary($patientId: UUID!) {
    patientClinicalSummary(patientId: $patientId) {
      recentVitals {
        type
        value
        unit
      }
    }
  }
`;

export const DELETE_CONTACT = gql`
  mutation DeleteContact($command: DeleteContactCommandInput!) {
    deleteContact(command: $command)
  }
`;

export function usePatientDashboardState() {
  const { data: session } = useSession();
  const { confirm, alert } = useCommandModal();
  const params = useParams();
  const { addItem } = useRecentlyBrowsed();

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("halcyon_patient_dashboard_active_tab") ||
        "snapshot"
      );
    }
    return "snapshot";
  });

  useEffect(() => {
    localStorage.setItem("halcyon_patient_dashboard_active_tab", activeTab);
  }, [activeTab]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEditDemographics, setShowEditDemographics] = useState(false);
  const [showEditCommunications, setShowEditCommunications] = useState(false);
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>();
  const [summaryAppointmentId, setSummaryAppointmentId] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [downloadingDossier, setDownloadingDossier] = useState(false);
  const [showEmergencyDrawer, setShowEmergencyDrawer] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [showBreakGlass, setShowBreakGlass] = useState(false);
  const [showBenefitClaim, setShowBenefitClaim] = useState(false);
  const [historySortOrder, setHistorySortOrder] = useState<"desc" | "asc">("desc");
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null);

  // IoT Telemetry State
  const [vitals, setVitals] = useState({ hr: 72, spo2: 98, temp: 98.6 });
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [isIotConnected, setIsIotConnected] = useState(false);
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);

  const telemetryEnabledRef = useRef(true);
  useEffect(() => {
    telemetryEnabledRef.current = telemetryEnabled;
  }, [telemetryEnabled]);

  const [createEncounter] = useMutation(CREATE_ENCOUNTER);
  const [deleteContact] = useMutation(DELETE_CONTACT);
  const [updatePatient] = useMutation(UPDATE_PATIENT);

  const handleToggleTelemetry = async () => {
    const newState = !telemetryEnabled;
    setTelemetryEnabled(newState);
    telemetryEnabledRef.current = newState;

    if (newState && telemetryData.length === 0) {
      console.log("[IoT] Attempting to create encounter for Patient ID:", params.id);
      try {
        const res = await createEncounter({
          variables: {
            input: {
              patientId: params.id as string,
              practitionerId:
                session?.user?.practitionerId ||
                (process.env.NODE_ENV === "development"
                  ? "c79b9090-6725-460d-8531-1554c46f6f96"
                  : "00000000-0000-0000-0000-000000000000"),
              chiefComplaint: "Live Telemetry Bridge Handshake",
              notes: "System initialization to connect IoT telemetry for clinical dashboard.",
              ppsScore: 100,
            },
          },
        });
        console.log("[IoT] createEncounter Response:", res);
      } catch (e) {
        console.error("[IoT] createEncounter Error:", e);
      }
    }
  };

  useEffect(() => {
    if (!params.id) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(
        process.env.NEXT_PUBLIC_SIGNALR_ENDPOINT ||
          "http://localhost:34732/hubs/telemetry",
      )
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        setIsIotConnected(true);
        await connection.invoke("JoinPatientStream", params.id);

        connection.on("ReceiveVitals", (data: any) => {
          console.log("[IoT] ReceiveVitals triggered! Data:", data);
          console.log("[IoT] telemetryEnabledRef.current is:", telemetryEnabledRef.current);
          if (telemetryEnabledRef.current) {
            const newVital = {
              hr: data.heartRate,
              spo2: data.spO2,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            };

            setVitals((prev) => ({
              ...prev,
              hr: data.heartRate,
              spo2: data.spO2,
              temp: data.temperature || prev.temp,
            }));

            setTelemetryData((prev) => {
              const updated = [...prev, newVital];
              if (updated.length > 20) return updated.slice(1);
              return updated;
            });
          }
        });
      } catch (err: any) {
        const isAbort = err?.name === 'AbortError' || err?.toString()?.includes('stopped');
        if (!isAbort) {
          console.error("[IoT] Connection Failure:", err);
        }
      }
    };

    startConnection();

    return () => {
      connection.stop();
    };
  }, [params.id]);

  const isUuid = (val: any) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val));

  const { data, loading, error, refetch } = useQuery(GET_PATIENT_DETAILS, {
    variables: { id: params.id },
    skip: !params.id || !isUuid(params.id),
  });

  const patient = data?.patientById;

  const {
    data: apptData,
    loading: apptLoading,
    refetch: refetchAppts,
  } = useQuery(GET_PATIENT_APPOINTMENTS, {
    variables: { id: params.id },
    skip: !params.id || !isUuid(params.id),
  });

  useEffect(() => {
    if (patient?.patientId) {
      addItem({
        id: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        subtitle: patient.mrn,
        type: "PATIENT",
      });

      // Auto-enable telemetry if there is an active encounter or appointment
      const hasActiveEncounter = patient.encounters?.some((e: any) => {
        const s = e.status?.toUpperCase();
        return (
          s === "INPROGRESS" ||
          s === "IN_PROGRESS" ||
          s === "ARRIVED" ||
          s === "TRIAGED"
        );
      });

      const appointments = [...(apptData?.appointments?.items || [])];
      const hasActiveAppointment = appointments.some((a: any) => {
        const s = a.status?.toUpperCase();
        return s?.includes("PROGRESS") || s === "LIVE";
      });

      if (hasActiveEncounter || hasActiveAppointment) {
        setTelemetryEnabled(true);
      }
    }
  }, [
    patient?.patientId,
    patient?.firstName,
    patient?.lastName,
    patient?.mrn,
    patient?.encounters,
    apptData,
    addItem,
  ]);

  const { data: summaryData } = useQuery(GET_CLINICAL_SUMMARY, {
    variables: { patientId: params.id },
    skip: !params.id || !isUuid(params.id),
  });

  const handleDeleteContact = async (contactId: string) => {
    const ok = await confirm({
      title: "Remove Contact",
      message: "Are you sure you want to remove this trusted contact?",
      confirmText: "Remove",
      type: "danger",
    });

    if (ok) {
      try {
        await deleteContact({
          variables: {
            command: {
              patientId: params.id as string,
              patientContactId: contactId,
            },
          },
        });
      } catch (e: any) {
        alert({
          title: "Delete Failed",
          message: e.message || "Failed to remove the trusted contact.",
          type: "danger",
        });
      }
    }
  };

  const handleSaveAddress = async (addr: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    region: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  }) => {
    try {
      await updatePatient({
        variables: {
          command: {
            patientId: params.id as string,
            street: addr.street || null,
            city: addr.city || null,
            state: addr.state || null,
            postalCode: addr.postalCode || null,
            region: addr.region || null,
            country: addr.country || null,
            latitude: addr.latitude,
            longitude: addr.longitude,
          },
        },
      });
      await refetch();
      setShowEditAddress(false);
      alert({
        title: "Address Updated",
        message: "Patient address has been saved successfully.",
        type: "success",
      });
    } catch (e: any) {
      alert({
        title: "Update Failed",
        message: e.message || "Failed to update patient address.",
        type: "danger",
      });
    }
  };

  const handleDownloadDossier = async () => {
    if (!params.id) return;
    setDownloadingDossier(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clinical/export/dossier/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to export dossier");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clinical_dossier_${patient?.lastName || "patient"}_${patient?.mrn || "record"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      if (err.message === "Failed to fetch") return;

      console.error(err);
      alert({
        title: "EXPORT FAILED",
        message:
          err.message ||
          "An error occurred while generating the clinical dossier. Please check connection and try again.",
        type: "danger",
      });
    } finally {
      setDownloadingDossier(false);
    }
  };

  return {
    patientId: params.id as string,
    session,
    confirm,
    alert,
    activeTab,
    setActiveTab,
    drawerOpen,
    setDrawerOpen,
    showAddContact,
    setShowAddContact,
    showEditDemographics,
    setShowEditDemographics,
    showEditCommunications,
    setShowEditCommunications,
    showEditAddress,
    setShowEditAddress,
    editingContact,
    setEditingContact,
    selectedAppointmentId,
    setSelectedAppointmentId,
    summaryAppointmentId,
    setSummaryAppointmentId,
    isSummaryOpen,
    setIsSummaryOpen,
    downloadingDossier,
    showEmergencyDrawer,
    setShowEmergencyDrawer,
    isEmergency,
    setIsEmergency,
    showBreakGlass,
    setShowBreakGlass,
    showBenefitClaim,
    setShowBenefitClaim,
    historySortOrder,
    setHistorySortOrder,
    selectedEncounter,
    setSelectedEncounter,
    vitals,
    telemetryData,
    isIotConnected,
    telemetryEnabled,
    handleToggleTelemetry,
    patient,
    loading,
    error,
    refetch,
    apptData,
    apptLoading,
    refetchAppts,
    summaryData,
    handleDeleteContact,
    handleSaveAddress,
    handleDownloadDossier,
  };
}

export type UsePatientDashboardStateReturn = ReturnType<typeof usePatientDashboardState>;
