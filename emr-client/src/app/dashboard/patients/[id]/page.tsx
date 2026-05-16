"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Stethoscope,
  History,
  MapPin,
  Phone,
  Mail,
  Activity,
  ClipboardList,
  AlertCircle,
  Plus,
  UserCircle,
  TrendingUp,
  Calendar,
  Zap,
  ChevronRight,
  Clock,
  CheckCircle2,
  Loader2,
  Edit3,
  Wind,
  Truck,
  Package,
  ShieldCheck,
  ShieldAlert,
  Lock as LockIcon,
  Users,
  User,
  FileText,
  Trash2,
  Thermometer,
  ArrowUpDown,
  X,

} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as signalR from "@microsoft/signalr";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic Clinical Components
const SymptomTrendChart = dynamic(() => import("@/components/SymptomTrendChart"), {
  loading: () => <Skeleton className="h-64 w-full" />
});
const MedicationRegistry = dynamic(() => import("@/components/MedicationRegistry"), {
  loading: () => <Skeleton className="h-32 w-full" />
});
const VitalSignTimeline = dynamic(() => import("@/components/VitalSignTimeline"), {
  loading: () => <Skeleton className="h-48 w-full" />
});
const LiveHeartbeat = dynamic(() => import("@/components/LiveHeartbeat"), {
  ssr: false,
  loading: () => <Skeleton className="h-24 w-full" />
});
const ProblemList = dynamic(() => import("@/components/ProblemList"), {
  loading: () => <Skeleton className="h-40 w-full" />
});
const AllergyRegistry = dynamic(() => import("@/components/AllergyRegistry"), {
  loading: () => <Skeleton className="h-24 w-full" />
});
const EquipmentRegistry = dynamic(() => import("@/components/EquipmentRegistry"), {
  loading: () => <Skeleton className="h-40 w-full" />
});

// Dynamic Drawers & Modals
const BookingDrawer = dynamic(() => import("@/components/BookingDrawer"));
const TaskManagement = dynamic(() => import("@/components/TaskManagement"));
const DocumentVault = dynamic(() => import("@/components/DocumentVault"));
const AddContactDrawer = dynamic(() => import("@/components/AddContactDrawer"));
const EditDemographicsDrawer = dynamic(() => import("@/components/EditDemographicsDrawer"));
const EditCommunicationsDrawer = dynamic(() => import("@/components/EditCommunicationsDrawer"));
const VisitSummaryDrawer = dynamic(() => import("@/components/VisitSummaryDrawer"));
const EmergencyActionDrawer = dynamic(() => import("@/components/EmergencyActionDrawer"));
const BreakGlassDrawer = dynamic(() => import("@/components/BreakGlassDrawer"));
const BenefitClaimDrawer = dynamic(() => import("@/components/BenefitClaimDrawer"));
import { useSession } from "next-auth/react";
import { PermissionGate } from "@/components/PermissionGate";

const CREATE_ENCOUNTER = gql`
  mutation CreateEncounter($input: CreateClinicalEncounterCommandInput!) {
    createClinicalEncounter(input: $input)
  }
`;

const GET_PATIENT_DETAILS = gql`
  query GetPatientDetails($id: UUID!) {
    patientById(patientId: $id) {
      patientId
      mrn
      firstName
      lastName
      dob
      biologicalSex
      addresses {
        isPrimary
        address {
          street
          city
          state
          postalCode
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

const GET_PATIENT_APPOINTMENTS = gql`
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

const GET_CLINICAL_SUMMARY = gql`
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

const DELETE_CONTACT = gql`
  mutation DeleteContact($command: DeleteContactCommandInput!) {
    deleteContact(command: $command)
  }
