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
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useSettings } from "@/lib/SettingsContext";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import BenefitClaimDrawer from "@/components/BenefitClaimDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useSort } from "@/hooks/useSort";
import { PermissionGate } from "@/components/PermissionGate";

const GET_INVOICES = gql`
  query GetInvoices($skip: Int, $take: Int, $where: BillingInvoiceFilterInput) {
    billingInvoices(skip: $skip, take: $take, where: $where, order: { generatedAt: DESC }) {
      items {
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
      totalCount
    }
  }
`;

const GET_CLAIMS = gql`
  query GetClaims($skip: Int, $take: Int, $where: ZBenefitClaimFilterInput) {
    zBenefitClaims(skip: $skip, take: $take, where: $where, order: { submittedAt: DESC }) {
      items {
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
      totalCount
    }
  }
`;

const GET_CLAIM_HISTORY = gql`
  query GetClaimHistory($claimId: UUID!) {
    zBenefitClaims(id: $claimId) {
      items {
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
  }
`;

const GET_BILLING_SUMMARY = gql`
  query GetBillingSummary {
    billingSummary {
      totalReceivables
      pendingClaimsCount
      totalClaimsCount
      paidClaimsTotal
    }
  }
`;

import BillingFilterPopover, { BillingFilters } from "@/components/BillingFilterPopover";

