import React from "react";
import { Calendar } from "lucide-react";
import { PermissionGate } from "../../PermissionGate";
import { ConfirmModalState } from "../types";

interface RecalculateModalProps {
  confirmModal: ConfirmModalState;
  onClose: () => void;
}

export default function RecalculateModal({ confirmModal, onClose }: RecalculateModalProps) {
  if (!confirmModal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mx-auto border border-[var(--primary)]/20">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            {confirmModal.title}
          </h3>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            {confirmModal.message}
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <PermissionGate permission="scheduling:manage">
              <button
                onClick={() => {
                  confirmModal.onConfirm(true);
                  onClose();
                }}
                className="py-2 px-3 rounded-lg bg-[var(--primary)] text-white font-bold text-xs shadow-md shadow-[var(--primary-glow)] hover:opacity-90 transition-all active:scale-[0.97]"
              >
                Recalc Travel
              </button>
            </PermissionGate>
            <PermissionGate permission="scheduling:manage">
              <button
                onClick={() => {
                  confirmModal.onConfirm(false);
                  onClose();
                }}
                className="py-2 px-3 rounded-lg bg-[var(--input-bg)] text-[var(--text-secondary)] font-bold text-xs border border-[var(--card-border)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/30 transition-all active:scale-[0.97]"
              >
                Keep Current
              </button>
            </PermissionGate>
          </div>
          <button
            onClick={onClose}
            className="py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
