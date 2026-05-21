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
import dynamic from "next/dynamic";
import { AddressData } from "@/components/EnrollmentDrawer/components/AddressMapModal";

const AddressMapModal = dynamic(
  () => import("@/components/EnrollmentDrawer/components/AddressMapModal"),
  { ssr: false }
);

const CREATE_OUTREACH = gql`
  mutation CreateOutreach($input: CreateOutreachCommandInput!) {
    createOutreach(input: $input)
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const formatPhonePH = (val: string) => {
  const clean = val.replace(/\D/g, "");
  let raw = clean;
  if (clean.startsWith("63")) {
    raw = clean.slice(2);
  }
  raw = raw.slice(0, 10);
  if (raw.length === 0) return "";
  let formatted = "+63";
  if (raw.length > 0) {
    formatted += " " + raw.slice(0, 3);
  }
  if (raw.length > 3) {
    formatted += " " + raw.slice(3, 6);
  }
  if (raw.length > 6) {
    formatted += " " + raw.slice(6, 10);
  }
  return formatted;
};

const sanitizeEmail = (val: string) => {
  return val.toLowerCase().replace(/[^a-z0-9@._\-+]/g, "");
};

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

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createOutreach, { loading }] = useMutation(CREATE_OUTREACH, {
    onCompleted: () => {
      onSuccess();
      onClose();
    }
  });

  const currentAddressData: AddressData = {
    street: form.street,
    city: form.city,
    state: form.state,
    postalCode: form.postalCode,
    region: "",
    country: "Philippines",
    latitude: null,
    longitude: null
  };

  const handleSaveAddress = (address: AddressData) => {
    setForm(prev => ({
      ...prev,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode
    }));
    setIsEditingAddress(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (/\d/.test(form.firstName)) {
      newErrors.firstName = "First name cannot contain numbers";
    }
    
    if (!form.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (/\d/.test(form.lastName)) {
      newErrors.lastName = "Last name cannot contain numbers";
    }
    
    if (!form.primaryPhone) {
      newErrors.primaryPhone = "Primary phone number is required";
    } else {
      const clean = form.primaryPhone.replace(/\D/g, "");
      // 63 prefix + 10 digits = 12 characters
      if (clean.length < 12) {
        newErrors.primaryPhone = "Please enter a valid 10-digit phone number";
      }
    }
    
    if (form.primaryEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(form.primaryEmail)) {
        newErrors.primaryEmail = "Please enter a valid email address";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const { priority, diagnosis, ...restOfForm } = form;
    createOutreach({
      variables: {
        input: {
          ...restOfForm,
          notes: `[Priority: ${priority}] ${diagnosis ? `[Diagnosis: ${diagnosis}] ` : ''}${form.notes}`
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
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-[var(--text-muted)] hover:text-rose-500 group">
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
            {/* Section: Referral Details */}
            <section className="space-y-4">
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
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-black text-[var(--text-primary)] outline-none focus:border-teal-500/30 transition-all appearance-none cursor-pointer"
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
            <section className="space-y-4">
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
                      className={`w-full bg-white/5 border rounded-xl py-2.5 px-4 text-xs font-black text-[var(--text-primary)] placeholder:text-white/10 focus:outline-none transition-all shadow-inner
                        ${errors.firstName ? 'border-rose-500/50 focus:border-rose-500/80' : 'border-white/5 focus:border-teal-500/30'}`}
                      value={form.firstName}
                      onChange={e => {
                        setForm({...form, firstName: e.target.value});
                        if (errors.firstName) setErrors({...errors, firstName: ""});
                      }}
                      placeholder="GIVEN NAME"
                    />
                    {errors.firstName && (
                      <p className="text-[9px] font-bold text-rose-500/80 ml-1 mt-1 uppercase tracking-wider animate-pulse">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Last Name</label>
                    <input 
                      required
                      className={`w-full bg-white/5 border rounded-xl py-2.5 px-4 text-xs font-black text-[var(--text-primary)] placeholder:text-white/10 focus:outline-none transition-all shadow-inner
                        ${errors.lastName ? 'border-rose-500/50 focus:border-rose-500/80' : 'border-white/5 focus:border-teal-500/30'}`}
                      value={form.lastName}
                      onChange={e => {
                        setForm({...form, lastName: e.target.value});
                        if (errors.lastName) setErrors({...errors, lastName: ""});
                      }}
                      placeholder="SURNAME"
                    />
                    {errors.lastName && (
                      <p className="text-[9px] font-bold text-rose-500/80 ml-1 mt-1 uppercase tracking-wider animate-pulse">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Primary Diagnosis / Reason</label>
                <input 
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-black text-[var(--text-primary)] placeholder:text-white/10 focus:outline-none focus:border-teal-500/30 transition-all shadow-inner"
                  value={form.diagnosis}
                  onChange={e => setForm({...form, diagnosis: e.target.value})}
                  placeholder="E.G. ADVANCED HEART FAILURE, STROKE FOLLOW-UP"
                />
              </div>
            </section>

            {/* Section: Contact Information */}
            <section className="space-y-4">
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
                      className={`w-full bg-white/5 border rounded-xl py-2.5 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none transition-all shadow-inner
                        ${errors.primaryPhone ? 'border-rose-500/50 focus:border-rose-500/80' : 'border-white/5 focus:border-sky-500/30'}`}
                      value={form.primaryPhone}
                      onChange={e => {
                        setForm({...form, primaryPhone: formatPhonePH(e.target.value)});
                        if (errors.primaryPhone) setErrors({...errors, primaryPhone: ""});
                      }}
                      placeholder="+63 XXX XXX XXXX"
                    />
                    {errors.primaryPhone && (
                      <p className="text-[9px] font-bold text-rose-500/80 ml-1 mt-1 uppercase tracking-wider animate-pulse">
                        {errors.primaryPhone}
                      </p>
                    )}
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email"
                      className={`w-full bg-white/5 border rounded-xl py-2.5 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none transition-all shadow-inner
                        ${errors.primaryEmail ? 'border-rose-500/50 focus:border-rose-500/80' : 'border-white/5 focus:border-sky-500/30'}`}
                      value={form.primaryEmail}
                      onChange={e => {
                        setForm({...form, primaryEmail: sanitizeEmail(e.target.value)});
                        if (errors.primaryEmail) setErrors({...errors, primaryEmail: ""});
                      }}
                      placeholder="PATIENT@EMAIL.COM"
                    />
                    {errors.primaryEmail && (
                      <p className="text-[9px] font-bold text-rose-500/80 ml-1 mt-1 uppercase tracking-wider animate-pulse">
                        {errors.primaryEmail}
                      </p>
                    )}
                 </div>
              </div>
            </section>

            {/* Section: Service Address */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 text-teal-500" />
                  </div>
                  <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">Service Address</h3>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  <MapPin className="w-3 h-3" />
                  Pin on Map
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Street Address</label>
                  <input 
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-black text-[var(--text-primary)] placeholder:text-white/10 focus:outline-none focus:border-teal-500/30 transition-all shadow-inner"
                    value={form.street}
                    onChange={e => setForm({...form, street: e.target.value})}
                    placeholder="HOUSE NO., STREET NAME, BARANGAY/SUBDIVISION"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">City</label>
                    <input 
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-black text-[var(--text-primary)] placeholder:text-white/10 focus:outline-none focus:border-teal-500/30 transition-all shadow-inner"
                      value={form.city}
                      onChange={e => setForm({...form, city: e.target.value})}
                      placeholder="CITY"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">State</label>
                    <input 
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-black text-[var(--text-primary)] placeholder:text-white/10 focus:outline-none focus:border-teal-500/30 transition-all shadow-inner"
                      value={form.state}
                      onChange={e => setForm({...form, state: e.target.value})}
                      placeholder="STATE/PROVINCE"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Zip Code</label>
                    <input 
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-black text-[var(--text-primary)] placeholder:text-white/10 focus:outline-none focus:border-teal-500/30 transition-all shadow-inner"
                      value={form.postalCode}
                      onChange={e => setForm({...form, postalCode: e.target.value})}
                      placeholder="ZIP CODE"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Clinical Observations */}
            <section className="space-y-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em]">Clinical Observations</h3>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <textarea 
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs font-medium text-[var(--text-primary)] placeholder:text-white/10 h-24 focus:outline-none focus:border-amber-500/30 transition-all resize-none scrollbar-hide shadow-inner"
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Append clinical observations, home environment risks, or specific instructions..."
              />
            </section>
          </form>

          {/* Submission Area */}
          <div className="p-5 bg-[var(--sidebar-bg)]/80 backdrop-blur-3xl border-t border-white/[0.08] mt-auto flex flex-col relative overflow-hidden shrink-0">
            {/* Ambient Lighting & Accent Ray */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-teal-500/10 blur-[50px] rounded-full pointer-events-none" />

            <PermissionGate permission="clinical:chart">
              <button 
                type="submit" 
                onClick={handleSubmit}
                disabled={loading}
                className="group relative w-full py-3.5 rounded-xl overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed
                          text-slate-950 font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-300 shadow-[0_8px_30px_rgba(20,184,166,0.25)] hover:shadow-[0_8px_40px_rgba(20,184,166,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Activity className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <CheckCircle className="w-4.5 h-4.5 text-slate-950 group-hover:scale-110 transition-transform duration-300" />
                    <span>Register Patient for Outreach</span>
                  </>
                )}
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>
      <AddressMapModal
        isOpen={isEditingAddress}
        onClose={() => setIsEditingAddress(false)}
        address={currentAddressData}
        onSave={handleSaveAddress}
      />
    </HalcyonPortal>
  );
}

