"use client";

import SecurityAuditVault from "@/components/SecurityAuditVault";

export default function AuditLogPage() {
  return (
    <div className="h-screen flex flex-col bg-[var(--background)] overflow-hidden">
      <title>Halkyone - Security Audit Vault</title>
      <div className="flex-1 min-h-0">
        <SecurityAuditVault />
      </div>
    </div>
  );
}
