"use client";

import { useState, useEffect } from "react";
import { useMutation, gql } from "@apollo/client";
import { 
  X, Save, ShieldCheck, UserCircle, 
  MapPin, Globe, Briefcase, Heart
} from "lucide-react";
import HalcyonPortal from "./Portal";

const UPDATE_PATIENT = gql`
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

export default function EditDemographicsDrawer({ open, onClose, onSuccess, patient }: Props) {
  const [form, setForm] = useState({
    civilStatus: "",
    religion: "",
    language: "",
    nationality: "",
    occupation: "",
    biologicalSex: "",
    genderIdentity: ""
  });

  useEffect(() => {
    if (open && patient) {
      setForm({
        civilStatus: patient.civilStatus || "",
        religion: patient.religion || "",
        language: patient.language || "English",
        nationality: patient.nationality || "Filipino",
        occupation: patient.occupation || "",
        biologicalSex: patient.biologicalSex || "",
        genderIdentity: patient.genderIdentity || ""
      });
    }
  }, [open, patient]);

  const [updatePatient, { loading, error }] = useMutation(UPDATE_PATIENT, {
    onCompleted: () => {
      onSuccess();
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePatient({
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
        
        <div className={`relative h-full w-full max-w-[500px] bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${open ? "translate-x-0" : "translate-x-full"}`}>

          <div className="relative flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-1.5 h-10 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
                <div className="flex flex-col">
                  <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">Edit Demographics</h2>
                  <span className="text-[10px] font-black text-blue-500 tracking-[0.2em] mt-1 uppercase">Core Identity // Patient Record</span>
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
                  {error.message || "Failed to update demographics."}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              {/* Identity Details */}
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Status & Identity</h3>
                  <div className="flex-1 h-px bg-[var(--card-border)]" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Civil Status</label>
                    <select 
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-all uppercase"
                      value={form.civilStatus}
                      onChange={e => setForm({...form, civilStatus: e.target.value})}
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Religion</label>
                    <select 
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-all uppercase"
                      value={form.religion}
                      onChange={e => setForm({...form, religion: e.target.value})}
                    >
                      <option value="">Select Religion</option>
                      <option value="Catholic">Catholic</option>
                      <option value="Christian">Christian</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Buddhist">Buddhist</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Jewish">Jewish</option>
                      <option value="Atheist">Atheist</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Biological Sex</label>
                    <select 
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-all uppercase"
                      value={form.biologicalSex}
                      onChange={e => setForm({...form, biologicalSex: e.target.value})}
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Intersex">Intersex</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Gender Identity</label>
                    <select 
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-all uppercase"
                      value={form.genderIdentity}
                      onChange={e => setForm({...form, genderIdentity: e.target.value})}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Transgender">Transgender</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Primary Language</label>
                    <select 
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-all uppercase"
                      value={form.language}
                      onChange={e => setForm({...form, language: e.target.value})}
                    >
                      <option value="English">English</option>
                      <option value="Tagalog">Tagalog</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Nationality</label>
                    <input 
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-all"
                      value={form.nationality}
                      onChange={e => setForm({...form, nationality: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Occupation</label>
                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500" />
                    <input 
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-all"
                      value={form.occupation}
                      onChange={e => setForm({...form, occupation: e.target.value})}
                      placeholder="Current job title..."
                    />
                  </div>
                </div>
              </section>
            </form>

            {/* Action Footer */}
            <div className="p-8 bg-[var(--sidebar-bg)] border-t border-[var(--card-border)] shrink-0">
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-14 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Save className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Demographics
              </button>
            </div>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
