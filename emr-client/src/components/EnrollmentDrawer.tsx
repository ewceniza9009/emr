"use client";

import React, { useState, useEffect, useMemo } from "react";
import HalcyonPortal from "./Portal";
import { useQuery, useMutation, gql } from "@apollo/client";
import { 
  X, PhoneCall, CheckCircle2, Calendar, Stethoscope, ChevronRight, ChevronLeft,
  ClipboardCheck, ShieldCheck, Activity, User, MapPin, Users, AlertCircle,
  UserPlus, Hash, Target, Zap, PhoneOff, PhoneForwarded, Trash2, Mic, Wifi,
  Smartphone, BrainCircuit, MessageSquare, Clock, Video, Home, Building2, Timer,
  Search, Plus, History, Check, HeartPulse, HeartHandshake, Shield, Edit3, Car, Navigation,
  Sun, Wind, Info, Fingerprint
} from "lucide-react";
import { useRouter } from "next/navigation";

const GET_LEAD_DETAILS = gql`
  query GetLeadDetails($id: UUID!) {
    outreachById(outreachId: $id) {
      patientOutreachId
      firstName
      lastName
      primaryPhone
      primaryEmail
      referralSource
      techAccess
      barriersToCare
      communicationStatus
      mailingAddress {
        street
        city
        state
        postalCode
      }
      otherContacts {
        outreachContactId
        firstName
        lastName
        relationship
        phoneNumber
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
    outreachScripts {
      outreachScriptId
      scriptTitle
      content
    }
    practitioners {
      practitionerId
      fullName
      firstName
      lastName
      position
      isCareNavigator
      isSupportingClinician
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

const UPDATE_OUTREACH_LEAD = gql`
  mutation UpdateLead($input: UpdateOutreachLeadCommandInput!) {
    updateOutreachLead(input: $input)
  }
`;

const FINALIZE_ENROLLMENT = gql`
  mutation FinalizeEnrollment($input: FinalizeEnrollmentCommandInput!) {
    finalizeEnrollment(input: $input)
  }
