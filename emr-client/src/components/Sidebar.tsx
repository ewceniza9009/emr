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
      className={`bg-[#0c1220]/80 backdrop-blur-xl border-r border-white/5 h-screen flex flex-col sticky top-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-[100] ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Section */}
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 h-16 border-b border-white/5 relative`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? "" : "overflow-hidden"}`}>
          <div className="w-9 h-9 premium-gradient rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <Stethoscope className="text-white w-5 h-5" />
          </div>
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-white tracking-tight animate-in fade-in zoom-in-95 duration-500">Aura</h2>
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
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border border-white/10 hover:bg-blue-500 transition-all z-50"
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
                  ? "bg-blue-500/10 text-blue-400 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-400" : "group-hover:text-blue-400 transition-colors"}`} />
              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  {item.label}
                </span>
              )}
              
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-3 border-t border-white/5">
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all group"
          title={isCollapsed ? "Sign Out" : ""}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
