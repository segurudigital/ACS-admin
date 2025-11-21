
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { AuthService } from '@/lib/auth';

interface TeamAssignment {
  teamId: string;
  role: 'leader' | 'member' | 'communications';
  assignedAt: string;
  team?: {
    _id: string;
    name: string;
    type: string;
    organizationId: string;
  };
}

interface User {
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
  organizations?: Array<{_id: string; name: string; type: string}>;
  primaryOrganization?: string;
  teamAssignments?: TeamAssignment[];
  primaryTeam?: string;
}

interface PermissionContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  currentOrganization: {_id: string; name: string; type: string} | null;
  organizations: Array<{_id: string; name: string; type: string}>;
  role: string | null;
  switchOrganization: (organizationId: string) => void;
  reloadPermissions: () => Promise<void>;
  // Team context
  currentTeam: TeamAssignment['team'] | null;
  teams: TeamAssignment[];
  teamRole: TeamAssignment['role'] | null;
  switchTeam: (teamId: string) => void;
  hasTeamPermission: (permission: string, teamId?: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// Alias for backward compatibility
export const useAuth = usePermissions;

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentOrganization, setCurrentOrganization] = useState<{_id: string; name: string; type: string} | null>(null);
  const [organizations, setOrganizations] = useState<Array<{_id: string; name: string; type: string}>>([]);
  const [role, setRole] = useState<string | null>(null);
  // Team state
  const [teams, setTeams] = useState<TeamAssignment[]>([]);
  const [currentTeam, setCurrentTeam] = useState<TeamAssignment['team'] | null>(null);
  const [teamRole, setTeamRole] = useState<TeamAssignment['role'] | null>(null);
  
  // Logout timeout ref
  const logoutTimeout = useRef<NodeJS.Timeout | null>(null);

  const loadPermissionsForOrganization = useCallback(async (organizationId: string | undefined) => {
    if (!organizationId || !user) return;
    
    try {
      const token = AuthService.getToken();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/permissions?organizationId=${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const permissionData = await response.json();
        setPermissions(permissionData.permissions || []);
        setRole(permissionData.role?.name || null);
      } else {
        console.error('Failed to load permissions:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading permissions for organization:', error);
    }
  }, [user]);

  const loadUserAndPermissions = useCallback(async () => {
    try {
      console.log('[PermissionContext] loadUserAndPermissions called');
      setLoading(true);
      const token = AuthService.getToken();
      
      if (!token) {
        console.log('[PermissionContext] No token found, clearing user state');
        setUser(null);
        setPermissions([]);
        setRole(null);
        setOrganizations([]);
        setCurrentOrganization(null);
        setLoading(false);
        return;
      }

      // Verify authentication
      const authResponse = await AuthService.verifyAuth(token);
      
      if (!authResponse.success || !authResponse.data?.user) {
        setLoading(false);
        return;
      }

      const userData = authResponse.data.user;
      setUser(userData);
      
      // Set organizations and current organization
      if (userData.organizations) {
        setOrganizations(userData.organizations);
        if (userData.primaryOrganization) {
          const primaryOrg = userData.organizations.find((org: {_id: string; name: string; type: string}) => org._id === userData.primaryOrganization);
          setCurrentOrganization(primaryOrg || userData.organizations[0] || null);
        } else if (userData.organizations.length > 0) {
          setCurrentOrganization(userData.organizations[0]);
        }
      }
      
      // Set teams and current team
      if (userData.teamAssignments) {
        setTeams(userData.teamAssignments);
        if (userData.primaryTeam) {
          const primaryTeamAssignment = userData.teamAssignments.find((ta: TeamAssignment) => ta.teamId === userData.primaryTeam);
          if (primaryTeamAssignment?.team) {
            setCurrentTeam(primaryTeamAssignment.team);
            setTeamRole(primaryTeamAssignment.role);
          }
        } else if (userData.teamAssignments.length > 0) {
          const firstTeam = userData.teamAssignments[0];
          if (firstTeam.team) {
            setCurrentTeam(firstTeam.team);
            setTeamRole(firstTeam.role);
          }
        }
      }
      
      // Extract actual permissions and role from auth response
      const userRole = authResponse.data.role;
      const userPermissions = authResponse.data.permissions || [];
      
      setRole(userRole?.name || null);
      setPermissions(userPermissions);
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user data and permissions on mount
  useEffect(() => {
    loadUserAndPermissions();
  }, [loadUserAndPermissions]);

  // Listen for storage changes and custom logout events
  useEffect(() => {
    
    const handleLogout = () => {
      console.log('[PermissionContext] Logout event received, clearing state');
      
      // Clear any pending logout timeout
      if (logoutTimeout.current) {
        clearTimeout(logoutTimeout.current);
        logoutTimeout.current = null;
      }
      
      // Clear state immediately
      setUser(null);
      setPermissions([]);
      setRole(null);
      setOrganizations([]);
      setCurrentOrganization(null);
      setTeams([]);
      setCurrentTeam(null);
      setTeamRole(null);
      
      // Navigate to login page
      if (window.location.pathname !== '/') {
        console.log('[PermissionContext] Redirecting to login page');
        window.location.href = '/';
      } else {
        console.log('[PermissionContext] Already on login page, skipping redirect');
      }
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      console.log('[PermissionContext] Storage event:', e.key, 'newValue:', e.newValue);
      
      // Check if the token was removed (logout in another tab)
      if (e.key === 'token' && !e.newValue) {
        handleLogout();
      }
      // Check if token was added or changed (login in another tab)
      else if (e.key === 'token' && e.newValue) {
        console.log('[PermissionContext] Token added/changed, reloading permissions');
        loadUserAndPermissions();
      }
    };

    // Listen for custom logout event (same tab logout)
    window.addEventListener('logout', handleLogout);
    // Listen for storage changes (cross-tab logout)
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


  const switchOrganization = async (organizationId: string) => {
    const org = organizations.find((o: {_id: string; name: string; type: string}) => o._id === organizationId);
    if (org) {
      setCurrentOrganization(org);
      await loadPermissionsForOrganization(organizationId);
    }
  };

  const switchTeam = (teamId: string) => {
    const teamAssignment = teams.find((ta: TeamAssignment) => ta.teamId === teamId);
    if (teamAssignment?.team) {
      setCurrentTeam(teamAssignment.team);
      setTeamRole(teamAssignment.role);
      // Team switch might affect permissions, so reload them
      if (teamAssignment.team.organizationId) {
        switchOrganization(teamAssignment.team.organizationId);
      }
    }
  };

  const hasTeamPermission = (permission: string, teamId?: string): boolean => {
    // If no team context, fall back to organization permission
    if (!teamId && !currentTeam) {
      return hasPermission(permission);
    }
    
    // Check if user is member of the specified team
    const targetTeamId = teamId || currentTeam?._id;
    const teamAssignment = teams.find((ta: TeamAssignment) => ta.teamId === targetTeamId);
    
    if (!teamAssignment) {
      return false;
    }

    // Team leaders have more permissions
    if (teamAssignment.role === 'leader') {
      const teamLeaderPermissions = [
        'teams.read', 'teams.update', 'teams.manage_members',
        'services.*', 'stories.*', 'users.read'
      ];
      
      if (teamLeaderPermissions.some(p => hasPermission(p))) {
        return true;
      }
    }
    
    // Check regular permissions with team scope
    return hasPermission(permission);
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

  const contextValue: PermissionContextType = {
    user,
    permissions,
    loading,
    hasPermission,
    currentOrganization,
    organizations,
    role,
    switchOrganization,
    reloadPermissions: loadUserAndPermissions,
    // Team context
    currentTeam,
    teams,
    teamRole,
    switchTeam,
    hasTeamPermission,
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

// Custom hooks for common permission checks
export const useHasPermission = (permission: string): boolean => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
};

// Custom hook for team permission checks
export const useHasTeamPermission = (permission: string, teamId?: string): boolean => {
  const { hasTeamPermission } = usePermissions();
  return hasTeamPermission(permission, teamId);
};

// Custom hook to get current team
export const useCurrentTeam = () => {
  const { currentTeam, teamRole } = usePermissions();
  return { currentTeam, teamRole };
};

// Custom hook to get user's teams
export const useUserTeams = () => {
  const { teams } = usePermissions();
  return teams;
};

