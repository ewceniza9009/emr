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
  History as HistoryIcon,
  Pencil,
  Check,
  RotateCcw,
  Save,
  Building,
  Plus,
  Smartphone
} from "lucide-react";
import { useRecentlyBrowsed } from "@/hooks/useRecentlyBrowsed";
import EnrollmentDrawer from "@/components/EnrollmentDrawer";
import { useToast } from "@/components/ToastProvider";
import {
  BiologicalSex,
  OutreachStatus,
  CareModality,
  EnrollmentDisposition,
  CommunicationAbility,
  TechAccessLevel
} from "@/types/enums";

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
      preferredContactTime
      notes
      genderIdentity
      biologicalSex
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

const UPDATE_OUTREACH_CONTACT = gql`
  mutation UpdateContact($input: UpdateOutreachContactCommandInput!) {
    updateOutreachContact(input: $input)
  }
`;

const UPDATE_OUTREACH_LEAD = gql`
  mutation UpdateLead($input: UpdateOutreachLeadCommandInput!) {
    updateOutreachLead(input: $input)
  }
`;

const RELATIONSHIP_LABELS: Record<string, string> = {
  Spouse: "Spouse",
  Child: "Child",
  Parent: "Parent",
  Sibling: "Sibling",
  Relative: "Relative",
  Friend: "Friend",
  Family: "Family",
  Lawyer: "Lawyer",
  LegalRepresentative: "Legal Representative",
  Self: "Self",
  Other: "Other",
};

const OUTREACH_STATUS_LABELS: Record<string, string> = {
  Lead: "Lead",
  Contacted: "Contacted",
  InitialAssessment: "Initial Assessment",
  Interested: "Interested",
  Enrolled: "Enrolled",
  Refused: "Refused",
  OnHold: "On Hold",
  DoNotCall: "Do Not Call",
  OptedOut: "Opted Out",
};

