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
  Menu
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useSidebar } from "@/lib/SidebarContext";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { icon: LayoutDashboard, label: "Mission Control", href: "/dashboard" },
  { icon: AlertTriangle, label: "Triage", href: "/dashboard/triage" },
  { icon: PhoneCall, label: "Outreach", href: "/dashboard/outreach" },
  { icon: Users, label: "Patients", href: "/dashboard/patients" },
  { icon: Calendar, label: "Schedule", href: "/dashboard/schedule" },
  { icon: HeartPulse, label: "Vitals & IoT", href: "/dashboard/telemetry" },
  { icon: Navigation2, label: "Care Navigation", href: "/dashboard/navigation" },
  { icon: FileText, label: "Clinical Notes", href: "/dashboard/notes" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebar();

  return (
    <aside 
      className={`bg-[var(--sidebar-bg)] backdrop-blur-xl border-r border-[var(--card-border)] h-screen flex flex-col sticky top-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-[100] ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Section */}
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 h-16 border-b border-[var(--card-border)] relative`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? "" : "overflow-hidden"}`}>
          <div className="w-10 h-10 premium-gradient rounded-[0.9rem] flex items-center justify-center shrink-0 shadow-lg shadow-[var(--primary-glow)] group cursor-pointer relative overflow-hidden">
            {/* Custom SVG Logo */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L3 7v9c0 5 9 6 9 6s9-1 9-6V7l-9-5z" />
              <path d="M8 12h3l1-3 2 6 1-3h2" className="animate-[pulse_2s_infinite]" />
            </svg>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">Aura</h2>
              <span className="text-[8px] font-black text-[var(--primary)] tracking-[0.3em] mt-1 uppercase">Clinical OS</span>
            </div>
          )}
        </div>
        {!isCollapsed ? (
          <button 
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={toggle}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center text-white shadow-lg border border-white/10 hover:opacity-90 transition-all z-50"
          >
            <Menu className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : ""}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                isActive 
                  ? "bg-[var(--primary)]/10 text-[var(--primary)] shadow-[inset_0_0_12px_var(--primary-glow)]" 
                  : "text-[var(--text-secondary)] hover:bg-[var(--primary-glow)] hover:text-[var(--text-primary)]"
              }`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[var(--primary)]" : "group-hover:text-[var(--primary)] transition-colors"}`} />
                {item.label === "Vitals & IoT" && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[var(--sidebar-bg)] animate-pulse" />
                )}
              </div>
              {!isCollapsed && (
                <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  {item.label}
                </span>
              )}
              
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-[var(--primary)] rounded-r-full shadow-[0_0_12px_var(--primary)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-3 border-t border-[var(--card-border)] space-y-1">
        <ThemeToggle isCollapsed={isCollapsed} />
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-all group"
          title={isCollapsed ? "Sign Out" : ""}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
