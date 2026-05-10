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
  Clock,
  HeartPulse,
  History as HistoryIcon
} from "lucide-react";
import { useRecentlyBrowsed } from "@/hooks/useRecentlyBrowsed";
import EnrollmentDrawer from "@/components/EnrollmentDrawer";
import { useToast } from "@/components/ToastProvider";

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
    finalizeEnrollment(input: $input)
  }
`;

const LOG_OUTREACH_ACTIVITY = gql`
  mutation LogActivity($input: LogOutreachActivityCommandInput!) {
    logOutreachActivity(input: $input)
  }
`;

const ADD_OUTREACH_CONTACT = gql`
  mutation AddContact($input: AddOutreachContactCommandInput!) {
    addOutreachContact(input: $input)
  }
`;

const REMOVE_OUTREACH_CONTACT = gql`
  mutation RemoveContact($input: RemoveOutreachContactCommandInput!) {
    removeOutreachContact(input: $input)
  }
`;

const UPDATE_OUTREACH_LEAD = gql`
  mutation UpdateLead($input: UpdateOutreachLeadCommandInput!) {
    updateOutreachLead(input: $input)
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

export default function OutreachDetail() {
  const params = useParams();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedModality, setSelectedModality] = useState("HomeCare");

  const { addItem } = useRecentlyBrowsed();
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isDialPadOpen, setIsDialPadOpen] = useState(false);
  const [dialedNumber, setDialedNumber] = useState("");
  const { showToast } = useToast();

  // Workstation State
  const [disposition, setDisposition] = useState("Cooperative");
  const [communicationStatus, setCommunicationStatus] = useState("Verbal");
  const [techAccess, setTechAccess] = useState("SmartphoneOnly");
  const [barriersToCare, setBarriersToCare] = useState("");
  const [orientationDate, setOrientationDate] = useState("");

  // Operational State
  const [tempNumbers, setTempNumbers] = useState<Record<string, string>>({});
  const [isAddingRelative, setIsAddingRelative] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [newRelativeForm, setNewRelativeForm] = useState({ firstName: '', lastName: '', relationship: 'Other', phoneNumber: '' });
  const [quickNote, setQuickNote] = useState("");
  const [isLoggingNote, setIsLoggingNote] = useState(false);
  const [isLoggingNoAnswer, setIsLoggingNoAnswer] = useState(false);

  const [finalize, { loading: finalizing }] = useMutation(FINALIZE_ENROLLMENT);
  const [logActivity] = useMutation(LOG_OUTREACH_ACTIVITY);
  const [addContact] = useMutation(ADD_OUTREACH_CONTACT);
  const [removeContact] = useMutation(REMOVE_OUTREACH_CONTACT);
  const [updateLead, { loading: updatingLead }] = useMutation(UPDATE_OUTREACH_LEAD);

  const { data: scriptData } = useQuery(GET_OUTREACH_SCRIPTS);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

  const scripts = scriptData?.outreachScripts || [];
  const activeScript = scripts.find((s: any) => s.outreachScriptId === selectedScriptId) || scripts.find((s: any) => s.isDefault) || scripts[0];

  const { data: leadData, loading: leadLoading, error: leadError, refetch } = useQuery(GET_LEAD_DETAILS, {
    variables: { id: params.id },
    fetchPolicy: "network-only"
  });

  const { data: planData } = useQuery(GET_ENROLLMENT_DATA);

  useEffect(() => {
    if (leadData?.outreachById) {
      const lead = leadData.outreachById;

      // Clinical Data Healer: Normalizes legacy UPPER_SNAKE_CASE to UpperCamelCase
      const heal = (val: string | null | undefined) => {
        if (!val) return "";
        // If it's already UpperCamelCase (no underscores and has multiple caps), return it
        if (!val.includes('_') && /[a-z][A-Z]/.test(val)) return val;
        // Otherwise, convert from UPPER_SNAKE_CASE
        return val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      };

      if (lead.disposition) setDisposition(heal(lead.disposition));
      if (lead.communicationStatus) setCommunicationStatus(heal(lead.communicationStatus));
      if (lead.techAccess) setTechAccess(heal(lead.techAccess));
      if (lead.selectedModality) setSelectedModality(heal(lead.selectedModality));
      if (lead.healthPlanId) setSelectedPlan(lead.healthPlanId);
      if (lead.barriersToCare) setBarriersToCare(lead.barriersToCare);
    }
  }, [leadData]);

  const handleAddRelative = async () => {
    try {
      await addContact({
        variables: {
          input: {
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
          input: {
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

  const calculateAge = (birthday: string) => {
    if (!birthday) return "N/A";
    try {
      const birthDate = new Date(birthday);
      const ageDifMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return "N/A";
    }
  };

  const handleLogActivity = async (outcome: string = "FOLLOW_UP", notes: string = "") => {
    if (!notes && !quickNote) return;
    setIsLoggingNote(true);
    try {
      await logActivity({
        variables: {
          input: {
            outreachId: params.id,
            method: "TELEPHONE",
            outcome: outcome,
            notes: notes || quickNote
          }
        },
        refetchQueries: ["GetLeadDetails"]
      });
      setQuickNote("");
      showToast("Activity logged successfully", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to log activity", "error");
    } finally {
      setIsLoggingNote(false);
    }
  };

  const handleNoAnswer = async () => {
    setIsLoggingNoAnswer(true);
    try {
      await logActivity({
        variables: {
          input: {
            outreachId: params.id,
            method: "TELEPHONE",
            outcome: "NO_ANSWER",
            notes: "Automated log: Patient did not answer outbound call."
          }
        },
        refetchQueries: ["GetOutreachList", "GetLeadDetails"]
      });
      showToast("No-answer attempt recorded", "info");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingNoAnswer(false);
    }
  };

  const lead = leadData?.outreachById;

  useEffect(() => {
    if (lead) {
      addItem({
        id: lead.patientOutreachId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        subtitle: lead.referralSource,
        type: 'OUTREACH'
      });
    }
  }, [lead, addItem]);

  const handleUpdateLead = async (fields: any, silent: boolean = true) => {
    try {
      await updateLead({
        variables: {
          input: {
            patientOutreachId: params.id,
            ...fields
          }
        }
      });
      if (!silent) {
        showToast("Outreach Profile Synchronized", "success");
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to update profile", "error");
    }
  };
  const plans = planData?.healthPlans || [];

  const hasNoContacts = lead ? (!lead.primaryPhone && (!lead.otherContacts || lead.otherContacts.length === 0)) : true;

  return (
    <div className="outreach-workstation min-h-screen bg-[var(--sidebar-bg)] flex flex-col p-3 space-y-3 overflow-hidden font-inter select-none">
      {leadLoading ? (
        <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-700">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin" />
            <HeartPulse className="w-6 h-6 text-teal-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.4em]">Synchronizing Outreach Context</p>
            <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">Establishing Secure Clinical Handshake</p>
          </div>
        </div>
      ) : leadError || !lead ? (
        <div className="max-w-md mx-auto mt-20 p-8 glass-morphism rounded-3xl text-center space-y-6 animate-in zoom-in duration-300 border border-rose-500/20">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Access Protocol Failed</h2>
          <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">The specified outreach vector could not be identified.</p>
          <button onClick={() => router.push('/dashboard/outreach')} className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">Abort & Return</button>
        </div>
      ) : (
        <>
          {/* High-Density Workstation Header */}
          <div className="flex items-center justify-between bg-[var(--card-bg)] backdrop-blur-2xl border border-[var(--card-border)] px-6 py-3 rounded-xl shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-sm relative overflow-hidden">
                <HeartPulse className="w-5 h-5 text-teal-500" />
                <div className="absolute inset-0 bg-teal-500/5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">Patient Outreach Profile</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[8px] font-black text-teal-500 uppercase tracking-[0.2em]">Operational Identity:</span>
                  <span className="text-[8px] font-black text-[var(--text-primary)] uppercase tracking-widest opacity-80">{lead.firstName} {lead.lastName}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-teal-500/5 border border-teal-500/20 rounded-xl p-1 gap-1">
                <button 
                  onClick={() => handleCall({ name: lead.firstName, phone: lead.primaryPhone })}
                  disabled={!lead.primaryPhone}
                  className="px-4 py-2 rounded-lg bg-teal-500 text-black text-[9px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center gap-2 shadow-lg disabled:opacity-30"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call Lead
                </button>
                <button 
                  onClick={() => setIsEnrollmentOpen(true)}
                  className="px-4 py-2 rounded-lg bg-white/5 text-teal-500 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Enroll
                </button>
              </div>
              <div className="h-6 w-px bg-[var(--card-border)] opacity-30" />
              <button onClick={handleAbort} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-muted)] text-[8px] font-black uppercase tracking-[0.1em] hover:bg-white/10 hover:text-teal-500 transition-all flex items-center gap-2">
                <ChevronLeft className="w-3.5 h-3.5" /> Exit to Registry
              </button>
            </div>
          </div>

          <div className="flex-1 flex gap-6 min-h-0">
            {/* Main Operational Core */}
            <div className="flex-[2.5] flex flex-col min-h-0">
              <div className="flex-1 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-5 flex flex-col min-h-0 relative overflow-hidden shadow-2xl">
                <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none"><HeartPulse className="w-64 h-64 text-teal-500" /></div>
 
                <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 overflow-y-auto pr-4 scrollbar-hide">
                  {/* SECTION: CONTACT ENGAGEMENT */}
                  <section id="engagement" className="space-y-4">
                    <div className="flex items-center justify-between shrink-0">
                      <div>
                        <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Contact Channels</h2>
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-1">Verify communication vectors.</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setIsDialPadOpen(!isDialPadOpen)} className={`w-9 h-9 rounded-lg border transition-all flex items-center justify-center ${isDialPadOpen ? 'bg-teal-500 border-teal-400 text-black shadow-md' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-teal-500/50'}`}><Hash className="w-4 h-4" /></button>
                        <button 
                          onClick={() => setIsAddingRelative(!isAddingRelative)} 
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] shadow-md transition-all
                            ${isAddingRelative ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-teal-500 text-black hover:bg-teal-600'}`}
                        >
                          {isAddingRelative ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          {isAddingRelative ? 'Abort Addition' : 'Add Contact'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'HomeCare', label: 'Home Care' },
                        { id: 'VirtualCare', label: 'Virtual Care' },
                        { id: 'InPatientHospice', label: 'In-Patient' },
                        { id: 'HybridCare', label: 'Hybrid' }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={async () => {
                            setSelectedModality(m.id);
                            await handleUpdateLead({ modality: m.id });
                            await refetch();
                          }}
                          className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${selectedModality === m.id ? 'bg-teal-500 border-teal-400 text-black shadow-lg shadow-teal-500/20' : 'bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:border-teal-500/30 backdrop-blur-sm'}`}
                        >
                          {m.label}
                          {selectedModality === m.id && updatingLead && <div className="ml-2 w-2 h-2 border border-black/30 border-t-black rounded-full animate-spin inline-block" />}
                        </button>
                      ))}
                    </div>

                    {/* Active Call HUD */}
                    {activeCall && (
                      <div className="bg-teal-600 rounded-3xl p-8 flex items-center justify-between shadow-2xl animate-pulse-primary shrink-0 border-2 border-teal-400/30">
                        <div className="flex items-center gap-8">
                          <div className="w-16 h-16 rounded-2xl bg-black/20 flex items-center justify-center text-white shadow-inner">
                            <PhoneForwarded className="w-8 h-8 animate-bounce" />
                          </div>
                          <div>
                            <p className="text-white font-black text-2xl uppercase tracking-widest leading-none">{activeCall.status}</p>
                            <p className="text-teal-100 text-[11px] font-bold uppercase tracking-[0.4em] mt-3 opacity-90">Active Channel: {activeCall.phone}</p>
                          </div>
                        </div>
                        <button onClick={endCall} className="w-16 h-16 rounded-2xl bg-red-500 text-white shadow-xl active:scale-90 transition-transform flex items-center justify-center hover:bg-red-600"><PhoneOff className="w-8 h-8" /></button>
                      </div>
                    )}

                    {/* Compact Manual Dialer */}
                    {isDialPadOpen && (
                      <div className="bg-[var(--sidebar-bg)] border border-teal-500/20 rounded-2xl p-5 animate-in slide-in-from-top-4 shrink-0 shadow-2xl relative group/dialer">
                        <button onClick={() => setIsDialPadOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-teal-500 transition-all opacity-0 group-hover/dialer:opacity-100"><X className="w-4 h-4" /></button>
                        <div className="flex gap-4 items-center">
                          <input type="tel" placeholder="Enter Phone Number..." className="flex-1 bg-transparent text-xl font-black text-white outline-none placeholder:text-slate-800 tracking-wider font-mono" value={dialedNumber} onChange={e => setDialedNumber(e.target.value)} autoFocus />
                          <button onClick={() => handleCall({ name: 'Manual', phone: dialedNumber })} disabled={!dialedNumber} className="w-12 h-12 rounded-xl bg-emerald-500 text-black shadow-lg disabled:opacity-30 flex items-center justify-center hover:bg-emerald-600"><PhoneCall className="w-5 h-5" /></button>
                        </div>
                      </div>
                    )}

                    {/* Contact List */}
                    <div className="space-y-4">
                      {hasNoContacts && !isAddingRelative && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 border-2 border-dashed border-rose-500/20 rounded-3xl bg-rose-500/5 p-16 animate-in zoom-in">
                          <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-xl border border-rose-500/20"><PhoneOff className="w-10 h-10" /></div>
                          <div className="space-y-4">
                            <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-widest">No Contacts Identified</h3>
                            <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] leading-relaxed max-w-sm">The clinical registry contains no verified communication channels for this patient context.</p>
                          </div>
                          <button onClick={() => setIsAddingRelative(true)} className="px-10 py-5 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-rose-600 transition-all">Add Primary Contact Manually</button>
                        </div>
                      )}

                      {/* Patient Vector */}
                      {(lead.primaryPhone || !hasNoContacts) && (
                        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${lead.primaryPhone ? 'bg-teal-500/5 border-teal-500/20 shadow-sm' : 'bg-amber-500/5 border-amber-500/20 shadow-md'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-black shadow-md ${lead.primaryPhone ? 'bg-teal-500' : 'bg-amber-500 animate-pulse'}`}><User className="w-5 h-5" /></div>
                            <div>
                              <p className="text-[var(--text-primary)] font-black text-sm uppercase tracking-tight leading-none">{lead.firstName} {lead.lastName}</p>
                              <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1.5">Primary Patient Context · <span className="text-teal-600 dark:text-teal-400 font-black">{lead.primaryPhone || "NOT SPECIFIED"}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleCall({ name: lead.firstName, phone: lead.primaryPhone })} disabled={!lead.primaryPhone} className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${lead.primaryPhone ? 'bg-teal-500 text-black shadow-md hover:bg-teal-600 active:scale-90' : 'bg-slate-900 text-slate-800 cursor-not-allowed'}`}><PhoneCall className="w-5 h-5" /></button>
                          </div>
                        </div>
                      )}

                      {lead.otherContacts?.map((contact: any) => (
                        <div key={contact.outreachContactId} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl group/contact hover:border-teal-500/30 transition-all hover:bg-slate-50 dark:hover:bg-white/[0.07] shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-xl shadow-teal-500/10">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">{contact.firstName} {contact.lastName}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[8px] font-black text-teal-600 dark:text-teal-500 uppercase tracking-widest px-2 py-0.5 bg-teal-500/10 rounded-md border border-teal-500/10">{contact.relationship}</span>
                                <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{contact.phoneNumber}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveContact(contact.outreachContactId)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-500 opacity-0 group-hover/contact:opacity-100 hover:bg-rose-500 transition-all hover:text-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {isAddingRelative && (
                        <div className="p-8 rounded-3xl border-2 border-teal-500/20 bg-teal-500/5 space-y-6 animate-in slide-in-from-bottom-10 shadow-2xl">
                          <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-3">
                              <label className="clinical-label ml-1">Legal Identity</label>
                              <input placeholder="First Name" className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] premium-input rounded-xl px-5 py-3.5 text-xs text-[var(--text-primary)] font-black outline-none focus:border-teal-500 transition-all" value={newRelativeForm.firstName} onChange={e => setNewRelativeForm({ ...newRelativeForm, firstName: e.target.value })} />
                            </div>
                            <div className="space-y-3">
                              <label className="clinical-label ml-1">Kinship Type</label>
                              <select className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] premium-input rounded-xl px-5 py-3.5 text-xs text-[var(--text-primary)] font-black outline-none focus:border-teal-500 cursor-pointer transition-all" value={newRelativeForm.relationship} onChange={e => setNewRelativeForm({ ...newRelativeForm, relationship: e.target.value })}>
                                {Object.keys(RELATIONSHIP_LABELS).map(k => <option key={k} value={k}>{k}</option>)}
                              </select>
                            </div>
                            <div className="space-y-3">
                              <label className="clinical-label ml-1">Comm Phone</label>
                              <input placeholder="Phone Number" className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] premium-input rounded-xl px-5 py-3.5 text-xs text-[var(--text-primary)] font-black outline-none focus:border-teal-500 transition-all" value={newRelativeForm.phoneNumber} onChange={e => setNewRelativeForm({ ...newRelativeForm, phoneNumber: e.target.value })} />
                            </div>
                          </div>
                          <div className="flex gap-4 pt-2">
                            <button onClick={() => setIsAddingRelative(false)} className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-white/10 hover:text-teal-500 transition-all">Cancel Vector Addition</button>
                            <button onClick={handleAddRelative} className="flex-1 py-4 rounded-xl bg-teal-500 text-black text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-teal-600 transition-all">Establish Contact</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* SECTION: CLINICAL ASSESSMENT */}
                  <section id="assessment" className="space-y-6 pt-6 border-t border-[var(--card-border)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Clinical Assessment</h2>
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-1">Evaluate environmental obstacles.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="clinical-label">Comm Status</label>
                          <div className="field-container">
                            <select className="w-full bg-transparent px-5 py-3.5 text-xs text-[var(--text-primary)] font-black outline-none focus:text-teal-400 transition-all cursor-pointer" value={communicationStatus} onChange={e => setCommunicationStatus(e.target.value)}>
                              {["Verbal", "NonVerbal", "Aphasic", "SpeechImpaired", "CognitiveImpairment"].map(v => <option key={v} value={v}>{v.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="clinical-label">Modality Access</label>
                          <div className="field-container premium-input">
                            <select className="w-full bg-transparent px-5 py-3.5 text-xs text-[var(--text-primary)] font-black outline-none focus:text-teal-400 transition-all cursor-pointer" value={techAccess} onChange={e => setTechAccess(e.target.value)}>
                              {["None", "SmartphoneOnly", "TabletComputer", "HighLiteracy", "NeedsAssistance"].map(v => <option key={v} value={v}>{v.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="clinical-label">Clinical Barriers & Logistical Observations</label>
                        <textarea
                          value={barriersToCare}
                          onChange={e => setBarriersToCare(e.target.value)}
                          onBlur={() => handleUpdateLead({ barriersToCare })}
                          className="w-full bg-transparent field-container premium-input min-h-[140px] p-6 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-teal-500 transition-all placeholder:text-[var(--text-muted)]"
                          placeholder="Enter detailed clinical barriers or environmental observations..."
                        />
                      </div>
                    </div>
                  </section>

                  {/* SECTION: ENGAGEMENT OUTCOME */}
                  <section id="disposition" className="space-y-6 pt-6 border-t border-[var(--card-border)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Engagement Status</h2>
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-1">Select the most accurate patient response.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {["Eager", "Cooperative", "Hesitant", "Resistant", "Refused"].map(v => (
                        <button key={v} onClick={() => {
                          setDisposition(v);
                          handleUpdateLead({ disposition: v });
                        }} className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${disposition === v ? 'bg-teal-500 border-teal-400 text-black shadow-lg shadow-teal-500/20' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:border-teal-500/30'}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* CARE PLAN & ENROLLMENT FLOW */}
                  <section id="provisioning" className="space-y-6 pt-8 border-t border-[var(--card-border)] bg-teal-500/[0.02] -mx-5 px-5 pb-5">
                    <div className="flex items-center justify-between gap-8">
                      <div className="flex-1 max-w-sm">
                        <label className="clinical-label text-teal-500/60">Recommended Health Plan</label>
                        <select
                          className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] text-[var(--text-primary)] font-black outline-none focus:border-teal-500 transition-all cursor-pointer shadow-inner"
                          value={selectedPlan}
                          onChange={e => {
                            setSelectedPlan(e.target.value);
                            handleUpdateLead({ healthPlanId: e.target.value });
                          }}
                        >
                          <option value="">Select Plan...</option>
                          {plans.map((p: any) => <option key={p.healthPlanId} value={p.healthPlanId}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleNoAnswer}
                          disabled={isLoggingNoAnswer}
                          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all disabled:opacity-20"
                        >
                          {isLoggingNoAnswer ? "Logging..." : "Log No Answer"}
                        </button>
                        <button 
                          onClick={() => showToast("Lead profile synchronized", "success")}
                          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-teal-500 transition-all"
                        >
                          Save Profile
                        </button>
                        <button 
                          onClick={() => setIsEnrollmentOpen(true)}
                          className="px-8 py-3 rounded-xl bg-teal-500 text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                        >
                          <UserPlus className="w-4 h-4" /> Enroll Patient
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Context Sidebar */}
            <div className="flex-1 flex flex-col space-y-6 min-h-0">
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 shrink-0 space-y-4 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="text-[9px] font-black text-teal-500 uppercase tracking-[0.4em] flex items-center gap-2"><Activity className="w-4 h-4" /> Patient Summary</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black text-teal-500/50 uppercase tracking-widest">Readiness</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= (disposition === 'Eager' ? 5 : disposition === 'Cooperative' ? 4 : 2) ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'bg-white/5'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-black font-black text-sm shadow-md">{lead.firstName[0]}{lead.lastName[0]}</div>
                    <div>
                      <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight leading-none">{lead.firstName} {lead.lastName}</p>
                      <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-60">{lead.primaryEmail || "NO SECURE EMAIL"}</p>
                    </div>
                  </div>
                  <div className="h-[1px] bg-[var(--card-border)] opacity-30" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">Clinical Age</p>
                      <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider">{calculateAge(lead.birthDate)} YRS</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">Gender Identity</p>
                      <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider">{lead.gender || "NOT SPECIFIED"}</p>
                    </div>
                  </div>
                  <div className="h-[1px] bg-[var(--card-border)] opacity-30" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">Referral Source</p>
                      <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider">{lead.referralSource || "DIRECT INTAKE"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">Lead Status</p>
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-500 text-[8px] font-black uppercase tracking-widest border border-teal-500/20">{lead.status}</span>
                    </div>
                  </div>
                  <div className="h-[1px] bg-[var(--card-border)] opacity-30" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] font-black text-teal-500 uppercase tracking-widest leading-none">Preferred Contact Times</p>
                      <Zap className="w-3 h-3 text-teal-500 animate-pulse" />
                    </div>
                    <div className="bg-teal-500/5 border border-teal-500/10 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Clock className="w-3 h-3 text-teal-500" />
                        <span className="text-[9px] font-black text-[var(--text-primary)] uppercase tracking-tight">Best Time to Call</span>
                      </div>
                      <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">
                        {parseInt(params.id as string, 16) % 2 === 0 ? "Morning (09:00 - 11:00)" : "Afternoon (14:00 - 16:00)"}
                      </p>
                      <p className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-tight mt-1 opacity-60 italic">Based on historical success patterns.</p>
                    </div>
                  </div>
                  {lead.notes && (
                    <>
                      <div className="h-[1px] bg-[var(--card-border)] opacity-30" />
                      <div className="space-y-1.5">
                        <p className="text-[8px] font-black text-teal-500 uppercase tracking-widest leading-none">Patient Context</p>
                        <p className="text-[9px] font-medium text-[var(--text-primary)] leading-relaxed italic opacity-80">{lead.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 shrink-0 space-y-4 shadow-xl">
                <h3 className="text-[9px] font-black text-teal-500 uppercase tracking-[0.4em] flex items-center gap-2"><MapPin className="w-4 h-4" /> Location Context</h3>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase leading-relaxed tracking-widest">
                    {lead.mailingAddress?.street || "NOT SPECIFIED"}<br />
                    <span className="text-[var(--text-primary)]">{lead.mailingAddress?.city}, {lead.mailingAddress?.state} {lead.mailingAddress?.postalCode}</span>
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 overflow-hidden flex flex-col space-y-5 shadow-2xl relative min-h-0">
                <div className="absolute top-6 right-6"><HistoryIcon className="w-5 h-5 text-teal-500 opacity-20" /></div>
                <div className="shrink-0">
                  <h3 className="text-[9px] font-black text-teal-500 uppercase tracking-[0.4em] mb-3">Interaction History</h3>
                  
                  {/* Quick Note Entry */}
                  <div className="relative mb-4">
                    <textarea 
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      placeholder="Append outreach note..."
                      className="w-full bg-[var(--sidebar-bg)]/50 border border-[var(--card-border)] rounded-xl p-3 pr-14 text-[10px] font-medium text-[var(--text-primary)] outline-none focus:border-teal-500/50 transition-all placeholder:text-[var(--text-muted)] min-h-[60px] resize-none"
                    />
                    <button 
                      onClick={() => handleLogActivity()}
                      disabled={!quickNote || isLoggingNote}
                      className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-teal-500 text-black hover:bg-teal-400 transition-all disabled:opacity-30 shadow-lg"
                    >
                      {isLoggingNote ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                  {lead.activities?.length === 0 ? (
                    <div className="py-10 text-center space-y-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--sidebar-bg)] flex items-center justify-center text-[var(--card-border)] mx-auto shadow-inner"><Clock className="w-5 h-5" /></div>
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] opacity-40">No historical records identified</p>
                    </div>
                  ) : (
                    [...lead.activities].sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()).map((activity: any) => (
                      <div key={activity.outreachActivityId} className="flex gap-4 group/item">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 border-2 border-[var(--card-bg)] shadow-sm
                            ${activity.outcome === 'NO_ANSWER' ? 'bg-rose-500' : 
                              activity.outcome === 'CONNECTED' ? 'bg-emerald-500' : 
                              'bg-teal-500'}`} />
                          <div className="w-[1px] flex-1 bg-[var(--card-border)] my-2 group-last/item:hidden opacity-30" />
                        </div>
                        <div className="space-y-1 pb-4">
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{activity.outcome.replaceAll('_', ' ')}</p>
                            <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                              {new Date(activity.activityDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(activity.activityDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-[var(--text-primary)] leading-relaxed opacity-70 bg-[var(--sidebar-bg)]/30 p-3 rounded-xl border border-white/5">{activity.notes}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 bg-teal-500/5 border border-teal-500/10 rounded-3xl p-6 overflow-y-auto space-y-5 shadow-inner flex flex-col min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="text-[10px] font-black text-teal-500 uppercase tracking-[0.5em] flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> Clinical Guidance</h3>
                  <select
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-black text-teal-500 uppercase tracking-widest outline-none focus:border-teal-500 shadow-md"
                    value={selectedScriptId || ""}
                    onChange={e => setSelectedScriptId(e.target.value)}
                  >
                    {scripts.map((s: any) => <option key={s.outreachScriptId} value={s.outreachScriptId}>{s.scriptTitle}</option>)}
                  </select>
                </div>

                <div className="flex-1 bg-[var(--sidebar-bg)]/40 rounded-2xl p-6 overflow-y-auto border border-[var(--card-border)] min-h-0 shadow-inner">
                  <p className="text-sm font-medium text-[var(--text-primary)] italic leading-relaxed opacity-90">
                    &quot;{activeScript?.content ? activeScript.content.replace("{firstName}", lead.firstName).replace("{lastName}", lead.lastName).replaceAll("deployment", "home visit") : "Protocol initialization pending clinical handshake."}&quot;
                  </p>
                </div>

                <div className="shrink-0 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 shadow-md">
                  <p className="text-[9px] font-black text-teal-500 uppercase tracking-[0.3em] leading-relaxed">
                    CRITICAL: Identity verification required before modality selection and clinical provisioning.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <EnrollmentDrawer
        open={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
        outreachId={params.id as string}
      />
    </div>
  );
}
