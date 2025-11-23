'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { AuthService } from '@/lib/auth';
import { permissionResolver, PermissionResolver, EntityAction, Entity } from '@/lib/permissionResolver';
import { isInSubtree } from '@/lib/hierarchyUtils';

// Hierarchical User Interface
interface HierarchicalUser {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  avatar?: {
    url: string;
    key: string;
  } | string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  unionAssignments?: Array<UnionAssignment>;
  conferenceAssignments?: Array<ConferenceAssignment>;
  churchAssignments?: Array<ChurchAssignment>;
  primaryUnion?: string;
  primaryConference?: string;
  primaryChurch?: string;
  teamAssignments?: TeamAssignment[];
  primaryTeam?: string;
  // Hierarchical Properties
  hierarchyLevel: number; // 0=super_admin, 1=conference, 2=church, 3=team, 4=service
  hierarchyPath: string;  // e.g., "union123/conference456/church789"
  managedLevels: number[]; // Levels this user can manage
}

interface UnionAssignment {
  union: string;
  role: {
    _id: string;
    name: string;
    displayName: string;
    hierarchyLevel?: number;
    canManage?: number[];
  };
  assignedAt: string;
}

interface ConferenceAssignment {
  conference: string;
  role: {
    _id: string;
    name: string;
    displayName: string;
    hierarchyLevel?: number;
    canManage?: number[];
  };
  assignedAt: string;
}

interface ChurchAssignment {
  church: string;
  role: {
    _id: string;
    name: string;
    displayName: string;
    hierarchyLevel?: number;
    canManage?: number[];
  };
  assignedAt: string;
}

interface TeamAssignment {
  teamId: string;
  role: 'leader' | 'member' | 'communications';
  assignedAt: string;
  team?: {
    _id: string;
    name: string;
    type: string;
    churchId: string;
    hierarchyPath: string;
  };
}

interface AccessibleEntity {
  _id: string;
  name: string;
  hierarchyPath?: string;
  hierarchyLevel?: string | number;
  type?: string;
  churchId?: string;
  parentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Raw API response interfaces for proper typing
interface RawTeamData {
  _id: string;
  name: string;
  type: string;
  // Legacy field removed
  churchId?: string;
  hierarchyPath?: string;
}

interface RawTeamAssignment {
  teamId: string;
  role: 'leader' | 'member' | 'communications';
  assignedAt: string;
  team?: RawTeamData;
}

interface RawUnionData {
  _id: string;
  name: string;
  hierarchyLevel?: string;
  hierarchyPath?: string;
}

interface RawConferenceData {
  _id: string;
  name: string;
  hierarchyLevel?: string;
  hierarchyPath?: string;
}

interface RawChurchData {
  _id: string;
  name: string;
  hierarchyLevel?: string;
  hierarchyPath?: string;
}

interface RawUnionAssignment {
  union: string;
  role: {
    _id: string;
    name: string;
    displayName: string;
    level?: string;
    hierarchyLevel?: number;
    canManage?: number[];
  };
  assignedAt: string;
}

interface HierarchicalPermissionContextType {
  user: HierarchicalUser | null;
  permissions: string[];
  loading: boolean;
  
  // Hierarchical Permission Checks
  hasPermission: (permission: string) => boolean;
  canManageEntity: (entityType: string, entityPath: string) => boolean;
  canCreateEntity: (entityType: string, parentPath?: string) => boolean;
  
  // Enhanced Entity Permission Checks
  canViewEntity: (entity: AccessibleEntity | null, entityType: string) => boolean;
  canEditEntity: (entity: AccessibleEntity | null, entityType: string) => boolean;
  canDeleteEntity: (entity: AccessibleEntity | null, entityType: string) => boolean;
  getAllowedActions: (entity: AccessibleEntity | null, entityType: string) => EntityAction[];
  
  // Hierarchy Context
  currentLevel: number;
  currentPath: string;
  availableLevels: number[];
  
  // Organization Context
  currentOrganization: {_id: string; name: string; hierarchyLevel: string} | null;
  organizations: Array<{_id: string; name: string; hierarchyLevel: string; hierarchyPath: string}>;
  switchOrganization: (organizationId: string) => void;
  
  // Team Context
  currentTeam: TeamAssignment['team'] | null;
  teams: TeamAssignment[];
  teamRole: TeamAssignment['role'] | null;
  switchTeam: (teamId: string) => void;
  
