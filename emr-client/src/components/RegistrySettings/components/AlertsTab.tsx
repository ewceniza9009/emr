"use client";

import React from "react";
import { Bell } from "lucide-react";
import SectionLabel from "./SectionLabel";
import ProtocolToggle from "./ProtocolToggle";
import { UserPreferences } from "../types";

interface AlertsTabProps {
  stagedPrefs: UserPreferences;
  setStagedPrefs: (prefs: UserPreferences) => void;
}

export default function AlertsTab({
  stagedPrefs,
  setStagedPrefs,
}: AlertsTabProps) {
  return (
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
          desc="Local workstation notification persistence"
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
  );
}
