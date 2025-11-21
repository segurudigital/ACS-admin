// RBAC Type Definitions

export interface Organization {
  _id: string;
  name: string;
  type: 'union' | 'conference' | 'church';
  parentOrganization?: {
    _id: string;
    name: string;
    type: string;
  };
  metadata: {
    address?: string;
    phone?: string;
    territory?: string[];
    email?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  childCount?: number;
}

export interface Role {
  _id: string;
  name?: string;
  displayName?: string;
  level?: 'union' | 'conference' | 'church';
  permissions?: string[];
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationAssignment {
  organization: Organization | string;
  role: Role | string;
  assignedAt: string;
  assignedBy?: User | string;
  expiresAt?: string;
}

export interface User {
  _id: string;
  id: string; // Alias for _id for compatibility
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  verified: boolean;
  avatar?: string;
  organizations: OrganizationAssignment[];
  primaryOrganization?: Organization | string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermissions {
  role: {
    id: string;
    name: string;
    displayName: string;
    level: string;
  };
  permissions: string[];
  organization: string;
}

// System role names
export const SYSTEM_ROLES = {
  UNION_ADMIN: 'union_admin',
  CONFERENCE_ADMIN: 'conference_admin',
  CHURCH_PASTOR: 'church_pastor',
  CHURCH_ACS_LEADER: 'church_acs_leader',
  CHURCH_TEAM_MEMBER: 'church_team_member',
  CHURCH_VIEWER: 'church_viewer'
} as const;

export type SystemRoleName = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

// Permission resources
export const PERMISSION_RESOURCES = {
  ORGANIZATIONS: 'organizations',
  USERS: 'users',
  ROLES: 'roles',
  REPORTS: 'reports',
  SERVICES: 'services',
  SETTINGS: 'settings',
  AUDIT: 'audit',
  NOTIFICATIONS: 'notifications'
} as const;

export type PermissionResource = typeof PERMISSION_RESOURCES[keyof typeof PERMISSION_RESOURCES];

// Permission actions
export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  ASSIGN_ROLE: 'assign_role',
  REVOKE_ROLE: 'revoke_role',
  EXPORT: 'export',
  MANAGE: 'manage'
} as const;

export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];

// Permission scopes
export const PERMISSION_SCOPES = {
  SELF: 'self',
  OWN: 'own',
  SUBORDINATE: 'subordinate',
  ALL: 'all',
  ASSIGNED: 'assigned',
  ACS_TEAM: 'acs_team',
  ACS: 'acs',
  PUBLIC: 'public'
} as const;

export type PermissionScope = typeof PERMISSION_SCOPES[keyof typeof PERMISSION_SCOPES];

// Helper type for permission strings
export type Permission = `${PermissionResource}.${PermissionAction}` | 
                        `${PermissionResource}.${PermissionAction}:${PermissionScope}` |
                        `${PermissionResource}.*` |
                        '*';