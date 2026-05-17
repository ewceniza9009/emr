"use client";

import React from "react";
import { Database, RefreshCw } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import SectionLabel from "./SectionLabel";
import ProtocolToggle from "./ProtocolToggle";
import { TenantConfig } from "../types";

interface InfrastructureTabProps {
  stagedTenant: TenantConfig;
  setStagedTenant: (config: TenantConfig) => void;
  executeSync: () => Promise<any>;
  isSaving: boolean;
  setIsSaving: (val: boolean) => void;
  confirm: (opts: any) => Promise<boolean>;
  alert: (opts: any) => Promise<void>;
}

export default function InfrastructureTab({
  stagedTenant,
  setStagedTenant,
  executeSync,
  isSaving,
  setIsSaving,
  confirm,
  alert,
}: InfrastructureTabProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <SectionLabel
        title="CORE INFRASTRUCTURE"
        subtitle="System Engine Management"
        icon={<Database className="w-3.5 h-3.5" />}
        color="teal"
      />

      <PermissionGate permission="setup:manage">
        <div className="space-y-6">
          <ProtocolToggle
            title="Elasticsearch Core"
            desc="High-performance clinical search engine (v7.17)"
            checked={stagedTenant.enableElasticsearch}
            onChange={(val: boolean) =>
              setStagedTenant({
                ...stagedTenant,
                enableElasticsearch: val,
              })
            }
          />

          <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tighter">
                  Registry Synchronization
                </h4>
                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Push all existing nodes to the search cluster
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const ok = await confirm({
                  title: "Trigger Bulk Sync",
                  message:
                    "Are you sure you want to re-index all clinical nodes? This will refresh the entire search registry and may temporarily increase system load.",
                  confirmText: "Initialize Synchronization",
                });
                if (ok) {
                  setIsSaving(true);
                  try {
                    await executeSync();
                    await alert({
                      title: "Sync Complete",
                      message:
                        "All clinical nodes have been successfully synchronized with the search cluster.",
                      type: "success",
                    });
                  } finally {
                    setIsSaving(false);
                  }
                }
              }}
              className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
            >
              Re-Index All Nodes
            </button>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}