  // Entity Access
  getAccessibleEntities: (entityType: string) => Promise<AccessibleEntity[]>;
  reloadPermissions: () => Promise<void>;
  
  // Permission Resolver Instance
  permissionResolver: PermissionResolver;
}

const HierarchicalPermissionContext = createContext<HierarchicalPermissionContextType | undefined>(undefined);

export const useHierarchicalPermissions = () => {
  const context = useContext(HierarchicalPermissionContext);
  if (!context) {
    throw new Error('useHierarchicalPermissions must be used within a HierarchicalPermissionProvider');
  }
  return context;
};

// Legacy aliases for backward compatibility
export const usePermissions = useHierarchicalPermissions;
export const useAuth = useHierarchicalPermissions;

// Additional compatibility hooks 
export const useHasPermission = (permission: string): boolean => {
  const { hasPermission } = useHierarchicalPermissions();
  return hasPermission(permission);
};

// Team permission checks with hierarchical support
export const useHasTeamPermission = (permission: string, teamId?: string): boolean => {
  const { canManageEntity, currentTeam } = useHierarchicalPermissions();
  
  // If no specific team provided, use current team
  const targetTeamId = teamId || currentTeam?._id;
  if (!targetTeamId) return false;
  
  // Check hierarchical team access
  return canManageEntity('team', targetTeamId);
};

// Team-specific hooks for backward compatibility
export const useCurrentTeam = () => {
  const { currentTeam, teamRole } = useHierarchicalPermissions();
  return { currentTeam, teamRole };
};

export const useUserTeams = () => {
  const { teams } = useHierarchicalPermissions();
  return teams;
};

interface HierarchicalPermissionProviderProps {
  children: ReactNode;
}

export const HierarchicalPermissionProvider: React.FC<HierarchicalPermissionProviderProps> = ({ children }) => {
  const [user, setUser] = useState<HierarchicalUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentOrganization, setCurrentOrganization] = useState<{_id: string; name: string; hierarchyLevel: string} | null>(null);
  const [organizations, setOrganizations] = useState<Array<{_id: string; name: string; hierarchyLevel: string; hierarchyPath: string}>>([]);
  
  // Team state
  const [teams, setTeams] = useState<TeamAssignment[]>([]);
  const [currentTeam, setCurrentTeam] = useState<TeamAssignment['team'] | null>(null);
  const [teamRole, setTeamRole] = useState<TeamAssignment['role'] | null>(null);
  
  // Logout timeout ref
  const logoutTimeout = useRef<NodeJS.Timeout | null>(null);

