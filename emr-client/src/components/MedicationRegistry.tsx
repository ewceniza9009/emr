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
  ShieldCheck,
  Activity,
  X,
  Trash2,
  FileText
} from "lucide-react";
import HalcyonPortal from "./Portal";
import MedicationDetailDrawer from "./MedicationDetailDrawer";

const GET_PRESCRIPTIONS = gql`
  query GetPrescriptions($patientId: UUID!) {
    prescriptionsByPatient(patientId: $patientId) {
      prescriptionId
      dose
      frequency
      route
      isActive
      startDate
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
    addPrescription(input: $input)
  }
`;

export default function MedicationRegistry({ patientId }: { patientId: string }) {
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
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

  const prescriptions = [...(data?.prescriptionsByPatient || [])].sort(
    (a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  if (loading) return <div className="p-8 text-[var(--text-muted)] animate-pulse uppercase text-[10px] font-black tracking-widest">Reconciling Pharmacopeia...</div>;

  return (
    <div className="glass-morphism rounded-2xl border border-[var(--card-border)] relative">
      <div className="px-6 py-2 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)] rounded-t-2xl">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tight">
          <Pill className="w-4 h-4 text-emerald-500" />
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
          <div key={p.prescriptionId} className={`px-6 py-2.5 flex items-center justify-between group hover:bg-[var(--primary-glow)] transition-colors relative ${activeMenu === p.prescriptionId ? 'z-50' : 'z-0'}`}>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[var(--text-primary)] font-black text-xs uppercase tracking-tight">{p.medication.name} <span className="text-[var(--text-muted)] font-bold ml-1">({p.medication.strength})</span></h3>
                <div className="flex gap-3 mt-1">
                   <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">{p.dose} • {p.route}</span>
                   <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {p.frequency}
                   </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 relative">
               <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${p.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--card-border)]'}`}>
                  {p.isActive ? 'Active' : 'Inactive'}
               </span>
               <button 
                onClick={() => setActiveMenu(activeMenu === p.prescriptionId ? null : p.prescriptionId)}
                className={`p-2 rounded-lg transition-colors ${activeMenu === p.prescriptionId ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
               >
                  <MoreVertical className="w-4 h-4" />
               </button>

               {activeMenu === p.prescriptionId && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={() => {
                          setSelectedPrescription(p);
                          setActiveMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black text-[var(--text-primary)] hover:bg-[var(--input-bg)] rounded-lg transition-all uppercase tracking-widest"
                      >
                         <FileText className="w-3.5 h-3.5 text-blue-500" />
                         View Details
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all uppercase tracking-widest">
                         <Trash2 className="w-3.5 h-3.5" />
                         Discontinue
                      </button>
                    </div>
                  </>
                )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-1.5 bg-emerald-500/5 border-t border-[var(--card-border)] flex items-center gap-2 text-emerald-600/60 text-[9px] font-black uppercase tracking-widest">
         <History className="w-3 h-3" />
         View Medication History (12 Archive)
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <HalcyonPortal>
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
             <div className="relative glass-morphism w-full max-w-lg rounded-[2.5rem] border border-[var(--card-border)] p-10 space-y-8 shadow-2xl bg-[var(--card-bg)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-1.5 h-10 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                    <div>
                      <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">
                        New Prescription
                      </h2>
                      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-1">Pharmacological order initialization</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-2.5 rounded-xl bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
                     <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Medication Name</label>
                         <input 
                           value={newMed.name}
                           onChange={(e) => handleNameChange(e.target.value)}
                           placeholder="e.g. Morphine" 
                           className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-3.5 px-5 text-[var(--text-primary)] text-sm font-black focus:border-emerald-500/50 transition-all outline-none" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Strength</label>
                         <input 
                           value={newMed.strength}
                           onChange={(e) => setNewMed({...newMed, strength: e.target.value})}
                           placeholder="e.g. 5mg/ml" 
                           className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-3.5 px-5 text-[var(--text-primary)] text-sm font-black focus:border-emerald-500/50 transition-all outline-none" 
                         />
                      </div>
                   </div>

                   {/* Clinical Warnings */}
                   {conflicts.length > 0 && (
                     <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 animate-in zoom-in duration-300">
                        <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                           <AlertCircle className="w-4 h-4" />
                           Conflict Detected
                        </div>
                        {conflicts.map((c: string, i: number) => (
                          <p key={i} className="text-[var(--text-primary)] text-[10px] font-bold leading-relaxed">{c}</p>
                        ))}
                     </div>
                   )}

                   <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dose</label>
                         <input 
                           value={newMed.dose}
                           onChange={(e) => setNewMed({...newMed, dose: e.target.value})}
                           placeholder="0.5ml" 
                           className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-3.5 px-5 text-[var(--text-primary)] text-sm font-black focus:border-emerald-500/50 transition-all outline-none" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Freq</label>
                         <input 
                           value={newMed.frequency}
                           onChange={(e) => setNewMed({...newMed, frequency: e.target.value})}
                           placeholder="Q4H" 
                           className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-3.5 px-5 text-[var(--text-primary)] text-sm font-black focus:border-emerald-500/50 transition-all outline-none" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Route</label>
                         <div className="relative">
                            <select 
                              value={newMed.route}
                              onChange={(e) => setNewMed({...newMed, route: e.target.value})}
                              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-3.5 px-5 text-[var(--text-primary)] text-sm font-black appearance-none focus:border-emerald-500/50 transition-all outline-none uppercase"
                            >
                               <option value="Oral">Oral</option>
                               <option value="Sublingual">SL</option>
                               <option value="Subcutaneous">SQ</option>
                               <option value="Transdermal">TD</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-slate-500 pointer-events-none" />
                         </div>
                      </div>
                   </div>

                   {/* E-Signature Section */}
                   <div className="p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 space-y-4">
                      <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">
                         <ShieldCheck className="w-4 h-4" />
                         Digital Signature
                      </div>
                      <input 
                        value={newMed.signature}
                        onChange={(e) => setNewMed({...newMed, signature: e.target.value})}
                        placeholder="Type Full Name to Sign" 
                        className="w-full bg-white/5 border-b border-blue-500/30 py-3 text-[var(--text-primary)] text-lg italic font-serif outline-none focus:border-blue-500 transition-all" 
                      />
                   </div>
                </div>

                <button 
                  onClick={handleAdd}
                  disabled={adding || !newMed.name || !newMed.signature}
                  className="w-full py-5 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.4em] transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {adding ? (
                    <Activity className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Authorize Order</span>
                    </>
                  )}
                </button>
             </div>
          </div>
        </HalcyonPortal>
      )}
      <MedicationDetailDrawer 
        isOpen={!!selectedPrescription} 
        onClose={() => setSelectedPrescription(null)} 
        prescription={selectedPrescription} 
      />
    </div>
  );
}
