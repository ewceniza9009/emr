"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Clock,
  DollarSign,
  Bell,
  Shield,
  User,
  Save,
  CheckCircle2,
  ChevronRight,
  Languages,
  Database,
  Lock,
  Eye,
  Settings,
  Moon,
  Sun,
  Layout,
  RefreshCw,
  Zap,
  Building2,
  ServerCrash,
  Activity,
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import { useSession } from "next-auth/react";
import { useMutation, gql } from "@apollo/client";
import { useCommandModal } from "./CommandModalProvider";
import { PermissionGate } from "./PermissionGate";

const timezones = [
  { value: "UTC", label: "UTC (COORDINATED UNIVERSAL TIME)" },
  { value: "Asia/Manila", label: "ASIA/MANILA (PHT - PHILIPPINE TIME)" },
  { value: "America/New_York", label: "AMERICA/NEW_YORK (EST/EDT)" },
  { value: "Europe/London", label: "EUROPE/LONDON (GMT/BST)" },
  { value: "Asia/Singapore", label: "ASIA/SINGAPORE (SGT)" },
];

// Add local browser timezone if not present
if (typeof window !== "undefined") {
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!timezones.find((tz) => tz.value === localTz)) {
    timezones.push({
      value: localTz,
      label: `${localTz.toUpperCase()} (LOCAL BROWSER TIME)`,
    });
  }
}

const currencies = [
  { value: "PHP", label: "PHP - PHILIPPINE PESO (₱)", symbol: "₱" },
  { value: "USD", label: "USD - US DOLLAR ($)", symbol: "$" },
  { value: "EUR", label: "EUR - EURO (€)", symbol: "€" },
  { value: "GBP", label: "GBP - BRITISH POUND (£)", symbol: "£" },
];

