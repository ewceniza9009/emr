"use client";

import { useState } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import { X, UserPlus, Save, MapPin, Building2, CreditCard } from "lucide-react";

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
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative h-full w-full max-w-md bg-[#050608] shadow-2xl flex flex-col border-l border-white/5 animate-in slide-in-from-right duration-500">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
             <UserPlus className="text-blue-400 w-5 h-5" />
             <h2 className="text-lg font-bold text-white uppercase tracking-tighter">Register New Patient</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mutationError && (
          <div className="mx-8 mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
               <X className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-red-400 font-bold text-xs uppercase tracking-widest mb-1">Registration Failed</p>
              <p className="text-red-300/70 text-xs leading-relaxed">
                {mutationError.message || "An unexpected error occurred. Please check the clinical server."}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Medical Record Number (MRN)</label>
            <input 
              required
              className="w-full premium-input rounded-xl py-3 px-4"
              value={form.mrn}
              onChange={e => setForm({...form, mrn: e.target.value})}
              placeholder="e.g. MRN-12345"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Date of Birth</label>
                <input 
                  required
                  type="date"
                  className="w-full premium-input rounded-xl py-3 px-4"
                  value={form.dob}
                  onChange={e => setForm({...form, dob: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Biological Sex</label>
                <select 
                  className="w-full premium-input rounded-xl py-3 px-4 bg-slate-900"
                  value={form.biologicalSex}
                  onChange={e => setForm({...form, biologicalSex: e.target.value})}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
             </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5">
             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <CreditCard className="w-3 h-3 text-emerald-400" /> Philhealth Number
             </label>
             <input 
               className="w-full premium-input rounded-xl py-3 px-4"
               value={form.philhealthNumber}
               onChange={e => setForm({...form, philhealthNumber: e.target.value})}
               placeholder="XX-XXXXXXXXX-X"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Health Plan</label>
                <select 
                  className="w-full premium-input rounded-xl py-3 px-4 bg-slate-900"
                  value={form.healthPlanId}
                  onChange={e => setForm({...form, healthPlanId: e.target.value})}
                >
                  <option value="">Select Plan...</option>
                  {metadata?.healthPlans.map((p: any) => (
                    <option key={p.healthPlanId} value={p.healthPlanId}>{p.name}</option>
                  ))}
                </select>
             </div>
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Facility</label>
                <select 
                  className="w-full premium-input rounded-xl py-3 px-4 bg-slate-900"
                  value={form.facilityId}
                  onChange={e => setForm({...form, facilityId: e.target.value})}
                >
                  <option value="">Select Facility...</option>
                  {metadata?.facilities.map((f: any) => (
                    <option key={f.facilityId} value={f.facilityId}>{f.name}</option>
                  ))}
                </select>
             </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5">
             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <MapPin className="w-3 h-3 text-blue-400" /> House No. / Street
             </label>
             <input 
               required
               className="w-full premium-input rounded-xl py-3 px-4"
               value={form.street}
               onChange={e => setForm({...form, street: e.target.value})}
               placeholder="e.g. 123 Palliative St"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">City / Municipality</label>
                <input 
                  required
                  className="w-full premium-input rounded-xl py-3 px-4"
                  value={form.city}
                  onChange={e => setForm({...form, city: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">State / Province</label>
                <input 
                  required
                  className="w-full premium-input rounded-xl py-3 px-4"
                  value={form.state}
                  onChange={e => setForm({...form, state: e.target.value})}
                />
             </div>
          </div>

          <div className="space-y-2 pb-8">
             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Postal Code</label>
             <input 
               required
               className="w-full premium-input rounded-xl py-3 px-4"
               value={form.postalCode}
               onChange={e => setForm({...form, postalCode: e.target.value})}
             />
          </div>
        </form>

        <div className="p-6 bg-white/5 border-t border-white/5 mt-auto">
          <button 
            type="submit" 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-[2rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-600/20"
          >
            {loading ? "Registering..." : <><Save className="w-5 h-5" /> Register Patient</>}
          </button>
        </div>
      </div>
    </div>
  );
}
