"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export function ThemeToggle({ isCollapsed, variant = "sidebar" }: { isCollapsed?: boolean; variant?: "sidebar" | "topbar" }) {
  const { theme, toggleTheme } = useTheme();

  if (variant === "topbar") {
    return (
      <button
        onClick={toggleTheme}
        className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30 transition-all active:scale-95 group relative"
        title={theme === "dark" ? "Switch to Porcelain Mode" : "Switch to Midnight Mode"}
      >
        {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        <div className="absolute inset-0 bg-[var(--primary)]/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition-all group"
      title={isCollapsed ? (theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode") : ""}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === "dark" ? (
          <Moon className="w-5 h-5 shrink-0 animate-in fade-in zoom-in duration-300" />
        ) : (
          <Sun className="w-5 h-5 shrink-0 animate-in fade-in zoom-in duration-300" />
        )}
      </div>
      {!isCollapsed && (
        <span className="text-sm font-medium whitespace-nowrap">
          {theme === "dark" ? "Midnight Mode" : "Porcelain Mode"}
        </span>
      )}
    </button>
  );
}
