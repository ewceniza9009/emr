"use client";

import React, { useState, useEffect } from "react";
import AuraPortal from "./Portal";
import { useQuery, useMutation, gql } from "@apollo/client";
import { 
  X,
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
  UserPlus,
  Hash,
  Target,
  Zap,
  PhoneOff,
  PhoneForwarded,
  Trash2
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

  // Wizard State
  const [isAddingRelative, setIsAddingRelative] = useState(false);
  const [isLoggingNoAnswer, setIsLoggingNoAnswer] = useState(false);
  const [newRelativeForm, setNewRelativeForm] = useState({ firstName: '', lastName: '', relationship: 'Other', phoneNumber: '' });

  const [finalize, { loading: finalizing }] = useMutation(FINALIZE_ENROLLMENT);
  const [logActivity] = useMutation(LOG_OUTREACH_ACTIVITY);
  const [addContact] = useMutation(ADD_OUTREACH_CONTACT);
  const [removeContact] = useMutation(REMOVE_OUTREACH_CONTACT);
  const [updateLead] = useMutation(UPDATE_OUTREACH_LEAD);

  const [tempNumbers, setTempNumbers] = useState<Record<string, string>>({});

  const { data: leadData, loading: leadLoading, error: leadError } = useQuery(GET_LEAD_DETAILS, {
    variables: { id: outreachId },
    skip: !outreachId || !open,
    fetchPolicy: "network-only"
  });

  const { data: planData } = useQuery(GET_ENROLLMENT_DATA, { skip: !open });
  const lead = leadData?.outreachById;

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
      setTempNumbers({});
      setIsDialPadOpen(false);
      setDialedNumber("");
      setActiveCall(null);
    }
  }, [open, outreachId]);

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
            patientOutreachId: outreachId,
            ...fields
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogActivity = async (outcome: string) => {
    if (!outreachId) return;
    try {
      await logActivity({
        variables: {
          command: {
            outreachId: outreachId,
            method: "TELEPHONE",
            outcome: outcome,
            notes: `Logged outcome: ${outcome}`
          }
        },
        refetchQueries: ["GetLeadDetails", "GetOutreachLeads"]
      });
    } catch (e) {
      console.error(e);
    }
  };

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

  const handleAddRelative = async () => {
    try {
      await addContact({
        variables: {
          command: {
            patientOutreachId: outreachId,
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
      status: 'Connecting...'
    });
    setTimeout(() => {
      setActiveCall((prev: any) => prev ? { ...prev, status: 'Active' } : null);
    }, 1500);
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

  const plans = planData?.healthPlans || [];

  if (!open) return null;

  const hasNoContacts = lead && !lead.primaryPhone && (!lead.otherContacts || lead.otherContacts.length === 0);

  return (
    <>
      <AuraPortal>
        <div className="fixed inset-0 z-[9999999] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />
          <div className="relative h-full w-full max-w-[460px] bg-[var(--card-bg)] border-l border-[var(--card-border)] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            {/* High-Density Header */}
            <div className="h-12 flex items-center justify-between px-5 bg-white/5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded bg-teal-500 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-black" />
                 </div>
                 <div>
                    <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Enrollment Workflow</h2>
                    <p className="text-[9px] font-bold text-teal-500/60 uppercase tracking-widest">Lead Conversion</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10 transition-all text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Compact Lead Snapshot */}
            {lead && (
              <div className="px-5 py-2.5 bg-teal-500/5 border-b border-white/5 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-teal-500 flex items-center justify-center text-black font-black text-[9px]">
                       {lead.firstName[0]}{lead.lastName[0]}
                    </div>
                    <div>
                       <span className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{lead.firstName} {lead.lastName}</span>
                       <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{lead.referralSource || "Direct Intake"}</p>
                    </div>
                 </div>
                 <span className="px-2 py-0.5 rounded border border-teal-500/30 text-[8px] font-black text-teal-500 uppercase tracking-widest">Priority</span>
              </div>
            )}

            {/* Clinical Workspace */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
              {leadLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                   <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Synchronizing Lead Data...</p>
                </div>
              ) : lead && (
                <div className="space-y-8">
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                       <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                             <PhoneCall className="w-4 h-4 text-teal-500" /> Outbound Engagement
                          </h3>
                          <div className="flex gap-2">
                             <button onClick={() => setIsDialPadOpen(!isDialPadOpen)} className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center ${isDialPadOpen ? 'bg-teal-500 border-teal-400 text-black' : 'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]'}`}><Hash className="w-4 h-4" /></button>
                             <button onClick={() => setIsAddingRelative(true)} className="flex items-center gap-2 px-4 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-500 text-[10px] font-black uppercase tracking-widest hover:bg-teal-500/20 transition-all"><UserPlus className="w-4 h-4" /> Add Contact</button>
                          </div>
                       </div>

                       {/* Active Call HUD */}
                       {activeCall && (
                         <div className="bg-teal-600 rounded-2xl p-5 flex items-center justify-between shadow-2xl shadow-teal-900/40 animate-pulse-primary ring-1 ring-teal-400/50">
                            <div className="flex items-center gap-5">
                               <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center text-white">
                                  <PhoneForwarded className="w-6 h-6 animate-bounce" />
                               </div>
                               <div>
                                  <p className="text-white font-black text-sm uppercase tracking-widest leading-none">{activeCall.status}</p>
                                  <p className="text-teal-100 text-xs font-bold mt-2 opacity-80">{activeCall.phone}</p>
                               </div>
                            </div>
                            <button onClick={() => setActiveCall(null)} className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"><PhoneOff className="w-5 h-5" /></button>
                         </div>
                       )}

                       {/* Manual Dialer */}
                       {isDialPadOpen && (
                         <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-5 animate-in slide-in-from-top-4 relative group/dialer">
                            <button onClick={() => setIsDialPadOpen(false)} className="absolute top-3 right-3 p-1 rounded bg-black/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all opacity-0 group-hover/dialer:opacity-100"><X className="w-3 h-3" /></button>
                            <div className="flex gap-4">
                               <input placeholder="Dial Number..." className="flex-1 bg-transparent text-2xl font-black text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] tracking-tighter" value={dialedNumber} onChange={e => setDialedNumber(e.target.value)} autoFocus />
                               <button onClick={() => handleCall({phone: dialedNumber})} className="w-12 h-12 rounded-xl bg-teal-500 text-black flex items-center justify-center shadow-xl shadow-teal-500/20"><PhoneCall className="w-5 h-5" /></button>
                                 <div className="h-10 w-[1px] bg-[var(--card-border)]" />
                                 <div>
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">Contact History</p>
                                    <div className="flex gap-1 mt-2">
                                       {lead.activities?.length === 0 ? (
                                          <div className="w-2 h-2 rounded-full bg-[var(--card-border)]" />
                                       ) : (
                                          [...lead.activities].sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()).slice(0, 5).map((activity: any) => (
                                             <div key={activity.outreachActivityId} title={activity.outcome} className={`w-2 h-2 rounded-full ${activity.outcome === 'NO_ANSWER' ? 'bg-rose-500' : 'bg-teal-500'}`} />
                                          ))
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </div>
                       )}

                        {/* Engagement Profile */}
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Historical Audit</label>
                              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{lead.activities?.length || 0} Events</span>
                           </div>
                           <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-3 space-y-3 max-h-[120px] overflow-y-auto scrollbar-hide">
                              {lead.activities?.length === 0 ? (
                                 <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase text-center py-2">No history logged.</p>
                              ) : (
                                 [...lead.activities].sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()).map((activity: any) => (
                                    <div key={activity.outreachActivityId} className="flex items-center justify-between border-l-2 border-[var(--card-border)] pl-3 py-0.5">
                                       <div>
                                          <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider">{activity.outcome?.replace('_', ' ') || 'LOGGED'}</p>
                                          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mt-0.5">{new Date(activity.activityDate).toLocaleDateString()}</p>
                                       </div>
                                       <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{activity.method}</span>
                                    </div>
                                 ))
                              )}
                           </div>
                        </div>

                        {/* Contact List */}
                        <div className="space-y-3">
                           {/* Primary Patient */}
                           <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-black font-black text-xs ${lead.primaryPhone || tempNumbers['patient'] ? 'bg-teal-500' : 'bg-amber-500 animate-pulse'}`}>
                                    <User className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight">Primary: {lead.firstName}</p>
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest mt-1">{lead.primaryPhone || tempNumbers['patient'] || "No Vector Logged"}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 {!lead.primaryPhone && !tempNumbers['patient'] && (
                                   <input 
                                     placeholder="Enter Phone..." 
                                     className="w-32 h-10 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 text-xs text-[var(--text-primary)] outline-none focus:border-teal-500" 
                                     value={tempNumbers['patient'] || ""} 
                                     onChange={e => handleTempNumberChange('patient', e.target.value)} 
                                   />
                                 )}
                                 <button 
                                   onClick={() => handleCall({phone: lead.primaryPhone || tempNumbers['patient']})} 
                                   disabled={!(lead.primaryPhone || tempNumbers['patient'])} 
                                   className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${lead.primaryPhone || tempNumbers['patient'] ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20 active:scale-90' : 'bg-slate-800 text-slate-600'}`}
                                 >
                                   <PhoneCall className="w-5 h-5" />
                                 </button>
                              </div>
                           </div>

                           {/* Other Contacts */}
                           {(lead.otherContacts || []).map((contact: any) => (
                             <div key={contact.outreachContactId} className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between hover:bg-teal-500/5 transition-all group">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-lg bg-[var(--background)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-teal-500 transition-colors"><Users className="w-5 h-5" /></div>
                                   <div>
                                      <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight">{contact.firstName} {contact.lastName}</p>
                                      <p className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest mt-1">{contact.phoneNumber || tempNumbers[contact.outreachContactId] || "No Vector"}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2">
                                   {!contact.phoneNumber && !tempNumbers[contact.outreachContactId] && (
                                     <input 
                                       placeholder="Enter..." 
                                       className="w-24 h-10 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 text-xs text-[var(--text-primary)] outline-none focus:border-teal-500" 
                                       value={tempNumbers[contact.outreachContactId] || ""} 
                                       onChange={e => handleTempNumberChange(contact.outreachContactId, e.target.value)} 
                                     />
                                   )}
                                   <button onClick={() => handleCall({phone: contact.phoneNumber || tempNumbers[contact.outreachContactId]})} disabled={!(contact.phoneNumber || tempNumbers[contact.outreachContactId])} className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${contact.phoneNumber || tempNumbers[contact.outreachContactId] ? 'bg-white/10 text-white hover:bg-teal-500 hover:text-black active:scale-90' : 'bg-slate-900 text-slate-700'}`}><PhoneCall className="w-5 h-5" /></button>
                                   <button onClick={() => handleRemoveContact(contact.outreachContactId)} className="w-10 h-10 rounded-xl bg-white/5 text-slate-600 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                </div>
                             </div>
                           ))}
                        </div>

                        {/* Outcome Grid */}
                        <div className="pt-4 border-t border-[var(--card-border)]">
                           <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3 ml-1">Engagement Outcome</p>
                           <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => setCurrentStep(2)} className="h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-all flex items-center justify-center gap-3">
                                 <CheckCircle2 className="w-4 h-4 text-teal-500" />
                                 <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Connected</span>
                              </button>
                              <button onClick={() => handleLogActivity("NO_ANSWER")} className="h-12 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                                 <PhoneOff className="w-4 h-4 text-[var(--text-secondary)]" />
                                 <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">No Answer</span>
                              </button>
                              <button onClick={() => handleLogActivity("VOICEMAIL")} className="h-12 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                                 <Activity className="w-4 h-4 text-[var(--text-secondary)]" />
                                 <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Voicemail</span>
                              </button>
                              <button onClick={() => handleLogActivity("WRONG_NUMBER")} className="h-12 rounded-xl bg-[var(--input-bg)] border border-rose-500/20 hover:bg-rose-500/10 transition-all flex items-center justify-center gap-3">
                                 <X className="w-4 h-4 text-rose-500" />
                                 <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Wrong #</span>
                              </button>
                           </div>
                        </div>
                    </div>
                  )}

                  {currentStep > 1 && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                       {currentStep === 2 && (
                         <div className="space-y-6">
                            <h3 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                               <ShieldCheck className="w-4 h-4 text-teal-500" /> Lead Disposition
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                               {["EAGER", "COOPERATIVE", "HESITANT", "RESISTANT", "REFUSED"].map((v) => (
                                 <button
                                   key={v}
                                   onClick={() => {
                                     setDisposition(v);
                                     handleUpdateLead({ disposition: v });
                                   }}
                                   className={`px-4 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between ${disposition === v ? 'bg-teal-500 border-teal-400 text-black shadow-lg shadow-teal-500/20' : 'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                 >
                                    <span className="text-sm font-black uppercase tracking-widest">{v}</span>
                                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${disposition === v ? 'text-teal-500' : 'text-[var(--text-muted)]'}`} />
                                 </button>
                               ))}
                            </div>
                         </div>
                       )}
                       {currentStep === 3 && (
                         <div className="space-y-8">
                            <h3 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                               <Activity className="w-4 h-4 text-teal-500" /> Clinical Readiness
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                               <div className="space-y-3">
                                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Communication</p>
                                  <div className="grid grid-cols-1 gap-2">
                                     {["VERBAL", "APHASIC", "COGNITIVE"].map((v) => (
                                       <button
                                         key={v}
                                         onClick={() => {
                                           setCommunicationStatus(v);
                                           handleUpdateLead({ communicationStatus: v });
                                         }}
                                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${communicationStatus === v ? 'bg-teal-500 border-teal-400 text-black' : 'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]'}`}
                                       >
                                         {v}
                                       </button>
                                     ))}
                                  </div>
                               </div>
                               <div className="space-y-3">
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Technology Access</p>
                                  <div className="grid grid-cols-1 gap-2">
                                     {["SMARTPHONE", "TABLET", "NONE"].map((v) => (
                                       <button
                                         key={v}
                                         onClick={() => {
                                           setTechAccess(v);
                                           handleUpdateLead({ techAccess: v });
                                         }}
                                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${techAccess === v ? 'bg-teal-500 border-teal-400 text-black' : 'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]'}`}
                                       >
                                         {v}
                                       </button>
                                     ))}
                                  </div>
                               </div>
                            </div>
                            <div className="space-y-3">
                               <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Clinical Barriers / Obstacles</p>
                               <textarea 
                                 className="w-full h-32 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-6 text-sm text-[var(--text-primary)] focus:border-teal-500 outline-none transition-all placeholder:text-[var(--text-muted)]"
                                 placeholder="Log clinical barriers or logistical obstacles..."
                                 value={barriersToCare}
                                 onChange={e => setBarriersToCare(e.target.value)}
                                 onBlur={() => handleUpdateLead({ barriersToCare })}
                               />
                            </div>
                            <button onClick={() => setCurrentStep(4)} className="w-full bg-teal-500 h-14 rounded-xl text-black text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-500/20 hover:bg-teal-600 transition-all active:scale-95">Next Protocol Step</button>
                         </div>
                       )}
                       {currentStep === 4 && (
                         <div className="space-y-8 text-center">
                            <h3 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2 justify-center">
                               <Calendar className="w-4 h-4 text-teal-500" /> Orientation Scheduling
                            </h3>
                            <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-3xl p-10 space-y-6">
                               <div className="w-20 h-20 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 mx-auto">
                                  <Calendar className="w-10 h-10" />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Select Orientation Date & Time</label>
                                  <input type="datetime-local" value={orientationDate} onChange={e => setOrientationDate(e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-4 px-6 text-base text-[var(--text-primary)] font-black outline-none focus:border-teal-500 text-center" />
                               </div>
                            </div>
                            <button onClick={() => setCurrentStep(5)} className="w-full bg-teal-500 h-14 rounded-xl text-black text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-500/20 hover:bg-teal-600 transition-all">Confirm Appointment</button>
                         </div>
                       )}
                       {currentStep === 5 && (
                         <div className="space-y-8">
                            <h3 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                               <Stethoscope className="w-4 h-4 text-teal-500" /> Modality & Payer
                            </h3>
                            <div className="space-y-3">
                               <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Assigned Health Plan</p>
                               <select 
                                 className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-4 px-6 text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest outline-none focus:border-teal-500 shadow-xl cursor-pointer"
                                 value={selectedPlan}
                                 onChange={e => {
                                   setSelectedPlan(e.target.value);
                                   handleUpdateLead({ healthPlanId: e.target.value });
                                 }}
                               >
                                  <option value="">SELECT PAYOR...</option>
                                  {plans.map((p: any) => <option key={p.healthPlanId} value={p.healthPlanId}>{p.name}</option>)}
                               </select>
                            </div>
                            <div className="space-y-3">
                               <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Select Care Modality</p>
                               <div className="grid grid-cols-2 gap-3">
                                  {["TELEPHONE", "VIDEO", "IN_PERSON"].map((m) => (
                                    <button
                                      key={m}
                                      onClick={() => {
                                        setSelectedModality(m);
                                        handleUpdateLead({ modality: m });
                                      }}
                                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedModality === m ? 'bg-teal-500 border-teal-400 text-black' : 'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                       <span className="text-[10px] font-black uppercase tracking-widest">{m}</span>
                                       <ChevronRight className={`w-3 h-3 transition-transform group-hover:translate-x-1 ${selectedModality === m ? 'text-teal-500' : 'text-[var(--text-muted)]'}`} />
                                    </button>
                                  ))}
                               </div>
                            </div>
                         </div>
                       )}
                       {currentStep === 6 && (
                         <div className="text-center py-10 space-y-8 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 mx-auto shadow-[0_0_40px_rgba(20,184,166,0.1)]">
                               <ClipboardCheck className="w-12 h-12" />
                            </div>
                            <div>
                               <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Final Validation</h2>
                               <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mt-3 px-10">Verification of all clinical and logistical vectors complete. Ready for official patient enrollment.</p>
                            </div>
                            <button onClick={handleFinalize} disabled={finalizing || !selectedPlan} className="w-full bg-teal-500 h-14 rounded-xl text-black font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-teal-500/40 hover:bg-teal-600 transition-all active:scale-95 disabled:opacity-30">
                               {finalizing ? "PROVISIONING..." : "FINALIZE ENROLLMENT"}
                            </button>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="h-12 px-6 border-t border-[var(--card-border)] flex items-center justify-between bg-[var(--card-bg)] shrink-0">
              {currentStep > 1 && (
                <button onClick={() => setCurrentStep(prev => prev - 1)} className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 text-slate-500 hover:text-white transition-all">
                  <ChevronLeft className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Back</span>
                </button>
              )}
              <div className="flex-1" />
              <div className="flex gap-1.5">
                 {[1,2,3,4,5,6].map(i => (
                   <div key={i} className={`h-1 rounded-full transition-all duration-300 ${currentStep === i ? 'w-4 bg-teal-500' : 'w-1 bg-white/10'}`} />
                 ))}
              </div>
            </div>

          </div>
        </div>
      </AuraPortal>
    </>
  );
}
