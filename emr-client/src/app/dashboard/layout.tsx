"use client";

import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { useSidebar } from "@/lib/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-[#0f172a] selection:bg-blue-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-500 ease-in-out">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white/[0.01]">
          {children}
        </main>
      </div>
    </div>
  );
}
