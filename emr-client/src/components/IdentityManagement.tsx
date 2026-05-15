"use client";

import { useQuery, useMutation, gql } from "@apollo/client";
import { useState } from "react";
import { 
  Users, 
  ShieldCheck, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  ChevronRight
} from "lucide-react";
import { useCommandModal } from "@/components/CommandModalProvider";

const GET_IDENTITY_DATA = gql`
  query GetIdentityData {
    users {
      id
      email
      firstName
      lastName
      roles
      tenantId
      emergencyAccessExpiry
    }
    roles {
      id
      name
      permissions
    }
  }
`;

const ASSIGN_ROLE = gql`
  mutation AssignRole($userId: String!, $roleName: String!) {
    assignRoleToUser(userId: $userId, roleName: $roleName)
  }
`;

const REMOVE_ROLE = gql`
  mutation RemoveRole($userId: String!, $roleName: String!) {
    removeRoleFromUser(userId: $userId, roleName: $roleName)
  }
`;

const UPDATE_PERMISSIONS = gql`
  mutation UpdatePermissions($roleName: String!, $permissions: [String!]!) {
    updateRolePermissions(roleName: $roleName, permissions: $permissions)
  }
`;

const CREATE_ROLE = gql`
  mutation CreateRole($roleName: String!) {
    createRole(roleName: $roleName)
  }
`;

const DELETE_ROLE = gql`
  mutation DeleteRole($roleName: String!) {
    deleteRole(roleName: $roleName)
  }
`;

const ACTIVATE_BREAK_GLASS = gql`
  mutation BreakGlass($justification: String!) {
    activateBreakGlass(justification: $justification)
  }
`;

const AVAILABLE_PERMISSIONS = [
  "patients:view", "patients:edit", "patients:delete", "patients:enrollment",
  "outreach:view", "outreach:manage",
  "clinical:view", "clinical:order", "clinical:chart", "clinical:assessments",
  "scheduling:view", "scheduling:manage",
  "billing:view", "billing:manage",
  "setup:view", "setup:manage",
  "logistics:view", "logistics:manage",
  "docs:view", "docs:edit", "docs:delete", "docs:sign",
  "pharmacy:view", "pharmacy:order", "pharmacy:audit",
  "analytics:view", "analytics:export",
  "integrations:view", "integrations:manage", "integrations:sync"
];

