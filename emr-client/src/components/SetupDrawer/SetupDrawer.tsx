"use client";

import React from "react";
import {
  X,
  Activity,
  CheckCircle,
  Shield,
  Building2,
  Stethoscope,
  Pill,
  Zap,
  MessageSquare,
} from "lucide-react";
import HalcyonPortal from "../Portal";
import { PermissionGate } from "../PermissionGate";
import { SetupDrawerProps } from "./types";
import useSetupState from "./hooks/useSetupState";
import PractitionerForm from "./components/PractitionerForm";
import FacilityForm from "./components/FacilityForm";
import GenericForm from "./components/GenericForm";

export default function SetupDrawer(props: SetupDrawerProps) {
  const { open, type, initialData, onClose } = props;
  const state = useSetupState(props);

  if (!open) return null;

  const title =
    type === "equipment"
      ? "Equipment"
      : type
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .slice(0, -1);
  const isEdit = !!initialData;

  const Icon =
    {
      practitioners: Shield,
      facilities: Building2,
      healthPlans: Stethoscope,
      medications: Pill,
      smartPhrases: Activity,
      questionnaires: CheckCircle,
      equipment: Zap,
      outreachScripts: MessageSquare,
      integrationProfiles: Shield,
    }[type] || Zap;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-[var(--background)]/40 backdrop-blur-md animate-in fade-in duration-300"
          onClick={onClose}
        />

        <div className="relative h-full w-full max-w-[450px] bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="h-20 px-8 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--sidebar-bg)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  {isEdit ? "Edit" : "New"} {title}
                </h2>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Setup Registry · Clinical Master
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--input-bg)] rounded-xl transition-all"
            >
              <X className="w-6 h-6 text-[var(--text-muted)]" />
            </button>
          </div>

          <form
            onSubmit={state.handleSubmit}
            className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide"
          >
            {type === "practitioners" && (
              <PractitionerForm form={state.form} onChange={state.setForm} />
            )}

            {type === "facilities" && (
              <FacilityForm form={state.form} onChange={state.setForm} />
            )}

            {type !== "practitioners" && type !== "facilities" && (
              <GenericForm
                type={type}
                form={state.form}
                onChange={state.setForm}
              />
            )}

            {state.error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs animate-in fade-in duration-300">
                {state.error.message}
              </div>
            )}
          </form>

          <div className="p-8 border-t border-[var(--card-border)] bg-[var(--sidebar-bg)]">
            <PermissionGate permission="setup:manage">
              <button
                type="submit"
                onClick={() => state.handleSubmit()}
                disabled={state.loading}
                className="w-full py-4 rounded-xl bg-[var(--primary)] text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                {state.loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" /> <span>Save</span>
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
