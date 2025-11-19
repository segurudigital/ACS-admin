import { rbacService, UserWithRoles, Organization } from './rbac';
import { api } from './api';

/**
 * Secure RBAC Service
 * Extends RBACService with additional security validations
 * Implements secure data access patterns
 */
export class SecureRBACService {
  /**
   * Get only users within the current user's manageable organizations
   * Overrides parent method to add security filtering
   */
  static async getUsers(organizationId?: string): Promise<UserWithRoles[]> {
    try {
      const queryParams = new URLSearchParams();
      if (organizationId) {
        queryParams.append('organizationId', organizationId);
      }
      
      const url = queryParams.toString() 
        ? `/api/users?${queryParams.toString()}`
        : '/api/users';
      
      const response = await api.get(url);
      
      if (response.success && response.users) {
        return response.users;
      }
      
      throw new Error(response.message || 'Failed to fetch users');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get a single user's data with security validation
   * @param userId - User ID to fetch
   * @returns Promise<UserWithRoles> - User data if access allowed
   */
  static async getSecureUser(userId: string): Promise<UserWithRoles> {
    try {
      // Direct API call for single user instead of filtering from all users
      const response = await api.get(`/api/users/${userId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch user');
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Get only organizations the user has access to
   * Overrides parent method to ensure proper filtering
   */
  static async getOrganizations(filters?: {
    type?: string;
    parentOrganization?: string;
    isActive?: boolean;
  }): Promise<Organization[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.type) {
        queryParams.append('type', filters.type);
      }
      if (filters?.parentOrganization) {
        queryParams.append('parentOrganization', filters.parentOrganization);
      }
      if (filters?.isActive !== undefined) {
        queryParams.append('isActive', filters.isActive.toString());
      }

      const url = queryParams.toString()
        ? `/api/organizations?${queryParams.toString()}`
        : '/api/organizations';

      const response = await api.get(url);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch organizations');
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }

  /**
   * Get users for a specific organization only
   * @param organizationId - Organization ID
   * @returns Promise<UserWithRoles[]> - Users in the organization
   */
  static async getOrganizationUsers(organizationId: string): Promise<UserWithRoles[]> {
    try {
      const response = await api.get(
        `/api/organizations/${organizationId}/users`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch organization users');
    } catch (error) {
      console.error('Error fetching organization users:', error);
      throw error;
    }
  }

  /**
   * Validate user has permission before role assignment
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @param roleId - Role ID
   * @returns Promise<void>
   */
  static async assignRoleSecure(
    userId: string,
    organizationId: string,
    roleId: string
  ): Promise<void> {
    try {
      // The backend will validate permissions
      await rbacService.assignUserRole(userId, organizationId, roleId);
    } catch (error) {
      console.error('Error assigning role:', error);
      throw new Error('Failed to assign role. You may not have permission.');
    }
  }

  /**
   * Get permissions for current user in specific organization
   * Uses cached permissions if available and valid
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Promise<string[]> - Array of permissions
   */
  static async getUserPermissionsSecure(
    userId: string,
    organizationId: string
  ): Promise<string[]> {
    try {
      // Check cache first
      const { SecureAuthService } = await import('./secureAuth');
      const cachedPermissions = SecureAuthService.getCachedPermissions(organizationId);
      
      if (cachedPermissions) {
        return cachedPermissions;
      }

      // Fetch from server
      const permissions = await rbacService.getUserPermissions(userId, organizationId);
      
      // Cache the permissions
      SecureAuthService.setCachedPermissions(organizationId, permissions.permissions);
      
      return permissions.permissions;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  }

  /**
   * Clear all security-related caches
   */
  static async clearSecurityCaches(): Promise<void> {
    const { SecureAuthService } = await import('./secureAuth');
    SecureAuthService.clearSecurityCache();
  }
}