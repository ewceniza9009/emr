"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, gql } from "@apollo/client";

const GET_TENANT_CONFIG = gql`
  query GetTenantConfig {
    tenantConfigurations {
      tenantId
      organizationName
      currency
      timezone
      language
      dateFormat
      enableElasticsearch
      enforceMfa
      sessionTimeoutMinutes
      strictOnboarding
    }
  }
`;

const UPDATE_TENANT_CONFIG = gql`
  mutation UpdateTenantConfig($input: UpdateTenantConfigurationInput!) {
    updateTenantConfiguration(input: $input)
  }
`;

/**
 * UserPreferences: Local workstation settings (Safe for LocalStorage)
 */
export interface UserPreferences {
  theme: 'light' | 'dark';
  compactMode: boolean;
  notificationsEnabled: boolean;
}

/**
 * TenantSettings: Operational protocols (Must be Backend-bound)
 */
export interface TenantSettings {
  currency: string;
  timezone: string;
  language: string;
  dateFormat: string;
  organizationName: string;
  enableElasticsearch: boolean;
  enforceMfa: boolean;
  sessionTimeoutMinutes: number;
  strictOnboarding: boolean;
}

const currencySymbols: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

interface SettingsContextType {
  preferences: UserPreferences;
  tenantConfig: TenantSettings;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  updateTenantConfig: (newConfig: Partial<TenantSettings>) => Promise<void>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | Date) => string;
  currencySymbol: string;
  isLoaded: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  compactMode: true,
  notificationsEnabled: true,
};

const DEFAULT_TENANT: TenantSettings = {
  currency: "PHP",
  timezone: "Asia/Manila",
  language: "en",
  dateFormat: "MM/DD/YYYY",
  organizationName: "Halcyon Clinical Center",
  enableElasticsearch: false,
  enforceMfa: false,
  sessionTimeoutMinutes: 30,
  strictOnboarding: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [tenantConfig, setTenantConfig] = useState<TenantSettings>(DEFAULT_TENANT);
  const [isLoaded, setIsLoaded] = useState(false);

  const { data: tenantData, loading: tenantLoading } = useQuery(GET_TENANT_CONFIG, {
    skip: !session
  });

  const [mutateTenantConfig] = useMutation(UPDATE_TENANT_CONFIG);

  // Sync Tenant Protocols from Server
  useEffect(() => {
    if (tenantData?.tenantConfigurations?.[0]) {
      const config = tenantData.tenantConfigurations[0];
      setTenantConfig({
        currency: config.currency,
        timezone: config.timezone,
        language: config.language,
        dateFormat: config.dateFormat,
        organizationName: config.organizationName,
        enableElasticsearch: config.enableElasticsearch,
        enforceMfa: config.enforceMfa,
        sessionTimeoutMinutes: config.sessionTimeoutMinutes,
        strictOnboarding: config.strictOnboarding
      });
    }
  }, [tenantData]);

  // Load Workstation Preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("halcyon-workstation-prefs");
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (e) {
      console.warn("Settings storage access denied.");
    }

    if (!tenantLoading) {
      setIsLoaded(true);
    }
  }, [tenantLoading]);

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem("halcyon-workstation-prefs", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const updateTenantConfig = async (newConfig: Partial<TenantSettings>) => {
    if (!tenantData?.tenantConfigurations?.[0]) return;

    const tenantId = tenantData.tenantConfigurations[0].tenantId;
    const merged = { ...tenantConfig, ...newConfig };

    try {
      await mutateTenantConfig({
        variables: {
          input: {
            tenantId,
            organizationName: merged.organizationName,
            currency: merged.currency,
            timezone: merged.timezone,
            language: merged.language,
            dateFormat: merged.dateFormat,
            enableElasticsearch: merged.enableElasticsearch,
            enforceMfa: merged.enforceMfa,
            sessionTimeoutMinutes: merged.sessionTimeoutMinutes,
            strictOnboarding: merged.strictOnboarding,
            isActive: true
          }
        }
      });

      setTenantConfig(merged);
    } catch (error) {
      console.error("Failed to update tenant configuration:", error);
      throw error;
    }
  };

  const formatCurrency = (amount: number) => {
    const symbol = currencySymbols[tenantConfig.currency] || "$";
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string | Date) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const currencySymbol = currencySymbols[tenantConfig.currency] || "$";

  return (
    <SettingsContext.Provider value={{
      preferences,
      tenantConfig,
      updatePreferences,
      updateTenantConfig,
      formatCurrency,
      formatDate,
      currencySymbol,
      isLoaded
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
