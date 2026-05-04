"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { 
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
  PhoneForwarded,
  Hash,
  X,
  PhoneOff,
  UserPlus,
  Zap,
  Target,
  Trash2,
  Clock
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
      status
      communicationStatus
      techAccess
      barriersToCare
      selectedModality
      disposition
      healthPlanId
      otherContacts {
        outreachContactId
        firstName
        lastName
        relationship
        phoneNumber
        email
        isPrimaryContact
      }
      activities {
        outreachActivityId
        activityDate
        outcome
        method
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
  }
`;

const GET_OUTREACH_SCRIPTS = gql`
  query GetOutreachScripts {
    outreachScripts {
      outreachScriptId
      scriptTitle
      content
      isDefault
    }
  }
`;

const FINALIZE_ENROLLMENT = gql`
  mutation FinalizeEnrollment($input: FinalizeEnrollmentCommandInput!) {
    finalizeEnrollment(command: $input)
  }
`;

const LOG_OUTREACH_ACTIVITY = gql`
  mutation LogActivity($command: LogOutreachActivityCommandInput!) {
    logOutreachActivity(command: $command)
  }
`;

const ADD_OUTREACH_CONTACT = gql`
  mutation AddContact($command: AddOutreachContactCommandInput!) {
    addOutreachContact(command: $command)
  }
`;

const REMOVE_OUTREACH_CONTACT = gql`
  mutation RemoveContact($command: RemoveOutreachContactCommandInput!) {
    removeOutreachContact(command: $command)
  }
