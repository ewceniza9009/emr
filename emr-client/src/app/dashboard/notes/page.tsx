"use client";

import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { 
  FileText, 
  Search, 
  Plus, 
  Clock, 
  User, 
  CheckCircle2, 
  MoreVertical,
  ChevronRight,
  Filter,
  Save,
  Lock,
  Edit3,
  Loader2
} from "lucide-react";

const GET_NOTES_DATA = gql`
  query GetNotesData {
    appointments {
      appointmentId
      scheduledStart
      status
      patient {
        firstName
        lastName
        mrn
      }
      practitioner {
        firstName
        lastName
      }
    }
  }
`;

export default function ClinicalNotesPage() {
  const { data, loading, error } = useQuery(GET_NOTES_DATA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [narrative, setNarrative] = useState("");

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
    </div>
  );

  const appointments = data?.appointments || [];
  const selectedNote = appointments.find((a: any) => a.appointmentId === selectedId) || appointments[0];

  return (
    <div className="flex h-full gap-4 overflow-hidden animate-in fade-in duration-700">
      {/* Notes List Sidebar */}
      <div className="w-[400px] flex flex-col gap-4 overflow-hidden">
        <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-xl p-6 flex flex-col gap-6 overflow-hidden h-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-tighter">Clinical Notes</h2>
              <p className="text-[10px] font-black text-[var(--primary)] tracking-widest uppercase">Documentation Registry</p>
            </div>
            <button className="p-3 bg-[var(--primary)] text-white rounded-xl shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input 
              placeholder="SEARCH NOTES OR PATIENTS..."
              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all uppercase"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-10 custom-scrollbar">
            {appointments.map((n: any) => (
              <div 
                key={n.appointmentId} 
                onClick={() => setSelectedId(n.appointmentId)}
                className={`p-5 rounded-[1.8rem] border transition-all cursor-pointer group ${
                  selectedId === n.appointmentId 
                    ? 'bg-[var(--primary)]/5 border-[var(--primary)]/30 shadow-lg' 
                    : 'bg-[var(--input-bg)]/50 border-[var(--card-border)] hover:border-[var(--primary)]/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                    n.status === 'IN_PROGRESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'
                  }`}>
                    {n.status}
                  </span>
                  <span className="text-[9px] font-black text-[var(--text-muted)]">
                    {new Date(n.scheduledStart).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-black uppercase mb-1">{n.patient?.firstName} {n.patient?.lastName}</h4>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Clinical Note</p>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedId === n.appointmentId ? 'translate-x-1 text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note Editor Area */}
      {selectedNote && (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl p-10 flex flex-col gap-8 h-full relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-8 shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-[var(--primary)]" />
                  </div>
                  <div>
                     <h1 className="text-2xl font-black tracking-tighter uppercase">{selectedNote.patient?.firstName} {selectedNote.patient?.lastName}</h1>
                     <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase">{selectedNote.patient?.mrn}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--card-border)]" />
                        <span className="text-[10px] font-black text-[var(--primary)] tracking-widest uppercase">Visit Documentation</span>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--primary-glow)] transition-all">
                    <Save className="w-4 h-4" /> Save Draft
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary-glow)] hover:opacity-90 transition-all">
                    <CheckCircle2 className="w-4 h-4" /> Finalize Note
                  </button>
               </div>
            </div>

            {/* Editor Placeholder */}
            <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide space-y-8">
               <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Attending Clinician</label>
                    <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-3">
                      <User className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-xs font-bold uppercase">{selectedNote.practitioner?.firstName} {selectedNote.practitioner?.lastName}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Documentation Status</label>
                    <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-3">
                      <Edit3 className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-xs font-bold uppercase">{selectedNote.status}</span>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Clinical Narrative</label>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Documentation Active</span>
                    </div>
                  </div>
                  <div className="group relative">
                    <textarea 
                      value={narrative}
                      onChange={(e) => setNarrative(e.target.value)}
                      placeholder={`Begin typing clinical documentation for ${selectedNote.patient?.firstName}... use / for smart templates.`}
                      className="w-full min-h-[500px] bg-[var(--input-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-10 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:italic placeholder:opacity-30 outline-none focus:border-[var(--primary)]/50 focus:shadow-[0_0_30px_var(--primary-glow)] transition-all resize-none scrollbar-hide"
                    />
                    
                    {/* Floating Formatting Helper */}
                    <div className="absolute bottom-6 right-10 flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                      <span>Press <span className="text-[var(--primary)]">/</span> for Smart Phrases</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span>Auto-Saving enabled</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Compliance Badge */}
            <div className="absolute bottom-8 right-8 flex items-center gap-2 px-4 py-2 bg-slate-500/5 rounded-full border border-white/5">
              <Lock className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">End-to-End HIPAA Encrypted Session</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
