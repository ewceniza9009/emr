import { useState } from "react";
import { useQuery, useMutation, useLazyQuery, gql } from "@apollo/client";
import { useToast } from "./ToastProvider";
import { 
  Pill, 
  Plus, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Clock,
  MoreVertical,
  ShieldCheck
} from "lucide-react";

const GET_PRESCRIPTIONS = gql`
  query GetPrescriptions($patientId: UUID!) {
    prescriptionsByPatient(patientId: $patientId) {
      prescriptionId
      dose
      frequency
      route
      isActive
      medication {
        name
        strength
      }
    }
  }
`;

const VALIDATE_PRESCRIPTION = gql`
  query Validate($patientId: UUID!, $name: String!) {
    validatePrescription(patientId: $patientId, medicationName: $name)
  }
`;

const ADD_PRESCRIPTION = gql`
  mutation AddPrescription($input: AddPrescriptionCommandInput!) {
    addPrescription(command: $input)
  }
`;

export default function MedicationRegistry({ patientId }: { patientId: string }) {
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", strength: "", dose: "", frequency: "", route: "Oral", indications: "", signature: "" });
  
  const { data, loading, refetch } = useQuery(GET_PRESCRIPTIONS, {
    variables: { patientId },
  });

  const [addMed, { loading: adding }] = useMutation(ADD_PRESCRIPTION);
  const [validate, { data: validationData }] = useLazyQuery(VALIDATE_PRESCRIPTION);

  const conflicts = validationData?.validatePrescription || [];

  const handleNameChange = (name: string) => {
    setNewMed({...newMed, name});
    if (name.length > 3) {
      validate({ variables: { patientId, name } });
    }
  };

  const handleAdd = async () => {
    try {
      await addMed({
        variables: {
          input: {
            patientId,
            medicationName: newMed.name,
            strength: newMed.strength,
            dose: newMed.dose,
            frequency: newMed.frequency,
            route: newMed.route,
            indications: newMed.indications,
            digitalSignature: newMed.signature
          }
        }
      });
      showToast(`${newMed.name} prescribed successfully.`, "success");
      setShowAddModal(false);
      refetch();
    } catch (err) {
      showToast("Failed to sign prescription.", "error");
      console.error(err);
    }
  };

  const prescriptions = data?.prescriptionsByPatient || [];

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading Medications...</div>;

  return (
    <div className="glass-morphism rounded-3xl overflow-hidden border border-[var(--card-border)]">
      <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Pill className="w-5 h-5 text-emerald-500" />
          Active Medications
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase tracking-widest hover:text-emerald-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Prescription
        </button>
      </div>

      <div className="divide-y divide-[var(--card-border)]">
        {prescriptions.map((p: any) => (
          <div key={p.prescriptionId} className="p-6 flex items-center justify-between group hover:bg-[var(--primary-glow)] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[var(--text-primary)] font-bold text-sm">{p.medication.name} <span className="text-[var(--text-muted)] font-normal ml-1">({p.medication.strength})</span></h3>
                <div className="flex gap-3 mt-1">
                   <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">{p.dose} • {p.route}</span>
                   <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {p.frequency}
                   </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${p.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                  {p.isActive ? 'Active' : 'Inactive'}
               </span>
               <button className="p-2 text-slate-600 hover:text-white transition-colors">
                  <MoreVertical className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-emerald-500/5 border-t border-[var(--card-border)] flex items-center gap-2 text-emerald-600/60 text-[10px] font-bold uppercase tracking-widest">
         <History className="w-3 h-3" />
         View Medication History (12 Archive)
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="glass-morphism w-full max-w-lg rounded-[2rem] border border-white/10 p-10 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Pill className="w-6 h-6 text-emerald-400" />
                    New Prescription
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">Ordering symptom management medication.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
                   <ChevronRight className="w-5 h-5 rotate-90" />
                </button>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Medication Name</label>
                       <input 
                         value={newMed.name}
                         onChange={(e) => handleNameChange(e.target.value)}
                         placeholder="e.g. Morphine" 
                         className="w-full premium-input rounded-xl py-3 px-4 text-white text-sm" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Strength</label>
                       <input 
                         value={newMed.strength}
                         onChange={(e) => setNewMed({...newMed, strength: e.target.value})}
                         placeholder="e.g. 5mg/ml" 
                         className="w-full premium-input rounded-xl py-3 px-4 text-white text-sm" 
                       />
                    </div>
                 </div>

                 {/* Clinical Warnings */}
                 {conflicts.length > 0 && (
                   <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 animate-in zoom-in duration-300">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
                         <AlertCircle className="w-4 h-4" />
                         Clinical Conflict Detected
                      </div>
                      {conflicts.map((c: string, i: number) => (
                        <p key={i} className="text-white text-xs font-medium leading-relaxed">{c}</p>
                      ))}
                   </div>
                 )}

                 <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dose</label>
                       <input 
                         value={newMed.dose}
                         onChange={(e) => setNewMed({...newMed, dose: e.target.value})}
                         placeholder="0.5ml" 
                         className="w-full premium-input rounded-xl py-3 px-4 text-white text-sm" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Freq</label>
                       <input 
                         value={newMed.frequency}
                         onChange={(e) => setNewMed({...newMed, frequency: e.target.value})}
                         placeholder="Q4H PRN" 
                         className="w-full premium-input rounded-xl py-3 px-4 text-white text-sm" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Route</label>
                       <select 
                         value={newMed.route}
                         onChange={(e) => setNewMed({...newMed, route: e.target.value})}
                         className="w-full premium-input rounded-xl py-3 px-4 text-white text-sm appearance-none bg-slate-900"
                       >
                          <option value="Oral">Oral</option>
                          <option value="Sublingual">Sublingual</option>
                          <option value="Subcutaneous">Subcutaneous</option>
                          <option value="Transdermal">Transdermal</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Indications / Notes</label>
                    <textarea 
                      value={newMed.indications}
                      onChange={(e) => setNewMed({...newMed, indications: e.target.value})}
                      placeholder="For breakthrough pain or dyspnea..." 
                      className="w-full premium-input rounded-xl py-4 px-4 text-white text-sm min-h-[80px]" 
                    />
                 </div>

                 {/* E-Signature Section */}
                 <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                    <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                       <ShieldCheck className="w-4 h-4" />
                       Clinical Digital Signature
                    </div>
                    <input 
                      value={newMed.signature}
                      onChange={(e) => setNewMed({...newMed, signature: e.target.value})}
                      placeholder="Type Full Name to Sign" 
                      className="w-full premium-input rounded-xl py-3 px-4 text-white text-sm italic font-serif" 
                    />
                    <p className="text-[10px] text-slate-500 italic">By signing, you confirm this pharmacological order is clinically indicated and you have reviewed the patient's allergy and conflict profile.</p>
                 </div>
              </div>

              <button 
                onClick={handleAdd}
                disabled={adding || !newMed.name || !newMed.signature}
                className="w-full premium-button premium-gradient py-4 rounded-2xl text-white font-bold shadow-xl shadow-emerald-500/20 disabled:opacity-50"
              >
                {adding ? "Signing Prescription..." : "Sign & Add Prescription"}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
