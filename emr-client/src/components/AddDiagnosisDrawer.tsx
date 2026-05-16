import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { 
  X, Save, ClipboardList, AlertCircle, 
  Search, ShieldCheck, Activity, Calendar
} from "lucide-react";
import HalcyonPortal from "./Portal";
import { useToast } from "./ToastProvider";
import SmartTextarea from "./SmartTextarea";
import { useSmartPhrases } from "@/hooks/useSmartPhrases";


const ADD_DIAGNOSIS = gql`
  mutation AddDiagnosis($input: AddDiagnosisCommandInput!) {
    addDiagnosis(input: $input)
  }
`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onSuccess: () => void;
}

export default function AddDiagnosisDrawer({ isOpen, onClose, patientId, onSuccess }: Props) {
  const { showToast } = useToast();
  const { smartPhrases } = useSmartPhrases();

  const [form, setForm] = useState({
    icd10Code: "",
    description: "",
    isPrimary: false,
    diagnosedAt: new Date().toISOString().split('T')[0]
  });

  const [addDiagnosis, { loading }] = useMutation(ADD_DIAGNOSIS);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDiagnosis({
        variables: {
          input: {
            patientId,
            ...form,
            diagnosedAt: new Date(form.diagnosedAt).toISOString()
          }
        }
      });
      showToast("Diagnosis recorded successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      showToast("Failed to record diagnosis", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-[500px] bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

          <div className="relative flex-1 flex flex-col overflow-hidden">
             {/* Header */}
             <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-1.5 h-10 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
                  <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">Record Diagnosis</h2>
                    <span className="text-[10px] font-black text-blue-500 tracking-[0.2em] mt-1 uppercase">Clinical Documentation · ICD-10</span>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-[var(--text-primary)]">
                  <X className="w-6 h-6" />
                </button>
             </div>

             <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                <section className="space-y-6">
                   <div className="flex items-center gap-4">
                      <h3 className="text-[10px] font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Diagnostic Data</h3>
                      <div className="flex-1 h-px bg-[var(--card-border)]" />
                   </div>

                   <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">ICD-10 Code</label>
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500" />
                        <input 
                          className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-all uppercase"
                          value={form.icd10Code}
                          onChange={e => setForm({...form, icd10Code: e.target.value})}
                          placeholder="e.g. E11.9"
                          required
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Condition Description</label>
                      <SmartTextarea 
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-4 px-6 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px]"
                        value={form.description}
                        onChange={val => setForm({...form, description: val})}
                        smartPhrases={smartPhrases}
                        placeholder="Clinical description of the condition..."
                        required
                      />
                   </div>


                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Diagnosed At</label>
                         <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500" />
                            <input 
                              type="date"
                              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-all uppercase"
                              value={form.diagnosedAt}
                              onChange={e => setForm({...form, diagnosedAt: e.target.value})}
                              required
                            />
                         </div>
                      </div>
                      <div className="flex flex-col justify-end">
                         <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-blue-500/5 transition-all border border-transparent hover:border-blue-500/10">
                            <input 
                              type="checkbox"
                              className="hidden"
                              checked={form.isPrimary}
                              onChange={e => setForm({...form, isPrimary: e.target.checked})}
                            />
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.isPrimary ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-slate-700'}`}>
                               {form.isPrimary && <ShieldCheck className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[var(--text-primary)] transition-colors">Primary Condition</span>
                         </label>
                      </div>
                   </div>
                </section>

                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                   <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                      <AlertCircle className="w-4 h-4" />
                      Registry Impact
                   </div>
                   <p className="text-slate-500 text-[10px] font-medium leading-relaxed italic">
                      Adding this diagnosis will update the patient&apos;s active problem list and alert all care teams. Ensure ICD-10 coding matches clinical documentation.
                   </p>
                </div>
             </form>

             <div className="p-8 bg-[var(--sidebar-bg)] border-t border-[var(--card-border)] shrink-0">
                <button 
                  onClick={handleSubmit}
                  disabled={loading || !form.icd10Code || !form.description}
                  className="w-full h-14 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Commit Diagnosis
                </button>
             </div>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}

