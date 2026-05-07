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
    <div className="flex min-h-screen bg-[var(--background)] selection:bg-blue-500/30 text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        <TopBar />
        <main className="flex-1 p-3">
          {children}
        </main>
      </div>
    </div>
  );
}