`;

import { useRecentlyBrowsed } from "@/hooks/useRecentlyBrowsed";
import { useCommandModal } from "@/components/CommandModalProvider";
import HalcyonPortal from "@/components/Portal";

export default function PatientDetailPage() {
  const { data: session } = useSession();
  const { confirm, alert } = useCommandModal();
  const params = useParams();
  const { addItem } = useRecentlyBrowsed();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("halcyon_patient_dashboard_active_tab") || "snapshot";
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
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);

  const telemetryEnabledRef = useRef(telemetryEnabled);
  useEffect(() => {
    telemetryEnabledRef.current = telemetryEnabled;
  }, [telemetryEnabled]);

  const [createEncounter] = useMutation(CREATE_ENCOUNTER);

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
              practitionerId: session?.user?.practitionerId || (process.env.NODE_ENV === 'development' ? "c79b9090-6725-460d-8531-1554c46f6f96" : "00000000-0000-0000-0000-000000000000"),
              chiefComplaint: "Live Telemetry Bridge Handshake",
              notes: "System initialization to connect IoT telemetry for clinical dashboard.",
              ppsScore: 100
            }
          }
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
      .withUrl(process.env.NEXT_PUBLIC_SIGNALR_ENDPOINT || "http://localhost:34732/hubs/telemetry")
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
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };

            setVitals(prev => ({
              ...prev,
              hr: data.heartRate,
              spo2: data.spO2,
              temp: data.temperature || prev.temp
            }));

            setTelemetryData(prev => {
              const updated = [...prev, newVital];
              if (updated.length > 20) return updated.slice(1);
              return updated;
            });
          }
        });

      } catch (err) {
        console.error("[IoT] Connection Failure:", err);
      }
    };

    startConnection();

    return () => {
      connection.stop();
    };
  }, [params.id]);

  const isUuid = (val: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val));

  const { data, loading, error, refetch } = useQuery(GET_PATIENT_DETAILS, {
    variables: { id: params.id },
    skip: !params.id || !isUuid(params.id)
  });

  const patient = data?.patientById;

  const { data: apptData, loading: apptLoading, refetch: refetchAppts } = useQuery(GET_PATIENT_APPOINTMENTS, {
    variables: { id: params.id },
    skip: !params.id || !isUuid(params.id)
  });

  useEffect(() => {
    if (patient?.patientId) {
      addItem({
        id: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        subtitle: patient.mrn,
        type: 'PATIENT'
      });

      // Auto-enable telemetry if there is an active encounter or appointment
      const hasActiveEncounter = patient.encounters?.some((e: any) => {
        const s = e.status?.toUpperCase();
        return s === "INPROGRESS" || s === "IN_PROGRESS" || s === "ARRIVED" || s === "TRIAGED";
      });

      const appointments = [...(apptData?.appointments?.items || [])];
      const hasActiveAppointment = appointments.some((a: any) => {
        const s = a.status?.toUpperCase();
        return s?.includes('PROGRESS') || s === 'LIVE';
      });

      if (hasActiveEncounter || hasActiveAppointment) {
        setTelemetryEnabled(true);
      }
    }
  }, [patient?.patientId, patient?.firstName, patient?.lastName, patient?.mrn, patient?.encounters, apptData, addItem]);

  const { data: summaryData } = useQuery(GET_CLINICAL_SUMMARY, {
    variables: { patientId: params.id },
    skip: !params.id || !isUuid(params.id)
  });

  const [deleteContact] = useMutation(DELETE_CONTACT, {
    onCompleted: () => refetch()
  });

  const handleDownloadDossier = async () => {
    if (!params.id) return;
    setDownloadingDossier(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clinical/export/dossier/${params.id}`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to export dossier");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinical_dossier_${patient?.lastName || 'patient'}_${patient?.mrn || 'record'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      // Ignore "Failed to fetch" errors if they happen during a successful download interception
      if (err.message === "Failed to fetch") return;

      console.error(err);
      alert({
        title: "EXPORT FAILED",
        message: err.message || "An error occurred while generating the clinical dossier. Please check connection and try again.",
        type: "danger"
      });
    } finally {
      setDownloadingDossier(false);
    }
  };

  if (loading) return (
    <div className="p-4 space-y-6 animate-in fade-in duration-700">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-80" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-48 opacity-50" />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 w-36 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Col Skeletons */}
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-[2rem] shadow-lg shadow-white/5" />
          <Skeleton className="h-64 w-full rounded-[2rem] shadow-lg shadow-white/5" />
          <Skeleton className="h-48 w-full rounded-[2rem] shadow-lg shadow-white/5" />
        </div>
        {/* Main Content Skeleton */}
        <div className="lg:col-span-3 space-y-6">
          <Skeleton className="h-14 w-full max-w-2xl rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
          <Skeleton className="h-[600px] w-full rounded-[2.5rem] shadow-xl shadow-white/5" />
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="p-10 space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col gap-2">
          <div className="text-rose-500 font-black uppercase tracking-[0.4em] flex items-center gap-3 text-lg">
            <ShieldAlert className="w-6 h-6" />
            Security Access Violation
          </div>
          <div className="h-1 w-32 bg-rose-500/20 rounded-full" />
        </div>

        <div className="p-8 bg-slate-950 border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
            <LockIcon className="w-64 h-64" />
          </div>

          <div className="relative z-10 space-y-6 max-w-2xl">
            <h3 className="text-xl font-bold text-white tracking-tight uppercase">Patient record is restricted</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your current session does not have an active clinical assignment for this patient.
              To protect patient privacy, full chart access is restricted to the assigned Care Team.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-3">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Option 01</div>
                <h4 className="text-xs font-black text-white uppercase italic">Contact Care Coordination</h4>
                <p className="text-[10px] text-slate-500 leading-normal">Request to be added to the Care Navigation Team for this patient via the Registry Manager.</p>
              </div>

              <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col gap-3">
                <div className="text-xs font-black text-rose-500 uppercase tracking-widest">Option 02 (Emergency)</div>
                <h4 className="text-xs font-black text-rose-400 uppercase italic">Activate Break-Glass Protocol</h4>
                <p className="text-[10px] text-rose-500/60 leading-normal">Override restrictions immediately with mandatory forensic justification and auditing.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-6">
              <button
                onClick={() => setShowBreakGlass(true)}
                className="px-8 py-3 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition-all flex items-center gap-3 active:scale-95"
              >
                <Zap className="w-4 h-4" />
                Initialize Emergency Bypass
              </button>

              <Link
                href="/dashboard/patients"
                className="px-8 py-3 rounded-xl bg-white/[0.05] text-slate-400 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all"
              >
                Return to Registry
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl max-w-fit">
          <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
            Diagnostic Payload: {error.message}
          </p>
        </div>

        <BreakGlassDrawer
          open={showBreakGlass}
          onClose={() => setShowBreakGlass(false)}
          onSuccess={() => refetch()}
        />
      </div>
    );
  }

  if (!patient) return <div className="p-10 text-[var(--text-primary)] font-black uppercase tracking-widest">Patient record not found in registry.</div>;

  const appointments = [...(apptData?.appointments?.items || [])].sort(
    (a: any, b: any) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
  );
  const activeAppointment = appointments.find((a: any) =>
    a.status?.toUpperCase().includes('PROGRESS') || a.status?.toUpperCase() === 'LIVE'
  );

  const nextScheduledAppointment = appointments
    .filter((a: any) => a.status?.toUpperCase() === 'SCHEDULED')
    .sort((a: any, b: any) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())[0];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--card-border)] pb-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/patients" className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all active:scale-95">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight uppercase leading-none">{patient.firstName} {patient.lastName}</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-[var(--text-muted)] text-[9px] font-black tracking-[0.2em] uppercase">{patient.mrn} • {patient.biologicalSex}</p>
              <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/5 border border-rose-500/10">
                  <Activity className="w-3 h-3 text-rose-500" />
                  <span className="text-[9px] font-black text-rose-500 uppercase">{vitals.hr} BPM</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                  <Wind className="w-3 h-3 text-emerald-500" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase">{vitals.spo2}% SpO2</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/5 border border-amber-500/10">
                  <Thermometer className="w-3 h-3 text-amber-500" />
                  <span className="text-[9px] font-black text-amber-500 uppercase">{vitals.temp}°F</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all duration-500 ${isEmergency
            ? "bg-red-500/10 border-red-500/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            : "bg-emerald-500/10 border-emerald-500/20"
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isEmergency ? "bg-red-500" : "bg-emerald-500"}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${isEmergency ? "text-red-500" : "text-emerald-500"}`}>
              Status: {isEmergency ? "Critical" : "Stable"}
            </span>
          </div>
          <PermissionGate permission="billing:manage">
            <button
              onClick={() => setShowBenefitClaim(true)}
              className="px-6 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Tag Z-Benefit
            </button>
          </PermissionGate>
          <PermissionGate permission="clinical:assessments">
            <Link
              href={`/dashboard/patients/${params.id}/assessment/new`}
              className="px-6 py-2 rounded-xl bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center gap-2"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Clinical Assessment
            </Link>
          </PermissionGate>
          <PermissionGate permission="docs:view">
            <button
              onClick={handleDownloadDossier}
              disabled={downloadingDossier}
              className="px-6 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {downloadingDossier ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Clinical Dossier
            </button>
          </PermissionGate>
          <PermissionGate permission="clinical:order">
            <button
              onClick={() => setShowEmergencyDrawer(true)}
              className={`px-6 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all ${isEmergency
                ? "bg-red-600 shadow-red-600/30 animate-pulse ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950"
                : "bg-[var(--primary)] shadow-[var(--primary-glow)] hover:opacity-90"
                }`}
            >
              {isEmergency ? "Protocol Active" : "Emergency Action"}
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Bio Snapshot */}
        <div className="space-y-4">
          <LiveHeartbeat
            patientId={params.id as string}
            enabled={telemetryEnabled}
            onToggle={handleToggleTelemetry}
            status={!telemetryEnabled ? "off" : telemetryData.length > 0 ? "live" : "initializing"}
          />

          <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 premium-gradient" />
            <h2 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <UserCircle className="w-3.5 h-3.5 text-[var(--primary)]" />
              Core Identity
            </h2>
            <div className="space-y-4">
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Date of Birth</p>
                <p className="text-xs font-black text-[var(--text-primary)]">{new Date(patient.dob).toLocaleDateString()}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Clinical Address</p>
                <p className="text-xs font-black text-[var(--text-primary)] leading-tight">
                  {patient.addresses?.[0]?.address?.street}<br />
                  {patient.addresses?.[0]?.address?.city}, {patient.addresses?.[0]?.address?.postalCode}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[var(--primary)]" />
                Communications
              </h2>
              <PermissionGate permission="patients:edit">
                <button
                  onClick={() => setShowEditCommunications(true)}
                  className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </PermissionGate>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3 opacity-60">Patient Self-Registry</p>
                {patient.phones?.map((phone: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${phone.isPrimary ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-white/5 text-slate-500'}`}>
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-black text-[var(--text-primary)]">{phone.phoneNumber}</p>
                          {phone.isPrimary && <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/10 uppercase tracking-tighter">Primary</span>}
                        </div>
                        <p className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-widest">{phone.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {patient.emails?.map((email: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${email.isPrimary ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-white/5 text-slate-500'}`}>
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-black text-[var(--text-primary)]">{email.emailAddress}</p>
                          {email.isPrimary && <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/10 uppercase tracking-tighter">Primary</span>}
                        </div>
                        <p className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-widest">{email.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Trusted Contacts
              </h2>
              <PermissionGate permission="patients:edit">
                <button
                  onClick={() => setShowAddContact(true)}
                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </PermissionGate>
            </div>
            <div className="space-y-3">
              {patient.contacts?.length > 0 ? (
                patient.contacts.map((contact: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${contact.isPoa ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {contact.isPoa ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-[var(--text-primary)]">{contact.firstName} {contact.lastName}</p>
                        <p className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-widest">{contact.relationship}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.isPoa && (
                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20 uppercase tracking-tighter">POA</span>
                      )}
                      <PermissionGate permission="patients:edit">
                        <button
                          onClick={() => {
                            setEditingContact(contact);
                            setShowAddContact(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--primary)]/20 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </PermissionGate>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[9px] text-[var(--text-muted)] italic">No contacts registered</p>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right Column: High-Density Clinical Tabs */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-1 p-1 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("snapshot")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                           ${activeTab === "snapshot" ? "bg-[var(--primary)] text-white shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              <Activity className="w-3.5 h-3.5" /> Clinical Snapshot
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                           ${activeTab === "history" ? "bg-[var(--primary)] text-white shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              <History className="w-3.5 h-3.5" /> Historical Activity
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                           ${activeTab === "activity" ? "bg-[var(--primary)] text-white shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              <Calendar className="w-3.5 h-3.5" /> Visit Schedule
            </button>
            <button
              onClick={() => setActiveTab("logistics")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                           ${activeTab === "logistics" ? "bg-[var(--primary)] text-white shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              <Truck className="w-3.5 h-3.5" /> Logistics & Fleet
            </button>
            <button
              onClick={() => setActiveTab("coordination")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                           ${activeTab === "coordination" ? "bg-[var(--primary)] text-white shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Coordination & Records
            </button>
          </div>

          <div className="min-h-[600px]">
            {activeTab === "snapshot" && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(summaryData?.patientClinicalSummary?.recentVitals?.slice(0, 5) || [
                    { type: "Pain", value: "--", unit: "/10" },
                    { type: "Anxiety", value: "--", unit: "/10" },
                    { type: "BP", value: "--", unit: "mmHg" },
                    { type: "SpO2", value: "--", unit: "%" },
                    { type: "Weight", value: "--", unit: "kg" },
                  ]).map((v: any, i: number) => (
                    <div key={i} className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--card-border)] shadow-md">
                      <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{v.type}</p>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-lg font-black text-[var(--text-primary)] ${v.type === 'SpO2' ? 'text-emerald-500' : ''}`}>{v.value}</span>
                        <span className="text-[9px] font-black text-[var(--text-muted)]">{v.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <AllergyRegistry patientId={params.id as string} />
                <MedicationRegistry patientId={params.id as string} />
                <ProblemList patientId={params.id as string} />
                <VitalSignTimeline patientId={params.id as string} />
                <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--card-border)] shadow-xl">
                  <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tight mb-4">
                    <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                    Symptom Trajectory
                  </h2>
                  <SymptomTrendChart patientId={params.id as string} />
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-10 border border-[var(--card-border)] shadow-xl min-h-[500px]">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-3">
                      <Activity className="w-4 h-4 text-[var(--primary)]" />
                      Clinical Activity Log
                    </h2>
                    <button
                      onClick={() => setHistorySortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="px-4 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-[var(--primary)]" />
                      Sort: {historySortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                    </button>
                  </div>
                  <div className="space-y-1 relative">
                    <div className="absolute left-[19px] top-0 w-px h-full bg-[var(--card-border)]" />
                    {[...(patient.encounters || [])]
                      .sort((a: any, b: any) => {
                        const dateA = new Date(a.encounterDate).getTime();
                        const dateB = new Date(b.encounterDate).getTime();
                        return historySortOrder === "desc" ? dateB - dateA : dateA - dateB;
                      })
                      .map((evt: any, i: number) => {
                        const note = evt.clinicalNotes?.[0]?.content || "System generated encounter record. No clinical narrative was documented for this session.";
                        return (
                          <div 
                            key={evt.encounterId} 
                            onClick={() => setSelectedEncounter(evt)}
                            className="flex gap-6 relative z-10 group cursor-pointer hover:bg-[var(--primary)]/[0.02] p-2 -ml-2 rounded-xl transition-all"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] group-hover:border-[var(--primary)] group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)] transition-all shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{evt.type?.replace(/_/g, ' ')}</h4>
                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{new Date(evt.encounterDate).toLocaleDateString()}</span>
                              </div>
                              <p 
                                className="text-[11px] text-[var(--text-secondary)] mt-1 italic group-hover:text-[var(--text-primary)] transition-colors relative"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {note}
                              </p>
                              <div className="mt-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="h-px flex-1 bg-[var(--primary)]/10" />
                                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">Click for Full Narrative</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-10 border border-[var(--card-border)] shadow-xl min-h-[500px]">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[var(--primary)]" />
                      Patient Visit Registry
                    </h2>
                    <PermissionGate permission="scheduling:manage">
                      <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)]">
                        <Plus className="w-4 h-4" /> Schedule Visit
                      </button>
                    </PermissionGate>
                  </div>
                  <div className="space-y-4">
                    {appointments.map((appt: any) => (
                      <div key={appt.appointmentId} className="p-6 rounded-[2rem] border border-[var(--card-border)] bg-[var(--input-bg)]/50 flex items-center justify-between hover:border-[var(--primary)]/30 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                                             ${appt.status?.toUpperCase().includes('PROGRESS') || appt.status?.toUpperCase() === 'LIVE' ? 'bg-[var(--primary)] text-white animate-pulse' : 'bg-[var(--card-border)] text-[var(--text-muted)]'}`}>
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-sm font-black uppercase">{new Date(appt.scheduledStart).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest
                                                    ${appt.status?.toUpperCase().includes('PROGRESS') || appt.status?.toUpperCase() === 'LIVE' ? 'bg-emerald-500 text-white' : 'bg-[var(--card-border)] text-[var(--text-muted)]'}`}>
                                {appt.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(appt.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                <User className="w-3.5 h-3.5" />
                                {appt.practitioner ? `${appt.practitioner.firstName} ${appt.practitioner.lastName}` : 'Unassigned'}
                              </span>
                            </div>
                            {(appt.visitType || appt.modality) && (
                              <div className="flex items-center gap-2 mt-2">
                                {appt.visitType && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-[8px] font-black uppercase tracking-wider">
                                    <ClipboardList className="w-2.5 h-2.5" />
                                    {appt.visitType.replace(/_/g, ' ')}
                                  </span>
                                )}
                                {appt.modality && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[8px] font-black uppercase tracking-wider">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {appt.modality.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-3">
                            {appt.status?.toUpperCase().includes('COMPLETE') || appt.status?.toUpperCase() === 'DONE' ? (
                              <PermissionGate permission="clinical:view">
                                <button
                                  onClick={() => {
                                    setSummaryAppointmentId(appt.appointmentId);
                                    setIsSummaryOpen(true);
                                  }}
                                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                >
                                  <ClipboardList className="w-4 h-4" /> View Summary
                                </button>
                              </PermissionGate>
                            ) : (
                              <PermissionGate permission="clinical:chart">
                                <Link
                                  href={`/dashboard/patients/${params.id}/visit?appointmentId=${appt.appointmentId}`}
                                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${appt.status?.toUpperCase().includes('PROGRESS') || appt.status?.toUpperCase() === 'LIVE'
                                    ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse hover:bg-rose-600'
                                    : 'bg-[var(--primary)] text-white shadow-[var(--primary-glow)] hover:opacity-90'
                                    }`}
                                >
                                  <Stethoscope className="w-4 h-4" />
                                  {appt.status?.toUpperCase().includes('PROGRESS') || appt.status?.toUpperCase() === 'LIVE'
                                    ? 'Join Session'
                                    : 'Start Visit'}
                                </Link>
                              </PermissionGate>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "logistics" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <EquipmentRegistry patientId={params.id as string} />
                <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-10 border border-[var(--card-border)] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-[var(--primary)]" />
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tighter">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        IoT Telemetry Stream
                      </h2>
                      <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mt-1">Live Sensor Network (Oxygen/Vitals)</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)]">
                      <div className={`w-2 h-2 rounded-full ${telemetryEnabled
                        ? (telemetryData.length > 0 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" : "bg-amber-500 animate-pulse")
                        : "bg-[var(--text-muted)] opacity-50"
                        }`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${telemetryEnabled
                        ? (telemetryData.length > 0 ? "text-emerald-500" : "text-amber-500")
                        : "text-[var(--text-muted)]"
                        }`}>
                        {telemetryEnabled ? (telemetryData.length > 0 ? "Live IoT Stream ON" : "Initializing Link...") : "Telemetry Link OFF"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-3">
                          <Wind className={`w-5 h-5 ${isIotConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                          <span className="text-xs font-black uppercase tracking-tighter">O2 Saturation Feed</span>
                        </div>
                        <span className="text-xl font-black text-emerald-500">{vitals.spo2}%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] group hover:border-rose-500/30 transition-all">
                        <div className="flex items-center gap-3">
                          <Activity className={`w-5 h-5 ${isIotConnected ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
                          <span className="text-xs font-black uppercase tracking-tighter">Cardiac Pulse Rate</span>
                        </div>
                        <span className="text-xl font-black text-rose-500">{vitals.hr} <span className="text-[10px]">BPM</span></span>
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-3xl border border-[var(--card-border)] overflow-hidden h-[180px] relative">
                      {telemetryData.length > 0 ? (
                        <div className="absolute inset-0 p-4">
                          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                            <AreaChart data={telemetryData}>

                              <defs>
                                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }} />
                              <Area type="monotone" dataKey="hr" stroke="#f43f5e" fillOpacity={1} fill="url(#colorHr)" strokeWidth={3} isAnimationActive={false} />
                              <Area type="monotone" dataKey="spo2" stroke="#10b981" fillOpacity={1} fill="url(#colorSpo2)" strokeWidth={2} isAnimationActive={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                          <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Waiting for active IoT Handshake...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DocumentVault patientId={params.id as string} />
              </div>
            )}

            {activeTab === "coordination" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-10 border border-[var(--card-border)] shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tight">
                        <Users className="w-6 h-6 text-emerald-400" />
                        Trusted Contacts & POA
                      </h2>
                      <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mt-1">Authorized Representatives & Family</p>
                    </div>
                    <PermissionGate permission="patients:edit">
                      <button onClick={() => setShowAddContact(true)} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
                        <Plus className="w-4 h-4" /> Add Contact
                      </button>
                    </PermissionGate>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {patient.contacts?.map((contact: any) => (
                      <div key={contact.patientContactId} className={`p-6 rounded-[2rem] border transition-all hover:shadow-lg ${contact.isPoa ? 'bg-blue-500/[0.03] border-blue-500/30 shadow-blue-500/5' : 'bg-[var(--input-bg)] border-[var(--card-border)] shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${contact.isPoa ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                              <UserCircle className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{contact.firstName} {contact.lastName}</h3>
                              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{contact.relationship}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {contact.isPoa && <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">POA</span>}
                            <PermissionGate permission="patients:edit">
                              <button onClick={() => { setEditingContact(contact); setShowAddContact(true); }} className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--primary)]/20 transition-all">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </PermissionGate>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                            <Phone className="w-3 h-3 opacity-50" />
                            <span className="font-bold">{contact.phone || "No phone recorded"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                            <Mail className="w-3 h-3 opacity-50" />
                            <span className="font-bold">{contact.email || "No email recorded"}</span>
                          </div>
                        </div>
                        {contact.isPoa && (() => {
                          const allDocs = [...(patient.documents || [])];
                          // Broaden search: Find ANY POA document for this patient
                          let displayDocs = allDocs.filter((d: any) => d.documentType === 'POA' || d.title?.toUpperCase().includes('POA'));

                          // NEW: Azurite Sovereignty - if we have even one Azurite link, kill all legacy paths
                          const hasAzurite = displayDocs.some((d: any) => d.storageUrl?.toLowerCase().includes('http'));
                          if (hasAzurite) {
                            displayDocs = displayDocs.filter((d: any) => d.storageUrl?.toLowerCase().includes('http'));
                          }

                          const poaDoc = displayDocs.sort((a: any, b: any) => {
                            // ULTRA PRIORITY: Any new Azurite link (http)
                            const aIsAzurite = a.storageUrl?.toLowerCase().includes('http');
                            const bIsAzurite = b.storageUrl?.toLowerCase().includes('http');

                            // If one is Azurite and the other is legacy, Azurite ALWAYS wins
                            if (bIsAzurite && !aIsAzurite) return 1;
                            if (aIsAzurite && !bIsAzurite) return -1;

                            // If both are the same type, use date
                            const aDate = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
                            const bDate = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
                            return bDate - aDate;
                          })[0];

                          // ALWAYS use the API proxy for viewing to ensure correct headers/PDF viewing
                          const href = poaDoc
                            ? `${process.env.NEXT_PUBLIC_API_URL}/api/upload/document/${poaDoc.patientDocumentId}`
                            : '#';

                          return (
                            <PermissionGate permission="docs:view">
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  if (!poaDoc) {
                                    e.preventDefault();
                                    alert({ title: "Missing Documentation", message: "No POA document found for this contact.", type: "warning" });
                                  }
                                }}
                                className="w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                View POA Documentation ({displayDocs.length})
                              </a>
                            </PermissionGate>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
                <DocumentVault patientId={params.id as string} />
              </div>
            )}
          </div>
        </div>
      </div>

      <BookingDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); refetchAppts(); }}
        onBooked={() => { setDrawerOpen(false); refetchAppts(); }}
        patientId={params.id as string}
      />

      <AddContactDrawer
        isOpen={showAddContact}
        onClose={() => { setShowAddContact(false); setEditingContact(null); }}
        onSuccess={async () => {
          await refetch();
          setShowAddContact(false);
          setEditingContact(null);
        }}
        patientId={params.id as string}
        initialData={editingContact}
        existingPoaFile={editingContact ? (patient.documents || []).find((d: any) =>
          d.patientContactId === editingContact.patientContactId && (d.documentType === 'POA' || d.title?.toUpperCase().includes('POA'))
        )?.title : undefined}
      />

      <EditDemographicsDrawer open={showEditDemographics} onClose={() => setShowEditDemographics(false)} onSuccess={() => refetch()} patient={patient} />
      <EditCommunicationsDrawer open={showEditCommunications} onClose={() => setShowEditCommunications(false)} onSuccess={() => refetch()} patient={patient} />
      <VisitSummaryDrawer
        isOpen={isSummaryOpen}
        onClose={() => { setIsSummaryOpen(false); setSummaryAppointmentId(null); }}
        patientId={params.id as string}
        appointmentId={summaryAppointmentId ?? ""}
      />
      <EmergencyActionDrawer open={showEmergencyDrawer} onClose={() => setShowEmergencyDrawer(false)} patient={patient} onEscalate={() => setIsEmergency(true)} />
      <BreakGlassDrawer open={showBreakGlass} onClose={() => setShowBreakGlass(false)} onSuccess={() => refetch()} />
      <BenefitClaimDrawer
        open={showBenefitClaim}
        onClose={() => setShowBenefitClaim(false)}
        initialData={{ patientId: params.id as string }}
        onSuccess={() => {
          setShowBenefitClaim(false);
          refetch();
        }}
      />

      {/* Encounter Detail Modal */}
      {selectedEncounter && (
        <HalcyonPortal>
          <div className="fixed inset-0 z-[10000000] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setSelectedEncounter(null)} />
            <div className="relative w-full max-w-2xl bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
              <div className="h-2 w-full premium-gradient" />

              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shadow-lg shadow-[var(--primary-glow)]">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight leading-none">
                        {selectedEncounter.type?.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-2">
                        Encounter Date: {new Date(selectedEncounter.encounterDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEncounter(null)} className="p-2 hover:bg-[var(--input-bg)] rounded-xl text-[var(--text-muted)] hover:text-white transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{selectedEncounter.status}</p>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                      <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Practitioner</p>
                      <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest">
                        {selectedEncounter.practitioner ? `${selectedEncounter.practitioner.firstName} ${selectedEncounter.practitioner.lastName}` : "System Admin"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Clinical Narrative</span>
                    </div>
                    <div className="p-6 rounded-3xl bg-[var(--input-bg)]/50 border border-[var(--card-border)] relative group">
                      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                        <Stethoscope className="w-24 h-24" />
                      </div>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed italic relative z-10 whitespace-pre-wrap">
                        {selectedEncounter.clinicalNotes?.[0]?.content || "No narrative content recorded for this encounter."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-[var(--card-border)]">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Forensically Audited Encounter Record</span>
                  </div>
                  <button
                    onClick={() => setSelectedEncounter(null)}
                    className="px-8 py-3 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 active:scale-95 transition-all"
                  >
                    Close Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </HalcyonPortal>
      )}
    </div>
  );
}
