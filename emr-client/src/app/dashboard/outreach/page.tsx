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
  MoreVertical,
  ArrowRight
} from "lucide-react";

const GET_OUTREACH_LEADS = gql`
  query GetOutreachLeads {
    outreaches {
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
  }
`;

import AddReferralDrawer from "@/components/AddReferralDrawer";
import EnrollmentDrawer from "@/components/EnrollmentDrawer";

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

  const { data, loading, error, refetch } = useQuery(GET_OUTREACH_LEADS);
  const leads = data?.outreaches || [];

  const filteredLeads = leads.filter((lead: any) => {
    // Attempt Bucket Logic
    if (filters.attempts) {
      const count = lead.callAttemptCount;
      if (filters.attempts === "0" && count !== 0) return false;
      if (filters.attempts === "1-4" && (count < 1 || count > 4)) return false;
      if (filters.attempts === "5-9" && (count < 5 || count > 9)) return false;
      if (filters.attempts === "10-14" && (count < 10 || count > 14)) return false;
      if (filters.attempts === "15+" && count < 15) return false;
    }
    
    // Status Logic
    if (filters.status && lead.status.toLowerCase() !== filters.status.toLowerCase()) return false;

    // Search Logic
    if (filters.search && !`${lead.firstName} ${lead.lastName}`.toLowerCase().includes(filters.search.toLowerCase())) return false;

    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Outreach & Enrollment</h1>
          <p className="text-[var(--text-secondary)]">Manage the patient referral pipeline and conversion workflow.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="premium-button premium-gradient px-6 py-3 rounded-2xl text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <UserPlus className="w-5 h-5" />
          Add Referral
        </button>
      </div>

      <AddReferralDrawer 
        open={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={() => refetch()} 
      />

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "New Leads", count: "14", color: "blue", icon: UserPlus },
          { label: "In Contact", count: "8", color: "purple", icon: PhoneCall },
          { label: "Interested", count: "5", color: "emerald", icon: Clock },
          { label: "Enrolled", count: "12", color: "green", icon: CheckCircle2 },
        ].map((stat) => (
          <div key={stat.label} className="glass-morphism rounded-3xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
               <div className={`p-2 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                 <stat.icon className="w-5 h-5" />
               </div>
               <span className="text-2xl font-bold text-[var(--text-primary)]">{stat.count}</span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Advanced Filter Bar */}
      <div className="flex flex-wrap gap-4 items-center bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)]">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search by name, phone..." 
            className="w-full premium-input rounded-xl py-2.5 pl-10 pr-4 text-sm"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <select 
          className="premium-input rounded-xl py-2.5 px-4 text-sm bg-slate-900 appearance-none"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="Lead">New Leads</option>
          <option value="Contacted">Contacted</option>
          <option value="Interested">Interested</option>
        </select>
        <select 
          className="premium-input rounded-xl py-2.5 px-4 text-sm bg-slate-900 appearance-none"
          value={filters.attempts}
          onChange={(e) => setFilters({...filters, attempts: e.target.value})}
        >
          <option value="">Call Attempts (All)</option>
          <option value="0">0 Calls (Fresh)</option>
          <option value="1-4">1-4 Calls (Active)</option>
          <option value="5-9">5-9 Calls (High Touch)</option>
          <option value="10-14">10-14 Calls (Struggling)</option>
          <option value="15+">15+ Calls (Critical/Review)</option>
        </select>
        <select 
          className="premium-input rounded-xl py-2.5 px-4 text-sm bg-slate-900 appearance-none"
          value={filters.urgency}
          onChange={(e) => setFilters({...filters, urgency: e.target.value})}
        >
          <option value="">Due Date (All)</option>
          <option value="overdue">Overdue Follow-up</option>
          <option value="today">Due Today</option>
          <option value="tomorrow">Due Tomorrow</option>
          <option value="upcoming">Upcoming (7 Days)</option>
        </select>
        <select className="premium-input rounded-xl py-2.5 px-4 text-sm bg-slate-900 appearance-none">
          <option value="">Any Modality</option>
          <option value="Telephone">Telephone</option>
          <option value="InPerson">In-Person</option>
          <option value="Telehealth">Telehealth</option>
        </select>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-500/10 text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-500/20 transition-all border border-blue-500/20">
          <Filter className="w-4 h-4" />
          Apply Filters
        </button>
      </div>

      {/* Active Worklist */}
      <div className="glass-morphism rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Clinical Outreach Worklist</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--input-bg)] border-b border-[var(--card-border)]">
                <th className="px-8 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Prospect</th>
                <th className="px-8 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest text-center">Attempts</th>
                <th className="px-8 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Last Outreach</th>
                <th className="px-8 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Follow-up Due</th>
                <th className="px-8 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {loading ? (
                [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={6} className="h-20 bg-[var(--input-bg)]" /></tr>)
              ) : filteredLeads.map((lead: any) => (
                <tr key={lead.patientOutreachId} className="group hover:bg-[var(--input-bg)] transition-colors">

                  <td className="px-8 py-5">
                    <div>
                      <p className="text-[var(--text-primary)] font-semibold">{lead.firstName} {lead.lastName}</p>
                      <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">{lead.referralSource || "Self-Referral"}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${lead.callAttemptCount >= 3 ? 'bg-rose-500/10 text-rose-500' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}>
                      {lead.callAttemptCount}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-[var(--text-secondary)] text-sm">
                    {lead.lastActivityDate ? new Date(lead.lastActivityDate).toLocaleDateString() : 'No attempts'}
                  </td>
                  <td className="px-8 py-5 text-sm">
                    {lead.nextFollowUpDate ? (
                      <span className="text-emerald-500 font-medium">{new Date(lead.nextFollowUpDate).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-[var(--text-muted)] italic text-xs">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${lead.status === 'Lead' ? 'bg-blue-500/10 text-blue-500' : ''}
                      ${lead.status === 'Contacted' ? 'bg-purple-500/10 text-purple-500' : ''}
                      ${lead.status === 'Interested' ? 'bg-emerald-500/10 text-emerald-500' : ''}
                    `}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                       <button className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all">
                         <PhoneCall className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => {
                           setSelectedLeadId(lead.patientOutreachId);
                           setIsEnrollOpen(true);
                         }}
                         className="p-2 rounded-lg bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-blue-500/10 transition-all border border-[var(--card-border)]"
                       >
                         <ArrowRight className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && leads.length === 0 && (
            <div className="p-20 text-center text-[var(--text-muted)]">
               No active leads found. Click "Add Referral" to start your pipeline.
            </div>
          )}
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
