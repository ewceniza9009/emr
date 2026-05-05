"use client";

import { useQuery, gql } from "@apollo/client";
import { 
  CreditCard, 
  FileText, 
  Plus, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  History,
  Eye,
  ChevronDown,
  X
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useState } from "react";
import Link from "next/link";
import BenefitClaimDrawer from "@/components/BenefitClaimDrawer";

const GET_INVOICES = gql`
  query GetInvoices {
    billingInvoices {
      invoiceId
      invoiceNumber
      patientId
      status
      subtotalAmount
      coveredAmount
      patientResponsibility
      generatedAt
      dueDate
      patient {
        firstName
        lastName
        mrn
      }
      items {
        itemId
      }
    }
  }
`;

const GET_CLAIMS = gql`
  query GetClaims {
    zBenefitClaims {
      claimId
      patientId
      philhealthNumber
      packageCode
      status
      totalAmount
      submittedAt
      patient {
        firstName
        lastName
        mrn
      }
    }
  }
`;

const GET_CLAIM_HISTORY = gql`
  query GetClaimHistory($claimId: UUID!) {
    zBenefitClaims(id: $claimId) {
      statusLogs {
        logId
        previousStatus
        newStatus
        changedBy
        remarks
        changedAt
      }
    }
  }
`;

export default function BillingPage() {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState("All");
  const [periodFilter, setPeriodFilter] = useState("All Time");
  
  const { data: invoiceData, loading: loadingInvoices, refetch: refetchInvoices } = useQuery(GET_INVOICES);

  const { data: claimData, loading: loadingClaims, refetch: refetchClaims } = useQuery(GET_CLAIMS);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("invoices");
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [editingClaim, setEditingClaim] = useState<any>(null);

  const loading = loadingInvoices || loadingClaims;
  const invoices = invoiceData?.billingInvoices || [];
  const claims = claimData?.zBenefitClaims || [];

  const refetch = () => {
    refetchInvoices();
    refetchClaims();
  };

  const filteredInvoices = invoices
    .filter((inv: any) => 
      (statusFilter === "All" || inv.status === statusFilter) &&
      (inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${inv.patient?.firstName} ${inv.patient?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a: any, b: any) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

  const filteredClaims = claims
    .filter((claim: any) => 
      (statusFilter === "All" || claim.status === statusFilter) &&
      (`${claim.patient?.firstName} ${claim.patient?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.philhealthNumber.includes(searchTerm))
    )
    .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const handleEditClaim = (claim: any) => {
    setEditingClaim({
      claimId: claim.claimId,
      patientId: claim.patientId,
      philhealthNumber: claim.philhealthNumber,
      packageCode: claim.packageCode,
      totalAmount: claim.totalAmount,
      status: claim.status
    });
    setIsClaimOpen(true);
  };

  const stats = [
    { 
      label: "Total Receivables", 
      value: `$${invoices.reduce((acc: number, inv: any) => acc + (inv.status !== 'Cancelled' ? inv.patientResponsibility : 0), 0).toLocaleString()}`, 
      icon: TrendingUp, 
      trend: "+8.2%", 
      desc: "Outstanding Balances" 
    },
    { 
      label: "Pending Claims", 
      value: claims.filter((c:any) => c.status === "Submitted" || c.status === "Pending").length.toString(), 
      icon: Clock, 
      trend: claims.length.toString(), 
      desc: "Total Submissions" 
    },
    { 
      label: "Benefit Coverage", 
      value: `$${claims.filter((c:any) => c.status === "Paid").reduce((acc:number, c:any) => acc + c.totalAmount, 0).toLocaleString()}`, 
      icon: CheckCircle2, 
      trend: "100%", 
      desc: "Released Funds" 
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": 
      case "Approved": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "Draft": 
      case "Pending": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "Issued": 
      case "Submitted": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "Overdue": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      case "Rejected":
      case "Cancelled": return "text-slate-500 bg-slate-500/10 border-slate-500/20 line-through opacity-50";
      default: return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <BenefitClaimDrawer 
        open={isClaimOpen} 
        initialData={editingClaim}
        onClose={() => {
          setIsClaimOpen(false);
          setEditingClaim(null);
        }} 
        onSuccess={() => {
          refetch();
          showToast(editingClaim ? "Claim Status Updated" : "Z-Benefit Claim Submitted Successfully", "success");
        }} 
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_15px_var(--primary-glow)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight uppercase">Billing & Financials</h1>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[var(--primary)]" />
              Aura Revenue Cycle Management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Link 
             href="/dashboard/billing/new"
             className="px-6 h-11 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2"
           >
             <Plus className="w-4 h-4" />
             New Invoice
           </Link>
           <button 
             onClick={() => { setEditingClaim(null); setIsClaimOpen(true); }}
             className="px-6 h-11 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all flex items-center gap-2"
           >
             <ArrowUpRight className="w-4 h-4" />
             Submit Z-Claim
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] group hover:border-[var(--primary)]/30 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary)]/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1 tracking-tight">{stat.value}</h3>
            <p className="text-[10px] font-black text-[var(--text-muted)] mt-2 opacity-50 uppercase tracking-widest">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-[var(--input-bg)]/50 p-4 rounded-3xl border border-[var(--card-border)]">
         <div className="flex items-center gap-2 px-4 border-r border-[var(--card-border)]">
            <Filter className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Advanced Filters</span>
         </div>
         
         <div className="flex-1 flex items-center gap-4">
            <div className="flex flex-col gap-1">
               <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Status Lifecycle</label>
               <select 
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer min-w-[140px]"
               >
                  <option value="All">All Statuses</option>
                  <option value="Draft">Drafts Only</option>
                  <option value="Issued">Issued / Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid / Settled</option>
                  <option value="Cancelled">Cancelled / Rejected</option>
               </select>
            </div>

            <div className="flex flex-col gap-1">
               <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Temporal Period</label>
               <select 
                 value={periodFilter}
                 onChange={(e) => setPeriodFilter(e.target.value)}
                 className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer min-w-[140px]"
               >
                  <option>All Time</option>
                  <option>Current Month</option>
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>Financial Year</option>
               </select>
            </div>
         </div>

         <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="SEARCH ENTITY OR MRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-[var(--primary)] transition-all w-72 placeholder:text-[var(--text-muted)]"
            />
         </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--input-bg)] rounded-2xl w-fit border border-[var(--card-border)]">
        <button 
          onClick={() => setActiveTab("invoices")}
          className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "invoices" ? "bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          Receivables
        </button>
        <button 
          onClick={() => setActiveTab("claims")}
          className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "claims" ? "bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          Benefit Registry
        </button>
      </div>

      {/* Content Section */}
      <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-8 border border-[var(--card-border)] shadow-2xl relative overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "invoices" ? (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-[var(--card-border)]">
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Entity Details</th>
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Invoice #</th>
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Status</th>
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 text-center">Items</th>
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 text-right">Total Liability</th>
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {loading ? (
                  [1, 2, 3].map(i => <tr key={i} className="h-20 animate-pulse bg-[var(--input-bg)]/30 rounded-xl" />)
                ) : filteredInvoices.map((invoice: any) => (
                  <tr key={invoice.invoiceId} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="py-5 px-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[10px] font-black border border-[var(--card-border)]">
                             {invoice.patient?.firstName?.[0]}{invoice.patient?.lastName?.[0]}
                          </div>
                          <div>
                             <p className="text-sm font-bold">{invoice.patient?.firstName} {invoice.patient?.lastName}</p>
                             <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">MRN: {invoice.patient?.mrn}</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-5 px-4">
                       <p className="text-xs font-bold text-[var(--primary)]">{invoice.invoiceNumber}</p>
                       <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Generated {new Date(invoice.generatedAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-5 px-4">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-tighter ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center">
                       <span className="text-[10px] font-black text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-1 rounded border border-[var(--card-border)]">
                          {(invoice.items?.length || 0)} UNITS
                       </span>
                    </td>
                    <td className="py-5 px-4 text-right">
                       <p className="text-sm font-black tracking-tight">${invoice.patientResponsibility.toLocaleString()}</p>
                       <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Settlement Required</p>
                    </td>
                    <td className="py-5 px-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <Link 
                            href={`/dashboard/billing/${invoice.invoiceId}`}
                            className="p-2.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--primary)]/10 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all border border-[var(--card-border)]"
                          >
                             <Eye className="w-4 h-4" />
                          </Link>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-[var(--card-border)]">
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Patient</th>
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">PhilHealth PIN</th>
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Package Code</th>
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Status</th>
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 text-right">Claim Amount</th>
                  <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 text-center">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {loading ? (
                  [1, 2, 3].map(i => <tr key={i} className="h-20 animate-pulse bg-[var(--input-bg)]/30 rounded-xl" />)
                ) : filteredClaims.map((claim: any) => (
                  <tr key={claim.claimId} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="py-5 px-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-[10px] font-black border border-[var(--primary)]/20">
                             {claim.patient?.firstName?.[0]}{claim.patient?.lastName?.[0]}
                          </div>
                          <div>
                             <p className="text-sm font-bold">{claim.patient?.firstName} {claim.patient?.lastName}</p>
                             <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Verified Member</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-5 px-4 font-mono text-xs font-bold tracking-tighter text-[var(--text-primary)]">
                       {claim.philhealthNumber}
                    </td>
                    <td className="py-5 px-4">
                       <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                          <span className="text-xs font-bold uppercase">{claim.packageCode}</span>
                       </div>
                    </td>
                    <td className="py-5 px-4">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-tighter ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-right">
                       <p className="text-sm font-black text-[var(--text-primary)]">${claim.totalAmount.toLocaleString()}</p>
                       <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Expected Release</p>
                    </td>
                    <td className="py-5 px-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEditClaim(claim)}
                            className="p-2.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--primary)]/10 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all border border-[var(--card-border)]"
                          >
                             <TrendingUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setSelectedClaimId(selectedClaimId === claim.claimId ? null : claim.claimId)}
                            className="p-2.5 rounded-xl bg-[var(--input-bg)] hover:bg-white text-[var(--text-muted)] hover:text-black transition-all border border-[var(--card-border)]"
                          >
                            <History className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Empty State */}
        {!loading && (activeTab === "invoices" ? filteredInvoices : filteredClaims).length === 0 && (
          <div className="py-24 text-center">
             <div className="w-20 h-20 bg-[var(--input-bg)] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[var(--card-border)]">
                <FileText className="w-10 h-10 text-[var(--text-muted)] opacity-20" />
             </div>
             <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">No Financial Records Found</h3>
             <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-50">Adjust your search parameters or create a new entry</p>
          </div>
        )}
      </div>

      {/* Claim History Modal */}
      {selectedClaimId && (
        <ClaimHistoryModal 
          claimId={selectedClaimId} 
          onClose={() => setSelectedClaimId(null)} 
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
}

function ClaimHistoryModal({ claimId, onClose, getStatusColor }: { claimId: string, onClose: () => void, getStatusColor: (s: string) => string }) {
  const { data, loading } = useQuery(GET_CLAIM_HISTORY, {
    variables: { claimId }
  });

  const logs = data?.zBenefitClaims?.[0]?.statusLogs || [];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
       <div className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h2 className="text-xl font-bold uppercase tracking-tight">Claim Audit Trail</h2>
                <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest mt-1">Transaction History</p>
             </div>
             <button onClick={onClose} className="p-3 bg-[var(--input-bg)] rounded-2xl hover:bg-[var(--card-border)] transition-all">
                <X className="w-5 h-5" />
             </button>
          </div>
          
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
             {loading ? (
               <div className="py-10 text-center animate-pulse text-[10px] font-black uppercase text-[var(--text-muted)]">Retrieving Audit Logs...</div>
             ) : logs.map((log: any, idx: number) => (
                <div key={log.logId} className="flex gap-4">
                   <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${idx === 0 ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'border-[var(--card-border)] text-[var(--text-muted)]'}`}>
                         {idx === 0 ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                      </div>
                      {idx !== (logs.length - 1) && (
                        <div className="w-0.5 flex-1 bg-[var(--card-border)] my-1" />
                      )}
                   </div>
                   <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                         <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border ${getStatusColor(log.newStatus)}`}>{log.newStatus}</span>
                         <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{new Date(log.changedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-bold mt-1 text-[var(--text-primary)]">{log.remarks || "Status updated by system"}</p>
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Operator: {log.changedBy}</p>
                   </div>
                </div>
             ))}
             {!loading && logs.length === 0 && (
               <p className="text-center text-[10px] font-black text-[var(--text-muted)] uppercase py-10 opacity-50">No status logs available for this claim</p>
             )}
          </div>
       </div>
    </div>
  );
}
