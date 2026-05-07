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
  isAlert = false
}: CommandModalProps) {
  const [mounted, setMounted] = useState(false);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 p-8 shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-white/5 to-transparent blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className={`w-20 h-20 rounded-full ${style.bg} ${style.border} border flex items-center justify-center ${style.color}`}>
                <Icon className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                  {title}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed px-4">
                  {message}
                </p>
              </div>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    onClose();
                  }}
                  className={`w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] ${style.btn}`}
                >
                  {confirmText}
                </button>
                
                {!isAlert && (
                  <button
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all active:scale-[0.98]"
                  >
                    {cancelText}
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
