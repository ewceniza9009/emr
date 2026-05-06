"use client";

import { useState, useEffect } from "react";
import { useMutation, gql } from "@apollo/client";
import { 
  X, Save, Phone, Mail
} from "lucide-react";
import HalcyonPortal from "./Portal";

const UPDATE_COMMUNICATIONS = gql`
  mutation UpdatePatient($input: UpdatePatientCommandInput!) {
    updatePatient(input: $input)
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient: any;
}

export default function EditCommunicationsDrawer({ open, onClose, onSuccess, patient }: Props) {
  const [form, setForm] = useState({
    primaryPhone: "",
    primaryEmail: ""
  });

  useEffect(() => {
    if (open && patient) {
      const primaryPhone = patient.phones?.find((p: any) => p.isPrimary)?.phoneNumber || "";
      const primaryEmail = patient.emails?.find((e: any) => e.isPrimary)?.emailAddress || "";
      setForm({
        primaryPhone,
        primaryEmail
      });
    }
  }, [open, patient]);

  const [updateCommunications, { loading, error }] = useMutation(UPDATE_COMMUNICATIONS, {
    onCompleted: () => {
      onSuccess();
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCommunications({
      variables: {
        input: {
          patientId: patient.patientId,
          ...form
        }
      }
    });
  };

  if (!open) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-[450px] bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${open ? "translate-x-0" : "translate-x-full"}`}>

          <div className="relative flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-1.5 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_20px_var(--primary-glow)]" />
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">Edit Communications</h2>
                  <span className="text-[10px] font-black text-[var(--primary)] tracking-[0.2em] mt-1 uppercase">Direct Connectivity // Registry</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-[var(--text-primary)]">
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mx-8 mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4">
                <X className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-300/70 text-[11px] font-medium leading-relaxed">
                  {error.message || "Failed to update communications."}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Primary Vectors</h3>
                  <div className="flex-1 h-px bg-[var(--card-border)]" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Primary Phone</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[var(--primary)]" />
                      <input 
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all"
                        value={form.primaryPhone}
                        onChange={e => setForm({...form, primaryPhone: e.target.value})}
                        placeholder="e.g. 555-0199"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Primary Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-[var(--primary)]" />
                      <input 
                        type="email"
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all"
                        value={form.primaryEmail}
                        onChange={e => setForm({...form, primaryEmail: e.target.value})}
                        placeholder="e.g. patient@aura.com"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-[9px] text-amber-500/70 font-medium leading-relaxed italic">
                  * Updating these fields will synchronize the primary contact vector across all clinical and logistical modules.
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
                Sync Communications
              </button>
            </div>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
