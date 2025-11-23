// Church Service - Handles API calls for church management

import { AuthService } from './auth';
import { Conference, User } from '../types/rbac';
import { 
  ChurchListResponse, 
  ChurchResponse,
  CreateChurchData, 
  UpdateChurchData,
  ChurchListParams,
  ChurchQuickSetupData
} from '../types/hierarchy';
import { Team } from '../lib/teams';
import { Service } from '../lib/serviceManagement';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ChurchService {
  private static getAuthHeaders() {
    const token = AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  /**
   * Get all churches
   */
  static async getAllChurches(params?: ChurchListParams): Promise<ChurchListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.conferenceId) {
        queryParams.append('conferenceId', params.conferenceId);
      }
      if (params?.unionId) {
        queryParams.append('unionId', params.unionId);
      }
      if (params?.isActive !== undefined) {
        queryParams.append('isActive', params.isActive.toString());
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.offset) {
        queryParams.append('offset', params.offset.toString());
      }

      const url = `${API_BASE_URL}/api/churches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching churches:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch churches'
      );
    }
  }

  /**
   * Get church by ID
   */
  static async getChurchById(id: string): Promise<ChurchResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/churches/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching church:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch church'
      );
    }
  }

  /**
   * Create new church
   */
  static async createChurch(data: CreateChurchData): Promise<ChurchResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/churches`, {
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
      console.error('Error creating church:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create church'
      );
    }
  }

  /**
   * Update church
   */
  static async updateChurch(id: string, data: UpdateChurchData): Promise<ChurchResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/churches/${id}`, {
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
      console.error('Error updating church:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update church'
      );
    }
  }

  /**
   * Delete church
   */
  static async deleteChurch(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/churches/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting church:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete church'
      );
    }
  }

  /**
   * Quick setup church with admin user
   */
  static async quickSetupChurch(data: ChurchQuickSetupData): Promise<ChurchResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/churches/quick-setup`, {
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
      console.error('Error in church quick setup:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to setup church'
      );
    }
  }

  /**
   * Get church teams
   */
  static async getChurchTeams(id: string): Promise<{
    success: boolean;
    data: Team[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/churches/${id}/teams`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching church teams:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch church teams'
      );
    }
  }

  /**
   * Get church services
   */
  static async getChurchServices(id: string): Promise<{
    success: boolean;
    data: Service[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/churches/${id}/services`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching church services:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch church services'
      );
    }
  }

  /**
   * Get suggested parent conferences for new churches
   */
  static async getSuggestedParentConferences(): Promise<{
    success: boolean;
    data: Conference[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/churches/suggested-parents`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching suggested parent conferences:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch suggested parent conferences'
      );
    }
  }

  /**
   * Get church users/members
   */
  static async getChurchUsers(id: string): Promise<{
    success: boolean;
    data: User[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/churches/${id}/users`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching church users:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch church users'
      );
    }
  }
}