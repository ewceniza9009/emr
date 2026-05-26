"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  UserPlus,
  PhoneCall,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  Activity,
  Zap,
  Target,
  UserSearch,
  ClipboardCheck,
  HeartPulse,
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { useRouter } from "next/navigation";
import EnrollmentDrawer from "@/components/EnrollmentDrawer";
import { useToast } from "@/components/ToastProvider";
import AddReferralDrawer from "@/components/AddReferralDrawer";
import OutreachFilterPopover, {
  OutreachFilters,
} from "@/components/OutreachFilterPopover";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/PermissionGate";
import { useMemo } from "react";
import { useSort } from "@/hooks/useSort";

const GET_OUTREACH_LEADS = gql`
  query GetOutreachLeads(
    $search: String
    $where: PatientOutreachFilterInput
    $skip: Int
    $take: Int
  ) {
    outreaches(search: $search, where: $where, skip: $skip, take: $take) {
      items {
        patientOutreachId
        firstName
        lastName
        referralSource
        status
        primaryPhone
        createdAt
        lastActivityDate
        callAttemptCount
        nextFollowUpDate
        latestActivityOutcome
        latestActivityReason
        enrolledPatientId
      }
      totalCount
    }
    outreachMetrics {
      newLeadsCount
      contactedCount
      interestedCount
      enrolledCount
    }
  }
`;

const LOG_OUTREACH_ACTIVITY = gql`
  mutation LogOutreachActivity($input: LogOutreachActivityCommandInput!) {
    logOutreachActivity(input: $input)
  }
`;

