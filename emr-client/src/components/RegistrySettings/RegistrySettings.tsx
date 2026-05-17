"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Shield,
  Save,
  CheckCircle2,
  Database,
  Lock,
  Layout,
  Zap,
  Building2,
  Activity,
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import { useSession } from "next-auth/react";
import { useMutation, gql } from "@apollo/client";
import { useCommandModal } from "../CommandModalProvider";
import { PermissionGate } from "../PermissionGate";

import { UserPreferences, TenantConfig } from "./types";
import WorkstationTab from "./components/WorkstationTab";
import OrganizationTab from "./components/OrganizationTab";
import SecurityTab from "./components/SecurityTab";
import AlertsTab from "./components/AlertsTab";
import TelemetryTab from "./components/TelemetryTab";
import InfrastructureTab from "./components/InfrastructureTab";

export default function RegistrySettings() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "Admin";

  const [activeTab, setActiveTab] = useState("workstation");
  const {
    preferences,
    tenantConfig,
    updatePreferences,
    updateTenantConfig,
    isLoaded,
  } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const { confirm, alert } = useCommandModal();

  const [executeSync] = useMutation(gql`
    mutation SyncAllToElasticsearch {
      syncAllToElasticsearch
    }
  `);

  // Staged states for transactional saving
  const [stagedPrefs, setStagedPrefs] = useState<UserPreferences>(preferences);
  const [stagedTenant, setStagedTenant] = useState<TenantConfig>(tenantConfig);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setStagedPrefs(preferences);
      setStagedTenant(tenantConfig);
    }
  }, [isLoaded, preferences, tenantConfig]);

  const handleSave = async () => {
    setIsSaving(true);

    // Save User Preferences (Local)
    updatePreferences(stagedPrefs);

    // Save Tenant Configuration (Server-side)
    if (isAdmin) {
      await updateTenantConfig(stagedTenant);
    }

    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const tabs = [
    { id: "workstation", label: "WORKSTATION", icon: Layout, adminOnly: false },
    { id: "tenant", label: "ORGANIZATION", icon: Building2, adminOnly: true },
    { id: "security", label: "SECURITY", icon: Shield, adminOnly: true },
    { id: "notifications", label: "ALERTS", icon: Bell, adminOnly: false },
    { id: "telemetry", label: "TELEMETRY", icon: Activity, adminOnly: true },
    {
      id: "infrastructure",
      label: "INFRASTRUCTURE",
      icon: Database,
      adminOnly: true,
    },
  ];

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500 w-full p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 flex-1">
        {/* Compact Navigation */}
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${
                activeTab === tab.id
                  ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]"
              }`}
            >
              <tab.icon
                className={`w-4 h-4 ${
                  activeTab === tab.id
                    ? "text-[var(--sidebar-bg)]"
                    : "group-hover:text-[var(--primary)]"
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {tab.label}
              </span>
              <PermissionGate permission="setup:manage">
                {tab.adminOnly && (
                  <Lock className="w-2.5 h-2.5 ml-auto opacity-40" />
                )}
              </PermissionGate>
              {activeTab === tab.id && (
                <div className="absolute right-3 w-1 h-1 bg-[var(--sidebar-bg)] rounded-full" />
              )}
            </button>
          ))}

          <div className="mt-8 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-[0.2em]">
                Clinical Context
              </span>
            </div>
            <p className="text-[9px] text-[var(--text-muted)] leading-relaxed font-medium uppercase">
              Operational state is bound to{" "}
              <span className="text-indigo-400 font-black">
                {tenantConfig.organizationName}
              </span>{" "}
              and persists across all authenticated sessions.
            </p>
          </div>
        </nav>

        {/* Content Rail */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {activeTab === "workstation" && (
              <WorkstationTab
                theme={theme}
                toggleTheme={toggleTheme}
                stagedPrefs={stagedPrefs}
                setStagedPrefs={setStagedPrefs}
              />
            )}

            {activeTab === "tenant" && (
              <OrganizationTab
                stagedTenant={stagedTenant}
                setStagedTenant={setStagedTenant}
              />
            )}

            {activeTab === "telemetry" && (
              <TelemetryTab
                stagedTenant={stagedTenant}
                setStagedTenant={setStagedTenant}
              />
            )}

            {activeTab === "notifications" && (
              <AlertsTab
                stagedPrefs={stagedPrefs}
                setStagedPrefs={setStagedPrefs}
              />
            )}

            {activeTab === "infrastructure" && (
              <InfrastructureTab
                stagedTenant={stagedTenant}
                setStagedTenant={setStagedTenant}
                executeSync={executeSync}
                isSaving={isSaving}
                setIsSaving={setIsSaving}
                confirm={confirm}
                alert={alert}
              />
            )}

            {activeTab === "security" && (
              <SecurityTab
                stagedTenant={stagedTenant}
                setStagedTenant={setStagedTenant}
              />
            )}
          </div>

          {/* Tactical Footer */}
          <footer className="p-6 border-t border-[var(--card-border)] bg-[var(--input-bg)]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showSuccess && (
                <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>State Synchronized</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setStagedPrefs(preferences);
                  setStagedTenant(tenantConfig);
                }}
                className="px-4 py-2 text-[9px] font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-all"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-[var(--sidebar-bg)] rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[var(--primary-glow)] disabled:opacity-40"
              >
                {isSaving ? (
                  <div className="w-3 h-3 border-2 border-[var(--sidebar-bg)]/30 border-t-[var(--sidebar-bg)] rounded-full animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                {isSaving ? "Syncing Protocols..." : "Save"}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