export default function IdentityManagement() {
  const { alert, confirm, prompt } = useCommandModal();
  const { data, loading, error, refetch } = useQuery(GET_IDENTITY_DATA);
  const [assignRole] = useMutation(ASSIGN_ROLE);
  const [removeRole] = useMutation(REMOVE_ROLE);
  const [updatePermissions] = useMutation(UPDATE_PERMISSIONS);
  const [createRole] = useMutation(CREATE_ROLE);
  const [deleteRole] = useMutation(DELETE_ROLE);
  const [breakGlass] = useMutation(ACTIVATE_BREAK_GLASS);

  const [activeSubTab, setActiveSubTab] = useState<"users" | "roles">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[var(--card-bg)]/10 rounded-3xl border border-[var(--card-border)]">
      <div className="text-center animate-pulse">
        <RefreshCw className="w-12 h-12 text-[var(--primary)] mx-auto mb-6 animate-spin" />
        <div className="text-[14px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)]">Decoding Cryptographic Identity Vault...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center bg-rose-500/5 rounded-3xl border border-rose-500/20">
      <div className="text-center max-w-md px-8">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-6 opacity-50" />
        <h2 className="text-xl font-black text-rose-500 uppercase tracking-tighter mb-2">Access Denied</h2>
        <p className="text-[11px] font-bold text-rose-500/60 uppercase tracking-widest leading-relaxed">{error.message}</p>
        <button 
          onClick={() => refetch()}
          className="mt-8 px-6 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
        >
          Retry Authorization
        </button>
      </div>
    </div>
  );

  const roles = data?.roles || [];
  const users = data?.users || [];
  const selectedRole = roles.find((r: any) => r.id === selectedRoleId);

  const handleToggleRole = async (user: any, roleName: string, hasRole: boolean) => {
    try {
      if (hasRole) {
        await removeRole({ variables: { userId: user.id, roleName } });
      } else {
        await assignRole({ variables: { userId: user.id, roleName } });
      }
      refetch();
    } catch (err: any) {
      alert({ title: "Identity Error", message: err.message, type: "danger" });
    }
  };

  const handleTogglePermission = async (role: any, permission: string) => {
    const newPermissions = role.permissions.includes(permission)
      ? role.permissions.filter((p: string) => p !== permission)
      : [...role.permissions, permission];
    
    try {
      await updatePermissions({ variables: { roleName: role.name, permissions: newPermissions } });
      refetch();
    } catch (err: any) {
      alert({ title: "Authorization Error", message: err.message, type: "danger" });
    }
  };

  const handleCreateRole = async () => {
    const name = await prompt({
      title: "New Security Role",
      message: "Define a unique identifier for this security segment.",
      placeholder: "e.g. NURSE_LEAD",
    });

    if (name) {
      try {
        await createRole({ variables: { roleName: name.toUpperCase() } });
        refetch();
      } catch (err: any) {
        alert({ title: "Provisioning Error", message: err.message, type: "danger" });
      }
    }
  };

  const handleDeleteRole = async (role: any) => {
    const ok = await confirm({
      title: "Decommission Role",
      message: `Are you sure you want to remove the '${role.name}' role? This may impact active sessions.`,
      type: "danger",
    });

    if (ok) {
      try {
        await deleteRole({ variables: { roleName: role.name } });
        setSelectedRoleId(null);
        refetch();
      } catch (err: any) {
        alert({ title: "Decommissioning Error", message: err.message, type: "danger" });
      }
    }
  };

  const handleBreakGlass = async () => {
    const justification = await prompt({
      title: "ACTIVATE BREAK-GLASS",
      message: "EMERGENCY: Administrative override will be logged and audited globally. Provide justification.",
      placeholder: "e.g. Production incident response",
    });

    if (justification) {
      try {
        await breakGlass({ variables: { justification } });
        alert({ title: "PROTOCOL ACTIVE", message: "Emergency access granted for 4 hours.", type: "success" });
        refetch();
      } catch (err: any) {
        alert({ title: "Protocol Failure", message: err.message, type: "danger" });
      }
    }
  };

  const filteredUsers = users.filter((u: any) => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[var(--card-bg)]/20 rounded-3xl border border-[var(--card-border)] overflow-hidden">
      {/* Sub-Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)]/30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveSubTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeSubTab === "users" ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:bg-white/5"}`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Global Users</span>
          </button>
          <button 
            onClick={() => setActiveSubTab("roles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeSubTab === "roles" ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:bg-white/5"}`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Security Roles</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBreakGlass}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg group hover:bg-rose-500/20 transition-all"
          >
            <ShieldAlert className="w-3 h-3 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest">Break-Glass Protocol</span>
          </button>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search identity vault..."
              className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-10 pr-4 text-[10px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {activeSubTab === "users" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user: any) => {
              const isEmergency = user.emergencyAccessExpiry && new Date(user.emergencyAccessExpiry) > new Date();
              return (
                <div key={user.id} className={`group relative bg-[var(--card-bg)]/80 border ${isEmergency ? 'border-rose-500/40' : 'border-[var(--card-border)]'} rounded-3xl p-6 hover:border-[var(--primary)]/30 transition-all shadow-xl hover:shadow-[var(--primary-glow)]/5`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${isEmergency ? 'bg-rose-500/10 border-rose-500/20' : 'bg-[var(--primary)]/10 border-[var(--primary)]/20'} flex items-center justify-center border`}>
                        <span className={`text-lg font-black ${isEmergency ? 'text-rose-500' : 'text-[var(--primary)]'} uppercase`}>{user.firstName[0]}{user.lastName[0]}</span>
                      </div>
                      <div>
                        <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-tighter">{user.firstName} {user.lastName}</h3>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] opacity-70">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {user.tenantId && (
                            <p className="text-[7px] font-black text-[var(--primary)] uppercase tracking-[0.2em] bg-[var(--primary)]/5 px-1.5 py-0.5 rounded border border-[var(--primary)]/10">
                              Org ID: {user.tenantId.slice(0, 8)}
                            </p>
                          )}
                          {isEmergency && (
                            <p className="text-[7px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 animate-pulse">
                              Emergency Level 1
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5 gap-y-2">
                      {roles.map((role: any) => {
                        const hasRole = user.roles.includes(role.name);
                        return (
                          <button
                            key={role.id}
                            onClick={() => handleToggleRole(user, role.name, hasRole)}
                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                              hasRole 
                                ? "bg-[var(--primary)]/20 text-[var(--primary)] border-[var(--primary)]/40 shadow-inner" 
                                : "bg-[var(--card-bg)]/50 text-[var(--text-muted)] border-[var(--card-border)] hover:border-[var(--primary)]/30"
                            }`}
                          >
                            {role.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--card-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className={`w-3 h-3 ${isEmergency ? 'text-rose-500' : 'text-[var(--primary)]'}`} />
                      <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                        {isEmergency ? 'Audited Session' : 'Active Session'}
                      </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
            {/* Roles List */}
            <div className="lg:col-span-1 space-y-3">
              <div className="px-4 mb-4 flex items-center justify-between">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Security Definitions</p>
                <button 
                  onClick={handleCreateRole}
                  className="w-6 h-6 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary)] transition-all hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {roles.map((role: any) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all ${
                    selectedRoleId === role.id 
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-xl shadow-[var(--primary-glow)]" 
                      : "bg-[var(--card-bg)]/80 border border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--primary)]/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-4 h-4 ${selectedRoleId === role.id ? "text-white" : "text-[var(--primary)]"}`} />
                    <span className="text-[11px] font-black uppercase tracking-tighter">{role.name}</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                    selectedRoleId === role.id ? "bg-white/20 border-white/30" : "bg-white/5 border-white/10"
                  }`}>
                    {role.permissions.length}
                  </div>
                </button>
              ))}
            </div>

            {/* Permission Grid */}
            <div className="lg:col-span-3">
              {selectedRole ? (
                <div className="bg-[var(--card-bg)]/80 border border-[var(--card-border)] rounded-3xl p-8 h-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-[var(--primary)]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Permission Matrix: {selectedRole.name}</h2>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">Granting granular authority across clinical nodes</p>
                      </div>
                    </div>
                    {selectedRole.name !== "Admin" && (
                      <button 
                        onClick={() => handleDeleteRole(selectedRole)}
                        className="p-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
                      >
                        <ShieldAlert className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {AVAILABLE_PERMISSIONS.map((permission) => {
                      const hasPermission = selectedRole.permissions.includes(permission);
                      const [group, action] = permission.split(':');
                      
                      return (
                        <button
                          key={permission}
                          onClick={() => handleTogglePermission(selectedRole, permission)}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                            hasPermission
                              ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                              : "bg-[var(--input-bg)] border-[var(--card-border)] opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                          }`}
                        >
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1">{group}</span>
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${hasPermission ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{action}</span>
                          </div>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                            hasPermission ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "bg-[var(--card-bg)] border-[var(--card-border)] text-transparent"
                          }`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-30">
                  <ShieldAlert className="w-20 h-20 mb-6" />
                  <p className="text-[12px] font-black uppercase tracking-[0.4em]">Select a Security Role to edit permissions</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