const languages = [
  { value: "en", label: "ENGLISH (US)" },
  { value: "tl", label: "TAGALOG (FILIPINO)" },
  { value: "es", label: "SPANISH" },
];

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
  const [stagedPrefs, setStagedPrefs] = useState(preferences);
  const [stagedTenant, setStagedTenant] = useState(tenantConfig);

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
                className={`w-4 h-4 ${activeTab === tab.id ? "text-[var(--sidebar-bg)]" : "group-hover:text-[var(--primary)]"}`}
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
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <SectionLabel
                  title="INTERFACE PREFERENCES"
                  subtitle="Workstation Display"
                  icon={<Layout className="w-3.5 h-3.5" />}
                  color="amber"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ControlCard
                    title="Interface Mode"
                    subtitle="Switch between High-Contrast modes"
                    icon={
                      theme === "dark" ? (
                        <Moon className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-400" />
                      )
                    }
                    action={
                      <div
                        onClick={toggleTheme}
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${theme === "dark" ? "bg-indigo-600" : "bg-amber-400"}`}
                      >
                        <div
                          className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${theme === "dark" ? "left-6" : "left-1"}`}
                        />
                      </div>
                    }
                  />

                  <ControlCard
                    title="Data Density"
                    subtitle="Optimize for professional displays"
                    icon={<Eye className="w-4 h-4 text-emerald-400" />}
                    action={
                      <div
                        onClick={() =>
                          setStagedPrefs({
                            ...stagedPrefs,
                            compactMode: !stagedPrefs.compactMode,
                          })
                        }
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${stagedPrefs.compactMode ? "bg-emerald-600" : "bg-slate-700"}`}
                      >
                        <div
                          className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${stagedPrefs.compactMode ? "left-6" : "left-1"}`}
                        />
                      </div>
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "tenant" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <SectionLabel
                  title="ORGANIZATION PROTOCOLS"
                  subtitle="Global Clinical Parameters"
                  icon={<Building2 className="w-3.5 h-3.5" />}
                  color="teal"
                />

                <PermissionGate permission="setup:manage">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField
                      label="SYSTEM TIME ZONE"
                      value={stagedTenant.timezone}
                      onChange={(v: string) =>
                        setStagedTenant({ ...stagedTenant, timezone: v })
                      }
                      options={timezones}
                      icon={<Clock className="w-3.5 h-3.5" />}
                    />
                    <SelectField
                      label="BASE CURRENCY"
                      value={stagedTenant.currency}
                      onChange={(v: string) =>
                        setStagedTenant({ ...stagedTenant, currency: v })
                      }
                      options={currencies}
                      icon={<DollarSign className="w-3.5 h-3.5" />}
                    />
                    <SelectField
                      label="DEFAULT LANGUAGE"
                      value={stagedTenant.language}
                      onChange={(v: string) =>
                        setStagedTenant({ ...stagedTenant, language: v })
                      }
                      options={languages}
                      icon={<Languages className="w-3.5 h-3.5" />}
                    />
                    <SelectField
                      label="DATE DISPLAY PROTOCOL"
                      value={stagedTenant.dateFormat}
                      onChange={(v: string) =>
                        setStagedTenant({ ...stagedTenant, dateFormat: v })
                      }
                      options={[
                        { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
                        { value: "DD/MM/YYYY", label: "DD/MM/YYYY (INTL)" },
                        { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
                      ]}
                      icon={<Activity className="w-3.5 h-3.5" />}
                    />
                  </div>

                  <div className="pt-6 space-y-6">
                    <SectionLabel
                      title="SCHEDULING BUCKETS"
                      subtitle="Operational Slot Distribution"
                      icon={<Clock className="w-3.5 h-3.5" />}
                      color="amber"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <SelectField
                        label="AM BUCKET START"
                        value={stagedTenant.amStartHour.toString()}
                        onChange={(v: string) =>
                          setStagedTenant({
                            ...stagedTenant,
                            amStartHour: parseInt(v),
                          })
                        }
                        options={Array.from({ length: 12 }, (_, i) => ({
                          value: (i + 1).toString(),
                          label: `${i + 1}:00 AM`,
                        }))}
                        icon={<Clock className="w-3.5 h-3.5" />}
                      />
                      <SelectField
                        label="PM BUCKET START"
                        value={stagedTenant.pmStartHour.toString()}
                        onChange={(v: string) =>
                          setStagedTenant({
                            ...stagedTenant,
                            pmStartHour: parseInt(v),
                          })
                        }
                        options={Array.from({ length: 24 }, (_, i) => ({
                          value: i.toString(),
                          label:
                            i === 12
                              ? "12:00 PM"
                              : i > 12
                                ? `${i - 12}:00 PM`
                                : `${i}:00 AM`,
                        }))}
                        icon={<Clock className="w-3.5 h-3.5" />}
                      />
                      <SelectField
                        label="OPERATIONAL DAY END"
                        value={stagedTenant.dayEndHour.toString()}
                        onChange={(v: string) =>
                          setStagedTenant({
                            ...stagedTenant,
                            dayEndHour: parseInt(v),
                          })
                        }
                        options={Array.from({ length: 24 }, (_, i) => ({
                          value: i.toString(),
                          label:
                            i === 12
                              ? "12:00 PM"
                              : i > 12
                                ? `${i - 12}:00 PM`
                                : `${i}:00 AM`,
                        }))}
                        icon={<Clock className="w-3.5 h-3.5" />}
                      />
                    </div>
                  </div>
                </PermissionGate>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <SectionLabel
                  title="ALERT PROTOCOLS"
                  subtitle="Notification Management"
                  icon={<Bell className="w-3.5 h-3.5" />}
                  color="rose"
                />
                <div className="space-y-3">
                  <ProtocolToggle
                    title="Browser Push Alerts"
                    desc="Real-time clinical state synchronization"
                    checked={stagedPrefs.notificationsEnabled}
                    onChange={(val: boolean) =>
                      setStagedPrefs({
                        ...stagedPrefs,
                        notificationsEnabled: val,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "infrastructure" && (
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
                          // This calls the SyncAllToElasticsearch mutation we added earlier
                          const ok = await confirm({
                            title: "Trigger Bulk Sync",
                            message:
                              "Are you sure you want to re-index all clinical nodes? This will refresh the entire search registry and may temporarily increase system load.",
                            confirmText: "Initialize Synchronization",
                          });
                          if (ok) {
                            setIsSaving(true);
                            try {
                              await executeSync(); // We'll add this hook below
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
            )}

            {activeTab === "security" && (
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
                          <span className="text-rose-500">
                            Security Audit Registry
                          </span>{" "}
                          for compliance oversight.
                        </p>
                      </div>
                    </div>
                  </div>
                </PermissionGate>
              </div>
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
              <button className="px-4 py-2 text-[9px] font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-all">
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
                {isSaving ? "Syncing Protocols..." : "Commit Changes"}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

interface SectionLabelProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "amber" | "teal" | "rose";
}

function SectionLabel({ title, subtitle, icon, color }: SectionLabelProps) {
  const colors: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-500",
    teal: "bg-[var(--primary)]/10 text-[var(--primary)]",
    rose: "bg-rose-500/10 text-rose-500",
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest leading-none">
          {title}
        </h2>
        <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

interface ControlCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: React.ReactNode;
}

function ControlCard({ title, subtitle, icon, action }: ControlCardProps) {
  return (
    <div className="p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between group hover:border-[var(--primary)]/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--card-border)] group-hover:scale-105 transition-all">
          {icon}
        </div>
        <div>
          <h4 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tighter">
            {title}
          </h4>
          <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            {subtitle}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}

interface ProtocolToggleProps {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

function ProtocolToggle({
  title,
  desc,
  checked,
  onChange,
}: ProtocolToggleProps) {
  return (
    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer hover:border-[var(--primary)]/20 transition-all">
      <div className="flex items-center gap-4">
        <div
          className={`w-2 h-2 rounded-full ${checked ? "bg-[var(--primary)] animate-pulse" : "bg-slate-700"}`}
        />
        <div>
          <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tighter">
            {title}
          </p>
          <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            {desc}
          </p>
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-[var(--card-border)] bg-[var(--background)] text-[var(--primary)] focus:ring-[var(--primary)]"
      />
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  icon: React.ReactNode;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  icon,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="clinical-label px-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">
          {icon}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-10 pr-4 text-[10px] font-black uppercase tracking-tight text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/5 outline-none appearance-none cursor-pointer transition-all"
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[var(--sidebar-bg)] text-[var(--text-primary)] py-2"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] rotate-90" />
      </div>
    </div>
  );
}
