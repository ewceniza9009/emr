"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  LogOut,
  Stethoscope,
  HeartPulse,
  Navigation2,
  PhoneCall,
  AlertTriangle,
  ChevronLeft,
  Menu,
  Zap,
  Activity,
  Shield,
  Building2
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useSidebar } from "@/lib/SidebarContext";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: AlertTriangle, label: "Triage", href: "/dashboard/triage" },
  { icon: PhoneCall, label: "Outreach", href: "/dashboard/outreach" },
  { icon: Building2, label: "Facilities", href: "/dashboard/facilities" },
  { icon: Users, label: "Patients", href: "/dashboard/patients" },
  { icon: Calendar, label: "Schedule", href: "/dashboard/schedule" },
  { icon: HeartPulse, label: "Vitals & IoT", href: "/dashboard/telemetry" },
  { icon: Navigation2, label: "Navigation", href: "/dashboard/navigation" },
  { icon: FileText, label: "Clinical Notes", href: "/dashboard/notes" },
  { icon: Stethoscope, label: "Billing", href: "/dashboard/billing" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebar();

  return (
    <aside
      className={`bg-[var(--sidebar-bg)] border-r border-[var(--card-border)] h-screen flex flex-col sticky top-0 transition-all duration-300 ease-in-out z-[100] ${isCollapsed ? "w-20" : "w-64"
        }`}
    >
      {/* Brand Section */}
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-6 h-14 border-b border-[var(--card-border)] shrink-0`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[var(--primary-glow)] animate-halcyon-pulse">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L3 7v9c0 5 9 6 9 6s9-1 9-6V7l-9-5z" />
              <path d="M8 12h3l1-3 2 6 1-3h2" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight leading-none">Halcyon</h2>
              <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Clinical OS</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : ""}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${isActive
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--text-primary)]"
                }`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 shrink-0 transition-all ${isActive ? "text-[var(--primary)]" : "group-hover:text-[var(--primary)]"}`} />
                {item.label === "Vitals & IoT" && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[var(--sidebar-bg)]" />
                )}
              </div>

              {!isCollapsed && (
                <span className={`text-[13px] font-medium transition-all ${isActive ? "text-[var(--primary)]" : ""}`}>
                  {item.label}
                </span>
              )}

              {isActive && !isCollapsed && (
                <div className="absolute right-3 w-1 h-1 rounded-full bg-[var(--primary)]" />
              )}
            </Link>
          );
        })}

        <div className="h-px bg-white/5 mx-3 my-4" />
        <Link
          href="/admin"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
        >
          <div className="relative">
            <Shield className="w-5 h-5 shrink-0" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[var(--sidebar-bg)] animate-pulse" />
          </div>
          {!isCollapsed && (
            <span className="text-[13px] font-bold">Admin Portal</span>
          )}
        </Link>
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[var(--card-border)] space-y-1">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--text-primary)] transition-all group"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <div className={`transition-transform duration-500 ${isCollapsed ? "rotate-180" : ""}`}>
            <ChevronLeft className="w-5 h-5" />
          </div>
          {!isCollapsed && <span className="text-[13px] font-medium">Collapse Sidebar</span>}
        </button>


        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-muted)] hover:bg-rose-500/15 hover:text-rose-600 transition-all group"
          title={isCollapsed ? "Sign Out" : ""}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-[13px] font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

