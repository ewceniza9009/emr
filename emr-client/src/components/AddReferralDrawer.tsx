"use client";

import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { X, UserPlus, Save, Phone, Mail, FileText } from "lucide-react";

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
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative h-full w-full max-w-md bg-[#050608] shadow-2xl flex flex-col border-l border-white/5 animate-in slide-in-from-right duration-500">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
             <UserPlus className="text-emerald-400 w-5 h-5" />
             <h2 className="text-lg font-bold text-white uppercase tracking-tighter">New Referral Intake</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">First Name</label>
                <input 
                  required
                  className="w-full premium-input rounded-xl py-3 px-4"
                  value={form.firstName}
                  onChange={e => setForm({...form, firstName: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Name</label>
                <input 
                  required
                  className="w-full premium-input rounded-xl py-3 px-4"
                  value={form.lastName}
                  onChange={e => setForm({...form, lastName: e.target.value})}
                />
             </div>
          </div>

          <div className="space-y-2">
             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Referral Source</label>
             <select 
               className="w-full premium-input rounded-xl py-3 px-4 bg-slate-900"
               value={form.referralSource}
               onChange={e => setForm({...form, referralSource: e.target.value})}
             >
               <option value="Hospital Discharge">Hospital Discharge</option>
               <option value="Primary Care Physician">Primary Care Physician</option>
               <option value="Self-Referral">Self-Referral</option>
               <option value="Community Agency">Community Agency</option>
               <option value="Other">Other</option>
             </select>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Primary Phone
                </label>
                <input 
                  className="w-full premium-input rounded-xl py-3 px-4"
                  value={form.primaryPhone}
                  onChange={e => setForm({...form, primaryPhone: e.target.value})}
                  placeholder="+63 9xx xxxx xxx"
                />
             </div>
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email Address
                </label>
                <input 
                  type="email"
                  className="w-full premium-input rounded-xl py-3 px-4"
                  value={form.primaryEmail}
                  onChange={e => setForm({...form, primaryEmail: e.target.value})}
                  placeholder="name@example.com"
                />
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  House No. / Street
                </label>
                <input 
                  className="w-full premium-input rounded-xl py-3 px-4"
                  value={form.street}
                  onChange={e => setForm({...form, street: e.target.value})}
                  placeholder="e.g. 123 Palliative St"
                />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">City</label>
                   <input 
                     className="w-full premium-input rounded-xl py-3 px-4"
                     value={form.city}
                     onChange={e => setForm({...form, city: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">State</label>
                   <input 
                     className="w-full premium-input rounded-xl py-3 px-4"
                     value={form.state}
                     onChange={e => setForm({...form, state: e.target.value})}
                   />
                </div>
             </div>

             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Postal Code</label>
                <input 
                  className="w-full premium-input rounded-xl py-3 px-4"
                  value={form.postalCode}
                  onChange={e => setForm({...form, postalCode: e.target.value})}
                />
             </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5">
             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <FileText className="w-3 h-3" /> Referral Notes
             </label>
             <textarea 
               className="w-full premium-input rounded-xl py-3 px-4 h-32"
               value={form.notes}
               onChange={e => setForm({...form, notes: e.target.value})}
               placeholder="Initial clinical context, caregiver info, or specific requirements..."
             />
          </div>
        </form>

        <div className="p-6 bg-white/5 border-t border-white/5 mt-auto">
          <button 
            type="submit" 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? "Saving Referral..." : <><Save className="w-5 h-5" /> Save Referral</>}
          </button>
        </div>
      </div>
    </div>
  );
}