export default function OutreachPage() {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [outreachFilters, setOutreachFilters] = useState<OutreachFilters>({
    statuses: [],
    callAttempts: null,
    urgency: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const handleEnrollClick = (lead: any) => {
    setSelectedLead(lead);
    setIsEnrollOpen(true);
  };

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, outreachFilters]);

  const { data, loading, error, refetch, networkStatus } = useQuery(
    GET_OUTREACH_LEADS,
    {
      variables: {
        search: debouncedSearch || undefined,
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
        where: {
          and: [
            outreachFilters.statuses.length > 0
              ? { status: { in: outreachFilters.statuses } }
              : {},
            outreachFilters.callAttempts !== null
              ? outreachFilters.callAttempts === 5
                ? { callAttemptCount: { gte: 3 } }
                : outreachFilters.callAttempts === 2
                  ? { callAttemptCount: { gte: 1, lte: 2 } }
                  : { callAttemptCount: { eq: 0 } }
              : {},
          ],
        },
      },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    },
  );

  const isInitialLoading = networkStatus === 1;

  const [logActivity] = useMutation(LOG_OUTREACH_ACTIVITY);
  const { showToast } = useToast();

  const handleCall = async (lead: any) => {
    try {
      await logActivity({
        variables: {
          input: {
            outreachId: lead.patientOutreachId,
            method: "TELEPHONE",
            outcome: "Attempted",
            notes: "Outreach call initiated from worklist.",
          },
        },
      });
      showToast(
          `Call attempt logged for ${lead.firstName} ${lead.lastName}`,
          "success",
      );
      refetch();
    } catch (err) {
      console.error(err);
      showToast("Failed to log call activity", "error");
    }
  };

  const leads = data?.outreaches?.items || [];
  const totalCount = data?.outreaches?.totalCount || 0;

  const { sortField, sortOrder, handleSort, sortedItems: sortedLeads } = useSort<any>(leads, {
    customAccessors: {
      name: (lead: any) => `${lead.firstName} ${lead.lastName}`,
      callAttemptCount: (lead: any) => Number(lead.callAttemptCount) || 0,
      lastActivityDate: (lead: any) => lead.lastActivityDate ? new Date(lead.lastActivityDate).getTime() : 0,
      nextFollowUpDate: (lead: any) => lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).getTime() : 0,
    },
  });

  return (
    <div className="w-full space-y-4">
      {/* Refined Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)] uppercase">
            Outreach & Enrollment
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage patient referral pipeline and clinical conversions.
          </p>
        </div>
        <PermissionGate permission="outreach:manage">
          <button
            onClick={() => setIsAddOpen(true)}
            className="h-10 px-6 rounded-xl bg-[var(--primary)] text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Add Referral
          </button>
        </PermissionGate>
      </div>

      <AddReferralDrawer
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Outreach Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "New Leads",
            count: data?.outreachMetrics?.newLeadsCount ?? 0,
            icon: Target,
            trend: "+2 this wk",
            color: "text-blue-400",
            bg: "from-blue-500/10",
            accent: "bg-blue-500",
          },
          {
            label: "In Contact",
            count: data?.outreachMetrics?.contactedCount ?? 0,
            icon: PhoneCall,
            trend: "active",
            color: "text-purple-400",
            bg: "from-purple-500/10",
            accent: "bg-purple-500",
          },
          {
            label: "Interested",
            count: data?.outreachMetrics?.interestedCount ?? 0,
            icon: Zap,
            trend: "+1 today",
            color: "text-amber-400",
            bg: "from-amber-500/10",
            accent: "bg-amber-500",
          },
          {
            label: "Enrolled",
            count: data?.outreachMetrics?.enrolledCount ?? 0,
            icon: CheckCircle2,
            trend: "+3 this wk",
            color: "text-emerald-400",
            bg: "from-emerald-500/10",
            accent: "bg-emerald-500",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="group relative bg-[var(--card-bg)]/40 backdrop-blur-xl rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-all duration-500 cursor-default overflow-hidden shadow-2xl hover:-translate-y-1"
          >
            {/* Mesh Gradient Background */}
            <div
              className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${stat.bg} to-transparent blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-700`}
            />

            {/* Ghosted Background Icons */}
            <div
              className={`absolute -bottom-4 -right-4 ${stat.color} opacity-[0.07] group-hover:opacity-[0.12] transition-all duration-700 transform rotate-12 group-hover:rotate-0 group-hover:scale-125 pointer-events-none`}
            >
              <stat.icon className="w-28 h-28" />
            </div>

            <div
              className={`absolute top-4 right-12 ${stat.color} opacity-[0.03] group-hover:opacity-[0.06] transition-all duration-1000 transform animate-[spin_20s_linear_infinite] pointer-events-none`}
            >
              <Settings className="w-20 h-20" />
            </div>

            <div className="flex flex-col h-full relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-500 border border-white/5`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/5 mb-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full animate-pulse ${stat.accent}`}
                    />
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex items-baseline gap-1">
                  {loading ? (
                    <Skeleton className="h-9 w-12 bg-white/5" />
                  ) : (
                    <span className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">
                      {stat.count.toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">
                    {stat.label}
                  </p>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </div>

            {/* Bottom Accent Line */}
            <div
              className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-700 opacity-30 group-hover:opacity-100 ${stat.accent}`}
            />
            <div
              className={`absolute bottom-0 left-0 h-1 w-full opacity-10 ${stat.accent}`}
            />
          </div>
        ))}
      </div>

      {/* Professional Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center bg-[var(--card-bg)] p-2.5 rounded-2xl border border-[var(--card-border)]">
        <div className="flex-1 min-w-[240px] relative group">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors ${loading && !isInitialLoading ? "animate-pulse text-blue-500" : ""}`}
          />
          <input
            type="text"
            placeholder="Search patients or referrals..."
            className="w-full h-10 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-11 pr-4 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]/30 transition-all uppercase tracking-widest"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {loading && !isInitialLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
            </div>
          )}
        </div>

        <OutreachFilterPopover
          onFilterChange={setOutreachFilters}
          currentFilters={outreachFilters}
        />
      </div>

      {/* Professional Worklist */}
      <div className="glass-morphism rounded-2xl border border-[var(--card-border)] shadow-sm">
        <div className="px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Clinical Outreach Worklist
            </h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            {loading ? (
              <Skeleton className="h-4 w-12" />
            ) : (
              `${data?.outreaches?.items?.length || 0} Lead(s)`
            )}
          </span>
        </div>

        <div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] border-b border-[var(--card-border)] select-none">
                <th
                  onClick={() => handleSort("name")}
                  className="px-6 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-left cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Patient Name
                    {sortField === "name" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("callAttemptCount")}
                  className="px-6 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Attempts
                    {sortField === "callAttemptCount" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("lastActivityDate")}
                  className="px-6 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-left cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Last Activity
                    {sortField === "lastActivityDate" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-left">
                  Reason
                </th>
                <th
                  onClick={() => handleSort("nextFollowUpDate")}
                  className="px-6 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-left cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Next Follow-Up
                    {sortField === "nextFollowUpDate" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-6 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Status
                    {sortField === "status" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {loading
                ? [1, 2, 3, 4, 5, 6].map((i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-40" />
                           <Skeleton className="h-3 w-24" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <Skeleton className="h-6 w-8 rounded-lg" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <Skeleton className="h-10 w-10 rounded-xl" />
                        </div>
                      </td>
                    </tr>
                  ))
                : sortedLeads.map((lead: any) => (
                    <tr
                      key={lead.patientOutreachId}
                      className="group hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="px-6 py-2.5">
                        <div className="flex flex-col">
                          {lead.status === "ENROLLED" &&
                          lead.enrolledPatientId ? (
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/patients/${lead.enrolledPatientId}`,
                                )
                              }
                              className="text-sm font-bold text-[var(--primary)] hover:underline text-left focus:outline-none flex items-center gap-1 group/link"
                            >
                              {lead.firstName} {lead.lastName}
                            </button>
                          ) : (
                            <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                              {lead.firstName} {lead.lastName}
                            </p>
                          )}
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {lead.referralSource || "Intake Source"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-lg text-xs font-semibold ${lead.callAttemptCount >= 3 ? "bg-red-500/10 text-red-500" : "bg-white/5 text-[var(--text-secondary)]"}`}
                        >
                          {lead.callAttemptCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {lead.lastActivityDate ? (
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                              {lead.latestActivityOutcome?.replaceAll("_", " ")}
                            </p>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              •{" "}
                              {new Date(
                                lead.lastActivityDate,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] italic text-[10px] uppercase tracking-widest">
                            No activity
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lead.latestActivityReason ? (
                          <p className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-widest truncate max-w-[150px]">
                            {lead.latestActivityReason}
                          </p>
                        ) : (
                          <span className="text-[var(--text-muted)] opacity-30 text-[10px]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {lead.nextFollowUpDate ? (
                          <span className="text-[var(--primary)] font-medium text-[11px]">
                            {new Date(
                              lead.nextFollowUpDate,
                            ).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] italic text-xs">
                            Unscheduled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest border uppercase
                      ${lead.status === "LEAD" ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : ""}
                      ${lead.status === "CONTACTED" ? "bg-purple-500/10 border-purple-500/20 text-purple-500" : ""}
                      ${lead.status === "INTERESTED" ? "bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]" : ""}
                      ${lead.status === "DO_NOT_CALL" ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : ""}
                      ${lead.status === "ON_HOLD" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : ""}
                      ${lead.status === "ENROLLED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : ""}
                    `}
                        >
                          {lead.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex justify-end gap-2">
                          <PermissionGate permission="outreach:manage">
                            <button
                              onClick={() => handleCall(lead)}
                              className="w-8 h-8 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-teal-500 transition-all flex items-center justify-center border border-white/5"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="outreach:manage">
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/outreach/${lead.patientOutreachId}/enroll`,
                                )
                              }
                              className="w-10 h-10 rounded-xl bg-white/5 text-[var(--text-muted)] hover:text-white transition-all border border-white/10 flex items-center justify-center group/profile"
                              title="View Patient Outreach Profile"
                            >
                              <UserSearch className="w-5 h-5 group-hover/profile:text-teal-500 transition-colors" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="patients:enrollment">
                            <button
                              onClick={() => handleEnrollClick(lead)}
                              className="w-10 h-10 rounded-xl bg-teal-500 text-black shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all active:scale-[0.98] flex items-center justify-center"
                              title="Launch Quick Enrollment Drawer"
                            >
                              <ClipboardCheck className="w-5 h-5" />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {/* Footer Stats */}
        <div className="px-8 py-3 bg-[var(--input-bg)] border-t border-[var(--card-border)] flex items-center justify-between">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            {totalCount > 0
              ? `Showing ${page * PAGE_SIZE + 1} - ${Math.min((page + 1) * PAGE_SIZE, totalCount)} of ${totalCount} active records`
              : "No records found"}
          </p>
          <div className="flex gap-1">
            <button
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] disabled:opacity-50 text-[10px] font-bold hover:text-[var(--text-primary)] transition-all"
            >
              PREVIOUS
            </button>
            <button
              disabled={(page + 1) * PAGE_SIZE >= totalCount || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] disabled:opacity-50 text-[10px] font-bold hover:text-[var(--text-primary)] transition-all"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>

      <EnrollmentDrawer
        open={isEnrollOpen}
        onClose={() => {
          setIsEnrollOpen(false);
          setSelectedLead(null);
        }}
        outreachId={selectedLead?.patientOutreachId}
      />
    </div>
  );
}