`;

const UPDATE_OUTREACH_LEAD = gql`
  mutation UpdateLead($command: UpdateOutreachLeadCommandInput!) {
    updateOutreachLead(command: $command)
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
  const [isAddingRelative, setIsAddingRelative] = useState(false);
  const [isLoggingNoAnswer, setIsLoggingNoAnswer] = useState(false);
  const [newRelativeForm, setNewRelativeForm] = useState({ firstName: '', lastName: '', relationship: 'Other', phoneNumber: '' });

  const [finalize, { loading: finalizing }] = useMutation(FINALIZE_ENROLLMENT);
  const [logActivity] = useMutation(LOG_OUTREACH_ACTIVITY);
  const [addContact] = useMutation(ADD_OUTREACH_CONTACT);
  const [removeContact] = useMutation(REMOVE_OUTREACH_CONTACT);
  const [updateLead] = useMutation(UPDATE_OUTREACH_LEAD);

  const { data: scriptData } = useQuery(GET_OUTREACH_SCRIPTS);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  
  const scripts = scriptData?.outreachScripts || [];
  const activeScript = scripts.find((s: any) => s.outreachScriptId === selectedScriptId) || scripts.find((s: any) => s.isDefault) || scripts[0];

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

  const handleAddRelative = async () => {
    try {
      await addContact({
        variables: {
          command: {
            patientOutreachId: params.id,
            ...newRelativeForm
          }
        },
        refetchQueries: ["GetLeadDetails"]
      });
      setIsAddingRelative(false);
      setNewRelativeForm({ firstName: '', lastName: '', relationship: 'Other', phoneNumber: '' });
    } catch (e) {
      console.error(e);
    }
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

  const handleRemoveContact = async (id: string) => {
    try {
      await removeContact({
        variables: {
          command: {
            outreachContactId: id
          }
        },
        refetchQueries: ["GetLeadDetails"]
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAbort = () => {
    router.push('/dashboard/outreach');
  };

  const handleNoAnswer = async () => {
    setIsLoggingNoAnswer(true);
    try {
      await logActivity({
        variables: {
          command: {
            outreachId: params.id,
            method: "TELEPHONE",
            outcome: "NO_ANSWER",
            notes: "Automated log: Patient did not answer outbound call."
          }
        },
        refetchQueries: ["GetOutreachList"]
      });
      router.push('/dashboard/outreach');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingNoAnswer(false);
    }
  };

  const lead = leadData?.outreachById;

  useEffect(() => {
    if (lead) {
      if (lead.selectedModality) setSelectedModality(lead.selectedModality);
      if (lead.healthPlanId) setSelectedPlan(lead.healthPlanId);
      if (lead.disposition) setDisposition(lead.disposition);
      if (lead.communicationStatus) setCommunicationStatus(lead.communicationStatus);
      if (lead.techAccess) setTechAccess(lead.techAccess);
      if (lead.barriersToCare) setBarriersToCare(lead.barriersToCare);
    }
  }, [lead]);

  const handleUpdateLead = async (fields: any) => {
    try {
      await updateLead({
        variables: {
          command: {
            patientOutreachId: params.id,
            ...fields
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
  };
  const plans = planData?.healthPlans || [];

  const steps = [
    { id: 1, label: "Engagement", icon: PhoneCall },
    { id: 2, label: "Disposition", icon: ShieldCheck },
    { id: 3, label: "Readiness", icon: Activity },
    { id: 4, label: "Orientation", icon: Calendar },
    { id: 5, label: "Finalize", icon: ClipboardCheck },
  ];

  if (leadLoading) return <div className="p-20 text-center"><div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" /> <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Enrollment Engine...</p></div>;

  if (leadError || (!lead && !leadLoading)) {
    return (
        <div className="max-w-md mx-auto mt-20 p-8 glass-morphism rounded-3xl text-center space-y-6 animate-in zoom-in duration-300 border border-rose-500/20">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Access Protocol Failed</h2>
            <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">The specified outreach vector could not be identified.</p>
            <button onClick={() => router.push('/dashboard/outreach')} className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">Abort & Return</button>
        </div>
    );
  }

  const hasNoContacts = !lead.primaryPhone && (!lead.otherContacts || lead.otherContacts.length === 0);

  return (
    <div className="min-h-screen bg-[#050708] flex flex-col p-6 space-y-6 overflow-hidden">
      {/* Top Intelligence Header */}
      <div className="flex items-center justify-between bg-black/40 backdrop-blur-2xl border border-white/5 px-10 py-6 rounded-3xl shrink-0 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.3)]">
             <Target className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Enrollment Intelligence Hub</h1>
            <div className="flex items-center gap-3 mt-3">
               <span className="text-xs font-black text-teal-500 uppercase tracking-[0.2em]">Target Identification:</span>
               <span className="text-xs font-black text-white uppercase tracking-widest">{lead.firstName} {lead.lastName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <button onClick={handleAbort} className="px-6 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500/20 transition-all flex items-center gap-2">
             <X className="w-4 h-4" /> Abort Enrollment
          </button>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="flex items-center gap-3">
            {steps.map((step) => (
              <div key={step.id} className={`h-1.5 rounded-full transition-all duration-500 ${currentStep === step.id ? 'w-12 bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.6)]' : currentStep > step.id ? 'w-4 bg-teal-500/30' : 'w-4 bg-white/5'}`} />
            ))}
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Version</p>
             <p className="text-xs font-black text-teal-500 uppercase tracking-widest mt-1">AURA-v4.5</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Main Operational Core */}
        <div className="flex-[2.5] flex flex-col min-h-0">
          <div className="flex-1 glass-morphism rounded-3xl border border-white/5 p-10 flex flex-col min-h-0 relative overflow-hidden bg-gradient-to-br from-teal-950/10 to-transparent">
             <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none"><Zap className="w-64 h-64 text-teal-500" /></div>
             
             {currentStep === 1 && (
               <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                       <h2 className="text-4xl font-black text-white uppercase tracking-tight">Contact Management</h2>
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em] mt-3">Execute clinical engagement and verify contact vectors.</p>
                       <div className="flex gap-4 mt-4">
                        {[{id: 'TELEPHONE', label: 'Telephone'}, {id: 'VIDEO', label: 'Video'}].map(m => (
                          <button 
                            key={m.id} 
                            onClick={() => {
                              setSelectedModality(m.id);
                              handleUpdateLead({ modality: m.id });
                            }}
                            className={`p-6 rounded-2xl border transition-all ${selectedModality === m.id ? 'bg-teal-500 border-teal-400 text-black shadow-xl' : 'bg-white/5 border-white/10 text-slate-400 hover:border-teal-500/50'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <button onClick={() => setIsDialPadOpen(!isDialPadOpen)} className={`w-14 h-14 rounded-2xl border transition-all flex items-center justify-center ${isDialPadOpen ? 'bg-teal-500 border-teal-400 text-black shadow-xl shadow-teal-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}><Hash className="w-6 h-6" /></button>
                       <button onClick={() => setIsAddingRelative(true)} className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-teal-500 text-black text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-500/20 hover:bg-teal-600 transition-all"><UserPlus className="w-5 h-5" /> Add New Contact</button>
                    </div>
                  </div>

                  {/* Active Call HUD */}
                  {activeCall && (
                    <div className="bg-teal-600 rounded-3xl p-8 flex items-center justify-between shadow-2xl animate-pulse-primary shrink-0 border border-teal-400/30">
                       <div className="flex items-center gap-8">
                          <div className="w-20 h-20 rounded-2xl bg-black/20 flex items-center justify-center text-white">
                             <PhoneForwarded className="w-10 h-10 animate-bounce" />
                          </div>
                          <div>
                            <p className="text-white font-black text-2xl uppercase tracking-widest leading-none">{activeCall.status}</p>
                            <p className="text-teal-100 text-base font-bold uppercase tracking-widest mt-4 opacity-90">Vector Identification: {activeCall.phone}</p>
                          </div>
                       </div>
                       <button onClick={endCall} className="w-20 h-20 rounded-2xl bg-red-500 text-white shadow-2xl active:scale-90 transition-transform flex items-center justify-center"><PhoneOff className="w-8 h-8" /></button>
                    </div>
                  )}

                  {/* Manual Dialer */}
                  {isDialPadOpen && (
                    <div className="bg-white/5 border border-teal-500/20 rounded-3xl p-10 animate-in slide-in-from-top-6 shrink-0 shadow-2xl relative group/dialer">
                       <button onClick={() => setIsDialPadOpen(false)} className="absolute top-6 right-6 p-2 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-all opacity-0 group-hover/dialer:opacity-100"><X className="w-4 h-4" /></button>
                       <div className="flex gap-8">
                          <input type="tel" placeholder="Enter Phone Number..." className="flex-1 bg-transparent text-5xl font-black text-white outline-none placeholder:text-slate-800 tracking-tighter" value={dialedNumber} onChange={e => setDialedNumber(e.target.value)} autoFocus />
                          <button onClick={() => handleCall({name: 'Manual', phone: dialedNumber})} disabled={!dialedNumber} className="w-20 h-20 rounded-2xl bg-emerald-500 text-black shadow-xl disabled:opacity-30 flex items-center justify-center"><PhoneCall className="w-8 h-8" /></button>
                       </div>
                    </div>
                  )}

                  {/* High-Contrast Contact Grid */}
                  <div className="flex-1 overflow-y-auto pr-4 space-y-4 scrollbar-hide">
                    {hasNoContacts && !isAddingRelative && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-8 border-4 border-dashed border-rose-500/10 rounded-3xl bg-rose-500/5 p-16 animate-in zoom-in">
                         <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.1)]"><PhoneOff className="w-12 h-12" /></div>
                         <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white uppercase tracking-widest">Zero Contacts Found</h3>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">The database seeder contains no communication vectors for this target.</p>
                         </div>
                         <button onClick={() => setIsAddingRelative(true)} className="px-12 py-5 rounded-2xl bg-rose-500 text-white text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-rose-500/30 hover:bg-rose-600 transition-all">Add Primary Contact Manually</button>
                      </div>
                    )}

                    {/* Patient Vector */}
                    {(lead.primaryPhone || !hasNoContacts) && (
                      <div className={`p-8 rounded-3xl border flex items-center justify-between transition-all ${lead.primaryPhone ? 'bg-teal-500/5 border-teal-500/20' : 'bg-amber-500/5 border-amber-500/20 shadow-xl'}`}>
                         <div className="flex items-center gap-8">
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-black shadow-2xl ${lead.primaryPhone ? 'bg-teal-500 shadow-teal-500/20' : 'bg-amber-500 animate-pulse'}`}><User className="w-10 h-10" /></div>
                            <div>
                               <p className="text-white font-black text-3xl uppercase tracking-tight leading-none">{lead.firstName} {lead.lastName}</p>
                               <p className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mt-4">Primary Target Vector // <span className="text-teal-500">{lead.primaryPhone || "AWAITING INJECTION"}</span></p>
                            </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <button onClick={() => handleCall({name: lead.firstName, phone: lead.primaryPhone})} disabled={!lead.primaryPhone} className={`w-20 h-20 rounded-2xl transition-all flex items-center justify-center ${lead.primaryPhone ? 'bg-teal-500 text-black shadow-2xl shadow-teal-500/30 hover:bg-teal-600 active:scale-90' : 'bg-slate-900 text-slate-800 cursor-not-allowed'}`}><PhoneCall className="w-8 h-8" /></button>
                         </div>
                      </div>
                    )}

                    {/* Existing Contacts from DB */}
                    {lead.otherContacts?.map((contact: any) => (
                      <div key={contact.outreachContactId} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl group/contact hover:border-teal-500/30 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20 shadow-lg shadow-teal-500/10">
                              <User className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-white uppercase tracking-wider">{contact.firstName} {contact.lastName}</p>
                              <div className="flex items-center gap-3 mt-1">
                                 <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest px-2 py-0.5 bg-teal-500/10 rounded-md border border-teal-500/10">{contact.relationship}</span>
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{contact.phoneNumber}</span>
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveContact(contact.outreachContactId)}
                          className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover/contact:opacity-100 hover:bg-rose-500 transition-all hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Add Contact Form */}
                    {isAddingRelative && (
                      <div className="p-10 rounded-3xl border border-teal-500/30 bg-teal-500/5 space-y-6 animate-in slide-in-from-bottom-6 shadow-2xl">
                         <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Legal Name</label>
                               <input placeholder="First Name" className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-black outline-none focus:border-teal-500" value={newRelativeForm.firstName} onChange={e => setNewRelativeForm({...newRelativeForm, firstName: e.target.value})} />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kinship Type</label>
                               <select className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-black outline-none focus:border-teal-500 cursor-pointer" value={newRelativeForm.relationship} onChange={e => setNewRelativeForm({...newRelativeForm, relationship: e.target.value})}>
                                  {Object.keys(RELATIONSHIP_LABELS).map(k => <option key={k} value={k}>{k}</option>)}
                               </select>
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Communication Phone</label>
                               <input placeholder="Phone Number" className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-black outline-none focus:border-teal-500" value={newRelativeForm.phoneNumber} onChange={e => setNewRelativeForm({...newRelativeForm, phoneNumber: e.target.value})} />
                            </div>
                         </div>
                         <div className="flex gap-4">
                            <button onClick={() => setIsAddingRelative(false)} className="flex-1 py-5 rounded-2xl bg-white/5 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-white/10 transition-all">Cancel Operation</button>
                            <button onClick={handleAddRelative} className="flex-1 py-5 rounded-2xl bg-teal-500 text-black text-xs font-black uppercase tracking-widest shadow-2xl shadow-teal-500/30 hover:bg-teal-600 transition-all">Add to Queue</button>
                         </div>
                      </div>
                    )}
                   </div>

                   {/* Action Cluster */}
                   <div className="grid grid-cols-2 gap-8 shrink-0">
                      <button 
                        onClick={() => setCurrentStep(2)}
                        className="group p-10 rounded-3xl bg-teal-500/5 border border-teal-500/20 text-left hover:bg-teal-500 hover:border-teal-500 transition-all shadow-2xl"
                      >
                         <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center text-black mb-6 group-hover:bg-black group-hover:text-teal-500 transition-all">
                            <CheckCircle2 className="w-8 h-8" />
                         </div>
                         <p className="text-xl font-black text-white uppercase tracking-widest group-hover:text-black">Contact Verified</p>
                         <p className="text-xs font-black text-teal-600 uppercase mt-4 tracking-wider group-hover:text-black/60">Proceed to lead dispositioning.</p>
                      </button>

                      <button 
                        onClick={handleNoAnswer}
                        disabled={isLoggingNoAnswer}
                        className="group p-10 rounded-3xl bg-white/5 border border-white/10 text-left hover:bg-rose-500/10 hover:border-rose-500/20 transition-all shadow-2xl"
                      >
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all ${isLoggingNoAnswer ? 'bg-rose-500 animate-spin' : 'bg-slate-800 text-white group-hover:bg-rose-500 group-hover:scale-110'}`}>
                            {isLoggingNoAnswer ? <Activity className="w-8 h-8" /> : <PhoneOff className="w-8 h-8" />}
                         </div>
                         <p className="text-xl font-black text-white uppercase tracking-widest">{isLoggingNoAnswer ? "LOGGING..." : "NO ANSWER"}</p>
                         <p className="text-xs font-black text-slate-500 uppercase mt-4 tracking-wider">{isLoggingNoAnswer ? "RECORDING FAILED ATTEMPT IN HISTORY." : "LOG FAILED ATTEMPT."}</p>
                      </button>
                   </div>
                </div>
              )}

             {currentStep > 1 && (
               <div className="flex flex-col h-full space-y-10 animate-in fade-in duration-500">
                  {currentStep === 2 && (
                    <div className="space-y-8">
                       <h2 className="text-4xl font-black text-white uppercase tracking-tight">Lead Disposition</h2>
                       <div className="grid grid-cols-2 gap-4">
                          {["EAGER", "COOPERATIVE", "HESITANT", "RESISTANT", "REFUSED"].map(v => (
                             <button key={v} onClick={() => { 
                                 setDisposition(v); 
                                 handleUpdateLead({ disposition: v });
                                 setCurrentStep(3); 
                               }} className={`p-8 rounded-3xl border text-left flex items-center justify-between group transition-all ${disposition === v ? 'bg-teal-500/10 border-teal-500/50 text-teal-500 shadow-2xl shadow-teal-500/10' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}>
                                <span className="text-xl font-black uppercase tracking-widest">{v}</span>
                                <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" />
                             </button>
                          ))}
                       </div>
                    </div>
                  )}
                  {currentStep === 3 && (
                    <div className="space-y-10">
                       <h2 className="text-4xl font-black text-white uppercase tracking-tight">Clinical Readiness</h2>
                       <div className="grid grid-cols-2 gap-10">
                          <div className="space-y-6">
                             <label className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Communication Status</label>
                             <div className="space-y-2">
                                {["VERBAL", "APHASIC", "COGNITIVE"].map(v => (
                                  <button key={v} onClick={() => { setCommunicationStatus(v); handleUpdateLead({ communicationStatus: v }); }} className={`w-full p-5 rounded-2xl border text-left text-xs font-black tracking-[0.2em] transition-all ${communicationStatus === v ? 'bg-teal-500/20 border-teal-500/50 text-teal-500' : 'bg-white/5 border-white/10 text-slate-600 hover:bg-white/5'}`}>{v}</button>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-6">
                             <label className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Technology access</label>
                             <div className="space-y-2">
                                {["SMARTPHONE", "TABLET", "NONE"].map(v => (
                                  <button key={v} onClick={() => { setTechAccess(v); handleUpdateLead({ techAccess: v }); }} className={`w-full p-5 rounded-2xl border text-left text-xs font-black tracking-[0.2em] transition-all ${techAccess === v ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-white/5 border-white/10 text-slate-600 hover:bg-white/5'}`}>{v}</button>
                                ))}
                             </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Clinical Barriers / Observations</label>
                          <textarea 
                             value={barriersToCare} 
                             onChange={e => setBarriersToCare(e.target.value)} 
                             onBlur={() => handleUpdateLead({ barriersToCare })}
                             className="w-full bg-black/40 border border-white/10 rounded-3xl p-10 text-base font-medium text-white outline-none min-h-[200px] focus:border-teal-500 transition-all placeholder:text-slate-900 shadow-inner" 
                             placeholder="Log clinical barriers or logistical obstacles..." 
                          />
                       </div>
                       <button onClick={() => setCurrentStep(4)} className="w-full bg-teal-500 py-6 rounded-3xl text-black text-sm font-black uppercase tracking-[0.4em] shadow-2xl shadow-teal-500/30 hover:bg-teal-600 transition-all">Proceed to Scheduling</button>
                    </div>
                  )}
                  {currentStep === 4 && (
                    <div className="space-y-12 text-center py-10">
                       <h2 className="text-4xl font-black text-white uppercase tracking-tight">Orientation Scheduling</h2>
                       <div className="bg-white/5 border border-white/10 rounded-[3rem] p-16 space-y-10 shadow-2xl">
                          <div className="w-32 h-32 rounded-[2rem] bg-teal-500/10 flex items-center justify-center text-teal-500 mx-auto shadow-inner">
                             <Calendar className="w-16 h-16" />
                          </div>
                          <div className="space-y-4">
                             <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Select Appointment Timestamp</p>
                             <input type="datetime-local" value={orientationDate} onChange={e => setOrientationDate(e.target.value)} className="bg-black/60 border border-white/10 rounded-2xl py-6 px-10 text-2xl text-white font-black outline-none focus:border-teal-500 shadow-2xl text-center" />
                          </div>
                       </div>
                       <button onClick={() => setCurrentStep(5)} className="w-full bg-teal-500 py-6 rounded-3xl text-black text-sm font-black uppercase tracking-[0.4em] shadow-2xl shadow-teal-500/30 hover:bg-teal-600 transition-all">Confirm Appointment Slot</button>
                    </div>
                  )}
                  {currentStep === 5 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 animate-in zoom-in duration-500">
                       <div className="w-32 h-32 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 shadow-2xl shadow-teal-500/10"><ClipboardCheck className="w-16 h-16" /></div>
                       <div className="space-y-4">
                          <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-tight">Final Validation</h2>
                          <p className="text-base text-slate-500 font-bold uppercase tracking-widest max-w-lg mx-auto">Ready to transition lead into clinical active status.</p>
                       </div>
                       <div className="w-full space-y-4">
                          <p className="text-xs font-black text-slate-600 uppercase tracking-[0.4em] mb-4">Assigned Health Plan</p>
                          <div className="grid grid-cols-2 gap-4">
                             {plans.map((p: any) => (
                               <button 
                                 key={p.healthPlanId} 
                                 onClick={() => {
                                   setSelectedPlan(p.healthPlanId);
                                   handleUpdateLead({ healthPlanId: p.healthPlanId });
                                 }}
                                 className={`p-6 rounded-2xl border text-left transition-all ${selectedPlan === p.healthPlanId ? 'bg-teal-500 border-teal-400 text-black shadow-xl' : 'bg-white/5 border-white/10 text-white hover:border-teal-500/50'}`}
                               >
                                 {p.name}
                               </button>
                             ))}
                          </div>
                       </div>
                       <button onClick={handleFinalize} disabled={finalizing || !selectedPlan} className="w-full bg-teal-500 py-8 rounded-[2.5rem] text-black font-black text-lg uppercase tracking-[0.5em] shadow-2xl shadow-teal-500/40 hover:bg-teal-600 transition-all active:scale-95 disabled:opacity-30">{finalizing ? "PROVISIONING..." : "FINALIZE ENROLLMENT"}</button>
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>

        {/* Intelligence Side-Deck */}
        <div className="flex-1 flex flex-col space-y-6 min-h-0">
          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 shrink-0 space-y-6 shadow-2xl">
             <h3 className="text-xs font-black text-teal-500 uppercase tracking-[0.4em] flex items-center gap-3"><Target className="w-5 h-5" /> Target Profile</h3>
             <div className="space-y-6">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center text-black font-black text-xl shadow-lg">{lead.firstName[0]}{lead.lastName[0]}</div>
                   <div>
                      <p className="text-xl font-black text-white uppercase tracking-tight">{lead.firstName} {lead.lastName}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{lead.primaryEmail || "NO SECURE EMAIL"}</p>
                   </div>
                </div>
                <div className="h-[1px] bg-white/5" />
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acquisition Source</p>
                   <p className="text-xs font-black text-white uppercase tracking-wider">{lead.referralSource || "DIRECT CLINICAL INTAKE"}</p>
                </div>
             </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 shrink-0 space-y-6 shadow-2xl">
             <h3 className="text-xs font-black text-teal-500 uppercase tracking-[0.4em] flex items-center gap-3"><MapPin className="w-5 h-5" /> Geospatial Context</h3>
             <div className="space-y-4">
                <p className="text-sm font-black text-slate-300 uppercase leading-relaxed tracking-wider">
                   {lead.mailingAddress?.street || "STREET REDACTED"}<br/>
                   <span className="text-white">{lead.mailingAddress?.city}, {lead.mailingAddress?.state} {lead.mailingAddress?.postalCode}</span>
                </p>
             </div>
          </div>

          <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-8 overflow-y-auto space-y-6 shadow-2xl relative">
             <div className="absolute top-8 right-8"><Activity className="w-4 h-4 text-teal-500 animate-pulse" /></div>
             <h3 className="text-xs font-black text-teal-500 uppercase tracking-[0.4em]">Activity Timeline</h3>
             <div className="space-y-6">
                {lead.activities?.length === 0 ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-800 mx-auto"><Clock className="w-6 h-6" /></div>
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No historical vectors</p>
                  </div>
                ) : (
                  [...lead.activities].sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()).map((activity: any) => (
                    <div key={activity.outreachActivityId} className="flex gap-4 group/item">
                       <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full mt-1 ${activity.outcome === 'NO_ANSWER' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]'}`} />
                          <div className="w-[1px] flex-1 bg-white/5 my-2 group-last/item:hidden" />
                       </div>
                       <div className="space-y-1 pb-4">
                          <div className="flex items-center gap-3">
                             <p className="text-[11px] font-black text-white uppercase tracking-wider">{activity.outcome.replace('_', ' ')}</p>
                             <span className="text-[9px] font-bold text-slate-600 uppercase">{new Date(activity.activityDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">{activity.notes}</p>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          <div className="flex-1 bg-teal-500/5 border border-teal-500/10 rounded-3xl p-8 overflow-y-auto space-y-6 shadow-inner flex flex-col min-h-0">
             <div className="flex items-center justify-between shrink-0">
                <h3 className="text-xs font-black text-teal-500 uppercase tracking-[0.4em] flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> Clinical Guidance</h3>
                <select 
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-teal-500 uppercase tracking-widest outline-none focus:border-teal-500"
                  value={selectedScriptId || ""}
                  onChange={e => setSelectedScriptId(e.target.value)}
                >
                   {scripts.map((s: any) => <option key={s.outreachScriptId} value={s.outreachScriptId}>{s.scriptTitle}</option>)}
                </select>
             </div>
             
             <div className="flex-1 bg-black/20 rounded-2xl p-8 overflow-y-auto border border-white/5">
                <p className="text-sm font-medium text-slate-300 italic leading-loose">
                   "{activeScript?.content || "Protocol initialization pending. Please select a guidance vector."}"
                </p>
             </div>
             
             <div className="shrink-0 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <p className="text-[9px] font-black text-teal-500 uppercase tracking-[0.2em] leading-relaxed">
                   CRITICAL: Ensure identity verification via full legal name and date of birth before proceeding to modality selection.
                </p>
             </div>
          </div>

          <div className="h-20 bg-black/40 border border-white/5 rounded-3xl px-8 flex items-center justify-between shrink-0 shadow-2xl">
             {currentStep > 1 && (
               <button onClick={() => setCurrentStep(prev => prev - 1)} className="flex items-center gap-4 text-slate-500 hover:text-white transition-all group">
                  <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  <span className="text-xs font-black uppercase tracking-[0.3em]">Abort Step</span>
               </button>
             )}
             <div className="flex-1" />
             <div className="flex gap-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`h-2 rounded-full transition-all duration-300 ${currentStep === i ? 'w-10 bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 'w-2 bg-white/10'}`} />
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
