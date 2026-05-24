"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, gql } from "@apollo/client";
import {
  Users,
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Flame,
  LayoutDashboard,
  X,
  Clock,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { useCommandModal } from "@/components/CommandModalProvider";

const GET_UTILIZATION = gql`
  query GetPractitionerUtilization {
    practitionerUtilization {
      practitionerId
      fullName
      openCases
      pendingTasks
      loadPercentage
    }
  }
`;

const GET_WORKLOAD_DETAILS = gql`
  query GetWorkloadDetails($practitionerId: UUID!) {
    practitionerWorkloadDetails(practitionerId: $practitionerId) {
      title
      type
      priority
      dueDate
      status
    }
  }
`;

interface ResourceUtilizationProps {
  searchQuery?: string;
}

export default function ResourceUtilization({ searchQuery = "" }: ResourceUtilizationProps) {
  const { confirm, alert } = useCommandModal();
  const { data, loading, error } = useQuery(GET_UTILIZATION);
  const [selectedPractitioner, setSelectedPractitioner] = useState<any>(null);

  const { data: detailData, loading: detailLoading } = useQuery(
    GET_WORKLOAD_DETAILS,
    {
      variables: { practitionerId: selectedPractitioner?.practitionerId },
      skip: !selectedPractitioner,
    },
  );

  const [mounted, setMounted] = useState(false);

  const handleDispatch = async () => {
    if (!selectedPractitioner) return;
    const ok = await confirm({
      title: "Dispatch Capacity Adjustment",
      message: `Are you sure you want to trigger an automated workload rebalancing for ${selectedPractitioner.fullName}? This will redistribute pending clinical duties to optimize workforce capacity.`,
      type: "warning",
      confirmText: "Execute Rebalance",
      cancelText: "Cancel",
    });
    if (ok) {
      await alert({
        title: "Adjustment Dispatched",
        message: `Workload rebalancing sequence initiated successfully. Telemetry metrics will update upon next synchronization cycle.`,
        type: "success",
      });
      setSelectedPractitioner(null);
    }
  };

  const handleReviewItem = async (item: any) => {
    await alert({
      title: "Clinical Workspace",
      message: `Navigating to ${item.type} Workspace for: "${item.title}".\n\nThis will load the respective EHR charting interface for this encounter.`,
      type: "info",
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading)
    return (
      <div className="pt-4 pb-8 space-y-6 relative animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-64 bg-[var(--input-bg)] rounded-xl" />
            <div className="h-2.5 w-48 bg-[var(--input-bg)] rounded" />
          </div>
          <div className="flex items-center gap-6">
            <div className="h-3 w-16 bg-[var(--input-bg)] rounded" />
            <div className="h-3 w-16 bg-[var(--input-bg)] rounded" />
            <div className="h-3 w-16 bg-[var(--input-bg)] rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[var(--card-bg)]/80 border border-[var(--card-border)] rounded-[1.5rem] p-5 space-y-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[var(--input-bg)]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-[var(--input-bg)] rounded" />
                  <div className="h-2 w-16 bg-[var(--input-bg)] rounded" />
                </div>
              </div>

              {/* Load Bar Skeleton */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-2 w-24 bg-[var(--input-bg)] rounded" />
                  <div className="h-2 w-8 bg-[var(--input-bg)] rounded" />
                </div>
                <div className="h-2.5 w-full bg-[var(--input-bg)] rounded-full" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--input-bg)]/40 p-2 py-3 rounded-xl border border-[var(--card-border)]/30 space-y-2">
                  <div className="h-1.5 w-12 bg-[var(--input-bg)] rounded mx-auto" />
                  <div className="h-5 w-8 bg-[var(--input-bg)] rounded mx-auto" />
                </div>
                <div className="bg-[var(--input-bg)]/40 p-2 py-3 rounded-xl border border-[var(--card-border)]/30 space-y-2">
                  <div className="h-1.5 w-12 bg-[var(--input-bg)] rounded mx-auto" />
                  <div className="h-5 w-8 bg-[var(--input-bg)] rounded mx-auto" />
                </div>
              </div>

              {/* Button Skeleton */}
              <div className="h-10 w-full bg-[var(--input-bg)] rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-20 text-center text-rose-500 font-bold flex flex-col items-center gap-4">
        <AlertCircle className="w-10 h-10" />
        <span className="uppercase tracking-widest text-sm">
          Telemetry Signal Lost: {error.message}
        </span>
      </div>
    );

  const rawUtilization = data?.practitionerUtilization || [];
  
  const utilization = rawUtilization.filter((u: any) =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-4 pb-8 space-y-6 relative">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter flex items-center gap-3">
            <Flame className="w-6 h-6 text-orange-500" />
            Resource Utilization Heatmap
          </h2>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Real-time clinical capacity and caseload distribution
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
              Optimal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
              Elevated
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40" />
            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
              Critical
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {utilization.map((u: any) => {
          const isCritical = u.loadPercentage >= 80;
          const isWarning = u.loadPercentage >= 50 && u.loadPercentage < 80;

          let statusColor = "emerald";
          if (isCritical) statusColor = "rose";
          else if (isWarning) statusColor = "amber";

          const statusColors: Record<string, string> = {
            emerald:
              "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10",
            amber:
              "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10",
            rose: "text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10",
          };

          return (
            <div
              key={u.practitionerId}
              className={`group relative bg-[var(--card-bg)]/80 border border-[var(--card-border)] rounded-[1.5rem] p-5 transition-all duration-500 shadow-2xl hover:shadow-${statusColor}-500/5 overflow-hidden backdrop-blur-xl`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-2xl ${statusColors[statusColor]} flex items-center justify-center border transition-all duration-700 group-hover:rotate-6 group-hover:scale-110`}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none mb-1">
                      {u.fullName}
                    </h3>
                    <p
                      className={`text-[8px] font-black uppercase tracking-[0.2em] opacity-80`}
                    >
                      {isCritical
                        ? "CRITICAL LOAD"
                        : isWarning
                          ? "ELEVATED LOAD"
                          : "OPTIMAL LOAD"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Load Bar */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <span>Capacity Utilization</span>
                  <span
                    className={isCritical ? "text-rose-500 animate-pulse" : ""}
                  >
                    {Math.round(u.loadPercentage)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-[var(--input-bg)] rounded-full overflow-hidden border border-[var(--card-border)]/50 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      isCritical
                        ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                        : isWarning
                          ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                          : "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    }`}
                    style={{ width: `${u.loadPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[var(--input-bg)]/40 p-2 py-2.5 rounded-xl border border-[var(--card-border)]/50 text-center transition-colors group-hover:bg-[var(--input-bg)]/60">
                  <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1 opacity-60">
                    Open Cases
                  </p>
                  <p className="text-lg font-black text-[var(--text-primary)]">
                    {u.openCases}
                  </p>
                </div>
                <div className="bg-[var(--input-bg)]/40 p-2 py-2.5 rounded-xl border border-[var(--card-border)]/50 text-center transition-colors group-hover:bg-[var(--input-bg)]/60">
                  <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1 opacity-60">
                    Pending Tasks
                  </p>
                  <p className="text-lg font-black text-[var(--text-primary)]">
                    {u.pendingTasks}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPractitioner(u)}
                className="w-full py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-[var(--primary)] hover:border-[var(--primary)] text-[var(--text-muted)] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-lg"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Review Workflow
                <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </button>

              {/* Intensity Pulse */}
              {isCritical && (
                <div className="absolute top-4 right-4">
                  <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-rose-500 rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drill-down Modal */}
      {mounted &&
        selectedPractitioner &&
        createPortal(
          <div className="fixed inset-0 left-0 top-0 w-screen h-screen z-[9999] flex items-center justify-center p-6 sm:p-20 animate-in fade-in duration-300 backdrop-blur-md bg-black/40">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] w-full max-w-4xl max-h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
              {/* Modal Header */}
              <div className="py-4 px-6 border-b border-[var(--card-border)] bg-[var(--input-bg)]/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 text-[var(--primary)]">
                    <ClipboardList className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tighter">
                        {selectedPractitioner.fullName}
                      </h2>
                      <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                        Active Session
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      Workload Intelligence & Forensic Drill-down
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPractitioner(null)}
                  className="w-9 h-9 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 py-4 px-6 overflow-y-auto custom-scrollbar space-y-3">
                {detailLoading ? (
                  <div className="py-12 text-center animate-pulse space-y-3">
                    <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto border border-[var(--primary)]/20 text-[var(--primary)]">
                      <Activity className="w-5 h-5 animate-spin" />
                    </div>
                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                      Fetching Live Workload Stream...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {detailData?.practitionerWorkloadDetails?.map(
                      (item: any, idx: number) => (
                        <div
                          key={idx}
                          className="group py-2.5 px-4 bg-[var(--input-bg)]/40 border border-[var(--card-border)] rounded-xl hover:border-[var(--primary)]/30 transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                                item.type === "VISIT"
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                  : item.type === "ADMIN"
                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              }`}
                            >
                              {item.type === "VISIT" ? (
                                <Calendar className="w-4.5 h-4.5" />
                              ) : (
                                <ShieldCheck className="w-4.5 h-4.5" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-tight mb-0.5">
                                {item.title}
                              </h4>
                              <div className="flex items-center gap-3 text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                <span className="flex items-center gap-1">
                                  <Activity className="w-2.5 h-2.5" />
                                  {item.type}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  Due:{" "}
                                  {new Date(item.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className={`px-2.5 py-1 rounded-full text-[7.5px] font-black uppercase tracking-widest ${
                                item.priority === "URGENT"
                                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                  : item.priority === "HIGH"
                                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              }`}
                            >
                              {item.priority}
                            </div>
                            <button
                              onClick={() => handleReviewItem(item)}
                              className="w-7 h-7 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-all"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                    {(!detailData?.practitionerWorkloadDetails ||
                      detailData.practitionerWorkloadDetails.length === 0) && (
                      <div className="text-center py-12 opacity-40">
                        <ClipboardList className="w-10 h-10 mx-auto mb-3" />
                        <p className="text-[9px] font-black uppercase tracking-widest">
                          No Active Workload Identified
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="py-4 px-6 bg-[var(--input-bg)]/20 border-t border-[var(--card-border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-[var(--card-bg)] bg-[var(--primary)]/20"
                      />
                    ))}
                  </div>
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Collaborating Teams Active
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPractitioner(null)}
                    className="px-4 py-2 text-[9px] font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-all"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleDispatch}
                    className="px-5 py-2 bg-[var(--primary)] text-[var(--sidebar-bg)] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-[var(--primary-glow)]"
                  >
                    Dispatch Adjustment
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.getElementById("modal-root")!,
        )}

      {utilization.length === 0 && (
        <div className="text-center py-20 bg-[var(--card-bg)]/20 border border-dashed border-[var(--card-border)] rounded-[3rem]">
          <LayoutDashboard className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-20" />
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">
            No clinical resources found in the current registry segment.
          </p>
        </div>
      )}
    </div>
  );
}
