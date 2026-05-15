"use client";

import { useState } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import {
  X, UserPlus, Save, MapPin, Building2, CreditCard,
  Calendar, Activity, Shield, Search, User, Target,
  CheckCircle, ChevronRight
} from "lucide-react";
import HalcyonPortal from "./Portal";
import { PermissionGate } from "./PermissionGate";

const GET_METADATA = gql`
  query GetMetadata {
    healthPlans {
      healthPlanId
      name
    }
    facilities {
      facilityId
      name
    }
  }
`;

const CREATE_PATIENT = gql`
  mutation CreatePatient($input: CreatePatientCommandInput!) {
    createPatient(input: $input)
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPatientDrawer({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    mrn: "",
    firstName: "",
    lastName: "",
    dob: "",
    biologicalSex: "Male",
    civilStatus: "Single",
    religion: "None",
    occupation: "",
    placeOfBirth: "",
    nationality: "Filipino",
    language: "English",
    philhealthNumber: "",
    healthPlanId: "",
    facilityId: "",
    street: "",
    city: "Metro Manila",
    state: "NCR",
    postalCode: ""
  });

  const { data: metadata } = useQuery(GET_METADATA);

  const [createPatient, { loading, error: mutationError }] = useMutation(CREATE_PATIENT, {
    onCompleted: () => {
      onSuccess();
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPatient({
      variables: {
        input: {
          ...form,
          dob: new Date(form.dob).toISOString()
        }
      }
    }).catch(e => console.error("Mutation failed", e));
  };

  if (!open) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

        <div className={`relative h-full w-full max-w-[500px] bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${open ? "translate-x-0" : "translate-x-full"}`}>

          {/* Industrial Header */}
          <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0 backdrop-blur-md">
            <div className="flex items-center gap-6">
              <div className="w-1.5 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_20px_var(--primary-glow)]" />
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">Patient Registration</h2>
                <span className="text-[10px] font-black text-[var(--primary)] tracking-[0.2em] mt-1 uppercase">Clinical Data Entry</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 rounded-full border border-[var(--primary)]/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">Record Link Active</span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--input-bg)] rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {mutationError && (
            <div className="mx-10 mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-black text-[10px] uppercase tracking-widest mb-1">Registration Blocked</p>
                <p className="text-red-300/70 text-[11px] font-medium leading-relaxed">
                  {mutationError.message || "An unexpected error occurred. Check clinical server logs."}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
            {/* Section 01: Master Record Identity */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">01</span>
                <h3 className="text-xs font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Master Record Identity</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Medical Record Number (MRN)</label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                  <input
                    required
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                    value={form.mrn}
                    onChange={e => setForm({ ...form, mrn: e.target.value })}
                    placeholder="E.G. MRN-123456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Legal First Name</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <input
                      required
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-wider"
                      value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                      placeholder="FIRST NAME"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Legal Last Name</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <input
                      required
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-wider"
                      value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                      placeholder="LAST NAME"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Date of Birth</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <input
                      required
                      type="date"
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                      value={form.dob}
                      onChange={e => setForm({ ...form, dob: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Biological Sex</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <select
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] appearance-none focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                      value={form.biologicalSex}
                      onChange={e => setForm({ ...form, biologicalSex: e.target.value })}
                    >
                      <option value="Male" className="bg-[var(--sidebar-bg)]">Male</option>
                      <option value="Female" className="bg-[var(--sidebar-bg)]">Female</option>
                      <option value="Other" className="bg-[var(--sidebar-bg)]">Other</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 02: Social & Cultural Demographics */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">02</span>
                <h3 className="text-xs font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Social & Cultural</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Civil Status</label>
                  <select
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-bold text-[var(--text-primary)] appearance-none focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                    value={form.civilStatus}
                    onChange={e => setForm({ ...form, civilStatus: e.target.value })}
                  >
                    <option value="Single" className="bg-[var(--sidebar-bg)]">Single</option>
                    <option value="Married" className="bg-[var(--sidebar-bg)]">Married</option>
                    <option value="Widowed" className="bg-[var(--sidebar-bg)]">Widowed</option>
                    <option value="Divorced" className="bg-[var(--sidebar-bg)]">Divorced</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Religion</label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                    value={form.religion}
                    onChange={e => setForm({ ...form, religion: e.target.value })}
                    placeholder="RELIGION"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Nationality</label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                    value={form.nationality}
                    onChange={e => setForm({ ...form, nationality: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Primary Language</label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                    value={form.language}
                    onChange={e => setForm({ ...form, language: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Occupation</label>
                <input
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                  value={form.occupation}
                  onChange={e => setForm({ ...form, occupation: e.target.value })}
                  placeholder="CURRENT OR FORMER OCCUPATION"
                />
              </div>
            </section>

            {/* Section 03: Insurance & Governance */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">03</span>
                <h3 className="text-xs font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Insurance & Governance</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Philhealth Identification</label>
                <div className="relative group">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                    value={form.philhealthNumber}
                    onChange={e => setForm({ ...form, philhealthNumber: e.target.value })}
                    placeholder="XX-XXXXXXXXX-X"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Health Plan Network</label>
                  <div className="relative group">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <select
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] appearance-none focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                      value={form.healthPlanId}
                      onChange={e => setForm({ ...form, healthPlanId: e.target.value })}
                    >
                      <option value="" className="bg-[var(--sidebar-bg)]">SELECT PLAN...</option>
                      {metadata?.healthPlans.map((p: any) => (
                        <option key={p.healthPlanId} value={p.healthPlanId} className="bg-[var(--sidebar-bg)]">{p.name.toUpperCase()}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Primary Care Facility</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <select
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] appearance-none focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                      value={form.facilityId}
                      onChange={e => setForm({ ...form, facilityId: e.target.value })}
                    >
                      <option value="" className="bg-[var(--sidebar-bg)]">SELECT FACILITY...</option>
                      {metadata?.facilities.map((f: any) => (
                        <option key={f.facilityId} value={f.facilityId} className="bg-[var(--sidebar-bg)]">{f.name.toUpperCase()}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 04: Geospatial Placement */}
            <section className="space-y-6 pb-10">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-[var(--primary)] bg-[var(--primary)]/10 w-8 h-8 rounded-lg flex items-center justify-center">04</span>
                <h3 className="text-xs font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Geospatial Placement</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Deployment Address</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                  <input
                    required
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-wider"
                    value={form.street}
                    onChange={e => setForm({ ...form, street: e.target.value })}
                    placeholder="E.G. 123 PALLIATIVE ST"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">City Hub</label>
                  <input
                    required
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Region Code</label>
                  <input
                    required
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Postal Identification</label>
                <input
                  required
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest"
                  value={form.postalCode}
                  onChange={e => setForm({ ...form, postalCode: e.target.value })}
                />
              </div>
            </section>
          </form>

          {/* Action Zone */}
          <div className="p-8 bg-[var(--sidebar-bg)] border-t border-[var(--card-border)] mt-auto flex flex-col gap-4">
            <PermissionGate permission="patients:enrollment">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="group w-full py-4 rounded-xl bg-[var(--primary)] hover:opacity-90 disabled:opacity-10 disabled:cursor-not-allowed
                          text-white font-black text-sm uppercase tracking-[0.4em] transition-all shadow-[0_10px_30px_var(--primary-glow)] flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{loading ? "INITIALIZING..." : "COMMIT REGISTRATION"}</span>
                  </>
                )}
              </button>
            </PermissionGate>
            <p className="text-[9px] font-bold text-[var(--text-muted)] text-center uppercase tracking-widest opacity-40">
              Authorized Clinical Enrollment Only
            </p>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}

