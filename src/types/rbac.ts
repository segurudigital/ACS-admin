// RBAC Type Definitions

// Base interface for all hierarchical levels
interface BaseHierarchyLevel {
  _id: string;
  name: string;
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

// Union: Top-level administrative division (Level 0)
export interface Union extends BaseHierarchyLevel {
  type: 'union';
  hierarchyPath: string;
  hierarchyLevel: number;
  territory?: {
    description?: string;
  };
  headquarters?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  primaryImage?: {
    url: string;
    thumbnailUrl?: string;
    key: string;
    alt: string;
    mediaFileId?: string;
  };
  parentEntity?: never; // Unions have no parent
}

// Conference: Regional division under union (Level 1)
export interface Conference extends BaseHierarchyLevel {
  type: 'conference';
  hierarchyPath: string;
  hierarchyLevel: number;
  unionId: string; // Reference to parent union
  union?: Union | string; // Reference to parent union
  territory?: {
    description?: string;
  };
  headquarters?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  primaryImage?: {
    url: string;
    thumbnailUrl?: string;
    key: string;
    alt: string;
    mediaFileId?: string;
  };
  programs?: {
    name: string;
    type?: string;
    director?: string;
    contact?: string;
    description?: string;
  }[];
  metadata: {
    address?: string;
    phone?: string;
    territory?: string[];
    email?: string;
    churchCount?: number;
    membershipCount?: number;
    lastReportDate?: string;
    lastUpdated?: string;
  };
  parentEntity?: {
    _id: string;
    name: string;
    type: 'union';
  };
}

// Church: Local church organization (Level 2)
export interface Church extends BaseHierarchyLevel {
  type: 'church';
  hierarchyPath: string;
  hierarchyLevel: number;
  conferenceId: string; // Reference to parent conference
  unionId: string; // Reference to root union (for faster queries)
  conference?: Conference | string; // Reference to parent conference
  church?: Church | string; // Self-reference for consistency
  user?: User | string; // User reference for consistency
  parentEntity?: {
    _id: string;
    name: string;
    type: 'conference';
  };
}

// Union type for all hierarchical entities
export type HierarchicalEntity = Union | Conference | Church;


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

// New specific assignment types for the hierarchical system
export interface UnionAssignment {
  union: Union | string;
  role: Role | string;
  assignedAt: string;
  assignedBy?: User | string;
  expiresAt?: string;
}

export interface ConferenceAssignment {
  conference: Conference | string;
  role: Role | string;
  assignedAt: string;
  assignedBy?: User | string;
  expiresAt?: string;
}

export interface ChurchAssignment {
  church: Church | string;
  role: Role | string;
  assignedAt: string;
  assignedBy?: User | string;
  expiresAt?: string;
}

// Generic assignment type used in UI components
export interface HierarchicalAssignment {
  entity: HierarchicalEntity | string;
  role: Role | string;
  assignedAt: string;
  assignedBy?: User | string;
  expiresAt?: string;
}

// Union type for all assignment types
export type SpecificAssignment = UnionAssignment | ConferenceAssignment | ChurchAssignment;


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
  
  // Generic hierarchical assignments used in UI components
  hierarchicalAssignments?: HierarchicalAssignment[];
  
  // New hierarchical assignments
  unionAssignments?: UnionAssignment[];
  conferenceAssignments?: ConferenceAssignment[];
  churchAssignments?: ChurchAssignment[];
  
  // Primary organizational assignment
  primaryUnion?: Union | string;
  primaryConference?: Conference | string;
  primaryChurch?: Church | string;
  
  
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
  
  // Hierarchical entity references
  union?: string;
  conference?: string;
  church?: string;
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
  // New hierarchical resources
  UNIONS: 'unions',
  CONFERENCES: 'conferences',
  CHURCHES: 'churches',
  
  // General resources
  USERS: 'users',
  ROLES: 'roles',
  REPORTS: 'reports',
  SERVICES: 'services',
  SETTINGS: 'settings',
  AUDIT: 'audit',
  NOTIFICATIONS: 'notifications',
  
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