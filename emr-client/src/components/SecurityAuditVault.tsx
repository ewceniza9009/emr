"use client";

import { useQuery, gql } from "@apollo/client";
import { 
  Shield, Search, Filter, Clock, User, 
  Terminal, AlertCircle, FileText, Activity,
  ChevronLeft, ChevronRight, Lock, Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const GET_AUDIT_LOGS = gql`
  query GetSecurityAuditLogs($skip: Int, $take: Int, $where: SecurityAuditLogDtoFilterInput, $order: [SecurityAuditLogDtoSortInput!]) {
    securityAuditLogs(skip: $skip, take: $take, where: $where, order: $order) {
      items {
        auditLogId
        action
        details
        timestamp
        userId
        userName
        targetUserId
        targetName
        ipAddress
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export default function SecurityAuditVault() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const take = 20;

  // Debounce logic for server-side query optimization
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, loading, error } = useQuery(GET_AUDIT_LOGS, {
    variables: { 
      skip: page * take, 
      take,
      order: [{ timestamp: "DESC" }],
      where: debouncedSearch ? {
        or: [
          { action: { contains: debouncedSearch } },
          { userName: { contains: debouncedSearch } },
          { details: { contains: debouncedSearch } },
          { targetName: { contains: debouncedSearch } }
        ]
      } : null
    },
    pollInterval: 10000 // Poll every 10s for real-time forensics
  });

  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Intelligent detail parser to extract a "Title" for the registry view
  const getAuditTitle = (log: any) => {
    if (!log.details) return "No Data";
    try {
      const parsed = JSON.parse(log.details);
      if (parsed.ChiefComplaint) return `Complaint: ${parsed.ChiefComplaint}`;
      if (parsed.Assessment) return `Assessment: ${parsed.Assessment}`;
      if (parsed.Action) return parsed.Action;
      return "Forensic Data Package";
    } catch {
      return log.details.length > 60 ? log.details.substring(0, 57) + "..." : log.details;
    }
  };

  if (error) return (
    <div className="p-10 bg-rose-500/10 border border-rose-500/20 rounded-2xl m-8">
      <div className="flex items-center gap-3 text-rose-500 font-black uppercase tracking-widest mb-4">
        <AlertCircle className="w-5 h-5" />
        Forensic Engine Failure
      </div>
      <p className="text-xs text-rose-400/80 font-mono">{error.message}</p>
    </div>
  );

  const logs = data?.securityAuditLogs?.items || [];
  const totalCount = data?.securityAuditLogs?.totalCount || 0;

  return (
    <div className="relative flex flex-col gap-6 animate-in fade-in duration-700 px-8 pt-6 pb-12">
      {/* Table Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 px-2">
        <div className="flex items-center gap-6">
          <div className="w-1.5 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]" />
          <div>
            <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">Security Audit Vault</h1>
            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
              <Shield className="w-3 h-3 text-emerald-500" />
              Forensic Integrity Active · {totalCount} Events Logged
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
            <input 
              placeholder="Search forensic vault..." 
              className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all w-64"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0); // Reset to first page on search
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Forensic Table - Scrollable Container */}
      <div className="flex-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse sticky-header">
            <thead className="sticky top-0 z-10 bg-[var(--card-bg)] shadow-sm">
              <tr className="bg-[var(--input-bg)] border-b border-[var(--card-border)]">
                <th className="px-6 py-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Actor</th>
                <th className="px-6 py-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Details</th>
                <th className="px-6 py-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Entity</th>
                <th className="px-6 py-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-6 h-16 bg-white/[0.01]" />
                  </tr>
                ))
              ) : logs.map((log: any) => (
                <tr key={log.auditLogId} className="hover:bg-[var(--primary)]/5 transition-all group">
                  <td className="px-6 py-2.5">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-[var(--text-primary)]">{new Date(log.timestamp).toLocaleDateString()}</span>
                      <span className="text-[9px] font-black text-[var(--text-muted)] uppercase">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-[var(--text-primary)] uppercase">{log.userName || 'System'}</span>
                        <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase">{log.userId?.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                      log.action.includes('UNAUTHORIZED') 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                        : log.action.includes('ACTIVATED') 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-2.5">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="group/btn flex items-center gap-2 text-left"
                    >
                      <div className="w-6 h-6 rounded-md bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center group-hover/btn:border-[var(--primary)] transition-all">
                        <FileText className="w-3 h-3 text-[var(--text-muted)] group-hover/btn:text-[var(--primary)]" />
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-bold group-hover/btn:text-[var(--primary)] transition-colors truncate max-w-[200px]">
                        {getAuditTitle(log)}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-2.5">
                    {log.targetName ? (
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-[var(--text-primary)] uppercase">{log.targetName}</span>
                        <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase">{log.targetUserId?.slice(0, 8)}...</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-[var(--text-muted)] italic">Global System</span>
                    )}
                  </td>
                  <td className="px-6 py-2.5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 text-[8px] font-mono text-[var(--text-muted)]">
                        <Activity className="w-2.5 h-2.5" />
                        {log.ipAddress || '0.0.0.0'}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination - Inside the table card */}
        <div className="p-4 px-6 bg-[var(--input-bg)]/30 border-t border-[var(--card-border)] flex items-center justify-between shrink-0">
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
            Showing {page * take + 1} to {Math.min((page + 1) * take, totalCount)} of {totalCount} events
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-4">
               <span className="text-xs font-black text-[var(--text-primary)]">{page + 1}</span>
               <span className="text-xs font-black text-[var(--text-muted)]">/ {Math.ceil(totalCount / take)}</span>
            </div>
            <button 
              disabled={!data?.securityAuditLogs?.pageInfo?.hasNextPage}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Compact Intelligence Cards - Pin to bottom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="p-3 px-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-4 group hover:bg-indigo-500/10 transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-indigo-400/70">Integrity</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter">Verified</p>
              <span className="text-[8px] font-medium text-indigo-500/60 uppercase">Safe</span>
            </div>
          </div>
        </div>

        <div className="p-3 px-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center gap-4 group hover:bg-rose-500/10 transition-all">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-rose-400/70">Unauthorized</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-rose-500 uppercase tracking-tighter">
                {logs.filter((l: any) => l.action.includes('UNAUTHORIZED')).length}
              </p>
              <span className="text-[8px] font-medium text-rose-500/60 uppercase">Alerts</span>
            </div>
          </div>
        </div>

        <div className="p-3 px-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4 group hover:bg-emerald-500/10 transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-emerald-400/70">Break-Glass</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-emerald-500 uppercase tracking-tighter">
                {logs.filter((l: any) => l.action.includes('ACTIVATED')).length}
              </p>
              <span className="text-[8px] font-medium text-emerald-500/60 uppercase">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Detail Modal - Portal to Root */}
      {selectedLog && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedLog(null)}
          />
          <div className="relative w-full max-w-xl bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Compact Header */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--input-bg)]/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-black flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">Forensic Data</h2>
                  <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-[var(--primary)]" />
                    Chain ID: {selectedLog.auditLogId.slice(0, 18)}...
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:bg-[var(--primary)]/10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              >
                <AlertCircle className="w-4 h-4 rotate-45" />
              </button>
            </div>

            {/* Compact Content */}
            <div className="p-6 pt-6 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--input-bg)]/50 border border-[var(--card-border)]">
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Chronology</span>
                  <p className="text-[11px] font-bold text-[var(--text-primary)] mt-0.5">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--input-bg)]/50 border border-[var(--card-border)] overflow-hidden">
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Action</span>
                  <p className="text-[11px] font-black text-[var(--primary)] uppercase tracking-tighter mt-0.5 break-all leading-tight">
                    {selectedLog.action}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Forensic Payload</span>
                <div className="p-5 rounded-2xl bg-slate-950 dark:bg-black border border-[var(--card-border)] font-mono text-[10px] leading-relaxed text-emerald-400/80 shadow-inner overflow-x-auto">
                  {selectedLog.details.startsWith('{') ? (
                    <pre className="whitespace-pre-wrap break-all">{JSON.stringify(JSON.parse(selectedLog.details), null, 2)}</pre>
                  ) : (
                    <p className="whitespace-pre-wrap break-all">{selectedLog.details}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 px-5 rounded-2xl bg-[var(--input-bg)]/30 border border-[var(--card-border)]">
                <div className="flex items-center gap-3">
                  <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{selectedLog.userName}</span>
                </div>
                <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                  IP: {selectedLog.ipAddress || 'Internal'}
                </span>
              </div>
            </div>

            {/* Compact Footer */}
            <div className="p-5 bg-[var(--input-bg)]/30 border-t border-[var(--card-border)] flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-8 py-2.5 rounded-xl bg-[var(--primary)] text-black text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
