"use client";

import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { X, ClipboardList, Send, Activity, User } from "lucide-react";
import HalcyonPortal from "./Portal";
import { PermissionGate } from "./PermissionGate";

const SAVE_TRIAGE_NOTE = gql`
  mutation SaveTriageNote($input: SaveClinicalNoteCommandInput!) {
    saveClinicalNote(input: $input)
  }
`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess: () => void;
}

export default function TriageNoteDrawer({ isOpen, onClose, patientId, patientName, onSuccess }: Props) {
  const [content, setContent] = useState("");
  const [urgency, setUrgency] = useState("Routine");

  const [saveNote, { loading }] = useMutation(SAVE_TRIAGE_NOTE, {
    onCompleted: () => {
      onSuccess();
      onClose();
      setContent("");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    saveNote({
      variables: {
        input: {
          patientId,
          content: `[Triage: ${urgency}] ${content}`,
          type: "Triage"
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-500" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-[450px] bg-[var(--sidebar-bg)] shadow-[-30px_0_80px_rgba(0,0,0,0.5)] 
          flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-l border-white/5
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

          {/* Clinical Header */}
          <div className="h-20 w-full flex items-center justify-between px-8 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-white/5 shrink-0">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <ClipboardList className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">Clinical Triage Note</h2>
                <div className="flex items-center gap-2 mt-2">
                  <User className="w-3 h-3 text-amber-500/50" />
                  <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{patientName}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-[var(--text-muted)] hover:text-rose-500 group">
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            <section className="space-y-4">
              <label className="clinical-label">Priority Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['Routine', 'Urgent', 'Emergency'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                      ${urgency === level 
                        ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/20' 
                        : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:border-white/10'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <label className="clinical-label">Clinical Observations & Instructions</label>
              <textarea 
                required
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-medium text-[var(--text-primary)] placeholder:text-white/10 h-64 focus:outline-none focus:border-amber-500/30 transition-all resize-none scrollbar-hide shadow-inner"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Document immediate symptom management needs or hand-off instructions for the attending practitioner..."
              />
            </section>
          </form>

          {/* Action Footer */}
          <div className="p-8 bg-black/20 backdrop-blur-2xl border-t border-white/5 mt-auto">
            <PermissionGate permission="clinical:chart">
              <button 
                type="submit" 
                onClick={handleSubmit}
                disabled={loading || !content.trim()}
                className="group w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed
                          text-black font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <span>Log Triage Record</span>
                  </>
                )}
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
