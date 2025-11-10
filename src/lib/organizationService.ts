import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:2222';

interface Organization {
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

interface OrganizationCreateData {
  name: string;
  type: 'union' | 'conference' | 'church';
  parentOrganization?: string;
  metadata: {
    address?: string;
    phone?: string;
    territory?: string[];
    email?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  count?: number;
}

export class OrganizationService {
  private static getAuthHeaders() {
    const token = AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  static async getOrganizations(params?: {
    type?: string;
    parentOrganization?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Organization[]>> {
    try {
      const url = new URL(`${API_BASE_URL}/api/organizations`);
      
      if (params) {
        if (params.type) url.searchParams.append('type', params.type);
        if (params.parentOrganization) url.searchParams.append('parentOrganization', params.parentOrganization);
        if (params.isActive !== undefined) url.searchParams.append('isActive', params.isActive.toString());
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch organizations',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getOrganizationById(id: string): Promise<ApiResponse<Organization>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/organizations/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching organization:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch organization',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createOrganization(organizationData: OrganizationCreateData): Promise<ApiResponse<Organization>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/organizations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(organizationData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating organization:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create organization',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateOrganization(id: string, organizationData: Partial<OrganizationCreateData>): Promise<ApiResponse<Organization>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/organizations/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(organizationData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating organization:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update organization',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteOrganization(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/organizations/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error deleting organization:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete organization',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}