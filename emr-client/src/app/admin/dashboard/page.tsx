"use client";

import { useQuery, gql } from "@apollo/client";
import { useState } from "react";
import { 
  Shield, 
  Plus, 
  Search, 
  Building2, 
  Users, 
  Stethoscope, 
  Pill, 
  MoreHorizontal,
  Activity,
  LogOut,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import SetupDrawer from "@/components/SetupDrawer";
import AdminSidebar from "@/components/AdminSidebar";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";

const GET_SETUP_DATA = gql`
  query GetSetupData {
    practitioners {
      practitionerId
      firstName
      lastName
      position
      isActive
      prcLicenseNumber
    }
    facilities {
      facilityId
      name
      type
    }
    healthPlans {
      healthPlanId
      name
      code
    }
    medications {
      medicationId
      name
      strength
      defaultRoute
    }
    smartPhrases {
      phraseId
      shortcut
      templateText
      label
    }
    questionnaires {
      questionnaireId
      name
      assessmentType
    }
    equipment {
      equipmentId
      serialNumber
      modelName
      type
      status
    }
    outreachScripts {
      outreachScriptId
      locationName
      scriptTitle
      content
    }
    integrationProfiles {
      integrationProfileId
      partner
      apiKey
      isActive
    }
  }
`;

type TabType = "practitioners" | "facilities" | "healthPlans" | "medications" | "smartPhrases" | "questionnaires" | "equipment" | "outreachScripts" | "integrationProfiles";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("practitioners");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { data, loading, error, refetch } = useQuery(GET_SETUP_DATA);

  if (status === "loading") return <div className="min-h-screen bg-[#020617] flex items-center justify-center font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing Security Session...</div>;
  
  if (status === "unauthenticated") {
    redirect("/admin/login");
  }

  const renderContent = () => {
    if (loading) return <div className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-[0.3em]">Synchronizing Master Registry...</div>;
    if (error) return <div className="p-20 text-center text-rose-500 font-bold">Registry Connection Error: {error.message}</div>;

    switch (activeTab) {
      case "practitioners":
        return (
          <SetupTable 
            data={data?.practitioners || []} 
            columns={[
              { key: "fullName", label: "Name", render: (item: any) => `${item.firstName} ${item.lastName}` },
              { key: "position", label: "Position" },
              { key: "prcLicenseNumber", label: "PRC License" },
              { key: "isActive", label: "Status", render: (item: any) => (
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${item.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}>
                  {item.isActive ? "Active" : "Inactive"}
                </span>
              )}
            ]}
          />
        );
      case "facilities":
        return (
          <SetupTable 
            data={data?.facilities || []} 
            columns={[
              { key: "name", label: "Facility Name" },
              { key: "type", label: "Type" }
            ]}
          />
        );
      case "healthPlans":
        return (
          <SetupTable 
            data={data?.healthPlans || []} 
            columns={[
              { key: "name", label: "Plan Name" },
              { key: "code", label: "Code" }
            ]}
          />
        );
      case "medications":
        return (
          <SetupTable 
            data={data?.medications || []} 
            columns={[
              { key: "name", label: "Medication" },
              { key: "strength", label: "Strength" },
              { key: "defaultRoute", label: "Route" }
            ]}
          />
        );
      case "smartPhrases":
        return (
          <SetupTable 
            data={data?.smartPhrases || []} 
            columns={[
              { key: "shortcut", label: "Trigger Key", render: (item: any) => <span className="font-mono text-indigo-400">{item.shortcut}</span> },
              { key: "templateText", label: "Full Phrase" },
              { key: "label", label: "Label" }
            ]}
          />
        );
      case "questionnaires":
        return (
          <SetupTable 
            data={data?.questionnaires || []} 
            columns={[
              { key: "name", label: "Form Name" },
              { key: "assessmentType", label: "Type" }
            ]}
          />
        );
      case "equipment":
        return (
          <SetupTable 
            data={data?.equipment || []} 
            columns={[
              { key: "modelName", label: "Model" },
              { key: "serialNumber", label: "Serial #" },
              { key: "type", label: "Type" },
              { key: "status", label: "Status", render: (item: any) => (
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${item.status === 'Available' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"}`}>
                  {item.status}
                </span>
              )}
            ]}
          />
        );
      case "outreachScripts":
        return (
          <SetupTable 
            data={data?.outreachScripts || []} 
            columns={[
              { key: "scriptTitle", label: "Title" },
              { key: "locationName", label: "Region" },
              { key: "content", label: "Preview", render: (item: any) => <span className="truncate max-w-[200px] block">{item.content}</span> }
            ]}
          />
        );
      case "integrationProfiles":
        return (
          <SetupTable 
            data={data?.integrationProfiles || []} 
            columns={[
              { key: "partner", label: "Partner" },
              { key: "apiKey", label: "Key Fragment", render: (item: any) => `****${item.apiKey.slice(-4)}` },
              { key: "isActive", label: "Status", render: (item: any) => (
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${item.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}>
                  {item.isActive ? "Active" : "Inactive"}
                </span>
              )}
            ]}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617]">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Setup Portal</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white">{activeTab.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Admin Uplink Established</span>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
          <div className="flex items-end justify-between">
            <div>
               <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                 {activeTab.replace(/([A-Z])/g, ' $1')} Registry
               </h1>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
                 System Administration // Master Node Registry // Segment {activeTab.toUpperCase()}
               </p>
            </div>
            <button 
              className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.15em] shadow-2xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center gap-3 group"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span className="text-[10px]">Add New Entry</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder={`Query master registry for ${activeTab}...`} 
                className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-[12px] font-bold text-white focus:outline-none focus:border-indigo-500/40 focus:bg-slate-950 transition-all placeholder:text-slate-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl">
                 <Activity className="w-3.5 h-3.5 text-indigo-500" />
                 Last Sync: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {renderContent()}
          </div>
        </main>
      </div>

      <SetupDrawer 
        open={isDrawerOpen} 
        type={activeTab} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={() => refetch()} 
      />
    </div>
  );
}

function SetupTable({ data, columns }: { data: any[], columns: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-white/[0.02] border-b border-white/5">
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
                {col.label}
              </th>
            ))}
            <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] text-right">
              Options
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-16 text-center text-slate-600 italic text-[11px] font-medium tracking-tight">
                No active records detected in this registry segment.
              </td>
            </tr>
          ) : data.map((item, idx) => (
            <tr key={idx} className="group hover:bg-indigo-500/[0.02] transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-3.5 text-[11px]">
                  {col.render ? col.render(item) : <span className="text-slate-300 font-bold tracking-tight">{item[col.key]}</span>}
                </td>
              ))}
              <td className="px-6 py-3.5 text-right">
                <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
