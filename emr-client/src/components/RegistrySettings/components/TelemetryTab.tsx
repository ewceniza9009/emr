"use client";

import React from "react";
import { Activity, Clock, Zap } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import SectionLabel from "./SectionLabel";
import ProtocolToggle from "./ProtocolToggle";
import { TenantConfig } from "../types";

interface TelemetryTabProps {
  stagedTenant: TenantConfig;
  setStagedTenant: (config: TenantConfig) => void;
}

export default function TelemetryTab({
  stagedTenant,
  setStagedTenant,
}: TelemetryTabProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <SectionLabel
        title="SIGNALR & TELEMETRY"
        subtitle="Real-time Clinical Data Stream"
        icon={<Activity className="w-3.5 h-3.5" />}
        color="teal"
      />

      <PermissionGate permission="setup:manage">
        <div className="space-y-6">
          <ProtocolToggle
            title="Real-time Data Stream (SignalR)"
            desc="Master switch for all server-push clinical updates"
            checked={stagedTenant.enableSignalR}
            onChange={(val: boolean) =>
              setStagedTenant({
                ...stagedTenant,
                enableSignalR: val,
              })
            }
          />

          {stagedTenant.enableSignalR && (
            <div className="pt-6 space-y-6 border-t border-[var(--card-border)] animate-in fade-in slide-in-from-top-2 duration-300">
              <SectionLabel
                title="IOT CONFIGURATION"
                subtitle="Sensor Network Parameters"
                icon={<Zap className="w-3.5 h-3.5" />}
                color="amber"
              />

              <div className="space-y-6">
                <ProtocolToggle
                  title="Enable Clinical Telemetry"
                  desc="Synchronize patient vitals with live IoT sensors"
                  checked={stagedTenant.enableTelemetry}
                  onChange={(val: boolean) =>
                    setStagedTenant({
                      ...stagedTenant,
                      enableTelemetry: val,
                    })
                  }
                />

                {stagedTenant.enableTelemetry && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="clinical-label px-1">
                        TELEMETRY SYNC DELAY (SECONDS)
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">
                          <Clock className="w-4 h-4" />
                        </div>
                        <input
                          type="number"
                          value={stagedTenant.telemetryDelaySeconds}
                          onChange={(e) => {
                            const secs = parseInt(e.target.value) || 1;
                            setStagedTenant({
                              ...stagedTenant,
                              telemetryDelaySeconds: secs,
                              iotSyncIntervalMs: secs * 1000,
                            });
                          }}
                          className="w-full h-[58px] bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-12 pr-4 text-[10px] font-black uppercase tracking-tight text-[var(--text-primary)] focus:border-[var(--primary)] outline-none transition-all"
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="clinical-label px-1">
                        IOT DATA REFRESH (MILLISECONDS)
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">
                          <Zap className="w-4 h-4" />
                        </div>
                        <input
                          type="number"
                          value={stagedTenant.iotSyncIntervalMs}
                          onChange={(e) => {
                            const ms = parseInt(e.target.value) || 100;
                            setStagedTenant({
                              ...stagedTenant,
                              iotSyncIntervalMs: ms,
                              telemetryDelaySeconds: Math.ceil(ms / 1000),
                            });
                          }}
                          className="w-full h-[58px] bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-12 pr-4 text-[10px] font-black uppercase tracking-tight text-[var(--text-primary)] focus:border-[var(--primary)] outline-none transition-all"
                          step="100"
                          min="100"
                          max="60000"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </PermissionGate>
    </div>
  );
}
