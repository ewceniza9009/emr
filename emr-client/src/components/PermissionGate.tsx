"use client";

import { useSession } from "next-auth/react";
import React from "react";

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  fallback?: React.ReactNode;
}

/**
 * PermissionGate
 * 
 * Encloses elements that require specific permissions or roles.
 * Supports single or multiple permissions/roles (OR logic).
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  permissions,
  role,
  roles,
  fallback = null,
}) => {
  const { data: session } = useSession();

  if (!session?.user) {
    return <>{fallback}</>;
  }

  const userPermissions = session.user.permissions || [];
  const userRoles = session.user.roles || [session.user.role].filter(Boolean);

  let hasAccess = false;

  // Check single permission
  if (permission && userPermissions.includes(permission)) {
    hasAccess = true;
  }

  // Check multiple permissions (OR logic)
  if (permissions && permissions.some((p) => userPermissions.includes(p))) {
    hasAccess = true;
  }

  // Check single role
  if (role && userRoles.includes(role)) {
    hasAccess = true;
  }

  // Check multiple roles (OR logic)
  if (roles && roles.some((r) => userRoles.includes(r as string))) {
    hasAccess = true;
  }

  // Special case: Admin always has access
  if (userRoles.includes("Admin")) {
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook for checking permissions programmatically in components
 */
export const usePermissions = () => {
  const { data: session } = useSession();
  
  const hasPermission = (permission: string) => {
    if (session?.user?.role === "Admin" || session?.user?.roles?.includes("Admin")) return true;
    return session?.user?.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string) => {
    return session?.user?.role === role || session?.user?.roles?.includes(role) || false;
  };

  return {
    hasPermission,
    hasRole,
    permissions: session?.user?.permissions || [],
    roles: session?.user?.roles || [session?.user?.role].filter(Boolean) as string[],
    isAdmin: session?.user?.role === "Admin" || session?.user?.roles?.includes("Admin"),
  };
};
