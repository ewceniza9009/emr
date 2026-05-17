"use client";

import React from "react";
import { PhoneForwarded, PhoneOff } from "lucide-react";
import { OutreachTabProps } from "./types";
import DemographicsHUD from "./components/DemographicsHUD";
import ActiveScriptPanel from "./components/ActiveScriptPanel";
import IdentityHub from "./components/IdentityHub";
import ProxyRegistry from "./components/ProxyRegistry";
import QuickDispositionFooter from "./components/QuickDispositionFooter";

import UnenrollModal from "../../components/UnenrollModal";
import DispositionModal from "../../components/DispositionModal";

export default function OutreachTab({ state }: OutreachTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Active Call HUD */}
      {state.activeCall && (
        <div className="bg-teal-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-teal-900/40 animate-pulse ring-1 ring-teal-400/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white">
              <PhoneForwarded className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-white font-black text-[10px] uppercase tracking-widest leading-none">
                {state.activeCall.status}
              </p>
              <p className="text-teal-100 text-[11px] font-bold mt-1.5 opacity-80">
                {state.activeCall.phone || state.activeCall.phoneNumber}
              </p>
            </div>
          </div>
          <button
            onClick={() => state.setActiveCall(null)}
            className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Demographics Traits HUD */}
      <DemographicsHUD state={state} />

      {/* Dynamic Interaction Script Selector */}
      <ActiveScriptPanel state={state} />

      <div className="flex flex-col gap-4 shrink-0">
        {/* Contact Identity Channel manager */}
        <IdentityHub state={state} />

        {/* Relatives Proxy Registry */}
        <ProxyRegistry state={state} />
      </div>

      {/* Sticky Bottom Actions Grid */}
      <QuickDispositionFooter state={state} />

      {/* Forensic Reversal reason prompt */}
      <UnenrollModal state={state} />

      {/* Capture Notes & follow-up scheduler calendar */}
      <DispositionModal state={state} />
    </div>
  );
}
