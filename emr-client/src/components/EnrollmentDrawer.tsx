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
  Sun, Wind, Info, Fingerprint, FileText, CreditCard, Heart, Thermometer, Briefcase
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
      dateOfBirth
      biologicalSex
      genderIdentity
      language
      civilStatus
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

type TabType = "COMMAND" | "ADMIN" | "CLINICAL" | "LOGISTICS";

export default function EnrollmentDrawer({ open, onClose, outreachId }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("COMMAND");
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

  // Insurance State (Industry Level)
  const [memberId, setMemberId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [eligibilityStatus, setEligibilityStatus] = useState<"PENDING" | "VERIFIED" | "ERROR">("PENDING");

  // Referral State
  const [referringPhysician, setReferringPhysician] = useState("");
  const [npi, setNpi] = useState("");

  // Clinical State
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState("");
  const [sdohHousing, setSdohHousing] = useState("STABLE");
  const [sdohSupport, setSdohSupport] = useState("ADEQUATE");
  const [acuity, setAcuity] = useState("MODERATE");

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
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingDemographics, setIsEditingDemographics] = useState(false);

  // Demographic Capture
  const [patientDob, setPatientDob] = useState("");
  const [patientSex, setPatientSex] = useState("");
  const [genderIdentity, setGenderIdentity] = useState("");
  const [patientLanguage, setPatientLanguage] = useState("English");
  const [civilStatus, setCivilStatus] = useState("");

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
      if (data?.outreachById?.dateOfBirth) {
        setPatientDob(data.outreachById.dateOfBirth.split('T')[0]);
      }
      if (data?.outreachById?.biologicalSex) {
        setPatientSex(data.outreachById.biologicalSex);
      }
      if (data?.outreachById?.genderIdentity) {
        setGenderIdentity(data.outreachById.genderIdentity);
      }
      if (data?.outreachById?.language) {
        setPatientLanguage(data.outreachById.language);
      }
      if (data?.outreachById?.civilStatus) {
        setCivilStatus(data.outreachById.civilStatus);
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
      setActiveTab("COMMAND");
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

  const handleVerifyAddress = () => {
    setIsVerifyingAddress(true);
    setTimeout(() => {
      setIsVerifyingAddress(false);
    }, 1200);
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
            careNavigatorId: careNavigatorId,
            dateOfBirth: patientDob,
            biologicalSex: patientSex,
            genderIdentity: genderIdentity,
            language: patientLanguage,
            civilStatus: civilStatus
          }
        }
      });
      if (data?.finalizeEnrollment) {
        onClose();
        router.push(`/dashboard/patients/${data.finalizeEnrollment}`);
      }
    } catch (e) { console.error(e); }
  };

  const verifyInsurance = () => {
    setEligibilityStatus("VERIFIED");
    // Mock simulation
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
        <div className={`relative h-full bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] flex flex-col shadow-2xl transition-all duration-500 ease-in-out w-full max-w-[1100px]`}>
          
          {/* Tactical Header */}
          <div className="h-14 flex items-center justify-between px-6 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)] shrink-0">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                  <Target className="w-4 h-4" />
               </div>
               <div>
                  <h2 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] leading-none">
                    Patient Enrollment Workstation
                  </h2>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-60">Mission Control // {lead?.firstName || "Unknown"} {lead?.lastName || "Patient"}</p>
               </div>
            </div>
            
            {/* Tactical Switcher */}
            <div className="flex bg-[var(--input-bg)] rounded-xl p-1 border border-[var(--card-border)]">
              {(["COMMAND", "ADMIN", "CLINICAL", "LOGISTICS"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all
                    ${activeTab === tab ? "bg-[var(--primary)] text-black shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--input-bg)] transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Clinical Workspace */}
          <div className="flex-1 flex flex-row overflow-hidden">
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
                {/* LEFT MAIN PANEL */}
                <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-8 scrollbar-hide border-r border-[var(--card-border)] bg-[var(--sidebar-bg)]">
                  
                  {activeTab === "COMMAND" && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {/* Active Call HUD */}
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
                      <div className="bg-[var(--card-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-4 shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-[var(--primary-glow)]">
                               {lead.firstName?.[0] || "?"}{lead.lastName?.[0] || "?"}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">{lead.firstName || "Unknown"} {lead.lastName || "Patient"}</h3>
                              <div className="flex items-center gap-3 mt-1.5">
                                 <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest opacity-80">{lead.referralSource || "Internal Lead"}</p>
                                 <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                                 <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                    {patientDob ? `${new Date(patientDob).toLocaleDateString()} (${Math.floor((new Date().getTime() - new Date(patientDob).getTime()) / 31557600000)}Y)` : "DOB: --"}
                                 </p>
                                 {(patientSex || genderIdentity) && (
                                    <>
                                       <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                                       <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                          {patientSex}{genderIdentity ? ` (${genderIdentity})` : ''}
                                       </p>
                                    </>
                                 )}
                                 {patientLanguage && (
                                    <>
                                       <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                                       <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{patientLanguage}</p>
                                    </>
                                 )}
                              </div>
                            </div>
                         </div>
                         
                         {/* CALL SCRIPT HUD */}
                         <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-4 shadow-inner">
                            <div className="flex items-center justify-between mb-2">
                               <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-[0.2em]">Active Mission Script</p>
                               <select 
                                 className="bg-transparent border-none text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest outline-none cursor-pointer"
                                 value={selectedScriptId || ""}
                                 onChange={e => setSelectedScriptId(e.target.value)}
                               >
                                  {scripts.map((s: any) => <option key={s.outreachScriptId} value={s.outreachScriptId}>{s.scriptTitle}</option>)}
                               </select>
                            </div>
                            <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed italic opacity-80">
                               {activeScript?.content ? activeScript.content.replace("{firstName}", lead.firstName).replace("{lastName}", lead.lastName) : `"Hello ${lead.firstName}, I'm calling from Halcyon Health..."`}
                            </p>
                         </div>
                      </div>

                      {/* COMMUNICATION CHANNELS */}
                      <div className="space-y-4">
                         <div className="flex items-center justify-between px-1">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Engagement Vectors</p>
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
                                     <option value="Spouse">Spouse</option>
                                     <option value="Child">Child</option>
                                     <option value="Parent">Parent</option>
                                     <option value="Sibling">Sibling</option>
                                     <option value="Other">Other</option>
                                  </select>
                                  <input placeholder="Phone" className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" value={newContact.phoneNumber} onChange={e => setNewContact({...newContact, phoneNumber: e.target.value})} />
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={() => setIsAddingContact(false)} className="flex-1 h-8 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] font-bold text-[9px] uppercase tracking-widest rounded-lg">Cancel</button>
                                  <button onClick={handleAddContact} disabled={addingContact} className="flex-1 h-8 bg-teal-500 text-black font-bold text-[9px] uppercase tracking-widest rounded-lg shadow-lg">Commit Contact</button>
                               </div>
                            </div>
                         )}

                         <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleCall({phone: lead.primaryPhone})} className="flex items-center justify-between p-4 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/10 hover:bg-[var(--primary)]/10 transition-all group">
                               <div className="flex items-center gap-3"><PhoneCall className="w-4 h-4 text-[var(--primary)]" /><div className="text-left"><p className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-widest leading-none">Primary</p><p className="text-[10px] font-bold text-[var(--text-secondary)] mt-1">{lead.primaryPhone || "No Phone"}</p></div></div>
                            </button>
                             {lead.otherContacts?.map((c: any) => (
                               <div key={c.outreachContactId} className="flex items-center justify-between p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] group">
                                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[var(--card-bg)] flex items-center justify-center text-[var(--text-muted)]"><User className="w-3.5 h-3.5" /></div><div className="text-left"><p className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-widest leading-none">{c.firstName}</p><p className="text-[10px] font-bold text-[var(--text-muted)] mt-1">{c.relationship}</p></div></div>
                                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                     <button onClick={() => handleCall(c)} className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center border border-teal-500/20"><PhoneCall className="w-3 h-3" /></button>
                                     <button onClick={() => handleEditContact(c)} className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20"><Edit3 className="w-3 h-3" /></button>
                                     <button onClick={() => handleRemoveContact(c.outreachContactId)} className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* MISSION RESULT SECTION */}
                      <div className="pt-5 border-t border-[var(--card-border)] space-y-4">
                         <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] text-center">Quick Disposition Log</p>
                         <div className="grid grid-cols-4 gap-2">
                           {[
                             {id:"CONNECTED",label:"Connected",c:"hover:text-teal-500"},
                             {id:"NO_ANSWER",label:"No Answer",c:"hover:text-amber-500"},
                             {id:"VOICEMAIL",label:"Voicemail",c:"hover:text-amber-500"},
                             {id:"BUSY",label:"Busy",c:"hover:text-amber-500"},
                             {id:"WRONG_NUMBER",label:"Wrong #",c:"hover:text-rose-500"},
                             {id:"DISCONNECTED",label:"Disc.",c:"hover:text-rose-500"},
                             {id:"DNC",label:"Do Not Call",c:"hover:text-rose-600"},
                             {id:"CALL_BACK",label:"Call Back",c:"hover:text-[var(--primary)]"}
                           ].map(btn=>(
                             <button key={btn.id} onClick={()=>handleLogActivity(btn.id)} className={`h-9 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest transition-all ${btn.c}`}>
                               {btn.label}
                             </button>
                           ))}
                         </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "ADMIN" && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      {/* Patient Demographics */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                           <User className="w-4 h-4 text-[var(--primary)]" />
                           <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Patient Demographics</h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner relative group/demo">
                           {!isEditingDemographics ? (
                             <div className="space-y-6">
                               <div className="flex items-start justify-between">
                                 <div className="grid grid-cols-2 gap-x-12 gap-y-6 flex-1">
                                    <div className="space-y-1">
                                       <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Date of Birth</p>
                                       <p className="text-[10px] font-black text-[var(--text-primary)]">{patientDob || "NOT SPECIFIED"}</p>
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Biological Sex</p>
                                       <p className="text-[10px] font-black text-[var(--text-primary)]">{patientSex || "NOT SPECIFIED"}</p>
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Gender Identity</p>
                                       <p className="text-[10px] font-black text-[var(--text-primary)]">{genderIdentity || "NOT SPECIFIED"}</p>
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Primary Language</p>
                                       <p className="text-[10px] font-black text-[var(--text-primary)]">{patientLanguage || "NOT SPECIFIED"}</p>
                                    </div>
                                 </div>
                                 <button onClick={() => setIsEditingDemographics(true)} className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--primary)] opacity-0 group-hover/demo:opacity-100 transition-all">
                                    <Edit3 className="w-3 h-3" />
                                 </button>
                               </div>
                               <div className="pt-4 border-t border-[var(--card-border)]/50">
                                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Civil Status</p>
                                  <p className="text-[10px] font-black text-[var(--text-primary)]">{civilStatus || "NOT SPECIFIED"}</p>
                               </div>
                             </div>
                           ) : (
                             <div className="space-y-5 animate-in fade-in duration-300">
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                     <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Date of Birth</label>
                                     <input type="date" value={patientDob} onChange={e => setPatientDob(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" />
                                  </div>
                                  <div className="space-y-1.5">
                                     <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Biological Sex</label>
                                     <select value={patientSex} onChange={e => setPatientSex(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none">
                                        <option value="">Select...</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                     </select>
                                  </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                     <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Gender Identity</label>
                                     <input type="text" value={genderIdentity} onChange={e => setGenderIdentity(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="Identity..." />
                                  </div>
                                  <div className="space-y-1.5">
                                     <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Primary Language</label>
                                     <input type="text" value={patientLanguage} onChange={e => setPatientLanguage(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="Language..." />
                                  </div>
                               </div>
                               <div className="space-y-1.5">
                                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Marital / Civil Status</label>
                                  <select value={civilStatus} onChange={e => setCivilStatus(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none">
                                     <option value="">Select...</option>
                                     <option value="Single">Single</option>
                                     <option value="Married">Married</option>
                                     <option value="Divorced">Divorced</option>
                                     <option value="Widowed">Widowed</option>
                                     <option value="Common Law">Common Law</option>
                                  </select>
                               </div>
                               <div className="flex gap-2 pt-2">
                                  <button onClick={() => setIsEditingDemographics(false)} className="flex-1 h-9 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] font-bold text-[9px] uppercase tracking-widest rounded-xl">Discard</button>
                                  <button onClick={() => setIsEditingDemographics(false)} className="flex-1 h-9 bg-teal-500 text-black font-bold text-[9px] uppercase tracking-widest rounded-xl">Update Identity</button>
                               </div>
                             </div>
                           )}
                        </div>
                      </section>
                      {/* Address Management HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                           <MapPin className="w-4 h-4 text-[var(--primary)]" />
                           <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Deployment Destination</h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner relative group/address">
                           {!isEditingAddress ? (
                             <div className="space-y-4">
                               <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                     <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider">{address.street || "NO STREET SPECIFIED"}</p>
                                     <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{address.city}, {address.state} {address.postalCode}</p>
                                  </div>
                                  <button onClick={() => setIsEditingAddress(true)} className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--primary)] opacity-0 group-hover/address:opacity-100 transition-all">
                                     <Edit3 className="w-3 h-3" />
                                  </button>
                               </div>
                               <button onClick={handleVerifyAddress} className="w-full h-10 bg-transparent border border-[var(--primary)]/30 text-[var(--primary)] font-black text-[9px] uppercase tracking-[0.2em] rounded-xl hover:bg-[var(--primary)]/5 transition-all">
                                  {isVerifyingAddress ? "SCRUBBING GEODATA..." : "Verify & Standardize Address"}
                               </button>
                             </div>
                           ) : (
                             <div className="space-y-5 animate-in fade-in duration-300">
                               <div className="space-y-1.5">
                                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Street Address</label>
                                  <input type="text" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="Street..." />
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                     <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">City / Region</label>
                                     <input type="text" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="City..." />
                                  </div>
                                  <div className="space-y-1.5">
                                     <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Postal Code</label>
                                     <input type="text" value={address.postalCode} onChange={e => setAddress({...address, postalCode: e.target.value})} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="Zip..." />
                                  </div>
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={() => setIsEditingAddress(false)} className="flex-1 h-9 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] font-bold text-[9px] uppercase tracking-widest rounded-xl">Discard</button>
                                  <button onClick={() => setIsEditingAddress(false)} className="flex-1 h-9 bg-teal-500 text-black font-bold text-[9px] uppercase tracking-widest rounded-xl">Commit Change</button>
                               </div>
                             </div>
                           )}
                        </div>
                      </section>

                      {/* Insurance Vault */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                           <CreditCard className="w-4 h-4 text-[var(--primary)]" />
                           <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Financial Coverage Vault</h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Health Plan Assignment</label>
                                 <select className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
                                    <option value="">Select Plan...</option>
                                    {enrollmentData?.healthPlans?.map((p: any) => <option key={p.healthPlanId} value={p.healthPlanId}>{p.name}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Eligibility Status</label>
                                 <div className={`w-full h-[41px] rounded-xl flex items-center justify-center border text-[9px] font-black uppercase tracking-widest
                                    ${eligibilityStatus === 'VERIFIED' ? 'bg-teal-500/10 border-teal-500/30 text-teal-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                                    {eligibilityStatus}
                                 </div>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Member ID</label>
                                 <input type="text" value={memberId} onChange={e => setMemberId(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="ID..." />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Group Number</label>
                                 <input type="text" value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50" placeholder="GROUP..." />
                              </div>
                           </div>
                           <button onClick={verifyInsurance} className="w-full h-10 bg-[var(--primary)] text-black font-black text-[9px] uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-[var(--primary-glow)] active:scale-95 transition-all">Execute Eligibility Check</button>
                        </div>
                      </section>

                      {/* Referral HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                           <Briefcase className="w-4 h-4 text-[var(--primary)]" />
                           <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Referral source details</h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-4 shadow-inner">
                           <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Referring Physician</label>
                              <input type="text" value={referringPhysician} onChange={e => setReferringPhysician(e.target.value)} className="w-full bg-transparent text-[11px] font-bold text-[var(--text-primary)] outline-none border-b border-[var(--card-border)] focus:border-[var(--primary)]/50 pb-1" placeholder="DR. NAME..." />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">NPI Number</label>
                                 <input type="text" value={npi} onChange={e => setNpi(e.target.value)} className="w-full bg-transparent text-[10px] font-bold text-[var(--text-primary)] outline-none border-b border-[var(--card-border)]" placeholder="10-DIGIT..." />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Referral Date</label>
                                 <input type="date" className="w-full bg-transparent text-[10px] font-bold text-[var(--text-primary)] outline-none border-b border-[var(--card-border)]" />
                              </div>
                           </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === "CLINICAL" && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      {/* Clinical Intake HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                           <HeartPulse className="w-4 h-4 text-[var(--primary)]" />
                           <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Clinical Intake Triage</h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-6 border border-[var(--card-border)] space-y-6 shadow-inner">
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Primary Diagnosis (ICD-10 Search)</label>
                              <div className="relative">
                                 <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                 <input type="text" value={primaryDiagnosis} onChange={e => setPrimaryDiagnosis(e.target.value)} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-10 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/40" placeholder="Search codes (e.g. I50.9)..." />
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-3 gap-3">
                              {["LOW", "MODERATE", "HIGH"].map(v => (
                                 <button key={v} onClick={() => setAcuity(v)} className={`h-10 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all
                                    ${acuity === v ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]'}`}>
                                    {v} ACUITY
                                 </button>
                              ))}
                           </div>
                        </div>
                      </section>

                      {/* SDoH HUD */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                           <HeartHandshake className="w-4 h-4 text-[var(--primary)]" />
                           <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Social Determinants (SDoH)</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-3">
                              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Housing Stability</label>
                              <div className="space-y-1.5">
                                 {["STABLE", "AT_RISK", "UNSTABLE"].map(v => (
                                    <button key={v} onClick={() => setSdohHousing(v)} className={`w-full h-8 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${sdohHousing === v ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--input-bg)]'}`}>{v.replace('_', ' ')}</button>
                                 ))}
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Social Support</label>
                              <div className="space-y-1.5">
                                 {["ADEQUATE", "LIMITED", "NONE"].map(v => (
                                    <button key={v} onClick={() => setSdohSupport(v)} className={`w-full h-8 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${sdohSupport === v ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--input-bg)]'}`}>{v}</button>
                                 ))}
                              </div>
                           </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === "LOGISTICS" && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      {/* 01: VISIT MODALITY */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center font-black">01</span>
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
                            <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center font-black">02</span>
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
                                       <button key={p.practitionerId} onClick={() => setCareNavigatorId(p.practitionerId)} className={`p-3 rounded-xl border text-left transition-all group relative overflow-hidden ${careNavigatorId === p.practitionerId ? 'bg-teal-500/10 border-teal-500 shadow-sm' : 'bg-[var(--input-bg)] border-[var(--card-border)] hover:border-teal-500/30'}`}>
                                          <p className={`text-[10px] font-black truncate leading-none ${careNavigatorId === p.practitionerId ? 'text-teal-500' : 'text-[var(--text-primary)]'}`}>{p.fullName}</p>
                                          <p className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1.5 opacity-60">Patient Navigation</p>
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
                                       <button key={p.practitionerId} onClick={() => setPrimaryClinicianId(p.practitionerId)} className={`p-3 rounded-xl border text-left transition-all group relative overflow-hidden ${primaryClinicianId === p.practitionerId ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm' : 'bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/30'}`}>
                                          <p className={`text-[10px] font-black truncate leading-none ${primaryClinicianId === p.practitionerId ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>{p.fullName}</p>
                                          <p className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1.5 opacity-60">Lead Practitioner</p>
                                          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[var(--card-border)] opacity-60">
                                             <Car className="w-2 h-2" /><span className="text-[7px] font-bold uppercase tracking-tighter">20m • 2.6mi</span>
                                          </div>
                                       </button>
                                    ))}
                              </div>
                           </div>
                        </div>
                      </section>
                    </div>
                  )}
                </div>

                {/* RIGHT TELEMETRY PANEL */}
                <div className="w-[380px] flex flex-col bg-[var(--sidebar-bg)] p-6 space-y-6 overflow-y-auto scrollbar-hide">
                  
                  {/* MISSION TELEMETRY HUD */}
                  <div className="grid grid-cols-2 gap-4 pb-6 border-b border-[var(--card-border)] shrink-0">
                     <div className="space-y-1.5"><p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Travel Distance</p><p className="text-xl font-black text-[var(--text-primary)]">2.6mi</p></div>
                     <div className="space-y-1.5 border-l border-[var(--card-border)] pl-4"><p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Transit Time</p><p className="text-xl font-black text-[var(--text-primary)]">20m</p></div>
                  </div>

                  {/* GEOSPATIAL CALENDAR */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Encounter Slot</h3>
                    <div className="bg-[var(--input-bg)] rounded-3xl border border-[var(--card-border)] p-4 space-y-4 shadow-inner">
                       <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                          <div className="flex gap-1">
                             <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1.5 hover:bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] transition-all"><ChevronLeft className="w-3 h-3" /></button>
                             <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1.5 hover:bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] transition-all"><ChevronRight className="w-3 h-3" /></button>
                          </div>
                       </div>
                       <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                    </div>
                    <div className="flex bg-[var(--input-bg)] rounded-xl p-1 border border-[var(--card-border)] gap-1">
                       <button onClick={() => setPeriod("AM")} className={`flex-1 py-2 rounded-lg text-[9px] font-black tracking-[0.2em] transition-all ${period === "AM" ? "bg-teal-500 text-black shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>MORNING</button>
                       <button onClick={() => setPeriod("PM")} className={`flex-1 py-2 rounded-lg text-[9px] font-black tracking-[0.2em] transition-all ${period === "PM" ? "bg-teal-500 text-black shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>AFTERNOON</button>
                    </div>
                  </div>

                  {/* MISSION ACTIVITY TIMELINE */}
                  <div className="flex-1 space-y-4 overflow-hidden flex flex-col pt-4 border-t border-[var(--card-border)]">
                    <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2"><History className="w-3.5 h-3.5" /> Engagement Timeline</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
                       {lead.activities?.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-2">
                             <Clock className="w-6 h-6" />
                             <p className="text-[9px] font-bold uppercase tracking-widest">No History</p>
                          </div>
                       ) : lead.activities.map((a: any) => (
                          <div key={a.outreachActivityId} className="flex gap-3 group">
                             <div className="flex flex-col items-center">
                                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${a.outcome === 'CONNECTED' ? 'bg-teal-500 shadow-[0_0_8px_var(--primary)]' : 'bg-[var(--card-border)]'}`} />
                                <div className="w-px flex-1 bg-[var(--card-border)] my-1" />
                             </div>
                             <div className="pb-3 border-b border-[var(--card-border)]/40 flex-1">
                                <div className="flex justify-between items-baseline mb-1">
                                   <p className="text-[9px] font-black text-[var(--text-primary)] uppercase tracking-wider">{a.outcome.replace('_', ' ')}</p>
                                   <p className="text-[8px] font-bold text-[var(--text-muted)]">{new Date(a.activityDate).toLocaleDateString()}</p>
                                </div>
                                <p className="text-[9px] text-[var(--text-secondary)] leading-relaxed italic opacity-70">"{a.notes}"</p>
                             </div>
                          </div>
                       ))}
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="pt-4 border-t border-[var(--card-border)] space-y-3 shrink-0">
                     <button onClick={handleFinalize} disabled={finalizing || !primaryClinicianId || !selectedPlan} className="w-full h-12 bg-[var(--primary)] rounded-xl text-black font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-[var(--primary-glow)] hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-20">
                        {finalizing ? "PROVISIONING..." : "COMMIT ENROLLMENT"}
                     </button>
                     <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center opacity-40">Aura OS // Mission Finalization protocol</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
