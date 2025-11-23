// Union Service - Handles API calls for union management

import { AuthService } from './auth';
import { 
  Union,
  UnionListResponse, 
  UnionResponse,
  CreateUnionData, 
  UpdateUnionData,
  UnionListParams
} from '../types/hierarchy';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class UnionService {
  private static getAuthHeaders() {
    const token = AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  /**
   * Get all unions
   */
  static async getAllUnions(params?: UnionListParams): Promise<UnionListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Convert isActive to includeInactive for backend compatibility
      if (params?.isActive !== undefined && params.isActive === false) {
        // Only add includeInactive=true when we want to show inactive unions
        queryParams.append('includeInactive', 'true');
      }
      // Default behavior (no param) shows only active unions
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.offset) {
        queryParams.append('offset', params.offset.toString());
      }

      const url = `${API_BASE_URL}/api/unions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Union API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching unions:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch unions'
      );
    }
  }

  /**
   * Get union by ID
   */
  static async getUnionById(id: string): Promise<UnionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/unions/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching union:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch union'
      );
    }
  }

  /**
   * Create new union
   */
  static async createUnion(data: CreateUnionData): Promise<UnionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/unions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating union:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create union'
      );
    }
  }

  /**
   * Update union
   */
  static async updateUnion(id: string, data: UpdateUnionData): Promise<UnionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/unions/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating union:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update union'
      );
    }
  }

  /**
   * Delete union
   */
  static async deleteUnion(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/unions/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting union:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete union'
      );
    }
  }


  /**
   * Get union hierarchy (with conferences and churches)
   */
  static async getUnionHierarchy(id: string): Promise<{
    success: boolean;
    data: {
      union: Union;
      conferences: any[];
      churches: any[];
    };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/unions/${id}/hierarchy`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching union hierarchy:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch union hierarchy'
      );
    }
  }

  /**
   * Get conferences in union
   */
  static async getUnionConferences(id: string): Promise<{
    success: boolean;
    data: any[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/unions/${id}/conferences`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching union conferences:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch union conferences'
      );
    }
  }
}