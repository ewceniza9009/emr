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
  UserPlus,
  Hash,
  Target,
  Zap,
  PhoneOff,
  PhoneForwarded
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
      setTempNumbers({});
      setAddedRelatives([]);
      setIsDialPadOpen(false);
      setDialedNumber("");
      setActiveCall(null);
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
      status: 'Connecting...'
    });
    setTimeout(() => {
      setActiveCall((prev: any) => prev ? { ...prev, status: 'Active' } : null);
    }, 1500);
  };

  const lead = leadData?.outreachById;
  const plans = planData?.healthPlans || [];

  if (!open) return null;

  const hasNoContacts = lead && !lead.primaryPhone && (!lead.otherContacts || lead.otherContacts.length === 0);

  return (
    <div className="fixed inset-0 z-[999999] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative h-full w-full max-w-[500px] bg-[var(--sidebar-bg)] border-l border-white/5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
        
        {/* Compact Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white font-black text-[10px]">E</div>
             <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Enrollment Control</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lead Identity Bar */}
        {lead && (
          <div className="px-6 py-3 bg-blue-500/5 border-b border-blue-500/10 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-3">
                <Target className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">{lead.firstName} {lead.lastName}</span>
             </div>
             <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Status: Ready</span>
          </div>
        )}

        {/* Tactical Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {leadLoading ? (
            <div className="h-full flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
          ) : lead && (
            <div className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Command</h3>
                      <div className="flex gap-2">
                         <button onClick={() => setIsDialPadOpen(!isDialPadOpen)} className={`p-2 rounded border transition-all ${isDialPadOpen ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}><Hash className="w-4 h-4" /></button>
                         <button onClick={() => setIsAddingRelative(true)} className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] font-black uppercase tracking-widest"><UserPlus className="w-3 h-3" /> Add Contact</button>
                      </div>
                   </div>

                   {/* Active HUD */}
                   {activeCall && (
                     <div className="bg-blue-600 rounded-lg p-3 flex items-center justify-between shadow-lg animate-pulse-primary">
                        <div className="flex items-center gap-3">
                           <PhoneForwarded className="w-4 h-4 text-white" />
                           <div>
                              <p className="text-white font-black text-[10px] uppercase leading-none">{activeCall.status}</p>
                              <p className="text-blue-100 text-[8px] font-bold mt-1 uppercase tracking-widest">{activeCall.phone}</p>
                           </div>
                        </div>
                        <button onClick={() => setActiveCall(null)} className="p-2 rounded bg-red-500 text-white"><PhoneOff className="w-4 h-4" /></button>
                     </div>
                   )}

                   {/* Dialer */}
                   {isDialPadOpen && (
                     <div className="bg-black/40 border border-blue-500/20 rounded-lg p-3 animate-in slide-in-from-top-2">
                        <div className="flex gap-3">
                           <input placeholder="Dial Number..." className="flex-1 bg-transparent text-lg font-black text-white outline-none" value={dialedNumber} onChange={e => setDialedNumber(e.target.value)} autoFocus />
                           <button onClick={() => handleCall({phone: dialedNumber})} className="p-3 rounded bg-emerald-500 text-white"><PhoneCall className="w-4 h-4" /></button>
                        </div>
                     </div>
                   )}

                   {/* Grid */}
                   <div className="space-y-2">
                      {hasNoContacts && !isAddingRelative && (
                        <div className="p-6 border-2 border-dashed border-rose-500/20 rounded-lg bg-rose-500/5 text-center space-y-3">
                           <PhoneOff className="w-6 h-6 text-rose-500 mx-auto" />
                           <p className="text-[9px] font-black text-white uppercase tracking-widest">No Contacts Found</p>
                           <button onClick={() => setIsAddingRelative(true)} className="w-full py-2 rounded bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest">Add Primary Contact</button>
                        </div>
                      )}

                      {/* Patient */}
                      {(lead.primaryPhone || tempNumbers['patient'] || !hasNoContacts) && (
                        <div className={`p-3 rounded-lg border flex items-center justify-between ${lead.primaryPhone || tempNumbers['patient'] ? 'bg-blue-500/5 border-blue-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded flex items-center justify-center text-white ${lead.primaryPhone || tempNumbers['patient'] ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'}`}><User className="w-4 h-4" /></div>
                              <div className="space-y-0.5">
                                 <p className="text-white font-black text-[10px] uppercase leading-none">{lead.firstName}</p>
                                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{lead.primaryPhone || tempNumbers['patient'] || "No Phone"}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              {!lead.primaryPhone && !tempNumbers['patient'] && <input placeholder="Add Phone..." className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[9px] text-white outline-none" value={tempNumbers['patient'] || ""} onChange={e => handleTempNumberChange('patient', e.target.value)} />}
                              <button onClick={() => handleCall({phone: lead.primaryPhone || tempNumbers['patient']})} disabled={!(lead.primaryPhone || tempNumbers['patient'])} className={`p-2.5 rounded transition-all ${lead.primaryPhone || tempNumbers['patient'] ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-800 text-slate-600'}`}><PhoneCall className="w-3.5 h-3.5" /></button>
                           </div>
                        </div>
                      )}

                      {/* Relatives */}
                      {[...(lead.otherContacts || []), ...addedRelatives].map((contact: any) => (
                        <div key={contact.outreachContactId} className="p-3 rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-slate-500"><Users className="w-4 h-4" /></div>
                              <div className="space-y-0.5">
                                 <p className="text-white font-black text-[10px] uppercase leading-none">{contact.firstName}</p>
                                 <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{RELATIONSHIP_LABELS[contact.relationship] || contact.relationship} // {contact.phoneNumber || tempNumbers[contact.outreachContactId] || "No Phone"}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              {!contact.phoneNumber && !tempNumbers[contact.outreachContactId] && <input placeholder="Add Phone..." className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[9px] text-white outline-none" value={tempNumbers[contact.outreachContactId] || ""} onChange={e => handleTempNumberChange(contact.outreachContactId, e.target.value)} />}
                              <button onClick={() => handleCall({phone: contact.phoneNumber || tempNumbers[contact.outreachContactId]})} disabled={!(contact.phoneNumber || tempNumbers[contact.outreachContactId])} className={`p-2.5 rounded transition-all ${contact.phoneNumber || tempNumbers[contact.outreachContactId] ? 'bg-white/10 text-white hover:bg-blue-500' : 'bg-slate-900 text-slate-700'}`}><PhoneCall className="w-3.5 h-3.5" /></button>
                           </div>
                        </div>
                      ))}

                      {/* Form */}
                      {isAddingRelative && (
                        <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-3">
                           <div className="grid grid-cols-2 gap-2">
                              <input placeholder="First Name" className="bg-black/40 border border-white/10 rounded px-3 py-2 text-[10px] text-white outline-none" value={newRelativeForm.firstName} onChange={e => setNewRelativeForm({...newRelativeForm, firstName: e.target.value})} />
                              <input placeholder="Phone Number" className="bg-black/40 border border-white/10 rounded px-3 py-2 text-[10px] text-white outline-none" value={newRelativeForm.phoneNumber} onChange={e => setNewRelativeForm({...newRelativeForm, phoneNumber: e.target.value})} />
                           </div>
                           <button onClick={handleAddRelative} className="w-full bg-blue-500 py-2 rounded text-white text-[9px] font-black uppercase tracking-widest">Add to Contact Queue</button>
                        </div>
                      )}
                   </div>

                   <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setCurrentStep(2)} className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-left hover:bg-emerald-500/20 transition-all">
                         <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-2" />
                         <p className="text-[10px] font-black text-white uppercase">Contact Success</p>
                      </button>
                      <button className="p-4 rounded-lg bg-white/5 border border-white/10 text-left opacity-50">
                         <PhoneOff className="w-4 h-4 text-slate-500 mb-2" />
                         <p className="text-[10px] font-black text-white uppercase">No Answer</p>
                      </button>
                   </div>
                </div>
              )}

              {currentStep > 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   {currentStep === 2 && (
                     <div className="grid grid-cols-1 gap-2">
                        {["EAGER", "COOPERATIVE", "HESITANT", "RESISTANT", "REFUSED"].map(v => (
                           <button key={v} onClick={() => { setDisposition(v); setCurrentStep(3); }} className={`p-4 rounded-lg border text-left flex items-center justify-between ${disposition === v ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                              <span className="text-[9px] font-black uppercase tracking-widest">{v}</span>
                              <ChevronRight className="w-3 h-3" />
                           </button>
                        ))}
                     </div>
                   )}
                   {currentStep === 3 && (
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Comm</p>
                              {["VERBAL", "APHASIC"].map(v => <button key={v} onClick={() => setCommunicationStatus(v)} className={`w-full p-2 rounded border text-[8px] font-black tracking-widest transition-all ${communicationStatus === v ? 'bg-blue-500/20 border-blue-500/50 text-blue-500' : 'bg-white/5 border-white/10 text-slate-500'}`}>{v}</button>)}
                           </div>
                           <div className="space-y-2">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tech</p>
                              {["SMARTPHONE", "NONE"].map(v => <button key={v} onClick={() => setTechAccess(v)} className={`w-full p-2 rounded border text-[8px] font-black tracking-widest transition-all ${techAccess === v ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-white/5 border-white/10 text-slate-500'}`}>{v}</button>)}
                           </div>
                        </div>
                        <textarea value={barriersToCare} onChange={e => setBarriersToCare(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-[9px] font-black text-white outline-none min-h-[80px]" placeholder="BARRIERS..." />
                        <button onClick={() => setCurrentStep(4)} className="w-full bg-blue-500 py-3 rounded text-white text-[10px] font-black uppercase tracking-widest">Next</button>
                     </div>
                   )}
                   {currentStep === 4 && (
                     <div className="space-y-6 text-center">
                        <Calendar className="w-10 h-10 text-blue-500 mx-auto" />
                        <input type="datetime-local" value={orientationDate} onChange={e => setOrientationDate(e.target.value)} className="bg-black/40 border border-white/10 rounded py-2 px-4 text-[10px] text-white font-black outline-none" />
                        <button onClick={() => setCurrentStep(5)} className="w-full bg-blue-500 py-3 rounded text-white text-[10px] font-black uppercase tracking-widest">Schedule</button>
                     </div>
                   )}
                   {currentStep === 5 && (
                     <div className="space-y-4">
                        <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded py-3 px-4 text-[9px] font-black text-white uppercase outline-none">
                           <option value="">PAYOR...</option>
                           {plans.map((p: any) => <option key={p.healthPlanId} value={p.healthPlanId}>{p.name}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                           {["HOME", "FACILITY", "VIRTUAL"].map(v => <button key={v} onClick={() => { setSelectedModality(v); setCurrentStep(6); }} className="p-3 rounded border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5">{v}</button>)}
                        </div>
                     </div>
                   )}
                   {currentStep === 6 && (
                     <div className="text-center space-y-6 animate-in zoom-in">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto"><ClipboardCheck className="w-6 h-6" /></div>
                        <button onClick={handleFinalize} disabled={finalizing || !selectedPlan} className="w-full bg-blue-500 py-4 rounded text-white font-black text-[10px] uppercase tracking-widest shadow-lg">{finalizing ? "GENERATING..." : "FINALIZE"}</button>
                     </div>
                   )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Action Footer */}
        <div className="h-14 px-6 border-t border-white/5 flex items-center justify-between bg-black/20 shrink-0">
          {currentStep > 1 && (
            <button onClick={() => setCurrentStep(prev => prev - 1)} className="flex items-center gap-2 text-slate-500 hover:text-white transition-all">
              <ChevronLeft className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Back</span>
            </button>
          )}
          <div className="flex-1" />
          <div className="flex gap-1 opacity-20">
             {[1,2,3,4,5,6].map(i => <div key={i} className={`w-1 h-1 rounded-full ${currentStep === i ? 'bg-blue-500' : 'bg-white'}`} />)}
          </div>
        </div>

      </div>
    </div>
  );
}
