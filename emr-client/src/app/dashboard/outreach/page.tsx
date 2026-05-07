"use client";

import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
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
  Target
} from "lucide-react";

const GET_OUTREACH_LEADS = gql`
  query GetOutreachLeads($search: String) {
    outreaches(search: $search) {
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

import AddReferralDrawer from "@/components/AddReferralDrawer";
import EnrollmentDrawer from "@/components/EnrollmentDrawer";
import { useMutation } from "@apollo/client";
import { useToast } from "@/components/ToastProvider";

export default function OutreachPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    attempts: "",
    urgency: "",
    modality: "",
    search: ""
  });

  const { data, loading, error, refetch } = useQuery(GET_OUTREACH_LEADS, {
    variables: {
      search: filters.search || undefined
    }
  });

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
        <button 
          onClick={() => setIsAddOpen(true)}
          className="h-10 px-6 rounded-xl bg-[var(--primary)] text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          Add Referral
        </button>
      </div>

      <AddReferralDrawer 
        open={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={() => refetch()} 
      />

      {/* Minimalist Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: "New Leads", count: "14", icon: Target },
          { label: "In Contact", count: "08", icon: PhoneCall },
          { label: "Interested", count: "05", icon: Zap },
          { label: "Enrolled", count: "12", icon: CheckCircle2 },
        ].map((stat) => (
          <div key={stat.label} className="glass-morphism rounded-2xl p-4 border border-[var(--card-border)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
               <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                 <stat.icon className="w-5 h-5" />
               </div>
               <span className="text-2xl font-bold text-[var(--text-primary)]">{stat.count}</span>
            </div>
            <p className="text-xs font-medium text-[var(--text-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Clean Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center bg-[var(--card-bg)] p-2.5 rounded-2xl border border-[var(--card-border)]">
        <div className="flex-1 min-w-[240px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
          <input 
            type="text" 
            placeholder="Search patients or referrals..." 
            className="w-full h-10 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-11 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]/30 transition-all"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <select 
          className="h-10 px-4 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/30 appearance-none min-w-[160px]"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="Lead">New Leads</option>
          <option value="Contacted">Contacted</option>
          <option value="Interested">Interested</option>
        </select>
        <button className="flex items-center gap-2 px-6 h-10 bg-[var(--input-bg)] text-[var(--text-primary)] rounded-xl font-medium text-sm hover:bg-[var(--primary)]/5 transition-all border border-[var(--card-border)]">
          <Filter className="w-4 h-4 text-[var(--primary)]" />
          Filters
        </button>
      </div>

      {/* Professional Worklist */}
      <div className="glass-morphism rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-sm">
        <div className="px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Clinical Outreach Worklist</h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{filteredLeads.length} Lead(s)</span>
        </div>
        
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] border-b border-[var(--card-border)]">
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Attempts</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Next Follow-up</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {loading ? (
                [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={6} className="h-16" /></tr>)
              ) : filteredLeads.map((lead: any) => (
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
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {lead.lastActivityDate ? new Date(lead.lastActivityDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {lead.nextFollowUpDate ? (
                      <span className="text-[var(--primary)] font-medium">{new Date(lead.nextFollowUpDate).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-slate-600 italic text-xs">Unscheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border
                      ${lead.status === 'Lead' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : ''}
                      ${lead.status === 'Contacted' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' : ''}
                      ${lead.status === 'Interested' ? 'bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]' : ''}
                    `}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-2.5">
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => handleCall(lead)}
                        className="w-8 h-8 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center justify-center border border-white/5"
                       >
                         <PhoneCall className="w-3.5 h-3.5" />
                       </button>
                       <button 
                         onClick={() => {
                           setSelectedLeadId(lead.patientOutreachId);
                           setIsEnrollOpen(true);
                         }}
                         className="w-8 h-8 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--primary)] transition-all flex items-center justify-center border border-white/5"
                       >
                         <ArrowRight className="w-3.5 h-3.5" />
                       </button>
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
          setSelectedLeadId(null);
        }} 
        outreachId={selectedLeadId}
      />
    </div>
  );
}
