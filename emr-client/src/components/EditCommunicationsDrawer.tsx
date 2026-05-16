"use client";

import { useState, useEffect } from "react";
import { useMutation, gql } from "@apollo/client";
import {
  X, Save, Phone, Mail, Plus, Trash2, ShieldCheck, ShieldAlert
} from "lucide-react";
import HalcyonPortal from "./Portal";

const UPDATE_COMMUNICATIONS = gql`
  mutation UpdatePatient($command: UpdatePatientCommandInput!) {
    updatePatient(command: $command)
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient: any;
}

export default function EditCommunicationsDrawer({ open, onClose, onSuccess, patient }: Props) {
  const [phones, setPhones] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);

  useEffect(() => {
    if (open && patient) {
      setPhones(patient.phones?.map((p: any) => ({ ...p })) || []);
      setEmails(patient.emails?.map((e: any) => ({ ...e })) || []);
    }
  }, [open, patient]);

  const [updateCommunications, { loading, error }] = useMutation(UPDATE_COMMUNICATIONS, {
    onCompleted: () => {
      onSuccess();
      onClose();
    }
  });

  const handleAddPhone = () => {
    setPhones([...phones, { phoneNumber: "", type: "Mobile", isPrimary: phones.length === 0 }]);
  };

  const handleAddEmail = () => {
    setEmails([...emails, { emailAddress: "", type: "Home", isPrimary: emails.length === 0 }]);
  };

  const handleRemovePhone = (idx: number) => {
    const newPhones = phones.filter((_, i) => i !== idx);
    if (phones[idx].isPrimary && newPhones.length > 0) newPhones[0].isPrimary = true;
    setPhones(newPhones);
  };

  const handleRemoveEmail = (idx: number) => {
    const newEmails = emails.filter((_, i) => i !== idx);
    if (emails[idx].isPrimary && newEmails.length > 0) newEmails[0].isPrimary = true;
    setEmails(newEmails);
  };

  const setPrimaryPhone = (idx: number) => {
    setPhones(phones.map((p, i) => ({ ...p, isPrimary: i === idx })));
  };

  const setPrimaryEmail = (idx: number) => {
    setEmails(emails.map((e, i) => ({ ...e, isPrimary: i === idx })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCommunications({
      variables: {
        command: {
          patientId: patient.patientId,
          phones: phones.map(p => ({ phoneNumber: p.phoneNumber, type: p.type, isPrimary: p.isPrimary })),
          emails: emails.map(e => ({ emailAddress: e.emailAddress, type: e.type, isPrimary: e.isPrimary }))
        }
      }
    });
  };

  if (!open) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

        <div className={`relative h-full w-full max-w-[500px] bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${open ? "translate-x-0" : "translate-x-full"}`}>

          <div className="relative flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-1.5 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_20px_var(--primary-glow)]" />
                <div className="flex flex-col">
                  <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">Maintenance: Self-Communications</h2>
                  <span className="text-[10px] font-black text-[var(--primary)] tracking-[0.2em] mt-1 uppercase">Direct Connectivity · Registry Registry</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-[var(--text-primary)]">
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mx-8 mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-300/70 text-[11px] font-medium leading-relaxed">
                  {error.message || "Maintenance synchronization failed."}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide">
              {/* SECTION: PHONE REGISTRY */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Phone Registry (Self)</h3>
                    <div className="w-12 h-px bg-[var(--card-border)]" />
                  </div>
                  <button type="button" onClick={handleAddPhone} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary)]/20 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Vector
                  </button>
                </div>

                <div className="space-y-4">
                  {phones.map((phone, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border transition-all space-y-4 ${phone.isPrimary ? 'bg-[var(--primary)]/[0.03] border-[var(--primary)]/30 shadow-lg shadow-[var(--primary)]/5' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 relative group">
                          <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${phone.isPrimary ? 'text-[var(--primary)]' : 'text-slate-600'}`} />
                          <input
                            className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all"
                            value={phone.phoneNumber}
                            onChange={e => setPhones(phones.map((p, i) => i === idx ? { ...p, phoneNumber: e.target.value } : p))}
                            placeholder="e.g. 555-0199"
                          />
                        </div>
                        <button type="button" onClick={() => handleRemovePhone(idx)} className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-2">
                          {["Mobile", "Home", "Work", "Other"].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setPhones(phones.map((p, i) => i === idx ? { ...p, type: t } : p))}
                              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${phone.type === t ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPrimaryPhone(idx)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${phone.isPrimary ? 'bg-emerald-500 text-black shadow-md' : 'bg-white/5 text-slate-600 hover:bg-white/10'}`}
                        >
                          {phone.isPrimary ? <ShieldCheck className="w-3 h-3" /> : null}
                          {phone.isPrimary ? 'Primary' : 'Set Primary'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {phones.length === 0 && <p className="text-[10px] text-slate-500 italic text-center py-4 uppercase tracking-widest opacity-50">No phone vectors registered</p>}
                </div>
              </section>

              {/* SECTION: EMAIL REGISTRY */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Email Registry (Self)</h3>
                    <div className="w-12 h-px bg-[var(--card-border)]" />
                  </div>
                  <button type="button" onClick={handleAddEmail} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary)]/20 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Vector
                  </button>
                </div>

                <div className="space-y-4">
                  {emails.map((email, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border transition-all space-y-4 ${email.isPrimary ? 'bg-[var(--primary)]/[0.03] border-[var(--primary)]/30 shadow-lg shadow-[var(--primary)]/5' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 relative group">
                          <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${email.isPrimary ? 'text-[var(--primary)]' : 'text-slate-600'}`} />
                          <input
                            type="email"
                            className="w-full bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all"
                            value={email.emailAddress}
                            onChange={e => setEmails(emails.map((em, i) => i === idx ? { ...em, emailAddress: e.target.value } : em))}
                            placeholder="e.g. patient@halkyone.com"
                          />
                        </div>
                        <button type="button" onClick={() => handleRemoveEmail(idx)} className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-2">
                          {["Home", "Work", "Other"].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setEmails(emails.map((em, i) => i === idx ? { ...em, type: t } : em))}
                              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${email.type === t ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPrimaryEmail(idx)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${email.isPrimary ? 'bg-emerald-500 text-black shadow-md' : 'bg-white/5 text-slate-600 hover:bg-white/10'}`}
                        >
                          {email.isPrimary ? <ShieldCheck className="w-3 h-3" /> : null}
                          {email.isPrimary ? 'Primary' : 'Set Primary'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {emails.length === 0 && <p className="text-[10px] text-slate-500 italic text-center py-4 uppercase tracking-widest opacity-50">No email vectors registered</p>}
                </div>
              </section>

              <div className="p-6 rounded-2xl bg-[var(--primary)]/[0.03] border border-[var(--primary)]/10 shadow-inner">
                <p className="text-[9px] text-[var(--primary)] font-bold leading-relaxed italic uppercase tracking-widest opacity-70">
                  * Clinical Synchronizer: Updating these self-vectors will propagate throughout the registry, visit schedule, and logistics modules.
                </p>
              </div>
            </form>

            {/* Action Footer */}
            <div className="p-8 bg-[var(--sidebar-bg)] border-t border-[var(--card-border)] shrink-0">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-14 bg-[var(--primary)] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Save className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Sync Self Communications
              </button>
            </div>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
