"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export function ThemeToggle({ isCollapsed }: { isCollapsed: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-blue-500/10 hover:text-blue-400 transition-all group"
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
