"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { 
  PhoneCall, 
  CheckCircle2, 
  Calendar, 
  Stethoscope, 
  ArrowRight,
  ChevronRight,
  ChevronLeft,
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
  PhoneForwarded,
  Mic,
  Volume2,
  Hash,
  X,
  History,
  PhoneIncoming,
  PhoneOff,
  UserPlus,
  Zap,
  Target
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
  
  // Dialer State
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isDialPadOpen, setIsDialPadOpen] = useState(false);
  const [dialedNumber, setDialedNumber] = useState("");
  
  // Wizard State
  const [disposition, setDisposition] = useState("COOPERATIVE");
  const [communicationStatus, setCommunicationStatus] = useState("VERBAL");
  const [techAccess, setTechAccess] = useState("SMARTPHONE_ONLY");
  const [barriersToCare, setBarriersToCare] = useState("");
  const [orientationDate, setOrientationDate] = useState("");

  // Missing Data Handling
  const [tempNumbers, setTempNumbers] = useState<Record<string, string>>({});
  const [addedRelatives, setAddedRelatives] = useState<any[]>([]);
  const [isAddingRelative, setIsAddingRelative] = useState(false);
  const [newRelativeForm, setNewRelativeForm] = useState({ firstName: '', lastName: '', relationship: 'Other', phoneNumber: '' });

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

  const handleAddRelative = () => {
    if (!newRelativeForm.firstName || !newRelativeForm.phoneNumber) return;
    setAddedRelatives([...addedRelatives, { ...newRelativeForm, outreachContactId: `temp-${Date.now()}` }]);
    setNewRelativeForm({ firstName: '', lastName: '', relationship: 'Other', phoneNumber: '' });
    setIsAddingRelative(false);
  };

  const handleTempNumberChange = (id: string, val: string) => {
    setTempNumbers(prev => ({ ...prev, [id]: val }));
  };

  const handleCall = (contact: any) => {
    setActiveCall({
      ...contact,
      startTime: new Date(),
      status: 'Connecting...'
    });
    setTimeout(() => {
      setActiveCall((prev: any) => prev ? { ...prev, status: 'Active' } : null);
    }, 1500);
  };

  const endCall = () => {
    setActiveCall(null);
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
        <div className="max-w-md mx-auto mt-20 p-6 glass-morphism rounded-2xl text-center space-y-4 animate-in zoom-in duration-300">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h2 className="text-lg font-black text-white uppercase">Lead Not Found</h2>
            <button onClick={() => router.push('/dashboard/outreach')} className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10">Back to Outreach</button>
        </div>
    );
  }

  const hasNoContacts = !lead.primaryPhone && (!lead.otherContacts || lead.otherContacts.length === 0);

  return (
    <div className="max-w-full h-full flex flex-col p-4 space-y-4 overflow-hidden">
      {/* High-Density Tactical Header */}
      <div className="flex items-center justify-between bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
             <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-tighter leading-none">Enrollment Intelligence</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Target: {lead.firstName} {lead.lastName}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            {steps.map((step) => (
              <div key={step.id} className={`w-2 h-2 rounded-full transition-all ${currentStep === step.id ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-125' : currentStep > step.id ? 'bg-blue-500/40' : 'bg-white/10'}`} />
            ))}
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">v4.2 // Tactical</span>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Side: Outbound Operations (Main Focus) */}
        <div className="flex-[2] flex flex-col space-y-4 min-h-0">
          <div className="flex-1 glass-morphism rounded-xl border border-white/5 p-6 flex flex-col min-h-0 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Zap className="w-32 h-32" /></div>
             
             {currentStep === 1 && (
               <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Contact Management</h2>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execute clinical engagement protocols.</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setIsDialPadOpen(!isDialPadOpen)} className={`p-2 rounded-lg border transition-all ${isDialPadOpen ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}><Hash className="w-4 h-4" /></button>
                       <button onClick={() => setIsAddingRelative(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest"><UserPlus className="w-4 h-4" /> Add Contact</button>
                    </div>
                  </div>

                  {/* Active HUD */}
                  {activeCall && (
                    <div className="bg-blue-600/90 backdrop-blur-md rounded-xl p-4 flex items-center justify-between shadow-xl animate-pulse-primary shrink-0 border border-blue-400/30">
                       <div className="flex items-center gap-4">
                          <PhoneForwarded className="w-5 h-5 text-white animate-bounce" />
                          <div>
                            <p className="text-white font-black text-sm uppercase tracking-tighter leading-none">{activeCall.status}</p>
                            <p className="text-blue-100 text-sm font-bold uppercase tracking-widest opacity-80">Connected: {activeCall.name} // {activeCall.phone}</p>
                          </div>
                       </div>
                       <button onClick={endCall} className="p-3 rounded-lg bg-red-500 text-white shadow-lg active:scale-95"><PhoneOff className="w-4 h-4" /></button>
                    </div>
                  )}

                  {/* Dialer */}
                  {isDialPadOpen && (
                    <div className="bg-black/40 border border-blue-500/20 rounded-xl p-4 animate-in slide-in-from-top-2 shrink-0">
                       <div className="flex gap-4">
                          <input type="tel" placeholder="Enter Phone Number..." className="flex-1 bg-transparent text-2xl font-black text-white outline-none placeholder:text-slate-700" value={dialedNumber} onChange={e => setDialedNumber(e.target.value)} autoFocus />
                          <button onClick={() => handleCall({name: 'Manual', phone: dialedNumber})} disabled={!dialedNumber} className="p-4 rounded-xl bg-emerald-500 text-white shadow-lg disabled:opacity-30"><PhoneCall className="w-5 h-5" /></button>
                       </div>
                    </div>
                  )}

                  {/* Tactical Contact Grid */}
                  <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                    {hasNoContacts && !isAddingRelative && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-rose-500/20 rounded-xl bg-rose-500/5 p-8 animate-in zoom-in">
                         <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500"><PhoneOff className="w-6 h-6" /></div>
                         <div>
                            <h3 className="text-sm font-black text-white uppercase mb-1">Zero Contacts Found</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Seeder contains no valid phone or email records for this lead.</p>
                         </div>
                         <button onClick={() => setIsAddingRelative(true)} className="px-6 py-2 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20">Add Contact Manually</button>
                      </div>
                    )}

                    {/* Patient Card */}
                    {(lead.primaryPhone || tempNumbers['patient'] || !hasNoContacts) && (
                      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${lead.primaryPhone || tempNumbers['patient'] ? 'bg-blue-500/5 border-blue-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${lead.primaryPhone || tempNumbers['patient'] ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'}`}><User className="w-5 h-5" /></div>
                            <div>
                               <p className="text-white font-black text-sm uppercase leading-none">{lead.firstName} {lead.lastName}</p>
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Lead Primary // {lead.primaryPhone || tempNumbers['patient'] || "No Phone"}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            {!lead.primaryPhone && !tempNumbers['patient'] && <input placeholder="Add Phone..." className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-blue-500 outline-none" value={tempNumbers['patient'] || ""} onChange={e => handleTempNumberChange('patient', e.target.value)} />}
                            <button onClick={() => handleCall({name: lead.firstName, phone: lead.primaryPhone || tempNumbers['patient']})} disabled={!(lead.primaryPhone || tempNumbers['patient'])} className={`p-3 rounded-lg transition-all ${lead.primaryPhone || tempNumbers['patient'] ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}><PhoneCall className="w-4 h-4" /></button>
                         </div>
                      </div>
                    )}

                    {/* Relatives */}
                    {[...(lead.otherContacts || []), ...addedRelatives].map((contact: any) => (
                      <div key={contact.outreachContactId} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between hover:bg-white/[0.05] transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-500"><Users className="w-5 h-5" /></div>
                            <div>
                               <p className="text-white font-black text-sm uppercase leading-none">{contact.firstName} {contact.lastName}</p>
                               <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">{RELATIONSHIP_LABELS[contact.relationship]} // {contact.phoneNumber || tempNumbers[contact.outreachContactId] || "No Phone"}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            {!contact.phoneNumber && !tempNumbers[contact.outreachContactId] && <input placeholder="Add Phone..." className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-blue-500 outline-none" value={tempNumbers[contact.outreachContactId] || ""} onChange={e => handleTempNumberChange(contact.outreachContactId, e.target.value)} />}
                            <button onClick={() => handleCall({name: contact.firstName, phone: contact.phoneNumber || tempNumbers[contact.outreachContactId]})} disabled={!(contact.phoneNumber || tempNumbers[contact.outreachContactId])} className={`p-3 rounded-lg transition-all ${contact.phoneNumber || tempNumbers[contact.outreachContactId] ? 'bg-white/10 text-white hover:bg-blue-500' : 'bg-slate-900 text-slate-700 cursor-not-allowed'}`}><PhoneCall className="w-4 h-4" /></button>
                         </div>
                      </div>
                    ))}

                    {/* Inject Form */}
                    {isAddingRelative && (
                      <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-4 animate-in slide-in-from-bottom-2">
                         <div className="grid grid-cols-3 gap-2">
                            <input placeholder="First Name" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none" value={newRelativeForm.firstName} onChange={e => setNewRelativeForm({...newRelativeForm, firstName: e.target.value})} />
                             <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none" value={newRelativeForm.relationship} onChange={e => setNewRelativeForm({...newRelativeForm, relationship: e.target.value})}>
                               {Object.keys(RELATIONSHIP_LABELS).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                            <input placeholder="Phone Number" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none" value={newRelativeForm.phoneNumber} onChange={e => setNewRelativeForm({...newRelativeForm, phoneNumber: e.target.value})} />
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => setIsAddingRelative(false)} className="flex-1 py-2 rounded-lg bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">Abort</button>
                            <button onClick={handleAddRelative} className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Add to Contact Queue</button>
                         </div>
                      </div>
                    )}
                  </div>
               </div>
             )}

             {currentStep > 1 && (
               <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-300">
                  {currentStep === 2 && (
                    <div className="space-y-4">
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Step 2: Disposition</h2>
                       <div className="grid grid-cols-2 gap-2">
                          {["EAGER", "COOPERATIVE", "HESITANT", "RESISTANT", "REFUSED"].map(v => (
                             <button key={v} onClick={() => { setDisposition(v); setCurrentStep(3); }} className={`p-4 rounded-lg border text-left transition-all ${disposition === v ? 'bg-blue-500/20 border-blue-500/50 text-blue-500' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                <span className="text-[10px] font-black uppercase tracking-widest">{v}</span>
                             </button>
                          ))}
                       </div>
                    </div>
                  )}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Step 3: Clinical Readiness</h2>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Comm Protocol</label>
                             {["VERBAL", "APHASIC", "COGNITIVE"].map(v => (
                               <button key={v} onClick={() => setCommunicationStatus(v)} className={`w-full p-2 rounded-lg border text-left text-[9px] font-black tracking-widest transition-all ${communicationStatus === v ? 'bg-blue-500/20 border-blue-500/50 text-blue-500' : 'bg-white/5 border-white/10 text-slate-500'}`}>{v}</button>
                             ))}
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tech Tier</label>
                             {["SMARTPHONE", "TABLET", "NONE"].map(v => (
                               <button key={v} onClick={() => setTechAccess(v)} className={`w-full p-2 rounded-lg border text-left text-[9px] font-black tracking-widest transition-all ${techAccess === v ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-white/5 border-white/10 text-slate-500'}`}>{v}</button>
                             ))}
                          </div>
                       </div>
                       <textarea value={barriersToCare} onChange={e => setBarriersToCare(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-[10px] font-black text-white outline-none min-h-[100px]" placeholder="LOG CLINICAL BARRIERS..." />
                       <button onClick={() => setCurrentStep(4)} className="w-full bg-blue-500 py-3 rounded-lg text-white text-[10px] font-black uppercase tracking-widest">Next Step</button>
                    </div>
                  )}
                  {currentStep === 4 && (
                    <div className="space-y-6 text-center">
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Step 4: Orientation</h2>
                       <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-4">
                          <Calendar className="w-8 h-8 text-blue-500 mx-auto" />
                          <input type="datetime-local" value={orientationDate} onChange={e => setOrientationDate(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg py-2 px-4 text-xs text-white font-black outline-none focus:border-blue-500" />
                       </div>
                       <button onClick={() => setCurrentStep(5)} className="w-full bg-blue-500 py-3 rounded-lg text-white text-[10px] font-black uppercase tracking-widest">Confirm Schedule</button>
                    </div>
                  )}
                  {currentStep === 5 && (
                    <div className="space-y-6">
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Step 5: Payor & Modality</h2>
                       <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-[10px] font-black text-white uppercase tracking-widest outline-none">
                          <option value="">SELECT PAYOR...</option>
                          {plans.map((p: any) => <option key={p.healthPlanId} value={p.healthPlanId}>{p.name}</option>)}
                       </select>
                       <div className="grid grid-cols-2 gap-2">
                          {["HOME", "FACILITY", "CLINIC", "VIRTUAL"].map(v => (
                             <button key={v} onClick={() => { setSelectedModality(v); setCurrentStep(6); }} className={`p-4 rounded-lg border text-left transition-all ${selectedModality === v ? 'bg-blue-500/20 border-blue-500/50 text-blue-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                <span className="text-[10px] font-black uppercase tracking-widest">{v}</span>
                             </button>
                          ))}
                       </div>
                    </div>
                  )}
                  {currentStep === 6 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in">
                       <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10"><ClipboardCheck className="w-8 h-8" /></div>
                       <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">Ready for Deployment</h2>
                       <button onClick={handleFinalize} disabled={finalizing || !selectedPlan} className="w-full bg-blue-500 py-4 rounded-xl text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/30">{finalizing ? "GENERATING..." : "FINALIZE ENROLLMENT"}</button>
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>

        {/* Right Side: Data Intelligence (Sidebar) */}
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 shrink-0 space-y-4">
             <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><Target className="w-3 h-3" /> Profile Vector</h3>
             <div className="space-y-3">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white font-black text-[10px]">{lead.firstName[0]}{lead.lastName[0]}</div>
                   <p className="text-xs font-black text-white uppercase">{lead.firstName} {lead.lastName}</p>
                </div>
                <div className="h-[1px] bg-white/5" />
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Source Protocol</p>
                   <p className="text-[9px] font-black text-white uppercase">{lead.referralSource || "DIRECT INTAKE"}</p>
                </div>
             </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 shrink-0 space-y-4">
             <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><MapPin className="w-3 h-3" /> Geospatial Context</h3>
             <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-300 uppercase leading-relaxed">
                   {lead.mailingAddress?.street || "NO STREET"}<br/>
                   {lead.mailingAddress?.city}, {lead.mailingAddress?.state} {lead.mailingAddress?.postalCode}
                </p>
             </div>
          </div>

          <div className="flex-1 bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 overflow-y-auto space-y-3 scrollbar-hide">
             <h3 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Clinical Script</h3>
             <p className="text-[10px] font-medium text-slate-400 italic leading-relaxed">
                "Hello, I am calling from the **Palliative Care Team** regarding your health profile. We'd like to discuss the specialized support services we have active in **{lead.mailingAddress?.city || "your area"}**..."
             </p>
          </div>

          <div className="h-14 bg-black/40 border border-white/5 rounded-xl px-4 flex items-center justify-between shrink-0">
             {currentStep > 1 && (
               <button onClick={() => setCurrentStep(prev => prev - 1)} className="flex items-center gap-2 text-slate-500 hover:text-white transition-all">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Abort Step</span>
               </button>
             )}
             <div className="flex-1" />
             <div className="flex gap-1">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className={`w-1 h-1 rounded-full ${currentStep === i ? 'bg-blue-500' : 'bg-white/10'}`} />
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
