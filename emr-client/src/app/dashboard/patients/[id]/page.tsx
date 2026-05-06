"use client";

import { useState, useEffect } from "react";
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
  Users,
  User,
  FileText,
  Trash2,
  Thermometer
} from "lucide-react";
import Link from "next/link";
import SymptomTrendChart from "@/components/SymptomTrendChart";
import MedicationRegistry from "@/components/MedicationRegistry";
import VitalSignTimeline from "@/components/VitalSignTimeline";
import LiveHeartbeat from "@/components/LiveHeartbeat";
import ProblemList from "@/components/ProblemList";
import AllergyRegistry from "@/components/AllergyRegistry";
import EquipmentRegistry from "@/components/EquipmentRegistry";
import BookingDrawer from "@/components/BookingDrawer";
import TaskManagement from "@/components/TaskManagement";
import DocumentVault from "@/components/DocumentVault";
import AddContactDrawer from "@/components/AddContactDrawer";
import EditDemographicsDrawer from "@/components/EditDemographicsDrawer";
import EditCommunicationsDrawer from "@/components/EditCommunicationsDrawer";
import VisitSummaryDrawer from "@/components/VisitSummaryDrawer";
import EmergencyActionDrawer from "@/components/EmergencyActionDrawer";

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
        storageUrl
        documentType
        patientContactId
      }
      encounters {
        encounterId
        type
        status
        encounterDate
        practitioner {
          firstName
          lastName
        }
        clinicalNotes {
          content
          type
        }
      }
    }
  }
