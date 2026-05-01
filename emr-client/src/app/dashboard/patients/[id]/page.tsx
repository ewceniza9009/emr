"use client";

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
  UserCircle
} from "lucide-react";
import Link from "next/link";

const GET_PATIENT_DETAILS = gql`
  query GetPatientDetails($id: UUID!) {
    patientById(patientId: $id) {
      patientId
      mrn
      firstName
      lastName
      dob
      biologicalSex
      address
      city
      postalCode
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

export default function PatientDetailPage() {
  const params = useParams();
  const { data, loading, error } = useQuery(GET_PATIENT_DETAILS, {
    variables: { id: params.id },
  });

  if (loading) return <div className="p-10 text-white">Loading Clinical Profile...</div>;
  if (error) return <div className="p-10 text-red-400">Error loading patient record.</div>;

  const patient = data?.patientById;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/patients" className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{patient.firstName} {patient.lastName}</h1>
          <p className="text-slate-400 text-sm">MRN: {patient.mrn} • {patient.biologicalSex}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Patient Snapshot */}
        <div className="space-y-6">
          <div className="glass-morphism rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-400" />
              Bio Profile
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-500 text-sm">Date of Birth</span>
                <span className="text-white text-sm font-medium">{new Date(patient.dob).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-500 text-sm">Postal Code</span>
                <span className="text-white text-sm font-medium">{patient.postalCode || 'Not Set'}</span>
              </div>
              <div className="flex justify-between pb-3">
                <span className="text-slate-500 text-sm">Location</span>
                <span className="text-white text-sm font-medium text-right">{patient.address}, {patient.city}</span>
              </div>
            </div>
          </div>

          <div className="glass-morphism rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              Communication Registry
            </h2>
            <div className="space-y-4">
              {patient.phones.map((phone: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                     <Phone className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="text-white text-sm font-medium">{phone.phoneNumber}</p>
                     <p className="text-slate-500 text-[10px] uppercase tracking-wider">{phone.type}</p>
                   </div>
                </div>
              ))}
              {patient.emails.map((email: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                     <Mail className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="text-white text-sm font-medium">{email.emailAddress}</p>
                     <p className="text-slate-500 text-[10px] uppercase tracking-wider">{email.type}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Clinical Timeline */}
        <div className="lg:col-span-2 space-y-6">
           <div className="glass-morphism rounded-3xl p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-slate-500">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h3 className="text-white font-bold text-lg">No Clinical Encounters</h3>
              <p className="text-slate-500 text-sm max-w-xs mt-2">There are no documented encounters for this patient yet. Start a new assessment below.</p>
              <div className="flex gap-4 mt-8">
            <Link 
              href={`/dashboard/patients/${params.id}/visit`}
              className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-bold flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              <Stethoscope className="w-5 h-5" />
              Start Guided Visit
            </Link>
            <button className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center gap-2 hover:bg-white/10 transition-all">
              <Plus className="w-5 h-5" />
              Log Encounter
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
