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
  Activity
} from "lucide-react";

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

  const allergies = data?.allergiesByPatient || [];

  if (loading) return <div className="p-8 text-[var(--text-muted)] animate-pulse">Scanning Allergies...</div>;

  return (
    <div className="glass-morphism rounded-2xl overflow-hidden border border-[var(--card-border)]">
      <div className="px-6 py-2 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
        <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tighter">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          Allergy Registry
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-rose-500 text-xs font-bold uppercase tracking-widest hover:text-rose-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Allergy
        </button>
      </div>

      <div className="divide-y divide-[var(--card-border)]">
        {allergies.length === 0 ? (
           <div className="p-10 text-center text-[var(--text-muted)] text-sm italic">
              No known allergies documented for this patient.
           </div>
        ) : (
          allergies.map((a: any) => (
            <div key={a.allergyId} className="px-6 py-2.5 flex items-center justify-between group hover:bg-[var(--primary-glow)] transition-colors">
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
              <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                 <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Allergy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="glass-morphism w-full max-w-lg rounded-[2rem] border border-[var(--card-border)] p-10 space-y-8 shadow-2xl bg-[var(--card-bg)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-rose-500" />
                    New Allergy Entry
                  </h2>
                  <p className="text-[var(--text-muted)] text-xs mt-1">Critical safety record initialization.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
                   <ChevronRight className="w-5 h-5 rotate-90" />
                </button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Allergen / Substance</label>
                    <input 
                      value={newAllergy.allergen}
                      onChange={(e) => setNewAllergy({...newAllergy, allergen: e.target.value})}
                      placeholder="e.g. Penicillin, Peanuts" 
                      className="w-full premium-input rounded-xl py-3 px-4 text-[var(--text-primary)] text-sm" 
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Severity Level</label>
                    <select 
                      value={newAllergy.severity}
                      onChange={(e) => setNewAllergy({...newAllergy, severity: e.target.value})}
                      className="w-full premium-input rounded-xl py-3 px-4 text-[var(--text-primary)] text-sm appearance-none bg-[var(--input-bg)]"
                    >
                       <option value="Mild">Mild</option>
                       <option value="Moderate">Moderate</option>
                       <option value="Severe">Severe</option>
                       <option value="LifeThreatening">Life Threatening</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Observed Reaction</label>
                    <textarea 
                      value={newAllergy.reaction}
                      onChange={(e) => setNewAllergy({...newAllergy, reaction: e.target.value})}
                      placeholder="e.g. Anaphylaxis, Rash, Dyspnea" 
                      className="w-full premium-input rounded-xl py-4 px-4 text-[var(--text-primary)] text-sm min-h-[80px]" 
                    />
                 </div>
              </div>

              <button 
                onClick={handleAdd}
                disabled={adding || !newAllergy.allergen}
                className="w-full premium-button premium-gradient py-4 rounded-2xl text-white font-bold shadow-xl shadow-rose-500/20 disabled:opacity-50"
              >
                {adding ? "Recording..." : "Record Safety Alert"}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
