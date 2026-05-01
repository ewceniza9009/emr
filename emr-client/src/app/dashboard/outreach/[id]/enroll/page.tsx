"use client";

import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { 
  PhoneCall, 
  CheckCircle2, 
  Calendar, 
  Stethoscope, 
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  ShieldCheck,
  Activity
} from "lucide-react";

const GET_LEAD_DETAILS = gql`
  query GetLeadDetails($id: ID!) {
    outreachById(id: $id) {
      outreachId
      firstName
      lastName
      primaryPhone
      status
      city
    }
  }
`;

export default function EnrollmentWizard() {
  const params = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const { data, loading } = useQuery(GET_LEAD_DETAILS, { variables: { id: params.id } });

  const lead = data?.outreachById;

  const steps = [
    { id: 1, label: "Contact", icon: PhoneCall },
    { id: 2, label: "Disposition", icon: ShieldCheck },
    { id: 3, label: "Readiness", icon: Activity },
    { id: 4, label: "Orientation", icon: Calendar },
    { id: 5, label: "Modality", icon: Stethoscope },
    { id: 6, label: "Finalize", icon: ClipboardCheck },
  ];

  if (loading) return <div className="p-10 text-white">Loading Enrollment Workflow...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Patient Enrollment</h1>
          <p className="text-slate-400">Enrolling: <span className="text-blue-400 font-semibold">{lead.firstName} {lead.lastName}</span></p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
           Workflow in Progress
        </div>
      </div>

      {/* Step Tracker */}
      <div className="flex items-center justify-between px-2">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center gap-2 transition-all ${currentStep >= step.id ? 'text-blue-400' : 'text-slate-600'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 
                ${currentStep === step.id ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20 scale-110' : 
                  currentStep > step.id ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/5'}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-[2px] flex-1 mx-4 transition-all ${currentStep > step.id ? 'bg-blue-500/40' : 'bg-white/5'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Wizard Content Area */}
      <div className="glass-morphism rounded-3xl p-10 min-h-[400px] flex flex-col">
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Step 1: Contact Outbound</h2>
              <p className="text-slate-400">Call the primary contact at <span className="text-white font-mono">{lead.primaryPhone}</span> to begin enrollment.</p>
            </div>

            {/* Dynamic Script Panel */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-blue-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Official Call Script: {lead.city || "General"}</span>
              </div>
              <div className="text-slate-300 text-sm leading-relaxed italic italic-font">
                "Hello, I'm calling from the Palliative Care Team regarding a referral from {lead.referralSource || "your doctor"}. 
                We'd like to discuss how we can support you and your family with our specialized care services in {lead.city || "your area"}..."
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => setCurrentStep(2)} className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left group hover:bg-emerald-500/20 transition-all">
                <CheckCircle2 className="text-emerald-400 mb-4 w-8 h-8" />
                <h3 className="text-white font-bold mb-1">Contact Successful</h3>
                <p className="text-emerald-400/60 text-sm">Patient/Family reached and ready to proceed.</p>
              </button>
              <button className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-all">
                <PhoneCall className="text-slate-400 mb-4 w-8 h-8" />
                <h3 className="text-white font-bold mb-1">No Answer / Call Later</h3>
                <p className="text-slate-500 text-sm">Mark for follow-up in 24 hours.</p>
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Step 2: Enrollment Disposition</h2>
              <p className="text-slate-400">Record the patient/family sentiment regarding Palliative care.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Eager & Cooperative", val: "Eager", color: "emerald" },
                { label: "Hesitant / Unsure", val: "Hesitant", color: "amber" },
                { label: "Resistant / Hostile", val: "Resistant", color: "red" },
                { label: "Refused Enrollment", val: "Refused", color: "slate" },
              ].map((disp) => (
                <button key={disp.val} onClick={() => setCurrentStep(3)} className={`p-6 rounded-2xl border border-white/5 bg-white/5 text-left hover:border-${disp.color}-500/50 hover:bg-${disp.color}-500/5 transition-all`}>
                  <div className={`text-${disp.color}-400 font-bold mb-1`}>{disp.label}</div>
                  <p className="text-slate-500 text-xs">Set disposition to {disp.val}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Step 3: Clinical Readiness & Barriers</h2>
              <p className="text-slate-400">Assess communication ability and technological access for remote care.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Communication Status</label>
                <div className="space-y-2">
                  {["Verbal", "Non-Verbal", "Aphasic / Impaired"].map(c => (
                    <button key={c} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left text-sm text-slate-300 hover:border-blue-500/50 transition-all">{c}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Digital Access</label>
                <div className="space-y-2">
                  {["Smartphone Only", "Tablet / Computer", "No Tech Access"].map(t => (
                    <button key={t} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left text-sm text-slate-300 hover:border-emerald-500/50 transition-all">{t}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
               <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Specific Barriers to Care</label>
               <textarea className="w-full premium-input rounded-2xl p-6 text-white min-h-[100px]" placeholder="e.g., Financial constraints, physical isolation, caregiver burnout..." />
            </div>
            <button onClick={() => setCurrentStep(4)} className="w-full premium-button premium-gradient py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2">
              Assessment Complete <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Step 4: Orientation Session</h2>
              <p className="text-slate-400">Schedule the mandatory orientation session with the family.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Orientation Date & Time</label>
                <input type="datetime-local" className="w-full premium-input rounded-2xl py-4 px-6 text-white" />
              </div>
              <button onClick={() => setCurrentStep(5)} className="w-full premium-button premium-gradient py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2">
                Confirm Schedule <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Step 4: Care Modality & Payor</h2>
              <p className="text-slate-400">Select the health plan and how the care will be delivered.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Health Plan / Customer Tag</label>
                <select className="w-full premium-input rounded-2xl py-4 px-6 text-white appearance-none">
                   <option value="">Select Health Plan...</option>
                   <option value="philhealth">PhilHealth (National)</option>
                   <option value="maxicare">Maxicare (Corporate)</option>
                   <option value="intellicare">Intellicare</option>
                   <option value="self">Self-Pay / Private</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["Home Care", "In-Patient Hospice", "Outpatient Clinic", "Virtual Care"].map((mod) => (
                <button key={mod} onClick={() => setCurrentStep(6)} className="p-5 rounded-2xl bg-white/5 border border-white/10 text-white text-left font-medium hover:border-blue-400/50 hover:bg-blue-500/5 transition-all flex items-center justify-between group">
                  {mod}
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

        {currentStep === 6 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Enrollment Ready</h2>
              <p className="text-slate-400 max-w-sm">All mandatory steps are complete. Click below to generate the MRN and create the clinical record.</p>
            </div>
            <button className="premium-button premium-gradient px-12 py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-blue-500/20">
              Finalize & Generate MRN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
