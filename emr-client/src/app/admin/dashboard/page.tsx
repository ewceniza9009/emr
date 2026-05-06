"use client";

import { useQuery, useMutation, gql } from "@apollo/client";
import { useState, useEffect } from "react";
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
  ChevronRight,
  ClipboardList
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
      schemaJson
      questions {
        questionId
      }
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

const DELETE_MUTATIONS = {
  practitioners: gql`mutation DeletePractitioner($id: Guid!) { deletePractitioner(id: $id) }`,
  facilities: gql`mutation DeleteFacility($id: Guid!) { deleteFacility(id: $id) }`,
  healthPlans: gql`mutation DeleteHealthPlan($id: Guid!) { deleteHealthPlan(id: $id) }`,
  medications: gql`mutation DeleteMedication($id: Guid!) { deleteMedication(id: $id) }`,
  smartPhrases: gql`mutation DeleteSmartPhrase($id: Guid!) { deleteSmartPhrase(id: $id) }`,
  questionnaires: gql`mutation DeleteQuestionnaire($id: Guid!) { deleteQuestionnaire(id: $id) }`,
  equipment: gql`mutation DeleteEquipment($id: Guid!) { deleteEquipment(id: $id) }`,
  outreachScripts: gql`mutation DeleteOutreachScript($id: Guid!) { deleteOutreachScript(id: $id) }`,
  integrationProfiles: gql`mutation DeleteIntegrationProfile($id: Guid!) { deleteIntegrationProfile(id: $id) }`,
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("practitioners");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  // Persistence Hook
  useEffect(() => {
    const savedTab = localStorage.getItem("aura_admin_active_tab");
    if (savedTab) setActiveTab(savedTab as TabType);
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setEditItem(null);
    localStorage.setItem("aura_admin_active_tab", tab);
  };
  
  const { data, loading, error, refetch } = useQuery(GET_SETUP_DATA);

  const [deleteItem] = useMutation(DELETE_MUTATIONS[activeTab], {
    onCompleted: () => refetch()
  });

  if (status === "loading") return <div className="min-h-screen bg-[#020617] flex items-center justify-center font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing Security Session...</div>;
  
  if (status === "unauthenticated") {
    redirect("/admin/login");
  }

  const handleEdit = (item: any) => {
    setEditItem(item);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (item: any) => {
    const idKey = Object.keys(item).find(k => k.toLowerCase().includes('id'));
    if (!idKey) return;
    
    if (confirm(`Are you sure you want to delete this record? This action is irreversible.`)) {
      try {
        await deleteItem({ variables: { id: item[idKey] } });
      } catch (err) {
        alert("Deletion failed. This record may be referenced by other entities.");
      }
    }
  };

  const renderContent = () => {
    if (loading) return <div className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-[0.3em]">Synchronizing Master Registry...</div>;
    if (error) return <div className="p-20 text-center text-rose-500 font-bold">Registry Connection Error: {error.message}</div>;

    const tableProps = {
      onEdit: handleEdit,
      onDelete: handleDelete
    };

    switch (activeTab) {
      case "practitioners":
        return (
          <SetupTable 
            {...tableProps}
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
            {...tableProps}
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
            {...tableProps}
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
            {...tableProps}
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
            {...tableProps}
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
            {...tableProps}
            data={data?.questionnaires || []} 
            columns={[
              { key: "name", label: "Form Name" },
              { key: "assessmentType", label: "Type" },
              { key: "schemaJson", label: "Logic Status", render: (item: any) => {
                const hasModern = !!item.schemaJson && item.schemaJson.length > 20;
                const hasLegacy = item.questions?.length > 0;
                
                if (hasModern) return (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Neural Script Active
                    </span>
                  </div>
                );
                if (hasLegacy) return (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                    <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border bg-amber-500/10 text-amber-500 border-amber-500/20">
                      Legacy Bridge Mode
                    </span>
                  </div>
                );
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border bg-slate-500/10 text-slate-500 border-slate-500/20 opacity-50">
                      Empty Schema
                    </span>
                  </div>
                );
              }},
              { key: "actions", label: "Designer", render: (item: any) => (
                <Link 
                  href={`/admin/forms/${item.questionnaireId}/design`}
                  className="inline-flex items-center gap-3 px-4 py-2 border border-white/5 bg-white/5 hover:bg-indigo-600 hover:border-indigo-500 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all group/btn"
                >
                  <ClipboardList className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                  Launch Architect
                </Link>
              )}
            ]}
          />
        );
      case "equipment":
        return (
          <SetupTable 
            {...tableProps}
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
            {...tableProps}
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
            {...tableProps}
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
      <AdminSidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <span>{activeTab.replace(/([A-Z])/g, ' $1')} Registry</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Protected Admin Session
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
          <div className="flex items-end justify-between">
            <div>
               <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                 {activeTab.replace(/([A-Z])/g, ' $1')}
               </h1>
               <div className="flex items-center gap-4 mt-3">
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     {data?.[activeTab]?.length || 0} Records Registered
                   </span>
                 </div>
                 <div className="w-px h-3 bg-white/10" />
                 <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                   Node: Master Registry
                 </span>
               </div>
            </div>
            <button 
              className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.15em] shadow-2xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center gap-3 group"
              onClick={() => { setEditItem(null); setIsDrawerOpen(true); }}
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span className="text-[10px]">Add Entry</span>
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
        initialData={editItem}
        onClose={() => { setIsDrawerOpen(false); setEditItem(null); }} 
        onSuccess={() => refetch()} 
      />
    </div>
  );
}

import { Edit, Trash2 } from "lucide-react";

function SetupTable({ data, columns, onEdit, onDelete }: { data: any[], columns: any[], onEdit: (item: any) => void, onDelete: (item: any) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-950/50 border-b border-white/5">
            {columns.map((col) => (
              <th key={col.key} className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                {col.label}
              </th>
            ))}
            <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">
              Management
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-8 py-24 text-center text-slate-600 italic text-[11px] font-medium tracking-widest uppercase">
                <Activity className="w-8 h-8 mx-auto mb-4 opacity-20 animate-pulse" />
                No active records detected in this registry segment.
              </td>
            </tr>
          ) : data.map((item, idx) => (
            <tr key={idx} className="group hover:bg-white/[0.02] transition-all duration-300 relative">
              {columns.map((col, colIdx) => (
                <td key={col.key} className={`px-8 py-5 text-[11px] transition-all ${colIdx === 0 ? 'border-l-2 border-transparent group-hover:border-indigo-500' : ''}`}>
                  {col.render ? col.render(item) : (
                    <div className="flex flex-col">
                      <span className="text-slate-200 font-bold tracking-tight uppercase group-hover:text-white transition-colors">
                        {item[col.key]}
                      </span>
                    </div>
                  )}
                </td>
              ))}
              <td className="px-8 py-5 text-right">
                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <button 
                    onClick={() => onEdit(item)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-800/50 hover:bg-indigo-600 text-slate-400 hover:text-white border border-white/5 hover:border-indigo-500 transition-all shadow-xl"
                    title="Edit Record"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => onDelete(item)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-800/50 hover:bg-rose-600 text-slate-400 hover:text-white border border-white/5 hover:border-rose-500 transition-all shadow-xl"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
