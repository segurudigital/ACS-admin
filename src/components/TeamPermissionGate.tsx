'use client';

import React from 'react';
import { usePermissions } from '../contexts/PermissionContext';

interface TeamPermissionGateProps {
  permission?: string;
  teamPermission?: string;
  teamRole?: 'leader' | 'member' | 'communications';
  requireAll?: boolean;
  children: React.ReactNode;
}

export function TeamPermissionGate({ 
  permission, 
  teamPermission, 
  teamRole,
  requireAll = false,
  children 
}: TeamPermissionGateProps) {
  const { hasPermission, hasTeamPermission, teamRole: userTeamRole } = usePermissions();

  let hasAccess = false;

  if (requireAll) {
    // All conditions must be true
    hasAccess = true;
    if (permission && !hasPermission(permission)) {
      hasAccess = false;
    }
    if (teamPermission && !hasTeamPermission(teamPermission)) {
      hasAccess = false;
    }
    if (teamRole && userTeamRole !== teamRole) {
      hasAccess = false;
    }
  } else {
    // At least one condition must be true
    if (permission && hasPermission(permission)) {
      hasAccess = true;
    }
    if (teamPermission && hasTeamPermission(teamPermission)) {
      hasAccess = true;
    }
    if (teamRole && userTeamRole === teamRole) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}