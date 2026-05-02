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
  Activity,
  User,
  MapPin,
  Mail,
  Phone,
  Users,
  Heart,
  AlertCircle,
} from "lucide-react";

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

export default function EnrollmentWizard() {
  const params = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedModality, setSelectedModality] = useState("HOME_CARE");
  
  // Wizard State - Enum values in ALL_CAPS for GraphQL compatibility
  const [disposition, setDisposition] = useState("COOPERATIVE");
  const [communicationStatus, setCommunicationStatus] = useState("VERBAL");
  const [techAccess, setTechAccess] = useState("SMARTPHONE_ONLY");
  const [barriersToCare, setBarriersToCare] = useState("");
  const [orientationDate, setOrientationDate] = useState("");

  const [finalize, { loading: finalizing }] = useMutation(FINALIZE_ENROLLMENT);

  const { data: leadData, loading: leadLoading, error: leadError } = useQuery(GET_LEAD_DETAILS, {
    variables: { id: params.id },
    fetchPolicy: "network-only"
  });

  const { data: planData } = useQuery(GET_ENROLLMENT_DATA);

  const handleFinalize = async () => {
    try {
      const { data: finalizeData } = await finalize({
        variables: {
          input: {
            patientOutreachId: params.id,
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

  if (leadLoading) return <div className="p-20 text-center"><div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" /> <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Enrollment Workflow...</p></div>;

  if (leadError || (!lead && !leadLoading)) {
    return (
        <div className="max-w-md mx-auto mt-20 p-10 glass-morphism rounded-3xl text-center space-y-6 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center justify-center mx-auto text-red-400">
                <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Lead Not Found</h2>
                <p className="text-slate-400 text-sm">We couldn't find an outreach lead with ID:<br/><span className="text-red-400 font-mono text-xs">{params.id}</span></p>
            </div>
            <button onClick={() => router.push('/dashboard/outreach')} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
                Back to Outreach List
            </button>
        </div>
    );
  }

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
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Step 1: Contact Outbound</h2>
              <p className="text-slate-400">Review patient info and reach out to initiate enrollment.</p>
            </div>

            {/* Patient Info Card */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-3xl tracking-tight">{lead.firstName} {lead.lastName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">Outreach Lead</div>
                    <div className="text-slate-500 text-xs font-medium">ID: {lead.patientOutreachId.split('-')[0]}...</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Mailing Address</p>
                        <p className="text-slate-200 text-sm leading-relaxed">
                            {lead.mailingAddress?.street || "No Street Address"}<br/>
                            {lead.mailingAddress?.city}, {lead.mailingAddress?.state} {lead.mailingAddress?.postalCode}
                        </p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Heart className="w-3 h-3" /> Referral Source</p>
                        <p className="text-white font-bold text-lg">{lead.referralSource || "Not Specified"}</p>
                    </div>
                </div>
              </div>
            </div>

            {/* Primary Contacts */}
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2"><Phone className="w-3 h-3" /> Primary Communication</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.primaryPhone ? (
                  <div className="flex items-center justify-between bg-blue-500/5 border border-blue-500/15 rounded-2xl px-6 py-5 group hover:bg-blue-500/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400"><Phone className="w-5 h-5" /></div>
                      <div>
                        <p className="text-white font-bold text-lg font-mono">{lead.primaryPhone}</p>
                        <p className="text-slate-500 text-xs">Primary Mobile</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${lead.primaryPhone}`}
                      className="p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                    >
                      <PhoneCall className="w-5 h-5" />
                    </a>
                  </div>
                ) : (
                    <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl px-6 py-5 opacity-50 grayscale">
                        <div className="p-3 rounded-xl bg-white/10 text-slate-500"><Phone className="w-5 h-5" /></div>
                        <p className="text-slate-500 text-sm font-medium italic">No Primary Phone</p>
                    </div>
                )}

                {lead.primaryEmail ? (
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-6 py-5 hover:bg-white/[0.08] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-white/10 text-slate-400"><Mail className="w-5 h-5" /></div>
                      <div>
                        <p className="text-white font-bold truncate max-w-[150px]">{lead.primaryEmail}</p>
                        <p className="text-slate-500 text-xs">Primary Email</p>
                      </div>
                    </div>
                    <a
                      href={`mailto:${lead.primaryEmail}`}
                      className="p-3 rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 transition-all"
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                ) : (
                    <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl px-6 py-5 opacity-50 grayscale">
                        <div className="p-3 rounded-xl bg-white/10 text-slate-500"><Mail className="w-5 h-5" /></div>
                        <p className="text-slate-500 text-sm font-medium italic">No Primary Email</p>
                    </div>
                )}
              </div>
            </div>

            {/* Other Contacts (Family/Emergency) */}
            {lead.otherContacts && lead.otherContacts.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Family & Emergency Contacts</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lead.otherContacts.map((contact: any) => (
                    <div key={contact.outreachContactId} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/5">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{contact.firstName} {contact.lastName}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 text-[10px] font-bold uppercase tracking-tighter">{RELATIONSHIP_LABELS[contact.relationship] ?? contact.relationship}</span>
                            {contact.isPrimaryContact && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Primary Contact" />}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {contact.phoneNumber && (
                          <a
                            href={`tel:${contact.phoneNumber}`}
                            className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/20"
                            title={`Call ${contact.firstName}`}
                          >
                            <PhoneCall className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call Script */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-8 space-y-4">
              <div className="flex items-center gap-3 text-blue-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Official Call Script</span>
              </div>
              <div className="text-slate-300 text-lg leading-relaxed italic border-l-2 border-blue-500/30 pl-6">
                "Hello, I'm calling from the <span className="text-white font-bold">Palliative Care Team</span> regarding a referral from <span className="text-white underline decoration-blue-500/50 underline-offset-4">{lead.referralSource || "your provider"}</span>. 
                We'd like to discuss how we can support you and your family with our specialized care services in <span className="text-white font-bold">{lead.mailingAddress?.city || "your area"}</span>..."
              </div>
            </div>

            {/* Outcome Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <button onClick={() => setCurrentStep(2)} className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-left group hover:bg-emerald-500/20 transition-all shadow-lg hover:shadow-emerald-500/5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400"><CheckCircle2 className="w-6 h-6" /></div>
                <h3 className="text-white text-xl font-bold mb-2">Contact Successful</h3>
                <p className="text-emerald-400/60 text-sm leading-snug">Patient or family member reached and agreed to move forward.</p>
              </button>
              <button className="p-8 rounded-3xl bg-white/5 border border-white/10 text-left group hover:bg-white/10 transition-all shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 text-slate-400 group-hover:text-white transition-colors"><PhoneCall className="w-6 h-6" /></div>
                <h3 className="text-white text-xl font-bold mb-2">No Answer / Call Later</h3>
                <p className="text-slate-500 text-sm leading-snug">Unable to reach contact. Mark for automatic follow-up in 24 hours.</p>
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
                { label: "Eager & Cooperative", val: "EAGER" },
                { label: "Generally Cooperative", val: "COOPERATIVE" },
                { label: "Hesitant / Unsure", val: "HESITANT" },
                { label: "Resistant / Hostile", val: "RESISTANT" },
                { label: "Refused Enrollment", val: "REFUSED" },
              ].map((disp) => (
                <button 
                    key={disp.val} 
                    onClick={() => { setDisposition(disp.val); setCurrentStep(3); }} 
                    className={`p-6 rounded-2xl border transition-all text-left group ${disposition === disp.val ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                  <div className={`font-bold mb-1 ${disposition === disp.val ? 'text-blue-400' : 'text-white group-hover:text-blue-400'}`}>{disp.label}</div>
                  <p className="text-slate-500 text-xs">{disposition === disp.val ? 'Current Selection' : `Set disposition to ${disp.val}`}</p>
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
                  {[
                    { label: "Verbal", val: "VERBAL" },
                    { label: "Non-Verbal", val: "NON_VERBAL" },
                    { label: "Aphasic", val: "APHASIC" },
                    { label: "Speech Impaired", val: "SPEECH_IMPAIRED" },
                    { label: "Cognitive Impairment", val: "COGNITIVE_IMPAIRMENT" },
                  ].map(c => (
                    <button 
                        key={c.val} 
                        onClick={() => setCommunicationStatus(c.val)}
                        className={`w-full p-4 rounded-xl border text-left text-sm transition-all ${communicationStatus === c.val ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/5 text-slate-300 hover:border-blue-500/30'}`}
                    >
                        {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Digital Access</label>
                <div className="space-y-2">
                  {[
                    { label: "None / Low Access", val: "NONE" },
                    { label: "Smartphone Only", val: "SMARTPHONE_ONLY" },
                    { label: "Tablet / Computer", val: "TABLET_COMPUTER" },
                    { label: "High Literacy", val: "HIGH_LITERACY" },
                    { label: "Needs Assistance", val: "NEEDS_ASSISTANCE" },
                  ].map(t => (
                    <button 
                        key={t.val} 
                        onClick={() => setTechAccess(t.val)}
                        className={`w-full p-4 rounded-xl border text-left text-sm transition-all ${techAccess === t.val ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/5 text-slate-300 hover:border-emerald-500/30'}`}
                    >
                        {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
               <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Specific Barriers to Care</label>
               <textarea 
                  value={barriersToCare}
                  onChange={(e) => setBarriersToCare(e.target.value)}
                  className="w-full premium-input rounded-2xl p-6 text-white min-h-[100px]" 
                  placeholder="e.g., Financial constraints, physical isolation, caregiver burnout..." 
               />
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
                <input 
                    type="datetime-local" 
                    value={orientationDate}
                    onChange={(e) => setOrientationDate(e.target.value)}
                    className="w-full premium-input rounded-2xl py-4 px-6 text-white" 
                />
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
              <h2 className="text-2xl font-bold text-white">Step 5: Care Modality & Payor</h2>
              <p className="text-slate-400">Select the health plan and how the care will be delivered.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Health Plan / Customer Tag</label>
                <select 
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full premium-input rounded-2xl py-4 px-6 text-white appearance-none bg-slate-900"
                >
                   <option value="">Select Health Plan...</option>
                   {plans.map((p: any) => (
                     <option key={p.healthPlanId} value={p.healthPlanId}>{p.name}</option>
                   ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Home Visit (In-Person)", val: "HOME_CARE" },
                { label: "Facility / In-Patient", val: "IN_PATIENT_HOSPICE" },
                { label: "Outpatient Clinic", val: "OUTPATIENT_CLINIC" },
                { label: "Virtual Care / Telehealth", val: "VIRTUAL_CARE" },
              ].map((m) => (
                <button 
                  key={m.val} 
                  onClick={() => { setSelectedModality(m.val); setCurrentStep(6); }} 
                  className={`p-5 rounded-2xl border transition-all flex items-center justify-between group ${selectedModality === m.val ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-white hover:border-blue-400/50'}`}
                >
                  {m.label}
                  <ArrowRight className={`w-4 h-4 ${selectedModality === m.val ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'}`} />
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
            <button 
              onClick={handleFinalize}
              disabled={finalizing || !selectedPlan}
              className="px-10 py-4 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {finalizing ? "Generating MRN..." : "Finalize & Generate MRN"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
