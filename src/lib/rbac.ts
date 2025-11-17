// RBAC API Service for managing roles, permissions, and organizations

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
}

export interface Role {
  _id: string;
  name: string;
  displayName: string;
  level: 'union' | 'conference' | 'church';
  permissions: string[];
  description: string;
  isSystem: boolean;
  isActive: boolean;
}

export interface OrganizationAssignment {
  organization: Organization | string;
  role: Role | string;
  assignedAt: string;
  assignedBy?: string;
  expiresAt?: string;
}

export interface UserWithRoles {
  _id: string;
  name: string;
  email: string;
  organizations: OrganizationAssignment[];
  primaryOrganization?: string;
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

class RBACService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const organizationId = localStorage.getItem('currentOrganizationId');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
    
    if (organizationId) {
      headers['X-Organization-Id'] = organizationId;
    }
    
    return headers;
  }

  // Organization Management
  async getOrganizations(): Promise<Organization[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/organizations`, {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }

  async createOrganization(data: Partial<Organization>): Promise<Organization> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/organizations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create organization');
      }

      return response.json();
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/organizations/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update organization');
      }

      return response.json();
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/organizations/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete organization');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      throw error;
    }
  }

  // Role Management
  async getRoles(includeSystem = false): Promise<Role[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/roles?includeSystem=${includeSystem}`,
        {
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return []; // Return empty array if no roles found
        }
        throw new Error('Failed to fetch roles');
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  async getSystemRoles(): Promise<Role[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/roles?isSystemRole=true`, {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // Return empty array if no system roles found
        }
        throw new Error('Failed to fetch system roles');
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching system roles:', error);
      throw error;
    }
  }

  async createRole(data: Partial<Role>): Promise<Role> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/roles`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create role');
      }

      return response.json();
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/roles/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      return response.json();
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  async deleteRole(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/roles/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  // User Role Management
  async getUserRoles(userId: string): Promise<OrganizationAssignment[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/users/${userId}/roles`, {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user roles');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching user roles:', error);
      throw error;
    }
  }

  async assignUserRole(userId: string, organizationId: string, roleName: string): Promise<{success: boolean; data?: {organizations: Array<{organization: string; role: string}>}; error?: string}> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/users/${userId}/roles`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ organizationId, roleName }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign role');
      }

      return response.json();
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  async revokeUserRole(userId: string, organizationId: string): Promise<{success: boolean; data?: {organizations: Array<{organization: string; role: string}>}; error?: string}> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/users/${userId}/roles/${organizationId}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to revoke role');
      }

      return response.json();
    } catch (error) {
      console.error('Error revoking role:', error);
      throw error;
    }
  }

  async getUserPermissions(userId: string, organizationId?: string): Promise<UserPermissions> {
    try {
      const params = organizationId ? `?organizationId=${organizationId}` : '';
      const response = await fetch(
        `${this.apiBaseUrl}/api/users/${userId}/permissions${params}`,
        {
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user permissions');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  }

  // User Management
  async getUsers(): Promise<Array<{_id: string; name: string; email: string; organizations: Array<{organization: string; role: string}>}>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/users?limit=100`, {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      console.log('Raw API response:', data);
      
      // API returns { users: [...], pagination: {...} }, we need just the users array
      return data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Organization Context
  setCurrentOrganization(organizationId: string) {
    localStorage.setItem('currentOrganizationId', organizationId);
  }

  getCurrentOrganization(): string | null {
    return localStorage.getItem('currentOrganizationId');
  }

  clearOrganizationContext() {
    localStorage.removeItem('currentOrganizationId');
  }
}

export const rbacService = new RBACService();