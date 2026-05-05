"use client";

import { useQuery, useMutation, gql } from "@apollo/client";
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
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useState } from "react";

const GET_BILLING_DATA = gql`
  query GetBillingData {
    billingInvoices(order: [{ generatedAt: DESC }]) {
      invoiceId
      invoiceNumber
      patientId
      status
      subtotalAmount
      coveredAmount
      patientResponsibility
      generatedAt
      dueDate
    }
    zBenefitClaims(order: [{ createdAt: DESC }]) {
      claimId
      patientId
      philhealthNumber
      packageCode
      status
      totalAmount
      submittedAt
    }
  }
`;

export default function BillingPage() {
  const { showToast } = useToast();
  const { data, loading, refetch } = useQuery(GET_BILLING_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("invoices");

  const invoices = data?.billingInvoices || [];
  const claims = data?.zBenefitClaims || [];

  const filteredInvoices = invoices.filter((inv: any) => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClaims = claims.filter((claim: any) => 
    claim.philhealthNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.packageCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: "Total Receivables", value: "$42,850.00", icon: TrendingUp, trend: "+8.2%", desc: "Monthly Growth" },
    { label: "Pending Claims", value: claims.filter((c:any) => c.status === "Pending").length.toString(), icon: Clock, trend: "-2", desc: "Awaiting Approval" },
    { label: "Patient Responsibility", value: "$12,420.00", icon: CreditCard, trend: "+15%", desc: "Outstanding Balance" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": 
      case "Approved": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "Draft": 
      case "Pending": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "Issued": 
      case "Submitted": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "Overdue": 
      case "Rejected": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      default: return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_15px_var(--primary-glow)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Billing & Claims</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--primary)]" />
              Financial Operations Cluster
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => showToast("Feature coming soon: Batch claim submission", "info")}
             className="px-6 h-10 rounded-xl bg-[var(--primary)] text-white text-sm font-medium shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all flex items-center gap-2"
           >
             <Plus className="w-4 h-4" />
             New Action
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-morphism rounded-2xl p-5 border border-[var(--card-border)] group hover:border-[var(--primary)]/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</h3>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--input-bg)] rounded-2xl w-fit border border-[var(--card-border)]">
        <button 
          onClick={() => setActiveTab("invoices")}
          className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "invoices" ? "bg-[var(--primary)] text-white shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          Invoices
        </button>
        <button 
          onClick={() => setActiveTab("claims")}
          className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "claims" ? "bg-[var(--primary)] text-white shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          Benefit Claims
        </button>
      </div>

      {/* Content Section */}
      <div className="glass-morphism rounded-3xl p-6 border border-[var(--card-border)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-[var(--primary)] rounded-full" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {activeTab === "invoices" ? "Patient Invoices" : "Z-Benefit Claims"}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder={activeTab === "invoices" ? "Search Invoice #..." : "Search PhilHealth #..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm focus:outline-none focus:border-[var(--primary)]/50 transition-all w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === "invoices" ? (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-[var(--card-border)]">
                  <th className="pb-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-4">Invoice #</th>
                  <th className="pb-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-4">Date</th>
                  <th className="pb-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-4">Status</th>
                  <th className="pb-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-4 text-right">Subtotal</th>
                  <th className="pb-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-4 text-right text-emerald-500">Covered</th>
                  <th className="pb-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-4 text-right">Patient Rep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {loading ? (
                  [1, 2, 3].map(i => <tr key={i} className="h-12 animate-pulse bg-[var(--input-bg)]/30 rounded-xl" />)
                ) : filteredInvoices.map((invoice: any) => (
                  <tr key={invoice.invoiceId} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-4 font-semibold text-sm">{invoice.invoiceNumber}</td>
                    <td className="py-4 px-4 text-xs text-[var(--text-muted)]">{new Date(invoice.generatedAt).toLocaleDateString()}</td>
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-sm">${invoice.subtotalAmount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right text-sm text-emerald-500">${invoice.coveredAmount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right text-sm font-bold">${invoice.patientResponsibility.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-[var(--card-border)]">
                  <th className="pb-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-4">PhilHealth #</th>
                  <th className="pb-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-4">Package</th>
                  <th className="pb-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-4">Status</th>
                  <th className="pb-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-4 text-right">Total Amount</th>
                  <th className="pb-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {loading ? (
                  [1, 2, 3].map(i => <tr key={i} className="h-12 animate-pulse bg-[var(--input-bg)]/30 rounded-xl" />)
                ) : filteredClaims.map((claim: any) => (
                  <tr key={claim.claimId} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-4 font-mono text-xs font-bold text-[var(--primary)]">{claim.philhealthNumber}</td>
                    <td className="py-4 px-4 font-semibold text-sm">{claim.packageCode}</td>
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-sm font-bold text-[var(--text-primary)]">
                      ${claim.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-xs text-[var(--text-muted)]">
                      {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString() : "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
