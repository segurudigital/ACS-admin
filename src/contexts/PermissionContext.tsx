'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/lib/auth';

interface User {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  avatar?: string;
  organizations?: any[];
  primaryOrganization?: string;
}

interface PermissionContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
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
      
      // Set basic permissions (everyone can read, create, etc.)
      setPermissions(['users.read', 'users.create', 'users.update', 'users.delete', 'users.assign_role']);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
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

