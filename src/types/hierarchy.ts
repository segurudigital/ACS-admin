// Hierarchical Service Types

// Proper Union interface that matches the backend model
export interface Union {
  _id: string;
  name: string;
  hierarchyPath: string;
  hierarchyLevel: number;
  territory: {
    description?: string;
  };
  headquarters: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  contact: {
    email?: string;
    phone?: string;
    website?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: {
    membershipCount?: number;
    churchCount?: number;
    lastUpdated: string;
  };
  statistics?: {
    conferences: number;
    churches: number;
    teams: number;
    services: number;
  };
}

// Import other types from rbac (keeping Conference and Church)
import { Conference, Church } from './rbac';

// API Response Types for hierarchical endpoints
export interface UnionListResponse {
  success: boolean;
  message: string;
  data: Union[];
}

export interface ConferenceListResponse {
  success: boolean;
  message: string;
  data: Conference[];
}

export interface ChurchListResponse {
  success: boolean;
  message: string;
  data: Church[];
}

export interface UnionResponse {
  success: boolean;
  message: string;
  data: Union;
}

export interface ConferenceResponse {
  success: boolean;
  message: string;
  data: Conference;
}

export interface ChurchResponse {
  success: boolean;
  message: string;
  data: Church;
}

// Create/Update Types
export interface CreateUnionData {
  name: string;
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
}

export interface CreateConferenceData {
  name: string;
  code?: string;
  unionId: string;
  territory?: {
    states?: string[];
    regions?: string[];
    description?: string;
  };
  headquarters?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    timezone?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  leadership?: {
    president?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    secretaryTreasurer?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    acsDirector?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
  establishedDate?: string;
}

export interface CreateChurchData {
  name: string;
  conferenceId: string;
  metadata?: {
    address?: string;
    phone?: string;
    territory?: string[];
    email?: string;
  };
}

// Update Types (all fields optional)
export interface UpdateUnionData extends Partial<CreateUnionData> {
  isActive?: boolean;
}

export interface UpdateConferenceData extends Partial<CreateConferenceData> {
  isActive?: boolean;
}

export interface UpdateChurchData extends Partial<CreateChurchData> {
  isActive?: boolean;
}

// Query Filters
export interface UnionListParams {
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ConferenceListParams {
  unionId?: string;
  isActive?: boolean;
  includeInactive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ChurchListParams {
  conferenceId?: string;
  unionId?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// Hierarchy Navigation Types
export interface HierarchyPath {
  union: Union;
  conference?: Conference;
  church?: Church;
}

export interface HierarchyTreeNode {
  entity: Union | Conference | Church;
  children: HierarchyTreeNode[];
  level: 'union' | 'conference' | 'church';
}

// Quick Setup Types for new hierarchical system
export interface UnionQuickSetupData {
  union: CreateUnionData;
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
  sendInvitation?: boolean;
}

export interface ConferenceQuickSetupData {
  conference: CreateConferenceData;
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
  sendInvitation?: boolean;
}

export interface ChurchQuickSetupData {
  church: CreateChurchData;
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
  sendInvitation?: boolean;
}

// Bulk Operations
export interface BulkUnionCreateData {
  unions: UnionQuickSetupData[];
}

export interface BulkConferenceCreateData {
  conferences: ConferenceQuickSetupData[];
}

export interface BulkChurchCreateData {
  churches: ChurchQuickSetupData[];
}

export interface BulkOperationResult<T> {
  successful: T[];
  failed: Array<{
    data: T;
    error: string;
  }>;
}

// Service Error Types
export interface HierarchyServiceError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

// Permission Context Types for hierarchical system
export interface HierarchyPermissionContext {
  currentUnion?: Union;
  currentConference?: Conference;
  currentChurch?: Church;
  accessibleUnions: Union[];
  accessibleConferences: Conference[];
  accessibleChurches: Church[];
  userPermissions: string[];
  canCreateUnion: boolean;
  canCreateConference: boolean;
  canCreateChurch: boolean;
}

// Utility Types
export type EntityType = 'union' | 'conference' | 'church';
export type EntityLevel = 0 | 1 | 2; // 0=union, 1=conference, 2=church

export interface EntityLevelInfo {
  type: EntityType;
  level: EntityLevel;
  parentType?: EntityType;
  childType?: EntityType;
}

export const ENTITY_LEVEL_MAP: Record<EntityType, EntityLevelInfo> = {
  union: {
    type: 'union',
    level: 0,
    childType: 'conference'
  },
  conference: {
    type: 'conference',
    level: 1,
    parentType: 'union',
    childType: 'church'
  },
  church: {
    type: 'church',
    level: 2,
    parentType: 'conference'
  }
};