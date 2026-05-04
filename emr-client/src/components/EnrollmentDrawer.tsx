"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { 
  X,
  PhoneCall, 
  CheckCircle2, 
  Calendar, 
  Stethoscope, 
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  ShieldCheck,
  Activity,
  User,
  MapPin,
  Mail,
  Phone,
  Users,
  Heart,
  AlertCircle,
  ChevronLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

const GET_LEAD_DETAILS = gql`
  query GetLeadDetails($id: UUID!) {
    outreachById(outreachId: $id) {
      patientOutreachId
      firstName
      lastName
      mailingAddress {
        street
        city
        state
        postalCode
      }
      primaryPhone
      primaryEmail
      referralSource
      communicationStatus
      techAccess
      barriersToCare
      otherContacts {
        outreachContactId
        firstName
        lastName
        relationship
        phoneNumber
        email
        isPrimaryContact
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
  }
`;

const FINALIZE_ENROLLMENT = gql`
  mutation FinalizeEnrollment($input: FinalizeEnrollmentCommandInput!) {
    finalizeEnrollment(command: $input)
  }
`;

const RELATIONSHIP_LABELS: Record<string, string> = {
  Spouse: "Spouse",
  Parent: "Parent",
  Child: "Child",
  Sibling: "Sibling",
  Friend: "Friend",
  Guardian: "Guardian",
  Other: "Other",
};

interface Props {
  open: boolean;
  onClose: () => void;
  outreachId: string | null;
}

