"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import CommandModal from "./CommandModal";

interface ModalOptions {
  title: string;
  message: string;
  type?: "danger" | "warning" | "info" | "success";
  confirmText?: string;
  cancelText?: string;
}

interface CommandModalContextType {
  confirm: (options: ModalOptions) => Promise<boolean>;
  alert: (options: ModalOptions) => Promise<void>;
}

const CommandModalContext = createContext<CommandModalContextType | undefined>(undefined);

export function CommandModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ModalOptions;
    resolve: (value: boolean) => void;
    isAlert: boolean;
  } | null>(null);

  const confirm = useCallback((options: ModalOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve,
        isAlert: false
      });
    });
  }, []);

  const alert = useCallback((options: ModalOptions) => {
    return new Promise<void>((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve: () => resolve(),
        isAlert: true
      });
    });
  }, []);

  const handleClose = () => {
    if (state) {
      state.resolve(false);
      setState(null);
    }
  };

  const handleConfirm = () => {
    if (state) {
      state.resolve(true);
      setState(null);
    }
  };

  return (
    <CommandModalContext.Provider value={{ confirm, alert }}>
      {children}
      {state && (
        <CommandModal
          isOpen={state.isOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={state.options.title}
          message={state.options.message}
          type={state.options.type}
          confirmText={state.options.confirmText}
          cancelText={state.options.cancelText}
          isAlert={state.isAlert}
        />
      )}
    </CommandModalContext.Provider>
  );
}

export function useCommandModal() {
  const context = useContext(CommandModalContext);
  if (!context) {
    throw new Error("useCommandModal must be used within a CommandModalProvider");
  }
  return context;
}
