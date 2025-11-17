'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/lib/auth';

interface User {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  avatar?: string;
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
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

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

  // Load user data and permissions on mount
  useEffect(() => {
    loadUserAndPermissions();
  }, []);

  const loadUserAndPermissions = async () => {
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
      
      // Set role - this could be based on current organization
      setRole('admin'); // Default role
      
      // Set basic permissions (everyone can read, create, etc.)
      setPermissions(['users.read', 'users.create', 'users.update', 'users.delete', 'users.assign_role']);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };


  const switchOrganization = (organizationId: string) => {
    const org = organizations.find((o: {_id: string; name: string; type: string}) => o._id === organizationId);
    if (org) {
      setCurrentOrganization(org);
      // Optionally update user preferences here
    }
  };

  const hasPermission = (permission: string): boolean => {
    // Simple check - everyone has basic permissions
    return permissions.includes(permission);
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

