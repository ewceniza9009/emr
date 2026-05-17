"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import CommandModal from "./CommandModal";

interface ModalOptions {
  title: string;
  message: string;
  type?: "danger" | "warning" | "info" | "success";
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  inputType?: "text" | "email" | "textarea";
}

interface CommandModalContextType {
  confirm: (options: ModalOptions) => Promise<boolean>;
  alert: (options: ModalOptions) => Promise<void>;
  prompt: (options: ModalOptions) => Promise<string | null>;
}

const CommandModalContext = createContext<CommandModalContextType | undefined>(undefined);

export function CommandModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ModalOptions;
    resolve: (value: any) => void;
    isAlert: boolean;
    isPrompt: boolean;
  } | null>(null);

  const confirm = useCallback((options: ModalOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve,
        isAlert: false,
        isPrompt: false
      });
    });
  }, []);

  const alert = useCallback((options: ModalOptions) => {
    return new Promise<void>((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve: () => resolve(),
        isAlert: true,
        isPrompt: false
      });
    });
  }, []);

  const prompt = useCallback((options: ModalOptions) => {
    return new Promise<string | null>((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve,
        isAlert: false,
        isPrompt: true
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
    <CommandModalContext.Provider value={{ confirm, alert, prompt }}>
      {children}
      {state && (
        <CommandModal
          isOpen={state.isOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          onConfirmWithValue={(val) => {
            state.resolve(val);
            setState(null);
          }}
          title={state.options.title}
          message={state.options.message}
          type={state.options.type}
          confirmText={state.options.confirmText}
          cancelText={state.options.cancelText}
          placeholder={state.options.placeholder}
          isAlert={state.isAlert}
          isPrompt={state.isPrompt}
          inputType={state.options.inputType}
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

