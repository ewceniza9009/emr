"use client";

import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import {
  X,
  ShieldCheck,
  Calendar,
  FileText,
  Clock,
  Zap,
  CheckCircle2,
  Edit3,
  Save,
  Trash2,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import HalcyonPortal from "./Portal";

const UPDATE_DIRECTIVE = gql`
  mutation UpdateAdvanceDirective($command: UpdateAdvanceDirectiveCommandInput!) {
    updateAdvanceDirective(command: $command)
  }
`;

const REVOKE_DIRECTIVE = gql`
  mutation RevokeAdvanceDirective($command: RevokeAdvanceDirectiveCommandInput!) {
    revokeAdvanceDirective(command: $command)
  }
`;

interface DirectiveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  directive: {
    advanceDirectiveId: string;
    type: string;
    notes?: string;
    effectiveDate: string;
  } | null;
}

export default function DirectiveDetailModal({ isOpen, onClose, onSuccess, directive }: DirectiveDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  const [updateDirective, { loading: updating }] = useMutation(UPDATE_DIRECTIVE, {
    onCompleted: () => {
      setIsEditing(false);
      onSuccess?.();
    }
  });

  const [revokeDirective, { loading: revoking }] = useMutation(REVOKE_DIRECTIVE, {
    onCompleted: () => {
      onSuccess?.();
      onClose();
    }
  });

  if (!isOpen || !directive) return null;

  const handleStartEdit = () => {
    setEditNotes(directive.notes || "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateDirective({
      variables: {
        command: {
          advanceDirectiveId: directive.advanceDirectiveId,
          notes: editNotes
        }
      }
    });
  };

  const handleRevoke = () => {
    if (confirm("CRITICAL: Revoking this legal directive will remove it from active care planning. Proceed with forensic revocation?")) {
      revokeDirective({
        variables: {
          command: {
            advanceDirectiveId: directive.advanceDirectiveId
          }
        }
      });
    }
  };

  return (
    <HalcyonPortal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 !m-0 !p-0 z-[99999999] flex items-center justify-center p-6 overflow-hidden"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" />

        {/* Modal */}
        <div
          className="relative w-full max-w-lg flex flex-col bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-400" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-6 border-b border-[var(--card-border)] shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">
                  Legal Directive: {directive.type.replace(/_/g, ' ')}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    <Calendar className="w-3 h-3" />
                    Effective {new Date(directive.effectiveDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={handleStartEdit}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/40 transition-all"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar">
            <div className="space-y-3">
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                Directive Content & Clinical Instructions
              </p>
              
              {isEditing ? (
                <textarea
                  className="w-full h-40 bg-[var(--input-bg)] border border-[var(--primary)]/30 rounded-2xl p-6 text-sm leading-relaxed text-white font-medium outline-none focus:border-[var(--primary)] transition-all"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Enter updated clinical instructions or limitations..."
                />
              ) : (
                <div className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm leading-relaxed text-[var(--text-primary)] font-medium">
                  {directive.notes || "No specific instructions or limitations were documented for this directive. This status represents the patient's verified legal preference at the time of entry."}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">Verified</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Impact</p>
                <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase">Legally Binding</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-[9px] text-amber-600 font-medium">This record should be cross-referenced with physical documentation during critical clinical decisions.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-[var(--card-border)] shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="hidden sm:flex text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50 items-center gap-2">
                <Zap className="w-3 h-3" />
                Halkyone Clinical OS · Legal Archive
              </p>
              {!isEditing && (
                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="flex items-center gap-2 text-rose-500 text-[9px] font-black uppercase tracking-[0.2em] hover:text-rose-400 transition-all disabled:opacity-50"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Revoke Directive
                </button>
              )}
            </div>
            
            <button
              onClick={isEditing ? handleSaveEdit : onClose}
              disabled={updating || revoking}
              className={`px-8 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg ${
                isEditing ? "bg-[var(--primary)] shadow-[var(--primary-glow)]" : "bg-emerald-500 shadow-emerald-500/20"
              } hover:opacity-90 active:scale-95 disabled:opacity-50`}
            >
              {isEditing ? (updating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />) : null}
              {isEditing ? "Save Instructions" : "Acknowledged"}
            </button>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