`;

// Separate query for appointments to prevent primary query failure
const GET_PATIENT_APPOINTMENTS = gql`
  query GetPatientAppointments($id: UUID!) {
    appointments(where: { patientId: { eq: $id } }) {
      items {
        appointmentId
        scheduledStart
        scheduledEnd
        status
        modality
        practitioner {
          firstName
          lastName
        }
        encounters {
          practitioner {
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
  mutation DeleteContact($input: DeleteContactCommandInput!) {
    deleteContact(input: $input)
  }
`;

import { useRecentlyBrowsed } from "@/hooks/useRecentlyBrowsed";

export default function PatientDetailPage() {
  const params = useParams();
  const { addPatient } = useRecentlyBrowsed();
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

  const isUuid = (val: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val));

  const { data, loading, error, refetch } = useQuery(GET_PATIENT_DETAILS, {
    variables: { id: params.id },
    skip: !params.id || !isUuid(params.id)
  });

  useEffect(() => {
    if (data?.patientById) {
      addPatient({
        patientId: data.patientById.patientId,
        firstName: data.patientById.firstName,
        lastName: data.patientById.lastName,
        mrn: data.patientById.mrn
      });
    }
  }, [data?.patientById]);

  const { data: summaryData } = useQuery(GET_CLINICAL_SUMMARY, {
    variables: { patientId: params.id },
    skip: !params.id || !isUuid(params.id)
  });

  const [deleteContact] = useMutation(DELETE_CONTACT, {
    onCompleted: () => refetch()
  });

  const { data: apptData, loading: apptLoading, refetch: refetchAppts } = useQuery(GET_PATIENT_APPOINTMENTS, {
    variables: { id: params.id },
    skip: !params.id || !isUuid(params.id)
  });

  const handleDownloadDossier = async () => {
    if (!params.id) return;
    setDownloadingDossier(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clinical/export/dossier/${params.id}`);
      if (!response.ok) throw new Error("Failed to export dossier");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinical_dossier_${patient?.lastName}_${patient?.mrn}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Error exporting dossier. Please try again.");
    } finally {
      setDownloadingDossier(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-4">
      <Zap className="w-12 h-12 text-[var(--primary)] animate-pulse" />
      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Initializing Clinical Profile...</p>
    </div>
  );

  if (error) return (
    <div className="p-10 space-y-4">
      <div className="text-rose-500 font-black uppercase tracking-widest flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Clinical Access Error
      </div>
      <pre className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-mono overflow-auto max-w-2xl">
        {error.message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--primary)]/5"
      >
        Retry Connection
      </button>
    </div>
  );

  const patient = data?.patientById;
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
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase leading-none">{patient.firstName} {patient.lastName}</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-[var(--text-muted)] text-[9px] font-black tracking-[0.2em] uppercase">{patient.mrn} // {patient.biologicalSex}</p>
              <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
              <div className="flex items-center gap-4">
                {(() => {
                  const vitals = summaryData?.patientClinicalSummary?.recentVitals || [];
                  const hr = vitals.find((v: any) => v.type.toUpperCase() === 'HEART RATE' || v.type.toUpperCase() === 'HR');
                  const spo2 = vitals.find((v: any) => v.type.toUpperCase() === 'SPO2' || v.type.toUpperCase() === 'O2');
                  const temp = vitals.find((v: any) => v.type.toUpperCase() === 'TEMPERATURE' || v.type.toUpperCase() === 'TEMP');

                  return (
                    <>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/5 border border-rose-500/10">
                        <Activity className="w-3 h-3 text-rose-500" />
                        <span className="text-[9px] font-black text-rose-500 uppercase">{hr?.value || '--'} BPM</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                        <Wind className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase">{spo2?.value || '--'}% SpO2</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/5 border border-amber-500/10">
                        <Thermometer className="w-3 h-3 text-amber-500" />
                        <span className="text-[9px] font-black text-amber-500 uppercase">{temp?.value || '--'}°F</span>
                      </div>
                    </>
                  );
                })()}
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
          <Link
            href={`/dashboard/patients/${params.id}/assessment/new`}
            className="px-6 py-2 rounded-xl bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center gap-2"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Clinical Assessment
          </Link>
          <button
            onClick={handleDownloadDossier}
            disabled={downloadingDossier}
            className="px-6 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {downloadingDossier ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            Clinical Dossier
          </button>
          <button
            onClick={() => setShowEmergencyDrawer(true)}
            className={`px-6 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all ${isEmergency
                ? "bg-red-600 shadow-red-600/30 animate-pulse ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950"
                : "bg-[var(--primary)] shadow-[var(--primary-glow)] hover:opacity-90"
              }`}
          >
            {isEmergency ? "Protocol Active" : "Emergency Action"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Bio Snapshot */}
        <div className="space-y-4">
          <LiveHeartbeat patientId={params.id as string} />

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
              <button
                onClick={() => setShowEditCommunications(true)}
                className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {patient.phones?.map((phone: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[var(--text-primary)]">{phone.phoneNumber}</p>
                    <p className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-widest">{phone.type}</p>
                  </div>
                </div>
              ))}
              {patient.emails?.map((email: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[var(--text-primary)]">{email.emailAddress}</p>
                    <p className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-widest">{email.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Trusted Contacts
              </h2>
              <button
                onClick={() => setShowAddContact(true)}
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
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
                      {contact.isLegalGuardian && (
                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20 uppercase tracking-tighter">Guardian</span>
                      )}
                      <button
                        onClick={() => {
                          setEditingContact(contact);
                          setShowAddContact(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--primary)]/20 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove ${contact.firstName} ${contact.lastName}?`)) {
                            deleteContact({ variables: { input: { patientContactId: contact.patientContactId } } });
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white/5 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[9px] text-[var(--text-muted)] italic">No contacts registered</p>
              )}
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Patient Demographics
              </h2>
              <button
                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                onClick={() => setShowEditDemographics(true)}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Civil Status</p>
                <p className="text-[10px] font-black text-[var(--text-primary)]">{patient.civilStatus || "Not recorded"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Religion</p>
                <p className="text-[10px] font-black text-[var(--text-primary)]">{patient.religion || "Not recorded"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Language</p>
                <p className="text-[10px] font-black text-[var(--text-primary)]">{patient.language || "English"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Nationality</p>
                <p className="text-[10px] font-black text-[var(--text-primary)]">{patient.nationality || "Filipino"}</p>
              </div>
              <div className="col-span-2 space-y-0.5 pt-2 border-t border-white/5">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Occupation</p>
                <p className="text-[10px] font-black text-[var(--text-primary)]">{patient.occupation || "Unspecified"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Column: High-Density Clinical Tabs */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tab Navigation */}
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

          {/* Tab Content */}
          {activeTab === "snapshot" && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">                 {/* Quick Vitals */}
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tighter">
                      <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                      Symptom Trajectory
                    </h2>
                    <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-widest mt-1">ESAS-R Standardized Trends</p>
                  </div>
                </div>
                <SymptomTrendChart patientId={params.id as string} />
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-10 border border-[var(--card-border)] shadow-xl min-h-[500px]">
                <h2 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                  <Activity className="w-4 h-4 text-[var(--primary)]" />
                  Clinical Activity Log
                </h2>

                <div className="space-y-8 relative">
                  <div className="absolute left-[21px] top-0 w-px h-full bg-[var(--card-border)]" />

                  {(patient.encounters || [])
                    .slice()
                    .sort((a: any, b: any) => new Date(a.encounterDate).getTime() - new Date(b.encounterDate).getTime())
                    .map((evt: any, i: number) => {
                      const note = evt.clinicalNotes?.[0]?.content || "Visit completed without supplemental clinical narrative.";
                      const date = new Date(evt.encounterDate);

                      // Determine icon based on type
                      const getIcon = (type: string) => {
                        if (type.includes('ASSESSMENT')) return <ClipboardList className="w-4 h-4" />;
                        if (type.includes('FOLLOWUP')) return <History className="w-4 h-4" />;
                        return <CheckCircle2 className="w-4 h-4" />;
                      };

                      return (
                        <div key={evt.encounterId} className="flex gap-8 relative z-10 group cursor-pointer">
                          <div className="w-11 h-11 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] transition-all">
                            {getIcon(evt.type)}
                          </div>
                          <div className="pt-1 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-black uppercase text-[var(--text-primary)]">{evt.type.replace('_', ' ')}</h4>
                              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                {date.toLocaleDateString()} // {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest mt-1">
                              Provider: {evt.practitioner ? `${evt.practitioner.firstName} ${evt.practitioner.lastName}` : "System Automated"}
                            </p>
                            <div className="mt-4 p-4 rounded-xl bg-[var(--input-bg)]/50 border border-[var(--card-border)] group-hover:bg-[var(--primary)]/5 transition-all">
                              <p className="text-xs text-[var(--text-secondary)] italic">
                                {note}
                              </p>
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
                  <button
                    onClick={() => {
                      setSelectedAppointmentId(undefined);
                      setDrawerOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)]">
                    <Plus className="w-4 h-4" /> Schedule visit
                  </button>
                </div>

                <div className="space-y-4">
                  {apptLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                    </div>
                  ) : appointments.length > 0 ? (
                    appointments.map((appt: any) => (
                      <div
                        key={appt.appointmentId}
                        className="p-6 rounded-[2rem] border border-[var(--card-border)] bg-[var(--input-bg)]/50 flex items-center justify-between hover:border-[var(--primary)]/30 transition-all group cursor-pointer active:scale-[0.99]"
                      >
                        <Link
                          href={`/dashboard/patients/${params.id}/visit?appointmentId=${appt.appointmentId}`}
                          className="flex-1 flex items-center gap-6"
                        >
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
                              <span className="flex items-center gap-1.5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(appt.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="flex items-center gap-1.5 text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">
                                <UserCircle className="w-3.5 h-3.5" />
                                {appt.status?.toUpperCase() === 'COMPLETED' && appt.encounters?.[0]?.practitioner
                                  ? `${appt.encounters[0].practitioner.firstName} ${appt.encounters[0].practitioner.lastName}`
                                  : `${appt.practitioner?.firstName} ${appt.practitioner?.lastName}`}
                              </span>
                            </div>
                          </div>
                        </Link>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 pr-4 border-r border-[var(--card-border)]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointmentId(appt.appointmentId);
                                setDrawerOpen(true);
                              }}
                              className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30 transition-all"
                              title="Edit Schedule"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>

                          {appt.status?.toUpperCase().includes('PROGRESS') || appt.status?.toUpperCase() === 'LIVE' ? (
                            <Link
                              href={`/dashboard/patients/${params.id}/visit?appointmentId=${appt.appointmentId}`}
                              className="px-6 py-3 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                            >
                              <Zap className="w-4 h-4" /> Join Visit
                            </Link>
                          ) : appt.status?.toUpperCase().includes('SCHEDULED') ? (
                            <>
                              <Link
                                href={`/dashboard/patients/${params.id}/visit?appointmentId=${appt.appointmentId}`}
                                className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-[var(--primary-glow)] flex items-center gap-2"
                              >
                                <Stethoscope className="w-4 h-4" /> Start Visit
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAppointmentId(appt.appointmentId);
                                  setDrawerOpen(true);
                                }}
                                className="px-4 py-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setSummaryAppointmentId(appt.appointmentId);
                                setIsSummaryOpen(true);
                              }}
                              className="px-6 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:text-[var(--text-primary)] transition-all"
                            >
                              View Summary
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center opacity-30">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                      <p className="text-xs font-black uppercase tracking-widest">No Historical Appointments Found</p>
                    </div>
                  )}
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                      <div className="flex items-center gap-3">
                        <Wind className="w-5 h-5 text-blue-400" />
                        <span className="text-xs font-black uppercase tracking-tighter">O2 Saturation Feed</span>
                      </div>
                      <span className="text-xl font-black text-emerald-500">98%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-rose-400" />
                        <span className="text-xs font-black uppercase tracking-tighter">Cardiac Pulse Rate</span>
                      </div>
                      <span className="text-xl font-black text-rose-500">72 <span className="text-[10px]">BPM</span></span>
                    </div>
                  </div>
                  <div className="bg-black/5 rounded-3xl border border-[var(--card-border)] flex items-center justify-center p-8">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] text-center">
                      Waiting for active IoT Handshake...
                    </p>
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
                    <h2 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tighter">
                      <Users className="w-6 h-6 text-emerald-400" />
                      Trusted Contacts & POA
                    </h2>
                    <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mt-1">Authorized Representatives & Family</p>
                  </div>
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Contact
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {patient.contacts?.length > 0 ? (
                    patient.contacts.map((contact: any) => (
                      <div key={contact.patientContactId} className={`p-6 rounded-3xl border transition-all ${contact.isPoa ? 'bg-blue-500/5 border-blue-500/20' : 'bg-white/5 border-white/5'}`}>
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
                            {contact.isPoa && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">POA</span>
                            )}
                            {contact.isLegalGuardian && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest border border-purple-500/20">Guardian</span>
                            )}
                            <button
                              onClick={() => {
                                setEditingContact(contact);
                                setShowAddContact(true);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--primary)]/20 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove ${contact.firstName} ${contact.lastName}?`)) {
                                  deleteContact({ variables: { input: { patientContactId: contact.patientContactId } } });
                                }
                              }}
                              className="p-1.5 rounded-lg bg-white/5 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

                        {contact.isPoa && (
                          <div className="pt-4 border-t border-blue-500/10">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3">Power of Attorney Records</p>
                            <button
                              onClick={() => {
                                const poaDoc = patient.documents?.find((d: any) =>
                                  d.patientContactId === contact.patientContactId &&
                                  (d.documentType === 'POA' || d.title.toUpperCase().includes('POA'))
                                );
                                if (poaDoc) {
                                  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/upload/document/${poaDoc.patientDocumentId}`;
                                  window.open(url, '_blank');
                                } else {
                                  alert("No POA document found for this contact. Please upload it in the Document Vault below.");
                                }
                              }}
                              className="w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                              <FileText className="w-3.5 h-3.5" /> View POA Document (PDF)
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">No additional contacts registered.</p>
                    </div>
                  )}
                </div>
              </div>

              <DocumentVault patientId={params.id as string} />
            </div>
          )}

          {/* Intervention Action Area */}
          {!activeAppointment && (
            <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--card-border)] border-dashed flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4 text-[var(--primary)] relative z-10">
                <ClipboardList className="w-6 h-6" />
              </div>

              {nextScheduledAppointment ? (
                <div className="relative z-10 space-y-2">
                  <h3 className="text-[var(--text-primary)] font-black text-xl uppercase tracking-tighter">Next Scheduled Visit</h3>
                  <div className="flex items-center justify-center gap-4 py-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[var(--input-bg)] rounded-lg border border-[var(--card-border)]">
                      <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                        {new Date(nextScheduledAppointment.scheduledStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[var(--input-bg)] rounded-lg border border-[var(--card-border)]">
                      <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                        {new Date(nextScheduledAppointment.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mt-2">
                    Provider: {nextScheduledAppointment.practitioner?.firstName} {nextScheduledAppointment.practitioner?.lastName}
                  </p>

                  <div className="flex gap-4 mt-8">
                    <Link
                      href={`/dashboard/patients/${params.id}/visit?appointmentId=${nextScheduledAppointment.appointmentId}`}
                      className="px-8 py-4 rounded-2xl bg-[var(--primary)] text-white font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-[var(--primary-glow)]"
                    >
                      <Zap className="w-5 h-5" />
                      Start Scheduled Visit
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedAppointmentId(nextScheduledAppointment.appointmentId);
                        setDrawerOpen(true);
                      }}
                      className="px-8 py-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3 hover:bg-[var(--primary-glow)] transition-all">
                      <Edit3 className="w-4 h-4" />
                      Adjust Schedule
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative z-10">
                  <h3 className="text-[var(--text-primary)] font-black text-xl uppercase tracking-tighter">Encounter Registry</h3>
                  <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mt-2 max-w-xs leading-relaxed">No upcoming visits detected in the registry. Schedule a new encounter to begin assessment.</p>
                  <div className="flex gap-4 mt-10">
                    <button
                      onClick={() => {
                        setSelectedAppointmentId(undefined);
                        setDrawerOpen(true);
                      }}
                      className="px-10 py-4 rounded-2xl bg-[var(--primary)] text-white font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-[var(--primary-glow)]"
                    >
                      <Plus className="w-5 h-5" />
                      Schedule & Start Visit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BookingDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          refetch();
          refetchAppts();
        }}
        onBooked={() => {
          setDrawerOpen(false);
          refetch();
          refetchAppts();
        }}
        appointmentId={selectedAppointmentId}
        patientId={params.id as string}
      />

      <AddContactDrawer
        open={showAddContact}
        onClose={() => {
          setShowAddContact(false);
          setEditingContact(null);
        }}
        onSuccess={() => {
          refetch();
          setShowAddContact(false);
          setEditingContact(null);
        }}
        initialData={editingContact}
        patientId={params.id as string}
      />

      <EditDemographicsDrawer
        open={showEditDemographics}
        onClose={() => setShowEditDemographics(false)}
        onSuccess={() => refetch()}
        patient={patient}
      />
      <EditCommunicationsDrawer
        open={showEditCommunications}
        onClose={() => setShowEditCommunications(false)}
        onSuccess={() => refetch()}
        patient={patient}
      />
      {summaryAppointmentId && (
        <VisitSummaryDrawer
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          patientId={params.id as string}
          appointmentId={summaryAppointmentId}
        />
      )}

      <EmergencyActionDrawer
        open={showEmergencyDrawer}
        onClose={() => setShowEmergencyDrawer(false)}
        patient={patient}
        onEscalate={() => setIsEmergency(true)}
      />
    </div>
  );
}
