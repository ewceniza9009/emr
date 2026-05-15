"use client";

import { useState } from "react";
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
  HeartPulse
} from "lucide-react";
import { useRouter } from "next/navigation";
import EnrollmentDrawer from "@/components/EnrollmentDrawer";
import { useToast } from "@/components/ToastProvider";
import AddReferralDrawer from "@/components/AddReferralDrawer";
import OutreachFilterPopover, { OutreachFilters } from "@/components/OutreachFilterPopover";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/PermissionGate";

const GET_OUTREACH_LEADS = gql`
  query GetOutreachLeads($search: String, $where: PatientOutreachFilterInput) {
    outreaches(search: $search, where: $where) {
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
      }
      totalCount
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
    urgency: null
  });
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const handleEnrollClick = (lead: any) => {
    setSelectedLead(lead);
    setIsEnrollOpen(true);
  };

  const { data, loading, error, refetch, networkStatus } = useQuery(GET_OUTREACH_LEADS, {
    variables: {
      search: debouncedSearch || undefined,
      where: {
        and: [
          outreachFilters.statuses.length > 0 ? { status: { in: outreachFilters.statuses } } : {},
          outreachFilters.callAttempts !== null ? (
            outreachFilters.callAttempts === 5 ? { callAttemptCount: { gte: 3 } } :
            outreachFilters.callAttempts === 2 ? { callAttemptCount: { gte: 1, lte: 2 } } :
            { callAttemptCount: { eq: 0 } }
          ) : {}
        ]
      }
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true
  });

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
            notes: "Outreach call initiated from worklist."
          }
        }
      });
      showToast(`Call attempt logged for ${lead.firstName} ${lead.lastName}`, "success");
      refetch();
    } catch (err) {
      console.error(err);
      showToast("Failed to log call activity", "error");
    }
  };

  const leads = data?.outreaches?.items || [];

  const filteredLeads = leads;

  return (
    <div className="w-full space-y-4">
      {/* Refined Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)] uppercase">Outreach & Enrollment</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage patient referral pipeline and clinical conversions.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: "New Leads", count: "14", icon: Target, trend: "+2 this wk", color: "text-blue-500", glow: "shadow-blue-500/20" },
          { label: "In Contact", count: "08", icon: PhoneCall, trend: "active", color: "text-purple-500", glow: "shadow-purple-500/20" },
          { label: "Interested", count: "05", icon: Zap, trend: "+1 today", color: "text-teal-500", glow: "shadow-teal-500/20" },
          { label: "Enrolled", count: "12", icon: CheckCircle2, trend: "+3 this wk", color: "text-emerald-500", glow: "shadow-emerald-500/20" },
        ].map((stat) => (
          <div key={stat.label} className={`group bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--card-border)] hover:border-white/20 transition-all cursor-default relative overflow-hidden shadow-lg ${stat.glow} hover:shadow-2xl`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="text-right">
                {loading ? <Skeleton className="h-6 w-10 ml-auto" /> : <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter">{stat.count}</span>}
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-1 h-1 rounded-full animate-pulse ${stat.color === 'text-emerald-500' ? 'bg-emerald-500' : 'bg-teal-500'}`} />
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 group-hover:opacity-100 transition-opacity">{stat.trend}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</p>
              <ArrowRight className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {/* Professional Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center bg-[var(--card-bg)] p-2.5 rounded-2xl border border-[var(--card-border)]">
        <div className="flex-1 min-w-[240px] relative group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors ${loading && !isInitialLoading ? "animate-pulse text-blue-500" : ""}`} />
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
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Clinical Outreach Worklist</h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{loading ? <Skeleton className="h-4 w-12" /> : `${data?.outreaches?.items?.length || 0} Lead(s)`}</span>
        </div>

        <div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] border-b border-[var(--card-border)]">
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-left">Patient Name</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Attempts</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-left">Last Activity</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-left">Reason</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-left">Next Follow-Up</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {loading ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-24" /></div></td>
                    <td className="px-6 py-4 text-center"><div className="flex justify-center"><Skeleton className="h-6 w-8 rounded-lg" /></div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-16" /></div></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4 text-center"><div className="flex justify-center"><Skeleton className="h-6 w-24 rounded-full" /></div></td>
                    <td className="px-6 py-4"><div className="flex justify-end gap-2"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-10 w-10 rounded-xl" /></div></td>
                  </tr>
                ))
              ) : data?.outreaches?.items?.map((lead: any) => (
                <tr key={lead.patientOutreachId} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-2.5">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{lead.referralSource || "Intake Source"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-lg text-xs font-semibold ${lead.callAttemptCount >= 3 ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-[var(--text-secondary)]'}`}>
                      {lead.callAttemptCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {lead.lastActivityDate ? (
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">{lead.latestActivityOutcome?.replaceAll('_', ' ')}</p>
                        <span className="text-[10px] text-[var(--text-muted)]">• {new Date(lead.lastActivityDate).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-[var(--text-muted)] italic text-[10px] uppercase tracking-widest">No activity</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {lead.latestActivityReason ? (
                      <p className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-widest truncate max-w-[150px]">{lead.latestActivityReason}</p>
                    ) : (
                      <span className="text-[var(--text-muted)] opacity-30 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {lead.nextFollowUpDate ? (
                      <span className="text-[var(--primary)] font-medium text-[11px]">{new Date(lead.nextFollowUpDate).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-[var(--text-muted)] italic text-xs">Unscheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest border uppercase
                      ${lead.status === 'LEAD' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : ''}
                      ${lead.status === 'CONTACTED' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' : ''}
                      ${lead.status === 'INTERESTED' ? 'bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]' : ''}
                      ${lead.status === 'DO_NOT_CALL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : ''}
                      ${lead.status === 'ON_HOLD' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : ''}
                      ${lead.status === 'ENROLLED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : ''}
                    `}>
                      {lead.status.replaceAll('_', ' ')}
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
                          onClick={() => router.push(`/dashboard/outreach/${lead.patientOutreachId}/enroll`)}
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

