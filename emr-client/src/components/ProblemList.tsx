import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { 
  ClipboardList, 
  Plus, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Search,
  ChevronRight
} from "lucide-react";

const GET_DIAGNOSES = gql`
  query GetDiagnoses($patientId: UUID!) {
    diagnosesByPatient(patientId: $patientId) {
      diagnosisId
      icd10Code
      description
      isPrimary
      diagnosedAt
    }
  }
`;

export default function ProblemList({ patientId }: { patientId: string }) {
  const { data, loading } = useQuery(GET_DIAGNOSES, {
    variables: { patientId },
  });

  const problems = data?.diagnosesByPatient || [];

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading Problem List...</div>;

  return (
    <div className="glass-morphism rounded-2xl overflow-hidden border border-[var(--card-border)]">
      <div className="px-6 py-2 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
        <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tighter">
          <ClipboardList className="w-4 h-4 text-blue-400" />
          Problem List (Diagnoses)
        </h2>
        <button className="flex items-center gap-1 text-blue-400 text-xs font-bold uppercase tracking-widest hover:text-blue-300 transition-colors">
          <Plus className="w-4 h-4" />
          Add Diagnosis
        </button>
      </div>

      <div className="divide-y divide-[var(--card-border)]">
        {problems.length === 0 ? (
           <div className="p-10 text-center text-[var(--text-muted)] text-sm italic">
              No active diagnoses recorded for this patient.
           </div>
        ) : (
          problems.map((p: any) => (
            <div key={p.diagnosisId} className="px-6 py-2.5 flex items-center justify-between group hover:bg-[var(--primary)]/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.isPrimary ? 'bg-blue-500/10 text-blue-400' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[var(--text-primary)] font-black text-xs uppercase tracking-tight">
                    {p.description} 
                    {p.isPrimary && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[7px] font-black uppercase tracking-widest border border-blue-500/20">Primary</span>}
                  </h3>
                  <div className="flex gap-3 mt-1">
                     <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{p.icd10Code}</span>
                     <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(p.diagnosedAt).toLocaleDateString()}
                     </span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-slate-600 hover:text-blue-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
