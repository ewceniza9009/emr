"use client";

import Link from "next/link";
import {
  Shield,
  Users,
  Building2,
  Stethoscope,
  Pill,
  Activity,
  Zap,
  MessageSquare,
  LogOut,
  ChevronLeft,
  LayoutDashboard,
  Database,
  Globe,
  ClipboardList
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface Props {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function AdminSidebar({ activeTab, setActiveTab }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: "practitioners", label: "Practitioners", icon: Users },
    { id: "facilities", label: "Facilities", icon: Building2 },
    { id: "healthPlans", label: "Health Plans", icon: Stethoscope },
    { id: "medications", label: "Medications", icon: Pill },
    { id: "smartPhrases", label: "Smart Phrases", icon: Activity },
    { id: "questionnaires", label: "Forms", icon: ClipboardList },
    { id: "equipment", label: "Equipment", icon: Zap },
    { id: "outreachScripts", label: "Scripts", icon: MessageSquare },
    { id: "integrationProfiles", label: "Integrations", icon: Globe },
  ];

  return (
    <aside
      className={`bg-slate-950 border-r border-white/5 h-screen flex flex-col sticky top-0 transition-all duration-300 ease-in-out z-[100] ${isCollapsed ? "w-20" : "w-64"
        }`}
    >
      {/* Brand Section */}
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-6 h-20 border-b border-white/5 shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-white uppercase tracking-tighter leading-none">Aura Setup</h2>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Admin Terminal</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-hide">
        {!isCollapsed && (
          <div className="px-3 mb-2">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Master Registries</p>
          </div>
        )}
        
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ""}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${isActive
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 shrink-0 transition-all ${isActive ? "text-indigo-400" : "group-hover:text-slate-300"}`} />
              </div>

              {!isCollapsed && (
                <span className={`text-[12px] font-bold tracking-tight transition-all ${isActive ? "text-white" : ""}`}>
                  {item.label}
                </span>
              )}

              {isActive && !isCollapsed && (
                <div className="absolute right-3 w-1 h-1 rounded-full bg-indigo-500" />
              )}
            </button>
          );
        })}

        <div className="h-px bg-white/5 mx-3 my-4" />
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative text-slate-500 hover:bg-white/5 hover:text-emerald-400"
        >
          <div className="relative">
            <LayoutDashboard className="w-5 h-5 shrink-0" />
          </div>
          {!isCollapsed && (
            <span className="text-[12px] font-bold tracking-tight">Main Dashboard</span>
          )}
        </Link>
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all group"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <div className={`transition-transform duration-500 ${isCollapsed ? "rotate-180" : ""}`}>
            <ChevronLeft className="w-5 h-5" />
          </div>
          {!isCollapsed && <span className="text-[12px] font-bold tracking-tight">Collapse View</span>}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all group"
          title={isCollapsed ? "Sign Out" : ""}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-[12px] font-bold tracking-tight">Terminate Session</span>}
        </button>
      </div>
    </aside>
  );
}
