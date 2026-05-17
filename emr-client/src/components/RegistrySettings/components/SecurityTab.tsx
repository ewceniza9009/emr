"use client";

import React from "react";
import { Shield, Clock, Lock } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import SectionLabel from "./SectionLabel";
import ProtocolToggle from "./ProtocolToggle";
import SelectField from "./SelectField";
import { TenantConfig } from "../types";

interface SecurityTabProps {
  stagedTenant: TenantConfig;
  setStagedTenant: (config: TenantConfig) => void;
}

export default function SecurityTab({
  stagedTenant,
  setStagedTenant,
}: SecurityTabProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <SectionLabel
        title="SECURITY PROTOCOLS"
        subtitle="Environmental Hardening"
        icon={<Shield className="w-3.5 h-3.5" />}
        color="rose"
      />

      <PermissionGate permission="setup:manage">
        <div className="grid grid-cols-1 gap-6">
          <ProtocolToggle
            title="Multi-Factor Authentication (MFA)"
            desc="Require TOTP verification for all clinical workstations"
            checked={stagedTenant.enforceMfa}
            onChange={(val: boolean) =>
              setStagedTenant({ ...stagedTenant, enforceMfa: val })
            }
          />

          <ProtocolToggle
            title="Strict Onboarding Mode"
            desc="Disable public registration; require cryptographic invitations"
            checked={stagedTenant.strictOnboarding}
            onChange={(val: boolean) =>
              setStagedTenant({
                ...stagedTenant,
                strictOnboarding: val,
              })
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <SelectField
              label="CLINICAL SESSION TIMEOUT"
              value={stagedTenant.sessionTimeoutMinutes.toString()}
              onChange={(v: string) =>
                setStagedTenant({
                  ...stagedTenant,
                  sessionTimeoutMinutes: parseInt(v),
                })
              }
              options={[
                { value: "15", label: "15 MINUTES (HIGH SECURITY)" },
                { value: "30", label: "30 MINUTES (BALANCED)" },
                { value: "60", label: "60 MINUTES (STANDARD)" },
                { value: "240", label: "4 HOURS (EXTENDED)" },
              ]}
              icon={<Clock className="w-3.5 h-3.5" />}
            />
          </div>

          <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tighter">
                Forensic Vault Linkage
              </h4>
              <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-relaxed">
                Security state changes are permanently logged in the{" "}
                <span className="text-rose-500">Security Audit Registry</span>{" "}
                for compliance oversight.
              </p>
            </div>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}
