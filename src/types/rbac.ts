// RBAC Type Definitions - TEAM-CENTRIC APPROACH

// ENHANCED TEAM-CENTRIC INTERFACES
export interface TeamAssignment {
  teamId: string | Team;
  role: 'leader' | 'coordinator' | 'member';
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  invitedBy?: string | User;
  permissions?: string[];
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  churchId: string | Church;
  hierarchyPath: string;
  hierarchyDepth: number;
  leaderId?: string | User;
  createdBy: string | User;
  memberCount: number;
  settings: {
    allowSelfJoin: boolean;
    requireApproval: boolean;
    visibility: 'public' | 'private' | 'church';
    isPubliclyVisible: boolean;
    allowCrossChurchMembers: boolean;
    collaborationEnabled: boolean;
  };
  metadata: {
    ministry?: string;
    focus?: string[];
    targetAudience?: string[];
    serviceArea?: string;
    meetingSchedule?: string;
    customFields?: Record<string, unknown>;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  verified: boolean;
  avatar?: {
    url?: string;
    key?: string;
  };
  isSuperAdmin: boolean;
  
  // TEAM-CENTRIC ASSIGNMENTS
  teamAssignments: TeamAssignment[];
  primaryTeam?: string | Team;
  
  // DYNAMIC ORGANIZATIONAL CONTEXT (calculated from teams)
  accessibleChurches?: Church[];
  accessibleConferences?: Conference[];
  accessibleUnions?: Union[];
  
  // COMPUTED SCOPE
  organizationalScope?: {
    teams: string[];
    churches: string[];
    conferences: string[];
    unions: string[];
    hierarchyPaths: string[];
  };
  
  // INVITATION SYSTEM (preserved)
  invitationStatus: 'pending' | 'accepted' | 'expired';
  invitedBy?: string | User;
  invitedAt?: string;
  lastLoginAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentResult {
  success: boolean;
  assignment?: {
    userId: string;
    teamId: string;
    role: string;
    teamName: string;
    churchName?: string;
    status: string;
  };
  error?: string;
}

export interface BulkAssignmentResult {
  success: boolean;
  message: string;
  results: {
    successful: Array<{
      userId: string;
      assignment: AssignmentResult['assignment'];
    }>;
    failed: Array<{
      userId: string;
      error: string;
    }>;
  };
}

export interface TeamSuggestion {
  teamId: string;
  teamName: string;
  category?: string;
  tags: string[];
  description?: string;
  church?: string;
  memberCount: number;
  canJoin: boolean;
  leader?: string;
}

export interface UserAssignments {
  userId: string;
  primaryTeam?: string;
  assignments: Array<{
    teamId: string;
    teamName: string;
    teamCategory?: string;
    teamTags: string[];
    role: string;
    status: string;
    joinedAt: string;
    church: {
      id: string;
      name: string;
    };
    conference: {
      id: string;
      name: string;
    };
    union: {
      id: string;
      name: string;
    };
  }>;
  organizationalScope: {
    teams: string[];
    churches: string[];
    conferences: string[];
    unions: string[];
    hierarchyPaths: string[];
  };
}

// LEGACY INTERFACES (maintained for compatibility)

// Base interface for all hierarchical levels
interface BaseHierarchyLevel {
  _id: string;
  name: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  childCount?: number;
  primaryImage?: {
    url: string;
    thumbnailUrl?: string;
    key: string;
    alt: string;
    mediaFileId?: string;
  };
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
  
  // Church-specific properties
  code?: string; // Church code unique within conference
  establishedDate?: Date | string;
  
  location?: {
    address?: {
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  
  leadership?: {
    associatePastors?: Array<{
      name?: string;
      title?: string;
      email?: string;
      phone?: string;
      responsibilities?: string[];
    }>;
    acsCoordinator?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    firstElder?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    elders?: Array<{
      name: string;
      role?: string;
      email?: string;
      phone?: string;
    }>;
    coordinators?: Array<{
      name: string;
      department?: string;
      email?: string;
      phone?: string;
    }>;
  };
  
  demographics?: {
    membership?: {
      total?: number;
      baptized?: number;
      visiting?: number;
    };
    averageAttendance?: number;
    ageGroups?: {
      children?: number;
      youth?: number;
      adults?: number;
      seniors?: number;
    };
  };
  
  facilities?: {
    sanctuary?: {
      capacity?: number;
      hasAV?: boolean;
    };
    classrooms?: {
      count?: number;
      capacity?: number;
    };
    kitchen?: {
      capacity?: string;
      hasEquipment?: boolean;
    };
    other?: string[];
  };
  
  serviceSchedule?: {
    worship?: {
      day: string;
      time: string;
      description?: string;
    };
    prayerMeeting?: {
      day: string;
      time: string;
      description?: string;
    };
    other?: Array<{
      name: string;
      day: string;
      time: string;
      description?: string;
    }>;
  };
  
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