export default function OutreachDetail() {
  const params = useParams();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedModality, setSelectedModality] = useState<CareModality>(CareModality.HomeCare);

  const { addItem, removeItem } = useRecentlyBrowsed();
  const [activeCall, setActiveCall] = useState<any>(null);
  const { showToast } = useToast();

  const [disposition, setDisposition] = useState<EnrollmentDisposition>(EnrollmentDisposition.Cooperative);
  const [communicationStatus, setCommunicationStatus] = useState<CommunicationAbility>(CommunicationAbility.Verbal);
  const [techAccess, setTechAccess] = useState<TechAccessLevel>(TechAccessLevel.SmartphoneOnly);
  const [barriersToCare, setBarriersToCare] = useState("");
  const [preferredContactTime, setPreferredContactTime] = useState("");

  const [isAddingRelative, setIsAddingRelative] = useState(false);
  const [isAddingProxy, setIsAddingProxy] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);

  const formatPhoneNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };
  const [newRelativeForm, setNewRelativeForm] = useState({ firstName: '', lastName: '', relationship: 'Other', phoneNumber: '', email: '' });
  const [quickNote, setQuickNote] = useState("");
  const [isLoggingNote, setIsLoggingNote] = useState(false);
  const [isLoggingNoAnswer, setIsLoggingNoAnswer] = useState(false);
  
  const { data: leadData, loading: leadLoading, error: leadError } = useQuery(GET_LEAD_DETAILS, {
    variables: { id: params.id },
    fetchPolicy: "network-only"
  });

  const lead = leadData?.outreachById;

  useEffect(() => {
    if (newRelativeForm.relationship === 'Self' && lead) {
      setNewRelativeForm(prev => ({ ...prev, firstName: lead.firstName, lastName: lead.lastName }));
    }
  }, [newRelativeForm.relationship, lead]);

  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingPrimary, setIsEditingPrimary] = useState(false);
  const [summaryForm, setSummaryForm] = useState<any>(null);
  const [locationForm, setLocationForm] = useState<any>(null);
  const [primaryForm, setPrimaryForm] = useState<any>(null);

  const [logActivity] = useMutation(LOG_OUTREACH_ACTIVITY);
  const [addContact] = useMutation(ADD_OUTREACH_CONTACT);
  const [removeContact] = useMutation(REMOVE_OUTREACH_CONTACT);
  const [updateLead] = useMutation(UPDATE_OUTREACH_LEAD);
  const [updateContact] = useMutation(UPDATE_OUTREACH_CONTACT);

  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const { data: planData } = useQuery(GET_ENROLLMENT_DATA);

  const [isEditingReachability, setIsEditingReachability] = useState(false);
  const [reachabilityForm, setReachabilityForm] = useState<any>(null);

  const handleSaveReachability = async () => {
    await handleUpdateLead({ preferredContactTime: reachabilityForm.preferredContactTime }, false);
    setIsEditingReachability(false);
  };

  useEffect(() => {
    if (leadData?.outreachById) {
      const lead = leadData.outreachById;
      const heal = (val: string | null | undefined, type: any) => {
        if (!val) return type[Object.keys(type)[0]];
        // Normalize snake_case or legacy strings to Enum keys
        const normalized = val.replace(/_/g, "");
        const match = Object.keys(type).find(k => k.toLowerCase() === normalized.toLowerCase());
        return match ? type[match] : val;
      };
      
      setDisposition(heal(lead.disposition, EnrollmentDisposition));
      setCommunicationStatus(heal(lead.communicationStatus, CommunicationAbility));
      setTechAccess(heal(lead.techAccess, TechAccessLevel));
      setSelectedModality(heal(lead.selectedModality, CareModality));
      
      if (lead.healthPlanId) setSelectedPlan(lead.healthPlanId);
      if (lead.barriersToCare) setBarriersToCare(lead.barriersToCare);
      if (lead.preferredContactTime) setPreferredContactTime(lead.preferredContactTime);
    }
  }, [leadData]);

  const handleUpdateLead = async (fields: any, silent: boolean = true) => {
    try {
      await updateLead({ 
        variables: { input: { patientOutreachId: params.id, ...fields } },
        refetchQueries: ["GetLeadDetails"]
      });
      if (!silent) showToast("Synchronized", "success");
    } catch (e: any) { showToast("Sync Error", "error"); }
  };

  const handleSaveSummary = async () => {
    await handleUpdateLead({ 
      firstName: summaryForm.firstName, 
      lastName: summaryForm.lastName, 
      genderIdentity: summaryForm.genderIdentity, 
      biologicalSex: summaryForm.biologicalSex,
      status: summaryForm.status, 
      notes: summaryForm.notes 
    }, false);
    setIsEditingSummary(false);
  };

  const handleSaveLocation = async () => {
    await handleUpdateLead({ street: locationForm.street, city: locationForm.city, state: locationForm.state, postalCode: locationForm.postalCode }, false);
    setIsEditingLocation(false);
  };

  const handleSavePrimary = async () => {
    if (!primaryForm.primaryPhone) return showToast("Phone is required", "error");
    if (primaryForm.primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryForm.primaryEmail)) return showToast("Invalid Email Format", "error");
    await handleUpdateLead({ primaryPhone: primaryForm.primaryPhone, primaryEmail: primaryForm.primaryEmail }, false);
    setIsEditingPrimary(false);
  };

  const handleAddRelative = async () => {
    if (!newRelativeForm.phoneNumber) return showToast("Phone is required", "error");
    if (newRelativeForm.relationship !== 'Self' && (!newRelativeForm.firstName || !newRelativeForm.lastName)) return showToast("Name is required for Proxy", "error");
    if (newRelativeForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newRelativeForm.email)) return showToast("Invalid Email Format", "error");
    try {
      const { isPrimaryContact, ...input } = newRelativeForm as any;
      await addContact({ 
        variables: { input: { patientOutreachId: params.id, ...input } }, 
        refetchQueries: ["GetLeadDetails"] 
      });
      setIsAddingRelative(false);
      setIsAddingProxy(false);
      setNewRelativeForm({ firstName: '', lastName: '', relationship: 'Other', phoneNumber: '', email: '' });
      showToast("Registered", "success");
    } catch (e) { showToast("Error", "error"); }
  };

  const handleUpdateContact = async () => {
    if (!newRelativeForm.phoneNumber) return showToast("Phone is required", "error");
    if (newRelativeForm.relationship !== 'Self' && (!newRelativeForm.firstName || !newRelativeForm.lastName)) return showToast("Name is required for Proxy", "error");
    if (newRelativeForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newRelativeForm.email)) return showToast("Invalid Email Format", "error");
    try {
      const { isPrimaryContact, ...input } = newRelativeForm as any;
      await updateContact({ 
        variables: { input: { outreachContactId: editingContactId, ...input } }, 
        refetchQueries: ["GetLeadDetails"] 
      });
      setEditingContactId(null);
      setNewRelativeForm({ firstName: '', lastName: '', relationship: 'Other', phoneNumber: '', email: '' });
      showToast("Updated", "success");
    } catch (e) { showToast("Error", "error"); }
  };

  const startEditingContact = (contact: any) => {
    setNewRelativeForm({ firstName: contact.firstName, lastName: contact.lastName, relationship: contact.relationship, phoneNumber: contact.phoneNumber, email: contact.email || "" });
    setEditingContactId(contact.outreachContactId);
  };

  const handleLogActivity = async (outcome: string = "FOLLOW_UP", notes: string = "") => {
    if (!notes && !quickNote && outcome !== "NO_ANSWER") return;
    setIsLoggingNote(outcome !== "NO_ANSWER");
    setIsLoggingNoAnswer(outcome === "NO_ANSWER");
    try {
      await logActivity({ variables: { input: { outreachId: params.id, method: "TELEPHONE", outcome: outcome, notes: notes || quickNote || (outcome === "NO_ANSWER" ? "No answer received." : "") } }, refetchQueries: ["GetLeadDetails"] });
      setQuickNote("");
      showToast("Logged", "success");
    } catch (e) { showToast("Error", "error"); } finally { setIsLoggingNote(false); setIsLoggingNoAnswer(false); }
  };

  const handleRemoveContact = async (id: string) => {
    if (!confirm("Remove channel?")) return;
    try {
      await removeContact({ variables: { input: { outreachContactId: id } }, refetchQueries: ["GetLeadDetails"] });
      showToast("Decommissioned", "info");
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (lead) addItem({ id: lead.patientOutreachId, firstName: lead.firstName, lastName: lead.lastName, subtitle: lead.referralSource, type: 'OUTREACH' });
  }, [lead, addItem]);

  useEffect(() => {
    if (!leadLoading && !leadError && !lead && params.id) {
      removeItem(params.id as string);
    }
  }, [leadLoading, leadError, lead, params.id, removeItem]);

  if (leadLoading) return <div className="min-h-screen flex items-center justify-center bg-[var(--background)]"><HeartPulse className="w-10 h-10 text-teal-500 animate-pulse" /></div>;

  if (!lead && !leadLoading) return <div className="p-10 text-[var(--text-primary)] font-black uppercase tracking-widest">Outreach record not found in registry.</div>;

  const selfContacts = lead.otherContacts?.filter((c: any) => c.relationship?.toLowerCase() === 'self') || [];
  const relativeContacts = lead.otherContacts?.filter((c: any) => c.relationship?.toLowerCase() !== 'self') || [];

  return (
    <div className="outreach-workstation min-h-screen bg-[var(--background)] flex flex-col p-4 space-y-4 overflow-hidden font-inter text-[var(--text-primary)] select-none">
      {/* 1. BALANCED HEADER */}
      <header className="flex items-center justify-between bg-[var(--card-bg)] border border-[var(--card-border)] px-6 py-4 rounded-2xl shrink-0 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-inner group overflow-hidden">
            <HeartPulse className="w-5 h-5 text-teal-500 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight leading-none">Patient Outreach Profile</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-[7px] font-black text-teal-500 uppercase tracking-widest border border-teal-500/20">Active Session</span>
              <span className="text-[9px] font-black text-[var(--text-primary)] uppercase tracking-widest opacity-80">{lead.firstName} {lead.lastName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <button onClick={() => setActiveCall({ name: lead.firstName, phone: lead.primaryPhone })} className="px-6 py-2.5 rounded-xl bg-teal-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 shadow-xl shadow-teal-500/20">Call Lead</button>
          <button onClick={() => setIsEnrollmentOpen(true)} className="px-6 py-2.5 rounded-xl bg-white/5 text-teal-500 text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all">Enroll</button>
          <button onClick={() => router.push('/dashboard/outreach')} className="p-2 rounded-xl bg-white/5 text-[var(--text-muted)] hover:text-rose-500 transition-all"><X className="w-5 h-5" /></button>
        </div>
      </header>

      {/* 2. MAIN BALANCED GRID */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        <div className="flex-[2.6] flex flex-col min-h-0 space-y-5 overflow-y-auto pr-2 scrollbar-hide pb-6">
          
          {/* TOP DUAL-COLUMN REGISTRY */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 shrink-0">
             {/* Registry Hub: Self Identity */}
             <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-5 space-y-5 shadow-2xl relative group/registry">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Identity Hub</h2>
                  <button onClick={() => setIsAddingRelative(!isAddingRelative)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${isAddingRelative ? 'bg-rose-500 text-[var(--text-primary)]' : 'bg-teal-500 text-black hover:bg-teal-600'}`}>{isAddingRelative ? 'Cancel' : '+ Add Channel'}</button>
                </div>

                {isAddingRelative && (
                  <div className="bg-white/[0.02] border border-[var(--card-border)] rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-2 gap-3">
                      <input className="w-full bg-[var(--background)] border border-white/5 rounded-xl py-2.5 px-4 text-[10px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={newRelativeForm.phoneNumber} onChange={e => setNewRelativeForm({...newRelativeForm, phoneNumber: formatPhoneNumber(e.target.value), firstName: lead.firstName, lastName: lead.lastName, relationship: "Self"})} placeholder="(XXX) XXX-XXXX" />
                      <input className="w-full bg-[var(--background)] border border-white/5 rounded-xl py-2.5 px-4 text-[10px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={newRelativeForm.email} onChange={e => setNewRelativeForm({...newRelativeForm, email: e.target.value})} placeholder="Email" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={editingContactId ? handleUpdateContact : handleAddRelative} className="w-full py-2.5 rounded-xl bg-teal-500 text-black text-[9px] font-black uppercase tracking-widest shadow-xl">Commit Registry</button>
                    </div>
                  </div>
                )}

                <div className="bg-white/[0.015] border border-[var(--card-border)] rounded-2xl overflow-hidden">
                  <div className="p-2 space-y-2">
                    {/* Primary Channel */}
                    {isEditingPrimary ? (
                      <div className="p-5 rounded-2xl border border-teal-500/40 bg-teal-500/[0.04] space-y-5 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between"><span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Sync Primary Identity</span><button onClick={() => setIsEditingPrimary(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button></div>
                        <div className="grid grid-cols-2 gap-4">
                          <input className="w-full bg-[var(--background)] border border-white/5 rounded-xl py-3 px-5 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={primaryForm.primaryPhone} onChange={e => setPrimaryForm({...primaryForm, primaryPhone: formatPhoneNumber(e.target.value)})} placeholder="(XXX) XXX-XXXX" />
                          <input className="w-full bg-[var(--background)] border border-white/5 rounded-xl py-3 px-5 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={primaryForm.primaryEmail} onChange={e => setPrimaryForm({...primaryForm, primaryEmail: e.target.value})} placeholder="Email" />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <button onClick={() => setIsEditingPrimary(false)} className="px-6 py-2.5 rounded-xl text-[9px] font-black uppercase text-[var(--text-muted)] hover:bg-white/5">Abort</button>
                          <button onClick={handleSavePrimary} className="px-10 py-2.5 rounded-xl bg-teal-500 text-black text-[9px] font-black uppercase tracking-widest shadow-xl">Commit Sync</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-teal-500/[0.03] border border-teal-500/10 hover:border-teal-500/40 transition-all group relative">
                        <div className="flex items-center gap-4">
                          <PhoneCall className="w-4.5 h-4.5 text-teal-500" />
                          <div>
                            <p className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-wider leading-none">{formatPhoneNumber(lead.primaryPhone) || "NO PHONE"}</p>
                            {lead.primaryEmail && <p className="text-[8px] font-bold text-teal-500/70 mt-1 lowercase">{lead.primaryEmail}</p>}
                            <span className="text-[6px] font-black text-teal-500 uppercase mt-1 block">PRIMARY VECTOR</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setPrimaryForm({ primaryPhone: lead.primaryPhone, primaryEmail: lead.primaryEmail }); setIsEditingPrimary(true); }} className="p-2 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setActiveCall({ name: lead.firstName, phone: lead.primaryPhone })} className="p-2.5 rounded-lg bg-teal-500 text-black shadow-xl"><PhoneCall className="w-4 h-4" /></button>
                        </div>
                      </div>
                    )}

                    {/* Secondary Channels */}
                    {selfContacts.map((contact: any) => (
                      <div key={contact.outreachContactId}>
                        {editingContactId === contact.outreachContactId ? (
                          <div className="p-4 rounded-xl border border-teal-500/40 bg-teal-500/[0.04] space-y-4 animate-in slide-in-from-top-2 duration-200 mb-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={newRelativeForm.phoneNumber} onChange={e => setNewRelativeForm({...newRelativeForm, phoneNumber: formatPhoneNumber(e.target.value), firstName: lead.firstName, lastName: lead.lastName, relationship: "Self"})} placeholder="(XXX) XXX-XXXX" />
                              <input className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={newRelativeForm.email} onChange={e => setNewRelativeForm({...newRelativeForm, email: e.target.value})} placeholder="Email" />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingContactId(null)} className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-[var(--text-muted)] hover:bg-white/5">Cancel</button>
                              <button onClick={handleUpdateContact} className="px-5 py-1.5 rounded-lg bg-teal-500 text-black text-[8px] font-black uppercase tracking-widest shadow-xl">Commit Sync</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all group relative mb-2">
                            <div className="flex items-center gap-4">
                              <Smartphone className="w-4.5 h-4.5 text-slate-400" />
                              <div>
                                <p className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-wider leading-none">{formatPhoneNumber(contact.phoneNumber)}</p>
                                {contact.email && <p className="text-[8px] font-bold text-teal-500/70 mt-1 lowercase">{contact.email}</p>}
                                <span className="text-[6px] font-black text-[var(--text-muted)] uppercase mt-1 block">SECONDARY CHANNEL</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                                <button onClick={() => startEditingContact(contact)} className="p-2 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-teal-500 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleRemoveContact(contact.outreachContactId)} className="p-2 rounded-lg bg-white/5 text-rose-500/50 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                              <button onClick={() => setActiveCall({ name: contact.firstName, phone: contact.phoneNumber })} className="p-2.5 rounded-lg bg-white/10 text-[var(--text-primary)] hover:bg-teal-500 hover:text-black transition-all shadow-xl"><PhoneForwarded className="w-4.5 h-4.5" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
             </section>

             {/* Proxy Registry: Side-by-Side */}
             <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-5 space-y-5 shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Proxy Registry</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { 
                        setNewRelativeForm({ firstName: "", lastName: "", relationship: "Relative", phoneNumber: "", email: "" }); 
                        setIsAddingProxy(true); 
                      }} 
                      className="px-3 py-1 rounded-lg bg-teal-500/10 text-teal-500 text-[8px] font-black uppercase tracking-widest hover:bg-teal-400 hover:text-black transition-all border border-teal-500/20"
                    >
                      + Add Proxy
                    </button>
                    <span className="px-3 py-1 rounded bg-white/5 text-[var(--text-muted)] text-[8px] font-black uppercase tracking-widest border border-white/5">{relativeContacts.length} Registered</span>
                  </div>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                  {isAddingProxy && (
                    <div className="p-4 rounded-xl border border-teal-500/40 bg-teal-500/[0.04] space-y-4 animate-in slide-in-from-top-2 duration-300 mb-4">
                      <div className="grid grid-cols-2 gap-2">
                        <input className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={newRelativeForm.firstName} onChange={e => setNewRelativeForm({...newRelativeForm, firstName: e.target.value})} placeholder="First Name" />
                        <input className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={newRelativeForm.lastName} onChange={e => setNewRelativeForm({...newRelativeForm, lastName: e.target.value})} placeholder="Last Name" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-2 text-[10px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={newRelativeForm.relationship} onChange={e => setNewRelativeForm({...newRelativeForm, relationship: e.target.value})}>{Object.entries(RELATIONSHIP_LABELS).filter(([k]) => k !== "Self").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                        <input className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={newRelativeForm.phoneNumber} onChange={e => setNewRelativeForm({...newRelativeForm, phoneNumber: formatPhoneNumber(e.target.value)})} placeholder="(XXX) XXX-XXXX" />
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <input className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={newRelativeForm.email} onChange={e => setNewRelativeForm({...newRelativeForm, email: e.target.value})} placeholder="Email" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAddingProxy(false)} className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-[var(--text-muted)] hover:bg-white/5">Cancel</button>
                        <button onClick={async () => { await handleAddRelative(); setIsAddingProxy(false); }} className="px-5 py-1.5 rounded-lg bg-teal-500 text-black text-[8px] font-black uppercase tracking-widest shadow-xl">Commit Proxy</button>
                      </div>
                    </div>
                  )}
                  {relativeContacts.length > 0 ? relativeContacts.map((contact: any) => (
                    <div key={contact.outreachContactId}>
                      {editingContactId === contact.outreachContactId ? (
                        <div className="p-4 rounded-xl border border-teal-500/40 bg-teal-500/[0.02] space-y-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-2 gap-2">
                            <input className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={newRelativeForm.firstName} onChange={e => setNewRelativeForm({...newRelativeForm, firstName: e.target.value})} placeholder="First Name" />
                            <input className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={newRelativeForm.lastName} onChange={e => setNewRelativeForm({...newRelativeForm, lastName: e.target.value})} placeholder="Last Name" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-2 text-[10px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={newRelativeForm.relationship} onChange={e => setNewRelativeForm({...newRelativeForm, relationship: e.target.value})}>{Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                            <input className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={newRelativeForm.phoneNumber} onChange={e => setNewRelativeForm({...newRelativeForm, phoneNumber: formatPhoneNumber(e.target.value)})} placeholder="(XXX) XXX-XXXX" />
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            <input className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-teal-500" value={newRelativeForm.email} onChange={e => setNewRelativeForm({...newRelativeForm, email: e.target.value})} placeholder="Email" />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingContactId(null)} className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-[var(--text-muted)] hover:bg-white/5">Cancel</button>
                            <button onClick={handleUpdateContact} className="px-5 py-1.5 rounded-lg bg-teal-500 text-black text-[8px] font-black uppercase tracking-widest shadow-xl">Commit Sync</button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-teal-500/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 font-black text-sm">{contact.firstName[0]}</div>
                            <div>
                              <p className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-tight">{contact.firstName} {contact.lastName}</p>
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-slate-400 tracking-tight">{formatPhoneNumber(contact.phoneNumber)}</span>
                                  <span className="text-[7px] font-black text-teal-500/50 uppercase tracking-widest italic">/ {RELATIONSHIP_LABELS[contact.relationship] || contact.relationship}</span>
                                </div>
                                {contact.email && <span className="text-[8px] font-bold text-teal-500/70 lowercase">{contact.email}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEditingContact(contact)} className="p-2 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleRemoveContact(contact.outreachContactId)} className="p-2 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setActiveCall({ name: `${contact.firstName} ${contact.lastName}`, phone: contact.phoneNumber })} className="p-2.5 rounded-lg bg-white/5 text-slate-400 hover:bg-teal-500 hover:text-black transition-all shadow-xl"><PhoneForwarded className="w-4 h-4" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                       <Users className="w-10 h-10 mb-3" />
                       <p className="text-[9px] font-black uppercase tracking-widest">No Proxy Contacts</p>
                    </div>
                  )}
                </div>
             </section>
          </div>

          {/* Evaluation Panels (BALANCED DENSITY) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-5 space-y-5 shadow-2xl group/engagement hover:border-teal-500/20 transition-colors">
              <div><h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Engagement Profile</h2><p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mt-1">Assess patient disposition.</p></div>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.values(EnrollmentDisposition).map((d) => (
                  <button key={d} onClick={() => { setDisposition(d); handleUpdateLead({ disposition: d }); }} className={`py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shadow-lg border ${disposition === d ? 'bg-teal-500 text-black border-teal-500 shadow-teal-500/20' : 'bg-white/5 text-[var(--text-muted)] border-[var(--card-border)] hover:bg-white/10 hover:border-white/20'}`}>{d}</button>
                ))}
              </div>
              <div className="space-y-2.5 pt-2 border-t border-white/5">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Proposed Health Plan</p>
                <select className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-[10px] font-black text-[var(--text-primary)] uppercase outline-none focus:border-teal-500 shadow-inner transition-all" value={selectedPlan || ""} onChange={(e) => { setSelectedPlan(e.target.value); handleUpdateLead({ healthPlanId: e.target.value }); }}>
                  <option value="">Select Clinical Plan...</option>{planData?.healthPlans.map((plan: any) => <option key={plan.healthPlanId} value={plan.healthPlanId}>{plan.name}</option>)}
                </select>
              </div>
            </section>

            <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-5 space-y-5 shadow-2xl group/eval hover:border-teal-500/20 transition-colors">
              <div><h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Logistical Strategy</h2><p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mt-1">Evaluate environmental barriers.</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Comm Status</p>
                  <select className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-3 px-3 text-[10px] font-black text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={communicationStatus} onChange={(e) => { setCommunicationStatus(e.target.value as CommunicationAbility); handleUpdateLead({ communicationStatus: e.target.value }); }}>
                    {Object.values(CommunicationAbility).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Tech Access</p>
                  <select className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-3 px-3 text-[10px] font-black text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={techAccess} onChange={(e) => { setTechAccess(e.target.value as TechAccessLevel); handleUpdateLead({ techAccess: e.target.value }); }}>
                    {Object.values(TechAccessLevel).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2.5 pt-2 border-t border-white/5">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Selected Modality</p>
                <select className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-3 px-3 text-[10px] font-black text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={selectedModality} onChange={(e) => { setSelectedModality(e.target.value as CareModality); handleUpdateLead({ modality: e.target.value }); }}>
                   {Object.values(CareModality).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </section>

            <div className="col-span-full flex justify-end pt-1"><button onClick={() => handleUpdateLead({ disposition, communicationStatus, techAccess, healthPlanId: selectedPlan, barriersToCare, modality: selectedModality }, false)} className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-teal-500 text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-teal-600 transition-all shadow-2xl shadow-teal-500/20"><Save className="w-4 h-4" /> Save Clinical Profile</button></div>
          </div>

          {/* Activity Intel (BALANCED) */}
          <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-5 shadow-2xl space-y-5 shrink-0 hover:border-teal-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <div><h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Activity Intel</h2><p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mt-1">Capture encounter data.</p></div>
              <button onClick={() => handleLogActivity("NO_ANSWER")} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-rose-500/10 shadow-lg ${isLoggingNoAnswer ? 'animate-pulse' : ''}`}><PhoneOff className="w-4 h-4" /> {isLoggingNoAnswer ? 'Recording...' : 'Log No Answer'}</button>
            </div>
            <div className="relative group/log">
              <input className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl py-5 px-6 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-teal-500 transition-all shadow-inner pr-40" placeholder="Synchronize encounter notes..." value={quickNote} onChange={(e) => setQuickNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogActivity()} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button onClick={() => handleLogActivity()} disabled={isLoggingNote || !quickNote} className="px-8 py-3 rounded-xl bg-teal-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 shadow-xl disabled:opacity-30">{isLoggingNote ? <RotateCcw className="w-4 h-4 animate-spin" /> : 'Commit Note'}</button>
              </div>
            </div>
          </section>
        </div>

        {/* SIDEBAR CONTEXT (BALANCED) */}
        <div className="flex-1 flex flex-col space-y-5 min-h-0 overflow-y-auto scrollbar-hide pb-6">
          <div className={`bg-[var(--card-bg)] border transition-all rounded-2xl p-5 space-y-6 shadow-2xl relative overflow-hidden group ${isEditingSummary ? 'border-teal-500/50' : 'border-[var(--card-border)]'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-teal-500 uppercase tracking-[0.4em] flex items-center gap-2.5"><Activity className="w-5 h-5" /> Patient Summary</h3>
              {!isEditingSummary ? (
                <button 
                  onClick={() => { 
                    const heal = (val: string | null | undefined, type: any) => {
                      if (!val) return "";
                      const normalized = val.replace(/_/g, "");
                      const match = Object.keys(type).find(k => k.toLowerCase() === normalized.toLowerCase());
                      return match ? type[match] : val;
                    };

                    setSummaryForm({ 
                      ...lead,
                      status: heal(lead.status, OutreachStatus),
                      biologicalSex: heal(lead.biologicalSex, BiologicalSex),
                      genderIdentity: heal(lead.genderIdentity, { Male: "Male", Female: "Female", NonBinary: "NonBinary", Other: "Other" })
                    }); 
                    setIsEditingSummary(true); 
                  }} 
                  className="p-2 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-teal-500 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setIsEditingSummary(false)} className="p-1.5 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><X className="w-3.5 h-3.5" /></button>
                  <button onClick={handleSaveSummary} className="p-1.5 rounded bg-teal-500 text-black hover:bg-teal-600 transition-all"><Save className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>

            {isEditingSummary ? (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-1.5">
                  <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Legal Identity</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="w-full bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={summaryForm.firstName} onChange={e => setSummaryForm({...summaryForm, firstName: e.target.value})} placeholder="First" />
                    <input className="w-full bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={summaryForm.lastName} onChange={e => setSummaryForm({...summaryForm, lastName: e.target.value})} placeholder="Last" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                     <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Biological Sex</p>
                     <select className="w-full bg-[var(--background)] border border-white/5 rounded-lg py-2 px-2 text-[9px] font-black text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={summaryForm.biologicalSex || ""} onChange={e => setSummaryForm({...summaryForm, biologicalSex: e.target.value})}>
                        <option value="">Select...</option>
                        {Object.values(BiologicalSex).map(v => <option key={v} value={v}>{v}</option>)}
                     </select>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Gender Identity</p>
                     <select className="w-full bg-[var(--background)] border border-white/5 rounded-lg py-2 px-2 text-[9px] font-black text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={summaryForm.genderIdentity || ""} onChange={e => setSummaryForm({...summaryForm, genderIdentity: e.target.value})}>
                        <option value="">Select...</option>
                        <option value="Male">Male</option><option value="Female">Female</option><option value="NonBinary">Non-Binary</option><option value="Other">Other</option>
                     </select>
                   </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Outreach Status</p>
                  <select className="w-full bg-[var(--background)] border border-white/5 rounded-lg py-2 px-2 text-[9px] font-black text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={summaryForm.status || ""} onChange={e => setSummaryForm({...summaryForm, status: e.target.value})}>
                      {Object.entries(OUTREACH_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-5 pt-2 border-t border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center text-black font-black text-lg shadow-xl">{lead.firstName[0]}{lead.lastName[0]}</div>
                  <div>
                    <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight">{lead.firstName} {lead.lastName}</p>
                    <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest mt-1.5">{OUTREACH_STATUS_LABELS[lead.status] || lead.status}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1.5"><p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Biological Sex</p><p className="text-xs font-black uppercase">{lead.biologicalSex || "N/A"}</p></div>
                  <div className="space-y-1.5"><p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Gender Identity</p><p className="text-xs font-black uppercase">{lead.genderIdentity || "N/A"}</p></div>
                </div>
              </>
            )}

            <div className={`pt-4 border-t border-white/5 relative group/site ${isEditingLocation ? 'bg-white/[0.02] p-3 -mx-3 rounded-b-2xl' : ''}`}>
               <div className="flex items-center justify-between mb-2">
                  <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Mailing Site</p>
                  {!isEditingLocation ? (
                    <button onClick={() => { setLocationForm({ ...lead.mailingAddress }); setIsEditingLocation(true); }} className="opacity-0 group-hover/site:opacity-100 p-1 text-[var(--text-muted)] hover:text-teal-500 transition-all"><Pencil className="w-3 h-3" /></button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setIsEditingLocation(false)} className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><X className="w-3 h-3" /></button>
                      <button onClick={handleSaveLocation} className="p-1 rounded bg-teal-500 text-black hover:bg-teal-600 transition-all"><Check className="w-3 h-3" /></button>
                    </div>
                  )}
               </div>
               {isEditingLocation ? (
                  <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                     <input className="w-full bg-[var(--background)] border border-white/5 rounded p-2 text-[10px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={locationForm.street} onChange={e => setLocationForm({...locationForm, street: e.target.value})} placeholder="Street" />
                     <div className="grid grid-cols-2 gap-2">
                        <input className="w-full bg-[var(--background)] border border-white/5 rounded p-2 text-[10px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={locationForm.city} onChange={e => setLocationForm({...locationForm, city: e.target.value})} placeholder="City" />
                        <input className="w-full bg-[var(--background)] border border-white/5 rounded p-2 text-[10px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={locationForm.postalCode} onChange={e => setLocationForm({...locationForm, postalCode: e.target.value})} placeholder="ZIP" />
                     </div>
                  </div>
               ) : (
                  <>
                    <p className="text-xs font-black text-[var(--text-primary)] uppercase mt-2 line-clamp-1">{lead.mailingAddress.street}</p>
                    <p className="text-[10px] font-black text-teal-500 uppercase mt-1 opacity-80">{lead.mailingAddress.city}, {lead.mailingAddress.state}</p>
                  </>
               )}
            </div>
          </div>
          
          <div className={`bg-[var(--card-bg)] border transition-all rounded-2xl p-5 space-y-5 shadow-2xl relative group ${isEditingReachability ? 'border-teal-500/50' : 'border-[var(--card-border)]'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-teal-500 uppercase tracking-[0.4em] flex items-center gap-2.5"><Clock className="w-5 h-5" /> Reachability Intel</h3>
              {!isEditingReachability ? (
                <button onClick={() => { setReachabilityForm({ preferredContactTime: lead.preferredContactTime }); setIsEditingReachability(true); }} className="p-2 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-teal-500 transition-all opacity-0 group-hover:opacity-100"><Pencil className="w-4 h-4" /></button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setIsEditingReachability(false)} className="p-1.5 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><X className="w-3.5 h-3.5" /></button>
                  <button onClick={handleSaveReachability} className="p-1.5 rounded bg-teal-500 text-black hover:bg-teal-600 transition-all"><Save className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>

            {isEditingReachability ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1.5">
                  <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Preferred Contact Window</p>
                  <select 
                    className="w-full bg-[var(--background)] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-[var(--text-primary)] uppercase outline-none focus:border-teal-500 shadow-inner"
                    value={reachabilityForm.preferredContactTime || ""}
                    onChange={e => setReachabilityForm({...reachabilityForm, preferredContactTime: e.target.value})}
                  >
                    <option value="">SELECT WINDOW...</option>
                    <option value="MORNING (09:00 - 12:00)">MORNING (09:00 - 12:00)</option>
                    <option value="AFTERNOON (13:00 - 16:00)">AFTERNOON (13:00 - 16:00)</option>
                    <option value="EVENING (17:00 - 20:00)">EVENING (17:00 - 20:00)</option>
                    <option value="WEEKENDS ONLY">WEEKENDS ONLY</option>
                  </select>
                  <div className="pt-2">
                    <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1.5">Or Custom Window</p>
                    <input className="w-full bg-[var(--background)] border border-white/5 rounded-xl py-2.5 px-4 text-[10px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-teal-500" value={reachabilityForm.preferredContactTime || ""} onChange={e => setReachabilityForm({...reachabilityForm, preferredContactTime: e.target.value})} placeholder="E.G. LATE NIGHTS" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between"><span className="text-[10px] font-black text-[var(--text-primary)] uppercase">Optimal Window</span><Zap className="w-4 h-4 text-teal-500" /></div>
                <p className="text-lg font-black text-teal-400 uppercase tracking-widest leading-tight">{lead.preferredContactTime || "No Window Set"}</p>
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Calculated via historical success patterns.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <EnrollmentDrawer open={isEnrollmentOpen} onClose={() => setIsEnrollmentOpen(false)} outreachId={lead?.patientOutreachId} />
    </div>
  );
}
