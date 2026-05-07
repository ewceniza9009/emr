"use client";

import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { 
  X, UserPlus, Save, Phone, Mail, FileText, 
  MapPin, ClipboardList, Activity, Navigation,
  Search, Shield, CheckCircle, ChevronRight
} from "lucide-react";
import HalcyonPortal from "./Portal";

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
    notes: ""
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
        input: form
      }
    });
  };

  if (!open) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-black/5 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-[500px] bg-[var(--sidebar-bg)] shadow-[-20px_0_60px_rgba(0,0,0,0.3)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${open ? "translate-x-0" : "translate-x-full"}`}>

          {/* Clean Header */}
          <div className="h-16 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-[var(--primary)] rounded-full" />
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Referral Intake</h2>
                <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest mt-1">Patient Outreach // Clinical Enrollment</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[var(--input-bg)] rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            {/* Section 01: Core Identification */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Core Identification</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">First Name</label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                      <input 
                        required
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)] transition-all"
                        value={form.firstName}
                        onChange={e => setForm({...form, firstName: e.target.value})}
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Last Name</label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                      <input 
                        required
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)] transition-all"
                        value={form.lastName}
                        onChange={e => setForm({...form, lastName: e.target.value})}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
              </div>

              <div className="space-y-2">
                 <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Referral Channel</label>
                 <div className="relative group">
                   <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                   <select 
                     className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] appearance-none focus:outline-none focus:border-[var(--primary)] transition-all"
                     value={form.referralSource}
                     onChange={e => setForm({...form, referralSource: e.target.value})}
                   >
                     <option value="Hospital Discharge" className="bg-[var(--sidebar-bg)] text-[var(--text-primary)]">Hospital Discharge</option>
                     <option value="Primary Care Physician" className="bg-[var(--sidebar-bg)] text-[var(--text-primary)]">Primary Care Physician</option>
                     <option value="Self-Referral" className="bg-[var(--sidebar-bg)] text-[var(--text-primary)]">Self-Referral</option>
                     <option value="Community Agency" className="bg-[var(--sidebar-bg)] text-[var(--text-primary)]">Community Agency</option>
                     <option value="Other" className="bg-[var(--sidebar-bg)] text-[var(--text-primary)]">Other</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                     <ChevronRight className="w-4 h-4 rotate-90" />
                   </div>
                 </div>
              </div>
            </section>

            {/* Section 02: Contact Information */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Contact Information</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Primary Phone</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                      <input 
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)] transition-all"
                        value={form.primaryPhone}
                        onChange={e => setForm({...form, primaryPhone: e.target.value})}
                        placeholder="+63 9XX XXXX XXX"
                      />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                      <input 
                        type="email"
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)] transition-all"
                        value={form.primaryEmail}
                        onChange={e => setForm({...form, primaryEmail: e.target.value})}
                        placeholder="patient@email.com"
                      />
                    </div>
                 </div>
              </div>
            </section>

            {/* Section 03: Deployment Address */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Deployment Address</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="space-y-2">
                 <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Street Address</label>
                 <div className="relative group">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                   <input 
                     className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)] transition-all"
                     value={form.street}
                     onChange={e => setForm({...form, street: e.target.value})}
                     placeholder="123 Street Name"
                   />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">City</label>
                    <input 
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all"
                      value={form.city}
                      onChange={e => setForm({...form, city: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Region</label>
                    <input 
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all"
                      value={form.state}
                      onChange={e => setForm({...form, state: e.target.value})}
                    />
                 </div>
              </div>
            </section>

            {/* Section 04: Internal Notes */}
            <section className="space-y-6 pb-10">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Clinical Notes</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="space-y-2">
                 <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Initial Context</label>
                 <div className="relative group">
                   <ClipboardList className="absolute left-4 top-4 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                   <textarea 
                     className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-4 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 h-32 focus:outline-none focus:border-[var(--primary)] transition-all resize-none scrollbar-hide"
                     value={form.notes}
                     onChange={e => setForm({...form, notes: e.target.value})}
                     placeholder="Enter any additional patient context..."
                   />
                 </div>
              </div>
            </section>
          </form>

          {/* Action Zone */}
          <div className="p-8 bg-[var(--sidebar-bg)] border-t border-[var(--card-border)] mt-auto flex flex-col gap-4">
            <button 
              type="submit" 
              onClick={handleSubmit}
              disabled={loading}
              className="group w-full py-3.5 rounded-xl bg-[var(--primary)] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed
                        text-white font-bold text-sm transition-all shadow-lg shadow-[var(--primary-glow)] flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>{loading ? "Initializing..." : "Complete Intake"}</span>
                </>
              )}
            </button>
            <p className="text-[10px] font-bold text-[var(--text-muted)] text-center uppercase tracking-[0.2em]">
              Authorized Clinical Personnel Only
            </p>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
