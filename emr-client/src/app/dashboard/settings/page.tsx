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
  Activity,
  Building2,
  ServerCrash
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useSettings } from "@/lib/SettingsContext";
import { useSession } from "next-auth/react";

const timezones = [
  { value: "UTC", label: "UTC (COORDINATED UNIVERSAL TIME)" },
  { value: "Asia/Manila", label: "ASIA/MANILA (PHT - PHILIPPINE TIME)" },
  { value: "America/New_York", label: "AMERICA/NEW_YORK (EST/EDT)" },
  { value: "Europe/London", label: "EUROPE/LONDON (GMT/BST)" },
  { value: "Asia/Singapore", label: "ASIA/SINGAPORE (SGT)" },
];

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

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "Admin";
  
  const [activeTab, setActiveTab] = useState("workstation");
  const { preferences, tenantConfig, updatePreferences, updateTenantConfig, isLoaded } = useSettings();
  const { theme, toggleTheme } = useTheme();

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
    { id: "security", label: "SECURITY", icon: Shield, adminOnly: false },
    { id: "notifications", label: "ALERTS", icon: Bell, adminOnly: false },
    { id: "infrastructure", label: "INFRASTRUCTURE", icon: Database, adminOnly: true },
  ];

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500 max-w-[1400px] mx-auto p-4">
      {/* Tactical Header */}
      <header className="flex items-center justify-between px-6 py-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight leading-none">Application Command</h1>
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Configure clinical workstation parameters</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end pr-4 border-r border-[var(--card-border)]">
            <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Protocol Integrity</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 ${isAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} rounded-full />
              <span className={`text-[9px] font-black uppercase ${isAdmin ? 'text-emerald-500/80' : 'text-amber-500/80'}`}>
                {isAdmin ? 'Full Authorization' : 'Restricted Access'}
              </span>
            </div>
          </div>
          <button className="p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

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
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-white" : "group-hover:text-[var(--primary)]"}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
              {tab.adminOnly && !isAdmin && <Lock className="w-2.5 h-2.5 ml-auto opacity-40" />}
              {activeTab === tab.id && <div className="absolute right-3 w-1 h-1 bg-white rounded-full" />}
            </button>
          ))}
          
          <div className="mt-8 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Clinical Context</span>
            </div>
            <p className="text-[9px] text-[var(--text-muted)] leading-relaxed font-medium uppercase">
              Operational state is bound to <span className="text-indigo-400 font-black">{tenantConfig.organizationName}</span> and persists across all authenticated sessions.
            </p>
          </div>
        </nav>

        {/* Content Rail */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            
            {activeTab === "workstation" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <SectionLabel title="INTERFACE PREFERENCES" subtitle="Workstation Display" icon={<Layout className="w-3.5 h-3.5" />} color="amber" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ControlCard 
                    title="Interface Mode" 
                    subtitle="Switch between High-Contrast modes"
                    icon={theme === "dark" ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                    action={
                      <div 
                        onClick={toggleTheme}
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${theme === "dark" ? "bg-indigo-600" : "bg-amber-400"}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${theme === "dark" ? "left-6" : "left-1"}`} />
                      </div>
                    }
                  />

                  <ControlCard 
                    title="Data Density" 
                    subtitle="Optimize for professional displays"
                    icon={<Eye className="w-4 h-4 text-emerald-400" />}
                    action={
                      <div 
                        onClick={() => setStagedPrefs({...stagedPrefs, compactMode: !stagedPrefs.compactMode})}
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${stagedPrefs.compactMode ? "bg-emerald-600" : "bg-slate-700"}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${stagedPrefs.compactMode ? "left-6" : "left-1"}`} />
                      </div>
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "tenant" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <SectionLabel title="ORGANIZATION PROTOCOLS" subtitle="Global Clinical Parameters" icon={<Building2 className="w-3.5 h-3.5" />} color="teal" />

                {!isAdmin ? (
                  <div className="p-8 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col items-center text-center space-y-4">
                    <Lock className="w-8 h-8 text-amber-500/40" />
                    <div>
                      <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Administrative Access Required</h3>
                      <p className="text-[9px] text-[var(--text-muted)] uppercase mt-1 max-w-[300px]">Tenant-level operational state can only be modified by system administrators.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField 
                      label="SYSTEM TIME ZONE" 
                      value={stagedTenant.timezone}
                      onChange={(v: string) => setStagedTenant({...stagedTenant, timezone: v})}
                      options={timezones}
                      icon={<Clock className="w-3.5 h-3.5" />}
                    />
                    <SelectField 
                      label="BASE CURRENCY" 
                      value={stagedTenant.currency}
                      onChange={(v: string) => setStagedTenant({...stagedTenant, currency: v})}
                      options={currencies}
                      icon={<DollarSign className="w-3.5 h-3.5" />}
                    />
                    <SelectField 
                      label="DEFAULT LANGUAGE" 
                      value={stagedTenant.language}
                      onChange={(v: string) => setStagedTenant({...stagedTenant, language: v})}
                      options={languages}
                      icon={<Languages className="w-3.5 h-3.5" />}
                    />
                    <SelectField 
                      label="DATE DISPLAY PROTOCOL" 
                      value={stagedTenant.dateFormat}
                      onChange={(v: string) => setStagedTenant({...stagedTenant, dateFormat: v})}
                      options={[
                        { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
                        { value: "DD/MM/YYYY", label: "DD/MM/YYYY (INTL)" },
                        { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
                      ]}
                      icon={<Activity className="w-3.5 h-3.5" />}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <SectionLabel title="ALERT PROTOCOLS" subtitle="Notification Management" icon={<Bell className="w-3.5 h-3.5" />} color="rose" />
                <div className="space-y-3">
                  <ProtocolToggle 
                    title="Browser Push Alerts" 
                    desc="Real-time clinical state synchronization"
                    checked={stagedPrefs.notificationsEnabled}
                    onChange={(val: boolean) => setStagedPrefs({...stagedPrefs, notificationsEnabled: val})}
                  />
                </div>
              </div>
            )}

            {(activeTab === "security" || activeTab === "infrastructure") && (
              <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-12 h-12 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center">
                  <ServerCrash className="w-5 h-5 text-[var(--primary)] opacity-40" />
                </div>
                <div className="text-center">
                  <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Infrastructure Module Locked</h3>
                  <p className="text-[9px] text-[var(--text-muted)] uppercase mt-1 tracking-wider">Access level insufficient for modifications</p>
                </div>
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
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--primary-glow)] disabled:opacity-40"
              >
                {isSaving ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest leading-none">{title}</h2>
        <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">{subtitle}</p>
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
          <h4 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tighter">{title}</h4>
          <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{subtitle}</p>
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

function ProtocolToggle({ title, desc, checked, onChange }: ProtocolToggleProps) {
  return (
    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer hover:border-[var(--primary)]/20 transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${checked ? 'bg-[var(--primary)] animate-pulse' : 'bg-slate-700'}`} />
        <div>
          <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tighter">{title}</p>
          <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{desc}</p>
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

function SelectField({ label, value, onChange, options, icon }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">{label}</label>
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
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] rotate-90" />
      </div>
    </div>
  );
}