export default function BillingPage() {
  const { showToast } = useToast();
  const { formatCurrency } = useSettings();
  const [filters, setFilters] = useState<BillingFilters>({
    invoiceStatuses: [],
    claimStatuses: [],
    period: "All Time"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("invoices");
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [editingClaim, setEditingClaim] = useState<any>(null);

  // Paging states
  const [invoicePage, setInvoicePage] = useState(0);
  const [claimPage, setClaimPage] = useState(0);
  const take = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setInvoicePage(0);
      setClaimPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: invoiceData, loading: loadingInvoices, refetch: refetchInvoices } = useQuery(GET_INVOICES, {
    variables: {
      skip: invoicePage * take,
      take,
      where: {
        and: [
          filters.invoiceStatuses.length > 0 ? { status: { in: filters.invoiceStatuses } } : {},
          debouncedSearch ? {
            or: [
              { invoiceNumber: { contains: debouncedSearch } },
              { patient: { firstName: { contains: debouncedSearch } } },
              { patient: { lastName: { contains: debouncedSearch } } }
            ]
          } : {}
        ].filter(x => Object.keys(x).length > 0)
      }
    }
  });

  const { data: claimData, loading: loadingClaims, refetch: refetchClaims } = useQuery(GET_CLAIMS, {
    variables: {
      skip: claimPage * take,
      take,
      where: {
        and: [
          filters.claimStatuses.length > 0 ? { status: { in: filters.claimStatuses } } : {},
          debouncedSearch ? {
            or: [
              { philhealthNumber: { contains: debouncedSearch } },
              { patient: { firstName: { contains: debouncedSearch } } },
              { patient: { lastName: { contains: debouncedSearch } } }
            ]
          } : {}
        ].filter(x => Object.keys(x).length > 0)
      }
    }
  });

  const { data: summaryData, loading: loadingSummary } = useQuery(GET_BILLING_SUMMARY);

  const loading = loadingInvoices || loadingClaims || loadingSummary;
  const invoices = invoiceData?.billingInvoices?.items || [];
  const claims = claimData?.zBenefitClaims?.items || [];
  const totalInvoices = invoiceData?.billingInvoices?.totalCount || 0;
  const totalClaims = claimData?.zBenefitClaims?.totalCount || 0;
  const summary = summaryData?.billingSummary || { totalReceivables: 0, pendingClaimsCount: 0, totalClaimsCount: 0, paidClaimsTotal: 0 };

  const {
    sortField: invoiceSortField,
    sortOrder: invoiceSortOrder,
    handleSort: handleInvoiceSort,
    sortedItems: sortedInvoices,
  } = useSort<any>(invoices, {
    customAccessors: {
      name: (invoice: any) => `${invoice.patient?.firstName || ""} ${invoice.patient?.lastName || ""}`,
      total: (invoice: any) => Number(invoice.patientResponsibility) || 0,
      generatedAt: (invoice: any) => invoice.generatedAt ? new Date(invoice.generatedAt).getTime() : 0,
      dueDate: (invoice: any) => invoice.dueDate ? new Date(invoice.dueDate).getTime() : 0,
    },
  });

  const {
    sortField: claimSortField,
    sortOrder: claimSortOrder,
    handleSort: handleClaimSort,
    sortedItems: sortedClaims,
  } = useSort<any>(claims, {
    customAccessors: {
      name: (claim: any) => `${claim.patient?.firstName || ""} ${claim.patient?.lastName || ""}`,
      totalAmount: (claim: any) => Number(claim.totalAmount) || 0,
      submittedAt: (claim: any) => claim.submittedAt ? new Date(claim.submittedAt).getTime() : 0,
    },
  });

  const refetch = () => {
    refetchInvoices();
    refetchClaims();
  };

  const filteredInvoices = sortedInvoices;
  const filteredClaims = sortedClaims;

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
      value: formatCurrency(summary.totalReceivables),
      icon: TrendingUp,
      trend: "+8.2%",
      desc: "Outstanding Balances"
    },
    {
      label: "Pending Claims",
      value: summary.pendingClaimsCount.toString(),
      icon: Clock,
      trend: summary.totalClaimsCount.toString(),
      desc: "Total Submissions"
    },
    {
      label: "Benefit Coverage",
      value: formatCurrency(summary.paidClaimsTotal),
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
            <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight uppercase">Billing & Financials</h1>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[var(--primary)]" />
              Halkyone Revenue Cycle Management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PermissionGate permission="billing:manage">
            <Link
              href="/dashboard/billing/new"
              className="px-6 h-11 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </Link>
          </PermissionGate>
          <PermissionGate permission="billing:manage">
            <button
              onClick={() => { setEditingClaim(null); setIsClaimOpen(true); }}
              className="px-6 h-11 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all flex items-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              Submit Z-Claim
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] group hover:border-[var(--primary)]/30 transition-all flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--primary)]/5 rounded-full -mr-8 -mt-8 blur-xl" />
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em]">{stat.label}</p>
                {loading ? <Skeleton className="h-3 w-8 rounded" /> : (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {stat.trend}
                  </span>
                )}
              </div>
              {loading ? <Skeleton className="h-7 w-24 mt-1" /> : (
                <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight leading-none mt-0.5">{stat.value}</h3>
              )}
              <p className="text-[8px] font-black text-[var(--text-muted)] mt-1 opacity-50 uppercase tracking-widest truncate">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-[var(--input-bg)]/50 p-2 rounded-[1.5rem] border border-[var(--card-border)] relative z-[100]">
        {/* Compact Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] shrink-0">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "invoices" ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
          >
            Receivables
          </button>
          <button
            onClick={() => setActiveTab("claims")}
            className={`px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "claims" ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
          >
            Benefits
          </button>
        </div>

        <div className="flex-1" />

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="SEARCH ENTITY OR MRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>

        <BillingFilterPopover
          currentFilters={filters}
          activeTab={activeTab}
          onFilterChange={(newFilters) => setFilters(newFilters)}
        />
      </div>

      {/* Content Section */}
      <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-8 border border-[var(--card-border)] shadow-2xl relative overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "invoices" ? (
            <div className="space-y-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-[var(--card-border)] select-none">
                    <th 
                      onClick={() => handleInvoiceSort("name")}
                      className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Entity Details
                        {invoiceSortField === "name" ? (
                          invoiceSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleInvoiceSort("invoiceNumber")}
                      className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Invoice #
                        {invoiceSortField === "invoiceNumber" ? (
                          invoiceSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleInvoiceSort("status")}
                      className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {invoiceSortField === "status" ? (
                          invoiceSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 text-center">Items</th>
                    <th 
                      onClick={() => handleInvoiceSort("total")}
                      className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 text-right cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Total Liability
                        {invoiceSortField === "total" ? (
                          invoiceSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {loadingInvoices ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i}>
                        <td className="py-5 px-4"><div className="flex gap-3"><Skeleton className="w-10 h-10 rounded-xl" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></td>
                        <td className="py-5 px-4"><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div></td>
                        <td className="py-5 px-4"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                        <td className="py-5 px-4"><div className="flex justify-center"><Skeleton className="h-6 w-16" /></div></td>
                        <td className="py-5 px-4"><div className="flex flex-col items-end gap-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div></td>
                        <td className="py-5 px-4"><div className="flex justify-center"><Skeleton className="h-10 w-10 rounded-xl" /></div></td>
                      </tr>
                    ))
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
                        <p className="text-sm font-black tracking-tight">{formatCurrency(invoice.patientResponsibility)}</p>
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

              {/* Pagination */}
              <div className="flex items-center justify-between pt-6 border-t border-[var(--card-border)]">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  Showing {invoicePage * take + 1} to {Math.min((invoicePage + 1) * take, totalInvoices)} of {totalInvoices} Invoices
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={invoicePage === 0}
                    onClick={() => setInvoicePage(p => p - 1)}
                    className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all"
                  >
                    <ArrowUpRight className="w-4 h-4 rotate-[225deg]" />
                  </button>
                  <div className="flex items-center gap-1 px-4">
                    <span className="text-xs font-black text-[var(--text-primary)]">{invoicePage + 1}</span>
                    <span className="text-xs font-black text-[var(--text-muted)]">/ {Math.ceil(totalInvoices / take)}</span>
                  </div>
                  <button
                    disabled={(invoicePage + 1) * take >= totalInvoices}
                    onClick={() => setInvoicePage(p => p + 1)}
                    className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all"
                  >
                    <ArrowUpRight className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-[var(--card-border)] select-none">
                    <th 
                      onClick={() => handleClaimSort("name")}
                      className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Patient
                        {claimSortField === "name" ? (
                          claimSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleClaimSort("philhealthNumber")}
                      className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        PhilHealth PIN
                        {claimSortField === "philhealthNumber" ? (
                          claimSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4">Package Code</th>
                    <th 
                      onClick={() => handleClaimSort("status")}
                      className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {claimSortField === "status" ? (
                          claimSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleClaimSort("totalAmount")}
                      className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 text-right cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Claim Amount
                        {claimSortField === "totalAmount" ? (
                          claimSortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th className="pb-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 text-center">Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {loadingClaims ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i}>
                        <td className="py-5 px-4"><div className="flex gap-3"><Skeleton className="w-10 h-10 rounded-xl bg-[var(--primary)]/10" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></td>
                        <td className="py-5 px-4"><Skeleton className="h-4 w-28" /></td>
                        <td className="py-5 px-4"><div className="flex gap-2"><Skeleton className="w-2 h-2 rounded-full" /><Skeleton className="h-4 w-20" /></div></td>
                        <td className="py-5 px-4"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                        <td className="py-5 px-4"><div className="flex flex-col items-end gap-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div></td>
                        <td className="py-5 px-4"><div className="flex justify-center gap-2"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-10 w-10 rounded-xl" /></div></td>
                      </tr>
                    ))
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
                        <p className="text-sm font-black text-[var(--text-primary)]">{formatCurrency(claim.totalAmount)}</p>
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Expected Release</p>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <PermissionGate permission="billing:manage">
                            <button
                              onClick={() => handleEditClaim(claim)}
                              className="p-2.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--primary)]/10 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all border border-[var(--card-border)]"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="billing:manage">
                            <button
                              onClick={() => setSelectedClaimId(selectedClaimId === claim.claimId ? null : claim.claimId)}
                              className="p-2.5 rounded-xl bg-[var(--input-bg)] hover:bg-white text-[var(--text-muted)] hover:text-black transition-all border border-[var(--card-border)]"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-6 border-t border-[var(--card-border)]">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  Showing {claimPage * take + 1} to {Math.min((claimPage + 1) * take, totalClaims)} of {totalClaims} Claims
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={claimPage === 0}
                    onClick={() => setClaimPage(p => p - 1)}
                    className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all"
                  >
                    <ArrowUpRight className="w-4 h-4 rotate-[225deg]" />
                  </button>
                  <div className="flex items-center gap-1 px-4">
                    <span className="text-xs font-black text-[var(--text-primary)]">{claimPage + 1}</span>
                    <span className="text-xs font-black text-[var(--text-muted)]">/ {Math.ceil(totalClaims / take)}</span>
                  </div>
                  <button
                    disabled={(claimPage + 1) * take >= totalClaims}
                    onClick={() => setClaimPage(p => p + 1)}
                    className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all"
                  >
                    <ArrowUpRight className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </div>
            </div>
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

  const logs = data?.zBenefitClaims?.items?.[0]?.statusLogs || [];

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