  const loadUserAndPermissions = useCallback(async () => {
    try {
      console.log('[HierarchicalPermissionContext] loadUserAndPermissions called');
      setLoading(true);
      const token = AuthService.getToken();
      
      if (!token) {
        console.log('[HierarchicalPermissionContext] No token found, clearing user state');
        setUser(null);
        setPermissions([]);
        setOrganizations([]);
        setCurrentOrganization(null);
        setLoading(false);
        return;
      }

      // Verify authentication with hierarchical data
      const authResponse = await AuthService.verifyAuthHierarchical(token);
      
      if (!authResponse.success || !authResponse.data?.user) {
        setLoading(false);
        return;
      }

      const userData = authResponse.data.user;
      
      // Transform team assignments to match hierarchical interface
      let transformedTeams: TeamAssignment[] | undefined;
      if (userData.teamAssignments) {
        transformedTeams = (userData.teamAssignments as RawTeamAssignment[])
          .map((ta: RawTeamAssignment) => {
            // Ensure churchId is available - teams must be bound to churches
            const churchId = ta.team?.organizationId || ta.team?.churchId;
            
            return {
              teamId: ta.teamId,
              role: ta.role,
              assignedAt: ta.assignedAt,
              team: ta.team && churchId ? {
                _id: ta.team._id,
                name: ta.team.name,
                type: ta.team.type,
                churchId: churchId, // Now guaranteed to be string
                hierarchyPath: ta.team.hierarchyPath || ''
              } : undefined
            };
          })
          .filter((ta) => ta.team !== undefined) // Filter out invalid teams
          .map((ta) => ta as TeamAssignment); // Cast to correct type after filtering
      }
      
      // Transform to hierarchical user format
      const hierarchicalUser: HierarchicalUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        verified: userData.verified,
        avatar: userData.avatar,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        country: userData.country,
        organizations: userData.organizations as OrganizationAssignment[] | undefined,
        primaryOrganization: userData.primaryOrganization,
        teamAssignments: transformedTeams,
        primaryTeam: userData.primaryTeam,
        hierarchyLevel: authResponse.data.hierarchyLevel || 4,
        hierarchyPath: authResponse.data.hierarchyPath || '',
        managedLevels: authResponse.data.managedLevels || []
      };
      
      setUser(hierarchicalUser);
      setPermissions(authResponse.data.permissions || []);
      
      // Set organizations and current organization (simplified since we removed Organization model)
      if (userData.organizations && userData.organizations.length > 0) {
        console.log('🏢 [HIERARCHICAL CONTEXT] User organizations:', userData.organizations);
        
        // Create dummy organization entries based on roles since we no longer have Organization model
        const extractedOrgs = userData.organizations.map((orgAssignment: any, index: number) => {
          return {
            _id: `role-org-${index}`, // Generate fake org ID based on role
            name: `Organization ${index + 1}`, // Generic name since we don't have org data
            hierarchyLevel: 'church', // Default level
            hierarchyPath: '' // Empty path since we don't have org hierarchy
          };
        });
        
        setOrganizations(extractedOrgs);
        
        // Set current organization to first one
        if (extractedOrgs.length > 0) {
          setCurrentOrganization(extractedOrgs[0]);
          localStorage.setItem('currentOrganizationId', extractedOrgs[0]._id);
        }
      } else {
        // For super admins or users without organization assignments, create default org
        const defaultOrg = {
          _id: 'default-org',
          name: 'System',
          hierarchyLevel: 'system',
          hierarchyPath: ''
        };
        setOrganizations([defaultOrg]);
        setCurrentOrganization(defaultOrg);
        localStorage.setItem('currentOrganizationId', defaultOrg._id);
      }
      
      // Set teams and current team (use already transformed teams)
      if (transformedTeams) {
        setTeams(transformedTeams);
        
        if (userData.primaryTeam) {
          const primaryTeamAssignment = transformedTeams.find((ta: TeamAssignment) => ta.teamId === userData.primaryTeam);
          if (primaryTeamAssignment?.team) {
            setCurrentTeam(primaryTeamAssignment.team);
            setTeamRole(primaryTeamAssignment.role);
          }
        } else if (transformedTeams.length > 0) {
          const firstTeam = transformedTeams[0];
          if (firstTeam.team) {
            setCurrentTeam(firstTeam.team);
            setTeamRole(firstTeam.role);
          }
        }
      }
      
    } catch (error) {
      console.error('Error loading hierarchical user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user data and permissions on mount
  useEffect(() => {
    loadUserAndPermissions();
  }, [loadUserAndPermissions]);

  // Listen for storage changes and logout events
  useEffect(() => {
    const handleLogout = () => {
      console.log('[HierarchicalPermissionContext] Logout event received, clearing state');
      
      if (logoutTimeout.current) {
        clearTimeout(logoutTimeout.current);
        logoutTimeout.current = null;
      }
      
      setUser(null);
      setPermissions([]);
      setOrganizations([]);
      setCurrentOrganization(null);
      setTeams([]);
      setCurrentTeam(null);
      setTeamRole(null);
      
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        handleLogout();
      } else if (e.key === 'token' && e.newValue) {
        loadUserAndPermissions();
      }
    };

    window.addEventListener('logout', handleLogout);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('logout', handleLogout);
      window.removeEventListener('storage', handleStorageChange);
      if (logoutTimeout.current) {
        clearTimeout(logoutTimeout.current);
        logoutTimeout.current = null;
      }
    };
  }, [loadUserAndPermissions]);

  // Hierarchical permission checking
  const canManageEntity = useCallback((entityType: string, entityPath: string): boolean => {
    if (!user) return false;
    
    const entity = { _id: '', hierarchyPath: entityPath, type: entityType };
    const result = permissionResolver.canPerformAction(
      {
        id: user.id,
        hierarchyLevel: user.hierarchyLevel,
        hierarchyPath: user.hierarchyPath,
        managedLevels: user.managedLevels,
        permissions,
        organizations: user.organizations,
        teamAssignments: user.teamAssignments
      },
      'manage',
      entity,
      entityType
    );
    
    return result.allowed;
  }, [user, permissions]);

  const canCreateEntity = useCallback((entityType: string, parentPath?: string): boolean => {
    if (!user) return false;
    
    const parentEntity = parentPath ? { _id: '', hierarchyPath: parentPath, type: entityType } : null;
    const result = permissionResolver.canPerformAction(
      {
        id: user.id,
        hierarchyLevel: user.hierarchyLevel,
        hierarchyPath: user.hierarchyPath,
        managedLevels: user.managedLevels,
        permissions,
        organizations: user.organizations,
        teamAssignments: user.teamAssignments
      },
      'create',
      parentEntity,
      entityType
    );
    
    return result.allowed;
  }, [user, permissions]);
  
  // Helper function to convert AccessibleEntity to Entity
  const toEntity = (entity: AccessibleEntity | null): Entity | null => {
    if (!entity) return null;
    return {
      _id: entity._id,
      hierarchyPath: entity.hierarchyPath || '',
      hierarchyLevel: entity.hierarchyLevel,
      type: entity.type
    };
  };

  // Enhanced entity permission checks
  const canViewEntity = useCallback((entity: AccessibleEntity | null, entityType: string): boolean => {
    if (!user) return false;
    
    const result = permissionResolver.canPerformAction(
      {
        id: user.id,
        hierarchyLevel: user.hierarchyLevel,
        hierarchyPath: user.hierarchyPath,
        managedLevels: user.managedLevels,
        permissions,
        organizations: user.organizations,
        teamAssignments: user.teamAssignments
      },
      'view',
      toEntity(entity),
      entityType
    );
    
    return result.allowed;
  }, [user, permissions]);
  
  const canEditEntity = useCallback((entity: AccessibleEntity | null, entityType: string): boolean => {
    if (!user) return false;
    
    const result = permissionResolver.canPerformAction(
      {
        id: user.id,
        hierarchyLevel: user.hierarchyLevel,
        hierarchyPath: user.hierarchyPath,
        managedLevels: user.managedLevels,
        permissions,
        organizations: user.organizations,
        teamAssignments: user.teamAssignments
      },
      'edit',
      toEntity(entity),
      entityType
    );
    
    return result.allowed;
  }, [user, permissions]);
  
  const canDeleteEntity = useCallback((entity: AccessibleEntity | null, entityType: string): boolean => {
    if (!user) return false;
    
    const result = permissionResolver.canPerformAction(
      {
        id: user.id,
        hierarchyLevel: user.hierarchyLevel,
        hierarchyPath: user.hierarchyPath,
        managedLevels: user.managedLevels,
        permissions,
        organizations: user.organizations,
        teamAssignments: user.teamAssignments
      },
      'delete',
      toEntity(entity),
      entityType
    );
    
    return result.allowed;
  }, [user, permissions]);
  
  const getAllowedActions = useCallback((entity: AccessibleEntity | null, entityType: string): EntityAction[] => {
    if (!user) return [];
    
    return permissionResolver.getAllowedActions(
      {
        id: user.id,
        hierarchyLevel: user.hierarchyLevel,
        hierarchyPath: user.hierarchyPath,
        managedLevels: user.managedLevels,
        permissions,
        organizations: user.organizations,
        teamAssignments: user.teamAssignments
      },
      toEntity(entity),
      entityType
    );
  }, [user, permissions]);

  const getAccessibleEntities = useCallback(async (entityType: string): Promise<AccessibleEntity[]> => {
    if (!user) return [];
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = AuthService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/api/${entityType}/accessible`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
    } catch (error) {
      console.error(`Error fetching accessible ${entityType}:`, error);
    }
    
    return [];
  }, [user]);

  const switchOrganization = async (organizationId: string) => {
    const org = organizations.find(o => o._id === organizationId);
    if (org) {
      // Validate organization switch is allowed
      if (user && !isInSubtree(org.hierarchyPath, user.hierarchyPath) && user.hierarchyLevel !== 0) {
        console.warn('Cannot switch to organization outside user hierarchy');
        return;
      }
      
      setCurrentOrganization(org);
      localStorage.setItem('currentOrganizationId', org._id);
      
      // Clear permission cache when switching context
      permissionResolver.clearUserCache(user?.id || '');
      
      // Reload permissions for new organization context
      await loadUserAndPermissions();
    }
  };

  const switchTeam = (teamId: string) => {
    const teamAssignment = teams.find(ta => ta.teamId === teamId);
    if (teamAssignment?.team) {
      // Validate team switch is allowed
      if (user && teamAssignment.team.hierarchyPath && 
          !isInSubtree(teamAssignment.team.hierarchyPath, user.hierarchyPath) && 
          user.hierarchyLevel !== 0) {
        console.warn('Cannot switch to team outside user hierarchy');
        return;
      }
      
      setCurrentTeam(teamAssignment.team);
      setTeamRole(teamAssignment.role);
      
      // Clear permission cache when switching context
      permissionResolver.clearUserCache(user?.id || '');
      
      // Team switch might affect organization context
      if (teamAssignment.team.churchId) {
        switchOrganization(teamAssignment.team.churchId);
      }
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!permissions || permissions.length === 0) {
      return false;
    }

    // Check for wildcard permissions (*, all)
    if (permissions.includes('*') || permissions.includes('all')) {
      return true;
    }

    // Check exact match
    if (permissions.includes(permission)) {
      return true;
    }

    // Check resource wildcard (e.g., 'users.*' matches 'users.create')
    const [resource, action] = permission.split('.');
    if (permissions.includes(`${resource}.*`)) {
      return true;
    }

    // Check for scoped permissions (e.g., 'organizations.create:subordinate' matches 'organizations.create')
    const hasScoped = permissions.some(perm => {
      const [permResource, permActionWithScope] = perm.split('.');
      if (!permActionWithScope || !permActionWithScope.includes(':')) {
        return false;
      }

      const [permAction] = permActionWithScope.split(':');
      return permResource === resource && permAction === action;
    });

    return hasScoped;
  };

  // Clear permission cache on logout
  useEffect(() => {
    const handleLogoutCache = () => {
      permissionResolver.clearCache();
    };
    
    window.addEventListener('logout', handleLogoutCache);
    return () => window.removeEventListener('logout', handleLogoutCache);
  }, []);

  const contextValue: HierarchicalPermissionContextType = {
    user,
    permissions,
    loading,
    hasPermission,
    canManageEntity,
    canCreateEntity,
    canViewEntity,
    canEditEntity,
    canDeleteEntity,
    getAllowedActions,
    currentLevel: user?.hierarchyLevel ?? -1,
    currentPath: user?.hierarchyPath ?? '',
    availableLevels: user?.managedLevels ?? [],
    currentOrganization,
    organizations,
    switchOrganization,
    currentTeam,
    teams,
    teamRole,
    switchTeam,
    getAccessibleEntities,
    reloadPermissions: loadUserAndPermissions,
    permissionResolver,
  };

  return (
    <HierarchicalPermissionContext.Provider value={contextValue}>
      {children}
    </HierarchicalPermissionContext.Provider>
  );
};

// Enhanced Permission Gate for hierarchical checks
interface HierarchicalGateProps {
  requiredLevel?: number;
  targetEntityPath?: string;
  entityType?: string;
  action?: 'read' | 'create' | 'update' | 'delete';
  permission?: string; // For backward compatibility
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const HierarchicalGate: React.FC<HierarchicalGateProps> = ({
  requiredLevel,
  targetEntityPath,
  entityType,
  action = 'read',
  permission,
  fallback = null,
  children
}) => {
  const { user, hasPermission, canManageEntity, canCreateEntity } = useHierarchicalPermissions();
  
  // Legacy permission check
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }
  
  // Level-based check
  if (requiredLevel !== undefined) {
    const hasLevel = user && user.hierarchyLevel <= requiredLevel;
    return hasLevel ? <>{children}</> : <>{fallback}</>;
  }
  
  // Entity-based check  
  if (targetEntityPath && entityType) {
    if (action === 'create') {
      const canCreate = canCreateEntity(entityType, targetEntityPath);
      return canCreate ? <>{children}</> : <>{fallback}</>;
    } else {
      const canAccess = canManageEntity(entityType, targetEntityPath);
      return canAccess ? <>{children}</> : <>{fallback}</>;
    }
  }
  
  return <>{children}</>;
};