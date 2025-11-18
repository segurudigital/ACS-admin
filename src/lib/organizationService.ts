import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
  private static getAuthHeaders(organizationId?: string) {
    const token = AuthService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
    
    if (organizationId) {
      headers['X-Organization-Id'] = organizationId;
    }
    
    return headers;
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
        // Debug: Log the full response for troubleshooting
        console.log('Create Organization API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        // Try to extract error message from various possible locations
        let errorMessage = 'Unknown error occurred';
        
        // Check common error message locations in API responses
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          // Handle validation errors array
          errorMessage = data.errors.map((err: string | {message?: string; msg?: string}) => {
            if (typeof err === 'string') return err;
            if (err.message) return err.message;
            if (err.msg) return err.msg;
            return JSON.stringify(err);
          }).join(', ');
        } else if (data.details) {
          errorMessage = data.details;
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        return {
          success: false,
          message: errorMessage,
          error: errorMessage,
          data: data.data || undefined
        };
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
        // Debug: Log the full response for troubleshooting
        console.log('Update Organization API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        // Try to extract error message from various possible locations
        let errorMessage = 'Unknown error occurred';
        
        // Check common error message locations in API responses
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          // Handle validation errors array
          errorMessage = data.errors.map((err: string | {message?: string; msg?: string}) => {
            if (typeof err === 'string') return err;
            if (err.message) return err.message;
            if (err.msg) return err.msg;
            return JSON.stringify(err);
          }).join(', ');
        } else if (data.details) {
          errorMessage = data.details;
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        return {
          success: false,
          message: errorMessage,
          error: errorMessage,
          data: data.data || undefined
        };
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