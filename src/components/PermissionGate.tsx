'use client';

import React, { ReactNode } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';

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
  // Always render children (no permission checking)
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
  // Always render children (no role checking)
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
  // Always render children (no permission checking)
  return <>{children}</>;
};

interface CannotProps {
  permission: string;
  children: ReactNode;
}

/**
 * Inverse permission check component
 */
export const Cannot: React.FC<CannotProps> = ({ permission, children }) => {
  // Never render children (no permission checking)
  return null;
};