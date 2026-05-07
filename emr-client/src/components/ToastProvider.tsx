"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-5 pr-12 shadow-2xl animate-in slide-in-from-right-10 duration-500 relative flex items-center gap-4 min-w-[320px] backdrop-blur-xl"
          >
             <div className={`
               ${t.type === "success" ? "text-emerald-600" : ""}
               ${t.type === "error" ? "text-red-600" : ""}
               ${t.type === "info" ? "text-blue-600" : ""}
             `}>
                {t.type === "success" && <CheckCircle2 className="w-6 h-6" />}
                {t.type === "error" && <AlertCircle className="w-6 h-6" />}
                {t.type === "info" && <Info className="w-6 h-6" />}
             </div>
             <div>
                <p className="text-[var(--text-primary)] font-bold text-sm">{t.message}</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-0.5">Clinical Notification</p>
             </div>
             <button 
               onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
               className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
             >
               <X className="w-4 h-4" />
             </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

