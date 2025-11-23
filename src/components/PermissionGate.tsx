'use client';

import React, { ReactNode } from 'react';
import { usePermissions } from '@/contexts/HierarchicalPermissionContext';

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * PermissionGate component for conditional rendering based on user permissions
 * 
 * @param permission - Single permission to check
 * @param permissions - Array of permissions to check
 * @param requireAll - If true, requires all permissions. If false, requires any permission (default: false)
 * @param fallback - Component to render if permission check fails
 * @param children - Components to render if permission check passes
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasPermission } = usePermissions();

  // Handle single permission check
  if (permission && !permissions) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Handle multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? permissions.every(perm => hasPermission(perm))
      : permissions.some(perm => hasPermission(perm));
    
    return hasRequiredPermissions ? <>{children}</> : <>{fallback}</>;
  }

  // No permissions specified - render children by default
  return <>{children}</>;
};

interface RoleGateProps {
  role?: string;
  roles?: string[];
  level?: 'union' | 'conference' | 'church';
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * RoleGate component for conditional rendering based on user role
 */
export const RoleGate: React.FC<RoleGateProps> = ({
  role,
  roles,
  level,
  fallback = null,
  children
}) => {
  const { role: userRole, type } = usePermissions();

  // Handle single role check
  if (role && !roles) {
    const hasRole = userRole === role;
    const hasCorrectLevel = !level || type === level;
    return (hasRole && hasCorrectLevel) ? <>{children}</> : <>{fallback}</>;
  }

  // Handle multiple roles check
  if (roles && roles.length > 0) {
    const hasRole = roles.includes(userRole || '');
    const hasCorrectLevel = !level || type === level;
    return (hasRole && hasCorrectLevel) ? <>{children}</> : <>{fallback}</>;
  }

  // No roles specified - render children by default
  return <>{children}</>;
};

interface CanProps {
  permission: string;
  children: ReactNode;
}

/**
 * Simple permission check component for inline use
 */
export const Can: React.FC<CanProps> = ({ permission, children }) => {
  const { hasPermission } = usePermissions();
  
  return hasPermission(permission) ? <>{children}</> : null;
};

interface CannotProps {
  permission: string;
  children: ReactNode;
}

/**
 * Inverse permission check component
 */
export const Cannot: React.FC<CannotProps> = ({ permission, children }) => {
  const { hasPermission } = usePermissions();
  
  return !hasPermission(permission) ? <>{children}</> : null;
};