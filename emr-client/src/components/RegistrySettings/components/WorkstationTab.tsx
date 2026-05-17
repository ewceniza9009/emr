"use client";

import React from "react";
import { Layout, Moon, Sun, Eye } from "lucide-react";
import SectionLabel from "./SectionLabel";
import ControlCard from "./ControlCard";
import { UserPreferences } from "../types";

interface WorkstationTabProps {
  theme: string;
  toggleTheme: () => void;
  stagedPrefs: UserPreferences;
  setStagedPrefs: (prefs: UserPreferences) => void;
}

export default function WorkstationTab({
  theme,
  toggleTheme,
  stagedPrefs,
  setStagedPrefs,
}: WorkstationTabProps) {
  return (
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
              className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${
                theme === "dark" ? "bg-indigo-600" : "bg-amber-400"
              }`}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                  theme === "dark" ? "left-6" : "left-1"
                }`}
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
              className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${
                stagedPrefs.compactMode ? "bg-emerald-600" : "bg-slate-700"
              }`}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                  stagedPrefs.compactMode ? "left-6" : "left-1"
                }`}
              />
            </div>
          }
        />
      </div>
    </div>
  );
}
