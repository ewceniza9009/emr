"use client";

import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
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
  Package
} from "lucide-react";
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
    }
  }
`;

// Separate query for appointments to prevent primary query failure
const GET_PATIENT_APPOINTMENTS = gql`
  query GetPatientAppointments($id: UUID!) {
    appointments(where: { patientId: { eq: $id } }) {
      appointmentId
      scheduledStart
      scheduledEnd
      status
      modality
      practitioner {
        firstName
        lastName
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

export default function PatientDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState("snapshot");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>();
  
  const { data, loading, error, refetch } = useQuery(GET_PATIENT_DETAILS, {
    variables: { id: params.id },
  });

  const { data: summaryData } = useQuery(GET_CLINICAL_SUMMARY, {
    variables: { patientId: params.id },
    skip: !params.id
  });

  const { data: apptData, loading: apptLoading, refetch: refetchAppts } = useQuery(GET_PATIENT_APPOINTMENTS, {
    variables: { id: params.id },
    skip: !params.id
  });

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

  const appointments = apptData?.appointments || [];
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
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/5 border border-rose-500/10">
                  <Activity className="w-3 h-3 text-rose-500" />
                  <span className="text-[9px] font-black text-rose-500 uppercase">72 BPM</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                  <Wind className="w-3 h-3 text-emerald-500" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase">98% SpO2</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/5 border border-amber-500/10">
                  <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                  <span className="text-[9px] font-black text-amber-500 uppercase">98.6°F</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Status: Stable</span>
           </div>
           <button className="px-6 py-2 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all">
             Emergency Action
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
                  {patient.addresses?.[0]?.address?.street}<br/>
                  {patient.addresses?.[0]?.address?.city}, {patient.addresses?.[0]?.address?.postalCode}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xl">
            <h2 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[var(--primary)]" />
              Communications
            </h2>
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
                      
                      {[
                        { date: "2026-05-01", time: "14:20", event: "Progress Note Finalized", provider: "Sarah Chen", icon: <CheckCircle2 className="w-4 h-4" /> },
                        { date: "2026-04-28", time: "09:45", event: "Medication Reconciliation", provider: "Marcus Wright", icon: <ClipboardList className="w-4 h-4" /> },
                        { date: "2026-04-15", time: "11:00", event: "Home Visit Completed", provider: "Elena Rodriguez", icon: <MapPin className="w-4 h-4" /> },
                      ].map((evt, i) => (
                        <div key={i} className="flex gap-8 relative z-10 group cursor-pointer">
                           <div className="w-11 h-11 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] transition-all">
                             {evt.icon}
                           </div>
                           <div className="pt-1 flex-1">
                              <div className="flex items-center justify-between">
                                 <h4 className="text-sm font-black uppercase text-[var(--text-primary)]">{evt.event}</h4>
                                 <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{evt.date} // {evt.time}</span>
                              </div>
                              <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest mt-1">Provider: {evt.provider}</p>
                              <div className="mt-4 p-4 rounded-xl bg-[var(--input-bg)]/50 border border-[var(--card-border)] group-hover:bg-[var(--primary)]/5 transition-all">
                                 <p className="text-xs text-[var(--text-secondary)] italic">Patient reports improved pain management following dosage adjustment. Vital signs stable.</p>
                              </div>
                           </div>
                        </div>
                      ))}
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
                                         {appt.practitioner?.firstName} {appt.practitioner?.lastName}
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
                                  <button className="px-6 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:text-[var(--text-primary)] transition-all">
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
              </div>
           )}

           {activeTab === "coordination" && (
             <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TaskManagement patientId={params.id as string} />
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
    </div>
  );
}

// Added back missing import
import Link from "next/link";
