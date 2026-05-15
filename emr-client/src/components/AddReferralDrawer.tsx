"use client";

import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { 
  X, UserPlus, Save, Phone, Mail, FileText, 
  MapPin, ClipboardList, Activity, Navigation,
  Search, Shield, CheckCircle, ChevronRight
} from "lucide-react";
import HalcyonPortal from "./Portal";
import { PermissionGate } from "./PermissionGate";

const CREATE_OUTREACH = gql`
  mutation CreateOutreach($input: CreateOutreachCommandInput!) {
    createOutreach(command: $input)
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddReferralDrawer({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    referralSource: "Hospital Discharge",
    primaryPhone: "",
    primaryEmail: "",
    street: "",
    city: "Metro Manila",
    state: "NCR",
    postalCode: "",
    notes: "",
    priority: "Routine",
    diagnosis: ""
  });

  const [createOutreach, { loading }] = useMutation(CREATE_OUTREACH, {
    onCompleted: () => {
      onSuccess();
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOutreach({
      variables: {
        input: {
          ...form,
          notes: `[Priority: ${form.priority}] ${form.diagnosis ? `[Diagnosis: ${form.diagnosis}] ` : ''}${form.notes}`
        }
      }
    });
  };

  if (!open) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-500" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-[550px] bg-[var(--sidebar-bg)] shadow-[-30px_0_80px_rgba(0,0,0,0.5)] 
          flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-l border-white/5
          ${open ? "translate-x-0" : "translate-x-full"}`}>

          {/* Clinical Header */}
          <div className="h-20 w-full flex items-center justify-between px-8 bg-gradient-to-r from-teal-500/10 to-transparent border-b border-white/5 shrink-0">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shadow-lg shadow-teal-500/10">
                <UserPlus className="w-6 h-6 text-teal-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">New Patient Referral</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-black text-teal-500/50 uppercase tracking-[0.2em]">Intake & Outreach Management</span>
                  <div className="w-1 h-1 rounded-full bg-teal-500/30" />
                  <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Health Standards v2.4</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-[var(--text-muted)] hover:text-rose-500 group">
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {/* Section: Referral Details */}
            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">Referral Details</h3>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Clinical Priority</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Routine', 'Urgent', 'Stat'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm({...form, priority: p})}
                          className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all
                            ${form.priority === p ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:border-white/10'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Referral Channel</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-xs font-black text-[var(--text-primary)] outline-none focus:border-teal-500/30 transition-all appearance-none cursor-pointer"
                        value={form.referralSource}
                        onChange={e => setForm({...form, referralSource: e.target.value})}
                      >
                        <option value="Hospital Discharge" className="bg-[#1a1c1e] text-white">Hospital Discharge</option>
                        <option value="Primary Care Physician" className="bg-[#1a1c1e] text-white">Primary Care Physician</option>
                        <option value="Self-Referral" className="bg-[#1a1c1e] text-white">Self-Referral</option>
                        <option value="Community Agency" className="bg-[#1a1c1e] text-white">Community Agency</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                        <ChevronRight className="w-3 h-3 rotate-90" />
                      </div>
                    </div>
                  </div>
              </div>
            </section>

            {/* Section: Patient Identity */}
            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-teal-500" />
                </div>
                <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">Patient Identity</h3>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">First Name</label>
                    <input 
                      required
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 px-5 text-sm font-black text-[var(--text-primary)] placeholder:text-white/10 focus:outline-none focus:border-teal-500/30 transition-all shadow-inner"
                      value={form.firstName}
                      onChange={e => setForm({...form, firstName: e.target.value})}
                      placeholder="GIVEN NAME"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Last Name</label>
                    <input 
                      required
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 px-5 text-sm font-black text-[var(--text-primary)] placeholder:text-white/10 focus:outline-none focus:border-teal-500/30 transition-all shadow-inner"
                      value={form.lastName}
                      onChange={e => setForm({...form, lastName: e.target.value})}
                      placeholder="SURNAME"
                    />
                  </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Primary Diagnosis / Reason</label>
                <input 
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 px-5 text-sm font-black text-[var(--text-primary)] placeholder:text-white/10 focus:outline-none focus:border-teal-500/30 transition-all shadow-inner"
                  value={form.diagnosis}
                  onChange={e => setForm({...form, diagnosis: e.target.value})}
                  placeholder="E.G. ADVANCED HEART FAILURE, STROKE FOLLOW-UP"
                />
              </div>
            </section>

            {/* Section: Contact Information */}
            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">Contact Information</h3>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Primary Phone</label>
                    <input 
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 px-5 text-sm font-black text-[var(--text-primary)] focus:outline-none focus:border-sky-500/30 transition-all shadow-inner"
                      value={form.primaryPhone}
                      onChange={e => setForm({...form, primaryPhone: e.target.value})}
                      placeholder="+63 XXX XXX XXXX"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email"
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 px-5 text-sm font-black text-[var(--text-primary)] focus:outline-none focus:border-sky-500/30 transition-all shadow-inner"
                      value={form.primaryEmail}
                      onChange={e => setForm({...form, primaryEmail: e.target.value})}
                      placeholder="PATIENT@EMAIL.COM"
                    />
                 </div>
              </div>
            </section>

            {/* Section: Clinical Observations */}
            <section className="space-y-5 pb-10">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">Clinical Observations</h3>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <textarea 
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-xs font-medium text-[var(--text-primary)] placeholder:text-white/10 h-32 focus:outline-none focus:border-amber-500/30 transition-all resize-none scrollbar-hide shadow-inner"
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Append clinical observations, home environment risks, or specific instructions..."
              />
            </section>
          </form>

          {/* Submission Area */}
          <div className="p-8 bg-black/20 backdrop-blur-2xl border-t border-white/5 mt-auto flex flex-col gap-4">
            <PermissionGate permission="clinical:chart">
              <button 
                type="submit" 
                onClick={handleSubmit}
                disabled={loading}
                className="group w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:cursor-not-allowed
                          text-black font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Register Patient for Outreach</span>
                  </>
                )}
              </button>
            </PermissionGate>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1 h-1 rounded-full bg-teal-500/50" />
              <p className="text-[8px] font-black text-[var(--text-muted)] text-center uppercase tracking-[0.3em] opacity-60">
                Patient privacy and clinical standards applied
              </p>
            </div>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}

