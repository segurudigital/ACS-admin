
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthService } from '@/lib/auth';

interface User {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  avatar?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  organizations?: Array<{_id: string; name: string; type: string}>;
  primaryOrganization?: string;
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
      setLoading(true);
      const token = AuthService.getToken();
      
      if (!token) {
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

  // Listen for storage changes to handle cross-tab authentication
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Check if the token was removed (logout in another tab)
      if (e.key === 'token' && !e.newValue) {
        setUser(null);
        setPermissions([]);
        setRole(null);
        setOrganizations([]);
        setCurrentOrganization(null);
        window.location.href = '/';
      }
      // Check if token was added or changed (login in another tab)
      else if (e.key === 'token' && e.newValue) {
        loadUserAndPermissions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadUserAndPermissions]);


  const switchOrganization = async (organizationId: string) => {
    const org = organizations.find((o: {_id: string; name: string; type: string}) => o._id === organizationId);
    if (org) {
      setCurrentOrganization(org);
      await loadPermissionsForOrganization(organizationId);
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

