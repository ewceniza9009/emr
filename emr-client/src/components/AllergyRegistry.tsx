import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useToast } from "./ToastProvider";
import { 
  AlertCircle, 
  Plus, 
  History, 
  ChevronRight,
  ShieldAlert,
  MoreVertical,
  Activity,
  Trash2,
  X
} from "lucide-react";
import { PermissionGate } from "./PermissionGate";
import HalcyonPortal from "./Portal";

const GET_ALLERGIES = gql`
  query GetAllergies($patientId: UUID!) {
    allergiesByPatient(patientId: $patientId) {
      allergyId
      allergen
      severity
      reaction
      identifiedAt
    }
  }
`;

const ADD_ALLERGY = gql`
  mutation AddAllergy($input: AddAllergyCommandInput!) {
    addAllergy(input: $input)
  }
`;

export default function AllergyRegistry({ patientId }: { patientId: string }) {
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [newAllergy, setNewAllergy] = useState({ allergen: "", severity: "Moderate", reaction: "", identifiedAt: new Date().toISOString() });
  
  const { data, loading, refetch } = useQuery(GET_ALLERGIES, {
    variables: { patientId },
  });

  const [addAllergy, { loading: adding }] = useMutation(ADD_ALLERGY);

  const handleAdd = async () => {
    try {
      await addAllergy({
        variables: {
          input: {
            patientId,
            allergen: newAllergy.allergen,
            severity: newAllergy.severity.toUpperCase(),
            reaction: newAllergy.reaction,
            identifiedAt: new Date().toISOString()
          }
        }
      });
      showToast(`${newAllergy.allergen} allergy recorded.`, "success");
      setShowAddModal(false);
      refetch();
    } catch (err) {
      showToast("Failed to record allergy.", "error");
      console.error(err);
    }
  };

  const allergies = [...(data?.allergiesByPatient || [])].sort(
    (a: any, b: any) => new Date(a.identifiedAt).getTime() - new Date(b.identifiedAt).getTime()
  );

  if (loading) return <div className="p-8 text-[var(--text-muted)] animate-pulse uppercase text-[10px] font-black tracking-widest">Scanning Patient Biotics...</div>;

  return (
    <div className="glass-morphism rounded-2xl border border-[var(--card-border)] relative">
      <div className="px-6 py-2 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)] rounded-t-2xl">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tight">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          Allergy Registry
        </h2>
        <PermissionGate permission="clinical:chart">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-rose-500 text-xs font-bold uppercase tracking-widest hover:text-rose-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Allergy
          </button>
        </PermissionGate>
      </div>

      <div className="divide-y divide-[var(--card-border)]">
        {allergies.length === 0 ? (
           <div className="p-10 text-center text-[var(--text-muted)] text-sm italic">
              No known allergies documented for this patient.
           </div>
        ) : (
          allergies.map((a: any) => (
            <div key={a.allergyId} className={`px-6 py-2.5 flex items-center justify-between group hover:bg-[var(--primary-glow)] transition-colors relative ${activeMenu === a.allergyId ? 'z-50' : 'z-0'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  a.severity === 'SEVERE' || a.severity === 'LIFETHREATENING' 
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[var(--text-primary)] font-black text-xs uppercase tracking-tight">{a.allergen}</h3>
                  <div className="flex gap-3 mt-1">
                     <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">{a.severity}</span>
                     {a.reaction && (
                       <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider flex items-center gap-1">
                          Rx: {a.reaction}
                       </span>
                     )}
                  </div>
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setActiveMenu(activeMenu === a.allergyId ? null : a.allergyId)}
                  className={`p-2 rounded-lg transition-colors ${activeMenu === a.allergyId ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                   <MoreVertical className="w-4 h-4" />
                </button>
                
                {activeMenu === a.allergyId && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                    <div className="absolute right-0 top-full mt-2 w-40 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
                      <PermissionGate permission="clinical:chart">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all uppercase tracking-widest">
                           <Trash2 className="w-3.5 h-3.5" />
                           Void Record
                        </button>
                      </PermissionGate>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Allergy Modal */}
      {showAddModal && (
        <HalcyonPortal>
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
             <div className="relative glass-morphism w-full max-w-lg rounded-[2.5rem] border border-[var(--card-border)] p-10 space-y-8 shadow-2xl bg-[var(--card-bg)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-1.5 h-10 bg-rose-500 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.3)]" />
                    <div>
                      <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">
                        New Allergy Entry
                      </h2>
                      <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest mt-1">Critical safety record initialization</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-2.5 rounded-xl bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
                     <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Allergen / Substance</label>
                      <input 
                        value={newAllergy.allergen}
                        onChange={(e) => setNewAllergy({...newAllergy, allergen: e.target.value})}
                        placeholder="e.g. Penicillin, Peanuts" 
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-4 px-6 text-[var(--text-primary)] text-sm font-black focus:border-rose-500/50 transition-all outline-none uppercase" 
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Severity Level</label>
                      <div className="relative group">
                        <select 
                          value={newAllergy.severity}
                          onChange={(e) => setNewAllergy({...newAllergy, severity: e.target.value})}
                          className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-4 px-6 text-[var(--text-primary)] text-sm font-black appearance-none focus:border-rose-500/50 transition-all outline-none uppercase"
                        >
                           <option value="Mild">Mild</option>
                           <option value="Moderate">Moderate</option>
                           <option value="Severe">Severe</option>
                           <option value="LifeThreatening">Life Threatening</option>
                        </select>
                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 rotate-90 text-slate-500 pointer-events-none" />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observed Reaction</label>
                      <textarea 
                        value={newAllergy.reaction}
                        onChange={(e) => setNewAllergy({...newAllergy, reaction: e.target.value})}
                        placeholder="e.g. Anaphylaxis, Rash, Dyspnea" 
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl py-4 px-6 text-[var(--text-primary)] text-sm font-medium min-h-[100px] focus:border-rose-500/50 transition-all outline-none" 
                      />
                   </div>
                </div>

                <PermissionGate permission="clinical:chart">
                  <button 
                    onClick={handleAdd}
                    disabled={adding || !newAllergy.allergen}
                    className="w-full py-5 rounded-2xl bg-rose-500 text-white font-black text-xs uppercase tracking-[0.4em] transition-all shadow-[0_10px_30px_rgba(244,63,94,0.3)] flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                  >
                    {adding ? (
                      <Activity className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShieldAlert className="w-5 h-5" />
                        <span>Record Safety Alert</span>
                      </>
                    )}
                  </button>
                </PermissionGate>
             </div>
          </div>
        </HalcyonPortal>
      )}
    </div>
  );
}