export default function EnrollmentDrawer({ open, onClose, outreachId }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedModality, setSelectedModality] = useState("HOME_CARE");
  
  // Wizard State
  const [disposition, setDisposition] = useState("COOPERATIVE");
  const [communicationStatus, setCommunicationStatus] = useState("VERBAL");
  const [techAccess, setTechAccess] = useState("SMARTPHONE_ONLY");
  const [barriersToCare, setBarriersToCare] = useState("");
  const [orientationDate, setOrientationDate] = useState("");

  const [finalize, { loading: finalizing }] = useMutation(FINALIZE_ENROLLMENT);

  const { data: leadData, loading: leadLoading, error: leadError } = useQuery(GET_LEAD_DETAILS, {
    variables: { id: outreachId },
    skip: !outreachId || !open,
    fetchPolicy: "network-only"
  });

  const { data: planData } = useQuery(GET_ENROLLMENT_DATA, { skip: !open });

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setSelectedPlan("");
      setSelectedModality("HOME_CARE");
      setDisposition("COOPERATIVE");
      setCommunicationStatus("VERBAL");
      setTechAccess("SMARTPHONE_ONLY");
      setBarriersToCare("");
      setOrientationDate("");
    }
  }, [open, outreachId]);

  const handleFinalize = async () => {
    try {
      const { data: finalizeData } = await finalize({
        variables: {
          input: {
            patientOutreachId: outreachId,
            modality: selectedModality,
            healthPlanId: selectedPlan,
            disposition: disposition,
            communicationStatus: communicationStatus,
            techAccess: techAccess,
            barriersToCare: barriersToCare
          }
        }
      });
      if (finalizeData?.finalizeEnrollment) {
        onClose();
        router.push(`/dashboard/patients/${finalizeData.finalizeEnrollment}`);
      }
    } catch (err) {
      console.error("Enrollment failed:", err);
    }
  };

  const lead = leadData?.outreachById;
  const plans = planData?.healthPlans || [];

  const steps = [
    { id: 1, label: "Contact", icon: PhoneCall },
    { id: 2, label: "Disposition", icon: ShieldCheck },
    { id: 3, label: "Readiness", icon: Activity },
    { id: 4, label: "Orientation", icon: Calendar },
    { id: 5, label: "Modality", icon: Stethoscope },
    { id: 6, label: "Finalize", icon: ClipboardCheck },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 !m-0 !p-0 z-[999999] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={onClose} />

      <div className={`relative h-full w-full max-w-[800px] bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
        flex flex-col transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) 
        ${open ? "translate-x-0" : "translate-x-full"}`}>

        {/* Header */}
        <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-1.5 h-10 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">Patient Enrollment</h2>
              {lead && (
                <span className="text-[10px] font-black text-blue-500 tracking-[0.2em] mt-1 uppercase">
                  Enrolling: {lead.firstName} {lead.lastName}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Tracker */}
        <div className="px-8 py-6 border-b border-[var(--card-border)] bg-[var(--input-bg)]">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <button 
                  onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                  disabled={currentStep <= step.id}
                  className={`flex flex-col items-center gap-2 transition-all group ${currentStep >= step.id ? 'text-blue-500' : 'text-[var(--text-muted)]'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 
                    ${currentStep === step.id ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20 scale-105' : 
                      currentStep > step.id ? 'bg-blue-500/20 border-blue-500/40 text-blue-500 group-hover:bg-blue-500/30' : 'bg-[var(--card-bg)] border-[var(--card-border)]'}`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest">{step.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`h-[1px] flex-1 mx-2 transition-all ${currentStep > step.id ? 'bg-blue-500/40' : 'bg-[var(--card-border)]'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {leadLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
              <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px]">Synchronizing Clinical Data...</p>
            </div>
          ) : leadError ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-rose-500" />
              <p className="text-[var(--text-primary)] font-bold">Failed to load lead details</p>
              <button onClick={onClose} className="px-6 py-2 rounded-xl bg-[var(--input-bg)] text-[var(--text-primary)] text-xs font-bold uppercase border border-[var(--card-border)]">Close Drawer</button>
            </div>
          ) : lead && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-[var(--card-border)] rounded-3xl p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-[var(--text-primary)] font-black text-2xl tracking-tight uppercase">{lead.firstName} {lead.lastName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Active Outreach</span>
                          <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase">SOURCE: {lead.referralSource || "DIRECT"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[var(--card-border)]">
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> Mailing Address
                        </p>
                        <p className="text-[var(--text-secondary)] text-xs font-bold leading-relaxed uppercase">
                          {lead.mailingAddress?.street || "No Street"}<br/>
                          {lead.mailingAddress?.city}, {lead.mailingAddress?.state} {lead.mailingAddress?.postalCode}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                          <Phone className="w-3 h-3" /> Communication
                        </p>
                        <div className="space-y-1">
                          <p className="text-[var(--text-primary)] font-black text-sm font-mono">{lead.primaryPhone || "NO PHONE"}</p>
                          <p className="text-[var(--text-muted)] text-[10px] font-bold truncate">{lead.primaryEmail || "NO EMAIL"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 italic text-[var(--text-secondary)] text-sm leading-relaxed border-l-4 border-l-blue-500">
                    "Hello, I'm calling from the **Palliative Care Team** regarding a referral. We'd like to discuss how we can support you..."
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setCurrentStep(2)} className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left hover:bg-emerald-500/20 transition-all group">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-4" />
                      <h3 className="text-[var(--text-primary)] font-black text-sm uppercase mb-1">Successful Contact</h3>
                      <p className="text-[var(--text-muted)] text-[10px]">Patient agreed to proceed.</p>
                    </button>
                    <button className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-left hover:bg-black/5 dark:hover:bg-white/10 transition-all opacity-50">
                      <PhoneCall className="w-6 h-6 text-[var(--text-muted)] mb-4" />
                      <h3 className="text-[var(--text-primary)] font-black text-sm uppercase mb-1">No Answer</h3>
                      <p className="text-[var(--text-muted)] text-[10px]">Schedule follow-up.</p>
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-[var(--text-muted)] tracking-[0.3em] uppercase">Step 2: Enrollment Disposition</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { label: "Eager & Cooperative", val: "EAGER" },
                      { label: "Generally Cooperative", val: "COOPERATIVE" },
                      { label: "Hesitant / Unsure", val: "HESITANT" },
                      { label: "Resistant / Hostile", val: "RESISTANT" },
                      { label: "Refused Enrollment", val: "REFUSED" },
                    ].map((disp) => (
                      <button 
                          key={disp.val} 
                          onClick={() => { setDisposition(disp.val); setCurrentStep(3); }} 
                          className={`p-5 rounded-2xl border transition-all text-left flex items-center justify-between group ${disposition === disp.val ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-[var(--input-bg)]'}`}
                      >
                        <span className={`font-black text-xs uppercase tracking-widest ${disposition === disp.val ? 'text-blue-500' : 'text-[var(--text-secondary)]'}`}>{disp.label}</span>
                        <ChevronRight className={`w-4 h-4 ${disposition === disp.val ? 'text-blue-500' : 'text-[var(--text-muted)]'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <h3 className="text-xs font-black text-[var(--text-muted)] tracking-[0.3em] uppercase">Step 3: Clinical Readiness</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Communication</label>
                      <div className="space-y-2">
                        {["VERBAL", "NON_VERBAL", "APHASIC", "COGNITIVE_IMPAIRMENT"].map(c => (
                          <button key={c} onClick={() => setCommunicationStatus(c)}
                            className={`w-full p-3 rounded-xl border text-left text-[10px] font-black tracking-widest transition-all ${communicationStatus === c ? 'bg-blue-500/20 border-blue-500/50 text-blue-500' : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--primary)]/30'}`}>
                            {c.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Digital Access</label>
                      <div className="space-y-2">
                        {["SMARTPHONE_ONLY", "TABLET_COMPUTER", "HIGH_LITERACY", "NONE"].map(t => (
                          <button key={t} onClick={() => setTechAccess(t)}
                            className={`w-full p-3 rounded-xl border text-left text-[10px] font-black tracking-widest transition-all ${techAccess === t ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-emerald-500/30'}`}>
                            {t.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-[var(--card-border)]">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Barriers to Care</label>
                    <textarea 
                      value={barriersToCare} onChange={(e) => setBarriersToCare(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-6 text-[var(--text-primary)] text-xs font-bold min-h-[100px] focus:border-blue-500/50 outline-none transition-all"
                      placeholder="ENTER CLINICAL BARRIERS..."
                    />
                  </div>
                  <button onClick={() => setCurrentStep(4)} className="w-full bg-blue-500 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3">
                    Assessment Complete <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8">
                  <h3 className="text-xs font-black text-[var(--text-muted)] tracking-[0.3em] uppercase">Step 4: Orientation Scheduling</h3>
                  <div className="space-y-6">
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 space-y-6">
                      <Calendar className="w-12 h-12 text-blue-500 mx-auto" />
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center block">Set Orientation Window</label>
                        <input 
                            type="datetime-local" 
                            value={orientationDate} onChange={(e) => setOrientationDate(e.target.value)}
                            className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-2xl py-4 px-6 text-[var(--text-primary)] font-black uppercase tracking-widest text-center outline-none focus:border-blue-500/50" 
                        />
                      </div>
                    </div>
                    <button onClick={() => setCurrentStep(5)} className="w-full bg-blue-500 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">
                      Confirm Orientation Window
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-8">
                  <h3 className="text-xs font-black text-[var(--text-muted)] tracking-[0.3em] uppercase">Step 5: Care Modality & Payor</h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Health Plan / Payor</label>
                      <select 
                        value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-4 px-6 text-[var(--text-primary)] font-black uppercase tracking-widest outline-none focus:border-blue-500/50 appearance-none"
                      >
                        <option value="" className="bg-[var(--card-bg)]">SELECT HEALTH PLAN...</option>
                        {plans.map((p: any) => (
                          <option key={p.healthPlanId} value={p.healthPlanId} className="bg-[var(--card-bg)]">{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {["HOME_CARE", "IN_PATIENT_HOSPICE", "OUTPATIENT_CLINIC", "VIRTUAL_CARE"].map((m) => (
                        <button key={m} onClick={() => { setSelectedModality(m); setCurrentStep(6); }} 
                          className={`p-5 rounded-2xl border transition-all text-left flex items-center justify-between group ${selectedModality === m ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-blue-400/50'}`}>
                          <span className="font-black text-[10px] uppercase tracking-widest">{m.replace('_', ' ')}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-10">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 animate-pulse">
                    <ClipboardCheck className="w-12 h-12" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase">Protocol Validated</h2>
                    <p className="text-[var(--text-muted)] text-sm font-bold max-w-sm uppercase tracking-wide">Mandatory assessment complete. System ready to generate Clinical MRN.</p>
                  </div>
                  <div className="flex flex-col w-full gap-4 max-w-sm">
                    <button 
                      onClick={handleFinalize}
                      disabled={finalizing || !selectedPlan}
                      className="w-full py-5 rounded-2xl bg-blue-500 text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {finalizing ? "GENERATING RECORD..." : "FINALISE ENROLLMENT"}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => setCurrentStep(5)} className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors">
                      Review Parameters
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-20 px-8 border-t border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
          {currentStep > 1 && (
            <button onClick={() => setCurrentStep(prev => prev - 1)} className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            </button>
          )}
          <div className="flex-1" />
          <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] opacity-40">
            Aura OS // Enrollment Core v4.2
          </span>
        </div>
      </div>
    </div>
  );
}
