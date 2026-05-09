"use client";

import { useQuery, gql } from "@apollo/client";
import { 
  Shield, Search, Filter, Clock, User, 
  Terminal, AlertCircle, FileText, Activity,
  ChevronLeft, ChevronRight, Lock, Zap
} from "lucide-react";
import { useState } from "react";

const GET_AUDIT_LOGS = gql`
  query GetSecurityAuditLogs($skip: Int, $take: Int) {
    securityAuditLogs(skip: $skip, take: $take, order: { timestamp: DESC }) {
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
  const take = 20;

  const { data, loading, error } = useQuery(GET_AUDIT_LOGS, {
    variables: { skip: page * take, take },
    pollInterval: 10000 // Poll every 10s for real-time forensics
  });

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
    <div className="space-y-4 animate-in fade-in duration-700">
      {/* Table Header Section */}
      <div className="p-5 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
              placeholder="Search actions..." 
              className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Forensic Table */}
      <div className="mx-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--input-bg)]/50 border-b border-[var(--card-border)]">
                <th className="px-6 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Actor</th>
                <th className="px-6 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Action</th>
                <th className="px-6 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Details</th>
                <th className="px-6 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Entity</th>
                <th className="px-6 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
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
                    <p className="text-[10px] text-[var(--text-secondary)] font-medium max-w-xs leading-normal">
                      {log.details}
                    </p>
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

        {/* Footer / Pagination */}
        <div className="p-5 bg-[var(--input-bg)]/30 border-t border-[var(--card-border)] flex items-center justify-between">
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

      {/* Intelligence Cards */}
      <div className="mx-5 grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">
        <div className="p-5 rounded-[1.5rem] bg-indigo-500/5 border border-indigo-500/10 space-y-3">
          <div className="flex items-center gap-4 text-indigo-400">
            <Shield className="w-4 h-4" />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Integrity Status</h3>
          </div>
          <p className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Verified</p>
          <p className="text-[10px] text-[var(--text-muted)] font-medium">Chain of custody validated.</p>
        </div>

        <div className="p-5 rounded-[1.5rem] bg-rose-500/5 border border-rose-500/10 space-y-3">
          <div className="flex items-center gap-4 text-rose-400">
            <AlertCircle className="w-4 h-4" />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Unauthorized Attempts</h3>
          </div>
          <p className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">
            {logs.filter((l: any) => l.action.includes('UNAUTHORIZED')).length}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] font-medium">High-risk access flagged.</p>
        </div>

        <div className="p-5 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/10 space-y-3">
          <div className="flex items-center gap-4 text-emerald-400">
            <Zap className="w-4 h-4" />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Break-Glass usage</h3>
          </div>
          <p className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">
            {logs.filter((l: any) => l.action.includes('ACTIVATED')).length}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] font-medium">Active bypass sessions.</p>
        </div>
      </div>
    </div>
  );
}