`;

const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

interface Props {
  open: boolean;
  onClose: () => void;
  outreachId: string | null;
}

export default function EnrollmentDrawer({ open, onClose, outreachId }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [modality, setModality] = useState("IN_PERSON_HOME_VISIT");
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  
  // Phase 3 Advanced Scheduling State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [period, setPeriod] = useState<"AM" | "PM" | null>("AM");
  const [duration, setDuration] = useState(45);
  const [visitType, setVisitType] = useState("INITIAL_HOSPICE_INTAKE");
  const [primaryClinicianId, setPrimaryClinicianId] = useState("");
  const [careNavigatorId, setCareNavigatorId] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  // Address Controlled State
  const [address, setAddress] = useState({
    street: "", city: "", state: "", postalCode: ""
  });

  // Assessment State
  const [disposition, setDisposition] = useState("COOPERATIVE");
  const [techAccess, setTechAccess] = useState("SMARTPHONE");
  const [cognitive, setCognitive] = useState("AUTONOMOUS");
  
  const [newContact, setNewContact] = useState({
    firstName: "", lastName: "", relationship: "Spouse", phoneNumber: ""
  });

  const { data: leadData, loading: leadLoading } = useQuery(GET_LEAD_DETAILS, {
    variables: { id: outreachId },
    skip: !outreachId || !open,
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (data?.outreachById?.mailingAddress) {
        setAddress({
          street: data.outreachById.mailingAddress.street || "",
          city: data.outreachById.mailingAddress.city || "",
          state: data.outreachById.mailingAddress.state || "",
          postalCode: data.outreachById.mailingAddress.postalCode || ""
        });
      }
    }
  });

  const { data: enrollmentData } = useQuery(GET_ENROLLMENT_DATA, { skip: !open });
  
  const [logActivity] = useMutation(LOG_OUTREACH_ACTIVITY);
  const [updateLead] = useMutation(UPDATE_OUTREACH_LEAD);
  const [addContact, { loading: addingContact }] = useMutation(ADD_OUTREACH_CONTACT);
  const [removeContact] = useMutation(REMOVE_OUTREACH_CONTACT);
  const [finalize, { loading: finalizing }] = useMutation(FINALIZE_ENROLLMENT);

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setActiveCall(null);
      setIsAddingContact(false);
      setPrimaryClinicianId("");
      setCareNavigatorId("");
    }
  }, [open, outreachId]);

  const lead = leadData?.outreachById;
  const practitioners = enrollmentData?.practitioners || [];
  const scripts = enrollmentData?.outreachScripts || [];
  const activeScript = scripts.find((s: any) => s.outreachScriptId === selectedScriptId) || scripts[0];

  const handleCall = (contact: any) => {
    setActiveCall({ ...contact, status: 'CONNECTING...' });
    setTimeout(() => {
      setActiveCall((prev: any) => prev ? { ...prev, status: 'ON LINE' } : null);
    }, 1500);
  };

  const handleLogActivity = async (outcome: string) => {
    if (!outreachId) return;
    try {
      await logActivity({
        variables: {
          input: {
            outreachId: outreachId,
            method: "TELEPHONE",
            outcome: outcome,
            notes: `Enrollment outcome: ${outcome}`
          }
        },
        refetchQueries: ["GetLeadDetails"]
      });
    } catch (e) { console.error(e); }
  };

  const handleUpdateLead = async (fields: any) => {
    try {
      await updateLead({
        variables: {
          input: { patientOutreachId: outreachId, ...fields }
        }
      });
    } catch (e) { console.error(e); }
  };

  const handleAddContact = async () => {
    if (!newContact.firstName || !newContact.phoneNumber) return;
    try {
      if (editingContactId) {
        await removeContact({
          variables: { input: { outreachContactId: editingContactId } }
        });
      }
      await addContact({
        variables: {
          input: { patientOutreachId: outreachId, ...newContact }
        },
        refetchQueries: ["GetLeadDetails"]
      });
      setIsAddingContact(false);
      setEditingContactId(null);
      setNewContact({ firstName: "", lastName: "", relationship: "Family", phoneNumber: "" });
    } catch (e) { console.error(e); }
  };

  const handleEditContact = (contact: any) => {
    setNewContact({
      firstName: contact.firstName,
      lastName: contact.lastName,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber
    });
    setEditingContactId(contact.outreachContactId);
    setIsAddingContact(true);
  };

  const handleRemoveContact = async (id: string) => {
    try {
      await removeContact({
        variables: { input: { outreachContactId: id } },
        refetchQueries: ["GetLeadDetails"]
      });
    } catch (e) { console.error(e); }
  };

  const handleFinalize = async () => {
    try {
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(period === "AM" ? 9 : 14, 0, 0, 0);
      
      const { data } = await finalize({
        variables: {
          input: {
            patientOutreachId: outreachId,
            modality: modality,
            healthPlanId: selectedPlan,
            disposition: disposition,
            techAccess: techAccess,
            orientationDate: scheduledDate.toISOString(),
            primaryClinicianId: primaryClinicianId,
            careNavigatorId: careNavigatorId
          }
        }
      });
      if (data?.finalizeEnrollment) {
        onClose();
        router.push(`/dashboard/patients/${data.finalizeEnrollment}`);
      }
    } catch (e) { console.error(e); }
  };

  const renderCalendar = () => {
    const days = [];
    const count = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    for (let i = 0; i < first; i++) days.push(<div key={`empty-${i}`} className="h-10" />);
    for (let d = 1; d <= count; d++) {
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === viewDate.getMonth();
      days.push(
        <button key={d} type="button" onClick={() => setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))}
          className={`h-10 w-full rounded-2xl text-[10px] font-bold transition-all flex items-center justify-center
            ${isSelected ? "bg-[var(--primary)] text-black shadow-xl shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
          {d}
        </button>
      );
    }
    return days;
  };

  if (!open) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative h-full bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] flex flex-col shadow-2xl transition-all duration-500 ease-in-out ${currentStep === 3 ? 'w-full max-w-[1100px]' : 'w-full max-w-[480px]'}`}>
          
          {/* Tactical Header */}
          <div className="h-14 flex items-center justify-between px-6 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)] shrink-0">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                  {currentStep === 3 ? <Calendar className="w-4 h-4" /> : <Target className="w-4 h-4" />}
               </div>
               <div>
                  <h2 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] leading-none">
                    {currentStep === 3 ? "Mission Scheduling" : "Enrollment Mission"}
                  </h2>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-60">Lead • {lead?.firstName || "Unknown"} {lead?.lastName || "Patient"}</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--input-bg)] transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Clinical Workspace */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {leadLoading ? (
               <div className="flex-1 flex items-center justify-center"><Activity className="w-5 h-5 text-[var(--primary)] animate-spin opacity-50" /></div>
            ) : !lead ? (
               <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4 opacity-40">
                  <AlertCircle className="w-10 h-10 text-rose-500" />
                  <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">Lead Not Found</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Mission Aborted // Verify Registry ID</p>
               </div>
            ) : (
              <>
                {currentStep < 3 ? (
                  <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                    {/* PHASE 1 & 2 UI */}
                    {currentStep === 1 && (
                      <div className="space-y-5 animate-in fade-in duration-300">
                         {activeCall && (
                           <div className="bg-teal-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-teal-900/40 animate-pulse ring-1 ring-teal-400/50">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white"><PhoneForwarded className="w-5 h-5 animate-bounce" /></div>
                                 <div><p className="text-white font-black text-[10px] uppercase tracking-widest leading-none">{activeCall.status}</p><p className="text-teal-100 text-[11px] font-bold mt-1.5 opacity-80">{activeCall.phone || activeCall.phoneNumber}</p></div>
                              </div>
                              <button onClick={() => setActiveCall(null)} className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"><PhoneOff className="w-4 h-4" /></button>
                           </div>
                         )}
                         
                         {/* DEMOGRAPHIC IDENTITY HUD */}
                         <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] space-y-4 shadow-sm">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-black font-bold text-xs shadow-lg shadow-[var(--primary-glow)]">
                                  {lead.firstName?.[0] || "?"}{lead.lastName?.[0] || "?"}
                               </div>
                               <div>
                                 <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">{lead.firstName || "Unknown"} {lead.lastName || "Patient"}</h3>
                                 <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest opacity-80">{lead.referralSource || "Internal Lead"}</p>
                                    <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                       {lead.dateOfBirth ? `${new Date(lead.dateOfBirth).toLocaleDateString()} (${Math.floor((new Date().getTime() - new Date(lead.dateOfBirth).getTime()) / 31557600000)}Y)` : "DOB: --"}
                                    </p>
                                    {lead.gender && (
                                       <>
                                          <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                                          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{lead.gender}</p>
                                       </>
                                    )}
                                 </div>
                               </div>
                            </div>
                            <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-3 shadow-inner">
                               <p className="text-[10px] font-bold text-[var(--text-secondary)] leading-relaxed italic opacity-80">
                                  {activeScript?.content ? activeScript.content.replace("{firstName}", lead.firstName).replace("{lastName}", lead.lastName) : `"Hello ${lead.firstName}, I'm calling from Halcyon Health..."`}
                               </p>
                            </div>
                         </div>

                         {/* OUTBOUND & TRUSTED CONTACTS PANEL */}
                         <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                               <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Communication Channels</p>
                               <button onClick={() => setIsAddingContact(!isAddingContact)} className={`text-[9px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1.5 transition-colors ${isAddingContact ? 'text-rose-500' : 'text-[var(--primary)]'}`}>
                                  {isAddingContact ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />} 
                                  {isAddingContact ? 'Abort' : 'Add Contact'}
                               </button>
                            </div>
                            {isAddingContact && (
                               <div className="bg-[var(--input-bg)] border border-[var(--primary)]/30 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2">
                                  <div className="grid grid-cols-2 gap-2"><input placeholder="First Name" className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" value={newContact.firstName} onChange={e => setNewContact({...newContact, firstName: e.target.value})} /><input placeholder="Last Name" className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" value={newContact.lastName} onChange={e => setNewContact({...newContact, lastName: e.target.value})} /></div>
                                  <div className="grid grid-cols-2 gap-2">
                                     <select className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" value={newContact.relationship} onChange={e => setNewContact({...newContact, relationship: e.target.value})}>
                                        <option value="Spouse" className="bg-[var(--sidebar-bg)]">Spouse</option>
                                        <option value="Child" className="bg-[var(--sidebar-bg)]">Child</option>
                                        <option value="Parent" className="bg-[var(--sidebar-bg)]">Parent</option>
                                        <option value="Sibling" className="bg-[var(--sidebar-bg)]">Sibling</option>
                                        <option value="Relative" className="bg-[var(--sidebar-bg)]">Relative</option>
                                        <option value="Friend" className="bg-[var(--sidebar-bg)]">Friend</option>
                                        <option value="Lawyer" className="bg-[var(--sidebar-bg)]">Lawyer</option>
                                        <option value="LegalRepresentative" className="bg-[var(--sidebar-bg)]">Legal Representative</option>
                                        <option value="Other" className="bg-[var(--sidebar-bg)]">Other</option>
                                     </select>
                                     <input placeholder="Phone" className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" value={newContact.phoneNumber} onChange={e => setNewContact({...newContact, phoneNumber: e.target.value})} />
                                  </div>
                                  <div className="flex gap-2">
                                     <button onClick={() => { setIsAddingContact(false); setEditingContactId(null); }} className="flex-1 h-8 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] font-bold text-[9px] uppercase tracking-widest rounded-lg">Cancel</button>
                                     <button onClick={handleAddContact} disabled={addingContact} className="flex-1 h-8 bg-teal-500 text-black font-bold text-[9px] uppercase tracking-widest rounded-lg shadow-lg shadow-teal-500/10">
                                        {editingContactId ? "Update Contact" : "Commit Contact"}
                                     </button>
                                  </div>
                               </div>
                            )}
                            
                            {/* TRUSTED CONTACT LIST */}
                            <div className="space-y-2">
                               <button onClick={() => handleCall({phone: lead.primaryPhone})} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/10 hover:bg-[var(--primary)]/10 transition-all group active:scale-[0.98]">
                                  <div className="flex items-center gap-3"><PhoneCall className="w-3.5 h-3.5 text-[var(--primary)]" /><div className="text-left"><p className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-widest">Primary Patient</p><p className="text-[10px] font-bold text-[var(--text-secondary)] mt-0.5">{lead.primaryPhone || "No Phone Registered"}</p></div></div>
                                  <ChevronRight className="w-3.5 h-3.5 text-[var(--primary)] opacity-40" />
                               </button>
                               
                               {lead.otherContacts?.map((c: any) => (
                                  <div key={c.outreachContactId} className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] group">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--card-bg)] flex items-center justify-center text-[var(--text-muted)]"><User className="w-4 h-4" /></div>
                                        <div className="text-left">
                                           <p className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-widest">{c.firstName} {c.lastName}</p>
                                           <p className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{c.relationship} • {c.phoneNumber}</p>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <button onClick={() => handleCall(c)} className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center border border-teal-500/20 hover:bg-teal-500 hover:text-black transition-all" title="Call Contact"><PhoneCall className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleEditContact(c)} className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/20 hover:bg-[var(--primary)] hover:text-black transition-all" title="Edit Contact"><Edit3 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleRemoveContact(c.outreachContactId)} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all" title="Remove Contact"><Trash2 className="w-3.5 h-3.5" /></button>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>

                         {/* MISSION RESULT SECTION */}
                         <div className="pt-5 border-t border-[var(--card-border)] space-y-4">
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 text-center">Mission Result</p>
                            <button onClick={() => setCurrentStep(2)} className="w-full h-12 rounded-xl bg-teal-500 text-black font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-[0.98] mb-3"><CheckCircle2 className="w-4 h-4" /> Connected & Assessment Started</button>
                            <div className="grid grid-cols-3 gap-2">{[{id:"NO_ANSWER",label:"No Answer",c:"hover:text-amber-500"},{id:"VOICEMAIL",label:"Voicemail",c:"hover:text-amber-500"},{id:"BUSY",label:"Busy Line",c:"hover:text-amber-500"},{id:"WRONG_NUMBER",label:"Wrong #",c:"hover:text-rose-500"},{id:"DISCONNECTED",label:"Disconnected",c:"hover:text-rose-500"},{id:"LANGUAGE_BARRIER",label:"Lang. Barrier",c:"hover:text-purple-500"},{id:"DNC",label:"Do Not Call",c:"hover:text-rose-600"},{id:"CALL_BACK",label:"Call Back",c:"hover:text-[var(--primary)]"}].map(btn=>(<button key={btn.id} onClick={()=>handleLogActivity(btn.id)} className={`h-8 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest transition-all ${btn.c}`}>{btn.label}</button>))}</div>
                         </div>
                      </div>
                    )}
                    {currentStep === 2 && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                         <div className="flex items-center gap-3"><Target className="w-4 h-4 text-[var(--primary)]" /><h3 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest">Interest & Capability</h3></div>
                         <div className="grid grid-cols-1 gap-2">{[{id:"EAGER",label:"Eager / Urgent",icon:<Zap className="w-3 h-3"/>},{id:"COOPERATIVE",label:"COOPERATIVE",icon:<CheckCircle2 className="w-3 h-3"/>},{id:"HESITANT",label:"HESITANT",icon:<Clock className="w-3 h-3"/>},{id:"REFUSED",label:"DECLINED CARE",icon:<PhoneOff className="w-3 h-3"/>}].map(v=>(<button key={v.id} onClick={()=>{setDisposition(v.id);handleUpdateLead({disposition:v.id});}} className={`h-11 px-4 rounded-xl flex items-center justify-between border transition-all ${disposition===v.id?'bg-[var(--primary)] border-transparent text-black shadow-md shadow-[var(--primary-glow)]':'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--primary)]/30'}`}><div className="flex items-center gap-3">{v.icon}<span className="text-[9px] font-bold uppercase tracking-widest">{v.label}</span></div></button>))}</div>
                         <div className="pt-4 border-t border-[var(--card-border)] space-y-3"><div className="flex items-center gap-2 px-1"><MapPin className="w-3.5 h-3.5 text-[var(--primary)]" /><p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Service Address Command</p></div><div className="bg-[var(--input-bg)] rounded-2xl p-4 border border-[var(--card-border)] space-y-3 shadow-inner"><div className="space-y-1"><label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Street Address</label><input type="text" value={address.street} onChange={(e)=>setAddress({...address,street:e.target.value})} onBlur={()=>handleUpdateLead({mailingAddress:address})} className="w-full bg-transparent text-[11px] font-bold text-[var(--text-primary)] outline-none border-b border-[var(--card-border)] focus:border-[var(--primary)]/50 pb-1" placeholder="STREET..." /></div><div className="grid grid-cols-3 gap-3"><div><label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">City</label><input type="text" value={address.city} onChange={(e)=>setAddress({...address,city:e.target.value})} onBlur={()=>handleUpdateLead({mailingAddress:address})} className="w-full bg-transparent text-[10px] font-bold text-[var(--text-primary)] outline-none border-b border-[var(--card-border)]" /></div><div><label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">State</label><input type="text" value={address.state} onChange={(e)=>setAddress({...address,state:e.target.value})} onBlur={()=>handleUpdateLead({mailingAddress:address})} className="w-full bg-transparent text-[10px] font-bold text-[var(--text-primary)] outline-none border-b border-[var(--card-border)]" /></div><div><label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Zip</label><input type="text" value={address.postalCode} onChange={(e)=>setAddress({...address,postalCode:e.target.value})} onBlur={()=>handleUpdateLead({mailingAddress:address})} className="w-full bg-transparent text-[10px] font-bold text-[var(--text-primary)] outline-none border-b border-[var(--card-border)]" /></div></div></div></div>
                         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--card-border)]"><div className="space-y-2"><label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Hardware</label>{["SMARTPHONE","TABLET","COMPUTER"].map(v=>(<button key={v} onClick={()=>setTechAccess(v)} className={`w-full h-8 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${techAccess===v?'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]':'bg-[var(--input-bg)]'}`}>{v}</button>))}</div><div className="space-y-2"><label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Autonomy</label>{[{id:"AUTONOMOUS",l:"Autonomous"},{id:"CAREGIVER",l:"Caregiver"}].map(v=>(<button key={v.id} onClick={()=>setCognitive(v.id)} className={`w-full h-8 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${cognitive===v.id?'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]':'bg-[var(--input-bg)]'}`}>{v.l}</button>))}</div></div>
                         <button onClick={() => setCurrentStep(3)} className="w-full h-12 bg-[var(--primary)] rounded-xl text-black font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] active:scale-95 transition-all">Next: Team & Schedule</button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* PHASE 3: INDUSTRIAL SPLIT COMMAND CENTER */
                  <div className="flex-1 flex flex-row overflow-hidden animate-in slide-in-from-right duration-500">
                    
                    {/* LEFT PANEL: ASSIGNMENT & CLASSIFICATION */}
                    <div className="flex-1 flex flex-col border-r border-[var(--card-border)] bg-[var(--sidebar-bg)] overflow-y-auto p-6 space-y-8 scrollbar-hide">
                      
                      {/* 01: VISIT MODALITY */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">01</span>
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Visit Modality</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-2.5">
                           {[
                              { id: "IN_PERSON_HOME_VISIT", label: "Home Visit", icon: <Home className="w-4 h-4" /> },
                              { id: "IN_PERSON_FACILITY", label: "Facility", icon: <Building2 className="w-4 h-4" /> },
                              { id: "TELEHEALTH_VIDEO", label: "Video Call", icon: <Video className="w-4 h-4" /> },
                              { id: "TELEPHONE", label: "Audio Only", icon: <PhoneCall className="w-4 h-4" /> },
                           ].map((m) => (
                             <button key={m.id} onClick={() => setModality(m.id)} className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-2xl border text-[9px] font-bold transition-all
                                     ${modality === m.id ? "bg-[var(--primary)] border-transparent text-black shadow-lg shadow-[var(--primary-glow)]" : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)]"}`}>
                               {m.icon}
                               {m.label}
                             </button>
                           ))}
                        </div>
                      </section>

                      {/* 02: CLINICAL TEAM ASSIGNMENT */}
                      <section className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">02</span>
                            <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Clinical Team assignment</h3>
                          </div>
                          <div className="relative group">
                             <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                             <input placeholder="Filter Practitioners..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full py-1.5 pl-9 pr-4 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/40 w-32 focus:w-48 transition-all" />
                          </div>
                        </div>
                        
                        <div className="space-y-5">
                           {/* Care Navigator Selection */}
                           <div>
                              <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 px-1">02-A • Care Navigator Assignment</p>
                              <div className="grid grid-cols-3 gap-2">
                                 {practitioners
                                    .filter((p: any) => p.isCareNavigator && (!staffSearch || p.fullName.toLowerCase().includes(staffSearch.toLowerCase())))
                                    .slice(0, 3)
                                    .map((p: any) => (
                                       <button key={p.practitionerId} onClick={() => setCareNavigatorId(p.practitionerId)} className={`p-2.5 rounded-xl border text-left transition-all group relative overflow-hidden ${careNavigatorId === p.practitionerId ? 'bg-teal-500/10 border-teal-500 shadow-sm' : 'bg-[var(--input-bg)] border-[var(--card-border)] hover:border-teal-500/30'}`}>
                                          <div className="flex items-center justify-between mb-1.5">
                                             <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${careNavigatorId === p.practitionerId ? 'bg-teal-500 text-black' : 'bg-[var(--card-bg)] text-[var(--text-muted)]'}`}><Users className="w-3.5 h-3.5" /></div>
                                             {careNavigatorId === p.practitionerId && <Check className="w-3.5 h-3.5 text-teal-500" />}
                                          </div>
                                          <p className={`text-[10px] font-black truncate leading-none ${careNavigatorId === p.practitionerId ? 'text-teal-500' : 'text-[var(--text-primary)]'}`}>{p.fullName}</p>
                                          <p className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1 opacity-60">Patient Navigation</p>
                                       </button>
                                    ))}
                              </div>
                           </div>

                           {/* Primary Lead Selection */}
                           <div>
                              <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 px-1">02-B • Primary Clinician Lead</p>
                              <div className="grid grid-cols-3 gap-2">
                                 {practitioners
                                    .filter((p: any) => p.isSupportingClinician && (!staffSearch || p.fullName.toLowerCase().includes(staffSearch.toLowerCase())))
                                    .slice(0, 3)
                                    .map((p: any) => (
                                       <button key={p.practitionerId} onClick={() => setPrimaryClinicianId(p.practitionerId)} className={`p-2.5 rounded-xl border text-left transition-all group relative overflow-hidden ${primaryClinicianId === p.practitionerId ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm' : 'bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/30'}`}>
                                          <div className="flex items-center justify-between mb-1.5">
                                             <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${primaryClinicianId === p.practitionerId ? 'bg-[var(--primary)] text-black' : 'bg-[var(--card-bg)] text-[var(--text-muted)]'}`}><User className="w-3.5 h-3.5" /></div>
                                             {primaryClinicianId === p.practitionerId && <Check className="w-3.5 h-3.5 text-[var(--primary)]" />}
                                          </div>
                                          <p className={`text-[10px] font-black truncate leading-none ${primaryClinicianId === p.practitionerId ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>{p.fullName}</p>
                                          <p className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1 opacity-60">Lead Practitioner</p>
                                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[var(--card-border)] opacity-60">
                                             <Car className="w-2 h-2" /><span className="text-[7px] font-bold uppercase tracking-tighter">20m • 2.6mi</span>
                                          </div>
                                       </button>
                                    ))}
                              </div>
                           </div>
                        </div>
                      </section>

                      {/* 03: CLINICAL GUIDANCE SCRIPTS */}
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">03</span>
                            <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Outreach Guidance</h3>
                          </div>
                          <select className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full px-4 py-1.5 text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest outline-none" value={selectedScriptId || ""} onChange={e => setSelectedScriptId(e.target.value)}>
                             {scripts.map((s: any) => <option key={s.outreachScriptId} value={s.outreachScriptId}>{s.scriptTitle.replace('PROTOCOL', '').trim()}</option>)}
                          </select>
                        </div>
                        <div className="bg-teal-500/5 border border-teal-500/10 rounded-2xl p-5 shadow-inner">
                           <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-loose italic opacity-80">"{activeScript?.content}"</p>
                        </div>
                      </section>
                    </div>

                    {/* RIGHT PANEL: GEOSPATIAL INTELLIGENCE & TIMELINE */}
                    <div className="w-[420px] flex flex-col bg-[var(--sidebar-bg)] p-6 space-y-6 overflow-y-auto scrollbar-hide border-l border-[var(--card-border)]">
                      
                      {/* MISSION TELEMETRY HUD */}
                      <div className="grid grid-cols-3 gap-4 pb-6 border-b border-[var(--card-border)] shrink-0">
                         <div className="space-y-1.5"><p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Travel</p><p className="text-base font-bold text-[var(--text-primary)]">20m</p></div>
                         <div className="space-y-1.5 border-l border-[var(--card-border)] pl-4"><p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Distance</p><p className="text-base font-bold text-[var(--text-primary)]">2.6mi</p></div>
                         <div className="space-y-1.5 border-l border-[var(--card-border)] pl-4"><p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Duration</p><p className="text-base font-bold text-[var(--text-primary)]">{duration}m</p></div>
                      </div>

                      {/* GEOSPATIAL CALENDAR */}
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Encounter Slot</h3>
                        <div className="bg-[var(--input-bg)] rounded-3xl border border-[var(--card-border)] p-5 space-y-4 shadow-inner">
                           <div className="flex items-center justify-between px-1">
                              <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                              <div className="flex gap-1">
                                 <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-2 hover:bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
                                 <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-2 hover:bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
                              </div>
                           </div>
                           <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                        </div>
                        <div className="flex bg-[var(--input-bg)] rounded-2xl p-1.5 border border-[var(--card-border)] gap-1.5">
                           <button onClick={() => setPeriod("AM")} className={`flex-1 py-3.5 rounded-xl text-[10px] font-bold tracking-[0.2em] transition-all ${period === "AM" ? "bg-teal-500 text-black shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>MORNING</button>
                           <button onClick={() => setPeriod("PM")} className={`flex-1 py-3.5 rounded-xl text-[10px] font-bold tracking-[0.2em] transition-all ${period === "PM" ? "bg-teal-500 text-black shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>AFTERNOON</button>
                        </div>
                      </div>

                      {/* MISSION ACTIVITY TIMELINE */}
                      <div className="flex-1 space-y-4 overflow-hidden flex flex-col pt-4 border-t border-[var(--card-border)]">
                        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2"><History className="w-3.5 h-3.5" /> Engagement Timeline</h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-5 scrollbar-hide">
                           {lead.activities?.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-2">
                                 <Clock className="w-6 h-6" />
                                 <p className="text-[9px] font-bold uppercase tracking-widest">No Activity History Registered</p>
                              </div>
                           ) : lead.activities.map((a: any) => (
                              <div key={a.outreachActivityId} className="flex gap-4 group">
                                 <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full mt-1 ${a.outcome === 'CONNECTED' ? 'bg-teal-500 shadow-[0_0_8px_var(--primary)]' : 'bg-[var(--card-border)]'}`} />
                                    <div className="w-px flex-1 bg-[var(--card-border)] my-1.5" />
                                 </div>
                                 <div className="pb-4 border-b border-[var(--card-border)]/50 flex-1">
                                    <div className="flex justify-between items-baseline mb-1">
                                       <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">{a.outcome.replace('_', ' ')}</p>
                                       <p className="text-[8px] font-bold text-[var(--text-muted)]">{new Date(a.activityDate).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed italic opacity-70">"{a.notes}"</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                      </div>

                      <button onClick={handleFinalize} disabled={finalizing || !primaryClinicianId} className="w-full h-14 bg-[var(--primary)] rounded-2xl text-black font-bold text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-[var(--primary-glow)] hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-20 mt-auto">
                        {finalizing ? "PROVISIONING..." : "COMMIT ENROLLMENT"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tactical Navigation Control */}
          <div className="h-14 px-6 flex items-center justify-between border-t border-[var(--card-border)] bg-[var(--sidebar-bg)] shrink-0">
             {currentStep > 1 ? (
               <button onClick={() => setCurrentStep(prev => prev - 1)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--input-bg)] text-[var(--text-muted)] font-bold text-[9px] uppercase tracking-widest hover:text-[var(--text-primary)] transition-all active:scale-95">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
               </button>
             ) : <div />}
             <div className="flex gap-1.5">
                {[1,2,3].map(i => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-300 ${currentStep === i ? 'w-4 bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]' : 'w-1 bg-[var(--card-border)]'}`} />
                ))}
             </div>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
