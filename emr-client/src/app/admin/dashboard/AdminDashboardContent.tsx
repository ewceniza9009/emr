"use client";

import { useQuery, useMutation, gql } from "@apollo/client";
import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Shield,
  Plus,
  Search,
  Activity,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";
import SetupDrawer from "@/components/SetupDrawer";
import AdminSidebar from "@/components/AdminSidebar";
import SecurityAuditVault from "@/components/SecurityAuditVault";
import IdentityManagement from "@/components/IdentityManagement";
import ResourceUtilization from "@/components/ResourceUtilization";
import { PermissionGate } from "@/components/PermissionGate";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { useCommandModal } from "@/components/CommandModalProvider";
import RegistrySettings from "@/components/RegistrySettings";
import IntegrationsSync from "@/components/IntegrationsSync";

import { TabType } from "./types";
import { GET_SETUP_DATA, DELETE_MUTATIONS, INVITE_PRACTITIONER } from "./queries";
import AdminLoadingState from "./components/AdminLoadingState";
import SetupTable from "./components/SetupTable";

export default function AdminDashboardContent() {
  const { confirm, alert } = useCommandModal();
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<TabType>("practitioners");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  // Persistence & URL Hook
  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab as TabType);
    } else {
      const savedTab = localStorage.getItem("halcyon_admin_active_tab");
      if (savedTab) setActiveTab(savedTab as TabType);
    }
  }, [urlTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setEditItem(null);
    localStorage.setItem("halcyon_admin_active_tab", tab);
  };

  const { data, loading, error, refetch } = useQuery(GET_SETUP_DATA);

  const mutation =
    (DELETE_MUTATIONS as any)[activeTab] ||
    gql`
      mutation {
        __typename
      }
    `;
  const [deleteItem] = useMutation(mutation, {
    onCompleted: () => refetch(),
  });

  const [invitePractitioner] = useMutation(INVITE_PRACTITIONER);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredData = useMemo(() => {
    const rawData = data?.[activeTab] || [];
    if (!debouncedSearch) return rawData;

    const query = debouncedSearch.toLowerCase();
    return rawData.filter((item: any) => {
      // Search across all string values in the item
      return (
        Object.values(item).some(
          (val) =>
            val && typeof val === "string" && val.toLowerCase().includes(query),
        ) ||
        (item.firstName &&
          `${item.firstName} ${item.lastName}`.toLowerCase().includes(query))
      );
    });
  }, [data, activeTab, debouncedSearch]);

  if (status === "loading") {
    return <AdminLoadingState message="Initializing Security Session..." />;
  }

  if (status === "unauthenticated") {
    redirect("/admin/login");
  }

  const handleEdit = (item: any) => {
    setEditItem(item);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (item: any) => {
    const idKey = Object.keys(item).find((k) => k.toLowerCase().includes("id"));
    if (!idKey) return;
    const ok = await confirm({
      title: "Delete Record",
      message:
        "Are you sure you want to delete this master record? This action is irreversible and may impact clinical dependencies.",
      type: "danger",
      confirmText: "Delete Permanently",
    });

    if (ok) {
      try {
        await deleteItem({ variables: { id: item[idKey] } });
      } catch (err) {
        await alert({
          title: "Registry Conflict",
          message:
            "Deletion failed. This record is currently referenced by other clinical entities and cannot be removed.",
          type: "danger",
        });
      }
    }
  };

  const renderContent = () => {
    if (loading)
      return (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-[var(--primary)]/20 animate-[ping_2s_linear_infinite]" />
            <Activity className="w-8 h-8 text-[var(--primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.4em] animate-pulse">
              Synchronizing Master Registry
            </p>
            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">
              Establishing Secure Peer Connection...
            </p>
          </div>
        </div>
      );
    if (error)
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-rose-500 opacity-50" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-sm font-black text-rose-500 uppercase tracking-[0.2em]">
              Registry Connection Failure
            </h2>
            <p className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest max-w-md mx-auto">
              {error.message}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5"
          >
            Retry Synchronization
          </button>
        </div>
      );

    const tableProps = {
      onEdit: handleEdit,
      onDelete: handleDelete,
      data: filteredData,
    };

    switch (activeTab) {
      case "practitioners":
        return (
          <SetupTable
            {...tableProps}
            columns={[
              {
                key: "fullName",
                label: "Name",
                render: (item: any) => `${item.firstName} ${item.lastName}`,
              },
              { key: "position", label: "Position" },
              { key: "prcLicenseNumber", label: "PRC License" },
              {
                key: "isActive",
                label: "Status",
                render: (item: any) => (
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${
                      item.isActive
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                ),
              },
              {
                key: "userId",
                label: "Account",
                render: (item: any) => {
                  const hasAccount =
                    !!item.userId &&
                    item.userId !== "00000000-0000-0000-0000-000000000000";
                  return (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${
                          hasAccount
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}
                      >
                        {hasAccount ? "Linked" : "No Access"}
                      </span>
                      <PermissionGate permission="setup:manage">
                        {!hasAccount && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const email = window.prompt(
                                `Enter invitation email for ${item.firstName} ${item.lastName}:`,
                              );
                              if (email) {
                                try {
                                  const { data } = await invitePractitioner({
                                    variables: {
                                      practitionerId: item.practitionerId,
                                      email,
                                    },
                                  });
                                  if (data.invitePractitioner) {
                                    window.alert(
                                      `Onboarding link generated: ${window.location.origin}${data.invitePractitioner}`,
                                    );
                                  }
                                } catch (err: any) {
                                  window.alert(
                                    `Invitation failed: ${err.message}`,
                                  );
                                }
                              }
                            }}
                            className="p-1 rounded bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </PermissionGate>
                    </div>
                  );
                },
              },
            ]}
          />
        );
      case "facilities":
        return (
          <SetupTable
            {...tableProps}
            columns={[
              { key: "name", label: "Facility Name" },
              { key: "type", label: "Type" },
            ]}
          />
        );
      case "healthPlans":
        return (
          <SetupTable
            {...tableProps}
            columns={[
              { key: "name", label: "Plan Name" },
              { key: "code", label: "Code" },
            ]}
          />
        );
      case "medications":
        return (
          <SetupTable
            {...tableProps}
            columns={[
              { key: "name", label: "Medication" },
              { key: "strength", label: "Strength" },
              { key: "defaultRoute", label: "Route" },
            ]}
          />
        );
      case "smartPhrases":
        return (
          <SetupTable
            {...tableProps}
            columns={[
              {
                key: "shortcut",
                label: "Trigger Key",
                render: (item: any) => (
                  <span className="font-mono text-[var(--primary)]">
                    {item.shortcut}
                  </span>
                ),
              },
              { key: "templateText", label: "Full Phrase" },
              { key: "label", label: "Label" },
            ]}
          />
        );
      case "questionnaires":
        return (
          <SetupTable
            {...tableProps}
            columns={[
              { key: "name", label: "Form Name" },
              { key: "assessmentType", label: "Type" },
              {
                key: "schemaJson",
                label: "Logic Status",
                render: (item: any) => {
                  const hasModern =
                    !!item.schemaJson && item.schemaJson.length > 20;
                  const hasLegacy = item.questions?.length > 0;

                  if (hasModern)
                    return (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          Neural Script Active
                        </span>
                      </div>
                    );
                  if (hasLegacy)
                    return (
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
                },
              },
              {
                key: "actions",
                label: "Designer",
                render: (item: any) => (
                  <Link
                    href={`/admin/forms/${item.questionnaireId}/design`}
                    className="inline-flex items-center gap-3 px-4 py-2 border border-[var(--card-border)] bg-[var(--card-bg)]/50 hover:bg-[var(--primary)] hover:border-[var(--primary)] text-[var(--text-muted)] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all group/btn"
                  >
                    <ClipboardList className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                    Launch Designer
                  </Link>
                ),
              },
            ]}
          />
        );
      case "equipment":
        return (
          <SetupTable
            {...tableProps}
            columns={[
              { key: "modelName", label: "Model" },
              { key: "serialNumber", label: "Serial #" },
              { key: "type", label: "Type" },
              {
                key: "status",
                label: "Status",
                render: (item: any) => (
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${
                      item.status === "Available"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20"
                    }`}
                  >
                    {item.status}
                  </span>
                ),
              },
            ]}
          />
        );
      case "outreachScripts":
        return (
          <SetupTable
            {...tableProps}
            columns={[
              { key: "scriptTitle", label: "Title" },
              { key: "locationName", label: "Region" },
              {
                key: "content",
                label: "Preview",
                render: (item: any) => (
                  <span className="truncate max-w-[200px] block">
                    {item.content}
                  </span>
                ),
              },
            ]}
          />
        );
      case "integrationProfiles":
        return (
          <div className="space-y-8">
            <IntegrationsSync />
            <div className="px-8 pb-8">
              <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em] mb-4">
                Registry Endpoints
              </h3>
              <SetupTable
                {...tableProps}
                columns={[
                  { key: "partner", label: "Partner" },
                  {
                    key: "apiKey",
                    label: "Key Fragment",
                    render: (item: any) => `****${item.apiKey.slice(-4)}`,
                  },
                  {
                    key: "isActive",
                    label: "Status",
                    render: (item: any) => (
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${
                          item.isActive
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        );
      case "identity":
        return <IdentityManagement />;
      case "audit":
        return <SecurityAuditVault />;
      case "settings":
        return <RegistrySettings />;
      case "utilization":
        return <ResourceUtilization />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <title>HALKYONE - Admin Portal</title>
      <AdminSidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)]/30 backdrop-blur-2xl flex items-center justify-between px-10 shrink-0 z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] bg-white/[0.03] px-4 py-2 rounded-xl border border-white/5 shadow-inner">
              <Shield className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>{activeTab.replace(/([A-Z])/g, " $1")} Registry</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span>Live Terminal</span>
            </div>
            <div className="h-4 w-px bg-[var(--card-border)]" />
            <div className="text-[9px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em]">
              {session?.user?.name || "Root Admin"}
            </div>
          </div>
        </header>

        <main
          className={`flex-1 ${
            activeTab === "audit" ? "overflow-hidden" : "overflow-y-auto"
          } p-5 space-y-4 scroll-smooth flex flex-col`}
        >
          {activeTab !== "settings" &&
            activeTab !== "utilization" &&
            activeTab !== "identity" &&
            activeTab !== "audit" && (
              <div className="flex items-end justify-between border-b border-[var(--card-border)] pb-3">
                <div>
                  <h1 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
                    {activeTab.replace(/([A-Z])/g, " $1")} Registry Segment
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        {data?.[activeTab]?.length || 0} Nodes Registered
                      </span>
                    </div>
                    <div className="w-px h-3 bg-[var(--card-border)]" />
                    <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-50 uppercase tracking-widest">
                      Master Terminal
                    </span>
                  </div>
                </div>
                <PermissionGate permission="setup:manage">
                  <button
                    className="h-10 px-6 rounded-xl bg-[var(--primary)] hover:opacity-90 text-[var(--sidebar-bg)] font-bold uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] transition-all active:scale-[0.98] flex items-center gap-2 group"
                    onClick={() => {
                      setEditItem(null);
                      setIsDrawerOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    <span className="text-[10px]">Add Entry</span>
                  </button>
                </PermissionGate>
              </div>
            )}

          {activeTab === "utilization" && (
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div>
                <h1 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  Workforce Intelligence
                </h1>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">
                  Global capacity and clinician load distribution
                </p>
              </div>
            </div>
          )}

          {activeTab !== "settings" &&
            activeTab !== "utilization" &&
            activeTab !== "identity" &&
            activeTab !== "audit" && (
              <div className="flex items-center justify-between gap-6 bg-[var(--card-bg)]/40 p-3 rounded-2xl border border-[var(--card-border)]">
                <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                  <input
                    type="text"
                    placeholder={`Query master registry for ${activeTab}...`}
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-11 pr-4 text-[11px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/40 focus:bg-[var(--card-bg)] transition-all placeholder:text-[var(--text-muted)]/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl">
                    <Activity className="w-3.5 h-3.5 text-[var(--primary)]" />
                    Last Sync: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}

          <div
            className={`flex-1 flex flex-col ${
              activeTab === "settings" || activeTab === "integrationProfiles"
                ? ""
                : "bg-[var(--card-bg)]/40 border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-3xl"
            } animate-in fade-in slide-in-from-bottom-4 duration-1000`}
          >
            {renderContent()}
          </div>
        </main>
      </div>

      {activeTab !== "identity" &&
        activeTab !== "audit" &&
        activeTab !== "settings" &&
        activeTab !== "utilization" && (
          <SetupDrawer
            open={isDrawerOpen}
            type={activeTab as any}
            initialData={editItem}
            tenantId={session?.user?.tenantId}
            onClose={() => {
              setIsDrawerOpen(false);
              setEditItem(null);
            }}
            onSuccess={() => refetch()}
          />
        )}
    </div>
  );
}
