"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Stethoscope,
  HeartPulse,
  Navigation2
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { icon: LayoutDashboard, label: "Mission Control", href: "/dashboard" },
  { icon: Users, label: "Patients", href: "/dashboard/patients" },
  { icon: Calendar, label: "Schedule", href: "/dashboard/schedule" },
  { icon: HeartPulse, label: "Vitals & IoT", href: "/dashboard/telemetry" },
  { icon: Navigation2, label: "Care Navigation", href: "/dashboard/navigation" },
  { icon: FileText, label: "Clinical Notes", href: "/dashboard/notes" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 glass-morphism h-screen flex flex-col p-6 sticky top-0">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Stethoscope className="text-white w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">CareNavigator</h2>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                isActive 
                  ? "premium-gradient text-white shadow-lg shadow-blue-500/10" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "group-hover:text-blue-400 transition-colors"}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/5">
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
