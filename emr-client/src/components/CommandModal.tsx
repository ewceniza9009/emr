"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, X, Check, Info } from "lucide-react";
import { useEffect, useState } from "react";

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "danger" | "warning" | "info" | "success";
  confirmText?: string;
  cancelText?: string;
  isAlert?: boolean;
  isPrompt?: boolean;
  onConfirmWithValue?: (value: string) => void;
  placeholder?: string;
  inputType?: "text" | "email" | "textarea";
}

export default function CommandModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning",
  confirmText = "Proceed",
  cancelText = "Cancel",
  isAlert = false,
  isPrompt = false,
  onConfirmWithValue,
  placeholder,
  inputType = "textarea"
}: CommandModalProps) {
  const [mounted, setMounted] = useState(false);
  const [promptValue, setPromptValue] = useState("");

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const typeStyles = {
    danger: {
      icon: ShieldAlert,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      btn: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
    },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
    },
    info: {
      icon: Info,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      btn: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
    },
    success: {
      icon: Check,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      btn: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
    }
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  // Helper to render message with beautiful copyable link if present
  const renderMessageContent = () => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.split(urlRegex);
    
    return (
      <div className="text-[var(--text-secondary)] text-sm leading-relaxed px-4 break-all whitespace-pre-wrap space-y-3">
        {parts.map((part, index) => {
          if (part.match(urlRegex)) {
            return (
              <div 
                key={index} 
                className="mt-4 p-4 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl flex flex-col gap-2 text-left relative overflow-hidden group hover:border-[var(--primary)]/30 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-gradient-to-br from-[var(--primary)]/5 to-transparent blur-md pointer-events-none" />
                <span className="text-[9px] font-black text-[var(--primary)] tracking-widest uppercase">
                  Secure Invitation Link
                </span>
                <div className="flex items-center gap-3">
                  <input
                    readOnly
                    value={part}
                    className="flex-1 bg-transparent text-xs text-[var(--text-primary)] border-none outline-none font-mono truncate"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(part);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-all font-black text-[10px] uppercase tracking-wider shadow-sm shadow-[var(--primary)]/10 hover:scale-[1.03] active:scale-[0.97]"
                  >
                    Copy
                  </button>
                </div>
              </div>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-2xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
          >
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-[var(--primary)]/5 to-transparent blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className={`w-20 h-20 rounded-full ${style.bg} ${style.border} border flex items-center justify-center ${style.color} shadow-lg shadow-black/10`}>
                <Icon className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-2 w-full">
                <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-widest uppercase">
                  {title}
                </h2>
                {renderMessageContent()}
              </div>

              {isPrompt && (
                <div className="w-full px-4">
                  {inputType === "textarea" ? (
                    <textarea
                      autoFocus
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      placeholder={placeholder || "Enter mandatory justification..."}
                      className="w-full h-32 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--primary)] transition-all resize-none font-medium"
                    />
                  ) : (
                    <input
                      type={inputType}
                      autoFocus
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      placeholder={placeholder || "Enter value..."}
                      className="w-full h-12 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--primary)] transition-all font-medium"
                    />
                  )}
                </div>
              )}

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => {
                    if (isPrompt && onConfirmWithValue) {
                      onConfirmWithValue(promptValue);
                    } else if (onConfirm) {
                      onConfirm();
                    }
                    onClose();
                  }}
                  disabled={isPrompt && !promptValue.trim()}
                  className={`w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${style.btn}`}
                >
                  {confirmText}
                </button>
                
                {!isAlert && (
                  <button
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] font-bold text-xs uppercase tracking-[0.2em] hover:text-[var(--text-primary)] hover:bg-[var(--divider-color)] transition-all active:scale-[0.98]"
                  >
                    {cancelText}
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--divider-color)] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

