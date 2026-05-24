"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Terminal, 
  FileText, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Key,
  Fingerprint,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { Background, Navbar, Footer, ChangelogModal } from "@/components/Landing";

interface SecurityStandard {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

interface AuditEvent {
  time: string;
  action: string;
  status: "SUCCESS" | "WARN" | "INFO";
  details: string;
}

export default function SecurityPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [ledgerPulsing, setLedgerPulsing] = useState(true);

  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Populate mock live audit trail
  useEffect(() => {
    const initialLogs: AuditEvent[] = [
      { time: "23:05:12", action: "DB_AUDIT", status: "SUCCESS", details: "RLS policy verified on Patients table." },
      { time: "23:05:40", action: "AUTH_LINK", status: "INFO", details: "Redirection port resolved to 3672 (Local Client)." },
      { time: "23:05:41", action: "AUTH_TRUST", status: "SUCCESS", details: "Hardware trust signature validated for device hw-29x." },
      { time: "23:06:01", action: "XSRF_CHECK", status: "SUCCESS", details: "CSRF token validation passed." },
      { time: "23:06:22", action: "OSRM_MUT", status: "INFO", details: "Updated tenant config: EnableOsrmTravel set to true." }
    ];
    setAuditLogs(initialLogs);

    // Append new logs occasionally to look like a live ledger
    const interval = setInterval(() => {
      const actions = ["DB_AUDIT", "AUTH_TRUST", "SESSION_VAL", "XSRF_CHECK", "API_REQUEST"];
      const messages = [
        "Read query executed against TenantConfigurations table.",
        "Device ID check matches cached hardware trust token.",
        "JWT session token successfully decoded and checked for revocation.",
        "CORS policy enforced; origin validation passed.",
        "GraphQL mutation audit log written to secure storage ledger."
      ];
      const randomIdx = Math.floor(Math.random() * actions.length);
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];

      setAuditLogs(prev => [
        ...prev.slice(1),
        { time: timeStr, action: actions[randomIdx], status: "SUCCESS", details: messages[randomIdx] }
      ]);
      setLedgerPulsing(true);
      setTimeout(() => setLedgerPulsing(false), 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const standards: SecurityStandard[] = [
    {
      title: "HIPAA & HITECH Compliant",
      subtitle: "Protected Health Information Safeguards",
      description: "Complete row-level separation, strict access control tracking, and audited clinician authorization mechanisms to prevent disclosure leaks.",
      icon: <ShieldCheck className="w-6 h-6 text-teal-400" />
    },
    {
      title: "End-to-End Cryptography",
      subtitle: "AES-256 & TLS 1.3 Protection",
      description: "Data is encrypted in transit and at rest. Communications with services use high-security cryptographic ciphers.",
      icon: <Key className="w-6 h-6 text-indigo-400" />
    },
    {
      title: "Hardware device binding",
      subtitle: "Device Fingerprint Handshake",
      description: "Magic login links require device context mapping, falling back securely to device-specific hardware IDs rather than empty tokens.",
      icon: <Fingerprint className="w-6 h-6 text-pink-400" />
    },
    {
      title: "Immutable Access Audit Logging",
      subtitle: "Non-Repudiation Tracing",
      description: "Every reading, mutation, or configuration setting update triggers an isolated database transaction ledger write that cannot be modified.",
      icon: <FileText className="w-6 h-6 text-emerald-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-slate-400 font-sans selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden">
      <Background />

      <Navbar
        isAuthenticated={isAuthenticated}
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setIsChangelogOpen={setIsChangelogOpen}
        isSubPage={true}
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-24 pb-24">
        {/* Title Banner */}
        <div className="mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-3 text-teal-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <Lock className="w-4 h-4" /> Compliance & Security Center
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Security Overview
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Technical design security practices, compliance standards, and real-time audit tracing mechanisms.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Security Standards Cards (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {standards.map(std => (
              <div
                key={std.title}
                className="p-6 md:p-8 rounded-3xl bg-white/[0.01] border border-white/5 backdrop-blur-md hover:border-white/10 hover:bg-white/[0.02] transition-all flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 w-fit mb-6">
                    {std.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {std.title}
                  </h3>
                  <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest block mt-0.5 mb-3">
                    {std.subtitle}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {std.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Ledger Console (4 cols) */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            <div className="rounded-3xl bg-[#080c14] border border-white/5 overflow-hidden">
              <div className="px-6 py-4 bg-slate-950 border-b border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-teal-400" /> Security Audit Log
                </span>
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  ledgerPulsing ? "bg-teal-400 scale-125" : "bg-teal-500"
                }`} />
              </div>

              <div className="p-6 font-mono text-[10px] text-slate-400 min-h-[300px] bg-black/20 flex flex-col gap-3">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 items-start leading-relaxed border-b border-white/[0.02] pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-600 shrink-0">{log.time}</span>
                    <span className="text-teal-500 font-bold shrink-0">[{log.action}]</span>
                    <div className="flex-1">
                      <span className="text-slate-300">{log.details}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <ChangelogModal
        open={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
    </div>
  );
}
