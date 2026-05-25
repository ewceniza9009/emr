"use client";

import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { X, ClipboardList, Send, Activity, User } from "lucide-react";
import HalcyonPortal from "./Portal";
import { PermissionGate } from "./PermissionGate";

const SAVE_TRIAGE_NOTE = gql`
  mutation UpdateTriageNote($input: UpdateTriageNoteCommandInput!) {
    updateTriageNote(input: $input)
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
          triageNote: `[Triage: ${urgency}] ${content}`
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-500" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-[450px] bg-[rgba(var(--card-bg-rgb),0.95)] backdrop-blur-2xl shadow-[-30px_0_80px_rgba(0,0,0,0.15)] 
          flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-l border-[var(--card-border)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

          {/* Clinical Header */}
          <div className="py-6 px-8 border-b border-[var(--card-border)] bg-[rgba(var(--card-bg-rgb),0.5)] flex items-center justify-between shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 relative shadow-inner">
                <ClipboardList className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none mb-1">
                  Clinical Triage Note
                </h2>
                <div className="flex items-center gap-1.5 mt-1 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  <User className="w-3 h-3 text-amber-500/60" />
                  <span>{patientName}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-9 h-9 rounded-xl bg-amber-500/5 dark:bg-white/5 border border-amber-500/10 dark:border-white/5 flex items-center justify-center text-amber-500 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white transition-all duration-300 hover:rotate-90 active:scale-95 relative z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
            <section className="space-y-4">
              <label className="clinical-label">Priority Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['Routine', 'Urgent', 'Emergency'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 duration-300
                      ${urgency === level 
                        ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/10' 
                        : 'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-amber-500/30 hover:text-[var(--text-primary)]'}`}
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
                className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-[1.5rem] p-5 text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 h-72 focus:outline-none focus:border-amber-500/30 transition-all resize-none scrollbar-hide shadow-inner font-inter leading-relaxed"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Document immediate symptom management needs or hand-off instructions for the attending practitioner..."
              />
            </section>
          </form>

          {/* Action Footer */}
          <div className="p-6 bg-[rgba(var(--card-bg-rgb),0.5)] border-t border-[var(--card-border)] mt-auto">
            <PermissionGate permission="clinical:chart">
              <button 
                type="submit" 
                onClick={handleSubmit}
                disabled={loading || !content.trim()}
                className="group w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed
                          text-black font-black text-[10px] uppercase tracking-[0.25em] transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                {loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
