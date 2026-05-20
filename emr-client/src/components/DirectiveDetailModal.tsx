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
  RotateCcw,
  Printer
} from "lucide-react";
import HalcyonPortal from "./Portal";
import SmartTextarea from "./SmartTextarea";
import { useSmartPhrases } from "@/hooks/useSmartPhrases";
import { useCommandModal } from "./CommandModalProvider";


const UPDATE_DIRECTIVE = gql`
  mutation UpdateAdvanceDirective($command: UpdateCoordinationAdvanceDirectiveInput!) {
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
  patientId: string;
  directive: {
    advanceDirectiveId: string;
    type: string;
    notes?: string;
    effectiveDate: string;
  } | null;
  allDirectives?: Array<{
    advanceDirectiveId: string;
    type: string;
    notes?: string;
    effectiveDate: string;
    isActive: boolean;
  }>;
}

export default function DirectiveDetailModal({ isOpen, onClose, onSuccess, patientId, directive, allDirectives }: DirectiveDetailModalProps) {
  const { smartPhrases } = useSmartPhrases();
  const { confirm } = useCommandModal();
  const [isEditing, setIsEditing] = useState(false);

  const [editNotes, setEditNotes] = useState("");

  const history = (allDirectives || [])
    .filter((d) => d.type === directive?.type)
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

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

  const handlePrintProtocol = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const directiveNotes = directive?.notes || "No specific instructions documented.";
    const effectiveDateStr = directive ? new Date(directive.effectiveDate).toLocaleDateString(undefined, { dateStyle: "long" }) : "";

    printWindow.document.write(`
      <html>
        <head>
          <title>Comfort Measures DNR Protocol - ${patientId}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            .header { border-bottom: 3px double #cbd5e1; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .header h1 { font-size: 24px; font-weight: 900; color: #b91c1c; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
            .header p { font-size: 10px; font-weight: bold; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px; }
            .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 25px; margin-bottom: 15px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background-color: #f8fafc; }
            .card-label { font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 3px; }
            .card-value { font-size: 12px; font-weight: bold; color: #0f172a; }
            .notes { border: 1px solid #fecaca; background-color: #fef2f2; padding: 15px; border-radius: 8px; font-size: 13px; font-weight: 600; line-height: 1.6; color: #991b1b; }
            .clinical-guide { margin-top: 20px; font-size: 12px; border: 1px dashed #cbd5e1; padding: 15px; border-radius: 8px; }
            .guide-item { margin-bottom: 10px; }
            .guide-item strong { color: #b91c1c; }
            .signatures { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-top: 50px; }
            .sig-line { border-top: 1px solid #475569; margin-top: 40px; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b; text-align: center; }
            .footer { text-align: center; font-size: 9px; font-weight: bold; color: #94a3b8; margin-top: 60px; text-transform: uppercase; letter-spacing: 2px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
          </style>
        </head>
        <body onload="window.print();">
          <div class="header">
            <h1>Comfort Measures DNR Protocol</h1>
            <p>Halkyone Clinical Command Center &middot; Forensic Care Registry</p>
          </div>

          <div class="section-title">Patient Identification</div>
          <div class="grid">
            <div class="card">
              <div class="card-label">Patient Unique Identifier</div>
              <div class="card-value">${patientId}</div>
            </div>
            <div class="card">
              <div class="card-label">Directive Status</div>
              <div class="card-value" style="color: #10b981;">VERIFIED LEGAL DIRECTIVE (ACTIVE)</div>
            </div>
            <div class="card">
              <div class="card-label">Directive Type</div>
              <div class="card-value">${directive?.type.replace(/_/g, ' ')}</div>
            </div>
            <div class="card">
              <div class="card-label">Effective Date</div>
              <div class="card-value">${effectiveDateStr}</div>
            </div>
          </div>

          <div class="section-title">Legal & Clinical Limitations</div>
          <div class="notes">
            ${directiveNotes}
          </div>

          <div class="section-title">Emergency Bedside Symptom Protocol</div>
          <div class="clinical-guide">
            <div class="guide-item">
              &bull; <strong>DNR Order:</strong> In the event of cardiac or respiratory arrest, DO NOT attempt cardiopulmonary resuscitation (CPR), endotracheal intubation, mechanical ventilation, or cardiac defibrillation.
            </div>
            <div class="guide-item">
              &bull; <strong>Pain & Dyspnea:</strong> Administer <strong>0.25 mL (5 mg)</strong> sublingual liquid morphine concentrate every 1-2 hours as needed for breakthrough pain or severe air hunger (respiratory rate > 25/min).
            </div>
            <div class="guide-item">
              &bull; <strong>Agitation & Panic:</strong> Administer <strong>0.5 mg</strong> sublingual Lorazepam as needed for accompanying panic, severe air hunger, or clinical distress.
            </div>
            <div class="guide-item">
              &bull; <strong>Distress Triggers:</strong> Sit patient upright, lean slightly forward, and run a cool fan blowing directly across their face to stimulate trigeminal receptors.
            </div>
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line">Attending Practitioner Signature & Date</div>
            </div>
            <div>
              <div class="sig-line">Medical Director / Registrar Signature & Date</div>
            </div>
          </div>

          <div class="footer">
            CONFIDENTIAL PHI &middot; STRICTLY AUDITED REGISTRY SYSTEM &middot; SECURE SYSTEM REFERENCE ID: AD-${directive?.advanceDirectiveId.slice(0,8).toUpperCase()}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen || !directive) return null;

  const handleStartEdit = () => {
    setEditNotes(directive.notes || "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateDirective({
      variables: {
        command: {
          patientId: patientId,
          type: directive.type,
          isActive: true,
          notes: editNotes,
          effectiveDate: new Date().toISOString()
        }
      }
    });
  };

  const handleRevoke = async () => {
    const ok = await confirm({
      title: "CRITICAL: FORENSIC REVOCATION",
      message: "Revoking this legal directive will remove it from active care planning. Proceed with forensic revocation?",
      type: "danger",
      confirmText: "Revoke Directive",
      cancelText: "Cancel"
    });

    if (ok) {
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
        className="fixed inset-0 !m-0 z-[99999999] flex items-center justify-center p-6 overflow-hidden"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" />

        {/* Modal */}
        <div
          className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[1.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-400" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-[var(--card-border)] shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
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
                <SmartTextarea
                  style={{ color: 'var(--text-primary)' }}
                  className="w-full h-40 bg-[var(--input-bg)] border border-[var(--primary)]/30 rounded-2xl p-6 text-sm leading-relaxed !text-[var(--text-primary)] font-medium outline-none focus:border-[var(--primary)] transition-all"
                  value={editNotes}
                  onChange={(val) => setEditNotes(val)}
                  smartPhrases={smartPhrases}
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

            {/* Version History Timeline */}
            {history.length > 1 && (
              <div className="pt-6 border-t border-[var(--card-border)] space-y-4">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Version History & Modification Trail
                </p>
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--card-border)]">
                  {history.map((ver) => {
                    const isVerActive = ver.isActive;
                    return (
                      <div key={ver.advanceDirectiveId} className="relative pl-8 space-y-1">
                        {/* Dot indicator */}
                        <div className={`absolute left-[9.5px] top-1.5 w-2 h-2 rounded-full border ${
                          isVerActive 
                            ? "bg-emerald-500 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.6)]" 
                            : "bg-[var(--sidebar-bg)] border-[var(--text-muted)] opacity-60"
                        }`} />
                        
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9.5px] font-bold text-[var(--text-primary)]">
                            {new Date(ver.effectiveDate).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            isVerActive 
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                              : "bg-white/5 text-[var(--text-muted)] border border-white/10"
                          }`}>
                            {isVerActive ? "Active (Current)" : "Superseded"}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] bg-[var(--input-bg)]/40 p-3 rounded-xl border border-[var(--card-border)]/50 leading-relaxed font-medium">
                          {ver.notes || "No clinical instructions documented."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-[var(--card-border)] shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="hidden sm:flex text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50 items-center gap-2">
                <Zap className="w-3 h-3" />
                Halkyone Clinical OS · Legal Archive
              </p>
              {!isEditing && (
                <>
                  <button
                    onClick={handleRevoke}
                    disabled={revoking}
                    className="flex items-center gap-2 text-rose-500 text-[9px] font-black uppercase tracking-[0.2em] hover:text-rose-400 transition-all disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Revoke Directive
                  </button>
                  <button
                    onClick={handlePrintProtocol}
                    className="flex items-center gap-2 text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] hover:text-blue-350 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Bedside Protocol
                  </button>
                </>
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
